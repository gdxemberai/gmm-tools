"""
Redis client configuration for caching analysis results.
Provides async Redis operations with TTL management.
"""

import json
import hashlib
import os
from typing import Optional, Any
from redis.asyncio import Redis, ConnectionPool
import logging

logger = logging.getLogger(__name__)

# Redis configuration
REDIS_URL = os.getenv("REDIS_URL", "redis://gmm-redis:6379")
REDIS_DEFAULT_TTL = 3600  # 1 hour in seconds

# Global Redis client instance
redis_client: Optional[Redis] = None
connection_pool: Optional[ConnectionPool] = None


async def init_redis() -> None:
    """
    Initialize Redis connection pool and client.
    Should be called on application startup.
    
    Raises:
        Exception: If Redis connection fails
    """
    global redis_client, connection_pool
    
    try:
        redis_client = Redis.from_url(
            REDIS_URL,
            decode_responses=True,
            max_connections=10,
        )
        
        # Test connection
        await redis_client.ping()
        logger.info(f"✓ Redis connection successful at {REDIS_URL}")
    except Exception as e:
        logger.error(f"✗ Redis connection failed: {e}")
        raise


async def close_redis() -> None:
    """
    Close Redis connection pool.
    Should be called on application shutdown.
    """
    global redis_client, connection_pool
    
    if redis_client:
        await redis_client.aclose()
        logger.info("✓ Redis connection closed")
    
    if connection_pool:
        await connection_pool.disconnect()


def get_redis() -> Redis:
    """
    Get the Redis client instance.
    
    Returns:
        Redis: Active Redis client
        
    Raises:
        RuntimeError: If Redis client is not initialized
    """
    if redis_client is None:
        raise RuntimeError("Redis client not initialized. Call init_redis() first.")
    return redis_client


def generate_cache_key(prefix: str, identifier: str) -> str:
    """
    Generate a consistent cache key from a prefix and identifier.
    Uses MD5 hash for long identifiers to keep keys manageable.
    
    Args:
        prefix: Cache key prefix (e.g., 'analysis', 'pricing')
        identifier: Unique identifier (e.g., listing title)
        
    Returns:
        str: Cache key in format 'prefix:hash'
        
    Examples:
        >>> generate_cache_key('analysis', '2023 Topps Chrome Wembanyama PSA 10')
        'analysis:a1b2c3d4e5f6...'
    """
    # Create MD5 hash of identifier for consistent, short keys
    hash_obj = hashlib.md5(identifier.encode('utf-8'))
    hash_str = hash_obj.hexdigest()
    
    return f"{prefix}:{hash_str}"


async def get_cached_value(key: str) -> Optional[dict]:
    """
    Retrieve a cached value from Redis.
    
    Args:
        key: Cache key to retrieve
        
    Returns:
        Optional[dict]: Cached value as dictionary, or None if not found
    """
    try:
        client = get_redis()
        value = await client.get(key)
        
        if value:
            logger.debug(f"Cache HIT: {key}")
            return json.loads(value)
        else:
            logger.debug(f"Cache MISS: {key}")
            return None
            
    except Exception as e:
        logger.error(f"Error retrieving cache key {key}: {e}")
        return None


async def set_cached_value(
    key: str,
    value: dict,
    ttl: int = REDIS_DEFAULT_TTL
) -> bool:
    """
    Store a value in Redis cache with TTL.
    
    Args:
        key: Cache key to store
        value: Dictionary value to cache
        ttl: Time-to-live in seconds (default: 3600 = 1 hour)
        
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        client = get_redis()
        serialized = json.dumps(value)
        await client.setex(key, ttl, serialized)
        logger.debug(f"Cache SET: {key} (TTL: {ttl}s)")
        return True
        
    except Exception as e:
        logger.error(f"Error setting cache key {key}: {e}")
        return False


async def delete_cached_value(key: str) -> bool:
    """
    Delete a cached value from Redis.
    
    Args:
        key: Cache key to delete
        
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        client = get_redis()
        await client.delete(key)
        logger.debug(f"Cache DELETE: {key}")
        return True
        
    except Exception as e:
        logger.error(f"Error deleting cache key {key}: {e}")
        return False


async def clear_cache_by_pattern(pattern: str) -> int:
    """
    Clear all cache keys matching a pattern.
    
    Args:
        pattern: Redis key pattern (e.g., 'analysis:*')
        
    Returns:
        int: Number of keys deleted
    """
    try:
        client = get_redis()
        keys = []
        
        # Scan for matching keys
        async for key in client.scan_iter(match=pattern):
            keys.append(key)
        
        if keys:
            deleted = await client.delete(*keys)
            logger.info(f"Cleared {deleted} cache keys matching pattern: {pattern}")
            return deleted
        
        return 0
        
    except Exception as e:
        logger.error(f"Error clearing cache pattern {pattern}: {e}")
        return 0
