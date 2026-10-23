"""
Unit Tests — Voice Engine (NLP Parser)
========================================
Memvalidasi parsing transkripsi suara kader Posyandu → data terstruktur balita.

Catatan:
  Test ini TIDAK membutuhkan Whisper atau audio file sungguhan.
  Hanya menguji fungsi parse_voice_transcript() yang murni Python.

Jalankan: pytest backend/tests/test_voice.py -v
"""

import pytest
import sys
from pathlib import Path

# Tambahkan backend ke sys.path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.voice_engine import (
    parse_voice_transcript,
    _terbilang_ke_angka,
    _terbilang_ke_angka_bulat,
)
from app.schemas.voice import VoiceTranscribeResponse


# ─────────────────────────────────────────────────────────────────────────────
# HELPER: Cek apakah field terdeteksi dengan benar
# ─────────────────────────────────────────────────────────────────────────────

def get_result(transcript: str) -> VoiceTranscribeResponse:
    return parse_voice_transcript(transcript, base_confidence=0.90)


# ─────────────────────────────────────────────────────────────────────────────
# TEST KONVERSI TERBILANG → ANGKA
# ─────────────────────────────────────────────────────────────────────────────

class TestTerbilangKonversi:
    """Test utilitas konversi angka kata Bahasa Indonesia → integer/float."""

    def test_angka_digit_langsung(self):
        assert _terbilang_ke_angka("12") == 12.0
        assert _terbilang_ke_angka("9") == 9.0

    def test_angka_satu_kata(self):
        assert _terbilang_ke_angka_bulat("dua") == 2
        assert _terbilang_ke_angka_bulat("sepuluh") == 10
        assert _terbilang_ke_angka_bulat("delapan") == 8

    def test_angka_belas(self):
        assert _terbilang_ke_angka_bulat("dua belas") == 12
        assert _terbilang_ke_angka_bulat("delapan belas") == 18
        assert _terbilang_ke_angka_bulat("sembilan belas") == 19

    def test_angka_puluhan(self):
        assert _terbilang_ke_angka_bulat("tujuh puluh dua") == 72
        assert _terbilang_ke_angka_bulat("enam puluh") == 60
        assert _terbilang_ke_angka_bulat("dua puluh lima") == 25

    def test_angka_desimal_koma(self):
        result = _terbilang_ke_angka("delapan koma lima")
        assert result is not None
        assert abs(result - 8.5) < 0.01

    def test_angka_desimal_digit(self):
        result = _terbilang_ke_angka("9.8")
        assert result is not None
        assert abs(result - 9.8) < 0.01

    def test_angka_invalid(self):
        result = _terbilang_ke_angka_bulat("blah")
        assert result is None


# ─────────────────────────────────────────────────────────────────────────────
# TEST EKSTRAKSI UMUR
# ─────────────────────────────────────────────────────────────────────────────

class TestEkstraksiUmur:
    """Test deteksi umur dari berbagai gaya ucapan."""

    def test_umur_digit_dengan_kata_umur(self):
        r = get_result("umur 12 bulan berat 8 kg tinggi 72 cm laki-laki")
        assert r.umur_bulan == 12

    def test_umur_digit_tanpa_kata_umur(self):
        r = get_result("anak Budi 18 bulan berat 9 kg")
        assert r.umur_bulan == 18

    def test_umur_terbilang(self):
        r = get_result("usia dua belas bulan berat delapan koma lima kg tinggi tujuh puluh dua cm")
        assert r.umur_bulan == 12

    def test_umur_terbilang_delapan_belas(self):
        r = get_result("delapan belas bulan berat sembilan kg")
        assert r.umur_bulan == 18

    def test_umur_batas_valid_nol(self):
        r = get_result("umur 0 bulan berat 3.5 kg tinggi 52 cm laki-laki")
        assert r.umur_bulan == 0

    def test_umur_batas_valid_enam_puluh(self):
        r = get_result("umur 60 bulan berat 18 kg tinggi 108 cm")
        assert r.umur_bulan == 60

    def test_umur_tidak_terdeteksi(self):
        r = get_result("berat 9 kg tinggi 72 cm laki-laki")
        assert r.umur_bulan is None
        assert any("umur" in w.lower() for w in r.warnings)


# ─────────────────────────────────────────────────────────────────────────────
# TEST EKSTRAKSI BERAT BADAN
# ─────────────────────────────────────────────────────────────────────────────

class TestEkstrakBerat:
    """Test deteksi berat badan dari berbagai gaya ucapan."""

    def test_berat_digit_dengan_kg(self):
        r = get_result("berat 8.5 kg umur 12 bulan tinggi 74 cm")
        assert r.berat_kg is not None
        assert abs(r.berat_kg - 8.5) < 0.01

    def test_berat_bb_label(self):
        r = get_result("BB 9.4 kg tinggi 76 cm umur 15 bulan")
        assert r.berat_kg is not None
        assert abs(r.berat_kg - 9.4) < 0.01

    def test_berat_koma_desimal(self):
        r = get_result("berat 9,5 kg umur 18 bulan tinggi 80 cm perempuan")
        assert r.berat_kg is not None
        assert abs(r.berat_kg - 9.5) < 0.01

    def test_berat_tidak_terdeteksi(self):
        r = get_result("umur 12 bulan tinggi 74 cm laki-laki")
        assert r.berat_kg is None
        assert any("berat" in w.lower() or "bb" in w.lower() for w in r.warnings)


# ─────────────────────────────────────────────────────────────────────────────
# TEST EKSTRAKSI TINGGI BADAN
# ─────────────────────────────────────────────────────────────────────────────

class TestEkstrakTinggi:
    """Test deteksi tinggi/panjang badan dari berbagai gaya ucapan."""

    def test_tinggi_digit_cm(self):
        r = get_result("tinggi 74 cm berat 8.5 kg umur 12 bulan")
        assert r.tinggi_cm is not None
        assert abs(r.tinggi_cm - 74.0) < 0.1

    def test_tinggi_tb_label(self):
        r = get_result("TB 81.5 berat 10 kg umur 18 bulan")
        assert r.tinggi_cm is not None
        assert abs(r.tinggi_cm - 81.5) < 0.1

    def test_panjang_label(self):
        r = get_result("panjang 70 cm berat 8 kg umur 10 bulan")
        assert r.tinggi_cm is not None
        assert abs(r.tinggi_cm - 70.0) < 0.1

    def test_tinggi_tidak_terdeteksi(self):
        r = get_result("umur 12 bulan berat 8 kg laki-laki")
        assert r.tinggi_cm is None
        assert any("tinggi" in w.lower() or "tb" in w.lower() or "pb" in w.lower() for w in r.warnings)


# ─────────────────────────────────────────────────────────────────────────────
# TEST EKSTRAKSI JENIS KELAMIN
# ─────────────────────────────────────────────────────────────────────────────

class TestEkstrakJenisKelamin:
    """Test deteksi jenis kelamin dari berbagai gaya ucapan."""

    def test_laki_laki(self):
        r = get_result("umur 12 bulan berat 9 kg tinggi 74 cm laki-laki")
        assert r.jenis_kelamin == "L"

    def test_perempuan(self):
        r = get_result("umur 12 bulan berat 9 kg tinggi 74 cm perempuan")
        assert r.jenis_kelamin == "P"

    def test_cowok_alias(self):
        r = get_result("berat 9 kg tinggi 74 cm umur 12 bulan cowok")
        assert r.jenis_kelamin == "L"

    def test_cewek_alias(self):
        r = get_result("berat 9 kg tinggi 74 cm umur 12 bulan cewek")
        assert r.jenis_kelamin == "P"

    def test_jenis_kelamin_tidak_terdeteksi(self):
        r = get_result("umur 12 bulan berat 9 kg tinggi 74 cm")
        assert r.jenis_kelamin is None


# ─────────────────────────────────────────────────────────────────────────────
# TEST EKSTRAKSI NAMA
# ─────────────────────────────────────────────────────────────────────────────

class TestEkstrakNama:
    """Test deteksi nama anak dari ucapan kader."""

    def test_nama_dengan_prefix_anak(self):
        r = get_result("anak Budi, umur 12 bulan, berat 9 kg, tinggi 74 cm, laki-laki")
        assert r.nama_anak is not None
        assert "Budi" in r.nama_anak

    def test_nama_dengan_prefix_nama(self):
        r = get_result("nama Sari, 18 bulan, 9 kg, 80 cm, perempuan")
        assert r.nama_anak is not None
        assert "Sari" in r.nama_anak


# ─────────────────────────────────────────────────────────────────────────────
# TEST PARSING KALIMAT LENGKAP
# ─────────────────────────────────────────────────────────────────────────────

class TestParsingLengkap:
    """Test parsing kalimat ucapan kader yang lengkap dan realistis."""

    def test_kalimat_lengkap_digit(self):
        """Kalimat digital — kader yang sudah familiar HP."""
        r = get_result(
            "Anak Budi umur 12 bulan berat 8.5 kg tinggi 74 cm laki-laki"
        )
        assert r.umur_bulan == 12
        assert r.berat_kg is not None and abs(r.berat_kg - 8.5) < 0.01
        assert r.tinggi_cm is not None and abs(r.tinggi_cm - 74.0) < 0.1
        assert r.jenis_kelamin == "L"
        assert r.needs_confirmation is True

    def test_kalimat_bb_tb_label(self):
        """Gaya label BB dan TB seperti buku KMS."""
        r = get_result("umur 18 bulan BB 9.4 TB 81 perempuan")
        assert r.umur_bulan == 18
        assert r.berat_kg is not None and abs(r.berat_kg - 9.4) < 0.01
        assert r.tinggi_cm is not None and abs(r.tinggi_cm - 81.0) < 0.1
        assert r.jenis_kelamin == "P"

    def test_kalimat_tanpa_data_apapun(self):
        """Kalimat yang tidak berisi data pengukuran → semua None + warnings."""
        r = get_result("halo selamat pagi posyandu")
        assert r.umur_bulan is None
        assert r.berat_kg is None
        assert r.tinggi_cm is None
        assert r.jenis_kelamin is None
        assert len(r.warnings) >= 3  # Minimal 3 field tidak terdeteksi

    def test_needs_confirmation_selalu_true(self):
        """Human-in-the-Loop: needs_confirmation harus selalu True."""
        r = get_result("umur 12 bulan berat 8.5 kg tinggi 74 cm laki-laki")
        assert r.needs_confirmation is True

    def test_overall_confidence_in_range(self):
        """Overall confidence harus antara 0.0 dan 1.0."""
        r = get_result("umur 12 bulan berat 8.5 kg tinggi 74 cm laki-laki")
        assert 0.0 <= r.overall_confidence <= 1.0

    def test_field_terdeteksi_ada_di_extracted_fields(self):
        """Setiap field yang berhasil dideteksi harus ada di extracted_fields."""
        r = get_result("umur 12 bulan berat 8.5 kg tinggi 74 cm laki-laki")
        assert "umur_bulan" in r.extracted_fields
        assert "berat_kg" in r.extracted_fields
        assert "tinggi_cm" in r.extracted_fields
        assert "jenis_kelamin" in r.extracted_fields

    def test_confidence_score_pada_field(self):
        """Setiap field di extracted_fields harus punya confidence 0.0–1.0."""
        r = get_result("umur 12 bulan berat 8.5 kg tinggi 74 cm laki-laki")
        for key, field in r.extracted_fields.items():
            assert 0.0 <= field.confidence <= 1.0, (
                f"Confidence field '{key}' = {field.confidence} di luar range"
            )

    def test_success_flag_true(self):
        """Flag success harus True meskipun ada field yang tidak terdeteksi."""
        r = get_result("umur 12 bulan berat 8.5 kg")
        assert r.success is True


# ─────────────────────────────────────────────────────────────────────────────
# TEST EDGE CASES
# ─────────────────────────────────────────────────────────────────────────────

class TestEdgeCases:
    """Test kasus tepi dan input tidak normal."""

    def test_berat_terlalu_besar_tidak_terdeteksi(self):
        """Berat 100 kg di luar constraint → tidak diambil."""
        r = get_result("berat 100 kg umur 12 bulan tinggi 74 cm")
        assert r.berat_kg is None

    def test_umur_lebih_dari_60_tidak_terdeteksi(self):
        """Umur 70 bulan di luar rentang → tidak diambil."""
        r = get_result("umur 70 bulan berat 9 kg tinggi 74 cm")
        assert r.umur_bulan is None

    def test_tinggi_terlalu_kecil_tidak_terdeteksi(self):
        """Tinggi 20 cm di luar constraint → tidak diambil."""
        r = get_result("tinggi 20 cm berat 9 kg umur 12 bulan")
        assert r.tinggi_cm is None

    def test_input_kosong(self):
        """Input minimal → response valid tapi semua None."""
        r = get_result("   ")
        assert r.success is True
        assert r.umur_bulan is None
        assert r.berat_kg is None

    def test_transkripsi_tersimpan_di_response(self):
        """Teks transkripsi asli harus tersimpan di field transcription."""
        kalimat = "anak Budi umur 12 bulan berat 9 kg"
        r = get_result(kalimat)
        assert r.transcription == kalimat

    def test_deterministic(self):
        """Parsing deterministik — input sama menghasilkan output sama."""
        kalimat = "umur 18 bulan berat 9.5 kg tinggi 80 cm perempuan"
        r1 = get_result(kalimat)
        r2 = get_result(kalimat)
        assert r1.umur_bulan == r2.umur_bulan
        assert r1.berat_kg == r2.berat_kg
        assert r1.tinggi_cm == r2.tinggi_cm
        assert r1.jenis_kelamin == r2.jenis_kelamin
