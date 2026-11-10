"use client";

import { useState, useMemo, useSyncExternalStore } from "react";
import {
  TrendingDown,
  Users,
  ChevronRight,
  ChevronLeft,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Activity,
  Sparkles,
  ArrowRight,
} from "lucide-react";

import { type BalitaItem } from "@/components/balita/RiwayatData";
import { type PosyanduItem } from "@/lib/utils";

interface DashboardOverviewProps {
  balitaList?: BalitaItem[];
  posyanduList?: PosyanduItem[];
  activePosyandu?: PosyanduItem | null;
  onNavigate: (pageId: string) => void;
  onBukaGrafikBalita?: (id: string) => void;
}

export function DashboardOverview({
  balitaList,
  onNavigate,
  onBukaGrafikBalita,
}: DashboardOverviewProps) {
  const list = useMemo(() => balitaList ?? [], [balitaList]);
  const totalBalita = list.length;
  const totalDitimbang = list.filter((b) => b.riwayat && b.riwayat.length > 0).length;
  const totalNormal = list.filter((b) => b.statusGizi === "normal").length;
  const totalWaspada = list.filter((b) => b.statusGizi === "waspada").length;
  const totalRujukan = list.filter((b) => b.statusGizi === "rujukan").length;

  const prevalensiStunting =
    totalDitimbang > 0 ? ((totalRujukan / totalDitimbang) * 100).toFixed(1) : "0.0";
  const persenDitimbang =
    totalBalita > 0 ? ((totalDitimbang / totalBalita) * 100).toFixed(1) : "0.0";
  const persenNormal =
    totalDitimbang > 0 ? ((totalNormal / totalDitimbang) * 100).toFixed(1) : "0.0";
  const persenWaspada =
    totalDitimbang > 0 ? ((totalWaspada / totalDitimbang) * 100).toFixed(1) : "0.0";
  const balitaPerhatianList = list.filter((b) => b.statusGizi !== "normal");

  // Metrik Indikator Kinerja SKDN & Pemetaan Wilayah
  const totalNaik = useMemo(() => {
    return list.filter((b) => {
      if (!b.riwayat || b.riwayat.length === 0) return false;
      const latest = b.riwayat[b.riwayat.length - 1];
      if (latest.statusTumbuh === "N") return true;
      if (b.riwayat.length >= 2) {
        const prev = b.riwayat[b.riwayat.length - 2];
        return Number(latest.beratKg) > Number(prev.beratKg);
      }
      return false;
    }).length;
  }, [list]);

  const persenNaik =
    totalDitimbang > 0 ? ((totalNaik / totalDitimbang) * 100).toFixed(0) : "0";

  const kelompokUsia = useMemo(() => {
    let asiEksklusif = 0; // 0-5 bln
    let periodeEmas = 0;  // 6-23 bln
    let praSekolah = 0;   // 24-59 bln
    list.forEach((b) => {
      const u = b.umurBulan ?? 0;
      if (u <= 5) asiEksklusif++;
      else if (u <= 23) periodeEmas++;
      else praSekolah++;
    });
    return { asiEksklusif, periodeEmas, praSekolah };
  }, [list]);

  const totalLaki = list.filter((b) => b.jenisKelamin === "L").length;
  const totalPerempuan = list.filter((b) => b.jenisKelamin === "P").length;
  const belumDitimbang = Math.max(0, totalBalita - totalDitimbang);

  // Pagination untuk "Balita Perlu Perhatian Medis"
  const [pagePerhatian, setPagePerhatian] = useState(1);
  const [prevList, setPrevList] = useState(list);
  const ITEMS_PER_PAGE_PERHATIAN = 5;

  // Reset pagination saat filter/daftar balita berganti
  if (prevList !== list) {
    setPrevList(list);
    setPagePerhatian(1);
  }

  const totalPagesPerhatian = Math.max(1, Math.ceil(balitaPerhatianList.length / ITEMS_PER_PAGE_PERHATIAN));
  const currentPagePerhatian = Math.min(pagePerhatian, totalPagesPerhatian);

  const paginatedBalitaPerhatian = useMemo(() => {
    const startIndex = (currentPagePerhatian - 1) * ITEMS_PER_PAGE_PERHATIAN;
    return balitaPerhatianList.slice(startIndex, startIndex + ITEMS_PER_PAGE_PERHATIAN);
  }, [balitaPerhatianList, currentPagePerhatian]);

  const [hoveredSlice, setHoveredSlice] = useState<number | null>(null);

  // Waktu bulan saat ini yang stabil dan reaktif
  const currentMonthName = useSyncExternalStore(
    () => () => {},
    () => {
      try {
        return new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(
          new Date()
        );
      } catch {
        return "Bulan Ini";
      }
    },
    () => "Bulan Ini"
  );

  // 1. DATA STATUS GIZI 100% DINAMIS (STANDAR WHO)
  const pieStatusData = useMemo(() => {
    if (totalDitimbang === 0) return [];
    return [
      {
        label: "Gizi Baik (Normal)",
        keterangan: "Sesuai Median Baku WHO 2006",
        count: totalNormal,
        percent: Number(((totalNormal / totalDitimbang) * 100).toFixed(1)),
        color: "#16A34A",
        bgBadge: "#DCFCE7",
        textColor: "#15803D",
      },
      {
        label: "Gizi Kurang / Waspada",
        keterangan: "Pita Kuning / Perlu Tambahan Nutrisi",
        count: totalWaspada,
        percent: Number(((totalWaspada / totalDitimbang) * 100).toFixed(1)),
        color: "#F59E0B",
        bgBadge: "#FEF3C7",
        textColor: "#B45309",
      },
      {
        label: "Indikasi Stunting / Rujukan",
        keterangan: "Prioritas Tindak Lanjut Klinis Bidan",
        count: totalRujukan,
        percent: Number(((totalRujukan / totalDitimbang) * 100).toFixed(1)),
        color: "#EF4444",
        bgBadge: "#FEE2E2",
        textColor: "#B91C1C",
      },
    ];
  }, [totalDitimbang, totalNormal, totalWaspada, totalRujukan]);

  // Donut SVG parameters
  const donutR = 54;
  const donutCircumference = 2 * Math.PI * donutR;
  const pieSlices = useMemo(() => {
    return pieStatusData.reduce((acc, item) => {
      const prevOffset =
        acc.length > 0 ? acc[acc.length - 1].offset + acc[acc.length - 1].percent : 0;
      acc.push({ ...item, offset: prevOffset });
      return acc;
    }, [] as Array<(typeof pieStatusData)[number] & { offset: number }>);
  }, [pieStatusData]);

  // 2. SEBARAN WILAYAH/DUSUN REAL DARI DATABASE
  const sebaranWilayah = useMemo(() => {
    if (list.length === 0) return [];
    const map = new Map<
      string,
      { nama: string; total: number; ditimbang: number; stunting: number }
    >();

    for (const b of list) {
      const wilayahKey = (b.dusun && b.dusun.trim()) || "Wilayah Posyandu";
      const existing = map.get(wilayahKey) || {
        nama: wilayahKey,
        total: 0,
        ditimbang: 0,
        stunting: 0,
      };
      existing.total += 1;
      if (b.riwayat && b.riwayat.length > 0) {
        existing.ditimbang += 1;
      }
      if (b.statusGizi === "rujukan") {
        existing.stunting += 1;
      }
      map.set(wilayahKey, existing);
    }

    return Array.from(map.values()).map((w) => {
      const prev = w.ditimbang > 0 ? ((w.stunting / w.ditimbang) * 100).toFixed(1) : "0.0";
      const cakupan = w.total > 0 ? ((w.ditimbang / w.total) * 100).toFixed(0) : "0";
      const zona = Number(prev) > 10 ? "prioritas" : Number(prev) > 0 ? "waspada" : "aman";
      return { ...w, prevalensi: `${prev}%`, cakupan: `${cakupan}%`, zona };
    });
  }, [list]);

  // 3. TREN PENIMBANGAN BULANAN
  const trenBulanan = useMemo(() => {
    const monthCounts: Record<string, { ditimbang: number; stunting: number }> = {};

    list.forEach((b) => {
      (b.riwayat || []).forEach((r) => {
        if (!r.tanggal) return;
        const d = new Date(r.tanggal);
        if (isNaN(d.getTime())) return;
        const key = d.toLocaleDateString("id-ID", { month: "short", year: "2-digit" });
        if (!monthCounts[key]) {
          monthCounts[key] = { ditimbang: 0, stunting: 0 };
        }
        monthCounts[key].ditimbang += 1;
        if (
          r.statusPbu === "pendek" ||
          r.statusPbu === "sangat_pendek" ||
          r.statusBbpb === "sangat_kurus"
        ) {
          monthCounts[key].stunting += 1;
        }
      });
    });

    return Object.entries(monthCounts).map(([bulan, stat]) => ({
      bulan,
      ditimbang: stat.ditimbang,
      stunting: stat.stunting,
      prevalensi:
        stat.ditimbang > 0 ? Number(((stat.stunting / stat.ditimbang) * 100).toFixed(1)) : 0,
    }));
  }, [list]);

  return (
    <div
      style={{
        maxWidth: 1180,
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: 20,
        paddingBottom: 36,
      }}
    >
      {/* ─────────────────────────────────────────────────────────────
          1. HEADER BERSIH, LEGA & RAMAH PENGGUNA
          ───────────────────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 16,
          padding: "4px 2px",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 800,
              color: "#0F172A",
              margin: 0,
              letterSpacing: "-0.02em",
              lineHeight: 1.25,
            }}
          >
            Dashboard Pemantauan Tumbuh Kembang Balita
          </h1>
          <p
            style={{
              fontSize: 13,
              color: "#64748B",
              margin: "4px 0 0 0",
              fontWeight: 500,
            }}
          >
            Pemantauan status antropometri baku WHO Child Growth Standards 2006 · Periode {currentMonthName}
          </p>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. EMPTY STATE WELCOME BANNER (JIKA DATABASE MASIH BERSIH)
          ───────────────────────────────────────────────────────────── */}
      {totalBalita === 0 && (
        <div
          style={{
            background: "linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 40%, #F0F9FF 100%)",
            border: "1.5px solid #BBF7D0",
            borderRadius: 16,
            padding: "18px 22px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 14,
            boxShadow: "0 2px 8px rgba(22, 163, 74, 0.08)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: "linear-gradient(135deg, #22C55E, #16A34A)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#FFFFFF",
                boxShadow: "0 4px 10px rgba(22, 163, 74, 0.3)",
                flexShrink: 0,
              }}
            >
              <Sparkles size={22} />
            </div>
            <div>
              <div style={{ fontSize: 14.5, fontWeight: 800, color: "#0F172A" }}>
                Database Posyandu Siap Menerima Data Riil
              </div>
              <div style={{ fontSize: 12.5, color: "#475569", marginTop: 2, lineHeight: 1.4 }}>
                Belum ada balita yang tercatat. Silakan input penimbangan balita melalui form manual
                atau scan foto KMS (OCR) untuk melihat grafik & analitik otomatis.
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigate("input")}
            style={{
              background: "#16A34A",
              color: "#FFFFFF",
              border: "none",
              borderRadius: 9,
              padding: "8px 16px",
              fontSize: 12.5,
              fontWeight: 700,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              whiteSpace: "nowrap",
            }}
          >
            <span>Mulai Catat Sekarang</span>
            <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          3. 4 KARTU METRIK UTAMA (LEBIH BERNAPAS, BERSIH & MODERN)
          ───────────────────────────────────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
          gap: 14,
        }}
      >
        {/* Card 1: Total Sasaran */}
        <div
          style={{
            background: "#FFFFFF",
            border: "1.5px solid #E2E8F0",
            borderRadius: 14,
            padding: "16px 18px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#64748B" }}>
              Total Sasaran Balita (S)
            </span>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: "#F1F5F9",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#475569",
              }}
            >
              <Users size={16} />
            </div>
          </div>
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: "#0F172A", lineHeight: 1 }}>
              {totalBalita}
              <span style={{ fontSize: 13, fontWeight: 600, color: "#94A3B8", marginLeft: 4 }}>
                anak
              </span>
            </div>
            <div
              style={{
                fontSize: 11.5,
                color: totalDitimbang > 0 ? "#16A34A" : "#64748B",
                fontWeight: 600,
                marginTop: 6,
              }}
            >
              Cakupan Timbang (D): {totalDitimbang} anak ({persenDitimbang}%)
            </div>
          </div>
        </div>

        {/* Card 2: Normal */}
        <div
          style={{
            background: "#FFFFFF",
            border: "1.5px solid #E2E8F0",
            borderRadius: 14,
            padding: "16px 18px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#15803D" }}>
              Status Gizi Baik / Normal
            </span>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: "#DCFCE7",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#15803D",
              }}
            >
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: "#15803D", lineHeight: 1 }}>
              {totalNormal}
              <span style={{ fontSize: 13, fontWeight: 600, color: "#86EFAC", marginLeft: 4 }}>
                anak
              </span>
            </div>
            <div style={{ fontSize: 11.5, color: "#64748B", fontWeight: 600, marginTop: 6 }}>
              {totalDitimbang > 0 ? `${persenNormal}% dari balita terukur (Standar WHO)` : "Sesuai Standar Baku WHO"}
            </div>
          </div>
        </div>

        {/* Card 3: Waspada */}
        <div
          style={{
            background: "#FFFFFF",
            border: "1.5px solid #E2E8F0",
            borderRadius: 14,
            padding: "16px 18px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#B45309" }}>
              Risiko Gizi / Pemantauan Intensif
            </span>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: "#FEF3C7",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#D97706",
              }}
            >
              <AlertTriangle size={16} />
            </div>
          </div>
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: "#D97706", lineHeight: 1 }}>
              {totalWaspada}
              <span style={{ fontSize: 13, fontWeight: 600, color: "#FCD34D", marginLeft: 4 }}>
                anak
              </span>
            </div>
            <div style={{ fontSize: 11.5, color: "#64748B", fontWeight: 600, marginTop: 6 }}>
              {totalDitimbang > 0 ? `${persenWaspada}% (Indikasi BGM / Tidak Naik KBM)` : "Perlu Pendampingan Nutrisi"}
            </div>
          </div>
        </div>

        {/* Card 4: Rujukan */}
        <div
          style={{
            background: "#FFFFFF",
            border: "1.5px solid #E2E8F0",
            borderRadius: 14,
            padding: "16px 18px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#B91C1C" }}>
              Indikasi Rujukan Klinis
            </span>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: "#FEE2E2",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#DC2626",
              }}
            >
              <TrendingDown size={16} />
            </div>
          </div>
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: "#DC2626", lineHeight: 1 }}>
              {totalRujukan}
              <span style={{ fontSize: 13, fontWeight: 600, color: "#FCA5A5", marginLeft: 4 }}>
                anak
              </span>
            </div>
            <div
              style={{
                fontSize: 11.5,
                color: totalRujukan > 0 ? "#DC2626" : "#64748B",
                fontWeight: 700,
                marginTop: 6,
              }}
            >
              Prevalensi Rujukan / Stunting: {prevalensiStunting}%
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. ANALITIK STATUS GIZI & TREN PERTUMBUHAN (2 KOLOM)
          ───────────────────────────────────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
          gap: 16,
        }}
      >
        {/* Kolom A: Donut Proporsi Status Gizi */}
        <div
          style={{
            background: "#FFFFFF",
            border: "1.5px solid #E2E8F0",
            borderRadius: 14,
            padding: "20px 22px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <div>
              <div style={{ fontSize: 14.5, fontWeight: 800, color: "#0F172A" }}>
                Distribusi Status Antropometri WHO
              </div>
              <div style={{ fontSize: 12, color: "#64748B" }}>
                Klasifikasi baku WHO Child Growth Standards (PB/U, BB/U, BB/PB)
              </div>
            </div>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#16A34A",
                background: "#DCFCE7",
                padding: "2px 8px",
                borderRadius: 12,
              }}
            >
              {totalDitimbang} Balita Terukur
            </span>
          </div>

          {totalDitimbang === 0 ? (
            <div
              style={{
                flex: 1,
                minHeight: 180,
                background: "#F8FAFC",
                borderRadius: 12,
                border: "1px dashed #CBD5E1",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: 24,
                textAlign: "center",
                gap: 8,
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  background: "#F1F5F9",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#94A3B8",
                }}
              >
                <Activity size={22} />
              </div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: "#334155" }}>
                Belum Ada Penimbangan Bulan Ini
              </div>
              <div style={{ fontSize: 12, color: "#64748B", maxWidth: 280, lineHeight: 1.4 }}>
                Grafik proporsi normal, waspada, dan rujukan akan otomatis dihitung setelah kader
                mencatat data.
              </div>
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-around",
                gap: 16,
                flexWrap: "wrap",
                flex: 1,
              }}
            >
              {/* Donut Chart */}
              <div style={{ position: "relative", width: 130, height: 130, flexShrink: 0 }}>
                <svg
                  viewBox="0 0 160 160"
                  style={{ transform: "rotate(-90deg)", width: "100%", height: "100%" }}
                >
                  {pieSlices.map((item, idx) => {
                    const strokeDasharray = `${(item.percent / 100) * donutCircumference} ${donutCircumference}`;
                    const strokeDashoffset = -((item.offset / 100) * donutCircumference);

                    return (
                      <circle
                        key={item.label}
                        cx="80"
                        cy="80"
                        r={donutR}
                        fill="transparent"
                        stroke={item.color}
                        strokeWidth={hoveredSlice === idx ? 22 : 18}
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                        style={{ transition: "all 0.2s ease", cursor: "pointer" }}
                        onMouseEnter={() => setHoveredSlice(idx)}
                        onMouseLeave={() => setHoveredSlice(null)}
                      />
                    );
                  })}
                </svg>

                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    pointerEvents: "none",
                  }}
                >
                  <span style={{ fontSize: 24, fontWeight: 900, color: "#0F172A", lineHeight: 1 }}>
                    {totalDitimbang}
                  </span>
                  <span style={{ fontSize: 11, color: "#64748B", fontWeight: 700, marginTop: 2 }}>
                    Ditimbang
                  </span>
                </div>
              </div>

              {/* Legend List */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1, minWidth: 160 }}>
                {pieStatusData.map((item, idx) => (
                  <div
                    key={item.label}
                    onMouseEnter={() => setHoveredSlice(idx)}
                    onMouseLeave={() => setHoveredSlice(null)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "6px 10px",
                      borderRadius: 8,
                      background: hoveredSlice === idx ? "#F1F5F9" : "transparent",
                      transition: "background 0.15s ease",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span
                        style={{
                          width: 9,
                          height: 9,
                          borderRadius: "50%",
                          background: item.color,
                          flexShrink: 0,
                        }}
                      />
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#0F172A" }}>
                          {item.label}
                        </div>
                        <div style={{ fontSize: 10.5, color: "#64748B" }}>{item.keterangan}</div>
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: 11.5,
                        fontWeight: 800,
                        color: item.textColor,
                        background: item.bgBadge,
                        padding: "2px 7px",
                        borderRadius: 6,
                      }}
                    >
                      {item.count} ({item.percent}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Kolom B: Tren Penimbangan Bulanan */}
        <div
          style={{
            background: "#FFFFFF",
            border: "1.5px solid #E2E8F0",
            borderRadius: 14,
            padding: "20px 22px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <div>
              <div style={{ fontSize: 14.5, fontWeight: 800, color: "#0F172A" }}>
                Tren Pemantauan Bulanan & Beban Stunting
              </div>
              <div style={{ fontSize: 12, color: "#64748B" }}>
                Cakupan kehadiran timbang posyandu dan fluktuasi prevalensi kasus
              </div>
            </div>
          </div>

          {trenBulanan.length === 0 ? (
            <div
              style={{
                flex: 1,
                minHeight: 180,
                background: "#F8FAFC",
                borderRadius: 12,
                border: "1px dashed #CBD5E1",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: 24,
                textAlign: "center",
                gap: 8,
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  background: "#F1F5F9",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#94A3B8",
                }}
              >
                <TrendingUp size={22} />
              </div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: "#334155" }}>
                Riwayat Tren Belum Tersedia
              </div>
              <div style={{ fontSize: 12, color: "#64748B", maxWidth: 290, lineHeight: 1.4 }}>
                Grafik komparasi bulanan akan terbentuk otomatis setelah ada data penimbangan balita
                yang tersimpan.
              </div>
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
                flex: 1,
                justifyContent: "center",
              }}
            >
              {trenBulanan.map((t) => (
                <div key={t.bulan}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 12,
                      fontWeight: 700,
                      marginBottom: 4,
                    }}
                  >
                    <span style={{ color: "#334155" }}>{t.bulan}</span>
                    <span style={{ color: "#0F172A" }}>
                      {t.ditimbang} anak{" "}
                      <span style={{ color: t.stunting > 0 ? "#DC2626" : "#16A34A" }}>
                        ({t.prevalensi}% stunting)
                      </span>
                    </span>
                  </div>
                  <div
                    style={{
                      background: "#F1F5F9",
                      borderRadius: 99,
                      height: 10,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${Math.max(8, (t.ditimbang / (totalBalita || 1)) * 100)}%`,
                        background: "linear-gradient(90deg, #22C55E, #16A34A)",
                        height: "100%",
                        borderRadius: 99,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          6. SEBARAN WILAYAH & DAFTAR BALITA PRIORITAS (2 KOLOM KOKOH)
          ───────────────────────────────────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
          gap: 16,
          alignItems: "stretch",
        }}
      >
        {/* Kolom A: Pemetaan Wilayah & Profil Cakupan SKDN */}
        <div
          style={{
            background: "#FFFFFF",
            border: "1.5px solid #E2E8F0",
            borderRadius: 14,
            padding: "20px 22px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            minHeight: 440,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Header Card */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ fontSize: 14.5, fontWeight: 800, color: "#0F172A" }}>
                  Pemetaan Wilayah & Profil Sasaran
                </div>
                <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>
                  Cakupan penimbangan SKDN, stratifikasi risiko gizi, dan target sweeping
                </div>
              </div>
              <button
                type="button"
                onClick={() => onNavigate("peta")}
                style={{
                  background: "none",
                  border: "none",
                  color: "#16A34A",
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 3,
                }}
              >
                <span>Peta Distribusi</span>
                <ChevronRight size={13} />
              </button>
            </div>

            {/* 1. KINERJA INDIKATOR RESMI SKDN KEMENKES (4 Micro-KPIs) */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: 8,
              }}
            >
              {/* S */}
              <div
                style={{
                  background: "#F8FAFC",
                  border: "1px solid #E2E8F0",
                  borderRadius: 8,
                  padding: "8px 6px",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 9.5, fontWeight: 800, color: "#64748B", letterSpacing: "0.03em" }}>
                  SASARAN (S)
                </div>
                <div style={{ fontSize: 16, fontWeight: 900, color: "#0F172A", marginTop: 2 }}>
                  {totalBalita}
                </div>
                <div style={{ fontSize: 9.5, color: "#94A3B8" }}>Anak Terdaftar</div>
              </div>

              {/* K */}
              <div
                style={{
                  background: "#F8FAFC",
                  border: "1px solid #E2E8F0",
                  borderRadius: 8,
                  padding: "8px 6px",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 9.5, fontWeight: 800, color: "#0284C7", letterSpacing: "0.03em" }}>
                  BUKU KIA (K)
                </div>
                <div style={{ fontSize: 16, fontWeight: 900, color: "#0369A1", marginTop: 2 }}>
                  {totalBalita}
                </div>
                <div style={{ fontSize: 9.5, color: "#0284C7", fontWeight: 700 }}>100% KMS</div>
              </div>

              {/* D */}
              <div
                style={{
                  background: Number(persenDitimbang) >= 80 ? "#F0FDF4" : "#FEF3C7",
                  border: `1px solid ${Number(persenDitimbang) >= 80 ? "#DCFCE7" : "#FDE68A"}`,
                  borderRadius: 8,
                  padding: "8px 6px",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: 9.5,
                    fontWeight: 800,
                    color: Number(persenDitimbang) >= 80 ? "#15803D" : "#B45309",
                    letterSpacing: "0.03em",
                  }}
                >
                  DITIMBANG (D)
                </div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 900,
                    color: Number(persenDitimbang) >= 80 ? "#166534" : "#92400E",
                    marginTop: 2,
                  }}
                >
                  {totalDitimbang}
                </div>
                <div
                  style={{
                    fontSize: 9.5,
                    color: Number(persenDitimbang) >= 80 ? "#15803D" : "#B45309",
                    fontWeight: 700,
                  }}
                >
                  {persenDitimbang}% (D/S)
                </div>
              </div>

              {/* N */}
              <div
                style={{
                  background: "#F8FAFC",
                  border: "1px solid #E2E8F0",
                  borderRadius: 8,
                  padding: "8px 6px",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 9.5, fontWeight: 800, color: "#7C3AED", letterSpacing: "0.03em" }}>
                  NAIK BB (N)
                </div>
                <div style={{ fontSize: 16, fontWeight: 900, color: "#6D28D9", marginTop: 2 }}>
                  {totalNaik}
                </div>
                <div style={{ fontSize: 9.5, color: "#7C3AED", fontWeight: 700 }}>
                  {persenNaik}% (N/D)
                </div>
              </div>
            </div>

            {/* 2. DAFTAR DUSUN / BLOK BINAAN DENGAN METRIK DETAIL */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {sebaranWilayah.length === 0 ? (
                <div
                  style={{
                    padding: "20px 16px",
                    textAlign: "center",
                    background: "#F8FAFC",
                    borderRadius: 10,
                    border: "1px dashed #CBD5E1",
                  }}
                >
                  <MapPin size={22} color="#94A3B8" style={{ margin: "0 auto 6px" }} />
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: "#475569" }}>
                    Wilayah Tunggal Binaan Posyandu
                  </div>
                  <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>
                    Seluruh balita sasaran terdaftar di satu kesatuan unit posyandu ini.
                  </div>
                </div>
              ) : (
                sebaranWilayah.map((w) => (
                  <div
                    key={w.nama}
                    style={{
                      padding: "10px 14px",
                      background: "#F8FAFC",
                      border: "1px solid #F1F5F9",
                      borderRadius: 10,
                      display: "flex",
                      flexDirection: "column",
                      gap: 7,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <MapPin size={13} color="#16A34A" />
                        <span style={{ fontSize: 13, fontWeight: 800, color: "#0F172A" }}>{w.nama}</span>
                      </div>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 800,
                          padding: "2px 8px",
                          borderRadius: 6,
                          background:
                            w.zona === "prioritas"
                              ? "#FEE2E2"
                              : w.zona === "waspada"
                              ? "#FEF3C7"
                              : "#DCFCE7",
                          color:
                            w.zona === "prioritas"
                              ? "#B91C1C"
                              : w.zona === "waspada"
                              ? "#B45309"
                              : "#15803D",
                        }}
                      >
                        {w.zona === "prioritas"
                          ? "Prioritas Intervensi"
                          : w.zona === "waspada"
                          ? "Pemantauan Intensif"
                          : "Kondisi Terkendali"}
                      </span>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: 11.5,
                        color: "#475569",
                      }}
                    >
                      <span>
                        Kehadiran Timbang: <strong style={{ color: "#0F172A" }}>{w.ditimbang}/{w.total} Anak</strong> ({w.cakupan})
                      </span>
                      <span style={{ fontWeight: 700, color: w.stunting > 0 ? "#DC2626" : "#16A34A" }}>
                        {w.stunting} Rujukan ({w.prevalensi})
                      </span>
                    </div>

                    {/* Progress Bar Partisipasi Dusun */}
                    <div style={{ width: "100%", height: 5, background: "#E2E8F0", borderRadius: 99, overflow: "hidden" }}>
                      <div
                        style={{
                          width: `${Math.min(100, Math.max(5, parseFloat(w.cakupan) || 0))}%`,
                          height: "100%",
                          background: parseFloat(w.cakupan) >= 80 ? "#16A34A" : "#F59E0B",
                          borderRadius: 99,
                        }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* 3. STRATIFIKASI KELOMPOK USIA RENTAN DI WILAYAH */}
            <div
              style={{
                background: "#F8FAFC",
                border: "1px solid #E2E8F0",
                borderRadius: 10,
                padding: "10px 12px",
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                  Distribusi Usia Rentan
                </span>
                <span style={{ fontSize: 10.5, color: "#64748B" }}>
                  Total {totalBalita} Anak (L: {totalLaki} · P: {totalPerempuan})
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
                <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 6, padding: "6px 8px", textAlign: "center" }}>
                  <div style={{ fontSize: 10, color: "#64748B", fontWeight: 600 }}>0–5 Bulan</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#0F172A", marginTop: 1 }}>
                    {kelompokUsia.asiEksklusif} <span style={{ fontSize: 10, fontWeight: 500, color: "#94A3B8" }}>anak</span>
                  </div>
                  <div style={{ fontSize: 9.5, color: "#16A34A", fontWeight: 700 }}>ASI Eksklusif</div>
                </div>
                <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 6, padding: "6px 8px", textAlign: "center" }}>
                  <div style={{ fontSize: 10, color: "#64748B", fontWeight: 600 }}>6–23 Bulan</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#0F172A", marginTop: 1 }}>
                    {kelompokUsia.periodeEmas} <span style={{ fontSize: 10, fontWeight: 500, color: "#94A3B8" }}>anak</span>
                  </div>
                  <div style={{ fontSize: 9.5, color: "#D97706", fontWeight: 700 }}>1000 HPK (MP-ASI)</div>
                </div>
                <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 6, padding: "6px 8px", textAlign: "center" }}>
                  <div style={{ fontSize: 10, color: "#64748B", fontWeight: 600 }}>24–59 Bulan</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#0F172A", marginTop: 1 }}>
                    {kelompokUsia.praSekolah} <span style={{ fontSize: 10, fontWeight: 500, color: "#94A3B8" }}>anak</span>
                  </div>
                  <div style={{ fontSize: 9.5, color: "#64748B", fontWeight: 700 }}>Anak Balita</div>
                </div>
              </div>
            </div>
          </div>

          {/* 4. STATUS SWEEPING & TINDAK LANJUT KUNJUNGAN RUMAH */}
          <div
            style={{
              marginTop: 12,
              padding: "10px 12px",
              background: belumDitimbang > 0 ? "#FFFBEB" : "#F0FDF4",
              borderRadius: 10,
              border: `1px solid ${belumDitimbang > 0 ? "#FDE68A" : "#DCFCE7"}`,
              display: "flex",
              alignItems: "flex-start",
              gap: 9,
            }}
          >
            {belumDitimbang > 0 ? (
              <AlertTriangle size={15} color="#D97706" style={{ marginTop: 2, flexShrink: 0 }} />
            ) : (
              <CheckCircle2 size={15} color="#16A34A" style={{ marginTop: 2, flexShrink: 0 }} />
            )}
            <div style={{ fontSize: 11.5, lineHeight: 1.45 }}>
              {belumDitimbang > 0 ? (
                <>
                  <strong style={{ color: "#92400E" }}>Target Sweeping: {belumDitimbang} Balita Belum Hadir</strong>
                  <div style={{ color: "#B45309", marginTop: 2 }}>
                    Jadwalkan kunjungan rumah (door-to-door) bersama Bidan Desa agar cakupan penimbangan mencapai target nasional ≥80%.
                  </div>
                </>
              ) : (
                <>
                  <strong style={{ color: "#166534" }}>Cakupan Timbang Sempurna (100% Hadir)</strong>
                  <div style={{ color: "#15803D", marginTop: 2 }}>
                    Seluruh {totalBalita} balita sasaran di wilayah ini telah tercatat penimbangannya pada periode berjalan.
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Kolom B: Balita Butuh Perhatian Khusus */}
        <div
          style={{
            background: "#FFFFFF",
            border: "1.5px solid #E2E8F0",
            borderRadius: 14,
            padding: "20px 22px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            minHeight: 440,
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 14,
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 14.5, fontWeight: 800, color: "#0F172A" }}>
                    Balita Perlu Perhatian Medis
                  </span>
                  {balitaPerhatianList.length > 0 && (
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 800,
                        background: "#FEE2E2",
                        color: "#DC2626",
                        padding: "2px 8px",
                        borderRadius: 99,
                        border: "1px solid #FECACA",
                      }}
                    >
                      {balitaPerhatianList.length} Anak
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>
                  Prioritas rujukan bidan desa & tindak lanjut intervensi gizi
                </div>
              </div>
              <button
                type="button"
                onClick={() => onNavigate("riwayat")}
                style={{
                  background: "none",
                  border: "none",
                  color: "#16A34A",
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 3,
                }}
              >
                <span>Buka Riwayat</span>
                <ChevronRight size={13} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {balitaPerhatianList.length === 0 ? (
                <div
                  style={{
                    padding: "36px 16px",
                    textAlign: "center",
                    background: "#F8FAFC",
                    borderRadius: 10,
                    border: "1px dashed #CBD5E1",
                  }}
                >
                  <CheckCircle2 size={24} color="#16A34A" style={{ margin: "0 auto 8px" }} />
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>
                    {totalBalita === 0 ? "Belum Ada Data Balita Terdaftar" : "Seluruh Balita Tumbuh Sesuai Standar"}
                  </div>
                  <div
                    style={{
                      fontSize: 11.5,
                      color: "#64748B",
                      marginTop: 2,
                      maxWidth: 320,
                      margin: "2px auto 0",
                    }}
                  >
                    {totalBalita === 0
                      ? "Daftar balita yang perlu perhatian khusus akan muncul otomatis setelah penimbangan dicatat."
                      : "Tidak ditemukan balita terindikasi stunting berat, wasting akut, atau gizi buruk pada penimbangan terkini."}
                  </div>
                </div>
              ) : (
                paginatedBalitaPerhatian.map((b) => (
                  <div
                    key={b.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "10px 12px",
                      background: b.statusGizi === "rujukan" ? "#FEF2F2" : "#FFFBEB",
                      border: `1px solid ${b.statusGizi === "rujukan" ? "#FECACA" : "#FDE68A"}`,
                      borderRadius: 10,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: "50%",
                          background: b.statusGizi === "rujukan" ? "#FEE2E2" : "#FEF3C7",
                          color: b.statusGizi === "rujukan" ? "#DC2626" : "#D97706",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 800,
                          fontSize: 13,
                          flexShrink: 0,
                        }}
                      >
                        {b.nama.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: 13, fontWeight: 800, color: "#0F172A" }}>
                            {b.nama}
                          </span>
                          <span style={{ fontSize: 11, color: "#64748B" }}>
                            ({b.umurBulan} bln • {b.dusun || "-"})
                          </span>
                        </div>
                        <div
                          style={{
                            fontSize: 11.5,
                            fontWeight: 700,
                            color: b.statusGizi === "rujukan" ? "#B91C1C" : "#B45309",
                            marginTop: 1,
                          }}
                        >
                          {b.labelStatus}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (onBukaGrafikBalita) onBukaGrafikBalita(b.id);
                        else onNavigate("grafik");
                      }}
                      style={{
                        background: "#FFFFFF",
                        border: "1px solid #CBD5E1",
                        borderRadius: 7,
                        padding: "5px 10px",
                        fontSize: 11.5,
                        fontWeight: 700,
                        color: "#0F172A",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        whiteSpace: "nowrap",
                      }}
                    >
                      <span>Lihat KMS</span>
                      <ArrowRight size={11} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Kontrol Navigasi Pagination atau Info Sinkronisasi */}
          {totalPagesPerhatian > 1 ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                paddingTop: 12,
                marginTop: 16,
                borderTop: "1px solid #F1F5F9",
                flexWrap: "wrap",
                gap: 8,
              }}
            >
              <span style={{ fontSize: 11.5, color: "#64748B", fontWeight: 600 }}>
                Menampilkan {(currentPagePerhatian - 1) * ITEMS_PER_PAGE_PERHATIAN + 1}–{Math.min(currentPagePerhatian * ITEMS_PER_PAGE_PERHATIAN, balitaPerhatianList.length)} dari {balitaPerhatianList.length} anak
              </span>

              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <button
                  type="button"
                  disabled={currentPagePerhatian <= 1}
                  onClick={() => setPagePerhatian((prev) => Math.max(1, prev - 1))}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    border: "1px solid #CBD5E1",
                    background: currentPagePerhatian <= 1 ? "#F8FAFC" : "#FFFFFF",
                    color: currentPagePerhatian <= 1 ? "#94A3B8" : "#0F172A",
                    cursor: currentPagePerhatian <= 1 ? "not-allowed" : "pointer",
                    transition: "all 0.15s ease",
                  }}
                  title="Halaman Sebelumnya"
                >
                  <ChevronLeft size={14} />
                </button>

                {totalPagesPerhatian <= 5 ? (
                  <div style={{ display: "flex", gap: 4 }}>
                    {Array.from({ length: totalPagesPerhatian }, (_, i) => i + 1).map((pg) => {
                      const isActive = pg === currentPagePerhatian;
                      return (
                        <button
                          key={pg}
                          type="button"
                          onClick={() => setPagePerhatian(pg)}
                          style={{
                            minWidth: 28,
                            height: 28,
                            padding: "0 6px",
                            borderRadius: 6,
                            fontSize: 11.5,
                            fontWeight: 700,
                            border: isActive ? "1px solid #16A34A" : "1px solid #E2E8F0",
                            background: isActive ? "#16A34A" : "#FFFFFF",
                            color: isActive ? "#FFFFFF" : "#475569",
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                          }}
                        >
                          {pg}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: "#334155", padding: "0 6px" }}>
                    {currentPagePerhatian} / {totalPagesPerhatian}
                  </span>
                )}

                <button
                  type="button"
                  disabled={currentPagePerhatian >= totalPagesPerhatian}
                  onClick={() => setPagePerhatian((prev) => Math.min(totalPagesPerhatian, prev + 1))}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    border: "1px solid #CBD5E1",
                    background: currentPagePerhatian >= totalPagesPerhatian ? "#F8FAFC" : "#FFFFFF",
                    color: currentPagePerhatian >= totalPagesPerhatian ? "#94A3B8" : "#0F172A",
                    cursor: currentPagePerhatian >= totalPagesPerhatian ? "not-allowed" : "pointer",
                    transition: "all 0.15s ease",
                  }}
                  title="Halaman Berikutnya"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          ) : balitaPerhatianList.length > 0 ? (
            <div
              style={{
                paddingTop: 10,
                marginTop: 16,
                borderTop: "1px solid #F1F5F9",
                fontSize: 11.5,
                color: "#64748B",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span>Status data terverifikasi sesuai register antropometri terkini.</span>
              <span style={{ fontWeight: 700, color: "#16A34A" }}>1 Halaman</span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
