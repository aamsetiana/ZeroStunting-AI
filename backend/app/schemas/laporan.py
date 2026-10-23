"""
Pydantic Schemas — Laporan e-PPGBM & Rekapitulasi Gizi Balita
=============================================================
Schema data untuk request, ringkasan, dan pembuatan dokumen PDF laporan e-PPGBM.
"""

from __future__ import annotations
from typing import Optional, List
from datetime import date
from pydantic import BaseModel, Field, ConfigDict


class BalitaLaporanItem(BaseModel):
    """Data pengukuran satu balita untuk dicantumkan dalam tabel laporan e-PPGBM."""

    no: Optional[int] = Field(None, description="Nomor urut (diisi otomatis jika kosong)")
    nama_anak: str = Field(..., min_length=2, max_length=100, description="Nama lengkap balita")
    nik: Optional[str] = Field(None, max_length=20, description="NIK balita jika ada")
    tanggal_lahir: Optional[str] = Field(None, description="Tanggal lahir (YYYY-MM-DD)")
    jenis_kelamin: str = Field(..., pattern="^(L|P)$", description="Jenis kelamin ('L' / 'P')")
    umur_bulan: int = Field(..., ge=0, le=60, description="Umur balita dalam bulan saat penimbangan")
    nama_ibu: Optional[str] = Field(None, max_length=100, description="Nama ibu / pengasuh")

    # Hasil Antropometri
    berat_kg: float = Field(..., gt=0, le=35.0, description="Berat badan dalam kg")
    tinggi_cm: float = Field(..., gt=0, le=130.0, description="Tinggi / panjang badan dalam cm")
    lila_cm: Optional[float] = Field(None, gt=0, le=30.0, description="Lingkar Lengan Atas (LiLA) dalam cm")

    # Hasil Kalkulasi Z-Score WHO
    zscore_bbu: Optional[float] = Field(None, description="Z-score BB/U")
    zscore_pbu: Optional[float] = Field(None, description="Z-score PB/U atau TB/U (Indikator Stunting)")
    zscore_bbpb: Optional[float] = Field(None, description="Z-score BB/PB atau BB/TB (Indikator Wasting)")

    # Status Gizi Ringkasan
    status_gizi: str = Field(
        ...,
        description="Status gizi: 'normal', 'pendek' (stunting), 'sangat_pendek', 'kurus', 'gizi_kurang', 'gizi_buruk'",
    )
    rekomendasi_singkat: Optional[str] = Field(
        None, description="Catatan intervensi singkat (misal: 'PMT Telur + Rujuk Puskesmas')"
    )
    perlu_rujukan: bool = Field(
        False, description="Flag rujukan segera ke Puskesmas/FKTP jika gizi buruk atau stunting berat"
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "no": 1,
                "nama_anak": "Budi Santoso",
                "nik": "3201123456780001",
                "tanggal_lahir": "2024-04-10",
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
                "rekomendasi_singkat": "Intervensi MP-ASI pangan lokal tinggi protein hewani (ikan kembung/telur).",
                "perlu_rujukan": False,
            }
        }
    )


class LaporanPosyanduRequest(BaseModel):
    """Request payload untuk generate PDF Rekapitulasi Laporan e-PPGBM Posyandu."""

    nama_posyandu: str = Field(..., min_length=2, max_length=150, description="Nama Posyandu")
    desa_kelurahan: str = Field(..., min_length=2, max_length=150, description="Nama Desa / Kelurahan")
    kecamatan: str = Field(..., min_length=2, max_length=150, description="Nama Kecamatan")
    kabupaten_kota: str = Field(..., min_length=2, max_length=150, description="Nama Kabupaten / Kota")
    provinsi: Optional[str] = Field("Jawa Barat", max_length=100, description="Nama Provinsi")

    # Periode Laporan
    bulan: int = Field(..., ge=1, le=12, description="Bulan penimbangan (1-12)")
    tahun: int = Field(..., ge=2020, le=2050, description="Tahun penimbangan (misal 2026)")

    # Data Penanggung Jawab
    nama_kader: str = Field(..., min_length=2, max_length=100, description="Nama Kader Pelapor")
    nama_bidan_desa: Optional[str] = Field(None, max_length=100, description="Nama Bidan Desa Pemeriksa")
    tanggal_laporan: Optional[date] = Field(default_factory=date.today, description="Tanggal pembuatan laporan")

    # Catatan Umum / Kesimpulan Kader
    catatan_umum: Optional[str] = Field(
        None,
        description="Catatan tambahan Posyandu untuk Puskesmas (misal ketersediaan PMT, vitamin A, dll)",
    )

    # Data Balita
    data_balita: List[BalitaLaporanItem] = Field(
        default_factory=list, description="Daftar balita yang ditimbang pada sesi laporan ini"
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
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
                "catatan_umum": "Penimbangan bulanan rutin Posyandu Melati. Ditemukan 2 balita berisiko stunting.",
                "data_balita": [
                    {
                        "no": 1,
                        "nama_anak": "Budi Santoso",
                        "nik": "3201123456780001",
                        "tanggal_lahir": "2024-04-10",
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
                        "rekomendasi_singkat": "Edukasi MPASI pangan lokal telur + lele.",
                        "perlu_rujukan": False,
                    },
                    {
                        "no": 2,
                        "nama_anak": "Aisyah Putri",
                        "nik": "3201123456780002",
                        "tanggal_lahir": "2025-01-15",
                        "jenis_kelamin": "P",
                        "umur_bulan": 9,
                        "nama_ibu": "Nurhayati",
                        "berat_kg": 8.1,
                        "tinggi_cm": 70.0,
                        "lila_cm": 13.5,
                        "zscore_bbu": 0.1,
                        "zscore_pbu": 0.2,
                        "zscore_bbpb": 0.0,
                        "status_gizi": "normal",
                        "rekomendasi_singkat": "Pertumbuhan sangat baik, lanjutkan ASI & MPASI.",
                        "perlu_rujukan": False,
                    },
                ],
            }
        }
    )


class LaporanSummaryResponse(BaseModel):
    """Ringkasan statistik agregat hasil penimbangan untuk review cepat."""

    nama_posyandu: str
    periode: str
    total_balita: int
    jumlah_normal: int
    persen_normal: float
    jumlah_stunting: int
    persen_stunting: float
    jumlah_gizi_kurang_buruk: int
    persen_gizi_kurang_buruk: float
    jumlah_perlu_rujukan: int
    kader_pelapor: str
    bidan_desa: Optional[str] = None
