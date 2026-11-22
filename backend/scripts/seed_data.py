"""
Seed Script — ZeroStunting AI
=============================
Memasukkan initial/default Posyandu (Dahlia 01-03) dan Kader ke database PostgreSQL / Neon DB.
"""

import uuid
from app.core.database import SessionLocal
from app.models.database import Posyandu, Kader


SEED_POSYANDU = [
    {
        "id": uuid.UUID("3af3c817-92e7-405c-90c1-3ce96ed0c5c4"),
        "nama": "Posyandu Dahlia 01",
        "desa": "Karangkancana",
        "kecamatan": "Ciwaru",
        "kabupaten": "Kuningan",
        "provinsi": "Jawa Barat",
        "kader": {
            "nama": "Kania Salsabila",
            "email": "dahlia01@ananta.id",
            "phone": "0812-3456-7890",
            "role": "kader",
        },
    },
    {
        "id": uuid.UUID("4102e5e9-54b5-4951-bacd-af9ee45b8a5e"),
        "nama": "Posyandu Dahlia 02",
        "desa": "Karangkancana",
        "kecamatan": "Ciwaru",
        "kabupaten": "Kuningan",
        "provinsi": "Jawa Barat",
        "kader": {
            "nama": "Siti Aminah",
            "email": "dahlia02@ananta.id",
            "phone": "0813-2233-4455",
            "role": "kader",
        },
    },
    {
        "id": uuid.UUID("a4d5c979-d6e5-49e5-b150-6fe089ed0a6e"),
        "nama": "Posyandu Dahlia 03",
        "desa": "Karangkancana",
        "kecamatan": "Ciwaru",
        "kabupaten": "Kuningan",
        "provinsi": "Jawa Barat",
        "kader": {
            "nama": "Ratna Dewi",
            "email": "dahlia03@ananta.id",
            "phone": "0814-5566-7788",
            "role": "kader",
        },
    },
]


def seed_initial_data():
    db = SessionLocal()
    try:
        for p_data in SEED_POSYANDU:
            p_id = p_data["id"]
            k_info = p_data["kader"]

            posyandu = db.query(Posyandu).filter(Posyandu.id == p_id).first()
            if not posyandu:
                posyandu = Posyandu(
                    id=p_id,
                    nama=p_data["nama"],
                    desa=p_data["desa"],
                    kecamatan=p_data["kecamatan"],
                    kabupaten=p_data["kabupaten"],
                    provinsi=p_data["provinsi"],
                )
                db.add(posyandu)
                db.commit()
                db.refresh(posyandu)
                print(f"[OK] Posyandu dibuat: {posyandu.nama} (ID: {posyandu.id})")
            else:
                print(f"[*] Posyandu sudah ada: {posyandu.nama} (ID: {posyandu.id})")

            kader = db.query(Kader).filter(Kader.posyandu_id == p_id).first()
            if not kader:
                kader = Kader(
                    posyandu_id=p_id,
                    nama=k_info["nama"],
                    email=k_info["email"],
                    phone=k_info["phone"],
                    role=k_info["role"],
                    is_active=True,
                )
                db.add(kader)
                db.commit()
                db.refresh(kader)
                print(f"[OK] Kader dibuat: {kader.nama} (ID: {kader.id})")
            else:
                print(f"[*] Kader sudah ada: {kader.nama} (ID: {kader.id})")

    finally:
        db.close()


if __name__ == "__main__":
    seed_initial_data()
