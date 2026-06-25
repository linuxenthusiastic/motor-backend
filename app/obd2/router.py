from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth.security import get_current_dealer
from app.obd2.repository import OBD2Repository
from app.obd2.schemas import ScanCreate, ScanResponse
from app.shared.db.session import get_db
from app.vehicles.repository import VehicleRepository

router = APIRouter(prefix="/obd2", tags=["obd2"])


@router.post("/scans", response_model=ScanResponse)
def create_scan(
    scan: ScanCreate,
    db: Session = Depends(get_db),
    current_dealer=Depends(get_current_dealer),
):
    vehicle_repo = VehicleRepository(db)
    vehicle = vehicle_repo.get_vehicle_by_id(scan.vehicle_id)
    if vehicle is None or vehicle.dealer_id != current_dealer.id:
        raise HTTPException(status_code=403, detail="No tenés permiso para escanear este vehículo")
    repo = OBD2Repository(db)
    return repo.create_scan(
        vehicle_id=scan.vehicle_id,
        odometer=scan.odometer,
        rpm=scan.rpm,
        coolant_temp=scan.coolant_temp,
        battery_voltage=scan.battery_voltage,
        error_codes=scan.error_codes,
        scan_date=scan.scan_date,
    )


@router.get("/scans/{vehicle_id}", response_model=list[ScanResponse])
def get_scans_by_id(vehicle_id: str, db: Session = Depends(get_db)):
    repo = OBD2Repository(db)
    return repo.get_scans_by_vehicle(vehicle_id)
