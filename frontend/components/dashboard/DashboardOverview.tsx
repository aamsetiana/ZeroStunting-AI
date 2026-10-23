"use client";

import { useState } from "react";
import {
  Baby, TrendingDown, TrendingUp, Users, Calendar,
  ArrowUpRight, ChevronRight, AlertTriangle, CheckCircle2,
  MapPin, Stethoscope, Utensils, BarChart3, Map, FileText,
  Activity, ShieldAlert
} from "lucide-react";

interface DashboardOverviewProps {
  onNavigate: (pageId: string) => void;
  onBukaGrafikBalita?: (id: string) => void;
}

// Data Tren Pemantauan 6 Bulan Terakhir
const DATA_TREN_BULANAN = [
  { bulan: "Mei 2026", ditimbang: 195, stuntingCount: 16, prevalensi: 8.2 },
  { bulan: "Jun 2026", ditimbang: 202, stuntingCount: 15, prevalensi: 7.4 },
  { bulan: "Jul 2026", ditimbang: 208, stuntingCount: 14, prevalensi: 6.7 },
  { bulan: "Ags 2026", ditimbang: 212, stuntingCount: 13, prevalensi: 6.1 },
  { bulan: "Sep 2026", ditimbang: 210, stuntingCount: 13, prevalensi: 6.2 },
  { bulan: "Okt 2026", ditimbang: 215, stuntingCount: 12, prevalensi: 5.6 },
];

// Data Distribusi 3 Indikator WHO Balita
const DATA_DISTRIBUSI_GIZI = [
  {
    indikator: "Panjang / Tinggi Badan menurut Umur (TB/U - Stunting)",
    singkatan: "TB/U",
    kategori: [
      { label: "Tumbuh Normal", persen: 94.4, count: 203, color: "#16A34A" },
      { label: "Pendek (Stunted)", persen: 4.2, count: 9, color: "#F59E0B" },
      { label: "Sangat Pendek (Severely Stunted)", persen: 1.4, count: 3, color: "#EF4444" },
    ],
  },
  {
    indikator: "Berat Badan menurut Panjang / Tinggi Badan (BB/TB - Wasting)",
    singkatan: "BB/TB",
    kategori: [
      { label: "Gizi Baik (Normal)", persen: 96.3, count: 207, color: "#16A34A" },
      { label: "Gizi Kurang (Wasted)", persen: 2.8, count: 6, color: "#F59E0B" },
      { label: "Gizi Buruk (Severely Wasted)", persen: 0.9, count: 2, color: "#EF4444" },
    ],
  },
  {
    indikator: "Berat Badan menurut Umur (BB/U - Underweight)",
    singkatan: "BB/U",
    kategori: [
      { label: "Berat Badan Normal", persen: 91.6, count: 197, color: "#16A34A" },
      { label: "Berat Badan Kurang", persen: 7.0, count: 15, color: "#F59E0B" },
      { label: "Sangat Kurang", persen: 1.4, count: 3, color: "#EF4444" },
    ],
  },
];

// Data Sebaran Dusun Ringkas
const SEBARAN_DUSUN = [
  { id: "krajan", nama: "Dusun Krajan", sasaran: 58, ditimbang: 56, stunting: 6, prevalensi: 10.7, zona: "prioritas" },
  { id: "sukamaju", nama: "Dusun Sukamaju", sasaran: 46, ditimbang: 44, stunting: 3, prevalensi: 6.8, zona: "waspada" },
  { id: "tanjungsari", nama: "Dusun Tanjungsari", sasaran: 40, ditimbang: 38, stunting: 2, prevalensi: 5.3, zona: "waspada" },
  { id: "mekarsari", nama: "Dusun Mekarsari", sasaran: 52, ditimbang: 51, stunting: 1, prevalensi: 1.9, zona: "aman" },
];

// Balita Prioritas Tindak Lanjut
const BALITA_PRIORITAS = [
  {
    id: "B-007",
    nama: "Rizky Ramadhan",
    dusun: "Dusun Krajan",
    umurBulan: 31,
    bb: 10.1,
    tb: 81.2,
    statusGizi: "Sangat Pendek & Kurang",
    level: "danger",
    rencanaAksi: "Kunjungan rumah Bidan Desa & rujukan evaluasi dokter Puskesmas",
  },
  {
    id: "B-004",
    nama: "Alisya Putri",
    dusun: "Dusun Sukamaju",
    umurBulan: 22,
    bb: 8.9,
    tb: 76.5,
    statusGizi: "Pendek (TB/U -2.4 SD)",
    level: "warning",
    rencanaAksi: "Penyaluran paket PMT Pemulihan tinggi protein (telur & susu)",
  },
  {
    id: "B-003",
    nama: "Daffa Pratama",
    dusun: "Dusun Krajan",
    umurBulan: 14,
    bb: 7.2,
    tb: 69.0,
    statusGizi: "BB Kurang & T Tidak Naik",
    level: "warning",
    rencanaAksi: "Pendampingan konseling MP-ASI kaya hewani pada ibu balita",
  },
  {
    id: "B-002",
    nama: "Siti Nurhaliza",
    dusun: "Dusun Tanjungsari",
    umurBulan: 18,
    bb: 8.4,
    tb: 73.5,
    statusGizi: "Waspada Garis Kuning",
    level: "warning",
    rencanaAksi: "Jadwalkan pemantauan timbang ulang 2 minggu di Posyandu",
  },
];

export function DashboardOverview({ onNavigate, onBukaGrafikBalita }: DashboardOverviewProps) {
  const [hoveredTrenIdx, setHoveredTrenIdx] = useState<number | null>(null);

  // SVG Chart Geometry
  const chartWidth = 620;
  const chartHeight = 220;
  const paddingX = 40;
  const paddingY = 30;
  const plotWidth = chartWidth - paddingX * 2;
  const plotHeight = chartHeight - paddingY * 2;

  // Nilai Min Max untuk Chart
  const minPrev = 4;
  const maxPrev = 10;

  // Koordinat Titik Garis Prevalensi
  const linePoints = DATA_TREN_BULANAN.map((item, idx) => {
    const x = paddingX + (idx / (DATA_TREN_BULANAN.length - 1)) * plotWidth;
    const y = paddingY + plotHeight - ((item.prevalensi - minPrev) / (maxPrev - minPrev)) * plotHeight;
    return { x, y, ...item };
  });

  const lineSvgPath = linePoints.reduce(
    (acc, pt, idx) => (idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`),
    ""
  );

  const areaSvgPath = `${lineSvgPath} L ${linePoints[linePoints.length - 1].x} ${paddingY + plotHeight} L ${linePoints[0].x} ${paddingY + plotHeight} Z`;

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24, paddingBottom: 40 }}>
      {/* ── 1. HEADER RINGKASAN DESA & AKSI CEPAT ── */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        flexWrap: "wrap",
        gap: 16,
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <span style={{ fontSize: 13, color: "#16A34A", fontWeight: 700, letterSpacing: "0.04em" }}>
              POSYANDU DESA SUKAMAJU
            </span>
            <span style={{ color: "#CBD5E1" }}>•</span>
            <span style={{ fontSize: 13, color: "#64748B", fontWeight: 600 }}>Periode Oktober 2026</span>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: "#0F172A", margin: 0, letterSpacing: "-0.01em" }}>
            Pusat Komando & Pemantauan Gizi Balita
          </h1>
          <p style={{ fontSize: 14, color: "#475569", margin: "4px 0 0 0" }}>
            Ringkasan terpadu hasil penimbangan antropometri, indikator SKDN, dan tren prevalensi stunting desa.
          </p>
        </div>

        {/* Toolbar Tombol Aksi Cepat */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => onNavigate("input")}
            style={{
              background: "#16A34A",
              color: "#FFFFFF",
              border: "none",
              borderRadius: 12,
              padding: "11px 20px",
              fontSize: 14,
              fontWeight: 800,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
              boxShadow: "0 2px 8px rgba(22, 163, 74, 0.25)",
              transition: "transform 0.1s ease",
            }}
            onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.98)")}
            onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            <Baby size={18} /> + Catat Balita Baru
          </button>

          <button
            type="button"
            onClick={() => onNavigate("laporan")}
            style={{
              background: "#FFFFFF",
              color: "#0F172A",
              border: "1.5px solid #CBD5E1",
              borderRadius: 12,
              padding: "11px 16px",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <FileText size={16} color="#64748B" /> Cetak Laporan e-PPGBM
          </button>
        </div>
      </div>

      {/* ── 2. STRIP RINGKASAN METRIK KINERJA SKDN & STATUS DESA ── */}
      <div style={{
        background: "#FFFFFF",
        border: "1.5px solid #E2E8F0",
        borderRadius: 16,
        padding: "18px 22px",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
        gap: 18,
      }}>
        {/* Total Sasaran Balita (S) */}
        <div>
          <div style={{ fontSize: 13, color: "#64748B", fontWeight: 700 }}>
            TOTAL SASARAN BALITA (S)
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: "#0F172A", marginTop: 4 }}>
            248 <span style={{ fontSize: 14, fontWeight: 600, color: "#64748B" }}>anak</span>
          </div>
          <div style={{ fontSize: 13, color: "#475569", marginTop: 2 }}>
            4 Posyandu di 4 Dusun
          </div>
        </div>

        {/* Kehadiran Timbang (D/S) */}
        <div style={{ borderLeft: "1px solid #F1F5F9", paddingLeft: 16 }}>
          <div style={{ fontSize: 13, color: "#15803D", fontWeight: 700 }}>
            BALITA DITIMBANG (D/S)
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: "#15803D", marginTop: 4 }}>
            86.7%
          </div>
          <div style={{ fontSize: 13, color: "#15803D", fontWeight: 700, marginTop: 2 }}>
            215 dari 248 balita hadir
          </div>
        </div>

        {/* Balita Naik Timbangan (N/D) */}
        <div style={{ borderLeft: "1px solid #F1F5F9", paddingLeft: 16 }}>
          <div style={{ fontSize: 13, color: "#0284C7", fontWeight: 700 }}>
            BERAT NAIK NORMAL (N/D)
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: "#0284C7", marginTop: 4 }}>
            82.8%
          </div>
          <div style={{ fontSize: 13, color: "#0284C7", fontWeight: 700, marginTop: 2 }}>
            178 balita beratnya naik (N)
          </div>
        </div>

        {/* Prevalensi Stunting Desa */}
        <div style={{ borderLeft: "1px solid #F1F5F9", paddingLeft: 16 }}>
          <div style={{ fontSize: 13, color: "#D97706", fontWeight: 700 }}>
            PREVALENSI STUNTING (TB/U)
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: "#D97706", marginTop: 4, display: "flex", alignItems: "baseline", gap: 6 }}>
            5.6%
            <span style={{ fontSize: 13, color: "#16A34A", fontWeight: 800, display: "inline-flex", alignItems: "center" }}>
              <TrendingDown size={14} /> -0.6%
            </span>
          </div>
          <div style={{ fontSize: 13, color: "#475569", marginTop: 2 }}>
            12 balita terindikasi pendek
          </div>
        </div>
      </div>

      {/* ── 3. DUA GRAFIK UTAMA: TREN 6 BULAN & DISTRIBUSI INDIKATOR WHO ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))",
        gap: 20,
      }}>
        {/* GRAFIK 1: TREN PREVALENSI & KEHADIRAN 6 BULAN TERAKHIR */}
        <div style={{
          background: "#FFFFFF",
          border: "1.5px solid #E2E8F0",
          borderRadius: 16,
          padding: 20,
          display: "flex",
          flexDirection: "column",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#0F172A" }}>
                Tren Prevalensi Stunting Desa
              </div>
              <div style={{ fontSize: 13, color: "#64748B", marginTop: 2 }}>
                Penurunan prevalensi dari 8.2% (Mei) menjadi 5.6% (Oktober 2026)
              </div>
            </div>
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              fontSize: 12, fontWeight: 700, color: "#16A34A",
              background: "#F0FDF4", padding: "4px 10px", borderRadius: 8,
            }}>
              <TrendingDown size={15} /> Tren Membaik
            </div>
          </div>

          {/* SVG Line Chart */}
          <div style={{ position: "relative", width: "100%", height: chartHeight }}>
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              style={{ width: "100%", height: "100%", overflow: "visible" }}
            >
              {/* Garis Grid Horizontal */}
              {[4, 6, 8, 10].map((val) => {
                const y = paddingY + plotHeight - ((val - minPrev) / (maxPrev - minPrev)) * plotHeight;
                return (
                  <g key={val}>
                    <line
                      x1={paddingX}
                      y1={y}
                      x2={paddingX + plotWidth}
                      y2={y}
                      stroke="#F1F5F9"
                      strokeWidth={1.5}
                      strokeDasharray="4 4"
                    />
                    <text
                      x={paddingX - 10}
                      y={y + 4}
                      textAnchor="end"
                      fill="#94A3B8"
                      fontSize={11}
                      fontWeight="700"
                    >
                      {val}%
                    </text>
                  </g>
                );
              })}

              {/* Area Shading */}
              <defs>
                <linearGradient id="gradientStunting" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#16A34A" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#16A34A" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path d={areaSvgPath} fill="url(#gradientStunting)" />

              {/* Garis Tren */}
              <path
                d={lineSvgPath}
                fill="none"
                stroke="#16A34A"
                strokeWidth={3.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Titik Data Koordinat */}
              {linePoints.map((pt, idx) => {
                const isHovered = hoveredTrenIdx === idx;
                return (
                  <g
                    key={pt.bulan}
                    onMouseEnter={() => setHoveredTrenIdx(idx)}
                    onMouseLeave={() => setHoveredTrenIdx(null)}
                    style={{ cursor: "pointer" }}
                  >
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isHovered ? 7 : 5}
                      fill="#FFFFFF"
                      stroke="#16A34A"
                      strokeWidth={isHovered ? 3.5 : 2.5}
                    />
                    {/* Nilai di atas titik */}
                    <text
                      x={pt.x}
                      y={pt.y - 10}
                      textAnchor="middle"
                      fill="#0F172A"
                      fontSize={12}
                      fontWeight="800"
                    >
                      {pt.prevalensi}%
                    </text>
                    {/* Label Bulan di bawah sumbu */}
                    <text
                      x={pt.x}
                      y={chartHeight - 6}
                      textAnchor="middle"
                      fill="#64748B"
                      fontSize={11}
                      fontWeight="700"
                    >
                      {pt.bulan.split(" ")[0]}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            marginTop: 10, paddingTop: 10, borderTop: "1px solid #F1F5F9",
            fontSize: 12, color: "#64748B", fontWeight: 600,
          }}>
            <span>Target Nasional: &lt; 14%</span>
            <span>Target Desa Bebas Stunting: &lt; 3.0%</span>
          </div>
        </div>

        {/* GRAFIK 2: PROPORSI 3 INDIKATOR STANDAR WHO */}
        <div style={{
          background: "#FFFFFF",
          border: "1.5px solid #E2E8F0",
          borderRadius: 16,
          padding: 20,
          display: "flex",
          flexDirection: "column",
        }}>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#0F172A" }}>
              Distribusi 3 Indikator Status Gizi WHO
            </div>
            <div style={{ fontSize: 13, color: "#64748B", marginTop: 2 }}>
              Proporsi hasil timbang 215 balita berdasarkan indeks antropometri resmi
            </div>
          </div>

          {/* Bar Distribusi untuk Setiap Indikator */}
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {DATA_DISTRIBUSI_GIZI.map((item) => (
              <div key={item.singkatan}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: "#0F172A" }}>
                    {item.singkatan} • <span style={{ fontWeight: 600, color: "#475569" }}>{item.indikator.split("(")[0]}</span>
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 800, color: "#15803D" }}>
                    {item.kategori[0].persen}% Normal
                  </span>
                </div>

                {/* Stacked Progress Bar */}
                <div style={{
                  height: 14,
                  borderRadius: 7,
                  overflow: "hidden",
                  display: "flex",
                  background: "#E2E8F0",
                }}>
                  {item.kategori.map((kat) => (
                    <div
                      key={kat.label}
                      style={{
                        width: `${kat.persen}%`,
                        background: kat.color,
                        transition: "width 0.3s ease",
                      }}
                      title={`${kat.label}: ${kat.count} balita (${kat.persen}%)`}
                    />
                  ))}
                </div>

                {/* Rincian Angka */}
                <div style={{ display: "flex", gap: 14, marginTop: 5, fontSize: 12 }}>
                  {item.kategori.map((kat) => (
                    <div key={kat.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: kat.color }} />
                      <span style={{ color: "#475569", fontWeight: 600 }}>{kat.label.split("(")[0]}:</span>
                      <strong style={{ color: "#0F172A" }}>{kat.count} ({kat.persen}%)</strong>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div style={{
            marginTop: "auto", paddingTop: 12, borderTop: "1px solid #F1F5F9",
            display: "flex", justifyContent: "flex-end",
          }}>
            <button
              type="button"
              onClick={() => onNavigate("grafik")}
              style={{
                background: "none", border: "none", color: "#16A34A",
                fontSize: 13, fontWeight: 800, cursor: "pointer",
                display: "inline-flex", alignItems: "center", gap: 4,
              }}
            >
              Lihat Plot Kurva KMS Lengkap <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* ── 4. DUA KOLOM: SEBARAN WILAYAH DUSUN & TINDAK LANJUT BALITA PRIORITAS ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))",
        gap: 20,
      }}>
        {/* KOLOM KIRI: STATUS DUSUN DESA */}
        <div style={{
          background: "#FFFFFF",
          border: "1.5px solid #E2E8F0",
          borderRadius: 16,
          padding: 20,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#0F172A" }}>
                Status Sebaran Gizi per Wilayah Dusun
              </div>
              <div style={{ fontSize: 13, color: "#64748B" }}>
                Cakupan timbang dan kasus stunting di 4 dusun
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNavigate("peta")}
              style={{
                background: "#F0FDF4",
                border: "1px solid #DCFCE7",
                borderRadius: 8,
                padding: "6px 12px",
                fontSize: 12,
                fontWeight: 800,
                color: "#15803D",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <Map size={14} /> Buka Peta Geospasial
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {SEBARAN_DUSUN.map((dusun) => {
              const badge =
                dusun.zona === "prioritas"
                  ? { bg: "#FEE2E2", text: "#B91C1C", border: "#FECACA", label: "Prioritas" }
                  : dusun.zona === "waspada"
                  ? { bg: "#FEF3C7", text: "#B45309", border: "#FDE68A", label: "Waspada" }
                  : { bg: "#DCFCE7", text: "#15803D", border: "#BBF7D0", label: "Aman" };

              return (
                <div
                  key={dusun.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px 14px",
                    background: "#F8FAFC",
                    border: "1px solid #E2E8F0",
                    borderRadius: 10,
                  }}
                >
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#0F172A" }}>
                      {dusun.nama}
                    </div>
                    <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>
                      Ditimbang: <strong style={{ color: "#0F172A" }}>{dusun.ditimbang}/{dusun.sasaran}</strong> (
                      {((dusun.ditimbang / dusun.sasaran) * 100).toFixed(0)}%)
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 14, fontWeight: 900, color: dusun.prevalensi > 10 ? "#DC2626" : "#D97706" }}>
                        {dusun.prevalensi}%
                      </div>
                      <div style={{ fontSize: 11, color: "#64748B" }}>
                        {dusun.stunting} anak
                      </div>
                    </div>

                    <span style={{
                      background: badge.bg, color: badge.text, border: `1px solid ${badge.border}`,
                      fontSize: 11, fontWeight: 800, padding: "3px 8px", borderRadius: 6,
                    }}>
                      {badge.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* KOLOM KANAN: DAFTAR BALITA PRIORITAS TINDAK LANJUT */}
        <div style={{
          background: "#FFFFFF",
          border: "1.5px solid #E2E8F0",
          borderRadius: 16,
          padding: 20,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#0F172A" }}>
                Prioritas Tindak Lanjut Balita
              </div>
              <div style={{ fontSize: 13, color: "#64748B" }}>
                Balita yang membutuhkan pemantauan gizi khusus & intervensi
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNavigate("riwayat")}
              style={{
                background: "none", border: "none", color: "#16A34A",
                fontSize: 13, fontWeight: 800, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 4,
              }}
            >
              Semua Balita <ChevronRight size={15} />
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {BALITA_PRIORITAS.map((balita) => {
              const isDanger = balita.level === "danger";

              return (
                <div
                  key={balita.id}
                  style={{
                    padding: "12px 14px",
                    background: isDanger ? "#FEF2F2" : "#FFFBEB",
                    border: `1.5px solid ${isDanger ? "#FECACA" : "#FDE68A"}`,
                    borderRadius: 10,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 15, fontWeight: 800, color: "#0F172A" }}>
                          {balita.nama}
                        </span>
                        <span style={{ fontSize: 12, color: "#64748B", fontWeight: 600 }}>
                          ({balita.umurBulan} bln • {balita.dusun})
                        </span>
                      </div>
                      <div style={{
                        fontSize: 12, fontWeight: 800,
                        color: isDanger ? "#B91C1C" : "#B45309",
                        marginTop: 2,
                      }}>
                        {balita.statusGizi} (TB {balita.tb} cm • BB {balita.bb} kg)
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (onBukaGrafikBalita) onBukaGrafikBalita(balita.id);
                        else onNavigate("grafik");
                      }}
                      style={{
                        background: "#FFFFFF",
                        border: "1px solid #CBD5E1",
                        borderRadius: 6,
                        padding: "4px 8px",
                        fontSize: 12,
                        fontWeight: 700,
                        color: "#0F172A",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 3,
                        flexShrink: 0,
                      }}
                    >
                      KMS <ChevronRight size={12} />
                    </button>
                  </div>

                  <div style={{
                    fontSize: 12, color: isDanger ? "#991B1B" : "#78350F",
                    marginTop: 6, paddingTop: 6,
                    borderTop: `1px dashed ${isDanger ? "#FCA5A5" : "#FCD34D"}`,
                    display: "flex", alignItems: "center", gap: 5,
                  }}>
                    <Utensils size={13} />
                    <span>Rencana: <strong>{balita.rencanaAksi}</strong></span>
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
