from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth.security import get_current_dealer
from app.catalog.models import CarModel
from app.catalog.repository import CarModelRepository
from app.catalog.schemas import CarModelCreate, CarModelResponse
from app.shared.db.session import get_db

router = APIRouter(prefix="/catalog", tags=["catalog"])


@router.post("/create", response_model=CarModelResponse)
def create_car_model(
    car_model: CarModelCreate,
    db: Session = Depends(get_db),
    current_dealer=Depends(get_current_dealer),
):
    repo = CarModelRepository(db)
    new_car_model = repo.create_car_model(brand=car_model.brand, model=car_model.model)
    return new_car_model


@router.get("/", response_model=list[CarModelResponse])
def get_all_car_model(db: Session = Depends(get_db)):
    repo = CarModelRepository(db)
    return repo.get_all_car_models()
