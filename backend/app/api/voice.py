"""
API Router — Voice / Speech-to-Text
=====================================
Endpoint untuk transkripsi suara kader Posyandu menjadi data terstruktur balita.

Dua endpoint utama:
  POST /voice/transcribe    → Upload file audio → Whisper → data terstruktur
  POST /voice/parse-transcript → Teks transkripsi (dari Web Speech API) → data terstruktur

Kedua endpoint selalu mengembalikan needs_confirmation: true
karena kader wajib verifikasi data sebelum disimpan ke database (Human-in-the-Loop).
"""

import logging
from fastapi import APIRouter, UploadFile, File, HTTPException, status
from app.schemas.voice import VoiceTranscribeResponse, VoiceTranscriptRequest
from app.core.voice_engine import transcribe_audio, parse_voice_transcript

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/voice", tags=["Voice / Speech-to-Text"])

# Format audio yang diizinkan
ALLOWED_AUDIO_TYPES = {
    "audio/wav",
    "audio/wave",
    "audio/x-wav",
    "audio/mpeg",
    "audio/mp3",
    "audio/mp4",
    "audio/m4a",
    "audio/x-m4a",
    "audio/ogg",
    "audio/webm",
    "audio/ogg; codecs=opus",
    "application/octet-stream",  # Fallback untuk browser yang tidak kirim MIME
}
MAX_AUDIO_SIZE_BYTES = 25 * 1024 * 1024  # 25 MB (Whisper rekomendasi maks 25MB)


@router.post(
    "/transcribe",
    response_model=VoiceTranscribeResponse,
    summary="Transkripsi Suara Kader → Data Balita Terstruktur",
    description=(
        "Menerima file audio suara kader Posyandu (WAV/MP3/M4A/WebM/OGG). "
        "Menggunakan OpenAI Whisper self-hosted untuk transkripsi Bahasa Indonesia. "
        "Hasil transkripsi kemudian diparsing untuk mengekstrak nama, umur, berat badan, "
        "tinggi badan, dan jenis kelamin balita. "
        "Selalu mengembalikan `needs_confirmation: true` — kader wajib verifikasi sebelum data tersimpan."
    ),
    status_code=status.HTTP_200_OK,
)
async def transcribe_voice(
    file: UploadFile = File(
        ...,
        description="File audio suara kader (WAV/MP3/M4A/WebM/OGG, maks 25MB)"
    ),
) -> VoiceTranscribeResponse:
    """
    Upload audio → Whisper transcription → NLP parsing → data balita terstruktur.

    Contoh ucapan yang didukung:
    - "Anak Budi, berat 8 koma 5 kg, tinggi 72 cm, umur 12 bulan, laki-laki"
    - "nama Sari, delapan belas bulan, sembilan kg, tujuh puluh dua cm, perempuan"
    - "BB 9.5, TB 73, umur 15 bulan"
    """
    # 1. Validasi MIME type
    content_type = file.content_type or ""
    if (
        content_type
        and content_type not in ALLOWED_AUDIO_TYPES
        and not content_type.startswith("audio/")
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Format file tidak didukung: {content_type}. "
                "Gunakan format audio: WAV, MP3, M4A, WebM, atau OGG."
            ),
        )

    # 2. Baca bytes
    try:
        content = await file.read()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Gagal membaca file audio: {str(e)}",
        )

    # 3. Validasi ukuran
    if len(content) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File audio kosong.",
        )
    if len(content) > MAX_AUDIO_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Ukuran file melebihi batas maksimal {MAX_AUDIO_SIZE_BYTES // (1024 * 1024)}MB.",
        )

    # 4. Transkripsi + parsing
    try:
        result = await transcribe_audio(content, filename=file.filename or "audio.wav")
        return result
    except Exception as e:
        logger.error(f"Transkripsi suara gagal: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Terjadi kesalahan saat memproses suara: {str(e)}",
        )


@router.post(
    "/parse-transcript",
    response_model=VoiceTranscribeResponse,
    summary="Parse Teks Transkripsi → Data Balita Terstruktur",
    description=(
        "Menerima teks transkripsi yang sudah jadi (dari Web Speech API browser atau Whisper client-side). "
        "Backend akan mengekstrak data balita terstruktur dari teks tersebut. "
        "Cocok untuk kader yang menggunakan perangkat dengan Web Speech API native (tanpa upload audio). "
        "Selalu mengembalikan `needs_confirmation: true`."
    ),
    status_code=status.HTTP_200_OK,
)
async def parse_transcript(payload: VoiceTranscriptRequest) -> VoiceTranscribeResponse:
    """
    Parsing teks transkripsi dari client (Web Speech API / Whisper browser).

    Input contoh:
      {"transcript": "Anak Sari berat sembilan kg tinggi tujuh puluh dua cm umur 18 bulan perempuan"}
    """
    transcript = payload.transcript.strip()
    if not transcript:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Teks transkripsi tidak boleh kosong.",
        )

    try:
        result = parse_voice_transcript(transcript, base_confidence=0.80)
        result.engine_used = "fallback"  # Client-side transcript, bukan dari Whisper backend
        return result
    except Exception as e:
        logger.error(f"Parsing transkripsi gagal: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Terjadi kesalahan saat memproses transkripsi: {str(e)}",
        )


@router.get(
    "/health",
    summary="Health Check — Layanan Voice",
    description="Cek status ketersediaan engine Whisper.",
)
async def voice_health():
    """Health check endpoint untuk layanan voice/speech-to-text."""
    try:
        import whisper  # type: ignore  # noqa: F401
        whisper_available = True
        whisper_info = "openai-whisper tersedia"
    except ImportError:
        whisper_available = False
        whisper_info = "openai-whisper belum terpasang — jalankan: pip install openai-whisper"

    return {
        "status": "ok",
        "service": "ZeroStunting AI Voice Engine",
        "whisper_available": whisper_available,
        "whisper_info": whisper_info,
        "mode": "Whisper self-hosted" if whisper_available else "Standby / Parse-transcript only",
        "supported_formats": ["WAV", "MP3", "M4A", "WebM", "OGG"],
        "parse_transcript_available": True,  # Selalu tersedia tanpa Whisper
    }
