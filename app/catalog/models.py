from sqlalchemy import Column, String

from app.shared.db.base import Base, generate_uuid


class CarModel(Base):
    __tablename__ = "car_models"
    __table_args__ = {"schema": "catalog"}

    id = Column(String, primary_key=True, default=generate_uuid)
    brand = Column(String, nullable=False)
    model = Column(String, nullable=False)
