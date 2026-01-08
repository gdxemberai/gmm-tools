"""
Sales History Model for Sports Card Arbitrage Tool.
Stores historical sales data for sports cards with fuzzy text matching support.
"""

from datetime import datetime
from decimal import Decimal

from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    DateTime,
    Numeric,
    Index,
)

from ..database import Base


class SalesHistory(Base):
    """
    Sales history table for tracking sports card sales.
    
    Attributes:
        id: Primary key, auto-incrementing integer
        player_id: Slugified player name (e.g., "michael-jordan")
        brand_id: Slugified brand name (e.g., "topps-chrome")
        variation_id: Slugified variation (e.g., "refractor")
        year: Card year
        grade: Card grade (e.g., 10.0, 9.5)
        grader: Grading company (e.g., 'PSA', 'BGS')
        price: Sold price in decimal format
        sold_at: Timestamp of sale
    """
    
    __tablename__ = "sales_history"
    
    # Primary key
    id: int = Column(Integer, primary_key=True, autoincrement=True, nullable=False)
    
    # Card identification fields (slugified for consistency)
    player_id: str = Column(String, nullable=False, index=True)
    brand_id: str = Column(String, nullable=False)
    variation_id: str = Column(String, nullable=False)
    
    # Card details
    year: int = Column(Integer, nullable=False)
    grade: float = Column(Float, nullable=False)
    grader: str = Column(String, nullable=False)
    
    # Sale information
    price: Decimal = Column(Numeric(10, 2), nullable=False)  # Up to 99,999,999.99
    sold_at: datetime = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    
    # Indexes for performance
    __table_args__ = (
        # GIN index for pg_trgm fuzzy text matching on player_id
        # This will be created in init_db.py using raw SQL
        Index('idx_player_brand_year', 'player_id', 'brand_id', 'year'),
        Index('idx_sold_at', 'sold_at'),
        Index('idx_grader_grade', 'grader', 'grade'),
    )
    
    def __repr__(self) -> str:
        """String representation of SalesHistory instance."""
        return (
            f"<SalesHistory(id={self.id}, "
            f"player='{self.player_id}', "
            f"brand='{self.brand_id}', "
            f"year={self.year}, "
            f"grade={self.grade}, "
            f"grader='{self.grader}', "
            f"price=${self.price})>"
        )
    
    def to_dict(self) -> dict:
        """
        Convert model instance to dictionary.
        
        Returns:
            dict: Dictionary representation of the sales history record
        """
        return {
            "id": self.id,
            "player_id": self.player_id,
            "brand_id": self.brand_id,
            "variation_id": self.variation_id,
            "year": self.year,
            "grade": self.grade,
            "grader": self.grader,
            "price": float(self.price),
            "sold_at": self.sold_at.isoformat() if self.sold_at else None,
        }
