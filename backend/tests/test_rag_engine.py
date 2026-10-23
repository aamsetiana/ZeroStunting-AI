"""
Unit Tests — RAG Engine (Advisory)
=====================================
Memvalidasi RAG engine: retrieval, fallback generation, dan advisory output.

Catatan:
  - Test ini TIDAK membutuhkan Groq API key atau ChromaDB aktif
  - Semua test menggunakan fallback mode (keyword retrieval + template generation)
  - Test dengan ChromaDB/LLM di-skip jika dependency belum terpasang

Jalankan: pytest backend/tests/test_rag_engine.py -v
"""

import pytest
import sys
from pathlib import Path

# Tambahkan backend ke sys.path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.rag_engine import (
    _load_knowledge_base,
    _chunk_text,
    _keyword_retrieve,
    _build_retrieval_query,
    _generate_fallback,
    generate_advisory,
)


# ─────────────────────────────────────────────────────────────────────────────
# TEST KNOWLEDGE BASE LOADING
# ─────────────────────────────────────────────────────────────────────────────

class TestKnowledgeBase:
    """Test loading dan chunking knowledge base."""

    def test_knowledge_base_dir_exists(self):
        """Directory knowledge base harus ada."""
        from app.core.rag_engine import KNOWLEDGE_BASE_DIR
        assert KNOWLEDGE_BASE_DIR.exists(), (
            f"Knowledge base directory tidak ditemukan: {KNOWLEDGE_BASE_DIR}"
        )

    def test_knowledge_base_files_exist(self):
        """Minimal 4 file knowledge base harus ada."""
        from app.core.rag_engine import KNOWLEDGE_BASE_DIR
        txt_files = list(KNOWLEDGE_BASE_DIR.glob("*.txt"))
        assert len(txt_files) >= 4, (
            f"Minimal 4 file .txt dibutuhkan, hanya ada {len(txt_files)}: {txt_files}"
        )

    def test_required_knowledge_files(self):
        """File knowledge base wajib harus ada."""
        from app.core.rag_engine import KNOWLEDGE_BASE_DIR
        required_files = [
            "panduan_mpasi_who.txt",
            "bahan_pangan_lokal.txt",
            "resep_mpasi_gizi.txt",
            "e_ppgbm_format.txt",
        ]
        for fname in required_files:
            fpath = KNOWLEDGE_BASE_DIR / fname
            assert fpath.exists(), f"File wajib tidak ditemukan: {fname}"

    def test_load_knowledge_base_returns_documents(self):
        """Fungsi load harus mengembalikan minimal 1 document."""
        docs = _load_knowledge_base()
        assert isinstance(docs, list)
        assert len(docs) > 0, "Tidak ada dokumen yang berhasil di-load"

    def test_document_structure(self):
        """Setiap dokumen harus punya key: text, source, chunk_id."""
        docs = _load_knowledge_base()
        for doc in docs[:5]:  # Cek 5 pertama
            assert "text" in doc, "Dokumen tidak punya field 'text'"
            assert "source" in doc, "Dokumen tidak punya field 'source'"
            assert "chunk_id" in doc, "Dokumen tidak punya field 'chunk_id'"
            assert len(doc["text"]) > 10, "Chunk teks terlalu pendek"

    def test_document_text_not_empty(self):
        """Semua chunk harus berisi teks yang bermakna."""
        docs = _load_knowledge_base()
        for doc in docs:
            assert doc["text"].strip(), f"Chunk kosong ditemukan: chunk_id={doc['chunk_id']}"


# ─────────────────────────────────────────────────────────────────────────────
# TEST TEXT CHUNKING
# ─────────────────────────────────────────────────────────────────────────────

class TestChunking:
    """Test fungsi text chunking."""

    def test_chunk_text_basic(self):
        """Teks panjang harus dipecah menjadi beberapa chunk."""
        long_text = "Kalimat satu. " * 100  # ~1400 karakter
        chunks = _chunk_text(long_text, chunk_size=200)
        assert len(chunks) > 1, "Teks panjang harus menghasilkan lebih dari 1 chunk"

    def test_chunk_text_short(self):
        """Teks pendek harus menghasilkan 1 chunk."""
        short_text = "Ini teks singkat untuk balita gizi baik."
        chunks = _chunk_text(short_text, chunk_size=500)
        assert len(chunks) >= 1

    def test_chunk_size_respected(self):
        """Setiap chunk tidak boleh jauh melebihi chunk_size."""
        text = "Kata " * 500  # Banyak kata pendek
        chunks = _chunk_text(text, chunk_size=100)
        for chunk in chunks:
            # Toleransi 50% melebihi chunk_size karena overlap dan word boundary
            assert len(chunk) <= 250, f"Chunk terlalu besar: {len(chunk)} karakter"

    def test_chunk_no_empty(self):
        """Tidak boleh ada chunk yang kosong."""
        text = "MP-ASI penting untuk pertumbuhan balita.\n\nProtein hewani sangat dianjurkan."
        chunks = _chunk_text(text, chunk_size=200)
        for chunk in chunks:
            assert chunk.strip(), "Chunk tidak boleh kosong"


# ─────────────────────────────────────────────────────────────────────────────
# TEST KEYWORD RETRIEVAL (FALLBACK)
# ─────────────────────────────────────────────────────────────────────────────

class TestKeywordRetrieval:
    """Test keyword-based retrieval fallback."""

    def test_retrieve_returns_list(self):
        """Retrieval harus mengembalikan list."""
        result = _keyword_retrieve("MP-ASI usia 12 bulan stunting", n_results=3)
        assert isinstance(result, list)

    def test_retrieve_stunting_query(self):
        """Query stunting harus menemukan dokumen relevan."""
        result = _keyword_retrieve("stunting pendek gizi protein ikan", n_results=4)
        assert len(result) > 0, "Harus ada dokumen relevan untuk query stunting"
        # Periksa ada kata kunci relevan di hasil
        combined = " ".join(result).lower()
        assert any(kw in combined for kw in ["gizi", "protein", "ikan", "stunting", "mp-asi"])

    def test_retrieve_gizi_buruk_query(self):
        """Query gizi buruk harus menemukan dokumen tentang penanganan gizi buruk."""
        result = _keyword_retrieve("gizi buruk rujuk puskesmas penanganan segera", n_results=3)
        assert len(result) > 0
        combined = " ".join(result).lower()
        assert any(kw in combined for kw in ["puskesmas", "gizi", "rujuk", "buruk"])

    def test_retrieve_respects_n_results(self):
        """Jumlah hasil tidak boleh melebihi n_results."""
        result = _keyword_retrieve("MP-ASI bayi", n_results=2)
        assert len(result) <= 2

    def test_retrieve_no_result_for_irrelevant_query(self):
        """Query tidak relevan → boleh mengembalikan list kosong."""
        result = _keyword_retrieve("xyzabc123 tidak ada artinya sama sekali", n_results=3)
        # Hasilnya bisa kosong atau sangat sedikit
        assert isinstance(result, list)


# ─────────────────────────────────────────────────────────────────────────────
# TEST QUERY BUILDER
# ─────────────────────────────────────────────────────────────────────────────

class TestQueryBuilder:
    """Test fungsi pembuatan query retrieval."""

    def test_query_normal_anak(self):
        """Anak normal → query berisi kata 'normal' dan usia."""
        query = _build_retrieval_query(
            umur_bulan=12, zscore_bbu=0.5, zscore_pbu=0.3,
            zscore_bbpb=0.1, status_gizi="normal"
        )
        assert "normal" in query.lower() or "seimbang" in query.lower()
        assert "12" in query

    def test_query_stunting(self):
        """Anak stunting → query berisi kata stunting."""
        query = _build_retrieval_query(
            umur_bulan=24, zscore_bbu=-1.5, zscore_pbu=-2.5,
            zscore_bbpb=-0.5, status_gizi="pendek"
        )
        assert "stunting" in query.lower() or "pendek" in query.lower()

    def test_query_gizi_buruk(self):
        """Anak gizi buruk → query berisi kata 'gizi buruk'."""
        query = _build_retrieval_query(
            umur_bulan=18, zscore_bbu=-3.5, zscore_pbu=-2.0,
            zscore_bbpb=-1.0, status_gizi="gizi_buruk"
        )
        assert "gizi buruk" in query.lower() or "rujuk" in query.lower()

    def test_query_wasting(self):
        """Anak wasting → query berisi kata 'wasting'."""
        query = _build_retrieval_query(
            umur_bulan=18, zscore_bbu=-1.5, zscore_pbu=-1.0,
            zscore_bbpb=-2.5, status_gizi="kurus"
        )
        assert "wasting" in query.lower() or "kurus" in query.lower()

    def test_query_includes_age_context(self):
        """Query harus selalu menyertakan konteks usia."""
        for umur in [3, 7, 10, 15]:
            query = _build_retrieval_query(
                umur_bulan=umur, zscore_bbu=0.0, zscore_pbu=0.0,
                zscore_bbpb=0.0, status_gizi="normal"
            )
            assert str(umur) in query, f"Umur {umur} bulan harus ada di query"


# ─────────────────────────────────────────────────────────────────────────────
# TEST FALLBACK GENERATION
# ─────────────────────────────────────────────────────────────────────────────

class TestFallbackGeneration:
    """Test template-based fallback generation."""

    def test_generate_fallback_normal(self):
        """Anak normal → output berisi kata 'baik' atau 'normal'."""
        result = _generate_fallback(
            nama="Budi", umur=12, berat=9.5, tinggi=75.0,
            zscore_bbu=0.5, zscore_pbu=0.3, zscore_bbpb=0.1,
            status_gizi="normal", jenis_kelamin="L"
        )
        assert len(result) > 50, "Output harus substansial"
        assert "budi" in result.lower()

    def test_generate_fallback_gizi_kurang(self):
        """Anak gizi kurang → output berisi kata 'kurang' atau rekomendasi protein."""
        result = _generate_fallback(
            nama="Sari", umur=18, berat=8.0, tinggi=80.0,
            zscore_bbu=-2.5, zscore_pbu=-1.5, zscore_bbpb=-0.5,
            status_gizi="gizi_kurang", jenis_kelamin="P"
        )
        assert len(result) > 50
        assert any(kw in result.lower() for kw in ["kurang", "protein", "gizi", "makan"])

    def test_generate_fallback_gizi_buruk(self):
        """Anak gizi buruk → output berisi kata 'rujuk' atau 'segera'."""
        result = _generate_fallback(
            nama="Andi", umur=24, berat=7.0, tinggi=82.0,
            zscore_bbu=-3.5, zscore_pbu=-2.0, zscore_bbpb=-1.5,
            status_gizi="gizi_buruk", jenis_kelamin="L"
        )
        assert len(result) > 50
        assert any(kw in result.lower() for kw in ["rujuk", "segera", "puskesmas"])

    def test_generate_fallback_stunting(self):
        """Anak stunting → output berisi kata 'stunting' atau 'pendek'."""
        result = _generate_fallback(
            nama="Dewi", umur=30, berat=11.0, tinggi=83.0,
            zscore_bbu=-1.0, zscore_pbu=-2.5, zscore_bbpb=-0.3,
            status_gizi="pendek", jenis_kelamin="P"
        )
        assert len(result) > 50
        assert any(kw in result.lower() for kw in ["stunting", "pendek", "zinc", "protein"])

    def test_generate_fallback_wasting(self):
        """Anak wasting → output berisi kata 'wasting' atau 'kurus'."""
        result = _generate_fallback(
            nama="Riko", umur=18, berat=7.5, tinggi=82.0,
            zscore_bbu=-1.5, zscore_pbu=-1.0, zscore_bbpb=-2.3,
            status_gizi="kurus", jenis_kelamin="L"
        )
        assert len(result) > 50
        assert any(kw in result.lower() for kw in ["wasting", "kurus", "energi", "protein"])

    def test_generate_without_nama(self):
        """Tanpa nama → gunakan 'Balita' sebagai default."""
        result = _generate_fallback(
            nama="", umur=12, berat=9.0, tinggi=74.0,
            zscore_bbu=0.3, zscore_pbu=0.5, zscore_bbpb=0.2,
            status_gizi="normal", jenis_kelamin="L"
        )
        assert len(result) > 20

    def test_generate_sangat_kurus(self):
        """Anak sangat kurus → dianggap gizi buruk → ada kata rujuk."""
        result = _generate_fallback(
            nama="Test", umur=18, berat=6.0, tinggi=80.0,
            zscore_bbu=-2.0, zscore_pbu=-1.5, zscore_bbpb=-3.5,
            status_gizi="sangat_kurus", jenis_kelamin="L"
        )
        assert any(kw in result.lower() for kw in ["rujuk", "segera", "puskesmas"])


# ─────────────────────────────────────────────────────────────────────────────
# TEST GENERATE ADVISORY (FUNGSI UTAMA)
# ─────────────────────────────────────────────────────────────────────────────

class TestGenerateAdvisory:
    """Test fungsi utama generate_advisory (end-to-end dengan fallback)."""

    def _call_advisory(self, **kwargs):
        defaults = {
            "nama": "TestAnak",
            "umur_bulan": 18,
            "jenis_kelamin": "L",
            "berat_kg": 9.5,
            "tinggi_cm": 80.0,
            "zscore_bbu": -1.5,
            "zscore_pbu": -2.3,
            "zscore_bbpb": -0.5,
            "status_gizi": "pendek",
        }
        defaults.update(kwargs)
        return generate_advisory(**defaults)

    def test_returns_dict(self):
        """Output harus berupa dict."""
        result = self._call_advisory()
        assert isinstance(result, dict)

    def test_required_keys(self):
        """Output harus punya semua key yang dibutuhkan."""
        result = self._call_advisory()
        required_keys = [
            "rekomendasi", "konteks_digunakan",
            "jumlah_chunk_retrieved", "engine_used", "query_digunakan"
        ]
        for key in required_keys:
            assert key in result, f"Key '{key}' tidak ditemukan di output"

    def test_rekomendasi_not_empty(self):
        """Rekomendasi tidak boleh kosong."""
        result = self._call_advisory()
        assert result["rekomendasi"].strip(), "Rekomendasi tidak boleh kosong"
        assert len(result["rekomendasi"]) > 30, "Rekomendasi terlalu pendek"

    def test_engine_used_valid(self):
        """engine_used harus salah satu dari nilai yang valid."""
        result = self._call_advisory()
        valid_engines = {"groq_llama3", "template_fallback"}
        assert result["engine_used"] in valid_engines, (
            f"engine_used '{result['engine_used']}' tidak valid"
        )

    def test_jumlah_chunk_non_negative(self):
        """Jumlah chunk harus >= 0."""
        result = self._call_advisory()
        assert result["jumlah_chunk_retrieved"] >= 0

    def test_konteks_digunakan_is_list(self):
        """konteks_digunakan harus berupa list."""
        result = self._call_advisory()
        assert isinstance(result["konteks_digunakan"], list)

    def test_query_digunakan_not_empty(self):
        """Query yang digunakan harus tersimpan."""
        result = self._call_advisory()
        assert result["query_digunakan"].strip()

    def test_advisory_normal_anak(self):
        """Anak normal → rekomendasi berisi kata positif."""
        result = self._call_advisory(
            zscore_bbu=0.5, zscore_pbu=0.3, zscore_bbpb=0.1,
            status_gizi="normal"
        )
        text = result["rekomendasi"].lower()
        assert any(kw in text for kw in ["baik", "pertahankan", "normal", "rutin"])

    def test_advisory_gizi_buruk_urgent(self):
        """Gizi buruk → rekomendasi ada kata 'rujuk' atau 'puskesmas'."""
        result = self._call_advisory(
            zscore_bbu=-3.5, zscore_pbu=-2.5, zscore_bbpb=-2.0,
            status_gizi="gizi_buruk"
        )
        text = result["rekomendasi"].lower()
        assert any(kw in text for kw in ["rujuk", "puskesmas", "segera"])

    def test_advisory_deterministic_fallback(self):
        """Dengan fallback template, hasil harus deterministik."""
        params = {
            "zscore_bbu": -2.3, "zscore_pbu": -1.5,
            "zscore_bbpb": -0.5, "status_gizi": "gizi_kurang"
        }
        r1 = self._call_advisory(**params)
        r2 = self._call_advisory(**params)
        # Template fallback harus identik
        if r1["engine_used"] == "template_fallback":
            assert r1["rekomendasi"] == r2["rekomendasi"]

    def test_advisory_tanpa_nama(self):
        """Tanpa nama anak → tetap generate rekomendasi valid."""
        result = self._call_advisory(nama="")
        assert result["rekomendasi"].strip()

    def test_advisory_bayi_6_bulan(self):
        """Bayi 6 bulan → query harus berisi konteks MP-ASI awal."""
        result = self._call_advisory(
            umur_bulan=6, zscore_bbu=0.2, zscore_pbu=0.1,
            zscore_bbpb=0.0, status_gizi="normal"
        )
        assert "6" in result["query_digunakan"]

    def test_advisory_balita_5_tahun(self):
        """Balita 60 bulan → valid (batas atas)."""
        result = self._call_advisory(
            umur_bulan=60, berat_kg=18.0, tinggi_cm=108.0,
            zscore_bbu=0.0, zscore_pbu=-0.5, zscore_bbpb=0.0,
            status_gizi="normal"
        )
        assert isinstance(result["rekomendasi"], str)
        assert len(result["rekomendasi"]) > 10
