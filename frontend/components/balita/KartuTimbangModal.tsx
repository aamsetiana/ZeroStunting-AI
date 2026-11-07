"use client";

import React, { useState, useMemo } from "react";
import {
  X, Printer, Share2, Copy, Check, MessageCircle,
  Baby, Calendar, Scale, Ruler, HeartHandshake,
  CheckCircle2, AlertTriangle, AlertCircle, Sparkles, MapPin
} from "lucide-react";
import { type BalitaItem } from "@/components/balita/RiwayatData";
import { type PosyanduItem } from "@/lib/utils";

interface KartuTimbangModalProps {
  balita: BalitaItem;
  activePosyandu?: PosyanduItem | null;
  onClose: () => void;
}

export function KartuTimbangModal({
  balita,
  activePosyandu,
  onClose,
}: KartuTimbangModalProps) {
  const [activeTab, setActiveTab] = useState<"kartu" | "wa">("kartu");
  const [copied, setCopied] = useState(false);
  const [noWa, setNoWa] = useState("");

  const posName = activePosyandu?.nama || "Posyandu Desa";
  const desaName = activePosyandu?.desa || "Sukamaju";
  const lastRecord = balita.riwayat && balita.riwayat[0];
  const tglTimbang = lastRecord?.tanggal || balita.terakhirTimbang || new Date().toISOString().split("T")[0];

  // Hitung jadwal posyandu bulan berikutnya (+30 hari)
  const nextPosyanduDate = useMemo(() => {
    try {
      const d = new Date(tglTimbang);
      if (isNaN(d.getTime())) return "Bulan Depan";
      d.setMonth(d.getMonth() + 1);
      return new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric"
      }).format(d);
    } catch {
      return "Bulan Depan";
    }
  }, [tglTimbang]);

  // Tanggal timbang terformat
  const tglTimbangFormatted = useMemo(() => {
    try {
      const d = new Date(tglTimbang);
      if (isNaN(d.getTime())) return tglTimbang;
      return new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric"
      }).format(d);
    } catch {
      return tglTimbang;
    }
  }, [tglTimbang]);

  // Status Tumbuh Kembang
  const isStunting = balita.statusGizi === "waspada" || balita.labelStatus.toLowerCase().includes("pendek") || balita.labelStatus.toLowerCase().includes("stunting");
  const isRujukan = balita.statusGizi === "rujukan";

  // Rekomendasi MPASI Pangan Lokal
  const saranGizi = useMemo(() => {
    if (isRujukan) {
      return "Ananda memerlukan pemantauan intensif di Puskesmas. Mohon konsultasikan dengan Bidan Desa / Poli Gizi untuk mendapatkan PMT pemulihan dan pemeriksaan lanjutan.";
    }
    if (isStunting) {
      return "Prioritaskan asupan protein hewani harian: 1 butir telur ayam setiap hari + ikan kembung/lele/hati ayam. Pastikan tekstur MPASI sesuai usia dan jaga kebersihan sanitasi.";
    }
    if (balita.umurBulan < 6) {
      return "Lanjutkan pemberian ASI Eksklusif sesering mungkin tanpa makanan/minuman tambahan lainnya.";
    }
    return "Pertahankan menu gizi seimbang kaya protein hewani (telur, ikan, daging, ayam) serta sayur dan buah. Lanjutkan pemberian ASI hingga usia 2 tahun.";
  }, [isRujukan, isStunting, balita.umurBulan]);

  // Status kenaikan berat badan (N / T)
  const statusKenaikan = lastRecord?.statusTumbuh === "N" ? "Naik Sesuai Garis Pertumbuhan (N)" : "Tidak Naik / Tetap (T)";

  // Format Teks WhatsApp yang Ramah & Menarik
  const waText = useMemo(() => {
    return (
`*KARTU HASIL PENIMBANGAN POSYANDU*
Unit: *${posName}* • Desa ${desaName}
Tanggal: ${tglTimbangFormatted}

Halo Bunda *${balita.namaIbu || "Orang Tua"}*, berikut ringkasan tumbuh kembang Ananda *${balita.nama}*:

👶 *Identitas Balita:*
• Nama: *${balita.nama}*
• Umur: ${balita.umurBulan} Bulan
• Jenis Kelamin: ${balita.jenisKelamin === "L" ? "Laki-laki" : "Perempuan"}

📊 *Hasil Pengukuran Hari Ini:*
• Berat Badan: *${balita.beratTerakhir} kg* (${statusKenaikan})
• Tinggi / Panjang: *${balita.tinggiTerakhir} cm*
${balita.lingkarKepalaTerakhir ? `• Lingkar Kepala: ${balita.lingkarKepalaTerakhir} cm\n` : ""}${balita.lingkarLenganTerakhir ? `• Lingkar Lengan (LiLA): ${balita.lingkarLenganTerakhir} cm\n` : ""}
🌟 *Status Pertumbuhan:*
*${balita.labelStatus}*

🥗 *Saran Kader & Menu Gizi:*
${saranGizi}

🗓️ *Jadwal Posyandu Berikutnya:*
*${nextPosyanduDate}*

Terima kasih atas kasih sayang dan komitmen Bunda mendampingi tumbuh kembang ananda tercinta. Sampai jumpa di Posyandu bulan depan ya Bunda! ❤️

_Kader ${posName} — Layanan Digital ZeroStunting AI_`
    );
  }, [posName, desaName, tglTimbangFormatted, balita, statusKenaikan, saranGizi, nextPosyanduDate]);

  const handleCopyWa = () => {
    navigator.clipboard.writeText(waText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOpenWhatsApp = () => {
    let cleanPhone = noWa.replace(/[^0-9]/g, "");
    if (cleanPhone.startsWith("0")) {
      cleanPhone = "62" + cleanPhone.substring(1);
    } else if (cleanPhone.startsWith("8")) {
      cleanPhone = "62" + cleanPhone;
    }
    const encoded = encodeURIComponent(waText);
    const waUrl = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encoded}`
      : `https://wa.me/?text=${encoded}`;
    window.open(waUrl, "_blank");
  };

  const handlePrintKartu = () => {
    window.print();
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.65)",
        backdropFilter: "blur(5px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 99999,
        padding: 16,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* CSS Cetak Khusus Kartu Timbang */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @media print {
          body * {
            visibility: hidden !important;
          }
          #kartu-timbang-printable, #kartu-timbang-printable * {
            visibility: visible !important;
          }
          #kartu-timbang-printable {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 24px !important;
            background: #FFFFFF !important;
            box-shadow: none !important;
            border: 2px solid #16A34A !important;
            border-radius: 16px !important;
            z-index: 999999 !important;
          }
          .no-print {
            display: none !important;
          }
          @page {
            size: A5 portrait;
            margin: 10mm;
          }
        }
      `}} />

      <div
        style={{
          background: "#FFFFFF",
          borderRadius: 20,
          maxWidth: 620,
          width: "100%",
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          overflow: "hidden",
        }}
      >
        {/* Header Modal */}
        <div
          className="no-print"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 22px",
            borderBottom: "1.5px solid #E2E8F0",
            background: "#F8FAFC",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: "#DCFCE7",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <HeartHandshake size={20} color="#15803D" />
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: "#0F172A", margin: 0 }}>
                Kartu Timbang & WhatsApp Orang Tua
              </h3>
              <p style={{ fontSize: 12, color: "#64748B", margin: 0 }}>
                Ringkasan pemantauan tumbuh kembang untuk Ananda {balita.nama}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#64748B",
              padding: 4,
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Pilihan: Kartu Visual vs WhatsApp */}
        <div
          className="no-print"
          style={{
            display: "flex",
            borderBottom: "1px solid #E2E8F0",
            background: "#FFFFFF",
            padding: "0 20px",
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab("kartu")}
            style={{
              padding: "12px 18px",
              border: "none",
              borderBottom: activeTab === "kartu" ? "3px solid #16A34A" : "3px solid transparent",
              background: "none",
              fontSize: 13.5,
              fontWeight: activeTab === "kartu" ? 800 : 600,
              color: activeTab === "kartu" ? "#15803D" : "#64748B",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 7,
            }}
          >
            <Baby size={16} />
            <span>Kartu Timbang Digital (KMS)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("wa")}
            style={{
              padding: "12px 18px",
              border: "none",
              borderBottom: activeTab === "wa" ? "3px solid #16A34A" : "3px solid transparent",
              background: "none",
              fontSize: 13.5,
              fontWeight: activeTab === "wa" ? 800 : 600,
              color: activeTab === "wa" ? "#15803D" : "#64748B",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 7,
            }}
          >
            <MessageCircle size={16} color="#16A34A" />
            <span>Kirim via WhatsApp Ibu</span>
          </button>
        </div>

        {/* Body Modal */}
        <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1 }}>
          {activeTab === "kartu" ? (
            /* TAB 1: KARTU DIGITAL HASIL PENIMBANGAN */
            <div
              id="kartu-timbang-printable"
              style={{
                background: "#FFFFFF",
                border: "2px solid #BBF7D0",
                borderRadius: 16,
                padding: 22,
                boxShadow: "0 4px 12px rgba(22, 163, 74, 0.06)",
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              {/* KOP KARTU POSYANDU */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1.5px solid #F1F5F9", paddingBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#16A34A", letterSpacing: "0.06em" }}>
                    KEMENTERIAN KESEHATAN RI • POSYANDU DESA
                  </div>
                  <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0F172A", margin: "2px 0 0 0" }}>
                    {posName.toUpperCase()}
                  </h2>
                  <div style={{ fontSize: 12, color: "#475569" }}>
                    Desa {desaName} • Layanan Tumbuh Kembang Balita
                  </div>
                </div>
                <div style={{ textAlign: "right", fontSize: 12, color: "#475569" }}>
                  <div style={{ fontWeight: 700, color: "#0F172A" }}>Tanggal Penimbangan:</div>
                  <div>{tglTimbangFormatted}</div>
                </div>
              </div>

              {/* Status Banner */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 14px",
                  borderRadius: 12,
                  background: isRujukan ? "#FEF2F2" : isStunting ? "#FFFBEB" : "#F0FDF4",
                  border: `1.5px solid ${isRujukan ? "#FECACA" : isStunting ? "#FDE68A" : "#BBF7D0"}`,
                }}
              >
                {isRujukan ? (
                  <AlertCircle size={20} color="#DC2626" />
                ) : isStunting ? (
                  <AlertTriangle size={20} color="#D97706" />
                ) : (
                  <CheckCircle2 size={20} color="#16A34A" />
                )}
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: isRujukan ? "#991B1B" : isStunting ? "#92400E" : "#166534" }}>
                    Status Gizi: {balita.labelStatus}
                  </div>
                  <div style={{ fontSize: 11.5, color: "#475569" }}>
                    Berdasarkan Standar Deviasi Baku WHO 2006 & Kemenkes RI
                  </div>
                </div>
              </div>

              {/* Data Balita */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, background: "#F8FAFC", padding: 12, borderRadius: 12, fontSize: 12.5 }}>
                <div>
                  <span style={{ color: "#64748B" }}>Nama Lengkap: </span>
                  <strong style={{ color: "#0F172A" }}>{balita.nama}</strong>
                </div>
                <div>
                  <span style={{ color: "#64748B" }}>Usia: </span>
                  <strong style={{ color: "#0F172A" }}>{balita.umurBulan} Bulan</strong>
                </div>
                <div>
                  <span style={{ color: "#64748B" }}>Ibu Kandung: </span>
                  <strong style={{ color: "#0F172A" }}>{balita.namaIbu || "-"}</strong>
                </div>
                <div>
                  <span style={{ color: "#64748B" }}>Jenis Kelamin: </span>
                  <strong style={{ color: "#0F172A" }}>{balita.jenisKelamin === "L" ? "Laki-laki" : "Perempuan"}</strong>
                </div>
              </div>

              {/* Grid 4 Hasil Ukur Utama */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 10, padding: "8px 10px", textAlign: "center" }}>
                  <div style={{ fontSize: 11, color: "#166534", fontWeight: 700 }}>Berat Badan</div>
                  <div style={{ fontSize: 17, fontWeight: 800, color: "#15803D", marginTop: 2 }}>
                    {balita.beratTerakhir} <span style={{ fontSize: 11, fontWeight: 600 }}>kg</span>
                  </div>
                  <div style={{ fontSize: 10, color: "#475569", marginTop: 2 }}>{lastRecord?.statusTumbuh === "N" ? "🟢 Naik" : "🟡 Tetap/Turun"}</div>
                </div>

                <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 10, padding: "8px 10px", textAlign: "center" }}>
                  <div style={{ fontSize: 11, color: "#166534", fontWeight: 700 }}>Tinggi/PB</div>
                  <div style={{ fontSize: 17, fontWeight: 800, color: "#15803D", marginTop: 2 }}>
                    {balita.tinggiTerakhir} <span style={{ fontSize: 11, fontWeight: 600 }}>cm</span>
                  </div>
                  <div style={{ fontSize: 10, color: "#475569", marginTop: 2 }}>{balita.umurBulan >= 24 ? "Berdiri" : "Telentang"}</div>
                </div>

                <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 10, padding: "8px 10px", textAlign: "center" }}>
                  <div style={{ fontSize: 11, color: "#475569", fontWeight: 700 }}>Lingkar Kepala</div>
                  <div style={{ fontSize: 17, fontWeight: 800, color: "#0F172A", marginTop: 2 }}>
                    {balita.lingkarKepalaTerakhir ?? "-"} <span style={{ fontSize: 11, fontWeight: 600 }}>cm</span>
                  </div>
                  <div style={{ fontSize: 10, color: "#64748B", marginTop: 2 }}>LiKa</div>
                </div>

                <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 10, padding: "8px 10px", textAlign: "center" }}>
                  <div style={{ fontSize: 11, color: "#475569", fontWeight: 700 }}>Lingkar Lengan</div>
                  <div style={{ fontSize: 17, fontWeight: 800, color: "#0F172A", marginTop: 2 }}>
                    {balita.lingkarLenganTerakhir ?? "-"} <span style={{ fontSize: 11, fontWeight: 600 }}>cm</span>
                  </div>
                  <div style={{ fontSize: 10, color: "#64748B", marginTop: 2 }}>LiLA</div>
                </div>
              </div>

              {/* Catatan Gizi & Saran Kader */}
              <div style={{ background: "#F0FDF4", border: "1px solid #86EFAC", borderRadius: 12, padding: "12px 14px" }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: "#166534", display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <Sparkles size={14} color="#16A34A" /> Catatan Edukasi & Rekomendasi Menu MPASI:
                </div>
                <div style={{ fontSize: 12.5, color: "#334155", lineHeight: 1.5 }}>
                  {saranGizi}
                </div>
              </div>

              {/* Info Jadwal Posyandu Berikutnya & TTD */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", paddingTop: 8, borderTop: "1px dashed #CBD5E1" }}>
                <div>
                  <div style={{ fontSize: 11, color: "#64748B" }}>Jadwal Penimbangan Bulan Depan:</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#15803D" }}>
                    📅 {nextPosyanduDate}
                  </div>
                </div>
                <div style={{ textAlign: "center", fontSize: 11.5, color: "#64748B" }}>
                  <div>Kader Penimbang,</div>
                  <div style={{ height: 28 }} />
                  <div style={{ fontWeight: 700, color: "#0F172A" }}>Kader {posName}</div>
                </div>
              </div>
            </div>
          ) : (
            /* TAB 2: FORMAT PESAN WHATSAPP & PENGIRIMAN */
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                  Nomor WhatsApp Ibu / Orang Tua (Opsional):
                </label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    type="tel"
                    className="input-field"
                    placeholder="Contoh: 08123456789 atau 628123456789"
                    value={noWa}
                    onChange={(e) => setNoWa(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    onClick={handleOpenWhatsApp}
                    style={{
                      background: "#25D366",
                      color: "#FFFFFF",
                      border: "none",
                      borderRadius: 10,
                      padding: "10px 18px",
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      boxShadow: "0 2px 6px rgba(37, 211, 102, 0.3)",
                    }}
                  >
                    <MessageCircle size={16} />
                    <span>Buka WhatsApp</span>
                  </button>
                </div>
                <p style={{ fontSize: 11.5, color: "#64748B", margin: "4px 0 0 0" }}>
                  Jika nomor dikosongkan, Anda dapat memilih kontak langsung saat WhatsApp terbuka.
                </p>
              </div>

              {/* Pratinjau Teks Pesan */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#334155" }}>
                    Pratinjau Teks Pesan WhatsApp:
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyWa}
                    style={{
                      background: copied ? "#DCFCE7" : "#F1F5F9",
                      border: `1px solid ${copied ? "#86EFAC" : "#CBD5E1"}`,
                      color: copied ? "#15803D" : "#475569",
                      borderRadius: 8,
                      padding: "4px 10px",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                    }}
                  >
                    {copied ? <Check size={13} color="#16A34A" /> : <Copy size={13} />}
                    <span>{copied ? "Tersalin!" : "Salin Teks"}</span>
                  </button>
                </div>

                <textarea
                  readOnly
                  rows={14}
                  value={waText}
                  style={{
                    width: "100%",
                    borderRadius: 12,
                    border: "1.5px solid #CBD5E1",
                    padding: "12px 14px",
                    fontSize: 12.5,
                    color: "#0F172A",
                    fontFamily: "monospace",
                    background: "#F8FAF8",
                    lineHeight: 1.5,
                    resize: "none",
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Modal */}
        <div
          className="no-print"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "14px 22px",
            borderTop: "1.5px solid #E2E8F0",
            background: "#F8FAFC",
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button
              type="button"
              onClick={handlePrintKartu}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "9px 15px",
                borderRadius: 10,
                border: "1.5px solid #CBD5E1",
                background: "#FFFFFF",
                color: "#334155",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              <Printer size={15} color="#475569" />
              <span>Cetak / Simpan PDF</span>
            </button>

            <button
              type="button"
              onClick={handleCopyWa}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "9px 15px",
                borderRadius: 10,
                border: "1.5px solid #CBD5E1",
                background: copied ? "#DCFCE7" : "#FFFFFF",
                color: copied ? "#15803D" : "#334155",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {copied ? <Check size={15} color="#16A34A" /> : <Copy size={15} />}
              <span>{copied ? "Tersalin!" : "Salin Pesan WA"}</span>
            </button>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button
              type="button"
              onClick={handleOpenWhatsApp}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                padding: "10px 18px",
                borderRadius: 10,
                border: "none",
                background: "#25D366",
                color: "#FFFFFF",
                fontSize: 13.5,
                fontWeight: 800,
                cursor: "pointer",
                boxShadow: "0 2px 6px rgba(37, 211, 102, 0.35)",
              }}
            >
              <MessageCircle size={17} />
              <span>Kirim ke WhatsApp Ibu</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "10px 16px",
                borderRadius: 10,
                border: "1.5px solid #CBD5E1",
                background: "#FFFFFF",
                color: "#475569",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

