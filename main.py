from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.admin.router import router as admin_router
from app.auth.router import router as auth_router
from app.catalog.router import router as catalog_router
from app.notifications.router import router as notifications_router
from app.obd2.router import router as obd2_router
from app.ugc.router import router as ugc_router
from app.vehicles.router import router as vehicle_router

app = FastAPI(title="Motora OBD2 API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://motor-frontend-xi.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(admin_router)
app.include_router(obd2_router)
app.include_router(vehicle_router)
app.include_router(auth_router)
app.include_router(catalog_router)
app.include_router(ugc_router)
app.include_router(notifications_router)

from sqlalchemy import text

from app.auth.models import Dealer
from app.auth.repository import DealerRepository
from app.notifications.models import Notification
from app.obd2.models import OBD2Scan
from app.shared.db.base import Base
from app.shared.db.session import SessionLocal, engine
from app.shared.search import index_vehicle
from app.ugc.models import Favorite
from app.vehicles.models import Vehicle
from app.vehicles.repository import VehicleRepository

Base.metadata.create_all(bind=engine)

with engine.connect() as conn:
    conn.execute(text(
        "ALTER TABLE obd2.vehicles ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT FALSE"
    ))
    conn.commit()

try:
    db = SessionLocal()
    vehicle_repo = VehicleRepository(db)
    dealer_repo = DealerRepository(db)
    published = vehicle_repo.get_published_vehicles()
    dealer_ids = {v.dealer_id for v in published if v.dealer_id}
    dealers = {d.id: d.email for d in dealer_repo.get_dealers_by_ids(list(dealer_ids))}
    for v in published:
        index_vehicle({
            "id": v.id,
            "brand": v.brand,
            "model": v.model,
            "year": v.year,
            "color": v.color,
            "plate": v.plate,
            "vin": v.vin,
            "dealer_id": v.dealer_id,
            "dealer_email": dealers.get(v.dealer_id) if v.dealer_id else None,
            "is_published": True,
        })
    db.close()
except Exception as e:
    print(f"[search] startup indexing skipped: {e}")
