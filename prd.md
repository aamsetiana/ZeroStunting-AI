# ZeroStunting AI — Product Requirements Document (PRD)
**Versi:** 3.0 | **Target:** Hackathon ITS 2026 — AI for Social Good
**Kategori:** HealthTech / Public Services / Pure Software
**Tingkat Kesiapan:** TKT 3–4 (Pure Software, Hardware-Free)

---

## 1. RINGKASAN EKSEKUTIF

**ZeroStunting AI** adalah platform intelijen data kesehatan balita berbasis *Pure Software* (tanpa perangkat keras tambahan) yang dirancang khusus sebagai **alat kerja profesional Kader Posyandu desa**.

### Nilai Utama (Value Proposition)
Platform ini mengintegrasikan:
- **Multi-Modal Input** (Vision OCR, Voice-to-Text, Direct Input)
- **Kalkulator Antropometri WHO** (Z-score otomatis)
- **Generative Advisory AI** (preskripsi gizi berbasis pangan lokal)
- **Auto-Report e-PPGBM** (laporan resmi Puskesmas 1 klik)

### Relevansi
Percepatan penurunan angka stunting adalah agenda strategis nasional Indonesia. Titik krusial penanganan stunting di Posyandu desa masih terhambat oleh proses administrasi manual, kesalahan kalkulasi grafik, dan keterlambatan pelaporan ke Puskesmas. ZeroStunting AI hadir untuk menyelesaikan masalah ini secara langsung di akar rumput.

---

## 2. ANALISIS MASALAH

### 2.1 Pain Point Utama Kader Posyandu

| # | Masalah | Dampak |
|---|---------|--------|
| 1 | **Human Error Plotting KMS Manual** — Kader harus cocokkan berat/tinggi balita ke grafik KMS secara manual | Gejala awal *growth faltering* sering terlewat hingga balita jatuh ke fase stunting kronis |
| 2 | **Beban Administrasi Berjenjang** — Rekap ratusan data balita ke buku register lalu ke format Excel/Kemenkes setiap bulan | Puskesmas/Dinas Kesehatan terlambat menerima data agregat (berhari-hari delay) |
| 3 | **Ketiadaan Panduan Intervensi Gizi Kontekstual** — Kader kesulitan memberikan panduan MP-ASI berbasis bahan pangan lokal | Balita berisiko tidak mendapat intervensi yang tepat dan terjangkau |

### 2.2 Matriks Komparatif

| Indikator | Buku KMS Manual | App Parent-Facing (PrimaKu dll) | **ZeroStunting AI** |
|-----------|----------------|--------------------------------|---------------------|
| Target Utama | Kader Posyandu | Orang tua individu | **Kader & Puskesmas Desa** |
| Mode Input | Tulis tangan (sangat lambat) | Manual per anak | **Hybrid: OCR + Voice + Direct Form** |
| Analisis Stunting | Plotting grafik manual, rawan salah | Z-score dasar, tanpa laporan massal | **Z-Score WHO Massal + Early Warning Otomatis** |
| Integrasi Pelaporan | Rekap manual berhari-hari | Tidak ada fitur laporan dinas | **Auto-Report e-PPGBM 1 Klik** |

---

## 3. SPESIFIKASI FITUR

### 3.1 Hybrid Input Engine (3 Mode Input)

#### Mode 1 — Vision OCR (Scan Catatan Timbang)
- Kader **memotret** lembar catatan timbang / buku KMS
- Model Computer Vision mengekstrak **tulisan tangan** angka umur, berat, dan tinggi secara otomatis
- **Tujuan:** Digitalisasi massal data sebelumnya (backlog data)

#### Mode 2 — Voice-to-Text Input (Speech AI)
- Kader tekan tombol mikrofon, ucapkan: *"Anak Budi, berat 8 koma 5 kg, tinggi 72 cm"*
- NLP Engine mengisi form digital secara otomatis
- **Tujuan:** Input cepat saat hari penimbangan sibuk

#### Mode 3 — Direct Digital Form
- Input langsung via antarmuka web / WhatsApp Form
- **Tujuan:** Kader muda yang sudah familiar dengan smartphone

### 3.2 Core Analytics Engine
- **WHO Anthro Engine:** Kalkulasi presisi Z-Score (BB/U, PB/U, BB/PB) sesuai standar WHO
- **Early Warning System:** Alert otomatis jika Z-score melampaui threshold stunting/gizi buruk
- **Constraint Validation:** Pagar logika medis — alert jika angka di luar batas biologis wajar

### 3.3 RAG LLM Advisory Engine
- Preskripsi menu gizi berbasis **pangan lokal** yang terjangkau
- Disesuaikan dengan usia, berat, dan status gizi balita
- Berbasis knowledge base lokal (tidak bergantung internet penuh)

### 3.4 Output & Reporting
- **Status Gizi Real-Time:** Normal / Kurang / Buruk / Stunting / Wasting
- **Alert Stunting Dini:** Notifikasi balita berisiko
- **Auto-Report e-PPGBM:** Laporan bulanan format resmi Puskesmas, export 1 klik

---

## 4. ARSITEKTUR SISTEM

```
HYBRID INPUT LAYER
├── [A] Scan Foto Catatan Timbang ──► Computer Vision (OCR)
├── [B] Ucapan Suara Kader        ──► Speech-to-Text (NLP Engine)
└── [C] Form Digital Langsung     ──► Direct Web / WhatsApp Input
                    │
                    ▼
HUMAN-IN-THE-LOOP & CONSTRAINT VALIDATION ENGINE
├── Preview & Confirm UI (verifikasi 1-klik sebelum simpan)
└── Medical Logic Guard (alert jika data di luar rentang biologis wajar)
                    │
                    ▼
CORE ANALYTICS & ADVISORY ENGINE
├── WHO Anthro Engine ──► Z-Score Calculation (BB/U, PB/U, BB/PB)
└── RAG LLM Engine    ──► Preskripsi Gizi Lokal + Auto Report e-PPGBM
                    │
                    ▼
OUTPUT LAYER
└── Status Gizi | Alert Stunting Dini | Laporan Puskesmas (1 Klik)
```

---

## 5. STACK TEKNOLOGI

### 5.1 Frontend (Web App)
| Layer | Teknologi | Alasan |
|-------|-----------|--------|
| Framework | **Next.js 14 (App Router)** | SSR/SSG, routing modern, mudah deploy ke Vercel |
| UI Library | **shadcn/ui + Tailwind CSS** | Komponen siap pakai, desain profesional, dark mode |
| State Management | **Zustand** | Ringan, cocok untuk form multi-step |
| Form Handling | **React Hook Form + Zod** | Validasi schema ketat untuk data medis |
| Charts | **Recharts** | Visualisasi grafik Z-score, tren pertumbuhan |
| Voice Input | **Web Speech API** | Native browser, tidak perlu library eksternal |
| PWA | **next-pwa** | Akses offline, installable di HP kader |

### 5.2 Backend & API
| Layer | Teknologi | Alasan |
|-------|-----------|--------|
| Runtime | **Python (FastAPI)** | Ekosistem AI/ML terkuat, async, performa tinggi |
| WHO Anthro | **Custom Python Engine** | Implementasi tabel WHO 2006 Growth Standards |
| OCR Engine | **Google Cloud Vision API** / **Tesseract OCR** | Akurasi tinggi untuk tulisan tangan numerik |
| Speech-to-Text | **OpenAI Whisper** (self-hosted) | Gratis, akurasi tinggi untuk Bahasa Indonesia |
| LLM / RAG | **Groq API (LLaMA 3.1)** + **LangChain** | Gratis/murah, cepat, cocok untuk hackathon |
| Vector DB | **ChromaDB** (embedded) | Lokal, tidak perlu setup server eksternal |
| Database | **PostgreSQL** (Supabase) | Managed, gratis tier, auth built-in |
| ORM | **SQLAlchemy + Alembic** | Migrasi database terstruktur |

### 5.3 Infrastructure & DevOps
| Layer | Teknologi | Alasan |
|-------|-----------|--------|
| Frontend Deploy | **Vercel** | Free, CI/CD otomatis dari GitHub |
| Backend Deploy | **Railway** / **Render** | Free tier cukup untuk prototype hackathon |
| File Storage | **Supabase Storage** | Upload foto KMS, terintegrasi dengan DB |
| Env Management | **`.env.local`** | Standard Next.js |
| Monitoring | **Vercel Analytics** | Built-in, zero-config |

---

## 6. BUSINESS MODEL — B2G SaaS (Business-to-Government)

### 6.1 Konsep Utama: "Gratis untuk Kader, Berbayar untuk Pemerintah"

Kader Posyandu adalah **pengguna akhir** yang menggunakan platform secara gratis — ini penting agar adopsi massal terjadi tanpa hambatan biaya. **Dinas Kesehatan Kabupaten/Kota** adalah **pelanggan yang membayar** karena mereka yang diuntungkan dari data agregat berkualitas tinggi dan laporan otomatis.

```
Kader Posyandu ──► pakai GRATIS ──► input data balita
        │
        ▼
  Data Terkumpul (terstruktur, akurat, real-time)
        │
        ▼
Dinas Kesehatan ──► BAYAR ──► dapat dashboard analitik
                              + peta stunting
                              + laporan agregat
                              + early warning sistem
```

### 6.2 Struktur Paket & Harga

| Paket | Target | Harga | Fitur |
|-------|--------|-------|-------|
| **Free (Kader)** | Kader Posyandu | Gratis selamanya | Input data, Z-score, rekomendasi gizi, laporan e-PPGBM |
| **Puskesmas Basic** | Puskesmas (1 wilayah) | Rp 500.000/bulan | Dashboard Puskesmas, rekap data otomatis, alert stunting |
| **Dinkes Pro** | Dinas Kesehatan Kab/Kota | Rp 3–5 juta/bulan | Peta stunting real-time, dashboard agregat multi-posyandu, export laporan Kemenkes, API access |
| **Enterprise (Provinsi/Kemenkes)** | Dinas Kesehatan Provinsi | Negosiasi (Rp 20–50 juta/bulan) | Multi-kabupaten, custom integrasi e-PPGBM Kemenkes, white-label |

### 6.3 Proyeksi Impact & Revenue

| Metrik | Asumsi Konservatif | Target 1 Tahun |
|--------|-------------------|----------------|
| Posyandu aktif pakai | 500 posyandu | 2.000 posyandu |
| Balita terdata | 15.000 balita | 60.000 balita |
| Kab/Kota berlangganan Dinkes Pro | 5 kabupaten | 20 kabupaten |
| **MRR (Monthly Recurring Revenue)** | Rp 15–25 juta | Rp 60–100 juta |
| **ARR (Annual Recurring Revenue)** | ~Rp 200 juta | ~Rp 1 miliar |

### 6.4 Strategi Go-to-Market (Bagaimana Mulai Jual)

```
Tahap 1 — Validasi (Okt–Des 2026)
└── Dapat LOI dari 1-2 Puskesmas/Bidan Desa
└── Pakai sebagai social proof ke Dinas Kesehatan

Tahap 2 — Pilot Berbayar (Jan–Mar 2027)
└── Pendekatan ke 3-5 Dinas Kesehatan Kabupaten pilot
└── Offer: 3 bulan gratis, lanjut bayar
└── Manfaatkan momentum Demo Day Hackathon ITS

Tahap 3 — Scale (Apr 2027+)
└── Referral antar Dinas Kesehatan (word-of-mouth B2G)
└── Tender/pengadaan APBD Digital Health
└── Kemitraan BKKBN / Kemenkes
```

### 6.5 Keunggulan B2G SaaS untuk Pitch Juri

- ✅ **Ada yang mau bayar:** Dinkes punya anggaran APBD untuk digitalisasi
- ✅ **Terukur:** MRR, ARR bisa diproyeksikan per kabupaten
- ✅ **Scalable:** 514 kabupaten/kota di Indonesia = market besar
- ✅ **Selaras agenda pemerintah:** Kemenkes target 2025-2029 zero stunting, ada budget untuk tools pendukung
- ✅ **Tidak canibalize free users:** Kader tetap gratis, tidak ada friction adopsi

---

## 7. ROADMAP PENGEMBANGAN — HACKATHON ITS 2026 (6 BULAN)

> Hackathon ITS 2026 adalah program **pra-inkubasi intensif** (bukan sprint 1 hari).
> Timeline resmi: **September 2026 → Februari 2027**

### Fase 1 — Kick Off & Discovery (September 2026)
**Fokus:** Validasi masalah + fondasi teknis
- [ ] Wawancara lapangan: Bidan Desa & Kader Posyandu (catat pain point konkret)
- [ ] Kumpulkan sampel format laporan e-PPGBM yang dipakai Puskesmas
- [ ] Setup repositori GitHub, struktur folder Next.js + FastAPI
- [ ] Desain database schema (balita, kader, posyandu, penimbangan)
- [ ] Riset & download tabel referensi WHO Growth Standards 2006
- [ ] Mulai drafting pitch deck awal
- **Deliverable:** Dokumen pain point + repo siap + skema DB + draft pitch

### Fase 2 — Ideation & Core Engine (Oktober 2026)
**Fokus:** Logika inti WHO + backend API + mentoring dari hackathon
- [ ] Implementasi WHO Anthro Engine (Z-score BB/U, PB/U, BB/PB) dengan rumus LMS
- [ ] Unit test WHO Engine — bandingkan hasil dengan WHO Anthro software resmi
- [ ] Implementasi Constraint Validation Engine (batas biologis wajar)
- [ ] API endpoint: `POST /anthropometry/calculate`
- [ ] Setup LangChain + ChromaDB + knowledge base gizi pangan lokal
- [ ] API endpoint: `POST /advisory/generate` (RAG rekomendasi gizi)
- [ ] Ikuti sesi mentoring hackathon — minta feedback dari mentor
- **Deliverable:** Backend berjalan, Z-score akurat 100%, RAG responsif

### Fase 3 — Solution Development: Frontend + Input Modes (November 2026)
**Fokus:** Antarmuka kader + 3 mode input + integrasi penuh
- [ ] Bangun UI utama: Dashboard kader (mobile-first, Bahasa Indonesia)
- [ ] Implementasi Mode 3 (Direct Form) dengan validasi Zod
- [ ] Implementasi Mode 2 (Voice Input) dengan Web Speech API
- [ ] Implementasi Mode 1 (OCR): upload foto → Vision API → preview → konfirmasi
- [ ] Preview & Confirm UI (Human-in-the-Loop sebelum simpan ke DB)
- [ ] Visualisasi grafik pertumbuhan Z-score (Recharts)
- [ ] Implementasi Auto-Report e-PPGBM (export PDF)
- [ ] PWA: installable di HP, offline-capable
- **Deliverable:** Prototype fungsional semua fitur + laporan PDF

### Fase 4 — Finalisasi & Field Testing (Desember 2026)
**Fokus:** Validasi lapangan + polish + persiapan demo
- [ ] Uji coba langsung di HP kader Posyandu (minimal 2 sesi penimbangan)
- [ ] Dokumentasi feedback kader + perbaikan UX kritis
- [ ] Finalisasi LOI dari mitra Posyandu / Bidan Desa
- [ ] Deploy production: Vercel (frontend) + Railway (backend)
- [ ] Finalisasi pitch deck: problem → solution → demo → business model → impact
- [ ] Rekam demo video sistem berjalan
- [ ] Hitung impact metrics: estimasi kader & balita yang terlayani
- **Deliverable:** Sistem live di URL publik + LOI + pitch deck + demo video

### Fase 5 — Demo Day & Business Matching (Januari 2027)
**Fokus:** Presentasi ke juri + pertemuan investor
- [ ] Presentasi final di Demo Day Hackathon ITS
- [ ] Business matching dengan investor / mitra potensial
- [ ] Demonstrasikan live system + tunjukkan LOI sebagai bukti validasi
- [ ] Pitching model B2G SaaS ke Dinas Kesehatan yang hadir
- **Deliverable:** Investor contact list + deal pipeline awal

### Fase 6 — Networking & Awarding (Februari 2027)
**Fokus:** Follow-up + skalabilitas awal
- [ ] Follow-up mitra Dinas Kesehatan dari Demo Day
- [ ] Mulai pilot berbayar: offer 3 bulan gratis ke 3-5 Dinkes
- [ ] Networking Dinner & Awarding Hackathon ITS
- **Deliverable:** Minimal 1 Dinkes pilot, roadmap skalabilitas Q2 2027

---

## 8. ROADMAP PASCA-HACKATHON (2027)

| Timeline | Milestone | Business Target |
|----------|-----------|-----------------|
| **Q1 2027** | WhatsApp Business API Integration — kader tanpa smartphone canggih bisa kirim foto KMS via WA | 5 Dinkes pilot berbayar |
| **Q2 2027** | Regional Stunting Early Warning Map — peta kerawanan stunting real-time | 20 Kabupaten/Kota berlangganan, ARR Rp 200 juta |
| **Q3 2027** | B2G Dashboard Kemenkes Integration — terhubung ke e-PPGBM nasional | Pendekatan ke Kemenkes untuk lisensi nasional |
| **Q4 2027** | Tender APBD & BKKBN Partnership — masuk jalur pengadaan resmi pemerintah | MRR Rp 100 juta+ |

---

## 8. LETTER OF INTENT (LOI) — TEMPLATE

**SURAT PERNYATAAN DUKUNGAN MITRA & VALIDASI LAPANGAN**

Yang bertanda tangan di bawah ini:
- **Nama Lengkap:** [Nama Bidan Desa / Koordinator Kader Posyandu]
- **Jabatan / Peran:** [Bidan Desa / Ketua Kader Posyandu]
- **Instansi / Wilayah:** [Posyandu Desa X / Puskesmas Kecamatan Y]

Dengan ini menyatakan bahwa pihak kami telah meninjau dan menguji coba purwarupa inovasi:

> *"ZeroStunting AI: Sistem Preskripsi Gizi Balita dan Intelijen Data Posyandu Berbasis Computer Vision untuk Akselerasi Bebas Stunting Akar Rumput"*

Kami menilai bahwa fitur Scan OCR Otomatis, Input Suara, Kalkulasi Z-Score Instan, dan Automasi Laporan Bulanan e-PPGBM sangat membantu meringankan beban kerja administratif kader serta mempercepat deteksi dini risiko stunting. Kami mendukung penuh pengembangan dan uji coba lanjutan di wilayah kami.

[Kota/Kabupaten], [Tanggal/Bulan/2026]

*(Tanda Tangan & Stempel Resmi)*
Nama Terang: ________________________