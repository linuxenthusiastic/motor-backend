import os

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

_raw_url = os.getenv("DATABASE_URL", "postgresql://motora:motora@localhost:5432/motora")
DATABASE_URL = _raw_url.replace("postgres://", "postgresql://", 1)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
