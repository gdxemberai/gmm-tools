# Quick Setup Guide

## Backend Setup (FastAPI)

```bash
# Navigate to backend
cd backend

# Create virtual environment
python3.13 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the server
uvicorn app.main:app --reload
```

Backend runs on: http://localhost:8000

---

## Frontend Setup (Next.js)

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

Frontend runs on: http://localhost:3000

---

## Running Both Services

**Terminal 1 (Backend):**
```bash
cd backend && source venv/bin/activate && uvicorn app.main:app --reload
```

**Terminal 2 (Frontend):**
```bash
cd frontend && npm run dev
```

Visit http://localhost:3000 to see the health check dashboard!
