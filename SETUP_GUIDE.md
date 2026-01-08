# Sports Card Arbitrage Tool - Complete Setup Guide

Welcome to the Sports Card Arbitrage Tool! This guide will walk you through setting up the complete application stack, from prerequisites to running your first analysis.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Detailed Setup](#detailed-setup)
4. [Running the Application](#running-the-application)
5. [Testing the System](#testing-the-system)
6. [Troubleshooting](#troubleshooting)
7. [Project Structure](#project-structure)
8. [API Documentation](#api-documentation)

---

## Prerequisites

Before you begin, ensure you have the following installed on your system:

### Required Software

- **Docker Desktop** (v20.10+)
  - macOS: [Download Docker Desktop for Mac](https://www.docker.com/products/docker-desktop)
  - Linux: [Install Docker Engine](https://docs.docker.com/engine/install/)
  - Windows: [Download Docker Desktop for Windows](https://www.docker.com/products/docker-desktop) (WSL2 required)

- **Python** (3.11 or higher)
  - Check version: `python3 --version`
  - macOS: `brew install python@3.11` or download from [python.org](https://www.python.org/downloads/)
  - Linux: `sudo apt-get install python3.11` (Ubuntu/Debian)
  - Windows: Download from [python.org](https://www.python.org/downloads/)

- **Node.js** (18.0 or higher) and npm
  - Check version: `node --version` and `npm --version`
  - macOS: `brew install node` or download from [nodejs.org](https://nodejs.org/)
  - Linux: Use [NodeSource](https://github.com/nodesource/distributions) or [nvm](https://github.com/nvm-sh/nvm)
  - Windows: Download from [nodejs.org](https://nodejs.org/)

- **Git** (for version control)
  - Check version: `git --version`

### Required API Keys

- **OpenAI API Key** (required for card analysis)
  - Sign up at [OpenAI Platform](https://platform.openai.com/)
  - Create an API key at [API Keys page](https://platform.openai.com/api-keys)
  - You'll need this during backend setup

### System Requirements

- **RAM**: 4GB minimum, 8GB recommended
- **Disk Space**: 2GB free space
- **OS**: macOS 10.15+, Ubuntu 20.04+, Windows 10+ with WSL2

---

## Quick Start

For experienced developers who want to get up and running quickly:

```bash
# 1. Start Docker services
./docker-start.sh

# 2. Set up backend
cd backend
./setup.sh
cd ..

# 3. Initialize database
cd backend
source venv/bin/activate  # On Windows: venv\Scripts\activate
python init_db.py
python seed_db.py
cd ..

# 4. Set up frontend
cd frontend
npm install
cd ..

# 5. Start everything
./start.sh
```

Then visit:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

---

## Detailed Setup

### Step 1: Clone and Navigate to Project

```bash
# If you haven't cloned the repository yet
git clone <repository-url>
cd GMM
```

### Step 2: Start Docker Services

The application requires PostgreSQL and Redis running in Docker containers.

#### Option A: Using the automated script (recommended)

```bash
chmod +x docker-start.sh
./docker-start.sh
```

#### Option B: Manual Docker setup

```bash
# Start Docker services
docker-compose up -d

# Verify services are running
docker-compose ps

# Check health status
docker-compose logs postgres
docker-compose logs redis
```

**Expected Output:**
```
✓ Docker is running
✓ Starting Docker services...
✓ Waiting for PostgreSQL to be healthy...
✓ Waiting for Redis to be healthy...
✓ All Docker services are healthy!

Services Status:
  - PostgreSQL: Running on port 5432
  - Redis: Running on port 6379
```

### Step 3: Backend Setup

#### Option A: Using the automated script (recommended)

```bash
cd backend
chmod +x setup.sh
./setup.sh
cd ..
```

The script will:
- Create a Python virtual environment
- Install all dependencies
- Set up your `.env` file
- Prompt for your OpenAI API key

#### Option B: Manual backend setup

```bash
cd backend

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate  # On macOS/Linux
# OR
venv\Scripts\activate     # On Windows

# Install dependencies
pip install -r requirements.txt

# Create .env file from example
cp .env.example .env

# Edit .env and add your OpenAI API key
# Use your preferred editor (nano, vim, code, etc.)
nano .env
```

**Edit the `.env` file** and replace `your_api_key_here` with your actual OpenAI API key:

```env
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxx
DATABASE_URL=postgresql+asyncpg://admin:admin123@localhost:5432/sports_cards
REDIS_URL=redis://localhost:6379
REDIS_TTL=3600
ENVIRONMENT=development
LOG_LEVEL=INFO
```

### Step 4: Initialize Database

With your backend virtual environment activated:

```bash
cd backend
source venv/bin/activate  # Skip if already activated

# Create database tables and extensions
python init_db.py

# Seed database with sample data
python seed_db.py

cd ..
```

**Expected Output:**
```
INFO - Initializing database...
INFO - Creating pg_trgm extension...
INFO - Creating tables...
INFO - ✓ Database initialized successfully
INFO - Seeding database with sample sales data...
INFO - ✓ Inserted 150 sales records
INFO - ✓ Database seeded successfully
```

### Step 5: Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

cd ..
```

**Expected Output:**
```
added 245 packages, and audited 246 packages in 15s
```

### Step 6: Verify Setup

Run the verification script to ensure everything is configured correctly:

```bash
# Make script executable
chmod +x verify_setup.py

# Run verification
python3 verify_setup.py
```

**Expected Output:**
```
🔍 Sports Card Arbitrage Tool - Setup Verification
================================================

✓ Docker is running
✓ PostgreSQL container is running
✓ Redis container is running
✓ Database connection successful
✓ pg_trgm extension is installed
✓ Redis connection successful
✓ Backend .env file exists
✓ OPENAI_API_KEY is set
✓ Frontend node_modules exists

================================================
✅ All checks passed! Your setup is complete.
================================================
```

---

## Running the Application

### Option A: Using the Complete Startup Script (Recommended)

The easiest way to start everything:

```bash
chmod +x start.sh
./start.sh
```

This script will:
1. Start Docker services (if not running)
2. Initialize database (if needed)
3. Start the backend server
4. Start the frontend dev server
5. Display all service URLs

**Press `Ctrl+C` to stop all services gracefully.**

### Option B: Manual Startup

If you prefer to run services separately:

#### Terminal 1 - Backend Server

```bash
cd backend
source venv/bin/activate  # On Windows: venv\Scripts\activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Terminal 2 - Frontend Dev Server

```bash
cd frontend
npm run dev
```

### Accessing the Application

Once all services are running:

- **Frontend Application**: http://localhost:3000
  - Main interface for analyzing card listings
  
- **Backend API**: http://localhost:8000
  - Root endpoint with API information
  
- **Interactive API Documentation**: http://localhost:8000/docs
  - Swagger UI for testing API endpoints
  
- **Alternative API Docs**: http://localhost:8000/redoc
  - ReDoc documentation interface

---

## Testing the System

### 1. Health Check

Visit http://localhost:8000/health to verify the backend is running:

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

### 2. Test Card Analysis

#### Using the Frontend (Recommended)

1. Open http://localhost:3000
2. Enter a card listing title, for example:
   ```
   2018 Panini Prizm Luka Doncic Rookie PSA 10
   ```
3. Enter a listing price (e.g., `150.00`)
4. Click "Analyze Listing"
5. View the analysis results

#### Using the API Documentation

1. Open http://localhost:8000/docs
2. Expand the `POST /analyze` endpoint
3. Click "Try it out"
4. Enter test data:
   ```json
   {
     "title": "2018 Panini Prizm Luka Doncic Rookie PSA 10",
     "listing_price": 150.00
   }
   ```
5. Click "Execute"
6. View the response

#### Using curl

```bash
curl -X POST "http://localhost:8000/analyze" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "2018 Panini Prizm Luka Doncic Rookie PSA 10",
    "listing_price": 150.00
  }'
```

**Expected Response:**
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

### 3. Verify Caching

Run the same analysis twice - the second request should be much faster and return `"cached": true`.

### 4. Check Database

```bash
# Connect to PostgreSQL
docker exec -it gmm-postgres psql -U admin -d sports_cards

# Run a query
SELECT COUNT(*) FROM sales_history;

# Exit
\q
```

### 5. Check Redis Cache

```bash
# Connect to Redis
docker exec -it gmm-redis redis-cli

# Check keys
KEYS *

# Exit
exit
```

---

## Troubleshooting

### Docker Issues

#### Problem: "Cannot connect to Docker daemon"

**Solution:**
```bash
# macOS/Windows: Start Docker Desktop application
# Linux: Start Docker service
sudo systemctl start docker
```

#### Problem: Port already in use (5432 or 6379)

**Solution:**
```bash
# Find process using the port
lsof -i :5432  # macOS/Linux
netstat -ano | findstr :5432  # Windows

# Stop the conflicting service or change ports in docker-compose.yml
```

#### Problem: Docker containers won't start

**Solution:**
```bash
# Stop all containers
docker-compose down

# Remove volumes (WARNING: deletes data)
docker-compose down -v

# Rebuild and start
docker-compose up -d --build
```

### Backend Issues

#### Problem: "ModuleNotFoundError" when running backend

**Solution:**
```bash
# Ensure virtual environment is activated
source venv/bin/activate  # macOS/Linux
venv\Scripts\activate     # Windows

# Reinstall dependencies
pip install -r requirements.txt
```

#### Problem: "OPENAI_API_KEY not set" warning

**Solution:**
```bash
# Check .env file exists
ls -la .env

# Verify OPENAI_API_KEY is set
cat .env | grep OPENAI_API_KEY

# If missing, edit .env and add your key
nano .env
```

#### Problem: Database connection fails

**Solution:**
```bash
# Verify PostgreSQL is running
docker-compose ps postgres

# Check PostgreSQL logs
docker-compose logs postgres

# Restart PostgreSQL
docker-compose restart postgres

# Verify connection string in .env
cat .env | grep DATABASE_URL
```

#### Problem: "pg_trgm extension not found"

**Solution:**
```bash
cd backend
source venv/bin/activate
python init_db.py  # Re-run initialization
```

### Frontend Issues

#### Problem: "Cannot connect to backend"

**Solution:**
1. Verify backend is running: http://localhost:8000/health
2. Check CORS settings in [`backend/app/main.py`](backend/app/main.py:69)
3. Verify API URL in [`frontend/lib/api.ts`](frontend/lib/api.ts)

#### Problem: npm install fails

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

#### Problem: Port 3000 already in use

**Solution:**
```bash
# Use a different port
PORT=3001 npm run dev

# Or kill the process using port 3000
lsof -i :3000  # Find PID
kill -9 <PID>  # Kill process
```

### Analysis Issues

#### Problem: Analysis returns "No comparable sales found"

**Explanation:** This is normal if the database doesn't have matching cards.

**Solution:**
```bash
# Add more sample data
cd backend
source venv/bin/activate
python seed_db.py  # Adds more sample data
```

#### Problem: OpenAI API errors

**Solution:**
1. Verify API key is valid: https://platform.openai.com/api-keys
2. Check API quota/billing: https://platform.openai.com/usage
3. Review backend logs for specific error messages

### General Issues

#### Problem: "Permission denied" when running scripts

**Solution:**
```bash
# Make scripts executable
chmod +x docker-start.sh
chmod +x start.sh
chmod +x verify_setup.py
chmod +x backend/setup.sh
```

#### Problem: Need to reset everything

**Solution:**
```bash
# Stop all services
docker-compose down -v

# Remove virtual environment
rm -rf backend/venv

# Remove node_modules
rm -rf frontend/node_modules

# Start fresh with Quick Start guide
```

---

## Project Structure

```
GMM/
├── backend/                    # FastAPI backend application
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py            # FastAPI app entry point
│   │   ├── database.py        # Database connection & session
│   │   ├── redis_client.py    # Redis connection & caching
│   │   ├── init_db.py         # Database initialization script
│   │   ├── api/               # API endpoints
│   │   │   ├── health.py      # Health check endpoint
│   │   │   └── analyze.py     # Card analysis endpoint
│   │   ├── models/            # SQLAlchemy models
│   │   │   └── sales_history.py
│   │   ├── services/          # Business logic
│   │   │   ├── openai_service.py    # OpenAI integration
│   │   │   └── pricing_service.py   # Pricing algorithms
│   │   └── utils/             # Utility functions
│   │       └── slugify.py     # Text normalization
│   ├── requirements.txt       # Python dependencies
│   ├── .env.example          # Environment variables template
│   ├── setup.sh              # Backend setup script
│   ├── seed_db.py            # Database seeding script
│   └── dummy_sales_data.json # Sample sales data
│
├── frontend/                  # Next.js frontend application
│   ├── app/
│   │   ├── layout.tsx        # Root layout
│   │   ├── page.tsx          # Home page (analysis UI)
│   │   └── globals.css       # Global styles
│   ├── lib/
│   │   └── api.ts            # API client functions
│   ├── types/
│   │   └── analysis.ts       # TypeScript type definitions
│   ├── package.json          # Node.js dependencies
│   └── next.config.ts        # Next.js configuration
│
├── docker-compose.yml         # Docker services configuration
├── docker-start.sh           # Docker startup script
├── start.sh                  # Complete application startup
├── verify_setup.py           # Setup verification script
├── SETUP_GUIDE.md           # This file
└── README.md                # Project overview
```

### Key Files Explained

- **[`backend/app/main.py`](backend/app/main.py)**: FastAPI application with CORS, lifespan events, and route registration
- **[`backend/app/api/analyze.py`](backend/app/api/analyze.py)**: Complete analysis pipeline (cache → parse → price → verdict)
- **[`backend/app/services/openai_service.py`](backend/app/services/openai_service.py)**: OpenAI GPT-4 integration for parsing card titles
- **[`backend/app/services/pricing_service.py`](backend/app/services/pricing_service.py)**: Pricing algorithms with tier-based matching
- **[`backend/app/database.py`](backend/app/database.py)**: SQLAlchemy async engine and session management
- **[`backend/app/redis_client.py`](backend/app/redis_client.py)**: Redis caching with JSON serialization
- **[`frontend/app/page.tsx`](frontend/app/page.tsx)**: Main UI for card analysis
- **[`frontend/lib/api.ts`](frontend/lib/api.ts)**: API client with type-safe requests
- **[`docker-compose.yml`](docker-compose.yml)**: PostgreSQL and Redis service definitions

---

## API Documentation

### Endpoints

#### `GET /`
Root endpoint with API information.

**Response:**
```json
{
  "message": "Welcome to Sports Card Arbitrage Tool API",
  "version": "1.0.0",
  "endpoints": {
    "health": "/health",
    "analyze": "/analyze",
    "docs": "/docs"
  }
}
```

#### `GET /health`
Health check endpoint.

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

#### `POST /analyze`
Analyze a sports card listing.

**Request Body:**
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
- `GOOD DEAL` - Listing price is 10%+ below estimated value
- `FAIR PRICE` - Listing price is within ±10% of estimated value
- `OVERPRICED` - Listing price is 10%+ above estimated value
- `INSUFFICIENT DATA` - Not enough sales data to estimate value

**Match Tiers:**
- `exact` - Exact match on all fields (player, brand, year, grade, grader)
- `fuzzy` - Fuzzy match using trigram similarity
- `none` - No comparable sales found

### Interactive Documentation

Visit http://localhost:8000/docs for full interactive API documentation with:
- Request/response schemas
- Try-it-out functionality
- Authentication details
- Error responses

---

## Development Workflow

### Making Changes

1. **Backend Changes:**
   ```bash
   cd backend
   source venv/bin/activate
   # Make your changes
   # Backend auto-reloads with --reload flag
   ```

2. **Frontend Changes:**
   ```bash
   cd frontend
   # Make your changes
   # Frontend auto-reloads with npm run dev
   ```

3. **Database Schema Changes:**
   ```bash
   cd backend
   source venv/bin/activate
   # Modify models in app/models/
   # Re-run initialization
   python init_db.py
   ```

### Viewing Logs

```bash
# Backend logs (if running with start.sh)
tail -f backend.log

# Docker service logs
docker-compose logs -f postgres
docker-compose logs -f redis

# Frontend logs (visible in terminal)
```

### Stopping Services

```bash
# If using start.sh
Press Ctrl+C

# Manual shutdown
# Stop backend: Ctrl+C in backend terminal
# Stop frontend: Ctrl+C in frontend terminal
# Stop Docker services:
docker-compose down
```

---

## Next Steps

Now that your setup is complete:

1. **Explore the UI**: Visit http://localhost:3000 and try analyzing different card listings
2. **Review the API**: Check out http://localhost:8000/docs to understand all endpoints
3. **Examine the Code**: Look through the project structure to understand the architecture
4. **Add More Data**: Run `python seed_db.py` multiple times to add more sample sales
5. **Customize**: Modify the pricing algorithms, add new features, or enhance the UI

---

## Getting Help

- **Documentation**: Review this guide and the README files in each directory
- **API Docs**: http://localhost:8000/docs for endpoint details
- **Logs**: Check backend and Docker logs for error messages
- **Verification**: Run `python3 verify_setup.py` to diagnose issues

---

**Happy analyzing! 🏀⚾🏈**
