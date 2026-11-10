import re
from datetime import datetime, date

# Raw blocks
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from inspect_data import blocks

def parse_date(d_str):
    if not d_str or not d_str.strip():
        return None
    d_str = d_str.strip()
    # Try DD/MM/YYYY
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

for b_idx, block in enumerate(blocks):
    print(f"\n==================== BLOCK {b_idx + 1} ====================")
    for r_idx, row in enumerate(block):
        parts = [p.strip() for p in row.split(",")]
        nama = parts[0]
        no_kk = parts[1] if len(parts) > 1 else ""
        nik = parts[2] if len(parts) > 2 else ""
        jk = parts[3].upper() if len(parts) > 3 and parts[3] else ""
        ortu = parts[4] if len(parts) > 4 else ""
        tgl_str = parts[5] if len(parts) > 5 else ""
        tgl_lahir = parse_date(tgl_str)
        
        # Inferred JK if missing
        if not jk:
            if "HAMMAD" in nama.upper() or "MUAMMAR" in nama.upper() or "ARKHANZA" in nama.upper():
                jk = "L"
            else:
                jk = "L"
        
        # Inferred Tgl Lahir if missing
        if not tgl_lahir:
            # Check row 45: El aqsa -> July age is 7
            # July 2026 - 7 months = Dec 2025
            tgl_lahir = date(2025, 12, 15)

        weighings = []
        for m_name, m_date, base_col in months_meta:
            if base_col < len(parts):
                u_str = parts[base_col]
                bb_str = parts[base_col + 1] if base_col + 1 < len(parts) else ""
                tb_str = parts[base_col + 2] if base_col + 2 < len(parts) else ""
                ntob = parts[base_col + 3] if base_col + 3 < len(parts) else ""
                
                bb = clean_float(bb_str)
                tb = clean_float(tb_str)
                u = clean_int(u_str)

                # Special case: B, 2.9, 49 -> where u_str might be 'B'
                if u_str == "B":
                    u = 0
                
                # If u is None but we have birth date and measurement date:
                if u is None and (bb or tb):
                    m_d = datetime.strptime(m_date, "%Y-%m-%d").date()
                    diff_months = (m_d.year - tgl_lahir.year) * 12 + (m_d.month - tgl_lahir.month)
                    u = max(0, min(60, diff_months))

                # Check if bb or tb has anomalous values:
                # E.g. LESTARI NURAISAH at age 31: TB 50 cm might be typo for 90 or 91
                # E.g. RAZYA SYAHMINA at age 29: BB 90, TB 15 (swapped! BB is 15, TB is 90)
                if bb and tb:
                    if bb > 40 and tb < 30: # clearly swapped BB & TB!
                        bb, tb = tb, bb
                
                if bb or tb:
                    weighings.append({
                        "bulan": m_name,
                        "tanggal": m_date,
                        "umur": u,
                        "bb": bb,
                        "tb": tb,
                        "ntob": ntob
                    })

        print(f"[{r_idx+1}] {nama} | JK:{jk} | Lahir:{tgl_lahir} | Ibu/Ortu:{ortu} | {len(weighings)} penimbangan")
        for w in weighings:
            print(f"      - {w['bulan']}: Usia {w['umur']} bln, BB {w['bb']} kg, TB {w['tb']} cm, KBM: {w['ntob']}")
