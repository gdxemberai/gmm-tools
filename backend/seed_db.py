"""
Database seeding script for Sports Card Arbitrage Tool.
Loads sales history data from JSON file and inserts into the database.

Usage:
    python seed_db.py
    python seed_db.py --file custom_data.json
    python seed_db.py --clear --batch-size 200
"""

import asyncio
import argparse
import json
import sys
from pathlib import Path
from datetime import datetime
from decimal import Decimal
from typing import List, Dict, Any

from sqlalchemy import select, delete
from sqlalchemy.exc import SQLAlchemyError

# Add the backend directory to the path
sys.path.insert(0, str(Path(__file__).parent))

from app.database import AsyncSessionLocal, engine
from app.models.sales_history import SalesHistory
from app.utils.slugify import slugify


async def clear_sales_history() -> int:
    """
    Clear all existing sales history records.
    
    Returns:
        int: Number of records deleted
    """
    async with AsyncSessionLocal() as session:
        try:
            result = await session.execute(select(SalesHistory))
            count = len(result.scalars().all())
            
            await session.execute(delete(SalesHistory))
            await session.commit()
            
            return count
        except SQLAlchemyError as e:
            await session.rollback()
            raise Exception(f"Failed to clear sales history: {e}")


async def load_json_data(file_path: Path) -> List[Dict[str, Any]]:
    """
    Load and validate JSON data from file.
    
    Args:
        file_path: Path to JSON file
        
    Returns:
        List of sales data dictionaries
        
    Raises:
        FileNotFoundError: If file doesn't exist
        json.JSONDecodeError: If file contains invalid JSON
        ValueError: If data format is invalid
    """
    if not file_path.exists():
        raise FileNotFoundError(f"Data file not found: {file_path}")
    
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    if not isinstance(data, list):
        raise ValueError("JSON data must be an array of objects")
    
    return data


def validate_record(record: Dict[str, Any], index: int) -> None:
    """
    Validate a single sales record.
    
    Args:
        record: Sales data dictionary
        index: Record index (for error reporting)
        
    Raises:
        ValueError: If required fields are missing or invalid
    """
    required_fields = ['player_name', 'brand', 'variation', 'year', 'grade', 'grader', 'price', 'sold_at']
    
    for field in required_fields:
        if field not in record:
            raise ValueError(f"Record {index}: Missing required field '{field}'")
    
    # Validate data types
    if not isinstance(record['year'], int):
        raise ValueError(f"Record {index}: 'year' must be an integer")
    
    if not isinstance(record['grade'], (int, float)):
        raise ValueError(f"Record {index}: 'grade' must be a number")
    
    if not isinstance(record['price'], (int, float)):
        raise ValueError(f"Record {index}: 'price' must be a number")


def transform_record(record: Dict[str, Any]) -> SalesHistory:
    """
    Transform JSON record to SalesHistory model instance.
    
    Args:
        record: Raw sales data dictionary
        
    Returns:
        SalesHistory model instance
    """
    # Slugify text fields
    player_id = slugify(record['player_name'])
    brand_id = slugify(record['brand'])
    variation_id = slugify(record['variation'])
    
    # Parse datetime
    sold_at = datetime.fromisoformat(record['sold_at'].replace('Z', '+00:00'))
    
    return SalesHistory(
        player_id=player_id,
        brand_id=brand_id,
        variation_id=variation_id,
        year=record['year'],
        grade=float(record['grade']),
        grader=record['grader'],
        price=Decimal(str(record['price'])),
        sold_at=sold_at
    )


async def insert_batch(records: List[SalesHistory]) -> int:
    """
    Insert a batch of records into the database.
    
    Args:
        records: List of SalesHistory instances to insert
        
    Returns:
        int: Number of records successfully inserted
        
    Raises:
        SQLAlchemyError: If database operation fails
    """
    async with AsyncSessionLocal() as session:
        try:
            session.add_all(records)
            await session.commit()
            return len(records)
        except SQLAlchemyError as e:
            await session.rollback()
            raise Exception(f"Failed to insert batch: {e}")


async def seed_database(file_path: Path, batch_size: int = 100, clear_existing: bool = False) -> Dict[str, Any]:
    """
    Main seeding function.
    
    Args:
        file_path: Path to JSON data file
        batch_size: Number of records to insert per batch
        clear_existing: Whether to clear existing data before seeding
        
    Returns:
        Dictionary with seeding statistics
    """
    stats = {
        'total_records': 0,
        'inserted': 0,
        'cleared': 0,
        'errors': 0
    }
    
    try:
        # Clear existing data if requested
        if clear_existing:
            print("🗑️  Clearing existing sales history...")
            stats['cleared'] = await clear_sales_history()
            print(f"✓ Cleared {stats['cleared']} existing records")
        
        # Load JSON data
        print(f"📂 Loading data from {file_path}...")
        raw_data = await load_json_data(file_path)
        stats['total_records'] = len(raw_data)
        print(f"✓ Loaded {stats['total_records']} records")
        
        # Validate and transform records
        print("🔍 Validating and transforming records...")
        records = []
        for i, record in enumerate(raw_data):
            try:
                validate_record(record, i)
                records.append(transform_record(record))
            except ValueError as e:
                print(f"⚠️  Skipping invalid record: {e}")
                stats['errors'] += 1
        
        print(f"✓ Validated {len(records)} records ({stats['errors']} errors)")
        
        # Insert in batches
        print(f"💾 Inserting records (batch size: {batch_size})...")
        total_inserted = 0
        
        for i in range(0, len(records), batch_size):
            batch = records[i:i + batch_size]
            try:
                inserted = await insert_batch(batch)
                total_inserted += inserted
                stats['inserted'] = total_inserted
                
                # Progress reporting
                progress = (total_inserted / len(records)) * 100
                print(f"   Inserted {total_inserted}/{len(records)} records ({progress:.1f}%)...")
                
            except Exception as e:
                print(f"⚠️  Error inserting batch {i//batch_size + 1}: {e}")
                stats['errors'] += len(batch)
        
        print(f"✅ Seeding complete!")
        
    except FileNotFoundError as e:
        print(f"❌ Error: {e}")
        raise
    except json.JSONDecodeError as e:
        print(f"❌ Invalid JSON format: {e}")
        raise
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        raise
    
    return stats


def print_summary(stats: Dict[str, Any]) -> None:
    """
    Print seeding summary statistics.
    
    Args:
        stats: Dictionary with seeding statistics
    """
    print("\n" + "="*50)
    print("SEEDING SUMMARY")
    print("="*50)
    print(f"Total records in file:  {stats['total_records']}")
    print(f"Records cleared:        {stats['cleared']}")
    print(f"Records inserted:       {stats['inserted']}")
    print(f"Errors/Skipped:         {stats['errors']}")
    print("="*50 + "\n")


async def main():
    """Main entry point for the seeding script."""
    parser = argparse.ArgumentParser(
        description='Seed the sports card sales history database',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python seed_db.py
  python seed_db.py --file custom_data.json
  python seed_db.py --clear --batch-size 200
        """
    )
    
    parser.add_argument(
        '--file',
        type=str,
        default='dummy_sales_data.json',
        help='Path to JSON data file (default: dummy_data.json)'
    )
    
    parser.add_argument(
        '--clear',
        action='store_true',
        help='Clear existing sales history before seeding'
    )
    
    parser.add_argument(
        '--batch-size',
        type=int,
        default=100,
        help='Number of records to insert per batch (default: 100)'
    )
    
    args = parser.parse_args()
    
    # Resolve file path (relative to script directory)
    script_dir = Path(__file__).parent
    file_path = script_dir / args.file
    
    print("\n" + "="*50)
    print("SPORTS CARD DATABASE SEEDING")
    print("="*50)
    print(f"File:       {file_path}")
    print(f"Batch size: {args.batch_size}")
    print(f"Clear data: {args.clear}")
    print("="*50 + "\n")
    
    try:
        stats = await seed_database(
            file_path=file_path,
            batch_size=args.batch_size,
            clear_existing=args.clear
        )
        print_summary(stats)
        
        # Exit with success
        sys.exit(0)
        
    except Exception as e:
        print(f"\n❌ Seeding failed: {e}")
        sys.exit(1)
    finally:
        # Clean up database connections
        await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
