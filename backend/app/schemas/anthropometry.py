"""
Pydantic Schemas — ZeroStunting AI
=====================================
Request/Response models untuk API endpoint antropometri.
"""

from __future__ import annotations
from pydantic import BaseModel, Field, field_validator
from typing import Optional
from app.core.who_anthro import JenisKelamin, StatusGizi


# ─────────────────────────────────────────────────────────────────────────────
# REQUEST
# ─────────────────────────────────────────────────────────────────────────────

class AntropometriRequest(BaseModel):
    """Input kalkulasi Z-score antropometri balita."""

    nama_anak: Optional[str] = Field(None, max_length=100, description="Nama anak (opsional)")
    umur_bulan: int = Field(
        ..., ge=0, le=60,
        description="Umur dalam bulan penuh (0–60 bulan)",
        example=24,
    )
    berat_kg: float = Field(
        ..., gt=0, le=35,
        description="Berat badan dalam kilogram",
        example=12.1,
    )
    tinggi_cm: float = Field(
        ..., gt=0, le=130,
        description="Panjang/tinggi badan dalam sentimeter",
        example=87.0,
    )
    jenis_kelamin: JenisKelamin = Field(
        ...,
        description="Jenis kelamin: 'L' (Laki-laki) atau 'P' (Perempuan)",
        example="L",
    )

    @field_validator("berat_kg")
    @classmethod
    def berat_harus_positif(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("Berat badan harus lebih dari 0 kg")
        return round(v, 3)

    @field_validator("tinggi_cm")
    @classmethod
    def tinggi_harus_positif(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("Tinggi badan harus lebih dari 0 cm")
        return round(v, 1)


# ─────────────────────────────────────────────────────────────────────────────
# RESPONSE
# ─────────────────────────────────────────────────────────────────────────────

class ZScoreDetail(BaseModel):
    """Detail Z-score untuk satu indikator gizi."""
    indikator: str = Field(description="'BB/U', 'PB/U', atau 'BB/PB'")
    zscore: float = Field(description="Nilai Z-score (dibulatkan 2 desimal)")
    status: StatusGizi = Field(description="Status gizi berdasarkan cut-off WHO")
    nilai_actual: float = Field(description="Nilai pengukuran aktual")
    median_referensi: float = Field(description="Median referensi WHO (nilai M) untuk usia ini")
    interpretasi: str = Field(description="Kalimat interpretasi dalam Bahasa Indonesia")


class AntropometriResponse(BaseModel):
    """Respons kalkulasi Z-score lengkap."""
    nama_anak: Optional[str] = None
    umur_bulan: int
    berat_kg: float
    tinggi_cm: float
    jenis_kelamin: JenisKelamin

    # Z-score per indikator
    bbu: ZScoreDetail
    pbu: ZScoreDetail
    bbpb: ZScoreDetail

    # Ringkasan risiko
    ada_risiko_stunting: bool
    ada_risiko_wasting: bool
    ada_risiko_underweight: bool

    # Pesan untuk kader
    pesan_peringatan: list[str]
    peringatan_data: list[str] = Field(
        default_factory=list,
        description="Peringatan soft jika data mungkin salah ketik",
    )

    class Config:
        use_enum_values = True
