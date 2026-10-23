"""
RAG Engine — ZeroStunting AI
==============================
Engine Retrieval-Augmented Generation untuk rekomendasi gizi balita.

Arsitektur:
  1. Indexing  : Dokumen knowledge base → chunk → embed → simpan ke ChromaDB
  2. Retrieval : Query embedding → cari top-k chunk paling relevan
  3. Generation: Data balita + chunk relevan → prompt LLM (Groq/LLaMA 3.1)
  4. Output    : Rekomendasi gizi + narasi laporan dalam Bahasa Indonesia

Komponen:
  - Vector Store : ChromaDB (embedded, tidak perlu server terpisah)
  - Embedding    : sentence-transformers (lokal, gratis, offline-capable)
                   Fallback: TF-IDF keyword matching (tanpa embedding model)
  - LLM          : Groq API (LLaMA 3.1-8B) via LangChain
                   Fallback: Template-based generation (tanpa API key)

Desain Prinsip:
  - Graceful fallback di setiap layer — sistem tetap berjalan meski tanpa API
  - Tidak ada hallucination murni — selalu berbasis retrieved knowledge
  - Human-in-the-Loop: output selalu dikembalikan untuk review kader

Referensi:
  - Groq API: https://console.groq.com
  - ChromaDB: https://docs.trychroma.com
  - LangChain: https://python.langchain.com
"""

from __future__ import annotations

import logging
import os
import re
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────────────────────────────
# PATH KONSTANTA
# ─────────────────────────────────────────────────────────────────────────────

KNOWLEDGE_BASE_DIR = Path(__file__).parent.parent.parent / "data" / "knowledge_base"
CHROMA_PERSIST_DIR = Path(__file__).parent.parent.parent / "data" / "chroma_db"

# Nama collection di ChromaDB
COLLECTION_NAME = "zerostunting_knowledge"

# ─────────────────────────────────────────────────────────────────────────────
# PROMPT TEMPLATE (sesuai agent.md)
# ─────────────────────────────────────────────────────────────────────────────

PROMPT_TEMPLATE = """Kamu adalah asisten gizi profesional untuk kader Posyandu Indonesia.
Berikan rekomendasi intervensi gizi untuk balita berikut berdasarkan konteks yang tersedia.

Data Balita:
- Nama: {nama}
- Umur: {umur} bulan
- Jenis Kelamin: {jenis_kelamin_label}
- Berat Badan: {berat} kg (Z-score BB/U: {zscore_bbu})
- Tinggi Badan: {tinggi} cm (Z-score PB/U: {zscore_pbu})
- Z-score BB/PB: {zscore_bbpb}
- Status Gizi: {status_gizi}

Konteks dari knowledge base gizi:
{retrieved_context}

Berikan respons dalam format berikut (gunakan bahasa Indonesia yang sederhana dan mudah dipahami kader):

1. ANALISIS SINGKAT KONDISI GIZI (2-3 kalimat)
[Jelaskan kondisi gizi anak berdasarkan Z-score dan status gizi di atas]

2. REKOMENDASI MENU MP-ASI (untuk 1 minggu, berbasis bahan pangan lokal yang mudah didapat dan terjangkau)
[Berikan menu konkret per hari atau pola makan umum yang sesuai usia dan kondisi anak]

3. SARAN TINDAK LANJUT
[Kapan harus kontrol ke Posyandu, kapan harus rujuk ke Puskesmas, apa yang perlu dipantau]

Catatan: Fokus pada bahan pangan lokal yang murah dan mudah didapat di desa.
Jangan merekomendasikan produk susu formula komersial mahal atau suplemen yang tidak tersedia di Puskesmas."""

# Template fallback jika LLM tidak tersedia
FALLBACK_TEMPLATE = {
    "normal": (
        "Status gizi {nama} saat ini baik dengan Z-score BB/U {zscore_bbu} dan PB/U {zscore_pbu}. "
        "Pertahankan pola makan bergizi seimbang.\n\n"
        "Menu harian yang dianjurkan untuk usia {umur} bulan:\n"
        "• Pagi: Bubur beras + lauk protein (telur/ikan/tempe) + sayuran hijau\n"
        "• Siang: Nasi tim + ikan/ayam + sayuran + buah\n"
        "• Sore: Nasi + lauk + sayur + selingan buah\n"
        "• Selingan: Pisang/pepaya/alpukat 1-2x sehari\n\n"
        "Tindak lanjut: Lanjutkan pemantauan rutin di Posyandu setiap bulan."
    ),
    "gizi_kurang": (
        "Status gizi {nama} menunjukkan gizi kurang (Z-score BB/U {zscore_bbu}). "
        "Perlu peningkatan asupan segera.\n\n"
        "Rekomendasi menu untuk densifikasi energi:\n"
        "• Tambahkan 1 sdt minyak kelapa atau 2 sdm santan ke setiap porsi bubur\n"
        "• Utamakan protein hewani: hati ayam (2-3x/minggu), telur (1 butir/hari), ikan\n"
        "• Frekuensi makan: 5-6 kali sehari (termasuk selingan)\n"
        "• Selingan bergizi: alpukat, pisang, bubur kacang hijau\n"
        "• Gunakan kaldu daging/ayam sebagai pengganti air masak bubur\n\n"
        "Tindak lanjut: Pantau berat badan 2 minggu sekali. "
        "Jika tidak ada kenaikan BB dalam 2 bulan, rujuk ke Puskesmas."
    ),
    "gizi_buruk": (
        "Status gizi {nama} menunjukkan gizi buruk (Z-score BB/U {zscore_bbu}). "
        "DIPERLUKAN PENANGANAN SEGERA.\n\n"
        "Tindakan mendesak:\n"
        "• SEGERA RUJUK ke Puskesmas atau fasilitas kesehatan terdekat\n"
        "• Laporkan ke petugas gizi Puskesmas hari ini\n"
        "• Berikan makanan sedikit-sedikit tapi sering (8-12x sehari) sambil menunggu rujukan\n"
        "• Jangan paksa makan jika anak tidak mau\n\n"
        "Di Puskesmas anak akan mendapat:\n"
        "• Penilaian komplikasi medis\n"
        "• Pemberian F-100 atau Ready-to-Use Therapeutic Food (RUTF)\n"
        "• Tatalaksana gizi buruk sesuai protokol Kemenkes RI"
    ),
    "stunting": (
        "Status gizi {nama} menunjukkan stunting (Z-score PB/U {zscore_pbu}). "
        "Perlu intervensi gizi jangka panjang.\n\n"
        "Rekomendasi perbaikan gizi:\n"
        "• Protein hewani setiap hari: ikan, telur, ayam, hati ayam (kaya zinc & zat besi)\n"
        "• Sayuran kaya vitamin A: wortel, ubi oranye, bayam (dukung pertumbuhan tulang)\n"
        "• Pastikan sanitasi: air bersih matang, cuci tangan sebelum makan\n"
        "• Lengkapi imunisasi — infeksi berulang memperparah stunting\n"
        "• Menu: Bubur hati bayam, tim ikan + wortel, sup kacang hijau\n\n"
        "Tindak lanjut: Pantau pertumbuhan tinggi badan setiap bulan. "
        "Konsultasi ke Puskesmas untuk suplementasi zinc dan zat besi."
    ),
    "wasting": (
        "Status gizi {nama} menunjukkan wasting/kurus (Z-score BB/PB {zscore_bbpb}). "
        "Perlu perhatian khusus.\n\n"
        "Rekomendasi segera:\n"
        "• Tingkatkan asupan energi dan protein secara signifikan\n"
        "• Protein hewani: ikan gabus (albumin tinggi), telur, ayam\n"
        "• Densifikasi energi: tambahkan santan/minyak kelapa setiap porsi\n"
        "• Frekuensi: 6-8 kali makan kecil per hari\n"
        "• Pantau apakah ada penyebab infeksi (diare, ISPA) yang memperburuk\n\n"
        "Tindak lanjut: Bila wasting tidak membaik dalam 2 minggu atau "
        "Z-score < -3 SD, SEGERA RUJUK ke Puskesmas."
    ),
}


# ─────────────────────────────────────────────────────────────────────────────
# DOCUMENT LOADER & CHUNKER
# ─────────────────────────────────────────────────────────────────────────────

def _load_knowledge_base() -> list[dict]:
    """
    Load semua file .txt dari knowledge_base directory.
    Kembalikan list document dict dengan keys: text, source, chunk_id.
    """
    documents = []

    if not KNOWLEDGE_BASE_DIR.exists():
        logger.warning(f"Knowledge base directory tidak ditemukan: {KNOWLEDGE_BASE_DIR}")
        return documents

    kb_files = sorted(KNOWLEDGE_BASE_DIR.glob("*.txt"))
    if not kb_files:
        logger.warning("Tidak ada file .txt di knowledge base directory.")
        return documents

    for file_path in kb_files:
        try:
            text = file_path.read_text(encoding="utf-8")
            chunks = _chunk_text(text, chunk_size=500, overlap=50)
            for i, chunk in enumerate(chunks):
                documents.append({
                    "text": chunk,
                    "source": file_path.name,
                    "chunk_id": f"{file_path.stem}_{i:03d}",
                })
            logger.info(f"Loaded {len(chunks)} chunks dari {file_path.name}")
        except Exception as e:
            logger.error(f"Gagal load {file_path.name}: {e}")

    logger.info(f"Total knowledge base: {len(documents)} chunks dari {len(kb_files)} file")
    return documents


def _chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> list[str]:
    """
    Split teks menjadi chunks dengan overlap untuk menjaga konteks.
    Prioritas split pada baris baru (paragraph-aware chunking).
    Fallback: hard split berdasarkan chunk_size jika teks tidak punya newline.
    """
    # Hapus baris komentar (diawali #) dan baris kosong berlebih
    lines = [ln for ln in text.split("\n") if not ln.startswith("# ") or len(ln) > 2]
    paragraphs = []
    current = []

    for line in lines:
        if line.strip() == "" and current:
            paragraphs.append(" ".join(current))
            current = []
        else:
            current.append(line.strip())
    if current:
        paragraphs.append(" ".join(current))

    # Gabungkan paragraf hingga mencapai chunk_size
    chunks: list[str] = []
    current_chunk = ""

    for para in paragraphs:
        if not para.strip():
            continue

        # Hard split: jika satu paragraf sendiri melebihi chunk_size
        if len(para) > chunk_size:
            # Simpan current_chunk dulu jika ada
            if current_chunk.strip():
                chunks.append(current_chunk.strip())
                current_chunk = ""
            # Pecah paragraf panjang menjadi potongan berdasarkan ukuran
            start = 0
            while start < len(para):
                end = start + chunk_size
                # Cari spasi terdekat untuk cut yang bersih
                if end < len(para):
                    cut = para.rfind(" ", start, end)
                    end = cut if cut > start else end
                chunk_part = para[start:end].strip()
                if chunk_part:
                    chunks.append(chunk_part)
                # Overlap ke chunk berikutnya
                start = max(start + 1, end - overlap)
            continue

        if len(current_chunk) + len(para) <= chunk_size:
            current_chunk += (" " if current_chunk else "") + para
        else:
            if current_chunk:
                chunks.append(current_chunk.strip())
            # Overlap: ambil akhir dari chunk sebelumnya
            overlap_text = current_chunk[-overlap:] if len(current_chunk) > overlap else current_chunk
            current_chunk = overlap_text + " " + para

    if current_chunk.strip():
        chunks.append(current_chunk.strip())

    return [c for c in chunks if len(c.strip()) > 20]


# ─────────────────────────────────────────────────────────────────────────────
# VECTOR STORE (ChromaDB)
# ─────────────────────────────────────────────────────────────────────────────

_chroma_collection = None  # Cache collection


def _get_or_create_collection():
    """
    Buat atau load ChromaDB collection dengan dokumen knowledge base.
    Menggunakan embedding function dari sentence-transformers jika tersedia,
    fallback ke chromadb default embedding.
    """
    global _chroma_collection
    if _chroma_collection is not None:
        return _chroma_collection

    try:
        import chromadb

        # Buat persistent client (data disimpan di disk)
        CHROMA_PERSIST_DIR.mkdir(parents=True, exist_ok=True)
        client = chromadb.PersistentClient(path=str(CHROMA_PERSIST_DIR))

        # Coba gunakan sentence-transformers untuk embedding berkualitas lebih baik
        embedding_fn = None
        try:
            from chromadb.utils import embedding_functions
            embedding_fn = embedding_functions.SentenceTransformerEmbeddingFunction(
                model_name="paraphrase-multilingual-MiniLM-L12-v2"
                # Model ringan yang support Bahasa Indonesia
            )
            logger.info("Menggunakan SentenceTransformer embedding (paraphrase-multilingual)")
        except Exception as e:
            logger.warning(f"SentenceTransformer tidak tersedia, pakai default embedding: {e}")
            embedding_fn = None

        # Buat atau load collection
        kwargs = {"name": COLLECTION_NAME, "metadata": {"hnsw:space": "cosine"}}
        if embedding_fn:
            kwargs["embedding_function"] = embedding_fn

        collection = client.get_or_create_collection(**kwargs)

        # Cek apakah collection kosong, jika ya — index dokumen
        if collection.count() == 0:
            logger.info("Collection kosong, mulai indexing knowledge base...")
            documents = _load_knowledge_base()
            if documents:
                collection.add(
                    documents=[d["text"] for d in documents],
                    metadatas=[{"source": d["source"], "chunk_id": d["chunk_id"]} for d in documents],
                    ids=[d["chunk_id"] for d in documents],
                )
                logger.info(f"Indexed {len(documents)} chunks ke ChromaDB")
            else:
                logger.warning("Tidak ada dokumen yang di-index.")
        else:
            logger.info(f"ChromaDB collection sudah ada: {collection.count()} chunks")

        _chroma_collection = collection
        return collection

    except ImportError:
        logger.warning("chromadb belum terpasang. Jalankan: pip install chromadb")
        return None
    except Exception as e:
        logger.error(f"Gagal inisialisasi ChromaDB: {e}")
        return None


def retrieve_context(query: str, n_results: int = 4) -> list[str]:
    """
    Retrieve top-k dokumen paling relevan dari ChromaDB berdasarkan query.

    Args:
        query: Query teks (dibuat dari data balita + status gizi)
        n_results: Jumlah chunk yang di-retrieve

    Returns:
        List teks chunk yang relevan, atau list kosong jika retrieval gagal
    """
    collection = _get_or_create_collection()

    if collection is None:
        logger.warning("ChromaDB tidak tersedia, menggunakan keyword fallback")
        return _keyword_retrieve(query, n_results)

    try:
        results = collection.query(
            query_texts=[query],
            n_results=min(n_results, collection.count()),
            include=["documents", "distances"],
        )
        docs = results.get("documents", [[]])[0]
        distances = results.get("distances", [[]])[0]

        # Filter: hanya ambil chunk dengan cosine similarity cukup tinggi (distance < 1.5)
        filtered = [
            doc for doc, dist in zip(docs, distances)
            if dist < 1.5 and doc.strip()
        ]
        logger.info(f"Retrieved {len(filtered)} chunk relevan untuk query: '{query[:60]}...'")
        return filtered

    except Exception as e:
        logger.error(f"ChromaDB query gagal: {e}")
        return _keyword_retrieve(query, n_results)


def _keyword_retrieve(query: str, n_results: int = 4) -> list[str]:
    """
    Fallback retrieval berbasis keyword matching (tanpa embedding).
    Digunakan saat ChromaDB tidak tersedia.
    """
    documents = _load_knowledge_base()
    if not documents:
        return []

    query_lower = query.lower()
    query_words = set(re.findall(r'\b\w{3,}\b', query_lower))

    # Score setiap chunk berdasarkan jumlah kata query yang muncul
    scored = []
    for doc in documents:
        text_lower = doc["text"].lower()
        score = sum(1 for word in query_words if word in text_lower)
        if score > 0:
            scored.append((score, doc["text"]))

    # Urutkan dari skor tertinggi
    scored.sort(key=lambda x: x[0], reverse=True)
    return [text for _, text in scored[:n_results]]


# ─────────────────────────────────────────────────────────────────────────────
# LLM GENERATION (Groq API via LangChain)
# ─────────────────────────────────────────────────────────────────────────────

def _generate_with_groq(prompt: str) -> Optional[str]:
    """
    Generate teks menggunakan Groq API (LLaMA 3.1-8B).
    Kembalikan None jika API key tidak tersedia atau request gagal.
    """
    groq_api_key = os.getenv("GROQ_API_KEY", "")
    if not groq_api_key:
        logger.info("GROQ_API_KEY tidak diset — menggunakan template fallback")
        return None

    try:
        from langchain_groq import ChatGroq
        from langchain_core.messages import HumanMessage, SystemMessage

        llm = ChatGroq(
            model="llama-3.1-8b-instant",
            api_key=groq_api_key,
            temperature=0.3,       # Rendah untuk konsistensi medis
            max_tokens=1024,
            timeout=30,
        )

        messages = [
            SystemMessage(content=(
                "Kamu adalah asisten gizi profesional yang membantu kader Posyandu desa Indonesia. "
                "Selalu gunakan bahasa Indonesia sederhana. "
                "Fokus pada bahan pangan lokal yang murah dan mudah didapat. "
                "Jangan merekomendasikan produk mahal atau tidak tersedia di desa."
            )),
            HumanMessage(content=prompt),
        ]

        response = llm.invoke(messages)
        result = response.content.strip()
        logger.info(f"Groq API berhasil generate: {len(result)} karakter")
        return result

    except ImportError:
        logger.warning("langchain-groq belum terpasang. pip install langchain-groq")
        return None
    except Exception as e:
        logger.error(f"Groq API gagal: {e}")
        return None


def _generate_fallback(
    nama: str,
    umur: int,
    berat: float,
    tinggi: float,
    zscore_bbu: float,
    zscore_pbu: float,
    zscore_bbpb: float,
    status_gizi: str,
    jenis_kelamin: str,
) -> str:
    """
    Generate rekomendasi berbasis template saat LLM tidak tersedia.
    Dipilih template berdasarkan status gizi yang paling kritis.
    """
    params = {
        "nama": nama or "Balita",
        "umur": umur,
        "berat": berat,
        "tinggi": tinggi,
        "zscore_bbu": f"{zscore_bbu:+.2f}",
        "zscore_pbu": f"{zscore_pbu:+.2f}",
        "zscore_bbpb": f"{zscore_bbpb:+.2f}",
        "status_gizi": status_gizi,
        "jenis_kelamin": "Laki-laki" if jenis_kelamin == "L" else "Perempuan",
    }

    # Pilih template berdasarkan prioritas keparahan
    if zscore_bbu < -3 or zscore_bbpb < -3:
        template_key = "gizi_buruk" if zscore_bbu < -3 else "wasting"
    elif zscore_pbu < -3:
        template_key = "stunting"
    elif zscore_bbu < -2:
        template_key = "gizi_kurang"
    elif zscore_pbu < -2:
        template_key = "stunting"
    elif zscore_bbpb < -2:
        template_key = "wasting"
    else:
        template_key = "normal"

    return FALLBACK_TEMPLATE[template_key].format(**params)


# ─────────────────────────────────────────────────────────────────────────────
# FUNGSI UTAMA: GENERATE ADVISORY
# ─────────────────────────────────────────────────────────────────────────────

def generate_advisory(
    nama: str,
    umur_bulan: int,
    jenis_kelamin: str,
    berat_kg: float,
    tinggi_cm: float,
    zscore_bbu: float,
    zscore_pbu: float,
    zscore_bbpb: float,
    status_gizi: str,
) -> dict:
    """
    Generate rekomendasi gizi lengkap via RAG pipeline.

    Alur:
      1. Buat query dari data balita
      2. Retrieve konteks dari ChromaDB
      3. Buat prompt lengkap (data + konteks)
      4. Generate via Groq (atau fallback template)
      5. Kembalikan hasil + metadata

    Args:
        nama          : Nama anak (bisa kosong)
        umur_bulan    : Umur dalam bulan (0-60)
        jenis_kelamin : "L" atau "P"
        berat_kg      : Berat badan dalam kg
        tinggi_cm     : Tinggi/panjang badan dalam cm
        zscore_bbu    : Z-score Berat Badan per Umur
        zscore_pbu    : Z-score Panjang/Tinggi Badan per Umur
        zscore_bbpb   : Z-score Berat Badan per Panjang/Tinggi Badan
        status_gizi   : Status gizi ringkasan (dari WHO engine)

    Returns:
        dict berisi: rekomendasi, konteks_digunakan, sumber_dokumen, engine_used
    """
    nama_display = nama or "Balita"
    jk_label = "Laki-laki" if jenis_kelamin == "L" else "Perempuan"

    # ── 1. Buat query kontekstual ─────────────────────────────────────────────
    query = _build_retrieval_query(
        umur_bulan=umur_bulan,
        zscore_bbu=zscore_bbu,
        zscore_pbu=zscore_pbu,
        zscore_bbpb=zscore_bbpb,
        status_gizi=status_gizi,
    )
    logger.info(f"Advisory query: {query}")

    # ── 2. Retrieve konteks ───────────────────────────────────────────────────
    retrieved_chunks = retrieve_context(query, n_results=4)
    retrieved_context = "\n\n---\n\n".join(retrieved_chunks) if retrieved_chunks else (
        "Konteks: Berikan rekomendasi berdasarkan pengetahuan gizi umum WHO dan MP-ASI Indonesia."
    )

    # ── 3. Buat prompt ────────────────────────────────────────────────────────
    prompt = PROMPT_TEMPLATE.format(
        nama=nama_display,
        umur=umur_bulan,
        jenis_kelamin_label=jk_label,
        berat=berat_kg,
        tinggi=tinggi_cm,
        zscore_bbu=f"{zscore_bbu:+.2f}",
        zscore_pbu=f"{zscore_pbu:+.2f}",
        zscore_bbpb=f"{zscore_bbpb:+.2f}",
        status_gizi=status_gizi,
        retrieved_context=retrieved_context,
    )

    # ── 4. Generate ───────────────────────────────────────────────────────────
    engine_used = "groq_llama3"
    rekomendasi = _generate_with_groq(prompt)

    if rekomendasi is None:
        engine_used = "template_fallback"
        rekomendasi = _generate_fallback(
            nama=nama_display,
            umur=umur_bulan,
            berat=berat_kg,
            tinggi=tinggi_cm,
            zscore_bbu=zscore_bbu,
            zscore_pbu=zscore_pbu,
            zscore_bbpb=zscore_bbpb,
            status_gizi=status_gizi,
            jenis_kelamin=jenis_kelamin,
        )

    # ── 5. Return hasil ───────────────────────────────────────────────────────
    return {
        "rekomendasi": rekomendasi,
        "konteks_digunakan": retrieved_chunks,
        "jumlah_chunk_retrieved": len(retrieved_chunks),
        "engine_used": engine_used,
        "query_digunakan": query,
    }


def _build_retrieval_query(
    umur_bulan: int,
    zscore_bbu: float,
    zscore_pbu: float,
    zscore_bbpb: float,
    status_gizi: str,
) -> str:
    """
    Buat query retrieval yang optimal berdasarkan kondisi balita.
    Query spesifik meningkatkan relevansi chunk yang di-retrieve.
    """
    parts = [f"MP-ASI usia {umur_bulan} bulan"]

    if zscore_bbu < -3 or "buruk" in status_gizi.lower():
        parts.append("gizi buruk penanganan segera rujuk puskesmas")
    elif zscore_bbu < -2 or "kurang" in status_gizi.lower():
        parts.append("gizi kurang menu densifikasi energi minyak kelapa santan protein hewani")

    if zscore_pbu < -3 or "sangat_pendek" in status_gizi.lower():
        parts.append("stunting berat intervensi gizi zinc zat besi vitamin A")
    elif zscore_pbu < -2 or "pendek" in status_gizi.lower():
        parts.append("stunting pendek protein hewani ikan telur hati wortel bayam")

    if zscore_bbpb < -3 or "sangat_kurus" in status_gizi.lower():
        parts.append("wasting berat ikan gabus albumin pemulihan gizi buruk")
    elif zscore_bbpb < -2 or "kurus" in status_gizi.lower():
        parts.append("wasting kurus energi protein asupan sering")

    if not any(z < -2 for z in [zscore_bbu, zscore_pbu, zscore_bbpb]):
        parts.append("menu seimbang normal tumbuh kembang optimal")

    # Tambahkan konteks usia
    if umur_bulan < 6:
        parts.append("ASI eksklusif bayi")
    elif umur_bulan <= 8:
        parts.append("MP-ASI awal puree halus tekstur 6 8 bulan")
    elif umur_bulan <= 11:
        parts.append("MP-ASI tekstur lumat finger food 9 11 bulan")
    else:
        parts.append("makanan keluarga lunak 12 bulan ke atas")

    return " ".join(parts)


# ─────────────────────────────────────────────────────────────────────────────
# UTILITY: RE-INDEX (untuk dipanggil saat knowledge base diperbarui)
# ─────────────────────────────────────────────────────────────────────────────

def reindex_knowledge_base() -> dict:
    """
    Hapus dan buat ulang ChromaDB index dari knowledge base terbaru.
    Dipanggil saat file knowledge base diperbarui.
    """
    global _chroma_collection
    _chroma_collection = None  # Reset cache

    try:
        import chromadb
        CHROMA_PERSIST_DIR.mkdir(parents=True, exist_ok=True)
        client = chromadb.PersistentClient(path=str(CHROMA_PERSIST_DIR))

        # Hapus collection lama jika ada
        try:
            client.delete_collection(COLLECTION_NAME)
            logger.info(f"Collection '{COLLECTION_NAME}' lama dihapus")
        except Exception:
            pass

        # Buat ulang via _get_or_create_collection
        collection = _get_or_create_collection()
        count = collection.count() if collection else 0
        return {
            "success": True,
            "message": f"Re-index selesai: {count} chunks di-index",
            "total_chunks": count,
        }
    except Exception as e:
        logger.error(f"Re-index gagal: {e}")
        return {"success": False, "message": str(e), "total_chunks": 0}
