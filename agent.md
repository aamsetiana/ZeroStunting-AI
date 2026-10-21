# AGENT GUIDE — ZeroStunting AI
> Dokumen ini adalah **panduan wajib bagi AI Agent** sebelum menulis satu baris kode pun.
> Baca seluruh dokumen ini terlebih dahulu, pahami konteks, lalu bantu vibe coding dengan tepat.

---

## 🎯 APA INI?

**ZeroStunting AI** adalah web app untuk **Kader Posyandu desa** di Indonesia.
Tujuan utamanya: **menggantikan pencatatan balita yang masih manual dan rawan error**.

Kader Posyandu adalah relawan desa (biasanya ibu-ibu) yang menimbang dan memantau tumbuh kembang balita setiap bulan. Mereka sering tidak punya latar belakang IT.

**3 masalah utama yang diselesaikan:**
1. Salah hitung Z-score stunting (karena manual pakai grafik kertas)
2. Laporan ke Puskesmas terlambat & butuh waktu berhari-hari
3. Tidak ada panduan intervensi gizi yang kontekstual dan terjangkau

---

## 🏗️ STACK TEKNOLOGI

### Frontend
```
Framework  : Next.js 14 (App Router)
UI         : shadcn/ui + Tailwind CSS
State      : Zustand
Form       : React Hook Form + Zod (validasi ketat untuk data medis)
Charts     : Recharts (grafik pertumbuhan Z-score)
Voice      : Web Speech API (built-in browser)
PWA        : next-pwa (offline-capable, installable di HP)
```

### Backend
```
Runtime    : Python 3.11+ dengan FastAPI
WHO Engine : Custom Python (tabel WHO Growth Standards 2006)
OCR        : Google Cloud Vision API (utama) / Tesseract (fallback)
Speech     : OpenAI Whisper (self-hosted, akurasi Bahasa Indonesia)
LLM/RAG    : Groq API (LLaMA 3.1) + LangChain + ChromaDB
Database   : PostgreSQL via Supabase (managed, free tier)
ORM        : SQLAlchemy + Alembic (migrasi)
Storage    : Supabase Storage (foto KMS/catatan timbang)
```

### Deploy
```
Frontend   : Vercel (free, CI/CD dari GitHub)
Backend    : Railway atau Render (free tier cukup untuk hackathon)
```

---

## 📁 STRUKTUR FOLDER YANG HARUS DIIKUTI

```
zerostunting-ai/
├── frontend/                    # Next.js App
│   ├── app/
│   │   ├── (dashboard)/
│   │   │   ├── page.tsx         # Dashboard utama kader
│   │   │   ├── input/
│   │   │   │   ├── page.tsx     # Halaman pilih mode input
│   │   │   │   ├── ocr/         # Mode 1: Scan foto
│   │   │   │   ├── voice/       # Mode 2: Input suara
│   │   │   │   └── form/        # Mode 3: Form langsung
│   │   │   ├── balita/
│   │   │   │   ├── [id]/page.tsx # Detail + riwayat balita
│   │   │   └── laporan/
│   │   │       └── page.tsx     # Generate laporan e-PPGBM
│   │   ├── (auth)/
│   │   │   └── login/page.tsx
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/                  # shadcn/ui components
│   │   ├── balita/              # Komponen khusus data balita
│   │   ├── charts/              # Grafik Z-score, growth chart
│   │   └── input/               # Komponen OCR, Voice, Form
│   ├── lib/
│   │   ├── api.ts               # Axios/fetch ke backend FastAPI
│   │   ├── validations.ts       # Zod schemas untuk data medis
│   │   └── store.ts             # Zustand state management
│   └── public/
│       └── manifest.json        # PWA manifest
│
├── backend/                     # FastAPI App
│   ├── app/
│   │   ├── main.py              # Entry point FastAPI
│   │   ├── api/
│   │   │   ├── anthropometry.py # Endpoint kalkulasi Z-score
│   │   │   ├── ocr.py           # Endpoint OCR foto KMS
│   │   │   ├── voice.py         # Endpoint speech-to-text
│   │   │   ├── advisory.py      # Endpoint RAG rekomendasi gizi
│   │   │   └── laporan.py       # Endpoint generate laporan PDF
│   │   ├── core/
│   │   │   ├── who_anthro.py    # WHO Z-score engine (INTI SISTEM)
│   │   │   ├── validation.py    # Medical constraint validation
│   │   │   └── rag_engine.py    # LangChain + ChromaDB RAG
│   │   ├── models/
│   │   │   └── database.py      # SQLAlchemy models
│   │   └── schemas/
│   │       └── anthropometry.py # Pydantic schemas
│   ├── data/
│   │   ├── who_tables/          # Tabel referensi WHO 2006
│   │   └── knowledge_base/      # Dokumen gizi pangan lokal untuk RAG
│   └── tests/
│       └── test_who_anthro.py   # Unit test kalkulasi Z-score
│
├── prd.md                       # Product Requirements Document
├── agent.md                     # File ini (panduan agent)
└── README.md
```

---

## 🔄 ALUR SISTEM (BACA BAIK-BAIK)

```
[KADER INPUT DATA BALITA]
        │
        ├─ Mode OCR  → upload foto catatan timbang
        │              → backend ekstrak angka via Vision API
        │              → frontend tampilkan preview untuk dikonfirmasi kader
        │
        ├─ Mode Voice → kader ucapkan data balita
        │               → Whisper transkrip → NLP parsing → isi form
        │               → frontend tampilkan preview untuk dikonfirmasi kader
        │
        └─ Mode Form  → kader isi langsung di web form
                        → validasi Zod real-time
                        │
                        ▼
            [HUMAN-IN-THE-LOOP CONFIRMATION]
            Kader selalu konfirmasi data sebelum diproses
            (prevent AI error masuk ke database)
                        │
                        ▼
            [WHO ANTHRO ENGINE — backend]
            Hitung Z-score: BB/U, PB/U, BB/PB
            Klasifikasi: Normal / Kurang / Buruk / Stunting / Wasting
            Constraint Check: data di luar batas biologis → alert
                        │
                        ▼
            [RAG LLM ENGINE — backend]
            Query knowledge base gizi lokal
            Generate: rekomendasi menu MP-ASI berbasis pangan lokal
            Generate: narasi laporan untuk e-PPGBM
                        │
                        ▼
            [OUTPUT KE KADER]
            - Status gizi + Z-score
            - Alert jika berisiko stunting
            - Rekomendasi gizi (menu + bahan)
            - Tombol: Cetak Laporan e-PPGBM (PDF)
```

---

## 🧮 WHO ANTHRO ENGINE — DETAIL TEKNIS

Ini adalah **komponen paling kritis** dalam sistem. Harus akurat 100%.

### Indikator yang Dihitung
| Indikator | Kepanjangan | Artinya |
|-----------|-------------|---------|
| BB/U | Berat Badan per Umur | Deteksi berat badan kurang (underweight) |
| PB/U | Panjang/Tinggi Badan per Umur | Deteksi stunting (pendek) |
| BB/PB | Berat Badan per Panjang Badan | Deteksi wasting (kurus) |

### Cara Kalkulasi Z-Score
```python
# Rumus Z-Score WHO (metode LMS):
# Z = (nilai_actual / M) ^ L - 1) / (L * S)
# Di mana L, M, S diambil dari tabel WHO berdasarkan: jenis_kelamin + umur_dalam_bulan

# Klasifikasi berdasarkan Z-score:
# > +2 SD  : Di atas normal (lebih/obesitas)
# -2 s/d +2: Normal
# < -2 SD  : Kurang / At Risk
# < -3 SD  : Buruk / Stunting / Wasting
```

### Sumber Referensi WHO
- Tabel: `who_weight_for_age_boys.csv`, `who_weight_for_age_girls.csv`
- Tabel: `who_length_for_age_boys.csv`, `who_length_for_age_girls.csv`
- Tabel: `who_weight_for_length_boys.csv`, `who_weight_for_length_girls.csv`
- Download: [WHO Child Growth Standards](https://www.who.int/tools/child-growth-standards/standards)

### Constraint Validation (Batas Biologis Wajar)
```python
CONSTRAINTS = {
    "berat_kg": {"min": 1.5, "max": 35.0},      # Berat balita (0-60 bulan)
    "tinggi_cm": {"min": 40.0, "max": 130.0},    # Tinggi balita
    "umur_bulan": {"min": 0, "max": 60},         # Maksimum 5 tahun
    "zscore": {"alert_min": -4.0, "alert_max": 4.0}  # Z-score ekstrem
}
```

---

## 🤖 RAG ENGINE — DETAIL TEKNIS

### Knowledge Base yang Dibutuhkan
Simpan di `backend/data/knowledge_base/`:
```
- panduan_mpasi_who.txt        # Panduan MP-ASI WHO
- bahan_pangan_lokal.txt       # Daftar bahan pangan lokal per wilayah + kandungan gizi
- resep_mpasi_gizi.txt         # Resep MP-ASI berbasis bahan lokal (murah, mudah didapat)
- e_ppgbm_format.txt           # Format & terminologi laporan e-PPGBM Kemenkes
```

### Alur RAG
```python
# 1. Input: data balita + Z-score + status gizi
# 2. Query ChromaDB dengan embedding query
# 3. Retrieve top-k dokumen relevan
# 4. Prompt LLM (LLaMA 3.1 via Groq) dengan context
# 5. Output: rekomendasi gizi + narasi laporan
```

### Prompt Template (Gunakan ini sebagai dasar)
```
Kamu adalah asisten gizi profesional untuk kader Posyandu Indonesia.
Berikan rekomendasi intervensi gizi untuk balita berikut:

Data Balita:
- Nama: {nama}
- Umur: {umur} bulan
- Jenis Kelamin: {jenis_kelamin}
- Berat Badan: {berat} kg (Z-score BB/U: {zscore_bbu})
- Tinggi Badan: {tinggi} cm (Z-score PB/U: {zscore_pbu})
- Status Gizi: {status_gizi}

Context dari knowledge base:
{retrieved_context}

Berikan:
1. Analisis singkat kondisi gizi (2-3 kalimat, bahasa mudah dipahami kader)
2. Rekomendasi menu MP-ASI untuk 1 minggu (berbasis bahan pangan lokal yang mudah didapat)
3. Saran tindak lanjut (kapan harus rujuk ke Puskesmas)

Gunakan bahasa Indonesia yang sederhana dan mudah dipahami.
```

---

## 🗄️ DATABASE SCHEMA

```sql
-- Posyandu (unit kerja kader)
CREATE TABLE posyandu (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama VARCHAR(200) NOT NULL,
    desa VARCHAR(200),
    kecamatan VARCHAR(200),
    kabupaten VARCHAR(200),
    provinsi VARCHAR(200),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Kader (pengguna sistem)
CREATE TABLE kader (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    posyandu_id UUID REFERENCES posyandu(id),
    nama VARCHAR(200) NOT NULL,
    email VARCHAR(200) UNIQUE,
    phone VARCHAR(20),
    role VARCHAR(50) DEFAULT 'kader', -- 'kader' | 'bidan' | 'admin'
    created_at TIMESTAMP DEFAULT NOW()
);

-- Balita (data anak)
CREATE TABLE balita (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    posyandu_id UUID REFERENCES posyandu(id),
    nama VARCHAR(200) NOT NULL,
    tanggal_lahir DATE NOT NULL,
    jenis_kelamin VARCHAR(10) NOT NULL, -- 'L' | 'P'
    nama_ibu VARCHAR(200),
    alamat TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Penimbangan (data per sesi timbang)
CREATE TABLE penimbangan (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    balita_id UUID REFERENCES balita(id),
    kader_id UUID REFERENCES kader(id),
    tanggal_timbang DATE NOT NULL,
    umur_bulan INTEGER NOT NULL,
    berat_kg DECIMAL(5,2) NOT NULL,
    tinggi_cm DECIMAL(5,1) NOT NULL,
    -- Hasil kalkulasi WHO
    zscore_bbu DECIMAL(5,2),     -- BB/U
    zscore_pbu DECIMAL(5,2),     -- PB/U
    zscore_bbpb DECIMAL(5,2),    -- BB/PB
    status_gizi VARCHAR(50),     -- 'normal' | 'kurang' | 'buruk' | 'stunting' | 'wasting'
    -- Metadata input
    input_mode VARCHAR(20),      -- 'ocr' | 'voice' | 'form'
    foto_url TEXT,               -- URL foto KMS (jika mode OCR)
    rekomendasi_gizi TEXT,       -- Output RAG
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 📋 API ENDPOINTS

### Backend FastAPI (Base URL: `/api/v1`)

| Method | Endpoint | Fungsi |
|--------|----------|--------|
| POST | `/anthropometry/calculate` | Hitung Z-score + status gizi |
| POST | `/ocr/extract` | Ekstrak data dari foto KMS |
| POST | `/voice/transcribe` | Transkrip suara ke data terstruktur |
| POST | `/advisory/generate` | Generate rekomendasi gizi via RAG |
| POST | `/laporan/generate` | Generate PDF laporan e-PPGBM |
| GET | `/balita/{id}/history` | Riwayat penimbangan + grafik |
| POST | `/penimbangan` | Simpan data penimbangan baru |
| GET | `/posyandu/{id}/dashboard` | Statistik posyandu (ringkasan) |

---

## ⚠️ ATURAN WAJIB SAAT CODING

### DO ✅
- Selalu validasi input data medis dengan **Zod** (frontend) dan **Pydantic** (backend)
- Selalu tampilkan **Human-in-the-Loop confirmation** sebelum data disimpan ke DB
- Gunakan **TypeScript strict mode** di frontend
- Unit test untuk `who_anthro.py` — bandingkan hasilnya dengan [WHO Anthro software](https://www.who.int/tools/child-growth-standards/software)
- Gunakan **error boundary** di semua komponen yang call ke API eksternal
- Semua teks UI dalam **Bahasa Indonesia** (target user: kader desa)
- Desain UI harus **mobile-first** (kader pakai HP, bukan laptop)
- Log semua error di backend untuk debugging

### DON'T ❌
- Jangan simpan data balita ke database **sebelum** kader konfirmasi
- Jangan gunakan Z-score tanpa validasi constraint biologis terlebih dahulu
- Jangan hardcode API keys di kode — selalu gunakan `.env`
- Jangan skip loading state — semua API call harus ada spinner/skeleton
- Jangan buat UI yang rumit — kader desa harus bisa pakai tanpa training panjang
- Jangan gunakan LLM langsung tanpa RAG untuk rekomendasi medis (hallucination risk)

---

## 🎨 PANDUAN UI/UX

### Prinsip Desain
- **Mobile-first:** 95% pengguna pakai HP Android kelas menengah
- **Simple & Clear:** Minimalkan teks, maksimalkan ikon + warna
- **Indonesian Context:** Bahasa Indonesia, bukan Inggris
- **Accessibility:** Font minimal 16px, kontras tinggi (outdoor sunlight readable)

### Color Palette
```css
--primary: #16a34a;       /* Hijau (health/growth) */
--primary-light: #dcfce7;
--warning: #f59e0b;       /* Kuning (at risk) */
--danger: #dc2626;        /* Merah (stunting/buruk) */
--neutral: #f8fafc;       /* Background */
--text: #0f172a;
```

### Komponen Wajib di Setiap Halaman
- **Bottom Navigation Bar** (mobile) — Dashboard | Input | Laporan
- **Loading Skeleton** saat fetch data
- **Toast Notification** untuk feedback aksi (sukses/gagal)
- **Empty State** dengan ilustrasi jika data kosong

---

## 📊 DEFINISI SUKSES (UNTUK HACKATHON)

| Kriteria | Target |
|----------|--------|
| Akurasi Z-score | 100% sesuai WHO Anthro software |
| 3 Mode Input | Semua berjalan tanpa crash |
| Human-in-the-Loop | Selalu muncul sebelum data tersimpan |
| Rekomendasi Gizi | Relevan, berbasis pangan lokal, tidak hallucination |
| Generate Laporan PDF | Format sesuai e-PPGBM Puskesmas |
| Mobile Responsive | Tampil sempurna di layar 360px-414px |
| LOI Mitra | Minimal 1 LOI dari Bidan/Kader Posyandu |
| Business Model | Bisa jelaskan B2G SaaS + proyeksi revenue ke juri |

---

## 🚀 CARA MULAI CODING (URUTAN PRIORITAS)

Ikuti urutan ini **selalu**, jangan lompat-lompat:

```
1. Backend: who_anthro.py (WHO Z-score engine) ← PALING KRITIS
2. Backend: Unit test who_anthro.py
3. Backend: Database schema + Alembic migration
4. Backend: API endpoint /anthropometry/calculate
5. Frontend: Setup Next.js + shadcn/ui + Tailwind
6. Frontend: Halaman Form Input (Mode 3 dulu, paling mudah)
7. Frontend: Integrasi WHO Z-score display + grafik
8. Backend: OCR endpoint (Mode 1)
9. Frontend: Upload foto + OCR preview
10. Backend: Voice endpoint (Mode 2)
11. Frontend: Voice input + preview
12. Backend: RAG engine + advisory endpoint
13. Frontend: Tampilan rekomendasi gizi
14. Backend: Generate laporan PDF
15. Frontend: Laporan page + download
16. Deploy: Vercel (frontend) + Railway (backend)
```

---

## 📌 KONTEKS TAMBAHAN UNTUK AGENT

- **Bahasa kode:** TypeScript (frontend), Python (backend)
- **Bahasa UI:** Bahasa Indonesia
- **Target device:** HP Android kelas menengah (Chrome browser)
- **Koneksi:** Asumsikan koneksi internet tidak stabil — buat PWA dengan offline support
- **Data sensitivity:** Data balita adalah data pribadi/kesehatan — jangan log ke console di production
- **Hackathon format:** Program pra-inkubasi 6 bulan (Sept 2026–Feb 2027), bukan sprint 1 hari
- **Business model:** B2G SaaS — kader gratis, Dinas Kesehatan Kab/Kota yang bayar (Rp 3–5 juta/bulan)
- **Referensi utama:** PRD lengkap ada di [`prd.md`](./prd.md) di root proyek ini

---

## 💰 BUSINESS MODEL RINGKAS (UNTUK AGENT)

Jika ada task yang berhubungan dengan fitur tier/pricing/dashboard Dinkes, ikuti struktur ini:

```
Free  → Target: Kader Posyandu
        Fitur: input data, Z-score, rekomendasi gizi, laporan e-PPGBM

Basic → Target: Puskesmas (1 wilayah)
        Harga: Rp 500.000/bulan
        Fitur: dashboard Puskesmas + rekap otomatis + alert stunting

Pro   → Target: Dinas Kesehatan Kabupaten/Kota
        Harga: Rp 3–5 juta/bulan
        Fitur: peta stunting real-time + dashboard agregat multi-posyandu
               + export laporan Kemenkes + API access

Enterprise → Target: Provinsi / Kemenkes
        Harga: Negosiasi (Rp 20–50 juta/bulan)
        Fitur: multi-kabupaten + custom integrasi e-PPGBM + white-label
```

**Prinsip utama:** Jangan pernah paywall fitur yang dibutuhkan kader untuk input data & lihat Z-score.
Semua fitur operasional kader harus tetap di tier Free.
