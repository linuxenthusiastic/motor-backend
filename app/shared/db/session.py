from pydantic_settings import BaseSettings
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker


class Settings(BaseSettings):
    database_url: str = "postgresql://motora:motora@localhost:5432/motora"

    class Config:
        env_file = ".env"


settings = Settings()
_db_url = settings.database_url.replace("postgres://", "postgresql://", 1)
engine = create_engine(_db_url)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
