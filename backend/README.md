# GMM Backend API

FastAPI backend service for the GMM monorepo.

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py          # FastAPI application
│   ├── api/             # API routes
│   │   ├── __init__.py
│   │   └── health.py    # Health check endpoints
│   └── models/          # Data models
│       └── __init__.py
├── requirements.txt
└── README.md
```

## Requirements

- Python 3.13

## Setup

1. Create a virtual environment:
```bash
python3.13 -m venv venv
source venv/bin/activate  # On macOS/Linux
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

## Running the Server

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at:
- API: http://localhost:8000
- Interactive API docs: http://localhost:8000/docs
- Alternative API docs: http://localhost:8000/redoc

## API Endpoints

- `GET /` - Root endpoint
- `GET /health` - Health check endpoint (used by frontend)
- `GET /api/status` - API status endpoint

## Adding New Endpoints

1. Create a new router file in `app/api/`
2. Import and include the router in `app/main.py`
3. Add models in `app/models/` as needed
