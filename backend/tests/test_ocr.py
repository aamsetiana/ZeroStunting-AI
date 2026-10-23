"""
Unit Tests — OCR Endpoint & Engine
===================================
Memastikan ekstraksi data balita dari foto catatan timbang KMS akurat,
mendukung variasi penulisan bahasa Indonesia, dan mematuhi prinsip Human-in-the-Loop.
"""

import pytest
import sys
from pathlib import Path
from io import BytesIO

# Tambahkan backend ke sys.path
sys.path.insert(0, str(Path(__file__).parent.parent))

from fastapi.testclient import TestClient
from app.main import app
from app.core.ocr_engine import parse_kms_text

client = TestClient(app)


# ─────────────────────────────────────────────────────────────────────────────
# 1. HEALTH CHECK & API BASICS
# ─────────────────────────────────────────────────────────────────────────────

def test_ocr_health():
    """Endpoint health check OCR harus mengembalikan status ok."""
    response = client.get("/api/v1/ocr/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "OCR Engine" in data["service"]
    assert "vision_api_configured" in data


def test_ocr_parse_empty_text_returns_400():
    """Teks kosong harus menghasilkan 400 Bad Request."""
    response = client.post("/api/v1/ocr/parse-text", json={"raw_text": "   "})
    assert response.status_code == 400


# ─────────────────────────────────────────────────────────────────────────────
# 2. PARSING TEKS KMS (STANDAR & FORMAT POPULER)
# ─────────────────────────────────────────────────────────────────────────────

def test_ocr_parse_text_standard_kms():
    """Uji parsing teks format standar catatan timbang Posyandu."""
    raw_text = (
        "POSYANDU MAWAR DESA SUKAMAJU\n"
        "Nama Balita: Muhammad Rizky\n"
        "Jenis Kelamin: Laki-laki\n"
        "Usia: 18 bulan\n"
        "BB: 10.5 kg\n"
        "TB: 81.2 cm\n"
        "Tanggal Timbang: 15/10/2026\n"
    )
    response = client.post("/api/v1/ocr/parse-text", json={"raw_text": raw_text})
    assert response.status_code == 200
    data = response.json()

    assert data["success"] is True
    assert data["nama_anak"] == "Muhammad Rizky"
    assert data["jenis_kelamin"] == "L"
    assert data["umur_bulan"] == 18
    assert data["berat_kg"] == 10.5
    assert data["tinggi_cm"] == 81.2
    assert data["tanggal_timbang"] == "2026-10-15"
    assert data["needs_confirmation"] is True
    assert data["overall_confidence"] >= 0.8
    assert len(data["warnings"]) == 0


def test_ocr_parse_text_comma_decimals_and_years():
    """Uji penulisan desimal dengan koma (8,4 kg) dan umur tahun-bulan (1 th 3 bln)."""
    raw_text = (
        "Buku KIA / KMS\n"
        "Nama: Aisyah Putri\n"
        "JK: P\n"
        "Umur: 1 th 3 bln\n"
        "BB : 9,2 kg\n"
        "PB : 76,5 cm\n"
    )
    response = client.post("/api/v1/ocr/parse-text", json={"raw_text": raw_text})
    assert response.status_code == 200
    data = response.json()

    assert data["success"] is True
    assert data["nama_anak"] == "Aisyah Putri"
    assert data["jenis_kelamin"] == "P"
    assert data["umur_bulan"] == 15  # 1 th (12) + 3 bln = 15
    assert data["berat_kg"] == 9.2
    assert data["tinggi_cm"] == 76.5
    assert data["needs_confirmation"] is True


def test_ocr_parse_an_prefix():
    """Uji nama anak yang diawali 'a/n' atau 'an.'."""
    raw_text = "an. Siti Nurhaliza\nUmur: 24 bln\nBB: 11.5 kg\nTB: 86.0 cm\nJK: Perempuan"
    data = parse_kms_text(raw_text)
    assert data.nama_anak == "Siti Nurhaliza"
    assert data.umur_bulan == 24
    assert data.berat_kg == 11.5
    assert data.jenis_kelamin == "P"


def test_ocr_parse_years_only():
    """Uji umur dalam format tahun saja (misal '2 tahun' -> 24 bulan)."""
    raw_text = "Nama: Budi\nUsia: 2 tahun\nBB: 12.0 kg\nTB: 87.0 cm"
    data = parse_kms_text(raw_text)
    assert data.umur_bulan == 24


def test_ocr_parse_lila_cm():
    """Uji ekstraksi Lingkar Lengan Atas (LiLA) jika ada."""
    raw_text = (
        "Nama: Zahra\n"
        "Usia: 14 bln\n"
        "BB: 8.8 kg\n"
        "TB: 75.0 cm\n"
        "LiLA: 12.5 cm\n"
        "JK: P"
    )
    data = parse_kms_text(raw_text)
    assert data.lila_cm == 12.5
    assert "lila_cm" in data.extracted_fields
    assert data.extracted_fields["lila_cm"].value == 12.5


def test_ocr_parse_date_two_digit_year():
    """Uji parsing tanggal dengan tahun 2-digit (15/10/26 -> 2026-10-15)."""
    raw_text = "Nama: Rudi\nBB: 10 kg\nTB: 80 cm\nUmur: 12 bln\nTgl: 15/10/26"
    data = parse_kms_text(raw_text)
    assert data.tanggal_timbang == "2026-10-15"


def test_ocr_parse_date_iso_format():
    """Uji parsing tanggal dengan format ISO YYYY-MM-DD."""
    raw_text = "Nama: Rudi\nBB: 10 kg\nTB: 80 cm\nUmur: 12 bln\nTanggal Timbang: 2026-08-20"
    data = parse_kms_text(raw_text)
    assert data.tanggal_timbang == "2026-08-20"


def test_ocr_gender_variations():
    """Uji berbagai variasi penulisan jenis kelamin."""
    # Laki-laki
    d1 = parse_kms_text("Nama: Dani\nJK: Laki-laki\nBB: 9 kg\nTB: 75 cm\nUsia: 12")
    assert d1.jenis_kelamin == "L"

    # Perempuan
    d2 = parse_kms_text("Nama: Dania\nJK: Perempuan\nBB: 9 kg\nTB: 75 cm\nUsia: 12")
    assert d2.jenis_kelamin == "P"

    # Singkatan L
    d3 = parse_kms_text("Nama: Dani\nJK: L\nBB: 9 kg\nTB: 75 cm\nUsia: 12")
    assert d3.jenis_kelamin == "L"

    # Singkatan P
    d4 = parse_kms_text("Nama: Dania\nJK: P\nBB: 9 kg\nTB: 75 cm\nUsia: 12")
    assert d4.jenis_kelamin == "P"


# ─────────────────────────────────────────────────────────────────────────────
# 3. BATAS BIOLOGIS MEDIS & WARNINGS
# ─────────────────────────────────────────────────────────────────────────────

def test_ocr_parse_missing_fields_triggers_warnings():
    """Jika ada kolom penting yang tidak terdeteksi, harus muncul warning."""
    raw_text = "Nama: Budi\nBB: 8.0 kg"
    response = client.post("/api/v1/ocr/parse-text", json={"raw_text": raw_text})
    assert response.status_code == 200
    data = response.json()

    assert data["berat_kg"] == 8.0
    assert data["tinggi_cm"] is None
    assert data["umur_bulan"] is None
    assert len(data["warnings"]) > 0
    assert data["needs_confirmation"] is True


def test_ocr_biological_bounds_weight_too_high():
    """Berat badan di atas 35 kg (tidak wajar untuk balita <=60 bln) harus diabaikan."""
    raw_text = "Nama: Anak X\nUmur: 12 bln\nBB: 65 kg\nTB: 75 cm"
    data = parse_kms_text(raw_text)
    # 65 kg melebihi CONSTRAINTS max (35 kg)
    assert data.berat_kg is None
    assert any("berat badan" in w.lower() for w in data.warnings)


def test_ocr_biological_bounds_height_too_high():
    """Tinggi badan di atas 130 cm harus diabaikan."""
    raw_text = "Nama: Anak Y\nUmur: 12 bln\nBB: 9.0 kg\nTB: 180 cm"
    data = parse_kms_text(raw_text)
    # 180 cm melebihi CONSTRAINTS max (130 cm)
    assert data.tinggi_cm is None
    assert any("tinggi" in w.lower() for w in data.warnings)


def test_ocr_empty_fields_all_missing():
    """Teks tanpa info balita harus menghasilkan confidence 0 dan warning."""
    raw_text = "KANTOR KELURAHAN DESA SEJAHTERA\nHARI LIBUR NASIONAL"
    data = parse_kms_text(raw_text)
    assert data.nama_anak is None
    assert data.berat_kg is None
    assert data.tinggi_cm is None
    assert data.overall_confidence == 0.0
    assert len(data.warnings) > 0


def test_ocr_noisy_background_text():
    """Ekstraksi harus tetap berhasil meski dikelilingi teks pengantar posyandu."""
    raw_text = (
        "PEMERINTAH KABUPATEN BOGOR\n"
        "PUSKESMAS KECAMATAN CIBINONG\n"
        "REGISTER PENIMBANGAN BULANAN BALITA\n"
        "Kader: Ibu Sumiati (RT 03 / RW 05)\n"
        "====================================\n"
        "Nama Balita : Farhan Alamsyah\n"
        "Jenis Kelamin : L\n"
        "Usia : 20 bln\n"
        "Berat Badan : 10.8 kg\n"
        "Panjang Badan : 83.5 cm\n"
        "LiLA : 13.0 cm\n"
        "Tanggal : 12-10-2026\n"
        "Catatan: Anak aktif dan sehat\n"
        "====================================\n"
        "Tanda Tangan Kader\n"
    )
    data = parse_kms_text(raw_text)
    assert data.nama_anak == "Farhan Alamsyah"
    assert data.jenis_kelamin == "L"
    assert data.umur_bulan == 20
    assert data.berat_kg == 10.8
    assert data.tinggi_cm == 83.5
    assert data.lila_cm == 13.0
    assert data.tanggal_timbang == "2026-10-12"
    assert data.needs_confirmation is True


# ─────────────────────────────────────────────────────────────────────────────
# 4. UPLOAD FILE GAMBAR & MULTIPART
# ─────────────────────────────────────────────────────────────────────────────

def test_ocr_upload_image_file():
    """Uji upload file gambar catatan timbang KMS."""
    dummy_text = (
        "Posyandu Melati\n"
        "Nama: Ahmad Fathan\n"
        "Usia: 24 bln\n"
        "BB: 11.2 kg\n"
        "TB: 85.0 cm\n"
        "JK: L"
    )
    file_bytes = dummy_text.encode("utf-8")
    files = {"file": ("catatan_kms.jpg", BytesIO(file_bytes), "image/jpeg")}

    response = client.post("/api/v1/ocr/extract", files=files)
    assert response.status_code == 200
    data = response.json()

    assert data["success"] is True
    assert data["nama_anak"] == "Ahmad Fathan"
    assert data["umur_bulan"] == 24
    assert data["berat_kg"] == 11.2
    assert data["tinggi_cm"] == 85.0
    assert data["jenis_kelamin"] == "L"
    assert data["needs_confirmation"] is True


def test_ocr_upload_png_format():
    """Uji upload gambar dalam format PNG."""
    dummy_text = "Nama: Putri\nUsia: 10 bln\nBB: 8.2 kg\nTB: 71.0 cm\nJK: P"
    files = {"file": ("kms_scan.png", BytesIO(dummy_text.encode("utf-8")), "image/png")}
    response = client.post("/api/v1/ocr/extract", files=files)
    assert response.status_code == 200
    assert response.json()["nama_anak"] == "Putri"


def test_ocr_upload_webp_format():
    """Uji upload gambar dalam format WebP."""
    dummy_text = "Nama: Doni\nUsia: 30 bln\nBB: 13.0 kg\nTB: 90.0 cm\nJK: L"
    files = {"file": ("kms.webp", BytesIO(dummy_text.encode("utf-8")), "image/webp")}
    response = client.post("/api/v1/ocr/extract", files=files)
    assert response.status_code == 200
    assert response.json()["nama_anak"] == "Doni"


def test_ocr_upload_empty_file_returns_400():
    """Upload file kosong harus ditolak dengan 400."""
    files = {"file": ("empty.jpg", BytesIO(b""), "image/jpeg")}
    response = client.post("/api/v1/ocr/extract", files=files)
    assert response.status_code == 400


def test_ocr_upload_invalid_mime_type():
    """Upload MIME type tidak valid harus ditolak."""
    files = {"file": ("script.js", BytesIO(b"console.log('hi');"), "application/javascript")}
    response = client.post("/api/v1/ocr/extract", files=files)
    assert response.status_code == 400


def test_ocr_upload_file_too_large():
    """File melebihi batas 10MB harus ditolak dengan 413."""
    oversized_bytes = b"x" * (10 * 1024 * 1024 + 1024)
    files = {"file": ("huge.jpg", BytesIO(oversized_bytes), "image/jpeg")}
    response = client.post("/api/v1/ocr/extract", files=files)
    assert response.status_code == 413
