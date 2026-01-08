# Sports Card Arbitrage Tool

> **AI-powered sports card listing analyzer that identifies arbitrage opportunities by comparing listing prices against historical sales data.**

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115.6-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Next.js-16.1.1-000000?logo=next.js)](https://nextjs.org/)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python)](https://www.python.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?logo=typescript)](https://www.typescriptlang.org/)

---

## 🎯 Overview

The Sports Card Arbitrage Tool helps collectors and resellers identify undervalued sports card listings by:

1. **Parsing** listing titles using OpenAI GPT-4 to extract structured card data
2. **Matching** against a database of historical sales using intelligent tier-based algorithms
3. **Analyzing** pricing to calculate potential profit/loss
4. **Caching** results in Redis for lightning-fast repeat queries

**Perfect for:** eBay sellers, card collectors, arbitrage traders, and sports memorabilia enthusiasts.

---

## ✨ Features

### 🤖 AI-Powered Parsing
- Extracts player name, brand, year, variation, grade, and grading company from free-form listing titles
- Handles complex titles with multiple variations and special editions
- Powered by OpenAI GPT-4 with structured output

### 📊 Intelligent Pricing Analysis
- **Tier 1 (Exact Match)**: Precise matching on all card attributes
- **Tier 2 (Fuzzy Match)**: PostgreSQL trigram similarity for partial matches
- **Sanity Average Algorithm**: Outlier-resistant pricing using IQR filtering
- Real-time profit/loss calculation with clear verdicts

### ⚡ High Performance
- Redis caching for instant repeat queries
- Async/await architecture throughout
- PostgreSQL with optimized indexes
- Sub-second response times

### 🎨 Modern UI
- Clean, responsive Next.js interface
- Real-time analysis feedback
- Color-coded verdicts (Good Deal, Fair Price, Overpriced)
- Mobile-friendly design

---

## 🏗️ Architecture

```
┌─────────────────┐
│   Next.js UI    │  ← User enters listing title & price
│  (Port 3000)    │
└────────┬────────┘
         │ HTTP POST /analyze
         ▼
┌─────────────────┐
│  FastAPI Backend│  ← Orchestrates analysis pipeline
│  (Port 8000)    │
└────────┬────────┘
         │
    ┌────┴────┬──────────┬──────────┐
    ▼         ▼          ▼          ▼
┌────────┐ ┌─────┐  ┌──────────┐ ┌────────┐
│ Redis  │ │ GPT │  │PostgreSQL│ │Pricing │
│ Cache  │ │  4  │  │ Database │ │Service │
└────────┘ └─────┘  └──────────┘ └────────┘
```

### Analysis Pipeline

```
1. Check Redis Cache
   ├─ HIT  → Return cached result (recalculate P/L)
   └─ MISS → Continue to step 2

2. Parse Title with OpenAI
   └─ Extract: player, brand, year, variation, grade, grader

3. Slugify Fields
   └─ Normalize text for database queries

4. Query Database (Tier-based)
   ├─ Tier 1: Exact match on all fields
   └─ Tier 2: Fuzzy match using pg_trgm

5. Calculate Estimated Value
   └─ Sanity average algorithm (IQR filtering)

6. Cache Result in Redis
   └─ TTL: 1 hour (configurable)

7. Calculate Profit/Loss & Verdict
   └─ Return complete analysis
```

---

## 🚀 Quick Start

### Prerequisites

- **Docker Desktop** (for PostgreSQL & Redis)
- **Python 3.11+** (for backend)
- **Node.js 18+** (for frontend)
- **OpenAI API Key** ([Get one here](https://platform.openai.com/api-keys))

### Installation

```bash
# 1. Clone the repository
git clone <repository-url>
cd GMM

# 2. Start Docker services
chmod +x docker-start.sh
./docker-start.sh

# 3. Set up backend
cd backend
chmod +x setup.sh
./setup.sh
cd ..

# 4. Initialize database
cd backend
source venv/bin/activate  # Windows: venv\Scripts\activate
python init_db.py
python seed_db.py
cd ..

# 5. Set up frontend
cd frontend
npm install
cd ..

# 6. Verify setup
chmod +x verify_setup.py
python3 verify_setup.py

# 7. Start everything
chmod +x start.sh
./start.sh
```

### Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

📖 **For detailed setup instructions, see [`SETUP_GUIDE.md`](SETUP_GUIDE.md)**

---

## 🛠️ Tech Stack

### Backend
- **[FastAPI](https://fastapi.tiangolo.com/)** - Modern Python web framework
- **[SQLAlchemy](https://www.sqlalchemy.org/)** - Async ORM with PostgreSQL
- **[OpenAI API](https://platform.openai.com/)** - GPT-4 for title parsing
- **[Redis](https://redis.io/)** - High-performance caching
- **[Pydantic](https://docs.pydantic.dev/)** - Data validation
- **[Uvicorn](https://www.uvicorn.org/)** - ASGI server

### Frontend
- **[Next.js 16](https://nextjs.org/)** - React framework with App Router
- **[React 19](https://react.dev/)** - UI library
- **[TypeScript](https://www.typescriptlang.org/)** - Type safety
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first styling
- **[Turbopack](https://turbo.build/pack)** - Fast bundler

### Infrastructure
- **[PostgreSQL 15](https://www.postgresql.org/)** - Relational database with pg_trgm
- **[Redis 7](https://redis.io/)** - In-memory cache
- **[Docker Compose](https://docs.docker.com/compose/)** - Container orchestration

---

## 📡 API Endpoints

### `GET /`
Root endpoint with API information.

### `GET /health`
Health check for all services (database, Redis, OpenAI).

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-01-08T10:00:00Z",
  "services": {
    "database": "connected",
    "redis": "connected",
    "openai": "configured"
  }
}
```

### `POST /analyze`
Analyze a sports card listing.

**Request:**
```json
{
  "title": "2018 Panini Prizm Luka Doncic Rookie PSA 10",
  "listing_price": 150.00
}
```

**Response:**
```json
{
  "parsed_data": {
    "player_name": "Luka Doncic",
    "brand": "Panini Prizm",
    "year": 2018,
    "variation": "Base",
    "grade": 10,
    "grading_company": "PSA"
  },
  "estimated_value": 175.50,
  "profit_loss": 25.50,
  "verdict": "GOOD DEAL - Potential profit of $25.50",
  "match_tier": "exact",
  "sales_count": 15,
  "cached": false
}
```

**Verdict Types:**
- `GOOD DEAL` - 10%+ below market value
- `FAIR PRICE` - Within ±10% of market value
- `OVERPRICED` - 10%+ above market value
- `INSUFFICIENT DATA` - Not enough sales data

**Interactive Docs:** http://localhost:8000/docs

---

## 📁 Project Structure

```
GMM/
├── backend/                    # FastAPI backend
│   ├── app/
│   │   ├── main.py            # Application entry point
│   │   ├── database.py        # Database connection
│   │   ├── redis_client.py    # Redis caching
│   │   ├── api/               # API endpoints
│   │   │   ├── health.py      # Health checks
│   │   │   └── analyze.py     # Analysis pipeline
│   │   ├── models/            # SQLAlchemy models
│   │   │   └── sales_history.py
│   │   ├── services/          # Business logic
│   │   │   ├── openai_service.py
│   │   │   └── pricing_service.py
│   │   └── utils/             # Utilities
│   │       └── slugify.py
│   ├── init_db.py             # Database initialization
│   ├── seed_db.py             # Sample data seeding
│   ├── setup.sh               # Backend setup script
│   ├── requirements.txt       # Python dependencies
│   └── .env.example           # Environment template
│
├── frontend/                   # Next.js frontend
│   ├── app/
│   │   ├── page.tsx           # Main analysis UI
│   │   ├── layout.tsx         # Root layout
│   │   └── globals.css        # Global styles
│   ├── lib/
│   │   └── api.ts             # API client
│   ├── types/
│   │   └── analysis.ts        # TypeScript types
│   └── package.json           # Node dependencies
│
├── docker-compose.yml          # Docker services
├── docker-start.sh            # Docker startup script
├── start.sh                   # Complete startup script
├── verify_setup.py            # Setup verification
├── SETUP_GUIDE.md             # Detailed setup guide
└── README.md                  # This file
```

---

## 🔧 Development

### Running Services Individually

**Backend:**
```bash
cd backend
source venv/bin/activate  # Windows: venv\Scripts\activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Frontend:**
```bash
cd frontend
npm run dev
```

**Docker Services:**
```bash
docker-compose up -d
docker-compose logs -f  # View logs
docker-compose down     # Stop services
```

### Environment Variables

Backend (`.env`):
```env
OPENAI_API_KEY=sk-proj-xxxxx
DATABASE_URL=postgresql+asyncpg://admin:admin123@localhost:5432/sports_cards
REDIS_URL=redis://localhost:6379
REDIS_TTL=3600
ENVIRONMENT=development
LOG_LEVEL=INFO
```

### Database Management

```bash
# Connect to PostgreSQL
docker exec -it gmm-postgres psql -U admin -d sports_cards

# Run queries
SELECT COUNT(*) FROM sales_history;
SELECT * FROM sales_history WHERE player_id = 'luka-doncic' LIMIT 5;

# Exit
\q
```

### Redis Management

```bash
# Connect to Redis
docker exec -it gmm-redis redis-cli

# View cached keys
KEYS *

# Get cached value
GET "analysis:2018 Panini Prizm Luka Doncic Rookie PSA 10"

# Clear cache
FLUSHALL

# Exit
exit
```

---

## 🧪 Testing

### Manual Testing

1. **Health Check:**
   ```bash
   curl http://localhost:8000/health
   ```

2. **Analyze Listing:**
   ```bash
   curl -X POST "http://localhost:8000/analyze" \
     -H "Content-Type: application/json" \
     -d '{
       "title": "2018 Panini Prizm Luka Doncic Rookie PSA 10",
       "listing_price": 150.00
     }'
   ```

3. **Test Caching:**
   - Run the same analysis twice
   - Second request should return `"cached": true`

### Using the Interactive Docs

1. Visit http://localhost:8000/docs
2. Click "Try it out" on any endpoint
3. Enter test data and execute
4. View formatted responses

---

## 🐛 Troubleshooting

### Common Issues

**Docker not running:**
```bash
# macOS/Windows: Start Docker Desktop
# Linux: sudo systemctl start docker
```

**Port conflicts:**
```bash
# Check what's using a port
lsof -i :8000  # macOS/Linux
netstat -ano | findstr :8000  # Windows

# Change ports in docker-compose.yml or start commands
```

**Database connection fails:**
```bash
# Restart PostgreSQL
docker-compose restart postgres

# Check logs
docker-compose logs postgres
```

**OpenAI API errors:**
- Verify API key in `backend/.env`
- Check quota: https://platform.openai.com/usage
- Review backend logs for specific errors

**For more troubleshooting, see [`SETUP_GUIDE.md`](SETUP_GUIDE.md#troubleshooting)**

---

## 📊 Sample Data

The database includes sample sales data for popular cards:

- **Players**: Luka Doncic, Patrick Mahomes, Mike Trout, LeBron James, etc.
- **Brands**: Panini Prizm, Topps Chrome, Bowman, Select, etc.
- **Years**: 2018-2023
- **Grades**: PSA 9-10, BGS 9-9.5

Add more data:
```bash
cd backend
source venv/bin/activate
python seed_db.py  # Adds 150 more records each run
```

---

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run verification: `python3 verify_setup.py`
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Development Guidelines

- Follow existing code style and patterns
- Add type hints to Python code
- Use TypeScript for frontend code
- Update documentation for new features
- Test changes locally before submitting

---

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🙏 Acknowledgments

- **OpenAI** for GPT-4 API
- **FastAPI** for the excellent Python framework
- **Next.js** team for the React framework
- **PostgreSQL** for robust database features
- **Redis** for high-performance caching

---

## 📧 Support

- **Documentation**: [`SETUP_GUIDE.md`](SETUP_GUIDE.md)
- **API Docs**: http://localhost:8000/docs
- **Issues**: Open an issue on GitHub
- **Verification**: Run `python3 verify_setup.py`

---

**Built with ❤️ for sports card collectors and arbitrage traders**

🏀 ⚾ 🏈 🏒 ⚽
