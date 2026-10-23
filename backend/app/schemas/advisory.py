"""
Pydantic Schemas — Advisory / RAG Engine
==========================================
Schema data untuk request/response endpoint rekomendasi gizi berbasis RAG.
"""

from __future__ import annotations
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict
from app.core.who_anthro import JenisKelamin


# ─────────────────────────────────────────────────────────────────────────────
# REQUEST
# ─────────────────────────────────────────────────────────────────────────────

class AdvisoryRequest(BaseModel):
    """
    Input untuk generate rekomendasi gizi via RAG engine.
    Data ini normalnya diisi otomatis dari hasil kalkulasi WHO Z-score.
    """

    nama_anak: Optional[str] = Field(
        None,
        max_length=100,
        description="Nama anak (opsional, untuk personalisasi narasi)",
    )
    umur_bulan: int = Field(
        ..., ge=0, le=60,
        description="Umur dalam bulan penuh (0–60)",
        examples=[18],
    )
    jenis_kelamin: JenisKelamin = Field(
        ...,
        description="Jenis kelamin: 'L' (Laki-laki) atau 'P' (Perempuan)",
        examples=["L"],
    )
    berat_kg: float = Field(
        ..., gt=0, le=35,
        description="Berat badan dalam kg",
        examples=[9.5],
    )
    tinggi_cm: float = Field(
        ..., gt=0, le=130,
        description="Panjang/tinggi badan dalam cm",
        examples=[80.0],
    )

    # Z-score dari WHO Anthro Engine
    zscore_bbu: float = Field(
        ...,
        description="Z-score Berat Badan per Umur (BB/U) dari WHO engine",
        examples=[-1.5],
    )
    zscore_pbu: float = Field(
        ...,
        description="Z-score Panjang/Tinggi Badan per Umur (PB/U) dari WHO engine",
        examples=[-2.3],
    )
    zscore_bbpb: float = Field(
        ...,
        description="Z-score Berat Badan per Panjang/Tinggi Badan (BB/PB) dari WHO engine",
        examples=[-0.8],
    )
    status_gizi: str = Field(
        ...,
        description="Status gizi ringkasan: 'normal', 'gizi_kurang', 'gizi_buruk', 'pendek', 'sangat_pendek', 'kurus', 'sangat_kurus'",
        examples=["pendek"],
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "nama_anak": "Budi Santoso",
                "umur_bulan": 18,
                "jenis_kelamin": "L",
                "berat_kg": 9.5,
                "tinggi_cm": 80.0,
                "zscore_bbu": -1.5,
                "zscore_pbu": -2.3,
                "zscore_bbpb": -0.8,
                "status_gizi": "pendek",
            }
        }
    )


# ─────────────────────────────────────────────────────────────────────────────
# RESPONSE
# ─────────────────────────────────────────────────────────────────────────────

class AdvisoryResponse(BaseModel):
    """Respons rekomendasi gizi dari RAG engine."""

    # Data identitas
    nama_anak: Optional[str] = Field(None, description="Nama anak")
    umur_bulan: int = Field(..., description="Umur dalam bulan")
    status_gizi: str = Field(..., description="Status gizi input")

    # Rekomendasi utama
    rekomendasi: str = Field(
        ...,
        description=(
            "Rekomendasi gizi lengkap dalam Bahasa Indonesia, berisi: "
            "1. Analisis singkat kondisi gizi, "
            "2. Menu MP-ASI berbasis pangan lokal, "
            "3. Saran tindak lanjut"
        ),
    )

    # Metadata RAG
    jumlah_chunk_retrieved: int = Field(
        ...,
        description="Jumlah chunk knowledge base yang digunakan sebagai konteks",
    )
    engine_used: str = Field(
        ...,
        description="Engine yang digunakan: 'groq_llama3' atau 'template_fallback'",
    )
    konteks_relevan: List[str] = Field(
        default_factory=list,
        description="Potongan teks dari knowledge base yang digunakan sebagai konteks RAG",
    )

    # Human-in-the-Loop flag
    needs_review: bool = Field(
        True,
        description=(
            "Rekomendasi ini dihasilkan oleh AI dan HARUS direview oleh kader "
            "atau tenaga kesehatan sebelum disampaikan kepada ibu/pengasuh balita"
        ),
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "nama_anak": "Budi Santoso",
                "umur_bulan": 18,
                "status_gizi": "pendek",
                "rekomendasi": (
                    "1. ANALISIS SINGKAT\nBudi menunjukkan tanda stunting moderate dengan Z-score PB/U -2.3...\n\n"
                    "2. REKOMENDASI MENU MP-ASI\n• Pagi: Bubur beras + hati ayam + bayam...\n\n"
                    "3. SARAN TINDAK LANJUT\nPantau pertumbuhan setiap bulan..."
                ),
                "jumlah_chunk_retrieved": 4,
                "engine_used": "groq_llama3",
                "konteks_relevan": ["Stunting adalah kondisi...", "Menu untuk bayi stunting..."],
                "needs_review": True,
            }
        }
    )


class ReindexResponse(BaseModel):
    """Respons operasi re-index knowledge base."""
    success: bool
    message: str
    total_chunks: int
