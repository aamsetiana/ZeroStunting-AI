"""
API Router — OCR Catatan Timbang / KMS
=======================================
Endpoint untuk ekstraksi data balita dari foto catatan penimbangan Posyandu.
Mendukung Google Cloud Vision API, Tesseract OCR, dan Fallback Pattern Matching Heuristik.
Kompatibel dengan frontend OcrUpload dan backend unit tests.
"""

from fastapi import APIRouter, UploadFile, File, HTTPException, status
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
    "image/heic",
    "image/heif",
    "application/pdf",
    "application/octet-stream",
}
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB


@router.post(
    "/extract",
    summary="Ekstrak Data Balita dari Foto Catatan Timbang / KMS",
    description=(
        "Menerima foto dokumen catatan timbang atau buku KMS balita. "
        "Mengekstraksi nama anak, umur, berat badan (BB), tinggi/panjang badan (TB/PB), "
        "dan jenis kelamin (JK) menggunakan Google Cloud Vision / Engine OCR. "
        "Kompatibel dengan frontend dan backend test format."
    ),
    status_code=status.HTTP_200_OK,
)
async def extract_from_photo(
    file: UploadFile = File(..., description="Foto KMS / buku catatan timbang (JPEG/PNG/WebP, maks 10MB)"),
):
    # 1. Validasi MIME type jika ada
    if file.content_type and file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Tipe file tidak didukung: {file.content_type}. Gunakan format JPG, PNG, atau WebP.",
        )

    # 2. Baca bytes gambar
    image_bytes = await file.read()

    if len(image_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File yang diunggah kosong.",
        )

    # 3. Validasi batas ukuran file (maks 10 MB)
    if len(image_bytes) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Ukuran file terlalu besar. Maksimum 10 MB.",
        )

    # 4. Proses OCR melalui OCR Engine
    filename = file.filename or "uploaded_image.jpg"
    result: OCRExtractResponse = await process_image_ocr(image_bytes, filename=filename)

    # Susun pesan ramah kader
    filled = sum(1 for v in [result.umur_bulan, result.berat_kg, result.tinggi_cm] if v is not None)
    pesan = (
        "Data berhasil diekstrak. Periksa dan konfirmasi sebelum menyimpan."
        if filled == 3
        else f"Data tidak lengkap ({filled}/3 field terisi). Isi manual bidang yang kosong."
    )

    has_vision = os.path.exists(os.getenv("GOOGLE_APPLICATION_CREDENTIALS", ""))
    engine_name = "google-cloud-vision" if has_vision else "heuristic-ocr"

    # Format response ganda agar kompatibel dengan schema backend dan schema frontend
    res_dict = result.model_dump()
    res_dict["sukses"] = result.success
    res_dict["data"] = {
        "nama_anak": result.nama_anak,
        "umur_bulan": result.umur_bulan,
        "berat_kg": result.berat_kg,
        "tinggi_cm": result.tinggi_cm,
        "jenis_kelamin": result.jenis_kelamin,
        "confidence": result.overall_confidence,
        "engine_used": engine_name,
        "pesan": pesan,
    }
    return res_dict


@router.post(
    "/upload",
    response_model=OCRExtractResponse,
    summary="Alias Upload Foto OCR",
    include_in_schema=False,
)
async def upload_photo_alias(
    file: UploadFile = File(...),
) -> OCRExtractResponse:
    res = await extract_from_photo(file)
    if isinstance(res, dict) and "data" in res:
        # Kembalikan object OCRExtractResponse murni jika dipanggil client tipe response_model
        return OCRExtractResponse(**{k: v for k, v in res.items() if k not in ["sukses", "data"]})
    return res


@router.post(
    "/parse-text",
    response_model=OCRExtractResponse,
    summary="Parse Teks OCR Menjadi Data Balita Terstruktur",
    description="Menerima teks raw hasil OCR untuk di-parse menjadi field-field standar balita.",
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
