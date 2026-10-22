-- ============================================================
-- ZeroStunting AI — SQL Schema untuk Supabase
-- ============================================================
-- Jalankan script ini di Supabase SQL Editor:
-- Dashboard → SQL Editor → New Query → Paste → Run
-- ============================================================

-- Enable UUID extension (sudah aktif di Supabase secara default)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: posyandu
-- Unit kerja kader posyandu
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS posyandu (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama        VARCHAR(200)             NOT NULL,
    desa        VARCHAR(200),
    kecamatan   VARCHAR(200),
    kabupaten   VARCHAR(200),
    provinsi    VARCHAR(200),
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE  posyandu        IS 'Unit kerja kader posyandu di desa';
COMMENT ON COLUMN posyandu.nama   IS 'Nama lengkap posyandu';
COMMENT ON COLUMN posyandu.desa   IS 'Nama desa/kelurahan';

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: kader
-- Pengguna sistem (relawan desa)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS kader (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    posyandu_id  UUID         NOT NULL REFERENCES posyandu(id) ON DELETE CASCADE,
    nama         VARCHAR(200) NOT NULL,
    email        VARCHAR(200) UNIQUE,
    phone        VARCHAR(20),
    role         VARCHAR(50)  NOT NULL DEFAULT 'kader',  -- 'kader' | 'bidan' | 'admin'
    is_active    BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMPTZ  DEFAULT NOW()
);

COMMENT ON TABLE  kader       IS 'Pengguna sistem — kader posyandu, bidan, atau admin';
COMMENT ON COLUMN kader.role  IS 'kader | bidan | admin';

CREATE INDEX IF NOT EXISTS idx_kader_posyandu ON kader(posyandu_id);
CREATE INDEX IF NOT EXISTS idx_kader_email    ON kader(email);

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: balita
-- Data anak balita yang dipantau
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS balita (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    posyandu_id     UUID        NOT NULL REFERENCES posyandu(id) ON DELETE CASCADE,
    nama            VARCHAR(200) NOT NULL,
    tanggal_lahir   DATE         NOT NULL,
    jenis_kelamin   VARCHAR(10)  NOT NULL CHECK (jenis_kelamin IN ('L', 'P')),
    nama_ibu        VARCHAR(200),
    alamat          TEXT,
    created_at      TIMESTAMPTZ  DEFAULT NOW()
);

COMMENT ON TABLE  balita                IS 'Data anak balita yang dipantau di posyandu';
COMMENT ON COLUMN balita.jenis_kelamin  IS 'L = Laki-laki, P = Perempuan';

CREATE INDEX IF NOT EXISTS idx_balita_posyandu ON balita(posyandu_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: penimbangan
-- Data per sesi timbang — berisi pengukuran fisik + hasil Z-score WHO
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS penimbangan (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    balita_id         UUID         NOT NULL REFERENCES balita(id) ON DELETE CASCADE,
    kader_id          UUID         REFERENCES kader(id) ON DELETE SET NULL,
    tanggal_timbang   DATE         NOT NULL,
    umur_bulan        INTEGER      NOT NULL CHECK (umur_bulan BETWEEN 0 AND 60),

    -- Pengukuran fisik
    berat_kg          NUMERIC(5,2) NOT NULL CHECK (berat_kg  BETWEEN 1.5 AND 35.0),
    tinggi_cm         NUMERIC(5,1) NOT NULL CHECK (tinggi_cm BETWEEN 40.0 AND 130.0),

    -- Hasil kalkulasi WHO Z-score (LMS method)
    zscore_bbu        NUMERIC(5,2),   -- BB/U  : Berat Badan per Umur
    zscore_pbu        NUMERIC(5,2),   -- PB/U  : Panjang/Tinggi per Umur
    zscore_bbpb       NUMERIC(5,2),   -- BB/PB : Berat Badan per Panjang Badan

    -- Status gizi final
    status_gizi       VARCHAR(50) CHECK (
        status_gizi IN ('normal', 'kurang', 'buruk', 'stunting', 'wasting', 'obesitas')
    ),

    -- Metadata input
    input_mode        VARCHAR(20) DEFAULT 'form' CHECK (input_mode IN ('ocr', 'voice', 'form')),
    foto_url          TEXT,        -- URL foto KMS di Supabase Storage (mode OCR)
    rekomendasi_gizi  TEXT,        -- Output RAG (teks rekomendasi menu gizi)

    created_at        TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE  penimbangan                 IS 'Data sesi penimbangan bulanan balita';
COMMENT ON COLUMN penimbangan.zscore_bbu      IS 'Z-score Berat Badan per Umur (WHO)';
COMMENT ON COLUMN penimbangan.zscore_pbu      IS 'Z-score Panjang/Tinggi per Umur (WHO)';
COMMENT ON COLUMN penimbangan.zscore_bbpb     IS 'Z-score Berat Badan per Panjang Badan (WHO)';
COMMENT ON COLUMN penimbangan.status_gizi     IS 'normal | kurang | buruk | stunting | wasting | obesitas';
COMMENT ON COLUMN penimbangan.input_mode      IS 'Cara kader input data: ocr | voice | form';
COMMENT ON COLUMN penimbangan.rekomendasi_gizi IS 'Output rekomendasi gizi dari RAG engine';

CREATE INDEX IF NOT EXISTS idx_penimbangan_balita  ON penimbangan(balita_id);
CREATE INDEX IF NOT EXISTS idx_penimbangan_tanggal ON penimbangan(tanggal_timbang);
CREATE INDEX IF NOT EXISTS idx_penimbangan_status  ON penimbangan(status_gizi);

-- ─────────────────────────────────────────────────────────────────────────────
-- SAMPLE DATA — Hapus di production!
-- ─────────────────────────────────────────────────────────────────────────────
-- INSERT INTO posyandu (nama, desa, kecamatan, kabupaten, provinsi)
-- VALUES ('Posyandu Melati', 'Sukamaju', 'Ciawi', 'Bogor', 'Jawa Barat');
