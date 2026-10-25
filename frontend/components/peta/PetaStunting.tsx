"use client";

import { useState, useMemo, useSyncExternalStore } from "react";
import {
  MapPin, ChevronRight, Stethoscope, Utensils, Calendar,
  Baby, Plus, Info, Building2, ExternalLink
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

// Fungsi pembagian wilayah poligon SVG secara dinamis berdasarkan jumlah Posyandu terdaftar di database
function getSvgLayout(count: number, index: number) {
  if (count <= 1) {
    return {
      svgPath: "M 40 40 L 480 40 L 480 380 L 40 380 Z",
      center: { x: 260, y: 210 },
    };
  }
  if (count === 2) {
    if (index === 0) {
      // Posyandu 1: Wilayah Barat / Kiri
      return {
        svgPath: "M 40 40 L 260 40 L 260 380 L 40 380 Z",
        center: { x: 150, y: 210 },
      };
    }
    // Posyandu 2: Wilayah Timur / Kanan
    return {
      svgPath: "M 260 40 L 480 40 L 480 380 L 260 380 Z",
      center: { x: 370, y: 210 },
    };
  }
  if (count === 3) {
    if (index === 0) {
      return {
        svgPath: "M 40 40 L 260 40 L 260 210 L 40 210 Z",
        center: { x: 150, y: 125 },
      };
    }
    if (index === 1) {
      return {
        svgPath: "M 260 40 L 480 40 L 480 210 L 260 210 Z",
        center: { x: 370, y: 125 },
      };
    }
    return {
      svgPath: "M 40 210 L 480 210 L 480 380 L 40 380 Z",
      center: { x: 260, y: 295 },
    };
  }
  if (count === 4) {
    if (index === 0) {
      return {
        svgPath: "M 40 40 L 260 40 L 260 210 L 40 210 Z",
        center: { x: 150, y: 125 },
      };
    }
    if (index === 1) {
      return {
        svgPath: "M 260 40 L 480 40 L 480 210 L 260 210 Z",
        center: { x: 370, y: 125 },
      };
    }
    if (index === 2) {
      return {
        svgPath: "M 40 210 L 260 210 L 260 380 L 40 380 Z",
        center: { x: 150, y: 295 },
      };
    }
    return {
      svgPath: "M 260 210 L 480 210 L 480 380 L 260 380 Z",
      center: { x: 370, y: 295 },
    };
  }
  // Dinamis jika lebih dari 4 posyandu
  const cols = count <= 6 ? 3 : 4;
  const rows = Math.ceil(count / cols);
  const colIdx = index % cols;
  const rowIdx = Math.floor(index / cols);
  const cellWidth = (480 - 40) / cols;
  const cellHeight = (380 - 40) / rows;
  const x1 = 40 + colIdx * cellWidth;
  const x2 = x1 + cellWidth;
  const y1 = 40 + rowIdx * cellHeight;
  const y2 = y1 + cellHeight;
  return {
    svgPath: `M ${x1} ${y1} L ${x2} ${y1} L ${x2} ${y2} L ${x1} ${y2} Z`,
    center: { x: Math.round(x1 + cellWidth / 2), y: Math.round(y1 + cellHeight / 2) },
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
        // Cek kecocokan nama posyandu / nama desa, atau masukkan ke posyandu pertama
        const text = (b.dusun || "").toLowerCase();
        if (text.includes(pos.nama.toLowerCase())) return true;
        if (idx === 0) return true;
        return false;
      });

      const totalBalita = balitaListPosyandu.length;
      const balitaDitimbang = balitaListPosyandu.filter(
        (b) => b.beratTerakhir > 0 || (b.riwayat && b.riwayat.length > 0)
      ).length;

      // Stunting (TB/U pendek / sangat pendek atau status rujukan)
      const stuntingBalita = balitaListPosyandu.filter((b) => {
        const r = b.riwayat?.[0];
        return (
          r?.statusPbu === "pendek" ||
          r?.statusPbu === "sangat_pendek" ||
          b.statusGizi === "rujukan"
        );
      });
      const stuntingCount = stuntingBalita.length;

      // Wasting (BB/TB kurus / sangat kurus)
      const wastingBalita = balitaListPosyandu.filter((b) => {
        const r = b.riwayat?.[0];
        return r?.statusBbpb === "kurus" || r?.statusBbpb === "sangat_kurus";
      });
      const wastingCount = wastingBalita.length;

      // Underweight (BB/U kurang / buruk)
      const underweightBalita = balitaListPosyandu.filter((b) => {
        const r = b.riwayat?.[0];
        return r?.statusBbu === "kurang" || r?.statusBbu === "buruk";
      });
      const underweightCount = underweightBalita.length;

      const prevalensiStunting = balitaDitimbang > 0
        ? Number(((stuntingCount / balitaDitimbang) * 100).toFixed(1))
        : 0;
      const prevalensiWasting = balitaDitimbang > 0
        ? Number(((wastingCount / balitaDitimbang) * 100).toFixed(1))
        : 0;
      const prevalensiUnderweight = balitaDitimbang > 0
        ? Number(((underweightCount / balitaDitimbang) * 100).toFixed(1))
        : 0;

      // Status zona berdasarkan data riil
      let statusZona: "aman" | "waspada" | "prioritas" = "aman";
      if (balitaDitimbang > 0) {
        if (prevalensiStunting > 10 && stuntingCount > 0) {
          statusZona = "prioritas"; // Merah
        } else if (prevalensiStunting >= 5 && stuntingCount > 0) {
          statusZona = "waspada"; // Kuning
        } else {
          statusZona = "aman"; // Hijau
        }
      }

      // Rekomendasi aksi intervensi otomatis
      let rekomendasiAksi = "";
      if (stuntingCount > 0) {
        rekomendasiAksi = `Intervensi Terarah: Terdata ${stuntingCount} balita berisiko stunting di wilayah ${pos.nama}. Jadwalkan kunjungan rumah kader & bidan serta salurkan PMT tinggi protein (telur & ikan).`;
      } else if (wastingCount > 0 || underweightCount > 0) {
        rekomendasiAksi = `Pendampingan Gizi: Terdata ${wastingCount + underweightCount} balita dengan gizi kurang/berat kurang di ${pos.nama}. Pantau kenaikan berat badan bulanan (N/T) dan berikan konseling ASI & MP-ASI.`;
      } else if (balitaDitimbang > 0) {
        rekomendasiAksi = `Pertahankan Capaian Baik: Seluruh ${balitaDitimbang} balita yang ditimbang di ${pos.nama} dalam kondisi normal. Lanjutkan pemantauan tumbuh kembang rutin setiap bulan.`;
      } else {
        rekomendasiAksi = `Belum Ada Data Penimbangan: Belum ada balita tercatat di ${pos.nama}. Silakan lakukan penimbangan dan catat data balita baru.`;
      }

      const layout = getSvgLayout(totalPos, idx);

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

  // Statistik agregat desa riil
  const totalDesaBalita = dataWilayahPosyandu.reduce((sum, d) => sum + d.totalBalita, 0);
  const totalDesaDitimbang = dataWilayahPosyandu.reduce((sum, d) => sum + d.balitaDitimbang, 0);
  const totalDesaStunting = dataWilayahPosyandu.reduce((sum, d) => sum + d.stuntingCount, 0);
  const prevalensiRataDesa = totalDesaDitimbang > 0
    ? Number(((totalDesaStunting / totalDesaDitimbang) * 100).toFixed(1))
    : 0;

  const countMerah = dataWilayahPosyandu.filter((d) => d.statusZona === "prioritas").length;
  const countKuning = dataWilayahPosyandu.filter((d) => d.statusZona === "waspada").length;
  const countHijau = dataWilayahPosyandu.filter((d) => d.statusZona === "aman").length;

  // Warna zona
  const getZonaStyle = (zona: PosyanduWilayahData["statusZona"], isFill = false) => {
    if (zona === "prioritas") {
      return {
        bg: isFill ? "#FEE2E2" : "#FEF2F2",
        border: "#EF4444",
        text: "#B91C1C",
        label: "Zona Merah (Prioritas)",
        badgeBg: "#FEE2E2",
      };
    }
    if (zona === "waspada") {
      return {
        bg: isFill ? "#FEF3C7" : "#FFFBEB",
        border: "#F59E0B",
        text: "#B45309",
        label: "Zona Kuning (Waspada)",
        badgeBg: "#FEF3C7",
      };
    }
    return {
      bg: isFill ? "#DCFCE7" : "#F0FDF4",
      border: "#10B981",
      text: "#15803D",
      label: "Zona Hijau (Aman)",
      badgeBg: "#DCFCE7",
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
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0F172A", margin: "0 0 6px 0" }}>
            Peta Geospasial Wilayah Posyandu
          </h1>
          <p style={{ fontSize: 14, color: "#475569", margin: 0 }}>
            Visualisasi sebaran stunting berdasarkan unit Posyandu yang terdaftar di Kelola Posyandu ({daftarPosyanduRiil.length} Posyandu Aktif).
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
            marginBottom: 22,
          }}>
            <div style={{
              background: "#FFFFFF", border: "1.5px solid #E2E8F0", borderRadius: 14, padding: "16px 18px",
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#64748B", marginBottom: 6 }}>
                TOTAL BALITA TERDAFTAR
              </div>
              <div style={{ fontSize: 26, fontWeight: 900, color: "#0F172A" }}>
                {totalDesaBalita} <span style={{ fontSize: 14, fontWeight: 600, color: "#64748B" }}>anak</span>
              </div>
              <div style={{ fontSize: 13, color: totalDesaDitimbang > 0 ? "#16A34A" : "#64748B", fontWeight: 700, marginTop: 4 }}>
                {totalDesaDitimbang} anak ditimbang ({totalDesaBalita > 0 ? ((totalDesaDitimbang / totalDesaBalita) * 100).toFixed(1) : "0.0"}% D/S)
              </div>
            </div>

            <div style={{
              background: "#FFFFFF", border: "1.5px solid #E2E8F0", borderRadius: 14, padding: "16px 18px",
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#64748B", marginBottom: 6 }}>
                PREVALENSI STUNTING DESA
              </div>
              <div style={{ fontSize: 26, fontWeight: 900, color: prevalensiRataDesa > 10 ? "#DC2626" : prevalensiRataDesa >= 5 ? "#D97706" : "#16A34A" }}>
                {prevalensiRataDesa}%
              </div>
              <div style={{ fontSize: 13, color: "#64748B", marginTop: 4 }}>
                Total <strong style={{ color: "#0F172A" }}>{totalDesaStunting} anak</strong> terindikasi pendek/sangat pendek
              </div>
            </div>

            <div style={{
              background: "#FFFFFF", border: "1.5px solid #E2E8F0", borderRadius: 14, padding: "16px 18px",
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#64748B", marginBottom: 6 }}>
                STATUS SEBARAN POSYANDU
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4 }}>
                <span style={{
                  background: "#FEE2E2", color: "#B91C1C", fontWeight: 800, fontSize: 13,
                  padding: "4px 10px", borderRadius: 8,
                }}>
                  {countMerah} Merah
                </span>
                <span style={{
                  background: "#FEF3C7", color: "#B45309", fontWeight: 800, fontSize: 13,
                  padding: "4px 10px", borderRadius: 8,
                }}>
                  {countKuning} Kuning
                </span>
                <span style={{
                  background: "#DCFCE7", color: "#15803D", fontWeight: 800, fontSize: 13,
                  padding: "4px 10px", borderRadius: 8,
                }}>
                  {countHijau} Hijau
                </span>
              </div>
              <div style={{ fontSize: 13, color: "#64748B", marginTop: 8 }}>
                Total {daftarPosyanduRiil.length} Posyandu dikelola di sistem
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

          {/* ── AREA UTAMA: PETA INTERAKTIF + PANEL DETAIL POSYANDU ── */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
            gap: 20,
            marginBottom: 24,
          }}>
            {/* 1. KANVAS PETA SVG INTERAKTIF POSYANDU RIIL */}
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
                    Peta Wilayah Kerja Posyandu ({daftarPosyanduRiil.length} Unit)
                  </div>
                  <div style={{ fontSize: 13, color: "#64748B" }}>
                    Hanya menampilkan Posyandu yang ada di Kelola Posyandu
                  </div>
                </div>
                <div style={{
                  display: "flex", alignItems: "center", gap: 6,
                  fontSize: 12, fontWeight: 700, color: "#16A34A",
                  background: "#F0FDF4", padding: "4px 10px", borderRadius: 8,
                }}>
                  <MapPin size={14} /> Peta Dinamis
                </div>
              </div>

              {/* SVG MAP CONTAINER */}
              <div style={{
                background: "#F8FAFC",
                border: "1.5px solid #E2E8F0",
                borderRadius: 12,
                padding: 12,
                position: "relative",
                minHeight: 400,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
                <svg
                  viewBox="0 0 520 420"
                  style={{ width: "100%", height: "auto", maxHeight: 390 }}
                >
                  <defs>
                    <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
                      <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.12" />
                    </filter>
                  </defs>

                  {/* Render Poligon Wilayah Posyandu Terdaftar */}
                  {dataWilayahPosyandu.map((pos) => {
                    const isSelected = selectedWilayah?.id === pos.id;
                    const style = getZonaStyle(pos.statusZona, isSelected);

                    // Angka pin sesuai indikator
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
                        style={{ cursor: "pointer", transition: "all 0.2s ease" }}
                      >
                        <path
                          d={pos.svgPath}
                          fill={isSelected ? style.bg : (pos.statusZona === "prioritas" ? "#FEE2E2" : pos.statusZona === "waspada" ? "#FEF3C7" : "#DCFCE7")}
                          stroke={isSelected ? "#0F172A" : style.border}
                          strokeWidth={isSelected ? 3.5 : 2}
                          filter={isSelected ? "url(#shadow)" : undefined}
                          style={{ transition: "all 0.2s ease" }}
                        />

                        {/* Pin Label Angka Kasus */}
                        <circle
                          cx={pos.center.x}
                          cy={pos.center.y - 12}
                          r={isSelected ? 16 : 14}
                          fill={style.border}
                          stroke="#FFFFFF"
                          strokeWidth={2.5}
                        />
                        <text
                          x={pos.center.x}
                          y={pos.center.y - 8}
                          textAnchor="middle"
                          fill="#FFFFFF"
                          fontSize={11}
                          fontWeight="900"
                        >
                          {pinCount}
                        </text>

                        {/* Label Teks Posyandu */}
                        <text
                          x={pos.center.x}
                          y={pos.center.y + 14}
                          textAnchor="middle"
                          fill="#0F172A"
                          fontSize={12}
                          fontWeight="800"
                          style={{ textShadow: "0 1px 2px rgba(255,255,255,0.8)" }}
                        >
                          {pos.nama}
                        </text>
                        <text
                          x={pos.center.x}
                          y={pos.center.y + 28}
                          textAnchor="middle"
                          fill={style.text}
                          fontSize={11}
                          fontWeight="800"
                        >
                          {pinPercent}% {pinLabel}
                        </text>
                      </g>
                    );
                  })}
                </svg>

                {/* Legenda Peta */}
                <div style={{
                  position: "absolute",
                  bottom: 14,
                  left: 14,
                  background: "rgba(255, 255, 255, 0.95)",
                  border: "1px solid #CBD5E1",
                  borderRadius: 8,
                  padding: "8px 12px",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
                  fontSize: 11,
                  fontWeight: 700,
                  display: "flex",
                  flexDirection: "column",
                  gap: 5,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#B91C1C" }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: "#EF4444" }} />
                    <span>Merah: Prevalensi &gt; 10% (Prioritas)</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#B45309" }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: "#F59E0B" }} />
                    <span>Kuning: Prevalensi 5% - 10% (Waspada)</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#15803D" }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: "#10B981" }} />
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
