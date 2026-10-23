"use client";

import React, { useState, useMemo } from "react";
import {
  FileText, Download, Printer, Filter, Calendar, MapPin,
  CheckCircle, AlertTriangle, Users, TrendingUp, TrendingDown,
  Search, ArrowDownToLine, RefreshCw, ChevronDown
} from "lucide-react";
import { INITIAL_BALITA, type BalitaItem } from "@/components/balita/RiwayatData";

export function LaporanEppgbm() {
  const [selectedBulan, setSelectedBulan] = useState("Okt 2026");
  const [selectedDusun, setSelectedDusun] = useState("all");
  const [filterKategori, setFilterKategori] = useState<"all" | "rujukan" | "waspada" | "normal">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Daftar dusun unik
  const dusunList = useMemo(() => {
    const setD = new Set<string>();
    INITIAL_BALITA.forEach((b) => setD.add(b.dusun.split(" (")[0]));
    return Array.from(setD);
  }, []);

  // Filter data balita berdasarkan dusun, kategori, dan query pencarian
  const filteredBalita = useMemo(() => {
    return INITIAL_BALITA.filter((b) => {
      if (selectedDusun !== "all" && !b.dusun.startsWith(selectedDusun)) return false;
      if (filterKategori !== "all" && b.statusGizi !== filterKategori) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchNama = b.nama.toLowerCase().includes(q);
        const matchIbu = b.namaIbu.toLowerCase().includes(q);
        const matchNik = b.nik && b.nik.includes(q);
        if (!matchNama && !matchIbu && !matchNik) return false;
      }
      return true;
    });
  }, [selectedDusun, filterKategori, searchQuery]);

  // Statistik Indikator SKDN Posyandu (Standar Kemenkes RI)
  const skdn = useMemo(() => {
    const S = 42; // Total sasaran balita terdaftar di wilayah posyandu
    const K = 42; // Jumlah balita yang memiliki Buku KIA / KMS (100%)
    const D = INITIAL_BALITA.length; // Jumlah balita yang ditimbang bulan ini (hadir)
    // Balita dengan status tumbuh 'N' (Naik) pada riwayat terakhir
    const N = INITIAL_BALITA.filter(
      (b) => b.riwayat.length > 0 && b.riwayat[0].statusTumbuh === "N"
    ).length;

    const rujukanCount = INITIAL_BALITA.filter((b) => b.statusGizi === "rujukan").length;
    const waspadaCount = INITIAL_BALITA.filter((b) => b.statusGizi === "waspada").length;
    const normalCount = INITIAL_BALITA.filter((b) => b.statusGizi === "normal").length;

    return {
      S,
      K,
      D,
      N,
      persenD_S: ((D / S) * 100).toFixed(1),
      persenN_D: ((N / D) * 100).toFixed(1),
      persenK_S: ((K / S) * 100).toFixed(1),
      rujukanCount,
      waspadaCount,
      normalCount,
    };
  }, []);

  // Export CSV sesuai format impor e-PPGBM Kemenkes
  const handleExportCSV = () => {
    const headers = [
      "No",
      "NIK",
      "Nama Balita",
      "Jenis Kelamin",
      "Tanggal Lahir",
      "Umur (Bulan)",
      "Nama Ibu",
      "Dusun / RT",
      "Tanggal Timbang",
      "Berat Badan (kg)",
      "Tinggi Badan (cm)",
      "Status Tumbuh",
      "Status Gizi WHO",
    ];

    const rows = filteredBalita.map((b, idx) => {
      const lastR = b.riwayat[0];
      return [
        idx + 1,
        `"${b.nik || "-"}"`,
        `"${b.nama}"`,
        b.jenisKelamin === "L" ? "Laki-laki" : "Perempuan",
        b.tanggalLahir,
        b.umurBulan,
        `"${b.namaIbu}"`,
        `"${b.dusun}"`,
        lastR ? lastR.tanggal : b.terakhirTimbang,
        b.beratTerakhir,
        b.tinggiTerakhir,
        lastR ? (lastR.statusTumbuh === "N" ? "Naik" : "Turun / Tetap") : "Naik",
        `"${b.labelStatus}"`,
      ];
    });

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Laporan_ePPGBM_Posyandu_Melati_${selectedBulan.replace(" ", "_")}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Cetak Laporan (Window Print)
  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ maxWidth: 1040, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>
      {/* ── 1. HEADER LAPORAN & KONTROL AKSI ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{
              fontSize: 12, fontWeight: 800, color: "#16A34A",
              background: "#DCFCE7", padding: "3px 10px", borderRadius: 6
            }}>
              FORMAT RESMI PUSKESMAS & KEMENKES
            </span>
            <span style={{ fontSize: 13, color: "#64748B", fontWeight: 600 }}>
              Periode: {selectedBulan}
            </span>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0F172A", margin: "0 0 6px 0" }}>
            Rekapitulasi Laporan e-PPGBM Posyandu
          </h1>
          <p style={{ fontSize: 14, color: "#475569", margin: 0, lineHeight: 1.5 }}>
            Data hasil pemantauan pertumbuhan bulanan, cakupan SKDN, dan deteksi dini risiko stunting di Posyandu Melati 01.
          </p>
        </div>

        {/* Tombol Ekspor & Cetak */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={handleExportCSV}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "9px 16px",
              borderRadius: 8,
              border: "1.5px solid #CBD5E1",
              background: "#FFFFFF",
              color: "#0F172A",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <Download size={16} color="#0F172A" /> Ekspor CSV (e-PPGBM)
          </button>
          <button
            type="button"
            onClick={handlePrint}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "9px 18px",
              borderRadius: 8,
              border: "none",
              background: "#16A34A",
              color: "#FFFFFF",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 2px 6px rgba(22, 163, 74, 0.25)",
              transition: "all 0.15s ease",
            }}
          >
            <Printer size={16} color="#FFFFFF" /> Cetak Laporan
          </button>
        </div>
      </div>

      {/* ── 2. INDIKATOR KINERJA SKDN (Standar Pelayanan Posyandu) ── */}
      <div
        style={{
          background: "#FFFFFF",
          border: "1px solid #E2E8F0",
          borderRadius: 14,
          padding: "18px 22px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 18,
        }}
      >
        {/* S (Sasaran) */}
        <div>
          <div style={{ fontSize: 13, color: "#64748B", fontWeight: 700 }}>SASARAN TOTAL (S)</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 4 }}>
            <span style={{ fontSize: 26, fontWeight: 800, color: "#0F172A" }}>{skdn.S}</span>
            <span style={{ fontSize: 13, color: "#64748B" }}>Balita di Wilayah</span>
          </div>
          <div style={{ fontSize: 12, color: "#475569", marginTop: 4 }}>
            Buku KIA (K): <strong>{skdn.K}</strong> ({skdn.persenK_S}%)
          </div>
        </div>

        {/* D (Ditimbang) / Partisipasi D/S */}
        <div>
          <div style={{ fontSize: 13, color: "#64748B", fontWeight: 700 }}>PARTISIPASI TIMBANG (D/S)</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 4 }}>
            <span style={{ fontSize: 26, fontWeight: 800, color: "#16A34A" }}>{skdn.persenD_S}%</span>
            <span style={{ fontSize: 13, color: "#64748B" }}>({skdn.D}/{skdn.S} Anak)</span>
          </div>
          <div style={{ fontSize: 12, color: "#15803D", fontWeight: 600, marginTop: 4 }}>
            ✓ Melebihi target nasional (80%)
          </div>
        </div>

        {/* N (Berat Naik) / N/D */}
        <div>
          <div style={{ fontSize: 13, color: "#64748B", fontWeight: 700 }}>TINGKAT KEBERHASILAN (N/D)</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 4 }}>
            <span style={{ fontSize: 26, fontWeight: 800, color: "#0284C7" }}>{skdn.persenN_D}%</span>
            <span style={{ fontSize: 13, color: "#64748B" }}>({skdn.N}/{skdn.D} Naik)</span>
          </div>
          <div style={{ fontSize: 12, color: "#475569", marginTop: 4 }}>
            Balita berat badan naik di kurva KMS
          </div>
        </div>

        {/* Deteksi Status Stunting & Rujukan */}
        <div>
          <div style={{ fontSize: 13, color: "#64748B", fontWeight: 700 }}>PERLU PERHATIAN KHUSUS</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6 }}>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              padding: "4px 10px", borderRadius: 6, fontSize: 13, fontWeight: 800,
              background: "#FEE2E2", color: "#B91C1C", border: "1px solid #FECACA"
            }}>
              {skdn.rujukanCount} Rujukan
            </span>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              padding: "4px 10px", borderRadius: 6, fontSize: 13, fontWeight: 800,
              background: "#FEF3C7", color: "#B45309", border: "1px solid #FDE68A"
            }}>
              {skdn.waspadaCount} Waspada
            </span>
          </div>
          <div style={{ fontSize: 12, color: "#64748B", marginTop: 6 }}>
            {skdn.normalCount} Balita status gizi baik
          </div>
        </div>
      </div>

      {/* ── 3. FILTER & PENCARIAN REKAPITULASI ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        {/* Filter Dusun & Kategori Status */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {/* Filter Dusun */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#475569" }}>Dusun:</span>
            <select
              value={selectedDusun}
              onChange={(e) => setSelectedDusun(e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                border: "1.5px solid #CBD5E1",
                fontSize: 13,
                fontWeight: 700,
                color: "#0F172A",
                background: "#FFFFFF",
                cursor: "pointer",
                outline: "none",
              }}
            >
              <option value="all">Semua Dusun ({INITIAL_BALITA.length} Anak)</option>
              {dusunList.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Segmented Filter Status Gizi */}
          <div style={{ display: "inline-flex", background: "#F1F5F9", padding: 3, borderRadius: 8 }}>
            <button
              type="button"
              onClick={() => setFilterKategori("all")}
              style={{
                padding: "6px 12px",
                borderRadius: 6,
                border: "none",
                background: filterKategori === "all" ? "#FFFFFF" : "transparent",
                color: filterKategori === "all" ? "#0F172A" : "#64748B",
                fontWeight: 700,
                fontSize: 13,
                cursor: "pointer",
                boxShadow: filterKategori === "all" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              }}
            >
              Semua ({INITIAL_BALITA.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterKategori("rujukan")}
              style={{
                padding: "6px 12px",
                borderRadius: 6,
                border: "none",
                background: filterKategori === "rujukan" ? "#FFFFFF" : "transparent",
                color: filterKategori === "rujukan" ? "#B91C1C" : "#64748B",
                fontWeight: 700,
                fontSize: 13,
                cursor: "pointer",
                boxShadow: filterKategori === "rujukan" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              }}
            >
              Rujukan ({skdn.rujukanCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterKategori("waspada")}
              style={{
                padding: "6px 12px",
                borderRadius: 6,
                border: "none",
                background: filterKategori === "waspada" ? "#FFFFFF" : "transparent",
                color: filterKategori === "waspada" ? "#B45309" : "#64748B",
                fontWeight: 700,
                fontSize: 13,
                cursor: "pointer",
                boxShadow: filterKategori === "waspada" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              }}
            >
              Waspada ({skdn.waspadaCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterKategori("normal")}
              style={{
                padding: "6px 12px",
                borderRadius: 6,
                border: "none",
                background: filterKategori === "normal" ? "#FFFFFF" : "transparent",
                color: filterKategori === "normal" ? "#15803D" : "#64748B",
                fontWeight: 700,
                fontSize: 13,
                cursor: "pointer",
                boxShadow: filterKategori === "normal" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              }}
            >
              Normal ({skdn.normalCount})
            </button>
          </div>
        </div>

        {/* Pencarian Balita */}
        <div style={{ position: "relative", minWidth: 240, flex: "0 1 280px" }}>
          <Search size={15} color="#94A3B8" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari balita / ibu / NIK..."
            style={{
              width: "100%",
              padding: "8px 14px 8px 34px",
              borderRadius: 8,
              border: "1.5px solid #CBD5E1",
              fontSize: 13,
              fontWeight: 600,
              color: "#0F172A",
              background: "#FFFFFF",
              outline: "none",
            }}
          />
        </div>
      </div>

      {/* ── 4. TABEL REKAPITULASI e-PPGBM ── */}
      <div
        style={{
          background: "#FFFFFF",
          border: "1px solid #E2E8F0",
          borderRadius: 14,
          overflow: "hidden",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#F8FAFC", borderBottom: "1.5px solid #E2E8F0", color: "#475569" }}>
                <th style={{ padding: "12px 14px", fontWeight: 700, width: 40 }}>NO</th>
                <th style={{ padding: "12px 14px", fontWeight: 700 }}>NAMA BALITA & NIK</th>
                <th style={{ padding: "12px 14px", fontWeight: 700 }}>JK / UMUR</th>
                <th style={{ padding: "12px 14px", fontWeight: 700 }}>NAMA IBU & DUSUN</th>
                <th style={{ padding: "12px 14px", fontWeight: 700 }}>HASIL UKUR (BB/TB)</th>
                <th style={{ padding: "12px 14px", fontWeight: 700 }}>STATUS TUMBUH</th>
                <th style={{ padding: "12px 14px", fontWeight: 700 }}>STATUS GIZI WHO</th>
                <th style={{ padding: "12px 14px", fontWeight: 700 }}>TINDAK LANJUT</th>
              </tr>
            </thead>
            <tbody>
              {filteredBalita.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: "32px 16px", textAlign: "center", color: "#64748B" }}>
                    Tidak ada data balita yang cocok dengan filter yang dipilih.
                  </td>
                </tr>
              ) : (
                filteredBalita.map((balita, idx) => {
                  const lastR = balita.riwayat[0];
                  const isNaik = lastR ? lastR.statusTumbuh === "N" : true;

                  return (
                    <tr
                      key={balita.id}
                      style={{
                        borderBottom: "1px solid #F1F5F9",
                        transition: "background 0.15s ease",
                      }}
                    >
                      {/* No */}
                      <td style={{ padding: "12px 14px", color: "#64748B", fontWeight: 600 }}>
                        {idx + 1}
                      </td>

                      {/* Nama & NIK */}
                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ fontWeight: 800, color: "#0F172A", fontSize: 14 }}>
                          {balita.nama}
                        </div>
                        <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>
                          NIK: {balita.nik || "320812XXXXXXXX"}
                        </div>
                      </td>

                      {/* JK & Umur */}
                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{
                            fontSize: 11, fontWeight: 700, padding: "1px 6px", borderRadius: 4,
                            background: balita.jenisKelamin === "L" ? "#E0F2FE" : "#FCE7F3",
                            color: balita.jenisKelamin === "L" ? "#0284C7" : "#DB2777"
                          }}>
                            {balita.jenisKelamin === "L" ? "♂ L" : "♀ P"}
                          </span>
                          <span style={{ fontWeight: 700, color: "#0F172A" }}>
                            {balita.umurBulan} bln
                          </span>
                        </div>
                      </td>

                      {/* Nama Ibu & Dusun */}
                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ fontWeight: 700, color: "#334155" }}>{balita.namaIbu}</div>
                        <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>
                          {balita.dusun}
                        </div>
                      </td>

                      {/* BB / TB */}
                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ fontWeight: 800, color: "#0F172A" }}>
                          BB: {balita.beratTerakhir} kg
                        </div>
                        <div style={{ fontSize: 12, color: "#475569", marginTop: 2 }}>
                          TB: {balita.tinggiTerakhir} cm
                        </div>
                      </td>

                      {/* Status Tumbuh (N / T) */}
                      <td style={{ padding: "12px 14px" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            padding: "3px 8px",
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: 700,
                            background: isNaik ? "#DCFCE7" : "#FEE2E2",
                            color: isNaik ? "#15803D" : "#B91C1C",
                          }}
                        >
                          {isNaik ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                          {isNaik ? "N (Naik)" : "T (Turun)"}
                        </span>
                      </td>

                      {/* Status Gizi WHO */}
                      <td style={{ padding: "12px 14px" }}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "4px 10px",
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: 700,
                            background:
                              balita.statusGizi === "rujukan"
                                ? "#FEE2E2"
                                : balita.statusGizi === "waspada"
                                ? "#FEF3C7"
                                : "#DCFCE7",
                            color:
                              balita.statusGizi === "rujukan"
                                ? "#B91C1C"
                                : balita.statusGizi === "waspada"
                                ? "#B45309"
                                : "#15803D",
                            border: `1px solid ${
                              balita.statusGizi === "rujukan"
                                ? "#FECACA"
                                : balita.statusGizi === "waspada"
                                ? "#FDE68A"
                                : "#BBF7D0"
                            }`,
                          }}
                        >
                          {balita.labelStatus}
                        </span>
                      </td>

                      {/* Tindak Lanjut */}
                      <td style={{ padding: "12px 14px", color: "#334155", fontSize: 12 }}>
                        {balita.statusGizi === "rujukan" ? (
                          <span style={{ color: "#B91C1C", fontWeight: 700 }}>
                            Rujuk ke Puskesmas / Bidan Desa
                          </span>
                        ) : balita.statusGizi === "waspada" ? (
                          <span style={{ color: "#B45309", fontWeight: 600 }}>
                            Konseling MP-ASI & Pantau 2 Minggu
                          </span>
                        ) : (
                          <span style={{ color: "#15803D", fontWeight: 600 }}>
                            Pertahankan Pola Asupan Bergizi
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Rekapitulasi */}
        <div
          style={{
            padding: "12px 18px",
            background: "#F8FAFC",
            borderTop: "1px solid #E2E8F0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 10,
            fontSize: 13,
            color: "#64748B",
          }}
        >
          <span>
            Menampilkan <strong>{filteredBalita.length}</strong> dari total <strong>{INITIAL_BALITA.length}</strong> balita ditimbang
          </span>
          <span>
            Posyandu Melati 01 • Petugas Pencatat: <strong>Kader Posyandu Sukamaju</strong>
          </span>
        </div>
      </div>
    </div>
  );
}
