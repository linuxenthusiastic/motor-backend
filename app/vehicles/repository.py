from sqlalchemy.orm import Session
from sqlalchemy.sql.coercions import OrderByImpl

from app.vehicles.models import Vehicle


class VehicleRepository:
    def __init__(self, db: Session):
        self.db = db

    def create_vehicle(
        self,
        dealer_id: str,
        vin: str,
        plate: str,
        brand: str,
        model: str,
        year: int,
        color: str,
    ):
        new_vehicle = Vehicle(
            dealer_id=dealer_id,
            vin=vin,
            plate=plate,
            brand=brand,
            model=model,
            year=year,
            color=color,
        )

        self.db.add(new_vehicle)
        self.db.commit()
        self.db.refresh(new_vehicle)
        return new_vehicle

    def get_vehicle_by_id(self, vehicle_id: str):
        return self.db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()

    def get_all_vehicles(self):
        return self.db.query(Vehicle).all()
