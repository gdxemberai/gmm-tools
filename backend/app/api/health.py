from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/health")
async def health_check():
    """Health check endpoint for frontend to verify backend connection"""
    return {
        "status": "healthy",
        "message": "Backend is running successfully",
        "service": "GMM Backend API"
    }


@router.get("/api/status")
async def api_status():
    """API status endpoint"""
    return {
        "api_version": "1.0.0",
        "status": "operational"
    }
