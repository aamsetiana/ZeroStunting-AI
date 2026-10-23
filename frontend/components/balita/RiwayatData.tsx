"use client";

import React, { useState, useMemo } from "react";
import {
  Search, Filter, Baby, Calendar, User, MapPin, Scale, Ruler,
  AlertTriangle, CheckCircle, XCircle, ChevronRight, X, Clock,
  Plus, ArrowUpDown, FileText, Activity
} from "lucide-react";

export interface PenimbanganRecord {
  tanggal: string;
  umurBulan: number;
  beratKg: number;
  tinggiCm: number;
  statusBbu: "normal" | "kurang" | "buruk" | "lebih";
  statusPbu: "normal" | "pendek" | "sangat_pendek" | "tinggi";
  statusBbpb: "normal" | "kurus" | "sangat_kurus" | "gemuk";
  statusTumbuh: "N" | "T" | "O" | "B"; // N = Naik, T = Turun, O = Baru, B = Bawah garis merah
  catatan?: string;
}

export interface BalitaItem {
  id: string;
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
  statusGizi: "normal" | "waspada" | "rujukan";
  labelStatus: string;
  riwayat: PenimbanganRecord[];
}

// Data awal Posyandu Melati 01 (Desa Sukamaju)
const INITIAL_BALITA: BalitaItem[] = [
  {
    id: "B-001",
    nama: "Alisya Putri",
    nik: "3208125409240001",
    jenisKelamin: "P",
    tanggalLahir: "2024-12-10",
    umurBulan: 22,
    namaIbu: "Ibu Nurul Hidayah",
    dusun: "Dusun Krajan (RT 02)",
    terakhirTimbang: "12 Okt 2026",
    beratTerakhir: 8.9,
    tinggiTerakhir: 76.5,
    statusGizi: "rujukan",
    labelStatus: "Perlu Rujukan Bidan",
    riwayat: [
      { tanggal: "12 Okt 2026", umurBulan: 22, beratKg: 8.9, tinggiCm: 76.5, statusBbu: "kurang", statusPbu: "sangat_pendek", statusBbpb: "kurus", statusTumbuh: "T", catatan: "Nafsu makan menurun sejak seminggu lalu. Rujuk ke Puskesmas." },
      { tanggal: "10 Sep 2026", umurBulan: 21, beratKg: 9.1, tinggiCm: 75.8, statusBbu: "kurang", statusPbu: "pendek", statusBbpb: "normal", statusTumbuh: "T", catatan: "BB turun 0.2 kg." },
      { tanggal: "12 Agu 2026", umurBulan: 20, beratKg: 9.3, tinggiCm: 75.0, statusBbu: "normal", statusPbu: "pendek", statusBbpb: "normal", statusTumbuh: "N", catatan: "Tumbuh terpantau." },
    ],
  },
  {
    id: "B-002",
    nama: "Siti Nurhaliza",
    nik: "3208126104250002",
    jenisKelamin: "P",
    tanggalLahir: "2025-04-18",
    umurBulan: 18,
    namaIbu: "Ibu Rahmawati",
    dusun: "Dusun Sukamaju (RT 01)",
    terakhirTimbang: "10 Okt 2026",
    beratTerakhir: 8.4,
    tinggiTerakhir: 73.5,
    statusGizi: "waspada",
    labelStatus: "Waspada Stunting",
    riwayat: [
      { tanggal: "10 Okt 2026", umurBulan: 18, beratKg: 8.4, tinggiCm: 73.5, statusBbu: "kurang", statusPbu: "pendek", statusBbpb: "normal", statusTumbuh: "N", catatan: "Kenaikan BB di bawah KBM. Beri edukasi MP-ASI kaya hewani." },
      { tanggal: "10 Sep 2026", umurBulan: 17, beratKg: 8.2, tinggiCm: 72.8, statusBbu: "kurang", statusPbu: "pendek", statusBbpb: "normal", statusTumbuh: "N" },
    ],
  },
  {
    id: "B-003",
    nama: "Daffa Pratama",
    nik: "3208121508250003",
    jenisKelamin: "L",
    tanggalLahir: "2025-08-15",
    umurBulan: 14,
    namaIbu: "Ibu Maya Sari",
    dusun: "Dusun Sukamaju (RT 03)",
    terakhirTimbang: "08 Okt 2026",
    beratTerakhir: 7.2,
    tinggiTerakhir: 69.0,
    statusGizi: "waspada",
    labelStatus: "Gizi Kurang",
    riwayat: [
      { tanggal: "08 Okt 2026", umurBulan: 14, beratKg: 7.2, tinggiCm: 69.0, statusBbu: "kurang", statusPbu: "normal", statusBbpb: "kurus", statusTumbuh: "N", catatan: "BB naik tipis 100gr." },
      { tanggal: "08 Sep 2026", umurBulan: 13, beratKg: 7.1, tinggiCm: 68.2, statusBbu: "kurang", statusPbu: "normal", statusBbpb: "kurus", statusTumbuh: "T" },
    ],
  },
  {
    id: "B-004",
    nama: "Budi Santoso",
    nik: "3208122410240004",
    jenisKelamin: "L",
    tanggalLahir: "2024-10-24",
    umurBulan: 24,
    namaIbu: "Ibu Hartini",
    dusun: "Dusun Krajan (RT 04)",
    terakhirTimbang: "12 Okt 2026",
    beratTerakhir: 12.5,
    tinggiTerakhir: 87.0,
    statusGizi: "normal",
    labelStatus: "Tumbuh Normal",
    riwayat: [
      { tanggal: "12 Okt 2026", umurBulan: 24, beratKg: 12.5, tinggiCm: 87.0, statusBbu: "normal", statusPbu: "normal", statusBbpb: "normal", statusTumbuh: "N", catatan: "Tumbuh sangat baik sesuai garis hijau KMS." },
      { tanggal: "12 Sep 2026", umurBulan: 23, beratKg: 12.2, tinggiCm: 86.2, statusBbu: "normal", statusPbu: "normal", statusBbpb: "normal", statusTumbuh: "N" },
      { tanggal: "12 Agu 2026", umurBulan: 22, beratKg: 11.9, tinggiCm: 85.5, statusBbu: "normal", statusPbu: "normal", statusBbpb: "normal", statusTumbuh: "N" },
    ],
  },
  {
    id: "B-005",
    nama: "Muhammad Farhan",
    nik: "3208121010230005",
    jenisKelamin: "L",
    tanggalLahir: "2023-10-10",
    umurBulan: 36,
    namaIbu: "Ibu Dewi Lestari",
    dusun: "Dusun Mekarsari (RT 01)",
    terakhirTimbang: "11 Okt 2026",
    beratTerakhir: 14.2,
    tinggiTerakhir: 94.0,
    statusGizi: "normal",
    labelStatus: "Tumbuh Normal",
    riwayat: [
      { tanggal: "11 Okt 2026", umurBulan: 36, beratKg: 14.2, tinggiCm: 94.0, statusBbu: "normal", statusPbu: "normal", statusBbpb: "normal", statusTumbuh: "N" },
      { tanggal: "11 Sep 2026", umurBulan: 35, beratKg: 13.9, tinggiCm: 93.3, statusBbu: "normal", statusPbu: "normal", statusBbpb: "normal", statusTumbuh: "N" },
    ],
  },
  {
    id: "B-006",
    nama: "Aulia Rahmadani",
    nik: "3208124505250006",
    jenisKelamin: "P",
    tanggalLahir: "2025-05-15",
    umurBulan: 17,
    namaIbu: "Ibu Anisa",
    dusun: "Dusun Mekarsari (RT 02)",
    terakhirTimbang: "09 Okt 2026",
    beratTerakhir: 9.8,
    tinggiTerakhir: 78.0,
    statusGizi: "normal",
    labelStatus: "Tumbuh Normal",
    riwayat: [
      { tanggal: "09 Okt 2026", umurBulan: 17, beratKg: 9.8, tinggiCm: 78.0, statusBbu: "normal", statusPbu: "normal", statusBbpb: "normal", statusTumbuh: "N" },
    ],
  },
  {
    id: "B-007",
    nama: "Rizky Ramadhan",
    nik: "3208121403240007",
    jenisKelamin: "L",
    tanggalLahir: "2024-03-14",
    umurBulan: 31,
    namaIbu: "Ibu Fatimah",
    dusun: "Dusun Krajan (RT 01)",
    terakhirTimbang: "08 Okt 2026",
    beratTerakhir: 10.1,
    tinggiTerakhir: 81.2,
    statusGizi: "rujukan",
    labelStatus: "Perlu Rujukan Bidan",
    riwayat: [
      { tanggal: "08 Okt 2026", umurBulan: 31, beratKg: 10.1, tinggiCm: 81.2, statusBbu: "kurang", statusPbu: "sangat_pendek", statusBbpb: "normal", statusTumbuh: "T", catatan: "Tinggi badan jauh di bawah -3SD. Jadwalkan kunjungan rumah bidan." },
      { tanggal: "08 Sep 2026", umurBulan: 30, beratKg: 10.2, tinggiCm: 81.0, statusBbu: "kurang", statusPbu: "sangat_pendek", statusBbpb: "normal", statusTumbuh: "T" },
    ],
  },
];

interface RiwayatDataProps {
  onCatatBaru: () => void;
  onBukaGrafik?: (nama: string) => void;
}

export function RiwayatData({ onCatatBaru, onBukaGrafik }: RiwayatDataProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("semua");
  const [filterDusun, setFilterDusun] = useState<string>("semua");
  const [selectedBalita, setSelectedBalita] = useState<BalitaItem | null>(null);

  // Filter daftar balita
  const filteredList = useMemo(() => {
    return INITIAL_BALITA.filter((item) => {
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

  const getStatusBadge = (statusGizi: string, label: string) => {
    if (statusGizi === "rujukan") {
      return (
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          background: "#FEE2E2", color: "#B91C1C", border: "1px solid #FECACA",
          padding: "4px 10px", borderRadius: 99, fontSize: 12, fontWeight: 700,
        }}>
          <XCircle size={13} /> {label}
        </span>
      );
    }
    if (statusGizi === "waspada") {
      return (
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          background: "#FEF3C7", color: "#B45309", border: "1px solid #FDE68A",
          padding: "4px 10px", borderRadius: 99, fontSize: 12, fontWeight: 700,
        }}>
          <AlertTriangle size={13} /> {label}
        </span>
      );
    }
    return (
      <span style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        background: "#DCFCE7", color: "#15803D", border: "1px solid #BBF7D0",
        padding: "4px 10px", borderRadius: 99, fontSize: 12, fontWeight: 700,
      }}>
        <CheckCircle size={13} /> {label}
      </span>
    );
  };

  return (
    <div style={{ maxWidth: 1040, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>
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

      {/* 3. Daftar Balita (Tabel Bersih & Responsif) */}
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
        }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>
            Menampilkan <span style={{ color: "#16A34A" }}>{filteredList.length}</span> Balita Terdaftar
          </div>
          <div style={{ fontSize: 12, color: "#64748B" }}>
            Terakhir update: Sesi Penimbangan Oktober 2026
          </div>
        </div>

        {filteredList.length === 0 ? (
          <div style={{ padding: "48px 20px", textAlign: "center" }}>
            <div style={{
              width: 56, height: 56, borderRadius: "50%",
              background: "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 12px",
            }}>
              <Search size={24} color="#94A3B8" />
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", marginBottom: 4 }}>
              Tidak ada balita yang cocok
            </div>
            <p style={{ fontSize: 13, color: "#64748B", margin: 0 }}>
              Coba ubah kata kunci pencarian atau ganti filter status gizi di atas.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {filteredList.map((balita, idx) => (
              <div
                key={balita.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "16px 20px",
                  borderBottom: idx === filteredList.length - 1 ? "none" : "1px solid #F1F5F9",
                  flexWrap: "wrap",
                  gap: 14,
                  transition: "background 0.15s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#F8FAF8")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#FFFFFF")}
              >
                {/* Kolom Profil Balita */}
                <div className="balita-row-meta" style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 260 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: balita.jenisKelamin === "L" ? "#E0F2FE" : "#FCE7F3",
                    color: balita.jenisKelamin === "L" ? "#0284C7" : "#DB2777",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 800, fontSize: 15, flexShrink: 0,
                  }}>
                    {balita.nama.charAt(0)}
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: "#0F172A" }}>
                        {balita.nama}
                      </span>
                      <span style={{
                        fontSize: 10, fontWeight: 700,
                        padding: "1px 6px", borderRadius: 4,
                        background: balita.jenisKelamin === "L" ? "#E0F2FE" : "#FCE7F3",
                        color: balita.jenisKelamin === "L" ? "#0284C7" : "#DB2777",
                      }}>
                        {balita.jenisKelamin === "L" ? "Laki-laki" : "Perempuan"}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: "#334155", marginTop: 2 }}>
                      Ibu: <strong style={{ color: "#0F172A" }}>{balita.namaIbu}</strong> • {balita.dusun}
                    </div>
                  </div>
                </div>

                {/* Kolom Hasil Timbang */}
                <div className="balita-row-stats" style={{ display: "flex", alignItems: "center", gap: 20 }}>
                  <div>
                    <div style={{ fontSize: 11, color: "#475569", fontWeight: 700 }}>USIA</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#0F172A" }}>
                      {balita.umurBulan} <span style={{ fontSize: 11, fontWeight: 600, color: "#475569" }}>bulan</span>
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 11, color: "#475569", fontWeight: 700 }}>BERAT (BB)</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#0F172A" }}>
                      {balita.beratTerakhir} <span style={{ fontSize: 11, fontWeight: 600, color: "#475569" }}>kg</span>
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 11, color: "#475569", fontWeight: 700 }}>TINGGI (TB)</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#0F172A" }}>
                      {balita.tinggiTerakhir} <span style={{ fontSize: 11, fontWeight: 600, color: "#475569" }}>cm</span>
                    </div>
                  </div>
                </div>

                {/* Kolom Status & Tombol Aksi */}
                <div className="balita-row-actions" style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  {getStatusBadge(balita.statusGizi, balita.labelStatus)}

                  <button
                    type="button"
                    onClick={() => setSelectedBalita(balita)}
                    style={{
                      background: "#F1F5F9",
                      border: "1px solid #CBD5E1",
                      borderRadius: 10,
                      padding: "8px 14px",
                      fontSize: 13,
                      fontWeight: 700,
                      color: "#334155",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#E2E8F0";
                      e.currentTarget.style.color = "#0F172A";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "#F1F5F9";
                      e.currentTarget.style.color = "#334155";
                    }}
                  >
                    Buka Riwayat <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
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
                gridTemplateColumns: "repeat(3, 1fr)",
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
                    SESI TERAKHIR
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "#0F172A", marginTop: 6 }}>
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

            {/* 3. Footer Aksi Minimalis (Hanya tombol aksi utama, tanpa tombol Tutup ganda) */}
            <div className="modal-header-pad" style={{
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              padding: "16px 28px",
              borderTop: "1.5px solid #E2E8F0",
              background: "#F8FAFC",
            }}>
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
                  padding: "12px 24px",
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
    </div>
  );
}
