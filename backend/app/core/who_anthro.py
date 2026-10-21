"""
WHO Anthro Engine — ZeroStunting AI
=====================================
Komponen PALING KRITIS dalam sistem ini.

Menghitung Z-score status gizi balita berdasarkan standar resmi:
- WHO Child Growth Standards 2006 (0–60 bulan)
- Metode LMS (Lambda-Mu-Sigma) sesuai publikasi WHO

Indikator yang dihitung:
  BB/U  (Weight-for-Age)      → deteksi underweight
  PB/U  (Length/Height-for-Age) → deteksi stunting
  BB/PB (Weight-for-Length)   → deteksi wasting

Referensi:
  WHO Multicentre Growth Reference Study Group. (2006).
  WHO Child Growth Standards. Geneva: World Health Organization.
  https://www.who.int/tools/child-growth-standards/standards
"""

from __future__ import annotations

import math
from dataclasses import dataclass
from enum import Enum
from typing import Optional

import pandas as pd
import numpy as np
from pathlib import Path

# ─────────────────────────────────────────────────────────────────────────────
# PATHS
# ─────────────────────────────────────────────────────────────────────────────

DATA_DIR = Path(__file__).parent.parent.parent / "data" / "who_tables"


# ─────────────────────────────────────────────────────────────────────────────
# ENUMS & DATACLASSES
# ─────────────────────────────────────────────────────────────────────────────

class JenisKelamin(str, Enum):
    LAKI_LAKI = "L"
    PEREMPUAN = "P"


class StatusGizi(str, Enum):
    """Klasifikasi status gizi berdasarkan Z-score."""
    NORMAL            = "normal"
    RISIKO_LEBIH      = "risiko_lebih"       # > +2 SD
    BERAT_LEBIH       = "berat_lebih"        # > +2 SD BB/U
    GIZI_KURANG       = "gizi_kurang"        # < -2 SD BB/U
    GIZI_BURUK        = "gizi_buruk"         # < -3 SD BB/U
    PENDEK            = "pendek"             # < -2 SD PB/U (stunting moderate)
    SANGAT_PENDEK     = "sangat_pendek"      # < -3 SD PB/U (stunting severe)
    KURUS             = "kurus"              # < -2 SD BB/PB (wasting moderate)
    SANGAT_KURUS      = "sangat_kurus"       # < -3 SD BB/PB (wasting severe)


@dataclass
class ZScoreResult:
    """Hasil kalkulasi Z-score untuk satu indikator."""
    zscore: float
    status: StatusGizi
    indikator: str          # "BB/U", "PB/U", "BB/PB"
    nilai_actual: float
    median_referensi: float # nilai M dari tabel WHO


@dataclass
class AnthropometryResult:
    """Hasil kalkulasi lengkap untuk satu balita."""
    # Input data
    umur_bulan: int
    berat_kg: float
    tinggi_cm: float
    jenis_kelamin: JenisKelamin

    # Z-score per indikator
    bbu: ZScoreResult       # Berat Badan per Umur
    pbu: ZScoreResult       # Panjang/Tinggi Badan per Umur
    bbpb: ZScoreResult      # Berat Badan per Panjang Badan

    # Status gizi ringkasan
    ada_risiko_stunting: bool
    ada_risiko_wasting: bool
    ada_risiko_underweight: bool
    pesan_peringatan: list[str]


# ─────────────────────────────────────────────────────────────────────────────
# CONSTRAINT VALIDATION (PAGAR LOGIKA MEDIS)
# ─────────────────────────────────────────────────────────────────────────────

CONSTRAINTS = {
    "berat_kg": {"min": 1.5, "max": 35.0},
    "tinggi_cm": {"min": 40.0, "max": 130.0},
    "umur_bulan": {"min": 0, "max": 60},
}


def validate_input(umur_bulan: int, berat_kg: float, tinggi_cm: float) -> list[str]:
    """
    Validasi data input terhadap batas biologis wajar.
    Mengembalikan list peringatan (kosong = data valid).
    """
    warnings: list[str] = []

    if not (CONSTRAINTS["umur_bulan"]["min"] <= umur_bulan <= CONSTRAINTS["umur_bulan"]["max"]):
        warnings.append(
            f"Umur {umur_bulan} bulan di luar rentang normal (0–60 bulan). "
            "Sistem hanya mendukung balita 0–5 tahun."
        )

    if not (CONSTRAINTS["berat_kg"]["min"] <= berat_kg <= CONSTRAINTS["berat_kg"]["max"]):
        warnings.append(
            f"Berat badan {berat_kg} kg tampak di luar batas wajar ({CONSTRAINTS['berat_kg']['min']}–{CONSTRAINTS['berat_kg']['max']} kg). "
            "Harap periksa kembali data timbangan."
        )

    if not (CONSTRAINTS["tinggi_cm"]["min"] <= tinggi_cm <= CONSTRAINTS["tinggi_cm"]["max"]):
        warnings.append(
            f"Tinggi badan {tinggi_cm} cm tampak di luar batas wajar ({CONSTRAINTS['tinggi_cm']['min']}–{CONSTRAINTS['tinggi_cm']['max']} cm). "
            "Harap periksa kembali data pengukuran."
        )

    # Rasio berat/tinggi yang tidak masuk akal
    bmi = berat_kg / ((tinggi_cm / 100) ** 2)
    if bmi < 8 or bmi > 35:
        warnings.append(
            f"Kombinasi berat {berat_kg} kg dan tinggi {tinggi_cm} cm menghasilkan BMI "
            f"{bmi:.1f} yang sangat tidak lazim. Harap periksa kembali data."
        )

    return warnings


# ─────────────────────────────────────────────────────────────────────────────
# TABEL WHO (LMS VALUES)
# ─────────────────────────────────────────────────────────────────────────────

def _load_who_table(filename: str) -> pd.DataFrame:
    """Load tabel WHO dari file CSV."""
    path = DATA_DIR / filename
    if not path.exists():
        raise FileNotFoundError(
            f"Tabel WHO tidak ditemukan: {path}\n"
            "Jalankan: python backend/scripts/download_who_tables.py"
        )
    df = pd.read_csv(path)
    return df


# Cache tabel WHO agar tidak dibaca ulang setiap request
_who_cache: dict[str, pd.DataFrame] = {}


def _get_who_table(indicator: str, sex: JenisKelamin) -> pd.DataFrame:
    """
    Mengambil tabel WHO berdasarkan indikator dan jenis kelamin.
    Menggunakan in-memory cache.

    indicator: "wfa" (weight-for-age), "lhfa" (length/height-for-age), "wfl" (weight-for-length)
    sex: JenisKelamin.LAKI_LAKI atau JenisKelamin.PEREMPUAN
    """
    sex_code = "boys" if sex == JenisKelamin.LAKI_LAKI else "girls"
    cache_key = f"{indicator}_{sex_code}"

    if cache_key not in _who_cache:
        filename = f"who_{indicator}_{sex_code}.csv"
        _who_cache[cache_key] = _load_who_table(filename)

    return _who_cache[cache_key]


def _get_lms(table: pd.DataFrame, reference_value: float, col_name: str) -> tuple[float, float, float]:
    """
    Mengambil nilai L, M, S dari tabel WHO berdasarkan umur atau tinggi.

    Jika tidak ada baris yang tepat sama, lakukan interpolasi linear
    antara dua baris terdekat.
    """
    col_values = table[col_name].values

    # Cari baris yang tepat
    exact = table[table[col_name] == reference_value]
    if not exact.empty:
        row = exact.iloc[0]
        return float(row["L"]), float(row["M"]), float(row["S"])

    # Interpolasi linear jika tidak ada nilai tepat
    lower_rows = table[table[col_name] <= reference_value]
    upper_rows = table[table[col_name] >= reference_value]

    if lower_rows.empty:
        row = table.iloc[0]
        return float(row["L"]), float(row["M"]), float(row["S"])

    if upper_rows.empty:
        row = table.iloc[-1]
        return float(row["L"]), float(row["M"]), float(row["S"])

    lower = lower_rows.iloc[-1]
    upper = upper_rows.iloc[0]

    # Interpolasi linear
    lower_val = float(lower[col_name])
    upper_val = float(upper[col_name])

    if upper_val == lower_val:
        return float(lower["L"]), float(lower["M"]), float(lower["S"])

    ratio = (reference_value - lower_val) / (upper_val - lower_val)

    L = float(lower["L"]) + ratio * (float(upper["L"]) - float(lower["L"]))
    M = float(lower["M"]) + ratio * (float(upper["M"]) - float(lower["M"]))
    S = float(lower["S"]) + ratio * (float(upper["S"]) - float(lower["S"]))

    return L, M, S


# ─────────────────────────────────────────────────────────────────────────────
# KALKULASI Z-SCORE (RUMUS LMS WHO)
# ─────────────────────────────────────────────────────────────────────────────

def _calculate_zscore(y: float, L: float, M: float, S: float) -> float:
    """
    Menghitung Z-score dengan metode LMS (Box-Cox power transformation).

    Rumus WHO standar:
        Jika L != 0:  Z = ((y/M)^L - 1) / (L * S)
        Jika L == 0:  Z = ln(y/M) / S

    Setelah kalkulasi, Z-score di-cap pada ±3 SD menggunakan
    metode 'flagging' WHO untuk nilai ekstrem:
        Jika Z > 3:  Z = 3 + (y - SD3pos) / SD23pos
        Jika Z < -3: Z = -3 - (SD3neg - y) / SD23neg

    Referensi: WHO (2006), hal. 302 — Appendix A
    """
    if abs(L) < 1e-10:  # L ≈ 0
        zscore = math.log(y / M) / S
    else:
        zscore = ((y / M) ** L - 1) / (L * S)

    # Apply WHO flagging untuk nilai ekstrem (|Z| > 3)
    if zscore > 3:
        # Hitung SD3pos dan SD2pos
        sd3pos = M * (1 + L * S * 3) ** (1 / L) if abs(L) > 1e-10 else M * math.exp(S * 3)
        sd2pos = M * (1 + L * S * 2) ** (1 / L) if abs(L) > 1e-10 else M * math.exp(S * 2)
        sd23pos = sd3pos - sd2pos
        if sd23pos > 0:
            zscore = 3 + (y - sd3pos) / sd23pos

    elif zscore < -3:
        # Hitung SD3neg dan SD2neg
        sd3neg = M * (1 + L * S * (-3)) ** (1 / L) if abs(L) > 1e-10 else M * math.exp(S * (-3))
        sd2neg = M * (1 + L * S * (-2)) ** (1 / L) if abs(L) > 1e-10 else M * math.exp(S * (-2))
        sd23neg = sd2neg - sd3neg
        if sd23neg > 0:
            zscore = -3 - (sd3neg - y) / sd23neg

    return round(zscore, 2)


# ─────────────────────────────────────────────────────────────────────────────
# KLASIFIKASI STATUS GIZI
# ─────────────────────────────────────────────────────────────────────────────

def _classify_bbu(zscore: float) -> StatusGizi:
    """Klasifikasi status gizi BB/U (Berat Badan per Umur)."""
    if zscore > 2:
        return StatusGizi.BERAT_LEBIH
    elif zscore >= -2:
        return StatusGizi.NORMAL
    elif zscore >= -3:
        return StatusGizi.GIZI_KURANG
    else:
        return StatusGizi.GIZI_BURUK


def _classify_pbu(zscore: float) -> StatusGizi:
    """Klasifikasi status gizi PB/U atau TB/U (Panjang/Tinggi Badan per Umur)."""
    if zscore > 2:
        return StatusGizi.RISIKO_LEBIH
    elif zscore >= -2:
        return StatusGizi.NORMAL
    elif zscore >= -3:
        return StatusGizi.PENDEK        # stunting moderate
    else:
        return StatusGizi.SANGAT_PENDEK # stunting severe


def _classify_bbpb(zscore: float) -> StatusGizi:
    """Klasifikasi status gizi BB/PB (Berat Badan per Panjang/Tinggi Badan)."""
    if zscore > 2:
        return StatusGizi.BERAT_LEBIH
    elif zscore >= -2:
        return StatusGizi.NORMAL
    elif zscore >= -3:
        return StatusGizi.KURUS        # wasting moderate
    else:
        return StatusGizi.SANGAT_KURUS # wasting severe


# ─────────────────────────────────────────────────────────────────────────────
# FUNGSI UTAMA: KALKULASI LENGKAP
# ─────────────────────────────────────────────────────────────────────────────

def hitung_zscore_bbu(
    umur_bulan: int,
    berat_kg: float,
    jenis_kelamin: JenisKelamin,
) -> ZScoreResult:
    """
    Hitung Z-score Berat Badan per Umur (BB/U / Weight-for-Age).
    Rentang valid: 0–60 bulan.
    """
    table = _get_who_table("wfa", jenis_kelamin)
    L, M, S = _get_lms(table, float(umur_bulan), "Age")
    zscore = _calculate_zscore(berat_kg, L, M, S)
    status = _classify_bbu(zscore)

    return ZScoreResult(
        zscore=zscore,
        status=status,
        indikator="BB/U",
        nilai_actual=berat_kg,
        median_referensi=round(M, 2),
    )


def hitung_zscore_pbu(
    umur_bulan: int,
    tinggi_cm: float,
    jenis_kelamin: JenisKelamin,
) -> ZScoreResult:
    """
    Hitung Z-score Panjang/Tinggi Badan per Umur (PB/U atau TB/U).
    - Panjang (berbaring) digunakan untuk usia 0–24 bulan.
    - Tinggi (berdiri) digunakan untuk usia 24–60 bulan.
    Rentang valid: 0–60 bulan.
    """
    # WHO menggunakan tabel "lhfa" (length/height-for-age)
    table = _get_who_table("lhfa", jenis_kelamin)
    L, M, S = _get_lms(table, float(umur_bulan), "Age")
    zscore = _calculate_zscore(tinggi_cm, L, M, S)
    status = _classify_pbu(zscore)

    return ZScoreResult(
        zscore=zscore,
        status=status,
        indikator="PB/U",
        nilai_actual=tinggi_cm,
        median_referensi=round(M, 2),
    )


def hitung_zscore_bbpb(
    tinggi_cm: float,
    berat_kg: float,
    jenis_kelamin: JenisKelamin,
    umur_bulan: int,
) -> ZScoreResult:
    """
    Hitung Z-score Berat Badan per Panjang/Tinggi Badan (BB/PB atau BB/TB).
    - wfl (weight-for-length): digunakan untuk anak dengan PB 45–110 cm (umumnya 0–24 bulan)
    - wfh (weight-for-height): digunakan untuk anak dengan TB 65–120 cm (umumnya 24–60 bulan)
    Rentang valid: 0–60 bulan.
    """
    if umur_bulan < 24:
        # Gunakan weight-for-length (panjang berbaring)
        indicator = "wfl"
        ref_col = "Length"
    else:
        # Gunakan weight-for-height (tinggi berdiri)
        indicator = "wfh"
        ref_col = "Height"

    table = _get_who_table(indicator, jenis_kelamin)
    L, M, S = _get_lms(table, tinggi_cm, ref_col)
    zscore = _calculate_zscore(berat_kg, L, M, S)
    status = _classify_bbpb(zscore)

    return ZScoreResult(
        zscore=zscore,
        status=status,
        indikator="BB/PB",
        nilai_actual=berat_kg,
        median_referensi=round(M, 2),
    )


def kalkulasi_antropometri(
    umur_bulan: int,
    berat_kg: float,
    tinggi_cm: float,
    jenis_kelamin: JenisKelamin,
) -> AnthropometryResult:
    """
    Fungsi utama: Kalkulasi Z-score lengkap untuk satu balita.

    Args:
        umur_bulan    : Umur anak dalam bulan penuh (0–60)
        berat_kg      : Berat badan dalam kilogram
        tinggi_cm     : Panjang/tinggi badan dalam sentimeter
        jenis_kelamin : JenisKelamin.LAKI_LAKI atau JenisKelamin.PEREMPUAN

    Returns:
        AnthropometryResult berisi Z-score BB/U, PB/U, BB/PB dan status gizi

    Raises:
        ValueError    : Jika data input tidak valid (di luar batas hard constraint)
    """
    # Validasi hard constraint
    if umur_bulan < 0 or umur_bulan > 60:
        raise ValueError(f"Umur {umur_bulan} bulan tidak valid. Harus 0–60 bulan.")
    if berat_kg <= 0:
        raise ValueError(f"Berat badan harus lebih dari 0 kg.")
    if tinggi_cm <= 0:
        raise ValueError(f"Tinggi badan harus lebih dari 0 cm.")

    # Hitung tiga indikator
    bbu  = hitung_zscore_bbu(umur_bulan, berat_kg, jenis_kelamin)
    pbu  = hitung_zscore_pbu(umur_bulan, tinggi_cm, jenis_kelamin)
    bbpb = hitung_zscore_bbpb(tinggi_cm, berat_kg, jenis_kelamin, umur_bulan)

    # Deteksi risiko
    ada_risiko_stunting    = pbu.status in [StatusGizi.PENDEK, StatusGizi.SANGAT_PENDEK]
    ada_risiko_wasting     = bbpb.status in [StatusGizi.KURUS, StatusGizi.SANGAT_KURUS]
    ada_risiko_underweight = bbu.status in [StatusGizi.GIZI_KURANG, StatusGizi.GIZI_BURUK]

    # Susun pesan peringatan
    pesan: list[str] = []

    if pbu.status == StatusGizi.SANGAT_PENDEK:
        pesan.append("⚠️ STUNTING BERAT: Tinggi badan sangat jauh di bawah normal (< -3 SD). "
                     "Segera rujuk ke Puskesmas untuk penanganan lebih lanjut.")
    elif pbu.status == StatusGizi.PENDEK:
        pesan.append("⚠️ STUNTING: Tinggi badan di bawah normal (< -2 SD). "
                     "Perlu intervensi gizi dan pemantauan lebih ketat.")

    if bbpb.status == StatusGizi.SANGAT_KURUS:
        pesan.append("🚨 WASTING BERAT: Berat badan sangat kurang untuk tinggi badan (< -3 SD). "
                     "PRIORITAS RUJUKAN SEGERA ke tenaga kesehatan.")
    elif bbpb.status == StatusGizi.KURUS:
        pesan.append("⚠️ WASTING: Berat badan kurang untuk tinggi badan (< -2 SD). "
                     "Perlu tambahan asupan energi dan protein.")

    if bbu.status == StatusGizi.GIZI_BURUK:
        pesan.append("🚨 GIZI BURUK: Berat badan sangat kurang untuk umur (< -3 SD). "
                     "Diperlukan tata laksana gizi buruk sesuai protokol Kemenkes.")
    elif bbu.status == StatusGizi.GIZI_KURANG:
        pesan.append("⚠️ GIZI KURANG: Berat badan di bawah normal untuk umur (< -2 SD). "
                     "Perlu peningkatan asupan makanan bergizi.")

    if not pesan:
        pesan.append("✅ Status gizi baik. Pertahankan pola makan dan pemantauan rutin.")

    return AnthropometryResult(
        umur_bulan=umur_bulan,
        berat_kg=berat_kg,
        tinggi_cm=tinggi_cm,
        jenis_kelamin=jenis_kelamin,
        bbu=bbu,
        pbu=pbu,
        bbpb=bbpb,
        ada_risiko_stunting=ada_risiko_stunting,
        ada_risiko_wasting=ada_risiko_wasting,
        ada_risiko_underweight=ada_risiko_underweight,
        pesan_peringatan=pesan,
    )
