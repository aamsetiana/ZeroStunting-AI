import React, { useState, useMemo, useEffect } from "react";
import {
  FileText, Download, Printer, Filter, Calendar, MapPin,
  CheckCircle, AlertTriangle, Users, TrendingUp, TrendingDown,
  Search, ChevronLeft, ChevronRight, ArrowDownToLine
} from "lucide-react";
import { INITIAL_BALITA, type BalitaItem } from "@/components/balita/RiwayatData";

export function LaporanEppgbm() {
  const [selectedBulan, setSelectedBulan] = useState("Okt 2026");
  const [selectedDusun, setSelectedDusun] = useState("all");
  const [filterKategori, setFilterKategori] = useState<"all" | "rujukan" | "waspada" | "normal">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);

  // Daftar dusun unik
  const dusunList = useMemo(() => {
    const setD = new Set<string>();
    INITIAL_BALITA.forEach((b) => setD.add(b.dusun.split(" (")[0]));
    return Array.from(setD);
  }, []);

  // Filter data balita
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

  // Reset page when filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedDusun, filterKategori, searchQuery, pageSize]);

  // Total pages
  const totalPages = Math.max(1, Math.ceil(filteredBalita.length / pageSize));

  // Paginated data for current page
  const paginatedBalita = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredBalita.slice(start, start + pageSize);
  }, [filteredBalita, currentPage, pageSize]);

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

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ maxWidth: 1040, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>
      {/* ── 1. HEADER LAPORAN & KONTROL AKSI ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span style={{
              fontSize: 13, fontWeight: 800, color: "#16A34A",
              background: "#DCFCE7", padding: "4px 10px", borderRadius: 6
            }}>
              FORMAT RESMI PUSKESMAS & KEMENKES
            </span>
            <span style={{ fontSize: 14, color: "#475569", fontWeight: 700 }}>
              Periode: {selectedBulan}
            </span>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0F172A", margin: "0 0 6px 0" }}>
            Rekapitulasi Laporan e-PPGBM Posyandu
          </h1>
          <p style={{ fontSize: 15, color: "#334155", margin: 0, lineHeight: 1.5 }}>
            Data hasil pemantauan pertumbuhan bulanan, indikator SKDN, dan deteksi dini stunting di Posyandu Melati 01.
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
              padding: "10px 16px",
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
              padding: "10px 18px",
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

      {/* ── 2. INDIKATOR KINERJA SKDN (Padat, Ringkas & Tanpa Tulisan Kecil) ── */}
      <div
        style={{
          background: "#FFFFFF",
          border: "1.5px solid #E2E8F0",
          borderRadius: 14,
          padding: "20px 24px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 20,
        }}
      >
        {/* S (Sasaran) */}
        <div>
          <div style={{ fontSize: 14, color: "#475569", fontWeight: 800 }}>
            SASARAN TOTAL (S)
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 6 }}>
            <span style={{ fontSize: 32, fontWeight: 800, color: "#0F172A", lineHeight: 1 }}>{skdn.S}</span>
            <span style={{ fontSize: 15, color: "#475569", fontWeight: 700 }}>Balita</span>
          </div>
        </div>

        {/* D (Ditimbang) / Partisipasi D/S */}
        <div>
          <div style={{ fontSize: 14, color: "#475569", fontWeight: 800 }}>
            PARTISIPASI TIMBANG (D/S)
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 6 }}>
            <span style={{ fontSize: 32, fontWeight: 800, color: "#16A34A", lineHeight: 1 }}>{skdn.persenD_S}%</span>
            <span style={{ fontSize: 15, color: "#475569", fontWeight: 700 }}>({skdn.D} Anak)</span>
          </div>
        </div>

        {/* N (Berat Naik) / N/D */}
        <div>
          <div style={{ fontSize: 14, color: "#475569", fontWeight: 800 }}>
            TINGKAT KEBERHASILAN (N/D)
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 6 }}>
            <span style={{ fontSize: 32, fontWeight: 800, color: "#0284C7", lineHeight: 1 }}>{skdn.persenN_D}%</span>
            <span style={{ fontSize: 15, color: "#475569", fontWeight: 700 }}>({skdn.N} Naik)</span>
          </div>
        </div>

        {/* Deteksi Status Stunting & Rujukan */}
        <div>
          <div style={{ fontSize: 14, color: "#475569", fontWeight: 800 }}>
            PERLU PERHATIAN KHUSUS
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6 }}>
            <span style={{
              display: "inline-flex", alignItems: "center",
              padding: "6px 12px", borderRadius: 8, fontSize: 14, fontWeight: 800,
              background: "#FEE2E2", color: "#B91C1C", border: "1.5px solid #FECACA"
            }}>
              {skdn.rujukanCount} Rujukan
            </span>
            <span style={{
              display: "inline-flex", alignItems: "center",
              padding: "6px 12px", borderRadius: 8, fontSize: 14, fontWeight: 800,
              background: "#FEF3C7", color: "#B45309", border: "1.5px solid #FDE68A"
            }}>
              {skdn.waspadaCount} Waspada
            </span>
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
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#334155" }}>Dusun:</span>
            <select
              value={selectedDusun}
              onChange={(e) => setSelectedDusun(e.target.value)}
              style={{
                padding: "8px 14px",
                borderRadius: 8,
                border: "1.5px solid #CBD5E1",
                fontSize: 14,
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
                padding: "7px 14px",
                borderRadius: 6,
                border: "none",
                background: filterKategori === "all" ? "#FFFFFF" : "transparent",
                color: filterKategori === "all" ? "#0F172A" : "#64748B",
                fontWeight: 700,
                fontSize: 14,
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
                padding: "7px 14px",
                borderRadius: 6,
                border: "none",
                background: filterKategori === "rujukan" ? "#FFFFFF" : "transparent",
                color: filterKategori === "rujukan" ? "#B91C1C" : "#64748B",
                fontWeight: 700,
                fontSize: 14,
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
                padding: "7px 14px",
                borderRadius: 6,
                border: "none",
                background: filterKategori === "waspada" ? "#FFFFFF" : "transparent",
                color: filterKategori === "waspada" ? "#B45309" : "#64748B",
                fontWeight: 700,
                fontSize: 14,
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
                padding: "7px 14px",
                borderRadius: 6,
                border: "none",
                background: filterKategori === "normal" ? "#FFFFFF" : "transparent",
                color: filterKategori === "normal" ? "#15803D" : "#64748B",
                fontWeight: 700,
                fontSize: 14,
                cursor: "pointer",
                boxShadow: filterKategori === "normal" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              }}
            >
              Normal ({skdn.normalCount})
            </button>
          </div>
        </div>

        {/* Pencarian Balita */}
        <div style={{ position: "relative", minWidth: 260, flex: "0 1 300px" }}>
          <Search size={16} color="#64748B" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari balita / ibu / NIK..."
            style={{
              width: "100%",
              padding: "9px 14px 9px 36px",
              borderRadius: 8,
              border: "1.5px solid #CBD5E1",
              fontSize: 14,
              fontWeight: 600,
              color: "#0F172A",
              background: "#FFFFFF",
              outline: "none",
            }}
          />
        </div>
      </div>

      {/* ── 4. TABEL REKAPITULASI e-PPGBM (Clear & Legible) ── */}
      <div
        style={{
          background: "#FFFFFF",
          border: "1.5px solid #E2E8F0",
          borderRadius: 14,
          overflow: "hidden",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 14 }}>
            <thead>
              <tr style={{ background: "#F8FAFC", borderBottom: "1.5px solid #E2E8F0", color: "#334155" }}>
                <th style={{ padding: "14px 16px", fontWeight: 800, width: 45 }}>NO</th>
                <th style={{ padding: "14px 16px", fontWeight: 800 }}>NAMA BALITA</th>
                <th style={{ padding: "14px 16px", fontWeight: 800 }}>JK</th>
                <th style={{ padding: "14px 16px", fontWeight: 800 }}>UMUR</th>
                <th style={{ padding: "14px 16px", fontWeight: 800 }}>NAMA IBU</th>
                <th style={{ padding: "14px 16px", fontWeight: 800 }}>DUSUN</th>
                <th style={{ padding: "14px 16px", fontWeight: 800 }}>BERAT (BB)</th>
                <th style={{ padding: "14px 16px", fontWeight: 800 }}>TINGGI (TB)</th>
                <th style={{ padding: "14px 16px", fontWeight: 800 }}>PERTUMBUHAN</th>
                <th style={{ padding: "14px 16px", fontWeight: 800 }}>STATUS GIZI</th>
                <th style={{ padding: "14px 16px", fontWeight: 800 }}>TINDAK LANJUT</th>
              </tr>
            </thead>
            <tbody>
              {paginatedBalita.length === 0 ? (
                <tr>
                  <td colSpan={11} style={{ padding: "36px 16px", textAlign: "center", color: "#64748B", fontSize: 15 }}>
                    Tidak ada data balita yang cocok dengan filter yang dipilih.
                  </td>
                </tr>
              ) : (
                paginatedBalita.map((balita, idx) => {
                  const globalIndex = (currentPage - 1) * pageSize + idx + 1;
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
                      {/* 1. No */}
                      <td style={{ padding: "14px 16px", color: "#475569", fontWeight: 700 }}>
                        {globalIndex}
                      </td>

                      {/* 2. Nama Balita */}
                      <td style={{ padding: "14px 16px", fontWeight: 800, color: "#0F172A", fontSize: 15, whiteSpace: "nowrap" }}>
                        {balita.nama}
                      </td>

                      {/* 3. Jenis Kelamin */}
                      <td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>
                        <span style={{
                          fontSize: 13, fontWeight: 800, padding: "3px 10px", borderRadius: 6,
                          background: balita.jenisKelamin === "L" ? "#E0F2FE" : "#FCE7F3",
                          color: balita.jenisKelamin === "L" ? "#0284C7" : "#DB2777"
                        }}>
                          {balita.jenisKelamin === "L" ? "Laki-laki" : "Perempuan"}
                        </span>
                      </td>

                      {/* 4. Umur */}
                      <td style={{ padding: "14px 16px", fontWeight: 700, color: "#0F172A", whiteSpace: "nowrap" }}>
                        {balita.umurBulan} Bulan
                      </td>

                      {/* 5. Nama Ibu */}
                      <td style={{ padding: "14px 16px", fontWeight: 600, color: "#334155", whiteSpace: "nowrap" }}>
                        {balita.namaIbu}
                      </td>

                      {/* 6. Dusun */}
                      <td style={{ padding: "14px 16px", color: "#475569", fontWeight: 600, whiteSpace: "nowrap" }}>
                        {balita.dusun.split(" (")[0]}
                      </td>

                      {/* 7. Berat Badan */}
                      <td style={{ padding: "14px 16px", fontWeight: 800, color: "#0F172A", whiteSpace: "nowrap" }}>
                        {balita.beratTerakhir} kg
                      </td>

                      {/* 8. Tinggi Badan */}
                      <td style={{ padding: "14px 16px", fontWeight: 800, color: "#0F172A", whiteSpace: "nowrap" }}>
                        {balita.tinggiTerakhir} cm
                      </td>

                      {/* 9. Status Tumbuh (N / T) */}
                      <td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            padding: "4px 10px",
                            borderRadius: 6,
                            fontSize: 13,
                            fontWeight: 800,
                            background: isNaik ? "#DCFCE7" : "#FEE2E2",
                            color: isNaik ? "#15803D" : "#B91C1C",
                          }}
                        >
                          {isNaik ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                          {isNaik ? "Naik (N)" : "Turun (T)"}
                        </span>
                      </td>

                      {/* 10. Status Gizi WHO */}
                      <td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "5px 12px",
                            borderRadius: 6,
                            fontSize: 13,
                            fontWeight: 800,
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

                      {/* 11. Tindak Lanjut Medis */}
                      <td style={{ padding: "14px 16px", color: "#1E293B", fontSize: 13, whiteSpace: "nowrap" }}>
                        {balita.statusGizi === "rujukan" ? (
                          <span style={{ color: "#B91C1C", fontWeight: 800 }}>
                            Rujuk ke Bidan / Puskesmas
                          </span>
                        ) : balita.statusGizi === "waspada" ? (
                          <span style={{ color: "#B45309", fontWeight: 700 }}>
                            Konseling MP-ASI & Pantau 2 Minggu
                          </span>
                        ) : (
                          <span style={{ color: "#15803D", fontWeight: 700 }}>
                            Pertahankan Pola Gizi Sehat
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

        {/* ── 5. FOOTER & PAGINATION CONTROL (Paging Balita) ── */}
        <div
          style={{
            padding: "14px 20px",
            background: "#F8FAFC",
            borderTop: "1.5px solid #E2E8F0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 14,
          }}
        >
          {/* Info Jumlah Data & Pilihan Baris per Halaman */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
            <span style={{ fontSize: 14, color: "#334155", fontWeight: 600 }}>
              Menampilkan{" "}
              <strong style={{ color: "#0F172A" }}>
                {filteredBalita.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}
              </strong>
              {" - "}
              <strong style={{ color: "#0F172A" }}>
                {Math.min(currentPage * pageSize, filteredBalita.length)}
              </strong>{" "}
              dari <strong style={{ color: "#0F172A" }}>{filteredBalita.length}</strong> balita
            </span>

            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "#475569" }}>
              <span>Per halaman:</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                style={{
                  padding: "4px 8px",
                  borderRadius: 6,
                  border: "1.5px solid #CBD5E1",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#0F172A",
                  background: "#FFFFFF",
                  cursor: "pointer",
                  outline: "none",
                }}
              >
                <option value={5}>5</option>
                <option value={6}>6</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
            </div>
          </div>

          {/* Tombol Halaman (Pagination Buttons) */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {/* Tombol Sebelumnya */}
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "6px 12px",
                borderRadius: 8,
                border: "1.5px solid #CBD5E1",
                background: "#FFFFFF",
                color: currentPage === 1 ? "#94A3B8" : "#0F172A",
                fontSize: 13,
                fontWeight: 700,
                cursor: currentPage === 1 ? "not-allowed" : "pointer",
                transition: "all 0.15s ease",
              }}
            >
              <ChevronLeft size={16} /> Sebelumnya
            </button>

            {/* Nomor Halaman */}
            <div style={{ display: "flex", gap: 4 }}>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                const isActive = page === currentPage;
                return (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 8,
                      border: isActive ? "none" : "1.5px solid #CBD5E1",
                      background: isActive ? "#16A34A" : "#FFFFFF",
                      color: isActive ? "#FFFFFF" : "#0F172A",
                      fontSize: 13,
                      fontWeight: 800,
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {page}
                  </button>
                );
              })}
            </div>

            {/* Tombol Berikutnya */}
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "6px 12px",
                borderRadius: 8,
                border: "1.5px solid #CBD5E1",
                background: "#FFFFFF",
                color: currentPage === totalPages ? "#94A3B8" : "#0F172A",
                fontSize: 13,
                fontWeight: 700,
                cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                transition: "all 0.15s ease",
              }}
            >
              Berikutnya <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
