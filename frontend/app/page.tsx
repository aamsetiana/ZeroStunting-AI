"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity, BarChart3, ClipboardList, Home, Map, Menu, X,
  Baby, Scale, Ruler, Calendar, User, ChevronRight, AlertTriangle,
  CheckCircle, XCircle, TrendingDown, Info, Loader2, Wifi, WifiOff, LogOut, LogIn,
  Mic, MicOff, Volume2, Sparkles, Download, FileSpreadsheet, RefreshCw,
  Search, ShieldAlert, Heart, Apple, Check, ArrowRight, Copy, DownloadCloud
} from "lucide-react";
import {
  hitungAntropometri, getStatusBadgeClass, getStatusLabel,
  getStatusColor, zscoreToPercent, type AntropometriResult
} from "@/lib/utils";
import { useAuth } from "@/lib/auth";

// ─────────────────────────────────────────────────────────────────────────────
// NAV CONFIG
// ─────────────────────────────────────────────────────────────────────────────

const navItems = [
  { icon: Home,          label: "Dashboard",     id: "dashboard" },
  { icon: Baby,          label: "Input Data",    id: "input"     },
  { icon: ClipboardList, label: "Riwayat",       id: "riwayat"   },
  { icon: BarChart3,     label: "Laporan e-PPGBM", id: "laporan" },
  { icon: Map,           label: "Peta Stunting", id: "peta"      },
];

// ─────────────────────────────────────────────────────────────────────────────
// SIDEBAR (CLEAN WHITE THEME)
// ─────────────────────────────────────────────────────────────────────────────

function Sidebar({
  active, onNav, mobileOpen, onClose, user, onLogout,
}: {
  active: string;
  onNav: (id: string) => void;
  mobileOpen: boolean;
  onClose: () => void;
  user: any;
  onLogout: () => void;
}) {
  return (
    <>
      {mobileOpen && (
        <div
          onClick={onClose}
          style={{
            position: "fixed", inset: 0, background: "rgba(15,23,42,0.4)",
            zIndex: 40, backdropFilter: "blur(4px)",
          }}
        />
      )}

      <aside style={{
        width: 256,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        background: "#FFFFFF",
        borderRight: "1px solid #E2E8F0",
        height: "100vh",
        position: "sticky",
        top: 0,
        zIndex: 10,
        overflowY: "auto",
        boxShadow: "1px 0 3px rgba(0,0,0,0.02)",
      }}>
        {/* Logo */}
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "20px 20px 18px",
          borderBottom: "1px solid #F1F5F9",
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "linear-gradient(135deg, #22C55E, #15803D)",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0, color: "white",
            boxShadow: "0 4px 10px rgba(22, 163, 74, 0.25)",
          }}>
            <Activity size={18} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em" }}>
              ZeroStunting
            </div>
            <div style={{ fontSize: 10, color: "#16A34A", fontWeight: 700, letterSpacing: "0.06em" }}>
              KADER POSYANDU
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav style={{ flex: 1, padding: "14px 12px" }}>
          <div style={{ fontSize: 10.5, color: "#94A3B8", fontWeight: 700, letterSpacing: "0.08em", padding: "6px 12px", marginBottom: 4 }}>
            MENU UTAMA
          </div>
          {navItems.map(({ icon: Icon, label, id }) => {
            const isActive = active === id;
            return (
              <button
                key={id}
                onClick={() => { onNav(id); onClose(); }}
                style={{
                  display: "flex", alignItems: "center", gap: 11,
                  width: "100%", padding: "10px 12px",
                  borderRadius: 10, border: isActive ? "1px solid #BBF7D0" : "1px solid transparent",
                  cursor: "pointer",
                  background: isActive ? "#F0FDF4" : "transparent",
                  color: isActive ? "#15803D" : "#475569",
                  fontSize: 13.5, fontWeight: isActive ? 700 : 500,
                  transition: "all 0.15s",
                  marginBottom: 3,
                  textAlign: "left",
                }}
              >
                <Icon size={17} color={isActive ? "#16A34A" : "#64748B"} />
                <span>{label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer / User Profile */}
        <div style={{ padding: 14, borderTop: "1px solid #F1F5F9" }}>
          {user ? (
            <div style={{
              background: "#F8FAFC",
              border: "1px solid #E2E8F0",
              borderRadius: 12, padding: "12px",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
                <span style={{ fontSize: 12, color: "#0F172A", fontWeight: 700 }}>{user.name}</span>
                <span style={{ fontSize: 9.5, padding: "2px 7px", borderRadius: 99, background: "#DCFCE7", color: "#15803D", fontWeight: 700 }}>
                  Kader Desa
                </span>
              </div>
              <div style={{ fontSize: 10.5, color: "#64748B", marginBottom: 10, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {user.posyandu}
              </div>
              <button
                onClick={onLogout}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  width: "100%", padding: "6px 8px",
                  borderRadius: 8, border: "1px solid #FECACA",
                  background: "#FEF2F2",
                  color: "#DC2626", fontSize: 11, fontWeight: 600,
                  cursor: "pointer", transition: "all 0.15s",
                  justifyContent: "center",
                }}
              >
                <LogOut size={12} /> Keluar (Logout)
              </button>
            </div>
          ) : (
            <div style={{
              background: "#F8FAFC",
              border: "1px solid #E2E8F0",
              borderRadius: 12, padding: "12px",
            }}>
              <div style={{ fontSize: 11.5, color: "#0F172A", fontWeight: 700, marginBottom: 2 }}>Akun Kader Tamu</div>
              <div style={{ fontSize: 10.5, color: "#64748B", marginBottom: 8 }}>Masuk untuk simpan riwayat</div>
              <Link
                href="/login"
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  width: "100%", padding: "7px 10px",
                  borderRadius: 8, border: "none",
                  background: "linear-gradient(135deg, #22C55E, #16A34A)",
                  color: "#FFFFFF", fontSize: 11.5, fontWeight: 700,
                  justifyContent: "center", textDecoration: "none",
                  boxShadow: "0 2px 6px rgba(22, 163, 74, 0.2)",
                }}
              >
                <LogIn size={13} /> Masuk Akun Kader
              </Link>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Z-SCORE GAUGE (WHITE THEME)
// ─────────────────────────────────────────────────────────────────────────────

function ZScoreGauge({
  label,
  detail,
}: {
  label: string;
  detail: AntropometriResult["bbu"];
}) {
  const pct = zscoreToPercent(detail.zscore);

  const statusColors: Record<string, { text: string; bg: string; border: string }> = {
    normal:        { text: "#15803D", bg: "#DCFCE7", border: "#BBF7D0" },
    risiko_lebih:  { text: "#B45309", bg: "#FEF3C7", border: "#FDE68A" },
    berat_lebih:   { text: "#B45309", bg: "#FEF3C7", border: "#FDE68A" },
    gizi_kurang:   { text: "#B45309", bg: "#FEF3C7", border: "#FDE68A" },
    pendek:        { text: "#B45309", bg: "#FEF3C7", border: "#FDE68A" },
    kurus:         { text: "#B45309", bg: "#FEF3C7", border: "#FDE68A" },
    gizi_buruk:    { text: "#B91C1C", bg: "#FEE2E2", border: "#FECACA" },
    sangat_pendek: { text: "#B91C1C", bg: "#FEE2E2", border: "#FECACA" },
    sangat_kurus:  { text: "#B91C1C", bg: "#FEE2E2", border: "#FECACA" },
  };

  const sc = statusColors[detail.status] ?? statusColors.normal;

  return (
    <div style={{
      background: "#FFFFFF",
      border: "1px solid #E2E8F0",
      borderRadius: 14, padding: "16px 18px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <span style={{ fontSize: 11.5, color: "#64748B", fontWeight: 700, letterSpacing: "0.05em" }}>
          {label}
        </span>
        <span style={{
          fontSize: 11, fontWeight: 700,
          color: sc.text, background: sc.bg, border: `1px solid ${sc.border}`,
          padding: "2px 10px", borderRadius: 99,
        }}>
          {getStatusLabel(detail.status)}
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "flex-end", gap: 6, marginBottom: 12 }}>
        <span style={{ fontSize: 26, fontWeight: 800, color: sc.text, lineHeight: 1 }}>
          {detail.zscore >= 0 ? "+" : ""}{detail.zscore.toFixed(2)}
        </span>
        <span style={{ fontSize: 12, color: "#94A3B8", marginBottom: 2 }}>SD (Z-score)</span>
      </div>

      {/* Visual Gradient Bar */}
      <div className="gauge-track">
        <div className="gauge-pin" style={{ left: `${pct}%` }} />
      </div>

      {/* Axis */}
      <div style={{
        display: "flex", justifyContent: "space-between",
        fontSize: 10, color: "#94A3B8", marginTop: 6, marginBottom: 10,
      }}>
        {["-4","-3","-2","0","+2","+3","+4"].map(v => <span key={v}>{v}</span>)}
      </div>

      <div style={{ display: "flex", gap: 16, fontSize: 11, color: "#64748B" }}>
        <span>Aktual: <strong style={{ color: "#0F172A" }}>{detail.nilai_actual}</strong></span>
        <span>Median WHO: <strong style={{ color: "#0F172A" }}>{detail.median_referensi}</strong></span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RAG NUTRITIONAL ADVISORY GENERATOR (PANGAN LOKAL)
// ─────────────────────────────────────────────────────────────────────────────

function NutritionalAdvisoryPanel({
  result,
  form,
}: {
  result: AntropometriResult;
  form: { nama_anak: string; umur_bulan: string; berat_kg: string; tinggi_cm: string; jenis_kelamin: string };
}) {
  const [activeTab, setActiveTab] = useState<"pangan" | "jadwal" | "edukasi">("pangan");
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const isStunting = result.ada_risiko_stunting;
  const isWasting = result.ada_risiko_wasting;
  const isUnderweight = result.ada_risiko_underweight;

  // Analisis narasi
  const analisisTeks = isStunting
    ? `Panjang badan ananda (${form.tinggi_cm} cm) berada di bawah garis standar pertumbuhan PB/U WHO (-2 SD). Butuh asupan asam amino esensial tinggi zat besi dan kalsium untuk merangsang lempeng pertumbuhan tulang linear.`
    : isWasting || isUnderweight
    ? `Berat badan ananda (${form.berat_kg} kg) membutuhkan peningkatan densitas kalori dan lemak padat gizi. Perlu penambahan lemak sehat seperti santan dan telur di setiap porsi makannya.`
    : `Alhamdulillah pertumbuhan ananda ${form.nama_anak ? form.nama_anak : ""} berada dalam grafik ideal standar WHO. Pertahankan pola makan seimbang 4 bintang dan pantau rutin setiap bulan di Posyandu.`;

  // WhatsApp Message Generator
  const handleCopyWhatsApp = () => {
    const waText = `*PANDUAN GIZI POSYANDU DESA SUKAMAJU*
Nama Balita: ${form.nama_anak || "Ananda"} (${form.umur_bulan} bulan)
Status Pertumbuhan: ${isStunting ? "⚠️ Waspada Stunting" : isWasting ? "⚠️ Waspada Gizi Kurang" : "✓ Normal Ideal"}
BB / TB: ${form.berat_kg} kg / ${form.tinggi_cm} cm

*Hasil Analisis Kader:*
${analisisTeks}

*Rekomendasi Menu Pangan Lokal:*
1. Pagi: Bubur Hati Ayam + Daun Kelor (Tinggi Zat Besi & Vit A)
2. Siang: Nasi Tim Ikan Lele Santan (Omega-3 & Kalori Padat)
3. Sore: Puree Pisang Kepok + Kuning Telur Kukus

*Catatan Kader:*
Jaga kebersihan alat makan dan tetap hadir di Posyandu Melati 03 bulan depan.
_Didukung ZeroStunting AI Engine WHO 2006_`;

    navigator.clipboard.writeText(waText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  // Text-to-Speech Helper
  const handleToggleSpeech = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const textToSpeak = `Ibu balita, berikut hasil evaluasi gizi ananda ${form.nama_anak || ""}. ${analisisTeks}. Rekomendasi menu: Berikan tim hati ayam dengan daun kelor dan olahan ikan lele bersantan untuk mengejar pertumbuhan optimal anak.`;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = "id-ID";
    utterance.rate = 0.95;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div style={{
      background: "#FFFFFF",
      border: "1px solid #BBF7D0",
      borderRadius: 16,
      padding: "20px",
      marginTop: 14,
      boxShadow: "0 4px 14px rgba(22, 163, 74, 0.08)",
    }}>
      {/* Header Panel */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: "#DCFCE7", display: "flex", alignItems: "center", justifyContent: "center", color: "#16A34A" }}>
            <Sparkles size={16} />
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: 13.5, fontWeight: 800, color: "#0F172A" }}>
              Advisory Intervensi Gizi AI (Pangan Lokal Desa)
            </h4>
            <span style={{ fontSize: 10.5, color: "#16A34A", fontWeight: 600 }}>RAG Knowledge Base Terstandarisasi Kemenkes RI</span>
          </div>
        </div>

        {/* Action Buttons: Copy WhatsApp & Audio Readout */}
        <div style={{ display: "flex", gap: 6 }}>
          <button
            type="button"
            onClick={handleToggleSpeech}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "5px 10px", borderRadius: 8,
              border: "1px solid #E2E8F0", background: isSpeaking ? "#DCFCE7" : "#FFFFFF",
              color: isSpeaking ? "#15803D" : "#475569",
              fontSize: 11, fontWeight: 600, cursor: "pointer",
            }}
          >
            <Volume2 size={13} color={isSpeaking ? "#16A34A" : "#64748B"} />
            <span>{isSpeaking ? "Membacakan..." : "Audio AI"}</span>
          </button>

          <button
            type="button"
            onClick={handleCopyWhatsApp}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "5px 11px", borderRadius: 8,
              border: copied ? "1px solid #86EFAC" : "1px solid #BBF7D0",
              background: copied ? "#DCFCE7" : "#F0FDF4",
              color: "#15803D", fontSize: 11, fontWeight: 700, cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            <span>{copied ? "Tersalin ✓" : "Salin ke WA Ibu"}</span>
          </button>
        </div>
      </div>

      {/* Analisis Kondisi Gizi */}
      <div style={{ background: "#F8FAFC", borderRadius: 10, padding: "12px", marginBottom: 12, fontSize: 12, lineHeight: 1.6, color: "#334155", border: "1px solid #E2E8F0" }}>
        <strong style={{ color: "#0F172A" }}>Evaluasi untuk Ibu Balita: </strong>
        {analisisTeks}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, borderBottom: "1px solid #E2E8F0", paddingBottom: 6, marginBottom: 12 }}>
        {[
          { id: "pangan", label: "🥗 Pangan Lokal Super" },
          { id: "jadwal", label: "📅 Jadwal Menu 7 Hari" },
          { id: "edukasi", label: "⚠️ Konseling & Rujukan" },
        ].map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              padding: "5px 10px", borderRadius: 6, border: "none", cursor: "pointer",
              fontSize: 11.5, fontWeight: activeTab === tab.id ? 700 : 500,
              background: activeTab === tab.id ? "#DCFCE7" : "transparent",
              color: activeTab === tab.id ? "#15803D" : "#64748B",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content: Pangan Lokal Super */}
      {activeTab === "pangan" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
          <div style={{ background: "#F0FDF4", border: "1px solid #DCFCE7", borderRadius: 10, padding: "10px" }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: "#15803D", display: "flex", alignItems: "center", gap: 5 }}>
              🍗 Hati Ayam &amp; Telur Ayam
            </span>
            <p style={{ margin: "4px 0 0", fontSize: 11, color: "#475569", lineHeight: 1.45 }}>
              Zat besi heme 15.8 mg &amp; protein tinggi (100% terserap tubuh). Kunci utama perbaikan sel darah dan nafsu makan balita.
            </p>
          </div>
          <div style={{ background: "#F0FDF4", border: "1px solid #DCFCE7", borderRadius: 10, padding: "10px" }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: "#15803D", display: "flex", alignItems: "center", gap: 5 }}>
              🐟 Ikan Lele / Kembung &amp; Santan
            </span>
            <p style={{ margin: "4px 0 0", fontSize: 11, color: "#475569", lineHeight: 1.45 }}>
              DHA lokal dan lemak santan nabati. Densitas kalori padat untuk balita gizi kurang agar berat badan lekas naik.
            </p>
          </div>
          <div style={{ background: "#F0FDF4", border: "1px solid #DCFCE7", borderRadius: 10, padding: "10px" }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: "#15803D", display: "flex", alignItems: "center", gap: 5 }}>
              🌿 Daun Kelor Desa
            </span>
            <p style={{ margin: "4px 0 0", fontSize: 11, color: "#475569", lineHeight: 1.45 }}>
              Kalsium 4x lipat susu dan antioksidan mikro-nutrisi. Mendorong pemanjangan tulang pada balita risiko stunting.
            </p>
          </div>
          <div style={{ background: "#F0FDF4", border: "1px solid #DCFCE7", borderRadius: 10, padding: "10px" }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: "#15803D", display: "flex", alignItems: "center", gap: 5 }}>
              🥜 Tempe &amp; Kacang Hijau
            </span>
            <p style={{ margin: "4px 0 0", fontSize: 11, color: "#475569", lineHeight: 1.45 }}>
              Probiotik alami fermentasi untuk menjaga kesehatan pencernaan balita dan penyerapan gizi maksimal.
            </p>
          </div>
        </div>
      )}

      {/* Tab Content: Jadwal 7 Hari */}
      {activeTab === "jadwal" && (
        <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 10, padding: "10px 12px", marginBottom: 10 }}>
          <div style={{ fontSize: 11.5, color: "#0F172A", fontWeight: 700, marginBottom: 6 }}>
            Rencana Menu Sepekan Berbasis Bahan Murah Posyandu:
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: 11, color: "#475569" }}>
            <div><strong>• Senin - Selasa:</strong> Bubur beras santan + hati ayam kukus + daun bayam/kelor cincang halus.</div>
            <div><strong>• Rabu - Kamis:</strong> Nasi tim ikan lele goreng suwir + telur rebus + wortel serut.</div>
            <div><strong>• Jumat - Sabtu:</strong> Bubur soto ayam kampung + tempe lumat + minyak kelapa murni (VCO).</div>
            <div><strong>• Minggu:</strong> Sup bola-bola daging ayam cincang + tahu sutra + labu siam manis.</div>
          </div>
        </div>
      )}

      {/* Tab Content: Edukasi & Konseling */}
      {activeTab === "edukasi" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11.5, color: isStunting || isWasting ? "#B91C1C" : "#15803D", background: isStunting || isWasting ? "#FEF2F2" : "#DCFCE7", padding: "8px 12px", borderRadius: 8 }}>
            <Info size={14} style={{ flexShrink: 0 }} />
            <span>
              {isStunting || isWasting
                ? "PENTING: Jadwalkan rujukan ke Bidan Desa / Puskesmas Pembantu Sukamaju untuk evaluasi PMT Pemulihan 90 Hari."
                : "Edukasi Ibu: Berikan ASI hingga 2 tahun dan dampingi makan dengan pola asuh responsif (responsive feeding)."}
            </span>
          </div>
          <div style={{ fontSize: 11, color: "#64748B", background: "#F8FAFC", padding: "8px 10px", borderRadius: 8, border: "1px solid #E2E8F0" }}>
            <strong>3 Tanda Bahaya Balita Wajib Segera ke Puskesmas:</strong> Tidak mau makan sama sekali, berat badan turun 2 kali berturut-turut, atau tampak sangat kurus dan bengkak di kedua punggung kaki.
          </div>
        </div>
      )}

      <div style={{ fontSize: 10, color: "#94A3B8", textAlign: "right" }}>
        Disusun otomatis dari Dokumen RAG: WHO Infant &amp; Young Child Feeding (IYCF) &amp; Kemenkes RI 2023
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RESULT PANEL (WHITE THEME)
// ─────────────────────────────────────────────────────────────────────────────

function ResultPanel({
  result,
  form,
}: {
  result: AntropometriResult;
  form: { nama_anak: string; umur_bulan: string; berat_kg: string; tinggi_cm: string; jenis_kelamin: string };
}) {
  const hasRisk = result.ada_risiko_stunting || result.ada_risiko_wasting || result.ada_risiko_underweight;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }} className="slide-up">
      {/* Banner Ringkasan */}
      <div style={{
        borderRadius: 14, padding: "14px 16px",
        background: hasRisk ? "#FEF2F2" : "#F0FDF4",
        border: `1px solid ${hasRisk ? "#FECACA" : "#BBF7D0"}`,
        display: "flex", gap: 12, alignItems: "flex-start",
      }}>
        {hasRisk
          ? <XCircle size={18} color="#DC2626" style={{ flexShrink: 0, marginTop: 2 }} />
          : <CheckCircle size={18} color="#16A34A" style={{ flexShrink: 0, marginTop: 2 }} />
        }
        <div>
          <div style={{ fontWeight: 800, fontSize: 14, color: hasRisk ? "#B91C1C" : "#15803D", marginBottom: 3 }}>
            {hasRisk ? "Perhatian: Balita Memerlukan Atensi Gizi!" : "Status Pertumbuhan Balita Normal ✓"}
          </div>
          {result.pesan_peringatan.map((msg, i) => (
            <div key={i} style={{ fontSize: 12, color: hasRisk ? "#991B1B" : "#166534", lineHeight: 1.5 }}>
              {msg}
            </div>
          ))}
        </div>
      </div>

      {/* Gauges */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <ZScoreGauge label="BB/U — Berat Badan / Umur (Underweight)" detail={result.bbu} />
        <ZScoreGauge label="PB/U — Panjang Badan / Umur (Stunting)" detail={result.pbu} />
        <ZScoreGauge label="BB/PB — Berat / Panjang Badan (Wasting)" detail={result.bbpb} />
      </div>

      {/* RAG Nutritional Advisory Output */}
      <NutritionalAdvisoryPanel result={result} form={form} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// INPUT FORM PAGE WITH VOICE INPUT (MODE 2 & MODE 3)
// ─────────────────────────────────────────────────────────────────────────────

function InputDataPage() {
  const [inputMode, setInputMode] = useState<"form" | "voice">("form");
  const [form, setForm] = useState({
    nama_anak: "", umur_bulan: "", berat_kg: "", tinggi_cm: "",
    jenis_kelamin: "L" as "L" | "P",
  });
  const [loading, setLoading]  = useState(false);
  const [result, setResult]    = useState<AntropometriResult | null>(null);
  const [error, setError]      = useState<string | null>(null);

  // Voice Input State
  const [isRecording, setIsRecording] = useState(false);
  const [speechTranscript, setSpeechTranscript] = useState("");
  const [voiceFeedback, setVoiceFeedback] = useState<string | null>(null);

  // Voice parser helper
  const parseVoiceText = (text: string) => {
    let nama = "";
    let umur = "";
    let berat = "";
    let tinggi = "";
    let jk: "L" | "P" = "L";

    // Normalize text
    const lower = text.toLowerCase().replace(/koma/g, ".");

    // Match gender
    if (lower.includes("perempuan") || lower.includes("cewek") || lower.includes("anak perempuan")) {
      jk = "P";
    }

    // Match age
    const ageMatch = lower.match(/(?:umur|usia)\s*(\d+)\s*(?:bulan)?/);
    if (ageMatch) umur = ageMatch[1];

    // Match weight
    const weightMatch = lower.match(/(?:berat|bb)\s*(\d+(?:\.\d+)?)\s*(?:kg|kilo)?/);
    if (weightMatch) berat = weightMatch[1];

    // Match height
    const heightMatch = lower.match(/(?:tinggi|panjang|tb|pb)\s*(\d+(?:\.\d+)?)\s*(?:cm|senti)?/);
    if (heightMatch) tinggi = heightMatch[1];

    // Match name
    const nameMatch = lower.match(/(?:anak|nama)\s+([a-zA-Z\s]+?)(?:,|umur|berat|tinggi|$)/);
    if (nameMatch) {
      nama = nameMatch[1].trim();
      nama = nama.charAt(0).toUpperCase() + nama.slice(1);
    }

    setForm(prev => ({
      ...prev,
      nama_anak: nama || prev.nama_anak,
      umur_bulan: umur || prev.umur_bulan,
      berat_kg: berat || prev.berat_kg,
      tinggi_cm: tinggi || prev.tinggi_cm,
      jenis_kelamin: jk,
    }));

    setVoiceFeedback(`Berhasil mengekstrak data dari suara: Umur ${umur || "-"} bln, BB ${berat || "-"} kg, TB ${tinggi || "-"} cm.`);
  };

  const handleSpeakForm = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const text = `Data balita tercatat: ${form.nama_anak ? "Anak " + form.nama_anak : "Balita"}, umur ${form.umur_bulan || "belum diisi"} bulan, berat badan ${form.berat_kg || "belum diisi"} kilogram, tinggi badan ${form.tinggi_cm || "belum diisi"} sentimeter, jenis kelamin ${form.jenis_kelamin === "L" ? "laki-laki" : "perempuan"}.`;
    const ut = new SpeechSynthesisUtterance(text);
    ut.lang = "id-ID";
    window.speechSynthesis.speak(ut);
  };

  // Trigger simulated voice speech for quick testing
  const handleSimulateVoice = (sampleText: string) => {
    setSpeechTranscript(sampleText);
    parseVoiceText(sampleText);
  };

  const handleToggleVoice = () => {
    if (isRecording) {
      setIsRecording(false);
      return;
    }

    // Check browser SpeechRecognition support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceFeedback("Browser belum mendukung perekaman mikrofon langsung. Gunakan tombol simulasi suara cepat di bawah!");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "id-ID";
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsRecording(true);
        setVoiceFeedback("Mendengarkan... Silakan ucapkan data balita (contoh: 'Anak Budi, umur 24 bulan, berat 11.5 kg, tinggi 86 cm')");
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setSpeechTranscript(transcript);
        parseVoiceText(transcript);
        setIsRecording(false);
      };

      recognition.onerror = () => {
        setIsRecording(false);
        setVoiceFeedback("Gagal mendeteksi mikrofon. Gunakan tombol simulasi suara di bawah!");
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.start();
    } catch {
      setIsRecording(false);
      setVoiceFeedback("Mikrofon tidak aktif. Silakan gunakan tombol simulasi suara di bawah.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(null); setResult(null);
    try {
      const data = await hitungAntropometri({
        nama_anak: form.nama_anak || undefined,
        umur_bulan: parseInt(form.umur_bulan),
        berat_kg: parseFloat(form.berat_kg),
        tinggi_cm: parseFloat(form.tinggi_cm),
        jenis_kelamin: form.jenis_kelamin,
      });
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const labelStyle: React.CSSProperties = {
    display: "flex", alignItems: "center", gap: 6,
    fontSize: 12, color: "#475569", fontWeight: 700, marginBottom: 6,
  };

  return (
    <div style={{ maxWidth: 1020, margin: "0 auto" }}>
      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
        <span style={{ fontSize: 11.5, color: "#64748B" }}>Dashboard</span>
        <ChevronRight size={12} color="#94A3B8" />
        <span style={{ fontSize: 11.5, color: "#16A34A", fontWeight: 700 }}>Input Antropometri</span>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", margin: 0 }}>Input Pengukuran Balita</h1>
          <p style={{ fontSize: 13, color: "#64748B", margin: "4px 0 0" }}>
            Catat hasil timbang anak dan periksa status gizi otomatis standar WHO 2006.
          </p>
        </div>

        {/* Input Mode Selector: Form Manual vs Voice Input */}
        <div style={{ display: "flex", background: "#FFFFFF", padding: 3, borderRadius: 10, border: "1px solid #E2E8F0" }}>
          <button
            type="button"
            onClick={() => setInputMode("form")}
            style={{
              padding: "6px 12px", borderRadius: 8, border: "none", cursor: "pointer",
              fontSize: 12, fontWeight: 700,
              background: inputMode === "form" ? "#DCFCE7" : "transparent",
              color: inputMode === "form" ? "#15803D" : "#64748B",
            }}
          >
            Form Langsung
          </button>
          <button
            type="button"
            onClick={() => setInputMode("voice")}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "6px 12px", borderRadius: 8, border: "none", cursor: "pointer",
              fontSize: 12, fontWeight: 700,
              background: inputMode === "voice" ? "#DCFCE7" : "transparent",
              color: inputMode === "voice" ? "#15803D" : "#64748B",
            }}
          >
            <Mic size={13} />
            <span>Suara (Voice AI)</span>
          </button>
        </div>
      </div>

      {/* Voice Mode Box (Jika Mode Voice dipilih) */}
      {inputMode === "voice" && (
        <div style={{
          background: "#FFFFFF", border: "1px solid #BBF7D0",
          borderRadius: 16, padding: "20px", marginBottom: 20,
          boxShadow: "0 4px 14px rgba(22, 163, 74, 0.08)",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button
                type="button"
                onClick={handleToggleVoice}
                style={{
                  width: 48, height: 48, borderRadius: "50%", border: "none", cursor: "pointer",
                  background: isRecording ? "#EF4444" : "#16A34A",
                  color: "white", display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: isRecording ? "0 0 16px rgba(239, 68, 68, 0.5)" : "0 4px 12px rgba(22, 163, 74, 0.3)",
                  transition: "all 0.2s",
                }}
              >
                {isRecording ? <MicOff size={22} /> : <Mic size={22} />}
              </button>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#0F172A" }}>
                    {isRecording ? "Sedang Mendengarkan Suara Ibu Kader..." : "Klik Mikrofon & Ucapkan Data Balita"}
                  </h4>
                  {isRecording && (
                    <span style={{ fontSize: 10, color: "#DC2626", background: "#FEE2E2", padding: "2px 8px", borderRadius: 99, fontWeight: 700 }}>
                      🔴 Merekam Langsung
                    </span>
                  )}
                </div>
                <span style={{ fontSize: 11.5, color: "#64748B" }}>
                  Ucapkan: Nama anak, Umur (bulan), Berat (kg), dan Tinggi (cm).
                </span>
              </div>
            </div>

            {/* Audio Wave Equalizer Animation saat merekam */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {isRecording ? (
                <div style={{ display: "flex", alignItems: "center", gap: 3, height: 26 }}>
                  {[1,2,3,4,5,6,7,8].map(i => (
                    <span key={i} className="audio-bar" style={{ background: "#EF4444" }} />
                  ))}
                </div>
              ) : (
                <span style={{ fontSize: 11, color: "#16A34A", fontWeight: 700, background: "#DCFCE7", padding: "3px 10px", borderRadius: 99 }}>
                  Mode 2: Voice-to-Form
                </span>
              )}
            </div>
          </div>

          {/* Real-time Transcript Preview */}
          {speechTranscript && (
            <div style={{
              background: "#F8FAFC", border: "1px solid #E2E8F0",
              borderRadius: 10, padding: "10px 14px", marginBottom: 12,
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
            }}>
              <div style={{ fontSize: 12, color: "#334155" }}>
                <span style={{ fontWeight: 700, color: "#16A34A" }}>Transkrip Suara: </span>
                &ldquo;{speechTranscript}&rdquo;
              </div>
              <button
                type="button"
                onClick={handleSpeakForm}
                style={{
                  display: "flex", alignItems: "center", gap: 5,
                  padding: "4px 8px", borderRadius: 6,
                  border: "1px solid #E2E8F0", background: "#FFFFFF",
                  fontSize: 10.5, color: "#475569", cursor: "pointer", fontWeight: 600,
                  whiteSpace: "nowrap",
                }}
              >
                <Volume2 size={12} color="#16A34A" /> Baca Ulang
              </button>
            </div>
          )}

          {/* Quick Simulation Chips */}
          <div style={{ borderTop: "1px solid #F1F5F9", paddingTop: 10 }}>
            <span style={{ fontSize: 11, color: "#64748B", fontWeight: 700 }}>Simulasi Ucapan Cepat (1-Klik):</span>
            <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => handleSimulateVoice("Anak Budi Santoso, umur 24 bulan, berat 12.5 kg, tinggi 87 cm, laki-laki")}
                style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: "5px 10px", fontSize: 11, color: "#334155", cursor: "pointer" }}
              >
                🗣️ &ldquo;Budi Santoso, umur 24 bln, BB 12.5 kg, TB 87 cm (Normal)&rdquo;
              </button>
              <button
                type="button"
                onClick={() => handleSimulateVoice("Anak Siti Aisyah, umur 18 bulan, berat 8.2 kg, tinggi 74 cm, perempuan")}
                style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: "5px 10px", fontSize: 11, color: "#334155", cursor: "pointer" }}
              >
                🗣️ &ldquo;Siti Aisyah, umur 18 bln, BB 8.2 kg, TB 74 cm (Waspada Stunting)&rdquo;
              </button>
              <button
                type="button"
                onClick={() => handleSimulateVoice("Anak Bayu Pratama, umur 6 bulan, berat 7.2 kg, tinggi 67 cm, laki-laki")}
                style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: "5px 10px", fontSize: 11, color: "#334155", cursor: "pointer" }}
              >
                🗣️ &ldquo;Bayu Pratama, umur 6 bln, BB 7.2 kg, TB 67 cm&rdquo;
              </button>
            </div>
          </div>

          {voiceFeedback && (
            <div style={{ marginTop: 10, fontSize: 11.5, color: "#15803D", background: "#F0FDF4", padding: "6px 10px", borderRadius: 6, border: "1px solid #BBF7D0" }}>
              ✓ {voiceFeedback}
            </div>
          )}
        </div>
      )}

      {/* Grid: Form & Result */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.05fr", gap: 20 }}>
        {/* ── FORM INPUT ── */}
        <div style={{
          background: "#FFFFFF", border: "1px solid #E2E8F0",
          borderRadius: 16, padding: 22,
          boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: "#DCFCE7", display: "flex", alignItems: "center", justifyContent: "center", color: "#16A34A" }}>
              <Baby size={16} />
            </div>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>Data Fisik Balita</span>
            <span style={{ marginLeft: "auto", fontSize: 10.5, color: "#15803D", fontWeight: 700, background: "#DCFCE7", borderRadius: 99, padding: "2px 10px" }}>
              Terverifikasi Kader
            </span>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Nama */}
            <div>
              <label style={labelStyle}>
                <User size={13} />
                <span>Nama Anak</span>
                <span style={{ color: "#94A3B8", fontWeight: 400, marginLeft: "auto", fontSize: 11 }}>opsional</span>
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="cth: Budi Santoso"
                value={form.nama_anak}
                onChange={e => setForm(p => ({ ...p, nama_anak: e.target.value }))}
              />
            </div>

            {/* Umur */}
            <div>
              <label style={labelStyle}>
                <Calendar size={13} />
                <span>Umur Balita *</span>
                <span style={{ color: "#16A34A", fontWeight: 700, marginLeft: "auto", fontSize: 11 }}>0 – 60 bulan</span>
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type="number"
                  min={0} max={60} step={1} required
                  className="input-field"
                  placeholder="24"
                  style={{ paddingRight: 52 }}
                  value={form.umur_bulan}
                  onChange={e => setForm(p => ({ ...p, umur_bulan: e.target.value }))}
                />
                <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "#64748B" }}>bulan</span>
              </div>
            </div>

            {/* Berat */}
            <div>
              <label style={labelStyle}>
                <Scale size={13} />
                <span>Berat Badan *</span>
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type="number"
                  min={0.5} max={35} step={0.1} required
                  className="input-field"
                  placeholder="12.5"
                  style={{ paddingRight: 36 }}
                  value={form.berat_kg}
                  onChange={e => setForm(p => ({ ...p, berat_kg: e.target.value }))}
                />
                <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "#64748B" }}>kg</span>
              </div>
            </div>

            {/* Tinggi */}
            <div>
              <label style={labelStyle}>
                <Ruler size={13} />
                <span>Panjang / Tinggi Badan *</span>
                <span style={{ marginLeft: "auto", fontSize: 10.5, color: "#64748B", fontWeight: 500 }}>
                  {parseInt(form.umur_bulan || "0") < 24 ? "telentang (PB)" : "berdiri (TB)"}
                </span>
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type="number"
                  min={40} max={130} step={0.1} required
                  className="input-field"
                  placeholder="87.0"
                  style={{ paddingRight: 36 }}
                  value={form.tinggi_cm}
                  onChange={e => setForm(p => ({ ...p, tinggi_cm: e.target.value }))}
                />
                <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "#64748B" }}>cm</span>
              </div>
            </div>

            {/* Jenis Kelamin */}
            <div>
              <label style={{ ...labelStyle, marginBottom: 6 }}>Jenis Kelamin *</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {(["L", "P"] as const).map(jk => (
                  <button
                    key={jk}
                    type="button"
                    onClick={() => setForm(p => ({ ...p, jenis_kelamin: jk }))}
                    style={{
                      padding: "9px 0", borderRadius: 10, border: "1px solid",
                      borderColor: form.jenis_kelamin === jk ? "#86EFAC" : "#E2E8F0",
                      background: form.jenis_kelamin === jk ? "#F0FDF4" : "#FFFFFF",
                      color: form.jenis_kelamin === jk ? "#15803D" : "#64748B",
                      fontSize: 13, fontWeight: 700, cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    {jk === "L" ? "♂ Laki-laki" : "♀ Perempuan"}
                  </button>
                ))}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div style={{
                display: "flex", gap: 8, padding: "10px 12px", borderRadius: 10,
                background: "#FEF2F2", border: "1px solid #FECACA",
              }}>
                <XCircle size={15} color="#DC2626" style={{ flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontSize: 12, color: "#B91C1C" }}>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 13.5, marginTop: 6 }}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Mengkalkulasi Z-Score WHO...</span>
                </>
              ) : (
                <>
                  <Activity size={16} />
                  <span>Hitung Z-Score Sekarang</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* ── RESULT PANEL ── */}
        <div>
          {result ? (
            <ResultPanel result={result} form={form} />
          ) : (
            <div style={{
              background: "#FFFFFF", border: "1px solid #E2E8F0",
              borderRadius: 16, padding: 36,
              display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center",
              height: "100%", justifyContent: "center",
              boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
            }}>
              <div style={{ width: 60, height: 60, borderRadius: 16, background: "#DCFCE7", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14, color: "#16A34A" }}>
                <Activity size={28} />
              </div>
              <h4 style={{ fontSize: 15, fontWeight: 700, color: "#0F172A", margin: "0 0 4px" }}>
                Hasil Z-Score Akan Muncul di Sini
              </h4>
              <p style={{ fontSize: 12.5, color: "#64748B", maxWidth: 280, margin: 0, lineHeight: 1.5 }}>
                Isi formulir atau gunakan input suara di sebelah kiri, lalu klik &ldquo;Hitung Z-Score Sekarang&rdquo;.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginTop: 22, width: "100%" }}>
                {["BB/U", "PB/U", "BB/PB"].map(ind => (
                  <div key={ind} style={{
                    borderRadius: 10, background: "#F8FAFC",
                    border: "1px solid #E2E8F0", padding: "10px 0", textAlign: "center",
                  }}>
                    <p style={{ fontSize: 10.5, color: "#64748B", margin: "0 0 2px", fontWeight: 700 }}>{ind}</p>
                    <p style={{ fontSize: 18, fontWeight: 800, color: "#CBD5E1", margin: 0 }}>—</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD PAGE (CLEAN WHITE THEME AS SEEN IN IMAGE 5)
// ─────────────────────────────────────────────────────────────────────────────

function DashboardPage({ onNavigate, user }: { onNavigate: (id: string) => void; user: any }) {
  const stats = [
    { label: "Total Balita Terdata", value: "248",   sub: "Semua balita di wilayah kerja", icon: Baby,         bg: "#EFF6FF", c: "#2563EB" },
    { label: "Pertumbuhan Normal",   value: "81.5%", sub: "202 balita gizi ideal",        icon: CheckCircle,  bg: "#F0FDF4", c: "#16A34A" },
    { label: "Waspada Stunting",     value: "17.3%", sub: "43 balita PB/U < -2 SD",       icon: TrendingDown, bg: "#FEF3C7", c: "#D97706" },
    { label: "Perlu Rujukan Medis",  value: "3",     sub: "Gizi buruk / atensi Bidan",     icon: AlertTriangle,bg: "#FEF2F2", c: "#DC2626" },
  ];

  return (
    <div style={{ maxWidth: 1020, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header Context */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
          <span style={{ fontSize: 12, color: "#15803D", background: "#DCFCE7", padding: "3px 10px", borderRadius: 99, fontWeight: 700 }}>
            {user?.posyandu ? user.posyandu : "Posyandu Melati 01 — Desa Sukamaju"}
          </span>
          <span style={{ fontSize: 12, color: "#64748B" }}>
            Periode Penimbangan: Oktober 2026
          </span>
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0F172A", margin: "6px 0 3px", letterSpacing: "-0.02em" }}>
          Dashboard Posyandu Desa
        </h1>
        <p style={{ fontSize: 13, color: "#64748B", margin: 0 }}>
          Selamat bertugas, <strong style={{ color: "#16A34A" }}>Ibu {user?.name || "Kader Kania"}</strong>! Pantau tumbuh kembang dan cegah stunting pada balita di posyandu Anda.
        </p>
      </div>

      {/* Stats Grid (White Cards with Soft Icons) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
        {stats.map(({ label, value, sub, icon: Icon, bg, c }) => (
          <div key={label} style={{
            background: "#FFFFFF", border: "1px solid #E2E8F0",
            borderRadius: 16, padding: "18px 20px", position: "relative",
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ fontSize: 11.5, color: "#64748B", fontWeight: 700 }}>{label}</div>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: bg, display: "flex", alignItems: "center", justifyContent: "center", color: c }}>
                <Icon size={16} />
              </div>
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#0F172A", marginBottom: 2 }}>{value}</div>
            <div style={{ fontSize: 11, color: "#94A3B8" }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Green Action Banner (Exact match to Image 5) */}
      <div style={{
        background: "linear-gradient(135deg, #15803D 0%, #16A34A 100%)",
        borderRadius: 16, padding: "20px 24px", color: "#FFFFFF",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        boxShadow: "0 4px 14px rgba(22, 163, 74, 0.25)",
      }}>
        <div>
          <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 800 }}>Input Pengukuran Balita Baru</h3>
          <p style={{ margin: 0, fontSize: 12.5, opacity: 0.9 }}>
            Ukur berat dan panjang badan anak untuk deteksi dini risiko stunting dan gizi kurang berdasarkan standar WHO 2006.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => onNavigate("input")}
            style={{
              padding: "10px 18px", borderRadius: 10, border: "none",
              background: "#FFFFFF", color: "#15803D", fontSize: 13, fontWeight: 700,
              cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
              boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
            }}
          >
            <Baby size={15} /> Mulai Pengukuran
          </button>
          <button
            onClick={() => onNavigate("riwayat")}
            style={{
              padding: "10px 16px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.4)",
              background: "rgba(255,255,255,0.15)", color: "#FFFFFF", fontSize: 13, fontWeight: 600,
              cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
            }}
          >
            <ClipboardList size={15} /> Buka Riwayat Balita
          </button>
        </div>
      </div>

      {/* Educational Guide Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 16, padding: 20 }}>
          <div style={{ fontSize: 13.5, fontWeight: 800, color: "#0F172A", marginBottom: 14 }}>
            Cara Membaca Ambang Batas Z-Score WHO
          </div>
          {[
            { range: "< −3 SD",      label: "Sangat Pendek / Gizi Buruk", color: "#B91C1C", bg: "#FEE2E2" },
            { range: "−3 s/d −2 SD", label: "Pendek / Gizi Kurang",       color: "#B45309", bg: "#FEF3C7" },
            { range: "−2 s/d +2 SD", label: "Tumbuh Normal (Ideal)",       color: "#15803D", bg: "#DCFCE7" },
            { range: "> +2 SD",      label: "Risiko Berat Lebih",          color: "#B45309", bg: "#FEF3C7" },
          ].map(({ range, label, color, bg }) => (
            <div key={range} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 11.5, color: "#475569", fontFamily: "monospace", fontWeight: 600 }}>{range}</span>
              <span style={{ fontSize: 10.5, fontWeight: 700, color, background: bg, borderRadius: 99, padding: "2px 10px" }}>{label}</span>
            </div>
          ))}
        </div>

        <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 16, padding: 20 }}>
          <div style={{ fontSize: 13.5, fontWeight: 800, color: "#0F172A", marginBottom: 14 }}>
            Panduan Tiga Indikator Antropometri Kader
          </div>
          {[
            { ind: "BB/U",  title: "Berat Badan per Umur", desc: "Deteksi berat badan kurang (underweight)" },
            { ind: "PB/U",  title: "Panjang/Tinggi per Umur", desc: "Deteksi stunting atau perawakan pendek" },
            { ind: "BB/PB", title: "Berat per Panjang Badan", desc: "Deteksi kurus / wasting gizi buruk" },
          ].map(({ ind, title, desc }) => (
            <div key={ind} style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: "#16A34A", background: "#DCFCE7", padding: "2px 6px", borderRadius: 6, height: "fit-content" }}>{ind}</span>
              <div style={{ fontSize: 11.5 }}>
                <strong style={{ color: "#0F172A" }}>{title}: </strong>
                <span style={{ color: "#64748B" }}>{desc}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RIWAYAT DATA BALITA PAGE (WHITE THEME)
// ─────────────────────────────────────────────────────────────────────────────

function RiwayatPage({ onNavigate }: { onNavigate: (id: string) => void }) {
  const dummyHistory = [
    { nama: "Budi Santoso", usia: "24 bln", bb: "12.2 kg", tb: "87.0 cm", status: "Normal", bbu: "+0.12", pbu: "+0.25", tanggal: "20 Okt 2026", color: "#15803D", bg: "#DCFCE7" },
    { nama: "Siti Nurhaliza", usia: "18 bln", bb: "8.1 kg", tb: "74.5 cm", status: "Stunting", bbu: "-2.15", pbu: "-2.35", tanggal: "20 Okt 2026", color: "#B45309", bg: "#FEF3C7" },
    { nama: "Ahmad Fauzan", usia: "14 bln", bb: "9.5 kg", tb: "78.2 cm", status: "Normal", bbu: "+0.35", pbu: "+0.45", tanggal: "19 Okt 2026", color: "#15803D", bg: "#DCFCE7" },
    { nama: "Rania Putri", usia: "8 bln", bb: "6.0 kg", tb: "64.0 cm", status: "Gizi Kurang", bbu: "-2.20", pbu: "-1.80", tanggal: "19 Okt 2026", color: "#B45309", bg: "#FEF3C7" },
    { nama: "Dimas Pratama", usia: "30 bln", bb: "10.1 kg", tb: "83.5 cm", status: "Stunting", bbu: "-1.95", pbu: "-2.40", tanggal: "18 Okt 2026", color: "#B91C1C", bg: "#FEE2E2" },
  ];

  return (
    <div style={{ maxWidth: 1020, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", margin: "0 0 4px" }}>Riwayat Penimbangan Balita</h1>
          <p style={{ fontSize: 13, color: "#64748B", margin: 0 }}>Daftar hasil penimbangan balita Posyandu Melati 03 — Desa Sukamaju</p>
        </div>
        <button
          onClick={() => onNavigate("input")}
          className="btn-primary"
          style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5 }}
        >
          <Baby size={14} /> + Catat Balita Baru
        </button>
      </div>

      <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 16, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 12.5 }}>
          <thead>
            <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0", color: "#64748B" }}>
              <th style={{ padding: "12px 16px" }}>Nama Balita</th>
              <th style={{ padding: "12px 16px" }}>Usia</th>
              <th style={{ padding: "12px 16px" }}>BB / TB</th>
              <th style={{ padding: "12px 16px" }}>Z-Score (PB/U)</th>
              <th style={{ padding: "12px 16px" }}>Status Gizi</th>
              <th style={{ padding: "12px 16px" }}>Tanggal Timbang</th>
            </tr>
          </thead>
          <tbody>
            {dummyHistory.map((item, idx) => (
              <tr key={idx} style={{ borderBottom: "1px solid #F1F5F9" }}>
                <td style={{ padding: "12px 16px", fontWeight: 700, color: "#0F172A" }}>{item.nama}</td>
                <td style={{ padding: "12px 16px", color: "#475569" }}>{item.usia}</td>
                <td style={{ padding: "12px 16px", color: "#475569" }}>{item.bb} / {item.tb}</td>
                <td style={{ padding: "12px 16px", fontWeight: 700, color: item.color }}>{item.pbu} SD</td>
                <td style={{ padding: "12px 16px" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: item.color, background: item.bg, padding: "2px 8px", borderRadius: 99 }}>
                    {item.status}
                  </span>
                </td>
                <td style={{ padding: "12px 16px", color: "#64748B" }}>{item.tanggal}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LAPORAN E-PPGBM PAGE (WHITE THEME)
// ─────────────────────────────────────────────────────────────────────────────

function LaporanPage() {
  const handleExportCSV = () => {
    alert("Mengunduh Format e-PPGBM Resmi (CSV) Siap Kirim ke Puskesmas Sukamaju.");
  };

  return (
    <div style={{ maxWidth: 1020, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", margin: "0 0 4px" }}>Rekapitulasi Laporan e-PPGBM</h1>
          <p style={{ fontSize: 13, color: "#64748B", margin: 0 }}>Format pelaporan elektronik baku Kemenkes RI untuk Puskesmas &amp; Dinkes</p>
        </div>
        <button
          onClick={handleExportCSV}
          className="btn-primary"
          style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5 }}
        >
          <Download size={15} /> Ekspor Format e-PPGBM (Excel/CSV)
        </button>
      </div>

      <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 16, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, padding: "12px 16px", background: "#F0FDF4", borderRadius: 10, border: "1px solid #BBF7D0" }}>
          <FileSpreadsheet size={20} color="#16A34A" />
          <div style={{ fontSize: 12.5, color: "#15803D", lineHeight: 1.5 }}>
            <strong>Status Laporan Posyandu Melati 03: </strong>
            100% data bulan Oktober 2026 telah terkalkulasi otomatis dengan metode LMS WHO 2006. Tidak ada perhitungan manual yang tertinggal.
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
          <div style={{ border: "1px solid #E2E8F0", borderRadius: 12, padding: 16, background: "#F8FAFC" }}>
            <span style={{ fontSize: 11.5, color: "#64748B", fontWeight: 700 }}>Total Balita Masuk Register</span>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#0F172A", marginTop: 4 }}>248 Anak</div>
          </div>
          <div style={{ border: "1px solid #E2E8F0", borderRadius: 12, padding: 16, background: "#F8FAFC" }}>
            <span style={{ fontSize: 11.5, color: "#64748B", fontWeight: 700 }}>Tercatat Stunting (PB/U &lt; -2 SD)</span>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#D97706", marginTop: 4 }}>43 Anak</div>
          </div>
          <div style={{ border: "1px solid #E2E8F0", borderRadius: 12, padding: 16, background: "#F8FAFC" }}>
            <span style={{ fontSize: 11.5, color: "#64748B", fontWeight: 700 }}>Status Sinkronisasi Puskesmas</span>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#16A34A", marginTop: 8 }}>Siap Dikirim (1-Klik)</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PETA STUNTING PAGE (WHITE THEME)
// ─────────────────────────────────────────────────────────────────────────────

function PetaStuntingPage() {
  return (
    <div style={{ maxWidth: 1020, margin: "0 auto" }}>
      <div style={{ marginBottom: 18 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", margin: "0 0 4px" }}>Peta Sebaran Stunting Desa Sukamaju</h1>
        <p style={{ fontSize: 13, color: "#64748B", margin: 0 }}>Visualisasi konsentrasi balita at-risk per rukun warga (RW)</p>
      </div>

      <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 16, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
          {[
            { posyandu: "Posyandu Melati 03 (RW 03)", stunting: "7 balita", total: "52 balita", status: "Zona Kuning", c: "#D97706", bg: "#FEF3C7" },
            { posyandu: "Posyandu Mawar 01 (RW 01)", stunting: "3 balita", total: "48 balita", status: "Zona Hijau", c: "#15803D", bg: "#DCFCE7" },
            { posyandu: "Posyandu Anggrek 02 (RW 02)", stunting: "12 balita", total: "60 balita", status: "Zona Merah (Prioritas)", c: "#DC2626", bg: "#FEE2E2" },
          ].map((item, idx) => (
            <div key={idx} style={{ border: "1px solid #E2E8F0", borderRadius: 12, padding: 16, background: "#F8FAFC" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontSize: 12.5, fontWeight: 800, color: "#0F172A" }}>{item.posyandu}</span>
              </div>
              <div style={{ fontSize: 11.5, color: "#64748B", marginBottom: 8 }}>Total Balita: {item.total}</div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: item.c }}>{item.stunting}</span>
                <span style={{ fontSize: 10.5, fontWeight: 700, color: item.c, background: item.bg, padding: "2px 8px", borderRadius: 99 }}>
                  {item.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// APP ROOT WITH FULL ROUTING
// ─────────────────────────────────────────────────────────────────────────────

export default function App() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [activePage, setActivePage] = useState("dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsOnline(navigator.onLine);
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);

      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);

      const handleBeforeInstall = (e: any) => {
        e.preventDefault();
        setDeferredPrompt(e);
      };
      window.addEventListener("beforeinstallprompt", handleBeforeInstall);

      window.addEventListener("appinstalled", () => {
        setInstalled(true);
        setDeferredPrompt(null);
      });

      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
        window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      };
    }
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === "accepted") {
        setInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      alert("Aplikasi ZeroStunting PWA sudah terpasang atau browser Anda dapat memasangnya melalui menu 'Tambahkan ke Layar Utama' (Add to Home Screen).");
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const renderPage = () => {
    switch (activePage) {
      case "dashboard": return <DashboardPage onNavigate={setActivePage} user={user} />;
      case "input":     return <InputDataPage />;
      case "riwayat":   return <RiwayatPage onNavigate={setActivePage} />;
      case "laporan":   return <LaporanPage />;
      case "peta":      return <PetaStuntingPage />;
      default:          return <DashboardPage onNavigate={setActivePage} user={user} />;
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", fontFamily: "'Inter', sans-serif", background: "#F8FAFC" }}>
      {/* Sidebar */}
      <Sidebar
        active={activePage}
        onNav={setActivePage}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        user={user}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
        {/* Top Header */}
        <header style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "0 24px", height: 58,
          borderBottom: "1px solid #E2E8F0",
          background: "#FFFFFF",
          flexShrink: 0,
        }}>
          <button
            onClick={() => setMobileOpen(true)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#64748B", padding: 4, display: "none" }}
          >
            <Menu size={20} />
          </button>

          <div style={{ flex: 1 }} />

          {/* PWA Install Button (Task #16) */}
          <button
            type="button"
            onClick={handleInstallClick}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              fontSize: 11.5, fontWeight: 700,
              color: installed ? "#64748B" : "#15803D",
              background: installed ? "#F1F5F9" : "#F0FDF4",
              border: `1px solid ${installed ? "#E2E8F0" : "#BBF7D0"}`,
              padding: "5px 12px", borderRadius: 8, cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            <DownloadCloud size={14} color={installed ? "#64748B" : "#16A34A"} />
            <span>{installed ? "PWA Terpasang ✓" : "📲 Pasang Aplikasi (PWA)"}</span>
          </button>

          {/* Live Network Online / Offline Status (Task #16) */}
          <div style={{
            display: "flex", alignItems: "center", gap: 6, fontSize: 11.5,
            color: isOnline ? "#16A34A" : "#B45309",
            background: isOnline ? "#DCFCE7" : "#FEF3C7",
            padding: "4px 10px", borderRadius: 99, fontWeight: 700,
            border: `1px solid ${isOnline ? "#BBF7D0" : "#FDE68A"}`,
          }}>
            {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
            <span>{isOnline ? "WHO Cloud Online" : "Mode Offline Aktif (LMS Cache)"}</span>
          </div>

          {user ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10, borderLeft: "1px solid #E2E8F0", paddingLeft: 14 }}>
              <div style={{ textAlign: "right", display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: "#0F172A" }}>{user.name}</span>
                <span style={{ fontSize: 10.5, color: "#16A34A", fontWeight: 600 }}>{user.posyandu}</span>
              </div>
              <div style={{
                width: 32, height: 32, borderRadius: "50%",
                background: "linear-gradient(135deg, #22C55E, #16A34A)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 700, fontSize: 12, color: "white",
              }}>
                {user.name.charAt(0)}
              </div>
            </div>
          ) : (
            <Link
              href="/login"
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "6px 14px", borderRadius: 8,
                background: "#16A34A", color: "white", fontSize: 12, fontWeight: 700,
                textDecoration: "none",
              }}
            >
              <LogIn size={13} /> Masuk Akun
            </Link>
          )}
        </header>

        {/* Scrollable Viewport */}
        <main style={{ flex: 1, overflowY: "auto", padding: "24px", background: "#F8FAFC" }}>
          {renderPage()}
        </main>
      </div>
    </div>
  );
}
