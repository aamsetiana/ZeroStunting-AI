"""
ZeroStunting AI — SQLAlchemy Models
=====================================
Definisi model database sesuai schema di agent.md.

Tables:
    - posyandu   : Unit kerja kader
    - kader      : Pengguna sistem
    - balita     : Data anak balita
    - penimbangan: Data per sesi timbang (berisi hasil Z-score)
"""

import uuid

from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    Numeric,
    String,
    Integer,
    Text,
    ForeignKey,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


# ─────────────────────────────────────────────────────────────────────────────
# POSYANDU — Unit kerja kader
# ─────────────────────────────────────────────────────────────────────────────

class Posyandu(Base):
    __tablename__ = "posyandu"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nama = Column(String(200), nullable=False)
    desa = Column(String(200))
    kecamatan = Column(String(200))
    kabupaten = Column(String(200))
    provinsi = Column(String(200))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relasi
    kaders = relationship("Kader", back_populates="posyandu", cascade="all, delete-orphan")
    balitas = relationship("Balita", back_populates="posyandu", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Posyandu(id={self.id}, nama='{self.nama}', desa='{self.desa}')>"


# ─────────────────────────────────────────────────────────────────────────────
# KADER — Pengguna sistem (relawan desa)
# ─────────────────────────────────────────────────────────────────────────────

class Kader(Base):
    __tablename__ = "kader"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    posyandu_id = Column(UUID(as_uuid=True), ForeignKey("posyandu.id", ondelete="CASCADE"), nullable=False)
    nama = Column(String(200), nullable=False)
    email = Column(String(200), unique=True, nullable=True)
    phone = Column(String(20), nullable=True)
    # Role: 'kader' | 'bidan' | 'admin'
    role = Column(String(50), nullable=False, default="kader")
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relasi
    posyandu = relationship("Posyandu", back_populates="kaders")
    penimbangans = relationship("Penimbangan", back_populates="kader")

    def __repr__(self) -> str:
        return f"<Kader(id={self.id}, nama='{self.nama}', role='{self.role}')>"


# ─────────────────────────────────────────────────────────────────────────────
# BALITA — Data anak balita
# ─────────────────────────────────────────────────────────────────────────────

class Balita(Base):
    __tablename__ = "balita"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    posyandu_id = Column(UUID(as_uuid=True), ForeignKey("posyandu.id", ondelete="CASCADE"), nullable=False)
    nama = Column(String(200), nullable=False)
    tanggal_lahir = Column(Date, nullable=False)
    # Jenis kelamin: 'L' (Laki-laki) | 'P' (Perempuan)
    jenis_kelamin = Column(String(10), nullable=False)
    nama_ibu = Column(String(200), nullable=True)
    alamat = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relasi
    posyandu = relationship("Posyandu", back_populates="balitas")
    penimbangans = relationship("Penimbangan", back_populates="balita", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Balita(id={self.id}, nama='{self.nama}', jk='{self.jenis_kelamin}')>"


# ─────────────────────────────────────────────────────────────────────────────
# PENIMBANGAN — Data per sesi timbang (TABEL UTAMA)
# ─────────────────────────────────────────────────────────────────────────────

class Penimbangan(Base):
    __tablename__ = "penimbangan"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    balita_id = Column(UUID(as_uuid=True), ForeignKey("balita.id", ondelete="CASCADE"), nullable=False)
    kader_id = Column(UUID(as_uuid=True), ForeignKey("kader.id", ondelete="SET NULL"), nullable=True)
    tanggal_timbang = Column(Date, nullable=False)
    umur_bulan = Column(Integer, nullable=False)

    # Pengukuran fisik
    berat_kg = Column(Numeric(5, 2), nullable=False)    # contoh: 12.50 kg
    tinggi_cm = Column(Numeric(5, 1), nullable=False)    # contoh: 87.5 cm
    lingkar_kepala_cm = Column(Numeric(5, 2), nullable=True) # Lingkar Kepala (cm)
    lingkar_lengan_cm = Column(Numeric(5, 2), nullable=True) # Lingkar Lengan Atas / LiLA (cm)

    # Hasil kalkulasi WHO Z-score
    zscore_bbu = Column(Numeric(5, 2), nullable=True)     # BB/U  (Berat per Umur)
    zscore_pbu = Column(Numeric(5, 2), nullable=True)     # PB/U  (Panjang per Umur)
    zscore_bbpb = Column(Numeric(5, 2), nullable=True)     # BB/PB (Berat per Panjang)
    zscore_lku = Column(Numeric(5, 2), nullable=True)      # LK/U  (Lingkar Kepala per Umur)

    # Status gizi: 'normal' | 'kurang' | 'buruk' | 'stunting' | 'wasting' | 'obesitas'
    status_gizi = Column(String(50), nullable=True)
    status_lingkar_kepala = Column(String(50), nullable=True)
    status_lingkar_lengan = Column(String(50), nullable=True)

    # Metadata input
    # Mode: 'ocr' | 'voice' | 'form'
    input_mode = Column(String(20), nullable=True, default="form")
    foto_url = Column(Text, nullable=True)              # URL foto KMS (mode OCR)
    rekomendasi_gizi = Column(Text, nullable=True)              # Output RAG (teks panjang)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relasi
    balita = relationship("Balita", back_populates="penimbangans")
    kader = relationship("Kader", back_populates="penimbangans")

    def __repr__(self) -> str:
        return (
            f"<Penimbangan(id={self.id}, "
            f"balita_id={self.balita_id}, "
            f"tanggal='{self.tanggal_timbang}', "
            f"status='{self.status_gizi}')>"
        )
