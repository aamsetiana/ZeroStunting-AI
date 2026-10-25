"use client";

import { useState, useMemo, useSyncExternalStore } from "react";
import {
  MapPin, ChevronRight, Stethoscope, Utensils, Calendar,
  Baby, Plus, Info, Building2, ExternalLink, Compass, Layers,
  CheckCircle2, AlertTriangle, AlertCircle
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

  const [selectedPosyanduId, setSelectedPosyanduId] = useState<string>("");
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
        if (text.includes(pos.nama.toLowerCase())) return true;
        if (idx === 0) return true;
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
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 14,
            marginBottom: 20,
          }}>
            <div style={{
              background: "#FFFFFF", border: "1.5px solid #E2E8F0", borderRadius: 14, padding: "16px 18px",
            }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#64748B", letterSpacing: "0.04em", marginBottom: 6 }}>
                TOTAL BALITA TERDAFTAR
              </div>
              <div style={{ fontSize: 26, fontWeight: 900, color: "#0F172A" }}>
                {totalDesaBalita} <span style={{ fontSize: 14, fontWeight: 600, color: "#64748B" }}>anak</span>
              </div>
              <div style={{ fontSize: 12.5, color: totalDesaDitimbang > 0 ? "#16A34A" : "#64748B", fontWeight: 700, marginTop: 4 }}>
                {totalDesaDitimbang} anak aktif ditimbang ({totalDesaBalita > 0 ? ((totalDesaDitimbang / totalDesaBalita) * 100).toFixed(1) : 0}% D/S)
              </div>
            </div>

            <div style={{
              background: "#FFFFFF", border: "1.5px solid #E2E8F0", borderRadius: 14, padding: "16px 18px",
            }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#64748B", letterSpacing: "0.04em", marginBottom: 6 }}>
                TOTAL BALITA STUNTING
              </div>
              <div style={{ fontSize: 26, fontWeight: 900, color: totalDesaStunting > 0 ? "#DC2626" : "#16A34A" }}>
                {totalDesaStunting} <span style={{ fontSize: 14, fontWeight: 600, color: "#64748B" }}>anak</span>
              </div>
              <div style={{ fontSize: 12.5, color: totalDesaStunting > 0 ? "#B91C1C" : "#15803D", fontWeight: 700, marginTop: 4 }}>
                Prevalensi Stunting: {prevalensiRataDesa}%
              </div>
            </div>

            <div style={{
              background: "#FFFFFF", border: "1.5px solid #E2E8F0", borderRadius: 14, padding: "16px 18px",
            }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#64748B", letterSpacing: "0.04em", marginBottom: 6 }}>
                SEBARAN ZONA POSYANDU
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6 }}>
                <span style={{
                  background: "#FEE2E2", color: "#B91C1C", border: "1px solid #FECACA",
                  padding: "4px 8px", borderRadius: 6, fontSize: 12, fontWeight: 800,
                }}>
                  {countMerah} Prioritas
                </span>
                <span style={{
                  background: "#FEF3C7", color: "#B45309", border: "1px solid #FDE68A",
                  padding: "4px 8px", borderRadius: 6, fontSize: 12, fontWeight: 800,
                }}>
                  {countKuning} Waspada
                </span>
                <span style={{
                  background: "#DCFCE7", color: "#15803D", border: "1px solid #BBF7D0",
                  padding: "4px 8px", borderRadius: 6, fontSize: 12, fontWeight: 800,
                }}>
                  {countHijau} Aman
                </span>
              </div>
              <div style={{ fontSize: 12, color: "#64748B", marginTop: 8 }}>
                Dari {daftarPosyanduRiil.length} posyandu terdaftar di sistem
              </div>
            </div>
          </div>

          {/* ── KONTROL FILTER & PEMILAH INDIKATOR ── */}
          <div style={{
            background: "#FFFFFF", border: "1.5px solid #E2E8F0", borderRadius: 14, padding: "12px 18px",
            marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center",
            flexWrap: "wrap", gap: 12,
          }}>
            {/* Pilihan Indikator */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#64748B" }}>Tampilkan Indikator:</span>
              {[
                { id: "stunting", label: "Tinggi Badan / Stunting (TB/U)" },
                { id: "wasting", label: "Gizi Kurang / Wasting (BB/TB)" },
                { id: "underweight", label: "Berat Badan Kurang (BB/U)" },
              ].map((item) => {
                const active = indikatorPeta === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setIndikatorPeta(item.id as typeof indikatorPeta)}
                    style={{
                      padding: "6px 14px",
                      borderRadius: 20,
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                      border: active ? "1.5px solid #16A34A" : "1.5px solid #CBD5E1",
                      background: active ? "#DCFCE7" : "#FFFFFF",
                      color: active ? "#15803D" : "#475569",
                    }}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>

            {/* Filter Zona */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#64748B" }}>Zona:</span>
              <select
                value={filterZona}
                onChange={(e) => setFilterZona(e.target.value)}
                style={{
                  padding: "6px 12px",
                  borderRadius: 8,
                  border: "1.5px solid #CBD5E1",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#0F172A",
                  background: "#FFFFFF",
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                <option value="semua">Semua Zona</option>
                <option value="prioritas">Zona Merah (Prioritas)</option>
                <option value="waspada">Zona Kuning (Waspada)</option>
                <option value="aman">Zona Hijau (Aman)</option>
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
                background: "#FCFAF6",
                border: "1.5px solid #E2E8F0",
                borderRadius: 14,
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                padding: "8px 4px",
                boxShadow: "inset 0 1px 4px rgba(0,0,0,0.04)",
              }}>
                <svg
                  viewBox="0 0 760 550"
                  style={{ width: "100%", height: "auto", display: "block", userSelect: "none" }}
                >
                  <defs>
                    <filter id="adminShadow" x="-10%" y="-10%" width="120%" height="120%">
                      <feDropShadow dx="0" dy="3" stdDeviation="4" floodOpacity="0.2" />
                    </filter>
                    <filter id="hoverGlow" x="-5%" y="-5%" width="110%" height="110%">
                      <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodOpacity="0.12" />
                    </filter>

                    {/* Pola Kisi Kartografi Sangat Halus */}
                    <pattern id="cartoGrid" width="80" height="80" patternUnits="userSpaceOnUse">
                      <path d="M 80 0 L 0 0 0 80" fill="none" stroke="#E5E7EB" strokeWidth="0.5" strokeDasharray="3 6" />
                      <circle cx="80" cy="0" r="1.2" fill="#CBD5E1" />
                    </pattern>
                  </defs>

                  {/* 1. KISI KARTOGRAFI BACKGROUND */}
                  <rect x="0" y="0" width="760" height="550" fill="url(#cartoGrid)" />

                  {/* 2. TEKS PERIPHERAL WILAYAH PERBATASAN (SEPERTI DI PETA PEMKAB/BPS) */}
                  <g pointerEvents="none" opacity="0.6">
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
                          style={{ cursor: "pointer", transition: "all 0.2s ease" }}
                        >
                          {/* Poligon Batas Wilayah Administrasi */}
                          <path
                            d={pos.svgPath}
                            fill={style.fill}
                            stroke={isSelected ? "#0F172A" : isHovered ? "#334155" : style.stroke}
                            strokeWidth={isSelected ? 3 : isHovered ? 2.2 : 1.4}
                            strokeLinejoin="round"
                            strokeLinecap="round"
                            filter={isSelected ? "url(#adminShadow)" : isHovered ? "url(#hoverGlow)" : undefined}
                            style={{ transition: "all 0.2s ease" }}
                          />

                          {/* KARTU TEKS INFORMASI DI TENGAH WILAYAH (SEPERTI PADA CONTOH GAMBAR) */}
                          <g pointerEvents="none">
                            {/* Kotak Background Halus untuk Teks Agar Sangat Terbaca */}
                            <rect
                              x={pos.center.x - 70}
                              y={pos.center.y - 28}
                              width="140"
                              height="56"
                              rx="8"
                              fill={isSelected ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.85)"}
                              stroke={isSelected ? "#0F172A" : "#CBD5E1"}
                              strokeWidth={isSelected ? 1.5 : 0.8}
                              filter="url(#hoverGlow)"
                            />

                            {/* Titik Status Zona */}
                            <circle
                              cx={pos.center.x - 56}
                              cy={pos.center.y - 12}
                              r="4.5"
                              fill={style.dotColor}
                            />

                            {/* Nama Posyandu (Tebal, seperti 'Kota Malang' / 'Lawang') */}
                            <text
                              x={pos.center.x + 3}
                              y={pos.center.y - 8}
                              textAnchor="middle"
                              fontSize="12"
                              fontWeight="800"
                              fill={pos.statusZona === "prioritas" ? "#DC2626" : "#0F172A"}
                            >
                              {pos.nama}
                            </text>

                            {/* Informasi Prevalensi / Kasus (seperti '28 Km' pada gambar) */}
                            <text
                              x={pos.center.x}
                              y={pos.center.y + 8}
                              textAnchor="middle"
                              fontSize="10.5"
                              fontWeight="800"
                              fill={pos.statusZona === "prioritas" ? "#B91C1C" : pos.statusZona === "waspada" ? "#B45309" : "#15803D"}
                            >
                              {pinCount} Balita • {pinPercent}% {pinLabel}
                            </text>

                            {/* Sub-keterangan Sasaran */}
                            <text
                              x={pos.center.x}
                              y={pos.center.y + 21}
                              textAnchor="middle"
                              fontSize="9.5"
                              fontWeight="600"
                              fill="#64748B"
                            >
                              {pos.balitaDitimbang} / {pos.totalBalita} ditimbang
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
                    strokeWidth="2.4"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    pointerEvents="none"
                  />

                  {/* 5. KOMPAS KARTOGRAFIS KLASIK (UTARA) */}
                  <g transform="translate(690, 60)" pointerEvents="none">
                    <circle cx="0" cy="0" r="20" fill="rgba(255, 255, 255, 0.95)" stroke="#CBD5E1" strokeWidth="1.2" />
                    {/* Jarum Utara (Merah/Hijau Resmi) */}
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
                    <rect x="0" y="-12" width="130" height="16" rx="4" fill="rgba(255,255,255,0.9)" stroke="#E2E8F0" strokeWidth="0.8" />
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

                {/* Legenda Peta Kartografis */}
                <div style={{
                  position: "absolute",
                  bottom: 14,
                  right: 14,
                  background: "rgba(255, 255, 255, 0.96)",
                  border: "1px solid #CBD5E1",
                  borderRadius: 10,
                  padding: "10px 14px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                  fontSize: 11,
                  fontWeight: 700,
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                  backdropFilter: "blur(4px)",
                }}>
                  <div style={{ fontSize: 10.5, fontWeight: 800, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    LEGENDA ZONA RISIKO
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, color: "#B91C1C" }}>
                    <span style={{ width: 12, height: 12, borderRadius: 3, background: "#FEE2E2", border: "1.5px solid #EF4444" }} />
                    <span>Merah: Prevalensi &gt; 10% (Prioritas)</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, color: "#B45309" }}>
                    <span style={{ width: 12, height: 12, borderRadius: 3, background: "#FEF9C3", border: "1.5px solid #F59E0B" }} />
                    <span>Kuning: Prevalensi 5% - 10% (Waspada)</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, color: "#15803D" }}>
                    <span style={{ width: 12, height: 12, borderRadius: 3, background: "#F0FDF4", border: "1.5px solid #10B981" }} />
                    <span>Hijau: Prevalensi &lt; 5% / 0 Kasus (Aman)</span>
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
                  <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 10, padding: 12 }}>
                    <div style={{ fontSize: 12, color: "#64748B", fontWeight: 700 }}>PREVALENSI STUNTING</div>
                    <div style={{
                      fontSize: 22, fontWeight: 900,
                      color: selectedWilayah.prevalensiStunting > 10 ? "#DC2626" : selectedWilayah.prevalensiStunting >= 5 ? "#D97706" : "#16A34A",
                      marginTop: 2
                    }}>
                      {selectedWilayah.prevalensiStunting}%
                    </div>
                    <div style={{ fontSize: 12, color: "#475569", marginTop: 2 }}>
                      {selectedWilayah.stuntingCount} dari {selectedWilayah.balitaDitimbang} anak
                    </div>
                  </div>

                  <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 10, padding: 12 }}>
                    <div style={{ fontSize: 12, color: "#64748B", fontWeight: 700 }}>CAKUPAN TIMBANG (D/S)</div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: "#0F172A", marginTop: 2 }}>
                      {selectedWilayah.totalBalita > 0 ? ((selectedWilayah.balitaDitimbang / selectedWilayah.totalBalita) * 100).toFixed(1) : "0.0"}%
                    </div>
                    <div style={{ fontSize: 12, color: "#16A34A", fontWeight: 700, marginTop: 2 }}>
                      {selectedWilayah.balitaDitimbang} / {selectedWilayah.totalBalita} sasaran
                    </div>
                  </div>

                  <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 10, padding: 12 }}>
                    <div style={{ fontSize: 12, color: "#64748B", fontWeight: 700 }}>GIZI KURANG (WASTING)</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: "#0F172A", marginTop: 2 }}>
                      {selectedWilayah.wastingCount} <span style={{ fontSize: 12, color: "#64748B" }}>anak</span>
                    </div>
                    <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>
                      {selectedWilayah.prevalensiWasting}% prevalensi
                    </div>
                  </div>

                  <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 10, padding: 12 }}>
                    <div style={{ fontSize: 12, color: "#64748B", fontWeight: 700 }}>BERAT KURANG (UNDERWEIGHT)</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: "#0F172A", marginTop: 2 }}>
                      {selectedWilayah.underweightCount} <span style={{ fontSize: 12, color: "#64748B" }}>anak</span>
                    </div>
                    <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>
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
                      padding: "14px 12px",
                      background: "#F8FAFC",
                      borderRadius: 10,
                      border: "1px dashed #CBD5E1",
                      fontSize: 12.5,
                      color: "#64748B",
                      textAlign: "center",
                    }}>
                      Belum ada data balita di {selectedWilayah.nama}.
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 160, overflowY: "auto" }}>
                      {selectedWilayah.balitaListPosyandu.map((b) => (
                        <div
                          key={b.id}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "8px 12px",
                            background: "#F8FAFC",
                            borderRadius: 8,
                            border: "1px solid #E2E8F0",
                          }}
                        >
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>
                              {b.nama} ({b.jenisKelamin})
                            </div>
                            <div style={{ fontSize: 11.5, color: "#64748B" }}>
                              Ibu: {b.namaIbu} • {b.umurBulan} bln • {b.beratTerakhir} kg • {b.tinggiTerakhir} cm
                            </div>
                          </div>
                          <span style={{
                            fontSize: 11, fontWeight: 800, padding: "2px 8px", borderRadius: 6,
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
                  background: "#FFFBEB",
                  border: "1px solid #FDE68A",
                  borderRadius: 10,
                  padding: "12px 14px",
                  marginTop: "auto",
                }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "#B45309", marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
                    <Utensils size={14} /> Rencana Aksi Intervensi:
                  </div>
                  <p style={{ fontSize: 12.5, color: "#78350F", margin: 0, lineHeight: 1.5 }}>
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
          }}>
            <div style={{
              padding: "16px 20px",
              borderBottom: "1.5px solid #F1F5F9",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 10,
            }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#0F172A" }}>
                  Tabel Prioritas Intervensi Posyandu
                </div>
                <div style={{ fontSize: 13, color: "#64748B" }}>
                  Hanya menampilkan Posyandu yang ada di Kelola Posyandu (Data Riil Supabase)
                </div>
              </div>
              <div style={{ fontSize: 13, color: "#475569", fontWeight: 700 }}>
                {filteredPosyanduList.length} Posyandu Terdata
              </div>
            </div>

            <div style={{ overflowX: "auto" }}>
              <div style={{ minWidth: 840 }}>
                {/* Header Kolom */}
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(220px, 1.8fr) 130px 110px 110px 160px 120px",
                  gap: 14,
                  padding: "12px 20px",
                  background: "#F8FAFC",
                  borderBottom: "1.5px solid #E2E8F0",
                  fontSize: 12,
                  fontWeight: 800,
                  color: "#64748B",
                }}>
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
                          gridTemplateColumns: "minmax(220px, 1.8fr) 130px 110px 110px 160px 120px",
                          gap: 14,
                          padding: "14px 20px",
                          alignItems: "center",
                          borderBottom: idx === filteredPosyanduList.length - 1 ? "none" : "1px solid #F1F5F9",
                          background: isSelected ? "#F8FAF8" : "#FFFFFF",
                          cursor: "pointer",
                          transition: "background 0.15s ease",
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) e.currentTarget.style.background = "#F8FAFC";
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) e.currentTarget.style.background = "#FFFFFF";
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 800, color: "#0F172A" }}>
                            {pos.nama}
                          </div>
                          <div style={{ fontSize: 13, color: "#475569", marginTop: 2 }}>
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
                          <span style={{ fontSize: 13, color: "#64748B" }}>anak</span>
                        </div>

                        <div>
                          <span style={{
                            fontSize: 15, fontWeight: 900,
                            color: pos.prevalensiStunting > 10 ? "#DC2626" : pos.prevalensiStunting >= 5 ? "#D97706" : "#16A34A",
                          }}>
                            {pos.prevalensiStunting}%
                          </span>
                        </div>

                        <div>
                          <span style={{
                            display: "inline-flex", alignItems: "center", gap: 5,
                            background: style.badgeBg, color: style.subColor,
                            border: `1.5px solid ${style.border}`,
                            padding: "4px 10px", borderRadius: 8,
                            fontSize: 12, fontWeight: 800,
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
                            style={{
                              background: isSelected ? "#16A34A" : "#F1F5F9",
                              border: isSelected ? "none" : "1px solid #CBD5E1",
                              borderRadius: 8,
                              padding: "6px 12px",
                              fontSize: 12,
                              fontWeight: 700,
                              color: isSelected ? "#FFFFFF" : "#1E293B",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
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
