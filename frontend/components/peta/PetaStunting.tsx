"use client";

import { useState, useMemo, useEffect, useSyncExternalStore } from "react";
import {
  MapPin, ChevronRight, Stethoscope, Utensils, Calendar,
  Baby, Plus, Info, Building2, ExternalLink, Compass, Layers,
  CheckCircle2, AlertTriangle, AlertCircle, Users, Scale, Ruler, ShieldAlert, Award
} from "lucide-react";
import { type BalitaItem } from "@/components/balita/RiwayatData";
import { type PosyanduItem } from "@/lib/utils";

export interface PosyanduWilayahData {
  id: string;
  nama: string;
  desa: string;
  kecamatan: string;
  kabupaten: string;
  provinsi: string;
  totalBalita: number;
  balitaDitimbang: number;
  stuntingCount: number;
  wastingCount: number;
  underweightCount: number;
  prevalensiStunting: number;
  prevalensiWasting: number;
  prevalensiUnderweight: number;
  statusZona: "aman" | "waspada" | "prioritas";
  rekomendasiAksi: string;
  svgPath: string;
  center: { x: number; y: number };
  regionLabel: string;
  balitaListPosyandu: BalitaItem[];
}

export interface PetaStuntingProps {
  balitaList?: BalitaItem[];
  posyanduList?: PosyanduItem[];
  activePosyandu?: PosyanduItem | null;
  onCatatBaru?: () => void;
  onLihatRiwayat?: () => void;
  onNavKelolaPosyandu?: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// PEMBAGIAN POLIGON WILAYAH ADMINISTRATIF OTENTIK (SEPERTI PETA PEMKAB/BPS)
// Menyesuaikan secara dinamis ketika posyandu yang dikelola sedikit atau banyak
// ─────────────────────────────────────────────────────────────────────────────

// Batas Luar Wilayah Administratif Regional (Desa Sukamaju)
// Kontur alami berliku otentik seperti batas Kabupaten / Kecamatan di Indonesia
const OUTER_PERIMETER = "M 380 45 L 450 55 L 520 48 L 590 75 L 635 110 L 660 170 L 640 230 L 675 290 L 650 360 L 665 420 L 620 475 L 550 495 L 480 475 L 410 505 L 340 485 L 270 510 L 200 485 L 150 500 L 120 450 L 105 380 L 135 320 L 95 250 L 125 180 L 110 125 L 145 85 L 210 65 L 290 78 Z";

function getAdministrativeRegionLayout(count: number, index: number): {
  svgPath: string;
  center: { x: number; y: number };
  regionLabel: string;
} {
  // Kanvas SVG 760 x 550
  // KASUS 1: 1 Posyandu (Meliputi seluruh wilayah administrasi desa)
  if (count <= 1) {
    return {
      svgPath: OUTER_PERIMETER,
      center: { x: 380, y: 275 },
      regionLabel: "Seluruh Wilayah Kerja Desa",
    };
  }

  // KASUS 2: 2 Posyandu (Terbagi Barat & Timur mengikuti batas punggung bukit/sungai alami)
  if (count === 2) {
    if (index === 0) {
      // Sektor Barat (RW 01 - RW 03)
      return {
        svgPath:
          "M 380 45 L 290 78 L 210 65 L 145 85 L 110 125 L 125 180 L 95 250 L 135 320 L 105 380 L 120 450 L 150 500 L 200 485 L 270 510 L 340 485 L 375 415 L 355 345 L 380 280 L 360 215 L 395 155 L 370 100 Z",
        center: { x: 235, y: 275 },
        regionLabel: "Wilayah Sektor Barat",
      };
    }
    // Sektor Timur (RW 04 - RW 06)
    return {
      svgPath:
        "M 380 45 L 370 100 L 395 155 L 360 215 L 380 280 L 355 345 L 375 415 L 340 485 L 410 505 L 480 475 L 550 495 L 620 475 L 665 420 L 650 360 L 675 290 L 640 230 L 660 170 L 635 110 L 590 75 L 520 48 L 450 55 Z",
      center: { x: 525, y: 275 },
      regionLabel: "Wilayah Sektor Timur",
    };
  }

  // KASUS 3: 3 Posyandu (Terbagi Utara, Barat Daya, Tenggara dengan tripoint di tengah)
  if (count === 3) {
    if (index === 0) {
      // Sektor Utara (Dataran Tinggi)
      return {
        svgPath:
          "M 95 250 L 125 180 L 110 125 L 145 85 L 210 65 L 290 78 L 380 45 L 450 55 L 520 48 L 590 75 L 635 110 L 660 170 L 640 230 L 675 290 L 575 285 L 480 265 L 380 280 L 280 255 L 190 265 Z",
        center: { x: 380, y: 160 },
        regionLabel: "Sektor Wilayah Utara",
      };
    }
    if (index === 1) {
      // Sektor Barat Daya
      return {
        svgPath:
          "M 95 250 L 190 265 L 280 255 L 380 280 L 355 345 L 375 415 L 340 485 L 270 510 L 200 485 L 150 500 L 120 450 L 105 380 L 135 320 Z",
        center: { x: 235, y: 390 },
        regionLabel: "Sektor Barat Daya",
      };
    }
    // Sektor Tenggara
    return {
      svgPath:
        "M 380 280 L 480 265 L 575 285 L 675 290 L 650 360 L 665 420 L 620 475 L 550 495 L 480 475 L 410 505 L 340 485 L 375 415 L 355 345 Z",
      center: { x: 530, y: 390 },
      regionLabel: "Sektor Tenggara",
    };
  }

  // KASUS 4: 4 Posyandu (4 Kuadran Administratif: Barat Laut, Timur Laut, Barat Daya, Tenggara)
  if (count === 4) {
    if (index === 0) {
      // Barat Laut
      return {
        svgPath:
          "M 95 250 L 125 180 L 110 125 L 145 85 L 210 65 L 290 78 L 380 45 L 370 100 L 395 155 L 360 215 L 380 280 L 280 255 L 190 265 Z",
        center: { x: 235, y: 165 },
        regionLabel: "Sektor Barat Laut",
      };
    }
    if (index === 1) {
      // Timur Laut
      return {
        svgPath:
          "M 380 45 L 450 55 L 520 48 L 590 75 L 635 110 L 660 170 L 640 230 L 675 290 L 575 285 L 480 265 L 380 280 L 360 215 L 395 155 L 370 100 Z",
        center: { x: 525, y: 165 },
        regionLabel: "Sektor Timur Laut",
      };
    }
    if (index === 2) {
      // Barat Daya
      return {
        svgPath:
          "M 95 250 L 190 265 L 280 255 L 380 280 L 355 345 L 375 415 L 340 485 L 270 510 L 200 485 L 150 500 L 120 450 L 105 380 L 135 320 Z",
        center: { x: 235, y: 390 },
        regionLabel: "Sektor Barat Daya",
      };
    }
    // Tenggara
    return {
      svgPath:
        "M 380 280 L 480 265 L 575 285 L 675 290 L 650 360 L 665 420 L 620 475 L 550 495 L 480 475 L 410 505 L 340 485 L 375 415 L 355 345 Z",
      center: { x: 530, y: 390 },
      regionLabel: "Sektor Tenggara",
    };
  }

  // KASUS 5: 5 Posyandu (Pusat Kota / Krajan di tengah dikelilingi 4 Wilayah Luar)
  // Seperti Kota Malang di tengah Kabupaten Malang pada peta referensi
  if (count === 5) {
    if (index === 0) {
      // Sektor Pusat Desa (Krajan)
      return {
        svgPath:
          "M 285 200 L 380 185 L 475 200 L 490 275 L 480 355 L 380 365 L 285 355 L 270 275 Z",
        center: { x: 380, y: 275 },
        regionLabel: "Sektor Pusat (Krajan)",
      };
    }
    if (index === 1) {
      // Barat Laut
      return {
        svgPath:
          "M 95 250 L 125 180 L 110 125 L 145 85 L 210 65 L 290 78 L 380 45 L 380 185 L 285 200 L 270 275 Z",
        center: { x: 215, y: 140 },
        regionLabel: "Sektor Barat Laut",
      };
    }
    if (index === 2) {
      // Timur Laut
      return {
        svgPath:
          "M 380 45 L 450 55 L 520 48 L 590 75 L 635 110 L 660 170 L 640 230 L 675 290 L 490 275 L 475 200 L 380 185 Z",
        center: { x: 540, y: 140 },
        regionLabel: "Sektor Timur Laut",
      };
    }
    if (index === 3) {
      // Barat Daya
      return {
        svgPath:
          "M 95 250 L 270 275 L 285 355 L 380 365 L 340 485 L 270 510 L 200 485 L 150 500 L 120 450 L 105 380 L 135 320 Z",
        center: { x: 210, y: 415 },
        regionLabel: "Sektor Barat Daya",
      };
    }
    // Tenggara
    return {
      svgPath:
        "M 675 290 L 650 360 L 665 420 L 620 475 L 550 495 L 480 475 L 410 505 L 340 485 L 380 365 L 480 355 L 490 275 Z",
      center: { x: 545, y: 415 },
      regionLabel: "Sektor Tenggara",
    };
  }

  // KASUS 6: 6 Posyandu (2 Kolom x 3 Baris Sektor Administratif)
  if (count === 6) {
    const isLeft = index % 2 === 0;
    const row = Math.floor(index / 2); // 0, 1, 2
    if (row === 0) {
      return isLeft
        ? {
            svgPath: "M 95 200 L 125 180 L 110 125 L 145 85 L 210 65 L 290 78 L 380 45 L 375 185 L 245 195 L 95 200 Z",
            center: { x: 235, y: 135 },
            regionLabel: "Wilayah Barat Utara",
          }
        : {
            svgPath: "M 380 45 L 450 55 L 520 48 L 590 75 L 635 110 L 660 170 L 650 200 L 515 195 L 375 185 Z",
            center: { x: 525, y: 135 },
            regionLabel: "Wilayah Timur Utara",
          };
    }
    if (row === 1) {
      return isLeft
        ? {
            svgPath: "M 95 200 L 245 195 L 375 185 L 380 335 L 245 345 L 105 340 L 95 250 L 135 320 Z",
            center: { x: 235, y: 270 },
            regionLabel: "Wilayah Barat Tengah",
          }
        : {
            svgPath: "M 375 185 L 515 195 L 650 200 L 640 230 L 675 290 L 655 340 L 515 345 L 380 335 Z",
            center: { x: 525, y: 270 },
            regionLabel: "Wilayah Timur Tengah",
          };
    }
    return isLeft
      ? {
          svgPath: "M 105 340 L 245 345 L 380 335 L 340 485 L 270 510 L 200 485 L 150 500 L 120 450 L 105 380 Z",
          center: { x: 235, y: 415 },
          regionLabel: "Wilayah Barat Selatan",
        }
      : {
          svgPath: "M 380 335 L 515 345 L 655 340 L 650 360 L 665 420 L 620 475 L 550 495 L 480 475 L 410 505 L 340 485 Z",
          center: { x: 525, y: 415 },
          regionLabel: "Wilayah Timur Selatan",
        };
  }

  // KASUS 7 HINGGA 10+: Partisi Grid Geospasial Organik Dinamis
  // Menjamin setiap Posyandu memiliki poligon yang presisi, kontigu, dan rapi
  const cols = count <= 8 ? (count <= 4 ? 2 : 3) : 4;
  const rows = Math.ceil(count / cols);
  const colIdx = index % cols;
  const rowIdx = Math.floor(index / cols);

  const minX = 110;
  const maxX = 650;
  const minY = 60;
  const maxY = 480;

  const cellWidth = (maxX - minX) / cols;
  const cellHeight = (maxY - minY) / rows;

  const x1 = Math.round(minX + colIdx * cellWidth);
  const x2 = Math.round(x1 + cellWidth);
  const y1 = Math.round(minY + rowIdx * cellHeight);
  const y2 = Math.round(y1 + cellHeight);

  const cx = Math.round(x1 + cellWidth / 2);
  const cy = Math.round(y1 + cellHeight / 2);

  // Poligon batas administrasi berlekuk alami
  const j1 = (index * 7) % 10 - 5;
  const j2 = (index * 13) % 12 - 6;
  const j3 = (index * 17) % 10 - 5;
  const j4 = (index * 19) % 12 - 6;

  const svgPath = `M ${x1} ${y1} L ${x2 + j1} ${y1 + j2} L ${x2} ${y2} L ${x1 + j3} ${y2 + j4} Z`;

  return {
    svgPath,
    center: { x: cx, y: cy },
    regionLabel: `Wilayah Sektor ${index + 1}`,
  };
}

export function PetaStunting({
  balitaList = [],
  posyanduList = [],
  activePosyandu,
  onCatatBaru,
  onLihatRiwayat,
  onNavKelolaPosyandu,
}: PetaStuntingProps) {
  // Hanya menampilkan Posyandu yang ada di "Kelola Posyandu" database Supabase
  const daftarPosyanduRiil = useMemo(() => {
    return posyanduList;
  }, [posyanduList]);

  const [selectedPosyanduId, setSelectedPosyanduId] = useState<string>(activePosyandu?.id || "");

  useEffect(() => {
    if (activePosyandu?.id) {
      setSelectedPosyanduId(activePosyandu.id);
    }
  }, [activePosyandu?.id]);

  const [hoveredPosyanduId, setHoveredPosyanduId] = useState<string | null>(null);
  const [indikatorPeta, setIndikatorPeta] = useState<"stunting" | "wasting" | "underweight">("stunting");
  const [filterZona, setFilterZona] = useState<string>("semua");

  // Nama Bulan Dinamis (Aman SSR)
  const currentMonthName = useSyncExternalStore(
    () => () => {},
    () => {
      try {
        return new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(new Date());
      } catch {
        return "Oktober 2026";
      }
    },
    () => "Oktober 2026"
  );

  // 1. DATA WILAYAH 100% DINAMIS HANYA DARI POSYANDU YANG TERDAFTAR DI KELOLA POSYANDU
  const dataWilayahPosyandu: PosyanduWilayahData[] = useMemo(() => {
    const totalPos = daftarPosyanduRiil.length;

    return daftarPosyanduRiil.map((pos, idx) => {
      // Filter balita yang terdaftar di posyandu ini
      const balitaListPosyandu = balitaList.filter((b) => {
        if (b.posyanduId) {
          return b.posyanduId === pos.id;
        }
        // Fallback untuk balita lama yang belum memiliki posyanduId:
        const text = (b.dusun || "").toLowerCase();
        if (text && pos.nama.toLowerCase().includes(text)) return true;
        return false;
      });

      const totalBalita = balitaListPosyandu.length;
      const balitaDitimbang = balitaListPosyandu.filter(
        (b) => b.beratTerakhir > 0 || (b.riwayat && b.riwayat.length > 0)
      ).length;

      // Stunting (TB/U pendek / sangat pendek)
      const stuntingBalita = balitaListPosyandu.filter((b) => {
        const r = b.riwayat?.[0];
        return (
          r?.statusPbu === "pendek" ||
          r?.statusPbu === "sangat_pendek" ||
          b.labelStatus.toLowerCase().includes("pendek") ||
          b.labelStatus.toLowerCase().includes("stunting") ||
          (b.statusGizi === "rujukan" && b.labelStatus.toLowerCase().includes("pendek"))
        );
      });
      const stuntingCount = stuntingBalita.length;

      // Wasting (BB/TB gizi kurang / gizi buruk)
      const wastingBalita = balitaListPosyandu.filter((b) => {
        const r = b.riwayat?.[0];
        return (
          r?.statusBbpb === "kurus" ||
          r?.statusBbpb === "sangat_kurus" ||
          b.labelStatus.toLowerCase().includes("kurang") ||
          b.labelStatus.toLowerCase().includes("wasting")
        );
      });
      const wastingCount = wastingBalita.length;

      // Underweight (BB/U berat badan kurang / sangat kurang)
      const underweightBalita = balitaListPosyandu.filter((b) => {
        const r = b.riwayat?.[0];
        return (
          r?.statusBbu === "kurang" ||
          r?.statusBbu === "buruk" ||
          b.labelStatus.toLowerCase().includes("kurang") ||
          b.labelStatus.toLowerCase().includes("underweight")
        );
      });
      const underweightCount = underweightBalita.length;

      // Prevalensi (%)
      const prevalensiStunting = balitaDitimbang > 0
        ? Number(((stuntingCount / balitaDitimbang) * 100).toFixed(1))
        : 0;
      const prevalensiWasting = balitaDitimbang > 0
        ? Number(((wastingCount / balitaDitimbang) * 100).toFixed(1))
        : 0;
      const prevalensiUnderweight = balitaDitimbang > 0
        ? Number(((underweightCount / balitaDitimbang) * 100).toFixed(1))
        : 0;

      // Status Zona berdasarkan prevalensi stunting
      let statusZona: "aman" | "waspada" | "prioritas" = "aman";
      if (prevalensiStunting > 10 || (balitaDitimbang > 0 && stuntingCount >= 2)) {
        statusZona = "prioritas";
      } else if (prevalensiStunting >= 5 || stuntingCount === 1) {
        statusZona = "waspada";
      } else {
        statusZona = "aman";
      }

      // Rekomendasi aksi dinamis
      let rekomendasiAksi = "";
      if (statusZona === "prioritas") {
        rekomendasiAksi = `Intervensi mendesak di ${pos.nama}: Kunjungan rumah bersama Bidan Desa untuk ${stuntingCount} balita stunting dan penyaluran paket PMT tinggi protein telur & susu.`;
      } else if (statusZona === "waspada") {
        rekomendasiAksi = `Pengawasan rutin di ${pos.nama}: Edukasi sanitasi jamban sehat, pendampingan MP-ASI pangan lokal bergizi hewani untuk balita berisiko.`;
      } else {
        rekomendasiAksi = `Wilayah ${pos.nama} dalam kondisi baik: Pertahankan capaian penimbangan bulanan (D/S di atas 90%) dan kelas ibu balita.`;
      }

      // Poligon peta wilayah administratif
      const layout = getAdministrativeRegionLayout(totalPos, idx);

      return {
        id: pos.id,
        nama: pos.nama,
        desa: pos.desa || "Sukamaju",
        kecamatan: pos.kecamatan || "Ciawi",
        kabupaten: pos.kabupaten || "Bogor",
        provinsi: pos.provinsi || "Jawa Barat",
        totalBalita,
        balitaDitimbang,
        stuntingCount,
        wastingCount,
        underweightCount,
        prevalensiStunting,
        prevalensiWasting,
        prevalensiUnderweight,
        statusZona,
        rekomendasiAksi,
        svgPath: layout.svgPath,
        center: layout.center,
        regionLabel: layout.regionLabel,
        balitaListPosyandu,
      };
    });
  }, [daftarPosyanduRiil, balitaList]);

  // Posyandu terpilih
  const selectedWilayah = useMemo(() => {
    if (!selectedPosyanduId && dataWilayahPosyandu.length > 0) {
      return dataWilayahPosyandu[0];
    }
    return (
      dataWilayahPosyandu.find((d) => d.id === selectedPosyanduId) ||
      dataWilayahPosyandu[0] ||
      null
    );
  }, [dataWilayahPosyandu, selectedPosyanduId]);

  // Statistik agregat riil
  const totalDesaBalita = dataWilayahPosyandu.reduce((sum, d) => sum + d.totalBalita, 0);
  const totalDesaDitimbang = dataWilayahPosyandu.reduce((sum, d) => sum + d.balitaDitimbang, 0);
  const totalDesaStunting = dataWilayahPosyandu.reduce((sum, d) => sum + d.stuntingCount, 0);
  const prevalensiRataDesa = totalDesaDitimbang > 0
    ? Number(((totalDesaStunting / totalDesaDitimbang) * 100).toFixed(1))
    : 0;

  const countMerah = dataWilayahPosyandu.filter((d) => d.statusZona === "prioritas").length;
  const countKuning = dataWilayahPosyandu.filter((d) => d.statusZona === "waspada").length;
  const countHijau = dataWilayahPosyandu.filter((d) => d.statusZona === "aman").length;

  // Gaya Warna Peta Tematik (Choropleth Administrative Map)
  const getZonaStyle = (zona: PosyanduWilayahData["statusZona"], isSelected = false) => {
    if (zona === "prioritas") {
      return {
        fill: isSelected ? "#FECACA" : "#FEE2E2",
        stroke: isSelected ? "#991B1B" : "#DC2626",
        border: "#EF4444",
        titleColor: "#991B1B",
        subColor: "#B91C1C",
        label: "Zona Merah (Prioritas)",
        badgeBg: "#FEE2E2",
        dotColor: "#DC2626",
      };
    }
    if (zona === "waspada") {
      return {
        fill: isSelected ? "#FEF08A" : "#FEF9C3",
        stroke: isSelected ? "#92400E" : "#D97706",
        border: "#F59E0B",
        titleColor: "#92400E",
        subColor: "#B45309",
        label: "Zona Kuning (Waspada)",
        badgeBg: "#FEF3C7",
        dotColor: "#D97706",
      };
    }
    return {
      fill: isSelected ? "#BBF7D0" : "#F0FDF4",
      stroke: isSelected ? "#065F46" : "#16A34A",
      border: "#10B981",
      titleColor: "#0F172A",
      subColor: "#15803D",
      label: "Zona Hijau (Aman)",
      badgeBg: "#DCFCE7",
      dotColor: "#16A34A",
    };
  };

  // Filter daftar posyandu berdasarkan zona
  const filteredPosyanduList = useMemo(() => {
    if (filterZona === "semua") return dataWilayahPosyandu;
    return dataWilayahPosyandu.filter((d) => d.statusZona === filterZona);
  }, [dataWilayahPosyandu, filterZona]);

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", paddingBottom: 40 }}>
      {/* ── HEADER HALAMAN ── */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        flexWrap: "wrap",
        gap: 16,
        marginBottom: 20,
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <span style={{ fontSize: 13, color: "#64748B", fontWeight: 600 }}>Dashboard</span>
            <span style={{ color: "#CBD5E1" }}>/</span>
            <span style={{ fontSize: 13, color: "#16A34A", fontWeight: 700 }}>Peta Sebaran Stunting</span>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0F172A", margin: "0 0 6px 0", letterSpacing: "-0.02em" }}>
            Peta Wilayah Administrasi Posyandu
          </h1>
          <p style={{ fontSize: 14, color: "#475569", margin: 0 }}>
            Peta geospasial tematik batas wilayah kerja Posyandu ({daftarPosyanduRiil.length} Posyandu Aktif di Database).
          </p>
        </div>

        {/* Periode & Lokasi Tag + Tombol Kelola Posyandu */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {onNavKelolaPosyandu && (
            <button
              type="button"
              onClick={onNavKelolaPosyandu}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: "#F8FAFC",
                border: "1.5px solid #CBD5E1",
                borderRadius: 12,
                padding: "8px 14px",
                fontSize: 13,
                fontWeight: 700,
                color: "#0F172A",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              <Building2 size={15} color="#16A34A" /> Kelola Posyandu ({daftarPosyanduRiil.length})
            </button>
          )}

          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            background: "#FFFFFF", padding: "8px 16px", borderRadius: 12,
            border: "1.5px solid #E2E8F0",
          }}>
            <Calendar size={16} color="#16A34A" />
            <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>
              Periode: {currentMonthName}
            </div>
            <span style={{ color: "#CBD5E1" }}>•</span>
            <div style={{ fontSize: 13, color: "#475569", fontWeight: 600 }}>
              {activePosyandu ? activePosyandu.desa : "Desa Sukamaju"}
            </div>
          </div>
        </div>
      </div>

      {/* ── JIKA BELUM ADA POSYANDU SAMA SEKALI DI KELOLA POSYANDU ── */}
      {daftarPosyanduRiil.length === 0 ? (
        <div style={{
          background: "#FFFFFF",
          border: "1.5px solid #E2E8F0",
          borderRadius: 16,
          padding: "60px 20px",
          textAlign: "center",
        }}>
          <div style={{
            width: 60, height: 60, borderRadius: "50%",
            background: "#F0FDF4", border: "1px solid #BBF7D0",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 16px",
          }}>
            <Building2 size={30} color="#16A34A" />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0F172A", margin: "0 0 6px 0" }}>
            Belum Ada Posyandu Terdaftar
          </h2>
          <p style={{ fontSize: 14, color: "#64748B", margin: "0 auto 20px", maxWidth: 460 }}>
            Peta stunting hanya menampilkan Posyandu yang terdaftar di sistem. Silakan tambahkan Posyandu di menu Kelola Posyandu terlebih dahulu.
          </p>
          {onNavKelolaPosyandu && (
            <button
              type="button"
              onClick={onNavKelolaPosyandu}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "#16A34A",
                color: "#FFFFFF",
                border: "none",
                borderRadius: 12,
                padding: "11px 22px",
                fontSize: 14,
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              <Plus size={16} /> Tambah Posyandu di Kelola Posyandu
            </button>
          )}
        </div>
      ) : (
        <>
          {/* ── KARTU RINGKASAN AGREGAT WILAYAH POSYANDU ── */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 16,
            marginBottom: 20,
          }}>
            {/* Card 1: Total Balita */}
            <div
              className="interactive-hover"
              style={{
                background: "linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)",
                border: "1.5px solid #E2E8F0",
                borderLeft: "4px solid #3B82F6",
                borderRadius: 16,
                padding: "18px 20px",
                position: "relative",
                boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div style={{ fontSize: 11.5, fontWeight: 800, color: "#64748B", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                  TOTAL BALITA TERDAFTAR
                </div>
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                  <Users size={16} color="#3B82F6" />
                </div>
              </div>
              <div style={{ fontSize: 28, fontWeight: 900, color: "#0F172A", lineHeight: 1.1 }}>
                {totalDesaBalita} <span style={{ fontSize: 14, fontWeight: 600, color: "#64748B" }}>anak</span>
              </div>
              {/* Mini progress bar D/S */}
              <div style={{ height: 5, background: "#E2E8F0", borderRadius: 99, marginTop: 10, overflow: "hidden" }}>
                <div style={{
                  height: "100%",
                  width: `${totalDesaBalita > 0 ? Math.min((totalDesaDitimbang / totalDesaBalita) * 100, 100) : 0}%`,
                  background: "#3B82F6",
                  borderRadius: 99,
                  transition: "width 0.6s ease"
                }} />
              </div>
              <div style={{ fontSize: 12, color: totalDesaDitimbang > 0 ? "#16A34A" : "#64748B", fontWeight: 700, marginTop: 6, display: "flex", justifyContent: "space-between" }}>
                <span>{totalDesaDitimbang} balita ditimbang</span>
                <span>{totalDesaBalita > 0 ? ((totalDesaDitimbang / totalDesaBalita) * 100).toFixed(1) : 0}% D/S</span>
              </div>
            </div>

            {/* Card 2: Total Balita Stunting */}
            <div
              className="interactive-hover"
              style={{
                background: "linear-gradient(135deg, #FFFFFF 0%, #FEF2F2 100%)",
                border: "1.5px solid #FECACA",
                borderLeft: "4px solid #EF4444",
                borderRadius: 16,
                padding: "18px 20px",
                position: "relative",
                boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div style={{ fontSize: 11.5, fontWeight: 800, color: "#991B1B", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                  TOTAL KASUS STUNTING
                </div>
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: "#FEE2E2", display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                  <ShieldAlert size={16} color="#DC2626" />
                </div>
              </div>
              <div style={{ fontSize: 28, fontWeight: 900, color: totalDesaStunting > 0 ? "#DC2626" : "#16A34A", lineHeight: 1.1 }}>
                {totalDesaStunting} <span style={{ fontSize: 14, fontWeight: 600, color: "#64748B" }}>anak</span>
              </div>
              {/* Mini progress bar Stunting */}
              <div style={{ height: 5, background: "#FEE2E2", borderRadius: 99, marginTop: 10, overflow: "hidden" }}>
                <div style={{
                  height: "100%",
                  width: `${Math.min(prevalensiRataDesa * 2.5, 100)}%`,
                  background: totalDesaStunting > 0 ? "#DC2626" : "#16A34A",
                  borderRadius: 99,
                  transition: "width 0.6s ease"
                }} />
              </div>
              <div style={{ fontSize: 12, color: totalDesaStunting > 0 ? "#B91C1C" : "#15803D", fontWeight: 700, marginTop: 6, display: "flex", justifyContent: "space-between" }}>
                <span>Rata-rata prevalensi</span>
                <span>{prevalensiRataDesa}%</span>
              </div>
            </div>

            {/* Card 3: Sebaran Zona Risiko */}
            <div
              className="interactive-hover"
              style={{
                background: "linear-gradient(135deg, #FFFFFF 0%, #F0FDF4 100%)",
                border: "1.5px solid #BBF7D0",
                borderLeft: "4px solid #16A34A",
                borderRadius: 16,
                padding: "18px 20px",
                position: "relative",
                boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div style={{ fontSize: 11.5, fontWeight: 800, color: "#166534", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                  STATUS ZONA WILAYAH
                </div>
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: "#DCFCE7", display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                  <Layers size={16} color="#16A34A" />
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                <span style={{
                  background: "#FEE2E2", color: "#B91C1C", border: "1px solid #FECACA",
                  padding: "5px 10px", borderRadius: 8, fontSize: 12, fontWeight: 800,
                }}>
                  {countMerah} Prioritas
                </span>
                <span style={{
                  background: "#FEF3C7", color: "#B45309", border: "1px solid #FDE68A",
                  padding: "5px 10px", borderRadius: 8, fontSize: 12, fontWeight: 800,
                }}>
                  {countKuning} Waspada
                </span>
                <span style={{
                  background: "#DCFCE7", color: "#15803D", border: "1px solid #BBF7D0",
                  padding: "5px 10px", borderRadius: 8, fontSize: 12, fontWeight: 800,
                }}>
                  {countHijau} Aman
                </span>
              </div>
              <div style={{ fontSize: 12, color: "#64748B", marginTop: 10, fontWeight: 600 }}>
                Total {daftarPosyanduRiil.length} posyandu aktif terdata di sistem
              </div>
            </div>
          </div>

          {/* ── KONTROL FILTER & PEMILAH INDIKATOR ── */}
          <div style={{
            background: "linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)",
            border: "1.5px solid #E2E8F0",
            borderRadius: 16,
            padding: "14px 20px",
            marginBottom: 20,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 14,
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
          }}>
            {/* Pilihan Indikator */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: "#334155" }}>Pilih Indikator:</span>
              {[
                { id: "stunting", label: "Tinggi Badan (TB/U - Stunting)", icon: Ruler },
                { id: "wasting", label: "Gizi Kurang (BB/TB - Wasting)", icon: Utensils },
                { id: "underweight", label: "Berat Badan Kurang (BB/U)", icon: Scale },
              ].map((item) => {
                const active = indikatorPeta === item.id;
                const IconComponent = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setIndikatorPeta(item.id as typeof indikatorPeta)}
                    className="btn-interactive"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 7,
                      padding: "8px 16px",
                      borderRadius: 24,
                      fontSize: 12.5,
                      fontWeight: 700,
                      cursor: "pointer",
                      border: active ? "1.5px solid #16A34A" : "1.5px solid #CBD5E1",
                      background: active ? "#DCFCE7" : "#FFFFFF",
                      color: active ? "#15803D" : "#475569",
                      boxShadow: active ? "0 2px 6px rgba(22, 163, 74, 0.2)" : "none",
                    }}
                  >
                    <IconComponent size={14} color={active ? "#15803D" : "#64748B"} />
                    {item.label}
                  </button>
                );
              })}
            </div>

            {/* Filter Zona */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: "#334155" }}>Filter Zona:</span>
              <select
                value={filterZona}
                onChange={(e) => setFilterZona(e.target.value)}
                style={{
                  padding: "7px 14px",
                  borderRadius: 10,
                  border: "1.5px solid #CBD5E1",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#0F172A",
                  background: "#FFFFFF",
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                <option value="semua">Semua Zona Wilayah</option>
                <option value="prioritas">🔴 Zona Merah (Prioritas)</option>
                <option value="waspada">🟡 Zona Kuning (Waspada)</option>
                <option value="aman">🟢 Zona Hijau (Aman)</option>
              </select>
            </div>
          </div>

          {/* ── AREA UTAMA: PETA ADMINISTRASI CHOROPLETH + PANEL DETAIL POSYANDU ── */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
            gap: 20,
            marginBottom: 24,
          }}>
            {/* 1. KANVAS PETA ADMINISTRASI GEOSPASIAL RESMI */}
            <div style={{
              background: "#FFFFFF",
              border: "1.5px solid #E2E8F0",
              borderRadius: 16,
              padding: 20,
              display: "flex",
              flexDirection: "column",
            }}>
              {/* Header Peta Administrasi */}
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14,
              }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#0F172A" }}>
                    Peta Wilayah Kerja Posyandu ({daftarPosyanduRiil.length} Unit Terdata)
                  </div>
                  <div style={{ fontSize: 13, color: "#64748B" }}>
                    Batas administratif wilayah kerja desa — klik wilayah untuk melihat rincian
                  </div>
                </div>
                <div style={{
                  display: "flex", alignItems: "center", gap: 6,
                  fontSize: 12, fontWeight: 700, color: "#16A34A",
                  background: "#F0FDF4", padding: "5px 12px", borderRadius: 8,
                  border: "1px solid #BBF7D0",
                }}>
                  <MapPin size={14} /> Peta Administrasi
                </div>
              </div>

              {/* SVG ADMINISTRATIVE MAP CANVAS */}
              <div style={{
                background: "linear-gradient(135deg, #F8FAFC 0%, #F1FDF6 50%, #FAF5FF 100%)",
                border: "1.5px solid #E2E8F0",
                borderRadius: 16,
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                padding: "8px 4px",
                boxShadow: "inset 0 1px 4px rgba(0,0,0,0.04)",
              }} className="glass-panel">
                <svg
                  viewBox="0 0 760 550"
                  style={{ width: "100%", height: "auto", display: "block", userSelect: "none" }}
                >
                  <defs>
                    <linearGradient id="mapCanvasGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#F8FAFC" stopOpacity="0.9" />
                      <stop offset="50%" stopColor="#F0FDF4" stopOpacity="0.7" />
                      <stop offset="100%" stopColor="#F8FAFC" stopOpacity="0.9" />
                    </linearGradient>

                    <filter id="adminShadow" x="-10%" y="-10%" width="120%" height="120%">
                      <feDropShadow dx="0" dy="4" stdDeviation="5" floodOpacity="0.22" />
                    </filter>
                    <filter id="hoverGlow" x="-5%" y="-5%" width="110%" height="110%">
                      <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.14" />
                    </filter>
                    <filter id="cardGlow" x="-10%" y="-10%" width="120%" height="120%">
                      <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.10" />
                    </filter>

                    {/* Pola Kisi Kartografi Halus */}
                    <pattern id="cartoGrid" width="70" height="70" patternUnits="userSpaceOnUse">
                      <path d="M 70 0 L 0 0 0 70" fill="none" stroke="#E2E8F0" strokeWidth="0.5" strokeDasharray="3 5" />
                      <circle cx="70" cy="0" r="1.2" fill="#CBD5E1" />
                    </pattern>
                  </defs>

                  {/* 1. KISI KARTOGRAFI BACKGROUND */}
                  <rect x="0" y="0" width="760" height="550" fill="url(#mapCanvasGradient)" />
                  <rect x="0" y="0" width="760" height="550" fill="url(#cartoGrid)" />

                  {/* 2. TEKS PERIPHERAL WILAYAH PERBATASAN (SEPERTI DI PETA PEMKAB/BPS) */}
                  <g pointerEvents="none" opacity="0.65">
                    {/* Utara */}
                    <text x="380" y="26" textAnchor="middle" fontSize="11" fontWeight="800" fill="#64748B" letterSpacing="0.12em">
                      KECAMATAN MEGAMENDUNG
                    </text>
                    {/* Barat */}
                    <text x="35" y="275" textAnchor="middle" transform="rotate(-90 35 275)" fontSize="11" fontWeight="800" fill="#64748B" letterSpacing="0.12em">
                      KECAMATAN CISARUA
                    </text>
                    {/* Timur */}
                    <text x="725" y="275" textAnchor="middle" transform="rotate(90 725 275)" fontSize="11" fontWeight="800" fill="#64748B" letterSpacing="0.12em">
                      KECAMATAN CARINGIN
                    </text>
                    {/* Selatan */}
                    <text x="380" y="538" textAnchor="middle" fontSize="10.5" fontWeight="800" fill="#64748B" letterSpacing="0.12em">
                      KAWASAN TAMAN NASIONAL GUNUNG GEDE PANGRANGO
                    </text>
                  </g>

                  {/* 3. POLIGON WILAYAH ADMINISTRATIF POSYANDU */}
                  <g id="administrative-polygons">
                    {dataWilayahPosyandu.map((pos) => {
                      const isSelected = selectedWilayah?.id === pos.id;
                      const isHovered = hoveredPosyanduId === pos.id;
                      const style = getZonaStyle(pos.statusZona, isSelected);

                      const pinCount =
                        indikatorPeta === "stunting"
                           ? pos.stuntingCount
                          : indikatorPeta === "wasting"
                          ? pos.wastingCount
                          : pos.underweightCount;

                      const pinPercent =
                        indikatorPeta === "stunting"
                          ? pos.prevalensiStunting
                          : indikatorPeta === "wasting"
                          ? pos.prevalensiWasting
                          : pos.prevalensiUnderweight;

                      const pinLabel =
                        indikatorPeta === "stunting"
                          ? "Stunting"
                          : indikatorPeta === "wasting"
                          ? "Wasting"
                          : "BB Kurang";

                      return (
                        <g
                          key={pos.id}
                          onClick={() => setSelectedPosyanduId(pos.id)}
                          onMouseEnter={() => setHoveredPosyanduId(pos.id)}
                          onMouseLeave={() => setHoveredPosyanduId(null)}
                          style={{ cursor: "pointer", transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)" }}
                        >
                          {/* Poligon Batas Wilayah Administrasi */}
                          <path
                            d={pos.svgPath}
                            fill={style.fill}
                            stroke={isSelected ? "#0F172A" : isHovered ? "#334155" : style.stroke}
                            strokeWidth={isSelected ? 3.2 : isHovered ? 2.4 : 1.5}
                            strokeLinejoin="round"
                            strokeLinecap="round"
                            filter={isSelected ? "url(#adminShadow)" : isHovered ? "url(#hoverGlow)" : undefined}
                            style={{ transition: "all 0.25s ease" }}
                          />

                          {/* KARTU TEKS INFORMASI DI TENGAH WILAYAH */}
                          <g pointerEvents="none">
                            {/* Kotak Background Kartu Info di Peta */}
                            <rect
                              x={pos.center.x - 78}
                              y={pos.center.y - 32}
                              width="156"
                              height="64"
                              rx="10"
                              fill={isSelected ? "rgba(255,255,255,0.96)" : "rgba(255,255,255,0.90)"}
                              stroke={isSelected ? "#0F172A" : style.border}
                              strokeWidth={isSelected ? 1.8 : 1}
                              filter="url(#cardGlow)"
                            />

                            {/* Titik Status Zona */}
                            <circle
                              cx={pos.center.x - 62}
                              cy={pos.center.y - 14}
                              r="5"
                              fill={style.dotColor}
                            />

                            {/* Nama Posyandu */}
                            <text
                              x={pos.center.x + 4}
                              y={pos.center.y - 9}
                              textAnchor="middle"
                              fontSize="13"
                              fontWeight="800"
                              fill={pos.statusZona === "prioritas" ? "#DC2626" : "#0F172A"}
                            >
                              {pos.nama}
                            </text>

                            {/* Informasi Prevalensi / Kasus */}
                            <text
                              x={pos.center.x}
                              y={pos.center.y + 9}
                              textAnchor="middle"
                              fontSize="11"
                              fontWeight="800"
                              fill={pos.statusZona === "prioritas" ? "#B91C1C" : pos.statusZona === "waspada" ? "#B45309" : "#15803D"}
                            >
                              {pinCount} Balita • {pinPercent}% {pinLabel}
                            </text>

                            {/* Sub-keterangan Sasaran */}
                            <text
                              x={pos.center.x}
                              y={pos.center.y + 23}
                              textAnchor="middle"
                              fontSize="10"
                              fontWeight="600"
                              fill="#64748B"
                            >
                              {pos.balitaDitimbang} dari {pos.totalBalita} sasaran ditimbang
                            </text>
                          </g>
                        </g>
                      );
                    })}
                  </g>

                  {/* 4. GARIS BATAS LUAR REGIONAL UTAMA TEBAL */}
                  <path
                    d={OUTER_PERIMETER}
                    fill="none"
                    stroke="#1E293B"
                    strokeWidth="2.5"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    pointerEvents="none"
                  />

                  {/* 5. KOMPAS KARTOGRAFIS KLASIK (UTARA) */}
                  <g transform="translate(690, 60)" pointerEvents="none">
                    <circle cx="0" cy="0" r="20" fill="rgba(255, 255, 255, 0.95)" stroke="#CBD5E1" strokeWidth="1.2" />
                    {/* Jarum Utara (Hijau Resmi) */}
                    <polygon points="0,-15 3.5,0 -3.5,0" fill="#16A34A" />
                    {/* Jarum Selatan (Abu) */}
                    <polygon points="0,15 3.5,0 -3.5,0" fill="#94A3B8" />
                    <circle cx="0" cy="0" r="2.5" fill="#0F172A" />
                    <text x="0" y="-18" textAnchor="middle" fontSize="9.5" fontWeight="900" fill="#16A34A">
                      U
                    </text>
                  </g>

                  {/* 6. SKALA BATANG KARTOGRAFI */}
                  <g transform="translate(30, 508)" pointerEvents="none">
                    <rect x="0" y="-12" width="130" height="16" rx="4" fill="rgba(255,255,255,0.92)" stroke="#E2E8F0" strokeWidth="0.8" />
                    <line x1="10" y1="-4" x2="110" y2="-4" stroke="#0F172A" strokeWidth="2" />
                    <line x1="10" y1="-8" x2="10" y2="0" stroke="#0F172A" strokeWidth="1.5" />
                    <line x1="60" y1="-7" x2="60" y2="-1" stroke="#0F172A" strokeWidth="1.5" />
                    <line x1="110" y1="-8" x2="110" y2="0" stroke="#0F172A" strokeWidth="1.5" />
                    <text x="10" y="-10" fontSize="7.5" fontWeight="800" fill="#0F172A">0</text>
                    <text x="54" y="-10" fontSize="7.5" fontWeight="800" fill="#0F172A">1 Km</text>
                    <text x="102" y="-10" fontSize="7.5" fontWeight="800" fill="#0F172A">2 Km</text>
                  </g>

                  {/* 7. LABEL IDENTITAS PETA ADMINISTRASI */}
                  <g transform="translate(30, 28)" pointerEvents="none">
                    <rect x="0" y="0" width="220" height="26" rx="6" fill="rgba(255, 255, 255, 0.95)" stroke="#E2E8F0" strokeWidth="1" />
                    <text x="10" y="17" fontSize="10" fontWeight="800" fill="#1E293B">
                      PETA WILAYAH KERJA POSYANDU
                    </text>
                  </g>
                </svg>
              </div>

              {/* Legenda Peta Tingkat Risiko (Ditempatkan Rapi di Bawah Kanvas, Tidak Menghalangi Area Peta) */}
              <div style={{
                marginTop: 14,
                padding: "10px 16px",
                background: "#F8FAFC",
                border: "1.5px solid #E2E8F0",
                borderRadius: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 10,
              }}>
                <div style={{
                  fontSize: 11,
                  fontWeight: 900,
                  color: "#475569",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}>
                  <span>LEGENDA TINGKAT RISIKO:</span>
                </div>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  flexWrap: "wrap",
                  fontSize: 12,
                  fontWeight: 700,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, color: "#991B1B" }}>
                    <span style={{ width: 13, height: 13, borderRadius: 4, background: "#FEE2E2", border: "1.5px solid #EF4444", flexShrink: 0 }} />
                    <span>Prioritas (&gt; 10% / &ge; 2 kasus)</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, color: "#92400E" }}>
                    <span style={{ width: 13, height: 13, borderRadius: 4, background: "#FEF9C3", border: "1.5px solid #F59E0B", flexShrink: 0 }} />
                    <span>Waspada (5% - 10% / 1 kasus)</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, color: "#166534" }}>
                    <span style={{ width: 13, height: 13, borderRadius: 4, background: "#F0FDF4", border: "1.5px solid #10B981", flexShrink: 0 }} />
                    <span>Aman (&lt; 5% / 0 Kasus)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. PANEL DETAIL WILAYAH POSYANDU TERPILIH */}
            {selectedWilayah && (
              <div style={{
                background: "#FFFFFF",
                border: "1.5px solid #E2E8F0",
                borderRadius: 16,
                padding: 20,
                display: "flex",
                flexDirection: "column",
              }}>
                {/* Header Panel Detail */}
                <div style={{
                  display: "flex", justifyContent: "space-between", alignItems: "flex-start",
                  borderBottom: "1.5px solid #F1F5F9", paddingBottom: 14, marginBottom: 16,
                }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>
                      Posyandu Terpilih ({selectedWilayah.desa})
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 900, color: "#0F172A", marginTop: 2 }}>
                      {selectedWilayah.nama}
                    </div>
                    <div style={{ fontSize: 13, color: "#16A34A", fontWeight: 700, marginTop: 2 }}>
                      Kecamatan {selectedWilayah.kecamatan}, {selectedWilayah.kabupaten}
                    </div>
                  </div>

                  <span style={{
                    background: getZonaStyle(selectedWilayah.statusZona).badgeBg,
                    color: getZonaStyle(selectedWilayah.statusZona).subColor,
                    border: `1.5px solid ${getZonaStyle(selectedWilayah.statusZona).border}`,
                    padding: "5px 12px",
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 800,
                  }}>
                    {getZonaStyle(selectedWilayah.statusZona).label}
                  </span>
                </div>

                {/* Grid Indikator Posyandu Terpilih */}
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                  marginBottom: 16,
                }}>
                  {/* Indikator 1: Stunting */}
                  <div style={{ background: "#F8FAFC", border: "1.5px solid #E2E8F0", borderRadius: 12, padding: "12px 14px" }}>
                    <div style={{ fontSize: 11, color: "#64748B", fontWeight: 800, letterSpacing: "0.04em" }}>PREVALENSI STUNTING</div>
                    <div style={{
                      fontSize: 22, fontWeight: 900,
                      color: selectedWilayah.prevalensiStunting > 10 ? "#DC2626" : selectedWilayah.prevalensiStunting >= 5 ? "#D97706" : "#16A34A",
                      marginTop: 2
                    }}>
                      {selectedWilayah.prevalensiStunting}%
                    </div>
                    {/* Visual Bar */}
                    <div style={{ height: 5, background: "#E2E8F0", borderRadius: 99, marginTop: 6, overflow: "hidden" }}>
                      <div style={{
                        height: "100%",
                        width: `${Math.min(selectedWilayah.prevalensiStunting * 2.5, 100)}%`,
                        background: selectedWilayah.prevalensiStunting > 10 ? "#DC2626" : selectedWilayah.prevalensiStunting >= 5 ? "#D97706" : "#16A34A",
                        borderRadius: 99,
                        transition: "width 0.6s ease"
                      }} />
                    </div>
                    <div style={{ fontSize: 11.5, color: "#475569", marginTop: 4, fontWeight: 600 }}>
                      {selectedWilayah.stuntingCount} dari {selectedWilayah.balitaDitimbang} anak
                    </div>
                  </div>

                  {/* Indikator 2: D/S */}
                  <div style={{ background: "#F8FAFC", border: "1.5px solid #E2E8F0", borderRadius: 12, padding: "12px 14px" }}>
                    <div style={{ fontSize: 11, color: "#64748B", fontWeight: 800, letterSpacing: "0.04em" }}>CAKUPAN TIMBANG (D/S)</div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: "#0F172A", marginTop: 2 }}>
                      {selectedWilayah.totalBalita > 0 ? ((selectedWilayah.balitaDitimbang / selectedWilayah.totalBalita) * 100).toFixed(1) : "0.0"}%
                    </div>
                    {/* Visual Bar */}
                    <div style={{ height: 5, background: "#E2E8F0", borderRadius: 99, marginTop: 6, overflow: "hidden" }}>
                      <div style={{
                        height: "100%",
                        width: `${selectedWilayah.totalBalita > 0 ? Math.min((selectedWilayah.balitaDitimbang / selectedWilayah.totalBalita) * 100, 100) : 0}%`,
                        background: "#16A34A",
                        borderRadius: 99,
                        transition: "width 0.6s ease"
                      }} />
                    </div>
                    <div style={{ fontSize: 11.5, color: "#16A34A", fontWeight: 700, marginTop: 4 }}>
                      {selectedWilayah.balitaDitimbang} / {selectedWilayah.totalBalita} sasaran
                    </div>
                  </div>

                  {/* Indikator 3: Wasting */}
                  <div style={{ background: "#F8FAFC", border: "1.5px solid #E2E8F0", borderRadius: 12, padding: "12px 14px" }}>
                    <div style={{ fontSize: 11, color: "#64748B", fontWeight: 800, letterSpacing: "0.04em" }}>GIZI KURANG (WASTING)</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: "#0F172A", marginTop: 2 }}>
                      {selectedWilayah.wastingCount} <span style={{ fontSize: 12, color: "#64748B" }}>anak</span>
                    </div>
                    <div style={{ fontSize: 11.5, color: "#64748B", marginTop: 2 }}>
                      {selectedWilayah.prevalensiWasting}% prevalensi
                    </div>
                  </div>

                  {/* Indikator 4: Underweight */}
                  <div style={{ background: "#F8FAFC", border: "1.5px solid #E2E8F0", borderRadius: 12, padding: "12px 14px" }}>
                    <div style={{ fontSize: 11, color: "#64748B", fontWeight: 800, letterSpacing: "0.04em" }}>BERAT KURANG (UNDERWEIGHT)</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: "#0F172A", marginTop: 2 }}>
                      {selectedWilayah.underweightCount} <span style={{ fontSize: 12, color: "#64748B" }}>anak</span>
                    </div>
                    <div style={{ fontSize: 11.5, color: "#64748B", marginTop: 2 }}>
                      {selectedWilayah.prevalensiUnderweight}% prevalensi
                    </div>
                  </div>
                </div>

                {/* Daftar Balita Nyata di Posyandu Ini */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{
                    fontSize: 12, fontWeight: 800, color: "#0F172A",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    marginBottom: 8,
                  }}>
                    <span>BALITA DI {selectedWilayah.nama.toUpperCase()}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#16A34A" }}>
                      {selectedWilayah.balitaListPosyandu.length} balita
                    </span>
                  </div>

                  {selectedWilayah.balitaListPosyandu.length === 0 ? (
                    <div style={{
                      padding: "16px 12px",
                      background: "#F8FAFC",
                      borderRadius: 12,
                      border: "1px dashed #CBD5E1",
                      fontSize: 12.5,
                      color: "#64748B",
                      textAlign: "center",
                    }}>
                      Belum ada data balita di {selectedWilayah.nama}.
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 180, overflowY: "auto" }}>
                      {selectedWilayah.balitaListPosyandu.map((b) => (
                        <div
                          key={b.id}
                          className="interactive-hover"
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "9px 12px",
                            background: "#F8FAFC",
                            borderRadius: 10,
                            border: "1px solid #E2E8F0",
                          }}
                        >
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>
                              {b.nama} <span style={{ fontSize: 11, color: "#64748B", fontWeight: 500 }}>({b.jenisKelamin === "L" ? "Laki-laki" : "Perempuan"})</span>
                            </div>
                            <div style={{ fontSize: 11.5, color: "#64748B", marginTop: 1 }}>
                              Ibu: {b.namaIbu} • {b.umurBulan} bln • {b.beratTerakhir} kg • {b.tinggiTerakhir} cm
                            </div>
                          </div>
                          <span style={{
                            fontSize: 11, fontWeight: 800, padding: "3px 8px", borderRadius: 6,
                            background: b.statusGizi === "rujukan" ? "#FEE2E2" : b.statusGizi === "waspada" ? "#FEF3C7" : "#DCFCE7",
                            color: b.statusGizi === "rujukan" ? "#B91C1C" : b.statusGizi === "waspada" ? "#B45309" : "#15803D",
                          }}>
                            {b.labelStatus}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Rekomendasi Aksi Intervensi */}
                <div style={{
                  background: "linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)",
                  border: "1.5px solid #FDE68A",
                  borderRadius: 12,
                  padding: "13px 16px",
                  marginTop: "auto",
                }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "#B45309", marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
                    <Utensils size={14} /> Rencana Aksi Intervensi Posyandu:
                  </div>
                  <p style={{ fontSize: 12.5, color: "#78350F", margin: 0, lineHeight: 1.5, fontWeight: 500 }}>
                    {selectedWilayah.rekomendasiAksi}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* ── TABEL PRIORITAS INTERVENSI POSYANDU TERDAFTAR ── */}
          <div style={{
            background: "#FFFFFF",
            border: "1.5px solid #E2E8F0",
            borderRadius: 16,
            overflow: "hidden",
            boxShadow: "0 1px 4px rgba(0,0,0,0.03)",
          }}>
            <div style={{
              padding: "16px 20px",
              borderBottom: "1.5px solid #F1F5F9",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 10,
              background: "linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)",
            }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#0F172A", display: "flex", alignItems: "center", gap: 8 }}>
                  <Award size={18} color="#16A34A" /> Tabel Prioritas Penanganan Stunting per Posyandu
                </div>
                <div style={{ fontSize: 13, color: "#64748B", marginTop: 2 }}>
                  Diurutkan otomatis dari prevalensi stunting tertinggi ke terendah
                </div>
              </div>
              <div style={{
                fontSize: 12.5, color: "#16A34A", fontWeight: 700,
                background: "#F0FDF4", padding: "5px 12px", borderRadius: 8,
                border: "1px solid #BBF7D0",
              }}>
                {filteredPosyanduList.length} Posyandu Aktif Terdata
              </div>
            </div>

            <div style={{ overflowX: "auto" }}>
              <div style={{ minWidth: 840 }}>
                {/* Header Kolom */}
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "50px minmax(200px, 1.8fr) 130px 110px 140px 150px 110px",
                  gap: 14,
                  padding: "12px 20px",
                  background: "#F8FAFC",
                  borderBottom: "1.5px solid #E2E8F0",
                  fontSize: 11.5,
                  fontWeight: 800,
                  color: "#64748B",
                  letterSpacing: "0.03em",
                }}>
                  <div style={{ textAlign: "center" }}>RANK</div>
                  <div>NAMA POSYANDU & WILAYAH</div>
                  <div>SASARAN (D/S)</div>
                  <div>STUNTING</div>
                  <div>PREVALENSI</div>
                  <div>STATUS ZONA</div>
                  <div style={{ textAlign: "right" }}>AKSI</div>
                </div>

                {/* Baris Posyandu */}
                {filteredPosyanduList
                  .slice()
                  .sort((a, b) => b.prevalensiStunting - a.prevalensiStunting)
                  .map((pos, idx) => {
                    const style = getZonaStyle(pos.statusZona);
                    const isSelected = selectedWilayah?.id === pos.id;

                    return (
                      <div
                        key={pos.id}
                        onClick={() => setSelectedPosyanduId(pos.id)}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "50px minmax(200px, 1.8fr) 130px 110px 140px 150px 110px",
                          gap: 14,
                          padding: "14px 20px",
                          alignItems: "center",
                          borderBottom: idx === filteredPosyanduList.length - 1 ? "none" : "1px solid #F1F5F9",
                          background: isSelected ? "#F0FDF4" : idx % 2 === 1 ? "#FAFAFA" : "#FFFFFF",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                          borderLeft: isSelected ? "3px solid #16A34A" : "3px solid transparent",
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) e.currentTarget.style.background = "#F1F5F9";
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) e.currentTarget.style.background = idx % 2 === 1 ? "#FAFAFA" : "#FFFFFF";
                        }}
                      >
                        {/* Rank Badge */}
                        <div style={{ display: "flex", justifyContent: "center" }}>
                          <span style={{
                            width: 28, height: 28, borderRadius: "50%",
                            background: idx === 0 ? "#FEE2E2" : idx === 1 ? "#FEF3C7" : "#F1F5F9",
                            color: idx === 0 ? "#B91C1C" : idx === 1 ? "#B45309" : "#64748B",
                            fontWeight: 800, fontSize: 12,
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}>
                            #{idx + 1}
                          </span>
                        </div>

                        <div>
                          <div style={{ fontSize: 14.5, fontWeight: 800, color: "#0F172A" }}>
                            {pos.nama}
                          </div>
                          <div style={{ fontSize: 12.5, color: "#64748B", marginTop: 2 }}>
                            Desa {pos.desa}, Kec. {pos.kecamatan}
                          </div>
                        </div>

                        <div>
                          <div style={{ fontSize: 14, fontWeight: 800, color: "#0F172A" }}>
                            {pos.balitaDitimbang} / {pos.totalBalita}
                          </div>
                          <div style={{ fontSize: 12, color: "#16A34A", fontWeight: 700 }}>
                            {pos.totalBalita > 0 ? ((pos.balitaDitimbang / pos.totalBalita) * 100).toFixed(1) : "0.0"}% D/S
                          </div>
                        </div>

                        <div>
                          <span style={{ fontSize: 15, fontWeight: 800, color: "#0F172A" }}>
                            {pos.stuntingCount}
                          </span>{" "}
                          <span style={{ fontSize: 12, color: "#64748B" }}>anak</span>
                        </div>

                        <div>
                          <div style={{
                            fontSize: 15, fontWeight: 900,
                            color: pos.prevalensiStunting > 10 ? "#DC2626" : pos.prevalensiStunting >= 5 ? "#D97706" : "#16A34A",
                          }}>
                            {pos.prevalensiStunting}%
                          </div>
                          {/* Mini Bar */}
                          <div style={{ height: 4, width: 70, background: "#E2E8F0", borderRadius: 99, marginTop: 4, overflow: "hidden" }}>
                            <div style={{
                              height: "100%",
                              width: `${Math.min(pos.prevalensiStunting * 3, 100)}%`,
                              background: pos.prevalensiStunting > 10 ? "#DC2626" : pos.prevalensiStunting >= 5 ? "#D97706" : "#16A34A",
                              borderRadius: 99,
                            }} />
                          </div>
                        </div>

                        <div>
                          <span style={{
                            display: "inline-flex", alignItems: "center", gap: 5,
                            background: style.badgeBg, color: style.subColor,
                            border: `1.5px solid ${style.border}`,
                            padding: "4px 10px", borderRadius: 8,
                            fontSize: 11.5, fontWeight: 800,
                          }}>
                            {style.label}
                          </span>
                        </div>

                        <div style={{ display: "flex", justifyContent: "flex-end" }}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPosyanduId(pos.id);
                            }}
                            className="btn-interactive"
                            style={{
                              background: isSelected ? "#16A34A" : "#FFFFFF",
                              border: isSelected ? "none" : "1.5px solid #CBD5E1",
                              borderRadius: 8,
                              padding: "6px 12px",
                              fontSize: 12,
                              fontWeight: 700,
                              color: isSelected ? "#FFFFFF" : "#1E293B",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              boxShadow: isSelected ? "0 2px 6px rgba(22, 163, 74, 0.3)" : "none",
                            }}
                          >
                            Pilih <ChevronRight size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
