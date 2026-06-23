from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth.security import get_current_dealer
from app.obd2.schemas import ScanCreate
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

    return new_vehicle


@router.get("/all", response_model=list[VehicleResponse])
def get_all_vehicles(db: Session = Depends(get_db)):
    repo = VehicleRepository(db)
    return repo.get_all_vehicles()


@router.get("/{vehicle_id}", response_model=VehicleResponse)
def get_vehicle_by_id(vehicle_id: str, db: Session = Depends(get_db)):
    repo = VehicleRepository(db)
    return repo.get_vehicle_by_id(vehicle_id)
