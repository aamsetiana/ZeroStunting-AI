"""
API Router — Advisory / RAG Engine
=====================================
Endpoint untuk generate rekomendasi gizi balita berbasis RAG (Retrieval-Augmented Generation).

Alur:
  Data balita + Z-score → RAG Engine → konteks knowledge base → LLM → rekomendasi gizi

Endpoint:
  POST /advisory/generate   → Generate rekomendasi gizi (utama)
  POST /advisory/reindex    → Re-index knowledge base (admin)
  GET  /advisory/health     → Health check RAG engine
"""

import logging
from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.schemas.advisory import AdvisoryRequest, AdvisoryResponse, ReindexResponse
from app.core.rag_engine import generate_advisory, reindex_knowledge_base

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/advisory", tags=["Advisory / RAG Gizi"])

# Simple bearer token check untuk endpoint admin (reindex)
_bearer = HTTPBearer(auto_error=False)


def _check_admin_token(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
) -> bool:
    """Validasi admin token untuk endpoint sensitif (reindex)."""
    import os
    admin_token = os.getenv("ADMIN_API_TOKEN", "")
    if not admin_token:
        return True  # Jika token tidak diset, izinkan semua (development)
    if credentials is None or credentials.credentials != admin_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token admin tidak valid.",
        )
    return True


@router.post(
    "/generate",
    response_model=AdvisoryResponse,
    summary="Generate Rekomendasi Gizi Balita via RAG",
    description=(
        "Menerima data balita beserta hasil kalkulasi Z-score WHO, "
        "lalu menghasilkan rekomendasi gizi berbasis Retrieval-Augmented Generation (RAG). "
        "Engine mencari konteks relevan dari knowledge base gizi pangan lokal, "
        "kemudian menggunakan Groq/LLaMA 3.1 untuk membuat rekomendasi yang "
        "kontekstual dan berbasis bukti. "
        "Jika Groq API tidak tersedia, fallback ke template berbasis aturan.\n\n"
        "**Penting:** Output ini adalah rekomendasi AI yang HARUS diverifikasi "
        "oleh kader atau tenaga kesehatan sebelum disampaikan kepada ibu/pengasuh."
    ),
    status_code=status.HTTP_200_OK,
)
async def generate_rekomendasi(payload: AdvisoryRequest) -> AdvisoryResponse:
    """
    Generate rekomendasi gizi via RAG pipeline.

    Input: Data balita lengkap + Z-score dari WHO engine
    Output: Rekomendasi gizi + menu MP-ASI + tindak lanjut
    """
    try:
        result = generate_advisory(
            nama=payload.nama_anak or "",
            umur_bulan=payload.umur_bulan,
            jenis_kelamin=payload.jenis_kelamin.value,
            berat_kg=payload.berat_kg,
            tinggi_cm=payload.tinggi_cm,
            zscore_bbu=payload.zscore_bbu,
            zscore_pbu=payload.zscore_pbu,
            zscore_bbpb=payload.zscore_bbpb,
            status_gizi=payload.status_gizi,
        )
    except Exception as e:
        logger.error(f"Advisory generation gagal: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Terjadi kesalahan saat generate rekomendasi gizi: {str(e)}",
        )

    return AdvisoryResponse(
        nama_anak=payload.nama_anak,
        umur_bulan=payload.umur_bulan,
        status_gizi=payload.status_gizi,
        rekomendasi=result["rekomendasi"],
        jumlah_chunk_retrieved=result["jumlah_chunk_retrieved"],
        engine_used=result["engine_used"],
        konteks_relevan=result["konteks_digunakan"],
        needs_review=True,  # Selalu True — Human-in-the-Loop
    )


@router.post(
    "/reindex",
    response_model=ReindexResponse,
    summary="Re-index Knowledge Base (Admin)",
    description=(
        "Menghapus dan membangun ulang ChromaDB index dari file knowledge base terbaru. "
        "Panggil endpoint ini setelah memperbarui file di `data/knowledge_base/`. "
        "Memerlukan ADMIN_API_TOKEN jika diset di environment."
    ),
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(_check_admin_token)],
)
async def reindex_kb() -> ReindexResponse:
    """Re-index seluruh knowledge base ke ChromaDB."""
    try:
        result = reindex_knowledge_base()
        return ReindexResponse(**result)
    except Exception as e:
        logger.error(f"Re-index gagal: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Re-index knowledge base gagal: {str(e)}",
        )


@router.get(
    "/health",
    summary="Health Check — RAG Engine",
    description=(
        "Cek status ketersediaan komponen RAG engine: "
        "ChromaDB, SentenceTransformer embedding, Groq API, dan knowledge base."
    ),
)
async def advisory_health():
    """Health check untuk seluruh komponen RAG engine."""
    import os
    from pathlib import Path

    # Cek knowledge base
    kb_dir = Path(__file__).parent.parent.parent / "data" / "knowledge_base"
    kb_files = list(kb_dir.glob("*.txt")) if kb_dir.exists() else []

    # Cek ChromaDB
    chroma_available = False
    chroma_count = 0
    try:
        import chromadb  # type: ignore  # noqa: F401
        chroma_available = True
        from app.core.rag_engine import _get_or_create_collection
        collection = _get_or_create_collection()
        if collection:
            chroma_count = collection.count()
    except ImportError:
        pass
    except Exception:
        pass

    # Cek sentence-transformers
    st_available = False
    try:
        import sentence_transformers  # type: ignore  # noqa: F401
        st_available = True
    except ImportError:
        pass

    # Cek Groq API key
    groq_configured = bool(os.getenv("GROQ_API_KEY", ""))

    # Cek langchain-groq
    langchain_groq_available = False
    try:
        import langchain_groq  # type: ignore  # noqa: F401
        langchain_groq_available = True
    except ImportError:
        pass

    # Tentukan mode operasi
    if groq_configured and langchain_groq_available and chroma_available:
        mode = "Full RAG (ChromaDB + Groq LLaMA 3.1)"
    elif chroma_available and not groq_configured:
        mode = "RAG Retrieval Only (ChromaDB ready, tanpa LLM — fallback template)"
    elif not chroma_available:
        mode = "Keyword Fallback (ChromaDB tidak tersedia) + Template"
    else:
        mode = "Template Fallback Only"

    return {
        "status": "ok",
        "service": "ZeroStunting AI RAG Advisory Engine",
        "mode": mode,
        "components": {
            "knowledge_base": {
                "available": len(kb_files) > 0,
                "file_count": len(kb_files),
                "files": [f.name for f in kb_files],
            },
            "chromadb": {
                "available": chroma_available,
                "indexed_chunks": chroma_count,
                "info": "pip install chromadb" if not chroma_available else "OK",
            },
            "sentence_transformers": {
                "available": st_available,
                "info": "pip install sentence-transformers" if not st_available else "OK (multilingual)",
            },
            "groq_llm": {
                "configured": groq_configured,
                "langchain_groq_installed": langchain_groq_available,
                "info": (
                    "Set GROQ_API_KEY di .env" if not groq_configured
                    else "pip install langchain-groq" if not langchain_groq_available
                    else "OK (LLaMA 3.1-8B)"
                ),
            },
        },
    }
