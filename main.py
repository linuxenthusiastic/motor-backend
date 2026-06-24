from fastapi import FastAPI

from app.auth.router import router as auth_router
from app.catalog.router import router as catalog_router
from app.obd2.router import router as obd2_router
from app.ugc.router import router as ugc_router
from app.vehicles.router import router as vehicle_router

app = FastAPI(title="Motora OBD2 API")

app.include_router(obd2_router)
app.include_router(vehicle_router)
app.include_router(auth_router)
app.include_router(catalog_router)
app.include_router(ugc_router)

from app.auth.models import Dealer
from app.obd2.models import OBD2Scan
from app.shared.db.base import Base
from app.shared.db.session import engine
from app.ugc.models import Favorite
from app.vehicles.models import Vehicle

Base.metadata.create_all(bind=engine)
