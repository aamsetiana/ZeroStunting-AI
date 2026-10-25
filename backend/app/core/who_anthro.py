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
import pandas as pd
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
    NORMAL = "normal"
    RISIKO_LEBIH = "risiko_lebih"       # > +2 SD
    BERAT_LEBIH = "berat_lebih"        # > +2 SD BB/U
    GIZI_KURANG = "gizi_kurang"        # < -2 SD BB/U
    GIZI_BURUK = "gizi_buruk"         # < -3 SD BB/U
    PENDEK = "pendek"             # < -2 SD PB/U (stunting moderate)
    SANGAT_PENDEK = "sangat_pendek"      # < -3 SD PB/U (stunting severe)
    KURUS = "kurus"              # < -2 SD BB/PB (wasting moderate)
    SANGAT_KURUS = "sangat_kurus"       # < -3 SD BB/PB (wasting severe)
    # Lingkar Kepala
    MAKROSEFALI = "makrosefali"          # > +2 SD LK/U
    MIKROSEFALI = "mikrosefali"          # < -2 SD LK/U
    MIKROSEFALI_BERAT = "mikrosefali_berat" # < -3 SD LK/U


@dataclass
class ZScoreResult:
    """Hasil kalkulasi Z-score untuk satu indikator."""
    zscore: float
    status: StatusGizi
    indikator: str          # "BB/U", "PB/U", "BB/PB", "LK/U", "LiLA"
    nilai_actual: float
    median_referensi: float  # nilai M dari tabel WHO


@dataclass
class AnthropometryResult:
    """Hasil kalkulasi lengkap untuk satu balita."""
    # Input data wajib
    umur_bulan: int
    berat_kg: float
    tinggi_cm: float
    jenis_kelamin: JenisKelamin

    # Z-score per indikator wajib
    bbu: ZScoreResult       # Berat Badan per Umur
    pbu: ZScoreResult       # Panjang/Tinggi Badan per Umur
    bbpb: ZScoreResult      # Berat Badan per Panjang Badan

    # Input & Z-score opsional
    lingkar_kepala_cm: Optional[float] = None
    lingkar_lengan_cm: Optional[float] = None
    lku: Optional[ZScoreResult] = None   # Lingkar Kepala per Umur (opsional)
    lila: Optional[ZScoreResult] = None  # Lingkar Lengan Atas (opsional)

    # Status gizi ringkasan
    ada_risiko_stunting: bool = False
    ada_risiko_wasting: bool = False
    ada_risiko_underweight: bool = False
    ada_risiko_mikrosefali: bool = False
    ada_risiko_makrosefali: bool = False
    pesan_peringatan: list[str] = None


# ─────────────────────────────────────────────────────────────────────────────
# CONSTRAINT VALIDATION (PAGAR LOGIKA MEDIS)
# ─────────────────────────────────────────────────────────────────────────────

CONSTRAINTS = {
    "berat_kg": {"min": 1.5, "max": 35.0},
    "tinggi_cm": {"min": 40.0, "max": 130.0},
    "umur_bulan": {"min": 0, "max": 60},
    "lingkar_kepala_cm": {"min": 25.0, "max": 65.0},
    "lingkar_lengan_cm": {"min": 7.0, "max": 30.0},
}


def validate_input(
    umur_bulan: int,
    berat_kg: float,
    tinggi_cm: float,
    lingkar_kepala_cm: Optional[float] = None,
    lingkar_lengan_cm: Optional[float] = None,
) -> list[str]:
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
        b_min = CONSTRAINTS["berat_kg"]["min"]
        b_max = CONSTRAINTS["berat_kg"]["max"]
        warnings.append(
            f"Berat badan {berat_kg} kg tampak di luar batas wajar ({b_min}–{b_max} kg). "
            "Harap periksa kembali data timbangan."
        )

    if not (CONSTRAINTS["tinggi_cm"]["min"] <= tinggi_cm <= CONSTRAINTS["tinggi_cm"]["max"]):
        t_min = CONSTRAINTS["tinggi_cm"]["min"]
        t_max = CONSTRAINTS["tinggi_cm"]["max"]
        warnings.append(
            f"Tinggi badan {tinggi_cm} cm tampak di luar batas wajar ({t_min}–{t_max} cm). "
            "Harap periksa kembali data pengukuran."
        )

    if lingkar_kepala_cm is not None:
        lk_min = CONSTRAINTS["lingkar_kepala_cm"]["min"]
        lk_max = CONSTRAINTS["lingkar_kepala_cm"]["max"]
        if not (lk_min <= lingkar_kepala_cm <= lk_max):
            warnings.append(
                f"Lingkar kepala {lingkar_kepala_cm} cm tampak di luar batas wajar ({lk_min}–{lk_max} cm). "
                "Harap periksa kembali pita meteran pengukur kepala."
            )

    if lingkar_lengan_cm is not None:
        lila_min = CONSTRAINTS["lingkar_lengan_cm"]["min"]
        lila_max = CONSTRAINTS["lingkar_lengan_cm"]["max"]
        if not (lila_min <= lingkar_lengan_cm <= lila_max):
            warnings.append(
                f"Lingkar lengan (LiLA) {lingkar_lengan_cm} cm tampak di luar batas wajar ({lila_min}–{lila_max} cm). "
                "Harap periksa kembali pita LiLA."
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
        return StatusGizi.SANGAT_PENDEK  # stunting severe


def _classify_bbpb(zscore: float) -> StatusGizi:
    """Klasifikasi status gizi BB/PB (Berat Badan per Panjang/Tinggi Badan)."""
    if zscore > 2:
        return StatusGizi.BERAT_LEBIH
    elif zscore >= -2:
        return StatusGizi.NORMAL
    elif zscore >= -3:
        return StatusGizi.KURUS        # wasting moderate
    else:
        return StatusGizi.SANGAT_KURUS  # wasting severe


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


def hitung_zscore_lku(
    umur_bulan: int,
    lingkar_kepala_cm: float,
    jenis_kelamin: JenisKelamin,
) -> ZScoreResult:
    """
    Hitung Z-score Lingkar Kepala per Umur (LK/U / Head Circumference-for-Age).
    Tabel WHO: hcfa (boys & girls) 0–60 bulan.
    """
    table = _get_who_table("hcfa", jenis_kelamin)
    L, M, S = _get_lms(table, float(umur_bulan), "Age")
    zscore = _calculate_zscore(lingkar_kepala_cm, L, M, S)

    if zscore > 2:
        status = StatusGizi.MAKROSEFALI
    elif zscore >= -2:
        status = StatusGizi.NORMAL
    elif zscore >= -3:
        status = StatusGizi.MIKROSEFALI
    else:
        status = StatusGizi.MIKROSEFALI_BERAT

    return ZScoreResult(
        zscore=zscore,
        status=status,
        indikator="LK/U",
        nilai_actual=lingkar_kepala_cm,
        median_referensi=round(M, 2),
    )


def hitung_zscore_lila(
    umur_bulan: int,
    lingkar_lengan_cm: float,
    jenis_kelamin: JenisKelamin,
) -> ZScoreResult:
    """
    Hitung Z-score & Status Lingkar Lengan Atas (LiLA / Arm Circumference-for-Age).
    Menggabungkan Z-score WHO (acfa) dan Cut-Off Pita LiLA Kemenkes RI.
    """
    table = _get_who_table("acfa", jenis_kelamin)
    L, M, S = _get_lms(table, float(umur_bulan), "Age")
    zscore = _calculate_zscore(lingkar_lengan_cm, L, M, S)

    # Cut-off pita LiLA Kemenkes/WHO untuk deteksi malnutrisi akut
    if lingkar_lengan_cm < 11.5 or zscore < -3:
        status = StatusGizi.GIZI_BURUK
    elif lingkar_lengan_cm < 12.5 or zscore < -2:
        status = StatusGizi.GIZI_KURANG
    elif zscore > 2:
        status = StatusGizi.RISIKO_LEBIH
    else:
        status = StatusGizi.NORMAL

    return ZScoreResult(
        zscore=zscore,
        status=status,
        indikator="LiLA",
        nilai_actual=lingkar_lengan_cm,
        median_referensi=round(M, 2),
    )


def kalkulasi_antropometri(
    umur_bulan: int,
    berat_kg: float,
    tinggi_cm: float,
    jenis_kelamin: JenisKelamin,
    lingkar_kepala_cm: Optional[float] = None,
    lingkar_lengan_cm: Optional[float] = None,
) -> AnthropometryResult:
    """
    Fungsi utama: Kalkulasi Z-score lengkap untuk satu balita.

    Args:
        umur_bulan        : Umur anak dalam bulan penuh (0–60)
        berat_kg          : Berat badan dalam kilogram
        tinggi_cm         : Panjang/tinggi badan dalam sentimeter
        jenis_kelamin     : JenisKelamin.LAKI_LAKI atau JenisKelamin.PEREMPUAN
        lingkar_kepala_cm : Lingkar kepala dalam cm (opsional)
        lingkar_lengan_cm : Lingkar lengan atas (LiLA) dalam cm (opsional)

    Returns:
        AnthropometryResult berisi Z-score BB/U, PB/U, BB/PB, LK/U, LiLA dan status gizi

    Raises:
        ValueError        : Jika data input tidak valid (di luar batas hard constraint)
    """
    # Validasi hard constraint
    if umur_bulan < 0 or umur_bulan > 60:
        raise ValueError(f"Umur {umur_bulan} bulan tidak valid. Harus 0–60 bulan.")
    if berat_kg <= 0:
        raise ValueError("Berat badan harus lebih dari 0 kg.")
    if tinggi_cm <= 0:
        raise ValueError("Tinggi badan harus lebih dari 0 cm.")
    if lingkar_kepala_cm is not None and lingkar_kepala_cm <= 0:
        raise ValueError("Lingkar kepala harus lebih dari 0 cm.")
    if lingkar_lengan_cm is not None and lingkar_lengan_cm <= 0:
        raise ValueError("Lingkar lengan harus lebih dari 0 cm.")

    # Hitung tiga indikator utama
    bbu = hitung_zscore_bbu(umur_bulan, berat_kg, jenis_kelamin)
    pbu = hitung_zscore_pbu(umur_bulan, tinggi_cm, jenis_kelamin)
    bbpb = hitung_zscore_bbpb(tinggi_cm, berat_kg, jenis_kelamin, umur_bulan)

    # Hitung LK/U dan LiLA jika data diisi (opsional)
    lku = hitung_zscore_lku(umur_bulan, lingkar_kepala_cm, jenis_kelamin) if lingkar_kepala_cm is not None else None
    lila = hitung_zscore_lila(umur_bulan, lingkar_lengan_cm, jenis_kelamin) if lingkar_lengan_cm is not None else None

    # Deteksi risiko
    ada_risiko_stunting = pbu.status in [StatusGizi.PENDEK, StatusGizi.SANGAT_PENDEK]
    ada_risiko_wasting = bbpb.status in [StatusGizi.KURUS, StatusGizi.SANGAT_KURUS]
    ada_risiko_underweight = bbu.status in [StatusGizi.GIZI_KURANG, StatusGizi.GIZI_BURUK]
    ada_risiko_mikrosefali = lku is not None and lku.status in [StatusGizi.MIKROSEFALI, StatusGizi.MIKROSEFALI_BERAT]
    ada_risiko_makrosefali = lku is not None and lku.status == StatusGizi.MAKROSEFALI

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

    # Peringatan Lingkar Kepala
    if lku:
        if lku.status == StatusGizi.MIKROSEFALI_BERAT:
            pesan.append("🚨 MIKROSEFALI BERAT: Lingkar kepala sangat kecil (< -3 SD). "
                         "Rujuk ke dokter spesialis anak / Puskesmas untuk evaluasi neurologis.")
        elif lku.status == StatusGizi.MIKROSEFALI:
            pesan.append("⚠️ MIKROSEFALI: Lingkar kepala berada di bawah normal (< -2 SD). "
                         "Pantau perkembangan otak dan stimulasi anak.")
        elif lku.status == StatusGizi.MAKROSEFALI:
            pesan.append("ℹ️ MAKROSEFALI: Lingkar kepala berada di atas normal (> +2 SD). "
                         "Periksa kondisi ubun-ubun dan perkembangan motorik.")

    # Peringatan Lingkar Lengan (LiLA)
    if lila:
        if lingkar_lengan_cm < 11.5 or lila.status == StatusGizi.GIZI_BURUK:
            pesan.append("🚨 PITA LILA MERAH (< 11.5 cm): Lingkar lengan atas sangat kecil, indikasi malnutrisi akut berat (SAM). Rujuk segera!")
        elif lingkar_lengan_cm < 12.5 or lila.status == StatusGizi.GIZI_KURANG:
            pesan.append("⚠️ PITA LILA KUNING (11.5–12.4 cm): Lingkar lengan atas menunjukkan risiko gizi kurang akut (MAM). Berikan makanan tambahan (PMT).")

    if not pesan:
        pesan.append("✅ Status gizi baik. Pertahankan pola makan dan pemantauan rutin.")

    return AnthropometryResult(
        umur_bulan=umur_bulan,
        berat_kg=berat_kg,
        tinggi_cm=tinggi_cm,
        jenis_kelamin=jenis_kelamin,
        lingkar_kepala_cm=lingkar_kepala_cm,
        lingkar_lengan_cm=lingkar_lengan_cm,
        bbu=bbu,
        pbu=pbu,
        bbpb=bbpb,
        lku=lku,
        lila=lila,
        ada_risiko_stunting=ada_risiko_stunting,
        ada_risiko_wasting=ada_risiko_wasting,
        ada_risiko_underweight=ada_risiko_underweight,
        ada_risiko_mikrosefali=ada_risiko_mikrosefali,
        ada_risiko_makrosefali=ada_risiko_makrosefali,
        pesan_peringatan=pesan,
    )
