"""
Pricing service for calculating estimated market value of sports cards.
Uses tiered matching strategy: exact match first, then fuzzy text matching.
"""

import logging
from typing import Optional, List, Tuple
from decimal import Decimal
from sqlalchemy import select, func, and_, or_, text
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.sales_history import SalesHistory

logger = logging.getLogger(__name__)

# Similarity threshold for fuzzy matching (0.0 to 1.0)
SIMILARITY_THRESHOLD = 0.3


class PricingResult:
    """Result of pricing analysis."""
    
    def __init__(
        self,
        estimated_value: Optional[float],
        match_tier: str,
        sales_count: int,
        sales_data: List[dict]
    ):
        self.estimated_value = estimated_value
        self.match_tier = match_tier
        self.sales_count = sales_count
        self.sales_data = sales_data
    
    def to_dict(self) -> dict:
        """Convert to dictionary for API response."""
        return {
            "estimated_value": self.estimated_value,
            "match_tier": self.match_tier,
            "sales_count": self.sales_count,
            "sales_data": self.sales_data
        }


def calculate_sanity_average(prices: List[float]) -> Optional[float]:
    """
    Calculate "sanity average" by removing outliers.
    
    Algorithm:
    - If < 3 sales: simple average
    - If >= 3 sales: drop highest and lowest, average the rest
    
    Args:
        prices: List of sale prices
        
    Returns:
        Optional[float]: Average price, or None if no prices
        
    Examples:
        >>> calculate_sanity_average([100.0, 150.0, 200.0])
        150.0
        >>> calculate_sanity_average([100.0, 200.0])
        150.0
        >>> calculate_sanity_average([50.0, 100.0, 150.0, 200.0, 1000.0])
        150.0
    """
    if not prices:
        return None
    
    if len(prices) < 3:
        # Simple average for small datasets
        return sum(prices) / len(prices)
    
    # Sort prices
    sorted_prices = sorted(prices)
    
    # Remove highest and lowest
    trimmed_prices = sorted_prices[1:-1]
    
    # Calculate average
    return sum(trimmed_prices) / len(trimmed_prices)


async def query_tier1_exact_match(
    db: AsyncSession,
    player_id: str,
    brand_id: str,
    variation_id: str,
    grade: Optional[float],
    grader: Optional[str],
    limit: int = 10
) -> List[SalesHistory]:
    """
    Tier 1: Exact match query.
    Matches player_id, brand_id, variation_id, grade, and grader exactly.
    
    Args:
        db: Database session
        player_id: Slugified player name
        brand_id: Slugified brand name
        variation_id: Slugified variation name
        grade: Card grade (e.g., 10.0, 9.5)
        grader: Grading company (e.g., 'PSA', 'BGS')
        limit: Maximum number of sales to return
        
    Returns:
        List[SalesHistory]: Matching sales records
    """
    try:
        # Build query with exact matches
        query = select(SalesHistory).where(
            and_(
                SalesHistory.player_id == player_id,
                SalesHistory.brand_id == brand_id,
                SalesHistory.variation_id == variation_id,
            )
        )
        
        # Add grade and grader filters if provided
        if grade is not None:
            query = query.where(SalesHistory.grade == grade)
        
        if grader:
            query = query.where(SalesHistory.grader == grader)
        
        # Order by most recent sales first
        query = query.order_by(SalesHistory.sold_at.desc()).limit(limit)
        
        result = await db.execute(query)
        sales = result.scalars().all()
        
        logger.info(f"Tier 1 exact match: Found {len(sales)} sales for {player_id}")
        
        return list(sales)
        
    except Exception as e:
        logger.error(f"Error in Tier 1 query: {e}")
        return []


async def query_tier2_fuzzy_match(
    db: AsyncSession,
    player_id: str,
    brand_id: str,
    year: Optional[int],
    limit: int = 10
) -> List[SalesHistory]:
    """
    Tier 2: Fuzzy match query using pg_trgm similarity.
    Uses PostgreSQL trigram similarity on player_id, then filters by brand_id and year.
    
    Args:
        db: Database session
        player_id: Slugified player name
        brand_id: Slugified brand name
        year: Card year
        limit: Maximum number of sales to return
        
    Returns:
        List[SalesHistory]: Matching sales records
    """
    try:
        # Use pg_trgm similarity operator (%)
        # The % operator returns true if similarity is above threshold (default 0.3)
        query = select(SalesHistory).where(
            and_(
                text(f"player_id % :player_id"),
                SalesHistory.brand_id == brand_id,
            )
        )
        
        # Add year filter if provided
        if year is not None:
            query = query.where(SalesHistory.year == year)
        
        # Order by similarity (most similar first), then by date
        query = query.order_by(
            text("similarity(player_id, :player_id) DESC"),
            SalesHistory.sold_at.desc()
        ).limit(limit)
        
        result = await db.execute(query, {"player_id": player_id})
        sales = result.scalars().all()
        
        logger.info(f"Tier 2 fuzzy match: Found {len(sales)} sales for {player_id}")
        
        return list(sales)
        
    except Exception as e:
        logger.error(f"Error in Tier 2 query: {e}")
        return []


async def get_estimated_value(
    db: AsyncSession,
    player_id: str,
    brand_id: str,
    variation_id: str,
    year: Optional[int],
    grade: Optional[float],
    grader: Optional[str]
) -> PricingResult:
    """
    Get estimated market value for a card using tiered matching.
    
    Pipeline:
    1. Try Tier 1 (exact match)
    2. If no results, try Tier 2 (fuzzy match)
    3. Calculate sanity average from matching sales
    
    Args:
        db: Database session
        player_id: Slugified player name
        brand_id: Slugified brand name
        variation_id: Slugified variation name
        year: Card year
        grade: Card grade
        grader: Grading company
        
    Returns:
        PricingResult: Estimated value and match details
    """
    sales = []
    match_tier = "none"
    
    # Try Tier 1: Exact match
    logger.info(f"Attempting Tier 1 match for {player_id} - {brand_id}")
    sales = await query_tier1_exact_match(
        db=db,
        player_id=player_id,
        brand_id=brand_id,
        variation_id=variation_id,
        grade=grade,
        grader=grader
    )
    
    if sales:
        match_tier = "exact"
        logger.info(f"Tier 1 match successful: {len(sales)} sales found")
    else:
        # Try Tier 2: Fuzzy match
        logger.info(f"Tier 1 failed, attempting Tier 2 fuzzy match")
        sales = await query_tier2_fuzzy_match(
            db=db,
            player_id=player_id,
            brand_id=brand_id,
            year=year
        )
        
        if sales:
            match_tier = "fuzzy"
            logger.info(f"Tier 2 match successful: {len(sales)} sales found")
        else:
            logger.warning(f"No matches found for {player_id} - {brand_id}")
    
    # Extract prices and calculate average
    prices = [float(sale.price) for sale in sales]
    estimated_value = calculate_sanity_average(prices)
    
    # Convert sales to dictionaries
    sales_data = [sale.to_dict() for sale in sales]
    
    if estimated_value:
        logger.info(f"Estimated value: ${estimated_value:.2f} from {len(sales)} sales ({match_tier} match)")
    else:
        logger.warning(f"Could not estimate value - no matching sales found")
    
    return PricingResult(
        estimated_value=estimated_value,
        match_tier=match_tier,
        sales_count=len(sales),
        sales_data=sales_data
    )


async def calculate_profit_loss(
    listing_price: float,
    estimated_value: Optional[float]
) -> Tuple[Optional[float], str]:
    """
    Calculate profit/loss and generate verdict.
    
    Args:
        listing_price: Current listing price
        estimated_value: Estimated market value
        
    Returns:
        Tuple[Optional[float], str]: (profit_loss, verdict)
        
    Examples:
        >>> await calculate_profit_loss(100.0, 150.0)
        (50.0, 'GOOD DEAL - Potential profit: $50.00')
        >>> await calculate_profit_loss(200.0, 150.0)
        (-50.0, 'OVERPRICED - Potential loss: $50.00')
    """
    if estimated_value is None:
        return None, "INSUFFICIENT DATA - No comparable sales found"
    
    profit_loss = estimated_value - listing_price
    
    if profit_loss > 0:
        verdict = f"GOOD DEAL - Potential profit: ${profit_loss:.2f}"
    elif profit_loss < 0:
        verdict = f"OVERPRICED - Potential loss: ${abs(profit_loss):.2f}"
    else:
        verdict = "FAIR PRICE - Listing matches market value"
    
    return profit_loss, verdict
