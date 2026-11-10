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
import { getGrowthCurveData, calculateFullAntropometri, type GrowthPoint } from "@/lib/who-data";
import {
  Ruler, Scale, AlertTriangle, CheckCircle2, Info, History
} from "lucide-react";
import type { PenimbanganRecord } from "@/components/balita/RiwayatData";

export interface GrowthChartProps {
  namaAnak?: string;
  jenisKelamin: "L" | "P";
  umurBulan: number;
  beratKg: number;
  tinggiCm: number;
  initialIndicator?: "bbu" | "pbu";
  riwayat?: PenimbanganRecord[];
  tanggalLahir?: string;
  namaIbu?: string;
  posyanduNama?: string;
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
        fontSize: 12.5,
        color: "#0F172A",
        minWidth: 230,
      }}
    >
      <div style={{ fontWeight: 800, fontSize: 13.5, marginBottom: 8, color: "#0F172A", borderBottom: "1px solid #E2E8F0", paddingBottom: 6 }}>
        Usia Balita: <span style={{ color: "#16A34A" }}>{label} Bulan</span>
      </div>

      {childPoint && childPoint.value !== null && childPoint.value !== undefined && (
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, color: "#0284C7", fontWeight: 700, marginBottom: 6 }}>
          <span>{currentChildName || "Ukuran Anak"}:</span>
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
          <span>Batas Kritis / BGM (-3 SD):</span>
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
  riwayat = [],
}: GrowthChartProps) {
  const [indicator, setIndicator] = useState<"bbu" | "pbu">(initialIndicator);
  const [maxAge, setMaxAge] = useState<24 | 60>(umurBulan <= 24 ? 24 : 60);

  const currentVal = indicator === "bbu" ? beratKg : tinggiCm;
  const unit = indicator === "bbu" ? "kg" : "cm";

  // Urutkan riwayat penimbangan dari kunjungan awal ke terkini
  const sortedRiwayat = useMemo(() => {
    if (!riwayat || riwayat.length === 0) return [];
    return [...riwayat].sort((a, b) => {
      if (a.umurBulan !== b.umurBulan) return a.umurBulan - b.umurBulan;
      return new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime();
    });
  }, [riwayat]);

  // Evaluasi Tren KBM (Kenaikan Berat Minimal) dari riwayat
  const evaluasiKBM = useMemo(() => {
    if (sortedRiwayat.length < 2) {
      return { status: "awal", label: "Pengukuran Awal", deltaBB: null, is2T: false };
    }
    const len = sortedRiwayat.length;
    const latest = sortedRiwayat[len - 1];
    const prev = sortedRiwayat[len - 2];
    const deltaBB = Number((latest.beratKg - prev.beratKg).toFixed(2));

    // Cek apakah 2x berturut-turut tidak naik (2T)
    let is2T = false;
    if (len >= 3) {
      const prev2 = sortedRiwayat[len - 3];
      const deltaPrev = Number((prev.beratKg - prev2.beratKg).toFixed(2));
      if (deltaBB <= 0 && deltaPrev <= 0) {
        is2T = true;
      }
    } else if (deltaBB <= 0) {
      // 1x tidak naik
    }

    return {
      status: deltaBB > 0 ? "naik" : "turun",
      label: deltaBB > 0 ? `N (Naik +${deltaBB} kg)` : `T (Tidak Naik ${deltaBB} kg)`,
      deltaBB,
      is2T,
    };
  }, [sortedRiwayat]);

  // Evaluasi klasifikasi WHO terkini
  const whoClassification = useMemo(() => {
    return calculateFullAntropometri({
      umur_bulan: umurBulan,
      berat_kg: beratKg,
      tinggi_cm: tinggiCm,
      jenis_kelamin: jenisKelamin,
    });
  }, [umurBulan, beratKg, tinggiCm, jenisKelamin]);

  // Data kurva WHO
  const rawData = useMemo(() => {
    return getGrowthCurveData(indicator, jenisKelamin, {
      umur_bulan: umurBulan,
      nilai: currentVal,
    });
  }, [indicator, jenisKelamin, umurBulan, currentVal]);

  // Gabungkan titik WHO dengan riwayat penimbangan
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

  // Evaluasi status titik balita terhadap kurva aktif
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
        padding: "22px 24px",
        display: "flex",
        flexDirection: "column",
        gap: 18,
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
      }}
    >
      {/* ── 1. KARTU IDENTITAS BALITA & METRIK CEPAT (SEJAJAR & TIDAK BERTUMPUK) ── */}
      <div
        style={{
          background: "#F8FAFC",
          border: "1px solid #E2E8F0",
          borderRadius: 12,
          padding: "14px 18px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 14,
          alignItems: "center",
        }}
      >
        {/* Kolom 1: Profil Anak */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 3 }}>
            Data Anak Terpilih
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <span style={{ fontSize: 15, fontWeight: 800, color: "#0F172A" }}>
              {namaAnak || "Balita"}
            </span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                padding: "2px 7px",
                borderRadius: 5,
                background: jenisKelamin === "L" ? "#E0F2FE" : "#FCE7F3",
                color: jenisKelamin === "L" ? "#0369A1" : "#BE185D",
                border: `1px solid ${jenisKelamin === "L" ? "#BAE6FD" : "#FBCFE8"}`,
              }}
            >
              {jenisKelamin === "L" ? "♂ Laki-laki" : "♀ Perempuan"}
            </span>
          </div>
          <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>
            Usia Saat Ini: <strong style={{ color: "#334155" }}>{umurBulan} Bulan</strong>
          </div>
        </div>

        {/* Kolom 2: Pengukuran Terkini */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 3 }}>
            Pengukuran Terkini
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>
            BB: <strong style={{ color: "#16A34A" }}>{beratKg} kg</strong> &nbsp;|&nbsp; TB: <strong style={{ color: "#0284C7" }}>{tinggiCm} cm</strong>
          </div>
          <div style={{ fontSize: 11.5, color: "#64748B", marginTop: 2 }}>
            Indikator Aktif: <strong>{indicator === "bbu" ? "Berat Badan" : "Tinggi Badan"}</strong>
          </div>
        </div>

        {/* Kolom 3: Status Antropometri WHO */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 }}>
            Status Gizi WHO
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                padding: "3px 9px",
                borderRadius: 6,
                background:
                  whoClassification.ada_risiko_wasting || (whoClassification.pbu.zscore < -3)
                    ? "#FEE2E2"
                    : whoClassification.ada_risiko_stunting || whoClassification.ada_risiko_underweight
                    ? "#FEF3C7"
                    : "#DCFCE7",
                color:
                  whoClassification.ada_risiko_wasting || (whoClassification.pbu.zscore < -3)
                    ? "#991B1B"
                    : whoClassification.ada_risiko_stunting || whoClassification.ada_risiko_underweight
                    ? "#92400E"
                    : "#15803D",
                border: `1px solid ${
                  whoClassification.ada_risiko_wasting || (whoClassification.pbu.zscore < -3)
                    ? "#FECACA"
                    : whoClassification.ada_risiko_stunting || whoClassification.ada_risiko_underweight
                    ? "#FDE68A"
                    : "#BBF7D0"
                }`,
              }}
            >
              {whoClassification.ada_risiko_stunting
                ? "Risiko Stunting"
                : whoClassification.ada_risiko_wasting
                ? "Gizi Kurang (Wasting)"
                : whoClassification.ada_risiko_underweight
                ? "Berat Badan Kurang"
                : "Gizi Baik (Normal)"}
            </span>
          </div>
        </div>

        {/* Kolom 4: Tren Kenaikan (KBM) */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 3 }}>
            Tren Pertumbuhan KMS
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {evaluasiKBM.status === "awal" ? (
              <span style={{ fontSize: 12, fontWeight: 600, color: "#64748B" }}>
                Pengukuran Pertama
              </span>
            ) : (
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  padding: "3px 9px",
                  borderRadius: 6,
                  background: evaluasiKBM.status === "naik" ? "#DCFCE7" : "#FEE2E2",
                  color: evaluasiKBM.status === "naik" ? "#15803D" : "#991B1B",
                  border: `1px solid ${evaluasiKBM.status === "naik" ? "#BBF7D0" : "#FECACA"}`,
                }}
              >
                {evaluasiKBM.label}
              </span>
            )}
            {evaluasiKBM.is2T && (
              <span style={{ fontSize: 10.5, fontWeight: 800, background: "#DC2626", color: "#FFFFFF", padding: "2px 6px", borderRadius: 4 }}>
                Waspada 2T
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── 2. TOOLBAR KONTROL GRAFIK (INTEGRATED & CLEAN) ── */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
        }}
      >
        {/* Toggle Pilihan Kurva: PB/U vs BB/U */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: "#475569" }}>Pilihan Indikator:</span>
          <div style={{ display: "inline-flex", background: "#F1F5F9", padding: 3, borderRadius: 8, border: "1px solid #E2E8F0" }}>
            <button
              type="button"
              onClick={() => setIndicator("pbu")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 14px",
                borderRadius: 6,
                border: "none",
                background: indicator === "pbu" ? "#16A34A" : "transparent",
                color: indicator === "pbu" ? "#FFFFFF" : "#64748B",
                fontWeight: 700,
                fontSize: 12.5,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              <Ruler size={14} />
              <span>Panjang / Tinggi Badan (PB/U)</span>
            </button>
            <button
              type="button"
              onClick={() => setIndicator("bbu")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 14px",
                borderRadius: 6,
                border: "none",
                background: indicator === "bbu" ? "#16A34A" : "transparent",
                color: indicator === "bbu" ? "#FFFFFF" : "#64748B",
                fontWeight: 700,
                fontSize: 12.5,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              <Scale size={14} />
              <span>Berat Badan (BB/U)</span>
            </button>
          </div>
        </div>

        {/* Toggle Rentang Usia: 0-24 vs 0-60 */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: "#475569" }}>Rentang Usia:</span>
          <div style={{ display: "inline-flex", background: "#F1F5F9", padding: 3, borderRadius: 8, border: "1px solid #E2E8F0" }}>
            <button
              type="button"
              onClick={() => setMaxAge(24)}
              style={{
                padding: "6px 12px",
                borderRadius: 6,
                border: "none",
                background: maxAge === 24 ? "#FFFFFF" : "transparent",
                color: maxAge === 24 ? "#0F172A" : "#64748B",
                fontWeight: 700,
                fontSize: 12,
                cursor: "pointer",
                boxShadow: maxAge === 24 ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                transition: "all 0.15s ease",
              }}
            >
              0 – 24 Bulan
            </button>
            <button
              type="button"
              onClick={() => setMaxAge(60)}
              style={{
                padding: "6px 12px",
                borderRadius: 6,
                border: "none",
                background: maxAge === 60 ? "#FFFFFF" : "transparent",
                color: maxAge === 60 ? "#0F172A" : "#64748B",
                fontWeight: 700,
                fontSize: 12,
                cursor: "pointer",
                boxShadow: maxAge === 60 ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                transition: "all 0.15s ease",
              }}
            >
              0 – 60 Bulan
            </button>
          </div>
        </div>
      </div>

      {/* ── 3. STATUS PEMBACAAN KURVA KMS (KOMPAK & EDUKATIF) ── */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 12,
          padding: "12px 16px",
          borderRadius: 10,
          background:
            zStatus === "kritis"
              ? "#FEF2F2"
              : zStatus === "kurang"
              ? "#FFFBEB"
              : "#F0FDF4",
          border: `1px solid ${
            zStatus === "kritis"
              ? "#FECACA"
              : zStatus === "kurang"
              ? "#FDE68A"
              : "#BBF7D0"
          }`,
        }}
      >
        {zStatus === "normal" ? (
          <CheckCircle2 size={20} color="#16A34A" style={{ flexShrink: 0, marginTop: 1 }} />
        ) : (
          <AlertTriangle size={20} color={zStatus === "kritis" ? "#DC2626" : "#D97706"} style={{ flexShrink: 0, marginTop: 1 }} />
        )}
        <div style={{ fontSize: 13, color: "#1E293B", lineHeight: 1.55 }}>
          <strong>Hasil Analisis Kurva {indicator === "bbu" ? "BB/U" : "PB/U"}: </strong>
          Pada usia <strong>{umurBulan} bulan</strong>, ukuran balita adalah{" "}
          <strong style={{ color: zStatus === "kritis" ? "#B91C1C" : zStatus === "kurang" ? "#B45309" : "#15803D" }}>
            {currentVal} {unit}
          </strong>.{" "}
          {zStatus === "normal" && "Posisi titik berada dalam rentang pita pertumbuhan ideal WHO (Zona Hijau). Lanjutkan pemantauan rutin bulan depan."}
          {zStatus === "kurang" &&
            (indicator === "pbu"
              ? "Posisi titik berada di bawah -2 SD (Terindikasi Stunting). Disarankan konseling gizi dan intervensi protein hewani harian."
              : "Posisi titik berada di bawah -2 SD (Berat Badan Kurang / Underweight). Berikan kudapan padat kalori di antara waktu makan utama.")}
          {zStatus === "kritis" &&
            (indicator === "pbu"
              ? "Posisi titik berada di bawah -3 SD (Stunting Berat / Sangat Pendek). Memerlukan rujukan ke Bidan Desa atau Puskesmas segera."
              : "Posisi titik berada di bawah -3 SD (Gizi Buruk / Bawah Garis Merah). Wajib segera ditangani oleh dokter Puskesmas.")}
          {zStatus === "lebih" && "Posisi titik berada di atas +2 SD (Risiko Berat/Tinggi Lebih). Jaga variasi makanan seimbang dan hindari pemanis berlebih."}
        </div>
      </div>

      {/* ── 4. CHART RECHARTS (TINGGI 380PX, TIDAK GEPENG) ── */}
      <div style={{ width: "100%", height: 380, marginTop: 4 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={filteredData} margin={{ top: 12, right: 18, left: -6, bottom: 4 }}>
            <CartesianGrid stroke="#F1F5F9" strokeDasharray="3 3" />
            <XAxis
              dataKey="umur"
              stroke="#64748B"
              fontSize={11.5}
              fontWeight={600}
              tickLine={false}
              unit=" bln"
              domain={[0, maxAge]}
            />
            <YAxis
              stroke="#64748B"
              fontSize={11.5}
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
              stroke="#CBD5E1"
              strokeDasharray="4 4"
              strokeWidth={1}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="sd_pos2"
              name="+2 SD (Batas Atas)"
              stroke="#94A3B8"
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
              name="-3 SD (Batas Kritis / BGM)"
              stroke="#DC2626"
              strokeDasharray="3 3"
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
              strokeWidth={3.5}
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

      {/* ── 5. LEGENDA RESMI BUKU KIA KEMENKES (CLEAN & MINIMALIS) ── */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "center",
          gap: 18,
          padding: "10px 14px",
          background: "#F8FAFC",
          borderRadius: 8,
          fontSize: 12,
          color: "#334155",
          fontWeight: 600,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ width: 14, height: 14, borderRadius: "50%", background: "#0284C7", border: "2px solid #FFFFFF", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
          <span style={{ color: "#0284C7", fontWeight: 700 }}>Jejak Balita (KMS)</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ width: 18, height: 3, background: "#16A34A", borderRadius: 2 }} />
          <span>Median WHO (Ideal)</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ width: 18, height: 2.5, background: "#D97706", borderTop: "2.5px dashed #D97706" }} />
          <span>Waspada (-2 SD)</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ width: 18, height: 2.5, background: "#DC2626", borderTop: "2.5px dashed #DC2626" }} />
          <span>Kritis / BGM (-3 SD)</span>
        </div>
      </div>

      {/* ── 6. TABEL HISTORI PENIMBANGAN & EVALUASI KBM ── */}
      {sortedRiwayat.length > 0 && (
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: 12,
            border: "1px solid #E2E8F0",
            overflow: "hidden",
            marginTop: 4,
          }}
        >
          <div
            style={{
              padding: "12px 16px",
              background: "#F8FAFC",
              borderBottom: "1px solid #E2E8F0",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <History size={16} color="#16A34A" />
              <span style={{ fontSize: 13, fontWeight: 800, color: "#0F172A" }}>
                Histori Buku KIA & Kenaikan Timbangan ({sortedRiwayat.length} Kunjungan Posyandu)
              </span>
            </div>
            <span style={{ fontSize: 11.5, color: "#64748B", fontWeight: 600 }}>
              KBM: N = Naik, T = Turun / Tidak Naik
            </span>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0", textAlign: "left", color: "#475569" }}>
                  <th style={{ padding: "8px 12px", fontWeight: 700 }}>Kunjungan</th>
                  <th style={{ padding: "8px 12px", fontWeight: 700 }}>Tanggal Timbang</th>
                  <th style={{ padding: "8px 12px", fontWeight: 700 }}>Usia</th>
                  <th style={{ padding: "8px 12px", fontWeight: 700 }}>Berat Badan (kg)</th>
                  <th style={{ padding: "8px 12px", fontWeight: 700 }}>Tinggi / PB (cm)</th>
                  <th style={{ padding: "8px 12px", fontWeight: 700 }}>Evaluasi KBM</th>
                  <th style={{ padding: "8px 12px", fontWeight: 700 }}>Status Berat (BB/U)</th>
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
                        borderBottom: "1px solid #F1F5F9",
                        background: isLatest ? "#F0FDF4" : "transparent",
                      }}
                    >
                      <td style={{ padding: "9px 12px", fontWeight: 700, color: "#0F172A" }}>
                        #{idx + 1}
                        {isLatest && (
                          <span style={{ fontSize: 10, color: "#16A34A", background: "#DCFCE7", padding: "1px 6px", borderRadius: 4, marginLeft: 6, fontWeight: 700 }}>
                            Terkini
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "9px 12px", color: "#334155", fontWeight: 600 }}>{rec.tanggal}</td>
                      <td style={{ padding: "9px 12px", fontWeight: 700, color: "#0F172A" }}>{rec.umurBulan} Bulan</td>
                      <td style={{ padding: "9px 12px", fontWeight: 700, color: "#0F172A" }}>
                        {rec.beratKg} kg
                        {deltaBB !== null && (
                          <span
                            style={{
                              marginLeft: 5,
                              fontSize: 11,
                              fontWeight: 700,
                              color: deltaBB > 0 ? "#16A34A" : deltaBB === 0 ? "#D97706" : "#DC2626",
                            }}
                          >
                            ({deltaBB > 0 ? `+${deltaBB}` : deltaBB} kg)
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "9px 12px", fontWeight: 600, color: "#334155" }}>
                        {rec.tinggiCm} cm
                        {deltaTB !== null && (
                          <span style={{ marginLeft: 5, fontSize: 11, color: "#64748B" }}>
                            ({deltaTB > 0 ? `+${deltaTB}` : deltaTB} cm)
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "9px 12px" }}>
                        {deltaBB === null ? (
                          <span style={{ color: "#64748B", fontSize: 11, fontWeight: 600 }}>Awal</span>
                        ) : deltaBB > 0 ? (
                          <span style={{ fontSize: 11, fontWeight: 700, color: "#15803D", background: "#DCFCE7", border: "1px solid #BBF7D0", padding: "2px 7px", borderRadius: 5 }}>
                            N (Naik)
                          </span>
                        ) : (
                          <span style={{ fontSize: 11, fontWeight: 700, color: "#B91C1C", background: "#FEE2E2", border: "1px solid #FECACA", padding: "2px 7px", borderRadius: 5 }}>
                            T (Turun/Tetap)
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "9px 12px" }}>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            padding: "2px 7px",
                            borderRadius: 5,
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

      {/* ── 7. FOOTER NOTE ── */}
      <div style={{ display: "flex", gap: 8, fontSize: 12, color: "#64748B", alignItems: "flex-start", lineHeight: 1.5, borderTop: "1px solid #F1F5F9", paddingTop: 12 }}>
        <Info size={15} color="#16A34A" style={{ flexShrink: 0, marginTop: 1 }} />
        <span>
          Grafik dipetakan menggunakan data resmi <strong style={{ color: "#334155" }}>WHO Child Growth Standards 2006</strong>. Garis hijau merupakan median pertumbuhan ideal. Apabila titik anak mendekati garis waspada (-2 SD), kader wajib memberikan pendampingan pola makan.
        </span>
      </div>
    </div>
  );
}
