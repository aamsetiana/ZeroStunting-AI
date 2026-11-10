"""
Import Data Balita & Penimbangan Posyandu Dahlia 01 dan Dahlia 02
================================================================
- Block 1 (46 anak) -> Posyandu Dahlia 01 (ID: 3af3c817-92e7-405c-90c1-3ce96ed0c5c4)
- Block 2 (30 anak) -> Posyandu Dahlia 02 (ID: 4102e5e9-54b5-4951-bacd-af9ee45b8a5e)
"""

import sys
from pathlib import Path
from datetime import datetime, date
from uuid import UUID

# Setup path to backend
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))
sys.path.insert(0, str(Path(__file__).parent))

from app.core.database import SessionLocal
from app.models.database import Posyandu, Kader, Balita, Penimbangan
from app.core.who_anthro import kalkulasi_antropometri, JenisKelamin, StatusGizi
from inspect_data import blocks

DAHLIA_01_ID = UUID("3af3c817-92e7-405c-90c1-3ce96ed0c5c4")
DAHLIA_02_ID = UUID("4102e5e9-54b5-4951-bacd-af9ee45b8a5e")

def parse_date(d_str):
    if not d_str or not d_str.strip():
        return None
    d_str = d_str.strip()
    for fmt in ["%d/%m/%Y", "%d-%m-%Y", "%Y-%m-%d"]:
        try:
            return datetime.strptime(d_str, fmt).date()
        except ValueError:
            pass
    return None

def clean_float(val):
    if not val:
        return None
    val = val.strip().replace(",", ".")
    try:
        f = float(val)
        return f if f > 0 else None
    except ValueError:
        return None

def clean_int(val):
    if not val:
        return None
    val = val.strip()
    try:
        return int(val)
    except ValueError:
        return None

months_meta = [
    ("JULI", "2026-07-15", 6),
    ("AGUSTUS", "2026-08-15", 10),
    ("SEPTEMBER", "2026-09-15", 14),
    ("OKTOBER", "2026-10-15", 18),
    ("NOVEMBER", "2026-11-15", 22),
    ("DESEMBER", "2026-12-15", 26),
]

def run_import(dry_run=True):
    db = SessionLocal()
    try:
        p1 = db.query(Posyandu).filter(Posyandu.id == DAHLIA_01_ID).first()
        p2 = db.query(Posyandu).filter(Posyandu.id == DAHLIA_02_ID).first()
        
        if not p1 or not p2:
            print("ERROR: Posyandu Dahlia 01 atau Dahlia 02 tidak ditemukan!")
            return
            
        print(f"Target Posyandu 1: {p1.nama} ({p1.id})")
        print(f"Target Posyandu 2: {p2.nama} ({p2.id})")
        
        kader1 = db.query(Kader).filter(Kader.posyandu_id == p1.id).first()
        kader2 = db.query(Kader).filter(Kader.posyandu_id == p2.id).first()
        
        if not kader2:
            # Create default kader for Dahlia 02 if missing
            print("Membuat Kader default untuk Dahlia 02...")
            kader2 = Kader(
                posyandu_id=p2.id,
                nama="Kader Posyandu Dahlia 02",
                email="kader.dahlia02@ananta.id",
                phone="081234567892",
                role="kader",
                is_active=True,
            )
            if not dry_run:
                db.add(kader2)
                db.flush()

        kader1_id = kader1.id if kader1 else None
        kader2_id = kader2.id if kader2 else None

        posyandu_configs = [
            (blocks[0], p1, kader1_id, "Dahlia 01, Karangkancana"),
            (blocks[1], p2, kader2_id, "Dahlia 02, Karangkancana"),
        ]

        total_balita_imported = 0
        total_penimbangan_imported = 0

        for b_idx, (block_rows, posyandu, kader_id, default_alamat) in enumerate(posyandu_configs):
            print(f"\n==================== MEMPROSES {posyandu.nama} ({len(block_rows)} ANAK) ====================")
            
            for r_idx, row in enumerate(block_rows):
                parts = [p.strip() for p in row.split(",")]
                nama = parts[0].strip()
                no_kk = parts[1].strip() if len(parts) > 1 else ""
                nik = parts[2].strip() if len(parts) > 2 else ""
                jk = parts[3].strip().upper() if len(parts) > 3 and parts[3].strip() else ""
                ortu = parts[4].strip() if len(parts) > 4 else ""
                tgl_str = parts[5].strip() if len(parts) > 5 else ""
                tgl_lahir = parse_date(tgl_str)
                
                # Inferred JK
                if not jk:
                    if any(x in nama.upper() for x in ["HAMMAD", "MUAMMAR", "ARKHANZA", "AHSAN", "LUTHFI"]):
                        jk = "L"
                    else:
                        jk = "L"
                
                # Inferred Tgl Lahir
                if not tgl_lahir:
                    if "El aqsa" in nama:
                        tgl_lahir = date(2025, 12, 15)
                    else:
                        tgl_lahir = date(2023, 1, 1)

                # Special fixes for specific raw rows
                is_elkara = "ELKARA" in nama.upper()
                is_lestari = "LESTARI NURAISAH" in nama.upper()
                is_razya = "RAZYA SYAHMINA" in nama.upper()

                # Cari atau buat record Balita
                balita = None
                if not dry_run:
                    balita = db.query(Balita).filter(
                        Balita.nama.ilike(nama),
                        Balita.posyandu_id == posyandu.id
                    ).first()
                    
                    if not balita:
                        balita = Balita(
                            posyandu_id=posyandu.id,
                            nama=nama,
                            tanggal_lahir=tgl_lahir,
                            jenis_kelamin=jk,
                            nama_ibu=ortu or "-",
                            alamat=default_alamat,
                        )
                        db.add(balita)
                        db.flush()
                
                total_balita_imported += 1

                # Parse weighings
                for m_name, m_date_str, base_col in months_meta:
                    if base_col < len(parts):
                        u_str = parts[base_col]
                        bb_str = parts[base_col + 1] if base_col + 1 < len(parts) else ""
                        tb_str = parts[base_col + 2] if base_col + 2 < len(parts) else ""
                        ntob = parts[base_col + 3] if base_col + 3 < len(parts) else ""
                        
                        bb = clean_float(bb_str)
                        tb = clean_float(tb_str)
                        u = clean_int(u_str)

                        # ELKARA: in July: parts[6]='11', parts[7]='', parts[8]='82' -> BB was 11, TB was 82
                        if is_elkara and m_name == "JULI":
                            bb = 11.0
                            tb = 82.0
                            u = 23

                        # RAZYA: in October: BB=90, TB=15 (swapped!)
                        if is_razya and m_name == "OKTOBER":
                            if bb and tb and bb > 40:
                                bb, tb = 15.0, 90.0

                        # LESTARI: in August: TB=50 (typo for 90.5)
                        if is_lestari and m_name == "AGUSTUS":
                            if tb == 50.0:
                                tb = 90.5

                        # SITI & ARKHANZA in October: u_str might be 'B'
                        if u_str == "B":
                            u = 0

                        # If u is None but we have BB or TB, calculate umur from birth date
                        m_date = datetime.strptime(m_date_str, "%Y-%m-%d").date()
                        if u is None and (bb or tb):
                            diff_months = (m_date.year - tgl_lahir.year) * 12 + (m_date.month - tgl_lahir.month)
                            u = max(0, min(60, diff_months))

                        if bb and tb and u is not None:
                            u_clamped = max(0, min(60, u))
                            
                            # Calculate WHO Z-Score
                            jk_enum = JenisKelamin.LAKI_LAKI if jk == "L" else JenisKelamin.PEREMPUAN
                            try:
                                who_res = kalkulasi_antropometri(
                                    umur_bulan=u_clamped,
                                    berat_kg=bb,
                                    tinggi_cm=tb,
                                    jenis_kelamin=jk_enum,
                                )
                                
                                # Status gizi
                                status_gizi = "normal"
                                if who_res.ada_risiko_stunting:
                                    status_gizi = "stunting"
                                elif who_res.ada_risiko_wasting:
                                    status_gizi = "wasting"
                                elif who_res.ada_risiko_underweight:
                                    status_gizi = "kurang"

                                if not dry_run and balita:
                                    # Cek apakah penimbangan di tanggal yang sama sudah ada
                                    exist_p = db.query(Penimbangan).filter(
                                        Penimbangan.balita_id == balita.id,
                                        Penimbangan.tanggal_timbang == m_date
                                    ).first()

                                    if exist_p:
                                        exist_p.umur_bulan = u_clamped
                                        exist_p.berat_kg = bb
                                        exist_p.tinggi_cm = tb
                                        exist_p.zscore_bbu = who_res.bbu.zscore
                                        exist_p.zscore_pbu = who_res.pbu.zscore
                                        exist_p.zscore_bbpb = who_res.bbpb.zscore
                                        exist_p.status_gizi = status_gizi
                                    else:
                                        new_p = Penimbangan(
                                            balita_id=balita.id,
                                            kader_id=kader_id,
                                            tanggal_timbang=m_date,
                                            umur_bulan=u_clamped,
                                            berat_kg=bb,
                                            tinggi_cm=tb,
                                            zscore_bbu=who_res.bbu.zscore,
                                            zscore_pbu=who_res.pbu.zscore,
                                            zscore_bbpb=who_res.bbpb.zscore,
                                            status_gizi=status_gizi,
                                            input_mode="form",
                                        )
                                        db.add(new_p)

                                total_penimbangan_imported += 1
                            except Exception as e:
                                print(f"    [!] Error Z-score {nama} ({m_name}): u={u_clamped}, bb={bb}, tb={tb} -> {e}")

                if (r_idx + 1) % 10 == 0 or (r_idx + 1) == len(block_rows):
                    print(f"  Processed {r_idx + 1}/{len(block_rows)} balita...")

        if not dry_run:
            db.commit()
            print("\n>>> BERHASIL COMMIT KE DATABASE SUPABASE! <<<")
        else:
            print("\n>>> DRY RUN SELESAI (TIDAK ADA PERUBAHAN KE DB) <<<")

        print(f"Total Balita Terproses: {total_balita_imported}")
        print(f"Total Sesi Penimbangan: {total_penimbangan_imported}")

    finally:
        db.close()

if __name__ == "__main__":
    is_dry = "--commit" not in sys.argv
    if is_dry:
        print("Menjalankan DRY RUN... (Gunakan --commit untuk menyimpan ke DB)")
    else:
        print("Menjalankan IMPORT AKTIF KE DATABASE SUPABASE...")
    run_import(dry_run=is_dry)

