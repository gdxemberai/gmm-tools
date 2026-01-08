"""
Analysis endpoint for Sports Card Arbitrage Tool.
Orchestrates the complete pipeline: caching, parsing, pricing, and verdict generation.
"""

import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field, validator
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..redis_client import (
    generate_cache_key,
    get_cached_value,
    set_cached_value,
    REDIS_DEFAULT_TTL
)
from ..services.openai_service import (
    parse_listing_title_with_retry,
    ParsedCardData
)
from ..services.pricing_service import (
    get_estimated_value,
    calculate_profit_loss
)
from ..utils.slugify import slugify

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/analyze", tags=["Analysis"])


class AnalyzeRequest(BaseModel):
    """Request model for analyze endpoint."""
    title: str = Field(..., min_length=1, max_length=500, description="eBay listing title")
    listing_price: float = Field(..., gt=0, description="Current listing price in USD")
    
    @validator('title')
    def validate_title(cls, v):
        """Validate title is not empty after stripping."""
        if not v.strip():
            raise ValueError("Title cannot be empty")
        return v.strip()


class AnalyzeResponse(BaseModel):
    """Response model for analyze endpoint."""
    # Parsed data from OpenAI
    parsed_data: dict = Field(..., description="Structured card data extracted from title")
    
    # Pricing information
    estimated_value: Optional[float] = Field(None, description="Estimated market value in USD")
    profit_loss: Optional[float] = Field(None, description="Potential profit (positive) or loss (negative)")
    verdict: str = Field(..., description="Analysis verdict (GOOD DEAL, OVERPRICED, etc.)")
    
    # Match details
    match_tier: str = Field(..., description="Match tier used (exact, fuzzy, none)")
    sales_count: int = Field(..., description="Number of comparable sales found")
    
    # Metadata
    cached: bool = Field(False, description="Whether result was retrieved from cache")


@router.post("", response_model=AnalyzeResponse, status_code=status.HTTP_200_OK)
async def analyze_listing(
    request: AnalyzeRequest,
    db: AsyncSession = Depends(get_db)
) -> AnalyzeResponse:
    """
    Analyze an eBay listing to determine if it's a good deal.
    
    Pipeline:
    1. Check Redis cache for exact title
    2. If cache miss, parse title with OpenAI
    3. Slugify parsed fields for database queries
    4. Query database (Tier 1 exact, fallback to Tier 2 fuzzy)
    5. Calculate pricing using sanity average algorithm
    6. Cache result in Redis
    7. Calculate profit/loss and return verdict
    
    Args:
        request: Analysis request with title and listing price
        db: Database session (injected)
        
    Returns:
        AnalyzeResponse: Complete analysis with verdict
        
    Raises:
        HTTPException: If parsing or analysis fails
    """
    logger.info("=" * 60)
    logger.info("=== ANALYZE LISTING REQUEST RECEIVED ===")
    logger.info(f"Title: {request.title}")
    logger.info(f"Listing Price: ${request.listing_price}")
    logger.info("=" * 60)
    
    try:
        # Step A: Check Redis cache
        cache_key = generate_cache_key("analysis", request.title)
        cached_result = await get_cached_value(cache_key)
        
        if cached_result:
            logger.info(f"✓ Cache HIT for title: {request.title}")
            logger.info(f"Cached data: {cached_result}")
            
            # Recalculate profit/loss with current listing price
            profit_loss, verdict = await calculate_profit_loss(
                listing_price=request.listing_price,
                estimated_value=cached_result.get("estimated_value")
            )
            
            logger.info(f"✓ Returning cached result - Verdict: {verdict}, Profit/Loss: ${profit_loss}")
            
            return AnalyzeResponse(
                parsed_data=cached_result["parsed_data"],
                estimated_value=cached_result["estimated_value"],
                profit_loss=profit_loss,
                verdict=verdict,
                match_tier=cached_result["match_tier"],
                sales_count=cached_result["sales_count"],
                cached=True
            )
        
        logger.info(f"✗ Cache MISS for title: {request.title}")
        
        # Step B: Parse title with OpenAI
        logger.info(f"Parsing listing: {request.title}")
        parsed_data: ParsedCardData = await parse_listing_title_with_retry(request.title)
        
        # Step C: Slugify parsed fields
        player_id = slugify(parsed_data.player_name)
        brand_id = slugify(parsed_data.brand)
        variation_id = slugify(parsed_data.variation or "Base")
        
        logger.info(f"Slugified: player={player_id}, brand={brand_id}, variation={variation_id}")
        
        # Step D & E: Query database and calculate pricing
        pricing_result = await get_estimated_value(
            db=db,
            player_id=player_id,
            brand_id=brand_id,
            variation_id=variation_id,
            year=parsed_data.year,
            grade=parsed_data.grade,
            grader=parsed_data.grading_company
        )
        
        # Step F: Cache result (without profit/loss as it depends on listing price)
        cache_data = {
            "parsed_data": parsed_data.model_dump(),
            "estimated_value": pricing_result.estimated_value,
            "match_tier": pricing_result.match_tier,
            "sales_count": pricing_result.sales_count
        }
        await set_cached_value(cache_key, cache_data, ttl=REDIS_DEFAULT_TTL)
        
        # Step G: Calculate profit/loss and verdict
        profit_loss, verdict = await calculate_profit_loss(
            listing_price=request.listing_price,
            estimated_value=pricing_result.estimated_value
        )
        
        logger.info("=" * 60)
        logger.info(f"✓ ANALYSIS COMPLETE - Verdict: {verdict}")
        logger.info(f"Estimated Value: ${pricing_result.estimated_value}")
        logger.info(f"Profit/Loss: ${profit_loss}")
        logger.info(f"Match Tier: {pricing_result.match_tier}")
        logger.info(f"Sales Count: {pricing_result.sales_count}")
        logger.info("=" * 60)
        
        response = AnalyzeResponse(
            parsed_data=parsed_data.model_dump(),
            estimated_value=pricing_result.estimated_value,
            profit_loss=profit_loss,
            verdict=verdict,
            match_tier=pricing_result.match_tier,
            sales_count=pricing_result.sales_count,
            cached=False
        )
        
        logger.info(f"Response being sent: {response.model_dump()}")
        return response
        
    except ValueError as e:
        logger.error("=" * 60)
        logger.error(f"✗ VALIDATION ERROR: {e}")
        logger.error("=" * 60)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid request: {str(e)}"
        )
    
    except Exception as e:
        logger.error("=" * 60)
        logger.error(f"✗ ANALYSIS FAILED: {e}")
        logger.error("Exception type:", exc_info=True)
        logger.error("=" * 60)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Analysis failed: {str(e)}"
        )


@router.get("/health", status_code=status.HTTP_200_OK)
async def analyze_health():
    """Health check endpoint for analysis service."""
    return {
        "status": "healthy",
        "service": "analysis",
        "message": "Analysis service is operational"
    }
