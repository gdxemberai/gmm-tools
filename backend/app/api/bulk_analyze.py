"""
Bulk analysis endpoint for Sports Card Arbitrage Tool.
Processes multiple listings in a single request.
"""

import logging
import asyncio
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, status
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

router = APIRouter(prefix="/analyze", tags=["Bulk Analysis"])


class AnalysisStep(BaseModel):
    """Single step in the analysis pipeline."""
    step: int = Field(..., description="Step number")
    name: str = Field(..., description="Step name")
    status: str = Field(..., description="Step status (success, warning, error)")
    details: str = Field(..., description="Human-readable details")
    data: Optional[dict] = Field(None, description="Additional structured data")
    timestamp: str = Field(..., description="ISO 8601 timestamp")


class BulkListingItem(BaseModel):
    """Single listing item for bulk analysis."""
    title: str = Field(..., min_length=1, max_length=500, description="eBay listing title")
    listing_price: float = Field(..., gt=0, description="Current listing price in USD")
    
    @validator('title')
    def validate_title(cls, v):
        """Validate title is not empty after stripping."""
        if not v.strip():
            raise ValueError("Title cannot be empty")
        return v.strip()


class BulkAnalyzeRequest(BaseModel):
    """Request model for bulk analyze endpoint."""
    listings: List[BulkListingItem] = Field(..., min_items=1, max_items=50, description="List of listings to analyze")


class BulkAnalyzeResultItem(BaseModel):
    """Single result item in bulk analysis response."""
    index: int = Field(..., description="Index of the listing in the request")
    title: str = Field(..., description="Original listing title")
    listing_price: float = Field(..., description="Listing price")
    success: bool = Field(..., description="Whether analysis succeeded")
    data: Optional[dict] = Field(None, description="Analysis data if successful")
    error: Optional[str] = Field(None, description="Error message if failed")
    analysis_steps: List[AnalysisStep] = Field(default_factory=list, description="Detailed analysis pipeline steps")


class BulkAnalyzeResponse(BaseModel):
    """Response model for bulk analyze endpoint."""
    results: List[BulkAnalyzeResultItem] = Field(..., description="Results for each listing")
    total: int = Field(..., description="Total number of listings processed")
    successful: int = Field(..., description="Number of successful analyses")
    failed: int = Field(..., description="Number of failed analyses")


async def analyze_single_listing(
    index: int,
    title: str,
    listing_price: float,
    db: AsyncSession
) -> BulkAnalyzeResultItem:
    """
    Analyze a single listing for bulk processing.
    
    Args:
        index: Index of the listing in the batch
        title: Listing title
        listing_price: Listing price
        db: Database session
        
    Returns:
        BulkAnalyzeResultItem: Result for this listing
    """
    logger.info(f"[Bulk {index}] Processing: {title}")
    
    analysis_steps: List[AnalysisStep] = []
    step_counter = 1
    
    try:
        # Step A: Check Redis cache
        cache_key = generate_cache_key("analysis", title)
        cached_result = await get_cached_value(cache_key)
        
        if cached_result:
            logger.info(f"[Bulk {index}] Cache HIT for: {title}")
            
            analysis_steps.append(AnalysisStep(
                step=step_counter,
                name="Cache Check",
                status="success",
                details=f"Cache hit - Retrieved cached result for this title",
                timestamp=datetime.now(timezone.utc).isoformat()
            ))
            step_counter += 1
            
            # Recalculate profit/loss with current listing price
            profit_loss, verdict = await calculate_profit_loss(
                listing_price=listing_price,
                estimated_value=cached_result.get("estimated_value")
            )
            
            profit_value = profit_loss if profit_loss is not None else 0
            analysis_steps.append(AnalysisStep(
                step=step_counter,
                name="Pricing Calculation",
                status="success",
                details=f"Calculated profit/loss: ${profit_value:.2f}",
                data={
                    "listing_price": listing_price,
                    "estimated_value": cached_result.get("estimated_value"),
                    "profit_loss": profit_loss
                },
                timestamp=datetime.now(timezone.utc).isoformat()
            ))
            
            return BulkAnalyzeResultItem(
                index=index,
                title=title,
                listing_price=listing_price,
                success=True,
                data={
                    "parsed_data": cached_result["parsed_data"],
                    "estimated_value": cached_result["estimated_value"],
                    "profit_loss": profit_loss,
                    "verdict": verdict,
                    "match_tier": cached_result["match_tier"],
                    "sales_count": cached_result["sales_count"],
                    "cached": True
                },
                error=None,
                analysis_steps=analysis_steps
            )
        
        logger.info(f"[Bulk {index}] Cache MISS for: {title}")
        
        analysis_steps.append(AnalysisStep(
            step=step_counter,
            name="Cache Check",
            status="success",
            details="Cache miss - No cached result found, proceeding with fresh analysis",
            timestamp=datetime.now(timezone.utc).isoformat()
        ))
        step_counter += 1
        
        # Step B: Parse title with OpenAI
        parsed_data: ParsedCardData = await parse_listing_title_with_retry(title)
        
        analysis_steps.append(AnalysisStep(
            step=step_counter,
            name="LLM Parsing",
            status="success",
            details=f"Extracted: {parsed_data.player_name}, {parsed_data.year or 'N/A'}, {parsed_data.brand}, {parsed_data.variation or 'Base'}, {parsed_data.grading_company or 'Ungraded'} {parsed_data.grade or ''}",
            data=parsed_data.model_dump(),
            timestamp=datetime.now(timezone.utc).isoformat()
        ))
        step_counter += 1
        
        # Step C: Slugify parsed fields
        player_id = slugify(parsed_data.player_name)
        brand_id = slugify(parsed_data.brand)
        variation_id = slugify(parsed_data.variation or "Base")
        
        analysis_steps.append(AnalysisStep(
            step=step_counter,
            name="ID Normalization",
            status="success",
            details=f"Normalized IDs - player: {player_id}, brand: {brand_id}, variation: {variation_id}",
            data={
                "player_id": player_id,
                "brand_id": brand_id,
                "variation_id": variation_id
            },
            timestamp=datetime.now(timezone.utc).isoformat()
        ))
        step_counter += 1
        
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
        
        # Add database matching step
        match_tier_display = pricing_result.match_tier.replace("_", " ").title()
        if pricing_result.sales_count > 0:
            analysis_steps.append(AnalysisStep(
                step=step_counter,
                name="Database Matching",
                status="success",
                details=f"{match_tier_display} Match - Found {pricing_result.sales_count} comparable sales",
                data={
                    "match_tier": pricing_result.match_tier,
                    "sales_count": pricing_result.sales_count
                },
                timestamp=datetime.now(timezone.utc).isoformat()
            ))
        else:
            analysis_steps.append(AnalysisStep(
                step=step_counter,
                name="Database Matching",
                status="warning",
                details="No comparable sales found in database",
                data={
                    "match_tier": pricing_result.match_tier,
                    "sales_count": 0
                },
                timestamp=datetime.now(timezone.utc).isoformat()
            ))
        step_counter += 1
        
        # Step F: Cache result
        cache_data = {
            "parsed_data": parsed_data.model_dump(),
            "estimated_value": pricing_result.estimated_value,
            "match_tier": pricing_result.match_tier,
            "sales_count": pricing_result.sales_count
        }
        await set_cached_value(cache_key, cache_data, ttl=REDIS_DEFAULT_TTL)
        
        # Step G: Calculate profit/loss and verdict
        profit_loss, verdict = await calculate_profit_loss(
            listing_price=listing_price,
            estimated_value=pricing_result.estimated_value
        )
        
        # Add pricing calculation step with outlier details
        if pricing_result.sales_count >= 3:
            outliers_removed = 2  # Highest and lowest
            sales_used = pricing_result.sales_count - outliers_removed
            estimated_value_display = pricing_result.estimated_value if pricing_result.estimated_value is not None else 0
            analysis_steps.append(AnalysisStep(
                step=step_counter,
                name="Pricing Calculation",
                status="success",
                details=f"Used {pricing_result.sales_count} sales, removed {outliers_removed} outliers (highest & lowest), averaged remaining {sales_used} sales: ${estimated_value_display:.2f}",
                data={
                    "total_sales": pricing_result.sales_count,
                    "outliers_removed": outliers_removed,
                    "sales_used": sales_used,
                    "estimated_value": pricing_result.estimated_value
                },
                timestamp=datetime.now(timezone.utc).isoformat()
            ))
        elif pricing_result.sales_count > 0:
            estimated_value_display = pricing_result.estimated_value if pricing_result.estimated_value is not None else 0
            analysis_steps.append(AnalysisStep(
                step=step_counter,
                name="Pricing Calculation",
                status="success",
                details=f"Used all {pricing_result.sales_count} sales (no outlier removal for <3 sales), average: ${estimated_value_display:.2f}",
                data={
                    "total_sales": pricing_result.sales_count,
                    "outliers_removed": 0,
                    "sales_used": pricing_result.sales_count,
                    "estimated_value": pricing_result.estimated_value
                },
                timestamp=datetime.now(timezone.utc).isoformat()
            ))
        else:
            analysis_steps.append(AnalysisStep(
                step=step_counter,
                name="Pricing Calculation",
                status="warning",
                details="Could not calculate estimated value - no sales data available",
                data={
                    "total_sales": 0,
                    "outliers_removed": 0,
                    "sales_used": 0,
                    "estimated_value": None
                },
                timestamp=datetime.now(timezone.utc).isoformat()
            ))
        
        logger.info(f"[Bulk {index}] SUCCESS - Verdict: {verdict}")
        
        return BulkAnalyzeResultItem(
            index=index,
            title=title,
            listing_price=listing_price,
            success=True,
            data={
                "parsed_data": parsed_data.model_dump(),
                "estimated_value": pricing_result.estimated_value,
                "profit_loss": profit_loss,
                "verdict": verdict,
                "match_tier": pricing_result.match_tier,
                "sales_count": pricing_result.sales_count,
                "cached": False
            },
            error=None,
            analysis_steps=analysis_steps
        )
        
    except Exception as e:
        logger.error(f"[Bulk {index}] FAILED: {str(e)}")
        
        # Add error step
        analysis_steps.append(AnalysisStep(
            step=step_counter,
            name="Error",
            status="error",
            details=f"Analysis failed: {str(e)}",
            timestamp=datetime.now(timezone.utc).isoformat()
        ))
        
        return BulkAnalyzeResultItem(
            index=index,
            title=title,
            listing_price=listing_price,
            success=False,
            data=None,
            error=str(e),
            analysis_steps=analysis_steps
        )


@router.post("/bulk", response_model=BulkAnalyzeResponse, status_code=status.HTTP_200_OK)
async def analyze_bulk_listings(
    request: BulkAnalyzeRequest,
    db: AsyncSession = Depends(get_db)
) -> BulkAnalyzeResponse:
    """
    Analyze multiple eBay listings in a single request.
    
    Processes each listing through the same pipeline as single analysis:
    1. Check Redis cache
    2. Parse title with OpenAI (if cache miss)
    3. Query database for pricing
    4. Calculate profit/loss and verdict
    
    Individual failures are handled gracefully - if one listing fails,
    others will still be processed.
    
    Args:
        request: Bulk analysis request with list of listings
        db: Database session (injected)
        
    Returns:
        BulkAnalyzeResponse: Results for all listings with summary stats
    """
    logger.info("=" * 60)
    logger.info("=== BULK ANALYZE REQUEST RECEIVED ===")
    logger.info(f"Total Listings: {len(request.listings)}")
    logger.info("=" * 60)
    
    # Process all listings concurrently
    tasks = [
        analyze_single_listing(
            index=idx,
            title=listing.title,
            listing_price=listing.listing_price,
            db=db
        )
        for idx, listing in enumerate(request.listings)
    ]
    
    results = await asyncio.gather(*tasks)
    
    # Calculate summary statistics
    successful = sum(1 for r in results if r.success)
    failed = sum(1 for r in results if not r.success)
    
    logger.info("=" * 60)
    logger.info(f"✓ BULK ANALYSIS COMPLETE")
    logger.info(f"Total: {len(results)}, Successful: {successful}, Failed: {failed}")
    logger.info("=" * 60)
    
    return BulkAnalyzeResponse(
        results=results,
        total=len(results),
        successful=successful,
        failed=failed
    )


@router.get("/bulk/health", status_code=status.HTTP_200_OK)
async def bulk_analyze_health():
    """Health check endpoint for bulk analysis service."""
    return {
        "status": "healthy",
        "service": "bulk_analysis",
        "message": "Bulk analysis service is operational"
    }
