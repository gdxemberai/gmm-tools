"""
Database configuration and session management for the Sports Card Arbitrage Tool.
Uses SQLAlchemy 2.0+ async patterns with asyncpg driver.
"""

import os
from typing import AsyncGenerator
from sqlalchemy import text
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    AsyncEngine,
    create_async_engine,
    async_sessionmaker,
)
from sqlalchemy.orm import declarative_base

# Database connection URL - uses environment variable with Docker-compatible default
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://admin:admin123@gmm-postgres:5432/sports_cards"
)

# Create async engine
engine: AsyncEngine = create_async_engine(
    DATABASE_URL,
    echo=True,  # Set to False in production
    future=True,
    pool_pre_ping=True,  # Verify connections before using them
    pool_size=10,  # Maximum number of connections to keep in the pool
    max_overflow=20,  # Maximum number of connections that can be created beyond pool_size
)

# Create async session factory
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

# Base class for declarative models
Base = declarative_base()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency function to get database session.
    
    Yields:
        AsyncSession: Database session for use in FastAPI endpoints
        
    Example:
        @app.get("/items")
        async def read_items(db: AsyncSession = Depends(get_db)):
            result = await db.execute(select(Item))
            return result.scalars().all()
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db() -> None:
    """
    Initialize database connection.
    Tests the connection and ensures the database is accessible.
    
    Raises:
        Exception: If database connection fails
    """
    try:
        async with engine.begin() as conn:
            # Test connection
            await conn.execute(text("SELECT 1"))
        print("✓ Database connection successful")
    except Exception as e:
        print(f"✗ Database connection failed: {e}")
        raise


async def close_db() -> None:
    """
    Close database connection pool.
    Should be called on application shutdown.
    """
    await engine.dispose()
    print("✓ Database connection closed")
