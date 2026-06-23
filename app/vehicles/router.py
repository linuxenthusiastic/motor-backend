from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth.security import get_current_dealer
from app.obd2.schemas import ScanCreate
from app.shared.cache import get_cached, redis_client, set_cached
from app.shared.db.session import get_db
from app.vehicles import repository
from app.vehicles.repository import VehicleRepository
from app.vehicles.schemas import VehicleCreate, VehicleResponse

router = APIRouter(prefix="/vehicles", tags=["vehicles"])


@router.post("/", response_model=VehicleResponse)
def create_vehicle(
    vehicle: VehicleCreate,
    db: Session = Depends(get_db),
    current_dealer=Depends(get_current_dealer),
):
    repo = VehicleRepository(db)
    new_vehicle = repo.create_vehicle(
        dealer_id=current_dealer.id,
        vin=vehicle.vin,
        plate=vehicle.plate,
        brand=vehicle.brand,
        model=vehicle.model,
        year=vehicle.year,
        color=vehicle.color,
    )
    redis_client.delete("vehicles:all")
    return new_vehicle


@router.get("/all", response_model=list[VehicleResponse])
def get_all_vehicles(db: Session = Depends(get_db)):
    repo = VehicleRepository(db)
    cached = get_cached("vehicles:all")

    if cached is not None:
        return cached

    vehicles = repo.get_all_vehicles()
    vehicles_dict = [
        {
            "id": v.id,
            "dealer_id": v.dealer_id,
            "vin": v.vin,
            "plate": v.plate,
            "brand": v.brand,
            "model": v.model,
            "year": v.year,
            "color": v.color,
        }
        for v in vehicles
    ]
    set_cached("vehicles:all", vehicles_dict)
    return vehicles_dict


@router.get("/{vehicle_id}", response_model=VehicleResponse)
def get_vehicle_by_id(vehicle_id: str, db: Session = Depends(get_db)):
    repo = VehicleRepository(db)
    vehicle = repo.get_vehicle_by_id(vehicle_id)
    if vehicle is None:
        raise HTTPException(status_code=404, detail="Vehículo no encontrado")
    return vehicle
