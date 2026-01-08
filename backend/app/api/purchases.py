from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, func
from app.database import get_db
from app.models.purchases import Purchase
from app.models.sales_history import SalesHistory
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone
import json

router = APIRouter(prefix="/purchases", tags=["purchases"])


class PurchaseCreate(BaseModel):
    listing_title: str
    listing_price: float
    player_name: Optional[str] = None
    year: Optional[int] = None
    brand: Optional[str] = None
    variation: Optional[str] = None
    grade: Optional[float] = None
    grader: Optional[str] = None
    player_id: Optional[str] = None
    brand_id: Optional[str] = None
    variation_id: Optional[str] = None
    estimated_value: Optional[float] = None
    profit_loss: Optional[float] = None
    parsed_data: Optional[dict] = None
    confidence: Optional[str] = None
    match_tier: Optional[str] = None
    sales_count: Optional[int] = None


@router.post("/")
async def create_purchase(purchase: PurchaseCreate, db: AsyncSession = Depends(get_db)):
    """Record a purchase and add to sales history"""
    # 1. Create purchase record
    db_purchase = Purchase(
        listing_title=purchase.listing_title,
        listing_price=purchase.listing_price,
        player_name=purchase.player_name,
        year=purchase.year,
        brand=purchase.brand,
        variation=purchase.variation,
        grade=purchase.grade,
        grader=purchase.grader,
        player_id=purchase.player_id,
        brand_id=purchase.brand_id,
        variation_id=purchase.variation_id,
        estimated_value=purchase.estimated_value,
        profit_loss=purchase.profit_loss,
        parsed_data=json.dumps(purchase.parsed_data) if purchase.parsed_data else None,
        confidence=purchase.confidence,
        match_tier=purchase.match_tier,
        sales_count=purchase.sales_count
    )
    
    db.add(db_purchase)
    
    # 2. Always add to sales_history (fields can be null)
    db_sale = SalesHistory(
        player_id=purchase.player_id,
        brand_id=purchase.brand_id,
        variation_id=purchase.variation_id,
        year=purchase.year,
        grade=purchase.grade,
        grader=purchase.grader,
        price=purchase.listing_price,
        sold_at=datetime.now(timezone.utc)
    )
    db.add(db_sale)
    
    # 3. Commit both inserts
    await db.commit()
    await db.refresh(db_purchase)
    
    return {"message": "Purchase recorded successfully", "id": db_purchase.id}


@router.get("/")
async def get_purchases(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    """Get all purchases with pagination"""
    # Get total count
    count_result = await db.execute(select(func.count(Purchase.id)))
    total = count_result.scalar()
    
    # Get purchases
    result = await db.execute(
        select(Purchase)
        .order_by(desc(Purchase.purchased_at))
        .offset(skip)
        .limit(limit)
    )
    purchases = result.scalars().all()
    
    return {
        "total": total,
        "purchases": [
            {
                "id": p.id,
                "listing_title": p.listing_title,
                "listing_price": p.listing_price,
                "player_name": p.player_name,
                "year": p.year,
                "brand": p.brand,
                "variation": p.variation,
                "grade": p.grade,
                "grader": p.grader,
                "estimated_value": p.estimated_value,
                "profit_loss": p.profit_loss,
                "purchased_at": p.purchased_at.isoformat() if p.purchased_at else None,
                "confidence": p.confidence,
                "match_tier": p.match_tier,
                "sales_count": p.sales_count,
                "parsed_data": json.loads(p.parsed_data) if p.parsed_data else None
            }
            for p in purchases
        ]
    }
