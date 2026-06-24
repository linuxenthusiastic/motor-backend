from sqlalchemy import Column, ForeignKey, String

from app.shared.db.base import Base, generate_uuid


class Favorite(Base):
    __tablename__ = "favorites"
    __table_args__ = {"schema": "ugc"}

    id = Column(String, primary_key=True, default=generate_uuid)
    dealer_id = Column(String, ForeignKey("auth.dealers.id"), nullable=False)
    vehicle_id = Column(String, ForeignKey("obd2.vehicles.id"), nullable=False)
