# ZeroStunting AI 🌱

**Platform Deteksi Dini Stunting Berbasis AI untuk Kader Posyandu Indonesia**

> Finalis Hackathon ITS 2026 (Seno Hackathon) — kategori AI for Social Good

---

## Deskripsi Proyek

ZeroStunting AI adalah sistem berbasis kecerdasan buatan yang membantu kader Posyandu mendeteksi risiko stunting lebih cepat dan akurat menggunakan standar WHO 2006 Child Growth Standards. Platform ini menggabungkan:

- **WHO Anthro Engine** — Kalkulasi Z-score BB/U, PB/U, BB/PB dengan metode LMS
- **Input Fleksibel** — Foto KMS (OCR), suara (Speech-to-Text), atau form manual
- **AI Advisory** — Rekomendasi gizi personal berbasis RAG (LLaMA 3.1 + ChromaDB)
- **Laporan Otomatis** — Generate e-PPGBM sesuai format Kemenkes

---

## Struktur Proyek

```
ZeroStunting AI/
├── backend/                    # Python FastAPI
│   ├── app/
│   │   ├── api/               # Endpoint (anthropometry, ocr, rag, reports)
│   │   ├── core/              # WHO Anthro Engine (komponen paling kritis)
│   │   ├── models/            # SQLAlchemy DB models
│   │   └── schemas/           # Pydantic request/response schemas
│   ├── data/
│   │   ├── who_tables/        # Tabel LMS WHO 2006 (CSV)
│   │   └── knowledge_base/    # Dokumen RAG (PMK, panduan gizi)
│   ├── scripts/               # Helper scripts (generate_who_tables.py)
│   ├── tests/                 # Unit tests (pytest)
│   └── requirements.txt
│
├── frontend/                   # Next.js 14 + Tailwind + shadcn/ui
│   ├── app/                   # App Router pages
│   ├── components/            # UI components
│   └── lib/                   # API client, utils
│
├── prd.md                     # Product Requirements Document
├── agent.md                   # Panduan untuk AI coding agent
└── README.md
```

---

## Quick Start

### Backend

```bash
cd backend

# 1. Buat virtual environment
python -m venv venv
.\venv\Scripts\activate        # Windows
source venv/bin/activate       # macOS/Linux

# 2. Install dependencies
pip install -r requirements.txt

# 3. Generate tabel referensi WHO
python scripts/generate_who_tables.py

# 4. Jalankan server
uvicorn app.main:app --reload --port 8000
```

Backend akan berjalan di: http://localhost:8000  
Dokumentasi API: http://localhost:8000/docs

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend akan berjalan di: http://localhost:3000

---

## Testing

```bash
cd backend
.\venv\Scripts\pytest tests/ -v
```

Hasil: **33 tests passed** — 100% coverage untuk WHO Anthro Engine

---

## Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Frontend | Next.js 14, Tailwind CSS, shadcn/ui, Recharts |
| Backend | FastAPI, Python 3.12 |
| WHO Engine | Custom LMS implementation (standar WHO 2006) |
| Database | PostgreSQL (Supabase) |
| AI/LLM | Groq LLaMA 3.1 + LangChain + ChromaDB |
| OCR | Google Cloud Vision API |
| Deploy | Vercel (frontend) + Railway (backend) |

---

## Business Model

**B2G SaaS** — Kader pakai **GRATIS**, Pemerintah yang membayar.

| Paket | Target | Harga |
|-------|--------|-------|
| Free | Kader Posyandu | Gratis selamanya |
| Puskesmas Basic | 1 Puskesmas | Rp 500.000/bulan |
| Dinkes Pro | Kab/Kota | Rp 3–5 juta/bulan |

---

## Tim

- ZeroStunting AI Team — Hackathon ITS 2026
