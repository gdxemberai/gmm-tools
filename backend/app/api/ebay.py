"""
eBay API Router

Provides endpoints for searching and retrieving eBay listings for sports cards.
"""

import logging
from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from app.services.ebay_service import get_ebay_service, EbaySearchResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ebay", tags=["eBay"])


class SearchRequest(BaseModel):
    """Request model for eBay search"""
    query: str = Field(..., description="Search query string")
    limit: int = Field(50, ge=1, le=200, description="Number of results to return (max 200)")
    offset: int = Field(0, ge=0, description="Number of results to skip for pagination")
    category_ids: Optional[str] = Field(None, description="Comma-separated category IDs")
    filter_params: Optional[str] = Field(None, description="Filter parameters (e.g., 'price:[10..100],priceCurrency:USD')")
    sort: Optional[str] = Field(None, description="Sort order (e.g., 'price', '-price')")


class SportsCardSearchRequest(BaseModel):
    """Request model for sports card specific search"""
    card_name: str = Field(..., description="Card name or description")
    year: Optional[str] = Field(None, description="Card year (e.g., '2023')")
    brand: Optional[str] = Field(None, description="Card brand (e.g., 'Topps', 'Panini')")
    player: Optional[str] = Field(None, description="Player name")
    limit: int = Field(50, ge=1, le=200, description="Number of results to return")
    min_price: Optional[float] = Field(None, ge=0, description="Minimum price in USD")
    max_price: Optional[float] = Field(None, ge=0, description="Maximum price in USD")
    condition: Optional[str] = Field(None, description="Condition (e.g., 'New', 'Used', 'Like New')")


@router.get("/search", response_model=EbaySearchResponse)
async def search_ebay(
    q: str = Query(..., description="Search query string"),
    limit: int = Query(50, ge=1, le=200, description="Number of results to return"),
    offset: int = Query(0, ge=0, description="Number of results to skip for pagination"),
    category_ids: Optional[str] = Query(None, description="Comma-separated category IDs"),
    filter_params: Optional[str] = Query(None, description="Filter parameters"),
    sort: Optional[str] = Query(None, description="Sort order")
):
    """
    Search for items on eBay using the Browse API.
    
    **Query Parameters:**
    - **q**: Search query (e.g., "2023 Topps Chrome Baseball")
    - **limit**: Number of results (1-200, default 50)
    - **offset**: Pagination offset (default 0)
    - **category_ids**: Filter by category IDs (optional)
    - **filter_params**: Additional filters like price range (optional)
    - **sort**: Sort order, e.g., "price" or "-price" (optional)
    
    **Example:**
    ```
    GET /ebay/search?q=2023%20Topps%20Chrome&limit=20&sort=price
    ```
    
    **Returns:**
    - Search results with item summaries including titles, prices, images, etc.
    """
    try:
        ebay_service = get_ebay_service()
        results = await ebay_service.search_items(
            query=q,
            limit=limit,
            offset=offset,
            category_ids=category_ids,
            filter_params=filter_params,
            sort=sort
        )
        return results
    except ValueError as e:
        logger.error(f"Configuration error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        logger.error(f"Error searching eBay: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to search eBay: {str(e)}")


@router.post("/search", response_model=EbaySearchResponse)
async def search_ebay_post(request: SearchRequest):
    """
    Search for items on eBay using POST method (alternative to GET).
    
    **Request Body:**
    ```json
    {
        "query": "2023 Topps Chrome Baseball",
        "limit": 50,
        "offset": 0,
        "category_ids": "212,261328",
        "filter_params": "price:[10..100],priceCurrency:USD",
        "sort": "price"
    }
    ```
    
    **Returns:**
    - Search results with item summaries
    """
    try:
        ebay_service = get_ebay_service()
        results = await ebay_service.search_items(
            query=request.query,
            limit=request.limit,
            offset=request.offset,
            category_ids=request.category_ids,
            filter_params=request.filter_params,
            sort=request.sort
        )
        return results
    except ValueError as e:
        logger.error(f"Configuration error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        logger.error(f"Error searching eBay: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to search eBay: {str(e)}")


@router.post("/search/sports-cards", response_model=EbaySearchResponse)
async def search_sports_cards(request: SportsCardSearchRequest):
    """
    Search specifically for sports cards with common filters.
    
    This endpoint provides a simplified interface for searching sports cards
    with automatic category filtering and common search patterns.
    
    **Request Body:**
    ```json
    {
        "card_name": "Chrome Baseball",
        "year": "2023",
        "brand": "Topps",
        "player": "Ronald Acuna Jr",
        "limit": 50,
        "min_price": 10.0,
        "max_price": 100.0,
        "condition": "New"
    }
    ```
    
    **Returns:**
    - Search results filtered for sports cards category
    """
    try:
        ebay_service = get_ebay_service()
        results = await ebay_service.search_sports_cards(
            card_name=request.card_name,
            year=request.year,
            brand=request.brand,
            player=request.player,
            limit=request.limit,
            min_price=request.min_price,
            max_price=request.max_price,
            condition=request.condition
        )
        return results
    except ValueError as e:
        logger.error(f"Configuration error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        logger.error(f"Error searching sports cards on eBay: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to search sports cards: {str(e)}")


@router.get("/item/{item_id}")
async def get_ebay_item(item_id: str):
    """
    Get detailed information about a specific eBay item.
    
    **Path Parameters:**
    - **item_id**: eBay item ID
    
    **Example:**
    ```
    GET /ebay/item/v1|123456789012|0
    ```
    
    **Returns:**
    - Detailed item information including full description, specifications, etc.
    """
    try:
        ebay_service = get_ebay_service()
        item = await ebay_service.get_item(item_id)
        return item
    except ValueError as e:
        logger.error(f"Configuration error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        logger.error(f"Error fetching eBay item: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch item: {str(e)}")


@router.get("/health")
async def ebay_health_check():
    """
    Check if eBay API integration is properly configured.
    
    **Returns:**
    - Status of eBay API configuration
    """
    import os
    
    has_token = bool(os.getenv("EBAY_ACCESS_TOKEN"))
    
    return {
        "status": "configured" if has_token else "not_configured",
        "has_access_token": has_token,
        "message": "eBay API is ready" if has_token else "EBAY_ACCESS_TOKEN not set in environment"
    }
