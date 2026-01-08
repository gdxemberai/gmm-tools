from sqlalchemy import Column, Integer, String, Float, DateTime, Text
from sqlalchemy.sql import func
from app.database import Base


class Purchase(Base):
    __tablename__ = "purchases"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Original listing info
    listing_title = Column(String, nullable=False)
    listing_price = Column(Float, nullable=False)
    
    # Parsed card details
    player_name = Column(String, index=True)
    year = Column(Integer)
    brand = Column(String)
    variation = Column(String)
    grade = Column(Float)
    grader = Column(String)
    
    # Normalized IDs (for matching)
    player_id = Column(String, index=True)
    brand_id = Column(String)
    variation_id = Column(String)
    
    # Valuation at time of purchase
    estimated_value = Column(Float)
    profit_loss = Column(Float)  # estimated_value - listing_price
    
    # Metadata
    purchased_at = Column(DateTime(timezone=True), server_default=func.now())
    parsed_data = Column(Text)  # JSON string of full LLM output
    
    # Analysis metadata
    confidence = Column(String)
    match_tier = Column(String)  # "exact" or "fuzzy"
    sales_count = Column(Integer)  # Number of sales used for valuation
