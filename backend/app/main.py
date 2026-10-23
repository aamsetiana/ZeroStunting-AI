"""
ZeroStunting AI — FastAPI Application Entry Point
==================================================
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.anthropometry import router as anthropometry_router
from app.api.ocr import router as ocr_router
from app.api.records import router as records_router
from app.core.database import engine, Base
from app.models import database  # noqa: F401 — pastikan semua models ter-register

# ─────────────────────────────────────────────────────────────────────────────
# APP INSTANCE
# ─────────────────────────────────────────────────────────────────────────────

# ─────────────────────────────────────────────────────────────────────────────
# LIFESPAN — startup & shutdown events
# ─────────────────────────────────────────────────────────────────────────────


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Jalankan inisialisasi saat startup, cleanup saat shutdown."""
    # Startup: verifikasi koneksi DB (tabel dibuat via Alembic, bukan di sini)
    try:
        with engine.connect() as conn:
            conn.execute(Base.metadata.info.get("ping", lambda c: None) or (lambda c: None)(conn))
    except Exception:
        pass  # Koneksi gagal tidak menghentikan startup; log di production
    yield
    # Shutdown: tidak ada cleanup khusus yang dibutuhkan


app = FastAPI(
    title="ZeroStunting AI — Backend API",
    description=(
        "Backend API untuk sistem deteksi dini stunting berbasis AI. "
        "Menggunakan standar WHO Child Growth Standards 2006 dengan metode LMS."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    contact={
        "name": "ZeroStunting AI Team",
        "url": "https://github.com/zerostunting-ai",
    },
    license_info={
        "name": "MIT",
    },
    lifespan=lifespan,
)

# ─────────────────────────────────────────────────────────────────────────────
# CORS — izinkan frontend Next.js di localhost:3000 dan Vercel
# ─────────────────────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "https://*.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────────────────────────────────────────
# ROUTERS
# ─────────────────────────────────────────────────────────────────────────────

app.include_router(anthropometry_router, prefix="/api/v1")
app.include_router(ocr_router, prefix="/api/v1")
app.include_router(records_router, prefix="/api/v1")

# ─────────────────────────────────────────────────────────────────────────────
# ROOT
# ─────────────────────────────────────────────────────────────────────────────


@app.get("/", tags=["Root"])
async def root():
    return {
        "service": "ZeroStunting AI Backend",
        "version": "1.0.0",
        "docs": "/docs",
        "status": "running",
    }


@app.get("/health", tags=["Root"])
async def health():
    return {"status": "ok"}
