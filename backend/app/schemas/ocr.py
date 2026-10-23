"""
Pydantic Schemas — OCR Catatan Timbang / KMS
=============================================
Schema data untuk input & output endpoint OCR ZeroStunting AI.
"""

from __future__ import annotations
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field, ConfigDict


class FieldDetection(BaseModel):
    """Metadata deteksi per kolom data."""
    value: Any = Field(description="Nilai yang berhasil diekstrak")
    confidence: float = Field(ge=0.0, le=1.0, description="Skor kepercayaan deteksi (0.0 - 1.0)")
    source_snippet: Optional[str] = Field(None, description="Potongan teks asal yang terdeteksi")


class OCRExtractResponse(BaseModel):
    """Hasil ekstraksi OCR dari foto KMS / catatan timbang Posyandu."""

    success: bool = Field(True, description="Status keberhasilan pemrosesan OCR")
    nama_anak: Optional[str] = Field(None, description="Nama anak jika terdeteksi")
    umur_bulan: Optional[int] = Field(None, ge=0, le=60, description="Umur dalam bulan (0-60)")
    berat_kg: Optional[float] = Field(None, gt=0, le=35, description="Berat badan balita (kg)")
    tinggi_cm: Optional[float] = Field(None, gt=0, le=130, description="Panjang/tinggi badan balita (cm)")
    jenis_kelamin: Optional[str] = Field(None, description="Jenis kelamin ('L' / 'P')")
    tanggal_timbang: Optional[str] = Field(None, description="Tanggal penimbangan (format YYYY-MM-DD)")
    lila_cm: Optional[float] = Field(None, gt=0, le=30, description="Lingkar Lengan Atas balita (cm)")

    overall_confidence: float = Field(
        ..., ge=0.0, le=1.0, description="Rata-rata tingkat kepercayaan hasil OCR"
    )
    raw_text: str = Field("", description="Seluruh teks hasil pembacaan OCR")
    extracted_fields: Dict[str, FieldDetection] = Field(
        default_factory=dict, description="Detail confidence score tiap field"
    )
    warnings: List[str] = Field(
        default_factory=list, description="Peringatan jika ada field penting yang belum terbaca jelas"
    )
    needs_confirmation: bool = Field(
        True,
        description="Human-in-the-Loop flag: kader posyandu wajib mengonfirmasi data sebelum disimpan ke database"
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "success": True,
                "nama_anak": "Budi Santoso",
                "umur_bulan": 18,
                "berat_kg": 9.8,
                "tinggi_cm": 81.5,
                "jenis_kelamin": "L",
                "tanggal_timbang": "2026-10-15",
                "overall_confidence": 0.92,
                "raw_text": "Posyandu Melati\\nNama: Budi Santoso\\nUsia: 18 bln\\nBB: 9.8 kg\\nTB: 81.5 cm\\nJK: L",
                "extracted_fields": {
                    "nama_anak": {"value": "Budi Santoso", "confidence": 0.95, "source_snippet": "Nama: Budi Santoso"},
                    "umur_bulan": {"value": 18, "confidence": 0.90, "source_snippet": "Usia: 18 bln"},
                    "berat_kg": {"value": 9.8, "confidence": 0.94, "source_snippet": "BB: 9.8 kg"},
                    "tinggi_cm": {"value": 81.5, "confidence": 0.91, "source_snippet": "TB: 81.5 cm"},
                    "jenis_kelamin": {"value": "L", "confidence": 0.90, "source_snippet": "JK: L"}
                },
                "warnings": [],
                "needs_confirmation": True
            }
        }
    )


class OCRTextRequest(BaseModel):
    """Payload jika OCR diproses di client-side (misal via browser Tesseract/Vision) atau mock testing."""
    raw_text: str = Field(..., description="Teks hasil OCR untuk diparsing menjadi data terstruktur")
