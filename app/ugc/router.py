from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth.security import get_current_dealer
from app.shared.db.session import get_db
from app.ugc.repository import FavoriteRepository
from app.ugc.schemas import FavoriteCreate, FavoriteResponse

router = APIRouter(prefix="/ugc", tags=["ugc"])


@router.post("/favorites", response_model=FavoriteResponse)
def create_favorite(
    favorite: FavoriteCreate,
    db: Session = Depends(get_db),
    current_dealer=Depends(get_current_dealer),
):
    repo = FavoriteRepository(db)
    return repo.create_favorite(
        dealer_id=current_dealer.id,
        vehicle_id=favorite.vehicle_id,
    )


@router.get("/favorites", response_model=list[FavoriteResponse])
def get_favorites(
    db: Session = Depends(get_db),
    current_dealer=Depends(get_current_dealer),
):
    repo = FavoriteRepository(db)
    return repo.get_favorites_by_dealer(dealer_id=current_dealer.id)
