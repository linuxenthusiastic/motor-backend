from sqlalchemy import Column, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.shared.db.base import Base, generate_uuid


class Vehicle(Base):
    __tablename__ = "vehicles"
    __table_args__ = {"schema": "obd2"}

    id = Column(String, primary_key=True, default=generate_uuid)
    dealer_id = Column(String, nullable=True)
    vin = Column(String, unique=True, nullable=False)
    plate = Column(String, nullable=False)
    brand = Column(String, nullable=False)
    model = Column(String, nullable=False)
    year = Column(Integer, nullable=False)

    scans = relationship("OBD2Scan", back_populates="vehicle")
