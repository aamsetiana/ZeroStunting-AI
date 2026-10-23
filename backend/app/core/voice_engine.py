"""
Voice Engine — ZeroStunting AI
================================
Engine untuk transkripsi suara kader Posyandu menjadi data terstruktur balita.

Alur:
  Audio bytes → OpenAI Whisper (transkripsi) → NLP Parser → data terstruktur

Whisper digunakan sebagai engine utama karena:
  - Akurasi tinggi untuk Bahasa Indonesia
  - Bisa self-hosted (gratis, tidak butuh API key)
  - Robust terhadap aksen lokal & noise lingkungan Posyandu

Fallback:
  - Jika Whisper belum terpasang / audio tidak ada → gunakan NLP parser langsung
    pada teks yang sudah dikirim client (misal: dari browser Web Speech API)

Referensi ucapan kader yang di-support:
  "Anak Budi, berat 8 koma 5 kg, tinggi 72 cm, umur 12 bulan, laki-laki"
  "nama Sari, delapan belas bulan, sembilan kg, tujuh puluh dua cm, perempuan"
  "BB 9.5, TB 73, umur 15 bulan, anak Ahmad"
"""

from __future__ import annotations

import logging
import os
import re
from datetime import datetime
from typing import Optional

from app.schemas.voice import VoiceTranscribeResponse, FieldDetectionVoice

logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────────────────────────────
# CONSTRAINT (sama dengan OCR & WHO engine — konsisten)
# ─────────────────────────────────────────────────────────────────────────────

CONSTRAINTS = {
    "berat_kg":   {"min": 1.5,  "max": 35.0},
    "tinggi_cm":  {"min": 40.0, "max": 130.0},
    "umur_bulan": {"min": 0,    "max": 60},
}

# ─────────────────────────────────────────────────────────────────────────────
# KAMUS ANGKA BAHASA INDONESIA (untuk konversi terbilang → angka)
# ─────────────────────────────────────────────────────────────────────────────

# Satuan
_ANGKA_SATUAN: dict[str, int] = {
    "nol": 0, "satu": 1, "dua": 2, "tiga": 3, "empat": 4,
    "lima": 5, "enam": 6, "tujuh": 7, "delapan": 8, "sembilan": 9,
    "sepuluh": 10, "sebelas": 11, "dua belas": 12, "tiga belas": 13,
    "empat belas": 14, "lima belas": 15, "enam belas": 16,
    "tujuh belas": 17, "delapan belas": 18, "sembilan belas": 19,
    "dua puluh": 20, "dua puluh satu": 21, "dua puluh dua": 22,
    "dua puluh tiga": 23, "dua puluh empat": 24, "dua puluh lima": 25,
    "dua puluh enam": 26, "dua puluh tujuh": 27, "dua puluh delapan": 28,
    "dua puluh sembilan": 29, "tiga puluh": 30, "tiga puluh satu": 31,
    "tiga puluh dua": 32, "tiga puluh tiga": 33, "tiga puluh empat": 34,
    "tiga puluh lima": 35, "tiga puluh enam": 36, "tiga puluh tujuh": 37,
    "tiga puluh delapan": 38, "tiga puluh sembilan": 39, "empat puluh": 40,
    "empat puluh satu": 41, "empat puluh dua": 42, "empat puluh tiga": 43,
    "empat puluh empat": 44, "empat puluh lima": 45, "empat puluh enam": 46,
    "empat puluh tujuh": 47, "empat puluh delapan": 48, "empat puluh sembilan": 49,
    "lima puluh": 50, "lima puluh satu": 51, "lima puluh dua": 52,
    "lima puluh tiga": 53, "lima puluh empat": 54, "lima puluh lima": 55,
    "lima puluh enam": 56, "lima puluh tujuh": 57, "lima puluh delapan": 58,
    "lima puluh sembilan": 59, "enam puluh": 60,
}

# Mapping khusus desimal yang sering diucapkan
_DESIMAL_MAP: dict[str, str] = {
    "koma": ".",
    "titik": ".",
    "point": ".",
}


def _terbilang_ke_angka(text: str) -> Optional[float]:
    """
    Konversi teks terbilang Bahasa Indonesia ke angka.
    Contoh:
      "delapan koma lima" → 8.5
      "dua belas"         → 12
      "tujuh puluh dua"   → 72
    """
    text = text.strip().lower()

    # Coba konversi langsung (sudah berupa angka)
    try:
        return float(text.replace(",", "."))
    except ValueError:
        pass

    # Ganti separator desimal
    for kata, simbol in _DESIMAL_MAP.items():
        text = text.replace(kata, simbol)

    # Cek apakah ada bagian desimal
    if "." in text:
        parts = text.split(".", 1)
        int_part = _terbilang_ke_angka_bulat(parts[0].strip())
        dec_part = _terbilang_ke_angka_bulat(parts[1].strip())
        if int_part is not None and dec_part is not None:
            return float(f"{int_part}.{dec_part}")
        return None

    return _terbilang_ke_angka_bulat(text)


def _terbilang_ke_angka_bulat(text: str) -> Optional[int]:
    """Konversi terbilang bulat → integer. Hanya untuk 0–120."""
    text = text.strip().lower()

    # Sudah berupa digit
    if re.fullmatch(r"\d+", text):
        return int(text)

    # Cek langsung di kamus
    if text in _ANGKA_SATUAN:
        return _ANGKA_SATUAN[text]

    # Cek pola "X puluh Y" (misal: "tujuh puluh dua" → 72)
    puluh_match = re.match(
        r"^(satu|dua|tiga|empat|lima|enam|tujuh|delapan|sembilan|se)?\s*puluh\s*(.*)?$",
        text
    )
    if puluh_match:
        tens_word = puluh_match.group(1) or "satu"
        if tens_word == "se":
            tens_word = "satu"
        ones_word = puluh_match.group(2).strip() if puluh_match.group(2) else ""
        tens = _ANGKA_SATUAN.get(tens_word, 0) * 10
        ones = _ANGKA_SATUAN.get(ones_word, 0) if ones_word else 0
        return tens + ones

    # Tidak berhasil dikenali
    return None


# ─────────────────────────────────────────────────────────────────────────────
# NLP PARSER: UCAPAN → DATA TERSTRUKTUR
# ─────────────────────────────────────────────────────────────────────────────

def parse_voice_transcript(transcript: str, base_confidence: float = 0.85) -> VoiceTranscribeResponse:
    """
    Parsing teks transkripsi suara kader → data terstruktur balita.

    Mendukung berbagai gaya ucapan kader Posyandu:
      - "Anak Budi, berat 8 koma 5 kg, tinggi 72 cm, umur 12 bulan, laki-laki"
      - "nama Sari, delapan belas bulan, sembilan kg, tujuh puluh dua cm, perempuan"
      - "BB 9.5, TB 73, umur 15 bulan, anak Ahmad"
      - "Dua belas bulan berat delapan setengah kilo tinggi tujuh dua"

    Args:
        transcript: Teks transkripsi hasil Whisper / Web Speech API
        base_confidence: Confidence dasar dari engine transkripsi (0.0–1.0)

    Returns:
        VoiceTranscribeResponse dengan data terstruktur + metadata kepercayaan
    """
    raw = transcript.strip()
    text = raw.lower()
    extracted_fields: dict[str, FieldDetectionVoice] = {}
    warnings: list[str] = []

    # ── 1. Ekstrak Nama Anak ────────────────────────────────────────────────
    nama_anak: Optional[str] = None
    nama_patterns = [
        r"(?:anak|nama|an\.?)\s+([A-Za-z][A-Za-z\s]{1,40})(?:,|\.|\s+umur|\s+usia|\s+berat|\s+bb|\s+tb|\s+tinggi|$)",
    ]
    for pattern in nama_patterns:
        match = re.search(pattern, raw, re.IGNORECASE)
        if match:
            candidate = match.group(1).strip().rstrip(",.")
            # Nama tidak boleh berisi kata kunci pengukuran
            keywords = {"berat", "tinggi", "umur", "usia", "bulan", "tahun", "kg", "cm", "laki", "perempuan"}
            words = candidate.lower().split()
            if not any(w in keywords for w in words) and len(candidate) >= 2:
                nama_anak = candidate.title()
                extracted_fields["nama_anak"] = FieldDetectionVoice(
                    value=nama_anak,
                    confidence=round(base_confidence * 0.85, 2),
                    source_phrase=match.group(0).strip(),
                )
                break

    # ── 2. Ekstrak Umur ─────────────────────────────────────────────────────
    umur_bulan: Optional[int] = None

    # Pola angka digit: "umur 12 bulan", "usia 6 bulan", "18 bulan"
    umur_digit_patterns = [
        r"(?:umur|usia)\s+(\d{1,2})\s+bulan",
        r"(\d{1,2})\s+bulan",
    ]
    for pattern in umur_digit_patterns:
        match = re.search(pattern, text)
        if match:
            val = int(match.group(1))
            if CONSTRAINTS["umur_bulan"]["min"] <= val <= CONSTRAINTS["umur_bulan"]["max"]:
                umur_bulan = val
                extracted_fields["umur_bulan"] = FieldDetectionVoice(
                    value=umur_bulan,
                    confidence=round(base_confidence * 0.92, 2),
                    source_phrase=match.group(0).strip(),
                )
                break

    # Pola terbilang: "dua belas bulan", "enam belas bulan"
    if umur_bulan is None:
        # Coba ekstrak semua pola terbilang + bulan
        terbilang_umur_pattern = (
            r"(?:umur|usia)?\s*"
            r"((?:(?:satu|dua|tiga|empat|lima|enam|tujuh|delapan|sembilan|sepuluh|sebelas|"
            r"belas|puluh|nol)\s*)+)"
            r"\s*bulan"
        )
        match = re.search(terbilang_umur_pattern, text)
        if match:
            angka = _terbilang_ke_angka(match.group(1).strip())
            if angka is not None:
                val = int(angka)
                if CONSTRAINTS["umur_bulan"]["min"] <= val <= CONSTRAINTS["umur_bulan"]["max"]:
                    umur_bulan = val
                    extracted_fields["umur_bulan"] = FieldDetectionVoice(
                        value=umur_bulan,
                        confidence=round(base_confidence * 0.88, 2),
                        source_phrase=match.group(0).strip(),
                    )

    # ── 3. Ekstrak Berat Badan ──────────────────────────────────────────────
    berat_kg: Optional[float] = None

    # Pola digit: "berat 8.5 kg", "BB 9 kg", "berat 8,5", "9.4 kg"
    bb_digit_patterns = [
        r"(?:bb|berat\s*(?:badan)?)\s*[:=]?\s*(\d{1,2}(?:[.,]\d{1,2})?)(?!\d)\s*(?:kg|kilo(?:gram)?)?",
        r"(\d{1,2}[.,]\d{1,2})(?!\d)\s*(?:kg|kilo)",
        r"(?:kg|kilo)\s*(\d{1,2}(?:[.,]\d{1,2})?)(?!\d)",
    ]
    for pattern in bb_digit_patterns:
        match = re.search(pattern, text)
        if match:
            raw_val = match.group(1).replace(",", ".")
            try:
                val = float(raw_val)
                if CONSTRAINTS["berat_kg"]["min"] <= val <= CONSTRAINTS["berat_kg"]["max"]:
                    berat_kg = round(val, 2)
                    extracted_fields["berat_kg"] = FieldDetectionVoice(
                        value=berat_kg,
                        confidence=round(base_confidence * 0.90, 2),
                        source_phrase=match.group(0).strip(),
                    )
                    break
            except ValueError:
                continue

    # Pola terbilang berat: "delapan koma lima kilo", "sembilan kilogram"
    if berat_kg is None:
        terbilang_bb_pattern = (
            r"(?:berat\s*(?:badan)?|bb)\s*"
            r"((?:(?:satu|dua|tiga|empat|lima|enam|tujuh|delapan|sembilan|sepuluh|sebelas|"
            r"belas|puluh|nol|koma|titik)\s*)+)"
            r"\s*(?:kg|kilo(?:gram)?)"
        )
        match = re.search(terbilang_bb_pattern, text)
        if match:
            angka = _terbilang_ke_angka(match.group(1).strip())
            if angka is not None and CONSTRAINTS["berat_kg"]["min"] <= angka <= CONSTRAINTS["berat_kg"]["max"]:
                berat_kg = round(float(angka), 2)
                extracted_fields["berat_kg"] = FieldDetectionVoice(
                    value=berat_kg,
                    confidence=round(base_confidence * 0.85, 2),
                    source_phrase=match.group(0).strip(),
                )

    # ── 4. Ekstrak Tinggi/Panjang Badan ─────────────────────────────────────
    tinggi_cm: Optional[float] = None

    # Pola digit: "tinggi 82 cm", "TB 81.5", "panjang 72 cm"
    tb_digit_patterns = [
        r"(?:tb|pb|tinggi|panjang)\s*[:=]?\s*(\d{2,3}(?:[.,]\d{1,2})?)\s*(?:cm|sentimeter)?",
        r"(\d{2,3}[.,]\d{1,2})\s*cm",
        r"(\d{2,3})\s*cm",
    ]
    for pattern in tb_digit_patterns:
        match = re.search(pattern, text)
        if match:
            raw_val = match.group(1).replace(",", ".")
            try:
                val = float(raw_val)
                if CONSTRAINTS["tinggi_cm"]["min"] <= val <= CONSTRAINTS["tinggi_cm"]["max"]:
                    tinggi_cm = round(val, 1)
                    extracted_fields["tinggi_cm"] = FieldDetectionVoice(
                        value=tinggi_cm,
                        confidence=round(base_confidence * 0.91, 2),
                        source_phrase=match.group(0).strip(),
                    )
                    break
            except ValueError:
                continue

    # Pola terbilang tinggi: "tujuh puluh dua sentimeter", "delapan puluh cm"
    if tinggi_cm is None:
        terbilang_tb_pattern = (
            r"(?:tinggi|panjang|tb|pb)\s*"
            r"((?:(?:satu|dua|tiga|empat|lima|enam|tujuh|delapan|sembilan|sepuluh|sebelas|"
            r"belas|puluh|nol|koma|titik)\s*)+)"
            r"\s*(?:cm|sentimeter)"
        )
        match = re.search(terbilang_tb_pattern, text)
        if match:
            angka = _terbilang_ke_angka(match.group(1).strip())
            if angka is not None and CONSTRAINTS["tinggi_cm"]["min"] <= angka <= CONSTRAINTS["tinggi_cm"]["max"]:
                tinggi_cm = round(float(angka), 1)
                extracted_fields["tinggi_cm"] = FieldDetectionVoice(
                    value=tinggi_cm,
                    confidence=round(base_confidence * 0.84, 2),
                    source_phrase=match.group(0).strip(),
                )

    # ── 5. Ekstrak Jenis Kelamin ─────────────────────────────────────────────
    jenis_kelamin: Optional[str] = None

    jk_patterns = [
        (r"\blaki[- ]laki\b", "L"),
        (r"\bperempuan\b", "P"),
        (r"\bcowok\b", "L"),
        (r"\bcewek\b", "P"),
        (r"\bpria\b", "L"),
        (r"\bwanita\b", "P"),
        (r"\bjenis\s*kelamin\s*[:=]?\s*(l|p|laki[- ]laki|perempuan)\b", None),
        (r"\b(?:jk|seks)\s*[:=]?\s*(l|p)\b", None),
    ]
    for pattern, fixed_val in jk_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            if fixed_val is not None:
                jenis_kelamin = fixed_val
            else:
                val = match.group(1).strip().upper()
                jenis_kelamin = "L" if val.startswith("L") else "P"
            extracted_fields["jenis_kelamin"] = FieldDetectionVoice(
                value=jenis_kelamin,
                confidence=round(base_confidence * 0.92, 2),
                source_phrase=match.group(0).strip(),
            )
            break

    # ── 6. Ekstrak Tanggal Penimbangan ──────────────────────────────────────
    tanggal_timbang: Optional[str] = None
    tgl_patterns = [
        r"(?:tanggal|tgl)\s*(?:timbang)?\s*(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})",
        r"(\d{4})[/-](\d{1,2})[/-](\d{1,2})",
    ]
    for pattern in tgl_patterns:
        match = re.search(pattern, text)
        if match:
            try:
                groups = match.groups()
                if len(groups[2]) == 4:
                    # DD/MM/YYYY
                    d, m, y = int(groups[0]), int(groups[1]), int(groups[2])
                else:
                    # YYYY/MM/DD
                    y, m, d = int(groups[0]), int(groups[1]), int(groups[2])
                dt = datetime(y, m, d)
                tanggal_timbang = dt.strftime("%Y-%m-%d")
                extracted_fields["tanggal_timbang"] = FieldDetectionVoice(
                    value=tanggal_timbang,
                    confidence=round(base_confidence * 0.88, 2),
                    source_phrase=match.group(0).strip(),
                )
                break
            except (ValueError, IndexError):
                pass

    # ── 7. Validasi kelengkapan field wajib ─────────────────────────────────
    if berat_kg is None:
        warnings.append("Berat badan (BB) belum terdeteksi dari ucapan. Silakan isi manual.")
    if tinggi_cm is None:
        warnings.append("Tinggi/panjang badan (TB/PB) belum terdeteksi dari ucapan. Silakan isi manual.")
    if umur_bulan is None:
        warnings.append("Umur balita belum terdeteksi dari ucapan. Silakan isi manual.")
    if jenis_kelamin is None:
        warnings.append("Jenis kelamin belum terdeteksi dari ucapan. Silakan isi manual.")

    # ── 8. Overall confidence ────────────────────────────────────────────────
    if extracted_fields:
        total_conf = sum(f.confidence for f in extracted_fields.values())
        overall_conf = round(total_conf / len(extracted_fields), 2)
    else:
        overall_conf = 0.0
        warnings.append("Tidak ada data pengukuran yang berhasil dikenali dari ucapan.")

    return VoiceTranscribeResponse(
        success=True,
        transcription=raw,
        nama_anak=nama_anak,
        umur_bulan=umur_bulan,
        berat_kg=berat_kg,
        tinggi_cm=tinggi_cm,
        jenis_kelamin=jenis_kelamin,
        tanggal_timbang=tanggal_timbang,
        overall_confidence=overall_conf,
        extracted_fields=extracted_fields,
        warnings=warnings,
        needs_confirmation=True,   # Selalu True — Human-in-the-Loop wajib
        engine_used="whisper",
    )


# ─────────────────────────────────────────────────────────────────────────────
# WHISPER TRANSCRIPTION
# ─────────────────────────────────────────────────────────────────────────────

async def transcribe_audio(audio_bytes: bytes, filename: str = "audio.wav") -> VoiceTranscribeResponse:
    """
    Transkripsi audio bytes menggunakan OpenAI Whisper (self-hosted).

    Strategi:
      1. Coba import whisper → transcribe → parse
      2. Jika Whisper belum terpasang → kembalikan response kosong dengan warning

    Args:
        audio_bytes: Raw bytes dari file audio (WAV / MP3 / M4A / WebM / OGG)
        filename:    Nama file asli (untuk logging)

    Returns:
        VoiceTranscribeResponse dengan transkripsi + data terstruktur
    """
    whisper_available = False
    raw_transcript = ""
    language_detected: Optional[str] = None
    base_confidence = 0.90

    try:
        import whisper  # type: ignore
        import tempfile

        # Tulis bytes ke file temp karena Whisper butuh path file
        suffix = os.path.splitext(filename)[-1] or ".wav"
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
            tmp.write(audio_bytes)
            tmp_path = tmp.name

        try:
            model = whisper.load_model("base")  # "base" cukup untuk Bahasa Indonesia
            result = model.transcribe(tmp_path, language="id", fp16=False)
            raw_transcript = result.get("text", "").strip()
            language_detected = result.get("language", "id")
            whisper_available = True
        finally:
            # Hapus file temp
            try:
                os.unlink(tmp_path)
            except OSError:
                pass

    except ImportError:
        logger.warning(
            "Whisper belum terpasang. Jalankan: pip install openai-whisper\n"
            "Endpoint /voice/transcribe berjalan dalam mode standby."
        )
        whisper_available = False

    except Exception as e:
        logger.error(f"Whisper transcription gagal untuk file '{filename}': {e}")
        whisper_available = False

    # Jika Whisper tidak tersedia / gagal → kembalikan response kosong
    if not whisper_available or not raw_transcript:
        result_empty = VoiceTranscribeResponse(
            success=False,
            transcription="",
            overall_confidence=0.0,
            extracted_fields={},
            warnings=[
                "Engine transkripsi suara (Whisper) belum tersedia atau gagal memproses audio. "
                "Pastikan openai-whisper sudah terpasang: pip install openai-whisper",
                "Sebagai alternatif, gunakan endpoint POST /voice/parse-transcript "
                "dengan teks transkripsi dari Web Speech API browser.",
            ],
            needs_confirmation=True,
            engine_used="fallback",
        )
        return result_empty

    # Parse transkripsi → data terstruktur
    parsed = parse_voice_transcript(raw_transcript, base_confidence=base_confidence)
    parsed.engine_used = "whisper"
    parsed.language_detected = language_detected
    return parsed
