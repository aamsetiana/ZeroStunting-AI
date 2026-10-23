"""
ZeroStunting AI — e-PPGBM PDF Generator
=========================================
Modul pembuatan dokumen resmi Rekapitulasi Laporan Penimbangan Balita
berstandar format e-PPGBM Kementerian Kesehatan RI menggunakan ReportLab.
"""

from __future__ import annotations
import io
from typing import List
from datetime import date

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    KeepTogether,
)
from reportlab.pdfgen import canvas

from app.schemas.laporan import LaporanPosyanduRequest, BalitaLaporanItem


BULAN_NAMES = [
    "",
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
]


class NumberedCanvas(canvas.Canvas):
    """Canvas kustom untuk menghitung total halaman secara otomatis (Page X of Y)."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count: int):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#475569"))

        # Footer kiri: Dokumen resmi & sistem
        footer_left = "ZeroStunting AI Platform — Format Standar e-PPGBM Kemenkes RI"
        self.drawString(36, 20, footer_left)

        # Footer kanan: Nomor halaman
        footer_right = f"Halaman {self._pageNumber} dari {page_count}"
        self.drawRightString(842 - 36, 20, footer_right)

        # Garis tipis footer
        self.setStrokeColor(colors.HexColor("#cbd5e1"))
        self.setLineWidth(0.5)
        self.line(36, 28, 842 - 36, 28)

        self.restoreState()


def hitung_statistik_laporan(data_balita: List[BalitaLaporanItem]) -> dict:
    """Hitung agregat metrik stunting dan status gizi balita."""
    total = len(data_balita)
    if total == 0:
        return {
            "total": 0,
            "normal": 0, "pct_normal": 0.0,
            "stunting": 0, "pct_stunting": 0.0,
            "gizi_kurang_buruk": 0, "pct_gizi_kurang_buruk": 0.0,
            "rujukan": 0,
        }

    stunting_count = sum(
        1 for b in data_balita
        if b.status_gizi.lower() in ["pendek", "sangat_pendek", "stunting"]
        or (b.zscore_pbu is not None and b.zscore_pbu < -2.0)
    )
    gizi_kurang_buruk_count = sum(
        1 for b in data_balita
        if b.status_gizi.lower() in ["gizi_kurang", "gizi_buruk", "kurus", "sangat_kurus"]
        or (b.zscore_bbu is not None and b.zscore_bbu < -2.0)
    )
    normal_count = sum(
        1 for b in data_balita
        if b.status_gizi.lower() == "normal" and not (b.zscore_pbu is not None and b.zscore_pbu < -2.0)
    )
    rujukan_count = sum(1 for b in data_balita if b.perlu_rujukan)

    return {
        "total": total,
        "normal": normal_count,
        "pct_normal": round((normal_count / total) * 100, 1),
        "stunting": stunting_count,
        "pct_stunting": round((stunting_count / total) * 100, 1),
        "gizi_kurang_buruk": gizi_kurang_buruk_count,
        "pct_gizi_kurang_buruk": round((gizi_kurang_buruk_count / total) * 100, 1),
        "rujukan": rujukan_count,
    }


def generate_e_ppgbm_pdf(payload: LaporanPosyanduRequest) -> bytes:
    """
    Membuat file dokumen PDF Rekapitulasi Laporan e-PPGBM (Landscape A4).
    Mengembalikan raw bytes PDF siap unduh.
    """
    buffer = io.BytesIO()

    # Setup halaman Landscape A4: Lebar 842 pt, Tinggi 595 pt, Margin 36 pt (0.5 inch)
    doc = SimpleDocTemplate(
        buffer,
        pagesize=landscape(A4),
        leftMargin=36,
        rightMargin=36,
        topMargin=36,
        bottomMargin=36,
    )

    styles = getSampleStyleSheet()

    # Custom styles
    style_kop_lembaga = ParagraphStyle(
        "KopLembaga",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=11,
        leading=13,
        alignment=1,  # Center
        textColor=colors.HexColor("#0f172a"),
    )
    style_judul_laporan = ParagraphStyle(
        "JudulLaporan",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=14,
        leading=16,
        alignment=1,
        textColor=colors.HexColor("#16a34a"),  # ZeroStunting Primary Green
    )
    style_subjudul = ParagraphStyle(
        "SubjudulLaporan",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=11,
        alignment=1,
        textColor=colors.HexColor("#475569"),
    )
    style_cell_text = ParagraphStyle(
        "CellText",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8,
        leading=10,
        textColor=colors.HexColor("#1e293b"),
    )
    style_cell_center = ParagraphStyle(
        "CellCenter",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8,
        leading=10,
        alignment=1,
        textColor=colors.HexColor("#1e293b"),
    )
    style_cell_header = ParagraphStyle(
        "CellHeader",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8,
        leading=10,
        alignment=1,
        textColor=colors.white,
    )
    style_kpi_num = ParagraphStyle(
        "KpiNum",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=14,
        leading=16,
        alignment=1,
    )
    style_kpi_label = ParagraphStyle(
        "KpiLabel",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=7,
        leading=9,
        alignment=1,
        textColor=colors.HexColor("#475569"),
    )

    story = []

    # ─────────────────────────────────────────────────────────────────────────
    # 1. KOP SURAT RESMI
    # ─────────────────────────────────────────────────────────────────────────
    story.append(Paragraph(
        f"PEMERINTAH {payload.kabupaten_kota.upper()} — DINAS KESEHATAN",
        style_kop_lembaga
    ))
    story.append(Paragraph(
        f"PUSKESMAS {payload.kecamatan.upper()} — SURVEILANS GIZI BALITA",
        style_subjudul
    ))
    story.append(Spacer(1, 4))
    story.append(Paragraph(
        "REKAPITULASI LAPORAN BULANAN PENIMBANGAN BALITA (e-PPGBM)",
        style_judul_laporan
    ))
    nama_bulan = BULAN_NAMES[payload.bulan] if 1 <= payload.bulan <= 12 else str(payload.bulan)
    story.append(Paragraph(
        f"Periode Penimbangan: <b>Bulan {nama_bulan} {payload.tahun}</b>",
        style_subjudul
    ))
    story.append(Spacer(1, 10))

    # ─────────────────────────────────────────────────────────────────────────
    # 2. BANNER METADATA POSYANDU & KPI BOX
    # ─────────────────────────────────────────────────────────────────────────
    stats = hitung_statistik_laporan(payload.data_balita)

    # Info Posyandu Kiri
    info_text = (
        f"<b>Nama Posyandu :</b> {payload.nama_posyandu}<br/>"
        f"<b>Desa / Kel.    :</b> {payload.desa_kelurahan}<br/>"
        f"<b>Kecamatan      :</b> {payload.kecamatan}<br/>"
        f"<b>Kabupaten/Kota :</b> {payload.kabupaten_kota} ({payload.provinsi or 'Indonesia'})"
    )
    info_para = Paragraph(info_text, ParagraphStyle("InfoMeta", fontName="Helvetica", fontSize=8, leading=12))

    # 4 Kotak KPI Ringkasan
    kpi_total = [
        Paragraph(f"<font color='#0f172a'>{stats['total']}</font>", style_kpi_num),
        Paragraph("TOTAL BALITA", style_kpi_label),
    ]
    kpi_normal = [
        Paragraph(f"<font color='#16a34a'>{stats['normal']} ({stats['pct_normal']}%)</font>", style_kpi_num),
        Paragraph("GIZI NORMAL", style_kpi_label),
    ]
    color_stunting = "#dc2626" if stats["stunting"] > 0 else "#16a34a"
    kpi_stunting = [
        Paragraph(f"<font color='{color_stunting}'>{stats['stunting']} ({stats['pct_stunting']}%)</font>", style_kpi_num),
        Paragraph("STUNTING (PB/U < -2)", style_kpi_label),
    ]
    color_rujukan = "#ea580c" if stats["rujukan"] > 0 else "#0f172a"
    kpi_rujukan = [
        Paragraph(f"<font color='{color_rujukan}'>{stats['rujukan']}</font>", style_kpi_num),
        Paragraph("PERLU RUJUKAN", style_kpi_label),
    ]

    # Gabungkan Meta + 4 KPI dalam tabel banner lebar 770 pt
    banner_data = [
        [info_para, kpi_total, kpi_normal, kpi_stunting, kpi_rujukan]
    ]
    banner_table = Table(
        banner_data,
        colWidths=[290, 120, 120, 120, 120]
    )
    banner_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("BACKGROUND", (0, 0), (0, 0), colors.HexColor("#f8fafc")),
        ("BACKGROUND", (1, 0), (1, 0), colors.HexColor("#f1f5f9")),
        ("BACKGROUND", (2, 0), (2, 0), colors.HexColor("#dcfce7")),
        ("BACKGROUND", (3, 0), (3, 0), colors.HexColor("#fee2e2") if stats["stunting"] > 0 else colors.HexColor("#f1f5f9")),
        ("BACKGROUND", (4, 0), (4, 0), colors.HexColor("#ffedd5") if stats["rujukan"] > 0 else colors.HexColor("#f1f5f9")),
        ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#cbd5e1")),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(banner_table)
    story.append(Spacer(1, 10))

    # ─────────────────────────────────────────────────────────────────────────
    # 3. TABEL DATA PENGUKURAN BALITA (Format e-PPGBM)
    # ─────────────────────────────────────────────────────────────────────────
    # Lebar total: 770 pt
    col_widths = [25, 110, 25, 35, 40, 40, 35, 45, 45, 45, 80, 100, 45]
    table_headers = [
        Paragraph("No", style_cell_header),
        Paragraph("Nama Anak & NIK", style_cell_header),
        Paragraph("JK", style_cell_header),
        Paragraph("Usia<br/>(bln)", style_cell_header),
        Paragraph("BB<br/>(kg)", style_cell_header),
        Paragraph("TB/PB<br/>(cm)", style_cell_header),
        Paragraph("LiLA<br/>(cm)", style_cell_header),
        Paragraph("Z-Score<br/>BB/U", style_cell_header),
        Paragraph("Z-Score<br/>PB/U", style_cell_header),
        Paragraph("Z-Score<br/>BB/PB", style_cell_header),
        Paragraph("Status Gizi<br/>(WHO 2006)", style_cell_header),
        Paragraph("Catatan / Intervensi Gizi", style_cell_header),
        Paragraph("Rujuk?", style_cell_header),
    ]

    table_data = [table_headers]

    if not payload.data_balita:
        empty_row = [
            Paragraph("—", style_cell_center),
            Paragraph("<i>Belum ada data balita yang dicatat pada periode ini.</i>", style_cell_text),
            Paragraph("—", style_cell_center),
            Paragraph("—", style_cell_center),
            Paragraph("—", style_cell_center),
            Paragraph("—", style_cell_center),
            Paragraph("—", style_cell_center),
            Paragraph("—", style_cell_center),
            Paragraph("—", style_cell_center),
            Paragraph("—", style_cell_center),
            Paragraph("—", style_cell_center),
            Paragraph("—", style_cell_center),
            Paragraph("—", style_cell_center),
        ]
        table_data.append(empty_row)
    else:
        for idx, item in enumerate(payload.data_balita, start=1):
            no_urut = str(item.no if item.no is not None else idx)
            nik_text = f"<br/><font color='#64748b' size='6.5'>NIK: {item.nik}</font>" if item.nik else ""
            ibu_text = f"<br/><font color='#64748b' size='6.5'>Ibu: {item.nama_ibu}</font>" if item.nama_ibu else ""
            nama_para = Paragraph(f"<b>{item.nama_anak}</b>{nik_text}{ibu_text}", style_cell_text)

            bb_str = f"{item.berat_kg:.2f}"
            tb_str = f"{item.tinggi_cm:.1f}"
            lila_str = f"{item.lila_cm:.1f}" if item.lila_cm is not None else "—"

            zbbu_str = f"{item.zscore_bbu:.2f}" if item.zscore_bbu is not None else "—"
            zpbu_str = f"{item.zscore_pbu:.2f}" if item.zscore_pbu is not None else "—"
            zbbpb_str = f"{item.zscore_bbpb:.2f}" if item.zscore_bbpb is not None else "—"

            # Format status gizi dengan visual badge text
            status_clean = item.status_gizi.replace("_", " ").title()
            is_stunting = "pendek" in item.status_gizi.lower() or "stunting" in item.status_gizi.lower()
            is_gizi_buruk = "buruk" in item.status_gizi.lower() or "kurang" in item.status_gizi.lower()

            if is_stunting:
                status_html = f"<font color='#dc2626'><b>{status_clean}</b></font>"
            elif is_gizi_buruk:
                status_html = f"<font color='#ea580c'><b>{status_clean}</b></font>"
            else:
                status_html = f"<font color='#16a34a'><b>{status_clean}</b></font>"

            rekom_text = item.rekomendasi_singkat or "Pemantauan rutin posyandu."
            rujuk_text = "<font color='#dc2626'><b>YA</b></font>" if item.perlu_rujukan else "TIDAK"

            row = [
                Paragraph(no_urut, style_cell_center),
                nama_para,
                Paragraph(item.jenis_kelamin, style_cell_center),
                Paragraph(str(item.umur_bulan), style_cell_center),
                Paragraph(bb_str, style_cell_center),
                Paragraph(tb_str, style_cell_center),
                Paragraph(lila_str, style_cell_center),
                Paragraph(zbbu_str, style_cell_center),
                Paragraph(zpbu_str, style_cell_center),
                Paragraph(zbbpb_str, style_cell_center),
                Paragraph(status_html, style_cell_center),
                Paragraph(rekom_text, style_cell_text),
                Paragraph(rujuk_text, style_cell_center),
            ]
            table_data.append(row)

    laporan_table = Table(table_data, colWidths=col_widths, repeatRows=1)

    # Styling Table
    table_style = [
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#16a34a")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#94a3b8")),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]

    # Zebra striping untuk baris data
    for i in range(1, len(table_data)):
        if i % 2 == 0:
            table_style.append(("BACKGROUND", (0, i), (-1, i), colors.HexColor("#f8fafc")))

    laporan_table.setStyle(TableStyle(table_style))
    story.append(laporan_table)
    story.append(Spacer(1, 15))

    # ─────────────────────────────────────────────────────────────────────────
    # 4. LEMBAR TANDA TANGAN & PENGESAHAN (KEEPTOGETHER)
    # ─────────────────────────────────────────────────────────────────────────
    tgl_laporan_str = (
        payload.tanggal_laporan.strftime("%d %B %Y")
        if isinstance(payload.tanggal_laporan, date)
        else str(payload.tanggal_laporan or date.today().isoformat())
    )

    tanda_tangan_data = [
        [
            Paragraph(
                f"<b>Mengetahui,</b><br/>"
                f"Bidan Desa {payload.desa_kelurahan}<br/><br/><br/><br/>"
                f"<u><b>{payload.nama_bidan_desa or '................................................'}</b></u><br/>"
                f"NIP/STR: .......................................",
                ParagraphStyle("SignLeft", fontName="Helvetica", fontSize=8, leading=11, alignment=0)
            ),
            Paragraph(
                f"{payload.kabupaten_kota}, {tgl_laporan_str}<br/>"
                f"<b>Dibuat oleh,</b><br/>"
                f"Kader Posyandu {payload.nama_posyandu}<br/><br/><br/><br/>"
                f"<u><b>{payload.nama_kader}</b></u><br/>"
                f"Koordinator Kader Posyandu",
                ParagraphStyle("SignRight", fontName="Helvetica", fontSize=8, leading=11, alignment=2)
            ),
        ]
    ]

    ttd_table = Table(tanda_tangan_data, colWidths=[385, 385])
    ttd_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
    ]))

    story.append(KeepTogether([
        ttd_table
    ]))

    # Build PDF
    doc.build(story, canvasmaker=NumberedCanvas)
    pdf_bytes = buffer.getvalue()
    buffer.close()

    return pdf_bytes
