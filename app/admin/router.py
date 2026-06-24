from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth.repository import DealerRepository
from app.auth.schemas import DealerResponse
from app.auth.security import require_admin
from app.shared.db.session import get_db
from app.vehicles.repository import VehicleRepository
from app.vehicles.schemas import VehicleResponse

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/dealers", response_model=list[DealerResponse])
def get_all_dealers(
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    repo = DealerRepository(db)
    return repo.get_all_dealers()


@router.get("/vehicles", response_model=list[VehicleResponse])
def get_all_vehicles_admin(
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    repo = VehicleRepository(db)
    return repo.get_all_vehicles()
