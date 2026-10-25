"use client";

import React, { useState, useMemo } from "react";
import {
  Sparkles, Volume2, Copy, Check, Apple, Heart, ShieldAlert,
  Utensils, BookOpen, Clock, AlertTriangle, CheckCircle2, ChevronRight,
  Flame, Leaf, Fish, Egg, Award, Info
} from "lucide-react";
import type { AntropometriResult } from "@/lib/utils";

interface AdvisoryCardProps {
  result: AntropometriResult;
  form: {
    nama_anak?: string;
    umur_bulan: number | string;
    berat_kg: number | string;
    tinggi_cm: number | string;
    jenis_kelamin: "L" | "P";
  };
}

// ─── BASIS DATA PANGAN LOKAL INDONESIA TERSTANDARISASI KEMENKES RI ───────────

export interface PanganLokalItem {
  id: string;
  nama: string;
  kategori: "hewani" | "nabati" | "sayur" | "buah_lemak";
  nutrisiKunci: string;
  tagKhasiat: string;
  contohMenu: string;
  mengapaPenting: string;
  cocokUntuk: ("stunting" | "wasting" | "underweight" | "normal" | "lebih")[];
}

const KATALOG_PANGAN_INDONESIA: PanganLokalItem[] = [
  // 1. Protein Hewani
  {
    id: "ikan_kembung",
    nama: "Ikan Kembung",
    kategori: "hewani",
    nutrisiKunci: "Omega-3 & DHA (2.2g/100g), Protein 21g",
    tagKhasiat: "DHA Lebih Tinggi dari Salmon",
    contohMenu: "Nasi Tim Ikan Kembung Bumbu Kuning Santan",
    mengapaPenting: "Asam lemak esensial DHA sangat tinggi merangsang pembelahan sel otak balita dan menstimulasi hormon pertumbuhan tulang linear.",
    cocokUntuk: ["stunting", "underweight", "normal"],
  },
  {
    id: "hati_ayam",
    nama: "Hati Ayam Kampung",
    kategori: "hewani",
    nutrisiKunci: "Zat Besi Heme (15.8mg), Zinc (3.2mg), Vit A",
    tagKhasiat: "Juara 1 Zat Besi & Anti Anemia",
    contohMenu: "Bubur Hati Ayam Lumat Daun Kelor",
    mengapaPenting: "Zat besi heme mudah diserap 3x lipat dibanding zat besi nabati, mencegah anemia defisiensi besi yang menjadi akar stunting.",
    cocokUntuk: ["stunting", "underweight", "wasting"],
  },
  {
    id: "ikan_gabus",
    nama: "Ikan Gabus (Channa striata)",
    kategori: "hewani",
    nutrisiKunci: "Albumin (6.2g/100g), Protein Murni 25.5g",
    tagKhasiat: "Albumin Tertinggi Pemulihan Otot",
    contohMenu: "Sup Tim Ikan Gabus Kaldu Gurih Minyak Kelapa",
    mengapaPenting: "Kadar albumin luar biasa tinggi mempercepat pembentukan jaringan otot baru dan meningkatkan berat badan balita kurus/wasting.",
    cocokUntuk: ["wasting", "underweight"],
  },
  {
    id: "telur_ayam",
    nama: "Telur Ayam / Bebek",
    kategori: "hewani",
    nutrisiKunci: "Protein Bioavailabilitas 100%, Kolin, Vitamin D",
    tagKhasiat: "Protein Standar Emas WHO",
    contohMenu: "Telur Orak-arik Mentega / Telur Kukus Lembut",
    mengapaPenting: "Protein telur memiliki skor asam amino sempurna (100) yang diserap tubuh tanpa sisa untuk mengejar defisit tinggi dan berat badan.",
    cocokUntuk: ["stunting", "wasting", "underweight", "normal"],
  },
  {
    id: "ikan_teri",
    nama: "Ikan Teri Nasi / Basah",
    kategori: "hewani",
    nutrisiKunci: "Kalsium (1200mg/100g), Fosfor, Fluor",
    tagKhasiat: "Kalsium Super Tulang & Gigi",
    contohMenu: "Perkedel Tahu Ikan Teri Kukus Lumat",
    mengapaPenting: "Dikonsumsi utuh bersama tulangnya, menyediakan kalsium alami terbaik untuk pemadatan lempeng epifisis tulang balita.",
    cocokUntuk: ["stunting", "normal"],
  },
  {
    id: "telur_puyuh",
    nama: "Telur Puyuh",
    kategori: "hewani",
    nutrisiKunci: "Zat Besi 2x telur ayam, Vitamin B12, Lemak Sehat",
    tagKhasiat: "Kecil Padat Nutrisi & Kalori",
    contohMenu: "Semur Telur Puyuh Tahu Sutra Kecap Rendah Gula",
    mengapaPenting: "Porsi kecil mudah dimakan balita yang sedang mogok makan (GTM), memberikan kalori dan mikronutrien instan.",
    cocokUntuk: ["underweight", "wasting"],
  },
  {
    id: "ikan_lele",
    nama: "Ikan Lele Segar",
    kategori: "hewani",
    nutrisiKunci: "Protein Lembut 18.7g, Asam Lemak Sehat, Fosfor",
    tagKhasiat: "Protein Murah Meriah Ramah Cerna",
    contohMenu: "Nasi Tim Lele Kukus Kuah Kuning",
    mengapaPenting: "Dagingnya bertekstur lembut tanpa serat kasar, sangat ramah bagi saluran cerna bayi yang baru belajar MP-ASI.",
    cocokUntuk: ["stunting", "underweight", "normal"],
  },
  {
    id: "daging_ayam_ceker",
    nama: "Daging Ayam & Kaldu Ceker",
    kategori: "hewani",
    nutrisiKunci: "Kolagen Alami, Glisin, Protein Hewani 20g",
    tagKhasiat: "Kolagen Sendi & Perangsang Nafsu Makan",
    contohMenu: "Bubur Beras Kaldu Ceker Kental Suwir Ayam",
    mengapaPenting: "Kaldu ceker menghasilkan kuah gurih alami tanpa MSG sintetis yang merangsang nafsu makan balita dan memperkuat persendian.",
    cocokUntuk: ["stunting", "underweight", "wasting"],
  },

  // 2. Protein Nabati
  {
    id: "tempe_kedelai",
    nama: "Tempe Kedelai Asli",
    kategori: "nabati",
    nutrisiKunci: "Protein Nabati 19g, Isoflavon, Probiotik Alami",
    tagKhasiat: "Fermentasi Alami Mudah Diserap",
    contohMenu: "Nugget Tempe Kukus Ikan Teri",
    mengapaPenting: "Proses fermentasi kapang tempe memecah asam fitat sehingga zat besi dan zinc tidak terikat dan diserap sempurna oleh usus anak.",
    cocokUntuk: ["stunting", "normal", "underweight"],
  },
  {
    id: "tahu_sutra",
    nama: "Tahu Sutra / Tahu Putih",
    kategori: "nabati",
    nutrisiKunci: "Kalsium Tinggi, Protein Lembut 8g, Magnesium",
    tagKhasiat: "Tekstur Lembut Ramah Lambung",
    contohMenu: "Sup Tahu Sutra Bola Daging Cincang",
    mengapaPenting: "Kaya kalsium sulfat alami yang memperkuat struktur tulang dan sangat mudah dilumatkan bersama bubur nasi.",
    cocokUntuk: ["stunting", "normal", "lebih"],
  },
  {
    id: "kacang_hijau",
    nama: "Kacang Hijau Kupas",
    kategori: "nabati",
    nutrisiKunci: "Vitamin B1 (Tiamin), Asam Folat, Serat Halus",
    tagKhasiat: "Vitamin B1 Pencegah Lemas & GTM",
    contohMenu: "Sari Kacang Hijau Santan Gurih Hangat",
    mengapaPenting: "Vitamin B1 membantu metabolisme karbohidrat menjadi energi aktif, membangkitkan vitalitas anak yang lesu.",
    cocokUntuk: ["underweight", "wasting", "normal"],
  },
  {
    id: "kacang_merah",
    nama: "Kacang Merah Lokal",
    kategori: "nabati",
    nutrisiKunci: "Zat Besi Nabati, Seng, Protein Kompleks 22g",
    tagKhasiat: "Energi Tahan Lama & Penambah Darah",
    contohMenu: "Sup Daging Kacang Merah Lumat",
    mengapaPenting: "Memberikan rasa kenyang bernutrisi dan suplai zat besi bertahap untuk pembentukan hemoglobin darah anak.",
    cocokUntuk: ["stunting", "underweight"],
  },

  // 3. Sayuran Superfood Desa
  {
    id: "daun_kelor",
    nama: "Daun Kelor (Moringa oleifera)",
    kategori: "sayur",
    nutrisiKunci: "Kalsium 4x susu, Vitamin C 7x jeruk, Zat Besi",
    tagKhasiat: "Superfood Nusantara No. 1",
    contohMenu: "Sayur Bening Kelor Jagung Manis Cincang",
    mengapaPenting: "Kelor dijuluki pohon keajaiban karena konsentrasi mikronutrien padat yang efektif membalikkan kondisi stunting.",
    cocokUntuk: ["stunting", "wasting", "underweight", "normal"],
  },
  {
    id: "daun_katuk",
    nama: "Daun Katuk",
    kategori: "sayur",
    nutrisiKunci: "Klorofil, Vitamin A & C, Kalsium, Kalium",
    tagKhasiat: "Regenerasi Sel & Imunitas Usus",
    contohMenu: "Tim Nasi Katuk Hati Ayam",
    mengapaPenting: "Melindungi dinding mukosa usus anak dari infeksi mikroba sehingga penyerapan makanan tidak terganggu diare.",
    cocokUntuk: ["stunting", "normal"],
  },
  {
    id: "labu_kuning",
    nama: "Labu Kuning (Waluh)",
    kategori: "sayur",
    nutrisiKunci: "Beta-Karoten (Vit A), Serat Prebiotik, Kalium",
    tagKhasiat: "Manis Alami & Menyehatkan Pencernaan",
    contohMenu: "Puree Labu Kuning Santan & Kuning Telur",
    mengapaPenting: "Rasa manis alami tanpa gula pasir disukai balita, serat halusnya menjaga bakteri baik usus (mikrobioma sehat).",
    cocokUntuk: ["stunting", "wasting", "underweight", "normal"],
  },
  {
    id: "bayam_merah",
    nama: "Bayam Merah / Hijau",
    kategori: "sayur",
    nutrisiKunci: "Zat Besi, Asam Folat, Lutein, Serat Halus",
    tagKhasiat: "Pembentukan Sel Darah Merah",
    contohMenu: "Sup Bening Bayam Jagung Pipil Halus",
    mengapaPenting: "Mendukung produksi sel darah merah pembawa oksigen ke seluruh sel tubuh dan jaringan otak yang sedang berkembang.",
    cocokUntuk: ["stunting", "underweight", "normal"],
  },
  {
    id: "wortel_lokal",
    nama: "Wortel Segar",
    kategori: "sayur",
    nutrisiKunci: "Vitamin A (12000 IU), Serat Pektin",
    tagKhasiat: "Kesehatan Mata & Daya Tahan Infeksi",
    contohMenu: "Puree Wortel Daging Cincang",
    mengapaPenting: "Mencegah xerophthalmia dan memperkuat daya tahan tubuh agar balita tidak mudah terserang batuk pilek berulang.",
    cocokUntuk: ["stunting", "normal", "lebih"],
  },

  // 4. Buah & Lemak Sehat Penambah Energi
  {
    id: "santan_kelapa",
    nama: "Santan Kelapa Murni (Perasan Segar)",
    kategori: "buah_lemak",
    nutrisiKunci: "Lemak MCT (Asam Laurat 50%), Kalori Padat",
    tagKhasiat: "MCT Penyelamat Balita Kurus",
    contohMenu: "Tambahan 1-2 sdm Santan pada Setiap Nasi Tim/Bubur",
    mengapaPenting: "Asam lemak rantai sedang (MCT) langsung diserap usus tanpa perlu enzim empedu banyak, menaikkan BB balita kurus dengan kilat.",
    cocokUntuk: ["wasting", "underweight"],
  },
  {
    id: "alpukat_mentega",
    nama: "Alpukat Mentega Lokal",
    kategori: "buah_lemak",
    nutrisiKunci: "Lemak Tak Jenuh Tunggal, Vitamin E, Kalium",
    tagKhasiat: "Lemak Nabati Padat Kalori Lembut",
    contohMenu: "Puree Alpukat Lumat Santan / ASI",
    mengapaPenting: "Satu buah alpukat memberi kalori sehat tinggi tanpa gula, sangat baik untuk perkembangan selubung mielin saraf otak.",
    cocokUntuk: ["wasting", "underweight", "normal"],
  },
  {
    id: "pisang_kepok",
    nama: "Pisang Kepok / Ambon Kukus",
    kategori: "buah_lemak",
    nutrisiKunci: "Kalium Tinggi, Karbohidrat Mudah Cerna, Vitamin B6",
    tagKhasiat: "Karbohidrat Ramah Saluran Cerna",
    contohMenu: "Barongko Pisang Kukus Santan Gurih",
    mengapaPenting: "Mengatasi gangguan pencernaan ringan dan memberi rasa kenyang yang nyaman bagi lambung balita.",
    cocokUntuk: ["underweight", "wasting", "normal"],
  },
  {
    id: "ubi_jalar_cilembu",
    nama: "Ubi Jalar Madu / Oranye",
    kategori: "buah_lemak",
    nutrisiKunci: "Beta-Karoten, Energi Kompleks, Serat Halus",
    tagKhasiat: "Energi Bebas Gluten Kaya Karotenoid",
    contohMenu: "Puree Ubi Jalar Kukus Santan Keju",
    mengapaPenting: "Alternatif karbohidrat kaya warna yang menggugah selera anak dengan vitamin A melimpah untuk tulang.",
    cocokUntuk: ["stunting", "underweight", "normal"],
  },
  {
    id: "pepaya_california",
    nama: "Pepaya California Lokal",
    kategori: "buah_lemak",
    nutrisiKunci: "Enzim Papain, Vitamin C (62mg), Serat Air",
    tagKhasiat: "Pencernaan Lancar Bebas Sembelit",
    contohMenu: "Potongan Buah Pepaya Dingin Halus",
    mengapaPenting: "Enzim papain membantu memecah protein makanan sehingga anak bebas dari konstipasi atau sembelit saat transisi MP-ASI.",
    cocokUntuk: ["lebih", "normal", "stunting"],
  },
];

export function AdvisoryCard({ result, form }: AdvisoryCardProps) {
  const [activeTab, setActiveTab] = useState<"menu" | "katalog" | "jadwal" | "tindak_lanjut">("menu");
  const [filterKategori, setFilterKategori] = useState<"semua" | "hewani" | "nabati" | "sayur" | "buah_lemak">("semua");
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const umur = typeof form.umur_bulan === "number" ? form.umur_bulan : Number(form.umur_bulan) || 0;
  const isStunting = result.ada_risiko_stunting;
  const isWasting = result.ada_risiko_wasting;
  const isUnderweight = result.ada_risiko_underweight;
  const isLebih = result.bbpb?.status === "gemuk" || result.bbu?.status === "lebih";
  const isMikrosefali = result.ada_risiko_mikrosefali;
  const isMakrosefali = result.ada_risiko_makrosefali;
  const isNormal = !isStunting && !isWasting && !isUnderweight && !isLebih;

  // Status gizi dominan untuk rekomendasi
  const statusKunci: "stunting" | "wasting" | "underweight" | "lebih" | "normal" = isStunting
    ? "stunting"
    : isWasting
    ? "wasting"
    : isUnderweight
    ? "underweight"
    : isLebih
    ? "lebih"
    : "normal";

  // ─── 1. EVALUASI GIZI MENDALAM INDONESIA ────────────────────────────────────
  const evaluasiDetail = useMemo(() => {
    const namaAnak = form.nama_anak ? form.nama_anak.trim() : "Ananda";

    if (isStunting) {
      return {
        judul: `Perhatian Khusus Pertumbuhan Tulang Linear (Stunting / Pendek)`,
        warnaBg: "#FEF2F2",
        warnaBorder: "#FECACA",
        warnaTeks: "#991B1B",
        badge: "PRIORITAS INTERVENSI ZINC & ZAT BESI",
        analisis: `Panjang/tinggi badan ${namaAnak} (${form.tinggi_cm} cm) saat ini berada di bawah batas standar kurva PB/U WHO (-2 SD). Kondisi ini menandakan adanya defisit zat gizi mikro kronis dalam jangka panjang. Sangat penting segera meningkatkan asupan protein hewani harian kaya asam amino esensial, zinc, dan zat besi heme (seperti hati ayam kampung, telur, dan ikan kembung) untuk memacu aktivitas lempeng pertumbuhan tulang (epiphyseal plate).`,
        prinsipPangan: "Utamakan 2 jenis protein hewani setiap hari + sayuran superfood daun kelor/bayam merah. Batasi karbohidrat kosong.",
      };
    }
    if (isWasting) {
      return {
        judul: `Perhatian Mendesak Defisit Massa Otot & Berat Badan (Wasting / Kurus)`,
        warnaBg: "#FEF2F2",
        warnaBorder: "#FECACA",
        warnaTeks: "#991B1B",
        badge: "DENSIFIKASI ENERGI & ALBUMIN SEGERA",
        analisis: `Berat badan ${namaAnak} (${form.berat_kg} kg) terhadap panjang badannya (${form.tinggi_cm} cm) menunjukkan kondisi kurus/wasting (Z-score BB/PB < -2 SD). Anak membutuhkan intervensi densifikasi energi tinggi segera untuk memulihkan cadangan lemak dan protein otot. Dianjurkan penambahan 1-2 sendok makan santan segar atau minyak kelapa murni (VCO) pada setiap porsi makan, serta konsumsi ikan gabus yang kaya albumin tinggi untuk mempercepat pembentukan sel otot.`,
        prinsipPangan: "Tambahkan santan murni/minyak kelapa pada tiap porsi makan + ikan gabus tinggi albumin + telur puyuh padat gizi.",
      };
    }
    if (isUnderweight) {
      return {
        judul: `Pemantauan Defisit Kenaikan Berat Badan (Underweight / BB Kurang)`,
        warnaBg: "#FFFBEB",
        warnaBorder: "#FDE68A",
        warnaTeks: "#92400E",
        badge: "PENINGKATAN FREKUENSI & KUDAPAN PADAT",
        analisis: `Berat badan ${namaAnak} (${form.berat_kg} kg) berada di bawah standar BB/U untuk usianya (${umur} bulan). Anak berisiko mengalami perlambatan tumbuh kembang jika berat badan tidak segera dikejar. Diperlukan peningkatan frekuensi makan menjadi 3 kali makan utama ditambah 2 kali selingan padat gizi khas Nusantara (seperti bubur kacang hijau santan, barongko pisang, atau nagasari tanpa pemanis buatan).`,
        prinsipPangan: "Frekuensi makan 3x utama + 2x selingan padat gizi lokal. Berikan olahan telur dan kaldu ceker gurih.",
      };
    }
    if (isLebih) {
      return {
        judul: `Pengaturan Porsi & Keseimbangan Gizi (Risiko Gizi Lebih / Gemuk)`,
        warnaBg: "#F0F9FF",
        warnaBorder: "#BAE6FD",
        warnaTeks: "#0369A1",
        badge: "KONTROL GULA & PERBANYAK SERAT BUAH",
        analisis: `Indikator berat badan ${namaAnak} terhadap panjang badannya berada di atas +2 SD (gizi lebih). Tidak diperbolehkan melakukan diet ketat pada balita. Fokus utama adalah menghentikan pemberian makanan/minuman manis kemasan berpemanis buatan, biskuit tinggi gula, dan gorengan minyak jenuh. Ganti kudapan dengan buah segar potong (pepaya, semangka, pisang) dan perbanyak aktivitas fisik bergerak aktif.`,
        prinsipPangan: "Hindari camilan manis pabrikan dan makanan berminyak. Sajikan buah lokal segar dan sayur sup bening.",
      };
    }
    return {
      judul: `Alhamdulillah Pertumbuhan Balita Normal & Ideal (Sesuai Kurva Hijau WHO)`,
      warnaBg: "#F0FDF4",
      warnaBorder: "#BBF7D0",
      warnaTeks: "#166534",
      badge: "GIZI BAIK — PERTAHANKAN POLA 4 BINTANG",
      analisis: `Alhamdulillah, laju pertumbuhan ${namaAnak} berada dalam zona hijau ideal standar deviasi WHO 2006. Berat badan (${form.berat_kg} kg) dan tinggi badan (${form.tinggi_cm} cm) proporsional dan sehat. Pertahankan pola makan gizi seimbang 'Isi Piringku Kaya Protein Hewani' dan pastikan selalu hadir menimbang secara rutin setiap bulan di Posyandu.`,
      prinsipPangan: "Pertahankan menu 4 Bintang seimbang (karbohidrat, hewani, nabati, sayur/buah). Pastikan imunisasi lengkap.",
    };
  }, [form, isStunting, isWasting, isUnderweight, isLebih, umur]);

  // ─── 2. MENU MAKAN HARIAN KHAS INDONESIA TERKUSTOMISASI ─────────────────────
  const menuHarian = useMemo(() => {
    if (isStunting) {
      return [
        {
          waktu: "Sarapan Pagi (07.00)",
          menu: "Bubur Beras Merah Hati Ayam & Daun Kelor Cincang",
          bahan: "Beras merah, hati ayam kampung segar, daun kelor cincang halus, 1 sdt minyak kelapa.",
          nutrisi: "Zat Besi Heme, Zinc, Kalsium & Vitamin A",
          khasiat: "Merangsang lempeng tulang panjang dan mencegah anemia defisiensi besi.",
        },
        {
          waktu: "Selingan Pagi (10.00)",
          menu: "Puree Labu Kuning Santan Gurih + Kuning Telur",
          bahan: "Labu kuning kukus, 2 sdm santan segar, 1 butir kuning telur rebus dilumatkan.",
          nutrisi: "Beta-karoten, Kolin, Lemak Sehat MCT",
          khasiat: "Menyediakan vitamin A pelindung epifisis tulang dan meningkatkan imunitas usus.",
        },
        {
          waktu: "Makan Siang (12.30)",
          menu: "Nasi Tim Ikan Kembung Bumbu Kuning Santan",
          bahan: "Nasi lembek, fillet ikan kembung segar, kunyit, daun salam, 2 sdm santan peras asli.",
          nutrisi: "Omega-3 (DHA & EPA), Protein 21g, Kalsium",
          khasiat: "DHA tinggi merangsang pembelahan sel osteoblas pembentuk tulang.",
        },
        {
          waktu: "Selingan Sore (16.00)",
          menu: "Puding Tempe Pisang Kepok Kukus (Barongko Mini)",
          bahan: "Tempe kedelai kukus lumat, pisang kepok matang, santan cair, tanpa gula tambahan.",
          nutrisi: "Isoflavon, Kalium, Probiotik Alami",
          khasiat: "Membantu absorpsi kalsium dan menjaga kesehatan flora usus anak.",
        },
        {
          waktu: "Makan Malam (18.30)",
          menu: "Sup Bola-Bola Ikan Teri Basah & Tahu Sutra Kuah Kaldu",
          bahan: "Ikan teri basah dicincang halus, tahu sutra, wortel parut, kaldu ceker ayam kampung.",
          nutrisi: "Kalsium Super (1200mg), Kolagen, Protein Hewani",
          khasiat: "Memperkuat struktur matriks tulang dan gigi balita saat istirahat malam.",
        },
      ];
    }

    if (isWasting) {
      return [
        {
          waktu: "Sarapan Pagi (07.00)",
          menu: "Bubur Gurih Daging Giling Santan Kental + Telur Puyuh",
          bahan: "Beras pulen, santan kental, daging ayam/sapi cincang, 2 butir telur puyuh rebus.",
          nutrisi: "Densitas Energi Tinggi, Lemak Sehat MCT, Protein 18g",
          khasiat: "Memberikan asupan kalori ganda sejak pagi tanpa membuat lambung begah.",
        },
        {
          waktu: "Selingan Pagi (10.00)",
          menu: "Puree Alpukat Mentega Madu Sedikit + Santan Hangat",
          bahan: "Alpukat mentega matang dihaluskan, 2 sdm santan matang hangat.",
          nutrisi: "Lemak Tak Jenuh Tunggal, Kalium, Vitamin E",
          khasiat: "Menaikkan berat badan secara cepat melalui lemak nabati ramah jantung.",
        },
        {
          waktu: "Makan Siang (12.30)",
          menu: "Nasi Tim Lemak Ikan Gabus Kukus Minyak Kelapa Murni",
          bahan: "Nasi tim aron kaldu, fillet ikan gabus, wortel parut, 1 sdm minyak kelapa murni (VCO).",
          nutrisi: "Albumin Alami (6.2g), Asam Laurat, Asam Amino Lengkap",
          khasiat: "Albumin tertinggi menaikkan sintesis protein otot dan mencegah edema.",
        },
        {
          waktu: "Selingan Sore (16.00)",
          menu: "Bubur Sumsum Tepung Beras Santan Gurih + Telur Kukus",
          bahan: "Tepung beras, santan kental gurih daun pandan, kuning telur ayam kocok.",
          nutrisi: "Kalori Padat Lembut, Karbohidrat Halus",
          khasiat: "Mudah ditelan balita yang nafsu makannya menurun dan cepat diserap tubuh.",
        },
        {
          waktu: "Makan Malam (18.30)",
          menu: "Bubur Manado Singkong Lumat + Ayam Suwir Lemak Paha",
          bahan: "Singkong kukus lumat, daging ayam paha berlemak, labu kuning, bayam lembut.",
          nutrisi: "Karbohidrat Kompleks, Vitamin A, Protein Lemak Sehat",
          khasiat: "Menyediakan kalori konstan semalaman saat proses pemulihan sel.",
        },
      ];
    }

    if (isUnderweight) {
      return [
        {
          waktu: "Sarapan Pagi (07.00)",
          menu: "Nasi Uduk Lembut Telur Dadar Gulung Cincang Hati",
          bahan: "Beras dimasak santan tipis dan daun pandan, telur ayam dadar cincang hati ayam.",
          nutrisi: "Karbohidrat Gurih, Protein Hewani Ganda, Zat Besi",
          khasiat: "Membangkitkan selera makan pagi balita dengan aroma rempah tradisional.",
        },
        {
          waktu: "Selingan Pagi (10.00)",
          menu: "Bubur Kacang Hijau Kupas Santan Daun Pandan",
          bahan: "Kacang hijau kupas lembut, santan sedang, sedikit gula aren kelapa.",
          nutrisi: "Vitamin B1 (Tiamin), Asam Folat, Serat Halus",
          khasiat: "Vitamin B1 mencegah anak lemas dan menstimulasi nafsu makan alami.",
        },
        {
          waktu: "Makan Siang (12.30)",
          menu: "Nasi Tim Sup Ayam Kampung Kaldu Ceker + Perkedel Tahu Daging",
          bahan: "Nasi tim kaldu, daging ayam kampung, wortel, tahu lumat daging giling kukus.",
          nutrisi: "Kolagen Alami, Protein Hewani & Nabati Lengkap",
          khasiat: "Kombinasi protein lengkap untuk percepatan penambahan berat badan.",
        },
        {
          waktu: "Selingan Sore (16.00)",
          menu: "Nagasari Pisang Kepok Santan Kukus Tradisional",
          bahan: "Tepung beras, santan kelapa, pisang kepok matang manis alami dibungkus daun pisang.",
          nutrisi: "Kalium, Energi Cepat Saji, Karbohidrat Ramah Usus",
          khasiat: "Kudapan padat energi ramah cerna yang disukai semua anak balita.",
        },
        {
          waktu: "Makan Malam (18.30)",
          menu: "Bubur Beras Ikan Tongkol Suwir Santan Kemangi Halus",
          bahan: "Beras pulen, fillet ikan tongkol segar kukus suwir, santan gurih, bayam lembut.",
          nutrisi: "Protein Laut Tinggi, Kalsium, Lemak Sehat",
          khasiat: "Menutup kebutuhan harian kalori dan zat pembangun tubuh secara optimal.",
        },
      ];
    }

    if (isLebih) {
      return [
        {
          waktu: "Sarapan Pagi (07.00)",
          menu: "Bubur Beras Merah Dada Ayam Kukus + Wortel Parut",
          bahan: "Beras merah, dada ayam tanpa kulit kukus suwir halus, wortel parut kuah bening.",
          nutrisi: "Serat Pangan Tinggi, Protein Rendah Lemak Jenuh",
          khasiat: "Memberikan rasa kenyang bertahan lama tanpa lonjakan kalori berlebih.",
        },
        {
          waktu: "Selingan Pagi (10.00)",
          menu: "Potongan Buah Pepaya California Dingin Segar",
          bahan: "Pepaya matang segar dipotong dadu kecil atau dilumatkan halus.",
          nutrisi: "Vitamin C (62mg), Enzim Papain, Serat Alami",
          khasiat: "Melancarkan buang air besar dan menghindarkan anak dari camilan manis kemasan.",
        },
        {
          waktu: "Makan Siang (12.30)",
          menu: "Nasi Porsi Pas + Ikan Mujair Kuah Pindang Bening + Sayur Bayam",
          bahan: "Nasi putih porsi sedang (3/4 mangkuk), ikan mujair kukus bumbu bening asam manis, bayam.",
          nutrisi: "Protein Berkualitas, Kalsium, Antioksidan",
          khasiat: "Mempertahankan massa otot aktif tanpa menimbun cadangan lemak berlebih.",
        },
        {
          waktu: "Selingan Sore (16.00)",
          menu: "Semangka Merah Segar / Puree Melon Dingin",
          bahan: "Semangka merah manis potong dadu tanpa biji.",
          nutrisi: "Air Murni (92%), Likopen, Kalium",
          khasiat: "Menyegarkan tubuh dan memenuhi cairan harian anak secara alami.",
        },
        {
          waktu: "Makan Malam (18.30)",
          menu: "Sup Bola Ayam Tahu Jamur Kuping + Jagung Manis Pipil",
          bahan: "Daging ayam giling campur tahu sutra rebus, jamur kuping cincang, kaldu bening.",
          nutrisi: "Protein Ringan, Serat Larut, Fosfor",
          khasiat: "Menu malam ringan yang ramah saluran cerna sebelum waktu tidur anak.",
        },
      ];
    }

    // Default: Normal & Optimal
    return [
      {
        waktu: "Sarapan Pagi (07.00)",
        menu: "Nasi Tim Kuning Ikan Kembung + Tomat Cincang",
        bahan: "Beras pulen, fillet ikan kembung segar, kunyit, tomat cincang manis, 1 sdt minyak kelapa.",
        nutrisi: "Omega-3 DHA, Protein Hewani 20g, Likopen",
        khasiat: "Mempertahankan daya konsentrasi otak anak dan imunitas prima.",
      },
      {
        waktu: "Selingan Pagi (10.00)",
        menu: "Puree Pisang Ambon + Kuning Telur Rebus Halus",
        bahan: "Pisang ambon matang dihaluskan bersama kuning telur ayam rebus.",
        nutrisi: "Kolin, Kalium, Protein Lengkap",
        khasiat: "Energi segar dan pemenuhan asam amino pembangun harian.",
      },
      {
        waktu: "Makan Siang (12.30)",
        menu: "Nasi Tim Hati Sapi Masak Kecap Manis + Sayur Lodeh Labu Siam",
        bahan: "Nasi pulen, hati sapi segar dipotong dadu kecil masak kecap, labu siam santan tipis.",
        nutrisi: "Zat Besi Heme, Vitamin B12, Kalium",
        khasiat: "Mencegah anemia dan memastikan sirkulasi oksigen ke otak tetap optimal.",
      },
      {
        waktu: "Selingan Sore (16.00)",
        menu: "Kudapan Barongko Pisang Kukus Santan Gurih",
        bahan: "Pisang kepok, santan segar, telur ayam dibungkus daun pisang lalu dikukus harum.",
        nutrisi: "Energi Nusantara Sehat, Vitamin B Kompleks",
        khasiat: "Kudapan lezat tradisi Nusantara tanpa bahan pengawet sintetis.",
      },
      {
        waktu: "Makan Malam (18.30)",
        menu: "Sup Makaroni Ayam Kampung Bakso Ikan + Wortel Manis",
        bahan: "Makaroni lembut, suwir ayam kampung, bakso ikan tenggiri/lele buatan sendiri, wortel.",
        nutrisi: "Protein Ganda, Kalsium, Vitamin A",
        khasiat: "Menjaga kualitas tidur lelap anak untuk pelepasan hormon pertumbuhan maksimal.",
      },
    ];
  }, [isStunting, isWasting, isUnderweight, isLebih]);

  // ─── 3. KATALOG PANGAN LOKAL TERFILTER ──────────────────────────────────────
  const daftarPanganTerpilih = useMemo(() => {
    return KATALOG_PANGAN_INDONESIA.filter((item) => {
      if (filterKategori !== "semua" && item.kategori !== filterKategori) return false;
      return true;
    });
  }, [filterKategori]);

  // ─── 4. PANDUAN POLA MAKAN BERDASARKAN USIA ANAK ────────────────────────────
  const panduanUsia = useMemo(() => {
    if (umur < 6) {
      return {
        tahapan: "0 - 5 Bulan (ASI Eksklusif)",
        tekstur: "Cair murni (Hanya ASI / Air Susu Ibu)",
        frekuensi: "Sesering mungkin sesuai permintaan bayi (on-demand), minimal 8-12 kali sehari.",
        porsi: "Tidak boleh diberikan makanan atau minuman lain sama sekali, termasuk air putih atau madu.",
        tips: "Ibu harus mengonsumsi makanan bergizi kaya daun katuk, ikan, dan telur agar produksi ASI berlimpah dan kaya mikronutrien.",
      };
    }
    if (umur <= 8) {
      return {
        tahapan: "6 - 8 Bulan (MP-ASI Awal / Pengenalan Tekstur)",
        tekstur: "Bubur lumat saring kental (tidak mudah tumpah saat sendok dimiringkan).",
        frekuensi: "2 - 3 kali makan utama sehari + 1 - 2 kali makanan selingan buah lumat.",
        porsi: "Mulai dari 2-3 sendok makan bertahap ditingkatkan hingga 1/2 mangkuk berukuran 250 ml (sekitar 125 ml) tiap kali makan.",
        tips: "Kenalkan protein hewani sejak hari pertama MP-ASI (telur, hati, ikan). Jangan menunda pengenalan protein hewani.",
      };
    }
    if (umur <= 11) {
      return {
        tahapan: "9 - 11 Bulan (MP-ASI Lanjutan / Naik Tekstur)",
        tekstur: "Makanan cincang halus, cincang kasar, atau nasi tim lembek yang mudah dikunyah gusi anak.",
        frekuensi: "3 - 4 kali makan utama sehari + 1 - 2 kali makanan selingan padat nutrisi.",
        porsi: "1/2 mangkuk penuh berukuran 250 ml (sekitar 125 ml) tiap kali makan.",
        tips: "Berikan finger food (makanan yang bisa digenggam) seperti potongan wortel kukus atau telur rebus untuk melatih motorik halus anak.",
      };
    }
    if (umur <= 23) {
      return {
        tahapan: "12 - 23 Bulan (Makanan Keluarga Adaptasi)",
        tekstur: "Makanan keluarga dihaluskan atau dipotong kecil jika perlu (nasi pulen, lauk pauk keluarga tanpa cabai pedas).",
        frekuensi: "3 - 4 kali makan utama sehari + 2 kali makanan selingan bergizi.",
        porsi: "3/4 mangkuk berukuran 250 ml hingga 1 mangkuk penuh tiap kali makan.",
        tips: "Anak sudah makan bersama keluarga di meja makan. Hindari distraksi gawai/TV saat proses makan berlangsung.",
      };
    }
    return {
      tahapan: "24 - 59 Bulan (Balita Aktif / Makanan Keluarga Penuh)",
      tekstur: "Makanan keluarga utuh bergizi seimbang lengkap (Isi Piringku Kemenkes RI).",
      frekuensi: "3 kali makan utama sehari + 2 kali selingan buah atau kudapan tradisional.",
      porsi: "1 mangkuk penuh (250 ml) atau 1 piring sedang balita per kali makan.",
      tips: "Pastikan variasi lauk hewani berganti setiap hari agar balita tidak bosan dan kebutuhan mikronutriennya lengkap.",
    };
  }, [umur]);

  // ─── 5. FORMAT PESAN WHATSAPP IBU BALITA ────────────────────────────────────
  const handleCopyWhatsApp = () => {
    const namaAnak = form.nama_anak || "Ananda";
    const waText = `*PANDUAN INTERVENSI GIZI POSYANDU — ZEROSTUNTING AI*
Kepada Yth. Ibu dari ${namaAnak} (${umur} bulan)

*1. HASIL PEMERIKSAAN GIZI WHO:*
• Status Pertumbuhan: ${isStunting ? "⚠️ Waspada Stunting (PB/U < -2 SD)" : isWasting ? "⚠️ Waspada Gizi Kurang / Wasting" : isUnderweight ? "⚠️ Waspada Berat Badan Kurang" : isLebih ? "⚠️ Perhatian Gizi Lebih" : "✓ Normal & Ideal (Zona Hijau WHO)"}
• Berat / Panjang Badan: ${form.berat_kg} kg / ${form.tinggi_cm} cm
${result.lku ? `• Lingkar Kepala: ${result.lku.nilai_actual} cm (${result.lku.interpretasi})\n` : ""}${result.lila ? `• Lingkar Lengan: ${result.lila.nilai_actual} cm (${result.lila.interpretasi})\n` : ""}
*2. EVALUASI DOKTER & KADER POSYANDU:*
${evaluasiDetail.analisis}

*3. REKOMENDASI MENU PANGAN LOKAL INDONESIA:*
${menuHarian.map((m, idx) => `${idx + 1}. *${m.waktu}*: ${m.menu}\n   _Kandungan:_ ${m.nutrisi}`).join("\n")}

*4. JADWAL & TEKSTUR MP-ASI (USIA ${umur} BULAN):*
• Tekstur: ${panduanUsia.tekstur}
• Porsi & Frekuensi: ${panduanUsia.frekuensi} (${panduanUsia.porsi})

*5. PESAN KADER DESA:*
• Selalu cuci tangan pakai sabun sebelum menyuapi balita dan gunakan air matang.
• Jangan lupa hadir penimbangan bulan depan di Posyandu!

_Didukung oleh ZeroStunting AI Engine WHO 2006 & Kemenkes RI_`;

    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(waText).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      });
    }
  };

  // ─── 6. TEXT-TO-SPEECH (AUDIO EVALUASI INDONESIA) ───────────────────────────
  const handleToggleSpeech = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const namaAnak = form.nama_anak || "anak ibu";
    const textToSpeak = `Ibu balita, berikut hasil evaluasi gizi ananda ${namaAnak}. ${evaluasiDetail.analisis}. Rekomendasi menu pangan lokal: Untuk sarapan, berikan ${menuHarian[0].menu}. Untuk siang, ${menuHarian[2].menu}. Dan sore hari, ${menuHarian[3].menu}. Mari bersama jaga tumbuh kembang balita desa kita.`;

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = "id-ID";
    utterance.rate = 0.95;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div
      style={{
        background: "#FFFFFF",
        border: "1.5px solid #BBF7D0",
        borderRadius: 18,
        padding: "22px",
        marginTop: 18,
        boxShadow: "0 6px 20px rgba(22, 163, 74, 0.08)",
      }}
    >
      {/* ── HEADER PANEL ADVISORY ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: "linear-gradient(135deg, #DCFCE7, #BBF7D0)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#15803D",
              boxShadow: "0 2px 6px rgba(22, 163, 74, 0.15)",
            }}
          >
            <Sparkles size={20} />
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: 15, fontWeight: 900, color: "#0F172A", letterSpacing: "-0.01em" }}>
              Advisory Intervensi Gizi & Menu Pangan Lokal Indonesia
            </h4>
            <span style={{ fontSize: 11.5, color: "#16A34A", fontWeight: 700 }}>
              Terstandarisasi Pedoman MP-ASI Kemenkes RI & Baku WHO 2006
            </span>
          </div>
        </div>

        {/* Action Buttons: Audio & WhatsApp */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={handleToggleSpeech}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 14px",
              borderRadius: 9,
              border: "1px solid #CBD5E1",
              background: isSpeaking ? "#DCFCE7" : "#FFFFFF",
              color: isSpeaking ? "#15803D" : "#334155",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <Volume2 size={15} color={isSpeaking ? "#16A34A" : "#64748B"} />
            <span>{isSpeaking ? "Membacakan..." : "Audio AI"}</span>
          </button>

          <button
            type="button"
            onClick={handleCopyWhatsApp}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 16px",
              borderRadius: 9,
              border: copied ? "1.5px solid #86EFAC" : "1.5px solid #16A34A",
              background: copied ? "#DCFCE7" : "#16A34A",
              color: copied ? "#166534" : "#FFFFFF",
              fontSize: 12,
              fontWeight: 800,
              cursor: "pointer",
              boxShadow: copied ? "none" : "0 2px 6px rgba(22, 163, 74, 0.25)",
              transition: "all 0.15s ease",
            }}
          >
            {copied ? <Check size={15} /> : <Copy size={15} />}
            <span>{copied ? "Format WA Tersalin ✓" : "Salin Format WA Ibu"}</span>
          </button>
        </div>
      </div>

      {/* ── BANNER EVALUASI DETAIL GIZI ── */}
      <div
        style={{
          background: evaluasiDetail.warnaBg,
          border: `1.5px solid ${evaluasiDetail.warnaBorder}`,
          borderRadius: 14,
          padding: "16px 18px",
          marginBottom: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
          <span
            style={{
              fontSize: 10.5,
              fontWeight: 900,
              background: evaluasiDetail.warnaTeks,
              color: "#FFFFFF",
              padding: "3px 10px",
              borderRadius: 6,
              letterSpacing: "0.04em",
            }}
          >
            {evaluasiDetail.badge}
          </span>
          <span style={{ fontSize: 13, fontWeight: 800, color: evaluasiDetail.warnaTeks }}>
            {evaluasiDetail.judul}
          </span>
        </div>
        <p style={{ margin: "0 0 10px 0", fontSize: 13, color: "#1E293B", lineHeight: 1.6 }}>
          {evaluasiDetail.analisis}
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#0F172A", fontWeight: 700, borderTop: `1px dashed ${evaluasiDetail.warnaBorder}`, paddingTop: 8 }}>
          <Sparkles size={14} color="#16A34A" />
          <span>Fokus Pangan: <strong style={{ color: "#15803D" }}>{evaluasiDetail.prinsipPangan}</strong></span>
        </div>
      </div>

      {/* ── TAB NAVIGASI REKOMENDASI ── */}
      <div
        style={{
          display: "flex",
          gap: 6,
          marginBottom: 16,
          borderBottom: "1.5px solid #E2E8F0",
          paddingBottom: 8,
          overflowX: "auto",
        }}
      >
        {[
          { id: "menu", label: "Menu Harian Khas Desa", icon: Utensils },
          { id: "katalog", label: "Katalog Pangan Lokal Indonesia", icon: Apple },
          { id: "jadwal", label: "Jadwal & Pola Usia Anak", icon: Clock },
          { id: "tindak_lanjut", label: "Tindak Lanjut & Rujukan Kader", icon: ShieldAlert },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id as typeof activeTab)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 14px",
              borderRadius: 8,
              border: "none",
              background: activeTab === id ? "#16A34A" : "transparent",
              color: activeTab === id ? "#FFFFFF" : "#64748B",
              fontWeight: activeTab === id ? 800 : 600,
              fontSize: 12.5,
              cursor: "pointer",
              transition: "all 0.15s ease",
              whiteSpace: "nowrap",
            }}
          >
            <Icon size={14} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* ── KONTEN TAB 1: MENU HARIAN ── */}
      {activeTab === "menu" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontSize: 12.5, color: "#475569", marginBottom: 2 }}>
            Berikut panduan menu 1 hari berbasis bahan pangan lokal terjangkau di warung desa yang disusun khusus untuk mengejar pertumbuhan ideal anak:
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
            {menuHarian.map((m, idx) => (
              <div
                key={idx}
                style={{
                  background: "#F8FAF8",
                  border: "1.5px solid #E2E8F0",
                  borderRadius: 12,
                  padding: "14px 16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                  transition: "all 0.15s ease",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: "#16A34A", textTransform: "uppercase" }}>
                    {m.waktu}
                  </span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#64748B", background: "#FFFFFF", padding: "2px 8px", borderRadius: 6, border: "1px solid #E2E8F0" }}>
                    Lokal & Segar
                  </span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#0F172A", lineHeight: 1.3 }}>
                  {m.menu}
                </div>
                <div style={{ fontSize: 12, color: "#334155", lineHeight: 1.4 }}>
                  <strong style={{ color: "#475569" }}>Bahan: </strong>{m.bahan}
                </div>
                <div style={{
                  background: "#FFFFFF",
                  border: "1px solid #BBF7D0",
                  borderRadius: 8,
                  padding: "6px 10px",
                  marginTop: 4,
                  fontSize: 11.5,
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                }}>
                  <div style={{ color: "#15803D", fontWeight: 700 }}>
                    💎 Nutrisi Kunci: {m.nutrisi}
                  </div>
                  <div style={{ color: "#64748B" }}>
                    🎯 Khasiat: {m.khasiat}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── KONTEN TAB 2: KATALOG PANGAN LOKAL NUSANTARA ── */}
      {activeTab === "katalog" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Filter Pills Kategori */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#64748B", marginRight: 4 }}>
              Kategori Bahan:
            </span>
            {[
              { id: "semua", label: `Semua Pangan (${KATALOG_PANGAN_INDONESIA.length})` },
              { id: "hewani", label: "Protein Hewani (Prioritas Emas)" },
              { id: "nabati", label: "Protein Nabati Tradisional" },
              { id: "sayur", label: "Sayuran Superfood Desa" },
              { id: "buah_lemak", label: "Buah & Lemak Sehat Kalori" },
            ].map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setFilterKategori(id as typeof filterKategori)}
                style={{
                  padding: "5px 12px",
                  borderRadius: 20,
                  border: filterKategori === id ? "1.5px solid #16A34A" : "1.5px solid #E2E8F0",
                  background: filterKategori === id ? "#F0FDF4" : "#FFFFFF",
                  color: filterKategori === id ? "#15803D" : "#475569",
                  fontSize: 11.5,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Grid Kartu Pangan Lokal */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))", gap: 12 }}>
            {daftarPanganTerpilih.map((item) => {
              const isRekomendasiSpesifik = item.cocokUntuk.includes(statusKunci);
              return (
                <div
                  key={item.id}
                  style={{
                    background: isRekomendasiSpesifik ? "#F0FDF4" : "#FFFFFF",
                    border: isRekomendasiSpesifik ? "1.5px solid #86EFAC" : "1.5px solid #E2E8F0",
                    borderRadius: 12,
                    padding: "14px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                    position: "relative",
                  }}
                >
                  {isRekomendasiSpesifik && (
                    <div style={{
                      position: "absolute", top: 10, right: 10,
                      background: "#16A34A", color: "#FFFFFF",
                      fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 99,
                    }}>
                      ⭐ Sangat Dianjurkan
                    </div>
                  )}

                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 8,
                      background: item.kategori === "hewani" ? "#FEF3C7" : item.kategori === "sayur" ? "#DCFCE7" : "#E0F2FE",
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
                    }}>
                      {item.kategori === "hewani" ? "🐟" : item.kategori === "sayur" ? "🥬" : item.kategori === "nabati" ? "🍢" : "🥑"}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: "#0F172A" }}>
                        {item.nama}
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#16A34A" }}>
                        {item.tagKhasiat}
                      </div>
                    </div>
                  </div>

                  <div style={{ fontSize: 11.5, color: "#334155", marginTop: 2 }}>
                    <strong>Kandungan Gizi: </strong>{item.nutrisiKunci}
                  </div>

                  <div style={{ fontSize: 11.5, color: "#475569", lineHeight: 1.4 }}>
                    <strong>Manfaat Fisiologis: </strong>{item.mengapaPenting}
                  </div>

                  <div style={{
                    marginTop: "auto",
                    paddingTop: 6,
                    borderTop: "1px dashed #CBD5E1",
                    fontSize: 11.5,
                    color: "#0F172A",
                  }}>
                    🍲 <strong>Contoh Olahan Balita: </strong>{item.contohMenu}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── KONTEN TAB 3: JADWAL & TEKSTUR BERDASARKAN USIA ── */}
      {activeTab === "jadwal" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Card Usia Balita Aktif */}
          <div style={{
            background: "#F0FDF4",
            border: "1.5px solid #BBF7D0",
            borderRadius: 14,
            padding: "16px 20px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 900, background: "#16A34A", color: "#FFFFFF", padding: "3px 10px", borderRadius: 6 }}>
                TAHAP USIA ANAK SAAT INI
              </span>
              <span style={{ fontSize: 14, fontWeight: 800, color: "#0F172A" }}>
                {form.nama_anak || "Ananda"} ({umur} Bulan)
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, marginTop: 12 }}>
              <div style={{ background: "#FFFFFF", padding: "12px", borderRadius: 10, border: "1px solid #E2E8F0" }}>
                <div style={{ fontSize: 11, color: "#64748B", fontWeight: 700 }}>TEKSTUR MAKANAN</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#0F172A", marginTop: 2 }}>{panduanUsia.tekstur}</div>
              </div>
              <div style={{ background: "#FFFFFF", padding: "12px", borderRadius: 10, border: "1px solid #E2E8F0" }}>
                <div style={{ fontSize: 11, color: "#64748B", fontWeight: 700 }}>FREKUENSI MAKAN</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#0F172A", marginTop: 2 }}>{panduanUsia.frekuensi}</div>
              </div>
              <div style={{ background: "#FFFFFF", padding: "12px", borderRadius: 10, border: "1px solid #E2E8F0" }}>
                <div style={{ fontSize: 11, color: "#64748B", fontWeight: 700 }}>PORSI PER KALI MAKAN</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#0F172A", marginTop: 2 }}>{panduanUsia.porsi}</div>
              </div>
            </div>

            <div style={{ marginTop: 12, fontSize: 12.5, color: "#166534", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
              <Info size={16} />
              <span>{panduanUsia.tips}</span>
            </div>
          </div>

          {/* Jadwal Jam Makan Teratur (Responsive Feeding) */}
          <div style={{ background: "#FFFFFF", border: "1.5px solid #E2E8F0", borderRadius: 14, padding: "16px 20px" }}>
            <h5 style={{ margin: "0 0 10px 0", fontSize: 13.5, fontWeight: 800, color: "#0F172A" }}>
              Prinsip Pemberian Makan Responsif (Responsive Feeding):
            </h5>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: "#334155", lineHeight: 1.7 }}>
              <li><strong>Beri makan perlahan dan sabar:</strong> Dorong anak makan secara mandiri namun jangan pernah memaksakan makanan masuk jika anak menolak keras.</li>
              <li><strong>Kenali tanda lapar dan kenyang:</strong> Berhenti saat anak memalingkan muka atau menutup mulut rapat.</li>
              <li><strong>Tanpa distraksi:</strong> Jauhkan gawai/ponsel, TV, dan mainan saat makan agar anak sadar penuh dengan rasa dan tekstur makanannya.</li>
              <li><strong>Jaga kebersihan alat makan:</strong> Cuci tangan ibu dan anak dengan sabun mengalir sebelum makan, serta pastikan air minum telah dimasak matang.</li>
            </ul>
          </div>
        </div>
      )}

      {/* ── KONTEN TAB 4: TINDAK LANJUT KADER & RUJUKAN ── */}
      {activeTab === "tindak_lanjut" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ background: "#FFFBEB", border: "1.5px solid #FDE68A", borderRadius: 12, padding: "14px 18px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <AlertTriangle size={18} color="#D97706" />
              <span style={{ fontSize: 13.5, fontWeight: 800, color: "#92400E" }}>
                Kriteria Rujukan Segera ke Puskesmas (Bidan Desa & Petugas Gizi):
              </span>
            </div>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: "#78350F", lineHeight: 1.65 }}>
              <li><strong>Berat badan Tidak Naik 2 kali berturut-turut (2T):</strong> Segera bawa ke Puskesmas untuk pelacakan penyebab medis tersembunyi (misal: TBC anak atau infeksi saluran kemih).</li>
              <li><strong>Z-score Sangat Kurus (BB/PB &lt; -3 SD) atau Gizi Buruk:</strong> Wajib segera ditangani oleh dokter Puskesmas untuk pemberian F-100 atau RUTF (Ready-to-Use Therapeutic Food).</li>
              <li><strong>Tanda Bahaya Klinis:</strong> Balita mengalami edema (bengkak punggung kaki/tangan), demam tinggi, diare berulang, atau tampak sangat lemah dan apatis.</li>
              <li><strong>Lingkar Lengan (LiLA) Merah / &lt; 11.5 cm:</strong> Merupakan indikator risiko KEK akut yang memerlukan Program PMT Pemulihan selama 90 hari.</li>
            </ul>
          </div>

          <div style={{ background: "#F8FAFC", border: "1.5px solid #E2E8F0", borderRadius: 12, padding: "14px 18px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <CheckCircle2 size={18} color="#16A34A" />
              <span style={{ fontSize: 13.5, fontWeight: 800, color: "#0F172A" }}>
                Tugas Pendampingan Kader Posyandu di Lapangan:
              </span>
            </div>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: "#334155", lineHeight: 1.65 }}>
              <li>Lakukan <strong>kunjungan rumah (home-visit)</strong> dalam 7 hari ke depan untuk melihat langsung proses ibu memasak MP-ASI di dapur.</li>
              <li>Bantu ibu memanfaatkan pekarangan rumah untuk menanam daun kelor, bayam, atau beternak ayam petelur demi kemandirian pangan keluarga.</li>
              <li>Ingatkan ibu untuk membawa Buku KIA / KMS setiap bulan ke Posyandu tanpa terlewat.</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
