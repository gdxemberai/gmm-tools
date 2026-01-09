# eBay API Integration

## Overview
Integration with eBay Browse API to search and fetch sports card listings.

## Configuration
Add to `backend/.env`:
```
EBAY_ACCESS_TOKEN=your_token_here
```

## API Endpoints

### Health Check
```
GET /ebay/health
```

### Search Items
```
GET /ebay/search?q=2023%20Topps%20Baseball&limit=50
POST /ebay/search
{
  "query": "2023 Topps Baseball",
  "limit": 50,
  "sort": "price"
}
```

### Search Sports Cards
```
POST /ebay/search/sports-cards
{
  "card_name": "Chrome Baseball",
  "year": "2023",
  "brand": "Topps",
  "player": "Ronald Acuna Jr",
  "min_price": 10.0,
  "max_price": 100.0
}
```

### Get Item Details
```
GET /ebay/item/{item_id}
```

## Response Data
Each listing includes:
- `itemId` - eBay item ID
- `title` - Listing title
- `price` - Price with currency
- `itemWebUrl` - Link to listing
- `image` - Image URL
- `condition` - Item condition
- `seller` - Seller information
- `shippingOptions` - Shipping details
- `itemLocation` - Location

## Testing
```bash
cd backend
python test_ebay_integration.py
```

## Usage Example
```python
from app.services.ebay_service import get_ebay_service

ebay = get_ebay_service()
results = await ebay.search_sports_cards(
    card_name="Chrome Baseball",
    year="2023",
    limit=20
)
```
