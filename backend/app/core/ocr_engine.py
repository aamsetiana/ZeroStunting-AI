"""
ZeroStunting AI — OCR Processing Engine
========================================
Modul untuk mengekstraksi data catatan timbang / KMS Posyandu balita dari foto.
Mendukung Google Cloud Vision API dan Fallback Pattern Matching Heuristik.
"""

from __future__ import annotations
import os
import re
import logging
from typing import Optional, Dict, Any, List, Tuple
from datetime import datetime

from app.schemas.ocr import OCRExtractResponse, FieldDetection

logger = logging.getLogger(__name__)

# Batas biologis wajar sesuai agent.md
CONSTRAINTS = {
    "berat_kg": {"min": 1.5, "max": 35.0},
    "tinggi_cm": {"min": 40.0, "max": 130.0},
    "umur_bulan": {"min": 0, "max": 60},
}


def parse_kms_text(raw_text: str, base_confidence: float = 0.90) -> OCRExtractResponse:
    """
    Ekstrak data terstruktur balita dari raw text (KMS / catatan Posyandu).
    Mendukung format umum tulisan kader di buku register & kartu KMS.
    """
    extracted_fields: Dict[str, FieldDetection] = {}
    warnings: List[str] = []

    # 1. Ekstrak Nama Anak
    nama_anak = None
    nama_patterns = [
        r"(?:nama\s*(?:anak|balita)?)\s*[:=]\s*([A-Za-z\s'\.]{3,40})",
        r"(?:an\.|a/n)\s*[:=]?\s*([A-Za-z\s'\.]{3,40})",
    ]
    for pattern in nama_patterns:
        match = re.search(pattern, raw_text, re.IGNORECASE)
        if match:
            candidate = match.group(1).strip()
            # Bersihkan jika ada newline atau kata kunci lain yang terseret
            candidate = re.split(r"[\n\r]|(?:bb|tb|pb|usia|umur|jk)", candidate, flags=re.IGNORECASE)[0].strip()
            if candidate and len(candidate) >= 3:
                nama_anak = candidate
                extracted_fields["nama_anak"] = FieldDetection(
                    value=nama_anak,
                    confidence=round(base_confidence * 0.95, 2),
                    source_snippet=match.group(0).strip(),
                )
                break

    # 2. Ekstrak Umur / Usia
    umur_bulan = None
    # Pola: "1 tahun 2 bulan", "1 th 6 bln", "18 bln", "usia : 24 bulan", "umur: 12"
    th_bln_pattern = r"(?:umur|usia)?\s*[:=]?\s*(\d+)\s*(?:th|tahun)\s*(?:(\d+)\s*(?:bln|bulan))?"
    bln_pattern = r"(?:umur|usia)?\s*[:=]?\s*(\d{1,2})\s*(?:bln|bulan)"
    angka_umur_pattern = r"(?:umur|usia)\s*[:=]\s*(\d{1,2})"

    th_match = re.search(th_bln_pattern, raw_text, re.IGNORECASE)
    bln_match = re.search(bln_pattern, raw_text, re.IGNORECASE)

    if th_match and th_match.group(1):
        tahun = int(th_match.group(1))
        bulan = int(th_match.group(2)) if th_match.group(2) else 0
        umur_bulan = tahun * 12 + bulan
        extracted_fields["umur_bulan"] = FieldDetection(
            value=umur_bulan,
            confidence=round(base_confidence * 0.93, 2),
            source_snippet=th_match.group(0).strip(),
        )
    elif bln_match:
        umur_bulan = int(bln_match.group(1))
        extracted_fields["umur_bulan"] = FieldDetection(
            value=umur_bulan,
            confidence=round(base_confidence * 0.96, 2),
            source_snippet=bln_match.group(0).strip(),
        )
    else:
        num_match = re.search(angka_umur_pattern, raw_text, re.IGNORECASE)
        if num_match:
            umur_bulan = int(num_match.group(1))
            extracted_fields["umur_bulan"] = FieldDetection(
                value=umur_bulan,
                confidence=round(base_confidence * 0.85, 2),
                source_snippet=num_match.group(0).strip(),
            )

    # 3. Ekstrak Berat Badan (BB)
    berat_kg = None
    # Pola: "BB: 8.5 kg", "BB : 8,5", "Berat: 12.1 kg", "BB = 9,4kg"
    bb_patterns = [
        r"(?:bb|berat\s*(?:badan)?)\s*[:=]?\s*(\d{1,2}(?:[.,]\d{1,2})?)\s*(?:kg)?",
        r"(\d{1,2}[.,]\d{1,2})\s*kg",
    ]
    for pattern in bb_patterns:
        match = re.search(pattern, raw_text, re.IGNORECASE)
        if match:
            raw_val = match.group(1).replace(",", ".")
            try:
                val = float(raw_val)
                if CONSTRAINTS["berat_kg"]["min"] <= val <= CONSTRAINTS["berat_kg"]["max"]:
                    berat_kg = round(val, 2)
                    extracted_fields["berat_kg"] = FieldDetection(
                        value=berat_kg,
                        confidence=round(base_confidence * 0.95, 2),
                        source_snippet=match.group(0).strip(),
                    )
                    break
            except ValueError:
                continue

    # 4. Ekstrak Tinggi / Panjang Badan (TB / PB)
    tinggi_cm = None
    # Pola: "TB: 82.5 cm", "PB : 71,2", "Tinggi: 80 cm", "Panjang = 65 cm"
    tb_patterns = [
        r"(?:tb|pb|tinggi|panjang)\s*[:=]?\s*(\d{2,3}(?:[.,]\d{1,2})?)\s*(?:cm)?",
        r"(\d{2,3}[.,]\d{1,2})\s*cm",
    ]
    for pattern in tb_patterns:
        match = re.search(pattern, raw_text, re.IGNORECASE)
        if match:
            raw_val = match.group(1).replace(",", ".")
            try:
                val = float(raw_val)
                if CONSTRAINTS["tinggi_cm"]["min"] <= val <= CONSTRAINTS["tinggi_cm"]["max"]:
                    tinggi_cm = round(val, 1)
                    extracted_fields["tinggi_cm"] = FieldDetection(
                        value=tinggi_cm,
                        confidence=round(base_confidence * 0.94, 2),
                        source_snippet=match.group(0).strip(),
                    )
                    break
            except ValueError:
                continue

    # 5. Ekstrak Jenis Kelamin
    jenis_kelamin = None
    jk_patterns = [
        r"(?:jk|jenis\s*kelamin|seks)\s*[:=]?\s*(laki[- ]laki|perempuan|l|p)\b",
        r"\b(laki[- ]laki|perempuan)\b",
    ]
    for pattern in jk_patterns:
        match = re.search(pattern, raw_text, re.IGNORECASE)
        if match:
            val = match.group(1).strip().upper()
            if val.startswith("L"):
                jenis_kelamin = "L"
            elif val.startswith("P"):
                jenis_kelamin = "P"

            if jenis_kelamin:
                extracted_fields["jenis_kelamin"] = FieldDetection(
                    value=jenis_kelamin,
                    confidence=round(base_confidence * 0.92, 2),
                    source_snippet=match.group(0).strip(),
                )
                break

    # 6. Ekstrak Tanggal Penimbangan
    tanggal_timbang = None
    tgl_patterns = [
        r"(?:tgl|tanggal)\s*(?:timbang)?\s*[:=]?\s*(\d{4})[/-](\d{1,2})[/-](\d{1,2})",
        r"(\d{4})[/-](\d{1,2})[/-](\d{1,2})",
        r"(?:tgl|tanggal)\s*(?:timbang)?\s*[:=]?\s*(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})",
        r"(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})",
    ]
    for pattern in tgl_patterns:
        match = re.search(pattern, raw_text, re.IGNORECASE)
        if match:
            try:
                g = match.groups()
                if len(g[0]) == 4:
                    # YYYY/MM/DD
                    y, m, d = int(g[0]), int(g[1]), int(g[2])
                else:
                    # DD/MM/YYYY or DD/MM/YY
                    d, m = int(g[0]), int(g[1])
                    y_str = g[2]
                    y = int(y_str) if len(y_str) == 4 else 2000 + int(y_str)
                dt = datetime(y, m, d)
                tanggal_timbang = dt.strftime("%Y-%m-%d")
                extracted_fields["tanggal_timbang"] = FieldDetection(
                    value=tanggal_timbang,
                    confidence=round(base_confidence * 0.90, 2),
                    source_snippet=match.group(0).strip(),
                )
                break
            except Exception:
                continue

    # 7. Ekstrak LiLA (Lingkar Lengan Atas) jika ada
    lila_cm = None
    lila_patterns = [
        r"(?:lila|lingkar\s*lengan)\s*[:=]?\s*(\d{1,2}(?:[.,]\d{1,2})?)\s*(?:cm)?",
    ]
    for pattern in lila_patterns:
        match = re.search(pattern, raw_text, re.IGNORECASE)
        if match:
            raw_val = match.group(1).replace(",", ".")
            try:
                val = float(raw_val)
                if 5.0 <= val <= 30.0:
                    lila_cm = round(val, 1)
                    extracted_fields["lila_cm"] = FieldDetection(
                        value=lila_cm,
                        confidence=round(base_confidence * 0.90, 2),
                        source_snippet=match.group(0).strip(),
                    )
                    break
            except ValueError:
                continue

    # Validasi kelengkapan & batas medis
    if berat_kg is None:
        warnings.append("Berat badan (BB) belum terdeteksi. Silakan periksa atau isi manual.")
    if tinggi_cm is None:
        warnings.append("Tinggi/panjang badan (TB/PB) belum terdeteksi. Silakan periksa atau isi manual.")
    if umur_bulan is None:
        warnings.append("Umur balita belum terdeteksi. Silakan periksa atau isi manual.")

    # Hitung overall confidence
    if extracted_fields:
        total_conf = sum(f.confidence for f in extracted_fields.values())
        overall_conf = round(total_conf / len(extracted_fields), 2)
    else:
        overall_conf = 0.0
        warnings.append("Tidak ada field catatan timbang yang berhasil dikenali otomatis.")

    return OCRExtractResponse(
        success=True,
        nama_anak=nama_anak,
        umur_bulan=umur_bulan,
        berat_kg=berat_kg,
        tinggi_cm=tinggi_cm,
        jenis_kelamin=jenis_kelamin,
        tanggal_timbang=tanggal_timbang,
        lila_cm=lila_cm,
        overall_confidence=overall_conf,
        raw_text=raw_text.strip(),
        extracted_fields=extracted_fields,
        warnings=warnings,
        needs_confirmation=True,  # Selalu True untuk Human-In-The-Loop kader
    )


async def process_image_ocr(image_bytes: bytes, filename: str = "") -> OCRExtractResponse:
    """
    Proses file gambar menggunakan Google Cloud Vision jika credentials tersedia,
    atau gunakan fallback parser cerdas.
    """
    raw_text = ""
    confidence = 0.85

    # Cek kredensial Google Cloud Vision
    creds_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "./service-account.json")
    vision_available = False

    if os.path.exists(creds_path):
        try:
            from google.cloud import vision
            client = vision.ImageAnnotatorClient()
            image = vision.Image(content=image_bytes)
            response = client.document_text_detection(image=image)
            if response.full_text_annotation:
                raw_text = response.full_text_annotation.text
                confidence = 0.95
                vision_available = True
            elif response.text_annotations:
                raw_text = response.text_annotations[0].description
                confidence = 0.90
                vision_available = True
        except Exception as e:
            logger.warning(f"Google Cloud Vision API gagal atau belum disiapkan: {e}")
            vision_available = False

    # Jika Vision API belum aktif atau file testing
    if not vision_available or not raw_text:
        # Coba baca text jika input berupa string atau mock image
        try:
            decoded = image_bytes.decode("utf-8", errors="ignore")
            if any(k in decoded.lower() for k in ["bb", "tb", "umur", "usia", "nama", "posyandu"]):
                raw_text = decoded
        except Exception:
            pass

    # Jika masih kosong (misal gambar biner tanpa vision credentials di local environment)
    if not raw_text:
        # Berikan sample template terdeteksi dengan catatan instruksi kader
        raw_text = (
            "[Simulasi OCR Gambar KMS]\n"
            "Nama: Balita Posyandu\n"
            "Umur: 12 bln\n"
            "BB: 8.5 kg\n"
            "TB: 74.0 cm\n"
            "JK: L\n"
            "Tgl: 2026-10-15"
        )
        confidence = 0.70

    result = parse_kms_text(raw_text, base_confidence=confidence)

    if not vision_available:
        result.warnings.append(
            "Mode Standby / Simulasi OCR aktif (Google Cloud Vision credentials belum diset di .env)."
        )

    return result
