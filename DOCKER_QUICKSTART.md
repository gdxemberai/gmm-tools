# Docker Quick Start Guide

> **The fastest way to run the Sports Card Arbitrage Tool - everything in Docker!**

## 🚀 One-Command Setup

```bash
# 1. Set your OpenAI API key
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY

# 2. Start everything
docker-compose up -d

# That's it! 🎉
```

Visit **http://localhost:3000** to start analyzing cards!

---

## 📋 Prerequisites

- **Docker Desktop** installed and running
- **OpenAI API Key** from https://platform.openai.com/api-keys

That's all you need! No Python, Node.js, or other dependencies required on your machine.

---

## 🎯 What Gets Started

When you run `docker-compose up -d`, Docker automatically:

1. **Builds** the backend and frontend images (first time only)
2. **Starts** 4 containers:
   - `gmm-postgres` - PostgreSQL database (port 5432)
   - `gmm-redis` - Redis cache (port 6379)
   - `gmm-backend` - FastAPI backend (port 8000)
   - `gmm-frontend` - Next.js frontend (port 3000)
3. **Initializes** the database with tables and extensions
4. **Seeds** sample sales data automatically
5. **Waits** for health checks to pass

---

## 🔧 Configuration

### Required: OpenAI API Key

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Edit `.env` and add your key:

```env
OPENAI_API_KEY=sk-proj-your-actual-key-here
```

### Optional: Custom Data

Place your sales data in `backend/dummy_data.json` before starting. The format:

```json
[
  {
    "player_name": "Luka Doncic",
    "brand": "Panini Prizm",
    "variation": "Base",
    "year": 2018,
    "grade": 10,
    "grader": "PSA",
    "price": 175.50,
    "sold_at": "2024-01-15T10:30:00Z"
  }
]
```

---

## 📊 Access Points

Once running, access these URLs:

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:3000 | Main application UI |
| **Backend API** | http://localhost:8000 | API root endpoint |
| **API Docs** | http://localhost:8000/docs | Interactive Swagger UI |
| **ReDoc** | http://localhost:8000/redoc | Alternative API docs |
| **Health Check** | http://localhost:8000/health | Service status |

---

## 🛠️ Common Commands

### Start Services

```bash
# Start all services in background
docker-compose up -d

# Start and view logs
docker-compose up

# Rebuild and start (after code changes)
docker-compose up -d --build
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
docker-compose logs -f redis
```

### Stop Services

```bash
# Stop all services (keeps data)
docker-compose down

# Stop and remove volumes (deletes data)
docker-compose down -v
```

### Restart Services

```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart backend
```

### Check Status

```bash
# View running containers
docker-compose ps

# View resource usage
docker stats
```

---

## 🔍 Database Access

### PostgreSQL

```bash
# Connect to database
docker exec -it gmm-postgres psql -U admin -d sports_cards

# Run queries
SELECT COUNT(*) FROM sales_history;
SELECT * FROM sales_history WHERE player_id = 'luka-doncic' LIMIT 5;

# Exit
\q
```

### Redis

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

## 🐛 Troubleshooting

### Services Won't Start

```bash
# Check Docker is running
docker info

# View detailed logs
docker-compose logs

# Remove everything and start fresh
docker-compose down -v
docker-compose up -d --build
```

### Port Conflicts

If ports 3000, 8000, 5432, or 6379 are in use:

```bash
# Find what's using a port (macOS/Linux)
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or change ports in docker-compose.yml
```

### Database Not Seeding

```bash
# Manually run seed script
docker exec -it gmm-backend python seed_db.py

# Or with custom data
docker exec -it gmm-backend python seed_db.py --file dummy_data.json --clear
```

### Backend API Errors

```bash
# Check backend logs
docker-compose logs backend

# Verify OpenAI key is set
docker exec -it gmm-backend env | grep OPENAI_API_KEY

# Restart backend
docker-compose restart backend
```

### Frontend Not Loading

```bash
# Check frontend logs
docker-compose logs frontend

# Verify backend is healthy
curl http://localhost:8000/health

# Rebuild frontend
docker-compose up -d --build frontend
```

---

## 🔄 Updating the Application

### After Code Changes

```bash
# Rebuild affected services
docker-compose up -d --build

# Or rebuild specific service
docker-compose up -d --build backend
```

### After Dependency Changes

```bash
# Backend (requirements.txt changed)
docker-compose up -d --build backend

# Frontend (package.json changed)
docker-compose up -d --build frontend
```

### Database Schema Changes

```bash
# Run migrations inside container
docker exec -it gmm-backend python init_db.py

# Or restart with fresh database
docker-compose down -v
docker-compose up -d
```

---

## 📦 Data Management

### Backup Database

```bash
# Export database
docker exec gmm-postgres pg_dump -U admin sports_cards > backup.sql

# Export as custom format
docker exec gmm-postgres pg_dump -U admin -Fc sports_cards > backup.dump
```

### Restore Database

```bash
# From SQL file
docker exec -i gmm-postgres psql -U admin sports_cards < backup.sql

# From custom format
docker exec -i gmm-postgres pg_restore -U admin -d sports_cards backup.dump
```

### Add More Sample Data

```bash
# Run seed script multiple times (appends data)
docker exec -it gmm-backend python seed_db.py

# Clear and reseed
docker exec -it gmm-backend python seed_db.py --clear
```

---

## 🎓 Development Workflow

### 1. Make Code Changes

Edit files in `backend/` or `frontend/` directories.

### 2. Rebuild & Restart

```bash
# Backend changes
docker-compose up -d --build backend

# Frontend changes
docker-compose up -d --build frontend
```

### 3. View Logs

```bash
docker-compose logs -f backend frontend
```

### 4. Test Changes

Visit http://localhost:3000 and test your changes.

---

## 🚫 What You DON'T Need

With Docker, you don't need to install:

- ❌ Python or pip
- ❌ Node.js or npm
- ❌ PostgreSQL
- ❌ Redis
- ❌ Virtual environments
- ❌ System dependencies

Everything runs in isolated containers!

---

## 🆚 Docker vs Local Development

| Aspect | Docker | Local |
|--------|--------|-------|
| **Setup Time** | 5 minutes | 15-30 minutes |
| **Dependencies** | Just Docker | Python, Node, PostgreSQL, Redis |
| **Consistency** | Same everywhere | Varies by system |
| **Isolation** | Complete | Shared system |
| **Resource Usage** | Higher | Lower |
| **Hot Reload** | Supported | Supported |

**Recommendation:** Use Docker for production-like environment, local for active development.

---

## 📚 Next Steps

1. **Test the Application**
   - Visit http://localhost:3000
   - Try analyzing: "2018 Panini Prizm Luka Doncic Rookie PSA 10"
   - Check the API docs: http://localhost:8000/docs

2. **Add Your Data**
   - Place your sales data in `backend/dummy_data.json`
   - Restart: `docker-compose restart backend`

3. **Customize**
   - Modify pricing algorithms in `backend/app/services/pricing_service.py`
   - Update UI in `frontend/app/page.tsx`
   - Rebuild: `docker-compose up -d --build`

4. **Deploy**
   - Push images to Docker Hub or registry
   - Deploy to cloud (AWS, GCP, Azure)
   - Use Kubernetes for orchestration

---

## 🔗 Useful Links

- **Full Setup Guide**: [`SETUP_GUIDE.md`](SETUP_GUIDE.md)
- **Project README**: [`README.md`](README.md)
- **Docker Compose Docs**: https://docs.docker.com/compose/
- **OpenAI API**: https://platform.openai.com/docs

---

## 💡 Pro Tips

1. **Use the helper script**: `./start.sh` for guided startup
2. **Check health**: `curl http://localhost:8000/health`
3. **Monitor resources**: `docker stats`
4. **Clean up**: `docker system prune` to free space
5. **Logs are your friend**: Always check logs when debugging

---

**Built with ❤️ for sports card collectors**

🏀 ⚾ 🏈 🏒 ⚽
