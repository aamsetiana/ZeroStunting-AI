"use client";

import React, { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceDot,
} from "recharts";
import { getGrowthCurveData, type GrowthPoint } from "@/lib/who-data";
import { Ruler, Scale, AlertTriangle, CheckCircle, Info, History } from "lucide-react";
import type { PenimbanganRecord } from "@/components/balita/RiwayatData";

export interface GrowthChartProps {
  namaAnak?: string;
  jenisKelamin: "L" | "P";
  umurBulan: number;
  beratKg: number;
  tinggiCm: number;
  initialIndicator?: "bbu" | "pbu";
  riwayat?: PenimbanganRecord[];
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    dataKey: string;
    value: number;
    color: string;
    name: string;
  }>;
  label?: number;
  unit: string;
  currentChildName?: string;
}

function CustomTooltip({ active, payload, label, unit, currentChildName }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const childPoint = payload.find((p) => p.dataKey === "balitaVal");
  const medianPoint = payload.find((p) => p.dataKey === "sd_0");
  const min2Point = payload.find((p) => p.dataKey === "sd_neg2");
  const min3Point = payload.find((p) => p.dataKey === "sd_neg3");

  return (
    <div
      style={{
        background: "#FFFFFF",
        border: "1px solid #CBD5E1",
        borderRadius: 10,
        padding: "12px 16px",
        boxShadow: "0 8px 24px rgba(15, 23, 42, 0.12)",
        fontSize: 13,
        color: "#0F172A",
        minWidth: 220,
      }}
    >
      <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 8, color: "#0F172A", borderBottom: "1px solid #E2E8F0", paddingBottom: 6 }}>
        Usia: <span style={{ color: "#16A34A" }}>{label} Bulan</span>
      </div>

      {childPoint && childPoint.value !== null && childPoint.value !== undefined && (
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, color: "#0284C7", fontWeight: 700, marginBottom: 5 }}>
          <span>{currentChildName || "Posisi Balita"}:</span>
          <span>{childPoint.value} {unit}</span>
        </div>
      )}

      {medianPoint && (
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, color: "#16A34A", fontWeight: 600, marginBottom: 4 }}>
          <span>Median WHO (Ideal):</span>
          <span>{medianPoint.value} {unit}</span>
        </div>
      )}

      {min2Point && (
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, color: "#D97706", fontWeight: 600, marginBottom: 4 }}>
          <span>Batas Waspada (-2 SD):</span>
          <span>{min2Point.value} {unit}</span>
        </div>
      )}

      {min3Point && (
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, color: "#DC2626", fontWeight: 600 }}>
          <span>Batas Kritis (-3 SD):</span>
          <span>{min3Point.value} {unit}</span>
        </div>
      )}
    </div>
  );
}

export function GrowthChart({
  namaAnak,
  jenisKelamin,
  umurBulan,
  beratKg,
  tinggiCm,
  initialIndicator = "pbu",
  riwayat,
}: GrowthChartProps) {
  const [indicator, setIndicator] = useState<"bbu" | "pbu">(initialIndicator);
  const [maxAge, setMaxAge] = useState<24 | 60>(umurBulan <= 24 ? 24 : 60);

  const currentVal = indicator === "bbu" ? beratKg : tinggiCm;
  const unit = indicator === "bbu" ? "kg" : "cm";
  const title = indicator === "bbu" ? "Berat Badan menurut Umur (BB/U)" : "Panjang / Tinggi Badan menurut Umur (PB/U)";
  const subtitle =
    indicator === "bbu"
      ? "Deteksi berat badan kurang (underweight) dan risiko gizi buruk"
      : "Deteksi stunting (panjang atau tinggi badan di bawah standar WHO)";

  // Urutkan riwayat penimbangan dari kunjungan awal ke terkini
  const sortedRiwayat = useMemo(() => {
    if (!riwayat || riwayat.length === 0) return [];
    return [...riwayat].sort((a, b) => {
      if (a.umurBulan !== b.umurBulan) return a.umurBulan - b.umurBulan;
      return new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime();
    });
  }, [riwayat]);

  const rawData = useMemo(() => {
    return getGrowthCurveData(indicator, jenisKelamin, {
      umur_bulan: umurBulan,
      nilai: currentVal,
    });
  }, [indicator, jenisKelamin, umurBulan, currentVal]);

  // Gabungkan titik WHO dengan jalur pengukuran balita dari riwayat penimbangan
  const filteredData = useMemo(() => {
    const subset = rawData.filter((d: GrowthPoint) => d.umur <= maxAge);

    if (sortedRiwayat.length > 0) {
      const mapRiwayat = new Map<number, number>();
      sortedRiwayat.forEach((r) => {
        const val = indicator === "bbu" ? r.beratKg : r.tinggiCm;
        if (val && val > 0) {
          mapRiwayat.set(r.umurBulan, val);
        }
      });
      // Pastikan pengukuran terkini tercantum
      mapRiwayat.set(umurBulan, currentVal);

      return subset.map((pt) => ({
        ...pt,
        balitaVal: mapRiwayat.has(pt.umur) ? mapRiwayat.get(pt.umur) : null,
      }));
    }

    return subset;
  }, [rawData, maxAge, sortedRiwayat, indicator, umurBulan, currentVal]);

  // Evaluasi status titik balita
  const currentPoint = rawData.find((d: GrowthPoint) => d.umur === umurBulan);
  const zStatus = useMemo(() => {
    if (!currentPoint) return "normal";
    if (currentVal < currentPoint.sd_neg3) return "kritis";
    if (currentVal < currentPoint.sd_neg2) return "kurang";
    if (currentVal > currentPoint.sd_pos2) return "lebih";
    return "normal";
  }, [currentPoint, currentVal]);

  return (
    <div
      style={{
        background: "#FFFFFF",
        border: "1px solid #E2E8F0",
        borderRadius: 16,
        padding: "24px 22px",
        display: "flex",
        flexDirection: "column",
        gap: 18,
      }}
    >
      {/* ── 1. HEADER SECTION (Judul & Identitas) ── */}
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: "#DCFCE7",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {indicator === "bbu" ? <Scale size={22} color="#15803D" /> : <Ruler size={22} color="#15803D" />}
          </div>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: "#0F172A", margin: 0 }}>
              Kurva Pertumbuhan KMS (Standar WHO)
            </h3>
            <p style={{ fontSize: 14, color: "#475569", margin: "2px 0 0 0" }}>
              {title}
            </p>
          </div>
        </div>

        <span
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: jenisKelamin === "L" ? "#0284C7" : "#BE185D",
            background: jenisKelamin === "L" ? "#E0F2FE" : "#FCE7F3",
            border: `1.5px solid ${jenisKelamin === "L" ? "#BAE6FD" : "#FBCFE8"}`,
            padding: "5px 14px",
            borderRadius: 99,
          }}
        >
          {jenisKelamin === "L" ? "♂ Balita Laki-laki" : "♀ Balita Perempuan"}
        </span>
      </div>

      {/* ── 2. KONTROL PILIHAN GRAFIK (Clean & Rapi) ── */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          paddingBottom: 12,
          borderBottom: "1px solid #F1F5F9",
        }}
      >
        {/* Pilihan Indikator: Tinggi vs Berat */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#475569" }}>Pilihan Kurva:</span>
          <div style={{ display: "inline-flex", background: "#F1F5F9", padding: 3, borderRadius: 8 }}>
            <button
              type="button"
              onClick={() => setIndicator("pbu")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "7px 14px",
                borderRadius: 6,
                border: "none",
                background: indicator === "pbu" ? "#FFFFFF" : "transparent",
                color: indicator === "pbu" ? "#16A34A" : "#64748B",
                fontWeight: 700,
                fontSize: 13,
                cursor: "pointer",
                boxShadow: indicator === "pbu" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                transition: "all 0.15s ease",
              }}
            >
              <Ruler size={15} /> Tinggi Badan (PB/U)
            </button>
            <button
              type="button"
              onClick={() => setIndicator("bbu")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "7px 14px",
                borderRadius: 6,
                border: "none",
                background: indicator === "bbu" ? "#FFFFFF" : "transparent",
                color: indicator === "bbu" ? "#16A34A" : "#64748B",
                fontWeight: 700,
                fontSize: 13,
                cursor: "pointer",
                boxShadow: indicator === "bbu" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                transition: "all 0.15s ease",
              }}
            >
              <Scale size={15} /> Berat Badan (BB/U)
            </button>
          </div>
        </div>

        {/* Pilihan Rentang Usia: 0-24 vs 0-60 */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#475569" }}>Rentang Usia:</span>
          <div style={{ display: "inline-flex", background: "#F1F5F9", padding: 3, borderRadius: 8 }}>
            <button
              type="button"
              onClick={() => setMaxAge(24)}
              style={{
                padding: "7px 12px",
                borderRadius: 6,
                border: "none",
                background: maxAge === 24 ? "#FFFFFF" : "transparent",
                color: maxAge === 24 ? "#15803D" : "#64748B",
                fontWeight: 700,
                fontSize: 13,
                cursor: "pointer",
                boxShadow: maxAge === 24 ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                transition: "all 0.15s ease",
              }}
            >
              0 - 24 Bln (Bayi)
            </button>
            <button
              type="button"
              onClick={() => setMaxAge(60)}
              style={{
                padding: "7px 12px",
                borderRadius: 6,
                border: "none",
                background: maxAge === 60 ? "#FFFFFF" : "transparent",
                color: maxAge === 60 ? "#15803D" : "#64748B",
                fontWeight: 700,
                fontSize: 13,
                cursor: "pointer",
                boxShadow: maxAge === 60 ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                transition: "all 0.15s ease",
              }}
            >
              0 - 60 Bln (Balita)
            </button>
          </div>
        </div>
      </div>

      {/* ── 3. STATUS ALERT (Clean Left-Accent: Tanpa rounded box card) ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "12px 16px",
          borderRadius: 8,
          background:
            zStatus === "kritis"
              ? "#FEF2F2"
              : zStatus === "kurang"
              ? "#FFFBEB"
              : "#F0FDF4",
          borderLeft: `4px solid ${
            zStatus === "kritis"
              ? "#DC2626"
              : zStatus === "kurang"
              ? "#D97706"
              : "#16A34A"
          }`,
        }}
      >
        {zStatus === "normal" ? (
          <CheckCircle size={22} color="#16A34A" style={{ flexShrink: 0 }} />
        ) : (
          <AlertTriangle size={22} color={zStatus === "kritis" ? "#DC2626" : "#D97706"} style={{ flexShrink: 0 }} />
        )}
        <div style={{ fontSize: 14, color: "#0F172A", lineHeight: 1.6 }}>
          <strong>{namaAnak || "Balita"}</strong> ({umurBulan} bulan) saat ini berukuran{" "}
          <strong
            style={{
              color:
                zStatus === "kritis" ? "#B91C1C" : zStatus === "kurang" ? "#B45309" : "#15803D",
            }}
          >
            {currentVal} {unit}
          </strong>.{" "}
          {zStatus === "normal" && "Pertumbuhan berada dalam rentang pita normal WHO."}
          {zStatus === "kurang" &&
            (indicator === "pbu"
              ? "Posisi balita berada di bawah -2 SD (Terindikasi Pendek / Stunting). Dianjurkan konseling gizi dan evaluasi MP-ASI."
              : "Posisi balita berada di bawah -2 SD (Berat Badan Kurang / Underweight). Pantau asupan makanan padat gizi.")}
          {zStatus === "kritis" &&
            (indicator === "pbu"
              ? "Posisi balita berada di bawah -3 SD (Sangat Pendek / Severe Stunting). Perlu rujukan penanganan ke Bidan / Puskesmas."
              : "Posisi balita berada di bawah -3 SD (Gizi Buruk). Perlu penanganan medis segera oleh tenaga kesehatan.")}
          {zStatus === "lebih" && "Posisi balita berada di atas +2 SD (Risiko Berat/Tinggi Lebih)."}
        </div>
      </div>

      {/* ── 4. CHART VISUALIZER ── */}
      <div style={{ width: "100%", height: 350, marginTop: 4 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={filteredData} margin={{ top: 12, right: 18, left: -6, bottom: 4 }}>
            <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" />
            <XAxis
              dataKey="umur"
              stroke="#475569"
              fontSize={12}
              fontWeight={600}
              tickLine={false}
              unit=" bln"
              domain={[0, maxAge]}
            />
            <YAxis
              stroke="#475569"
              fontSize={12}
              fontWeight={600}
              tickLine={false}
              unit={` ${unit}`}
              domain={["dataMin - 1", "dataMax + 1"]}
            />
            <Tooltip
              content={
                <CustomTooltip
                  unit={unit}
                  currentChildName={namaAnak}
                />
              }
            />

            {/* WHO Standard Deviation Curves */}
            <Line
              type="monotone"
              dataKey="sd_pos3"
              name="+3 SD (Atas)"
              stroke="#94A3B8"
              strokeDasharray="4 4"
              strokeWidth={1}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="sd_pos2"
              name="+2 SD (Batas Atas)"
              stroke="#F59E0B"
              strokeDasharray="3 3"
              strokeWidth={1.2}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="sd_0"
              name="Median (Ideal)"
              stroke="#16A34A"
              strokeWidth={2.6}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="sd_neg2"
              name="-2 SD (Batas Waspada)"
              stroke="#D97706"
              strokeDasharray="4 4"
              strokeWidth={1.8}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="sd_neg3"
              name="-3 SD (Batas Kritis)"
              stroke="#DC2626"
              strokeWidth={1.8}
              dot={false}
              isAnimationActive={false}
            />

            {/* Jalur Pertumbuhan Balita (Track Record Multi-Kunjungan KMS) */}
            <Line
              type="monotone"
              dataKey="balitaVal"
              name={indicator === "bbu" ? "Berat Balita (KMS)" : "Tinggi Balita (KMS)"}
              stroke="#0284C7"
              strokeWidth={3}
              dot={{ r: 5, fill: "#0284C7", stroke: "#FFFFFF", strokeWidth: 2 }}
              activeDot={{ r: 7.5, fill: "#0369A1", stroke: "#FFFFFF", strokeWidth: 2 }}
              connectNulls={true}
              isAnimationActive={true}
            />

            {/* Titik Penimbangan Terkini (Highlight) */}
            {umurBulan <= maxAge && (
              <ReferenceDot
                x={umurBulan}
                y={currentVal}
                r={8.5}
                fill="#0284C7"
                stroke="#FFFFFF"
                strokeWidth={3}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* ── 5. OPEN LEGEND BAR (Tanpa card container) ── */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "center",
          gap: 22,
          padding: "8px 0",
          fontSize: 13.5,
          color: "#1E293B",
          fontWeight: 600,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 18, height: 3.5, background: "#0284C7", borderRadius: 2 }} />
          <span style={{ color: "#0284C7", fontWeight: 700 }}>Jalur Pertumbuhan (KMS)</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#0284C7", border: "2px solid #FFFFFF", boxShadow: "0 1px 3px rgba(0,0,0,0.25)" }} />
          <span style={{ color: "#0F172A", fontWeight: 700 }}>Titik Pengukuran</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 20, height: 3.5, background: "#16A34A", borderRadius: 2 }} />
          <span>Median WHO (Ideal)</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 20, height: 2, background: "#D97706", borderTop: "2px dashed #D97706" }} />
          <span>Waspada (-2 SD)</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 20, height: 2.5, background: "#DC2626" }} />
          <span>Kritis / Stunting (-3 SD)</span>
        </div>
      </div>

      {/* ── 6. TABEL HISTORI TRACK RECORD PENIMBANGAN (KMS) ── */}
      {sortedRiwayat.length > 0 && (
        <div
          style={{
            background: "#F8FAFC",
            borderRadius: 14,
            padding: "16px 18px",
            border: "1.5px solid #E2E8F0",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <History size={16} color="#16A34A" />
              <span style={{ fontSize: 13.5, fontWeight: 800, color: "#0F172A" }}>
                Histori Track Record & Kenaikan Timbangan ({sortedRiwayat.length}x Posyandu)
              </span>
            </div>
            <span style={{ fontSize: 12, color: "#64748B", fontWeight: 600 }}>
              Evaluasi tren pertumbuhan (N = Naik, T = Turun/Tetap)
            </span>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
              <thead>
                <tr style={{ borderBottom: "1.5px solid #CBD5E1", textAlign: "left", color: "#475569" }}>
                  <th style={{ padding: "8px 10px", fontWeight: 700 }}>Kunjungan</th>
                  <th style={{ padding: "8px 10px", fontWeight: 700 }}>Tanggal Timbang</th>
                  <th style={{ padding: "8px 10px", fontWeight: 700 }}>Usia</th>
                  <th style={{ padding: "8px 10px", fontWeight: 700 }}>Berat Badan (kg)</th>
                  <th style={{ padding: "8px 10px", fontWeight: 700 }}>Tinggi / PB (cm)</th>
                  <th style={{ padding: "8px 10px", fontWeight: 700 }}>Kenaikan (KBM)</th>
                  <th style={{ padding: "8px 10px", fontWeight: 700 }}>Status Berat (BB/U)</th>
                </tr>
              </thead>
              <tbody>
                {sortedRiwayat.map((rec, idx) => {
                  const prev = idx > 0 ? sortedRiwayat[idx - 1] : null;
                  const deltaBB = prev ? Number((rec.beratKg - prev.beratKg).toFixed(2)) : null;
                  const deltaTB = prev ? Number((rec.tinggiCm - prev.tinggiCm).toFixed(1)) : null;
                  const isLatest = idx === sortedRiwayat.length - 1;

                  return (
                    <tr
                      key={idx}
                      style={{
                        borderBottom: "1px solid #E2E8F0",
                        background: isLatest ? "#F0FDF4" : "transparent",
                      }}
                    >
                      <td style={{ padding: "10px", fontWeight: 700, color: "#0F172A" }}>
                        #{idx + 1}
                        {isLatest && (
                          <span style={{ fontSize: 10, color: "#16A34A", background: "#DCFCE7", padding: "1px 7px", borderRadius: 4, marginLeft: 6, fontWeight: 700 }}>
                            Terkini
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "10px", color: "#334155", fontWeight: 600 }}>{rec.tanggal}</td>
                      <td style={{ padding: "10px", fontWeight: 700, color: "#0F172A" }}>{rec.umurBulan} Bulan</td>
                      <td style={{ padding: "10px", fontWeight: 700, color: "#0F172A" }}>
                        {rec.beratKg} kg
                        {deltaBB !== null && (
                          <span
                            style={{
                              marginLeft: 6,
                              fontSize: 11,
                              fontWeight: 700,
                              color: deltaBB > 0 ? "#16A34A" : deltaBB === 0 ? "#D97706" : "#DC2626",
                            }}
                          >
                            ({deltaBB > 0 ? `+${deltaBB}` : deltaBB} kg)
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "10px", fontWeight: 600, color: "#334155" }}>
                        {rec.tinggiCm} cm
                        {deltaTB !== null && (
                          <span style={{ marginLeft: 6, fontSize: 11, color: "#64748B" }}>
                            ({deltaTB > 0 ? `+${deltaTB}` : deltaTB} cm)
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "10px" }}>
                        {deltaBB === null ? (
                          <span style={{ color: "#64748B", fontSize: 11, fontWeight: 600 }}>Penimbangan Awal</span>
                        ) : deltaBB > 0 ? (
                          <span style={{ fontSize: 11, fontWeight: 700, color: "#15803D", background: "#DCFCE7", border: "1px solid #BBF7D0", padding: "3px 8px", borderRadius: 6 }}>
                            N (Naik)
                          </span>
                        ) : (
                          <span style={{ fontSize: 11, fontWeight: 700, color: "#B91C1C", background: "#FEE2E2", border: "1px solid #FECACA", padding: "3px 8px", borderRadius: 6 }}>
                            T (Turun/Tetap)
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "10px" }}>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            padding: "3px 8px",
                            borderRadius: 6,
                            background:
                              rec.statusBbu === "buruk" ? "#FEE2E2" : rec.statusBbu === "kurang" ? "#FEF3C7" : "#DCFCE7",
                            color:
                              rec.statusBbu === "buruk" ? "#B91C1C" : rec.statusBbu === "kurang" ? "#B45309" : "#15803D",
                            border: `1px solid ${
                              rec.statusBbu === "buruk" ? "#FECACA" : rec.statusBbu === "kurang" ? "#FDE68A" : "#BBF7D0"
                            }`,
                          }}
                        >
                          {rec.statusBbu === "buruk"
                            ? "Gizi Buruk"
                            : rec.statusBbu === "kurang"
                            ? "Gizi Kurang"
                            : "Normal"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── 7. PANDUAN KADER POSYANDU ── */}
      <div style={{ display: "flex", gap: 10, fontSize: 13, color: "#475569", alignItems: "flex-start", lineHeight: 1.6, borderTop: "1px solid #F1F5F9", paddingTop: 14 }}>
        <Info size={18} color="#16A34A" style={{ flexShrink: 0, marginTop: 2 }} />
        <span>
          Grafik mengikuti standar resmi <strong style={{ color: "#0F172A" }}>WHO Child Growth Standards 2006</strong>. Garis hijau merupakan pertumbuhan ideal. Apabila titik balita mendekati atau berada di bawah garis kuning (-2 SD), kader disarankan melakukan pemantauan intensif asupan gizi balita.
        </span>
      </div>
    </div>
  );
}
