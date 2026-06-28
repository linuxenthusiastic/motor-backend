"""
Script de seed — puebla la base de datos con datos de prueba.

Uso local:
    source venv/bin/activate
    python seed.py

Uso con Docker (con el stack corriendo):
    docker compose exec backend python seed.py

Agrega --reset para borrar todo antes de insertar:
    python seed.py --reset
    docker compose exec backend python seed.py --reset
"""

import random
import sys
from datetime import datetime, timedelta

from sqlalchemy import text

from app.auth.repository import DealerRepository
from app.auth.security import hash_password
from app.catalog.repository import CarModelRepository
from app.notifications.repository import NotificationRepository
from app.obd2.repository import OBD2Repository
from app.shared.db.base import Base
from app.shared.db.session import SessionLocal, engine
from app.ugc.repository import FavoriteRepository
from app.vehicles.repository import VehicleRepository

# ── Datos ──────────────────────────────────────────────────────────────────────

DEALERS = [
    {"name": "Admin Motora",       "email": "admin@motora.com",    "password": "admin123",  "role": "admin"},
    {"name": "Carlos Rodríguez",   "email": "carlos@automotora.com", "password": "carlos123"},
    {"name": "María González",     "email": "maria@autosgonzalez.com", "password": "maria123"},
    {"name": "Lucas Fernández",    "email": "lucas@lucasautos.com",  "password": "lucas123"},
    {"name": "Sofía Martínez",     "email": "sofia@sofiacar.com",    "password": "sofia123"},
    {"name": "Diego Sánchez",      "email": "diego@diegomotors.com", "password": "diego123"},
]

CATALOG_MODELS = [
    ("Toyota",     "Corolla"),
    ("Toyota",     "Hilux"),
    ("Toyota",     "Yaris"),
    ("Toyota",     "RAV4"),
    ("Volkswagen", "Golf"),
    ("Volkswagen", "Vento"),
    ("Volkswagen", "Amarok"),
    ("Volkswagen", "Polo"),
    ("Chevrolet",  "Cruze"),
    ("Chevrolet",  "S10"),
    ("Chevrolet",  "Onix"),
    ("Ford",       "Ranger"),
    ("Ford",       "Focus"),
    ("Ford",       "Ka"),
    ("Renault",    "Sandero"),
    ("Renault",    "Logan"),
    ("Renault",    "Duster"),
    ("Peugeot",    "208"),
    ("Peugeot",    "308"),
    ("Honda",      "HR-V"),
    ("Honda",      "City"),
    ("Honda",      "Civic"),
]

VEHICLES = [
    # (vin,                plate,    brand,       model,    year, color,     published)
    ("1HGBH41JXMN109186", "AA001BB", "Toyota",     "Corolla", 2022, "Blanco",  True),
    ("2HGBH41JXMN109187", "BB002CC", "Toyota",     "Hilux",   2021, "Gris",    True),
    ("3VWFE21C04M000001", "CC003DD", "Volkswagen", "Golf",    2023, "Negro",   True),
    ("4VWFE21C04M000002", "DD004EE", "Volkswagen", "Amarok",  2020, "Blanco",  True),
    ("5GZCZ43D13S812715", "EE005FF", "Chevrolet",  "S10",     2022, "Plata",   True),
    ("6GZCZ43D13S812716", "FF006GG", "Chevrolet",  "Cruze",   2021, "Rojo",    True),
    ("7FTPX12565NB00001", "GG007HH", "Ford",       "Ranger",  2023, "Azul",    True),
    ("8FTPX12565NB00002", "HH008II", "Ford",       "Focus",   2019, "Negro",   False),
    ("9RNMF45R67W000001", "II009JJ", "Renault",    "Duster",  2022, "Naranja", True),
    ("ARNMF45R67W000002", "JJ010KK", "Renault",    "Sandero", 2020, "Blanco",  False),
    ("BPEUGEOT208000001", "KK011LL", "Peugeot",    "208",     2023, "Rojo",    True),
    ("CPEUGEOT308000002", "LL012MM", "Peugeot",    "308",     2021, "Gris",    True),
    ("DHONDAHRV0000001",  "MM013NN", "Honda",      "HR-V",    2022, "Blanco",  True),
    ("EHONDACITY000002",  "NN014OO", "Honda",      "City",    2020, "Plata",   False),
    ("FTOYOTAYARIS00001", "OO015PP", "Toyota",     "Yaris",   2023, "Celeste", True),
    ("GVOLKSPOLO000001",  "PP016QQ", "Volkswagen", "Polo",    2022, "Negro",   True),
    ("HCHEVONIX000001",   "QQ017RR", "Chevrolet",  "Onix",    2023, "Blanco",  True),
    ("IFORDKA00000001",   "RR018SS", "Ford",       "Ka",      2019, "Rojo",    False),
    ("JRENAULTLOGAN001",  "SS019TT", "Renault",    "Logan",   2021, "Gris",    True),
    ("KTOYOTARAV4000001", "TT020UU", "Toyota",     "RAV4",    2022, "Verde",   True),
]

ERROR_CODES_POOL = [
    "", "", "", "",       # mayoría sin errores
    "P0300",
    "P0420",
    "P0171",
    "P0300, P0420",
    "P0113",
    "B0001",
]

COLORS_NOTIF = [
    "Nuevo scan registrado",
    "Tu vehículo fue publicado en el catálogo",
    "Revisión de batería recomendada",
    "Odómetro alto detectado — revisión sugerida",
]


# ── Helpers ────────────────────────────────────────────────────────────────────

def random_scan_date(days_back: int = 365) -> datetime:
    return datetime.now() - timedelta(days=random.randint(0, days_back))


def random_odometer(base: int = 0) -> int:
    return base + random.randint(500, 8000)


def log(msg: str) -> None:
    print(f"  {msg}")


# ── Reset ──────────────────────────────────────────────────────────────────────

def reset_db(db) -> None:
    print("⚠  Borrando datos existentes...")
    db.execute(text("DELETE FROM notifications.notifications"))
    db.execute(text("DELETE FROM ugc.favorites"))
    db.execute(text("DELETE FROM obd2.obd2_scan"))
    db.execute(text("DELETE FROM obd2.vehicles"))
    db.execute(text("DELETE FROM auth.dealers"))
    db.execute(text("DELETE FROM catalog.car_models"))
    db.commit()
    print("   Tablas limpias.\n")


# ── Main ───────────────────────────────────────────────────────────────────────

def seed() -> None:
    import os as _os
    print(f"[DEBUG] DATABASE_URL = {_os.getenv('DATABASE_URL', 'NOT SET')[:40]}...")
    reset = "--reset" in sys.argv

    print("🌱 Iniciando seed...\n")

    # Schemas + tablas
    with engine.connect() as conn:
        for schema in ["auth", "obd2", "catalog", "ugc", "notifications"]:
            conn.execute(text(f"CREATE SCHEMA IF NOT EXISTS {schema}"))
        conn.commit()
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    if reset:
        reset_db(db)

    # ── 1. Dealers ─────────────────────────────────────────────────────────────
    print("👤 Creando dealers...")
    dealer_repo = DealerRepository(db)
    created_dealers = []

    for d in DEALERS:
        existing = dealer_repo.get_dealer_by_email(d["email"])
        if existing:
            log(f"ya existe → {d['email']}")
            created_dealers.append(existing)
            continue

        dealer = dealer_repo.create_dealer(
            name=d["name"],
            email=d["email"],
            hashed_password=hash_password(d["password"]),
        )
        # Setear rol admin si corresponde
        if d.get("role") == "admin":
            dealer.role = "admin"
            db.commit()
            db.refresh(dealer)

        log(f"creado → {d['email']}  (pass: {d['password']})")
        created_dealers.append(dealer)

    regular_dealers = [d for d in created_dealers if d.role == "dealer"]

    # ── 2. Catálogo de modelos ─────────────────────────────────────────────────
    print("\n📋 Creando modelos de catálogo...")
    catalog_repo = CarModelRepository(db)
    existing_models = {(m.brand, m.model) for m in catalog_repo.get_all_car_models()}

    for brand, model in CATALOG_MODELS:
        if (brand, model) in existing_models:
            continue
        catalog_repo.create_car_model(brand=brand, model=model)
        log(f"{brand} {model}")

    # ── 3. Vehículos ───────────────────────────────────────────────────────────
    print("\n🚗 Creando vehículos...")
    vehicle_repo = VehicleRepository(db)
    created_vehicles = []

    for i, (vin, plate, brand, model, year, color, publish) in enumerate(VEHICLES):
        # Distribuir entre dealers regulares en round-robin
        owner = regular_dealers[i % len(regular_dealers)]

        existing = vehicle_repo.get_vehicle_by_id(vin)
        # get_vehicle_by_id busca por ID (uuid), no por VIN —
        # chequeamos por VIN directamente
        from sqlalchemy import text as t
        vin_exists = db.execute(
            t("SELECT id FROM obd2.vehicles WHERE vin = :vin"), {"vin": vin}
        ).first()
        if vin_exists:
            log(f"ya existe → {vin}")
            v = vehicle_repo.get_vehicle_by_id(vin_exists[0])
            created_vehicles.append(v)
            continue

        v = vehicle_repo.create_vehicle(
            dealer_id=owner.id,
            vin=vin,
            plate=plate,
            brand=brand,
            model=model,
            year=year,
            color=color,
        )

        if publish:
            vehicle_repo.publish_vehicle(v.id, owner.id)
            db.refresh(v)

        log(f"{brand} {model} {year} ({plate}) → {owner.name} {'[publicado]' if publish else ''}")
        created_vehicles.append(v)

    # ── 4. Scans OBD2 ──────────────────────────────────────────────────────────
    print("\n🔧 Creando scans OBD2...")
    obd2_repo = OBD2Repository(db)

    for vehicle in created_vehicles:
        n_scans = random.randint(2, 6)
        odometer = random.randint(5000, 80000)

        for _ in range(n_scans):
            odometer = random_odometer(odometer)
            obd2_repo.create_scan(
                vehicle_id=vehicle.id,
                odometer=odometer,
                rpm=random.randint(650, 3500),
                coolant_temp=round(random.uniform(75.0, 105.0), 1),
                battery_voltage=round(random.uniform(11.8, 14.5), 2),
                error_codes=random.choice(ERROR_CODES_POOL),
                scan_date=random_scan_date(),
            )

        log(f"{vehicle.brand} {vehicle.model} ({vehicle.plate}) → {n_scans} scans")

    # ── 5. Favoritos ───────────────────────────────────────────────────────────
    print("\n⭐ Creando favoritos...")
    fav_repo = FavoriteRepository(db)
    published = vehicle_repo.get_published_vehicles()

    for dealer in regular_dealers:
        # Cada dealer marca entre 2 y 5 vehículos publicados de otros
        others = [v for v in published if v.dealer_id != dealer.id]
        picks = random.sample(others, min(len(others), random.randint(2, 5)))
        for v in picks:
            try:
                fav_repo.create_favorite(dealer_id=dealer.id, vehicle_id=v.id)
            except Exception:
                pass  # ya existe (unique constraint)

    log(f"{len(regular_dealers)} dealers con favoritos asignados")

    # ── 6. Notificaciones ──────────────────────────────────────────────────────
    print("\n🔔 Creando notificaciones...")
    notif_repo = NotificationRepository(db)

    for dealer in regular_dealers:
        n = random.randint(2, 5)
        for _ in range(n):
            notif_repo.create_notification(
                dealer_id=dealer.id,
                message=random.choice(COLORS_NOTIF),
            )
        log(f"{dealer.name} → {n} notificaciones")

    db.close()

    print("\n✅ Seed completado.\n")
    print("Accesos de prueba:")
    print("  admin@motora.com       / admin123   (rol: admin)")
    for d in DEALERS[1:]:
        print(f"  {d['email']:<35} / {d['password']}")


if __name__ == "__main__":
    seed()
