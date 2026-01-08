"""
Cache management API endpoints.
Provides endpoints for clearing and monitoring Redis cache.
"""

from fastapi import APIRouter, HTTPException
from app.redis_client import get_redis
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/cache", tags=["cache"])


@router.delete("/clear")
async def clear_cache():
    """
    Clear all Redis cache entries.
    
    Returns:
        dict: Success message and status
        
    Raises:
        HTTPException: If cache clearing fails
    """
    try:
        # Get Redis client using the proper getter function
        client = get_redis()
        
        await client.flushdb()
        logger.info("Redis cache cleared successfully")
        
        return {
            "message": "Cache cleared successfully",
            "success": True
        }
    except RuntimeError as e:
        # Handle case where Redis client is not initialized
        logger.error(f"Redis client not initialized: {e}")
        raise HTTPException(
            status_code=503,
            detail="Redis client not initialized"
        )
    except Exception as e:
        logger.error(f"Failed to clear cache: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to clear cache: {str(e)}"
        )


@router.get("/stats")
async def get_cache_stats():
    """
    Get Redis cache statistics.
    
    Returns:
        dict: Cache statistics including total keys and info
        
    Raises:
        HTTPException: If stats retrieval fails
    """
    try:
        # Get Redis client using the proper getter function
        client = get_redis()
        
        info = await client.info("stats")
        dbsize = await client.dbsize()
        
        return {
            "total_keys": dbsize,
            "stats": info
        }
    except RuntimeError as e:
        # Handle case where Redis client is not initialized
        logger.error(f"Redis client not initialized: {e}")
        raise HTTPException(
            status_code=503,
            detail="Redis client not initialized"
        )
    except Exception as e:
        logger.error(f"Failed to get cache stats: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get cache stats: {str(e)}"
        )
