from sqlalchemy.orm import Session

from app.auth.models import Dealer


class DealerRepository:
    def __init__(self, db: Session):
        self.db = db

    def create_dealer(self, name: str, email: str, hashed_password: str):
        new_dealer = Dealer(
            name=name,
            email=email,
            hashed_password=hashed_password,
            role="dealer",
        )
        self.db.add(new_dealer)
        self.db.commit()
        self.db.refresh(new_dealer)
        return new_dealer

    def get_dealer_by_email(self, email: str):
        return self.db.query(Dealer).filter(Dealer.email == email).first()

    def get_dealer_by_id(self, id: str):
        return self.db.query(Dealer).filter(Dealer.id == id).first()
