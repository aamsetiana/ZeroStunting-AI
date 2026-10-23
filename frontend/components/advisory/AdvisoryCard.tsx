"use client";

import React, { useState } from "react";
import { Sparkles, Volume2, Copy, Check, Apple, Heart, ShieldAlert } from "lucide-react";
import type { AntropometriResult } from "@/lib/utils";

interface AdvisoryCardProps {
  result: AntropometriResult;
  form: {
    nama_anak?: string;
    umur_bulan: number | string;
    berat_kg: number | string;
    tinggi_cm: number | string;
    jenis_kelamin: "L" | "P";
  };
}

export function AdvisoryCard({ result, form }: AdvisoryCardProps) {
  const [activeTab, setActiveTab] = useState<"pangan" | "jadwal" | "edukasi">("pangan");
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const isStunting = result.ada_risiko_stunting;
  const isWasting = result.ada_risiko_wasting;
  const isUnderweight = result.ada_risiko_underweight;

  // Analisis teks berbasis status gizi WHO
  const analisisTeks = isStunting
    ? `Panjang/tinggi badan ananda (${form.tinggi_cm} cm) berada di bawah standar PB/U WHO (-2 SD). Sangat disarankan asupan asam amino esensial tinggi zat besi dan kalsium (seperti telur & hati ayam) untuk merangsang lempeng pertumbuhan tulang linear.`
    : isWasting || isUnderweight
    ? `Berat badan ananda (${form.berat_kg} kg) membutuhkan peningkatan densitas energi dan lemak sehat. Dianjurkan penambahan santan atau minyak kelapa pada setiap porsi makan bubur/nasi tim.`
    : `Alhamdulillah pertumbuhan ananda ${form.nama_anak ? form.nama_anak : ""} berada dalam grafik ideal standar WHO. Pertahankan pola makan seimbang 4 bintang dan lanjutkan pemantauan rutin setiap bulan di Posyandu.`;

  // WhatsApp Message Formatter
  const handleCopyWhatsApp = () => {
    const waText = `*PANDUAN INTERVENSI GIZI POSYANDU*
Nama Balita: ${form.nama_anak || "Ananda"} (${form.umur_bulan} bulan)
Status Pertumbuhan: ${isStunting ? "⚠️ Waspada Stunting (PB/U < -2)" : isWasting ? "⚠️ Waspada Gizi Kurang" : "✓ Normal Ideal"}
BB / TB: ${form.berat_kg} kg / ${form.tinggi_cm} cm

*Hasil Evaluasi Kader:*
${analisisTeks}

*Rekomendasi Menu Pangan Lokal:*
1. Pagi: Bubur Hati Ayam + Daun Kelor (Kaya Zat Besi & Vitamin A)
2. Siang: Nasi Tim Ikan Lele Santan (Omega-3 & Kalori Padat)
3. Sore: Puree Pisang Kepok + Kuning Telur Kukus

*Catatan Kader:*
Jaga sanitasi alat makan dan pastikan hadir di Posyandu bulan depan.
_Didukung oleh ZeroStunting AI Engine WHO 2006_`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(waText).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      });
    }
  };

  // Text-to-Speech
  const handleToggleSpeech = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const textToSpeak = `Ibu balita, berikut hasil evaluasi gizi ananda ${form.nama_anak || ""}. ${analisisTeks}. Rekomendasi menu: Berikan tim hati ayam dengan daun kelor dan olahan ikan bersantan untuk mengejar pertumbuhan optimal anak.`;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = "id-ID";
    utterance.rate = 0.95;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div
      style={{
        background: "#FFFFFF",
        border: "1px solid #BBF7D0",
        borderRadius: 16,
        padding: "20px",
        marginTop: 18,
        boxShadow: "0 4px 14px rgba(22, 163, 74, 0.08)",
      }}
    >
      {/* Header Panel */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: "#DCFCE7",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#16A34A",
            }}
          >
            <Sparkles size={18} />
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#0F172A" }}>
              Advisory Intervensi Gizi AI (Pangan Lokal Desa)
            </h4>
            <span style={{ fontSize: 11, color: "#16A34A", fontWeight: 600 }}>
              RAG Knowledge Base Terstandarisasi Kemenkes RI & WHO
            </span>
          </div>
        </div>

        {/* Action Buttons: Copy WhatsApp & Audio Readout */}
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={handleToggleSpeech}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: "6px 12px",
              borderRadius: 8,
              border: "1px solid #E2E8F0",
              background: isSpeaking ? "#DCFCE7" : "#FFFFFF",
              color: isSpeaking ? "#15803D" : "#475569",
              fontSize: 11.5,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <Volume2 size={14} color={isSpeaking ? "#16A34A" : "#64748B"} />
            <span>{isSpeaking ? "Membacakan..." : "Audio AI"}</span>
          </button>

          <button
            type="button"
            onClick={handleCopyWhatsApp}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: "6px 13px",
              borderRadius: 8,
              border: copied ? "1px solid #86EFAC" : "1px solid #BBF7D0",
              background: copied ? "#DCFCE7" : "#F0FDF4",
              color: "#15803D",
              fontSize: 11.5,
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            <span>{copied ? "Tersalin ✓" : "Salin ke WA Ibu"}</span>
          </button>
        </div>
      </div>

      {/* Evaluasi untuk Ibu Balita */}
      <div
        style={{
          background: "#F8FAFC",
          borderRadius: 10,
          padding: "12px 16px",
          marginBottom: 14,
          fontSize: 12.5,
          lineHeight: 1.6,
          color: "#334155",
          border: "1px solid #E2E8F0",
        }}
      >
        <strong style={{ color: "#0F172A" }}>Evaluasi untuk Ibu Balita: </strong>
        {analisisTeks}
      </div>

      {/* Tab Navigasi Rekomendasi */}
      <div style={{ display: "flex", gap: 6, marginBottom: 12, borderBottom: "1px solid #E2E8F0", paddingBottom: 8 }}>
        <button
          type="button"
          onClick={() => setActiveTab("pangan")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            padding: "5px 12px",
            borderRadius: 6,
            border: "none",
            background: activeTab === "pangan" ? "#DCFCE7" : "transparent",
            color: activeTab === "pangan" ? "#15803D" : "#64748B",
            fontWeight: activeTab === "pangan" ? 700 : 500,
            fontSize: 11.5,
            cursor: "pointer",
          }}
        >
          <Apple size={13} /> Menu Pangan Lokal
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("jadwal")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            padding: "5px 12px",
            borderRadius: 6,
            border: "none",
            background: activeTab === "jadwal" ? "#DCFCE7" : "transparent",
            color: activeTab === "jadwal" ? "#15803D" : "#64748B",
            fontWeight: activeTab === "jadwal" ? 700 : 500,
            fontSize: 11.5,
            cursor: "pointer",
          }}
        >
          <Heart size={13} /> Jadwal & Pola Makan
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("edukasi")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            padding: "5px 12px",
            borderRadius: 6,
            border: "none",
            background: activeTab === "edukasi" ? "#DCFCE7" : "transparent",
            color: activeTab === "edukasi" ? "#15803D" : "#64748B",
            fontWeight: activeTab === "edukasi" ? 700 : 500,
            fontSize: 11.5,
            cursor: "pointer",
          }}
        >
          <ShieldAlert size={13} /> Tindak Lanjut Kader
        </button>
      </div>

      {/* Konten Tab */}
      {activeTab === "pangan" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
          <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 10, padding: "10px 14px" }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#15803D", textTransform: "uppercase" }}>Pagi (Sarapan)</span>
            <p style={{ margin: "4px 0 0", fontSize: 12, fontWeight: 600, color: "#0F172A" }}>
              Bubur Hati Ayam + Daun Kelor
            </p>
            <span style={{ fontSize: 11, color: "#64748B" }}>Tinggi zat besi & vitamin A untuk regenerasi sel tulang.</span>
          </div>
          <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 10, padding: "10px 14px" }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#15803D", textTransform: "uppercase" }}>Siang</span>
            <p style={{ margin: "4px 0 0", fontSize: 12, fontWeight: 600, color: "#0F172A" }}>
              Nasi Tim Ikan Lele Kuah Santan
            </p>
            <span style={{ fontSize: 11, color: "#64748B" }}>Asam lemak sehat & kalori padat mengejar defisit BB.</span>
          </div>
          <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 10, padding: "10px 14px" }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#15803D", textTransform: "uppercase" }}>Sore & Selingan</span>
            <p style={{ margin: "4px 0 0", fontSize: 12, fontWeight: 600, color: "#0F172A" }}>
              Puree Pisang Kepok + Kuning Telur
            </p>
            <span style={{ fontSize: 11, color: "#64748B" }}>Protein hewani lengkap dengan kalium ramah pencernaan.</span>
          </div>
        </div>
      )}

      {activeTab === "jadwal" && (
        <div style={{ fontSize: 12, color: "#334155", lineHeight: 1.7 }}>
          <p style={{ margin: "0 0 6px" }}>
            <strong>Frekuensi Makan Dianjurkan:</strong> 3 kali makan utama + 2 kali selingan padat gizi.
          </p>
          <p style={{ margin: "0 0 6px" }}>
            <strong>Tekstur:</strong> Sesuaikan dengan usia balita (Bubur saring untuk 6-8 bln, cincang kasar/tim untuk 9-11 bln, menu keluarga untuk 12+ bln).
          </p>
          <p style={{ margin: 0 }}>
            <strong>Tips Kader:</strong> Berikan stimulasi responsif feeding (suapi dengan sabar, tanpa distraksi gawai).
          </p>
        </div>
      )}

      {activeTab === "edukasi" && (
        <div style={{ fontSize: 12, color: "#334155", lineHeight: 1.7 }}>
          <p style={{ margin: "0 0 6px" }}>
            <strong>Pantau Perkembangan:</strong> Jadwalkan penimbangan ulang 2 minggu lagi jika balita berada di zona kuning/merah.
          </p>
          <p style={{ margin: "0 0 6px" }}>
            <strong>Kriteria Rujukan Puskesmas:</strong> Rujuk segera ke Bidan Desa jika berat badan tidak naik selama 2 bulan berturut-turut (2T) atau Z-score &lt; -3 SD.
          </p>
          <p style={{ margin: 0 }}>
            <strong>Edukasi Ibu:</strong> Ingatkan ibu untuk memastikan air minum matang dan mencuci tangan sebelum menyiapkan makanan.
          </p>
        </div>
      )}
    </div>
  );
}
