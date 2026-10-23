"""
Pydantic Schemas — Voice / Speech-to-Text
==========================================
Schema data untuk input & output endpoint voice transcription ZeroStunting AI.
"""

from __future__ import annotations
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field


class FieldDetectionVoice(BaseModel):
    """Metadata deteksi per kolom data dari transkripsi suara."""
    value: Any = Field(description="Nilai yang berhasil diekstrak dari ucapan")
    confidence: float = Field(ge=0.0, le=1.0, description="Skor kepercayaan deteksi (0.0 - 1.0)")
    source_phrase: Optional[str] = Field(None, description="Potongan kalimat asal yang terdeteksi")


class VoiceTranscribeResponse(BaseModel):
    """
    Hasil transkripsi dan parsing data balita dari input suara kader Posyandu.

    Alur:
      Suara kader → Whisper (transkripsi) → NLP parser → data terstruktur balita
    """

    success: bool = Field(True, description="Status keberhasilan pemrosesan suara")
    transcription: str = Field("", description="Hasil transkripsi teks penuh dari suara")

    # Data balita yang berhasil diekstrak
    nama_anak: Optional[str] = Field(None, description="Nama anak jika tersebutkan")
    umur_bulan: Optional[int] = Field(None, ge=0, le=60, description="Umur dalam bulan (0-60)")
    berat_kg: Optional[float] = Field(None, gt=0, le=35, description="Berat badan balita (kg)")
    tinggi_cm: Optional[float] = Field(None, gt=0, le=130, description="Panjang/tinggi badan balita (cm)")
    jenis_kelamin: Optional[str] = Field(None, description="Jenis kelamin ('L' / 'P')")
    tanggal_timbang: Optional[str] = Field(None, description="Tanggal penimbangan (format YYYY-MM-DD)")

    # Metadata kualitas hasil
    overall_confidence: float = Field(
        ..., ge=0.0, le=1.0, description="Rata-rata tingkat kepercayaan hasil parsing"
    )
    extracted_fields: Dict[str, FieldDetectionVoice] = Field(
        default_factory=dict, description="Detail confidence score tiap field terdeteksi"
    )
    warnings: List[str] = Field(
        default_factory=list,
        description="Peringatan jika ada field penting yang belum terucapkan jelas"
    )
    needs_confirmation: bool = Field(
        True,
        description=(
            "Human-in-the-Loop flag: kader Posyandu wajib mengonfirmasi data "
            "sebelum disimpan ke database"
        )
    )

    # Info sumber (Whisper / fallback)
    engine_used: str = Field(
        "whisper",
        description="Engine yang digunakan: 'whisper' atau 'fallback'"
    )
    language_detected: Optional[str] = Field(
        None, description="Bahasa yang terdeteksi oleh Whisper (misal: 'id', 'en')"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "transcription": (
                    "Anak Budi umur dua belas bulan berat delapan koma lima kg tinggi tujuh empat cm laki-laki"
                ),
                "nama_anak": "Budi",
                "umur_bulan": 12,
                "berat_kg": 8.5,
                "tinggi_cm": 74.0,
                "jenis_kelamin": "L",
                "tanggal_timbang": None,
                "overall_confidence": 0.88,
                "extracted_fields": {
                    "nama_anak": {"value": "Budi", "confidence": 0.85, "source_phrase": "anak Budi"},
                    "umur_bulan": {"value": 12, "confidence": 0.92, "source_phrase": "umur dua belas bulan"},
                    "berat_kg": {"value": 8.5, "confidence": 0.90, "source_phrase": "berat delapan koma lima kg"},
                    "tinggi_cm": {"value": 74.0, "confidence": 0.88, "source_phrase": "tinggi tujuh empat cm"},
                    "jenis_kelamin": {"value": "L", "confidence": 0.87, "source_phrase": "laki-laki"},
                },
                "warnings": [],
                "needs_confirmation": True,
                "engine_used": "whisper",
                "language_detected": "id",
            }
        }


class VoiceTranscriptRequest(BaseModel):
    """
    Payload jika teks transkripsi sudah ada di sisi client
    (misal: browser Web Speech API) dan tinggal diparsing oleh backend.
    """
    transcript: str = Field(
        ...,
        min_length=3,
        description=(
            "Teks transkripsi hasil Web Speech API / Whisper client-side. "
            "Contoh: 'Anak Sari, berat 9 kg, tinggi 72 cm, umur 18 bulan, perempuan'"
        )
    )
