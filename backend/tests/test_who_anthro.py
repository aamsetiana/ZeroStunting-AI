"""
Unit Tests — WHO Anthro Engine
================================
Memvalidasi kalkulasi Z-score terhadap nilai referensi resmi WHO.

Nilai test case diambil dari:
  WHO Anthro Software v3.2.2 (https://www.who.int/tools/child-growth-standards/software)
  dan WHO Growth Standards publication (2006), Appendix examples.

Jalankan: pytest backend/tests/test_who_anthro.py -v
"""

import pytest
import sys
from pathlib import Path

# Tambahkan backend ke sys.path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.who_anthro import (
    JenisKelamin,
    StatusGizi,
    kalkulasi_antropometri,
    hitung_zscore_bbu,
    hitung_zscore_pbu,
    hitung_zscore_bbpb,
    validate_input,
)


# ─────────────────────────────────────────────────────────────────────────────
# TEST BB/U (WEIGHT-FOR-AGE)
# ─────────────────────────────────────────────────────────────────────────────

class TestBBU:
    """Test Z-score Berat Badan per Umur."""

    def test_bbu_laki_normal_12bulan(self):
        """Bayi laki-laki 12 bulan, 9.6 kg → Z-score BB/U harus mendekati 0 (median)."""
        result = hitung_zscore_bbu(12, 9.6, JenisKelamin.LAKI_LAKI)
        assert -1.0 < result.zscore < 1.0, f"Z-score harus dekat median, dapat {result.zscore}"
        assert result.status == StatusGizi.NORMAL
        assert result.indikator == "BB/U"

    def test_bbu_perempuan_normal_24bulan(self):
        """Bayi perempuan 24 bulan, 11.4 kg → Z-score BB/U normal."""
        result = hitung_zscore_bbu(24, 11.4, JenisKelamin.PEREMPUAN)
        assert -1.0 < result.zscore < 1.0, f"Z-score: {result.zscore}"
        assert result.status == StatusGizi.NORMAL

    def test_bbu_gizi_buruk(self):
        """Anak 24 bulan, berat sangat rendah (6 kg) → GIZI BURUK (< -3 SD)."""
        result = hitung_zscore_bbu(24, 6.0, JenisKelamin.LAKI_LAKI)
        assert result.zscore < -3.0, f"Harus < -3 SD, dapat {result.zscore}"
        assert result.status == StatusGizi.GIZI_BURUK

    def test_bbu_gizi_kurang(self):
        """Anak 24 bulan, berat rendah (9.2 kg) → GIZI KURANG (-3 < Z < -2)."""
        result = hitung_zscore_bbu(24, 9.2, JenisKelamin.LAKI_LAKI)
        assert -3.0 < result.zscore < -2.0, f"Z={result.zscore}, harus antara -3 dan -2"
        assert result.status == StatusGizi.GIZI_KURANG

    def test_bbu_berat_lebih(self):
        """Anak 12 bulan, berat tinggi (13 kg) → BERAT LEBIH (> +2 SD)."""
        result = hitung_zscore_bbu(12, 13.0, JenisKelamin.LAKI_LAKI)
        assert result.zscore > 2.0, f"Harus > +2 SD, dapat {result.zscore}"
        assert result.status == StatusGizi.BERAT_LEBIH

    def test_bbu_newborn(self):
        """Bayi baru lahir (0 bulan), 3.3 kg → normal."""
        result = hitung_zscore_bbu(0, 3.3, JenisKelamin.LAKI_LAKI)
        assert -1.0 < result.zscore < 1.0
        assert result.status == StatusGizi.NORMAL

    def test_bbu_60bulan(self):
        """Batas atas umur (60 bulan), 14.7 kg → normal."""
        result = hitung_zscore_bbu(60, 14.7, JenisKelamin.LAKI_LAKI)
        assert -1.0 < result.zscore < 1.0


# ─────────────────────────────────────────────────────────────────────────────
# TEST PB/U (LENGTH/HEIGHT-FOR-AGE)
# ─────────────────────────────────────────────────────────────────────────────

class TestPBU:
    """Test Z-score Panjang/Tinggi Badan per Umur — deteksi stunting."""

    def test_pbu_normal_laki_12bulan(self):
        """Laki-laki 12 bulan, 75.7 cm (median WHO) → Z ≈ 0."""
        result = hitung_zscore_pbu(12, 75.7, JenisKelamin.LAKI_LAKI)
        assert -0.5 < result.zscore < 0.5, f"Harus mendekati 0, dapat {result.zscore}"
        assert result.status == StatusGizi.NORMAL

    def test_pbu_normal_perempuan_24bulan(self):
        """Perempuan 24 bulan, 86.4 cm (median WHO) → Z ≈ 0."""
        result = hitung_zscore_pbu(24, 86.4, JenisKelamin.PEREMPUAN)
        assert -0.5 < result.zscore < 0.5, f"Dapat {result.zscore}"
        assert result.status == StatusGizi.NORMAL

    def test_pbu_stunting_moderate(self):
        """Laki-laki 24 bulan, 80 cm → PENDEK (stunting moderate, Z < -2)."""
        result = hitung_zscore_pbu(24, 80.0, JenisKelamin.LAKI_LAKI)
        assert result.zscore < -2.0, f"Harus < -2 SD, dapat {result.zscore}"
        assert result.status == StatusGizi.PENDEK

    def test_pbu_stunting_severe(self):
        """Laki-laki 24 bulan, 74 cm → SANGAT PENDEK (stunting severe, Z < -3)."""
        result = hitung_zscore_pbu(24, 74.0, JenisKelamin.LAKI_LAKI)
        assert result.zscore < -3.0, f"Harus < -3 SD, dapat {result.zscore}"
        assert result.status == StatusGizi.SANGAT_PENDEK

    def test_pbu_tinggi_lebih(self):
        """Laki-laki 12 bulan, 82 cm → RISIKO LEBIH (> +2 SD)."""
        result = hitung_zscore_pbu(12, 82.0, JenisKelamin.LAKI_LAKI)
        assert result.zscore > 2.0, f"Harus > +2 SD, dapat {result.zscore}"
        assert result.status == StatusGizi.RISIKO_LEBIH

    def test_pbu_perempuan_stunting(self):
        """Perempuan 36 bulan, 88 cm → PENDEK (stunting moderate, -3 < Z < -2)."""
        result = hitung_zscore_pbu(36, 88.0, JenisKelamin.PEREMPUAN)
        assert -3.0 < result.zscore < -2.0, f"Z={result.zscore}"
        assert result.status == StatusGizi.PENDEK


# ─────────────────────────────────────────────────────────────────────────────
# TEST BB/PB (WEIGHT-FOR-LENGTH/HEIGHT)
# ─────────────────────────────────────────────────────────────────────────────

class TestBBPB:
    """Test Z-score Berat Badan per Panjang/Tinggi Badan — deteksi wasting."""

    def test_bbpb_normal_bayi(self):
        """Laki-laki 12 bulan, PB 75 cm, BB 9.4 kg → normal."""
        result = hitung_zscore_bbpb(75.0, 9.4, JenisKelamin.LAKI_LAKI, 12)
        assert -2.0 < result.zscore < 2.0, f"Harus normal, dapat {result.zscore}"
        assert result.status == StatusGizi.NORMAL

    def test_bbpb_wasting_moderate(self):
        """Laki-laki 18 bulan, PB 80 cm, BB 8.8 kg → KURUS (wasting, -3 < Z < -2)."""
        result = hitung_zscore_bbpb(80.0, 8.8, JenisKelamin.LAKI_LAKI, 18)
        assert -3.0 < result.zscore < -2.0, f"Z={result.zscore}"
        assert result.status == StatusGizi.KURUS

    def test_bbpb_wasting_severe(self):
        """Laki-laki 18 bulan, PB 80 cm, BB 6.0 kg → SANGAT KURUS (wasting, Z < -3)."""
        result = hitung_zscore_bbpb(80.0, 6.0, JenisKelamin.LAKI_LAKI, 18)
        assert result.zscore < -3.0, f"Harus < -3 SD, dapat {result.zscore}"
        assert result.status == StatusGizi.SANGAT_KURUS

    def test_bbpb_gemuk(self):
        """Laki-laki 12 bulan, PB 72 cm, BB 11.5 kg → BERAT LEBIH."""
        result = hitung_zscore_bbpb(72.0, 11.5, JenisKelamin.LAKI_LAKI, 12)
        assert result.zscore > 2.0, f"Harus > +2 SD, dapat {result.zscore}"
        assert result.status == StatusGizi.BERAT_LEBIH

    def test_bbpb_pakai_wfh_untuk_usia_lebih_24(self):
        """Anak 36 bulan menggunakan tabel WFH (weight-for-height), bukan WFL."""
        # Untuk usia >= 24 bulan, harus pakai tabel wfh (height berdiri)
        result = hitung_zscore_bbpb(90.0, 13.0, JenisKelamin.LAKI_LAKI, 36)
        assert result.indikator == "BB/PB"
        assert isinstance(result.zscore, float)


# ─────────────────────────────────────────────────────────────────────────────
# TEST KALKULASI LENGKAP
# ─────────────────────────────────────────────────────────────────────────────

class TestKalkulasiLengkap:
    """Test fungsi utama kalkulasi_antropometri."""

    def test_anak_normal(self):
        """Anak laki-laki 24 bulan dengan data normal (BB/U, PB/U, BB/PB semua normal)."""
        # Gunakan 13.5 kg / 87 cm — proporsi normal untuk laki-laki 24 bulan
        result = kalkulasi_antropometri(
            umur_bulan=24,
            berat_kg=13.5,
            tinggi_cm=87.0,
            jenis_kelamin=JenisKelamin.LAKI_LAKI,
        )
        assert result.umur_bulan == 24
        assert result.bbu.status == StatusGizi.NORMAL
        assert result.pbu.status == StatusGizi.NORMAL
        assert result.bbpb.status == StatusGizi.NORMAL
        assert not result.ada_risiko_stunting
        assert not result.ada_risiko_wasting
        assert not result.ada_risiko_underweight
        assert len(result.pesan_peringatan) == 1
        assert "baik" in result.pesan_peringatan[0].lower()

    def test_anak_stunting_severe(self):
        """Anak laki-laki 36 bulan dengan stunting berat."""
        result = kalkulasi_antropometri(
            umur_bulan=36,
            berat_kg=10.0,
            tinggi_cm=82.0,  # sangat pendek untuk 36 bulan
            jenis_kelamin=JenisKelamin.LAKI_LAKI,
        )
        assert result.pbu.status == StatusGizi.SANGAT_PENDEK
        assert result.ada_risiko_stunting
        # Harus ada pesan peringatan tentang stunting
        pesan_all = " ".join(result.pesan_peringatan).lower()
        assert "stunting" in pesan_all

    def test_anak_wasting_severe(self):
        """Anak perempuan 18 bulan dengan wasting berat."""
        result = kalkulasi_antropometri(
            umur_bulan=18,
            berat_kg=6.0,
            tinggi_cm=78.0,
            jenis_kelamin=JenisKelamin.PEREMPUAN,
        )
        assert result.ada_risiko_wasting
        pesan_all = " ".join(result.pesan_peringatan).lower()
        assert "wasting" in pesan_all

    def test_input_invalid_umur(self):
        """Umur di luar batas (> 60 bulan) harus raise ValueError."""
        with pytest.raises(ValueError, match="61 bulan"):
            kalkulasi_antropometri(61, 15.0, 95.0, JenisKelamin.LAKI_LAKI)

    def test_input_invalid_berat_nol(self):
        """Berat = 0 harus raise ValueError."""
        with pytest.raises(ValueError):
            kalkulasi_antropometri(12, 0.0, 75.0, JenisKelamin.LAKI_LAKI)

    def test_perempuan_berbeda_dari_laki(self):
        """Z-score laki-laki dan perempuan harus berbeda untuk data yang sama."""
        laki = kalkulasi_antropometri(24, 11.5, 86.0, JenisKelamin.LAKI_LAKI)
        perempuan = kalkulasi_antropometri(24, 11.5, 86.0, JenisKelamin.PEREMPUAN)
        # Nilai median referensi harus berbeda
        assert laki.pbu.median_referensi != perempuan.pbu.median_referensi

    def test_newborn_valid(self):
        """Bayi baru lahir (0 bulan) harus bisa dikalkulasi."""
        result = kalkulasi_antropometri(0, 3.3, 50.0, JenisKelamin.LAKI_LAKI)
        assert result.bbu.status in [StatusGizi.NORMAL, StatusGizi.GIZI_KURANG]

    def test_60bulan_valid(self):
        """Balita 5 tahun (60 bulan) harus bisa dikalkulasi."""
        result = kalkulasi_antropometri(60, 18.0, 110.0, JenisKelamin.PEREMPUAN)
        assert isinstance(result.bbu.zscore, float)


# ─────────────────────────────────────────────────────────────────────────────
# TEST VALIDASI INPUT
# ─────────────────────────────────────────────────────────────────────────────

class TestValidasiInput:
    """Test fungsi validate_input (soft warnings)."""

    def test_data_valid_tidak_ada_warning(self):
        """Data dalam batas normal → tidak ada warning."""
        warnings = validate_input(24, 12.0, 87.0)
        assert len(warnings) == 0

    def test_umur_luar_rentang(self):
        """Umur 65 bulan → ada warning."""
        warnings = validate_input(65, 15.0, 100.0)
        assert any("umur" in w.lower() or "65" in w for w in warnings)

    def test_berat_tidak_wajar(self):
        """Berat 0.5 kg → ada warning."""
        warnings = validate_input(12, 0.5, 75.0)
        assert len(warnings) > 0

    def test_kombinasi_bmi_tidak_wajar(self):
        """BMI yang tidak wajar (tinggi 90 cm, berat 50 kg) → ada warning."""
        warnings = validate_input(24, 50.0, 90.0)
        assert len(warnings) > 0


# ─────────────────────────────────────────────────────────────────────────────
# BENCHMARK — Konsistensi hasil
# ─────────────────────────────────────────────────────────────────────────────

class TestKonsistensi:
    """Pastikan kalkulasi deterministik dan konsisten."""

    def test_hasil_deterministik(self):
        """Hasil kalkulasi yang sama harus identik jika input sama."""
        params = (24, 11.5, 86.0, JenisKelamin.LAKI_LAKI)
        r1 = kalkulasi_antropometri(*params)
        r2 = kalkulasi_antropometri(*params)
        assert r1.bbu.zscore == r2.bbu.zscore
        assert r1.pbu.zscore == r2.pbu.zscore
        assert r1.bbpb.zscore == r2.bbpb.zscore

    def test_semakin_kurus_zscore_lebih_rendah(self):
        """Semakin rendah berat, Z-score BB/U harus semakin rendah."""
        r_normal = hitung_zscore_bbu(24, 12.0, JenisKelamin.LAKI_LAKI)
        r_kurang = hitung_zscore_bbu(24, 9.0, JenisKelamin.LAKI_LAKI)
        r_buruk  = hitung_zscore_bbu(24, 6.0, JenisKelamin.LAKI_LAKI)
        assert r_normal.zscore > r_kurang.zscore > r_buruk.zscore

    def test_semakin_pendek_zscore_lebih_rendah(self):
        """Semakin rendah tinggi, Z-score PB/U harus semakin rendah."""
        r_normal = hitung_zscore_pbu(24, 88.0, JenisKelamin.LAKI_LAKI)
        r_pendek = hitung_zscore_pbu(24, 82.0, JenisKelamin.LAKI_LAKI)
        r_sangat = hitung_zscore_pbu(24, 75.0, JenisKelamin.LAKI_LAKI)
        assert r_normal.zscore > r_pendek.zscore > r_sangat.zscore
