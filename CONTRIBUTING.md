# Panduan Kontribusi — ZeroStunting AI

Selamat datang di tim **ZeroStunting AI**! 🎉  
Dokumen ini menjelaskan cara kerja tim agar semua bisa berkolaborasi dengan lancar dan profesional.

---

## 👥 Anggota Tim & Tanggung Jawab

| Nama | GitHub | Peran | Area |
|------|--------|-------|------|
| Setiana | [@aamsetiana](https://github.com/aamsetiana) | Product Owner + Backend Lead | Supabase, RAG Engine, Deploy |
| Iqbal Viandra Putra | [@IqbalViandraPutra](https://github.com/IqbalViandraPutra) | Backend Engineer | OCR, Voice/Whisper, PDF |
| Apliy 3Dyansyah | [@aplyyy](https://github.com/aplyyy) | Frontend Engineer | Form, Z-Score UI, Grafik |
| Kania Salsabila | [@kaniasalsa23-beep](https://github.com/kaniasalsa23-beep) | Frontend + QA | Voice UI, Auth, PWA |

---

## 🛠️ Setup Awal (Sekali Saja)

### 1. Clone Repository
```bash
git clone https://github.com/aamsetiana/ZeroStunting-AI.git
cd ZeroStunting-AI
```

### 2. Setup Backend
```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
# Buka file .env dan isi credentials yang dibutuhkan
```

### 3. Setup Frontend
```bash
cd frontend
npm install
```

### 4. Jalankan Lokal
```bash
# Backend (dari folder backend/)
uvicorn app.main:app --reload --port 8000

# Frontend (dari folder frontend/)
npm run dev
```

---

## 🔄 Alur Kerja Harian

### Langkah 1 — Update Branch Main
Sebelum mulai kerja, selalu update dari main terbaru:
```bash
git checkout main
git pull origin main
```

### Langkah 2 — Buat Branch Baru
Buat branch dari main sesuai issue yang dikerjakan:
```bash
# Format: feature/<area>/<nama-singkat>
git checkout -b feature/frontend/form-input
git checkout -b feature/backend/ocr-endpoint
git checkout -b feature/frontend/voice-input

# Untuk perbaikan bug:
# Format: bugfix/<area>/<nama-singkat>
git checkout -b bugfix/backend/zscore-calculation
```

### Langkah 3 — Kerjakan & Commit Berkala
Commit sesering mungkin agar pekerjaan tidak hilang:
```bash
git add .
git commit -m "feat: tambah komponen form input nama balita"
```

**Format commit message yang wajib diikuti:**

| Prefix | Kapan digunakan |
|--------|----------------|
| `feat:` | Menambah fitur baru |
| `fix:` | Memperbaiki bug |
| `docs:` | Mengubah dokumentasi |
| `test:` | Menambah atau mengubah unit test |
| `refactor:` | Refactor kode (bukan fitur baru, bukan bug fix) |
| `chore:` | Konfigurasi, dependency, CI/CD |

Contoh commit yang baik:
```
feat: tambah validasi Zod untuk form berat badan balita
fix: perbaiki kalkulasi z-score untuk bayi < 3 bulan
docs: update README dengan cara setup backend
test: tambah unit test endpoint anthropometry
```

### Langkah 4 — Push ke GitHub
```bash
git push origin feature/frontend/form-input
```

### Langkah 5 — Buat Pull Request
1. Buka https://github.com/aamsetiana/ZeroStunting-AI
2. Klik tombol **"Compare & pull request"** yang muncul otomatis
3. Isi judul PR dengan format: `feat: <deskripsi singkat>`
4. Centang semua checklist yang relevan di template PR
5. Klik **"Create pull request"**

> **Penting:** PR hanya boleh ditujukan ke branch `main`.  
> Jangan merge sendiri — tunggu review dari `@aamsetiana`.

### Langkah 6 — Review & Merge
- CI otomatis akan jalan (lint + test)
- `@aamsetiana` akan review dan memberi feedback atau approval
- Jika ada yang perlu diperbaiki, perbaiki dan push lagi ke branch yang sama
- Setelah di-approve, `@aamsetiana` akan merge ke `main`

### Langkah 7 — Bersihkan Branch
Setelah PR di-merge, hapus branch lokal:
```bash
git checkout main
git pull origin main
git branch -d feature/frontend/form-input
```

---

## ✅ Aturan Wajib

### Yang Harus Dilakukan
- Selalu buat branch baru untuk setiap issue
- Commit dengan pesan yang jelas dan deskriptif
- Test kode sebelum membuat PR
- Isi checklist di PR template dengan jujur
- Diskusi di komentar issue jika ada pertanyaan atau hambatan

### Yang Tidak Boleh Dilakukan
- **Jangan** push langsung ke `main` — akan ditolak otomatis
- **Jangan** merge PR sendiri tanpa persetujuan `@aamsetiana`
- **Jangan** commit file `.env` atau API key ke repo
- **Jangan** skip unit test untuk kode backend
- **Jangan** hardcode nilai apapun — gunakan environment variable

---

## 🌿 Konvensi Penamaan Branch

```
feature/frontend/form-input
feature/frontend/zscore-display
feature/frontend/ocr-upload
feature/frontend/voice-input
feature/frontend/dashboard
feature/frontend/auth-login
feature/frontend/pwa-setup

feature/backend/database-setup
feature/backend/ocr-endpoint
feature/backend/voice-endpoint
feature/backend/rag-engine
feature/backend/laporan-pdf

bugfix/frontend/form-validation
bugfix/backend/zscore-edge-case

release/v1.0.0
```

---

## 🔗 Link Penting

| Resource | Link |
|----------|------|
| Repository | https://github.com/aamsetiana/ZeroStunting-AI |
| Issues (daftar tugas) | https://github.com/aamsetiana/ZeroStunting-AI/issues |
| Pull Requests | https://github.com/aamsetiana/ZeroStunting-AI/pulls |
| Agent Guide (baca ini sebelum coding!) | [agent.md](./agent.md) |
| Product Requirements | [prd.md](./prd.md) |

---

## ❓ FAQ

**Q: Bagaimana jika issue saya butuh perubahan di backend DAN frontend?**  
A: Buat dua branch terpisah (satu `feature/frontend/...`, satu `feature/backend/...`) dan buat dua PR terpisah.

**Q: Bagaimana jika saya stuck atau tidak mengerti bagaimana mengerjakan issue?**  
A: Tulis komentar di issue tersebut dengan mention `@aamsetiana`. Jangan diam-diam skip.

**Q: Apakah saya bisa mengerjakan lebih dari satu issue sekaligus?**  
A: Bisa, tapi pastikan setiap issue berada di branch yang berbeda.

**Q: Bagaimana cara tahu PR saya sudah di-review?**  
A: GitHub akan mengirim notifikasi ke email. Pastikan notifikasi GitHub aktif.

**Q: Saya tidak sengaja push ke main, bagaimana?**  
A: Branch `main` sudah dilindungi — push langsung akan otomatis ditolak oleh GitHub.

---

> Jika ada pertanyaan lain, diskusikan langsung dengan `@aamsetiana` sebagai Product Owner.  
> Selamat berkontribusi! 🚀
