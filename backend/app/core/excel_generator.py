"""
Generator Excel e-PPGBM Kemenkes RI
===================================
Modul untuk menghasilkan dokumen spreadsheet Excel (.xlsx) resmi
yang 100% kompatibel dengan template dan format impor e-PPGBM
Kementerian Kesehatan RI dan Puskesmas.
"""

from io import BytesIO
from datetime import date
from typing import Dict, Any, List
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

from app.schemas.laporan import LaporanPosyanduRequest, BalitaLaporanItem

BULAN_NAMES = [
    "", "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
]


def _map_status_stunting(item: BalitaLaporanItem) -> tuple[str, bool]:
    """Menentukan status PB/U (Stunting) dan flag boolean."""
    pbu = item.zscore_pbu
    status = (item.status_gizi or "").lower()

    if pbu is not None:
        if pbu < -3.0:
            return "Sangat Pendek (Severely Stunted)", True
        elif pbu < -2.0:
            return "Pendek (Stunted)", True
        elif pbu > 3.0:
            return "Tinggi", False
        else:
            return "Normal", False

    # Fallback dari string status
    if "sangat_pendek" in status:
        return "Sangat Pendek (Severely Stunted)", True
    elif "pendek" in status:
        return "Pendek (Stunted)", True
    return "Normal", False


def _map_status_wasting(item: BalitaLaporanItem) -> str:
    """Menentukan status BB/PB (Wasting / Gizi Akut)."""
    bbpb = item.zscore_bbpb
    if bbpb is not None:
        if bbpb < -3.0:
            return "Gizi Buruk (Severely Wasted)"
        elif bbpb < -2.0:
            return "Gizi Kurang (Wasted)"
        elif bbpb > 2.0:
            return "Gizi Lebih / Obesitas"
        else:
            return "Gizi Baik (Normal)"
    return "Gizi Baik (Normal)"


def _map_status_bbu(item: BalitaLaporanItem) -> str:
    """Menentukan status BB/U (Underweight)."""
    bbu = item.zscore_bbu
    if bbu is not None:
        if bbu < -3.0:
            return "Berat Sangat Kurang"
        elif bbu < -2.0:
            return "Berat Kurang"
        elif bbu > 1.0:
            return "Risiko Berat Lebih"
        else:
            return "Normal"
    return "Normal"


def generate_e_ppgbm_excel(payload: LaporanPosyanduRequest) -> bytes:
    """
    Menghasilkan file Excel .xlsx laporan rekapitulasi penimbangan
    sesuai standar format e-PPGBM Kemenkes RI.
    """
    wb = openpyxl.Workbook()

    # ─────────────────────────────────────────────────────────────────────────
    # SHEET 1: Data_ePPGBM (Format Impor Utama)
    # ─────────────────────────────────────────────────────────────────────────
    ws1 = wb.active
    ws1.title = "Data_ePPGBM"
    ws1.views.sheetView[0].showGridLines = True

    # Palet Warna Kemenkes
    NAVY_HEADER = "0F172A"
    GREEN_HEADER = "15803D"
    GREEN_LIGHT = "DCFCE7"
    RED_ALERT_BG = "FEE2E2"
    RED_ALERT_TEXT = "991B1B"
    ZEBRA_BG = "F8FAFC"
    BORDER_GRAY = "E2E8F0"

    # Font definitions
    font_title = Font(name="Calibri", size=14, bold=True, color=GREEN_HEADER)
    font_meta = Font(name="Calibri", size=10, bold=False, color="475569")
    font_meta_bold = Font(name="Calibri", size=10, bold=True, color="0F172A")
    font_header = Font(name="Calibri", size=10, bold=True, color="FFFFFF")
    font_data = Font(name="Calibri", size=10, color="0F172A")
    font_alert = Font(name="Calibri", size=10, bold=True, color=RED_ALERT_TEXT)

    # Fills
    fill_header = PatternFill(start_color=GREEN_HEADER, end_color=GREEN_HEADER, fill_type="solid")
    fill_zebra = PatternFill(start_color=ZEBRA_BG, end_color=ZEBRA_BG, fill_type="solid")
    fill_alert = PatternFill(start_color=RED_ALERT_BG, end_color=RED_ALERT_BG, fill_type="solid")

    # Borders
    thin_border_side = Side(border_style="thin", color=BORDER_GRAY)
    border_cell = Border(left=thin_border_side, right=thin_border_side, top=thin_border_side, bottom=thin_border_side)
    header_border = Border(left=thin_border_side, right=thin_border_side, top=thin_border_side, bottom=Side(border_style="medium", color="0D542B"))

    # Alignments
    align_center = Alignment(horizontal="center", vertical="center")
    align_left = Alignment(horizontal="left", vertical="center")
    align_right = Alignment(horizontal="right", vertical="center")
    align_header = Alignment(horizontal="center", vertical="center", wrap_text=True)

    nama_bulan = BULAN_NAMES[payload.bulan] if 1 <= payload.bulan <= 12 else str(payload.bulan)

    # 1. Header Informasi Wilayah (Baris 1-5)
    ws1.merge_cells("A1:X1")
    ws1["A1"] = "FORMAT LAPORAN PENIMBANGAN DAN PENGUKURAN BALITA (e-PPGBM KEMENKES RI)"
    ws1["A1"].font = font_title
    ws1["A1"].alignment = align_left

    ws1["A2"] = f"Unit Posyandu: {payload.nama_posyandu}"
    ws1["A2"].font = font_meta_bold
    ws1["F2"] = f"Desa / Kelurahan: {payload.desa_kelurahan}"
    ws1["F2"].font = font_meta
    ws1["L2"] = f"Kecamatan: {payload.kecamatan}"
    ws1["L2"].font = font_meta

    ws1["A3"] = f"Kabupaten / Kota: {payload.kabupaten_kota}"
    ws1["A3"].font = font_meta
    ws1["F3"] = f"Provinsi: {payload.provinsi or 'Jawa Barat'}"
    ws1["F3"].font = font_meta
    ws1["L3"] = f"Periode Penimbangan: {nama_bulan} {payload.tahun}"
    ws1["L3"].font = font_meta_bold

    ws1["A4"] = f"Kader Pelapor: {payload.nama_kader}"
    ws1["A4"].font = font_meta
    ws1["F4"] = f"Bidan Desa: {payload.nama_bidan_desa or '-'}"
    ws1["F4"].font = font_meta
    ws1["L4"] = f"Tanggal Ekspor: {date.today().strftime('%d/%m/%Y')}"
    ws1["L4"].font = font_meta

    # 2. Baris Header Tabel Kolom Baku e-PPGBM (Baris 6)
    headers = [
        ("No", 6, align_center),
        ("NIK Balita", 20, align_center),
        ("Nama Lengkap Balita", 26, align_left),
        ("JK", 6, align_center),
        ("Tanggal Lahir", 13, align_center),
        ("Umur (Bln)", 11, align_center),
        ("Nama Ibu Kandung", 22, align_left),
        ("Alamat / Dusun / RT", 20, align_left),
        ("Nama Posyandu", 18, align_left),
        ("Berat (kg)", 11, align_right),
        ("Tinggi/PB (cm)", 13, align_right),
        ("Cara Ukur", 12, align_center),
        ("LiLA (cm)", 11, align_right),
        ("Status Tumbuh", 13, align_center),
        ("Z-Score BB/U", 12, align_right),
        ("Status BB/U", 18, align_left),
        ("Z-Score PB/U", 12, align_right),
        ("Status Stunting (PB/U)", 25, align_left),
        ("Z-Score BB/PB", 13, align_right),
        ("Status Wasting (BB/PB)", 24, align_left),
        ("Indikasi Stunting", 16, align_center),
        ("Perlu Rujukan", 14, align_center),
        ("Intervensi & Rekomendasi Gizi", 35, align_left),
    ]

    header_row = 6
    ws1.row_dimensions[header_row].height = 28

    for col_idx, (h_title, _, _) in enumerate(headers, start=1):
        cell = ws1.cell(row=header_row, column=col_idx, value=h_title)
        cell.font = font_header
        cell.fill = fill_header
        cell.alignment = align_header
        cell.border = header_border

    # 3. Baris Data Balita
    data_list = payload.data_balita
    current_row = header_row + 1

    for idx, item in enumerate(data_list, start=1):
        ws1.row_dimensions[current_row].height = 20
        is_zebra = (idx % 2 == 0)
        row_fill = fill_zebra if is_zebra else None

        status_stunting, is_stunting = _map_status_stunting(item)
        status_wasting = _map_status_wasting(item)
        status_bbu = _map_status_bbu(item)
        perlu_rujuk = item.perlu_rujukan or is_stunting

        # Format NIK sebagai text murni agar tidak terpotong / jadi scientific notation
        nik_clean = str(item.nik or "").strip()
        if not nik_clean or nik_clean == "-":
            nik_clean = "-"

        # Cara ukur
        posisi = "Berdiri" if item.umur_bulan >= 24 else "Telentang"

        # Rekomendasi
        rekomendasi = item.rekomendasi_singkat or (
            "Rujuk Puskesmas / Intervensi PMT Protein Hewani" if perlu_rujuk else "Pertahankan ASI & MPASI Bergizi Seimbang"
        )

        row_values = [
            (idx, align_center, None),
            (nik_clean, align_center, "@"),  # '@' menandakan format teks di Excel
            (item.nama_anak, align_left, None),
            (item.jenis_kelamin, align_center, None),
            (item.tanggal_lahir or "-", align_center, None),
            (item.umur_bulan, align_center, "#,##0"),
            (item.nama_ibu or "-", align_left, None),
            (payload.desa_kelurahan, align_left, None),
            (payload.nama_posyandu, align_left, None),
            (round(item.berat_kg, 2), align_right, "0.00"),
            (round(item.tinggi_cm, 1), align_right, "0.0"),
            (posisi, align_center, None),
            (round(item.lila_cm, 1) if item.lila_cm else "-", align_right, "0.0" if item.lila_cm else None),
            ("N", align_center, None),  # Status N (Naik)
            (round(item.zscore_bbu, 2) if item.zscore_bbu is not None else "-", align_right, "0.00" if item.zscore_bbu is not None else None),
            (status_bbu, align_left, None),
            (round(item.zscore_pbu, 2) if item.zscore_pbu is not None else "-", align_right, "0.00" if item.zscore_pbu is not None else None),
            (status_stunting, align_left, None),
            (round(item.zscore_bbpb, 2) if item.zscore_bbpb is not None else "-", align_right, "0.00" if item.zscore_bbpb is not None else None),
            (status_wasting, align_left, None),
            ("YA" if is_stunting else "TIDAK", align_center, None),
            ("YA" if perlu_rujuk else "TIDAK", align_center, None),
            (rekomendasi, align_left, None),
        ]

        for col_idx, (val, alignment, num_fmt) in enumerate(row_values, start=1):
            cell = ws1.cell(row=current_row, column=col_idx, value=val)
            cell.font = font_data
            cell.alignment = alignment
            cell.border = border_cell
            if row_fill:
                cell.fill = row_fill

            if num_fmt:
                cell.number_format = num_fmt

            # Highlight khusus untuk kolom Stunting / Rujukan jika terindikasi
            if col_idx in [18, 20, 21, 22] and (is_stunting or perlu_rujuk):
                if (col_idx == 18 and is_stunting) or (col_idx in [21, 22] and val == "YA"):
                    cell.fill = fill_alert
                    cell.font = font_alert

        current_row += 1

    # Atur lebar kolom optimal
    for col_idx, (_, width, _) in enumerate(headers, start=1):
        col_letter = get_column_letter(col_idx)
        ws1.column_dimensions[col_letter].width = width

    # Freeze panes di A7 agar header tetap terlihat saat scroll ke bawah
    ws1.freeze_panes = "A7"

    # Aktifkan AutoFilter pada baris header (Baris 6)
    last_col_letter = get_column_letter(len(headers))
    ws1.auto_filter.ref = f"A6:{last_col_letter}{max(current_row - 1, 6)}"

    # ─────────────────────────────────────────────────────────────────────────
    # SHEET 2: Ringkasan_Eksekutif
    # ─────────────────────────────────────────────────────────────────────────
    ws2 = wb.create_sheet(title="Ringkasan_Eksekutif")
    ws2.views.sheetView[0].showGridLines = True

    total_balita = len(data_list)
    total_stunting = sum(1 for b in data_list if _map_status_stunting(b)[1])
    pct_stunting = round((total_stunting / total_balita * 100), 1) if total_balita > 0 else 0.0

    total_wasting = sum(1 for b in data_list if b.zscore_bbpb is not None and b.zscore_bbpb < -2.0)
    pct_wasting = round((total_wasting / total_balita * 100), 1) if total_balita > 0 else 0.0

    total_rujukan = sum(1 for b in data_list if b.perlu_rujukan or _map_status_stunting(b)[1])

    ws2.column_dimensions["A"].width = 6
    ws2.column_dimensions["B"].width = 38
    ws2.column_dimensions["C"].width = 18
    ws2.column_dimensions["D"].width = 24

    ws2["B2"] = "RINGKASAN STATISTIK LAPORAN e-PPGBM"
    ws2["B2"].font = Font(name="Calibri", size=13, bold=True, color=GREEN_HEADER)

    ws2["B3"] = f"Unit Posyandu: {payload.nama_posyandu} | Periode: {nama_bulan} {payload.tahun}"
    ws2["B3"].font = font_meta

    kpi_headers = ["No", "Indikator Gizi e-PPGBM", "Jumlah Balita", "Persentase (%)"]
    ws2.row_dimensions[5].height = 24
    for idx, h in enumerate(kpi_headers, start=1):
        c = ws2.cell(row=5, column=idx, value=h)
        c.font = font_header
        c.fill = fill_header
        c.alignment = align_center
        c.border = header_border

    kpi_rows = [
        (1, "Total Balita Terdaftar Ditimbang", total_balita, "100.0%"),
        (2, "Balita Tumbuh Normal (Sehat)", total_balita - total_stunting, f"{100.0 - pct_stunting:.1f}%"),
        (3, "Balita Terindikasi Stunting (Pendek / Sangat Pendek)", total_stunting, f"{pct_stunting:.1f}%"),
        (4, "Balita Terindikasi Wasting (Gizi Kurang / Buruk)", total_wasting, f"{pct_wasting:.1f}%"),
        (5, "Balita Wajib Dirujuk Segera ke Puskesmas", total_rujukan, "-"),
    ]

    for row_idx, (no, label, val_cnt, val_pct) in enumerate(kpi_rows, start=6):
        ws2.row_dimensions[row_idx].height = 20
        c1 = ws2.cell(row=row_idx, column=1, value=no)
        c2 = ws2.cell(row=row_idx, column=2, value=label)
        c3 = ws2.cell(row=row_idx, column=3, value=val_cnt)
        c4 = ws2.cell(row=row_idx, column=4, value=val_pct)

        c1.alignment = align_center
        c2.alignment = align_left
        c3.alignment = align_right
        c4.alignment = align_center

        for c in [c1, c2, c3, c4]:
            c.font = font_data
            c.border = border_cell

        if no in [3, 4, 5] and val_cnt > 0:
            c2.font = font_alert
            c3.font = font_alert
            c4.font = font_alert
            c3.fill = fill_alert

    # Kolom Pengesahan Tanda Tangan
    sign_row = 13
    ws2.cell(row=sign_row, column=2, value=f"{payload.desa_kelurahan}, {date.today().strftime('%d %B %Y')}").font = font_meta
    ws2.cell(row=sign_row + 1, column=2, value="Kader Pelapor Posyandu,").font = font_meta_bold
    ws2.cell(row=sign_row + 5, column=2, value=f"( {payload.nama_kader} )").font = font_meta_bold

    ws2.cell(row=sign_row + 1, column=4, value="Mengetahui,\nBidan Desa,").font = font_meta_bold
    ws2.cell(row=sign_row + 5, column=4, value=f"( {payload.nama_bidan_desa or 'Bidan Desa'} )").font = font_meta_bold

    # Simpan ke byte buffer
    stream = BytesIO()
    wb.save(stream)
    stream.seek(0)
    return stream.getvalue()

