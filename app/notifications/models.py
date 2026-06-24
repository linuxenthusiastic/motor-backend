from fastapi.datastructures import Default
from sqlalchemy import Column, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from sqlalchemy.types import Boolean

from app.shared.db.base import Base, generate_uuid


class Notification(Base):
    __tablename__ = "notifications"
    __table_args__ = {"schema": "notifications"}

    id = Column(String, primary_key=True, default=generate_uuid)
    dealer_id = Column(String, nullable=False)
    message = Column(String, nullable=False)
    read = Column(Boolean, default=False, nullable=False)
