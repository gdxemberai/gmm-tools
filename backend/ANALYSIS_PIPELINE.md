# Sports Card Arbitrage Tool - Analysis Pipeline

## Overview

The analysis pipeline is a complete FastAPI backend system that analyzes eBay sports card listings to determine if they represent good arbitrage opportunities. It combines OpenAI GPT-4o-mini for intelligent parsing, PostgreSQL for historical sales data, and Redis for caching.

## Architecture

### Pipeline Flow

```
1. Client Request → POST /analyze
   ├─ Input: { title: string, listing_price: float }
   │
2. Redis Cache Check
   ├─ Cache HIT → Return cached result (recalculate profit/loss)
   └─ Cache MISS → Continue to parsing
   │
3. OpenAI Parsing (GPT-4o-mini)
   ├─ Load comprehensive_prompt.md
   ├─ Parse listing title
   └─ Extract structured card data
   │
4. Slugify Fields
   ├─ player_name → player_id
   ├─ brand → brand_id
   └─ variation → variation_id
   │
5. Database Query (Tiered Matching)
   ├─ Tier 1: Exact Match
   │   └─ Match: player_id, brand_id, variation_id, grade, grader
   │
   └─ Tier 2: Fuzzy Match (if Tier 1 fails)
       └─ Use pg_trgm similarity on player_id + brand_id + year
   │
6. Pricing Calculation (Sanity Average)
   ├─ < 3 sales: Simple average
   └─ >= 3 sales: Drop highest/lowest, average rest
   │
7. Cache Result (TTL: 1 hour)
   │
8. Calculate Profit/Loss & Verdict
   └─ Return complete analysis
```

## Components

### 1. Redis Client (`app/redis_client.py`)

**Purpose:** Caching layer to reduce OpenAI API calls and database queries.

**Key Functions:**
- `init_redis()` - Initialize Redis connection pool
- `get_cached_value(key)` - Retrieve cached analysis
- `set_cached_value(key, value, ttl)` - Store analysis result
- `generate_cache_key(prefix, identifier)` - Create consistent cache keys

**Configuration:**
- Host: localhost
- Port: 6379
- Default TTL: 3600 seconds (1 hour)

### 2. OpenAI Service (`app/services/openai_service.py`)

**Purpose:** Parse unstructured eBay listing titles into structured card data.

**Key Functions:**
- `init_openai(api_key)` - Initialize OpenAI client
- `parse_listing_title(title)` - Parse single title
- `parse_listing_title_with_retry(title, max_retries)` - Parse with retry logic
- `load_comprehensive_prompt()` - Load parsing instructions

**Parsed Fields:**
```python
{
    "player_name": str,
    "year": int | None,
    "brand": str,
    "card_number": str | None,
    "card_type": str | None,
    "variation": str | None,
    "serial_numbered": int | None,
    "is_rookie": bool,
    "is_prospect": bool,
    "is_first_bowman": bool,
    "is_autograph": bool,
    "has_patch": bool,
    "is_graded": bool,
    "grading_company": str | None,
    "grade": float | None,
    "has_perfect_subgrade": bool,
    "is_reprint": bool,
    "is_redemption": bool,
    "sport": str | None,
    "confidence": str,
    "warnings": list[str]
}
```

### 3. Pricing Service (`app/services/pricing_service.py`)

**Purpose:** Calculate estimated market value using historical sales data.

**Key Functions:**
- `get_estimated_value()` - Main pricing function with tiered matching
- `query_tier1_exact_match()` - Exact match query
- `query_tier2_fuzzy_match()` - Fuzzy match using pg_trgm
- `calculate_sanity_average(prices)` - Outlier-resistant averaging
- `calculate_profit_loss()` - Generate verdict

**Matching Tiers:**

**Tier 1 (Exact Match):**
- player_id = exact
- brand_id = exact
- variation_id = exact
- grade = exact (if provided)
- grader = exact (if provided)

**Tier 2 (Fuzzy Match):**
- player_id ~ similarity (pg_trgm)
- brand_id = exact
- year = exact (if provided)

**Sanity Average Algorithm:**
```python
if len(prices) < 3:
    return average(prices)
else:
    sorted_prices = sort(prices)
    trimmed = sorted_prices[1:-1]  # Remove highest and lowest
    return average(trimmed)
```

### 4. Analyze Endpoint (`app/api/analyze.py`)

**Purpose:** Main API endpoint orchestrating the complete pipeline.

**Endpoint:** `POST /analyze`

**Request:**
```json
{
    "title": "2023 Topps Chrome Victor Wembanyama PSA 10",
    "listing_price": 150.00
}
```

**Response:**
```json
{
    "parsed_data": {
        "player_name": "Victor Wembanyama",
        "year": 2023,
        "brand": "Topps Chrome",
        "variation": "Base",
        "is_graded": true,
        "grading_company": "PSA",
        "grade": 10.0,
        ...
    },
    "estimated_value": 200.00,
    "profit_loss": 50.00,
    "verdict": "GOOD DEAL - Potential profit: $50.00",
    "match_tier": "exact",
    "sales_count": 8,
    "cached": false
}
```

**Verdicts:**
- `GOOD DEAL - Potential profit: $X.XX` - Listing price < estimated value
- `OVERPRICED - Potential loss: $X.XX` - Listing price > estimated value
- `FAIR PRICE - Listing matches market value` - Listing price = estimated value
- `INSUFFICIENT DATA - No comparable sales found` - No matches in database

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and set:
```bash
OPENAI_API_KEY=your_actual_api_key_here
DATABASE_URL=postgresql+asyncpg://admin:admin123@localhost:5432/sports_cards
REDIS_URL=redis://localhost:6379
REDIS_TTL=3600
```

### 3. Start Required Services

**PostgreSQL:**
```bash
# Using Docker Compose (recommended)
docker-compose up -d postgres

# Or start manually on port 5432
```

**Redis:**
```bash
# Using Docker Compose (recommended)
docker-compose up -d redis

# Or start manually on port 6379
redis-server
```

### 4. Initialize Database

```bash
# Create tables and enable pg_trgm extension
python -m app.init_db

# Seed with dummy data (optional)
python seed_db.py
```

### 5. Start FastAPI Server

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## API Documentation

Once the server is running, access:
- **Interactive API Docs:** http://localhost:8000/docs
- **Alternative Docs:** http://localhost:8000/redoc
- **Health Check:** http://localhost:8000/health

## Testing the Pipeline

### Example 1: Exact Match

```bash
curl -X POST "http://localhost:8000/analyze" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "2023 Topps Chrome Victor Wembanyama PSA 10",
    "listing_price": 150.00
  }'
```

### Example 2: Fuzzy Match

```bash
curl -X POST "http://localhost:8000/analyze" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "2023 Bowman Chrome 1st Ethan Salas Auto Shimmer /75",
    "listing_price": 200.00
  }'
```

### Example 3: Cached Result

```bash
# First request - parses with OpenAI
curl -X POST "http://localhost:8000/analyze" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "2022 Panini Prizm Ja Morant Silver PSA 10",
    "listing_price": 100.00
  }'

# Second request - returns from cache (cached: true)
curl -X POST "http://localhost:8000/analyze" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "2022 Panini Prizm Ja Morant Silver PSA 10",
    "listing_price": 120.00
  }'
```

## Error Handling

The pipeline includes comprehensive error handling:

1. **OpenAI Failures:** Retry logic with exponential backoff
2. **Database Errors:** Graceful fallback to fuzzy matching
3. **Redis Failures:** Continue without caching (log warning)
4. **Validation Errors:** Return 400 Bad Request with details
5. **Server Errors:** Return 500 Internal Server Error with message

## Performance Considerations

### Caching Strategy
- **Cache Key:** MD5 hash of listing title
- **TTL:** 1 hour (configurable via REDIS_TTL)
- **Cache Hit Rate:** Expected 60-80% for popular cards

### Database Optimization
- **Indexes:** player_id, brand_id, year, sold_at, grader+grade
- **pg_trgm Index:** GIN index on player_id for fuzzy matching
- **Query Limit:** Maximum 10 sales per query

### OpenAI Rate Limits
- **Model:** gpt-4o-mini (fast, cost-effective)
- **Temperature:** 0.1 (consistent parsing)
- **Max Tokens:** 1000
- **Retry Logic:** 2 retries with exponential backoff

## Monitoring & Logging

All components include structured logging:

```python
logger.info("Cache HIT for title: {title}")
logger.info("Tier 1 exact match: Found {count} sales")
logger.warning("No matches found for {player_id}")
logger.error("OpenAI API call failed: {error}")
```

View logs in real-time:
```bash
tail -f logs/app.log
```

## Troubleshooting

### Issue: "OpenAI client not initialized"
**Solution:** Ensure OPENAI_API_KEY is set in `.env`

### Issue: "Redis connection failed"
**Solution:** Start Redis server: `redis-server` or `docker-compose up redis`

### Issue: "Database connection failed"
**Solution:** Check PostgreSQL is running and credentials are correct

### Issue: "No comparable sales found"
**Solution:** Seed database with dummy data: `python seed_db.py`

### Issue: "pg_trgm extension not found"
**Solution:** Run `python -m app.init_db` to enable extension

## Next Steps

1. **Frontend Integration:** Connect Next.js frontend to `/analyze` endpoint
2. **Authentication:** Add API key authentication for production
3. **Rate Limiting:** Implement rate limiting to prevent abuse
4. **Monitoring:** Set up Prometheus/Grafana for metrics
5. **Testing:** Add unit tests and integration tests
6. **Deployment:** Deploy to production with Docker/Kubernetes

## File Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                    # FastAPI app with lifespan events
│   ├── database.py                # Database configuration
│   ├── redis_client.py            # Redis client and utilities
│   ├── api/
│   │   ├── __init__.py
│   │   ├── analyze.py             # Analysis endpoint
│   │   └── health.py              # Health check endpoint
│   ├── models/
│   │   ├── __init__.py
│   │   └── sales_history.py       # SalesHistory model
│   ├── services/
│   │   ├── __init__.py
│   │   ├── openai_service.py      # OpenAI parsing service
│   │   └── pricing_service.py     # Pricing calculation service
│   └── utils/
│       ├── __init__.py
│       └── slugify.py             # Slugification utility
├── comprehensive_prompt.md        # OpenAI parsing instructions
├── requirements.txt               # Python dependencies
├── .env.example                   # Environment variables template
└── ANALYSIS_PIPELINE.md          # This file
```

## License

MIT License - See LICENSE file for details
