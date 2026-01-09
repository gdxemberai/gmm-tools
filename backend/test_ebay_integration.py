"""
Test script for eBay API integration

This script tests the eBay service and API endpoints to ensure
the integration is working correctly.
"""

import asyncio
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from app.services.ebay_service import EbayService


async def test_ebay_service():
    """Test the eBay service directly"""
    print("=" * 60)
    print("Testing eBay Service Integration")
    print("=" * 60)
    
    # Check if token is configured
    token = os.getenv("EBAY_ACCESS_TOKEN")
    if not token:
        print("❌ EBAY_ACCESS_TOKEN not found in environment")
        return False
    
    print(f"✓ EBAY_ACCESS_TOKEN found (length: {len(token)})")
    
    # Initialize service
    ebay_service = EbayService(token)
    
    try:
        # Test 1: Basic search
        print("\n" + "-" * 60)
        print("Test 1: Basic Search - '2023 Topps Baseball'")
        print("-" * 60)
        
        results = await ebay_service.search_items(
            query="2023 Topps Baseball",
            limit=5
        )
        
        print(f"✓ Search successful!")
        print(f"  Total results: {results.total}")
        print(f"  Returned items: {len(results.itemSummaries)}")
        
        if results.itemSummaries:
            print("\n  Sample listings:")
            for i, item in enumerate(results.itemSummaries[:3], 1):
                price_str = f"${item.price.value} {item.price.currency}" if item.price else "N/A"
                print(f"  {i}. {item.title[:60]}...")
                print(f"     Price: {price_str}")
                print(f"     Item ID: {item.itemId}")
        
        # Test 2: Sports card specific search
        print("\n" + "-" * 60)
        print("Test 2: Sports Card Search - 'Chrome Baseball'")
        print("-" * 60)
        
        results = await ebay_service.search_sports_cards(
            card_name="Chrome Baseball",
            year="2023",
            brand="Topps",
            limit=5,
            min_price=5.0,
            max_price=50.0
        )
        
        print(f"✓ Sports card search successful!")
        print(f"  Total results: {results.total}")
        print(f"  Returned items: {len(results.itemSummaries)}")
        
        if results.itemSummaries:
            print("\n  Sample listings:")
            for i, item in enumerate(results.itemSummaries[:3], 1):
                price_str = f"${item.price.value} {item.price.currency}" if item.price else "N/A"
                print(f"  {i}. {item.title[:60]}...")
                print(f"     Price: {price_str}")
                if item.condition:
                    print(f"     Condition: {item.condition}")
        
        # Test 3: Get item details (if we have an item)
        if results.itemSummaries:
            print("\n" + "-" * 60)
            print("Test 3: Get Item Details")
            print("-" * 60)
            
            item_id = results.itemSummaries[0].itemId
            print(f"  Fetching details for item: {item_id}")
            
            try:
                item_details = await ebay_service.get_item(item_id)
                print(f"✓ Item details retrieved successfully!")
                print(f"  Title: {item_details.get('title', 'N/A')[:60]}...")
                if 'price' in item_details:
                    print(f"  Price: ${item_details['price'].get('value', 'N/A')} {item_details['price'].get('currency', '')}")
            except Exception as e:
                print(f"⚠ Could not fetch item details: {str(e)}")
        
        print("\n" + "=" * 60)
        print("✓ All tests completed successfully!")
        print("=" * 60)
        
        return True
        
    except Exception as e:
        print(f"\n❌ Error during testing: {str(e)}")
        import traceback
        traceback.print_exc()
        return False
        
    finally:
        await ebay_service.close()


async def main():
    """Main test function"""
    success = await test_ebay_service()
    
    if success:
        print("\n✓ eBay integration is working correctly!")
        print("\nAvailable API endpoints:")
        print("  GET  /ebay/health - Check configuration status")
        print("  GET  /ebay/search?q=<query> - Search for items")
        print("  POST /ebay/search - Search with detailed parameters")
        print("  POST /ebay/search/sports-cards - Search sports cards")
        print("  GET  /ebay/item/{item_id} - Get item details")
    else:
        print("\n❌ eBay integration test failed")
        print("Please check your EBAY_ACCESS_TOKEN configuration")


if __name__ == "__main__":
    asyncio.run(main())
