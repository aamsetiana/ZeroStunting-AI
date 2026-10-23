"""
Unit Tests — Laporan e-PPGBM & Generator PDF
=============================================
Memastikan keakuratan pembuatan dokumen PDF laporan e-PPGBM standar Kemenkes,
kalkulasi agregat stunting, validasi Pydantic, dan keandalan endpoint FastAPI.
"""

import sys
from pathlib import Path
from datetime import date
import pytest

# Tambahkan backend ke sys.path
sys.path.insert(0, str(Path(__file__).parent.parent))

from fastapi.testclient import TestClient
from app.main import app
from app.schemas.laporan import LaporanPosyanduRequest, BalitaLaporanItem
from app.core.pdf_generator import generate_e_ppgbm_pdf, hitung_statistik_laporan

client = TestClient(app)


# ─────────────────────────────────────────────────────────────────────────────
# FIXTURES
# ─────────────────────────────────────────────────────────────────────────────

@pytest.fixture
def sample_payload() -> dict:
    """Fixture payload standar rekapitulasi laporan posyandu."""
    return {
        "nama_posyandu": "Posyandu Melati 03",
        "desa_kelurahan": "Desa Sukamaju",
        "kecamatan": "Kecamatan Cibinong",
        "kabupaten_kota": "Kabupaten Bogor",
        "provinsi": "Jawa Barat",
        "bulan": 10,
        "tahun": 2026,
        "nama_kader": "Ibu Sumiati",
        "nama_bidan_desa": "Bdn. Rina Marlina, S.Tr.Keb",
        "tanggal_laporan": "2026-10-23",
        "catatan_umum": "Semua balita stunting telah diberikan konseling gizi intensif.",
        "data_balita": [
            {
                "no": 1,
                "nama_anak": "Budi Santoso",
                "nik": "3201001",
                "tanggal_lahir": "2025-04-10",
                "jenis_kelamin": "L",
                "umur_bulan": 18,
                "nama_ibu": "Siti Aminah",
                "berat_kg": 9.2,
                "tinggi_cm": 78.5,
                "lila_cm": 12.0,
                "zscore_bbu": -1.8,
                "zscore_pbu": -2.4,
                "zscore_bbpb": -0.9,
                "status_gizi": "pendek",
                "rekomendasi_singkat": "PMT telur dan tempe.",
                "perlu_rujukan": False,
            },
            {
                "no": 2,
                "nama_anak": "Aisyah Putri",
                "nik": "3201002",
                "tanggal_lahir": "2025-11-15",
                "jenis_kelamin": "P",
                "umur_bulan": 11,
                "nama_ibu": "Nurhayati",
                "berat_kg": 8.5,
                "tinggi_cm": 72.0,
                "lila_cm": 13.5,
                "zscore_bbu": 0.2,
                "zscore_pbu": 0.1,
                "zscore_bbpb": 0.1,
                "status_gizi": "normal",
                "rekomendasi_singkat": "Pertumbuhan optimal.",
                "perlu_rujukan": False,
            },
            {
                "no": 3,
                "nama_anak": "Dimas Saputra",
                "nik": "3201003",
                "tanggal_lahir": "2024-08-20",
                "jenis_kelamin": "L",
                "umur_bulan": 26,
                "nama_ibu": "Sri Wahyuni",
                "berat_kg": 8.8,
                "tinggi_cm": 81.0,
                "lila_cm": 11.2,
                "zscore_bbu": -3.1,
                "zscore_pbu": -3.2,
                "zscore_bbpb": -2.8,
                "status_gizi": "sangat_pendek",
                "rekomendasi_singkat": "Stunting parah, segera bawa ke Puskesmas.",
                "perlu_rujukan": True,
            },
        ],
    }


# ─────────────────────────────────────────────────────────────────────────────
# 1. HEALTH CHECK & METADATA ENDPOINTS
# ─────────────────────────────────────────────────────────────────────────────

def test_laporan_health():
    """Endpoint health check laporan harus mengembalikan status ok dan versi ReportLab."""
    response = client.get("/api/v1/laporan/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "PDF Generator" in data["service"]
    assert "reportlab_version" in data
    assert "Landscape A4" in data["page_format"]


def test_laporan_sample_endpoint():
    """Endpoint /sample harus mengembalikan contoh data yang lengkap dan valid."""
    response = client.get("/api/v1/laporan/sample")
    assert response.status_code == 200
    data = response.json()
    assert data["nama_posyandu"] == "Posyandu Melati 03"
    assert data["bulan"] == 10
    assert len(data["data_balita"]) >= 3


# ─────────────────────────────────────────────────────────────────────────────
# 2. PREVIEW SUMMARY & AGGREGATE STATS
# ─────────────────────────────────────────────────────────────────────────────

def test_laporan_preview_summary_calculation(sample_payload):
    """Endpoint preview-summary harus menghitung metrik agregat dengan akurat."""
    response = client.post("/api/v1/laporan/preview-summary", json=sample_payload)
    assert response.status_code == 200
    summary = response.json()

    assert summary["nama_posyandu"] == "Posyandu Melati 03"
    assert summary["total_balita"] == 3
    assert summary["jumlah_normal"] == 1
    assert summary["persen_normal"] == 33.3
    # Budi (pendek) + Dimas (sangat_pendek) = 2 stunting
    assert summary["jumlah_stunting"] == 2
    assert summary["persen_stunting"] == 66.7
    # Dimas (gizi buruk zscore_bbu -3.1) = 1
    assert summary["jumlah_gizi_kurang_buruk"] == 1
    assert summary["jumlah_perlu_rujukan"] == 1
    assert summary["kader_pelapor"] == "Ibu Sumiati"


def test_hitung_statistik_laporan_empty():
    """Fungsi hitung_statistik_laporan dengan daftar kosong harus mengembalikan nilai 0."""
    stats = hitung_statistik_laporan([])
    assert stats["total"] == 0
    assert stats["stunting"] == 0
    assert stats["pct_stunting"] == 0.0
    assert stats["rujukan"] == 0


def test_hitung_statistik_laporan_all_normal():
    """Semua balita normal harus menghasilkan 100% normal dan 0% stunting."""
    items = [
        BalitaLaporanItem(
            nama_anak=f"Anak {i}",
            jenis_kelamin="L",
            umur_bulan=12,
            berat_kg=9.5,
            tinggi_cm=75.0,
            status_gizi="normal",
            zscore_pbu=0.5,
            zscore_bbu=0.2,
        )
        for i in range(5)
    ]
    stats = hitung_statistik_laporan(items)
    assert stats["total"] == 5
    assert stats["normal"] == 5
    assert stats["pct_normal"] == 100.0
    assert stats["stunting"] == 0
    assert stats["pct_stunting"] == 0.0


# ─────────────────────────────────────────────────────────────────────────────
# 3. GENERATE PDF ENDPOINT
# ─────────────────────────────────────────────────────────────────────────────

def test_generate_pdf_endpoint_success(sample_payload):
    """Endpoint /generate harus mengembalikan file binary PDF valid."""
    response = client.post("/api/v1/laporan/generate", json=sample_payload)
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert "attachment" in response.headers["content-disposition"]
    assert "Posyandu_Melati_03" in response.headers["content-disposition"]
    assert "10_2026.pdf" in response.headers["content-disposition"]

    # Verifikasi magic byte PDF (%PDF-)
    content = response.content
    assert content.startswith(b"%PDF-")
    assert len(content) > 2000


def test_generate_pdf_empty_balita_list(sample_payload):
    """Generate PDF dengan data balita kosong tetap harus menghasilkan dokumen valid."""
    sample_payload["data_balita"] = []
    response = client.post("/api/v1/laporan/generate", json=sample_payload)
    assert response.status_code == 200
    assert response.content.startswith(b"%PDF-")


def test_generate_pdf_multipage_dataset(sample_payload):
    """Generate PDF dengan 20 balita harus memicu pembuatan halaman berikutnya tanpa error."""
    balita_list = []
    for i in range(1, 21):
        balita_list.append({
            "no": i,
            "nama_anak": f"Balita Test {i}",
            "nik": f"3201{i:04d}",
            "jenis_kelamin": "L" if i % 2 == 0 else "P",
            "umur_bulan": 10 + (i % 40),
            "nama_ibu": f"Ibu Balita {i}",
            "berat_kg": 8.0 + (i * 0.2),
            "tinggi_cm": 70.0 + (i * 0.8),
            "lila_cm": 12.0,
            "zscore_bbu": -0.5,
            "zscore_pbu": -1.2 if i % 3 != 0 else -2.5,
            "zscore_bbpb": -0.2,
            "status_gizi": "pendek" if i % 3 == 0 else "normal",
            "rekomendasi_singkat": "Pemantauan berkala.",
            "perlu_rujukan": (i % 3 == 0),
        })
    sample_payload["data_balita"] = balita_list

    response = client.post("/api/v1/laporan/generate", json=sample_payload)
    assert response.status_code == 200
    assert response.content.startswith(b"%PDF-")
    assert len(response.content) > 6000


# ─────────────────────────────────────────────────────────────────────────────
# 4. CORE ENGINE DIRECT TESTING
# ─────────────────────────────────────────────────────────────────────────────

def test_core_generate_e_ppgbm_pdf_direct(sample_payload):
    """Uji langsung fungsi generate_e_ppgbm_pdf() mengembalikan bytes valid."""
    req = LaporanPosyanduRequest(**sample_payload)
    pdf_bytes = generate_e_ppgbm_pdf(req)
    assert isinstance(pdf_bytes, bytes)
    assert pdf_bytes.startswith(b"%PDF-")
    assert b"%%EOF" in pdf_bytes


# ─────────────────────────────────────────────────────────────────────────────
# 5. INPUT VALIDATION & ERROR HANDLING
# ─────────────────────────────────────────────────────────────────────────────

def test_laporan_invalid_month(sample_payload):
    """Bulan 13 (tidak valid) harus ditolak dengan 422 Unprocessable Entity."""
    sample_payload["bulan"] = 13
    response = client.post("/api/v1/laporan/generate", json=sample_payload)
    assert response.status_code == 422


def test_laporan_invalid_year(sample_payload):
    """Tahun sebelum 2020 harus ditolak dengan 422."""
    sample_payload["tahun"] = 2010
    response = client.post("/api/v1/laporan/generate", json=sample_payload)
    assert response.status_code == 422


def test_laporan_missing_posyandu_name(sample_payload):
    """Nama posyandu kosong harus ditolak dengan 422."""
    sample_payload["nama_posyandu"] = ""
    response = client.post("/api/v1/laporan/generate", json=sample_payload)
    assert response.status_code == 422


def test_laporan_balita_weight_out_of_bounds(sample_payload):
    """Berat badan balita > 35 kg harus ditolak oleh schema validasi."""
    sample_payload["data_balita"][0]["berat_kg"] = 99.0
    response = client.post("/api/v1/laporan/generate", json=sample_payload)
    assert response.status_code == 422
