"""
Schema Pydantic — Advisory Gizi Balita (RAG Engine)
====================================================
"""

from typing import List, Optional
from pydantic import BaseModel, Field


class AdvisoryRequest(BaseModel):
    nama_anak: Optional[str] = Field(None, description="Nama anak (opsional)")
    umur_bulan: int = Field(..., ge=0, le=60, description="Umur anak dalam bulan (0-60)")
    berat_kg: float = Field(..., ge=1.5, le=35.0, description="Berat badan anak dalam kg")
    tinggi_cm: float = Field(..., ge=40.0, le=130.0, description="Panjang/tinggi badan anak dalam cm")
    jenis_kelamin: str = Field(..., description="Jenis kelamin: 'L' atau 'P'")
    status_gizi: str = Field(..., description="Status gizi utama (normal/stunting/wasting/underweight)")
    zscore_bbu: Optional[float] = Field(None, description="Z-Score BB/U")
    zscore_pbu: Optional[float] = Field(None, description="Z-Score PB/U")
    zscore_bbpb: Optional[float] = Field(None, description="Z-Score BB/PB")


class MenuItem(BaseModel):
    hari: str
    menu_pagi: str
    menu_siang: str
    menu_malam: str
    selingan: str
    bahan_utama: List[str]


class AdvisoryResponse(BaseModel):
    analisis_kondisi: str
    rekomendasi_menu: List[MenuItem]
    bahan_pangan_rekomendasi: List[str]
    tindak_lanjut: str
    status_rujukan: bool
    sumber_knowledge: str
