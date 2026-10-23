"use client";

import { useState } from "react";
import {
  Baby, TrendingDown, Users, ChevronRight, FileText,
  MapPin, CheckCircle2, AlertTriangle, XCircle, ArrowUpRight
} from "lucide-react";

interface DashboardOverviewProps {
  onNavigate: (pageId: string) => void;
  onBukaGrafikBalita?: (id: string) => void;
}

// Data Tren Bulanan (6 Bulan)
const DATA_TREN = [
  { bulan: "Mei", ditimbang: 195, stunting: 16, prevalensi: 8.2 },
  { bulan: "Jun", ditimbang: 202, stunting: 15, prevalensi: 7.4 },
  { bulan: "Jul", ditimbang: 208, stunting: 14, prevalensi: 6.7 },
  { bulan: "Ags", ditimbang: 212, stunting: 13, prevalensi: 6.1 },
  { bulan: "Sep", ditimbang: 210, stunting: 13, prevalensi: 6.2 },
  { bulan: "Okt", ditimbang: 215, stunting: 12, prevalensi: 5.6 },
];

// Data Distribusi Status Gizi untuk Pie / Donut Chart
const DATA_PIE_STATUS = [
  { label: "Tumbuh Normal", count: 203, percent: 94.4, color: "#16A34A" },
  { label: "Waspada / Pendek", count: 9, percent: 4.2, color: "#F59E0B" },
  { label: "Perlu Rujukan Bidan", count: 3, percent: 1.4, color: "#EF4444" },
];

// Data Sebaran Dusun
const DATA_DUSUN = [
  { nama: "Dusun Krajan", ditimbang: 56, sasaran: 58, stunting: 6, prevalensi: "10.7%", zona: "prioritas" },
  { nama: "Dusun Sukamaju", ditimbang: 44, sasaran: 46, stunting: 3, prevalensi: "6.8%", zona: "waspada" },
  { nama: "Dusun Tanjungsari", ditimbang: 38, sasaran: 40, stunting: 2, prevalensi: "5.3%", zona: "waspada" },
  { nama: "Dusun Mekarsari", ditimbang: 51, sasaran: 52, stunting: 1, prevalensi: "1.9%", zona: "aman" },
];

// Balita Perlu Perhatian
const BALITA_PERHATIAN = [
  { id: "B-007", nama: "Rizky Ramadhan", dusun: "Krajan", umur: "31 bln", status: "Sangat Pendek", level: "danger" },
  { id: "B-004", nama: "Alisya Putri", dusun: "Sukamaju", umur: "22 bln", status: "Pendek (-2.4 SD)", level: "warning" },
  { id: "B-003", nama: "Daffa Pratama", dusun: "Krajan", umur: "14 bln", status: "BB Tidak Naik (T)", level: "warning" },
  { id: "B-002", nama: "Siti Nurhaliza", dusun: "Tanjungsari", umur: "18 bln", status: "Garis Kuning KMS", level: "warning" },
];

export function DashboardOverview({ onNavigate, onBukaGrafikBalita }: DashboardOverviewProps) {
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  const [hoveredSlice, setHoveredSlice] = useState<number | null>(null);

  // Perhitungan SVG Garis Tren
  const chartW = 540;
  const chartH = 180;
  const padX = 35;
  const padY = 25;
  const pWidth = chartW - padX * 2;
  const pHeight = chartH - padY * 2;
  const minVal = 4;
  const maxVal = 10;

  const points = DATA_TREN.map((d, i) => {
    const x = padX + (i / (DATA_TREN.length - 1)) * pWidth;
    const y = padY + pHeight - ((d.prevalensi - minVal) / (maxVal - minVal)) * pHeight;
    return { x, y, ...d };
  });

  const lineD = points.reduce((acc, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`), "");
  const areaD = `${lineD} L ${points[points.length - 1].x} ${padY + pHeight} L ${points[0].x} ${padY + pHeight} Z`;

  // Perhitungan SVG Donut Chart
  const donutR = 58;
  const donutCircumference = 2 * Math.PI * donutR;
  const pieSlices = DATA_PIE_STATUS.reduce((acc, item) => {
    const prevOffset = acc.length > 0 ? acc[acc.length - 1].offset + acc[acc.length - 1].percent : 0;
    acc.push({ ...item, offset: prevOffset });
    return acc;
  }, [] as Array<(typeof DATA_PIE_STATUS)[number] & { offset: number }>);

  return (
    <div style={{ maxWidth: 1140, margin: "0 auto", display: "flex", flexDirection: "column", gap: 18, paddingBottom: 30 }}>
      {/* ── 1. HEADER RINGKAS & TOMBOL AKSI ── */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 12,
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 13, color: "#16A34A", fontWeight: 800 }}>POSYANDU DESA SUKAMAJU</span>
            <span style={{ color: "#CBD5E1" }}>•</span>
            <span style={{ fontSize: 13, color: "#64748B", fontWeight: 600 }}>Oktober 2026</span>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: "#0F172A", margin: "2px 0 0 0" }}>
            Ringkasan Pemantauan Balita
          </h1>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={() => onNavigate("input")}
            style={{
              background: "#16A34A",
              color: "#FFFFFF",
              border: "none",
              borderRadius: 10,
              padding: "9px 16px",
              fontSize: 13,
              fontWeight: 800,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Baby size={16} /> + Catat Balita
          </button>
          <button
            type="button"
            onClick={() => onNavigate("laporan")}
            style={{
              background: "#FFFFFF",
              color: "#0F172A",
              border: "1.5px solid #CBD5E1",
              borderRadius: 10,
              padding: "9px 14px",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            <FileText size={15} color="#64748B" /> Laporan
          </button>
        </div>
      </div>

      {/* ── 2. METRIK UTAMA (4 ANGKA PADAT) ── */}
      <div style={{
        background: "#FFFFFF",
        border: "1.5px solid #E2E8F0",
        borderRadius: 14,
        padding: "14px 20px",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: 14,
      }}>
        <div>
          <div style={{ fontSize: 12, color: "#64748B", fontWeight: 700 }}>SASARAN BALITA (S)</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#0F172A", marginTop: 2 }}>
            248 <span style={{ fontSize: 13, fontWeight: 600, color: "#64748B" }}>anak</span>
          </div>
        </div>

        <div style={{ borderLeft: "1px solid #F1F5F9", paddingLeft: 14 }}>
          <div style={{ fontSize: 12, color: "#15803D", fontWeight: 700 }}>DITIMBANG (D/S)</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#15803D", marginTop: 2 }}>
            215 <span style={{ fontSize: 13, fontWeight: 600 }}>(86.7%)</span>
          </div>
        </div>

        <div style={{ borderLeft: "1px solid #F1F5F9", paddingLeft: 14 }}>
          <div style={{ fontSize: 12, color: "#0284C7", fontWeight: 700 }}>BB NAIK (N/D)</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#0284C7", marginTop: 2 }}>
            178 <span style={{ fontSize: 13, fontWeight: 600 }}>(82.8%)</span>
          </div>
        </div>

        <div style={{ borderLeft: "1px solid #F1F5F9", paddingLeft: 14 }}>
          <div style={{ fontSize: 12, color: "#D97706", fontWeight: 700 }}>STUNTING (TB/U)</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#D97706", marginTop: 2, display: "flex", alignItems: "baseline", gap: 6 }}>
            12 <span style={{ fontSize: 13, fontWeight: 600 }}>(5.6%)</span>
            <span style={{ fontSize: 12, color: "#16A34A", fontWeight: 800 }}>-0.6%</span>
          </div>
        </div>
      </div>

      {/* ── 3. VISUALISASI: GRAFIK TREN + DONUT PIE CHART STATUS GIZI ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
        gap: 16,
      }}>
        {/* A. GRAFIK TREN PREVALENSI (LINE & AREA) */}
        <div style={{
          background: "#FFFFFF",
          border: "1.5px solid #E2E8F0",
          borderRadius: 14,
          padding: 16,
          display: "flex",
          flexDirection: "column",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div>
              <span style={{ fontSize: 14, fontWeight: 800, color: "#0F172A" }}>
                Tren Stunting 6 Bulan
              </span>
              <span style={{ fontSize: 12, color: "#16A34A", fontWeight: 700, marginLeft: 8 }}>
                ↓ Turun ke 5.6%
              </span>
            </div>
            <span style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600 }}>Mei - Okt 2026</span>
          </div>

          {/* SVG Line & Area Chart */}
          <div style={{ width: "100%", height: 160, position: "relative" }}>
            <svg viewBox={`0 0 ${chartW} ${chartH}`} style={{ width: "100%", height: "100%" }}>
              {/* Garis Horizontal Grid */}
              {[4, 6, 8, 10].map((v) => {
                const y = padY + pHeight - ((v - minVal) / (maxVal - minVal)) * pHeight;
                return (
                  <g key={v}>
                    <line x1={padX} y1={y} x2={padX + pWidth} y2={y} stroke="#F1F5F9" strokeWidth={1.5} />
                    <text x={padX - 8} y={y + 4} textAnchor="end" fill="#94A3B8" fontSize={11} fontWeight="700">
                      {v}%
                    </text>
                  </g>
                );
              })}

              {/* Shading Area */}
              <defs>
                <linearGradient id="stuntingGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#16A34A" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#16A34A" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={areaD} fill="url(#stuntingGrad)" />

              {/* Garis */}
              <path d={lineD} fill="none" stroke="#16A34A" strokeWidth={3} strokeLinecap="round" />

              {/* Titik */}
              {points.map((p, i) => {
                const isHovered = hoveredPoint === i;
                return (
                  <g
                    key={p.bulan}
                    onMouseEnter={() => setHoveredPoint(i)}
                    onMouseLeave={() => setHoveredPoint(null)}
                    style={{ cursor: "pointer" }}
                  >
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={isHovered ? 6 : 4.5}
                      fill="#FFFFFF"
                      stroke="#16A34A"
                      strokeWidth={isHovered ? 3 : 2}
                    />
                    <text x={p.x} y={p.y - 8} textAnchor="middle" fill="#0F172A" fontSize={11} fontWeight="800">
                      {p.prevalensi}%
                    </text>
                    <text x={p.x} y={chartH - 4} textAnchor="middle" fill="#64748B" fontSize={11} fontWeight="700">
                      {p.bulan}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* B. PIE / DONUT CHART STATUS GIZI (OKTOBER 2026) */}
        <div style={{
          background: "#FFFFFF",
          border: "1.5px solid #E2E8F0",
          borderRadius: 14,
          padding: 16,
          display: "flex",
          flexDirection: "column",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: "#0F172A" }}>
              Proporsi Status Gizi (215 Balita)
            </span>
            <span style={{ fontSize: 12, color: "#64748B", fontWeight: 600 }}>Okt 2026</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-around", flex: 1, gap: 14 }}>
            {/* Donut SVG */}
            <div style={{ position: "relative", width: 140, height: 140, flexShrink: 0 }}>
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
                <span style={{ fontSize: 20, fontWeight: 900, color: "#0F172A", lineHeight: 1 }}>
                  215
                </span>
                <span style={{ fontSize: 11, color: "#64748B", fontWeight: 700, marginTop: 2 }}>
                  Ditimbang
                </span>
              </div>
            </div>

            {/* Legenda Donut Padat */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {DATA_PIE_STATUS.map((item, idx) => (
                <div
                  key={item.label}
                  onMouseEnter={() => setHoveredSlice(idx)}
                  onMouseLeave={() => setHoveredSlice(null)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    cursor: "pointer",
                    padding: "3px 6px",
                    borderRadius: 6,
                    background: hoveredSlice === idx ? "#F8FAFC" : "transparent",
                  }}
                >
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: item.color, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#0F172A" }}>
                      {item.label}
                    </div>
                    <div style={{ fontSize: 12, color: "#64748B" }}>
                      <strong>{item.count}</strong> anak ({item.percent}%)
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. DUA BLOK PADAT: SEBARAN WILAYAH & BALITA PRIORITAS ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
        gap: 16,
      }}>
        {/* A. TABEL SEBARAN DUSUN (PADAT) */}
        <div style={{
          background: "#FFFFFF",
          border: "1.5px solid #E2E8F0",
          borderRadius: 14,
          padding: "14px 16px",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: "#0F172A" }}>
              Sebaran Dusun Desa
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

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {DATA_DUSUN.map((d) => (
              <div
                key={d.nama}
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
                  <span style={{ fontSize: 13, fontWeight: 800, color: "#0F172A" }}>{d.nama}</span>
                  <span style={{ fontSize: 12, color: "#64748B", marginLeft: 6 }}>
                    ({d.ditimbang}/{d.sasaran} anak)
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: d.zona === "prioritas" ? "#DC2626" : d.zona === "waspada" ? "#D97706" : "#16A34A" }}>
                    {d.stunting} stunting ({d.prevalensi})
                  </span>
                  <span style={{
                    fontSize: 11, fontWeight: 800, padding: "2px 6px", borderRadius: 4,
                    background: d.zona === "prioritas" ? "#FEE2E2" : d.zona === "waspada" ? "#FEF3C7" : "#DCFCE7",
                    color: d.zona === "prioritas" ? "#B91C1C" : d.zona === "waspada" ? "#B45309" : "#15803D",
                  }}>
                    {d.zona === "prioritas" ? "Prioritas" : d.zona === "waspada" ? "Waspada" : "Aman"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* B. DAFTAR BALITA PRIORITAS TINDAK LANJUT (PADAT) */}
        <div style={{
          background: "#FFFFFF",
          border: "1.5px solid #E2E8F0",
          borderRadius: 14,
          padding: "14px 16px",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: "#0F172A" }}>
              Balita Butuh Perhatian
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

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {BALITA_PERHATIAN.map((b) => (
              <div
                key={b.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "8px 12px",
                  background: b.level === "danger" ? "#FEF2F2" : "#FFFBEB",
                  border: `1px solid ${b.level === "danger" ? "#FECACA" : "#FDE68A"}`,
                  borderRadius: 8,
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: "#0F172A" }}>{b.nama}</span>
                    <span style={{ fontSize: 11, color: "#64748B" }}>({b.umur} • {b.dusun})</span>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: b.level === "danger" ? "#B91C1C" : "#B45309" }}>
                    {b.status}
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
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
