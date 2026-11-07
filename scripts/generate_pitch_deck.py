"""
Script to generate a professional 10-slide Pitch Deck PDF for ZeroStunting AI.
Includes dedicated System Architecture & Tech Stack diagram slide,
aligned with National Hackathon (AI for Social Good) criteria and TKT 6 specification.
"""

import os
from reportlab.lib.pagesizes import landscape
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor

# 16:9 Widescreen dimensions (points)
PAGE_WIDTH = 960
PAGE_HEIGHT = 540

# Color Palette
COLOR_BG_DARK = HexColor("#0A1120")
COLOR_BG_LIGHT = HexColor("#F8FAFC")
COLOR_CARD_DARK = HexColor("#131D31")
COLOR_CARD_LIGHT = HexColor("#FFFFFF")
COLOR_BORDER_LIGHT = HexColor("#E2E8F0")
COLOR_BORDER_DARK = HexColor("#1E293B")

COLOR_GREEN_PRIMARY = HexColor("#16A34A")
COLOR_GREEN_DARK = HexColor("#15803D")
COLOR_GREEN_LIGHT = HexColor("#DCFCE7")
COLOR_GREEN_BORDER = HexColor("#86EFAC")

COLOR_TEAL_PRIMARY = HexColor("#0EA5E9")
COLOR_TEAL_LIGHT = HexColor("#E0F2FE")
COLOR_TEAL_BORDER = HexColor("#7DD3FC")

COLOR_AMBER_PRIMARY = HexColor("#D97706")
COLOR_AMBER_LIGHT = HexColor("#FEF3C7")
COLOR_RED_PRIMARY = HexColor("#DC2626")
COLOR_RED_LIGHT = HexColor("#FEE2E2")

COLOR_TEXT_WHITE = HexColor("#FFFFFF")
COLOR_TEXT_LIGHT_MUTED = HexColor("#94A3B8")
COLOR_TEXT_DARK = HexColor("#0F172A")
COLOR_TEXT_MUTED = HexColor("#475569")
COLOR_TEXT_SUBTLE = HexColor("#64748B")


def draw_header_badge(c, text, x, y, is_dark=False):
    """Draws a pill badge for slide category/topic."""
    c.saveState()
    badge_bg = HexColor("#064E3B") if is_dark else HexColor("#DCFCE7")
    badge_border = HexColor("#059669") if is_dark else HexColor("#86EFAC")
    badge_text_color = HexColor("#34D399") if is_dark else HexColor("#15803D")
    
    font_name = "Helvetica-Bold"
    font_size = 8.5
    c.setFont(font_name, font_size)
    text_w = c.stringWidth(text, font_name, font_size)
    
    badge_h = 20
    badge_w = text_w + 20
    
    c.setFillColor(badge_bg)
    c.setStrokeColor(badge_border)
    c.setLineWidth(1)
    c.roundRect(x, y - badge_h + 5, badge_w, badge_h, 6, fill=1, stroke=1)
    
    c.setFillColor(badge_text_color)
    c.drawString(x + 10, y - badge_h + 11, text)
    c.restoreState()
    return badge_w


def draw_slide_footer(c, current_slide, total_slides=10, is_dark=False):
    """Draws the bottom branded footer."""
    c.saveState()
    y = 22
    line_color = HexColor("#1E293B") if is_dark else HexColor("#E2E8F0")
    text_color = HexColor("#64748B") if is_dark else HexColor("#94A3B8")
    accent_color = HexColor("#34D399") if is_dark else HexColor("#16A34A")
    
    c.setStrokeColor(line_color)
    c.setLineWidth(0.8)
    c.line(40, y + 16, PAGE_WIDTH - 40, y + 16)
    
    c.setFont("Helvetica-Bold", 8.5)
    c.setFillColor(accent_color)
    c.drawString(40, y, "ZeroStunting AI")
    
    c.setFont("Helvetica", 8)
    c.setFillColor(text_color)
    c.drawString(110, y, "•  Platform Intelijen Posyandu & Preskripsi Gizi Berbasis AI (Kesiapterapan: TKT 6)")
    
    slide_text = f"Tim ANANTA  |  Slide {current_slide} dari {total_slides}"
    c.drawRightString(PAGE_WIDTH - 40, y, slide_text)
    c.restoreState()


def draw_card(c, x, y, w, h, bg_color=COLOR_CARD_LIGHT, border_color=COLOR_BORDER_LIGHT, radius=12):
    """Draws a clean styled card box."""
    c.saveState()
    c.setFillColor(bg_color)
    c.setStrokeColor(border_color)
    c.setLineWidth(1.2)
    c.roundRect(x, y - h, w, h, radius, fill=1, stroke=1)
    c.restoreState()


# ==============================================================================
# SLIDE 1: TITLE & HOOK
# ==============================================================================
def build_slide_1(c):
    c.setFillColor(COLOR_BG_DARK)
    c.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, fill=1, stroke=0)
    
    c.saveState()
    c.setFillColor(HexColor("#064E3B"))
    c.circle(PAGE_WIDTH - 120, PAGE_HEIGHT - 80, 180, fill=1, stroke=0)
    c.setFillColor(HexColor("#0C4A6E"))
    c.circle(100, 80, 140, fill=1, stroke=0)
    c.setFillColor(HexColor("#0A1120"), alpha=0.88)
    c.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, fill=1, stroke=0)
    c.restoreState()
    
    draw_header_badge(c, "HACKATHON NASIONAL AI FOR SOCIAL GOOD  •  STATUS TEKNOLOGI: TKT 6", 48, 480, is_dark=True)
    
    c.setFont("Helvetica-Bold", 44)
    c.setFillColor(COLOR_TEXT_WHITE)
    c.drawString(48, 415, "ZeroStunting ")
    c.setFillColor(HexColor("#4ADE80"))
    c.drawString(48 + c.stringWidth("ZeroStunting ", "Helvetica-Bold", 44), 415, "AI")
    
    c.setFont("Helvetica", 14)
    c.setFillColor(HexColor("#CBD5E1"))
    c.drawString(48, 385, "Platform Intelijen Posyandu & Preskripsi Gizi Berbasis Artificial Intelligence")
    c.drawString(48, 365, "untuk Akselerasi Penurunan Stunting Akar Rumput Indonesia.")
    
    # Hook Callout Card
    draw_card(c, 48, 335, 540, 110, bg_color=HexColor("#131D31"), border_color=HexColor("#059669"), radius=14)
    
    c.setFont("Helvetica-Bold", 10)
    c.setFillColor(HexColor("#34D399"))
    c.drawString(68, 315, "THE HOOK & THE CRISIS")
    
    c.setFont("Helvetica-Oblique", 11)
    c.setFillColor(COLOR_TEXT_WHITE)
    c.drawString(68, 290, "\"Garis depan perang melawan stunting ada di tangan 1,5 juta kader Posyandu.")
    c.drawString(68, 272, "Namun hingga hari ini, senjata utama mereka masih secarik kertas manual")
    c.drawString(68, 254, "dan penggaris yang rentan salah ukur.\"")
    
    cards = [
        ("Kesiapterapan TKT 6 Tervalidasi", "Telah diuji & didukung LOI resmi Puskesmas Karangkancana."),
        ("100% Pure Software Solution", "Bebas hardware tambahan; siap pakai di smartphone Android kader."),
        ("WHO Anthro + Local Food AI", "Kalkulasi Z-Score presisi & preskripsi menu pangan lokal terjangkau."),
    ]
    card_y = 335
    for title, desc in cards:
        draw_card(c, 610, card_y, 302, 60, bg_color=HexColor("#101B2E"), border_color=HexColor("#1E293B"), radius=10)
        c.setFont("Helvetica-Bold", 10)
        c.setFillColor(HexColor("#38BDF8") if "TKT" in title else HexColor("#4ADE80"))
        c.drawString(625, card_y - 20, title)
        c.setFont("Helvetica", 8.5)
        c.setFillColor(HexColor("#94A3B8"))
        c.drawString(625, card_y - 36, desc)
        card_y -= 70
    
    c.setFont("Helvetica-Bold", 11)
    c.setFillColor(HexColor("#F8FAFC"))
    c.drawString(48, 185, "Tim Pengembang: ANANTA")
    c.setFont("Helvetica", 9.5)
    c.setFillColor(HexColor("#94A3B8"))
    c.drawString(48, 168, "Target Mitra: Puskesmas & Dinas Kesehatan Kabupaten/Kota  |  Kategori: TKT 3 - 6")
    
    draw_slide_footer(c, 1, 10, is_dark=True)


# ==============================================================================
# SLIDE 2: PROBLEM & NATIONAL CRISIS
# ==============================================================================
def build_slide_2(c):
    c.setFillColor(COLOR_BG_LIGHT)
    c.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, fill=1, stroke=0)
    
    draw_header_badge(c, "KRISIS NASIONAL & BOTTLENECK AKAR RUMPUT", 48, 500)
    
    c.setFont("Helvetica-Bold", 26)
    c.setFillColor(COLOR_TEXT_DARK)
    c.drawString(48, 460, "Krisis Stunting Nasional & Tiga Titik Rapuh Data Posyandu")
    
    c.setFont("Helvetica", 11)
    c.setFillColor(COLOR_TEXT_MUTED)
    c.drawString(48, 440, "Mengapa intervensi bernilai triliunan rupiah terhambat oleh bias data dan latensi pelaporan di tingkat desa?")
    
    col_w = 276
    gap = 18
    start_x = 48
    stat_y = 422
    stat_h = 50
    
    macro_stats = [
        {
            "val": "21,5%",
            "pill": "TARGET: 14%",
            "pill_color": HexColor("#9F1239"),
            "pill_bg": HexColor("#FFE4E6"),
            "label": "Prevalensi Stunting Balita Nasional",
            "cite": "~4,5 Jt balita. Sumber: SKI 2023, Kemenkes RI",
            "val_color": HexColor("#E11D48"),
            "border": HexColor("#FECDD3"),
            "bg": HexColor("#FFF1F2")
        },
        {
            "val": "2 – 3% PDB",
            "pill": "~RP 300+ T/THN",
            "pill_color": HexColor("#92400E"),
            "pill_bg": HexColor("#FEF3C7"),
            "label": "Potensi Kerugian Ekonomi Tahunan",
            "cite": "Defisit kognitif IQ (-10-15 poin). Sumber: Bank Dunia",
            "val_color": HexColor("#D97706"),
            "border": HexColor("#FDE68A"),
            "bg": HexColor("#FFFBEB")
        },
        {
            "val": "Up to 30%",
            "pill": "ERROR AKAR RUMPUT",
            "pill_color": HexColor("#334155"),
            "pill_bg": HexColor("#F1F5F9"),
            "label": "Deviasi & Latensi Data Lapangan",
            "cite": "Human error kertas & rekap lambat. Sumber: Dinkes",
            "val_color": HexColor("#475569"),
            "border": HexColor("#CBD5E1"),
            "bg": HexColor("#F8FAFC")
        }
    ]
    
    for i, ms in enumerate(macro_stats):
        sx = start_x + i * (col_w + gap)
        draw_card(c, sx, stat_y, col_w, stat_h, bg_color=ms["bg"], border_color=ms["border"], radius=8)
        c.setFont("Helvetica-Bold", 15)
        c.setFillColor(ms["val_color"])
        c.drawString(sx + 10, stat_y - 18, ms["val"])
        
        c.saveState()
        c.setFillColor(ms["pill_bg"])
        c.roundRect(sx + col_w - 90, stat_y - 19, 78, 13, 3.5, fill=1, stroke=0)
        c.setFont("Helvetica-Bold", 6.8)
        c.setFillColor(ms["pill_color"])
        c.drawCentredString(sx + col_w - 51, stat_y - 10, ms["pill"])
        c.restoreState()
        
        c.setFont("Helvetica-Bold", 8.2)
        c.setFillColor(COLOR_TEXT_DARK)
        c.drawString(sx + 10, stat_y - 31, ms["label"])
        
        c.setFont("Helvetica-Oblique", 6.8)
        c.setFillColor(COLOR_TEXT_MUTED)
        c.drawString(sx + 10, stat_y - 42, ms["cite"])
        
    top_y = 358
    card_h = 265
    
    problems = [
        {
            "num": "01",
            "tag": "AKURASI RENDAH",
            "title": "Human Error Plotting\nKMS Manual di Kertas",
            "points": [
                "Kader harus mencari titik koordinat BB & Umur di lembar grafik kertas yang padat.",
                "Salah meletakkan titik grafik menyebabkan false-negative (balita gagal tumbuh tidak terdeteksi).",
                "Deviasi plotting manual di posyandu pelosok tercatat mencapai 25% - 30% (Jurnal Gizi)."
            ],
            "stat": "30% Deviasi Data Pengukuran",
            "tag_color": COLOR_RED_PRIMARY,
            "tag_bg": COLOR_RED_LIGHT,
        },
        {
            "num": "02",
            "tag": "BIROKRASI LAMBAT",
            "title": "Beban Administrasi &\nPelaporan Lambat",
            "points": [
                "Data harus dicatat ganda: di buku register, KMS fisik, lalu direkap berhari-hari.",
                "Rata-rata 5-8 jam kader tersita hanya untuk menyalin dan merekap data penimbangan.",
                "Puskesmas baru menerima rekap 2-3 minggu kemudian, intervensi medis sudah terlambat."
            ],
            "stat": "Terlambat 2-3 Minggu ke Dinkes",
            "tag_color": COLOR_AMBER_PRIMARY,
            "tag_bg": COLOR_AMBER_LIGHT,
        },
        {
            "num": "03",
            "tag": "DEFISIT KONSELING",
            "title": "Vakum Preskripsi Gizi\nBahan Pangan Lokal",
            "points": [
                "Kader tidak dibekali takaran gizi spesifik saat mendapati anak berisiko stunting/wasting.",
                "Nasihat nutrisi sering kali bersifat umum tanpa arahan bahan murah lokal.",
                "Orang tua prasejahtera mengira makanan bergizi harus mahal (susu formula / daging sapi)."
            ],
            "stat": "Nol Panduan Menu Lokal Terukur",
            "tag_color": COLOR_GREEN_DARK,
            "tag_bg": COLOR_GREEN_LIGHT,
        }
    ]
    
    for i, p in enumerate(problems):
        cx = start_x + i * (col_w + gap)
        draw_card(c, cx, top_y, col_w, card_h, bg_color=COLOR_CARD_LIGHT, border_color=COLOR_BORDER_LIGHT, radius=12)
        
        c.saveState()
        c.setFillColor(p["tag_bg"])
        c.roundRect(cx + 14, top_y - 28, 105, 17, 5, fill=1, stroke=0)
        c.setFont("Helvetica-Bold", 7.2)
        c.setFillColor(p["tag_color"])
        c.drawString(cx + 20, top_y - 17, p["tag"])
        c.restoreState()
        
        c.setFont("Helvetica-Bold", 20)
        c.setFillColor(HexColor("#CBD5E1"))
        c.drawRightString(cx + col_w - 14, top_y - 22, p["num"])
        
        c.setFont("Helvetica-Bold", 12.5)
        c.setFillColor(COLOR_TEXT_DARK)
        t_lines = p["title"].split("\n")
        c.drawString(cx + 14, top_y - 48, t_lines[0])
        if len(t_lines) > 1:
            c.drawString(cx + 14, top_y - 63, t_lines[1])
        
        py = top_y - 84
        for pt in p["points"]:
            c.setFillColor(HexColor("#16A34A"))
            c.circle(cx + 18, py + 3, 2.2, fill=1, stroke=0)
            c.setFont("Helvetica", 8.5)
            c.setFillColor(COLOR_TEXT_MUTED)
            words = pt.split(" ")
            line1, line2 = "", ""
            for w in words:
                if c.stringWidth(line1 + " " + w, "Helvetica", 8.5) < col_w - 38:
                    line1 += (" " if line1 else "") + w
                else:
                    line2 += (" " if line2 else "") + w
            c.drawString(cx + 26, py, line1)
            if line2:
                py -= 12
                c.drawString(cx + 26, py, line2)
            py -= 15
            
        draw_card(c, cx + 12, top_y - card_h + 38, col_w - 24, 28, bg_color=p["tag_bg"], border_color=p["tag_color"], radius=7)
        c.setFont("Helvetica-Bold", 8.8)
        c.setFillColor(p["tag_color"])
        c.drawCentredString(cx + col_w / 2, top_y - card_h + 20, p["stat"])
        
    draw_slide_footer(c, 2, 10)


# ==============================================================================
# SLIDE 3: THE SOLUTION
# ==============================================================================
def build_slide_3(c):
    c.setFillColor(COLOR_BG_LIGHT)
    c.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, fill=1, stroke=0)
    
    draw_header_badge(c, "SOLUSI INOVATIF KAMI", 48, 500)
    
    c.setFont("Helvetica-Bold", 26)
    c.setFillColor(COLOR_TEXT_DARK)
    c.drawString(48, 460, "Transformasi Digital Posyandu Tanpa Beban Alat Tambahan")
    
    c.setFont("Helvetica", 11)
    c.setFillColor(COLOR_TEXT_MUTED)
    c.drawString(48, 440, "Menjadikan smartphone kader sebagai asisten cerdas kalkulasi antropometri dan gizi terpadu.")
    
    # Left Column
    draw_card(c, 48, 410, 410, 320, bg_color=HexColor("#FFFFFF"), border_color=COLOR_GREEN_BORDER, radius=14)
    
    draw_card(c, 62, 396, 382, 54, bg_color=COLOR_GREEN_LIGHT, border_color=COLOR_GREEN_BORDER, radius=10)
    c.setFont("Helvetica-Bold", 13)
    c.setFillColor(COLOR_GREEN_DARK)
    c.drawString(76, 368, "100% PURE SOFTWARE SOLUTION")
    c.setFont("Helvetica", 8.5)
    c.setFillColor(HexColor("#166534"))
    c.drawString(76, 352, "Zero Hardware Friction  •  Cukup Gunakan Smartphone Kader")
    
    points_left = [
        ("Bebas Hambatan Pengadaan Hardware", "Tidak perlu membeli timbangan IoT pintar atau sensor mahal yang sulit diperbaiki saat rusak di daerah pelosok."),
        ("Ramah Kader & Ekstra Cepat", "Antarmuka dirancang dengan teks kontras tinggi, alur validasi instan, dan tombol aksi yang jelas untuk kader lintas usia."),
        ("Offline-First & Hemat Kuota", "Tetap dapat melakukan kalkulasi Z-Score WHO secara lokal di posyandu tanpa ketergantungan sinyal internet tinggi."),
    ]
    ly = 320
    for title, desc in points_left:
        c.setFont("Helvetica-Bold", 10.5)
        c.setFillColor(COLOR_TEXT_DARK)
        c.drawString(66, ly, title)
        c.setFont("Helvetica", 8.5)
        c.setFillColor(COLOR_TEXT_MUTED)
        words = desc.split(" ")
        l1, l2 = "", ""
        for w in words:
            if c.stringWidth(l1 + " " + w, "Helvetica", 8.5) < 360:
                l1 += (" " if l1 else "") + w
            else:
                l2 += (" " if l2 else "") + w
        c.drawString(66, ly - 14, l1)
        if l2:
            c.drawString(66, ly - 27, l2)
        ly -= 46
        
    draw_card(c, 62, 160, 382, 50, bg_color=HexColor("#F0FDF4"), border_color=COLOR_GREEN_PRIMARY, radius=8)
    c.setFont("Helvetica-Bold", 12)
    c.setFillColor(COLOR_GREEN_DARK)
    c.drawString(78, 134, "5 Menit Manual  ➔  15 Detik Digital")
    c.setFont("Helvetica", 8.5)
    c.setFillColor(HexColor("#166534"))
    c.drawString(78, 120, "Efisiensi waktu hingga 95% per balita dengan akurasi 100% standar WHO.")

    # Right Column
    rx = 480
    rw = 432
    steps = [
        ("Langkah 1: Input Multi-Modal", "Pencatatan Cepat di Posyandu", "Kader menginput via Form Cepat Otomatis, Dikte Suara (Voice AI), atau Scan Foto KMS manual."),
        ("Langkah 2: Mesin Intelijen AI", "Kalkulasi WHO & Resep Gizi", "Z-Score (BB/U, PB/U, BB/PB) terhitung otomatis. Rekomendasi 5 menu pangan lokal langsung tersaji."),
        ("Langkah 3: Sinkronisasi Kebijakan", "Laporan 1-Klik ke Puskesmas", "Data teragregasi langsung ke Peta Sebaran Stunting Dinas Kesehatan & format ekspor e-PPGBM resmi.")
    ]
    sy = 410
    for num, (title, sub, desc) in enumerate(steps, 1):
        draw_card(c, rx, sy, rw, 96, bg_color=HexColor("#FFFFFF"), border_color=HexColor("#E2E8F0"), radius=12)
        
        c.setFillColor(HexColor("#DCFCE7"))
        c.circle(rx + 36, sy - 48, 20, fill=1, stroke=0)
        c.setFont("Helvetica-Bold", 14)
        c.setFillColor(COLOR_GREEN_DARK)
        c.drawCentredString(rx + 36, sy - 53, str(num))
        
        c.setFont("Helvetica-Bold", 8.5)
        c.setFillColor(HexColor("#0EA5E9"))
        c.drawString(rx + 72, sy - 24, title.upper())
        
        c.setFont("Helvetica-Bold", 12)
        c.setFillColor(COLOR_TEXT_DARK)
        c.drawString(rx + 72, sy - 42, sub)
        
        c.setFont("Helvetica", 9)
        c.setFillColor(COLOR_TEXT_MUTED)
        c.drawString(rx + 72, sy - 60, desc[:58])
        c.drawString(rx + 72, sy - 74, desc[58:])
        
        sy -= 112
        
    draw_slide_footer(c, 3, 10)


# ==============================================================================
# SLIDE 4: KEY FEATURES
# ==============================================================================
def build_slide_4(c):
    c.setFillColor(COLOR_BG_LIGHT)
    c.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, fill=1, stroke=0)
    
    draw_header_badge(c, "ARSITEKTUR & FITUR UTAMA", 48, 500)
    
    c.setFont("Helvetica-Bold", 26)
    c.setFillColor(COLOR_TEXT_DARK)
    c.drawString(48, 460, "Empat Mesin Teknologi Cerdas ZeroStunting AI")
    
    c.setFont("Helvetica", 11)
    c.setFillColor(COLOR_TEXT_MUTED)
    c.drawString(48, 440, "Solusi terintegrasi dari meja timbang akar rumput hingga pembuat kebijakan kesehatan.")
    
    gw = 422
    gh = 150
    coords = [
        (48, 410),   # Top Left
        (490, 410),  # Top Right
        (48, 245),   # Bottom Left
        (490, 245),  # Bottom Right
    ]
    
    features = [
        {
            "tag": "INPUT CERDAS",
            "tag_color": COLOR_TEAL_PRIMARY,
            "tag_bg": COLOR_TEAL_LIGHT,
            "title": "1. Hybrid Input Engine (Multi-Modal)",
            "bullets": [
                "Formulir kilat dengan otomatisasi reset & autofocus ke nama balita.",
                "Voice-to-Text bahasa Indonesia untuk kader yang ingin mendiktekan hasil.",
                "Vision AI / OCR untuk scan foto KMS dan ekstraksi angka secara instan."
            ]
        },
        {
            "tag": "STANDAR DUNIA",
            "tag_color": COLOR_GREEN_DARK,
            "tag_bg": COLOR_GREEN_LIGHT,
            "title": "2. WHO Anthro Precision Engine",
            "bullets": [
                "Kalkulasi Z-Score real-time (BB/U, PB/U, BB/PB, LK/U, LiLA) standar WHO.",
                "Klasifikasi otomatis: Severely Stunted, Stunted, Normal, Tinggi, Wasting.",
                "Grafik pertumbuhan interaktif digital pengganti garis manual KMS kertas."
            ]
        },
        {
            "tag": "EDUKASI AKSI",
            "tag_color": COLOR_AMBER_PRIMARY,
            "tag_bg": COLOR_AMBER_LIGHT,
            "title": "3. RAG LLM Local Food Advisory",
            "bullets": [
                "Generative AI pemberi rekomendasi 5 jadwal makan balita per hari.",
                "Mengutamakan pangan lokal murah & padat gizi (hati ayam, ikan kembung, telur, kelor).",
                "Format edukasi WhatsApp 1-klik untuk dikirimkan langsung ke orang tua."
            ]
        },
        {
            "tag": "INTEGRASI DINKES",
            "tag_color": HexColor("#6366F1"),
            "tag_bg": HexColor("#EEF2FF"),
            "title": "4. Auto-Report e-PPGBM & GIS Map",
            "bullets": [
                "Ekspor rekapitulasi data bulanan posyandu sesuai format resmi Puskesmas/Kemenkes.",
                "Peta Sebaran Stunting Geospasial interaktif memetakan zona hijau, kuning, dan merah.",
                "Pengelolaan multi-unit Posyandu terpusat untuk kontrol monitoring kepala puskesmas."
            ]
        }
    ]
    
    for (x, y), feat in zip(coords, features):
        draw_card(c, x, y, gw, gh, bg_color=COLOR_CARD_LIGHT, border_color=COLOR_BORDER_LIGHT, radius=12)
        
        c.saveState()
        c.setFillColor(feat["tag_bg"])
        c.roundRect(x + 16, y - 28, 90, 18, 5, fill=1, stroke=0)
        c.setFont("Helvetica-Bold", 7.5)
        c.setFillColor(feat["tag_color"])
        c.drawString(x + 24, y - 16, feat["tag"])
        c.restoreState()
        
        c.setFont("Helvetica-Bold", 12.5)
        c.setFillColor(COLOR_TEXT_DARK)
        c.drawString(x + 16, y - 48, feat["title"])
        
        by = y - 72
        for b in feat["bullets"]:
            c.setFillColor(feat["tag_color"])
            c.circle(x + 20, by + 3, 2.5, fill=1, stroke=0)
            c.setFont("Helvetica", 9)
            c.setFillColor(COLOR_TEXT_MUTED)
            c.drawString(x + 30, by, b)
            by -= 22
            
    draw_slide_footer(c, 4, 10)


# ==============================================================================
# SLIDE 5: SYSTEM ARCHITECTURE & TECH STACK  <-- NEW DEDICATED SLIDE!
# ==============================================================================
def build_slide_5(c):
    c.setFillColor(COLOR_BG_LIGHT)
    c.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, fill=1, stroke=0)
    
    draw_header_badge(c, "RANCANGAN ARSITEKTUR TEKNOLOGI  •  TKT 6 ARCHITECTURE", 48, 500)
    
    c.setFont("Helvetica-Bold", 26)
    c.setFillColor(COLOR_TEXT_DARK)
    c.drawString(48, 460, "Arsitektur Sistem & Alur Rekayasa ZeroStunting AI")
    
    c.setFont("Helvetica", 11)
    c.setFillColor(COLOR_TEXT_MUTED)
    c.drawString(48, 440, "Arsitektur 4-Tier: Client Web App Mobile-First, Backend Async, Layanan AI Multimodal, dan Gov-Tech Interoperability.")
    
    # 4 Horizontal Tier Cards Stacked
    ty = 410
    card_w = 864
    layer_h = 68
    gap_y = 10
    
    layers = [
        {
            "tier": "TIER 1 • CLIENT & EDGE LAYER (KADER & DINKES)",
            "tier_color": COLOR_TEAL_PRIMARY,
            "tier_bg": COLOR_TEAL_LIGHT,
            "title": "Mobile-First Responsive Web Application",
            "tech": "Next.js 16 (App Router) • TypeScript • Vanilla CSS • Local Storage Cache",
            "desc": "Antarmuka ramah kader dengan autofocus & auto-clear, mode hemat kuota & caching, serta adaptif di smartphone Android minim spesifikasi."
        },
        {
            "tier": "TIER 2 • CORE BACKEND & COMPUTATION SERVICE",
            "tier_color": COLOR_GREEN_DARK,
            "tier_bg": COLOR_GREEN_LIGHT,
            "title": "High-Throughput Asynchronous API",
            "tech": "FastAPI (Python 3.12) • Pydantic Schema Validation • SQLAlchemy • Supabase/PostgreSQL",
            "desc": "Pemrosesan data multi-unit posyandu cepat, audit log otomatis, dan Row-Level Security (RLS) untuk perlindungan data medis balita."
        },
        {
            "tier": "TIER 3 • ARTIFICIAL INTELLIGENCE & ANALYTIC SERVICES",
            "tier_color": COLOR_AMBER_PRIMARY,
            "tier_bg": COLOR_AMBER_LIGHT,
            "title": "Multi-Modal AI Pipeline (Voice, Vision, & RAG LLM)",
            "tech": "Vision AI (OCR Tesseract/Vision) • Web Speech / Whisper • WHO Anthro Engine (NumPy) • RAG Local Food",
            "desc": "Ekstraksi data KMS fisik, dikte suara bahasa Indonesia, Z-Score akurat baku WHO, dan preskripsi gizi pangan lokal terukur (TKPI Kemenkes)."
        },
        {
            "tier": "TIER 4 • GOV-TECH & INTEROPERABILITY LAYER",
            "tier_color": HexColor("#6366F1"),
            "tier_bg": HexColor("#EEF2FF"),
            "title": "Standarisasi e-PPGBM & Sistem Satu Data Kesehatan",
            "tech": "OpenPyXL / Pandas Exporter • GeoJSON / Leaflet Engine • REST API Gateway",
            "desc": "Ekspor laporan bulanan 1-klik 100% kompatibel format resmi Puskesmas serta visualisasi Peta Geospasial sebaran stunting per posyandu."
        }
    ]
    
    for lyr in layers:
        draw_card(c, 48, ty, card_w, layer_h, bg_color=COLOR_CARD_LIGHT, border_color=COLOR_BORDER_LIGHT, radius=10)
        
        # Left Tag Pill
        c.saveState()
        c.setFillColor(lyr["tier_bg"])
        c.roundRect(62, ty - 26, 230, 18, 4, fill=1, stroke=0)
        c.setFont("Helvetica-Bold", 7.2)
        c.setFillColor(lyr["tier_color"])
        c.drawString(70, ty - 14, lyr["tier"])
        c.restoreState()
        
        # Right Tech Stack Pill
        c.setFont("Helvetica-Bold", 8.5)
        c.setFillColor(HexColor("#334155"))
        c.drawRightString(48 + card_w - 18, ty - 16, lyr["tech"])
        
        # Title
        c.setFont("Helvetica-Bold", 12)
        c.setFillColor(COLOR_TEXT_DARK)
        c.drawString(62, ty - 42, lyr["title"])
        
        # Description
        c.setFont("Helvetica", 8.8)
        c.setFillColor(COLOR_TEXT_MUTED)
        c.drawString(62, ty - 56, lyr["desc"])
        
        ty -= (layer_h + gap_y)
        
    # Bottom Security & Offline Summary Box
    draw_card(c, 48, ty + 2, card_w, 32, bg_color=HexColor("#F0FDF4"), border_color=COLOR_GREEN_PRIMARY, radius=8)
    c.setFont("Helvetica-Bold", 9.2)
    c.setFillColor(COLOR_GREEN_DARK)
    c.drawString(62, ty - 18, "🔒 Prinsip Rekayasa:")
    c.setFont("Helvetica", 8.8)
    c.setFillColor(HexColor("#166534"))
    c.drawString(170, ty - 18, "100% Pure Software, Offline-First Architecture, Zero Data Leakage, dan Kompatibel Penuh Skema e-PPGBM Kemenkes RI.")
    
    draw_slide_footer(c, 5, 10)


# ==============================================================================
# SLIDE 6: VALIDASI LINGKUNGAN RELEVAN (BUKTI TKT 6)
# ==============================================================================
def build_slide_6(c):
    c.setFillColor(COLOR_BG_LIGHT)
    c.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, fill=1, stroke=0)
    
    draw_header_badge(c, "BUKTI VALIDASI LINGKUNGAN RELEVAN  •  STATUS: TKT 6", 48, 500)
    
    c.setFont("Helvetica-Bold", 26)
    c.setFillColor(COLOR_TEXT_DARK)
    c.drawString(48, 460, "Uji Lapangan Terbatas & Validasi Prototipe (TKT 6)")
    
    c.setFont("Helvetica", 11)
    c.setFillColor(COLOR_TEXT_MUTED)
    c.drawString(48, 440, "Prototipe sistem telah diuji fungsi langsung di lingkungan relevan bersama kader Posyandu dan tenaga gizi.")
    
    col_w = 276
    gap = 18
    start_x = 48
    top_y = 412
    card_h = 265
    
    evidences = [
        {
            "tag": "UJI RELEVAN",
            "tag_color": COLOR_TEAL_PRIMARY,
            "tag_bg": COLOR_TEAL_LIGHT,
            "title": "Pilot Testing di\nPosyandu Percontohan",
            "points": [
                "Prototipe diuji coba langsung di meja penimbangan Posyandu Dahlia 01-03.",
                "Melibatkan kader kesehatan riil untuk memvalidasi alur input puluhan data balita.",
                "Uji kebergunaan (usability) membuktikan antarmuka ramah kader lintas usia (>45 thn)."
            ],
            "badge": "Pilot Testing Lingkungan Relevan",
            "highlight": "Lingkungan Relevan"
        },
        {
            "tag": "ITERASI PENGGUNA",
            "tag_color": COLOR_GREEN_DARK,
            "tag_bg": COLOR_GREEN_LIGHT,
            "title": "Inovasi Lahir dari\nKebutuhan Riil Kader",
            "points": [
                "Fitur Auto-Clear & Autofocus ke nama balita lahir langsung dari keluhan kader saat hari timbang.",
                "Integrasi menu pangan lokal terjangkau (ikan kembung, telur puyuh, santan) sesuai daya beli.",
                "Manajemen multi-unit Posyandu disesuaikan dengan struktur wilayah binaan Puskesmas."
            ],
            "badge": "User-Driven Features",
            "highlight": "Feedback Lapangan"
        },
        {
            "tag": "VALIDITAS MEDIS",
            "tag_color": HexColor("#6366F1"),
            "tag_bg": HexColor("#EEF2FF"),
            "title": "Validasi Formula &\nKesesuaian e-PPGBM",
            "points": [
                "Presisi matematis formula Z-Score terverifikasi sesuai rujukan WHO & Permenkes No. 2/2020.",
                "Skema ekspor laporan bulanan telah dicocokkan dengan format resmi Puskesmas (e-PPGBM).",
                "Mendapat konfirmasi kesesuaian dan respon positif Tenaga Pelaksana Gizi (TPG) Puskesmas."
            ],
            "badge": "Standar Baku WHO & Kemenkes",
            "highlight": "Akurasi Medis"
        }
    ]
    
    for i, ev in enumerate(evidences):
        cx = start_x + i * (col_w + gap)
        draw_card(c, cx, top_y, col_w, card_h, bg_color=COLOR_CARD_LIGHT, border_color=COLOR_BORDER_LIGHT, radius=12)
        
        c.saveState()
        c.setFillColor(ev["tag_bg"])
        c.roundRect(cx + 14, top_y - 28, 105, 17, 5, fill=1, stroke=0)
        c.setFont("Helvetica-Bold", 7.2)
        c.setFillColor(ev["tag_color"])
        c.drawString(cx + 20, top_y - 17, ev["tag"])
        c.restoreState()
        
        c.setFont("Helvetica-Bold", 9.5)
        c.setFillColor(COLOR_TEXT_SUBTLE)
        c.drawRightString(cx + col_w - 14, top_y - 17, ev["highlight"])
        
        c.setFont("Helvetica-Bold", 12.5)
        c.setFillColor(COLOR_TEXT_DARK)
        t_lines = ev["title"].split("\n")
        c.drawString(cx + 14, top_y - 48, t_lines[0])
        if len(t_lines) > 1:
            c.drawString(cx + 14, top_y - 63, t_lines[1])
            
        py = top_y - 84
        for pt in ev["points"]:
            c.setFillColor(COLOR_GREEN_PRIMARY)
            c.circle(cx + 18, py + 3, 2.2, fill=1, stroke=0)
            c.setFont("Helvetica", 8.5)
            c.setFillColor(COLOR_TEXT_MUTED)
            words = pt.split(" ")
            l1, l2 = "", ""
            for w in words:
                if c.stringWidth(l1 + " " + w, "Helvetica", 8.5) < col_w - 38:
                    l1 += (" " if l1 else "") + w
                else:
                    l2 += (" " if l2 else "") + w
            c.drawString(cx + 26, py, l1)
            if l2:
                py -= 12
                c.drawString(cx + 26, py, l2)
            py -= 15
            
        draw_card(c, cx + 12, top_y - card_h + 38, col_w - 24, 28, bg_color=ev["tag_bg"], border_color=ev["tag_color"], radius=7)
        c.setFont("Helvetica-Bold", 8.8)
        c.setFillColor(ev["tag_color"])
        c.drawCentredString(cx + col_w / 2, top_y - card_h + 20, ev["badge"])
        
    # LOI Banner at bottom of Slide 6
    loi_y = 138
    loi_w = PAGE_WIDTH - 96
    loi_h = 48
    draw_card(c, 48, loi_y, loi_w, loi_h, bg_color=HexColor("#F0FDF4"), border_color=COLOR_GREEN_PRIMARY, radius=9)
    
    c.setFont("Helvetica-Bold", 9.5)
    c.setFillColor(COLOR_GREEN_DARK)
    c.drawString(64, loi_y - 17, "DUKUNGAN MITRA RESMI: LETTER OF INTENT (LOI) PUSKESMAS KARANGKANCANA")
    
    c.setFont("Helvetica", 8)
    c.setFillColor(HexColor("#166534"))
    c.drawString(64, loi_y - 30, "Purwarupa sistem telah diuji coba & mendapatkan Surat Pernyataan Dukungan Mitra (LOI Resmi) dari Kepala Puskesmas")
    c.drawString(64, loi_y - 41, "& Petugas Gizi Puskesmas Karangkancana untuk implementasi percepatan digitalisasi posyandu dan pelaporan e-PPGBM.")
    
    c.saveState()
    c.setFillColor(COLOR_GREEN_LIGHT)
    c.roundRect(48 + loi_w - 156, loi_y - 34, 142, 20, 5, fill=1, stroke=0)
    c.setFont("Helvetica-Bold", 8.2)
    c.setFillColor(COLOR_GREEN_DARK)
    c.drawCentredString(48 + loi_w - 85, loi_y - 21, "✓ Dokumen LOI Sah Terlampir")
    c.restoreState()
    
    draw_slide_footer(c, 6, 10)


# ==============================================================================
# SLIDE 7: BUSINESS MODEL & COST STRUCTURE (BMC)
# ==============================================================================
def build_slide_7(c):
    c.setFillColor(COLOR_BG_LIGHT)
    c.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, fill=1, stroke=0)
    
    draw_header_badge(c, "MODEL BISNIS B2G & B2B2G  •  UNIT ECONOMICS & COGS AI", 48, 500)
    
    c.setFont("Helvetica-Bold", 26)
    c.setFillColor(COLOR_TEXT_DARK)
    c.drawString(48, 460, "Model Monetisasi Terpusat: Siapa yang Membiayai?")
    
    c.setFont("Helvetica", 11)
    c.setFillColor(COLOR_TEXT_MUTED)
    c.drawString(48, 440, "Puskesmas & Kader 100% BEBAS BIAYA (Sesuai LOI). Pendanaan terpusat via Dinas Kesehatan, Dana Desa, & CSR BUMN.")
    
    col_w = 424
    gap = 16
    start_x = 48
    top_y = 412
    card_h = 275
    
    # -------------------------------------------------------------
    # LEFT CARD: SISI PENDAPATAN (SUMBER ANGGARAN RESMI)
    # -------------------------------------------------------------
    lx = start_x
    draw_card(c, lx, top_y, col_w, card_h, bg_color=COLOR_CARD_LIGHT, border_color=COLOR_TEAL_BORDER, radius=12)
    
    # Header Left
    c.setFont("Helvetica-Bold", 10.5)
    c.setFillColor(COLOR_TEAL_PRIMARY)
    c.drawString(lx + 14, top_y - 20, "SISI PENDAPATAN (SUMBER ANGGARAN RESMI)")
    
    c.saveState()
    c.setFillColor(COLOR_TEAL_LIGHT)
    c.roundRect(lx + col_w - 95, top_y - 24, 82, 15, 3.5, fill=1, stroke=0)
    c.setFont("Helvetica-Bold", 7.5)
    c.setFillColor(HexColor("#0369A1"))
    c.drawCentredString(lx + col_w - 54, top_y - 13.5, "ANNUAL SAAS")
    c.restoreState()
    
    # Tier 1 Box
    t1_y = top_y - 32
    draw_card(c, lx + 12, t1_y, col_w - 24, 60, bg_color=HexColor("#F8FAFC"), border_color=COLOR_BORDER_LIGHT, radius=8)
    c.setFont("Helvetica-Bold", 9.2)
    c.setFillColor(COLOR_TEXT_DARK)
    c.drawString(lx + 20, t1_y - 18, "1. Pengadaan Terpusat Dinas Kesehatan (DAK/APBD)")
    c.setFont("Helvetica-Bold", 9.2)
    c.setFillColor(COLOR_TEAL_PRIMARY)
    c.drawRightString(lx + col_w - 20, t1_y - 18, "Rp 150 – 350 Jt / Thn")
    c.setFont("Helvetica", 7.8)
    c.setFillColor(COLOR_TEXT_MUTED)
    c.drawString(lx + 20, t1_y - 33, "Pengadaan lisensi satu pintu kabupaten untuk 15–35 Puskesmas. Seluruh Puskesmas")
    c.drawString(lx + 20, t1_y - 46, "(termasuk mitra LOI Puskesmas Karangkancana) mendapat akses 100% Gratis.")
    
    # Tier 2 Box
    t2_y = t1_y - 66
    draw_card(c, lx + 12, t2_y, col_w - 24, 60, bg_color=HexColor("#F8FAFC"), border_color=COLOR_BORDER_LIGHT, radius=8)
    c.setFont("Helvetica-Bold", 9.2)
    c.setFillColor(COLOR_TEXT_DARK)
    c.drawString(lx + 20, t2_y - 18, "2. Alokasi Dana Desa Mandiri (Mandat APBDes)")
    c.setFont("Helvetica-Bold", 9.2)
    c.setFillColor(COLOR_GREEN_DARK)
    c.drawRightString(lx + col_w - 20, t2_y - 18, "Rp 2 – 3 Jt / Thn")
    c.setFont("Helvetica", 7.8)
    c.setFillColor(COLOR_TEXT_MUTED)
    c.drawString(lx + 20, t2_y - 33, "Pemerintah Desa mengalokasikan Dana Desa (mandat wajib 10–20% stunting Kemendesa)")
    c.drawString(lx + 20, t2_y - 46, "untuk digitalisasi 2–5 posyandu desa, tanpa membebani kas internal Puskesmas.")
    
    # Tier 3 Box
    t3_y = t2_y - 66
    draw_card(c, lx + 12, t3_y, col_w - 24, 60, bg_color=HexColor("#F8FAFC"), border_color=COLOR_BORDER_LIGHT, radius=8)
    c.setFont("Helvetica-Bold", 9.2)
    c.setFillColor(COLOR_TEXT_DARK)
    c.drawString(lx + 20, t3_y - 18, "3. Kemitraan CSR / ESG BUMN & Korporasi (B2B2G)")
    c.setFont("Helvetica-Bold", 9.2)
    c.setFillColor(HexColor("#4338CA"))
    c.drawRightString(lx + col_w - 20, t3_y - 18, "Rp 50 – 100 Jt / Thn")
    c.setFont("Helvetica", 7.8)
    c.setFillColor(COLOR_TEXT_MUTED)
    c.drawString(lx + 20, t3_y - 33, "Sponsorship program TJSL BUMN/swasta untuk adopsi posyandu daerah 3T/prioritas,")
    c.drawString(lx + 20, t3_y - 46, "membiayai seluruh infrastruktur AI & operasional posyandu di wilayah binaan.")
    
    # Left Bottom Stat
    draw_card(c, lx + 12, top_y - card_h + 38, col_w - 24, 28, bg_color=COLOR_TEAL_LIGHT, border_color=COLOR_TEAL_BORDER, radius=6)
    c.setFont("Helvetica-Bold", 8.5)
    c.setFillColor(HexColor("#0369A1"))
    c.drawCentredString(lx + col_w / 2, top_y - card_h + 20, "✓ Sesuai LOI Karangkancana: Puskesmas & Kader Rp 0 (Bebas Biaya)")
    
    # -------------------------------------------------------------
    # RIGHT CARD: SISI BIAYA & UNIT ECONOMICS
    # -------------------------------------------------------------
    rx = start_x + col_w + gap
    draw_card(c, rx, top_y, col_w, card_h, bg_color=COLOR_CARD_LIGHT, border_color=COLOR_GREEN_BORDER, radius=12)
    
    # Header Right
    c.setFont("Helvetica-Bold", 10.5)
    c.setFillColor(COLOR_GREEN_DARK)
    c.drawString(rx + 14, top_y - 20, "SISI BIAYA & UNIT ECONOMICS")
    
    c.saveState()
    c.setFillColor(COLOR_GREEN_LIGHT)
    c.roundRect(rx + col_w - 95, top_y - 24, 82, 15, 3.5, fill=1, stroke=0)
    c.setFont("Helvetica-Bold", 7.5)
    c.setFillColor(COLOR_GREEN_DARK)
    c.drawCentredString(rx + col_w - 54, top_y - 13.5, "MARGIN >65%")
    c.restoreState()
    
    # COGS Box
    cogs_y = top_y - 32
    draw_card(c, rx + 12, cogs_y, col_w - 24, 88, bg_color=HexColor("#F0FDF4"), border_color=HexColor("#BBF7D0"), radius=8)
    c.setFont("Helvetica-Bold", 9)
    c.setFillColor(COLOR_GREEN_DARK)
    c.drawString(rx + 20, cogs_y - 16, "Biaya Variabel Komputasi AI (COGS per Posyandu/Bulan):")
    
    c.setFont("Helvetica", 8)
    c.setFillColor(HexColor("#166534"))
    c.drawString(rx + 20, cogs_y - 32, "• Cloud Server & Database   : ~Rp 7.000 / bln")
    c.drawString(rx + 215, cogs_y - 32, "• Voice AI (Speech) : ~Rp 8.000 / bln")
    c.drawString(rx + 20, cogs_y - 48, "• Vision OCR KMS            : ~Rp 7.000 / bln")
    c.drawString(rx + 215, cogs_y - 48, "• RAG LLM Gizi Lokal: ~Rp 3.000 / bln")
    
    c.setStrokeColor(COLOR_GREEN_BORDER)
    c.setLineWidth(0.8)
    c.setDash([2, 2])
    c.line(rx + 20, cogs_y - 58, rx + col_w - 20, cogs_y - 58)
    c.setDash([])
    
    c.setFont("Helvetica-Bold", 8.8)
    c.setFillColor(COLOR_GREEN_DARK)
    c.drawString(rx + 20, cogs_y - 74, "👉 Total Beban COGS AI: Hanya ~Rp 25.000 / Posyandu / Bulan")
    
    # Unit Economics Box
    ue_y = cogs_y - 94
    draw_card(c, rx + 12, ue_y, col_w - 24, 98, bg_color=HexColor("#F8FAFC"), border_color=COLOR_BORDER_LIGHT, radius=8)
    c.setFont("Helvetica-Bold", 9)
    c.setFillColor(COLOR_TEXT_DARK)
    c.drawString(rx + 20, ue_y - 16, "Analisis Unit Economics & Margin Sehat:")
    
    c.setFont("Helvetica", 8)
    c.setFillColor(COLOR_TEXT_MUTED)
    c.drawString(rx + 20, ue_y - 32, "• Rata-rata Nilai Lisensi per Posyandu : ~Rp 75.000 / bulan")
    c.drawString(rx + 20, ue_y - 46, "• Biaya Komputasi AI per Posyandu      : ~Rp 25.000 / bulan")
    c.setFont("Helvetica-Bold", 8.5)
    c.setFillColor(COLOR_GREEN_DARK)
    c.drawString(rx + 20, ue_y - 62, "• GROSS PROFIT MARGIN : > 66% (Surplus Sangat Sehat & Scalable)")
    c.setFont("Helvetica", 7.8)
    c.setFillColor(COLOR_TEXT_MUTED)
    c.drawString(rx + 20, ue_y - 78, "• Alokasi Biaya Tetap (OPEX) : Pelatihan TOT kader, DevOps, & audit UU PDP.")
    
    # Right Bottom Stat
    draw_card(c, rx + 12, top_y - card_h + 38, col_w - 24, 28, bg_color=COLOR_GREEN_LIGHT, border_color=COLOR_GREEN_BORDER, radius=6)
    c.setFont("Helvetica-Bold", 8.5)
    c.setFillColor(COLOR_GREEN_DARK)
    c.drawCentredString(rx + col_w / 2, top_y - card_h + 20, "✓ High-Margin SaaS: Biaya Variabel AI Tertutup Penuh")
    
    # -------------------------------------------------------------
    # BOTTOM BANNER (GUARANTEE)
    # -------------------------------------------------------------
    ban_y = 126
    ban_w = PAGE_WIDTH - 96
    ban_h = 44
    draw_card(c, 48, ban_y, ban_w, ban_h, bg_color=HexColor("#F0FDF4"), border_color=COLOR_GREEN_PRIMARY, radius=8)
    
    c.setFont("Helvetica-Bold", 8.8)
    c.setFillColor(HexColor("#166534"))
    c.drawString(64, ban_y - 17, "Prinsip Bebas Biaya Layanan Kesehatan:")
    c.setFont("Helvetica", 7.8)
    c.drawString(64, ban_y - 30, "Puskesmas & Kader Posyandu 100% BEBAS BIAYA (Sesuai klausul sah LOI Puskesmas Karangkancana).")
    c.drawString(64, ban_y - 41, "Pendanaan operasional dibebankan terpusat ke APBD Dinkes Kab/Kota, Alokasi Dana Desa, & Kemitraan CSR BUMN.")
    
    c.saveState()
    c.setFillColor(COLOR_GREEN_LIGHT)
    c.roundRect(48 + ban_w - 150, ban_y - 32, 136, 20, 5, fill=1, stroke=0)
    c.setFont("Helvetica-Bold", 8)
    c.setFillColor(COLOR_GREEN_DARK)
    c.drawCentredString(48 + ban_w - 82, ban_y - 19, "✓ 100% Selaras Klausul LOI")
    c.restoreState()
    
    draw_slide_footer(c, 7, 10)


# ==============================================================================
# SLIDE 8: TARGET MARKET & IMPACT
# ==============================================================================
def build_slide_8(c):
    c.setFillColor(COLOR_BG_LIGHT)
    c.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, fill=1, stroke=0)
    
    draw_header_badge(c, "SKALABILITAS & DAMPAK SOSIAL", 48, 500)
    
    c.setFont("Helvetica-Bold", 26)
    c.setFillColor(COLOR_TEXT_DARK)
    c.drawString(48, 460, "Skalabilitas Pasar & Dampak Sosial Nyata")
    
    c.setFont("Helvetica", 11)
    c.setFillColor(COLOR_TEXT_MUTED)
    c.drawString(48, 440, "Potensi penetrasi nasional menuju target penurunan stunting berkelanjutan.")
    
    bw = 270
    bg_y = 410
    bh = 80
    stats = [
        ("300.000+", "Unit Posyandu Aktif", "Target pasar akar rumput di 38 provinsi Indonesia"),
        ("1,5 JUTA+", "Kader Posyandu", "Tenaga penggerak yang siap diberdayakan digital"),
        ("514", "Dinkes Kab / Kota", "Instansi B2G dengan alokasi mandatory APBD stunting")
    ]
    for i, (val, title, desc) in enumerate(stats):
        bx = 48 + i * (bw + 27)
        draw_card(c, bx, bg_y, bw, bh, bg_color=HexColor("#FFFFFF"), border_color=COLOR_GREEN_BORDER, radius=12)
        c.setFont("Helvetica-Bold", 22)
        c.setFillColor(COLOR_GREEN_DARK)
        c.drawString(bx + 18, bg_y - 30, val)
        c.setFont("Helvetica-Bold", 11)
        c.setFillColor(COLOR_TEXT_DARK)
        c.drawString(bx + 18, bg_y - 48, title)
        c.setFont("Helvetica", 8)
        c.setFillColor(COLOR_TEXT_SUBTLE)
        c.drawString(bx + 18, bg_y - 64, desc)
        
    card_w = 270
    card_h = 205
    iy = 305
    
    impacts = [
        {
            "icon": "⏱️",
            "title": "Efisiensi Waktu 70%",
            "sub": "Kader Tidak Lagi Lembur Rekap",
            "text": "Waktu pengukuran balita dipangkas dari 5 menit menjadi 15 detik. Kader tidak lagi harus menyalin catatan manual ke buku register berulang-ulang, sehingga fokus mereka beralih ke konseling hangat dengan ibu balita."
        },
        {
            "icon": "🎯",
            "title": "Deteksi 3x Lebih Cepat",
            "sub": "Cegah Stunting Sebelum Terlambat",
            "text": "Dengan kurva Z-score otomatis, penurunan pertumbuhan (growth faltering) terdeteksi saat masih tahap risiko awal, memungkinkan intervensi gizi pangan lokal langsung diberikan sebelum anak mengalami stunting permanen."
        },
        {
            "icon": "📊",
            "title": "Data Real-Time Pemda",
            "sub": "Zero-Latency Decision Making",
            "text": "Kepala Puskesmas dan Dinas Kesehatan dapat memantau angka penimbangan pada hari H kegiatan, mengidentifikasi kantong-kantong desa rawan gizi buruk tanpa harus menunggu laporan bulanan berjenjang."
        }
    ]
    
    for i, imp in enumerate(impacts):
        ix = 48 + i * (card_w + 27)
        draw_card(c, ix, iy, card_w, card_h, bg_color=COLOR_CARD_LIGHT, border_color=COLOR_BORDER_LIGHT, radius=12)
        
        c.setFont("Helvetica", 20)
        c.drawString(ix + 18, iy - 32, imp["icon"])
        
        c.setFont("Helvetica-Bold", 14)
        c.setFillColor(COLOR_TEXT_DARK)
        c.drawString(ix + 18, iy - 60, imp["title"])
        
        c.setFont("Helvetica-Bold", 9)
        c.setFillColor(HexColor("#0EA5E9"))
        c.drawString(ix + 18, iy - 78, imp["sub"].upper())
        
        c.setFont("Helvetica", 9)
        c.setFillColor(COLOR_TEXT_MUTED)
        words = imp["text"].split(" ")
        ty = iy - 98
        line = ""
        for w in words:
            if c.stringWidth(line + " " + w, "Helvetica", 9) < card_w - 36:
                line += (" " if line else "") + w
            else:
                c.drawString(ix + 18, ty, line)
                ty -= 13
                line = w
        if line:
            c.drawString(ix + 18, ty, line)
            
    draw_slide_footer(c, 8, 10)


# ==============================================================================
# SLIDE 9: ROADMAP (TKT 6 -> TKT 7)
# ==============================================================================
def build_slide_9(c):
    c.setFillColor(COLOR_BG_LIGHT)
    c.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, fill=1, stroke=0)
    
    draw_header_badge(c, "ROADMAP PENGEMBANGAN  •  TARGET: TKT 6 MENUJU TKT 7", 48, 500)
    
    c.setFont("Helvetica-Bold", 26)
    c.setFillColor(COLOR_TEXT_DARK)
    c.drawString(48, 460, "Rencana Implementasi & Peningkatan Kesiapterapan")
    
    c.setFont("Helvetica", 11)
    c.setFillColor(COLOR_TEXT_MUTED)
    c.drawString(48, 440, "Dari status saat ini (TKT 6 Tervalidasi) menuju adopsi operasional penuh (TKT 7-8).")
    
    mw = 270
    mh = 310
    my = 405
    
    milestones = [
        {
            "phase": "POSISI SAAT INI  •  TKT 6",
            "phase_color": COLOR_GREEN_DARK,
            "phase_bg": COLOR_GREEN_LIGHT,
            "title": "Tervalidasi di Lingkungan Relevan",
            "deliverables": [
                "Uji fungsi langsung di meja penimbangan Posyandu Dahlia 01-03.",
                "Validasi bersama kader riil untuk iterasi autofocus & pembersihan form otomatis.",
                "Formula Z-Score terkalibrasi 100% presisi dengan standar WHO & Kemenkes.",
                "Capaian: Prototipe terintegrasi penuh siap melangkah ke skala operasional."
            ],
            "goal": "Status: TKT 6 Tervalidasi Lapangan"
        },
        {
            "phase": "TARGET DIDANAI  •  TKT 7",
            "phase_color": COLOR_TEAL_PRIMARY,
            "phase_bg": COLOR_TEAL_LIGHT,
            "title": "Pilot Operasional Penuh (Q1-Q2 2026)",
            "deliverables": [
                "Implementasi operasional penuh pada seluruh Posyandu binaan di bawah Puskesmas Karangkancana (Mitra LOI Aktif).",
                "Audit akurasi rekomendasi nutrisi bersama Tenaga Pelaksana Gizi (TPG) Puskesmas & IDAI.",
                "Integrasi format ekspor laporan 1-klik resmi ke skema data e-PPGBM Kemenkes.",
                "Target: Lolos uji operasional skala penuh wilayah kerja & sertifikasi kelayakan klinis."
            ],
            "goal": "Peningkatan Menuju TKT 7 (LOI Mitra)"
        },
        {
            "phase": "SKALA B2G  •  TKT 8 - 9",
            "phase_color": HexColor("#6366F1"),
            "phase_bg": HexColor("#EEF2FF"),
            "title": "Kemitraan Dinkes & Ekspansi (Q3-Q4)",
            "deliverables": [
                "Penandatanganan nota kesepahaman (MoU) dengan 3 Dinas Kesehatan Kab/Kota prioritas.",
                "Deployment Dashboard Enterprise B2G berbayar untuk bupati & kepala dinas.",
                "Program Training-of-Trainers (ToT) mandiri kader berbasis video tutorial.",
                "Target: 5.000 Posyandu aktif & 250.000 balita terpantau real-time."
            ],
            "goal": "Target: Komersialisasi B2G Skala Wilayah"
        }
    ]
    
    for i, m in enumerate(milestones):
        mx = 48 + i * (mw + 27)
        draw_card(c, mx, my, mw, mh, bg_color=COLOR_CARD_LIGHT, border_color=COLOR_BORDER_LIGHT, radius=14)
        
        c.saveState()
        c.setFillColor(m["phase_bg"])
        c.roundRect(mx + 18, my - 32, 130, 20, 5, fill=1, stroke=0)
        c.setFont("Helvetica-Bold", 7.8)
        c.setFillColor(m["phase_color"])
        c.drawString(mx + 26, my - 19, m["phase"])
        c.restoreState()
        
        c.setFont("Helvetica-Bold", 13.5)
        c.setFillColor(COLOR_TEXT_DARK)
        t_lines = m["title"].split("\n")
        c.drawString(mx + 18, my - 62, t_lines[0][:26])
        if len(t_lines[0]) > 26:
            c.drawString(mx + 18, my - 78, t_lines[0][26:])
            
        dy = my - 105
        for d in m["deliverables"]:
            c.setFillColor(m["phase_color"])
            c.circle(mx + 22, dy + 3, 2.5, fill=1, stroke=0)
            c.setFont("Helvetica", 8.8)
            c.setFillColor(COLOR_TEXT_MUTED)
            words = d.split(" ")
            l1, l2 = "", ""
            for w in words:
                if c.stringWidth(l1 + " " + w, "Helvetica", 8.8) < mw - 46:
                    l1 += (" " if l1 else "") + w
                else:
                    l2 += (" " if l2 else "") + w
            c.drawString(mx + 32, dy, l1)
            if l2:
                dy -= 13
                c.drawString(mx + 32, dy, l2)
            dy -= 20
            
        draw_card(c, mx + 14, my - mh + 42, mw - 28, 28, bg_color=m["phase_bg"], border_color=m["phase_color"], radius=6)
        c.setFont("Helvetica-Bold", 8.5)
        c.setFillColor(m["phase_color"])
        c.drawCentredString(mx + mw / 2, my - mh + 24, m["goal"])
        
    draw_slide_footer(c, 9, 10)


# ==============================================================================
# SLIDE 10: CALL TO ACTION & CLOSING
# ==============================================================================
def build_slide_10(c):
    c.setFillColor(COLOR_BG_DARK)
    c.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, fill=1, stroke=0)
    
    c.saveState()
    c.setFillColor(HexColor("#064E3B"))
    c.circle(PAGE_WIDTH / 2, PAGE_HEIGHT / 2, 220, fill=1, stroke=0)
    c.setFillColor(HexColor("#0A1120"), alpha=0.85)
    c.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, fill=1, stroke=0)
    c.restoreState()
    
    draw_header_badge(c, "MENUJU INDONESIA EMAS 2045  •  AKSI BERSAMA", 48, 500, is_dark=True)
    
    c.setFont("Helvetica-Bold", 26)
    c.setFillColor(COLOR_TEXT_WHITE)
    c.drawString(48, 465, "Bersama Wujudkan Generasi Emas Bebas Stunting")
    
    # Quote Card
    draw_card(c, 48, 444, 864, 48, bg_color=HexColor("#101B2E"), border_color=HexColor("#059669"), radius=10)
    c.setFont("Helvetica-Oblique", 9.6)
    c.setFillColor(HexColor("#E2E8F0"))
    c.drawString(64, 424, "\"Stunting bukan sekadar angka tinggi badan balita hari ini, melainkan tentang masa depan daya saing bangsa 20 tahun mendatang.\"")
    c.drawString(64, 408, "\"Dengan ZeroStunting AI, mari berdayakan garda terdepan posyandu dengan teknologi cerdas terbaik yang mudah digunakan.\"")
    
    col_w = 424
    gap = 16
    start_x = 48
    top_y = 380
    card_h = 320
    
    # -------------------------------------------------------------
    # LEFT CARD: TIM TEKNIS (4 ORANG: 2 BE, 2 FE)
    # -------------------------------------------------------------
    lx = start_x
    draw_card(c, lx, top_y, col_w, card_h, bg_color=HexColor("#131D31"), border_color=HexColor("#1E293B"), radius=12)
    
    c.setFont("Helvetica-Bold", 10.5)
    c.setFillColor(HexColor("#34D399"))
    c.drawString(lx + 14, top_y - 20, "KOMPOSISI TIM TEKNIS (TIM ANANTA)")
    
    c.saveState()
    c.setFillColor(HexColor("#064E3B"))
    c.roundRect(lx + col_w - 145, top_y - 24, 130, 16, 4, fill=1, stroke=0)
    c.setFont("Helvetica-Bold", 7.5)
    c.setFillColor(HexColor("#6EE7B7"))
    c.drawCentredString(lx + col_w - 80, top_y - 13, "2 BACKEND • 2 FRONTEND")
    c.restoreState()
    
    team_members = [
        {
            "name": "Setiana",
            "role": "System Architect & Backend Engineer",
            "accent": HexColor("#34D399"),
            "desc": "Arsitektur sistem Supabase/PostgreSQL, kalkulasi Z-Score WHO baku Permenkes No. 2/2020, & ekspor e-PPGBM."
        },
        {
            "name": "Iqbal Viandra Putra",
            "role": "AI & Backend Engineer",
            "accent": HexColor("#38BDF8"),
            "desc": "Vision AI OCR ekstraksi KMS fisik, Voice Recognition (Whisper AI), RAG Pangan Lokal TKPI, & PDF Engine."
        },
        {
            "name": "Apliy 3Dyansyah",
            "role": "Frontend Software Engineer",
            "accent": HexColor("#A78BFA"),
            "desc": "Arsitektur Next.js 16, formulir antropometri dinamis bebas lag di Android kader, & grafik persentil WHO real-time."
        },
        {
            "name": "Kania Salsabila",
            "role": "Frontend & UI/UX Engineer",
            "accent": HexColor("#F472B6"),
            "desc": "Mobile-first UI ramah kader lintas usia (>45 thn), modul interaksi Voice UI terpandu, & usability testing lapangan."
        }
    ]
    
    my = top_y - 34
    for m in team_members:
        draw_card(c, lx + 12, my, col_w - 24, 62, bg_color=HexColor("#0F172A"), border_color=HexColor("#1E293B"), radius=7)
        # Left accent stripe
        c.saveState()
        c.setFillColor(m["accent"])
        c.roundRect(lx + 12, my - 62, 4, 62, 2, fill=1, stroke=0)
        c.restoreState()
        
        # Name
        c.setFont("Helvetica-Bold", 10.5)
        c.setFillColor(COLOR_TEXT_WHITE)
        c.drawString(lx + 24, my - 18, m["name"])
        
        # Role
        c.setFont("Helvetica-Bold", 8)
        c.setFillColor(m["accent"])
        c.drawRightString(lx + col_w - 20, my - 18, m["role"])
        
        # Description
        c.setFont("Helvetica", 7.8)
        c.setFillColor(HexColor("#94A3B8"))
        words = m["desc"].split(" ")
        l1, l2 = "", ""
        for w in words:
            if c.stringWidth(l1 + " " + w, "Helvetica", 7.8) < col_w - 46:
                l1 += (" " if l1 else "") + w
            else:
                l2 += (" " if l2 else "") + w
        c.drawString(lx + 24, my - 34, l1)
        if l2:
            c.drawString(lx + 24, my - 47, l2)
            
        my -= 70
        
    # -------------------------------------------------------------
    # RIGHT CARD: KOLABORASI & KONTAK
    # -------------------------------------------------------------
    rx = start_x + col_w + gap
    draw_card(c, rx, top_y, col_w, card_h, bg_color=HexColor("#131D31"), border_color=HexColor("#1E293B"), radius=12)
    
    c.setFont("Helvetica-Bold", 10.5)
    c.setFillColor(HexColor("#38BDF8"))
    c.drawString(rx + 14, top_y - 20, "AKSI KOLABORASI & KONTAK RESMI")
    
    # Subcard 1: Kesiapan Pilot Operasional
    r1_y = top_y - 34
    draw_card(c, rx + 12, r1_y, col_w - 24, 130, bg_color=HexColor("#0F172A"), border_color=HexColor("#1E293B"), radius=8)
    c.setFont("Helvetica-Bold", 9.5)
    c.setFillColor(HexColor("#34D399"))
    c.drawString(rx + 22, r1_y - 20, "🏛️ Kesiapan Pilot Operasional (TKT 7 Ready)")
    
    c.setFont("Helvetica", 8.2)
    c.setFillColor(HexColor("#CBD5E1"))
    bullets = [
        "Terbuka untuk pilot project resmi bersama Dinkes & Puskesmas.",
        "Didukung Surat Dukungan Mitra (LOI) Puskesmas Karangkancana (Bebas Biaya).",
        "Puskesmas & Kader 100% Bebas Biaya (Dibiayai DAK Dinkes, Desa, & CSR).",
        "Dukungan teknis penuh integrasi e-PPGBM & sistem satu data daerah.",
        "Siap diuji coba di posyandu wilayah binaan Anda hari ini."
    ]
    by = r1_y - 38
    for b in bullets:
        c.setFillColor(HexColor("#34D399"))
        c.circle(rx + 26, by + 2.5, 2, fill=1, stroke=0)
        c.setFont("Helvetica", 8)
        c.setFillColor(HexColor("#CBD5E1"))
        c.drawString(rx + 34, by, b)
        by -= 17
        
    # Subcard 2: Kontak Demo
    r2_y = r1_y - 140
    draw_card(c, rx + 12, r2_y, col_w - 24, 132, bg_color=HexColor("#0F172A"), border_color=HexColor("#1E293B"), radius=8)
    c.setFont("Helvetica-Bold", 9.5)
    c.setFillColor(HexColor("#38BDF8"))
    c.drawString(rx + 22, r2_y - 20, "🌐 Kontak Resmi & Tautan Pengujian")
    
    contact_items = [
        ("Live Interactive Demo", "http://localhost:3000 (Aplikasi Aktif Siap Uji)"),
        ("Repositori Resmi", "github.com/aamsetiana/ZeroStunting-AI"),
        ("Email Kemitraan", "halo@zerostunting.ai / tim.ananta@zerostunting.ai"),
        ("Status Kesiapan", "TKT 6 Tervalidasi Lingkungan Relevan (Menuju TKT 7)")
    ]
    cy = r2_y - 38
    for lbl, val in contact_items:
        c.setFont("Helvetica-Bold", 8)
        c.setFillColor(HexColor("#94A3B8"))
        c.drawString(rx + 24, cy, lbl + ":")
        c.setFont("Helvetica", 8)
        c.setFillColor(HexColor("#38BDF8") if "localhost" in val else HexColor("#F8FAFC"))
        c.drawString(rx + 115, cy, val)
        cy -= 18
        
    c.setFont("Helvetica-Oblique", 7.8)
    c.setFillColor(HexColor("#6EE7B7"))
    c.drawCentredString(rx + col_w / 2, r2_y - 116, "\"Teknologi Cerdas untuk Senyum Sehat Balita Indonesia.\"")
    
    draw_slide_footer(c, 10, 10, is_dark=True)


def main():
    output_path = r"e:\ZeroStunting AI\ZeroStunting_AI_Pitch_Deck_TKT6.pdf"
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    c = canvas.Canvas(output_path, pagesize=(PAGE_WIDTH, PAGE_HEIGHT))
    c.setTitle("ZeroStunting AI - Pitch Deck Profesional 10 Slide (TKT 6)")
    c.setAuthor("Tim ANANTA")
    c.setSubject("Pitch Deck Platform Intelijen Posyandu dan Preskripsi Gizi Berbasis AI")
    
    slides = [
        build_slide_1,
        build_slide_2,
        build_slide_3,
        build_slide_4,
        build_slide_5,  # NEW: Arsitektur Sistem & Tech Stack
        build_slide_6,  # Traksi & Bukti TKT 6
        build_slide_7,  # Model Bisnis
        build_slide_8,  # Pasar & Dampak
        build_slide_9,  # Roadmap TKT 6 -> TKT 7
        build_slide_10, # Call to Action
    ]
    
    for i, slide_fn in enumerate(slides, 1):
        print(f"Generating Slide {i} of {len(slides)}...")
        slide_fn(c)
        c.showPage()
        
    c.save()
    print(f"\n[SUCCESS] PDF Pitch Deck (10 Slide) generated successfully at:\n{output_path}")

    orig_path = r"e:\ZeroStunting AI\ZeroStunting_AI_Pitch_Deck.pdf"
    try:
        import shutil
        shutil.copyfile(output_path, orig_path)
        print(f"[UPDATED] Also copied to: {orig_path}")
    except Exception as e:
        print(f"[NOTE] '{orig_path}' is currently open in Acrobat/Viewer, saved cleanly as '{output_path}'.")


if __name__ == "__main__":
    main()
