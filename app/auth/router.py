from secrets import token_bytes

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth.repository import DealerRepository
from app.auth.schemas import DealerCreate, DealerResponse, LoginRequest, LoginResponse
from app.auth.security import create_access_token, get_current_dealer, hash_password, verify_password
from app.shared.db.session import get_db

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=DealerResponse)
def register(dealer: DealerCreate, db: Session = Depends(get_db)):
    repo = DealerRepository(db)
    existing_email = repo.get_dealer_by_email(dealer.email)
    if existing_email is not None:
        raise HTTPException(status_code=400, detail="Email ya registrado")

    hashed = hash_password(dealer.password)
    new_dealer = repo.create_dealer(
        name=dealer.name,
        email=dealer.email,
        hashed_password=hashed,
    )
    return new_dealer


@router.post("/login", response_model=LoginResponse)
def login(login: LoginRequest, db: Session = Depends(get_db)):
    repo = DealerRepository(db)
    dealer = repo.get_dealer_by_email(login.email)
    if dealer is None:
        raise HTTPException(status_code=401, detail="Email o Password incorrectos")

    if verify_password(login.password, str(dealer.hashed_password)):
        new_access_token = create_access_token({"sub": dealer.id})
        return {
            "access_token": new_access_token,
            "token_type": "bearer",
        }

    else:
        raise HTTPException(status_code=401, detail="Email o Password incorrectos")


@router.get("/me", response_model=DealerResponse)
def me(current_dealer=Depends(get_current_dealer)):
    return current_dealer
