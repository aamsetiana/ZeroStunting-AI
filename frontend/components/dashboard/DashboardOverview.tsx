"use client";

import { useState, useMemo, useSyncExternalStore } from "react";
import {
  TrendingDown,
  Users,
  ChevronRight,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Activity,
  Plus,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Stethoscope,
  HeartHandshake,
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
  posyanduList = [],
  activePosyandu,
  onNavigate,
  onBukaGrafikBalita,
}: DashboardOverviewProps) {
  const list = balitaList ?? [];
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

  // 1. DATA STATUS GIZI 100% DINAMIS
  const pieStatusData = useMemo(() => {
    if (totalDitimbang === 0) return [];
    return [
      {
        label: "Tumbuh Normal",
        keterangan: "Sesuai Standar Deviasi WHO",
        count: totalNormal,
        percent: Number(((totalNormal / totalDitimbang) * 100).toFixed(1)),
        color: "#16A34A",
        bgBadge: "#DCFCE7",
        textColor: "#15803D",
      },
      {
        label: "Waspada Gizi",
        keterangan: "Garis Kuning / Perlu PMT",
        count: totalWaspada,
        percent: Number(((totalWaspada / totalDitimbang) * 100).toFixed(1)),
        color: "#F59E0B",
        bgBadge: "#FEF3C7",
        textColor: "#B45309",
      },
      {
        label: "Perhatian Khusus Bidan",
        keterangan: "Indikasi Stunting / Rujukan",
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
      const zona = Number(prev) > 10 ? "prioritas" : Number(prev) > 0 ? "waspada" : "aman";
      return { ...w, prevalensi: `${prev}%`, zona };
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

  const activePosyanduName = activePosyandu?.nama || posyanduList[0]?.nama || "Posyandu";
  const activeDesaName = activePosyandu?.desa || posyanduList[0]?.desa || "Wilayah Kerja";

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
          {/* Posyandu Pill Tag */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "4px 10px",
              borderRadius: 20,
              background: "#F0FDF4",
              border: "1px solid #DCFCE7",
              marginBottom: 8,
            }}
          >
            <div
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "#16A34A",
              }}
            />
            <span style={{ fontSize: 12, fontWeight: 700, color: "#15803D" }}>
              {activePosyanduName}
            </span>
            <span style={{ color: "#CBD5E1", fontSize: 12 }}>•</span>
            <span style={{ fontSize: 12, color: "#64748B", fontWeight: 600 }}>
              Desa {activeDesaName}
            </span>
          </div>

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
            Dashboard Pemantauan Balita
          </h1>
          <p
            style={{
              fontSize: 13,
              color: "#64748B",
              margin: "4px 0 0 0",
              fontWeight: 500,
            }}
          >
            Monitoring tumbuh kembang balita berbasis Baku WHO 2006 · Periode {currentMonthName}
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => onNavigate("input")}
            style={{
              background: "linear-gradient(135deg, #22C55E 0%, #16A34A 100%)",
              color: "#FFFFFF",
              border: "none",
              borderRadius: 10,
              padding: "10px 18px",
              fontSize: 13.5,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 7,
              boxShadow: "0 4px 12px rgba(22, 163, 74, 0.25)",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = "0 6px 16px rgba(22, 163, 74, 0.35)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(22, 163, 74, 0.25)";
            }}
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>Catat Penimbangan</span>
          </button>
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
              Total Balita Terdaftar
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
              {totalDitimbang} ditimbang ({persenDitimbang}%)
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
              Tumbuh Normal (Gizi Baik)
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
              {totalDitimbang > 0 ? `${persenNormal}% dari yang ditimbang` : "Standar Baku WHO"}
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
              Waspada Gizi (Perlu PMT)
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
              {totalDitimbang > 0 ? `${persenWaspada}% (Garis Kuning)` : "Perlu Pendampingan"}
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
              Perlu Rujukan Bidan
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
              Prevalensi Stunting: {prevalensiStunting}%
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
                Proporsi Status Gizi
              </div>
              <div style={{ fontSize: 12, color: "#64748B" }}>
                Klasifikasi antropometri WHO Child Growth 2006
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
              {totalDitimbang} Balita
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
                Tren Penimbangan & Prevalensi
              </div>
              <div style={{ fontSize: 12, color: "#64748B" }}>
                Histori kepatuhan timbang posyandu per bulan
              </div>
            </div>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#64748B",
                background: "#F1F5F9",
                padding: "2px 8px",
                borderRadius: 12,
              }}
            >
              Historis
            </span>
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
          6. SEBARAN WILAYAH & DAFTAR BALITA PRIORITAS (2 KOLOM)
          ───────────────────────────────────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
          gap: 16,
        }}
      >
        {/* Kolom A: Sebaran Wilayah / Dusun */}
        <div
          style={{
            background: "#FFFFFF",
            border: "1.5px solid #E2E8F0",
            borderRadius: 14,
            padding: "20px 22px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 14,
            }}
          >
            <div>
              <div style={{ fontSize: 14.5, fontWeight: 800, color: "#0F172A" }}>
                Sebaran Wilayah / Dusun
              </div>
              <div style={{ fontSize: 12, color: "#64748B" }}>
                Cakupan posyandu berdasarkan alamat balita
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
              <span>Buka Peta</span>
              <ChevronRight size={13} />
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {sebaranWilayah.length === 0 ? (
              <div
                style={{
                  padding: "24px 16px",
                  textAlign: "center",
                  background: "#F8FAFC",
                  borderRadius: 10,
                  border: "1px dashed #CBD5E1",
                }}
              >
                <MapPin size={22} color="#94A3B8" style={{ margin: "0 auto 6px" }} />
                <div style={{ fontSize: 12.5, fontWeight: 700, color: "#475569" }}>
                  Belum Ada Data Wilayah
                </div>
                <div style={{ fontSize: 11.5, color: "#64748B", marginTop: 2 }}>
                  Wilayah/dusun akan terisi otomatis dari data balita yang dicatat.
                </div>
              </div>
            ) : (
              sebaranWilayah.map((w) => (
                <div
                  key={w.nama}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 12px",
                    background: "#F8FAFC",
                    border: "1px solid #F1F5F9",
                    borderRadius: 10,
                  }}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "#0F172A" }}>{w.nama}</div>
                    <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>
                      {w.ditimbang} dari {w.total} balita ditimbang
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 800,
                        color:
                          w.zona === "prioritas"
                            ? "#DC2626"
                            : w.zona === "waspada"
                            ? "#D97706"
                            : "#16A34A",
                      }}
                    >
                      {w.stunting} rujukan ({w.prevalensi})
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 800,
                        padding: "2px 7px",
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
                      {w.zona === "prioritas" ? "Prioritas" : w.zona === "waspada" ? "Waspada" : "Aman"}
                    </span>
                  </div>
                </div>
              ))
            )}
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
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 14,
            }}
          >
            <div>
              <div style={{ fontSize: 14.5, fontWeight: 800, color: "#0F172A" }}>
                Balita Perlu Perhatian Medis
              </div>
              <div style={{ fontSize: 12, color: "#64748B" }}>
                Kategori gizi kurang & prioritas rujukan bidan
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
              <span>Riwayat</span>
              <ChevronRight size={13} />
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {balitaPerhatianList.length === 0 ? (
              <div
                style={{
                  padding: "24px 16px",
                  textAlign: "center",
                  background: "#F8FAFC",
                  borderRadius: 10,
                  border: "1px dashed #CBD5E1",
                }}
              >
                <CheckCircle2 size={22} color="#16A34A" style={{ margin: "0 auto 6px" }} />
                <div style={{ fontSize: 12.5, fontWeight: 700, color: "#0F172A" }}>
                  {totalBalita === 0 ? "Belum Ada Data Balita" : "Semua Balita Tumbuh Baik"}
                </div>
                <div style={{ fontSize: 11.5, color: "#64748B", marginTop: 2 }}>
                  {totalBalita === 0
                    ? "Daftar balita yang perlu perhatian khusus akan muncul di sini."
                    : "Tidak ada balita terindikasi stunting atau gizi buruk saat ini."}
                </div>
              </div>
            ) : (
              balitaPerhatianList.map((b) => (
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
                    <span>KMS</span>
                    <ArrowRight size={11} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
