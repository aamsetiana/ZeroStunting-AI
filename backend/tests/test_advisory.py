"""
Unit Test — Advisory Gizi Balita (RAG Knowledge Base)
======================================================
Menguji logika preskripsi intervensi gizi pangan lokal tanpa ketergantungan HTTP eksternal.
"""

import sys
from pathlib import Path
import pytest

# Tambahkan backend ke sys.path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.api.advisory import generate_advisory
from app.schemas.advisory import AdvisoryRequest


@pytest.mark.asyncio
async def test_advisory_stunting():
    req = AdvisoryRequest(
        nama_anak="Budi Santoso",
        umur_bulan=24,
        berat_kg=10.0,
        tinggi_cm=80.0,
        jenis_kelamin="L",
        status_gizi="Stunting (pendek)",
        zscore_pbu=-2.4,
    )
    res = await generate_advisory(req)
    assert "Budi Santoso" in res.analisis_kondisi
    assert "Hati Ayam" in str(res.bahan_pangan_rekomendasi)
    assert len(res.rekomendasi_menu) == 7
    assert res.status_rujukan is True


@pytest.mark.asyncio
async def test_advisory_normal():
    req = AdvisoryRequest(
        nama_anak="Siti Aminah",
        umur_bulan=12,
        berat_kg=9.5,
        tinggi_cm=75.0,
        jenis_kelamin="P",
        status_gizi="Normal",
        zscore_pbu=0.2,
    )
    res = await generate_advisory(req)
    assert "Siti Aminah" in res.analisis_kondisi
    assert len(res.rekomendasi_menu) == 7
    assert res.status_rujukan is False


@pytest.mark.asyncio
async def test_advisory_wasting():
    req = AdvisoryRequest(
        nama_anak="Dimas",
        umur_bulan=18,
        berat_kg=8.0,
        tinggi_cm=82.0,
        jenis_kelamin="L",
        status_gizi="Gizi Kurang (Wasting)",
        zscore_bbpb=-2.5,
    )
    res = await generate_advisory(req)
    assert "Santan Kelapa" in str(res.bahan_pangan_rekomendasi)
    assert res.status_rujukan is True
