"""
Pydantic Schemas — Balita & Penimbangan
========================================
Schema untuk input dan response pencatatan balita dan penimbangan.
"""

from datetime import date, datetime
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, Field


# ─── Balita Schemas ───────────────────────────────────────────────────────────

class BalitaCreate(BaseModel):
    posyandu_id: Optional[UUID] = None  # jika None, fallback ke default posyandu
    nama: str = Field(..., min_length=1, max_length=200, example="Muhammad Rizky")
    tanggal_lahir: date = Field(..., example="2024-06-15")
    jenis_kelamin: str = Field(..., pattern="^(L|P)$", example="L")
    nama_ibu: Optional[str] = Field(None, max_length=200, example="Siti Aminah")
    alamat: Optional[str] = Field(None, example="RT 02 / RW 03 Desa Sukamaju")


class BalitaResponse(BaseModel):
    id: UUID
    posyandu_id: UUID
    nama: str
    tanggal_lahir: date
    jenis_kelamin: str
    nama_ibu: Optional[str] = None
    alamat: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ─── Penimbangan Schemas ──────────────────────────────────────────────────────

class PenimbanganCreate(BaseModel):
    balita_id: Optional[UUID] = None  # opsional jika dibuat bersamaan dengan balita
    kader_id: Optional[UUID] = None
    tanggal_timbang: date = Field(default_factory=date.today)
    umur_bulan: int = Field(..., ge=0, le=60, example=18)
    berat_kg: float = Field(..., ge=1.5, le=35.0, example=9.2)
    tinggi_cm: float = Field(..., ge=40.0, le=130.0, example=78.5)
    input_mode: Optional[str] = "form"
    foto_url: Optional[str] = None



class SimpanBalitaPenimbanganRequest(BaseModel):
    """Payload satu kali simpan dari form kader."""
    balita: BalitaCreate
    penimbangan: PenimbanganCreate


class PenimbanganResponse(BaseModel):
    id: UUID
    balita_id: UUID
    kader_id: Optional[UUID] = None
    tanggal_timbang: date
    umur_bulan: int
    berat_kg: float
    tinggi_cm: float
    zscore_bbu: Optional[float] = None
    zscore_pbu: Optional[float] = None
    zscore_bbpb: Optional[float] = None
    status_gizi: Optional[str] = None
    input_mode: Optional[str] = "form"
    foto_url: Optional[str] = None
    rekomendasi_gizi: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class SimpanBalitaPenimbanganResponse(BaseModel):
    message: str
    balita: BalitaResponse
    penimbangan: PenimbanganResponse


class BalitaWithPenimbanganResponse(BaseModel):
    id: UUID
    posyandu_id: UUID
    nama: str
    tanggal_lahir: date
    jenis_kelamin: str
    nama_ibu: Optional[str] = None
    alamat: Optional[str] = None
    created_at: Optional[datetime] = None
    penimbangans: List[PenimbanganResponse] = []

    class Config:
        from_attributes = True


class BalitaUpdateRequest(BaseModel):
    nama: Optional[str] = Field(None, min_length=1, max_length=200)
    tanggal_lahir: Optional[date] = None
    jenis_kelamin: Optional[str] = Field(None, pattern="^(L|P)$")
    nama_ibu: Optional[str] = None
    alamat: Optional[str] = None
    umur_bulan: Optional[int] = Field(None, ge=0, le=60)
    berat_kg: Optional[float] = Field(None, ge=1.5, le=35.0)
    tinggi_cm: Optional[float] = Field(None, ge=40.0, le=130.0)


# ─── Posyandu Schemas ─────────────────────────────────────────────────────────

class PosyanduCreate(BaseModel):
    nama: str = Field(..., min_length=1, max_length=200, example="Posyandu Mawar 02")
    desa: Optional[str] = Field(None, max_length=200, example="Desa Sukamaju")
    kecamatan: Optional[str] = Field(None, max_length=200, example="Ciawi")
    kabupaten: Optional[str] = Field(None, max_length=200, example="Bogor")
    provinsi: Optional[str] = Field(None, max_length=200, example="Jawa Barat")


class PosyanduResponse(BaseModel):
    id: UUID
    nama: str
    desa: Optional[str] = None
    kecamatan: Optional[str] = None
    kabupaten: Optional[str] = None
    provinsi: Optional[str] = None
    created_at: Optional[datetime] = None
    total_balita: Optional[int] = 0

    class Config:
        from_attributes = True


