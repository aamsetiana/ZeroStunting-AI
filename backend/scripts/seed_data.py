"""
Seed Script — ZeroStunting AI
=============================
Memasukkan initial/default Posyandu dan Kader ke database Supabase
jika belum ada.
"""

from app.core.database import SessionLocal
from app.models.database import Posyandu, Kader


def seed_initial_data():
    db = SessionLocal()
    try:
        # Cek apakah sudah ada posyandu
        posyandu = db.query(Posyandu).first()
        if not posyandu:
            posyandu = Posyandu(
                nama="Posyandu Melati 01",
                desa="Sukamaju",
                kecamatan="Ciawi",
                kabupaten="Bogor",
                provinsi="Jawa Barat",
            )
            db.add(posyandu)
            db.commit()
            db.refresh(posyandu)
            print(f"[OK] Posyandu berhasil dibuat: {posyandu.nama} (ID: {posyandu.id})")
        else:
            print(f"[*] Posyandu sudah ada: {posyandu.nama} (ID: {posyandu.id})")

        # Cek apakah sudah ada kader untuk posyandu ini
        kader = db.query(Kader).filter(Kader.posyandu_id == posyandu.id).first()
        if not kader:
            kader = Kader(
                posyandu_id=posyandu.id,
                nama="Aam Setiana",
                email="aamsetiana27@gmail.com",
                phone="081234567890",
                role="kader",
                is_active=True,
            )
            db.add(kader)
            db.commit()
            db.refresh(kader)
            print(f"[OK] Kader berhasil dibuat: {kader.nama} (ID: {kader.id})")
        else:
            print(f"[*] Kader sudah ada: {kader.nama} (ID: {kader.id})")

    finally:
        db.close()


if __name__ == "__main__":
    seed_initial_data()
