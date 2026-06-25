from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth.security import require_admin
from app.catalog.models import CarModel
from app.catalog.repository import CarModelRepository
from app.catalog.schemas import CarModelCreate, CarModelResponse
from app.shared.cache import get_cached, redis_client, set_cached
from app.shared.db.session import get_db

router = APIRouter(prefix="/catalog", tags=["catalog"])


@router.post("/create", response_model=CarModelResponse)
def create_car_model(
    car_model: CarModelCreate,
    db: Session = Depends(get_db),
    current_dealer=Depends(require_admin),
):
    repo = CarModelRepository(db)
    new_car_model = repo.create_car_model(brand=car_model.brand, model=car_model.model)
    redis_client.delete("catalog:all")
    return new_car_model


@router.get("/", response_model=list[CarModelResponse])
def get_all_car_model(db: Session = Depends(get_db)):
    cached = get_cached("catalog:all")
    if cached is not None:
        return cached
    repo = CarModelRepository(db)
    car_models = repo.get_all_car_models()
    car_models_dict = [
        {"id": c.id, "brand": c.brand, "model": c.model} for c in car_models
    ]
    set_cached("catalog:all", car_models_dict)
    return car_models_dict
