"use client";

import React, { useState, useMemo } from "react";
import {
  Search, Filter, Baby, Calendar, User, MapPin, Scale, Ruler,
  AlertTriangle, CheckCircle, XCircle, ChevronRight, ChevronLeft, X, Clock,
  Plus, ArrowUpDown, FileText, Activity, Pencil, Trash2, Eye, Loader2,
  CheckCircle2, Save, AlertCircle
} from "lucide-react";
import { hapusBalitaDariDb, updateBalitaDiDb } from "@/lib/utils";

export interface PenimbanganRecord {
  tanggal: string;
  umurBulan: number;
  beratKg: number;
  tinggiCm: number;
  lingkarKepalaCm?: number;
  lingkarLenganCm?: number;
  statusBbu: "normal" | "kurang" | "buruk" | "lebih";
  statusPbu: "normal" | "pendek" | "sangat_pendek" | "tinggi";
  statusBbpb: "normal" | "kurus" | "sangat_kurus" | "gemuk";
  statusTumbuh: "N" | "T" | "O" | "B"; // N = Naik, T = Turun, O = Baru, B = Bawah garis merah
  catatan?: string;
}

export interface BalitaItem {
  id: string;
  posyanduId?: string;
  nama: string;
  nik?: string;
  jenisKelamin: "L" | "P";
  tanggalLahir: string;
  umurBulan: number;
  namaIbu: string;
  dusun: string;
  terakhirTimbang: string;
  beratTerakhir: number;
  tinggiTerakhir: number;
  lingkarKepalaTerakhir?: number;
  lingkarLenganTerakhir?: number;
  statusGizi: "normal" | "waspada" | "rujukan";
  labelStatus: string;
  riwayat: PenimbanganRecord[];
}

// Data awal (kosong — mengambil langsung dari database Supabase)
export const INITIAL_BALITA: BalitaItem[] = [];

export interface RiwayatDataProps {
  balitaList?: BalitaItem[];
  onRefresh?: () => void;
  onCatatBaru: () => void;
  onBukaGrafik?: (idOrNama: string) => void;
}

export function RiwayatData({ balitaList, onRefresh, onCatatBaru, onBukaGrafik }: RiwayatDataProps) {
  const rawList = balitaList ?? INITIAL_BALITA;
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("semua");
  const [filterDusun, setFilterDusun] = useState<string>("semua");
  const [selectedBalita, setSelectedBalita] = useState<BalitaItem | null>(null);

  // State Ubah / Edit Modal
  const [editingBalita, setEditingBalita] = useState<BalitaItem | null>(null);
  const [editNama, setEditNama] = useState("");
  const [editJk, setEditJk] = useState<"L" | "P">("L");
  const [editUmur, setEditUmur] = useState<number | string>(0);
  const [editBb, setEditBb] = useState<number | string>(0);
  const [editTb, setEditTb] = useState<number | string>(0);
  const [editLingkarKepala, setEditLingkarKepala] = useState<number | string>("");
  const [editLingkarLengan, setEditLingkarLengan] = useState<number | string>("");
  const [editNamaIbu, setEditNamaIbu] = useState("");
  const [editDusun, setEditDusun] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // State Hapus
  // State Hapus Modal
  const [balitaAkanDihapus, setBalitaAkanDihapus] = useState<BalitaItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Feedback Banner
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const handleBukaEdit = (balita: BalitaItem) => {
    setEditingBalita(balita);
    setEditNama(balita.nama);
    setEditJk(balita.jenisKelamin);
    setEditUmur(balita.umurBulan);
    setEditBb(balita.beratTerakhir);
    setEditTb(balita.tinggiTerakhir);
    setEditLingkarKepala(balita.lingkarKepalaTerakhir ?? "");
    setEditLingkarLengan(balita.lingkarLenganTerakhir ?? "");
    setEditNamaIbu(balita.namaIbu);
    setEditDusun(balita.dusun);
    setFeedback(null);
  };

  const handleSimpanEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBalita) return;
    setIsUpdating(true);
    setFeedback(null);

    const res = await updateBalitaDiDb(editingBalita.id, {
      nama: editNama.trim(),
      jenis_kelamin: editJk,
      umur_bulan: Number(editUmur),
      berat_kg: Number(editBb),
      tinggi_cm: Number(editTb),
      lingkar_kepala_cm: editLingkarKepala !== "" ? Number(editLingkarKepala) : undefined,
      lingkar_lengan_cm: editLingkarLengan !== "" ? Number(editLingkarLengan) : undefined,
      nama_ibu: editNamaIbu.trim(),
      alamat: editDusun.trim(),
    });

    setIsUpdating(false);

    if (res.sukses) {
      setFeedback({ type: "success", msg: `Data balita "${editNama}" berhasil diperbarui!` });
      setEditingBalita(null);
      if (selectedBalita && selectedBalita.id === editingBalita.id) {
        setSelectedBalita(null);
      }
      if (onRefresh) onRefresh();
    } else {
      setFeedback({ type: "error", msg: res.pesan || "Gagal memperbarui data balita" });
    }
  };

  const handleKonfirmasiHapus = async () => {
    if (!balitaAkanDihapus) return;
    const target = balitaAkanDihapus;
    setDeletingId(target.id);
    setFeedback(null);

    const res = await hapusBalitaDariDb(target.id);
    setDeletingId(null);
    setBalitaAkanDihapus(null);

    if (res.sukses) {
      setFeedback({ type: "success", msg: `Data balita "${target.nama}" berhasil dihapus dari database.` });
      if (selectedBalita && selectedBalita.id === target.id) {
        setSelectedBalita(null);
      }
      if (onRefresh) onRefresh();
    } else {
      setFeedback({ type: "error", msg: res.pesan || "Gagal menghapus data balita" });
    }
  };

  // Filter daftar balita
  const filteredList = useMemo(() => {
    return rawList.filter((item) => {
      const matchSearch =
        item.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.namaIbu.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.dusun.toLowerCase().includes(searchQuery.toLowerCase());

      const matchStatus =
        filterStatus === "semua" || item.statusGizi === filterStatus;

      const matchDusun =
        filterDusun === "semua" || item.dusun.includes(filterDusun);

      return matchSearch && matchStatus && matchDusun;
    });
  }, [searchQuery, filterStatus, filterDusun]);

  // Total pages & safe current page calculation
  const totalPages = Math.max(1, Math.ceil(filteredList.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  // Paginated list
  const paginatedList = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return filteredList.slice(start, start + pageSize);
  }, [filteredList, safeCurrentPage, pageSize]);

  const getStatusBadge = (statusGizi: string, label: string) => {
    if (statusGizi === "rujukan") {
      return (
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          background: "#FEE2E2", color: "#B91C1C", border: "1.5px solid #FECACA",
          padding: "5px 12px", borderRadius: 8, fontSize: 13, fontWeight: 800,
        }}>
          <XCircle size={14} /> {label}
        </span>
      );
    }
    if (statusGizi === "waspada") {
      return (
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          background: "#FEF3C7", color: "#B45309", border: "1.5px solid #FDE68A",
          padding: "5px 12px", borderRadius: 8, fontSize: 13, fontWeight: 800,
        }}>
          <AlertTriangle size={14} /> {label}
        </span>
      );
    }
    return (
      <span style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        background: "#DCFCE7", color: "#15803D", border: "1.5px solid #BBF7D0",
        padding: "5px 12px", borderRadius: 8, fontSize: 13, fontWeight: 800,
      }}>
        <CheckCircle size={14} /> {label}
      </span>
    );
  };

  return (
    <div style={{ maxWidth: 1040, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Banner Feedback Alert */}
      {feedback && (
        <div style={{
          padding: "12px 18px",
          borderRadius: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          background: feedback.type === "success" ? "#DCFCE7" : "#FEE2E2",
          border: `1.5px solid ${feedback.type === "success" ? "#86EFAC" : "#FECACA"}`,
          color: feedback.type === "success" ? "#166534" : "#991B1B",
          fontSize: 14,
          fontWeight: 600,
          boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {feedback.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{feedback.msg}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", padding: 2 }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* 1. Header Halaman */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 14 }}>
        <div>
          <div style={{ fontSize: 13, color: "#15803D", fontWeight: 700, letterSpacing: "0.04em", marginBottom: 4 }}>
            POSYANDU MELATI 01 • DESA SUKAMAJU
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0F172A", margin: 0 }}>
            Riwayat Penimbangan Balita
          </h1>
          <p style={{ fontSize: 14, color: "#475569", margin: "4px 0 0 0" }}>
            Data buku register dan histori pemantauan tumbuh kembang anak dari bulan ke bulan.
          </p>
        </div>

        <button
          type="button"
          onClick={onCatatBaru}
          style={{
            background: "#16A34A",
            color: "#FFFFFF",
            border: "none",
            borderRadius: 12,
            padding: "11px 20px",
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
            boxShadow: "0 2px 8px rgba(22, 163, 74, 0.25)",
          }}
        >
          <Plus size={18} /> Catat Penimbangan Baru
        </button>
      </div>

      {/* 2. Bar Kontrol: Search & Filter */}
      <div style={{
        background: "#FFFFFF",
        border: "1.5px solid #E2E8F0",
        borderRadius: 16,
        padding: "16px 20px",
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}>
        {/* Input Cari */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <div style={{
            flex: 1, minWidth: 260, position: "relative",
            display: "flex", alignItems: "center",
          }}>
            <Search size={18} color="#94A3B8" style={{ position: "absolute", left: 14 }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama balita, nama ibu, atau dusun..."
              style={{
                width: "100%",
                padding: "11px 14px 11px 40px",
                borderRadius: 12,
                border: "1.5px solid #CBD5E1",
                fontSize: 14,
                color: "#0F172A",
                outline: "none",
                background: "#F8FAF8",
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                style={{
                  position: "absolute", right: 12,
                  background: "none", border: "none", cursor: "pointer", color: "#64748B",
                }}
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Filter Dusun */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 13, color: "#64748B", fontWeight: 600 }}>Wilayah:</span>
            <select
              value={filterDusun}
              onChange={(e) => setFilterDusun(e.target.value)}
              style={{
                padding: "10px 14px",
                borderRadius: 12,
                border: "1.5px solid #CBD5E1",
                fontSize: 13,
                fontWeight: 600,
                color: "#0F172A",
                background: "#FFFFFF",
                cursor: "pointer",
              }}
            >
              <option value="semua">Semua Dusun</option>
              <option value="Krajan">Dusun Krajan</option>
              <option value="Sukamaju">Dusun Sukamaju</option>
              <option value="Mekarsari">Dusun Mekarsari</option>
            </select>
          </div>
        </div>

        {/* Filter Pills Status Gizi */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 13, color: "#64748B", fontWeight: 600, marginRight: 4 }}>
            Status Gizi:
          </span>
          {[
            { id: "semua", label: "Semua Balita" },
            { id: "normal", label: "Tumbuh Normal" },
            { id: "waspada", label: "Waspada Stunting" },
            { id: "rujukan", label: "Perlu Rujukan Bidan" },
          ].map((pill) => {
            const isSelected = filterStatus === pill.id;
            return (
              <button
                key={pill.id}
                type="button"
                onClick={() => setFilterStatus(pill.id)}
                style={{
                  padding: "6px 14px",
                  borderRadius: 20,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  border: isSelected ? "1.5px solid #16A34A" : "1.5px solid #E2E8F0",
                  background: isSelected ? "#DCFCE7" : "#FFFFFF",
                  color: isSelected ? "#15803D" : "#475569",
                }}
              >
                {pill.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Daftar Balita (Tabel Bersih & Responsif dengan Pagination) */}
      <div style={{
        background: "#FFFFFF",
        border: "1.5px solid #E2E8F0",
        borderRadius: 16,
        overflow: "hidden",
      }}>
        <div style={{
          padding: "16px 20px",
          borderBottom: "1px solid #F1F5F9",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 10,
        }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>
            Daftar Balita Terdaftar ({filteredList.length} Balita)
          </div>
          <div style={{ fontSize: 13, color: "#475569", fontWeight: 600 }}>
            Halaman {currentPage} dari {totalPages}
          </div>
        </div>

        {rawList.length === 0 ? (
          <div style={{ padding: "60px 20px", textAlign: "center" }}>
            <div style={{
              width: 60, height: 60, borderRadius: "50%",
              background: "#F0FDF4", border: "1px solid #BBF7D0", display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 14px",
            }}>
              <Baby size={30} color="#16A34A" />
            </div>
            <div style={{ fontSize: 17, fontWeight: 800, color: "#0F172A", marginBottom: 5 }}>
              Belum Ada Data Balita di Database
            </div>
            <p style={{ fontSize: 13.5, color: "#64748B", margin: "0 auto 18px", maxWidth: 420, lineHeight: 1.5 }}>
              Database Posyandu Supabase telah terhubung dan bersih. Silakan catat penimbangan pertama untuk melihat data balita di sini.
            </p>
            <button
              type="button"
              onClick={onCatatBaru}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                background: "#16A34A",
                color: "#FFFFFF",
                border: "none",
                borderRadius: 10,
                padding: "9px 18px",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 2px 6px rgba(22, 163, 74, 0.2)",
              }}
            >
              <Plus size={15} /> Catat Balita Sekarang
            </button>
          </div>
        ) : paginatedList.length === 0 ? (
          <div style={{ padding: "48px 20px", textAlign: "center" }}>
            <div style={{
              width: 56, height: 56, borderRadius: "50%",
              background: "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 12px",
            }}>
              <Search size={24} color="#94A3B8" />
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", marginBottom: 4 }}>
              Tidak ada balita yang cocok dengan filter
            </div>
            <p style={{ fontSize: 13, color: "#64748B", margin: 0 }}>
              Coba ubah kata kunci pencarian atau reset filter di atas.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <div style={{ minWidth: 880 }}>
              {/* Header Kolom Tabel agar Sejajar Sempurna */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(220px, 2fr) 75px 95px 95px 165px 210px",
                  alignItems: "center",
                  gap: 16,
                  padding: "12px 20px",
                  background: "#F8FAFC",
                  borderBottom: "1.5px solid #E2E8F0",
                  fontSize: 12,
                  fontWeight: 800,
                  color: "#64748B",
                  letterSpacing: "0.04em",
                }}
              >
                <div>PROFIL BALITA</div>
                <div>USIA</div>
                <div>BERAT (BB)</div>
                <div>TINGGI (TB)</div>
                <div>STATUS GIZI</div>
                <div style={{ textAlign: "right" }}>AKSI</div>
              </div>

              {/* Daftar Balita */}
              <div style={{ display: "flex", flexDirection: "column" }}>
                {paginatedList.map((balita, idx) => (
                  <div
                    key={balita.id}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "minmax(220px, 2fr) 75px 95px 95px 165px 210px",
                      alignItems: "center",
                      gap: 16,
                      padding: "14px 20px",
                      borderBottom: idx === paginatedList.length - 1 ? "none" : "1px solid #F1F5F9",
                      transition: "background 0.15s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#F8FAF8")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "#FFFFFF")}
                  >
                    {/* 1. Kolom Profil Balita */}
                    <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                      <div style={{
                        width: 42, height: 42, borderRadius: 12,
                        background: balita.jenisKelamin === "L" ? "#E0F2FE" : "#FCE7F3",
                        color: balita.jenisKelamin === "L" ? "#0284C7" : "#DB2777",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontWeight: 800, fontSize: 16, flexShrink: 0,
                      }}>
                        {balita.nama.charAt(0)}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <span style={{
                            fontSize: 15, fontWeight: 800, color: "#0F172A",
                            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                          }}>
                            {balita.nama}
                          </span>
                          <span style={{
                            fontSize: 11, fontWeight: 700,
                            padding: "2px 7px", borderRadius: 6,
                            background: balita.jenisKelamin === "L" ? "#E0F2FE" : "#FCE7F3",
                            color: balita.jenisKelamin === "L" ? "#0284C7" : "#DB2777",
                          }}>
                            {balita.jenisKelamin === "L" ? "L" : "P"}
                          </span>
                        </div>
                        <div style={{ fontSize: 13, color: "#475569", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          Ibu: <strong style={{ color: "#0F172A" }}>{balita.namaIbu}</strong> • {balita.dusun}
                        </div>
                      </div>
                    </div>

                    {/* 2. Kolom Usia */}
                    <div>
                      <span style={{ fontSize: 15, fontWeight: 800, color: "#0F172A" }}>
                        {balita.umurBulan}
                      </span>{" "}
                      <span style={{ fontSize: 13, color: "#64748B", fontWeight: 600 }}>Bln</span>
                    </div>

                    {/* 3. Kolom Berat Badan (BB) */}
                    <div>
                      <span style={{ fontSize: 15, fontWeight: 800, color: "#0F172A" }}>
                        {balita.beratTerakhir}
                      </span>{" "}
                      <span style={{ fontSize: 13, color: "#64748B", fontWeight: 600 }}>kg</span>
                    </div>

                    {/* 4. Kolom Tinggi Badan (TB) */}
                    <div>
                      <span style={{ fontSize: 15, fontWeight: 800, color: "#0F172A" }}>
                        {balita.tinggiTerakhir}
                      </span>{" "}
                      <span style={{ fontSize: 13, color: "#64748B", fontWeight: 600 }}>cm</span>
                    </div>

                    {/* 5. Kolom Status Gizi */}
                    <div>
                      {getStatusBadge(balita.statusGizi, balita.labelStatus)}
                    </div>

                    {/* 6. Kolom Tombol Aksi (Detail, Ubah, Hapus) */}
                    <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 6 }}>
                      {/* Tombol Detail */}
                      <button
                        type="button"
                        onClick={() => setSelectedBalita(balita)}
                        title="Buka riwayat lengkap"
                        style={{
                          background: "#F1F5F9",
                          border: "1px solid #CBD5E1",
                          borderRadius: 8,
                          padding: "7px 10px",
                          fontSize: 12,
                          fontWeight: 700,
                          color: "#1E293B",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          transition: "all 0.15s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#E2E8F0";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "#F1F5F9";
                        }}
                      >
                        <Eye size={13} color="#475569" />
                        <span>Detail</span>
                      </button>

                      {/* Tombol Ubah / Edit */}
                      <button
                        type="button"
                        onClick={() => handleBukaEdit(balita)}
                        title="Ubah data balita / koreksi kesalahan"
                        style={{
                          background: "#EFF6FF",
                          border: "1px solid #BFDBFE",
                          borderRadius: 8,
                          padding: "7px 10px",
                          fontSize: 12,
                          fontWeight: 700,
                          color: "#1D4ED8",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          transition: "all 0.15s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#DBEAFE";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "#EFF6FF";
                        }}
                      >
                        <Pencil size={13} />
                        <span>Ubah</span>
                      </button>

                      {/* Tombol Hapus */}
                      <button
                        type="button"
                        disabled={deletingId === balita.id}
                        onClick={() => setBalitaAkanDihapus(balita)}
                        title="Hapus data balita dari database"
                        style={{
                          background: "#FEF2F2",
                          border: "1px solid #FECACA",
                          borderRadius: 8,
                          padding: "7px 10px",
                          fontSize: 12,
                          fontWeight: 700,
                          color: "#DC2626",
                          cursor: deletingId === balita.id ? "not-allowed" : "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          opacity: deletingId === balita.id ? 0.6 : 1,
                          transition: "all 0.15s ease",
                        }}
                        onMouseEnter={(e) => {
                          if (deletingId !== balita.id) e.currentTarget.style.background = "#FEE2E2";
                        }}
                        onMouseLeave={(e) => {
                          if (deletingId !== balita.id) e.currentTarget.style.background = "#FEF2F2";
                        }}
                      >
                        {deletingId === balita.id ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <Trash2 size={13} />
                        )}
                        <span>Hapus</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── FOOTER PAGINATION CONTROL ── */}
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
                {filteredList.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}
              </strong>
              {" - "}
              <strong style={{ color: "#0F172A" }}>
                {Math.min(currentPage * pageSize, filteredList.length)}
              </strong>{" "}
              dari <strong style={{ color: "#0F172A" }}>{filteredList.length}</strong> balita
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

      {/* 4. MODAL / DRAWER DETAIL RIWAYAT PENIMBANGAN BULANAN */}
      {selectedBalita && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(15, 23, 42, 0.6)",
          backdropFilter: "blur(3px)",
          zIndex: 60,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
        }}>
          <div style={{
            background: "#FFFFFF",
            borderRadius: 20,
            width: "100%",
            maxWidth: 640,
            maxHeight: "90vh",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            boxShadow: "0 25px 50px -12px rgba(15, 23, 42, 0.35)",
            border: "1.5px solid #CBD5E1",
          }}>
            {/* 1. Header Terpadu Kontras Tinggi */}
            <div className="modal-header-pad" style={{
              padding: "24px 28px 18px",
              borderBottom: "1.5px solid #E2E8F0",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 16,
              background: "#FFFFFF",
            }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                <div style={{
                  width: 50,
                  height: 50,
                  borderRadius: 14,
                  background: selectedBalita.jenisKelamin === "L" ? "#E0F2FE" : "#FCE7F3",
                  color: selectedBalita.jenisKelamin === "L" ? "#0369A1" : "#BE185D",
                  border: `1.5px solid ${selectedBalita.jenisKelamin === "L" ? "#BAE6FD" : "#FBCFE8"}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  fontSize: 20,
                  flexShrink: 0,
                }}>
                  {selectedBalita.nama.charAt(0)}
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", margin: 0, letterSpacing: "-0.01em" }}>
                      {selectedBalita.nama}
                    </h2>
                    {getStatusBadge(selectedBalita.statusGizi, selectedBalita.labelStatus)}
                  </div>
                  <div style={{ fontSize: 13, color: "#1E293B", marginTop: 5, lineHeight: 1.5, fontWeight: 500 }}>
                    Lahir: <strong style={{ color: "#0F172A", fontWeight: 700 }}>{selectedBalita.tanggalLahir}</strong> ({selectedBalita.umurBulan} bulan)
                    <br />
                    Ibu: <strong style={{ color: "#0F172A", fontWeight: 700 }}>{selectedBalita.namaIbu}</strong> • <span style={{ color: "#334155" }}>{selectedBalita.dusun}</span>
                  </div>
                </div>
              </div>

              {/* Tombol Close Hanya 'X' (Tegas & Kontras) */}
              <button
                type="button"
                onClick={() => setSelectedBalita(null)}
                aria-label="Tutup"
                title="Tutup"
                style={{
                  background: "#F1F5F9",
                  border: "1.5px solid #CBD5E1",
                  borderRadius: "50%",
                  width: 36,
                  height: 36,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "#0F172A",
                  flexShrink: 0,
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#E2E8F0";
                  e.currentTarget.style.borderColor = "#94A3B8";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#F1F5F9";
                  e.currentTarget.style.borderColor = "#CBD5E1";
                }}
              >
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>

            {/* 2. Isi Detail (Kontras Tajam, Mudah Dibaca, Tanpa Nyaru) */}
            <div className="modal-content-pad" style={{ padding: "22px 28px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 22 }}>
              {/* Ringkasan Angka Terakhir */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
                gap: 16,
                paddingBottom: 18,
                borderBottom: "1.5px solid #E2E8F0",
              }}>
                <div>
                  <div style={{ fontSize: 12, color: "#334155", fontWeight: 800, letterSpacing: "0.04em" }}>
                    BERAT BADAN
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: "#0F172A", marginTop: 2 }}>
                    {selectedBalita.beratTerakhir} <span style={{ fontSize: 14, fontWeight: 700, color: "#334155" }}>kg</span>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 12, color: "#334155", fontWeight: 800, letterSpacing: "0.04em" }}>
                    TINGGI BADAN
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: "#0F172A", marginTop: 2 }}>
                    {selectedBalita.tinggiTerakhir} <span style={{ fontSize: 14, fontWeight: 700, color: "#334155" }}>cm</span>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 12, color: "#334155", fontWeight: 800, letterSpacing: "0.04em" }}>
                    LINGKAR KEPALA
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: "#0F172A", marginTop: 2 }}>
                    {selectedBalita.lingkarKepalaTerakhir ? (
                      <>{selectedBalita.lingkarKepalaTerakhir} <span style={{ fontSize: 14, fontWeight: 700, color: "#334155" }}>cm</span></>
                    ) : (
                      <span style={{ fontSize: 14, color: "#94A3B8", fontWeight: 600 }}>Tidak diisi</span>
                    )}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 12, color: "#334155", fontWeight: 800, letterSpacing: "0.04em" }}>
                    LINGKAR LENGAN (LILA)
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: "#0F172A", marginTop: 2 }}>
                    {selectedBalita.lingkarLenganTerakhir ? (
                      <>{selectedBalita.lingkarLenganTerakhir} <span style={{ fontSize: 14, fontWeight: 700, color: "#334155" }}>cm</span></>
                    ) : (
                      <span style={{ fontSize: 14, color: "#94A3B8", fontWeight: 600 }}>Tidak diisi</span>
                    )}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 12, color: "#334155", fontWeight: 800, letterSpacing: "0.04em" }}>
                    SESI TERAKHIR
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#0F172A", marginTop: 6 }}>
                    {selectedBalita.terakhirTimbang}
                  </div>
                </div>
              </div>

              {/* Tabel Riwayat Bulanan (Teks Hitam Gelap & Tajam dengan scroll horizontal di HP) */}
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#0F172A", letterSpacing: "0.04em", marginBottom: 12 }}>
                  HISTORI PENIMBANGAN BULANAN
                </div>

                <div style={{ width: "100%", overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
                  <table style={{ width: "100%", minWidth: 460, borderCollapse: "collapse", fontSize: 14 }}>
                    <thead>
                      <tr style={{ borderBottom: "2px solid #CBD5E1", textAlign: "left", color: "#0F172A" }}>
                        <th style={{ padding: "10px 0", fontWeight: 800, fontSize: 13 }}>Bulan / Tgl</th>
                        <th style={{ padding: "10px 0", fontWeight: 800, fontSize: 13 }}>Usia</th>
                        <th style={{ padding: "10px 0", fontWeight: 800, fontSize: 13 }}>BB (kg)</th>
                        <th style={{ padding: "10px 0", fontWeight: 800, fontSize: 13 }}>TB (cm)</th>
                        <th style={{ padding: "10px 0", fontWeight: 800, fontSize: 13 }}>Tren KMS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedBalita.riwayat.map((r, i) => (
                        <tr key={i} style={{ borderBottom: "1px solid #E2E8F0" }}>
                          <td style={{ padding: "13px 0", fontWeight: 800, color: "#0F172A" }}>
                            {r.tanggal}
                          </td>
                          <td style={{ padding: "13px 0", fontWeight: 600, color: "#1E293B" }}>
                            {r.umurBulan} bln
                          </td>
                          <td style={{ padding: "13px 0", fontWeight: 800, color: "#0F172A" }}>
                            {r.beratKg} kg
                          </td>
                          <td style={{ padding: "13px 0", fontWeight: 800, color: "#0F172A" }}>
                            {r.tinggiCm} cm
                          </td>
                          <td style={{ padding: "13px 0" }}>
                            <span style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                              fontSize: 12,
                              fontWeight: 800,
                              color: r.statusTumbuh === "N" ? "#166534" : "#991B1B",
                              background: r.statusTumbuh === "N" ? "#DCFCE7" : "#FEE2E2",
                              border: `1px solid ${r.statusTumbuh === "N" ? "#86EFAC" : "#FCA5A5"}`,
                              padding: "3px 10px",
                              borderRadius: 99,
                            }}>
                              {r.statusTumbuh === "N" ? "▲ Naik (N)" : "▼ Turun (T)"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Catatan Intervensi Kader (Kontras Jelas) */}
              {selectedBalita.riwayat[0]?.catatan && (
                <div style={{
                  borderLeft: "4px solid #D97706",
                  padding: "6px 0 6px 14px",
                  background: "#FFFBEB",
                  borderRadius: "0 10px 10px 0",
                }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "#92400E", letterSpacing: "0.03em" }}>
                    CATATAN TINDAK LANJUT KADER
                  </div>
                  <div style={{ fontSize: 13, color: "#78350F", lineHeight: 1.5, marginTop: 4, fontWeight: 600 }}>
                    {selectedBalita.riwayat[0].catatan}
                  </div>
                </div>
              )}
            </div>

            {/* 3. Footer Aksi */}
            <div className="modal-header-pad" style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 10,
              padding: "16px 28px",
              borderTop: "1.5px solid #E2E8F0",
              background: "#F8FAFC",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                {onBukaGrafik && (
                  <button
                    type="button"
                    onClick={() => {
                      const id = selectedBalita.id;
                      setSelectedBalita(null);
                      onBukaGrafik(id);
                    }}
                    style={{
                      background: "#FFFFFF",
                      border: "1.5px solid #CBD5E1",
                      borderRadius: 12,
                      padding: "10px 16px",
                      fontSize: 13,
                      fontWeight: 700,
                      color: "#0F172A",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <Activity size={16} color="#16A34A" /> Grafik KMS
                  </button>
                )}

                {/* Tombol Ubah di Detail Modal */}
                <button
                  type="button"
                  onClick={() => {
                    const item = selectedBalita;
                    setSelectedBalita(null);
                    handleBukaEdit(item);
                  }}
                  style={{
                    background: "#EFF6FF",
                    border: "1.5px solid #BFDBFE",
                    borderRadius: 12,
                    padding: "10px 16px",
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#1D4ED8",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <Pencil size={15} /> Ubah Data
                </button>

                {/* Tombol Hapus di Detail Modal */}
                <button
                  type="button"
                  onClick={() => {
                    const item = selectedBalita;
                    setSelectedBalita(null);
                    setBalitaAkanDihapus(item);
                  }}
                  style={{
                    background: "#FEF2F2",
                    border: "1.5px solid #FECACA",
                    borderRadius: 12,
                    padding: "10px 14px",
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#DC2626",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <Trash2 size={15} /> Hapus
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedBalita(null);
                  onCatatBaru();
                }}
                style={{
                  background: "#16A34A",
                  border: "none",
                  borderRadius: 12,
                  padding: "11px 22px",
                  fontSize: 14,
                  fontWeight: 800,
                  color: "#FFFFFF",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  boxShadow: "0 2px 8px rgba(22, 163, 74, 0.3)",
                }}
              >
                <Plus size={18} /> Catat Penimbangan Baru
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. MODAL EDIT / UBAH DATA BALITA */}
      {editingBalita && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(15, 23, 42, 0.65)",
          backdropFilter: "blur(4px)",
          zIndex: 70,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
        }}>
          <div style={{
            background: "#FFFFFF",
            borderRadius: 20,
            width: "100%",
            maxWidth: 580,
            maxHeight: "92vh",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            boxShadow: "0 25px 50px -12px rgba(15, 23, 42, 0.4)",
            border: "1.5px solid #CBD5E1",
          }}>
            {/* Modal Header */}
            <div style={{
              padding: "20px 24px",
              borderBottom: "1.5px solid #E2E8F0",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "#F8FAFC",
            }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0F172A", margin: 0 }}>
                  Ubah Data Balita & Penimbangan
                </h2>
                <p style={{ fontSize: 12.5, color: "#64748B", margin: "4px 0 0 0" }}>
                  Koreksi kesalahan input data balita. Z-score WHO akan dihitung ulang secara otomatis.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingBalita(null)}
                style={{
                  background: "#FFFFFF",
                  border: "1.5px solid #CBD5E1",
                  borderRadius: "50%",
                  width: 34,
                  height: 34,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "#64748B",
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSimpanEdit} style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <div style={{ padding: "20px 24px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 16, maxHeight: "calc(92vh - 140px)" }}>
                {/* Nama Balita */}
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#1E293B", marginBottom: 6 }}>
                    Nama Lengkap Balita <span style={{ color: "#DC2626" }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editNama}
                    onChange={(e) => setEditNama(e.target.value)}
                    placeholder="Masukkan nama lengkap balita"
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: 10,
                      border: "1.5px solid #CBD5E1",
                      fontSize: 14,
                      color: "#0F172A",
                      fontWeight: 600,
                      background: "#F8FAFC",
                      outline: "none",
                    }}
                  />
                </div>

                {/* Jenis Kelamin */}
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#1E293B", marginBottom: 6 }}>
                    Jenis Kelamin <span style={{ color: "#DC2626" }}>*</span>
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <button
                      type="button"
                      onClick={() => setEditJk("L")}
                      style={{
                        padding: "10px",
                        borderRadius: 10,
                        border: editJk === "L" ? "2px solid #0284C7" : "1.5px solid #CBD5E1",
                        background: editJk === "L" ? "#E0F2FE" : "#FFFFFF",
                        color: editJk === "L" ? "#0369A1" : "#475569",
                        fontWeight: 700,
                        fontSize: 13,
                        cursor: "pointer",
                      }}
                    >
                      👦 Laki-laki
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditJk("P")}
                      style={{
                        padding: "10px",
                        borderRadius: 10,
                        border: editJk === "P" ? "2px solid #DB2777" : "1.5px solid #CBD5E1",
                        background: editJk === "P" ? "#FCE7F3" : "#FFFFFF",
                        color: editJk === "P" ? "#BE185D" : "#475569",
                        fontWeight: 700,
                        fontSize: 13,
                        cursor: "pointer",
                      }}
                    >
                      👧 Perempuan
                    </button>
                  </div>
                </div>

                {/* 3 Kolom: Usia, Berat, Tinggi */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#1E293B", marginBottom: 6 }}>
                      Usia (Bulan) <span style={{ color: "#DC2626" }}>*</span>
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={60}
                      required
                      value={editUmur}
                      onChange={(e) => setEditUmur(e.target.value)}
                      placeholder="Masukkan umur"
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: 10,
                        border: "1.5px solid #CBD5E1",
                        fontSize: 14,
                        fontWeight: 700,
                        color: "#0F172A",
                        background: "#F8FAFC",
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#1E293B", marginBottom: 6 }}>
                      Berat (kg) <span style={{ color: "#DC2626" }}>*</span>
                    </label>
                    <input
                      type="number"
                      step="0.05"
                      min={1}
                      max={40}
                      required
                      value={editBb}
                      onChange={(e) => setEditBb(e.target.value)}
                      placeholder="Masukkan berat"
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: 10,
                        border: "1.5px solid #CBD5E1",
                        fontSize: 14,
                        fontWeight: 700,
                        color: "#0F172A",
                        background: "#F8FAFC",
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#1E293B", marginBottom: 6 }}>
                      Tinggi (cm) <span style={{ color: "#DC2626" }}>*</span>
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min={35}
                      max={140}
                      required
                      value={editTb}
                      onChange={(e) => setEditTb(e.target.value)}
                      placeholder="Masukkan tinggi"
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: 10,
                        border: "1.5px solid #CBD5E1",
                        fontSize: 14,
                        fontWeight: 700,
                        color: "#0F172A",
                        background: "#F8FAFC",
                      }}
                    />
                  </div>
                </div>

                {/* 2 Kolom: Lingkar Kepala & Lingkar Lengan (Opsional) */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#1E293B", marginBottom: 6 }}>
                      Lingkar Kepala (cm) <span style={{ fontSize: 11, fontWeight: 500, color: "#64748B" }}>(Opsional)</span>
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min={25}
                      max={65}
                      value={editLingkarKepala}
                      onChange={(e) => setEditLingkarKepala(e.target.value)}
                      placeholder="Masukkan lingkar kepala (cm)"
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: 10,
                        border: "1.5px solid #CBD5E1",
                        fontSize: 14,
                        fontWeight: 700,
                        color: "#0F172A",
                        background: "#F8FAFC",
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#1E293B", marginBottom: 6 }}>
                      Lingkar Lengan / LiLA (cm) <span style={{ fontSize: 11, fontWeight: 500, color: "#64748B" }}>(Opsional)</span>
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min={7}
                      max={30}
                      value={editLingkarLengan}
                      onChange={(e) => setEditLingkarLengan(e.target.value)}
                      placeholder="Masukkan lingkar lengan (cm)"
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: 10,
                        border: "1.5px solid #CBD5E1",
                        fontSize: 14,
                        fontWeight: 700,
                        color: "#0F172A",
                        background: "#F8FAFC",
                      }}
                    />
                  </div>
                </div>

                {/* Nama Ibu */}
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#1E293B", marginBottom: 6 }}>
                    Nama Ibu / Wali
                  </label>
                  <input
                    type="text"
                    value={editNamaIbu}
                    onChange={(e) => setEditNamaIbu(e.target.value)}
                    placeholder="Masukkan nama ibu / orang tua"
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: 10,
                      border: "1.5px solid #CBD5E1",
                      fontSize: 14,
                      color: "#0F172A",
                      background: "#F8FAFC",
                    }}
                  />
                </div>

                {/* Dusun / Alamat */}
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#1E293B", marginBottom: 6 }}>
                    Dusun / Alamat
                  </label>
                  <input
                    type="text"
                    value={editDusun}
                    onChange={(e) => setEditDusun(e.target.value)}
                    placeholder="Masukkan nama dusun, RT, atau alamat"
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: 10,
                      border: "1.5px solid #CBD5E1",
                      fontSize: 14,
                      color: "#0F172A",
                      background: "#F8FAFC",
                    }}
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div style={{
                padding: "16px 24px",
                borderTop: "1.5px solid #E2E8F0",
                display: "flex",
                justifyContent: "flex-end",
                gap: 10,
                background: "#F8FAFC",
              }}>
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => setEditingBalita(null)}
                  style={{
                    padding: "9px 18px",
                    borderRadius: 10,
                    border: "1.5px solid #CBD5E1",
                    background: "#FFFFFF",
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#475569",
                    cursor: "pointer",
                  }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  style={{
                    padding: "9px 20px",
                    borderRadius: 10,
                    border: "none",
                    background: "#16A34A",
                    fontSize: 13,
                    fontWeight: 800,
                    color: "#FFFFFF",
                    cursor: isUpdating ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    boxShadow: "0 2px 6px rgba(22, 163, 74, 0.25)",
                  }}
                >
                  {isUpdating ? (
                    <>
                      <Loader2 size={15} className="animate-spin" /> Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save size={15} /> Simpan Perubahan
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. MODAL KONFIRMASI HAPUS BALITA */}
      {balitaAkanDihapus && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(15, 23, 42, 0.65)",
          backdropFilter: "blur(4px)",
          zIndex: 80,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
        }}>
          <div style={{
            background: "#FFFFFF",
            borderRadius: 20,
            width: "100%",
            maxWidth: 460,
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            gap: 18,
            boxShadow: "0 25px 50px -12px rgba(15, 23, 42, 0.4)",
            border: "1.5px solid #FCA5A5",
          }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: "#FEE2E2",
                color: "#DC2626",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}>
                <Trash2 size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: "#0F172A", margin: 0 }}>
                  Hapus Data Balita?
                </h3>
                <p style={{ fontSize: 13.5, color: "#64748B", margin: "6px 0 0 0", lineHeight: 1.5 }}>
                  Apakah Anda yakin ingin menghapus data <strong style={{ color: "#0F172A" }}>{balitaAkanDihapus.nama}</strong> beserta riwayat penimbangannya? Tindakan ini akan menghapus data permanen dari database Supabase.
                </p>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
              <button
                type="button"
                disabled={deletingId === balitaAkanDihapus.id}
                onClick={() => setBalitaAkanDihapus(null)}
                style={{
                  padding: "9px 18px",
                  borderRadius: 10,
                  border: "1.5px solid #CBD5E1",
                  background: "#FFFFFF",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#475569",
                  cursor: "pointer",
                }}
              >
                Batal
              </button>
              <button
                type="button"
                disabled={deletingId === balitaAkanDihapus.id}
                onClick={handleKonfirmasiHapus}
                style={{
                  padding: "9px 20px",
                  borderRadius: 10,
                  border: "none",
                  background: "#DC2626",
                  fontSize: 13,
                  fontWeight: 800,
                  color: "#FFFFFF",
                  cursor: deletingId === balitaAkanDihapus.id ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  boxShadow: "0 2px 6px rgba(220, 38, 38, 0.25)",
                }}
              >
                {deletingId === balitaAkanDihapus.id ? (
                  <>
                    <Loader2 size={15} className="animate-spin" /> Menghapus...
                  </>
                ) : (
                  <>
                    <Trash2 size={15} /> Ya, Hapus Data
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
