import os
from unittest.mock import MagicMock, patch

# ── Mockear Redis y Elasticsearch ANTES de importar cualquier módulo de la app ──
# redis.Redis() y Elasticsearch() se llaman al importar cache.py y search.py
_redis_mock = MagicMock()
_redis_mock.get.return_value = None  # cache siempre miss en tests
_redis_patcher = patch("redis.Redis", return_value=_redis_mock)
_redis_patcher.start()

_es_mock = MagicMock()
_es_mock.search.return_value = {"hits": {"hits": []}}
_es_patcher = patch("elasticsearch.Elasticsearch", return_value=_es_mock)
_es_patcher.start()

# ── Ahora sí importamos la app ──────────────────────────────────────────────────
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from main import app
from app.shared.db.base import Base
from app.shared.db.session import get_db

import app.auth.models          # noqa: F401  registra modelos en Base.metadata
import app.vehicles.models      # noqa: F401
import app.obd2.models          # noqa: F401
import app.notifications.models # noqa: F401
import app.ugc.models           # noqa: F401
import app.catalog.models       # noqa: F401

TEST_DB_URL = os.getenv(
    "TEST_DATABASE_URL",
    "postgresql://motora:motora@localhost:5432/motora_test",
)
_engine = create_engine(TEST_DB_URL)
_TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=_engine)


@pytest.fixture(scope="session", autouse=True)
def setup_database():
    with _engine.connect() as conn:
        for schema in ["auth", "obd2", "catalog", "ugc", "notifications"]:
            conn.execute(text(f"CREATE SCHEMA IF NOT EXISTS {schema}"))
        conn.commit()
    Base.metadata.create_all(bind=_engine)
    yield


@pytest.fixture(autouse=True)
def clean_tables():
    with _engine.connect() as conn:
        conn.execute(text("DELETE FROM notifications.notifications"))
        conn.execute(text("DELETE FROM ugc.favorites"))
        conn.execute(text("DELETE FROM obd2.obd2_scan"))
        conn.execute(text("DELETE FROM obd2.vehicles"))
        conn.execute(text("DELETE FROM auth.dealers"))
        conn.execute(text("DELETE FROM catalog.car_models"))
        conn.commit()
    yield


@pytest.fixture
def db():
    session = _TestingSession()
    yield session
    session.close()


@pytest.fixture
def client(db):
    def _override_get_db():
        yield db

    app.dependency_overrides[get_db] = _override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def registered_dealer(client):
    client.post("/auth/register", json={
        "name": "Dealer Test",
        "email": "dealer@test.com",
        "password": "password123",
    })
    return {"email": "dealer@test.com", "password": "password123"}


@pytest.fixture
def auth_token(client, registered_dealer):
    resp = client.post("/auth/login", json=registered_dealer)
    return resp.json()["access_token"]


@pytest.fixture
def auth_headers(auth_token):
    return {"Authorization": f"Bearer {auth_token}"}
