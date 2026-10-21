from docx import Document
from docx.shared import Pt, RGBColor, Inches, Cm
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml.ns import qn
from docx.oxml import OxmlElement
import copy

# ─────────────────────────────────────────
# HELPER FUNCTIONS
# ─────────────────────────────────────────

def set_cell_bg(cell, hex_color):
    """Set background color of a table cell."""
    tc = cell._tc
    tcPr = tc.get_or_add_tcPr()
    shd = OxmlElement('w:shd')
    shd.set(qn('w:val'), 'clear')
    shd.set(qn('w:color'), 'auto')
    shd.set(qn('w:fill'), hex_color)
    tcPr.append(shd)

def set_cell_border(cell, **kwargs):
    """Set borders on a cell."""
    tc = cell._tc
    tcPr = tc.get_or_add_tcPr()
    tcBorders = OxmlElement('w:tcBorders')
    for side in ['top', 'left', 'bottom', 'right']:
        border = OxmlElement(f'w:{side}')
        border.set(qn('w:val'), kwargs.get('val', 'single'))
        border.set(qn('w:sz'), kwargs.get('sz', '4'))
        border.set(qn('w:space'), '0')
        border.set(qn('w:color'), kwargs.get('color', 'DDDDDD'))
        tcBorders.append(border)
    tcPr.append(tcBorders)

def add_heading(doc, text, level=1, color_hex=None):
    """Add a styled heading."""
    heading = doc.add_heading(text, level=level)
    heading.alignment = WD_ALIGN_PARAGRAPH.LEFT
    run = heading.runs[0] if heading.runs else heading.add_run(text)
    if color_hex:
        run.font.color.rgb = RGBColor.from_string(color_hex)
    run.font.bold = True
    if level == 1:
        run.font.size = Pt(20)
    elif level == 2:
        run.font.size = Pt(15)
    else:
        run.font.size = Pt(12)
    return heading

def add_paragraph(doc, text, bold=False, italic=False, size=11, color_hex=None, indent=False, align=WD_ALIGN_PARAGRAPH.LEFT):
    """Add a styled paragraph."""
    p = doc.add_paragraph()
    p.alignment = align
    run = p.add_run(text)
    run.font.size = Pt(size)
    run.font.bold = bold
    run.font.italic = italic
    if color_hex:
        run.font.color.rgb = RGBColor.from_string(color_hex)
    if indent:
        p.paragraph_format.left_indent = Inches(0.3)
    return p

def add_bullet(doc, text, level=0, bold_prefix=None):
    """Add a bullet point."""
    p = doc.add_paragraph(style='List Bullet')
    p.paragraph_format.left_indent = Inches(0.2 + level * 0.2)
    if bold_prefix:
        run_bold = p.add_run(bold_prefix)
        run_bold.font.bold = True
        run_bold.font.size = Pt(11)
        run = p.add_run(text)
        run.font.size = Pt(11)
    else:
        run = p.add_run(text)
        run.font.size = Pt(11)
    return p

def add_spacer(doc, spaces=1):
    for _ in range(spaces):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(0)

def add_info_box(doc, title, content, bg_color='E8F5E9', title_color='1B5E20'):
    """Add a colored info box using a 1-column table."""
    table = doc.add_table(rows=1, cols=1)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    cell = table.cell(0, 0)
    set_cell_bg(cell, bg_color)
    set_cell_border(cell, val='single', sz='6', color='388E3C')
    cell.width = Inches(6)

    p_title = cell.add_paragraph()
    r = p_title.add_run(title)
    r.font.bold = True
    r.font.size = Pt(12)
    r.font.color.rgb = RGBColor.from_string(title_color)
    p_title.paragraph_format.space_before = Pt(4)

    p_content = cell.add_paragraph(content)
    p_content.runs[0].font.size = Pt(11)
    p_content.paragraph_format.space_after = Pt(6)
    return table

def styled_table(doc, headers, rows, header_bg='1B5E20', header_fg='FFFFFF', alt_bg='F1F8E9'):
    """Add a styled table with alternating rows."""
    table = doc.add_table(rows=1 + len(rows), cols=len(headers))
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.style = 'Table Grid'

    # Header row
    header_row = table.rows[0]
    for i, hdr in enumerate(headers):
        cell = header_row.cells[i]
        set_cell_bg(cell, header_bg)
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run = p.add_run(hdr)
        run.font.bold = True
        run.font.size = Pt(10)
        run.font.color.rgb = RGBColor.from_string(header_fg)
        cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER

    # Data rows
    for r_idx, row_data in enumerate(rows):
        row = table.rows[r_idx + 1]
        bg = alt_bg if r_idx % 2 == 0 else 'FFFFFF'
        for c_idx, val in enumerate(row_data):
            cell = row.cells[c_idx]
            set_cell_bg(cell, bg)
            p = cell.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            run = p.add_run(str(val))
            run.font.size = Pt(10)

    return table


# ─────────────────────────────────────────
# DOCUMENT CREATION
# ─────────────────────────────────────────

doc = Document()

# Page margins
section = doc.sections[0]
section.top_margin    = Cm(2.5)
section.bottom_margin = Cm(2.5)
section.left_margin   = Cm(3)
section.right_margin  = Cm(2.5)

# Default style
style = doc.styles['Normal']
style.font.name = 'Calibri'
style.font.size = Pt(11)

# ════════════════════════════════════════
# COVER PAGE
# ════════════════════════════════════════

add_spacer(doc, 3)

p_logo = doc.add_paragraph()
p_logo.alignment = WD_ALIGN_PARAGRAPH.CENTER
run_logo = p_logo.add_run("🌱 ZeroStunting AI")
run_logo.font.size = Pt(36)
run_logo.font.bold = True
run_logo.font.color.rgb = RGBColor(22, 163, 74)

add_spacer(doc)

p_tagline = doc.add_paragraph()
p_tagline.alignment = WD_ALIGN_PARAGRAPH.CENTER
run_tag = p_tagline.add_run("Membantu Kader Posyandu Desa Mendeteksi Stunting\nlebih Cepat dan Lebih Akurat dengan Teknologi AI")
run_tag.font.size = Pt(16)
run_tag.font.italic = True
run_tag.font.color.rgb = RGBColor(55, 65, 81)

add_spacer(doc, 2)

p_event = doc.add_paragraph()
p_event.alignment = WD_ALIGN_PARAGRAPH.CENTER
run_event = p_event.add_run("Dokumen Penjelasan Proyek\nHackathon ITS 2026 — AI for Social Good")
run_event.font.size = Pt(13)
run_event.font.color.rgb = RGBColor(107, 114, 128)

add_spacer(doc, 2)

p_ver = doc.add_paragraph()
p_ver.alignment = WD_ALIGN_PARAGRAPH.CENTER
run_ver = p_ver.add_run("Versi 1.0  |  Oktober 2026")
run_ver.font.size = Pt(11)
run_ver.font.color.rgb = RGBColor(156, 163, 175)

doc.add_page_break()

# ════════════════════════════════════════
# SECTION 1 — APA ITU STUNTING?
# ════════════════════════════════════════

add_heading(doc, "1. Apa Itu Stunting dan Mengapa Ini Darurat?", level=1, color_hex='16A34A')
add_spacer(doc)

add_paragraph(doc,
    "Stunting adalah kondisi di mana tinggi badan anak jauh lebih pendek dari seharusnya untuk usianya. "
    "Ini bukan sekadar masalah postur tubuh — stunting menandakan bahwa otak dan organ anak tidak tumbuh "
    "dengan optimal sejak dalam kandungan atau di 1.000 hari pertama kehidupannya.",
    size=11)

add_spacer(doc)

add_info_box(doc,
    "📊 Fakta Stunting di Indonesia",
    "• Indonesia masih memiliki angka stunting sekitar 21,6% (2023) — artinya 1 dari 5 balita mengalami stunting\n"
    "• Target nasional: turun di bawah 14% pada tahun 2024\n"
    "• Anak stunting berisiko 10× lebih rentan penyakit, IQ lebih rendah, dan produktivitas kerja menurun saat dewasa\n"
    "• Kerugian ekonomi akibat stunting diperkirakan mencapai Rp 300 triliun per tahun",
    bg_color='FEF3C7', title_color='92400E')

add_spacer(doc)

add_paragraph(doc,
    "Ujung tombak penanganan stunting adalah Posyandu — tempat balita ditimbang setiap bulan oleh "
    "para Kader Posyandu, yaitu relawan ibu-ibu desa yang bekerja tanpa bayaran untuk memantau tumbuh "
    "kembang anak di wilayahnya.",
    size=11)

add_spacer(doc)

# ════════════════════════════════════════
# SECTION 2 — MASALAH DI LAPANGAN
# ════════════════════════════════════════

add_heading(doc, "2. Masalah yang Dihadapi Kader Posyandu Sehari-hari", level=1, color_hex='16A34A')
add_spacer(doc)

add_paragraph(doc,
    "Meski peran kader sangat vital, mereka masih mengerjakan semuanya secara manual — "
    "seperti cara kerja 30 tahun lalu. Ini menyebabkan 3 masalah besar:",
    size=11)

add_spacer(doc)

problems = [
    ("❶  Salah Hitung Tanpa Disadari",
     "Kader harus mencocokkan berat dan tinggi badan balita ke grafik kertas (KMS) secara manual. "
     "Jika salah baca grafik — yang sering terjadi — balita yang sebenarnya sudah mulai stunting "
     "tampak 'normal' di catatan. Masalahnya baru keterlihatan 6–12 bulan kemudian saat sudah terlambat."),

    ("❷  Laporan yang Menyita Waktu Berhari-hari",
     "Setiap bulan, kader harus menyalin ratusan data balita dari buku catatan ke format laporan "
     "Excel atau formulir Kemenkes untuk dikirim ke Puskesmas. Proses ini bisa memakan waktu 3–5 hari "
     "dan sering mengandung kesalahan ketik. Akibatnya, Puskesmas terlambat mengetahui kondisi gizi "
     "di wilayahnya."),

    ("❸  Tidak Tahu Harus Memberi Saran Apa",
     "Saat kader menemukan balita yang berat badannya di bawah normal, mereka sering tidak "
     "tahu harus memberikan saran makan apa yang tepat, terjangkau, dan bisa didapat di desa. "
     "Tidak ada panduan instan yang bisa dipegang kader di lapangan."),
]

for title, desc in problems:
    add_paragraph(doc, title, bold=True, size=12, color_hex='16A34A')
    add_paragraph(doc, desc, size=11, indent=True)
    add_spacer(doc)

# ════════════════════════════════════════
# SECTION 3 — SOLUSI
# ════════════════════════════════════════

add_heading(doc, "3. ZeroStunting AI: Solusinya", level=1, color_hex='16A34A')
add_spacer(doc)

add_paragraph(doc,
    "ZeroStunting AI adalah aplikasi berbasis web yang bisa diakses dari smartphone biasa — "
    "tanpa perlu membeli alat baru apapun. Cukup buka di browser HP yang sudah dimiliki kader.",
    size=11)

add_spacer(doc)

add_info_box(doc,
    "💡 Gambaran Singkat",
    "Kader cukup memasukkan berat dan tinggi badan balita → "
    "aplikasi langsung menghitung apakah anak tersebut normal, berisiko, atau sudah stunting → "
    "muncul saran makanan yang bisa dibeli di warung desa → "
    "laporan bulanan untuk Puskesmas siap diunduh dalam 1 klik.",
    bg_color='DCFCE7', title_color='15803D')

add_spacer(doc)

# ════════════════════════════════════════
# SECTION 4 — CARA KERJA (3 FITUR UTAMA)
# ════════════════════════════════════════

add_heading(doc, "4. Bagaimana Cara Kerjanya?", level=1, color_hex='16A34A')
add_spacer(doc)

add_paragraph(doc,
    "Aplikasi ini memiliki 3 cara input data yang bisa dipilih kader sesuai situasinya:",
    size=11)

add_spacer(doc)

features = [
    ("📷  Cara 1 — Foto Catatan",
     "Kader memotret lembar catatan timbang atau buku KMS dengan kamera HP. "
     "Aplikasi langsung membaca angka-angka dari foto tersebut secara otomatis. "
     "Cocok untuk memindahkan data lama yang masih tersimpan di buku manual.",
     "Contoh: Kader memotret buku catatan penimbangan bulan lalu → semua data 50 balita "
     "langsung terbaca tanpa perlu diketik ulang satu per satu."),

    ("🎤  Cara 2 — Ucapkan Langsung",
     "Kader cukup tekan tombol mikrofon dan berkata: \"Anak Budi, umur 18 bulan, "
     "berat 8 koma 5 kg, tinggi 72 cm\". Aplikasi langsung mengisi form secara otomatis. "
     "Cocok saat hari penimbangan ramai dan tangan kader sedang sibuk.",
     "Contoh: Di tengah antrian panjang, kader cukup bicara ke HP sambil mencatat di buku, "
     "sistem mengisi data sendiri."),

    ("📝  Cara 3 — Isi Form Langsung",
     "Kader mengisi formulir digital di layar HP seperti mengisi form biasa. "
     "Ada peringatan otomatis jika angka yang dimasukkan terlihat tidak masuk akal "
     "(misalnya berat badan 150 kg untuk bayi). "
     "Cocok untuk kader yang sudah terbiasa dengan smartphone.",
     "Contoh: Kader muda langsung input data dari HP saat menimbang."),
]

for title, desc, example in features:
    add_paragraph(doc, title, bold=True, size=13, color_hex='15803D')
    add_paragraph(doc, desc, size=11, indent=True)
    p_ex = doc.add_paragraph()
    p_ex.paragraph_format.left_indent = Inches(0.3)
    r1 = p_ex.add_run("💬 ")
    r1.font.size = Pt(10)
    r2 = p_ex.add_run(example)
    r2.font.size = Pt(10)
    r2.font.italic = True
    r2.font.color.rgb = RGBColor(75, 85, 99)
    add_spacer(doc)

add_spacer(doc)

add_heading(doc, "Setelah Data Masuk, Apa yang Terjadi?", level=2, color_hex='15803D')
add_spacer(doc)

after_input = [
    ("🔍  Pengecekan Otomatis oleh Kader",
     "Sebelum data tersimpan, kader akan melihat pratinjau dan mengkonfirmasi bahwa data sudah benar. "
     "Ini memastikan tidak ada data salah yang tersimpan — manusia tetap yang memutuskan."),
    ("📊  Hasil Analisis Langsung",
     "Sistem menghitung status gizi balita berdasarkan standar resmi WHO (Organisasi Kesehatan Dunia). "
     "Hasilnya: Normal / Kurang / Buruk / Stunting / Kurus. "
     "Muncul juga grafik pertumbuhan yang mudah dibaca."),
    ("🥗  Saran Makanan yang Relevan",
     "Jika balita berisiko, sistem langsung memberikan rekomendasi menu makanan selama 1 minggu "
     "yang bisa dibuat dari bahan-bahan lokal seperti ubi, tempe, ikan asin, atau pisang."),
    ("📄  Laporan Siap Kirim",
     "Dengan 1 tombol, laporan bulanan dalam format resmi Puskesmas (e-PPGBM) siap diunduh "
     "dan dikirimkan ke Puskesmas. Proses yang biasanya 3–5 hari menjadi kurang dari 5 menit."),
]

for title, desc in after_input:
    add_paragraph(doc, title, bold=True, size=12, color_hex='16A34A')
    add_paragraph(doc, desc, size=11, indent=True)
    add_spacer(doc)

# ════════════════════════════════════════
# SECTION 5 — PERBANDINGAN
# ════════════════════════════════════════

add_heading(doc, "5. Perbandingan: Sebelum dan Sesudah ZeroStunting AI", level=1, color_hex='16A34A')
add_spacer(doc)

styled_table(doc,
    headers=["Aktivitas", "Cara Lama (Manual)", "Dengan ZeroStunting AI"],
    rows=[
        ["Memasukkan data 50 balita", "2–3 jam ketik ulang", "10–15 menit (scan foto atau ucap)"],
        ["Menghitung apakah stunting", "Cocokkan grafik kertas, rawan salah", "Otomatis, akurat 100%"],
        ["Beri saran makanan", "Tidak tahu / tebak-tebakan", "Rekomendasi menu langsung muncul"],
        ["Buat laporan bulanan", "3–5 hari rekap manual", "1 klik, kurang dari 5 menit"],
        ["Kirim data ke Puskesmas", "Antar fisik atau ketik ulang", "Download PDF, kirim via WhatsApp"],
    ],
    header_bg='15803D', header_fg='FFFFFF', alt_bg='DCFCE7')

add_spacer(doc, 2)

# ════════════════════════════════════════
# SECTION 6 — DAMPAK YANG DIHARAPKAN
# ════════════════════════════════════════

add_heading(doc, "6. Dampak yang Diharapkan", level=1, color_hex='16A34A')
add_spacer(doc)

impacts = [
    ("🎯  Deteksi Lebih Awal",
     "Stunting terdeteksi jauh lebih cepat karena tidak ada lagi kesalahan hitung manual. "
     "Intervensi gizi bisa diberikan saat masih bisa diperbaiki, bukan setelah terlambat."),
    ("⏱️  Menghemat Waktu Kader",
     "Waktu yang biasanya habis untuk administrasi bisa dialihkan untuk kegiatan yang lebih "
     "penting: mendatangi rumah balita berisiko, edukasi ibu, atau penimbangan lebih banyak balita."),
    ("📡  Data yang Akurat untuk Pemerintah",
     "Puskesmas dan Dinas Kesehatan menerima data yang bersih, akurat, dan real-time — "
     "bukan data yang terlambat 2 minggu dan penuh kesalahan ketik. "
     "Ini memungkinkan kebijakan gizi yang lebih tepat sasaran."),
    ("💊  Intervensi yang Tepat Sasaran",
     "Dengan saran berbasis pangan lokal, ibu balita mendapat panduan konkret yang bisa "
     "langsung dilakukan dengan biaya terjangkau — bukan saran umum yang tidak bisa diterapkan."),
]

for title, desc in impacts:
    add_paragraph(doc, title, bold=True, size=12, color_hex='15803D')
    add_paragraph(doc, desc, size=11, indent=True)
    add_spacer(doc)

# ════════════════════════════════════════
# SECTION 7 — SIAPA PENGGUNANYA?
# ════════════════════════════════════════

add_heading(doc, "7. Siapa yang Menggunakan Aplikasi Ini?", level=1, color_hex='16A34A')
add_spacer(doc)

styled_table(doc,
    headers=["Pengguna", "Peran", "Apa yang Mereka Dapat"],
    rows=[
        ["Kader Posyandu Desa", "Input data penimbangan balita",
         "Alat kerja gratis, mudah dipakai, tidak perlu training panjang"],
        ["Bidan Desa / Petugas Gizi", "Pantau balita berisiko di wilayahnya",
         "Daftar prioritas balita yang perlu kunjungan rumah"],
        ["Puskesmas", "Terima laporan bulanan dari semua posyandu",
         "Dashboard ringkasan + laporan e-PPGBM otomatis"],
        ["Dinas Kesehatan Kab/Kota", "Analisis data gizi skala kabupaten",
         "Peta stunting real-time + data untuk kebijakan gizi daerah"],
    ],
    header_bg='15803D', header_fg='FFFFFF', alt_bg='DCFCE7')

add_spacer(doc, 2)

# ════════════════════════════════════════
# SECTION 8 — MODEL BISNIS
# ════════════════════════════════════════

add_heading(doc, "8. Model Bisnis: Gratis untuk Kader, Berbayar untuk Pemerintah", level=1, color_hex='16A34A')
add_spacer(doc)

add_paragraph(doc,
    "Kader Posyandu menggunakan aplikasi ini sepenuhnya GRATIS — selamanya. "
    "Tidak ada biaya apapun yang dibebankan ke kader atau posyandu. "
    "Yang membayar adalah Dinas Kesehatan Kabupaten/Kota, karena mereka yang "
    "mendapat manfaat terbesar dari data yang terstruktur dan laporan otomatis.",
    size=11)

add_spacer(doc)

styled_table(doc,
    headers=["Paket", "Untuk Siapa", "Biaya", "Fasilitas Utama"],
    rows=[
        ["🆓  GRATIS", "Kader Posyandu",
         "Rp 0 / selamanya",
         "Input data, cek stunting otomatis, saran gizi, cetak laporan"],
        ["🏥  Basic", "Puskesmas (1 wilayah)",
         "Rp 500.000 / bulan",
         "Dashboard Puskesmas, rekap otomatis, notifikasi balita berisiko"],
        ["🏢  Pro", "Dinas Kesehatan Kabupaten/Kota",
         "Rp 3–5 juta / bulan",
         "Peta stunting real-time, laporan agregat, analisis tren bulanan"],
        ["🏛️  Enterprise", "Dinas Kesehatan Provinsi / Kemenkes",
         "Negosiasi",
         "Integrasi penuh ke e-PPGBM Kemenkes, multi-kabupaten"],
    ],
    header_bg='15803D', header_fg='FFFFFF', alt_bg='DCFCE7')

add_spacer(doc, 2)

add_info_box(doc,
    "📈 Potensi Pasar",
    "Indonesia memiliki 514 Kabupaten/Kota. Jika hanya 20 Dinkes yang berlangganan paket Pro (Rp 4 juta/bulan), "
    "itu sudah menghasilkan Rp 80 juta per bulan atau hampir Rp 1 miliar per tahun — "
    "semuanya sambil memberi layanan gratis ke ratusan ribu kader desa.",
    bg_color='DCFCE7', title_color='15803D')

add_spacer(doc)

# ════════════════════════════════════════
# SECTION 9 — ROADMAP
# ════════════════════════════════════════

add_heading(doc, "9. Jadwal Pengembangan (Sept 2026 – Feb 2027)", level=1, color_hex='16A34A')
add_spacer(doc)

add_paragraph(doc,
    "Proyek ini dikembangkan dalam program pra-inkubasi intensif Hackathon ITS 2026 "
    "selama 6 bulan — dari September 2026 hingga Demo Day di Januari 2027:",
    size=11)

add_spacer(doc)

styled_table(doc,
    headers=["Periode", "Tahapan", "Target"],
    rows=[
        ["September 2026", "Riset & Fondasi",
         "Wawancara kader, desain sistem, setup awal aplikasi"],
        ["Oktober 2026", "Pembangunan Inti",
         "Mesin kalkulasi stunting WHO, API backend, saran gizi AI"],
        ["November 2026", "Tampilan & Fitur Input",
         "Antarmuka mobile, 3 cara input (foto/suara/form), grafik pertumbuhan"],
        ["Desember 2026", "Uji Lapangan & Finalisasi",
         "Uji coba di Posyandu nyata, perbaikan, laporan PDF, persiapan demo"],
        ["Januari 2027", "Demo Day",
         "Presentasi ke juri & investor, pertemuan mitra Dinas Kesehatan"],
        ["Februari 2027", "Peluncuran Awal",
         "Pilot berbayar 3–5 Dinas Kesehatan, skala ke kabupaten lain"],
    ],
    header_bg='15803D', header_fg='FFFFFF', alt_bg='DCFCE7')

add_spacer(doc, 2)

# ════════════════════════════════════════
# SECTION 10 — RENCANA JANGKA PANJANG
# ════════════════════════════════════════

add_heading(doc, "10. Rencana Jangka Panjang (2027 ke Depan)", level=1, color_hex='16A34A')
add_spacer(doc)

future = [
    ("Q1 2027 — Integrasi WhatsApp",
     "Kader yang belum punya smartphone canggih bisa mengirim foto buku KMS atau pesan suara "
     "langsung melalui WhatsApp biasa. Balasan otomatis berisi hasil analisis stunting."),
    ("Q2 2027 — Peta Stunting Real-Time",
     "Dinas Kesehatan Kabupaten bisa melihat peta interaktif yang menampilkan mana "
     "desa/kelurahan dengan kasus stunting tertinggi — seperti Google Maps untuk data gizi balita."),
    ("Q3 2027 — Terhubung ke Sistem Kemenkes",
     "Platform terhubung langsung ke sistem e-PPGBM Kementerian Kesehatan sehingga laporan "
     "otomatis masuk ke database nasional tanpa perlu input ulang."),
    ("Q4 2027 — Pengadaan Resmi Pemerintah",
     "Masuk ke jalur tender APBD (Anggaran Pendapatan dan Belanja Daerah) Dinas Kesehatan "
     "dan program BKKBN untuk pembiayaan yang lebih besar dan berkelanjutan."),
]

for title, desc in future:
    add_paragraph(doc, title, bold=True, size=12, color_hex='15803D')
    add_paragraph(doc, desc, size=11, indent=True)
    add_spacer(doc)

# ════════════════════════════════════════
# SECTION 11 — MENGAPA KAMI?
# ════════════════════════════════════════

add_heading(doc, "11. Mengapa ZeroStunting AI Berbeda?", level=1, color_hex='16A34A')
add_spacer(doc)

diffs = [
    "✅  Tidak butuh alat baru — cukup HP yang sudah ada",
    "✅  Tidak perlu koneksi internet stabil (bisa dipakai offline)",
    "✅  Dibuat untuk kader desa, bukan untuk dokter atau ahli IT",
    "✅  Kalkulasi stunting menggunakan standar resmi WHO — bukan tebakan AI",
    "✅  Saran makanan berbasis bahan pangan lokal yang murah dan mudah didapat",
    "✅  Laporan langsung sesuai format Puskesmas tanpa perlu format ulang",
    "✅  Gratis untuk semua kader — tanpa batas waktu",
]
for d in diffs:
    add_bullet(doc, d)

add_spacer(doc)

# ════════════════════════════════════════
# PENUTUP
# ════════════════════════════════════════

add_heading(doc, "Penutup", level=1, color_hex='16A34A')
add_spacer(doc)

add_paragraph(doc,
    "Stunting bukan hanya masalah kesehatan — ini adalah masalah masa depan bangsa. "
    "Setiap anak yang berhasil lolos dari stunting adalah satu investasi untuk Indonesia yang lebih kuat.\n\n"
    "ZeroStunting AI hadir bukan untuk menggantikan peran kader Posyandu, "
    "melainkan untuk memberi mereka 'senjata' yang lebih baik — "
    "agar dedikasi dan kerja keras mereka menghasilkan dampak yang jauh lebih besar.",
    size=12)

add_spacer(doc)

add_info_box(doc,
    "📬 Informasi Lebih Lanjut",
    "Dokumen ini adalah ringkasan untuk pembaca umum.\n"
    "Untuk dokumentasi teknis lengkap, silakan merujuk ke file prd.md di repositori proyek.",
    bg_color='EFF6FF', title_color='1E40AF')

# ════════════════════════════════════════
# SAVE
# ════════════════════════════════════════

output_path = r"e:\ZeroStunting AI\ZeroStunting_AI_Dokumen_Proyek.docx"
doc.save(output_path)
print(f"[OK] Dokumen berhasil dibuat: {output_path}")
