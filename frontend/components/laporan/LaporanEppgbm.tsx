"use client";

import React, { useState, useMemo } from "react";
import {
  FileText,
  Download,
  Printer,
  Calendar,
  MapPin,
  TrendingUp,
  TrendingDown,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  FileSpreadsheet,
  Loader2,
  Users,
  Scale,
  AlertTriangle,
  Building2,
  Sparkles,
} from "lucide-react";
import { INITIAL_BALITA, type BalitaItem } from "@/components/balita/RiwayatData";
import { type PosyanduItem, unduhExcelEppgbm } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";

interface LaporanEppgbmProps {
  balitaList?: BalitaItem[];
  activePosyandu?: PosyanduItem | null;
}

export function LaporanEppgbm({ balitaList, activePosyandu }: LaporanEppgbmProps = {}) {
  const dataList = useMemo(() => balitaList ?? INITIAL_BALITA, [balitaList]);
  const toast = useToast();

  // Daftar bulan unik dari riwayat penimbangan database
  const availableMonths = useMemo(() => {
    const setM = new Set<string>();
    dataList.forEach((b) => {
      (b.riwayat || []).forEach((r) => {
        if (!r.tanggal) return;
        const d = new Date(r.tanggal);
        if (!isNaN(d.getTime())) {
          setM.add(
            d.toLocaleDateString("id-ID", { month: "long", year: "numeric" })
          );
        }
      });
    });
    const arr = Array.from(setM);
    if (arr.length === 0) {
      return ["Oktober 2026", "September 2026", "Agustus 2026", "Juli 2026"];
    }
    return arr;
  }, [dataList]);

  // State Filter & Pencarian
  const [selectedBulan, setSelectedBulan] = useState<string>(() => availableMonths[0] || "Oktober 2026");
  const [selectedDusun, setSelectedDusun] = useState("all");
  const [filterKategori, setFilterKategori] = useState<"all" | "rujukan" | "waspada" | "normal">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Pagination state (default 10 baris per halaman)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Helper untuk mengambil penimbangan anak pada periode bulan terpilih
  const getMeasurementForMonth = useMemo(() => {
    return (b: BalitaItem, monthStr: string) => {
      if (!b.riwayat || b.riwayat.length === 0) return null;
      if (!monthStr || monthStr === "all") return b.riwayat[0];
      const match = b.riwayat.find((r) => {
        if (!r.tanggal) return false;
        const d = new Date(r.tanggal);
        if (isNaN(d.getTime())) return false;
        const m = d.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
        return m.toLowerCase() === monthStr.toLowerCase();
      });
      return match || b.riwayat[0];
    };
  }, []);

  // Daftar dusun unik
  const dusunList = useMemo(() => {
    const setD = new Set<string>();
    dataList.forEach((b) => {
      if (b.dusun && b.dusun !== "-") {
        setD.add(b.dusun.split(" (")[0].trim());
      }
    });
    return Array.from(setD);
  }, [dataList]);

  // Filter data balita berdasarkan dusun, kategori status gizi, dan pencarian teks
  const filteredBalita = useMemo(() => {
    return dataList.filter((b) => {
      if (selectedDusun !== "all") {
        const dName = (b.dusun || "").split(" (")[0].trim();
        if (dName !== selectedDusun) return false;
      }
      if (filterKategori !== "all" && b.statusGizi !== filterKategori) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchNama = b.nama.toLowerCase().includes(q);
        const matchIbu = (b.namaIbu || "").toLowerCase().includes(q);
        const matchNik = b.nik ? b.nik.toLowerCase().includes(q) : false;
        if (!matchNama && !matchIbu && !matchNik) return false;
      }
      return true;
    });
  }, [dataList, selectedDusun, filterKategori, searchQuery]);

  // Reset page saat filter berubah
  const totalPages = Math.max(1, Math.ceil(filteredBalita.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  // Data balita terpilih untuk halaman aktif
  const paginatedBalita = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return filteredBalita.slice(start, start + pageSize);
  }, [filteredBalita, safeCurrentPage, pageSize]);

  // Statistik Indikator SKDN Posyandu (Standar Resmi Kemenkes RI)
  const skdn = useMemo(() => {
    const S = dataList.length; // Sasaran total
    const K = S; // 100% Balita memiliki KMS / Buku KIA
    let D = 0; // Balita yang ditimbang
    let N = 0; // Berat badan naik

    dataList.forEach((b) => {
      const rec = getMeasurementForMonth(b, selectedBulan);
      if (rec) {
        D++;
        if (rec.statusTumbuh === "N") N++;
      } else if (b.riwayat && b.riwayat.length > 0) {
        D++;
        if (b.riwayat[0].statusTumbuh === "N") N++;
      }
    });

    const rujukanCount = dataList.filter((b) => b.statusGizi === "rujukan").length;
    const waspadaCount = dataList.filter((b) => b.statusGizi === "waspada").length;
    const normalCount = dataList.filter((b) => b.statusGizi === "normal").length;

    return {
      S,
      K,
      D: D > 0 ? D : S,
      N,
      persenD_S: S > 0 ? (((D > 0 ? D : S) / S) * 100).toFixed(1) : "0.0",
      persenN_D: D > 0 ? ((N / D) * 100).toFixed(1) : "0.0",
      persenK_S: "100.0",
      rujukanCount,
      waspadaCount,
      normalCount,
    };
  }, [dataList, selectedBulan, getMeasurementForMonth]);

  // State Ekspor Excel
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  // Ekspor Excel (.xlsx) Resmi Standar e-PPGBM Kemenkes
  const handleExportExcel = async () => {
    try {
      setIsExportingExcel(true);
      const bulanMap: Record<string, number> = {
        januari: 1, februari: 2, maret: 3, april: 4, mei: 5, juni: 6,
        juli: 7, agustus: 8, september: 9, oktober: 10, november: 11, desember: 12,
      };
      const parts = selectedBulan.toLowerCase().split(" ");
      const bulanNum = bulanMap[parts[0]] || new Date().getMonth() + 1;
      const tahunNum = parseInt(parts[1]) || new Date().getFullYear();

      const payload = {
        nama_posyandu: activePosyandu?.nama || "Posyandu Dahlia 01",
        desa_kelurahan: activePosyandu?.desa || "Ciwaru",
        kecamatan: activePosyandu?.kecamatan || "Ciwaru",
        kabupaten_kota: activePosyandu?.kabupaten || "Kuningan",
        provinsi: activePosyandu?.provinsi || "Jawa Barat",
        bulan: bulanNum,
        tahun: tahunNum,
        nama_kader: "Kader Posyandu",
        nama_bidan_desa: "Bidan Desa",
        catatan_umum: "Laporan bulanan pemantauan tumbuh kembang dan e-PPGBM",
        data_balita: filteredBalita.map((b, idx) => {
          const m = getMeasurementForMonth(b, selectedBulan);
          const isStunting =
            b.statusGizi === "waspada" ||
            b.labelStatus.toLowerCase().includes("pendek") ||
            b.labelStatus.toLowerCase().includes("stunting");
          const isRujukan = b.statusGizi === "rujukan";

          return {
            no: idx + 1,
            nama_anak: b.nama,
            nik: b.nik || undefined,
            tanggal_lahir: b.tanggalLahir,
            jenis_kelamin: b.jenisKelamin,
            umur_bulan: m ? m.umurBulan : b.umurBulan,
            nama_ibu: b.namaIbu,
            berat_kg: m ? m.beratKg : b.beratTerakhir,
            tinggi_cm: m ? m.tinggiCm : b.tinggiTerakhir,
            lila_cm: m?.lingkarLenganCm ?? b.lingkarLenganTerakhir,
            zscore_bbu: m?.statusBbu === "kurang" ? -2.2 : m?.statusBbu === "buruk" ? -3.2 : 0.1,
            zscore_pbu: isStunting ? -2.5 : 0.3,
            zscore_bbpb: isRujukan ? -3.1 : -0.4,
            status_gizi: isRujukan ? "gizi_buruk" : isStunting ? "pendek" : "normal",
            rekomendasi_singkat: isRujukan
              ? "Rujuk segera ke Puskesmas (Intervensi Gizi Khusus)"
              : isStunting
              ? "Intervensi MP-ASI tinggi protein hewani (telur/ikan/ayam)"
              : "Pertahankan ASI & asupan nutrisi seimbang",
            perlu_rujukan: isRujukan || isStunting,
          };
        }),
      };

      toast.info("Menyiapkan berkas Excel e-PPGBM...", 2000);
      const blob = await unduhExcelEppgbm(payload);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const posClean = (activePosyandu?.nama || "Posyandu_Dahlia_01").replace(/\s+/g, "_");
      a.download = `Laporan_ePPGBM_${posClean}_${selectedBulan.replace(/\s+/g, "_")}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success("File Excel e-PPGBM berhasil diunduh!");
    } catch (err) {
      console.error("Gagal export excel:", err);
      toast.error("Gagal mengunduh file Excel: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsExportingExcel(false);
    }
  };

  // Export CSV format standar 21 Kolom UTF-8 BOM e-PPGBM
  const handleExportCSV = () => {
    const headers = [
      "No",
      "NIK Balita",
      "Nama Lengkap Balita",
      "Jenis Kelamin",
      "Tanggal Lahir",
      "Umur (Bulan)",
      "Nama Ibu Kandung",
      "Alamat / Dusun / RT",
      "Nama Posyandu",
      "Tanggal Timbang",
      "Berat Badan (kg)",
      "Tinggi/Panjang Badan (cm)",
      "Cara Pengukuran",
      "LiLA (cm)",
      "Status Tumbuh (N/T/O/B)",
      "Status BB/U",
      "Status Stunting (PB/U)",
      "Status Wasting (BB/PB)",
      "Indikasi Stunting",
      "Perlu Rujukan Puskesmas",
      "Intervensi & Rekomendasi Gizi",
    ];

    const rows = filteredBalita.map((b, idx) => {
      const m = getMeasurementForMonth(b, selectedBulan);
      const isStunting =
        b.statusGizi === "waspada" ||
        b.labelStatus.toLowerCase().includes("pendek") ||
        b.labelStatus.toLowerCase().includes("stunting");
      const isRujukan = b.statusGizi === "rujukan";
      const caraUkur = (m ? m.umurBulan : b.umurBulan) >= 24 ? "Berdiri" : "Telentang";

      return [
        idx + 1,
        `="${b.nik || '-'}"`,
        `"${b.nama.replace(/"/g, '""')}"`,
        b.jenisKelamin === "L" ? "Laki-laki" : "Perempuan",
        b.tanggalLahir,
        m ? m.umurBulan : b.umurBulan,
        `"${(b.namaIbu || '-').replace(/"/g, '""')}"`,
        `"${(b.dusun || '-').replace(/"/g, '""')}"`,
        `"${(activePosyandu?.nama || 'Posyandu Dahlia 01').replace(/"/g, '""')}"`,
        m ? m.tanggal : b.terakhirTimbang,
        m ? m.beratKg : b.beratTerakhir,
        m ? m.tinggiCm : b.tinggiTerakhir,
        caraUkur,
        m?.lingkarLenganCm ?? b.lingkarLenganTerakhir ?? "-",
        m ? m.statusTumbuh : "N",
        m?.statusBbu ? m.statusBbu.toUpperCase() : "NORMAL",
        isStunting ? "PENDEK (STUNTING)" : "NORMAL",
        isRujukan ? "GIZI BURUK" : "NORMAL",
        isStunting ? "YA" : "TIDAK",
        isRujukan || isStunting ? "YA" : "TIDAK",
        `"${isRujukan ? 'Rujuk segera ke Puskesmas' : isStunting ? 'PMT pangan lokal kaya protein hewani' : 'Pertahankan nutrisi seimbang'}"`,
      ];
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const posName = (activePosyandu?.nama || "Posyandu_Dahlia_01").replace(/\s+/g, "_");
    link.setAttribute(
      "download",
      `Laporan_ePPGBM_${posName}_${selectedBulan.replace(/\s+/g, "_")}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    toast.success("File CSV e-PPGBM berhasil diunduh!");
  };

  // State Pratinjau Dokumen Cetak Resmi
  const [showPrintModal, setShowPrintModal] = useState(false);

  const handlePrint = () => {
    setShowPrintModal(true);
  };

  const executePrint = () => {
    window.print();
  };

  return (
    <div style={{ maxWidth: 1180, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20, paddingBottom: 40 }}>
      {/* ── CSS KHUSUS CETAK RESMI (Hanya cetak lembar resmi, sembunyikan antarmuka web) ── */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
          @media print {
            body * {
              visibility: hidden !important;
            }
            #official-print-document, #official-print-document * {
              visibility: visible !important;
            }
            #official-print-document {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              margin: 0 !important;
              padding: 24px !important;
              background: #FFFFFF !important;
              box-shadow: none !important;
              border: none !important;
              z-index: 999999 !important;
            }
            .no-print {
              display: none !important;
            }
            @page {
              size: A4 portrait;
              margin: 15mm 12mm;
            }
          }
        `,
        }}
      />

      {/* ── 1. HEADER LAPORAN EKSEKUTIF & TOOLBAR AKSI ── */}
      <div
        style={{
          background: "#FFFFFF",
          border: "1.5px solid #E2E8F0",
          borderRadius: 16,
          padding: "22px 26px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 16,
          boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
        }}
      >
        <div>
          {/* Institutional Metadata Pill */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                fontSize: 11.5,
                fontWeight: 800,
                color: "#166534",
                background: "#DCFCE7",
                padding: "3px 10px",
                borderRadius: 20,
              }}
            >
              <Building2 size={13} color="#16A34A" />
              <span>{activePosyandu?.nama || "Posyandu Dahlia 01"}</span>
            </span>
            <span style={{ color: "#CBD5E1", fontSize: 12 }}>•</span>
            <span style={{ fontSize: 12, color: "#64748B", fontWeight: 600 }}>
              Desa {activePosyandu?.desa || "Ciwaru"}, Kec. {activePosyandu?.kecamatan || "Ciwaru"}, Kab. {activePosyandu?.kabupaten || "Kuningan"}
            </span>
          </div>

          <h1
            style={{
              fontSize: 23,
              fontWeight: 900,
              color: "#0F172A",
              margin: 0,
              letterSpacing: "-0.02em",
              lineHeight: 1.25,
            }}
          >
            Laporan Pemantauan Gizi & e-PPGBM
          </h1>
          <p
            style={{
              fontSize: 13,
              color: "#64748B",
              margin: "4px 0 0 0",
              fontWeight: 500,
            }}
          >
            Rekapitulasi data penimbangan bulanan, evaluasi indikator SKDN, dan deteksi dini stunting sesuai standar WHO 2006.
          </p>
        </div>

        {/* Toolbar Tombol Ekspor & Cetak */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {/* Tombol Ekspor Excel (.xlsx) */}
          <button
            type="button"
            onClick={handleExportExcel}
            disabled={isExportingExcel}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 18px",
              borderRadius: 10,
              border: "none",
              background: "linear-gradient(135deg, #16A34A 0%, #15803D 100%)",
              color: "#FFFFFF",
              fontSize: 13,
              fontWeight: 700,
              cursor: isExportingExcel ? "wait" : "pointer",
              boxShadow: "0 2px 8px rgba(22, 163, 74, 0.25)",
              transition: "all 0.15s ease",
            }}
          >
            {isExportingExcel ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Menyiapkan Excel...</span>
              </>
            ) : (
              <>
                <FileSpreadsheet size={16} />
                <span>Ekspor Excel (.xlsx)</span>
              </>
            )}
          </button>

          {/* Tombol Ekspor CSV */}
          <button
            type="button"
            onClick={handleExportCSV}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              padding: "10px 15px",
              borderRadius: 10,
              border: "1.5px solid #CBD5E1",
              background: "#FFFFFF",
              color: "#1E293B",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <Download size={15} color="#475569" />
            <span>Ekspor CSV</span>
          </button>

          {/* Tombol Cetak PDF Resmi */}
          <button
            type="button"
            onClick={handlePrint}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              padding: "10px 16px",
              borderRadius: 10,
              border: "1.5px solid #CBD5E1",
              background: "#F8FAFC",
              color: "#1E293B",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <Printer size={15} color="#475569" />
            <span>Cetak PDF Resmi</span>
          </button>
        </div>
      </div>

      {/* ── 2. INDIKATOR KINERJA SKDN RESMI KEMENKES (4 Card Grid Eksekutif) ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 14,
        }}
      >
        {/* S (Sasaran Total) */}
        <div
          style={{
            background: "#FFFFFF",
            border: "1.5px solid #E2E8F0",
            borderRadius: 14,
            padding: "18px 20px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 11.5, fontWeight: 800, color: "#64748B", letterSpacing: "0.04em" }}>
              SASARAN BALITA (S)
            </span>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: "#E0F2FE",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Users size={16} color="#0284C7" />
            </div>
          </div>
          <div style={{ margin: "12px 0 6px" }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: "#0F172A", lineHeight: 1 }}>
              {skdn.S} <span style={{ fontSize: 14, fontWeight: 600, color: "#64748B" }}>Anak</span>
            </div>
          </div>
          <div style={{ fontSize: 11.5, color: "#0284C7", fontWeight: 700, display: "flex", alignItems: "center", gap: 5 }}>
            <Sparkles size={12} />
            <span>Kepemilikan Buku KIA (K): {skdn.persenK_S}%</span>
          </div>
        </div>

        {/* D (Partisipasi Penimbangan D/S) */}
        <div
          style={{
            background: "#FFFFFF",
            border: "1.5px solid #E2E8F0",
            borderRadius: 14,
            padding: "18px 20px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 11.5, fontWeight: 800, color: "#64748B", letterSpacing: "0.04em" }}>
              PARTISIPASI TIMBANG (D/S)
            </span>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: Number(skdn.persenD_S) >= 80 ? "#DCFCE7" : "#FEF3C7",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Scale size={16} color={Number(skdn.persenD_S) >= 80 ? "#16A34A" : "#D97706"} />
            </div>
          </div>
          <div style={{ margin: "12px 0 6px" }}>
            <div
              style={{
                fontSize: 28,
                fontWeight: 900,
                color: Number(skdn.persenD_S) >= 80 ? "#15803D" : "#B45309",
                lineHeight: 1,
              }}
            >
              {skdn.persenD_S}%{" "}
              <span style={{ fontSize: 14, fontWeight: 600, color: "#64748B" }}>
                ({skdn.D}/{skdn.S} Hadir)
              </span>
            </div>
          </div>
          <div style={{ width: "100%", height: 5, background: "#E2E8F0", borderRadius: 99, overflow: "hidden" }}>
            <div
              style={{
                width: `${Math.min(100, Math.max(5, Number(skdn.persenD_S)))}%`,
                height: "100%",
                background: Number(skdn.persenD_S) >= 80 ? "#16A34A" : "#F59E0B",
                borderRadius: 99,
              }}
            />
          </div>
          <div style={{ fontSize: 11, color: "#64748B", marginTop: 6, fontWeight: 600 }}>
            Target Nasional Kemenkes: ≥80%
          </div>
        </div>

        {/* N (Keberhasilan Tumbuh N/D) */}
        <div
          style={{
            background: "#FFFFFF",
            border: "1.5px solid #E2E8F0",
            borderRadius: 14,
            padding: "18px 20px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 11.5, fontWeight: 800, color: "#64748B", letterSpacing: "0.04em" }}>
              KEBERHASILAN TUMBUH (N/D)
            </span>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: "#EDE9FE",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <TrendingUp size={16} color="#7C3AED" />
            </div>
          </div>
          <div style={{ margin: "12px 0 6px" }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: "#6D28D9", lineHeight: 1 }}>
              {skdn.persenN_D}%{" "}
              <span style={{ fontSize: 14, fontWeight: 600, color: "#64748B" }}>
                ({skdn.N} Naik)
              </span>
            </div>
          </div>
          <div style={{ fontSize: 11.5, color: "#6D28D9", fontWeight: 700, display: "flex", alignItems: "center", gap: 5 }}>
            <TrendingUp size={12} />
            <span>Pertumbuhan sesuai kurva KMS</span>
          </div>
        </div>

        {/* Status Prioritas Intervensi */}
        <div
          style={{
            background: "#FFFFFF",
            border: "1.5px solid #E2E8F0",
            borderRadius: 14,
            padding: "18px 20px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 11.5, fontWeight: 800, color: "#64748B", letterSpacing: "0.04em" }}>
              KASUS PERLU TINDAK LANJUT
            </span>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: "#FFE4E6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <AlertTriangle size={16} color="#E11D48" />
            </div>
          </div>
          <div style={{ margin: "12px 0 6px" }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: "#0F172A", lineHeight: 1 }}>
              {skdn.rujukanCount + skdn.waspadaCount}{" "}
              <span style={{ fontSize: 14, fontWeight: 600, color: "#64748B" }}>Kasus</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 800,
                padding: "2px 7px",
                borderRadius: 6,
                background: "#FEE2E2",
                color: "#B91C1C",
                border: "1px solid #FECACA",
              }}
            >
              {skdn.rujukanCount} Rujukan
            </span>
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 800,
                padding: "2px 7px",
                borderRadius: 6,
                background: "#FEF3C7",
                color: "#B45309",
                border: "1px solid #FDE68A",
              }}
            >
              {skdn.waspadaCount} Waspada
            </span>
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 800,
                padding: "2px 7px",
                borderRadius: 6,
                background: "#DCFCE7",
                color: "#15803D",
                border: "1px solid #BBF7D0",
              }}
            >
              {skdn.normalCount} Gizi Baik
            </span>
          </div>
        </div>
      </div>

      {/* ── 3. FILTER, PERIODE & PENCARIAN REKAPITULASI ── */}
      <div
        style={{
          background: "#FFFFFF",
          border: "1.5px solid #E2E8F0",
          borderRadius: 14,
          padding: "16px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
          boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {/* Dropdown Periode Bulan */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Calendar size={15} color="#64748B" />
            <select
              value={selectedBulan}
              onChange={(e) => {
                setSelectedBulan(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                padding: "7px 12px",
                borderRadius: 8,
                border: "1.5px solid #CBD5E1",
                fontSize: 13,
                fontWeight: 700,
                color: "#0F172A",
                background: "#FFFFFF",
                cursor: "pointer",
                outline: "none",
              }}
              title="Pilih Periode Penimbangan"
            >
              {availableMonths.map((m) => (
                <option key={m} value={m}>
                  Periode: {m}
                </option>
              ))}
            </select>
          </div>

          {/* Dropdown Dusun */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <MapPin size={15} color="#64748B" />
            <select
              value={selectedDusun}
              onChange={(e) => {
                setSelectedDusun(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                padding: "7px 12px",
                borderRadius: 8,
                border: "1.5px solid #CBD5E1",
                fontSize: 13,
                fontWeight: 700,
                color: "#0F172A",
                background: "#FFFFFF",
                cursor: "pointer",
                outline: "none",
              }}
              title="Pilih Dusun / Blok Binaan"
            >
              <option value="all">Semua Dusun ({dataList.length} Balita)</option>
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
              onClick={() => {
                setFilterKategori("all");
                setCurrentPage(1);
              }}
              style={{
                padding: "6px 12px",
                borderRadius: 6,
                border: "none",
                background: filterKategori === "all" ? "#FFFFFF" : "transparent",
                color: filterKategori === "all" ? "#0F172A" : "#64748B",
                fontWeight: 700,
                fontSize: 12.5,
                cursor: "pointer",
                boxShadow: filterKategori === "all" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              }}
            >
              Semua ({dataList.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setFilterKategori("rujukan");
                setCurrentPage(1);
              }}
              style={{
                padding: "6px 12px",
                borderRadius: 6,
                border: "none",
                background: filterKategori === "rujukan" ? "#FFFFFF" : "transparent",
                color: filterKategori === "rujukan" ? "#B91C1C" : "#64748B",
                fontWeight: 700,
                fontSize: 12.5,
                cursor: "pointer",
                boxShadow: filterKategori === "rujukan" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              }}
            >
              Rujukan ({skdn.rujukanCount})
            </button>
            <button
              type="button"
              onClick={() => {
                setFilterKategori("waspada");
                setCurrentPage(1);
              }}
              style={{
                padding: "6px 12px",
                borderRadius: 6,
                border: "none",
                background: filterKategori === "waspada" ? "#FFFFFF" : "transparent",
                color: filterKategori === "waspada" ? "#B45309" : "#64748B",
                fontWeight: 700,
                fontSize: 12.5,
                cursor: "pointer",
                boxShadow: filterKategori === "waspada" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              }}
            >
              Waspada ({skdn.waspadaCount})
            </button>
            <button
              type="button"
              onClick={() => {
                setFilterKategori("normal");
                setCurrentPage(1);
              }}
              style={{
                padding: "6px 12px",
                borderRadius: 6,
                border: "none",
                background: filterKategori === "normal" ? "#FFFFFF" : "transparent",
                color: filterKategori === "normal" ? "#15803D" : "#64748B",
                fontWeight: 700,
                fontSize: 12.5,
                cursor: "pointer",
                boxShadow: filterKategori === "normal" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              }}
            >
              Gizi Baik ({skdn.normalCount})
            </button>
          </div>
        </div>

        {/* Input Pencarian Cepat */}
        <div style={{ position: "relative", minWidth: 260, flex: "0 1 300px" }}>
          <Search size={15} color="#94A3B8" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Cari balita, ibu, atau NIK..."
            style={{
              width: "100%",
              padding: "8px 32px 8px 34px",
              borderRadius: 8,
              border: "1.5px solid #CBD5E1",
              fontSize: 13,
              fontWeight: 600,
              color: "#0F172A",
              background: "#FFFFFF",
              outline: "none",
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setCurrentPage(1);
              }}
              style={{
                position: "absolute",
                right: 10,
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                color: "#94A3B8",
                cursor: "pointer",
                padding: 2,
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* ── 4. TABEL DATA REGISTRO e-PPGBM (Desain Presisi, Jernih & Profesional) ── */}
      <div
        style={{
          background: "#FFFFFF",
          border: "1.5px solid #E2E8F0",
          borderRadius: 14,
          overflow: "hidden",
          boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13.5 }}>
            <thead>
              <tr style={{ background: "#F8FAFC", borderBottom: "1.5px solid #E2E8F0", color: "#475569" }}>
                <th style={{ padding: "12px 14px", fontWeight: 800, width: 44, textAlign: "center", fontSize: 11, letterSpacing: "0.04em" }}>
                  NO
                </th>
                <th style={{ padding: "12px 14px", fontWeight: 800, fontSize: 11, letterSpacing: "0.04em" }}>
                  NAMA BALITA &amp; NIK
                </th>
                <th style={{ padding: "12px 14px", fontWeight: 800, fontSize: 11, letterSpacing: "0.04em", textAlign: "center", width: 60 }}>
                  JK
                </th>
                <th style={{ padding: "12px 14px", fontWeight: 800, fontSize: 11, letterSpacing: "0.04em", width: 90 }}>
                  USIA
                </th>
                <th style={{ padding: "12px 14px", fontWeight: 800, fontSize: 11, letterSpacing: "0.04em" }}>
                  IBU &amp; DUSUN
                </th>
                <th style={{ padding: "12px 14px", fontWeight: 800, fontSize: 11, letterSpacing: "0.04em" }}>
                  PENGUKURAN
                </th>
                <th style={{ padding: "12px 14px", fontWeight: 800, fontSize: 11, letterSpacing: "0.04em", textAlign: "center", width: 110 }}>
                  TREN KBM
                </th>
                <th style={{ padding: "12px 14px", fontWeight: 800, fontSize: 11, letterSpacing: "0.04em" }}>
                  STATUS GIZI WHO
                </th>
                <th style={{ padding: "12px 14px", fontWeight: 800, fontSize: 11, letterSpacing: "0.04em" }}>
                  TINDAK LANJUT KLINIS
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedBalita.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: "48px 16px", textAlign: "center", color: "#64748B", fontSize: 14 }}>
                    Tidak ada data balita yang cocok dengan filter atau pencarian yang dipilih.
                  </td>
                </tr>
              ) : (
                paginatedBalita.map((balita, idx) => {
                  const globalIndex = (safeCurrentPage - 1) * pageSize + idx + 1;
                  const m = getMeasurementForMonth(balita, selectedBulan);
                  const isNaik = m ? m.statusTumbuh === "N" : true;

                  const isRujukan = balita.statusGizi === "rujukan";
                  const isWaspada = balita.statusGizi === "waspada";

                  return (
                    <tr
                      key={balita.id}
                      style={{
                        borderBottom: "1px solid #F1F5F9",
                        transition: "background 0.12s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#F8FAFC";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "#FFFFFF";
                      }}
                    >
                      {/* 1. No */}
                      <td style={{ padding: "12px 14px", color: "#64748B", fontWeight: 700, textAlign: "center", fontSize: 12.5 }}>
                        {globalIndex}
                      </td>

                      {/* 2. Nama Balita & NIK */}
                      <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>
                        <div style={{ fontWeight: 800, color: "#0F172A", fontSize: 14 }}>
                          {balita.nama}
                        </div>
                        <div style={{ fontSize: 11, color: "#94A3B8", fontFamily: "monospace", marginTop: 2 }}>
                          {balita.nik || `NIK-${balita.id.substring(0, 8)}`}
                        </div>
                      </td>

                      {/* 3. Jenis Kelamin */}
                      <td style={{ padding: "12px 14px", textAlign: "center", whiteSpace: "nowrap" }}>
                        <span
                          style={{
                            fontSize: 11.5,
                            fontWeight: 800,
                            padding: "2px 8px",
                            borderRadius: 6,
                            background: balita.jenisKelamin === "L" ? "#E0F2FE" : "#FCE7F3",
                            color: balita.jenisKelamin === "L" ? "#0369A1" : "#BE185D",
                          }}
                        >
                          {balita.jenisKelamin === "L" ? "L" : "P"}
                        </span>
                      </td>

                      {/* 4. Usia */}
                      <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>
                        <div style={{ fontWeight: 700, color: "#0F172A", fontSize: 13 }}>
                          {m ? m.umurBulan : balita.umurBulan} Bulan
                        </div>
                        <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>
                          {balita.tanggalLahir}
                        </div>
                      </td>

                      {/* 5. Nama Ibu & Dusun */}
                      <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>
                        <div style={{ fontWeight: 700, color: "#334155", fontSize: 13 }}>
                          Ibu {balita.namaIbu || "-"}
                        </div>
                        <div style={{ fontSize: 11, color: "#64748B", marginTop: 2, display: "flex", alignItems: "center", gap: 3 }}>
                          <MapPin size={10} color="#94A3B8" />
                          <span>{(balita.dusun || "-").split(" (")[0]}</span>
                        </div>
                      </td>

                      {/* 6. Pengukuran BB & TB */}
                      <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>
                        <div style={{ fontWeight: 800, color: "#0F172A", fontSize: 13 }}>
                          {m ? m.beratKg : balita.beratTerakhir} <span style={{ fontSize: 11, fontWeight: 500, color: "#64748B" }}>kg</span>
                          {" · "}
                          {m ? m.tinggiCm : balita.tinggiTerakhir} <span style={{ fontSize: 11, fontWeight: 500, color: "#64748B" }}>cm</span>
                        </div>
                        <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>
                          {(m ? m.umurBulan : balita.umurBulan) >= 24 ? "Berdiri" : "Telentang"}
                        </div>
                      </td>

                      {/* 7. Status Tumbuh KBM */}
                      <td style={{ padding: "12px 14px", textAlign: "center", whiteSpace: "nowrap" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            padding: "3px 9px",
                            borderRadius: 6,
                            fontSize: 11.5,
                            fontWeight: 800,
                            background: isNaik ? "#DCFCE7" : "#FEE2E2",
                            color: isNaik ? "#15803D" : "#B91C1C",
                          }}
                        >
                          {isNaik ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                          <span>{isNaik ? "Naik (N)" : "Turun (T)"}</span>
                        </span>
                      </td>

                      {/* 8. Status Gizi WHO */}
                      <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "4px 10px",
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: 800,
                            background: isRujukan ? "#FEE2E2" : isWaspada ? "#FEF3C7" : "#DCFCE7",
                            color: isRujukan ? "#B91C1C" : isWaspada ? "#B45309" : "#15803D",
                            border: `1px solid ${isRujukan ? "#FECACA" : isWaspada ? "#FDE68A" : "#BBF7D0"}`,
                          }}
                        >
                          {balita.labelStatus}
                        </span>
                      </td>

                      {/* 9. Tindak Lanjut Medis */}
                      <td style={{ padding: "12px 14px", whiteSpace: "nowrap", fontSize: 12 }}>
                        {isRujukan ? (
                          <div style={{ color: "#B91C1C", fontWeight: 800, display: "flex", alignItems: "center", gap: 5 }}>
                            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#DC2626" }} />
                            <span>Rujuk Puskesmas (Prioritas)</span>
                          </div>
                        ) : isWaspada ? (
                          <div style={{ color: "#B45309", fontWeight: 700, display: "flex", alignItems: "center", gap: 5 }}>
                            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#D97706" }} />
                            <span>Konseling MP-ASI &amp; Pantau</span>
                          </div>
                        ) : (
                          <div style={{ color: "#15803D", fontWeight: 700, display: "flex", alignItems: "center", gap: 5 }}>
                            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#16A34A" }} />
                            <span>Pertahankan Pola Gizi Sehat</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── 5. FOOTER & PAGINATION CONTROL ── */}
        <div
          style={{
            padding: "12px 20px",
            background: "#F8FAFC",
            borderTop: "1.5px solid #E2E8F0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 14,
          }}
        >
          {/* Info Jumlah Data & Pilihan Baris */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
            <span style={{ fontSize: 13, color: "#475569", fontWeight: 600 }}>
              Menampilkan{" "}
              <strong style={{ color: "#0F172A" }}>
                {filteredBalita.length > 0 ? (safeCurrentPage - 1) * pageSize + 1 : 0}
              </strong>
              {"–"}
              <strong style={{ color: "#0F172A" }}>
                {Math.min(safeCurrentPage * pageSize, filteredBalita.length)}
              </strong>{" "}
              dari <strong style={{ color: "#0F172A" }}>{filteredBalita.length}</strong> balita
            </span>

            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "#64748B" }}>
              <span>Baris per halaman:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                style={{
                  padding: "3px 8px",
                  borderRadius: 6,
                  border: "1.5px solid #CBD5E1",
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#0F172A",
                  background: "#FFFFFF",
                  cursor: "pointer",
                  outline: "none",
                }}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          {/* Tombol Navigasi Halaman */}
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <button
              type="button"
              disabled={safeCurrentPage === 1}
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "6px 12px",
                borderRadius: 8,
                border: "1.5px solid #CBD5E1",
                background: "#FFFFFF",
                color: safeCurrentPage === 1 ? "#94A3B8" : "#0F172A",
                fontSize: 12.5,
                fontWeight: 700,
                cursor: safeCurrentPage === 1 ? "not-allowed" : "pointer",
                transition: "all 0.15s ease",
              }}
            >
              <ChevronLeft size={15} /> Sebelumnya
            </button>

            {/* Nomor Halaman */}
            <div style={{ display: "flex", gap: 4 }}>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                const isActive = page === safeCurrentPage;
                return (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      border: isActive ? "none" : "1.5px solid #CBD5E1",
                      background: isActive ? "#16A34A" : "#FFFFFF",
                      color: isActive ? "#FFFFFF" : "#0F172A",
                      fontSize: 12.5,
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

            <button
              type="button"
              disabled={safeCurrentPage === totalPages}
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "6px 12px",
                borderRadius: 8,
                border: "1.5px solid #CBD5E1",
                background: "#FFFFFF",
                color: safeCurrentPage === totalPages ? "#94A3B8" : "#0F172A",
                fontSize: 12.5,
                fontWeight: 700,
                cursor: safeCurrentPage === totalPages ? "not-allowed" : "pointer",
                transition: "all 0.15s ease",
              }}
            >
              Berikutnya <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* ── 6. MODAL PRATINJAU DOKUMEN CETAK RESMI (Format A4 Resmi) ── */}
      {showPrintModal && (
        <div
          className="no-print"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(15, 23, 42, 0.75)",
            backdropFilter: "blur(4px)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-start",
            overflowY: "auto",
            padding: "24px 16px",
          }}
        >
          {/* Floating Action Bar */}
          <div
            style={{
              width: "100%",
              maxWidth: 860,
              background: "#0F172A",
              color: "#FFFFFF",
              borderRadius: 12,
              padding: "12px 20px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
              boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
              position: "sticky",
              top: 0,
              zIndex: 10000,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <FileText size={18} color="#4ADE80" />
              <span style={{ fontSize: 14.5, fontWeight: 700 }}>
                Pratinjau Dokumen Cetak Resmi e-PPGBM ({selectedBulan})
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button
                type="button"
                onClick={executePrint}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 18px",
                  borderRadius: 8,
                  border: "none",
                  background: "#16A34A",
                  color: "#FFFFFF",
                  fontSize: 13.5,
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 2px 6px rgba(22, 163, 74, 0.3)",
                  transition: "all 0.15s ease",
                }}
              >
                <Printer size={16} /> Cetak Dokumen Sekarang (PDF)
              </button>

              <button
                type="button"
                onClick={() => setShowPrintModal(false)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  border: "1px solid #334155",
                  background: "transparent",
                  color: "#94A3B8",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
                title="Tutup Pratinjau"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Lembar Dokumen Cetak Resmi A4 */}
          <div
            id="official-print-document"
            style={{
              width: "100%",
              maxWidth: 860,
              background: "#FFFFFF",
              color: "#000000",
              padding: "40px 48px",
              borderRadius: 6,
              boxShadow: "0 12px 36px rgba(0,0,0,0.25)",
              fontFamily: "'Times New Roman', Times, serif",
              lineHeight: 1.3,
            }}
          >
            {/* Kop Surat Resmi */}
            <div
              style={{
                textAlign: "center",
                borderBottom: "3px double #000000",
                paddingBottom: 12,
                marginBottom: 18,
              }}
            >
              <div style={{ fontSize: 15, fontWeight: "bold", letterSpacing: "0.05em" }}>
                PEMERINTAH KABUPATEN {(activePosyandu?.kabupaten || "KUNINGAN").toUpperCase()}
              </div>
              <div style={{ fontSize: 16, fontWeight: "bold", letterSpacing: "0.05em" }}>
                DINAS KESEHATAN — UPTD PUSKESMAS KECAMATAN {(activePosyandu?.kecamatan || "CIWARU").toUpperCase()}
              </div>
              <div style={{ fontSize: 17, fontWeight: "bold", letterSpacing: "0.05em", color: "#15803D" }}>
                POS PELAYANAN TERPADU (POSYANDU) {(activePosyandu?.nama || "DAHLIA 01").toUpperCase()}
              </div>
              <div style={{ fontSize: 12, color: "#333333", marginTop: 4 }}>
                Wilayah Desa {activePosyandu?.desa || "Ciwaru"}, Kec. {activePosyandu?.kecamatan || "Ciwaru"}, Kab. {activePosyandu?.kabupaten || "Kuningan"}
              </div>
            </div>

            {/* Judul Laporan */}
            <div style={{ textAlign: "center", marginBottom: 18 }}>
              <div style={{ fontSize: 15, fontWeight: "bold", textDecoration: "underline" }}>
                LAPORAN BULANAN HASIL PENIMBANGAN &amp; PEMANTAUAN STATUS GIZI BALITA
              </div>
              <div style={{ fontSize: 12, fontWeight: "bold", marginTop: 4 }}>
                FORMAT RESMI e-PPGBM PUSKESMAS — BULAN: {selectedBulan.toUpperCase()}
              </div>
            </div>

            {/* Rekapitulasi Indikator SKDN Resmi */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 12, fontWeight: "bold", marginBottom: 6 }}>
                A. REKAPITULASI INDIKATOR KINERJA SKDN POSYANDU:
              </div>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: 11,
                  textAlign: "center",
                }}
              >
                <thead>
                  <tr style={{ background: "#F1F5F9" }}>
                    <th style={{ border: "1px solid #000000", padding: "6px" }}>Sasaran Balita (S)</th>
                    <th style={{ border: "1px solid #000000", padding: "6px" }}>Memiliki KIA/KMS (K)</th>
                    <th style={{ border: "1px solid #000000", padding: "6px" }}>Balita Ditimbang (D)</th>
                    <th style={{ border: "1px solid #000000", padding: "6px" }}>Berat Badan Naik (N)</th>
                    <th style={{ border: "1px solid #000000", padding: "6px" }}>Capaian D/S</th>
                    <th style={{ border: "1px solid #000000", padding: "6px" }}>Capaian N/D</th>
                    <th style={{ border: "1px solid #000000", padding: "6px" }}>Kasus Rujukan</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ border: "1px solid #000000", padding: "6px", fontWeight: "bold" }}>{skdn.S} Anak</td>
                    <td style={{ border: "1px solid #000000", padding: "6px" }}>{skdn.K} ({skdn.persenK_S}%)</td>
                    <td style={{ border: "1px solid #000000", padding: "6px", fontWeight: "bold" }}>{skdn.D} Anak</td>
                    <td style={{ border: "1px solid #000000", padding: "6px" }}>{skdn.N} Anak</td>
                    <td style={{ border: "1px solid #000000", padding: "6px", fontWeight: "bold" }}>{skdn.persenD_S}%</td>
                    <td style={{ border: "1px solid #000000", padding: "6px" }}>{skdn.persenN_D}%</td>
                    <td style={{ border: "1px solid #000000", padding: "6px", fontWeight: "bold", color: "#B91C1C" }}>{skdn.rujukanCount} Kasus</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Tabel Data Balita Lengkap */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 12, fontWeight: "bold", marginBottom: 6 }}>
                B. DATA HASIL PENGUKURAN INDIVIDUAL BALITA (e-PPGBM):
              </div>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: 10,
                  textAlign: "left",
                }}
              >
                <thead>
                  <tr style={{ background: "#F1F5F9", textAlign: "center" }}>
                    <th style={{ border: "1px solid #000000", padding: "5px 4px", width: 24 }}>NO</th>
                    <th style={{ border: "1px solid #000000", padding: "5px 6px" }}>NAMA BALITA</th>
                    <th style={{ border: "1px solid #000000", padding: "5px 4px", width: 35 }}>JK</th>
                    <th style={{ border: "1px solid #000000", padding: "5px 4px", width: 45 }}>UMUR</th>
                    <th style={{ border: "1px solid #000000", padding: "5px 6px" }}>NAMA IBU</th>
                    <th style={{ border: "1px solid #000000", padding: "5px 6px" }}>DUSUN</th>
                    <th style={{ border: "1px solid #000000", padding: "5px 6px", width: 50 }}>BB (kg)</th>
                    <th style={{ border: "1px solid #000000", padding: "5px 6px", width: 50 }}>TB (cm)</th>
                    <th style={{ border: "1px solid #000000", padding: "5px 4px", width: 40 }}>KMS</th>
                    <th style={{ border: "1px solid #000000", padding: "5px 6px" }}>STATUS GIZI WHO</th>
                    <th style={{ border: "1px solid #000000", padding: "5px 6px" }}>TINDAK LANJUT</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBalita.map((balita, idx) => {
                    const m = getMeasurementForMonth(balita, selectedBulan);
                    const isNaik = m ? m.statusTumbuh === "N" : true;

                    return (
                      <tr key={balita.id}>
                        <td style={{ border: "1px solid #000000", padding: "4px 4px", textAlign: "center" }}>
                          {idx + 1}
                        </td>
                        <td style={{ border: "1px solid #000000", padding: "4px 6px", fontWeight: "bold" }}>
                          {balita.nama}
                        </td>
                        <td style={{ border: "1px solid #000000", padding: "4px 4px", textAlign: "center" }}>
                          {balita.jenisKelamin === "L" ? "L" : "P"}
                        </td>
                        <td style={{ border: "1px solid #000000", padding: "4px 4px", textAlign: "center" }}>
                          {m ? m.umurBulan : balita.umurBulan} bln
                        </td>
                        <td style={{ border: "1px solid #000000", padding: "4px 6px" }}>
                          {balita.namaIbu}
                        </td>
                        <td style={{ border: "1px solid #000000", padding: "4px 6px" }}>
                          {(balita.dusun || "-").split(" (")[0]}
                        </td>
                        <td style={{ border: "1px solid #000000", padding: "4px 6px", textAlign: "center", fontWeight: "bold" }}>
                          {m ? m.beratKg : balita.beratTerakhir}
                        </td>
                        <td style={{ border: "1px solid #000000", padding: "4px 6px", textAlign: "center" }}>
                          {m ? m.tinggiCm : balita.tinggiTerakhir}
                        </td>
                        <td style={{ border: "1px solid #000000", padding: "4px 4px", textAlign: "center", fontWeight: "bold" }}>
                          {isNaik ? "N" : "T"}
                        </td>
                        <td style={{ border: "1px solid #000000", padding: "4px 6px", fontWeight: balita.statusGizi === "rujukan" ? "bold" : "normal" }}>
                          {balita.labelStatus}
                        </td>
                        <td style={{ border: "1px solid #000000", padding: "4px 6px", fontSize: 9 }}>
                          {balita.statusGizi === "rujukan"
                            ? "Rujuk ke Puskesmas"
                            : balita.statusGizi === "waspada"
                            ? "Konseling MP-ASI & Pantau 2 Minggu"
                            : "Pertahankan Gizi Baik"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Lembar Tanda Tangan & Pengesahan Resmi */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginTop: 30,
                fontSize: 12,
              }}
            >
              {/* Bidan Desa */}
              <div style={{ textAlign: "center", width: 220 }}>
                <div>Mengetahui,</div>
                <div style={{ fontWeight: "bold" }}>Bidan Desa {activePosyandu?.desa || "Ciwaru"}</div>
                <div style={{ height: 60 }} />
                <div style={{ fontWeight: "bold", textDecoration: "underline" }}>
                  Bdn. Siti Rohmah, S.Tr.Keb
                </div>
                <div style={{ fontSize: 11, color: "#444444" }}>NIP. 19880415 201101 2 003</div>
              </div>

              {/* Ketua Posyandu */}
              <div style={{ textAlign: "center", width: 220 }}>
                <div>{activePosyandu?.desa || "Ciwaru"}, {selectedBulan}</div>
                <div style={{ fontWeight: "bold" }}>Ketua {activePosyandu?.nama || "Posyandu Dahlia 01"}</div>
                <div style={{ height: 60 }} />
                <div style={{ fontWeight: "bold", textDecoration: "underline" }}>
                  Kader Posyandu
                </div>
                <div style={{ fontSize: 11, color: "#444444" }}>Petugas Pelapor</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
