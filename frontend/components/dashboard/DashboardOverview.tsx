"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Baby, TrendingDown, Users, ChevronRight, FileText,
  MapPin, CheckCircle2, AlertTriangle, XCircle, ArrowUpRight,
  TrendingUp, Activity, Plus, Building2
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

  const prevalensiStunting = totalDitimbang > 0 ? ((totalRujukan / totalDitimbang) * 100).toFixed(1) : "0.0";
  const persenDitimbang = totalBalita > 0 ? ((totalDitimbang / totalBalita) * 100).toFixed(1) : "0.0";
  const persenNormal = totalDitimbang > 0 ? ((totalNormal / totalDitimbang) * 100).toFixed(1) : "0.0";
  const persenWaspada = totalDitimbang > 0 ? ((totalWaspada / totalDitimbang) * 100).toFixed(1) : "0.0";
  const balitaPerhatianList = list.filter((b) => b.statusGizi !== "normal");

  const [hoveredSlice, setHoveredSlice] = useState<number | null>(null);
  const [currentMonthName, setCurrentMonthName] = useState("Oktober 2026");

  useEffect(() => {
    try {
      const formatted = new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(new Date());
      setCurrentMonthName(formatted);
    } catch {
      // fallback
    }
  }, []);

  // 1. DATA STATUS GIZI 100% DINAMIS DARI DATABASE
  const pieStatusData = useMemo(() => {
    if (totalDitimbang === 0) return [];
    return [
      {
        label: "Tumbuh Normal",
        count: totalNormal,
        percent: Number(((totalNormal / totalDitimbang) * 100).toFixed(1)),
        color: "#16A34A",
      },
      {
        label: "Waspada Gizi",
        count: totalWaspada,
        percent: Number(((totalWaspada / totalDitimbang) * 100).toFixed(1)),
        color: "#F59E0B",
      },
      {
        label: "Perlu Perhatian Bidan",
        count: totalRujukan,
        percent: Number(((totalRujukan / totalDitimbang) * 100).toFixed(1)),
        color: "#EF4444",
      },
    ];
  }, [totalDitimbang, totalNormal, totalWaspada, totalRujukan]);

  // Donut SVG parameters
  const donutR = 56;
  const donutCircumference = 2 * Math.PI * donutR;
  const pieSlices = useMemo(() => {
    return pieStatusData.reduce((acc, item) => {
      const prevOffset = acc.length > 0 ? acc[acc.length - 1].offset + acc[acc.length - 1].percent : 0;
      acc.push({ ...item, offset: prevOffset });
      return acc;
    }, [] as Array<(typeof pieStatusData)[number] & { offset: number }>);
  }, [pieStatusData]);

  // 2. SEBARAN WILAYAH/DUSUN 100% DINAMIS DARI ALAMAT BALITA
  const sebaranWilayah = useMemo(() => {
    if (list.length === 0) return [];
    const map = new Map<string, { nama: string; total: number; ditimbang: number; stunting: number }>();

    for (const b of list) {
      const wilayahKey = (b.dusun && b.dusun.trim()) || "Wilayah Posyandu";
      const existing = map.get(wilayahKey) || { nama: wilayahKey, total: 0, ditimbang: 0, stunting: 0 };
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

  // 3. TREN PENIMBANGAN DINAMIS DARI RIWAYAT ASLI
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
        if (r.statusPbu === "pendek" || r.statusPbu === "sangat_pendek" || r.statusBbpb === "sangat_kurus") {
          monthCounts[key].stunting += 1;
        }
      });
    });

    return Object.entries(monthCounts).map(([bulan, stat]) => ({
      bulan,
      ditimbang: stat.ditimbang,
      stunting: stat.stunting,
      prevalensi: stat.ditimbang > 0 ? Number(((stat.stunting / stat.ditimbang) * 100).toFixed(1)) : 0,
    }));
  }, [list]);

  const activePosyanduName = activePosyandu?.nama || (posyanduList[0]?.nama ?? "Posyandu Desa");
  const activeDesaName = activePosyandu?.desa || (posyanduList[0]?.desa ?? "Sukamaju");

  return (
    <div style={{ maxWidth: 1140, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20, paddingBottom: 30 }}>
      {/* ── 1. HEADER RINGKAS & TOMBOL AKSI ── */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 12,
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <span style={{ fontSize: 13, color: "#16A34A", fontWeight: 800 }}>
              {activePosyanduName.toUpperCase()} • DESA {activeDesaName.toUpperCase()}
            </span>
            <span style={{ color: "#CBD5E1" }}>•</span>
            <span style={{ fontSize: 13, color: "#64748B", fontWeight: 600 }}>{currentMonthName}</span>
            <button
              type="button"
              onClick={() => onNavigate("posyandu")}
              style={{
                background: "none",
                border: "none",
                color: "#16A34A",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                padding: "2px 6px",
                borderRadius: 4,
                display: "inline-flex",
                alignItems: "center",
                gap: 2,
              }}
            >
              (Ganti / Kelola Posyandu <ChevronRight size={13} />)
            </button>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: "#0F172A", margin: "3px 0 0 0", letterSpacing: "-0.01em" }}>
            Ringkasan Pemantauan Stunting & Pertumbuhan Balita
          </h1>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => onNavigate("posyandu")}
            style={{
              background: "#FFFFFF",
              color: "#334155",
              border: "1.5px solid #CBD5E1",
              borderRadius: 10,
              padding: "9px 14px",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Building2 size={16} /> Kelola Posyandu
          </button>
          <button
            type="button"
            onClick={() => onNavigate("input")}
            style={{
              background: "#16A34A",
              color: "#FFFFFF",
              border: "none",
              borderRadius: 10,
              padding: "9px 18px",
              fontSize: 13,
              fontWeight: 800,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              boxShadow: "0 2px 6px rgba(22, 163, 74, 0.25)",
            }}
          >
            <Baby size={16} /> + Catat Penimbangan
          </button>
        </div>
      </div>

      {/* ── 2. METRIK RINGKASAN: REAL DARI DATABASE ── */}
      <div style={{
        background: "#FFFFFF",
        border: "1.5px solid #E2E8F0",
        borderRadius: 14,
        padding: "16px 20px",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: 16,
      }}>
        {/* Total Sasaran */}
        <div>
          <div style={{ fontSize: 12, color: "#64748B", fontWeight: 700 }}>Total Balita Terdaftar</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: "#0F172A", lineHeight: 1.15, marginTop: 4 }}>
            {totalBalita} <span style={{ fontSize: 14, fontWeight: 600, color: "#64748B" }}>anak</span>
          </div>
          <div style={{ fontSize: 11, color: "#16A34A", fontWeight: 700, marginTop: 4 }}>
            {totalDitimbang} ditimbang ({persenDitimbang}%)
          </div>
        </div>

        {/* Normal */}
        <div style={{ borderLeft: "1px solid #F1F5F9", paddingLeft: 16 }}>
          <div style={{ fontSize: 12, color: "#15803D", fontWeight: 800 }}>● Tumbuh Normal</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: "#15803D", lineHeight: 1.15, marginTop: 4 }}>
            {totalNormal} <span style={{ fontSize: 14, fontWeight: 600, color: "#64748B" }}>anak</span>
          </div>
          <div style={{ fontSize: 11, color: "#64748B", fontWeight: 600, marginTop: 4 }}>
            {totalDitimbang > 0 ? `${persenNormal}% dari yang ditimbang` : "Belum ada penimbangan"}
          </div>
        </div>

        {/* Waspada */}
        <div style={{ borderLeft: "1px solid #F1F5F9", paddingLeft: 16 }}>
          <div style={{ fontSize: 12, color: "#D97706", fontWeight: 800 }}>▲ Waspada Gizi</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: "#D97706", lineHeight: 1.15, marginTop: 4 }}>
            {totalWaspada} <span style={{ fontSize: 14, fontWeight: 600, color: "#64748B" }}>anak</span>
          </div>
          <div style={{ fontSize: 11, color: "#64748B", fontWeight: 600, marginTop: 4 }}>
            {totalDitimbang > 0 ? `${persenWaspada}% (perlu PMT)` : "Gizi Kurang / Garis Kuning"}
          </div>
        </div>

        {/* Rujukan / Stunting */}
        <div style={{ borderLeft: "1px solid #F1F5F9", paddingLeft: 16 }}>
          <div style={{ fontSize: 12, color: "#DC2626", fontWeight: 800 }}>■ Perhatian Khusus Bidan</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: "#DC2626", lineHeight: 1.15, marginTop: 4 }}>
            {totalRujukan} <span style={{ fontSize: 14, fontWeight: 600, color: "#64748B" }}>anak</span>
          </div>
          <div style={{ fontSize: 11, color: "#DC2626", fontWeight: 700, marginTop: 4 }}>
            Prevalensi: {prevalensiStunting}%
          </div>
        </div>
      </div>

      {/* ── 3. DUA GRAFIK UTAMA: TREN & PROPORSI DONUT (100% REAL DATABASE) ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
        gap: 16,
      }}>
        {/* A. GRAFIK TREN PENIMBANGAN */}
        <div style={{
          background: "#FFFFFF",
          border: "1.5px solid #E2E8F0",
          borderRadius: 14,
          padding: 18,
          display: "flex",
          flexDirection: "column",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div>
              <span style={{ fontSize: 14, fontWeight: 800, color: "#0F172A" }}>
                Tren Penimbangan & Prevalensi Stunting
              </span>
              <div style={{ fontSize: 12, color: "#64748B" }}>
                Berdasarkan riwayat penimbangan database Supabase
              </div>
            </div>
            <span style={{ fontSize: 11, color: "#94A3B8", fontWeight: 700 }}>Real-time</span>
          </div>

          {trenBulanan.length === 0 ? (
            <div style={{
              flex: 1,
              minHeight: 160,
              background: "#F8FAFC",
              borderRadius: 10,
              border: "1px dashed #CBD5E1",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: 20,
              textAlign: "center",
              gap: 8,
            }}>
              <TrendingUp size={28} color="#94A3B8" />
              <div style={{ fontSize: 13, fontWeight: 700, color: "#334155" }}>
                Belum Ada Riwayat Penimbangan
              </div>
              <div style={{ fontSize: 12, color: "#64748B", maxWidth: 320 }}>
                Grafik tren bulanan akan otomatis terbentuk setelah Anda mencatat penimbangan balita.
              </div>
              <button
                type="button"
                onClick={() => onNavigate("input")}
                style={{
                  marginTop: 4,
                  background: "#16A34A",
                  color: "white",
                  border: "none",
                  borderRadius: 6,
                  padding: "6px 12px",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                + Catat Penimbangan Pertama
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1, justifyContent: "center" }}>
              {trenBulanan.map((t) => (
                <div key={t.bulan} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ width: 60, fontSize: 12, fontWeight: 700, color: "#475569" }}>{t.bulan}</span>
                  <div style={{ flex: 1, background: "#F1F5F9", borderRadius: 99, height: 16, overflow: "hidden", display: "flex" }}>
                    <div
                      style={{
                        width: `${Math.max(5, (t.ditimbang / (totalBalita || 1)) * 100)}%`,
                        background: "#16A34A",
                        height: "100%",
                        borderRadius: 99,
                      }}
                    />
                  </div>
                  <span style={{ width: 110, fontSize: 12, fontWeight: 800, color: "#0F172A", textAlign: "right" }}>
                    {t.ditimbang} anak ({t.prevalensi}% stunting)
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* B. PROPORSI STATUS GIZI (DONUT REAL) */}
        <div style={{
          background: "#FFFFFF",
          border: "1.5px solid #E2E8F0",
          borderRadius: 14,
          padding: 18,
          display: "flex",
          flexDirection: "column",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div>
              <span style={{ fontSize: 14, fontWeight: 800, color: "#0F172A" }}>
                Proporsi Status Gizi ({totalDitimbang} Balita Ditimbang)
              </span>
              <div style={{ fontSize: 12, color: "#64748B" }}>
                Standar Baku Pertumbuhan WHO 2006
              </div>
            </div>
          </div>

          {totalDitimbang === 0 ? (
            <div style={{
              flex: 1,
              minHeight: 160,
              background: "#F8FAFC",
              borderRadius: 10,
              border: "1px dashed #CBD5E1",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: 20,
              textAlign: "center",
              gap: 8,
            }}>
              <Activity size={28} color="#94A3B8" />
              <div style={{ fontSize: 13, fontWeight: 700, color: "#334155" }}>
                0 Balita Ditimbang
              </div>
              <div style={{ fontSize: 12, color: "#64748B", maxWidth: 300 }}>
                Data persentase status gizi normal, waspada, dan rujukan akan tampil di sini setelah data disimpan.
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-around", flex: 1, gap: 14, flexWrap: "wrap" }}>
              {/* Donut SVG */}
              <div style={{ position: "relative", width: 130, height: 130, flexShrink: 0 }}>
                <svg viewBox="0 0 160 160" style={{ transform: "rotate(-90deg)", width: "100%", height: "100%" }}>
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

                {/* Teks Tengah Donut */}
                <div style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  pointerEvents: "none",
                }}>
                  <span style={{ fontSize: 22, fontWeight: 900, color: "#0F172A", lineHeight: 1 }}>
                    {totalDitimbang}
                  </span>
                  <span style={{ fontSize: 11, color: "#64748B", fontWeight: 700, marginTop: 2 }}>
                    Ditimbang
                  </span>
                </div>
              </div>

              {/* Legenda Donut */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {pieStatusData.map((item, idx) => (
                  <div
                    key={item.label}
                    onMouseEnter={() => setHoveredSlice(idx)}
                    onMouseLeave={() => setHoveredSlice(null)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      cursor: "pointer",
                      padding: "4px 8px",
                      borderRadius: 6,
                      background: hoveredSlice === idx ? "#F1F5F9" : "transparent",
                    }}
                  >
                    <span style={{ width: 10, height: 10, borderRadius: "50%", background: item.color, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#0F172A" }}>{item.label}</div>
                      <div style={{ fontSize: 12, color: "#64748B" }}>
                        <strong>{item.count}</strong> anak ({item.percent}%)
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── 4. DUA BLOK: SEBARAN WILAYAH & BALITA PRIORITAS (REAL DATABASE) ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
        gap: 16,
      }}>
        {/* A. TABEL SEBARAN WILAYAH */}
        <div style={{
          background: "#FFFFFF",
          border: "1.5px solid #E2E8F0",
          borderRadius: 14,
          padding: 18,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: "#0F172A" }}>
              Sebaran Wilayah / Dusun Balita
            </span>
            <button
              type="button"
              onClick={() => onNavigate("peta")}
              style={{
                background: "none", border: "none", color: "#16A34A",
                fontSize: 12, fontWeight: 800, cursor: "pointer",
                display: "inline-flex", alignItems: "center", gap: 2,
              }}
            >
              Buka Peta <ChevronRight size={13} />
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {sebaranWilayah.length === 0 ? (
              <div style={{ padding: "20px 12px", textAlign: "center", background: "#F8FAFC", borderRadius: 8 }}>
                <span style={{ fontSize: 13, color: "#64748B", fontWeight: 600 }}>
                  Belum ada data wilayah balita di database.
                </span>
              </div>
            ) : (
              sebaranWilayah.map((w) => (
                <div
                  key={w.nama}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "8px 12px",
                    background: "#F8FAFC",
                    borderRadius: 8,
                  }}
                >
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 800, color: "#0F172A" }}>{w.nama}</span>
                    <span style={{ fontSize: 12, color: "#64748B", marginLeft: 6 }}>
                      ({w.ditimbang}/{w.total} anak)
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{
                      fontSize: 12, fontWeight: 800,
                      color: w.zona === "prioritas" ? "#DC2626" : w.zona === "waspada" ? "#D97706" : "#16A34A",
                    }}>
                      {w.stunting} rujukan ({w.prevalensi})
                    </span>
                    <span style={{
                      fontSize: 10, fontWeight: 800, padding: "2px 6px", borderRadius: 4,
                      background: w.zona === "prioritas" ? "#FEE2E2" : w.zona === "waspada" ? "#FEF3C7" : "#DCFCE7",
                      color: w.zona === "prioritas" ? "#B91C1C" : w.zona === "waspada" ? "#B45309" : "#15803D",
                    }}>
                      {w.zona === "prioritas" ? "Prioritas" : w.zona === "waspada" ? "Waspada" : "Aman"}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* B. DAFTAR BALITA PRIORITAS TINDAK LANJUT */}
        <div style={{
          background: "#FFFFFF",
          border: "1.5px solid #E2E8F0",
          borderRadius: 14,
          padding: 18,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: "#0F172A" }}>
              Balita Butuh Perhatian Khusus
            </span>
            <button
              type="button"
              onClick={() => onNavigate("riwayat")}
              style={{
                background: "none", border: "none", color: "#16A34A",
                fontSize: 12, fontWeight: 800, cursor: "pointer",
                display: "inline-flex", alignItems: "center", gap: 2,
              }}
            >
              Lihat Riwayat <ChevronRight size={13} />
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {balitaPerhatianList.length === 0 ? (
              <div style={{ padding: "20px 12px", textAlign: "center", background: "#F8FAFC", borderRadius: 8 }}>
                <span style={{ fontSize: 13, color: totalBalita === 0 ? "#64748B" : "#15803D", fontWeight: 700 }}>
                  {totalBalita === 0
                    ? "Belum ada data balita di database Supabase."
                    : "🎉 Semua balita dalam kondisi gizi baik (normal)."}
                </span>
              </div>
            ) : (
              balitaPerhatianList.map((b) => (
                <div
                  key={b.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "8px 12px",
                    background: b.statusGizi === "rujukan" ? "#FEF2F2" : "#FFFBEB",
                    border: `1px solid ${b.statusGizi === "rujukan" ? "#FECACA" : "#FDE68A"}`,
                    borderRadius: 8,
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: "#0F172A" }}>{b.nama}</span>
                      <span style={{ fontSize: 11, color: "#64748B" }}>
                        ({b.umurBulan} bln • {b.dusun || "Posyandu"})
                      </span>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: b.statusGizi === "rujukan" ? "#B91C1C" : "#B45309" }}>
                      {b.labelStatus}
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
                      borderRadius: 6,
                      padding: "4px 8px",
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#0F172A",
                      cursor: "pointer",
                    }}
                  >
                    KMS →
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
