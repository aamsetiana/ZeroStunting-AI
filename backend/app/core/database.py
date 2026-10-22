"""
ZeroStunting AI — Database Configuration
=========================================
Mengelola koneksi ke Supabase PostgreSQL menggunakan SQLAlchemy.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql://postgres:password@localhost:5432/zerostunting"
    supabase_url: str = ""
    supabase_service_key: str = ""
    app_env: str = "development"
    debug: bool = True
    cors_origins: str = "http://localhost:3000"
    groq_api_key: str = ""

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()

# ─────────────────────────────────────────────────────────────────────────────
# SQLAlchemy Engine
# ─────────────────────────────────────────────────────────────────────────────

engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,       # cek koneksi sebelum dipakai
    pool_size=5,
    max_overflow=10,
    echo=settings.debug,      # log SQL query di development
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


# ─────────────────────────────────────────────────────────────────────────────
# Base Model
# ─────────────────────────────────────────────────────────────────────────────

class Base(DeclarativeBase):
    pass


# ─────────────────────────────────────────────────────────────────────────────
# Dependency — dipakai di FastAPI endpoint
# ─────────────────────────────────────────────────────────────────────────────

def get_db():
    """
    FastAPI dependency untuk mendapatkan database session.
    Otomatis menutup session setelah request selesai.

    Contoh penggunaan di endpoint:
        @router.get("/balita")
        def get_balita(db: Session = Depends(get_db)):
            ...
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
