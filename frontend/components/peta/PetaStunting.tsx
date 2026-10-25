"use client";

import { useState, useMemo, useSyncExternalStore } from "react";
import {
  MapPin, ChevronRight, Stethoscope, Utensils, Calendar,
  Baby, Plus, Info, FileText, CheckCircle2, AlertTriangle, XCircle
} from "lucide-react";
import { type BalitaItem } from "@/components/balita/RiwayatData";
import { type PosyanduItem } from "@/lib/utils";

export interface DusunData {
  id: string;
  nama: string;
  posyandu: string;
  rtRw: string;
  bidanPj: string;
  kaderPj: string;
  totalBalita: number;
  balitaDitimbang: number;
  stuntingCount: number;
  wastingCount: number;
  underweightCount: number;
  prevalensiStunting: number; // dalam persen (%)
  prevalensiWasting: number;
  prevalensiUnderweight: number;
  statusZona: "aman" | "waspada" | "prioritas";
  rekomendasiAksi: string;
  svgPath: string; // Path SVG untuk peta wilayah
  center: { x: number; y: number }; // Koordinat label pin
  balitaListDusun: BalitaItem[];
}

interface DusunGeoConfig {
  id: string;
  nama: string;
  defaultPosyandu: string;
  rtRw: string;
  bidanPj: string;
  kaderPj: string;
  svgPath: string;
  center: { x: number; y: number };
}

// Konfigurasi Geospasial Wilayah Desa
const WILAYAH_DESA_CONFIG: DusunGeoConfig[] = [
  {
    id: "krajan",
    nama: "Dusun Krajan",
    defaultPosyandu: "Posyandu Melati 01",
    rtRw: "RT 01 - 05 / RW 01",
    bidanPj: "Bdn. Siti Rahayu, A.Md.Keb",
    kaderPj: "Ibu Sri Rejeki & Ibu Aminah",
    svgPath: "M 40 40 L 220 30 L 260 180 L 160 260 L 30 200 Z",
    center: { x: 130, y: 130 },
  },
  {
    id: "sukamaju",
    nama: "Dusun Sukamaju",
    defaultPosyandu: "Posyandu Mawar 02",
    rtRw: "RT 01 - 04 / RW 02",
    bidanPj: "Bdn. Dewi Lestari, S.Tr.Keb",
    kaderPj: "Ibu Nurul & Ibu Wardah",
    svgPath: "M 220 30 L 460 50 L 480 210 L 260 180 Z",
    center: { x: 350, y: 120 },
  },
  {
    id: "mekarsari",
    nama: "Dusun Mekarsari",
    defaultPosyandu: "Posyandu Anggrek 03",
    rtRw: "RT 01 - 06 / RW 03",
    bidanPj: "Bdn. Siti Rahayu, A.Md.Keb",
    kaderPj: "Ibu Kustiyah & Ibu Linda",
    svgPath: "M 160 260 L 260 180 L 480 210 L 440 370 L 190 380 Z",
    center: { x: 320, y: 280 },
  },
  {
    id: "tanjungsari",
    nama: "Dusun Tanjungsari",
    defaultPosyandu: "Posyandu Cempaka 04",
    rtRw: "RT 01 - 04 / RW 04",
    bidanPj: "Bdn. Dewi Lestari, S.Tr.Keb",
    kaderPj: "Ibu Hartini & Ibu Rusmini",
    svgPath: "M 30 200 L 160 260 L 190 380 L 50 370 Z",
    center: { x: 110, y: 300 },
  },
];

export interface PetaStuntingProps {
  balitaList?: BalitaItem[];
  posyanduList?: PosyanduItem[];
  activePosyandu?: PosyanduItem | null;
  onCatatBaru?: () => void;
  onLihatRiwayat?: () => void;
}

export function PetaStunting({
  balitaList = [],
  posyanduList = [],
  activePosyandu,
  onCatatBaru,
  onLihatRiwayat,
}: PetaStuntingProps) {
  const [selectedDusunId, setSelectedDusunId] = useState<string>("krajan");
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

  // 1. DATA DUSUN 100% DINAMIS DARI DATABASE SUPABASE
  const dataDusun: DusunData[] = useMemo(() => {
    return WILAYAH_DESA_CONFIG.map((cfg) => {
      // Filter balita yang tinggal di dusun ini
      const balitaListDusun = balitaList.filter((b) => {
        const text = (b.dusun || "").toLowerCase();
        if (text.includes(cfg.id)) return true;
        if (text.includes(cfg.nama.toLowerCase())) return true;

        // Fallback jika tidak menulis dusun spesifik (hanya "desa sukamaju" atau kosong):
        // Jika tidak cocok dengan dusun lain, kelompokkan ke Krajan sebagai default
        const isMatchedOther = WILAYAH_DESA_CONFIG.some(
          (other) => other.id !== cfg.id && (text.includes(other.id) || text.includes(other.nama.toLowerCase()))
        );
        if (!isMatchedOther && cfg.id === "krajan") {
          return true;
        }
        return false;
      });

      const totalBalita = balitaListDusun.length;
      const balitaDitimbang = balitaListDusun.filter(
        (b) => b.beratTerakhir > 0 || (b.riwayat && b.riwayat.length > 0)
      ).length;

      // Stunting (TB/U pendek / sangat pendek atau status rujukan)
      const stuntingBalita = balitaListDusun.filter((b) => {
        const r = b.riwayat?.[0];
        return (
          r?.statusPbu === "pendek" ||
          r?.statusPbu === "sangat_pendek" ||
          b.statusGizi === "rujukan"
        );
      });
      const stuntingCount = stuntingBalita.length;

      // Wasting (BB/TB kurus / sangat kurus)
      const wastingBalita = balitaListDusun.filter((b) => {
        const r = b.riwayat?.[0];
        return r?.statusBbpb === "kurus" || r?.statusBbpb === "sangat_kurus";
      });
      const wastingCount = wastingBalita.length;

      // Underweight (BB/U kurang / buruk)
      const underweightBalita = balitaListDusun.filter((b) => {
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

      // Rekomendasi aksi intervensi otomatis berbasis data riil
      let rekomendasiAksi = "";
      if (stuntingCount > 0) {
        rekomendasiAksi = `Intervensi Terarah: Ditemukan ${stuntingCount} balita berisiko stunting di ${cfg.nama}. Segera jadwalkan kunjungan rumah bersama Bidan Desa dan berikan paket PMT tinggi protein (telur/ikan).`;
      } else if (wastingCount > 0 || underweightCount > 0) {
        rekomendasiAksi = `Pendampingan Gizi: Ada ${wastingCount + underweightCount} balita dengan berat/gizi kurang. Pantau kenaikan berat badan bulanan (N/T) dan berikan konseling pemberian MP-ASI padat gizi.`;
      } else if (balitaDitimbang > 0) {
        rekomendasiAksi = `Pertahankan Capaian Baik: Seluruh ${balitaDitimbang} balita yang ditimbang dalam kondisi normal. Lanjutkan edukasi pola asuh, sanitasi, dan kehadiran rutin di Posyandu setiap bulan.`;
      } else {
        rekomendasiAksi = `Belum Ada Data Penimbangan: Belum ada balita tercatat di ${cfg.nama}. Silakan lakukan pencatatan penimbangan balita pada sesi Posyandu.`;
      }

      // Cari posyandu dari daftar posyandu yang cocok jika ada
      const posyanduTerkait = posyanduList.find(
        (p) => (p.nama || "").toLowerCase().includes(cfg.id) || (p.desa || "").toLowerCase().includes(cfg.id)
      );

      return {
        id: cfg.id,
        nama: cfg.nama,
        posyandu: posyanduTerkait ? posyanduTerkait.nama : cfg.defaultPosyandu,
        rtRw: cfg.rtRw,
        bidanPj: cfg.bidanPj,
        kaderPj: cfg.kaderPj,
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
        svgPath: cfg.svgPath,
        center: cfg.center,
        balitaListDusun,
      };
    });
  }, [balitaList, posyanduList]);

  // Dusun terpilih untuk panel detail
  const selectedDusun = useMemo(() => {
    return dataDusun.find((d) => d.id === selectedDusunId) || dataDusun[0];
  }, [dataDusun, selectedDusunId]);

  // Statistik agregat desa riil dari database
  const totalDesaBalita = dataDusun.reduce((sum, d) => sum + d.totalBalita, 0);
  const totalDesaDitimbang = dataDusun.reduce((sum, d) => sum + d.balitaDitimbang, 0);
  const totalDesaStunting = dataDusun.reduce((sum, d) => sum + d.stuntingCount, 0);
  const prevalensiRataDesa = totalDesaDitimbang > 0
    ? Number(((totalDesaStunting / totalDesaDitimbang) * 100).toFixed(1))
    : 0;

  const countMerah = dataDusun.filter((d) => d.statusZona === "prioritas").length;
  const countKuning = dataDusun.filter((d) => d.statusZona === "waspada").length;
  const countHijau = dataDusun.filter((d) => d.statusZona === "aman").length;

  // Warna zona
  const getZonaStyle = (zona: DusunData["statusZona"], isFill = false) => {
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

  // Filter daftar dusun
  const filteredDusunList = useMemo(() => {
    if (filterZona === "semua") return dataDusun;
    return dataDusun.filter((d) => d.statusZona === filterZona);
  }, [dataDusun, filterZona]);

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
            Peta Geospasial Stunting Desa
          </h1>
          <p style={{ fontSize: 14, color: "#475569", margin: 0 }}>
            Visualisasi data riil sebaran prevalensi stunting dan prioritas intervensi gizi per dusun dari database Supabase.
          </p>
        </div>

        {/* Periode & Lokasi Tag */}
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

      {/* ── BANNER INFORMASI DATA DATABASE ── */}
      {totalDesaBalita === 0 && (
        <div style={{
          background: "#F0FDF4",
          border: "1.5px solid #BBF7D0",
          borderRadius: 14,
          padding: "14px 18px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 20,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Info size={20} color="#16A34A" />
            <div style={{ fontSize: 13.5, color: "#166534", fontWeight: 600 }}>
              Database Posyandu Supabase telah terhubung dan bersih (tanpa data dummy). Peta saat ini menampilkan 0 balita tercatat.
            </div>
          </div>
          {onCatatBaru && (
            <button
              type="button"
              onClick={onCatatBaru}
              style={{
                background: "#16A34A",
                color: "#FFFFFF",
                border: "none",
                borderRadius: 9,
                padding: "7px 14px",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                boxShadow: "0 2px 6px rgba(22, 163, 74, 0.2)",
              }}
            >
              <Plus size={15} /> Catat Balita Sekarang
            </button>
          )}
        </div>
      )}

      {/* ── KARTU RINGKASAN AGREGAT DESA (100% DATA RIIL) ── */}
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
            STATUS SEBARAN WILAYAH
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
            Target Nasional: Seluruh dusun zona hijau (stunting &lt; 5%)
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

      {/* ── AREA UTAMA: PETA INTERAKTIF + PANEL DETAIL DUSUN ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
        gap: 20,
        marginBottom: 24,
      }}>
        {/* 1. KANVAS PETA SVG INTERAKTIF DESA */}
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
                Peta Wilayah Dusun {activePosyandu ? activePosyandu.desa : "Desa Sukamaju"}
              </div>
              <div style={{ fontSize: 13, color: "#64748B" }}>
                Klik pada wilayah dusun untuk membuka detail & rekomendasi aksi
              </div>
            </div>
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              fontSize: 12, fontWeight: 700, color: "#16A34A",
              background: "#F0FDF4", padding: "4px 10px", borderRadius: 8,
            }}>
              <MapPin size={14} /> Peta Vektor Interaktif
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
              {/* Garis batas wilayah luar desa */}
              <defs>
                <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
                  <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.1" />
                </filter>
              </defs>

              {/* Render Poligon Dusun */}
              {dataDusun.map((dusun) => {
                const isSelected = selectedDusunId === dusun.id;
                const style = getZonaStyle(dusun.statusZona, isSelected);

                // Angka yang ditampilkan pada pin sesuai indikator aktif
                const pinCount =
                  indikatorPeta === "stunting"
                    ? dusun.stuntingCount
                    : indikatorPeta === "wasting"
                    ? dusun.wastingCount
                    : dusun.underweightCount;

                const pinPercent =
                  indikatorPeta === "stunting"
                    ? dusun.prevalensiStunting
                    : indikatorPeta === "wasting"
                    ? dusun.prevalensiWasting
                    : dusun.prevalensiUnderweight;

                const pinLabel =
                  indikatorPeta === "stunting"
                    ? "Stunting"
                    : indikatorPeta === "wasting"
                    ? "Wasting"
                    : "BB Kurang";

                return (
                  <g
                    key={dusun.id}
                    onClick={() => setSelectedDusunId(dusun.id)}
                    style={{ cursor: "pointer", transition: "all 0.2s ease" }}
                  >
                    <path
                      d={dusun.svgPath}
                      fill={isSelected ? style.bg : (dusun.statusZona === "prioritas" ? "#FEE2E2" : dusun.statusZona === "waspada" ? "#FEF3C7" : "#DCFCE7")}
                      stroke={isSelected ? "#0F172A" : style.border}
                      strokeWidth={isSelected ? 3.5 : 2}
                      filter={isSelected ? "url(#shadow)" : undefined}
                      style={{ transition: "all 0.2s ease" }}
                    />

                    {/* Pin Label Angka Kasus */}
                    <circle
                      cx={dusun.center.x}
                      cy={dusun.center.y - 12}
                      r={isSelected ? 16 : 14}
                      fill={style.border}
                      stroke="#FFFFFF"
                      strokeWidth={2.5}
                    />
                    <text
                      x={dusun.center.x}
                      y={dusun.center.y - 8}
                      textAnchor="middle"
                      fill="#FFFFFF"
                      fontSize={11}
                      fontWeight="900"
                    >
                      {pinCount}
                    </text>

                    {/* Label Teks Dusun */}
                    <text
                      x={dusun.center.x}
                      y={dusun.center.y + 14}
                      textAnchor="middle"
                      fill="#0F172A"
                      fontSize={12}
                      fontWeight="800"
                      style={{ textShadow: "0 1px 2px rgba(255,255,255,0.8)" }}
                    >
                      {dusun.nama}
                    </text>
                    <text
                      x={dusun.center.x}
                      y={dusun.center.y + 28}
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

        {/* 2. PANEL DETAIL WILAYAH DUSUN TERPILIH */}
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
                Wilayah Terpilih ({selectedDusun.rtRw})
              </div>
              <div style={{ fontSize: 20, fontWeight: 900, color: "#0F172A", marginTop: 2 }}>
                {selectedDusun.nama}
              </div>
              <div style={{ fontSize: 13, color: "#16A34A", fontWeight: 700, marginTop: 2 }}>
                {selectedDusun.posyandu}
              </div>
            </div>

            <span style={{
              background: getZonaStyle(selectedDusun.statusZona).badgeBg,
              color: getZonaStyle(selectedDusun.statusZona).text,
              border: `1.5px solid ${getZonaStyle(selectedDusun.statusZona).border}`,
              padding: "5px 12px",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 800,
            }}>
              {getZonaStyle(selectedDusun.statusZona).label}
            </span>
          </div>

          {/* Grid Indikator Dusun Terpilih */}
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
                color: selectedDusun.prevalensiStunting > 10 ? "#DC2626" : selectedDusun.prevalensiStunting >= 5 ? "#D97706" : "#16A34A",
                marginTop: 2
              }}>
                {selectedDusun.prevalensiStunting}%
              </div>
              <div style={{ fontSize: 12, color: "#475569", marginTop: 2 }}>
                {selectedDusun.stuntingCount} dari {selectedDusun.balitaDitimbang} anak
              </div>
            </div>

            <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 12, color: "#64748B", fontWeight: 700 }}>CAKUPAN TIMBANG (D/S)</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: "#0F172A", marginTop: 2 }}>
                {selectedDusun.totalBalita > 0 ? ((selectedDusun.balitaDitimbang / selectedDusun.totalBalita) * 100).toFixed(1) : "0.0"}%
              </div>
              <div style={{ fontSize: 12, color: "#16A34A", fontWeight: 700, marginTop: 2 }}>
                {selectedDusun.balitaDitimbang} / {selectedDusun.totalBalita} sasaran
              </div>
            </div>

            <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 12, color: "#64748B", fontWeight: 700 }}>GIZI KURANG (WASTING)</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#0F172A", marginTop: 2 }}>
                {selectedDusun.wastingCount} <span style={{ fontSize: 12, color: "#64748B" }}>anak</span>
              </div>
              <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>
                {selectedDusun.prevalensiWasting}% prevalensi
              </div>
            </div>

            <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 12, color: "#64748B", fontWeight: 700 }}>BERAT KURANG (UNDERWEIGHT)</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#0F172A", marginTop: 2 }}>
                {selectedDusun.underweightCount} <span style={{ fontSize: 12, color: "#64748B" }}>anak</span>
              </div>
              <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>
                {selectedDusun.prevalensiUnderweight}% prevalensi
              </div>
            </div>
          </div>

          {/* Daftar Balita Nyata di Wilayah Ini */}
          <div style={{ marginBottom: 16 }}>
            <div style={{
              fontSize: 12, fontWeight: 800, color: "#0F172A",
              display: "flex", justifyContent: "space-between", alignItems: "center",
              marginBottom: 8,
            }}>
              <span>BALITA TERDAFTAR DI {selectedDusun.nama.toUpperCase()}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#16A34A" }}>
                {selectedDusun.balitaListDusun.length} balita
              </span>
            </div>

            {selectedDusun.balitaListDusun.length === 0 ? (
              <div style={{
                padding: "14px 12px",
                background: "#F8FAFC",
                borderRadius: 10,
                border: "1px dashed #CBD5E1",
                fontSize: 12.5,
                color: "#64748B",
                textAlign: "center",
              }}>
                Belum ada data balita di {selectedDusun.nama}.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 160, overflowY: "auto" }}>
                {selectedDusun.balitaListDusun.map((b) => (
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

          {/* Tim Pelaksana Posyandu & Bidan */}
          <div style={{
            background: "#F0FDF4",
            border: "1px solid #DCFCE7",
            borderRadius: 10,
            padding: "10px 14px",
            marginBottom: 14,
          }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "#15803D", marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
              <Stethoscope size={14} /> Tim Pendamping Wilayah:
            </div>
            <div style={{ fontSize: 12.5, color: "#0F172A", marginBottom: 2 }}>
              Bidan Desa: <strong>{selectedDusun.bidanPj}</strong>
            </div>
            <div style={{ fontSize: 12.5, color: "#0F172A" }}>
              Kader Posyandu: <strong>{selectedDusun.kaderPj}</strong>
            </div>
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
              {selectedDusun.rekomendasiAksi}
            </p>
          </div>
        </div>
      </div>

      {/* ── TABEL PRIORITAS INTERVENSI SELURUH DUSUN ── */}
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
              Tabel Prioritas Intervensi Dusun
            </div>
            <div style={{ fontSize: 13, color: "#64748B" }}>
              Diurutkan berdasarkan urgensi prevalensi stunting tertinggi (Data Riil Supabase)
            </div>
          </div>
          <div style={{ fontSize: 13, color: "#475569", fontWeight: 700 }}>
            {filteredDusunList.length} Dusun Terdata
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <div style={{ minWidth: 840 }}>
            {/* Header Kolom */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "minmax(200px, 1.8fr) 130px 110px 110px 160px 120px",
              gap: 14,
              padding: "12px 20px",
              background: "#F8FAFC",
              borderBottom: "1.5px solid #E2E8F0",
              fontSize: 12,
              fontWeight: 800,
              color: "#64748B",
            }}>
              <div>NAMA DUSUN & POSYANDU</div>
              <div>SASARAN (D/S)</div>
              <div>STUNTING</div>
              <div>PREVALENSI</div>
              <div>STATUS ZONA</div>
              <div style={{ textAlign: "right" }}>AKSI</div>
            </div>

            {/* Baris Dusun */}
            {filteredDusunList
              .slice()
              .sort((a, b) => b.prevalensiStunting - a.prevalensiStunting)
              .map((dusun, idx) => {
                const style = getZonaStyle(dusun.statusZona);
                const isSelected = selectedDusunId === dusun.id;

                return (
                  <div
                    key={dusun.id}
                    onClick={() => setSelectedDusunId(dusun.id)}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "minmax(200px, 1.8fr) 130px 110px 110px 160px 120px",
                      gap: 14,
                      padding: "14px 20px",
                      alignItems: "center",
                      borderBottom: idx === filteredDusunList.length - 1 ? "none" : "1px solid #F1F5F9",
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
                        {dusun.nama}
                      </div>
                      <div style={{ fontSize: 13, color: "#475569", marginTop: 2 }}>
                        {dusun.posyandu} • {dusun.rtRw}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: "#0F172A" }}>
                        {dusun.balitaDitimbang} / {dusun.totalBalita}
                      </div>
                      <div style={{ fontSize: 12, color: "#16A34A", fontWeight: 700 }}>
                        {dusun.totalBalita > 0 ? ((dusun.balitaDitimbang / dusun.totalBalita) * 100).toFixed(1) : "0.0"}% D/S
                      </div>
                    </div>

                    <div>
                      <span style={{ fontSize: 15, fontWeight: 800, color: "#0F172A" }}>
                        {dusun.stuntingCount}
                      </span>{" "}
                      <span style={{ fontSize: 13, color: "#64748B" }}>anak</span>
                    </div>

                    <div>
                      <span style={{
                        fontSize: 15, fontWeight: 900,
                        color: dusun.prevalensiStunting > 10 ? "#DC2626" : dusun.prevalensiStunting >= 5 ? "#D97706" : "#16A34A",
                      }}>
                        {dusun.prevalensiStunting}%
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
                          setSelectedDusunId(dusun.id);
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
    </div>
  );
}
