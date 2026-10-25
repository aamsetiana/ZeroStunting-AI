"""
API Router — Data Records (Balita & Penimbangan)
================================================
Menyimpan dan mengelola data balita serta riwayat penimbangan ke database Supabase.
"""

from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import desc, func

from app.core.database import get_db
from app.models.database import Posyandu, Kader, Balita, Penimbangan
from app.schemas.records import (
    BalitaResponse,
    PenimbanganResponse,
    SimpanBalitaPenimbanganRequest,
    SimpanBalitaPenimbanganResponse,
    BalitaWithPenimbanganResponse,
    BalitaUpdateRequest,
    PosyanduCreate,
    PosyanduUpdate,
    PosyanduResponse,
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


@router.put(
    "/balita/{balita_id}",
    response_model=BalitaWithPenimbanganResponse,
    summary="Ubah Data Balita & Penimbangan",
)
def update_balita(
    balita_id: UUID,
    payload: BalitaUpdateRequest,
    db: Session = Depends(get_db),
):
    balita = db.query(Balita).filter(Balita.id == balita_id).first()
    if not balita:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Data balita tidak ditemukan.",
        )

    # 1. Update profil balita
    if payload.nama is not None and payload.nama.strip():
        balita.nama = payload.nama.strip()
    if payload.jenis_kelamin is not None:
        balita.jenis_kelamin = payload.jenis_kelamin
    if payload.tanggal_lahir is not None:
        balita.tanggal_lahir = payload.tanggal_lahir
    if payload.nama_ibu is not None:
        balita.nama_ibu = payload.nama_ibu.strip() if payload.nama_ibu else None
    if payload.alamat is not None:
        balita.alamat = payload.alamat.strip() if payload.alamat else None

    # 2. Update penimbangan & hitung ulang Z-Score WHO jika data timbang diubah
    if payload.berat_kg is not None or payload.tinggi_cm is not None or payload.umur_bulan is not None:
        penimbangan = (
            db.query(Penimbangan)
            .filter(Penimbangan.balita_id == balita_id)
            .order_by(desc(Penimbangan.tanggal_timbang), desc(Penimbangan.created_at))
            .first()
        )
        if penimbangan:
            umur = payload.umur_bulan if payload.umur_bulan is not None else penimbangan.umur_bulan
            berat = payload.berat_kg if payload.berat_kg is not None else float(penimbangan.berat_kg)
            tinggi = payload.tinggi_cm if payload.tinggi_cm is not None else float(penimbangan.tinggi_cm)
            jk = balita.jenis_kelamin

            anthro = kalkulasi_antropometri(
                umur_bulan=umur,
                berat_kg=berat,
                tinggi_cm=tinggi,
                jenis_kelamin=jk,
            )

            penimbangan.umur_bulan = umur
            penimbangan.berat_kg = berat
            penimbangan.tinggi_cm = tinggi
            penimbangan.zscore_bbu = anthro.bbu.zscore
            penimbangan.zscore_pbu = anthro.pbu.zscore
            penimbangan.zscore_bbpb = anthro.bbpb.zscore

            status_gizi = "normal"
            if anthro.ada_risiko_stunting:
                status_gizi = "stunting"
            elif anthro.ada_risiko_wasting:
                status_gizi = "wasting"
            elif anthro.ada_risiko_underweight:
                status_gizi = "kurang"

            penimbangan.status_gizi = status_gizi

    db.commit()
    db.refresh(balita)
    return balita


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


# ─── PENGELOLAAN POSYANDU ─────────────────────────────────────────────────────

@router.get(
    "/posyandu",
    response_model=List[PosyanduResponse],
    summary="Daftar Posyandu Terdaftar",
)
def list_posyandu(
    db: Session = Depends(get_db),
):
    posyandus = db.query(Posyandu).order_by(Posyandu.created_at.asc()).all()
    result = []
    for p in posyandus:
        total_balita = db.query(func.count(Balita.id)).filter(Balita.posyandu_id == p.id).scalar() or 0
        result.append(
            PosyanduResponse(
                id=p.id,
                nama=p.nama,
                desa=p.desa,
                kecamatan=p.kecamatan,
                kabupaten=p.kabupaten,
                provinsi=p.provinsi,
                created_at=p.created_at,
                total_balita=total_balita,
            )
        )
    return result


@router.post(
    "/posyandu",
    response_model=PosyanduResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Tambah Posyandu Baru",
)
def create_posyandu(
    payload: PosyanduCreate,
    db: Session = Depends(get_db),
):
    posyandu = Posyandu(
        nama=payload.nama.strip(),
        desa=payload.desa.strip() if payload.desa else None,
        kecamatan=payload.kecamatan.strip() if payload.kecamatan else None,
        kabupaten=payload.kabupaten.strip() if payload.kabupaten else None,
        provinsi=payload.provinsi.strip() if payload.provinsi else None,
    )
    db.add(posyandu)
    db.commit()
    db.refresh(posyandu)
    return PosyanduResponse(
        id=posyandu.id,
        nama=posyandu.nama,
        desa=posyandu.desa,
        kecamatan=posyandu.kecamatan,
        kabupaten=posyandu.kabupaten,
        provinsi=posyandu.provinsi,
        created_at=posyandu.created_at,
        total_balita=0,
    )


@router.put(
    "/posyandu/{posyandu_id}",
    response_model=PosyanduResponse,
    summary="Ubah / Update Data Posyandu",
)
def update_posyandu(
    posyandu_id: UUID,
    payload: PosyanduUpdate,
    db: Session = Depends(get_db),
):
    posyandu = db.query(Posyandu).filter(Posyandu.id == posyandu_id).first()
    if not posyandu:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Posyandu tidak ditemukan.",
        )
    if payload.nama is not None:
        posyandu.nama = payload.nama.strip()
    if payload.desa is not None:
        posyandu.desa = payload.desa.strip() if payload.desa else None
    if payload.kecamatan is not None:
        posyandu.kecamatan = payload.kecamatan.strip() if payload.kecamatan else None
    if payload.kabupaten is not None:
        posyandu.kabupaten = payload.kabupaten.strip() if payload.kabupaten else None
    if payload.provinsi is not None:
        posyandu.provinsi = payload.provinsi.strip() if payload.provinsi else None

    db.commit()
    db.refresh(posyandu)
    total_balita = db.query(func.count(Balita.id)).filter(Balita.posyandu_id == posyandu.id).scalar() or 0
    return PosyanduResponse(
        id=posyandu.id,
        nama=posyandu.nama,
        desa=posyandu.desa,
        kecamatan=posyandu.kecamatan,
        kabupaten=posyandu.kabupaten,
        provinsi=posyandu.provinsi,
        created_at=posyandu.created_at,
        total_balita=total_balita,
    )


@router.delete(
    "/posyandu/{posyandu_id}",
    summary="Hapus Data Posyandu",
)
def delete_posyandu(
    posyandu_id: UUID,
    db: Session = Depends(get_db),
):
    posyandu = db.query(Posyandu).filter(Posyandu.id == posyandu_id).first()
    if not posyandu:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Posyandu tidak ditemukan.",
        )
    total_posyandu = db.query(func.count(Posyandu.id)).scalar() or 0
    if total_posyandu <= 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tidak dapat menghapus satu-satunya posyandu. Minimal harus ada satu unit posyandu di sistem.",
        )
    nama = posyandu.nama
    db.delete(posyandu)
    db.commit()
    return {"message": f"Posyandu '{nama}' berhasil dihapus."}


