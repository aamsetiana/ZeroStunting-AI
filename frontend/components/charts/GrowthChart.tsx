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
  Legend,
  ReferenceDot,
} from "recharts";
import { getGrowthCurveData, type GrowthPoint } from "@/lib/who-data";
import { Activity, Ruler, Scale, AlertTriangle, CheckCircle, Info } from "lucide-react";

export interface GrowthChartProps {
  namaAnak?: string;
  jenisKelamin: "L" | "P";
  umurBulan: number;
  beratKg: number;
  tinggiCm: number;
  initialIndicator?: "bbu" | "pbu";
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
        background: "#0b1220",
        border: "1px solid rgba(148, 163, 184, 0.25)",
        borderRadius: 12,
        padding: "12px 14px",
        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.5)",
        fontSize: 12,
        color: "#F1F5F9",
        minWidth: 190,
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 6, color: "#38BDF8", borderBottom: "1px solid rgba(148,163,184,0.15)", paddingBottom: 4 }}>
        Umur: {label} Bulan
      </div>

      {childPoint && childPoint.value !== null && childPoint.value !== undefined && (
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, color: "#4ADE80", fontWeight: 700, marginBottom: 4 }}>
          <span>{currentChildName || "Nilai Balita"}:</span>
          <span>{childPoint.value} {unit}</span>
        </div>
      )}

      {medianPoint && (
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, color: "#22C55E", marginBottom: 3 }}>
          <span>Median (0 SD):</span>
          <span>{medianPoint.value} {unit}</span>
        </div>
      )}

      {min2Point && (
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, color: "#FCD34D", marginBottom: 3 }}>
          <span>Batas Waspada (-2 SD):</span>
          <span>{min2Point.value} {unit}</span>
        </div>
      )}

      {min3Point && (
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, color: "#FCA5A5" }}>
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
}: GrowthChartProps) {
  const [indicator, setIndicator] = useState<"bbu" | "pbu">(initialIndicator);
  const [maxAge, setMaxAge] = useState<24 | 60>(umurBulan <= 24 ? 24 : 60);

  const currentVal = indicator === "bbu" ? beratKg : tinggiCm;
  const unit = indicator === "bbu" ? "kg" : "cm";
  const title = indicator === "bbu" ? "Berat Badan menurut Umur (BB/U)" : "Panjang/Tinggi Badan menurut Umur (PB/U)";
  const subtitle =
    indicator === "bbu"
      ? "Deteksi berat badan kurang (underweight) dan gizi buruk"
      : "Deteksi stunting (panjang/tinggi badan di bawah standar)";

  const rawData = useMemo(() => {
    return getGrowthCurveData(indicator, jenisKelamin, {
      umur_bulan: umurBulan,
      nilai: currentVal,
    });
  }, [indicator, jenisKelamin, umurBulan, currentVal]);

  const filteredData = useMemo(() => {
    return rawData.filter((d: GrowthPoint) => d.umur <= maxAge);
  }, [rawData, maxAge]);

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
        background: "rgba(15, 23, 42, 0.75)",
        border: "1px solid rgba(148, 163, 184, 0.12)",
        borderRadius: 18,
        padding: 20,
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      {/* Header & Switcher */}
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: "rgba(34, 197, 94, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {indicator === "bbu" ? <Scale size={16} color="#22C55E" /> : <Ruler size={16} color="#22C55E" />}
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#F1F5F9", margin: 0 }}>
              Kurva Pertumbuhan KMS (Standar WHO)
            </h3>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: jenisKelamin === "L" ? "#60A5FA" : "#F472B6",
                background: jenisKelamin === "L" ? "rgba(59,130,246,0.12)" : "rgba(244,114,182,0.12)",
                padding: "2px 8px",
                borderRadius: 99,
              }}
            >
              {jenisKelamin === "L" ? "Laki-laki" : "Perempuan"}
            </span>
          </div>
          <p style={{ fontSize: 12, color: "#94A3B8", margin: 0 }}>{title} : {subtitle}</p>
        </div>

        {/* Tab Buttons */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <div
            style={{
              display: "inline-flex",
              background: "rgba(15, 23, 42, 0.9)",
              border: "1px solid rgba(148, 163, 184, 0.15)",
              borderRadius: 10,
              padding: 3,
            }}
          >
            <button
              type="button"
              onClick={() => setIndicator("pbu")}
              style={{
                padding: "6px 12px",
                borderRadius: 8,
                border: "none",
                background: indicator === "pbu" ? "rgba(34, 197, 94, 0.2)" : "transparent",
                color: indicator === "pbu" ? "#4ADE80" : "#94A3B8",
                fontWeight: 600,
                fontSize: 12,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              Tinggi (PB/U)
            </button>
            <button
              type="button"
              onClick={() => setIndicator("bbu")}
              style={{
                padding: "6px 12px",
                borderRadius: 8,
                border: "none",
                background: indicator === "bbu" ? "rgba(34, 197, 94, 0.2)" : "transparent",
                color: indicator === "bbu" ? "#4ADE80" : "#94A3B8",
                fontWeight: 600,
                fontSize: 12,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              Berat (BB/U)
            </button>
          </div>

          <div
            style={{
              display: "inline-flex",
              background: "rgba(15, 23, 42, 0.9)",
              border: "1px solid rgba(148, 163, 184, 0.15)",
              borderRadius: 10,
              padding: 3,
            }}
          >
            <button
              type="button"
              onClick={() => setMaxAge(24)}
              style={{
                padding: "6px 10px",
                borderRadius: 8,
                border: "none",
                background: maxAge === 24 ? "rgba(59, 130, 246, 0.2)" : "transparent",
                color: maxAge === 24 ? "#60A5FA" : "#64748B",
                fontWeight: 600,
                fontSize: 11,
                cursor: "pointer",
              }}
            >
              0-24 bln
            </button>
            <button
              type="button"
              onClick={() => setMaxAge(60)}
              style={{
                padding: "6px 10px",
                borderRadius: 8,
                border: "none",
                background: maxAge === 60 ? "rgba(59, 130, 246, 0.2)" : "transparent",
                color: maxAge === 60 ? "#60A5FA" : "#64748B",
                fontWeight: 600,
                fontSize: 11,
                cursor: "pointer",
              }}
            >
              0-60 bln
            </button>
          </div>
        </div>
      </div>

      {/* Status Alert Banner */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 14px",
          borderRadius: 12,
          background:
            zStatus === "kritis"
              ? "rgba(239, 68, 68, 0.12)"
              : zStatus === "kurang"
              ? "rgba(245, 158, 11, 0.12)"
              : "rgba(34, 197, 94, 0.12)",
          border: `1px solid ${
            zStatus === "kritis"
              ? "rgba(239, 68, 68, 0.25)"
              : zStatus === "kurang"
              ? "rgba(245, 158, 11, 0.25)"
              : "rgba(34, 197, 94, 0.25)"
          }`,
        }}
      >
        {zStatus === "normal" ? (
          <CheckCircle size={16} color="#4ADE80" style={{ flexShrink: 0 }} />
        ) : (
          <AlertTriangle size={16} color={zStatus === "kritis" ? "#F87171" : "#FBBF24"} style={{ flexShrink: 0 }} />
        )}
        <div style={{ fontSize: 12, color: "#E2E8F0" }}>
          <strong>{namaAnak || "Balita"}</strong> ({umurBulan} bulan):{" "}
          <strong
            style={{
              color:
                zStatus === "kritis" ? "#FCA5A5" : zStatus === "kurang" ? "#FCD34D" : "#86EFAC",
            }}
          >
            {currentVal} {unit}
          </strong>{" "}
          {zStatus === "normal" && "berada dalam rentang pertumbuhan normal WHO."}
          {zStatus === "kurang" &&
            (indicator === "pbu"
              ? "berada di bawah -2 SD (Terindikasi Pendek / Stunting). Perlu intervensi gizi."
              : "berada di bawah -2 SD (Berat Badan Kurang). Pantau asupan gizi.")}
          {zStatus === "kritis" &&
            (indicator === "pbu"
              ? "berada di bawah -3 SD (Sangat Pendek / Severe Stunting). Perlu rujukan ke Puskesmas."
              : "berada di bawah -3 SD (Gizi Buruk). Perlu penanganan medis segera.")}
          {zStatus === "lebih" && "berada di atas +2 SD (Risiko Berat/Tinggi Lebih)."}
        </div>
      </div>

      {/* Chart Visualizer */}
      <div style={{ width: "100%", height: 320, marginTop: 4 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={filteredData} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
            <CartesianGrid stroke="rgba(148, 163, 184, 0.08)" strokeDasharray="3 3" />
            <XAxis
              dataKey="umur"
              stroke="#64748B"
              fontSize={11}
              tickLine={false}
              unit=" bln"
              domain={[0, maxAge]}
            />
            <YAxis
              stroke="#64748B"
              fontSize={11}
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
              stroke="#22C55E"
              strokeWidth={2.5}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="sd_neg2"
              name="-2 SD (Batas Stunting/Kurang)"
              stroke="#EAB308"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="sd_neg3"
              name="-3 SD (Sangat Pendek/Buruk)"
              stroke="#EF4444"
              strokeWidth={1.5}
              dot={false}
              isAnimationActive={false}
            />

            {/* Child Marker */}
            {umurBulan <= maxAge && (
              <ReferenceDot
                x={umurBulan}
                y={currentVal}
                r={7}
                fill="#38BDF8"
                stroke="#FFFFFF"
                strokeWidth={2.5}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Legend & Guide Bar */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          padding: "10px 14px",
          borderRadius: 12,
          background: "rgba(15, 23, 42, 0.5)",
          fontSize: 11,
          color: "#94A3B8",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#38BDF8", border: "1.5px solid white" }} />
          <span style={{ color: "#F1F5F9", fontWeight: 600 }}>Posisi Balita</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 16, height: 3, background: "#22C55E", borderRadius: 2 }} />
          <span>Median WHO (Ideal)</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 16, height: 2, background: "#EAB308", borderTop: "1px dashed #EAB308" }} />
          <span>Batas Waspada (-2 SD)</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 16, height: 2, background: "#EF4444" }} />
          <span>Batas Kritis / Stunting (-3 SD)</span>
        </div>
      </div>

      {/* Cadre Note */}
      <div style={{ display: "flex", gap: 8, fontSize: 11, color: "#64748B", alignItems: "flex-start" }}>
        <Info size={14} color="#64748B" style={{ flexShrink: 0, marginTop: 1 }} />
        <span>
          Grafik dihitung berdasarkan standar WHO Child Growth Standards 2006. Pita di antara -2 SD dan +2 SD
          menunjukkan laju tumbuh kembang yang sehat dan optimal.
        </span>
      </div>
    </div>
  );
}
