"""
API Router — Laporan e-PPGBM & Export PDF
==========================================
Endpoint untuk pembuatan dan pengunduhan dokumen resmi Rekapitulasi Laporan
Penimbangan Balita berstandar format e-PPGBM Kementerian Kesehatan RI.
"""

from fastapi import APIRouter, Response, HTTPException, status
import re
from datetime import date

from app.schemas.laporan import (
    LaporanPosyanduRequest,
    LaporanSummaryResponse,
    BalitaLaporanItem,
)
from app.core.pdf_generator import (
    generate_e_ppgbm_pdf,
    hitung_statistik_laporan,
    BULAN_NAMES,
)

router = APIRouter(prefix="/laporan", tags=["Laporan & Rekapitulasi e-PPGBM"])


@router.post(
    "/generate",
    summary="Generate Dokumen PDF Rekapitulasi e-PPGBM",
    description=(
        "Menerima data rekapitulasi penimbangan Posyandu dan menghasilkan file dokumen PDF "
        "berformat standar e-PPGBM Kementerian Kesehatan RI (Landscape A4, lengkap dengan KOP, "
        "KPI agregat stunting, tabel data Z-Score WHO, dan lembar pengesahan Bidan Desa & Kader)."
    ),
    response_class=Response,
    responses={
        200: {
            "content": {"application/pdf": {}},
            "description": "File PDF e-PPGBM yang siap diunduh atau dicetak.",
        }
    },
)
async def generate_laporan_pdf(payload: LaporanPosyanduRequest) -> Response:
    try:
        pdf_bytes = generate_e_ppgbm_pdf(payload)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Gagal menghasilkan dokumen PDF e-PPGBM: {str(e)}",
        )

    # Format nama file yang rapi: Laporan_ePPGBM_PosyanduMelati_10_2026.pdf
    posyandu_clean = re.sub(r"[^\w\-]", "_", payload.nama_posyandu)
    filename = f"Laporan_ePPGBM_{posyandu_clean}_{payload.bulan:02d}_{payload.tahun}.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Content-Length": str(len(pdf_bytes)),
        },
    )


@router.post(
    "/preview-summary",
    response_model=LaporanSummaryResponse,
    summary="Preview Ringkasan Statistik Laporan",
    description="Menghitung total balita, tingkat prevalensi stunting (%), gizi kurang/buruk, dan rujukan sebelum mengunduh PDF.",
    status_code=status.HTTP_200_OK,
)
async def preview_summary_endpoint(payload: LaporanPosyanduRequest) -> LaporanSummaryResponse:
    stats = hitung_statistik_laporan(payload.data_balita)
    nama_bulan = BULAN_NAMES[payload.bulan] if 1 <= payload.bulan <= 12 else str(payload.bulan)

    return LaporanSummaryResponse(
        nama_posyandu=payload.nama_posyandu,
        periode=f"{nama_bulan} {payload.tahun}",
        total_balita=stats["total"],
        jumlah_normal=stats["normal"],
        persen_normal=stats["pct_normal"],
        jumlah_stunting=stats["stunting"],
        persen_stunting=stats["pct_stunting"],
        jumlah_gizi_kurang_buruk=stats["gizi_kurang_buruk"],
        persen_gizi_kurang_buruk=stats["pct_gizi_kurang_buruk"],
        jumlah_perlu_rujukan=stats["rujukan"],
        kader_pelapor=payload.nama_kader,
        bidan_desa=payload.nama_bidan_desa,
    )


@router.get(
    "/sample",
    response_model=LaporanPosyanduRequest,
    summary="Dapatkan Contoh Payload Laporan e-PPGBM",
    description="Menyediakan data contoh terisi lengkap untuk keperluan testing atau demo di Swagger UI.",
)
async def get_sample_laporan_data() -> LaporanPosyanduRequest:
    return LaporanPosyanduRequest(
        nama_posyandu="Posyandu Melati 03",
        desa_kelurahan="Desa Sukamaju",
        kecamatan="Kecamatan Cibinong",
        kabupaten_kota="Kabupaten Bogor",
        provinsi="Jawa Barat",
        bulan=10,
        tahun=2026,
        nama_kader="Ibu Sumiati",
        nama_bidan_desa="Bdn. Rina Marlina, S.Tr.Keb",
        tanggal_laporan=date(2026, 10, 23),
        catatan_umum="Pelaksanaan penimbangan rutin bulanan. Semua balita berisiko stunting telah diberikan edukasi PMT.",
        data_balita=[
            BalitaLaporanItem(
                no=1,
                nama_anak="Budi Santoso",
                nik="3201123456780001",
                tanggal_lahir="2025-04-10",
                jenis_kelamin="L",
                umur_bulan=18,
                nama_ibu="Siti Aminah",
                berat_kg=9.2,
                tinggi_cm=78.5,
                lila_cm=12.0,
                zscore_bbu=-1.8,
                zscore_pbu=-2.4,
                zscore_bbpb=-0.9,
                status_gizi="pendek",
                rekomendasi_singkat="Edukasi MPASI pangan lokal telur + ikan kembung.",
                perlu_rujukan=False,
            ),
            BalitaLaporanItem(
                no=2,
                nama_anak="Aisyah Putri",
                nik="3201123456780002",
                tanggal_lahir="2025-11-15",
                jenis_kelamin="P",
                umur_bulan=11,
                nama_ibu="Nurhayati",
                berat_kg=8.5,
                tinggi_cm=72.0,
                lila_cm=13.5,
                zscore_bbu=0.2,
                zscore_pbu=0.1,
                zscore_bbpb=0.1,
                status_gizi="normal",
                rekomendasi_singkat="Pertumbuhan optimal, lanjutkan pemantauan rutin.",
                perlu_rujukan=False,
            ),
            BalitaLaporanItem(
                no=3,
                nama_anak="Dimas Saputra",
                nik="3201123456780003",
                tanggal_lahir="2024-08-20",
                jenis_kelamin="L",
                umur_bulan=26,
                nama_ibu="Sri Wahyuni",
                berat_kg=8.8,
                tinggi_cm=81.0,
                lila_cm=11.2,
                zscore_bbu=-3.1,
                zscore_pbu=-3.2,
                zscore_bbpb=-2.8,
                status_gizi="sangat_pendek",
                rekomendasi_singkat="Stunting severe & gizi kurang, rujuk segera ke Puskesmas.",
                perlu_rujukan=True,
            ),
        ],
    )


@router.get(
    "/health",
    summary="Health Check — Layanan Pembuat PDF Laporan",
    description="Cek status ketersediaan ReportLab engine.",
)
async def laporan_health():
    import reportlab
    return {
        "status": "ok",
        "service": "ZeroStunting AI e-PPGBM PDF Generator",
        "reportlab_version": reportlab.__version__,
        "page_format": "Landscape A4 (Standard e-PPGBM)",
    }
