import pytest
from app.auth.repository import DealerRepository
from app.vehicles.repository import VehicleRepository
from app.obd2.repository import OBD2Repository


# ── Helpers ────────────────────────────────────────────────────────────────────

def _make_dealer(db, email="d@test.com"):
    return DealerRepository(db).create_dealer("Test Dealer", email, "hashed_pw")


def _make_vehicle(db, dealer_id, vin="VIN001"):
    return VehicleRepository(db).create_vehicle(
        dealer_id=dealer_id,
        vin=vin,
        plate=f"P{vin[-3:]}",
        brand="Ford",
        model="Fiesta",
        year=2020,
        color="Rojo",
    )


# ── DealerRepository ───────────────────────────────────────────────────────────

class TestDealerRepository:
    def test_create_dealer(self, db):
        dealer = DealerRepository(db).create_dealer("Ana", "ana@test.com", "hash")
        assert dealer.id is not None
        assert dealer.email == "ana@test.com"
        assert dealer.role == "dealer"

    def test_get_dealer_by_email_encontrado(self, db):
        DealerRepository(db).create_dealer("Test", "find@test.com", "hash")
        found = DealerRepository(db).get_dealer_by_email("find@test.com")
        assert found is not None
        assert found.name == "Test"

    def test_get_dealer_by_email_no_encontrado(self, db):
        result = DealerRepository(db).get_dealer_by_email("noexiste@test.com")
        assert result is None

    def test_get_dealer_by_id(self, db):
        created = DealerRepository(db).create_dealer("Test", "byid@test.com", "hash")
        found = DealerRepository(db).get_dealer_by_id(created.id)
        assert found is not None
        assert found.email == "byid@test.com"

    def test_get_dealer_by_id_no_encontrado(self, db):
        result = DealerRepository(db).get_dealer_by_id("00000000-0000-0000-0000-000000000000")
        assert result is None

    def test_get_dealers_by_ids_batch(self, db):
        repo = DealerRepository(db)
        d1 = repo.create_dealer("A", "a@test.com", "h")
        d2 = repo.create_dealer("B", "b@test.com", "h")
        d3 = repo.create_dealer("C", "c@test.com", "h")
        results = repo.get_dealers_by_ids([d1.id, d3.id])
        assert len(results) == 2
        ids = {r.id for r in results}
        assert d1.id in ids
        assert d2.id not in ids

    def test_get_all_dealers(self, db):
        repo = DealerRepository(db)
        repo.create_dealer("X", "x@test.com", "h")
        repo.create_dealer("Y", "y@test.com", "h")
        assert len(repo.get_all_dealers()) == 2


# ── VehicleRepository ──────────────────────────────────────────────────────────

class TestVehicleRepository:
    def test_create_vehicle_no_publicado_por_defecto(self, db):
        dealer = _make_dealer(db)
        v = _make_vehicle(db, dealer.id)
        assert v.id is not None
        assert v.is_published is False
        assert v.dealer_id == dealer.id

    def test_get_vehicle_by_id(self, db):
        dealer = _make_dealer(db)
        created = _make_vehicle(db, dealer.id, "FINDVIN")
        found = VehicleRepository(db).get_vehicle_by_id(created.id)
        assert found is not None
        assert found.vin == "FINDVIN"

    def test_get_vehicle_by_id_inexistente(self, db):
        result = VehicleRepository(db).get_vehicle_by_id("00000000-0000-0000-0000-000000000000")
        assert result is None

    def test_get_vehicles_by_dealer_filtra_por_owner(self, db):
        d1 = _make_dealer(db, "d1@test.com")
        d2 = _make_dealer(db, "d2@test.com")
        repo = VehicleRepository(db)
        _make_vehicle(db, d1.id, "V1")
        _make_vehicle(db, d1.id, "V2")
        _make_vehicle(db, d2.id, "V3")

        results = repo.get_vehicles_by_dealer(d1.id)
        assert len(results) == 2
        assert all(v.dealer_id == d1.id for v in results)

    def test_get_published_vehicles_solo_publicados(self, db):
        dealer = _make_dealer(db)
        repo = VehicleRepository(db)
        v_pub = _make_vehicle(db, dealer.id, "PUB001")
        v_priv = _make_vehicle(db, dealer.id, "PRIV001")
        repo.publish_vehicle(v_pub.id, dealer.id)

        published = repo.get_published_vehicles()
        ids = [v.id for v in published]
        assert v_pub.id in ids
        assert v_priv.id not in ids

    def test_publish_vehicle_cambia_is_published(self, db):
        dealer = _make_dealer(db)
        v = _make_vehicle(db, dealer.id)
        assert v.is_published is False
        updated = VehicleRepository(db).publish_vehicle(v.id, dealer.id)
        assert updated is not None
        assert updated.is_published is True

    def test_publish_vehicle_ajeno_retorna_none(self, db):
        d1 = _make_dealer(db, "own@test.com")
        d2 = _make_dealer(db, "other@test.com")
        v = _make_vehicle(db, d1.id)
        result = VehicleRepository(db).publish_vehicle(v.id, d2.id)
        assert result is None


# ── OBD2Repository ─────────────────────────────────────────────────────────────

class TestOBD2Repository:
    def test_create_scan(self, db):
        dealer = _make_dealer(db)
        vehicle = _make_vehicle(db, dealer.id)
        from datetime import datetime
        scan = OBD2Repository(db).create_scan(
            vehicle_id=vehicle.id,
            odometer=85000,
            rpm=800,
            coolant_temp=90.5,
            battery_voltage=12.65,
            error_codes="P0300",
            scan_date=datetime(2024, 1, 15, 10, 30),
        )
        assert scan.id is not None
        assert scan.vehicle_id == vehicle.id
        assert scan.odometer == 85000

    def test_get_scans_by_vehicle_retorna_los_correctos(self, db):
        dealer = _make_dealer(db)
        v1 = _make_vehicle(db, dealer.id, "SCAN_V1")
        v2 = _make_vehicle(db, dealer.id, "SCAN_V2")
        from datetime import datetime
        repo = OBD2Repository(db)
        repo.create_scan(v1.id, 1000, 800, 90.0, 12.6, "", datetime(2024, 1, 1))
        repo.create_scan(v1.id, 2000, 900, 91.0, 12.7, "", datetime(2024, 1, 2))
        repo.create_scan(v2.id, 3000, 700, 88.0, 12.5, "", datetime(2024, 1, 3))

        scans = repo.get_scans_by_vehicle(v1.id)
        assert len(scans) == 2
        assert all(s.vehicle_id == v1.id for s in scans)

    def test_get_scans_vehiculo_sin_scans(self, db):
        dealer = _make_dealer(db)
        vehicle = _make_vehicle(db, dealer.id)
        scans = OBD2Repository(db).get_scans_by_vehicle(vehicle.id)
        assert scans == []
