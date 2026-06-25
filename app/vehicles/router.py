from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth.repository import DealerRepository
from app.auth.security import get_current_dealer, require_admin
from app.shared.cache import get_cached, redis_client, set_cached
from app.shared.db.session import get_db
from app.shared.search import index_vehicle, search_vehicles
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
    redis_client.delete("vehicles:catalog")
    return new_vehicle


@router.get("/my", response_model=list[VehicleResponse])
def get_my_vehicles(
    db: Session = Depends(get_db),
    current_dealer=Depends(get_current_dealer),
):
    repo = VehicleRepository(db)
    return repo.get_vehicles_by_dealer(current_dealer.id)


@router.get("/catalog", response_model=list[VehicleResponse])
def get_catalog_vehicles(db: Session = Depends(get_db)):
    cached = get_cached("vehicles:catalog")
    if cached is not None:
        return cached
    repo = VehicleRepository(db)
    dealer_repo = DealerRepository(db)
    vehicles = repo.get_published_vehicles()
    dealer_ids = {v.dealer_id for v in vehicles if v.dealer_id}
    dealers = {d.id: d.email for d in dealer_repo.get_dealers_by_ids(list(dealer_ids))}
    vehicles_dict = [
        {
            "id": v.id,
            "dealer_id": v.dealer_id,
            "dealer_email": dealers.get(v.dealer_id) if v.dealer_id else None,
            "vin": v.vin,
            "plate": v.plate,
            "brand": v.brand,
            "model": v.model,
            "year": v.year,
            "color": v.color,
            "is_published": v.is_published,
        }
        for v in vehicles
    ]
    set_cached("vehicles:catalog", vehicles_dict)
    return vehicles_dict


@router.patch("/{vehicle_id}/publish", response_model=VehicleResponse)
def publish_vehicle(
    vehicle_id: str,
    db: Session = Depends(get_db),
    current_dealer=Depends(get_current_dealer),
):
    repo = VehicleRepository(db)
    vehicle = repo.publish_vehicle(vehicle_id, current_dealer.id)
    if vehicle is None:
        raise HTTPException(status_code=404, detail="Vehículo no encontrado o no te pertenece")
    redis_client.delete("vehicles:catalog")
    index_vehicle({
        "id": vehicle.id,
        "brand": vehicle.brand,
        "model": vehicle.model,
        "year": vehicle.year,
        "color": vehicle.color,
        "plate": vehicle.plate,
        "vin": vehicle.vin,
        "dealer_id": vehicle.dealer_id,
        "dealer_email": current_dealer.email,
        "is_published": True,
    })
    return vehicle


@router.get("/search", response_model=list[VehicleResponse])
def search_catalog(q: str = ""):
    if not q.strip():
        return []
    return search_vehicles(q)


@router.get("/all", response_model=list[VehicleResponse])
def get_all_vehicles(
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    repo = VehicleRepository(db)
    return repo.get_all_vehicles()


@router.get("/{vehicle_id}", response_model=VehicleResponse)
def get_vehicle_by_id(vehicle_id: str, db: Session = Depends(get_db)):
    repo = VehicleRepository(db)
    vehicle = repo.get_vehicle_by_id(vehicle_id)
    if vehicle is None:
        raise HTTPException(status_code=404, detail="Vehículo no encontrado")
    dealer_email = None
    if vehicle.dealer_id:
        dealer = DealerRepository(db).get_dealer_by_id(vehicle.dealer_id)
        if dealer:
            dealer_email = dealer.email
    return {
        "id": vehicle.id,
        "dealer_id": vehicle.dealer_id,
        "dealer_email": dealer_email,
        "vin": vehicle.vin,
        "plate": vehicle.plate,
        "brand": vehicle.brand,
        "model": vehicle.model,
        "year": vehicle.year,
        "color": vehicle.color,
        "is_published": vehicle.is_published,
    }
