"""
API Router — OCR Catatan Timbang / KMS
=======================================
Endpoint untuk ekstraksi data balita dari foto catatan penimbangan Posyandu.
"""

from fastapi import APIRouter, UploadFile, File, HTTPException, status
from typing import Optional
import os

from app.schemas.ocr import OCRExtractResponse, OCRTextRequest
from app.core.ocr_engine import process_image_ocr, parse_kms_text

router = APIRouter(prefix="/ocr", tags=["OCR / Computer Vision"])

# Tipe file yang diizinkan untuk diupload
ALLOWED_MIME_TYPES = {
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "application/pdf",
    "application/octet-stream",
}
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB


@router.post(
    "/extract",
    response_model=OCRExtractResponse,
    summary="Ekstrak Data Balita dari Foto Catatan Timbang / KMS",
    description=(
        "Menerima foto dokumen catatan timbang atau buku KMS balita. "
        "Mengekstraksi nama anak, umur, berat badan (BB), tinggi/panjang badan (TB/PB), "
        "dan jenis kelamin (JK) menggunakan Google Cloud Vision / Engine OCR. "
        "Selalu mengembalikan flag `needs_confirmation: true` untuk verifikasi oleh Kader (Human-in-the-Loop)."
    ),
    status_code=status.HTTP_200_OK,
)
async def extract_from_photo(
    file: UploadFile = File(..., description="Foto KMS / buku catatan timbang (JPEG/PNG/WebP, maks 10MB)"),
) -> OCRExtractResponse:
    # 1. Validasi MIME type jika ada
    content_type = file.content_type or ""
    if content_type and content_type not in ALLOWED_MIME_TYPES and not content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Format file tidak didukung: {content_type}. Gunakan format gambar (JPEG, PNG, WebP).",
        )

    # 2. Baca bytes
    try:
        content = await file.read()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Gagal membaca file gambar: {str(e)}",
        )

    # 3. Validasi ukuran file
    if len(content) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File gambar kosong.",
        )
    if len(content) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Ukuran file melebihi batas maksimal {MAX_FILE_SIZE_BYTES // (1024*1024)}MB.",
        )

    # 4. Proses OCR
    try:
        result = await process_image_ocr(content, filename=file.filename or "unknown.jpg")
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Terjadi kesalahan saat memproses OCR: {str(e)}",
        )


@router.post(
    "/parse-text",
    response_model=OCRExtractResponse,
    summary="Parse Teks Catatan Timbang Langsung",
    description="Mengekstrak data balita terstruktur dari teks raw hasil scan OCR client-side.",
    status_code=status.HTTP_200_OK,
)
async def parse_text_endpoint(payload: OCRTextRequest) -> OCRExtractResponse:
    if not payload.raw_text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Teks raw tidak boleh kosong.",
        )
    return parse_kms_text(payload.raw_text)


@router.get(
    "/health",
    summary="Health Check — Layanan OCR",
    description="Cek status engine OCR dan ketersediaan Google Cloud Vision credentials.",
)
async def ocr_health():
    creds_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "./service-account.json")
    has_creds = os.path.exists(creds_path)
    return {
        "status": "ok",
        "service": "ZeroStunting AI OCR Engine",
        "vision_api_configured": has_creds,
        "mode": "Google Cloud Vision" if has_creds else "Heuristic / Standby Fallback",
    }
