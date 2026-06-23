from pydantic.main import BaseModel
from sqlalchemy.orm import Session

from app.catalog.models import CarModel
from app.shared.db.session import get_db


class CarModelRepository:
    def __init__(self, db: Session):
        self.db = db

    def create_car_model(self, brand: str, model: str):
        new_car_model = CarModel(brand=brand, model=model)
        self.db.add(new_car_model)
        self.db.commit()
        self.db.refresh(new_car_model)
        return new_car_model

    def get_all_car_models(self):
        return self.db.query(CarModel).all()
