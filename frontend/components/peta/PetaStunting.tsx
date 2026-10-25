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
// PEMBAGIAN POLIGON WILAYAH GEOGRAFIS ALAMI (BUKAN KOTAK/TABEL)
// Membentuk kontur batas desa organik dengan sungai, jalan, dan batas wilayah alami
// ─────────────────────────────────────────────────────────────────────────────
function getOrganicSvgLayout(count: number, index: number): {
  svgPath: string;
  center: { x: number; y: number };
  regionLabel: string;
} {
  // Kanvas SVG 700 x 470
  // Untuk 1 Posyandu: Seluruh bentang wilayah desa organik
  if (count <= 1) {
    return {
      svgPath:
        "M 350 45 C 240 50, 110 75, 75 160 C 45 245, 55 335, 115 395 C 195 435, 490 435, 595 385 C 655 325, 660 215, 625 135 C 575 68, 455 42, 350 45 Z",
      center: { x: 350, y: 235 },
      regionLabel: "Wilayah Keseluruhan Desa",
    };
  }

  // Untuk 2 Posyandu (Kondisi riil: Posyandu Melati 01 & Posyandu Melati 02):
  // Terbelah alami mengikuti alur Sungai Ciawi dan Jalan Poros
  if (count === 2) {
    if (index === 0) {
      // Wilayah Barat (Posyandu Melati 01 - RW 01 s.d RW 03)
      return {
        svgPath:
          "M 350 45 C 255 50, 135 75, 75 155 C 45 235, 55 325, 115 390 C 180 425, 260 430, 345 425 C 310 335, 375 250, 335 155 C 318 100, 338 65, 350 45 Z",
        center: { x: 205, y: 235 },
        regionLabel: "Sektor Barat (RW 01-03)",
      };
    }
    // Wilayah Timur (Posyandu Melati 02 - RW 04 s.d RW 06)
    return {
      svgPath:
        "M 350 45 C 338 65, 318 100, 335 155 C 375 250, 310 335, 345 425 C 435 430, 525 410, 595 375 C 655 315, 660 215, 625 135 C 575 68, 455 42, 350 45 Z",
      center: { x: 485, y: 235 },
      regionLabel: "Sektor Timur (RW 04-06)",
    };
  }

  // Untuk 3 Posyandu:
  if (count === 3) {
    if (index === 0) {
      // Sektor Utara / Perbukitan
      return {
        svgPath:
          "M 350 45 C 245 50, 130 75, 75 155 C 105 215, 210 235, 350 220 C 490 220, 590 205, 625 135 C 575 68, 455 42, 350 45 Z",
        center: { x: 350, y: 110 },
        regionLabel: "Sektor Utara (Dataran Tinggi)",
      };
    }
    if (index === 1) {
      // Sektor Barat Daya
      return {
        svgPath:
          "M 75 155 C 45 235, 55 325, 115 390 C 180 425, 260 430, 345 425 C 325 350, 340 280, 350 220 C 210 235, 105 215, 75 155 Z",
        center: { x: 205, y: 315 },
        regionLabel: "Sektor Barat Daya",
      };
    }
    // Sektor Tenggara
    return {
      svgPath:
        "M 350 220 C 340 280, 325 350, 345 425 C 435 430, 525 410, 595 375 C 655 315, 660 215, 625 135 C 590 205, 490 220, 350 220 Z",
      center: { x: 485, y: 315 },
      regionLabel: "Sektor Tenggara",
    };
  }

  // Untuk 4 Posyandu:
  if (count === 4) {
    if (index === 0) {
      return {
        svgPath:
          "M 350 45 C 255 50, 135 75, 75 155 C 70 205, 125 230, 230 230 C 310 230, 335 180, 350 45 Z",
        center: { x: 205, y: 145 },
        regionLabel: "Sektor Barat Laut",
      };
    }
    if (index === 1) {
      return {
        svgPath:
          "M 350 45 C 335 180, 310 230, 480 230 C 580 230, 615 190, 625 135 C 575 68, 455 42, 350 45 Z",
        center: { x: 485, y: 145 },
        regionLabel: "Sektor Timur Laut",
      };
    }
    if (index === 2) {
      return {
        svgPath:
          "M 75 155 C 45 235, 55 325, 115 390 C 180 425, 260 430, 345 425 C 340 330, 310 230, 230 230 C 125 230, 70 205, 75 155 Z",
        center: { x: 205, y: 325 },
        regionLabel: "Sektor Barat Daya",
      };
    }
    return {
      svgPath:
        "M 230 230 C 310 230, 340 330, 345 425 C 435 430, 525 410, 595 375 C 655 315, 660 215, 625 135 C 615 190, 580 230, 480 230 C 310 230, 230 230, 230 230 Z",
      center: { x: 485, y: 325 },
      regionLabel: "Sektor Tenggara",
    };
  }

  // Dinamis untuk 5+ Posyandu: Poligon organik melingkar teratur
  const cols = count <= 6 ? 3 : 4;
  const rows = Math.ceil(count / cols);
  const colIdx = index % cols;
  const rowIdx = Math.floor(index / cols);
  const width = (590 - 90) / cols;
  const height = (410 - 70) / rows;
  const x = 90 + colIdx * width;
  const y = 70 + rowIdx * height;
  const cx = Math.round(x + width / 2);
  const cy = Math.round(y + height / 2);
  const rw = width / 2 - 6;
  const rh = height / 2 - 6;

  return {
    svgPath: `M ${cx - rw} ${cy} C ${cx - rw} ${cy - rh * 0.9}, ${cx - rw * 0.4} ${cy - rh}, ${cx} ${cy - rh} C ${cx + rw * 0.4} ${cy - rh}, ${cx + rw} ${cy - rh * 0.9}, ${cx + rw} ${cy} C ${cx + rw} ${cy + rh * 0.9}, ${cx + rw * 0.4} ${cy + rh}, ${cx} ${cy + rh} C ${cx - rw * 0.4} ${cy + rh}, ${cx - rw} ${cy + rh * 0.9}, ${cx - rw} ${cy} Z`,
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
  const [tampilkanLayer, setTampilkanLayer] = useState<"lengkap" | "tematik" | "topografi">("lengkap");

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

      // Poligon peta geografis organik
      const layout = getOrganicSvgLayout(totalPos, idx);

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

  // Warna zona tematik
  const getZonaStyle = (zona: PosyanduWilayahData["statusZona"], isSelected = false) => {
    if (zona === "prioritas") {
      return {
        fill: isSelected ? "rgba(254, 202, 202, 0.95)" : "rgba(254, 226, 226, 0.85)",
        stroke: isSelected ? "#991B1B" : "#EF4444",
        border: "#EF4444",
        text: "#B91C1C",
        label: "Zona Merah (Prioritas)",
        badgeBg: "#FEE2E2",
        dotColor: "#DC2626",
      };
    }
    if (zona === "waspada") {
      return {
        fill: isSelected ? "rgba(254, 240, 138, 0.95)" : "rgba(254, 243, 199, 0.85)",
        stroke: isSelected ? "#92400E" : "#F59E0B",
        border: "#F59E0B",
        text: "#B45309",
        label: "Zona Kuning (Waspada)",
        badgeBg: "#FEF3C7",
        dotColor: "#D97706",
      };
    }
    return {
      fill: isSelected ? "rgba(187, 247, 208, 0.95)" : "rgba(220, 252, 231, 0.85)",
      stroke: isSelected ? "#065F46" : "#10B981",
      border: "#10B981",
      text: "#15803D",
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
            Peta Geospasial Wilayah Posyandu
          </h1>
          <p style={{ fontSize: 14, color: "#475569", margin: 0 }}>
            Visualisasi kartografis batas wilayah kerja Posyandu terdaftar ({daftarPosyanduRiil.length} Posyandu Aktif di Database).
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

            {/* Filter Zona & Layer */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
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

              {/* Layer Toggle */}
              <div style={{ display: "flex", alignItems: "center", background: "#F1F5F9", borderRadius: 8, padding: 2 }}>
                <button
                  type="button"
                  onClick={() => setTampilkanLayer("lengkap")}
                  title="Tampilan Peta Lengkap (Vektor + Infrastruktur + Topografi)"
                  style={{
                    padding: "5px 10px",
                    fontSize: 12,
                    fontWeight: 700,
                    borderRadius: 6,
                    border: "none",
                    cursor: "pointer",
                    background: tampilkanLayer === "lengkap" ? "#FFFFFF" : "transparent",
                    color: tampilkanLayer === "lengkap" ? "#0F172A" : "#64748B",
                    boxShadow: tampilkanLayer === "lengkap" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                  }}
                >
                  Peta Lengkap
                </button>
                <button
                  type="button"
                  onClick={() => setTampilkanLayer("tematik")}
                  title="Fokus Tematik Sebaran Stunting"
                  style={{
                    padding: "5px 10px",
                    fontSize: 12,
                    fontWeight: 700,
                    borderRadius: 6,
                    border: "none",
                    cursor: "pointer",
                    background: tampilkanLayer === "tematik" ? "#FFFFFF" : "transparent",
                    color: tampilkanLayer === "tematik" ? "#0F172A" : "#64748B",
                    boxShadow: tampilkanLayer === "tematik" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                  }}
                >
                  Tematik Saja
                </button>
              </div>
            </div>
          </div>

          {/* ── AREA UTAMA: PETA GEOGRAFIS INTERAKTIF + PANEL DETAIL POSYANDU ── */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
            gap: 20,
            marginBottom: 24,
          }}>
            {/* 1. KANVAS PETA GEOGRAFIS SVG INTERAKTIF (SEPERTI MAP NYATA) */}
            <div style={{
              background: "#FFFFFF",
              border: "1.5px solid #E2E8F0",
              borderRadius: 16,
              padding: 20,
              display: "flex",
              flexDirection: "column",
            }}>
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14,
              }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#0F172A" }}>
                    Peta Geospasial Wilayah Posyandu ({daftarPosyanduRiil.length} Unit Terdaftar)
                  </div>
                  <div style={{ fontSize: 13, color: "#64748B" }}>
                    Batas wilayah kartografis alami bersumber dari database Posyandu
                  </div>
                </div>
                <div style={{
                  display: "flex", alignItems: "center", gap: 6,
                  fontSize: 12, fontWeight: 700, color: "#16A34A",
                  background: "#F0FDF4", padding: "5px 12px", borderRadius: 8,
                  border: "1px solid #BBF7D0",
                }}>
                  <MapPin size={14} /> Peta Alami
                </div>
              </div>

              {/* SVG MAP CANVAS */}
              <div style={{
                background: "linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)",
                border: "1.5px solid #E2E8F0",
                borderRadius: 14,
                position: "relative",
                minHeight: 440,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                boxShadow: "inset 0 2px 6px rgba(0,0,0,0.03)",
              }}>
                <svg
                  viewBox="0 0 700 470"
                  style={{ width: "100%", height: "auto", maxHeight: 440, userSelect: "none" }}
                >
                  <defs>
                    {/* Shadow halus */}
                    <filter id="mapShadow" x="-10%" y="-10%" width="120%" height="120%">
                      <feDropShadow dx="0" dy="3" stdDeviation="4" floodOpacity="0.15" />
                    </filter>
                    <filter id="pinShadow" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.25" />
                    </filter>

                    {/* Gradien Air Sungai */}
                    <linearGradient id="riverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#93C5FD" />
                      <stop offset="50%" stopColor="#60A5FA" />
                      <stop offset="100%" stopColor="#3B82F6" />
                    </linearGradient>

                    {/* Pola Grid Geografis Halus */}
                    <pattern id="geoGrid" width="60" height="60" patternUnits="userSpaceOnUse">
                      <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#E2E8F0" strokeWidth="0.75" strokeDasharray="2 4" />
                      <circle cx="60" cy="0" r="1.5" fill="#CBD5E1" />
                    </pattern>
                  </defs>

                  {/* 1. LAYER KARTOGRAFI: GRID KORDINAT BACKGROUND */}
                  <rect x="0" y="0" width="700" height="470" fill="url(#geoGrid)" />

                  {/* 2. LAYER TOPOGRAFI (KONTUR KETINGGIAN BUKIT ALAMI) */}
                  {tampilkanLayer === "lengkap" && (
                    <g opacity="0.45" stroke="#94A3B8" strokeWidth="1" fill="none" strokeDasharray="4 3">
                      {/* Kontur Dataran Tinggi Timur Laut */}
                      <path d="M 450 45 C 500 70, 560 100, 610 160 C 630 190, 645 230, 640 280" />
                      <path d="M 490 50 C 530 80, 580 120, 620 180" />
                      <path d="M 540 60 C 570 95, 600 135, 630 190" />
                      {/* Kontur Dataran Barat */}
                      <path d="M 60 270 C 80 320, 110 360, 150 400" />
                      <path d="M 80 300 C 100 340, 130 380, 170 415" />
                      {/* Teks Kontur */}
                      <text x="590" y="85" fontSize="9" fill="#94A3B8" fontWeight="600" letterSpacing="0.05em">
                        KONTUR 250m
                      </text>
                      <text x="65" y="340" fontSize="9" fill="#94A3B8" fontWeight="600" letterSpacing="0.05em">
                        KONTUR 180m
                      </text>
                    </g>
                  )}

                  {/* 3. LAYER POLIGON WILAYAH POSYANDU (DASAR WILAYAH) */}
                  <g id="territory-polygons">
                    {dataWilayahPosyandu.map((pos) => {
                      const isSelected = selectedWilayah?.id === pos.id;
                      const isHovered = hoveredPosyanduId === pos.id;
                      const style = getZonaStyle(pos.statusZona, isSelected);

                      return (
                        <g
                          key={`poly-${pos.id}`}
                          onClick={() => setSelectedPosyanduId(pos.id)}
                          onMouseEnter={() => setHoveredPosyanduId(pos.id)}
                          onMouseLeave={() => setHoveredPosyanduId(null)}
                          style={{ cursor: "pointer", transition: "all 0.25s ease" }}
                        >
                          {/* Batas Poligon Alami Wilayah Posyandu */}
                          <path
                            d={pos.svgPath}
                            fill={style.fill}
                            stroke={isSelected ? "#0F172A" : isHovered ? style.stroke : style.border}
                            strokeWidth={isSelected ? 3.5 : isHovered ? 2.5 : 2}
                            strokeLinejoin="round"
                            strokeLinecap="round"
                            filter={isSelected || isHovered ? "url(#mapShadow)" : undefined}
                            style={{ transition: "all 0.25s ease" }}
                          />

                          {/* Label Sektor / Dusun Samar di Latar Belakang */}
                          <text
                            x={pos.center.x}
                            y={pos.center.y - 44}
                            textAnchor="middle"
                            fill="#475569"
                            fontSize="10"
                            fontWeight="700"
                            letterSpacing="0.08em"
                            opacity="0.75"
                            style={{ textTransform: "uppercase" }}
                          >
                            {pos.regionLabel}
                          </text>
                        </g>
                      );
                    })}
                  </g>

                  {/* 4. LAYER ALAMI: SUNGAI CIAWI / SUKAMAJU MEANDER */}
                  {tampilkanLayer === "lengkap" && (
                    <g pointerEvents="none" id="natural-river">
                      {/* Sungai Lebar (Buffer Air) */}
                      <path
                        d="M 345 25 C 365 95, 315 155, 340 220 C 365 285, 305 350, 340 455"
                        stroke="#93C5FD"
                        strokeWidth="10"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                        opacity="0.65"
                      />
                      {/* Aliran Inti Sungai */}
                      <path
                        d="M 345 25 C 365 95, 315 155, 340 220 C 365 285, 305 350, 340 455"
                        stroke="url(#riverGrad)"
                        strokeWidth="5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                        opacity="0.9"
                      />
                      {/* Highlight Ombak Air Sungai */}
                      <path
                        d="M 345 25 C 365 95, 315 155, 340 220 C 365 285, 305 350, 340 455"
                        stroke="#DBEAFE"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeDasharray="14 10"
                        fill="none"
                        opacity="0.85"
                      />
                      {/* Label Teks Nama Sungai di Bawah */}
                      <text
                        x="330"
                        y="400"
                        transform="rotate(65, 330, 400)"
                        fontSize="9.5"
                        fill="#2563EB"
                        fontWeight="700"
                        letterSpacing="0.1em"
                        opacity="0.8"
                      >
                        Sungai Ciawi
                      </text>
                    </g>
                  )}

                  {/* 5. LAYER INFRASTRUKTUR: JALAN RAYA UTAMA & JEMBATAN */}
                  {tampilkanLayer === "lengkap" && (
                    <g pointerEvents="none" id="roads-infrastructure">
                      {/* Jalan Poros Utama Desa (Barat - Timur) */}
                      <path
                        d="M 60 170 C 160 155, 250 185, 340 175 C 430 165, 520 185, 640 165"
                        stroke="#CBD5E1"
                        strokeWidth="7"
                        strokeLinecap="round"
                        fill="none"
                      />
                      <path
                        d="M 60 170 C 160 155, 250 185, 340 175 C 430 165, 520 185, 640 165"
                        stroke="#FFFFFF"
                        strokeWidth="1.5"
                        strokeDasharray="6 4"
                        strokeLinecap="round"
                        fill="none"
                      />

                      {/* Jembatan Ciawi di Persimpangan Sungai dan Jalan Utama */}
                      <g>
                        <rect x="333" y="165" width="14" height="20" rx="2" fill="#475569" />
                        <line x1="331" y1="167" x2="349" y2="167" stroke="#94A3B8" strokeWidth="2" />
                        <line x1="331" y1="183" x2="349" y2="183" stroke="#94A3B8" strokeWidth="2" />
                        <text x="340" y="196" textAnchor="middle" fontSize="7.5" fill="#475569" fontWeight="800">
                          Jembatan
                        </text>
                      </g>

                      {/* Jalan Lingkungan Desa (Utara - Selatan) */}
                      <path
                        d="M 205 75 C 200 130, 210 200, 205 385"
                        stroke="#E2E8F0"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        strokeDasharray="4 3"
                        fill="none"
                      />
                      <path
                        d="M 485 75 C 490 130, 480 200, 485 385"
                        stroke="#E2E8F0"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        strokeDasharray="4 3"
                        fill="none"
                      />
                    </g>
                  )}

                  {/* 6. LANDMARK / TITIK FASILITAS DESA */}
                  {tampilkanLayer === "lengkap" && (
                    <g pointerEvents="none" opacity="0.85" id="village-landmarks">
                      {/* Kantor Balai Desa */}
                      <g transform="translate(375, 210)">
                        <circle cx="0" cy="0" r="10" fill="#FFFFFF" stroke="#0F172A" strokeWidth="1.5" />
                        <text x="0" y="3" textAnchor="middle" fontSize="8" fontWeight="900" fill="#0F172A">
                          BD
                        </text>
                        <text x="0" y="16" textAnchor="middle" fontSize="8" fontWeight="700" fill="#334155">
                          Balai Desa
                        </text>
                      </g>

                      {/* Puskesmas Pembantu (Pustu) */}
                      <g transform="translate(295, 210)">
                        <circle cx="0" cy="0" r="10" fill="#FFFFFF" stroke="#DC2626" strokeWidth="1.5" />
                        <text x="0" y="3" textAnchor="middle" fontSize="9" fontWeight="900" fill="#DC2626">
                          +
                        </text>
                        <text x="0" y="16" textAnchor="middle" fontSize="8" fontWeight="700" fill="#334155">
                          Pustu Desa
                        </text>
                      </g>
                    </g>
                  )}

                  {/* 7. LAYER PIN POSYANDU & BADGE INFORMASI (DI ATAS SEMUA LAYER) */}
                  <g id="posyandu-pins">
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
                          key={`pin-${pos.id}`}
                          onClick={() => setSelectedPosyanduId(pos.id)}
                          onMouseEnter={() => setHoveredPosyanduId(pos.id)}
                          onMouseLeave={() => setHoveredPosyanduId(null)}
                          style={{ cursor: "pointer", transition: "all 0.25s ease" }}
                        >
                          {/* Pulse Gelombang Radar jika Zona Prioritas atau Sedang Terpilih */}
                          {(isSelected || pos.statusZona === "prioritas") && (
                            <circle
                              cx={pos.center.x}
                              cy={pos.center.y - 18}
                              r="16"
                              fill="none"
                              stroke={style.border}
                              strokeWidth="2.5"
                              opacity="0.8"
                            >
                              <animate
                                attributeName="r"
                                from="15"
                                to="38"
                                dur="2.2s"
                                repeatCount="indefinite"
                              />
                              <animate
                                attributeName="opacity"
                                from="0.8"
                                to="0"
                                dur="2.2s"
                                repeatCount="indefinite"
                              />
                            </circle>
                          )}

                          {/* Pin Bundar Teardrop dengan Angka Kasus */}
                          <g filter="url(#pinShadow)">
                            <circle
                              cx={pos.center.x}
                              cy={pos.center.y - 18}
                              r={isSelected ? 18 : 16}
                              fill={style.border}
                              stroke="#FFFFFF"
                              strokeWidth={3}
                            />
                            <text
                              x={pos.center.x}
                              y={pos.center.y - 13}
                              textAnchor="middle"
                              fill="#FFFFFF"
                              fontSize={isSelected ? 12 : 11}
                              fontWeight="900"
                            >
                              {pinCount}
                            </text>
                          </g>

                          {/* Banner Label Nama Posyandu (Pill Putih Rapi) */}
                          <g filter="url(#pinShadow)">
                            <rect
                              x={pos.center.x - 74}
                              y={pos.center.y + 6}
                              width="148"
                              height="24"
                              rx="12"
                              fill="#FFFFFF"
                              stroke={isSelected ? "#0F172A" : isHovered ? style.stroke : style.border}
                              strokeWidth={isSelected ? 2 : 1.2}
                            />
                            <circle
                              cx={pos.center.x - 60}
                              cy={pos.center.y + 18}
                              r="4"
                              fill={style.dotColor}
                            />
                            <text
                              x={pos.center.x + 3}
                              y={pos.center.y + 21}
                              textAnchor="middle"
                              fill="#0F172A"
                              fontSize="11.5"
                              fontWeight="800"
                            >
                              {pos.nama}
                            </text>
                          </g>

                          {/* Badge Sub-Prevalensi di Bawah Nama Posyandu */}
                          <g>
                            <rect
                              x={pos.center.x - 60}
                              y={pos.center.y + 34}
                              width="120"
                              height="19"
                              rx="9.5"
                              fill={style.badgeBg}
                              stroke={style.border}
                              strokeWidth="1"
                              opacity="0.95"
                            />
                            <text
                              x={pos.center.x}
                              y={pos.center.y + 47}
                              textAnchor="middle"
                              fill={style.text}
                              fontSize="10"
                              fontWeight="800"
                            >
                              {pinPercent}% {pinLabel} ({pos.balitaDitimbang} anak)
                            </text>
                          </g>
                        </g>
                      );
                    })}
                  </g>

                  {/* 7. KOMPAS MATA ANGIN (UTARA) EKSKLUSIF */}
                  <g transform="translate(645, 55)" pointerEvents="none">
                    <circle cx="0" cy="0" r="22" fill="rgba(255, 255, 255, 0.9)" stroke="#CBD5E1" strokeWidth="1.5" />
                    {/* Jarum Utara (Hijau) */}
                    <polygon points="0,-16 4,0 -4,0" fill="#16A34A" />
                    {/* Jarum Selatan (Abu) */}
                    <polygon points="0,16 4,0 -4,0" fill="#94A3B8" />
                    {/* Jarum Barat & Timur Kecil */}
                    <polygon points="-12,0 0,-3 0,3" fill="#CBD5E1" />
                    <polygon points="12,0 0,-3 0,3" fill="#CBD5E1" />
                    <circle cx="0" cy="0" r="3" fill="#0F172A" />
                    <text x="0" y="-19" textAnchor="middle" fontSize="10" fontWeight="900" fill="#16A34A">
                      U
                    </text>
                  </g>

                  {/* 8. SKALA PETA KARTOGRAFI */}
                  <g transform="translate(24, 442)" pointerEvents="none">
                    <rect x="0" y="-14" width="130" height="18" rx="4" fill="rgba(255,255,255,0.85)" />
                    <line x1="10" y1="-3" x2="110" y2="-3" stroke="#0F172A" strokeWidth="2" />
                    <line x1="10" y1="-7" x2="10" y2="1" stroke="#0F172A" strokeWidth="1.5" />
                    <line x1="60" y1="-6" x2="60" y2="0" stroke="#0F172A" strokeWidth="1.5" />
                    <line x1="110" y1="-7" x2="110" y2="1" stroke="#0F172A" strokeWidth="1.5" />
                    <text x="10" y="-9" fontSize="8" fontWeight="800" fill="#0F172A">0</text>
                    <text x="54" y="-9" fontSize="8" fontWeight="800" fill="#0F172A">250m</text>
                    <text x="102" y="-9" fontSize="8" fontWeight="800" fill="#0F172A">500m</text>
                  </g>

                  {/* 9. BADGE KOORDINAT GEOGRAFIS DESA */}
                  <g transform="translate(20, 24)" pointerEvents="none">
                    <rect x="0" y="0" width="180" height="24" rx="6" fill="rgba(255, 255, 255, 0.9)" stroke="#E2E8F0" strokeWidth="1" />
                    <text x="8" y="16" fontSize="9.5" fontWeight="700" fill="#334155">
                      📍 6°38'24"S • 106°51'12"E (240 mdpl)
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
                    <span style={{ width: 12, height: 12, borderRadius: 3, background: "#EF4444", border: "1px solid #B91C1C" }} />
                    <span>Merah: Prevalensi &gt; 10% (Prioritas)</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, color: "#B45309" }}>
                    <span style={{ width: 12, height: 12, borderRadius: 3, background: "#F59E0B", border: "1px solid #B45309" }} />
                    <span>Kuning: Prevalensi 5% - 10% (Waspada)</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, color: "#15803D" }}>
                    <span style={{ width: 12, height: 12, borderRadius: 3, background: "#10B981", border: "1px solid #15803D" }} />
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
                    color: getZonaStyle(selectedWilayah.statusZona).text,
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
                            background: style.badgeBg, color: style.text,
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
