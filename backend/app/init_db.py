"""
Database initialization script for Sports Card Arbitrage Tool.
Handles table creation, extension setup, and index creation.
"""

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine

from .database import engine, Base
from .models.sales_history import SalesHistory


async def enable_pg_trgm_extension() -> None:
    """
    Enable the pg_trgm extension for fuzzy text matching.
    
    The pg_trgm extension provides functions and operators for determining
    the similarity of text based on trigram matching.
    
    Raises:
        Exception: If extension creation fails
    """
    async with engine.begin() as conn:
        try:
            await conn.execute(text("CREATE EXTENSION IF NOT EXISTS pg_trgm;"))
            print("✓ pg_trgm extension enabled")
        except Exception as e:
            print(f"✗ Failed to enable pg_trgm extension: {e}")
            raise


async def create_gin_indexes() -> None:
    """
    Create GIN indexes for fuzzy text matching on player_id.
    
    GIN (Generalized Inverted Index) indexes are optimized for searching
    within composite values like text arrays and full-text search.
    
    Raises:
        Exception: If index creation fails
    """
    async with engine.begin() as conn:
        try:
            # Create GIN index for pg_trgm fuzzy matching on player_id
            await conn.execute(
                text(
                    "CREATE INDEX IF NOT EXISTS idx_player_id_trgm "
                    "ON sales_history USING gin(player_id gin_trgm_ops);"
                )
            )
            print("✓ GIN index created on player_id for fuzzy matching")
        except Exception as e:
            print(f"✗ Failed to create GIN index: {e}")
            raise


async def create_tables() -> None:
    """
    Create all database tables defined in SQLAlchemy models.
    
    This function creates tables based on the Base metadata.
    It will not recreate existing tables.
    
    Raises:
        Exception: If table creation fails
    """
    async with engine.begin() as conn:
        try:
            # Create all tables
            await conn.run_sync(Base.metadata.create_all)
            print("✓ Database tables created successfully")
        except Exception as e:
            print(f"✗ Failed to create tables: {e}")
            raise


async def drop_tables() -> None:
    """
    Drop all database tables defined in SQLAlchemy models.
    
    WARNING: This will delete all data in the tables!
    Use with caution, typically only in development/testing.
    
    Raises:
        Exception: If table dropping fails
    """
    async with engine.begin() as conn:
        try:
            await conn.run_sync(Base.metadata.drop_all)
            print("✓ Database tables dropped successfully")
        except Exception as e:
            print(f"✗ Failed to drop tables: {e}")
            raise


async def init_database() -> None:
    """
    Initialize the complete database setup.
    
    This function orchestrates the full database initialization:
    1. Enable pg_trgm extension
    2. Create all tables
    3. Create GIN indexes for fuzzy matching
    
    Call this function on application startup or via a migration script.
    
    Example:
        import asyncio
        from app.init_db import init_database
        
        asyncio.run(init_database())
    
    Raises:
        Exception: If any initialization step fails
    """
    print("\n" + "="*50)
    print("Starting database initialization...")
    print("="*50 + "\n")
    
    try:
        # Step 1: Enable pg_trgm extension
        print("Step 1: Enabling pg_trgm extension...")
        await enable_pg_trgm_extension()
        
        # Step 2: Create tables
        print("\nStep 2: Creating database tables...")
        await create_tables()
        
        # Step 3: Create GIN indexes
        print("\nStep 3: Creating GIN indexes...")
        await create_gin_indexes()
        
        print("\n" + "="*50)
        print("✓ Database initialization completed successfully!")
        print("="*50 + "\n")
        
    except Exception as e:
        print("\n" + "="*50)
        print(f"✗ Database initialization failed: {e}")
        print("="*50 + "\n")
        raise


async def reset_database() -> None:
    """
    Reset the database by dropping and recreating all tables.
    
    WARNING: This will delete all data!
    Use only in development/testing environments.
    
    Raises:
        Exception: If reset fails
    """
    print("\n" + "="*50)
    print("WARNING: Resetting database (all data will be lost)...")
    print("="*50 + "\n")
    
    try:
        # Drop all tables
        print("Dropping all tables...")
        await drop_tables()
        
        # Reinitialize
        await init_database()
        
        print("\n" + "="*50)
        print("✓ Database reset completed successfully!")
        print("="*50 + "\n")
        
    except Exception as e:
        print("\n" + "="*50)
        print(f"✗ Database reset failed: {e}")
        print("="*50 + "\n")
        raise


# CLI entry point for running initialization
if __name__ == "__main__":
    import asyncio
    import sys
    
    async def main():
        """Main entry point for CLI execution."""
        if len(sys.argv) > 1 and sys.argv[1] == "--reset":
            await reset_database()
        else:
            await init_database()
    
    asyncio.run(main())
