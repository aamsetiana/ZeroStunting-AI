"""
API Router — Antropometri
==========================
Endpoint untuk kalkulasi Z-score dan klasifikasi status gizi balita.
"""

from fastapi import APIRouter, HTTPException, status
from app.schemas.anthropometry import AntropometriRequest, AntropometriResponse, ZScoreDetail
from app.core.who_anthro import kalkulasi_antropometri, validate_input

router = APIRouter(prefix="/anthropometry", tags=["Antropometri"])

# Mapping status → interpretasi kalimat
STATUS_INTERPRETASI = {
    "normal":         "Normal — dalam rentang standar WHO",
    "risiko_lebih":   "Risiko tinggi — di atas +2 SD, pantau lebih lanjut",
    "berat_lebih":    "Berat lebih — di atas +2 SD",
    "gizi_kurang":    "Gizi kurang — di bawah -2 SD, perlu intervensi",
    "gizi_buruk":     "Gizi buruk — di bawah -3 SD, segera rujuk",
    "pendek":         "Stunting (pendek) — di bawah -2 SD, perlu intervensi",
    "sangat_pendek":  "Stunting berat — di bawah -3 SD, segera rujuk",
    "kurus":          "Wasting (kurus) — di bawah -2 SD, perlu intervensi",
    "sangat_kurus":   "Wasting berat — di bawah -3 SD, PRIORITAS RUJUK",
}


@router.post(
    "/calculate",
    response_model=AntropometriResponse,
    summary="Hitung Z-score Antropometri Balita",
    description=(
        "Menghitung Z-score BB/U, PB/U, dan BB/PB berdasarkan standar WHO 2006 "
        "menggunakan metode LMS (Box-Cox power transformation). "
        "Mengembalikan status gizi dan rekomendasi untuk kader Posyandu."
    ),
    status_code=status.HTTP_200_OK,
)
async def hitung_antropometri(payload: AntropometriRequest) -> AntropometriResponse:
    """
    Kalkulasi Z-score lengkap untuk satu balita.

    - **umur_bulan**: 0–60 bulan
    - **berat_kg**: Berat badan dalam kg
    - **tinggi_cm**: Panjang/tinggi badan dalam cm
    - **jenis_kelamin**: "L" (Laki-laki) atau "P" (Perempuan)
    """
    try:
        result = kalkulasi_antropometri(
            umur_bulan=payload.umur_bulan,
            berat_kg=payload.berat_kg,
            tinggi_cm=payload.tinggi_cm,
            jenis_kelamin=payload.jenis_kelamin,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e),
        )
    except FileNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Tabel referensi WHO tidak ditemukan: {e}",
        )

    # Validasi soft warnings
    peringatan_data = validate_input(
        payload.umur_bulan, payload.berat_kg, payload.tinggi_cm
    )

    def build_detail(zr) -> ZScoreDetail:
        return ZScoreDetail(
            indikator=zr.indikator,
            zscore=zr.zscore,
            status=zr.status,
            nilai_actual=zr.nilai_actual,
            median_referensi=zr.median_referensi,
            interpretasi=STATUS_INTERPRETASI.get(zr.status.value, ""),
        )

    return AntropometriResponse(
        nama_anak=payload.nama_anak,
        umur_bulan=result.umur_bulan,
        berat_kg=result.berat_kg,
        tinggi_cm=result.tinggi_cm,
        jenis_kelamin=result.jenis_kelamin,
        bbu=build_detail(result.bbu),
        pbu=build_detail(result.pbu),
        bbpb=build_detail(result.bbpb),
        ada_risiko_stunting=result.ada_risiko_stunting,
        ada_risiko_wasting=result.ada_risiko_wasting,
        ada_risiko_underweight=result.ada_risiko_underweight,
        pesan_peringatan=result.pesan_peringatan,
        peringatan_data=peringatan_data,
    )


@router.get(
    "/health",
    summary="Health Check — WHO Engine",
    description="Verifikasi bahwa WHO Anthro Engine berjalan dan tabel referensi tersedia.",
)
async def health_check():
    """Health check endpoint."""
    try:
        # Test kalkulasi dengan data dummy
        kalkulasi_antropometri(
            umur_bulan=24,
            berat_kg=12.0,
            tinggi_cm=87.0,
            jenis_kelamin="L",
        )
        return {"status": "ok", "engine": "WHO Anthro 2006", "tabel": "tersedia"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"WHO Engine tidak siap: {e}",
        )
