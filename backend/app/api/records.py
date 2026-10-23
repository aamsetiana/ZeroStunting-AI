"""
API Router — Data Records (Balita & Penimbangan)
================================================
Menyimpan dan mengelola data balita serta riwayat penimbangan ke database Supabase.
"""

from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.core.database import get_db
from app.models.database import Posyandu, Kader, Balita, Penimbangan
from app.schemas.records import (
    BalitaResponse,
    PenimbanganResponse,
    SimpanBalitaPenimbanganRequest,
    SimpanBalitaPenimbanganResponse,
    BalitaWithPenimbanganResponse,
)
from app.core.who_anthro import kalkulasi_antropometri

router = APIRouter(prefix="/records", tags=["Records & Database"])


def _get_default_posyandu(db: Session) -> Posyandu:
    posyandu = db.query(Posyandu).first()
    if not posyandu:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Belum ada data Posyandu di database. Jalankan seed_data terlebih dahulu.",
        )
    return posyandu


def _get_default_kader(db: Session, posyandu_id: UUID) -> Optional[Kader]:
    return db.query(Kader).filter(Kader.posyandu_id == posyandu_id).first()


@router.post(
    "/simpan",
    response_model=SimpanBalitaPenimbanganResponse,
    summary="Simpan Balita & Hasil Penimbangan",
    description=(
        "Menghitung Z-score WHO secara otomatis lalu menyimpan data Balita "
        "dan Penimbangan ke database Supabase."
    ),
    status_code=status.HTTP_201_CREATED,
)
def simpan_balita_dan_penimbangan(
    payload: SimpanBalitaPenimbanganRequest,
    db: Session = Depends(get_db),
):
    # 1. Pastikan posyandu tersedia
    posyandu_id = payload.balita.posyandu_id
    if not posyandu_id:
        default_posyandu = _get_default_posyandu(db)
        posyandu_id = default_posyandu.id

    # 2. Ambil kader default jika tidak dispesifikasikan
    kader_id = payload.penimbangan.kader_id
    if not kader_id:
        default_kader = _get_default_kader(db, posyandu_id)
        if default_kader:
            kader_id = default_kader.id

    # 3. Buat record Balita
    balita = Balita(
        posyandu_id=posyandu_id,
        nama=payload.balita.nama,
        tanggal_lahir=payload.balita.tanggal_lahir,
        jenis_kelamin=payload.balita.jenis_kelamin,
        nama_ibu=payload.balita.nama_ibu,
        alamat=payload.balita.alamat,
    )
    db.add(balita)
    db.flush()  # untuk generate balita.id

    # 4. Hitung Z-score WHO dengan engine LMS
    try:
        who_res = kalkulasi_antropometri(
            umur_bulan=payload.penimbangan.umur_bulan,
            berat_kg=payload.penimbangan.berat_kg,
            tinggi_cm=payload.penimbangan.tinggi_cm,
            jenis_kelamin=payload.balita.jenis_kelamin,
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Gagal menghitung antropometri WHO: {str(e)}",
        )

    # Tentukan status gizi ringkas
    # Urutan prioritas keparahan: stunting / wasting / gizi buruk > gizi kurang > risiko lebih > normal
    status_gizi = "normal"
    if who_res.ada_risiko_stunting:
        status_gizi = "stunting"
    elif who_res.ada_risiko_wasting:
        status_gizi = "wasting"
    elif who_res.ada_risiko_underweight:
        status_gizi = "kurang"

    # 5. Buat record Penimbangan
    raw_mode = (payload.penimbangan.input_mode or "form").lower()
    if "ocr" in raw_mode:
        safe_mode = "ocr"
    elif "voice" in raw_mode:
        safe_mode = "voice"
    else:
        safe_mode = "form"

    penimbangan = Penimbangan(
        balita_id=balita.id,
        kader_id=kader_id,
        tanggal_timbang=payload.penimbangan.tanggal_timbang,
        umur_bulan=payload.penimbangan.umur_bulan,
        berat_kg=payload.penimbangan.berat_kg,
        tinggi_cm=payload.penimbangan.tinggi_cm,
        zscore_bbu=who_res.bbu.zscore,
        zscore_pbu=who_res.pbu.zscore,
        zscore_bbpb=who_res.bbpb.zscore,
        status_gizi=status_gizi,
        input_mode=safe_mode,
        foto_url=payload.penimbangan.foto_url,
    )
    db.add(penimbangan)
    db.commit()
    db.refresh(balita)
    db.refresh(penimbangan)

    return SimpanBalitaPenimbanganResponse(
        message="Data balita dan penimbangan berhasil disimpan ke database.",
        balita=BalitaResponse.model_validate(balita),
        penimbangan=PenimbanganResponse.model_validate(penimbangan),
    )


@router.get(
    "/balita",
    response_model=List[BalitaResponse],
    summary="Daftar Balita Terdaftar",
)
def list_balita(
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
):
    return db.query(Balita).order_by(desc(Balita.created_at)).limit(limit).all()


@router.get(
    "/penimbangan",
    response_model=List[PenimbanganResponse],
    summary="Riwayat Penimbangan Balita",
)
def list_penimbangan(
    balita_id: Optional[UUID] = None,
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
):
    query = db.query(Penimbangan)
    if balita_id:
        query = query.filter(Penimbangan.balita_id == balita_id)
    return query.order_by(desc(Penimbangan.tanggal_timbang)).limit(limit).all()


@router.get(
    "/balita-full",
    response_model=List[BalitaWithPenimbanganResponse],
    summary="Daftar Balita Beserta Riwayat Penimbangan",
)
def list_balita_full(
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    return (
        db.query(Balita)
        .order_by(desc(Balita.created_at))
        .limit(limit)
        .all()
    )


@router.delete(
    "/balita/{balita_id}",
    summary="Hapus Data Balita Berdasarkan ID",
)
def delete_balita(
    balita_id: UUID,
    db: Session = Depends(get_db),
):
    balita = db.query(Balita).filter(Balita.id == balita_id).first()
    if not balita:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Data balita tidak ditemukan.",
        )
    nama = balita.nama
    db.delete(balita)
    db.commit()
    return {"message": f"Data balita {nama} berhasil dihapus dari database."}


@router.delete(
    "/reset",
    summary="Hapus Semua Data Balita & Penimbangan (Mulai Bersih)",
)
def reset_all_records(
    db: Session = Depends(get_db),
):
    deleted_p = db.query(Penimbangan).delete()
    deleted_b = db.query(Balita).delete()
    db.commit()
    return {
        "message": "Semua data balita dan penimbangan berhasil dibersihkan dari database.",
        "deleted_balita": deleted_b,
        "deleted_penimbangan": deleted_p,
    }

