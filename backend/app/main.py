import logging
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import health, analyze, bulk_analyze, database, cache, purchases
from app.database import init_db, close_db
from app.redis_client import init_redis, close_redis
from app.services.openai_service import init_openai

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for startup and shutdown events.
    Handles initialization and cleanup of database, Redis, and OpenAI connections.
    """
    # Startup
    logger.info("Starting up Sports Card Arbitrage Tool API...")
    
    try:
        # Initialize database
        await init_db()
        
        # Initialize Redis
        await init_redis()
        
        # Initialize OpenAI
        openai_api_key = os.getenv("OPENAI_API_KEY")
        if openai_api_key:
            init_openai(openai_api_key)
        else:
            logger.warning("OPENAI_API_KEY not set - analysis endpoint will fail")
        
        logger.info("✓ All services initialized successfully")
        
    except Exception as e:
        logger.error(f"✗ Startup failed: {e}")
        raise
    
    yield
    
    # Shutdown
    logger.info("Shutting down Sports Card Arbitrage Tool API...")
    
    try:
        await close_redis()
        await close_db()
        logger.info("✓ All services shut down successfully")
    except Exception as e:
        logger.error(f"✗ Shutdown error: {e}")


app = FastAPI(
    title="Sports Card Arbitrage Tool API",
    version="1.0.0",
    description="Backend API for analyzing sports card listings and finding arbitrage opportunities",
    lifespan=lifespan
)

# Configure CORS - Must be added before routes
# Allow both localhost (for local dev) and frontend service (for Docker)
allowed_origins = [
    "http://localhost:3000",  # Local development
    "http://frontend:3000",   # Docker service name
    "http://gmm-frontend:3000",  # Docker container name
]

logger.info(f"CORS allowed origins: {allowed_origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods including OPTIONS
    allow_headers=["*"],  # Allow all headers
    expose_headers=["*"],  # Expose all headers to the frontend
    max_age=3600,  # Cache preflight requests for 1 hour
)

# Include routers
app.include_router(health.router)
app.include_router(analyze.router)
app.include_router(bulk_analyze.router)
app.include_router(database.router)
app.include_router(cache.router)
app.include_router(purchases.router)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Welcome to Sports Card Arbitrage Tool API",
        "version": "1.0.0",
        "endpoints": {
            "health": "/health",
            "analyze": "/analyze",
            "docs": "/docs"
        }
    }
