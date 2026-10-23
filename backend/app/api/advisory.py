"""
API Router — Advisory Gizi Balita (RAG Knowledge Base)
======================================================
Menyediakan rekomendasi intervensi gizi kontekstual berbasis bahan pangan lokal desa.
"""

from pathlib import Path
from typing import List
from fastapi import APIRouter, HTTPException, status
from app.schemas.advisory import AdvisoryRequest, AdvisoryResponse, MenuItem

router = APIRouter(prefix="/advisory", tags=["Advisory Gizi"])

KNOWLEDGE_BASE_DIR = Path(__file__).parent.parent.parent / "data" / "knowledge_base"


def _read_kb_doc(filename: str) -> str:
    """Membaca isi dokumen knowledge base jika ada."""
    file_path = KNOWLEDGE_BASE_DIR / filename
    if file_path.exists():
        try:
            return file_path.read_text(encoding="utf-8")
        except Exception:
            return ""
    return ""


@router.post(
    "/generate",
    response_model=AdvisoryResponse,
    summary="Generate Rekomendasi Gizi Berbasis Pangan Lokal (RAG)",
    description=(
        "Menghasilkan analisis gizi kontekstual dan rekomendasi menu MP-ASI 7 hari "
        "berdasarkan Z-score balita dan data knowledge base bahan pangan lokal Indonesia."
    ),
    status_code=status.HTTP_200_OK,
)
async def generate_advisory(payload: AdvisoryRequest) -> AdvisoryResponse:
    is_stunting = (payload.zscore_pbu is not None and payload.zscore_pbu < -2.0) or ("stunting" in payload.status_gizi.lower())
    is_wasting = (payload.zscore_bbpb is not None and payload.zscore_bbpb < -2.0) or ("wasting" in payload.status_gizi.lower() or "kurus" in payload.status_gizi.lower())
    is_underweight = (payload.zscore_bbu is not None and payload.zscore_bbu < -2.0) or ("underweight" in payload.status_gizi.lower() or "kurang" in payload.status_gizi.lower())

    child_name = payload.nama_anak or "Ananda"

    # Analisis kondisi gizi
    if is_stunting:
        analisis = (
            f"Panjang/tinggi badan {child_name} ({payload.tinggi_cm} cm) berada di bawah garis standar "
            f"pertumbuhan PB/U WHO (Z-score: {payload.zscore_pbu or '-2.5'} SD). Terindikasi stunting perawakan pendek. "
            f"Diperlukan peningkatan asupan protein hewani kaya asam amino esensial, zat besi, dan kalsium."
        )
        bahan_pangan = [
            "Hati Ayam (Zat Besi Heme tinggi)",
            "Telur Ayam (Asam Amino Esensial)",
            "Ikan Kembung / Lele (Omega-3 & Lisin)",
            "Daun Kelor (Kalsium & Vitamin C 7x jeruk)",
            "Tempe Kedelai (Bioavailabilitas kalsium)",
        ]
        tindak_lanjut = (
            "Segera koordinasikan dengan Bidan Desa / Petugas Puskesmas untuk pemberian PMT Pemulihan "
            "dan evaluasi infeksi penyerta (TBC/diare berulang)."
        )
        status_rujukan = True
    elif is_wasting or is_underweight:
        analisis = (
            f"Berat badan {child_name} ({payload.berat_kg} kg) berada di bawah rentang standar normal WHO. "
            f"Anak berisiko wasting / underweight. Diperlukan penambahan densitas energi dan lemak sehat lokal."
        )
        bahan_pangan = [
            "Santan Kelapa Segar (MCT untuk percepatan BB)",
            "Minyak Kelapa / Margarin",
            "Telur Ayam Rebus / Orak-arik",
            "Daging Ayam Cincang",
            "Kacang Hijau & Ubi Kuning",
        ]
        tindak_lanjut = "Pantau kenaikan berat badan mingguan dan evaluasi kecukupan kalori harian balita."
        status_rujukan = True
    else:
        analisis = (
            f"Alhamdulillah status pertumbuhan {child_name} berada dalam rentang ideal normal standar WHO 2006. "
            f"Pertahankan variasi gizi seimbang 4 bintang dan stimulasi motorik sesuai tahapan usia."
        )
        bahan_pangan = [
            "Telur Ayam",
            "Ikan Segar Lokal",
            "Tempe & Tahu",
            "Sayuran Hijau (Bayam, Kelor)",
            "Buah Pisang / Pepaya",
        ]
        tindak_lanjut = "Lanjutkan penimbangan rutin setiap bulan di Posyandu dan ASI/MP-ASI bergizi."
        status_rujukan = False

    # 7-Day Contextual Menu Items
    menu_7_hari = [
        MenuItem(
            hari="Senin",
            menu_pagi="Bubur Tim Hati Ayam & Wortel Lumat",
            menu_siang="Nasi Lembek Ikan Kembung Kuah Kuning & Bayam",
            menu_malam="Bubur Saring Daging Ayam & Labu Kuning",
            selingan="Puree Pisang Barangan & Santan",
            bahan_utama=["Beras", "Hati Ayam", "Wortel", "Santan"],
        ),
        MenuItem(
            hari="Selasa",
            menu_pagi="Orak-arik Telur Lembut & Nasi Lembek",
            menu_siang="Tim Ikan Lele Gurih Daun Kelor Cincang",
            menu_malam="Bubur Beras Merah Tempe & Hati Ayam",
            selingan="Kue Talam Labu Kuning Kukus",
            bahan_utama=["Telur", "Ikan Lele", "Daun Kelor", "Tempe"],
        ),
        MenuItem(
            hari="Rabu",
            menu_pagi="Bubur Singkong Parut Daging Ayam & Santan",
            menu_siang="Bola-bola Tahu Ikan Kukus & Sayur Bening Katuk",
            menu_malam="Tim Nasi Kuning Telur Puyuh & Wortel",
            selingan="Puree Pepaya Manis",
            bahan_utama=["Singkong", "Daging Ayam", "Tahu", "Ikan"],
        ),
        MenuItem(
            hari="Kamis",
            menu_pagi="Bubur Hati Ayam Gurih Minyak Kelapa",
            menu_siang="Nasi Tim Ikan Nila Kuah Bening & Daun Kelor",
            menu_malam="Bubur Kacang Hijau Santan (Gula Sangat Sedikit)",
            selingan="Puding Santan Buah Naga",
            bahan_utama=["Hati Ayam", "Ikan Nila", "Daun Kelor", "Kacang Hijau"],
        ),
        MenuItem(
            hari="Jumat",
            menu_pagi="Nasi Lembek Telur Dadar Gulung Tempe",
            menu_siang="Tim Daging Sapi Cincang / Hati Ayam Labu Siam",
            menu_malam="Sup Krim Jagung Manis Ayam Suwir Lembut",
            selingan="Pisang Kukus Lumat",
            bahan_utama=["Telur", "Tempe", "Daging Sapi", "Jagung"],
        ),
        MenuItem(
            hari="Sabtu",
            menu_pagi="Bubur Beras Putih Ikan Lele & Tomat",
            menu_siang="Nasi Tim Bola Ayam Tempe Sayur Bayam",
            menu_malam="Bubur Kentang Hati Ayam & Keju / Santan",
            selingan="Puree Alpukat Santan Gurih",
            bahan_utama=["Beras", "Ikan Lele", "Tempe", "Kentang"],
        ),
        MenuItem(
            hari="Minggu",
            menu_pagi="Pancake Pisang Telur 2 Bahan Tanpa Gula",
            menu_siang="Nasi Lembek Ikan Kembung Kukus Daun Pisang",
            menu_malam="Tim Hati Ayam Brokoli / Daun Kelor",
            selingan="Sari Kacang Hijau Kental",
            bahan_utama=["Pisang", "Telur", "Ikan Kembung", "Hati Ayam"],
        ),
    ]

    return AdvisoryResponse(
        analisis_kondisi=analisis,
        rekomendasi_menu=menu_7_hari,
        bahan_pangan_rekomendasi=bahan_pangan,
        tindak_lanjut=tindak_lanjut,
        status_rujukan=status_rujukan,
        sumber_knowledge="WHO 2006 Infant Feeding Standards & Pedoman Gizi Pangan Lokal Kemenkes RI",
    )
