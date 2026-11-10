"use client";

import React, { useState, useMemo } from "react";
import {
  Sparkles, Volume2, Copy, Check, Apple, Heart, ShieldAlert,
  Utensils, BookOpen, Clock, AlertTriangle, CheckCircle2, ChevronRight,
  Info, Activity, Target, HeartHandshake, Smile, Eye, Timer, Smartphone,
  RotateCcw, XCircle, Stethoscope, AlertCircle, Home, Droplets, Pill,
  Phone, FileText
} from "lucide-react";
import type { AntropometriResult } from "@/lib/utils";

export interface AdvisoryCardProps {
  result: AntropometriResult;
  form: {
    nama_anak?: string;
    umur_bulan: number | string;
    berat_kg: number | string;
    tinggi_cm: number | string;
    jenis_kelamin: "L" | "P";
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// BASIS DATA PANGAN LOKAL INDONESIA (STANDAR KEMENKES RI)
// ─────────────────────────────────────────────────────────────────────────────

export interface PanganLokalItem {
  id: string;
  nama: string;
  kategori: "hewani" | "nabati" | "sayur" | "buah_lemak";
  nutrisiKunci: string[];
  tagKhasiat: string;
  contohMenu: string;
  mengapaPenting: string;
  cocokUntuk: ("stunting" | "wasting" | "underweight" | "normal" | "lebih")[];
}

export const KATALOG_PANGAN_INDONESIA: PanganLokalItem[] = [
  // 1. Protein Hewani
  {
    id: "ikan_kembung",
    nama: "Ikan Kembung",
    kategori: "hewani",
    nutrisiKunci: ["Omega-3 & DHA (2.2g/100g)", "Protein 21g", "Zat Besi"],
    tagKhasiat: "DHA Lebih Tinggi dari Salmon",
    contohMenu: "Nasi Tim Ikan Kembung Bumbu Kuning Santan Tipis",
    mengapaPenting: "Asam lemak esensial DHA sangat tinggi merangsang pembelahan sel otak balita dan menstimulasi hormon pertumbuhan tulang linear.",
    cocokUntuk: ["stunting", "underweight", "normal"],
  },
  {
    id: "hati_ayam",
    nama: "Hati Ayam Kampung",
    kategori: "hewani",
    nutrisiKunci: ["Zat Besi Heme (15.8mg)", "Zinc (3.2mg)", "Vitamin A"],
    tagKhasiat: "Juara 1 Zat Besi & Anti Anemia",
    contohMenu: "Bubur Hati Ayam Lumat Daun Kelor Kaldu Ceker",
    mengapaPenting: "Zat besi heme mudah diserap 3x lipat dibanding zat besi nabati, mencegah anemia defisiensi besi yang menjadi akar stunting.",
    cocokUntuk: ["stunting", "underweight", "wasting"],
  },
  {
    id: "ikan_gabus",
    nama: "Ikan Gabus (Channa striata)",
    kategori: "hewani",
    nutrisiKunci: ["Albumin (6.2g/100g)", "Zinc", "Asam Amino Lengkap"],
    tagKhasiat: "Raja Albumin & Regenerasi Sel",
    contohMenu: "Sup Bening Ikan Gabus Jagung Pipil & Wortel",
    mengapaPenting: "Kandungan albumin tertinggi mempercepat sintesis protein tubuh dan menaikkan berat badan balita gizi kurang secara konsisten.",
    cocokUntuk: ["wasting", "underweight", "stunting"],
  },
  {
    id: "telur_ayam",
    nama: "Telur Ayam Ras / Kampung",
    kategori: "hewani",
    nutrisiKunci: ["Kolin Murni", "Protein Sempurna (NPU 100)", "Lutein"],
    tagKhasiat: "Standar Emas Protein 1 Butir/Hari",
    contohMenu: "Telur Kukus Lembut Gurih (Chawanmushi Desa)",
    mengapaPenting: "Memiliki nilai cerna protein tertinggi (100) dan kolin untuk mielinisasi jaringan saraf otak balita usia emas.",
    cocokUntuk: ["stunting", "wasting", "underweight", "normal"],
  },
  {
    id: "ikan_teri",
    nama: "Ikan Teri Segar / Kering Tawar",
    kategori: "hewani",
    nutrisiKunci: ["Kalsium Organik (972mg/100g)", "Fosfor", "Fluor"],
    tagKhasiat: "Pondasi Kalsium Kepadatan Tulang",
    contohMenu: "Perkedel Tahu Teri Basah Halus Kukus",
    mengapaPenting: "Dimakan bersama durinya sehingga memberikan deposit kalsium alami terbaik untuk pemanjangan tulang tungkai anak.",
    cocokUntuk: ["stunting", "normal"],
  },
  {
    id: "daging_ayam",
    nama: "Daging Ayam Bagian Paha",
    kategori: "hewani",
    nutrisiKunci: ["Lemak Esensial Sehat", "Protein 18g", "Zinc Bioavailable"],
    tagKhasiat: "Padat Kalori & Lemak Sehat",
    contohMenu: "Opor Ayam Santan Sedang Labu Kuning",
    mengapaPenting: "Daging paha mengandung kalori dan zinc lebih tinggi dari dada, sangat baik untuk mengejar target berat badan balita kurus.",
    cocokUntuk: ["underweight", "wasting"],
  },

  // 2. Sayuran Superfood Desa
  {
    id: "daun_kelor",
    nama: "Daun Kelor (Moringa oleifera)",
    kategori: "sayur",
    nutrisiKunci: ["Kalsium 4x Susu", "Vitamin A 4x Wortel", "Vitamin C"],
    tagKhasiat: "Miracle Tree Superfood Posyandu",
    contohMenu: "Sayur Bening Daun Kelor Jagung Manis Pipil",
    mengapaPenting: "WHO mengakui daun kelor sebagai senjata ampuh pengentasan malnutrisi balita dunia karena densitas mikronutriennya yang luar biasa padat.",
    cocokUntuk: ["stunting", "underweight", "wasting", "normal"],
  },
  {
    id: "labu_kuning",
    nama: "Labu Kuning (Waluh)",
    kategori: "sayur",
    nutrisiKunci: ["Beta-Karoten", "Serat Halus Larut", "Kalium"],
    tagKhasiat: "Ramah Cerna & Pro-Vitamin A Alami",
    contohMenu: "Puree Labu Kuning Santan Manis Gurih",
    mengapaPenting: "Tekstur lumat alami mudah dicerna sistem enzimatik bayi 6-12 bulan dan kaya provitamin A pelindung mukosa usus.",
    cocokUntuk: ["underweight", "wasting", "normal"],
  },
  {
    id: "bayam_hijau",
    nama: "Bayam Hijau Segar",
    kategori: "sayur",
    nutrisiKunci: ["Asam Folat", "Lutein", "Kalsium", "Magnesium"],
    tagKhasiat: "Katalis Metabolisme Sel Balita",
    contohMenu: "Sup Bayam Kaldu Ayam Bening Bumbu Kunci",
    mengapaPenting: "Asam folat alami memicu replikasi DNA dalam masa percepatan tumbuh (growth spurt) balita.",
    cocokUntuk: ["stunting", "normal"],
  },

  // 3. Protein Nabati Tradisional
  {
    id: "tempe_kedelai",
    nama: "Tempe Kedelai Tradisional",
    kategori: "nabati",
    nutrisiKunci: ["Isoflavon", "Probiotik Fermentasi", "Peptida Pendek"],
    tagKhasiat: "Superfood Fermentasi Asli Nusantara",
    contohMenu: "Tempe Bacem Lembut Kukus Santan",
    mengapaPenting: "Proses fermentasi kapang Rhizopus memecah protein kompleks menjadi peptida pendek yang sangat ramah diserap usus balita.",
    cocokUntuk: ["stunting", "wasting", "underweight", "normal"],
  },
  {
    id: "kacang_hijau",
    nama: "Kacang Hijau Kupas",
    kategori: "nabati",
    nutrisiKunci: ["Vitamin B1 (Tiamin)", "Fosfor", "Mangan"],
    tagKhasiat: "Peningkat Nafsu Makan Alami",
    contohMenu: "Bubur Kacang Hijau Santan Daun Pandan",
    mengapaPenting: "Tiamin (B1) mengaktifkan enzim pengurai karbohidrat menjadi energi dan terbukti membangkitkan selera makan balita.",
    cocokUntuk: ["underweight", "wasting", "normal"],
  },

  // 4. Sumber Lemak Sehat & Buah Kalori
  {
    id: "santan_kelapa",
    nama: "Santan Kelapa Segar",
    kategori: "buah_lemak",
    nutrisiKunci: ["MCT (Medium Chain Triglycerides)", "Asam Laurat"],
    tagKhasiat: "Lemak Cepat Serap Pengungkit Kalori",
    contohMenu: "Pengganti Air Kaldu dalam Bubur MP-ASI",
    mengapaPenting: "MCT langsung diserap vena porta tanpa butuh asam empedu banyak, menjadi sumber kalori instan mengejar berat badan anak (KBM).",
    cocokUntuk: ["wasting", "underweight"],
  },
  {
    id: "alpukat_mentega",
    nama: "Alpukat Mentega",
    kategori: "buah_lemak",
    nutrisiKunci: ["Asam Oleat Tak Jenuh Tunggal", "Vitamin E", "Kalium"],
    tagKhasiat: "Lemak Otak & Peningkat Berat Badan",
    contohMenu: "Puree Alpukat Keruk Siram Santan Matang",
    mengapaPenting: "Memberikan kalori tinggi per suapan kecil tanpa membuat balita kekenyangan volume serat berlebih.",
    cocokUntuk: ["underweight", "wasting", "normal"],
  },
  {
    id: "pisang_ambon",
    nama: "Pisang Ambon / Kepok",
    kategori: "buah_lemak",
    nutrisiKunci: ["Kalium", "Fruktosa Alami", "Prebiotik Inulin"],
    tagKhasiat: "Energi Ramah Cerna & Penjaga Usus",
    contohMenu: "Lumat Pisang Ambon Campur Kuning Telur",
    mengapaPenting: "Inulin memelihara mikrobioma usus anak agar penyerapan nutrisi makanan lain berjalan optimal 100%.",
    cocokUntuk: ["stunting", "underweight", "normal"],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// STRUKTUR MENU MAKANAN HARIAN TERENCANA (BERMUTU & MUDAH DIPAHAMI)
// ─────────────────────────────────────────────────────────────────────────────

export interface MenuItem {
  waktu: string;
  jam: string;
  kategori: "utama" | "selingan";
  menu: string;
  komposisi: {
    karbo: string;
    protein: string;
    sayurBuah?: string;
    lemakSehat?: string;
  };
  nutrisiKunci: string[];
  khasiat: string;
  tipsMasak: string;
}

export function getMenuHarian(isStunting: boolean, isWasting: boolean, isUnderweight: boolean, isLebih: boolean): MenuItem[] {
  if (isStunting) {
    return [
      {
        waktu: "Sarapan Pagi",
        jam: "07.00 WIB",
        kategori: "utama",
        menu: "Bubur Tim Beras Merah Ikan Kembung Bumbu Kuning & Daun Kelor",
        komposisi: {
          karbo: "Beras merah lumat / Nasi tim pulen",
          protein: "Fillet ikan kembung segar (Kaya Omega-3 DHA)",
          sayurBuah: "Daun kelor cincang halus",
          lemakSehat: "1 sdt minyak kelapa murni (VCO)",
        },
        nutrisiKunci: ["Protein Hewani 18g", "Omega-3 DHA (2.2g)", "Kalsium Organik"],
        khasiat: "Memicu pelepasan hormon pertumbuhan tulang (IGF-1) dan menstimulasi pembelahan sel otak balita.",
        tipsMasak: "Kukus ikan dengan kunyit, serai, dan daun salam agar harum gurih alami tanpa merusak asam lemak DHA.",
      },
      {
        waktu: "Selingan Pagi",
        jam: "10.00 WIB",
        kategori: "selingan",
        menu: "Telur Ayam Kampung Rebus Lembut & Keruk Alpukat Mentega",
        komposisi: {
          karbo: "Puree buah alami",
          protein: "1 butir telur ayam kampung rebus matang lembut",
          sayurBuah: "1/2 buah alpukat mentega matang",
          lemakSehat: "Asam oleat alami buah alpukat",
        },
        nutrisiKunci: ["Kolin Murni", "Asam Lemak Sehat", "Lutein", "Protein Cerna 100"],
        khasiat: "Menyediakan kolin untuk mielinisasi jaringan saraf otak dan asam amino pembangun jaringan baru.",
        tipsMasak: "Rebus telur selama 8 menit agar kuning matang sempurna namun tetap lembut dan mudah dilumat gusi anak.",
      },
      {
        waktu: "Makan Siang",
        jam: "12.30 WIB",
        kategori: "utama",
        menu: "Nasi Tim Sup Hati Ayam Kampung & Perkedel Tahu Teri Segar",
        komposisi: {
          karbo: "Nasi lembek kaldu ceker ayam",
          protein: "Hati ayam kampung segar + Teri basah cincang",
          sayurBuah: "Wortel serut & labu siam kukus",
          lemakSehat: "1 sdt minyak kelapa / kaldu ceker gurih",
        },
        nutrisiKunci: ["Zat Besi Heme Tinggi (15.8mg)", "Kalsium Teri (972mg)", "Zinc", "Vitamin A"],
        khasiat: "Mencegah anemia mikrositik dan mendorong percepatan pemanjangan tulang tungkai anak.",
        tipsMasak: "Kucuri hati ayam dengan sedikit air jeruk nipis sebelum dimasak agar aroma segar dan tetap lezat.",
      },
      {
        waktu: "Selingan Sore",
        jam: "16.00 WIB",
        kategori: "selingan",
        menu: "Kudapan Nagasari Pisang Kepok Santan Kukus Tradisional",
        komposisi: {
          karbo: "Tepung beras pulen desa",
          protein: "Santan kelapa perasan murni",
          sayurBuah: "Pisang kepok kuning matang",
          lemakSehat: "Santan kelapa murni (MCT Alami)",
        },
        nutrisiKunci: ["Kalium Prebiotik", "Medium Chain Triglycerides", "Karbohidrat Halus"],
        khasiat: "Memelihara flora usus sehat agar penyerapan mikronutrien berjalan 100% optimal.",
        tipsMasak: "Kukus dalam balutan daun pisang asli untuk aroma alami menggugah selera tanpa pemanis buatan.",
      },
      {
        waktu: "Makan Malam",
        jam: "18.30 WIB",
        kategori: "utama",
        menu: "Nasi Tim Ikan Gabus Kuah Kuning & Tempe Bacem Kukus Halus",
        komposisi: {
          karbo: "Nasi tim pulen hangat",
          protein: "Fillet ikan gabus kukus + Tempe bacem kukus",
          sayurBuah: "Bayam hijau segar cincang",
          lemakSehat: "Kuah santan tipis bumbu kunyit",
        },
        nutrisiKunci: ["Albumin Tinggi (6.2g)", "Isoflavon Tempe", "Asam Folat", "Zinc"],
        khasiat: "Memaksimalkan sintesis protein dan perbaikan jaringan sel saat anak tertidur lelap semalaman.",
        tipsMasak: "Gunakan api kecil saat mematangkan ikan gabus agar kandungan albumin alami tidak terdenaturasi.",
      },
    ];
  }

  if (isWasting) {
    return [
      {
        waktu: "Sarapan Pagi",
        jam: "07.00 WIB",
        kategori: "utama",
        menu: "Bubur Santan Gurih Hati Sapi & Telur Puyuh Rebus",
        komposisi: {
          karbo: "Beras dimasak kaldu santan kental",
          protein: "Hati sapi segar cincang + 2 butir telur puyuh",
          sayurBuah: "Tomat cincang tanpa biji & labu kuning",
          lemakSehat: "1 sdm santan kental murni",
        },
        nutrisiKunci: ["Densitas Energi Padat", "Zat Besi Heme", "Lemak Sehat MCT", "Protein 17g"],
        khasiat: "Menaikkan kalori per suapan tanpa membebani kapasitas volume lambung balita yang kecil.",
        tipsMasak: "Masak bubur dengan perbandingan santan dan kaldu 1:2 agar rasa gurih alami dan tekstur sangat lumat.",
      },
      {
        waktu: "Selingan Pagi",
        jam: "10.00 WIB",
        kategori: "selingan",
        menu: "Puree Alpukat Mentega Siram Santan Matang Hangat",
        komposisi: {
          karbo: "Puree alpukat mentega",
          protein: "Kuning telur rebus parut",
          sayurBuah: "Alpukat mentega matang pohon",
          lemakSehat: "2 sdm santan kelapa matang hangat",
        },
        nutrisiKunci: ["Asam Oleat Tak Jenuh", "Vitamin E", "Kalori Cepat Serap"],
        khasiat: "Memulihkan lapisan lemak subkutan dan menambah berat badan anak secara konsisten.",
        tipsMasak: "Lumat alpukat dengan garpu bersama santan hangat tanpa tambahan gula pasir sintetis.",
      },
      {
        waktu: "Makan Siang",
        jam: "12.30 WIB",
        kategori: "utama",
        menu: "Nasi Tim Kaldu Ayam Kampung Kental & Ikan Gabus Suwir",
        komposisi: {
          karbo: "Nasi tim kaldu ceker kental",
          protein: "Daging ayam paha cincang + Ikan gabus kukus",
          sayurBuah: "Labu siam empuk kukus",
          lemakSehat: "Lemak alami kaldu paha & ceker ayam",
        },
        nutrisiKunci: ["Albumin Superfood", "Kolagen Alami", "Zinc Bioavailable", "Asam Lemak Esensial"],
        khasiat: "Memperbaiki atrofi massa otot anak dan memperkuat pertahanan dinding saluran cerna.",
        tipsMasak: "Rebus ceker dan tulang ayam dengan api kecil minimal 1 jam untuk mengekstraksi kolagen kaldu.",
      },
      {
        waktu: "Selingan Sore",
        jam: "16.00 WIB",
        kategori: "selingan",
        menu: "Puding Santan Labu Kuning Saus Gula Aren Tipis",
        komposisi: {
          karbo: "Labu kuning lumat",
          protein: "Agar-agar plain santan murni",
          sayurBuah: "Labu kuning kukus",
          lemakSehat: "Santan kelapa perasan sedang",
        },
        nutrisiKunci: ["Beta-Karoten Alami", "Serat Halus Larut Air", "Lemak Nabati Ramah Cerna"],
        khasiat: "Tekstur kenyal lembut mudah ditelan balita yang nafsu makannya menurun dan cepat diserap tubuh.",
        tipsMasak: "Saring labu kukus sebelum dicampur agar tekstur puding sangat lembut di lidah balita.",
      },
      {
        waktu: "Makan Malam",
        jam: "18.30 WIB",
        kategori: "utama",
        menu: "Bubur Manado Singkong Lumat & Ayam Paha Suwir Gurih",
        komposisi: {
          karbo: "Beras & singkong kuning lumat empuk",
          protein: "Daging ayam paha (kaya zinc & lemak baik)",
          sayurBuah: "Bayam hijau lembut & jagung manis pipil",
          lemakSehat: "1 sdt minyak kelapa / kaldu ayam kental",
        },
        nutrisiKunci: ["Karbohidrat Kompleks Padat", "Vitamin A", "Protein Lemak Sehat 16g"],
        khasiat: "Menyediakan cadangan kalori konstan semalaman untuk proses pemulihan berat badan saat tidur.",
        tipsMasak: "Gunakan daging paha ayam karena kandungan kalori dan zat besinya lebih tinggi dari dada.",
      },
    ];
  }

  if (isUnderweight) {
    return [
      {
        waktu: "Sarapan Pagi",
        jam: "07.00 WIB",
        kategori: "utama",
        menu: "Nasi Uduk Lembut Telur Dadar Gulung Cincang Hati",
        komposisi: {
          karbo: "Beras dimasak santan tipis, serai, daun salam",
          protein: "Telur ayam dadar gulung cincang hati ayam",
          sayurBuah: "Wortel serut kukus",
          lemakSehat: "Santan kelapa & minyak kelapa oles",
        },
        nutrisiKunci: ["Karbohidrat Gurih Aromatik", "Protein Hewani Ganda", "Zat Besi Heme"],
        khasiat: "Membangkitkan selera makan pagi anak dengan aroma gurih rempah tradisional yang ramah cerna.",
        tipsMasak: "Gulung telur dadar tipis-tipis lalu iris melintang agar bentuknya menarik bagi pandangan balita.",
      },
      {
        waktu: "Selingan Pagi",
        jam: "10.00 WIB",
        kategori: "selingan",
        menu: "Bubur Kacang Hijau Kupas Santan Daun Pandan",
        komposisi: {
          karbo: "Kacang hijau kupas lembut",
          protein: "Protein nabati kacang hijau kupas",
          sayurBuah: "Daun pandan wangi",
          lemakSehat: "Santan kelapa perasan sedang",
        },
        nutrisiKunci: ["Vitamin B1 (Tiamin) Tinggi", "Asam Folat", "Fosfor", "Serat Halus"],
        khasiat: "Tiamin (B1) terbukti menstimulasi nafsu makan balita dan mencegah kelesuan tubuh.",
        tipsMasak: "Gunakan kacang hijau kupas agar warna cerah dan kulit arinya tidak mengganjal tenggorokan anak.",
      },
      {
        waktu: "Makan Siang",
        jam: "12.30 WIB",
        kategori: "utama",
        menu: "Nasi Tim Sup Ayam Kampung Kaldu Ceker & Perkedel Tahu Daging",
        komposisi: {
          karbo: "Nasi tim pulen kaldu ceker",
          protein: "Daging ayam kampung suwir + Perkedel tahu daging",
          sayurBuah: "Wortel manis potong bunga",
          lemakSehat: "Minyak kelapa untuk menumis bumbu kaldu",
        },
        nutrisiKunci: ["Kolagen Alami Ceker", "Protein Komplit Hewani + Nabati", "Zinc"],
        khasiat: "Kombinasi asam amino lengkap untuk akselerasi penambahan massa berat badan balita.",
        tipsMasak: "Kukus perkedel tahu sebelum dipanggang sebentar agar teksturnya padat nutrisi dan tidak berminyak.",
      },
      {
        waktu: "Selingan Sore",
        jam: "16.00 WIB",
        kategori: "selingan",
        menu: "Kudapan Barongko Pisang Santan Lembut Kukus Daun",
        komposisi: {
          karbo: "Pisang kepok matang manis alami",
          protein: "Telur ayam kampung kocok lembut",
          sayurBuah: "Pisang kepok kuning",
          lemakSehat: "Santan kelapa segar",
        },
        nutrisiKunci: ["Energi Cepat Saji", "Kalium", "Vitamin B Kompleks", "Magnesium"],
        khasiat: "Kudapan padat kalori tanpa bahan pengawet yang disukai balita dengan selera makan selektif.",
        tipsMasak: "Blender pisang bersama santan dan telur sebelum dibungkus daun pisang agar tekstur lumer di mulut.",
      },
      {
        waktu: "Makan Malam",
        jam: "18.30 WIB",
        kategori: "utama",
        menu: "Bubur Beras Ikan Tongkol Suwir Santan Kemangi Halus",
        komposisi: {
          karbo: "Beras pulen dimasak bubur gurih",
          protein: "Fillet ikan tongkol segar kukus suwir",
          sayurBuah: "Daun bayam cincang & kemangi tipis",
          lemakSehat: "Santan kelapa segar",
        },
        nutrisiKunci: ["Protein Laut Segar (19g)", "Kalsium", "Asam Lemak Sehat"],
        khasiat: "Menutup kebutuhan harian kalori dan zat pembangun tubuh secara optimal sebelum istirahat malam.",
        tipsMasak: "Rebus ikan tongkol dengan daun jeruk dan asam gelugur agar kesegarannya terjaga dan bebas amis.",
      },
    ];
  }

  if (isLebih) {
    return [
      {
        waktu: "Sarapan Pagi",
        jam: "07.00 WIB",
        kategori: "utama",
        menu: "Bubur Beras Merah Dada Ayam Kukus & Serut Wortel Bening",
        komposisi: {
          karbo: "Beras merah porsi pas (1/2 mangkuk)",
          protein: "Dada ayam tanpa kulit kukus suwir halus",
          sayurBuah: "Wortel serut & buncis iris lembut",
          lemakSehat: "Minyak kelapa minim (1/2 sdt)",
        },
        nutrisiKunci: ["Serat Pangan Tinggi", "Protein Rendah Lemak (21g)", "Beta-Karoten"],
        khasiat: "Memberikan rasa kenyang bertahan lama dan mencegah lonjakan kalori gula berlebih.",
        tipsMasak: "Gunakan kuah kaldu bening tanpa santan, beri aroma bawang putih bakar yang gurih alami.",
      },
      {
        waktu: "Selingan Pagi",
        jam: "10.00 WIB",
        kategori: "selingan",
        menu: "Potongan Segar Pepaya California & Semangka Dingin",
        komposisi: {
          karbo: "Fruktosa buah alami",
          protein: "Biji chia / taburan tipis",
          sayurBuah: "Pepaya California & semangka potong dadu",
          lemakSehat: "Tanpa lemak tambahan",
        },
        nutrisiKunci: ["Vitamin C (62mg)", "Enzim Papain Alami", "Likopen", "Air Murni 90%"],
        khasiat: "Melancarkan saluran cerna dan menggantikan cemilan kemasan ultra-proses tinggi gula garam.",
        tipsMasak: "Sajikan dalam potongan finger food yang menarik agar anak belajar makan buah mandiri.",
      },
      {
        waktu: "Makan Siang",
        jam: "12.30 WIB",
        kategori: "utama",
        menu: "Nasi Porsi Pas & Ikan Mujair Kuah Pindang Bening Kemangi",
        komposisi: {
          karbo: "Nasi putih porsi terkontrol (1/2 centong)",
          protein: "Ikan mujair segar bumbu pindang bening",
          sayurBuah: "Sayur bening bayam jagung pipil",
          lemakSehat: "Lemak alami ikan air tawar",
        },
        nutrisiKunci: ["Protein Berkualitas Tinggi", "Antioksidan Alami", "Kalsium Tulang"],
        khasiat: "Menjaga perkembangan otot dan kepadatan tulang linier tanpa menambah timbunan lemak tubuh.",
        tipsMasak: "Bumbui kuah pindang dengan kunyit, daun salam, dan tomat agar segar tanpa minyak goreng.",
      },
      {
        waktu: "Selingan Sore",
        jam: "16.00 WIB",
        kategori: "selingan",
        menu: "Puding Agar-Agar Rumput Laut Bunga Telang & Puree Melon",
        komposisi: {
          karbo: "Serat larut rumput laut murni",
          protein: "Susu tanpa pemanis tambahan",
          sayurBuah: "Buah melon dingin parut",
          lemakSehat: "Bebas lemak jenuh",
        },
        nutrisiKunci: ["Serat Larut Air", "Antioksidan Antosianin", "Hidrasi Optimal"],
        khasiat: "Kudapan segar mengenyangkan dengan kalori rendah untuk menjaga berat badan tetap stabil.",
        tipsMasak: "Gunakan pemanis alami dari rasa melon manis tanpa tambahan gula pasir atau kental manis.",
      },
      {
        waktu: "Makan Malam",
        jam: "18.30 WIB",
        kategori: "utama",
        menu: "Sup Bola Daging Ayam Tahu Rebus & Jamur Tiram Kaldu Jamur",
        komposisi: {
          karbo: "Kentang rebus potong dadu kecil",
          protein: "Daging ayam giling campur tahu sutra",
          sayurBuah: "Jamur tiram cincang & brokoli rebus",
          lemakSehat: "Minyak wijen beberapa tetes",
        },
        nutrisiKunci: ["Protein Ringan Cerna", "Serat Prebiotik Jamur", "Fosfor"],
        khasiat: "Menu malam bernutrisi tinggi yang ramah saluran cerna dan tidak membebani metabolisme saat tidur.",
        tipsMasak: "Bentuk bola ayam tahu dengan sendok kecil lalu rebus dalam kuah kaldu mendidih sampai mengapung.",
      },
    ];
  }

  // Default: Normal & Tumbuh Kembang Prima
  return [
    {
      waktu: "Sarapan Pagi",
      jam: "07.00 WIB",
      kategori: "utama",
      menu: "Nasi Tim Kuning Ikan Kembung Segar & Tomat Cincang Gurih",
      komposisi: {
        karbo: "Beras pulen bumbu kunyit santan tipis",
        protein: "Fillet ikan kembung kukus tanpa duri",
        sayurBuah: "Tomat cincang manis & daun kelor",
        lemakSehat: "1 sdt minyak kelapa murni",
      },
      nutrisiKunci: ["Omega-3 DHA (Tinggi)", "Protein Hewani 20g", "Likopen", "Vitamin C"],
      khasiat: "Mempertahankan daya konsentrasi otak anak di masa eksplorasi dan menjaga imunitas prima.",
      tipsMasak: "Tumis bumbu kuning sebentar sebelum dimasukkan ke dalam beras tim agar aromanya wangi memikat.",
    },
    {
      waktu: "Selingan Pagi",
      jam: "10.00 WIB",
      kategori: "selingan",
      menu: "Puree Pisang Ambon & Lumat Kuning Telur Ayam Kampung",
      komposisi: {
        karbo: "Pisang ambon matang manis",
        protein: "Kuning telur ayam rebus matang lembut",
        sayurBuah: "Pisang ambon segar",
        lemakSehat: "Lemak sehat kolin kuning telur",
      },
      nutrisiKunci: ["Kolin Otak", "Kalium Alami", "Vitamin B6", "Protein Sempurna"],
      khasiat: "Memberikan energi ramah cerna dan asam amino esensial untuk aktivitas bermain balita.",
      tipsMasak: "Campur lumat kuning telur selagi hangat agar membaur lembut menyatu dengan pisang ambon.",
    },
    {
      waktu: "Makan Siang",
      jam: "12.30 WIB",
      kategori: "utama",
      menu: "Nasi Tim Hati Ayam Kecap Gurih & Sayur Lodeh Labu Siam Halus",
      komposisi: {
        karbo: "Nasi pulen tim hangat",
        protein: "Hati ayam kampung segar bumbu kecap",
        sayurBuah: "Labu siam empuk kuah santan tipis",
        lemakSehat: "Santan kelapa encer bergizi",
      },
      nutrisiKunci: ["Zat Besi Heme (Cepat Serap)", "Vitamin B12", "Asam Folat", "Vitamin A"],
      khasiat: "Mencegah penurunan hemoglobin darah dan memastikan suplai oksigen optimal ke seluruh organ.",
      tipsMasak: "Potong dadu kecil hati ayam agar pas di mulut balita dan masak bumbu kecap manis tidak pedas.",
    },
    {
      waktu: "Selingan Sore",
      jam: "16.00 WIB",
      kategori: "selingan",
      menu: "Kudapan Barongko Pisang Santan Kukus Daun Tradisional",
      komposisi: {
        karbo: "Pisang kepok manis matang",
        protein: "Telur ayam segar",
        sayurBuah: "Pisang kepok",
        lemakSehat: "Santan kelapa perasan segar",
      },
      nutrisiKunci: ["Karbohidrat Halus", "Vitamin B Kompleks", "Kalsium Nabati"],
      khasiat: "Kudapan tradisi Nusantara kaya gizi tanpa pemanis buatan maupun pengawet sintetis.",
      tipsMasak: "Bungkus daun pisang yang telah dilayukan sebentar di atas api agar tidak mudah sobek saat dikukus.",
    },
    {
      waktu: "Makan Malam",
      jam: "18.30 WIB",
      kategori: "utama",
      menu: "Sup Makaroni Bakso Ikan Tenggiri Sayur & Kaldu Ayam",
      komposisi: {
        karbo: "Makaroni rebus empuk",
        protein: "Bakso ikan tenggiri buatan sendiri + Suwir ayam",
        sayurBuah: "Wortel bunga & seledri iris halus",
        lemakSehat: "Kaldu ayam kampung asli",
      },
      nutrisiKunci: ["Protein Ganda Hewani", "Kalsium Tulang", "Vitamin A Alami"],
      khasiat: "Menutup kebutuhan harian gizi dengan makanan berkuah hangat yang nyaman untuk tidur lelap.",
      tipsMasak: "Giling daging ikan tenggiri segar dengan sedikit tepung sagu dan putih telur untuk bakso kenyal alami.",
    },
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// EVALUASI GIZI & PANDUAN USIA (WHO / KEMENKES)
// ─────────────────────────────────────────────────────────────────────────────

export function getEvaluasiDetail(result: AntropometriResult) {
  const isStunting = result.ada_risiko_stunting;
  const isWasting = result.ada_risiko_wasting;
  const isUnderweight = result.ada_risiko_underweight;
  const isLebih = result.bbpb?.status === "gemuk" || result.bbu?.status === "lebih" || (result.bbpb?.zscore ?? 0) > 2;

  if (isStunting) {
    return {
      badge: "PRIORITAS TINGGI",
      judul: "Fokus Akselerasi Pertumbuhan Linier Tulang (Stunting)",
      analisis: "Panjang/tinggi badan anak berada di bawah standar baku WHO (Z-score PB/U < -2 SD). Diperlukan intervensi protein hewani harian tanpa jeda untuk memicu pelepasan hormon pertumbuhan tulang (IGF-1).",
      prinsipPangan: "Minimal 2 jenis protein hewani berbeda setiap hari (contoh: telur + ikan kembung) disertai asam amino esensial lengkap dan zinc.",
      warnaBg: "#FEF2F2",
      warnaBorder: "#FECACA",
      warnaTeks: "#B91C1C",
    };
  }
  if (isWasting) {
    return {
      badge: "DARURAT MEDIS RINGAN",
      judul: "Fokus Kejar Target Berat Badan (Wasting / Gizi Kurang)",
      analisis: "Proporsi berat badan terhadap panjang badannya di bawah batas aman (Z-score BB/PB < -2 SD). Berisiko tinggi mengalami penurunan imunitas dan rentan infeksi berulang.",
      prinsipPangan: "Tingkatkan densitas energi (padat kalori) dengan menambahkan lemak sehat seperti santan kelapa, minyak kelapa, atau margarin pada setiap porsi makan.",
      warnaBg: "#FFFBEB",
      warnaBorder: "#FDE68A",
      warnaTeks: "#B45309",
    };
  }
  if (isUnderweight) {
    return {
      badge: "PERINGATAN DINI",
      judul: "Fokus Peningkatan Berat Badan Ideal (Underweight)",
      analisis: "Berat badan anak menurut umurnya belum memenuhi kurva baku (Z-score BB/U < -2 SD). Bila dibiarkan dapat berlanjut menjadi stunting kronis.",
      prinsipPangan: "Pemberian kudapan selingan padat nutrisi di antara waktu makan utama. Maksimalkan asupan karbohidrat gurih dan telur rebus utuh.",
      warnaBg: "#FEF3C7",
      warnaBorder: "#FDE68A",
      warnaTeks: "#92400E",
    };
  }
  if (isLebih) {
    return {
      badge: "PEMANTAUAN KHUSUS",
      judul: "Stabilisasi Pertumbuhan & Pencegahan Obesitas Dini",
      analisis: "Berat badan anak melebihi proporsi panjang badannya (Z-score > +2 SD). Hindari asupan gula buatan, minuman berpemanis, atau makanan ultra-proses.",
      prinsipPangan: "Pertahankan porsi karbohidrat dan perbanyak porsi sayuran hijau berdaun serta buah berserat tinggi. Jangan batasi protein hewani pembangun.",
      warnaBg: "#F0F9FF",
      warnaBorder: "#BAE6FD",
      warnaTeks: "#0369A1",
    };
  }
  return {
    badge: "PERTUMBUHAN OPTIMAL",
    judul: "Status Gizi Baik & Tumbuh Kembang Prima (Zona Hijau WHO)",
    analisis: "Pertumbuhan berat badan dan tinggi badan anak berada dalam rentang deviasi baku ideal WHO. Pertahankan keragaman gizi dan pola asuh responsif.",
    prinsipPangan: "Lanjutkan pola makan gizi seimbang beragam: Isi Piringku Kemenkes RI dengan 1 butir telur/ikan setiap hari.",
    warnaBg: "#F0FDF4",
    warnaBorder: "#BBF7D0",
    warnaTeks: "#15803D",
  };
}

export function getPanduanUsia(umur: number) {
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
      porsi: "Mulai dari 2-3 sendok makan bertahap ditingkatkan hingga 1/2 mangkuk (sekitar 125 ml) tiap kali makan.",
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
      tekstur: "Makanan keluarga dihaluskan atau dipotong kecil jika perlu (nasi pulen, lauk pauk tanpa cabai pedas).",
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
}

// ─────────────────────────────────────────────────────────────────────────────
// KOMPONEN UTAMA ADVISORY CARD
// ─────────────────────────────────────────────────────────────────────────────

export function AdvisoryCard({ result, form }: AdvisoryCardProps) {
  const [copied, setCopied] = useState(false);
  const [copiedRujukan, setCopiedRujukan] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeTab, setActiveTab] = useState<"menu" | "katalog" | "jadwal" | "tindak_lanjut">("menu");
  const [menuFilter, setMenuFilter] = useState<"semua" | "utama" | "selingan">("semua");
  const [filterKategori, setFilterKategori] = useState<"semua" | "hewani" | "nabati" | "sayur" | "buah_lemak">("semua");

  const umur = typeof form.umur_bulan === "number" ? form.umur_bulan : parseInt(String(form.umur_bulan)) || 0;
  const evaluasiDetail = useMemo(() => getEvaluasiDetail(result), [result]);
  const panduanUsia = useMemo(() => getPanduanUsia(umur), [umur]);

  const isStunting = result.ada_risiko_stunting;
  const isWasting = result.ada_risiko_wasting;
  const isUnderweight = result.ada_risiko_underweight;
  const isLebih = result.bbpb?.status === "gemuk" || result.bbu?.status === "lebih" || (result.bbpb?.zscore ?? 0) > 2;

  const statusKunci: "stunting" | "wasting" | "underweight" | "normal" | "lebih" = isStunting
    ? "stunting"
    : isWasting
    ? "wasting"
    : isUnderweight
    ? "underweight"
    : isLebih
    ? "lebih"
    : "normal";

  const allMenuHarian = useMemo(() => {
    return getMenuHarian(isStunting, isWasting, isUnderweight, isLebih);
  }, [isStunting, isWasting, isUnderweight, isLebih]);

  const filteredMenuHarian = useMemo(() => {
    if (menuFilter === "semua") return allMenuHarian;
    return allMenuHarian.filter((m) => m.kategori === menuFilter);
  }, [allMenuHarian, menuFilter]);

  const daftarPanganTerpilih = useMemo(() => {
    return KATALOG_PANGAN_INDONESIA.filter((item) => {
      if (filterKategori !== "semua" && item.kategori !== filterKategori) return false;
      return true;
    });
  }, [filterKategori]);

  const handleCopyWhatsApp = () => {
    const namaAnak = form.nama_anak || "Ananda";
    const waText = `*PANDUAN INTERVENSI GIZI POSYANDU — ANANTA*
Kepada Yth. Orang Tua / Ibu dari ${namaAnak} (${umur} bulan)

*1. HASIL EVALUASI GIZI WHO 2006:*
• Status Pertumbuhan: ${evaluasiDetail.badge} (${evaluasiDetail.judul})
• Berat / Panjang Badan: ${form.berat_kg} kg / ${form.tinggi_cm} cm
${result.lku ? `• Lingkar Kepala: ${result.lku.nilai_actual} cm (${result.lku.interpretasi})\n` : ""}${result.lila ? `• Lingkar Lengan: ${result.lila.nilai_actual} cm (${result.lila.interpretasi})\n` : ""}
*2. SARAN INTERVENSI:*
${evaluasiDetail.analisis}
*Fokus Pangan:* ${evaluasiDetail.prinsipPangan}

*3. REKOMENDASI POLA 5 WAKTU MAKAN:*
${allMenuHarian.map((m, idx) => `${idx + 1}. *${m.waktu} (${m.jam})* — ${m.menu}\n   • _Komposisi:_ ${m.komposisi.protein} + ${m.komposisi.karbo}${m.komposisi.sayurBuah ? ` + ${m.komposisi.sayurBuah}` : ""}\n   • _Gizi:_ ${m.nutrisiKunci.join(", ")}\n   • _Manfaat:_ ${m.khasiat}`).join("\n\n")}

*4. PANDUAN PEMBERIAN MAKAN (USIA ${umur} BULAN):*
• Tekstur Makanan: ${panduanUsia.tekstur}
• Porsi & Frekuensi: ${panduanUsia.frekuensi} (${panduanUsia.porsi})

*5. PESAN KADER POSYANDU:*
• Pastikan peralatan makan selalu bersih dan gunakan air matang.
• Jangan lupa hadir penimbangan bulan depan di Posyandu!

_Dicetak otomatis oleh Sistem Cerdas Posyandu Ananta & Kemenkes RI_`;

    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(waText).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      });
    }
  };

  const handleToggleSpeech = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const namaAnak = form.nama_anak || "anak ibu";
    const textToSpeak = `Ibu balita, berikut panduan gizi untuk ananda ${namaAnak}. Status: ${evaluasiDetail.judul}. ${evaluasiDetail.analisis}. Fokus pangan harian: ${evaluasiDetail.prinsipPangan}.`;

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = "id-ID";
    utterance.rate = 0.95;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleCopyRujukan = () => {
    const namaAnak = form.nama_anak || "Ananda";
    const tanggalHariIni = new Date().toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const statusTeks = result.ada_risiko_wasting
      ? "Wasting / Gizi Kurang Akut (BB/PB < -2 SD)"
      : result.ada_risiko_stunting
      ? "Stunting Kronis (PB/U < -2 SD)"
      : result.ada_risiko_underweight
      ? "Berat Badan Kurang / Underweight (BB/U < -2 SD)"
      : "Evaluasi Rutin Posyandu (Normal)";

    const rujukanText = `*SURAT PENGANTAR RUJUKAN KADER POSYANDU*
Tanggal: ${tanggalHariIni}

Kepada Yth.
*Bidan Desa / Tenaga Pelaksana Gizi (TPG) Puskesmas*
Di Tempat.

Dengan hormat, bersama pesan ini kami merujuk balita binaan Posyandu:
• *Nama Balita:* ${namaAnak}
• *Jenis Kelamin:* ${form.jenis_kelamin === "L" ? "Laki-laki" : "Perempuan"}
• *Usia:* ${umur} Bulan
• *Berat / Panjang Badan:* ${form.berat_kg} kg / ${form.tinggi_cm} cm
${result.lku ? `• *Lingkar Kepala:* ${result.lku.nilai_actual} cm (${result.lku.interpretasi})\n` : ""}${result.lila ? `• *Lingkar Lengan (LiLA):* ${result.lila.nilai_actual} cm (${result.lila.interpretasi})\n` : ""}
*HASIL SKRINING ANTROPOMETRI (WHO 2006):*
• *Indikasi:* ${statusTeks}
• *Catatan Pertumbuhan:* ${evaluasiDetail.analisis}

*ALASAN RUJUKAN KE FASILITAS KESEHATAN:*
1. Konfirmasi diagnosis antropometri oleh Bidan Desa / Tenaga Gizi.
2. Skrining medis penyakit penyerta (TBC anak, diare kronis, alergi, atau infeksi berulang).
3. Pertimbangan Makanan Tambahan Pemulihan (PMT Pemulihan/PKMK) atau rujukan spesialis anak Puskesmas.

Demikian rujukan ini kami sampaikan, mohon penanganan dan arahan lebih lanjut. Terima kasih.

_Kader Posyandu — Aplikasi Antropometri Cerdas Ananta_`;

    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(rujukanText).then(() => {
        setCopiedRujukan(true);
        setTimeout(() => setCopiedRujukan(false), 2500);
      });
    }
  };

  return (
    <div
      style={{
        background: "#FFFFFF",
        border: "1px solid #E2E8F0",
        borderRadius: 16,
        padding: "22px 24px",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
      }}
    >
      {/* ── HEADER UTAMA ADVISORY ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: "#DCFCE7",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#15803D",
            }}
          >
            <Utensils size={19} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#0F172A" }}>
              Pusat Panduan Intervensi Gizi & Menu Makanan Balita
            </h3>
            <span style={{ fontSize: 12, color: "#64748B" }}>
              Standar Pedoman MP-ASI Kemenkes RI & Baku WHO 2006 • Bahan Pangan Lokal Desa
            </span>
          </div>
        </div>

        {/* Action Buttons: Audio AI & Salin WA */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={handleToggleSpeech}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: "6px 13px",
              borderRadius: 8,
              border: "1px solid #CBD5E1",
              background: isSpeaking ? "#DCFCE7" : "#FFFFFF",
              color: isSpeaking ? "#15803D" : "#334155",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <Volume2 size={14} color={isSpeaking ? "#16A34A" : "#64748B"} />
            <span>{isSpeaking ? "Membacakan..." : "Audio AI"}</span>
          </button>

          <button
            type="button"
            onClick={handleCopyWhatsApp}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: "6px 14px",
              borderRadius: 8,
              border: copied ? "1.5px solid #86EFAC" : "1px solid #16A34A",
              background: copied ? "#DCFCE7" : "#16A34A",
              color: copied ? "#166534" : "#FFFFFF",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            <span>{copied ? "Format Tersalin" : "Salin Format WA"}</span>
          </button>
        </div>
      </div>

      {/* ── BANNER EVALUASI STATUS GIZI ── */}
      <div
        style={{
          background: evaluasiDetail.warnaBg,
          border: `1px solid ${evaluasiDetail.warnaBorder}`,
          borderRadius: 12,
          padding: "14px 16px",
          marginBottom: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5, flexWrap: "wrap" }}>
          <span
            style={{
              fontSize: 10.5,
              fontWeight: 800,
              background: evaluasiDetail.warnaTeks,
              color: "#FFFFFF",
              padding: "2px 8px",
              borderRadius: 5,
              letterSpacing: "0.03em",
            }}
          >
            {evaluasiDetail.badge}
          </span>
          <span style={{ fontSize: 13, fontWeight: 700, color: evaluasiDetail.warnaTeks }}>
            {evaluasiDetail.judul}
          </span>
        </div>
        <p style={{ margin: "0 0 8px 0", fontSize: 12.5, color: "#1E293B", lineHeight: 1.55 }}>
          {evaluasiDetail.analisis}
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#0F172A", fontWeight: 600, borderTop: `1px dashed ${evaluasiDetail.warnaBorder}`, paddingTop: 6 }}>
          <Sparkles size={14} color="#16A34A" />
          <span>Fokus Pangan Harian: <strong style={{ color: "#15803D" }}>{evaluasiDetail.prinsipPangan}</strong></span>
        </div>
      </div>

      {/* ── 4 TAB NAVIGASI HORIZONTAL ── */}
      <div
        style={{
          display: "flex",
          gap: 6,
          background: "#F1F5F9",
          padding: 4,
          borderRadius: 10,
          marginBottom: 16,
          overflowX: "auto",
        }}
      >
        {[
          { id: "menu" as const, label: "Menu Harian Khas Desa (5 Waktu Makan)", icon: Utensils },
          { id: "katalog" as const, label: "Katalog Pangan Lokal Indonesia", icon: Apple },
          { id: "jadwal" as const, label: `Pola Asuh Usia (${umur} bln)`, icon: Clock },
          { id: "tindak_lanjut" as const, label: "Tindak Lanjut & Rujukan Kader", icon: ShieldAlert },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              padding: "8px 12px",
              borderRadius: 7,
              border: "none",
              background: activeTab === id ? "#FFFFFF" : "transparent",
              color: activeTab === id ? "#0F172A" : "#64748B",
              fontWeight: activeTab === id ? 700 : 600,
              fontSize: 12.5,
              cursor: "pointer",
              boxShadow: activeTab === id ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              transition: "all 0.15s ease",
              whiteSpace: "nowrap",
            }}
          >
            <Icon size={14} color={activeTab === id ? "#16A34A" : "#64748B"} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* ── KONTAINER ISI TAB (MIN-HEIGHT 340PX AGAR STABIL) ── */}
      <div style={{ minHeight: "340px" }}>
        {/* ═════════════════════════════════════════════════════════════════════ */}
        {/* TAB 1: MENU HARIAN KHAS DESA (BERSIH, RAPI, BERMUTU, MUDAH DIPAHAMI) */}
        {/* ═════════════════════════════════════════════════════════════════════ */}
        {activeTab === "menu" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Toolbar Filter Waktu Makan */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
              <div style={{ fontSize: 12.5, color: "#475569" }}>
                Pola makan harian seimbang: <strong>3 kali makan utama</strong> padat protein hewani + <strong>2 kali kudapan gizi</strong>.
              </div>

              {/* Segmented Filter */}
              <div style={{ display: "flex", gap: 4, background: "#F8FAFC", padding: 3, borderRadius: 8, border: "1px solid #E2E8F0" }}>
                {[
                  { id: "semua" as const, label: `Semua (${allMenuHarian.length})` },
                  { id: "utama" as const, label: "3 Makan Utama" },
                  { id: "selingan" as const, label: "2 Selingan" },
                ].map(({ id, label }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setMenuFilter(id)}
                    style={{
                      padding: "4px 10px",
                      borderRadius: 6,
                      border: "none",
                      background: menuFilter === id ? "#16A34A" : "transparent",
                      color: menuFilter === id ? "#FFFFFF" : "#64748B",
                      fontSize: 11.5,
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid Kartu Menu yang Rapi & Profesional */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                gap: 16,
                alignItems: "stretch",
              }}
            >
              {filteredMenuHarian.map((m, idx) => (
                <div
                  key={idx}
                  style={{
                    background: "#FFFFFF",
                    border: "1px solid #E2E8F0",
                    borderRadius: 14,
                    padding: "16px 18px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
                    transition: "border-color 0.15s ease, box-shadow 0.15s ease",
                  }}
                >
                  <div>
                    {/* Header Baris Waktu & Kategori Makan */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <Clock size={13} color="#15803D" />
                        <span style={{ fontSize: 11, fontWeight: 800, color: "#15803D", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                          {m.waktu}
                        </span>
                        <span style={{ fontSize: 11, color: "#94A3B8" }}>•</span>
                        <span style={{ fontSize: 11, fontWeight: 600, color: "#64748B" }}>
                          {m.jam}
                        </span>
                      </div>

                      <span
                        style={{
                          fontSize: 10.5,
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: 6,
                          background: m.kategori === "utama" ? "#F0FDF4" : "#F0F9FF",
                          color: m.kategori === "utama" ? "#166534" : "#0369A1",
                          border: `1px solid ${m.kategori === "utama" ? "#BBF7D0" : "#BAE6FD"}`,
                        }}
                      >
                        {m.kategori === "utama" ? "Makan Utama" : "Selingan Gizi"}
                      </span>
                    </div>

                    {/* Nama Menu yang Berwibawa & Jelas */}
                    <h4
                      style={{
                        margin: "0 0 10px 0",
                        fontSize: 14.5,
                        fontWeight: 700,
                        color: "#0F172A",
                        lineHeight: 1.35,
                      }}
                    >
                      {m.menu}
                    </h4>

                    {/* Komposisi Isi Piringku (Terstruktur & Mudah Dipahami) */}
                    <div
                      style={{
                        background: "#F8FAFC",
                        border: "1px solid #F1F5F9",
                        borderRadius: 10,
                        padding: "10px 12px",
                        marginBottom: 10,
                        display: "flex",
                        flexDirection: "column",
                        gap: 4,
                        fontSize: 11.5,
                        color: "#334155",
                      }}
                    >
                      <div style={{ fontSize: 10, fontWeight: 800, color: "#64748B", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 2 }}>
                        Komposisi Piring Desa:
                      </div>
                      <div>
                        <span style={{ color: "#64748B" }}>🍚 Pokok: </span>
                        <strong>{m.komposisi.karbo}</strong>
                      </div>
                      <div>
                        <span style={{ color: "#64748B" }}>🐟 Protein Kunci: </span>
                        <strong style={{ color: "#15803D" }}>{m.komposisi.protein}</strong>
                      </div>
                      {m.komposisi.sayurBuah && (
                        <div>
                          <span style={{ color: "#64748B" }}>🥬 Sayur/Buah: </span>
                          <span>{m.komposisi.sayurBuah}</span>
                        </div>
                      )}
                      {m.komposisi.lemakSehat && (
                        <div>
                          <span style={{ color: "#64748B" }}>🥥 Lemak Tambahan: </span>
                          <span>{m.komposisi.lemakSehat}</span>
                        </div>
                      )}
                    </div>

                    {/* Target Gizi Unggulan (Pills Halus) */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 10 }}>
                      {m.nutrisiKunci.map((nutri, nIdx) => (
                        <span
                          key={nIdx}
                          style={{
                            fontSize: 10.5,
                            fontWeight: 600,
                            color: "#334155",
                            background: "#F1F5F9",
                            padding: "2px 7px",
                            borderRadius: 5,
                            border: "1px solid #E2E8F0",
                          }}
                        >
                          {nutri}
                        </span>
                      ))}
                    </div>

                    {/* Manfaat Tumbuh Kembang Klinis */}
                    <div
                      style={{
                        fontSize: 12,
                        color: "#334155",
                        lineHeight: 1.45,
                        marginBottom: 10,
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 6,
                      }}
                    >
                      <Target size={14} color="#16A34A" style={{ flexShrink: 0, marginTop: 2 }} />
                      <span>
                        <strong>Manfaat: </strong>
                        {m.khasiat}
                      </span>
                    </div>
                  </div>

                  {/* Tips Olahan Dapur Desa Kemenkes */}
                  <div
                    style={{
                      fontSize: 11.5,
                      color: "#166534",
                      background: "#F0FDF4",
                      border: "1px dashed #86EFAC",
                      borderRadius: 8,
                      padding: "8px 10px",
                      lineHeight: 1.45,
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 6,
                    }}
                  >
                    <Sparkles size={13} color="#16A34A" style={{ flexShrink: 0, marginTop: 2 }} />
                    <span>
                      <strong>Tips Olah: </strong>
                      {m.tipsMasak}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════════ */}
        {/* TAB 2: KATALOG PANGAN LOKAL INDONESIA (BERSIH & TERSTANDAR)         */}
        {/* ═════════════════════════════════════════════════════════════════════ */}
        {activeTab === "katalog" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Filter Kategori Pangan */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#64748B", marginRight: 4 }}>
                Filter Kategori:
              </span>
              {[
                { id: "semua" as const, label: `Semua Pangan (${KATALOG_PANGAN_INDONESIA.length})` },
                { id: "hewani" as const, label: "Protein Hewani (Prioritas)" },
                { id: "nabati" as const, label: "Protein Nabati" },
                { id: "sayur" as const, label: "Sayuran Hijau" },
                { id: "buah_lemak" as const, label: "Buah & Lemak Sehat" },
              ].map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setFilterKategori(id)}
                  style={{
                    padding: "5px 12px",
                    borderRadius: 20,
                    border: filterKategori === id ? "1.5px solid #16A34A" : "1px solid #CBD5E1",
                    background: filterKategori === id ? "#F0FDF4" : "#FFFFFF",
                    color: filterKategori === id ? "#15803D" : "#475569",
                    fontSize: 11.5,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Grid Pangan Lokal */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))", gap: 16 }}>
              {daftarPanganTerpilih.map((item) => {
                const isRekomendasiSpesifik = item.cocokUntuk.includes(statusKunci);
                return (
                  <div
                    key={item.id}
                    style={{
                      background: "#FFFFFF",
                      border: isRekomendasiSpesifik ? "1.5px solid #86EFAC" : "1px solid #E2E8F0",
                      borderRadius: 14,
                      padding: "16px 18px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      gap: 10,
                      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
                    }}
                  >
                    <div>
                      {/* Header Item */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 4 }}>
                        <div>
                          <div style={{ fontSize: 14.5, fontWeight: 700, color: "#0F172A" }}>
                            {item.nama}
                          </div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: "#16A34A" }}>
                            {item.tagKhasiat}
                          </div>
                        </div>

                        {isRekomendasiSpesifik && (
                          <span
                            style={{
                              background: "#F0FDF4",
                              color: "#166534",
                              border: "1px solid #BBF7D0",
                              fontSize: 10,
                              fontWeight: 700,
                              padding: "2px 7px",
                              borderRadius: 5,
                              whiteSpace: "nowrap",
                            }}
                          >
                            Prioritas Balita Ini
                          </span>
                        )}
                      </div>

                      {/* Gizi Kunci */}
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, margin: "8px 0" }}>
                        {item.nutrisiKunci.map((n, i) => (
                          <span
                            key={i}
                            style={{
                              fontSize: 10.5,
                              fontWeight: 600,
                              color: "#334155",
                              background: "#F8FAFC",
                              border: "1px solid #E2E8F0",
                              padding: "2px 6px",
                              borderRadius: 4,
                            }}
                          >
                            {n}
                          </span>
                        ))}
                      </div>

                      {/* Mengapa Penting */}
                      <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.45, marginTop: 6 }}>
                        <strong style={{ color: "#1E293B" }}>Khasiat Klinis: </strong>
                        {item.mengapaPenting}
                      </div>
                    </div>

                    {/* Inspirasi Olahan Desa */}
                    <div
                      style={{
                        paddingTop: 8,
                        borderTop: "1px dashed #E2E8F0",
                        fontSize: 11.5,
                        color: "#0F172A",
                      }}
                    >
                      <span style={{ color: "#64748B" }}>Inspirasi Menu: </span>
                      <strong>{item.contohMenu}</strong>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════════ */}
        {/* TAB 3: POLA ASUH & TEKSTUR USIA                                     */}
        {/* ═════════════════════════════════════════════════════════════════════ */}
        {activeTab === "jadwal" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div
              style={{
                background: "#F0FDF4",
                border: "1px solid #BBF7D0",
                borderRadius: 12,
                padding: "16px 18px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 11, fontWeight: 800, background: "#16A34A", color: "#FFFFFF", padding: "2px 8px", borderRadius: 5 }}>
                  TAHAPAN USIA BALITA
                </span>
                <span style={{ fontSize: 14, fontWeight: 800, color: "#0F172A" }}>
                  {form.nama_anak || "Ananda"} ({umur} Bulan)
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
                <div style={{ background: "#FFFFFF", padding: "12px", borderRadius: 10, border: "1px solid #E2E8F0" }}>
                  <div style={{ fontSize: 11, color: "#64748B", fontWeight: 600 }}>TEKSTUR MAKANAN</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", marginTop: 2 }}>{panduanUsia.tekstur}</div>
                </div>
                <div style={{ background: "#FFFFFF", padding: "12px", borderRadius: 10, border: "1px solid #E2E8F0" }}>
                  <div style={{ fontSize: 11, color: "#64748B", fontWeight: 600 }}>FREKUENSI MAKAN</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", marginTop: 2 }}>{panduanUsia.frekuensi}</div>
                </div>
                <div style={{ background: "#FFFFFF", padding: "12px", borderRadius: 10, border: "1px solid #E2E8F0" }}>
                  <div style={{ fontSize: 11, color: "#64748B", fontWeight: 600 }}>PORSI PER KALI MAKAN</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", marginTop: 2 }}>{panduanUsia.porsi}</div>
                </div>
              </div>

              <div style={{ marginTop: 12, fontSize: 12, color: "#166534", fontWeight: 600, display: "flex", alignItems: "flex-start", gap: 6, lineHeight: 1.5 }}>
                <Info size={15} style={{ flexShrink: 0, marginTop: 2 }} />
                <span>{panduanUsia.tips}</span>
              </div>
            </div>

            {/* Prinsip Pemberian Makan Responsif (Responsive Feeding) - Desain Menarik & Edukatif */}
            <div
              style={{
                background: "#FFFFFF",
                border: "1px solid #E2E8F0",
                borderRadius: 14,
                padding: "20px 22px",
                display: "flex",
                flexDirection: "column",
                gap: 16,
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
              }}
            >
              {/* Header Bagian Responsif */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 10,
                      background: "#F0FDF4",
                      border: "1px solid #BBF7D0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#15803D",
                      flexShrink: 0,
                    }}
                  >
                    <HeartHandshake size={20} />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#0F172A" }}>
                      Prinsip Pemberian Makan Responsif (Responsive Feeding)
                    </h4>
                    <p style={{ margin: "2px 0 0 0", fontSize: 12, color: "#64748B" }}>
                      Membangun kebiasaan makan sehat melalui komunikasi dua arah, kenyamanan emosional, dan disiplin waktu.
                    </p>
                  </div>
                </div>

                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: 700,
                    color: "#166534",
                    background: "#DCFCE7",
                    padding: "3px 9px",
                    borderRadius: 6,
                    border: "1px solid #86EFAC",
                  }}
                >
                  Pedoman Kemenkes RI & WHO
                </span>
              </div>

              {/* 6 Pilar Praktik Makan Responsif dalam Grid yang Rapi */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                  gap: 14,
                }}
              >
                {/* Pilar 1 */}
                <div
                  style={{
                    background: "#F8FAFC",
                    border: "1px solid #E2E8F0",
                    borderRadius: 12,
                    padding: "14px 15px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: 8,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 8,
                        background: "#E0F2FE",
                        color: "#0369A1",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Eye size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 800, color: "#0284C7", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                        Pilar 1 • Komunikasi
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>
                        Tatap Mata & Bicara Hangat
                      </div>
                    </div>
                  </div>
                  <p style={{ margin: 0, fontSize: 12, color: "#475569", lineHeight: 1.45 }}>
                    Duduk sejajar berhadapan dengan anak. Tersenyumlah dan ajak anak bercerita mengenai warna serta kelezatan makanannya.
                  </p>
                  <div style={{ fontSize: 11, color: "#0369A1", background: "#F0F9FF", border: "1px solid #BAE6FD", borderRadius: 6, padding: "5px 8px", lineHeight: 1.4 }}>
                    <strong>Kaidah:</strong> Ciptakan meja makan sebagai momen yang menyenangkan, bukan arena perselisihan.
                  </div>
                </div>

                {/* Pilar 2 */}
                <div
                  style={{
                    background: "#F8FAFC",
                    border: "1px solid #E2E8F0",
                    borderRadius: 12,
                    padding: "14px 15px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: 8,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 8,
                        background: "#DCFCE7",
                        color: "#15803D",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Smile size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 800, color: "#16A34A", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                        Pilar 2 • Isyarat Tubuh
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>
                        Peka Sinyal Lapar & Kenyang
                      </div>
                    </div>
                  </div>
                  <p style={{ margin: 0, fontSize: 12, color: "#475569", lineHeight: 1.45 }}>
                    Bila anak membuka mulut dengan antusias, segera suapi. Jika ia menutup mulut rapat atau memalingkan wajah, jangan dipaksa.
                  </p>
                  <div style={{ fontSize: 11, color: "#166534", background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 6, padding: "5px 8px", lineHeight: 1.4 }}>
                    <strong>Kaidah:</strong> Mencekoki paksa memicu trauma makan dan Gerakan Tutup Mulut (GTM) berulang.
                  </div>
                </div>

                {/* Pilar 3 */}
                <div
                  style={{
                    background: "#F8FAFC",
                    border: "1px solid #E2E8F0",
                    borderRadius: 12,
                    padding: "14px 15px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: 8,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 8,
                        background: "#FEF3C7",
                        color: "#B45309",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Timer size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 800, color: "#D97706", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                        Pilar 3 • Durasi
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>
                        Disiplin Maksimal 30 Menit
                      </div>
                    </div>
                  </div>
                  <p style={{ margin: 0, fontSize: 12, color: "#475569", lineHeight: 1.45 }}>
                    Batasi waktu satu kali makan maksimal 30 menit. Jika belum habis, sudahi dan bersihkan tanpa mencela anak.
                  </p>
                  <div style={{ fontSize: 11, color: "#92400E", background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 6, padding: "5px 8px", lineHeight: 1.4 }}>
                    <strong>Kaidah:</strong> Melatih ritme alami lapar-kenyang lambung agar anak siap makan di sesi berikutnya.
                  </div>
                </div>

                {/* Pilar 4 */}
                <div
                  style={{
                    background: "#F8FAFC",
                    border: "1px solid #E2E8F0",
                    borderRadius: 12,
                    padding: "14px 15px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: 8,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 8,
                        background: "#FEE2E2",
                        color: "#DC2626",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Smartphone size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 800, color: "#DC2626", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                        Pilar 4 • Fokus Sensori
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>
                        Bebas Gawai & Tayangan TV
                      </div>
                    </div>
                  </div>
                  <p style={{ margin: 0, fontSize: 12, color: "#475569", lineHeight: 1.45 }}>
                    Matikan HP, tablet, dan TV saat jam makan. Menonton sambil makan membuat anak menelan tanpa sadar dan abai tekstur.
                  </p>
                  <div style={{ fontSize: 11, color: "#991B1B", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 6, padding: "5px 8px", lineHeight: 1.4 }}>
                    <strong>Kaidah:</strong> Anak perlu mengenali rasa, aroma, dan mengunyah dengan sadar (mindful eating).
                  </div>
                </div>

                {/* Pilar 5 */}
                <div
                  style={{
                    background: "#F8FAFC",
                    border: "1px solid #E2E8F0",
                    borderRadius: 12,
                    padding: "14px 15px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: 8,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 8,
                        background: "#F3E8FF",
                        color: "#7E22CE",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Utensils size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 800, color: "#7C3AED", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                        Pilar 5 • Kemandirian
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>
                        Dorong Belajar Makan Sendiri
                      </div>
                    </div>
                  </div>
                  <p style={{ margin: 0, fontSize: 12, color: "#475569", lineHeight: 1.45 }}>
                    Berikan sendok kecil atau finger food (potongan sayur/lauk empuk) agar anak belajar memegang makanannya sendiri.
                  </p>
                  <div style={{ fontSize: 11, color: "#6B21A8", background: "#FAF5FF", border: "1px solid #E9D5FF", borderRadius: 6, padding: "5px 8px", lineHeight: 1.4 }}>
                    <strong>Kaidah:</strong> Berantakan di awal itu wajar; ini melatih koordinasi motorik tangan dan mulut balita.
                  </div>
                </div>

                {/* Pilar 6 */}
                <div
                  style={{
                    background: "#F8FAFC",
                    border: "1px solid #E2E8F0",
                    borderRadius: 12,
                    padding: "14px 15px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: 8,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 8,
                        background: "#CCFBF1",
                        color: "#0F766E",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <RotateCcw size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 800, color: "#0D9488", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                        Pilar 6 • Kesabaran
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>
                        Pantang Menyerah Menu Baru
                      </div>
                    </div>
                  </div>
                  <p style={{ margin: 0, fontSize: 12, color: "#475569", lineHeight: 1.45 }}>
                    Penolakan awal terhadap bahan makanan baru adalah reaksi normal. Tawarkan kembali dengan cara olah yang berbeda.
                  </p>
                  <div style={{ fontSize: 11, color: "#115E59", background: "#F0FDFA", border: "1px solid #99F6E4", borderRadius: 6, padding: "5px 8px", lineHeight: 1.4 }}>
                    <strong>Kaidah:</strong> Dibutuhkan 10 hingga 15 kali perkenalan bertahap sebelum anak menerima rasa baru.
                  </div>
                </div>
              </div>

              {/* Komparasi Praktis: Anjuran (Do's) vs Hindari (Don'ts) */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                  gap: 12,
                  marginTop: 4,
                }}
              >
                {/* Do's */}
                <div
                  style={{
                    background: "#F0FDF4",
                    border: "1px solid #BBF7D0",
                    borderRadius: 10,
                    padding: "12px 14px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                    <CheckCircle2 size={16} color="#16A34A" />
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: "#166534" }}>
                      Praktik Baik yang Dianjurkan (Do&apos;s)
                    </span>
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: 11.5, color: "#14532D", lineHeight: 1.55 }}>
                    <li>Ajak anak duduk bersama anggota keluarga di meja makan.</li>
                    <li>Berikan pujian hangat saat anak mau mencoba makanan baru.</li>
                    <li>Sajikan porsi kecil terlebih dahulu, lalu tambah jika anak masih lapar.</li>
                    <li>Beri minum air putih secukupnya di sela makan agar lambung tidak kembung air.</li>
                  </ul>
                </div>

                {/* Don'ts */}
                <div
                  style={{
                    background: "#FEF2F2",
                    border: "1px solid #FECACA",
                    borderRadius: 10,
                    padding: "12px 14px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                    <XCircle size={16} color="#DC2626" />
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: "#991B1B" }}>
                      Hal yang Sebaiknya Dihindari (Don&apos;ts)
                    </span>
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: 11.5, color: "#7F1D1D", lineHeight: 1.55 }}>
                    <li>Jangan membujuk dengan janji hadiah permen, wafer, atau tontonan HP.</li>
                    <li>Jangan memaksa menghabiskan makanan jika anak menunjukkan tanda kenyang.</li>
                    <li>Hindari pemberian susu/camilan manis dalam 1,5 jam sebelum jam makan utama.</li>
                    <li>Jangan menyuapi sambil anak berlari-lari atau bermain di luar rumah.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════════ */}
        {/* TAB 4: PROTOKOL TINDAK LANJUT & RUJUKAN KLINIS BERJENJANG          */}
        {/* ═════════════════════════════════════════════════════════════════════ */}
        {activeTab === "tindak_lanjut" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* 1. STATUS TRIASE KLINIS BALITA INI (REAL-TIME DECISION BANNER) */}
            <div
              style={{
                background:
                  statusKunci === "wasting" || (result.bbpb?.zscore ?? 0) < -3 || (result.pbu?.zscore ?? 0) < -3
                    ? "#FEF2F2"
                    : statusKunci === "stunting" || statusKunci === "underweight"
                    ? "#FFFBEB"
                    : "#F0FDF4",
                border: `1.5px solid ${
                  statusKunci === "wasting" || (result.bbpb?.zscore ?? 0) < -3 || (result.pbu?.zscore ?? 0) < -3
                    ? "#FECACA"
                    : statusKunci === "stunting" || statusKunci === "underweight"
                    ? "#FDE68A"
                    : "#BBF7D0"
                }`,
                borderRadius: 14,
                padding: "16px 18px",
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {statusKunci === "wasting" || (result.bbpb?.zscore ?? 0) < -3 || (result.pbu?.zscore ?? 0) < -3 ? (
                    <AlertTriangle size={20} color="#DC2626" />
                  ) : statusKunci === "stunting" || statusKunci === "underweight" ? (
                    <AlertCircle size={20} color="#D97706" />
                  ) : (
                    <CheckCircle2 size={20} color="#16A34A" />
                  )}
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 800,
                      color:
                        statusKunci === "wasting" || (result.bbpb?.zscore ?? 0) < -3 || (result.pbu?.zscore ?? 0) < -3
                          ? "#991B1B"
                          : statusKunci === "stunting" || statusKunci === "underweight"
                          ? "#92400E"
                          : "#166534",
                    }}
                  >
                    STATUS TRIASE:{" "}
                    {statusKunci === "wasting" || (result.bbpb?.zscore ?? 0) < -3 || (result.pbu?.zscore ?? 0) < -3
                      ? "PERLU EVALUASI & RUJUKAN KE PUSKESMAS SEGERA"
                      : statusKunci === "stunting" || statusKunci === "underweight"
                      ? "INTERVENSI POSYANDU & PEMANTAUAN KETAT (14 HARI)"
                      : "STATUS AMAN — LANJUTKAN PEMANTAUAN RUTIN BULANAN"}
                  </span>
                </div>

                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: 6,
                    background: "#FFFFFF",
                    color: "#334155",
                    border: "1px solid #CBD5E1",
                  }}
                >
                  Ananda {form.nama_anak || "Balita"} ({umur} bln)
                </span>
              </div>

              <p style={{ margin: 0, fontSize: 12.5, color: "#1E293B", lineHeight: 1.55 }}>
                {statusKunci === "wasting" || (result.bbpb?.zscore ?? 0) < -3 || (result.pbu?.zscore ?? 0) < -3
                  ? `Hasil penimbangan menunjukkan Z-score berada di zona risiko klinis tinggi (${evaluasiDetail.badge}). Sangat direkomendasikan untuk segera dikonsultasikan kepada Bidan Desa atau Tenaga Gizi Puskesmas guna pemeriksaan komprehensif.`
                  : statusKunci === "stunting" || statusKunci === "underweight"
                  ? `Hasil penimbangan menunjukkan perlunya intervensi pakan gizi intensif (${evaluasiDetail.badge}). Lakukan penimbangan ulang dalam 14 hari di Posyandu/Pustu untuk mengevaluasi Kenaikan Berat Badan Minimal (KBM).`
                  : `Pertumbuhan anak berada dalam batas normal baku WHO 2006. Tidak ada indikasi rujukan medis. Pertahankan keragaman makanan gizi seimbang dan ingatkan orang tua hadir pada Posyandu bulan depan.`}
              </p>

              {/* Action bar on the triage banner */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, paddingTop: 8, borderTop: "1px dashed rgba(0,0,0,0.12)" }}>
                <div style={{ fontSize: 11.5, fontWeight: 600, color: "#475569" }}>
                  💡 <strong>Rekomendasi Kader:</strong>{" "}
                  {statusKunci === "wasting" || (result.bbpb?.zscore ?? 0) < -3 || (result.pbu?.zscore ?? 0) < -3
                    ? "Segera hubungi Bidan Desa & gunakan tombol salin format rujukan di samping."
                    : statusKunci === "stunting" || statusKunci === "underweight"
                    ? "Jadwalkan kunjungan rumah (home-visit) dalam minggu ini."
                    : "Lanjutkan pemantauan grafik KMS pada buku KIA."}
                </div>

                <button
                  type="button"
                  onClick={handleCopyRujukan}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "6px 13px",
                    borderRadius: 7,
                    border: "1px solid #16A34A",
                    background: copiedRujukan ? "#DCFCE7" : "#16A34A",
                    color: copiedRujukan ? "#166534" : "#FFFFFF",
                    fontSize: 11.5,
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  {copiedRujukan ? <Check size={13} /> : <FileText size={13} />}
                  <span>{copiedRujukan ? "Format Rujukan Tersalin" : "Salin Surat Rujukan Bidan/Puskesmas"}</span>
                </button>
              </div>
            </div>

            {/* 2. ALUR RUJUKAN 3 LANGKAH BERJENJANG (VISUAL STEP-BY-STEP PATHWAY) */}
            <div
              style={{
                background: "#FFFFFF",
                border: "1px solid #E2E8F0",
                borderRadius: 14,
                padding: "18px 20px",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <Stethoscope size={18} color="#0284C7" />
                <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#0F172A" }}>
                  Alur Rujukan Penanganan Gizi Berjenjang (Kemenkes RI)
                </h4>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
                  gap: 12,
                  alignItems: "stretch",
                }}
              >
                {/* Step 1 */}
                <div
                  style={{
                    background: "#F8FAFC",
                    border: "1px solid #E2E8F0",
                    borderRadius: 10,
                    padding: "14px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: 8,
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                      <span style={{ fontSize: 10, fontWeight: 800, background: "#E2E8F0", color: "#334155", padding: "1px 6px", borderRadius: 4 }}>
                        TAHAP 1
                      </span>
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: "#0F172A" }}>
                        Posyandu (Skrining)
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: 11.5, color: "#475569", lineHeight: 1.45 }}>
                      Kader menimbang BB, mengukur PB/TB, mengevaluasi Z-score WHO, dan melihat pola garis pertumbuhan di Buku KIA/KMS.
                    </p>
                  </div>
                  <div style={{ fontSize: 11, color: "#166534", fontWeight: 600, background: "#F0FDF4", padding: "4px 8px", borderRadius: 6 }}>
                    🎯 Target: Deteksi dini sebelum anak jatuh ke gizi buruk.
                  </div>
                </div>

                {/* Step 2 */}
                <div
                  style={{
                    background: "#F8FAFC",
                    border: "1px solid #E2E8F0",
                    borderRadius: 10,
                    padding: "14px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: 8,
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                      <span style={{ fontSize: 10, fontWeight: 800, background: "#E0F2FE", color: "#0369A1", padding: "1px 6px", borderRadius: 4 }}>
                        TAHAP 2
                      </span>
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: "#0F172A" }}>
                        Bidan Desa / Pustu
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: 11.5, color: "#475569", lineHeight: 1.45 }}>
                      Memeriksa ada/tidaknya penyakit penyerta (batuk &gt;2 minggu, diare kronis, flek paru/TBC), validasi ukur, &amp; konseling PM-KBA.
                    </p>
                  </div>
                  <div style={{ fontSize: 11, color: "#0369A1", fontWeight: 600, background: "#F0F9FF", padding: "4px 8px", borderRadius: 6 }}>
                    🎯 Target: Diagnosis awal &amp; pemberian PMT lokal pemulihan.
                  </div>
                </div>

                {/* Step 3 */}
                <div
                  style={{
                    background: "#F8FAFC",
                    border: "1px solid #E2E8F0",
                    borderRadius: 10,
                    padding: "14px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: 8,
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                      <span style={{ fontSize: 10, fontWeight: 800, background: "#FEF3C7", color: "#92400E", padding: "1px 6px", borderRadius: 4 }}>
                        TAHAP 3
                      </span>
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: "#0F172A" }}>
                        Puskesmas / Dokter
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: 11.5, color: "#475569", lineHeight: 1.45 }}>
                      Penanganan klinis oleh dokter &amp; nutrisionis: Terapi Gizi Buruk (F-75/F-100), resep PKMK, atau rujukan dokter spesialis anak ke RSUD.
                    </p>
                  </div>
                  <div style={{ fontSize: 11, color: "#92400E", fontWeight: 600, background: "#FFFBEB", padding: "4px 8px", borderRadius: 6 }}>
                    🎯 Target: Terapi medis &amp; suplementasi gizi khusus.
                  </div>
                </div>
              </div>
            </div>

            {/* 3. KRITERIA MERAH: KAPAN WAJIB DIRUJUK SEGERA? (4 RED FLAG CARDS) */}
            <div
              style={{
                background: "#FFFFFF",
                border: "1px solid #E2E8F0",
                borderRadius: 14,
                padding: "18px 20px",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <AlertTriangle size={18} color="#DC2626" />
                  <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#0F172A" }}>
                    Tanda Bahaya Klinis (Kriteria Wajib Rujuk Segera ke Puskesmas)
                  </h4>
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: "#DC2626", background: "#FEF2F2", padding: "2px 8px", borderRadius: 5, border: "1px solid #FECACA" }}>
                  Jangan Tunda Penanganan
                </span>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                  gap: 12,
                }}
              >
                {/* Red Flag 1 */}
                <div
                  style={{
                    background: "#FEF2F2",
                    border: "1px solid #FECACA",
                    borderRadius: 10,
                    padding: "12px 14px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: 6,
                  }}
                >
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 800, color: "#DC2626", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                      Indikator 1 • Pertumbuhan Mandek
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#991B1B", margin: "2px 0 4px 0" }}>
                      Berat Badan Tidak Naik 2x (2T / T-T-T)
                    </div>
                    <p style={{ margin: 0, fontSize: 11.5, color: "#7F1D1D", lineHeight: 1.45 }}>
                      Garis pertumbuhan pada grafik KMS mendatar atau menurun 2 bulan berturut-turut meskipun nafsu makan terlihat normal.
                    </p>
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#991B1B", background: "#FFFFFF", padding: "4px 8px", borderRadius: 6, border: "1px solid #FECACA" }}>
                    ⚠️ Risiko: Tanda infeksi TBC anak atau ISK tersembunyi.
                  </div>
                </div>

                {/* Red Flag 2 */}
                <div
                  style={{
                    background: "#FEF2F2",
                    border: "1px solid #FECACA",
                    borderRadius: 10,
                    padding: "12px 14px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: 6,
                  }}
                >
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 800, color: "#DC2626", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                      Indikator 2 • Malnutrisi Akut
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#991B1B", margin: "2px 0 4px 0" }}>
                      Z-Score Sangat Kurus (BB/PB &lt; -3 SD)
                    </div>
                    <p style={{ margin: 0, fontSize: 11.5, color: "#7F1D1D", lineHeight: 1.45 }}>
                      Proporsi berat terhadap panjang badan balita masuk kategori gizi buruk akut (wasting berat).
                    </p>
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#991B1B", background: "#FFFFFF", padding: "4px 8px", borderRadius: 6, border: "1px solid #FECACA" }}>
                    ⚠️ Tindakan: Wajib rawat gizi dan terapi formula khusus.
                  </div>
                </div>

                {/* Red Flag 3 */}
                <div
                  style={{
                    background: "#FEF2F2",
                    border: "1px solid #FECACA",
                    borderRadius: 10,
                    padding: "12px 14px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: 6,
                  }}
                >
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 800, color: "#DC2626", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                      Indikator 3 • Ukuran LiLA Merah
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#991B1B", margin: "2px 0 4px 0" }}>
                      Lingkar Lengan Atas &lt; 11.5 cm
                    </div>
                    <p style={{ margin: 0, fontSize: 11.5, color: "#7F1D1D", lineHeight: 1.45 }}>
                      Pita ukur LiLA menunjukkan warna merah, menandakan atrofi jaringan otot yang parah akibat kekurangan energi kronis.
                    </p>
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#991B1B", background: "#FFFFFF", padding: "4px 8px", borderRadius: 6, border: "1px solid #FECACA" }}>
                    ⚠️ Tindakan: Segera daftarkan program PMT Pemulihan.
                  </div>
                </div>

                {/* Red Flag 4 */}
                <div
                  style={{
                    background: "#FEF2F2",
                    border: "1px solid #FECACA",
                    borderRadius: 10,
                    padding: "12px 14px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: 6,
                  }}
                >
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 800, color: "#DC2626", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                      Indikator 4 • Gejala Fisik Kritis
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#991B1B", margin: "2px 0 4px 0" }}>
                      Edema Kaki / Balita Sangat Lemas
                    </div>
                    <p style={{ margin: 0, fontSize: 11.5, color: "#7F1D1D", lineHeight: 1.45 }}>
                      Bengkak pada kedua punggung kaki bila ditekan berbekas, demam tinggi, diare terus menerus, atau anak apatis/tidak sadar.
                    </p>
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#991B1B", background: "#FFFFFF", padding: "4px 8px", borderRadius: 6, border: "1px solid #FECACA" }}>
                    🚨 Kedaruratan: Bawa ke IGD / Puskesmas 24 Jam hari ini.
                  </div>
                </div>
              </div>
            </div>

            {/* 4. TUGAS PENDAMPINGAN KADER POSYANDU (4 TUGAS NYATA) */}
            <div
              style={{
                background: "#FFFFFF",
                border: "1px solid #E2E8F0",
                borderRadius: 14,
                padding: "18px 20px",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <CheckCircle2 size={18} color="#16A34A" />
                <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#0F172A" }}>
                  Panduan Pendampingan Kader Posyandu di Lapangan
                </h4>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                  gap: 12,
                }}
              >
                {/* Tugas 1 */}
                <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 10, padding: "12px 14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                    <Home size={15} color="#15803D" />
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: "#0F172A" }}>
                      Kunjungan Rumah Rutin
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: 11.5, color: "#475569", lineHeight: 1.45 }}>
                    Lakukan kunjungan rumah minimal 1x seminggu bagi balita berisiko untuk melihat langsung proses ibu memasak dan menyuapi anak.
                  </p>
                </div>

                {/* Tugas 2 */}
                <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 10, padding: "12px 14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                    <Droplets size={15} color="#0284C7" />
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: "#0F172A" }}>
                      Evaluasi Sanitasi &amp; Air Bersih
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: 11.5, color: "#475569", lineHeight: 1.45 }}>
                    Pastikan keluarga memiliki akses jamban sehat dan air minum matang. Sanitasi buruk memicu diare yang menggagalkan penyerapan gizi.
                  </p>
                </div>

                {/* Tugas 3 */}
                <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 10, padding: "12px 14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                    <Pill size={15} color="#D97706" />
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: "#0F172A" }}>
                      Pantau Suplementasi Kemenkes
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: 11.5, color: "#475569", lineHeight: 1.45 }}>
                    Cek apakah anak sudah mendapat kapsul Vitamin A (bulan Februari &amp; Agustus) dan obat cacing berkala setiap 6 bulan sekali.
                  </p>
                </div>

                {/* Tugas 4 */}
                <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 10, padding: "12px 14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                    <Phone size={15} color="#7C3AED" />
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: "#0F172A" }}>
                      Koordinasi Rutin Bidan Desa
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: 11.5, color: "#475569", lineHeight: 1.45 }}>
                    Laporkan segera rekap balita 2T atau berisiko stunting kepada Bidan Desa setelah hari penimbangan Posyandu selesai.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
