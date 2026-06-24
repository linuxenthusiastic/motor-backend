from sqlalchemy.orm import Session

from app.ugc.models import Favorite


class FavoriteRepository:
    def __init__(self, db: Session):
        self.db = db

    def create_favorite(self, dealer_id: str, vehicle_id: str):
        new_favorite = Favorite(dealer_id=dealer_id, vehicle_id=vehicle_id)
        self.db.add(new_favorite)
        self.db.commit()
        self.db.refresh(new_favorite)
        return new_favorite

    def get_favorites_by_dealer(self, dealer_id: str):
        return self.db.query(Favorite).filter(Favorite.dealer_id == dealer_id).all()
