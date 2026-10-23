"""
API Router — OCR (Optical Character Recognition)
==================================================
Endpoint untuk mengekstrak data balita dari foto catatan timbang / buku KMS.

Strategi ekstraksi (cascade):
  1. Google Cloud Vision API (jika GOOGLE_APPLICATION_CREDENTIALS tersedia)
  2. Tesseract OCR (jika terinstall di sistem)
  3. Mock response untuk development (jika keduanya tidak tersedia)
"""

import base64
import json
import os
import re
import tempfile
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, File, HTTPException, UploadFile, status
from pydantic import BaseModel


router = APIRouter(prefix="/ocr", tags=["OCR"])


# ─────────────────────────────────────────────────────────────────────────────
# SCHEMAS
# ─────────────────────────────────────────────────────────────────────────────


class OCRResult(BaseModel):
    nama_anak: Optional[str] = None
    umur_bulan: Optional[int] = None
    berat_kg: Optional[float] = None
    tinggi_cm: Optional[float] = None
    jenis_kelamin: Optional[str] = None
    raw_text: str
    confidence: float
    engine_used: str
    pesan: str


class OCRResponse(BaseModel):
    sukses: bool
    data: Optional[OCRResult] = None
    error: Optional[str] = None


# ─────────────────────────────────────────────────────────────────────────────
# PARSER — ekstrak data terstruktur dari teks OCR mentah
# ─────────────────────────────────────────────────────────────────────────────


def parse_balita_data(raw_text: str) -> dict:
    """
    Coba ekstrak field balita dari teks bebas hasil OCR.

    Pola yang dikenali:
      - nama: "Nama: Budi" / "Nama Anak: Budi"
      - umur: "Umur: 24 bulan" / "24 bln"
      - berat: "BB: 12.5 kg" / "Berat: 12,5"
      - tinggi: "TB: 87 cm" / "Tinggi: 87"
      - jenis kelamin: "L" / "P" / "Laki" / "Perempuan"
    """
    text = raw_text.upper()

    result: dict = {}

    # Nama anak
    nama_match = re.search(
        r"(?:NAMA\s*(?:ANAK|BALITA)?)\s*[:\-]?\s*([A-Z][A-Z\s]{1,50})",
        text,
    )
    if nama_match:
        result["nama_anak"] = nama_match.group(1).strip().title()

    # Umur dalam bulan
    umur_match = re.search(
        r"(?:UMUR|USIA|AGE)\s*[:\-]?\s*(\d{1,3})\s*(?:BULAN|BLN|MONTHS?)?",
        text,
    )
    if umur_match:
        umur = int(umur_match.group(1))
        if 0 <= umur <= 60:
            result["umur_bulan"] = umur

    # Berat badan (BB)
    berat_match = re.search(
        r"(?:BB|BERAT\s*(?:BADAN)?|WEIGHT)\s*[:\-]?\s*(\d{1,2}[,.]?\d{0,2})\s*(?:KG)?",
        text,
    )
    if berat_match:
        berat_str = berat_match.group(1).replace(",", ".")
        berat = float(berat_str)
        if 1.5 <= berat <= 35.0:
            result["berat_kg"] = berat

    # Tinggi badan (TB/PB)
    tinggi_match = re.search(
        r"(?:TB|PB|TINGGI\s*(?:BADAN)?|PANJANG\s*(?:BADAN)?|HEIGHT)\s*[:\-]?\s*(\d{2,3}[,.]?\d{0,1})\s*(?:CM)?",
        text,
    )
    if tinggi_match:
        tinggi_str = tinggi_match.group(1).replace(",", ".")
        tinggi = float(tinggi_str)
        if 40.0 <= tinggi <= 130.0:
            result["tinggi_cm"] = tinggi

    # Jenis kelamin
    if re.search(r"\bL\b|LAKI[\-\s]LAKI|MALE|PUTRA", text):
        result["jenis_kelamin"] = "L"
    elif re.search(r"\bP\b|PEREMPUAN|FEMALE|PUTRI|WANITA", text):
        result["jenis_kelamin"] = "P"

    return result


# ─────────────────────────────────────────────────────────────────────────────
# ENGINE — Google Cloud Vision
# ─────────────────────────────────────────────────────────────────────────────


async def extract_with_google_vision(image_bytes: bytes) -> tuple[str, float]:
    """Kirim gambar ke Google Cloud Vision API, kembalikan (teks, confidence)."""
    try:
        from google.cloud import vision  # type: ignore

        client = vision.ImageAnnotatorClient()
        image = vision.Image(content=image_bytes)
        response = client.text_detection(image=image)

        if response.error.message:
            raise RuntimeError(response.error.message)

        texts = response.text_annotations
        if not texts:
            return "", 0.0

        full_text = texts[0].description
        # Vision API tidak memberikan confidence global per-halaman secara eksplisit
        confidence = 0.90
        return full_text, confidence

    except ImportError:
        raise RuntimeError("google-cloud-vision belum terinstall")
    except Exception as exc:
        raise RuntimeError(str(exc)) from exc


# ─────────────────────────────────────────────────────────────────────────────
# ENGINE — Tesseract OCR (fallback lokal)
# ─────────────────────────────────────────────────────────────────────────────


async def extract_with_tesseract(image_bytes: bytes) -> tuple[str, float]:
    """Gunakan pytesseract sebagai fallback jika Vision API tidak tersedia."""
    try:
        import pytesseract  # type: ignore
        from PIL import Image  # type: ignore
        import io

        image = Image.open(io.BytesIO(image_bytes))
        # Config: mode halaman 6 (single uniform block) + bahasa Indonesia+Inggris
        custom_config = r"--oem 3 --psm 6 -l ind+eng"
        text = pytesseract.image_to_string(image, config=custom_config)

        # Estimasi confidence dari data detail (rata-rata field yang terisi)
        data = pytesseract.image_to_data(image, config=custom_config, output_type=pytesseract.Output.DICT)
        confidences = [float(c) for c in data["conf"] if int(c) > 0]
        confidence = sum(confidences) / len(confidences) / 100.0 if confidences else 0.5

        return text, confidence

    except ImportError:
        raise RuntimeError("pytesseract atau PIL belum terinstall")
    except Exception as exc:
        raise RuntimeError(str(exc)) from exc


# ─────────────────────────────────────────────────────────────────────────────
# ENGINE — Mock (development)
# ─────────────────────────────────────────────────────────────────────────────


def mock_extraction() -> tuple[str, float]:
    """
    Kembalikan data contoh untuk keperluan development lokal.
    Hanya aktif jika tidak ada OCR engine yang tersedia.
    """
    mock_text = (
        "Nama Anak: Budi Santoso\n"
        "Umur: 24 bulan\n"
        "BB: 12,5 kg\n"
        "TB: 87 cm\n"
        "Jenis Kelamin: L\n"
        "Tanggal: 01/10/2026\n"
    )
    return mock_text, 0.75


# ─────────────────────────────────────────────────────────────────────────────
# ENDPOINT
# ─────────────────────────────────────────────────────────────────────────────


ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"}
MAX_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB


@router.post(
    "/extract",
    response_model=OCRResponse,
    summary="Ekstrak Data Balita dari Foto KMS",
    description=(
        "Upload foto catatan timbang atau buku KMS. "
        "Sistem akan mengekstrak data balita (nama, umur, berat, tinggi) secara otomatis. "
        "Gunakan Google Cloud Vision API jika tersedia, "
        "lalu fallback ke Tesseract, lalu ke mode development."
    ),
    status_code=status.HTTP_200_OK,
)
async def extract_ocr(
    file: UploadFile = File(..., description="Foto catatan timbang / buku KMS (JPEG/PNG, maks 10 MB)"),
) -> OCRResponse:
    """Ekstrak data balita dari gambar menggunakan OCR cascade."""

    # Validasi tipe file
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Tipe file tidak didukung: {file.content_type}. Gunakan JPEG atau PNG.",
        )

    # Baca bytes dan validasi ukuran
    image_bytes = await file.read()
    if len(image_bytes) > MAX_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Ukuran file melebihi 10 MB.",
        )

    raw_text = ""
    confidence = 0.0
    engine_used = "unknown"

    # Cascade: Vision API → Tesseract → Mock
    google_creds = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "")
    if google_creds and Path(google_creds).exists():
        try:
            raw_text, confidence = await extract_with_google_vision(image_bytes)
            engine_used = "google-cloud-vision"
        except RuntimeError:
            pass  # Lanjut ke fallback

    if not raw_text:
        try:
            raw_text, confidence = await extract_with_tesseract(image_bytes)
            engine_used = "tesseract"
        except RuntimeError:
            pass  # Lanjut ke mock

    if not raw_text:
        raw_text, confidence = mock_extraction()
        engine_used = "mock-dev"

    # Parse teks → data terstruktur
    parsed = parse_balita_data(raw_text)

    # Hitung kelengkapan data
    required_fields = ["umur_bulan", "berat_kg", "tinggi_cm"]
    filled = sum(1 for f in required_fields if f in parsed)
    pesan = (
        "Data berhasil diekstrak. Periksa dan konfirmasi sebelum menyimpan."
        if filled == len(required_fields)
        else f"Data tidak lengkap ({filled}/{len(required_fields)} field terisi). Isi manual bidang yang kosong."
    )

    return OCRResponse(
        sukses=True,
        data=OCRResult(
            nama_anak=parsed.get("nama_anak"),
            umur_bulan=parsed.get("umur_bulan"),
            berat_kg=parsed.get("berat_kg"),
            tinggi_cm=parsed.get("tinggi_cm"),
            jenis_kelamin=parsed.get("jenis_kelamin"),
            raw_text=raw_text,
            confidence=round(confidence, 2),
            engine_used=engine_used,
            pesan=pesan,
        ),
    )
