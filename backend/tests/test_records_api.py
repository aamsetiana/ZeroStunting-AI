"""
Integration Tests — Records API (Supabase / Database Layer)
============================================================
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app

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
