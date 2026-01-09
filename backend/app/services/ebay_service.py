"""
eBay Browse API Service

This module provides integration with the eBay Browse API to search for
sports card listings and retrieve their details including titles, prices,
and other relevant information.
"""

import logging
import os
from typing import Optional, Dict, Any, List
import httpx
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)


class EbayPrice(BaseModel):
    """Model for eBay listing price"""
    value: str
    currency: str


class EbayImage(BaseModel):
    """Model for eBay listing image"""
    imageUrl: str


class EbayShippingOption(BaseModel):
    """Model for eBay shipping option"""
    shippingCost: Optional[Dict[str, str]] = None
    shippingCostType: Optional[str] = None


class EbayListing(BaseModel):
    """Model for eBay listing item"""
    itemId: str
    title: str
    price: Optional[EbayPrice] = None
    itemWebUrl: Optional[str] = None
    image: Optional[EbayImage] = None
    condition: Optional[str] = None
    conditionId: Optional[str] = None
    seller: Optional[Dict[str, Any]] = None
    shippingOptions: Optional[List[EbayShippingOption]] = None
    buyingOptions: Optional[List[str]] = None
    itemLocation: Optional[Dict[str, str]] = None
    categories: Optional[List[Dict[str, str]]] = None
    
    # Additional fields that might be useful
    itemAffiliateWebUrl: Optional[str] = None
    itemEndDate: Optional[str] = None
    marketingPrice: Optional[Dict[str, Any]] = None
    quantityLimitPerBuyer: Optional[int] = None
    unitPrice: Optional[Dict[str, str]] = None
    unitPricingMeasure: Optional[str] = None


class EbaySearchResponse(BaseModel):
    """Model for eBay search API response"""
    href: Optional[str] = None
    total: int = 0
    next: Optional[str] = None
    prev: Optional[str] = None
    limit: int = 50
    offset: int = 0
    itemSummaries: List[EbayListing] = Field(default_factory=list)
    warnings: Optional[List[Dict[str, Any]]] = None


class EbayService:
    """Service for interacting with eBay Browse API"""
    
    BASE_URL = "https://api.ebay.com/buy/browse/v1"
    
    def __init__(self, access_token: Optional[str] = None):
        """
        Initialize eBay service with access token.
        
        Args:
            access_token: eBay OAuth access token. If not provided, will try to get from environment.
        """
        self.access_token = access_token or os.getenv("EBAY_ACCESS_TOKEN")
        if not self.access_token:
            logger.warning("EBAY_ACCESS_TOKEN not set - eBay API calls will fail")
        
        self.client = httpx.AsyncClient(timeout=30.0)
    
    async def close(self):
        """Close the HTTP client"""
        await self.client.aclose()
    
    def _get_headers(self) -> Dict[str, str]:
        """Get headers for eBay API requests"""
        return {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json",
            "X-EBAY-C-MARKETPLACE-ID": "EBAY_US"  # Default to US marketplace
        }
    
    async def search_items(
        self,
        query: str,
        limit: int = 50,
        offset: int = 0,
        category_ids: Optional[str] = None,
        filter_params: Optional[str] = None,
        sort: Optional[str] = None
    ) -> EbaySearchResponse:
        """
        Search for items on eBay using the Browse API.
        
        Args:
            query: Search query string (e.g., "2023 Topps Chrome Baseball")
            limit: Number of items to return (max 200, default 50)
            offset: Number of items to skip for pagination
            category_ids: Comma-separated category IDs to filter by
            filter_params: Additional filter parameters (e.g., "price:[10..100],priceCurrency:USD")
            sort: Sort order (e.g., "price" for ascending price, "-price" for descending)
        
        Returns:
            EbaySearchResponse containing search results
        
        Raises:
            httpx.HTTPError: If the API request fails
        """
        if not self.access_token:
            raise ValueError("EBAY_ACCESS_TOKEN is not configured")
        
        # Build query parameters
        params = {
            "q": query,
            "limit": min(limit, 200),  # eBay max is 200
            "offset": offset
        }
        
        if category_ids:
            params["category_ids"] = category_ids
        
        if filter_params:
            params["filter"] = filter_params
        
        if sort:
            params["sort"] = sort
        
        try:
            logger.info(f"Searching eBay for: {query} (limit={limit}, offset={offset})")
            
            response = await self.client.get(
                f"{self.BASE_URL}/item_summary/search",
                headers=self._get_headers(),
                params=params
            )
            
            response.raise_for_status()
            data = response.json()
            
            # Parse response into our model
            search_response = EbaySearchResponse(**data)
            
            logger.info(f"Found {search_response.total} total items, returned {len(search_response.itemSummaries)} items")
            
            return search_response
            
        except httpx.HTTPStatusError as e:
            logger.error(f"eBay API HTTP error: {e.response.status_code} - {e.response.text}")
            raise
        except httpx.RequestError as e:
            logger.error(f"eBay API request error: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error during eBay search: {str(e)}")
            raise
    
    async def get_item(self, item_id: str) -> Dict[str, Any]:
        """
        Get detailed information about a specific item.
        
        Args:
            item_id: eBay item ID
        
        Returns:
            Dictionary containing item details
        
        Raises:
            httpx.HTTPError: If the API request fails
        """
        if not self.access_token:
            raise ValueError("EBAY_ACCESS_TOKEN is not configured")
        
        try:
            logger.info(f"Fetching eBay item details for: {item_id}")
            
            response = await self.client.get(
                f"{self.BASE_URL}/item/{item_id}",
                headers=self._get_headers()
            )
            
            response.raise_for_status()
            return response.json()
            
        except httpx.HTTPStatusError as e:
            logger.error(f"eBay API HTTP error: {e.response.status_code} - {e.response.text}")
            raise
        except httpx.RequestError as e:
            logger.error(f"eBay API request error: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error fetching eBay item: {str(e)}")
            raise
    
    async def search_sports_cards(
        self,
        card_name: str,
        year: Optional[str] = None,
        brand: Optional[str] = None,
        player: Optional[str] = None,
        limit: int = 50,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None,
        condition: Optional[str] = None
    ) -> EbaySearchResponse:
        """
        Specialized search for sports cards with common filters.
        
        Args:
            card_name: Base card name/description
            year: Card year (e.g., "2023")
            brand: Card brand (e.g., "Topps", "Panini")
            player: Player name
            limit: Number of results to return
            min_price: Minimum price filter
            max_price: Maximum price filter
            condition: Condition filter (e.g., "New", "Used")
        
        Returns:
            EbaySearchResponse containing search results
        """
        # Build search query
        query_parts = [card_name]
        if year:
            query_parts.insert(0, year)
        if brand:
            query_parts.insert(0, brand)
        if player:
            query_parts.append(player)
        
        query = " ".join(query_parts)
        
        # Build filter string
        filters = []
        if min_price is not None or max_price is not None:
            price_min = min_price if min_price is not None else ""
            price_max = max_price if max_price is not None else ""
            filters.append(f"price:[{price_min}..{price_max}]")
            filters.append("priceCurrency:USD")
        
        if condition:
            # Map common condition terms to eBay condition IDs
            condition_map = {
                "new": "1000",
                "like new": "1500",
                "excellent": "2000",
                "very good": "2500",
                "good": "3000",
                "acceptable": "4000"
            }
            condition_id = condition_map.get(condition.lower())
            if condition_id:
                filters.append(f"conditions:{{{condition_id}}}")
        
        filter_params = ",".join(filters) if filters else None
        
        # Sports cards category ID (common categories)
        # 212: Sports Mem, Cards & Fan Shop
        # 261328: Sports Trading Cards
        category_ids = "212,261328"
        
        return await self.search_items(
            query=query,
            limit=limit,
            category_ids=category_ids,
            filter_params=filter_params,
            sort="price"  # Sort by price ascending by default
        )


# Global eBay service instance
_ebay_service: Optional[EbayService] = None


def get_ebay_service() -> EbayService:
    """
    Get or create the global eBay service instance.
    
    Returns:
        EbayService instance
    """
    global _ebay_service
    if _ebay_service is None:
        _ebay_service = EbayService()
    return _ebay_service


async def close_ebay_service():
    """Close the global eBay service instance"""
    global _ebay_service
    if _ebay_service is not None:
        await _ebay_service.close()
        _ebay_service = None
