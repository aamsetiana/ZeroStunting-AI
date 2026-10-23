"use client";

import { useState, useMemo } from "react";
import {
  MapPin, ChevronRight, Stethoscope, Utensils, Calendar
} from "lucide-react";

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
  statusZona: "aman" | "waspada" | "prioritas";
  rekomendasiAksi: string;
  svgPath: string; // Path SVG untuk peta wilayah
  center: { x: number; y: number }; // Koordinat label pin
}

const DATA_DUSUN_DESA: DusunData[] = [
  {
    id: "krajan",
    nama: "Dusun Krajan",
    posyandu: "Posyandu Melati 01",
    rtRw: "RT 01 - 05 / RW 01",
    bidanPj: "Bdn. Siti Rahayu, A.Md.Keb",
    kaderPj: "Ibu Sri Rejeki & Ibu Aminah",
    totalBalita: 58,
    balitaDitimbang: 56,
    stuntingCount: 6,
    wastingCount: 2,
    underweightCount: 4,
    prevalensiStunting: 10.7,
    statusZona: "prioritas",
    rekomendasiAksi: "Intervensi mendesak: Kunjungan rumah bersama Bidan Desa untuk 6 balita terindikasi pendek dan penyaluran paket PMT tinggi protein.",
    svgPath: "M 40 40 L 220 30 L 260 180 L 160 260 L 30 200 Z",
    center: { x: 130, y: 130 },
  },
  {
    id: "sukamaju",
    nama: "Dusun Sukamaju",
    posyandu: "Posyandu Mawar 02",
    rtRw: "RT 01 - 04 / RW 02",
    bidanPj: "Bdn. Dewi Lestari, S.Tr.Keb",
    kaderPj: "Ibu Nurul & Ibu Wardah",
    totalBalita: 46,
    balitaDitimbang: 44,
    stuntingCount: 3,
    wastingCount: 1,
    underweightCount: 2,
    prevalensiStunting: 6.8,
    statusZona: "waspada",
    rekomendasiAksi: "Edukasi sanitasi lingkungan rumah tangga dan pendampingan pemberian MP-ASI kaya hewani untuk balita berisiko.",
    svgPath: "M 220 30 L 460 50 L 480 210 L 260 180 Z",
    center: { x: 350, y: 120 },
  },
  {
    id: "mekarsari",
    nama: "Dusun Mekarsari",
    posyandu: "Posyandu Anggrek 03",
    rtRw: "RT 01 - 06 / RW 03",
    bidanPj: "Bdn. Siti Rahayu, A.Md.Keb",
    kaderPj: "Ibu Kustiyah & Ibu Linda",
    totalBalita: 52,
    balitaDitimbang: 51,
    stuntingCount: 1,
    wastingCount: 0,
    underweightCount: 1,
    prevalensiStunting: 1.9,
    statusZona: "aman",
    rekomendasiAksi: "Pertahankan capaian D/S di atas 95% dan perkuat kelas ibu balita bulanan.",
    svgPath: "M 160 260 L 260 180 L 480 210 L 440 370 L 190 380 Z",
    center: { x: 320, y: 280 },
  },
  {
    id: "tanjungsari",
    nama: "Dusun Tanjungsari",
    posyandu: "Posyandu Cempaka 04",
    rtRw: "RT 01 - 04 / RW 04",
    bidanPj: "Bdn. Dewi Lestari, S.Tr.Keb",
    kaderPj: "Ibu Hartini & Ibu Rusmini",
    totalBalita: 40,
    balitaDitimbang: 38,
    stuntingCount: 2,
    wastingCount: 1,
    underweightCount: 1,
    prevalensiStunting: 5.3,
    statusZona: "waspada",
    rekomendasiAksi: "Pemantauan rutin kenaikan berat badan balita tidak naik (T) 2 kali berturut-turut pada sesi posyandu berikutnya.",
    svgPath: "M 30 200 L 160 260 L 190 380 L 50 370 Z",
    center: { x: 110, y: 300 },
  },
];

export function PetaStunting() {
  const [selectedDusunId, setSelectedDusunId] = useState<string>("krajan");
  const [indikatorPeta, setIndikatorPeta] = useState<"stunting" | "wasting" | "underweight">("stunting");
  const [filterZona, setFilterZona] = useState<string>("semua");

  // Dusun terpilih untuk panel detail
  const selectedDusun = useMemo(() => {
    return DATA_DUSUN_DESA.find((d) => d.id === selectedDusunId) || DATA_DUSUN_DESA[0];
  }, [selectedDusunId]);

  // Statistik agregat desa
  const totalDesaBalita = DATA_DUSUN_DESA.reduce((sum, d) => sum + d.totalBalita, 0);
  const totalDesaDitimbang = DATA_DUSUN_DESA.reduce((sum, d) => sum + d.balitaDitimbang, 0);
  const totalDesaStunting = DATA_DUSUN_DESA.reduce((sum, d) => sum + d.stuntingCount, 0);
  const prevalensiRataDesa = Number(((totalDesaStunting / totalDesaDitimbang) * 100).toFixed(1));

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
    if (filterZona === "semua") return DATA_DUSUN_DESA;
    return DATA_DUSUN_DESA.filter((d) => d.statusZona === filterZona);
  }, [filterZona]);

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
            Visualisasi wilayah sebaran prevalensi stunting dan fokus prioritas intervensi gizi per dusun.
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
            Periode: Oktober 2026
          </div>
          <span style={{ color: "#CBD5E1" }}>•</span>
          <div style={{ fontSize: 13, color: "#475569", fontWeight: 600 }}>
            Desa Sukamaju
          </div>
        </div>
      </div>

      {/* ── KARTU RINGKASAN AGREGAT DESA ── */}
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
          <div style={{ fontSize: 13, color: "#16A34A", fontWeight: 700, marginTop: 4 }}>
            {totalDesaDitimbang} anak ditimbang ({((totalDesaDitimbang / totalDesaBalita) * 100).toFixed(1)}% D/S)
          </div>
        </div>

        <div style={{
          background: "#FFFFFF", border: "1.5px solid #E2E8F0", borderRadius: 14, padding: "16px 18px",
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#64748B", marginBottom: 6 }}>
            PREVALENSI STUNTING DESA
          </div>
          <div style={{ fontSize: 26, fontWeight: 900, color: prevalensiRataDesa > 10 ? "#DC2626" : "#D97706" }}>
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
              1 Merah
            </span>
            <span style={{
              background: "#FEF3C7", color: "#B45309", fontWeight: 800, fontSize: 13,
              padding: "4px 10px", borderRadius: 8,
            }}>
              2 Kuning
            </span>
            <span style={{
              background: "#DCFCE7", color: "#15803D", fontWeight: 800, fontSize: 13,
              padding: "4px 10px", borderRadius: 8,
            }}>
              1 Hijau
            </span>
          </div>
          <div style={{ fontSize: 13, color: "#64748B", marginTop: 8 }}>
            Target: Seluruh dusun mencapai zona hijau (stunting &lt; 5%)
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
                Peta Wilayah Dusun Desa Sukamaju
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
              {DATA_DUSUN_DESA.map((dusun) => {
                const isSelected = selectedDusunId === dusun.id;
                const style = getZonaStyle(dusun.statusZona, isSelected);

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
                      strokeDasharray={isSelected ? "none" : "none"}
                      filter={isSelected ? "url(#shadow)" : undefined}
                      style={{ transition: "all 0.2s ease" }}
                    />

                    {/* Pin Label Nama Dusun & Prevalensi */}
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
                      {dusun.stuntingCount}
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
                      {dusun.prevalensiStunting}% Stunting
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
                <span>Hijau: Prevalensi &lt; 5% (Aman)</span>
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
            marginBottom: 18,
          }}>
            <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 12, color: "#64748B", fontWeight: 700 }}>PREVALENSI STUNTING</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: selectedDusun.prevalensiStunting > 10 ? "#DC2626" : "#D97706", marginTop: 2 }}>
                {selectedDusun.prevalensiStunting}%
              </div>
              <div style={{ fontSize: 12, color: "#475569", marginTop: 2 }}>
                {selectedDusun.stuntingCount} dari {selectedDusun.balitaDitimbang} anak
              </div>
            </div>

            <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 12, color: "#64748B", fontWeight: 700 }}>CAKUPAN TIMBANG (D/S)</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: "#0F172A", marginTop: 2 }}>
                {((selectedDusun.balitaDitimbang / selectedDusun.totalBalita) * 100).toFixed(1)}%
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
              <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>Indikator BB/TB</div>
            </div>

            <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 12, color: "#64748B", fontWeight: 700 }}>BERAT KURANG (UNDERWEIGHT)</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#0F172A", marginTop: 2 }}>
                {selectedDusun.underweightCount} <span style={{ fontSize: 12, color: "#64748B" }}>anak</span>
              </div>
              <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>Indikator BB/U</div>
            </div>
          </div>

          {/* Tim Pelaksana Posyandu & Bidan */}
          <div style={{
            background: "#F0FDF4",
            border: "1px solid #DCFCE7",
            borderRadius: 10,
            padding: "12px 14px",
            marginBottom: 16,
          }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "#15803D", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
              <Stethoscope size={14} /> Tim Pendamping Wilayah:
            </div>
            <div style={{ fontSize: 13, color: "#0F172A", marginBottom: 3 }}>
              Bidan Desa: <strong>{selectedDusun.bidanPj}</strong>
            </div>
            <div style={{ fontSize: 13, color: "#0F172A" }}>
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
            <div style={{ fontSize: 12, fontWeight: 800, color: "#B45309", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
              <Utensils size={14} /> Rekomendasi Rencana Aksi Intervensi:
            </div>
            <p style={{ fontSize: 13, color: "#78350F", margin: 0, lineHeight: 1.5 }}>
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
              Diurutkan berdasarkan urgensi prevalensi stunting tertinggi
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
                        {((dusun.balitaDitimbang / dusun.totalBalita) * 100).toFixed(1)}% D/S
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
