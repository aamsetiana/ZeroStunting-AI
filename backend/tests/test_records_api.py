"""
Integration / Mock Tests — Records API
========================================
Menguji endpoint records dengan in-memory SQLite agar CI GitHub Actions
bisa berjalan sukses tanpa membutuhkan live PostgreSQL/Supabase instance.
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.core.database import Base, get_db
from app.models.database import Posyandu, Kader

# Buat in-memory SQLite database khusus untuk unit tests
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

test_engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="module", autouse=True)
def setup_test_db():
    # Buat tabel di in-memory SQLite
    Base.metadata.create_all(bind=test_engine)

    # Seed Posyandu & Kader untuk pengujian
    db = TestingSessionLocal()
    posyandu = Posyandu(
        nama="Posyandu Melati Test",
        desa="Sukamaju",
        kecamatan="Ciawi",
        kabupaten="Bogor",
        provinsi="Jawa Barat",
    )
    db.add(posyandu)
    db.commit()
    db.refresh(posyandu)

    kader = Kader(
        posyandu_id=posyandu.id,
        nama="Kader Test",
        email="kader@test.com",
        phone="08123456789",
        role="kader",
        is_active=True,
    )
    db.add(kader)
    db.commit()
    db.close()

    yield

    Base.metadata.drop_all(bind=test_engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["service"] == "ZeroStunting AI Backend"


def test_list_balita():
    response = client.get("/api/v1/records/balita")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_simpan_balita_dan_penimbangan():
    payload = {
        "balita": {
            "nama": "Ahmad Fauzi (Test)",
            "tanggal_lahir": "2024-04-10",
            "jenis_kelamin": "L",
            "nama_ibu": "Ibu Fauziah",
            "alamat": "Desa Sukamaju RT 01",
        },
        "penimbangan": {
            "tanggal_timbang": "2026-10-22",
            "umur_bulan": 18,
            "berat_kg": 10.5,
            "tinggi_cm": 82.0,
            "input_mode": "form",
        },
    }
    response = client.post("/api/v1/records/simpan", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert "balita" in data
    assert data["balita"]["nama"] == "Ahmad Fauzi (Test)"
    assert "penimbangan" in data
    assert data["penimbangan"]["zscore_bbu"] is not None
    assert data["penimbangan"]["zscore_pbu"] is not None
    assert data["penimbangan"]["status_gizi"] is not None
