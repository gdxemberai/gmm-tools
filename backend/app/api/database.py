"""
Database API endpoints for viewing sales history records.
"""
from fastapi import APIRouter, Query, HTTPException, Depends
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List, Dict, Any
from datetime import datetime

from ..database import get_db
from ..models.sales_history import SalesHistory

router = APIRouter(prefix="/database", tags=["database"])


@router.get("/sales")
async def get_sales_history(
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(50, ge=1, le=100, description="Records per page"),
    player_id: Optional[str] = Query(None, description="Filter by player ID"),
    brand_id: Optional[str] = Query(None, description="Filter by brand ID"),
    grader: Optional[str] = Query(None, description="Filter by grader"),
    min_grade: Optional[float] = Query(None, ge=0, le=10, description="Minimum grade"),
    max_grade: Optional[float] = Query(None, ge=0, le=10, description="Maximum grade"),
    sort_by: str = Query("sold_at", regex="^(sold_at|price|grade|player_id)$", description="Sort field"),
    sort_order: str = Query("desc", regex="^(asc|desc)$", description="Sort order"),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Get paginated sales history records with optional filtering and sorting.
    
    Returns:
        Dictionary containing data array and pagination metadata
    """
    
    try:
        # Build base query
        query = select(SalesHistory)
        
        # Apply filters
        filters = []
        if player_id:
            filters.append(SalesHistory.player_id == player_id)
        if brand_id:
            filters.append(SalesHistory.brand_id == brand_id)
        if grader:
            filters.append(SalesHistory.grader == grader)
        if min_grade is not None:
            filters.append(SalesHistory.grade >= min_grade)
        if max_grade is not None:
            filters.append(SalesHistory.grade <= max_grade)
        
        if filters:
            query = query.where(and_(*filters))
        
        # Get total count
        count_query = select(func.count()).select_from(SalesHistory)
        if filters:
            count_query = count_query.where(and_(*filters))
        result = await db.execute(count_query)
        total = result.scalar()
        
        # Apply sorting
        sort_column = getattr(SalesHistory, sort_by)
        if sort_order == "desc":
            query = query.order_by(sort_column.desc())
        else:
            query = query.order_by(sort_column.asc())
        
        # Apply pagination
        offset = (page - 1) * per_page
        query = query.offset(offset).limit(per_page)
        
        # Execute query
        result = await db.execute(query)
        results = result.scalars().all()
        
        # Calculate total pages
        total_pages = (total + per_page - 1) // per_page if total > 0 else 0
        
        # Format results
        data = [
            {
                "id": record.id,
                "player_id": record.player_id,
                "brand_id": record.brand_id,
                "variation_id": record.variation_id,
                "year": record.year,
                "grade": float(record.grade) if record.grade is not None else None,
                "grader": record.grader,
                "price": float(record.price) if record.price is not None else None,
                "sold_at": record.sold_at.isoformat() if record.sold_at else None,
            }
            for record in results
        ]
        
        return {
            "data": data,
            "pagination": {
                "total": total,
                "page": page,
                "per_page": per_page,
                "total_pages": total_pages,
            }
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
