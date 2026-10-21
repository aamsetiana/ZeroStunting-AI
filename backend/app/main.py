"""
ZeroStunting AI — FastAPI Application Entry Point
==================================================
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.anthropometry import router as anthropometry_router

# ─────────────────────────────────────────────────────────────────────────────
# APP INSTANCE
# ─────────────────────────────────────────────────────────────────────────────

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
