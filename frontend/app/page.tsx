"use client";

import { useState, useEffect } from "react";
import {
  Activity, BarChart3, ClipboardList, Home, Map, Menu,
  Baby, Scale, Ruler, Calendar, User, ChevronRight, AlertTriangle,
  CheckCircle, XCircle, TrendingDown, Info, Loader2, Wifi, Save,
  TrendingUp, Sparkles, HeartHandshake, MapPin, CalendarDays,
  Users, Target, ArrowUpRight, CheckCircle2, Layers, Search,
  Sliders, Eye, RefreshCw, FileText, Stethoscope, Utensils, Check,
  FileImage, Keyboard, X,
} from "lucide-react";
import {
  hitungAntropometri, simpanBalitaDanPenimbangan, getStatusBadgeClass, getStatusLabel,
  getStatusColor, zscoreToPercent, type AntropometriResult
} from "@/lib/utils";
import { GrowthChart } from "@/components/charts/GrowthChart";
import { calculateZScoreWHO, classifyAntropometriWHO } from "@/lib/who-data";
import { ManualForm } from "@/components/input/ManualForm";
import { OcrUpload, type OcrExtractedData } from "@/components/input/OcrUpload";
import { RiwayatData } from "@/components/balita/RiwayatData";
import type { BalitaFormData } from "@/lib/validations";

// ─────────────────────────────────────────────────────────────────────────────
// NAV CONFIG
// ─────────────────────────────────────────────────────────────────────────────

const navItems = [
  { icon: Home,          label: "Dashboard",     id: "dashboard" },
  { icon: Baby,          label: "Input Data",    id: "input"     },
  { icon: TrendingUp,    label: "Grafik KMS",    id: "grafik"    },
  { icon: ClipboardList, label: "Riwayat",       id: "riwayat"   },
  { icon: BarChart3,     label: "Laporan",       id: "laporan"   },
  { icon: Map,           label: "Peta Stunting", id: "peta"      },
];

// ─────────────────────────────────────────────────────────────────────────────
// SIDEBAR (Warm, Clean, Approachable)
// ─────────────────────────────────────────────────────────────────────────────

function Sidebar({
  active,
  onNav,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onClose,
}: {
  active: string;
  onNav: (id: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onClose: () => void;
}) {
  return (
    <>
      {/* ── MOBILE DRAWER BACKDROP ── */}
      {mobileOpen && (
        <div
          onClick={onClose}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,23,42,0.5)",
            zIndex: 49,
            backdropFilter: "blur(2px)",
          }}
        />
      )}

      {/* ── MOBILE OFF-CANVAS DRAWER ── */}
      <aside
        style={{
          position: "fixed",
          top: 0,
          bottom: 0,
          left: 0,
          width: 270,
          background: "#FFFFFF",
          zIndex: 50,
          boxShadow: mobileOpen ? "4px 0 20px rgba(0,0,0,0.15)" : "none",
          transform: mobileOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Drawer Header */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "18px 20px",
          borderBottom: "1px solid #F1F5F9",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: "#16A34A",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Activity size={20} color="white" />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#0F172A" }}>ZeroStunting</div>
              <div style={{ fontSize: 10, color: "#16A34A", fontWeight: 700 }}>POSYANDU DESA</div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup menu"
            style={{
              background: "#F1F5F9",
              border: "none",
              borderRadius: "50%",
              width: 34,
              height: 34,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#475569",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Drawer Nav Items */}
        <nav style={{ flex: 1, padding: "14px 12px", overflowY: "auto" }}>
          {navItems.map(({ icon: Icon, label, id }) => {
            const isActive = active === id;
            return (
              <button
                key={id}
                onClick={() => { onNav(id); onClose(); }}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  width: "100%", padding: "12px 14px",
                  borderRadius: 12,
                  border: isActive ? "1px solid #BBF7D0" : "1px solid transparent",
                  cursor: "pointer",
                  background: isActive ? "#DCFCE7" : "transparent",
                  color: isActive ? "#15803D" : "#334155",
                  fontSize: 15, fontWeight: isActive ? 700 : 600,
                  marginBottom: 4,
                  textAlign: "left",
                }}
              >
                <Icon size={20} color={isActive ? "#15803D" : "#64748B"} />
                {label}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* ── DESKTOP SIDEBAR (Collapsible: 240px <-> 68px) ── */}
      <aside
        className="desktop-sidebar"
        style={{
          width: collapsed ? 70 : 240,
          flexShrink: 0,
          flexDirection: "column",
          background: "#FFFFFF",
          borderRight: "1px solid #E2E8F0",
          height: "100vh",
          position: "sticky",
          top: 0,
          zIndex: 10,
          transition: "width 0.22s cubic-bezier(0.4, 0, 0.2, 1)",
          overflowX: "hidden",
        }}
      >
        {/* Desktop Header: Logo berfungsi langsung sebagai toggle buka-tutup sidebar */}
        <div style={{
          padding: collapsed ? "14px 0" : "14px 12px",
          borderBottom: "1px solid #F1F5F9",
          minHeight: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <button
            type="button"
            onClick={onToggleCollapse}
            title={collapsed ? "Klik logo untuk memperluas sidebar" : "Klik logo untuk memperkecil sidebar"}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: collapsed ? "center" : "flex-start",
              gap: 10,
              width: "100%",
              background: "transparent",
              border: "none",
              borderRadius: 12,
              padding: collapsed ? "6px 0" : "8px 8px",
              cursor: "pointer",
              transition: "background 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#F1F5F9")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: "#16A34A",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              boxShadow: "0 2px 6px rgba(22, 163, 74, 0.2)",
            }}>
              <Activity size={20} color="white" />
            </div>

            {!collapsed && (
              <div style={{ overflow: "hidden", textAlign: "left" }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.01em", whiteSpace: "nowrap" }}>
                  ZeroStunting
                </div>
                <div style={{ fontSize: 10, color: "#16A34A", fontWeight: 700, letterSpacing: "0.05em", whiteSpace: "nowrap" }}>
                  KADER POSYANDU
                </div>
              </div>
            )}
          </button>
        </div>

        {/* Nav Items */}
        <nav style={{ flex: 1, padding: collapsed ? "10px 8px" : "14px 10px", overflowY: "auto" }}>
          {!collapsed && (
            <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 700, letterSpacing: "0.06em", padding: "4px 8px", marginBottom: 6 }}>
              MENU
            </div>
          )}

          {navItems.map(({ icon: Icon, label, id }) => {
            const isActive = active === id;
            return (
              <button
                key={id}
                onClick={() => onNav(id)}
                title={collapsed ? label : undefined}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: collapsed ? "center" : "flex-start",
                  gap: 11,
                  width: "100%",
                  padding: collapsed ? "11px 0" : "11px 12px",
                  borderRadius: 12,
                  border: isActive ? "1px solid #BBF7D0" : "1px solid transparent",
                  cursor: "pointer",
                  background: isActive ? "#DCFCE7" : "transparent",
                  color: isActive ? "#15803D" : "#475569",
                  fontSize: 14,
                  fontWeight: isActive ? 700 : 600,
                  transition: "all 0.15s ease",
                  marginBottom: 4,
                  textAlign: "left",
                }}
              >
                <Icon size={19} color={isActive ? "#15803D" : "#64748B"} />
                {!collapsed && <span style={{ whiteSpace: "nowrap" }}>{label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Footer info box (only when expanded) */}
        {!collapsed && (
          <div style={{ padding: 12 }}>
            <div style={{
              background: "#F0FDF4",
              border: "1px solid #DCFCE7",
              borderRadius: 12, padding: "10px 12px",
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <HeartHandshake size={16} color="#16A34A" style={{ flexShrink: 0 }} />
              <div style={{ fontSize: 11, color: "#15803D", fontWeight: 700, lineHeight: 1.3 }}>
                Posyandu Melati 01
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Z-SCORE GAUGE (Light, Accessible, High Contrast)
// ─────────────────────────────────────────────────────────────────────────────

function ZScoreGauge({
  label, detail,
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
  const numColor = detail.status === "normal" ? "#15803D" : detail.status.includes("buruk") || detail.status.includes("sangat") ? "#DC2626" : "#D97706";

  return (
    <div style={{
      background: "#FFFFFF",
      border: "1.5px solid #E2E8F0",
      borderRadius: 14, padding: "12px 14px",
      boxShadow: "0 1px 4px rgba(0,0,0,0.03)",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 12, color: "#334155", fontWeight: 700 }}>
          {label}
        </span>
        <span style={{
          fontSize: 10, fontWeight: 700,
          color: sc.text, background: sc.bg, border: `1px solid ${sc.border}`,
          padding: "2px 8px", borderRadius: 99,
        }}>
          {getStatusLabel(detail.status)}
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "flex-end", gap: 6, marginBottom: 8 }}>
        <span style={{ fontSize: 22, fontWeight: 800, lineHeight: 1, color: numColor, fontVariantNumeric: "tabular-nums" }}>
          {detail.zscore >= 0 ? "+" : ""}{detail.zscore.toFixed(2)}
        </span>
        <span style={{ fontSize: 12, color: "#64748B", fontWeight: 600, marginBottom: 1 }}>SD</span>
      </div>

      {/* Gradient bar */}
      <div style={{
        height: 8, borderRadius: 4, margin: "0 4px",
        background: "linear-gradient(90deg, #EF4444 0%, #F59E0B 25%, #22C55E 50%, #F59E0B 75%, #EF4444 100%)",
        position: "relative",
      }}>
        <div style={{
          width: 14, height: 14, borderRadius: "50%",
          background: "#FFFFFF", border: "2.5px solid #0F172A",
          position: "absolute", top: "50%",
          left: `calc(${pct}% - 7px)`,
          transform: "translateY(-50%)",
          boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
          transition: "left 0.5s cubic-bezier(0.34,1.56,0.64,1)",
        }} />
      </div>

      {/* Axis */}
      <div style={{
        display: "flex", justifyContent: "space-between",
        fontSize: 9, color: "#64748B", fontWeight: 600, marginTop: 5, marginBottom: 6,
      }}>
        {["-4","-3","-2","0","+2","+3","+4"].map(v => <span key={v}>{v}</span>)}
      </div>

      <div style={{ display: "flex", gap: 14, fontSize: 11, color: "#475569", borderTop: "1px solid #F1F5F9", paddingTop: 6 }}>
        <span>Nilai: <strong style={{ color: "#0F172A" }}>{detail.nilai_actual}</strong></span>
        <span>Median WHO: <strong style={{ color: "#0F172A" }}>{detail.median_referensi}</strong></span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RESULT PANEL (Hanya Indikator Z-Score & Tombol Simpan)
// ─────────────────────────────────────────────────────────────────────────────

function ResultPanel({
  result,
  onSave,
  saving = false,
  saveSuccess = false,
}: {
  result: AntropometriResult;
  onSave?: () => void;
  saving?: boolean;
  saveSuccess?: boolean;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }} className="slide-up">
      {/* 3 Indikator Z-Score */}
      <ZScoreGauge label="BB/U : Berat Badan / Umur" detail={result.bbu} />
      <ZScoreGauge label="PB/U : Panjang Badan / Umur (Stunting)" detail={result.pbu} />
      <ZScoreGauge label="BB/PB : Berat / Panjang Badan (Wasting)" detail={result.bbpb} />

      {/* Tombol Simpan ke Database (Supabase) */}
      {onSave && (
        <button
          type="button"
          onClick={onSave}
          disabled={saving || saveSuccess}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            padding: "11px 18px",
            borderRadius: 12,
            border: saveSuccess ? "1.5px solid #BBF7D0" : "none",
            background: saveSuccess
              ? "#DCFCE7"
              : "linear-gradient(135deg, #16A34A, #15803D)",
            color: saveSuccess ? "#15803D" : "#FFFFFF",
            fontSize: 13,
            fontWeight: 700,
            cursor: saving || saveSuccess ? "default" : "pointer",
            transition: "all 0.2s ease",
            boxShadow: saveSuccess ? "none" : "0 3px 8px rgba(22,163,74,0.25)",
            marginTop: 2,
          }}
        >
          {saving ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Menyimpan ke Database Posyandu...</span>
            </>
          ) : saveSuccess ? (
            <>
              <CheckCircle size={16} color="#15803D" />
              <span>Data Berhasil Tersimpan di Posyandu</span>
            </>
          ) : (
            <>
              <Save size={16} />
              <span>Simpan Catatan Pengukuran Ini</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// INPUT FORM PAGE (Clean, Warm, Validasi Langsung)
// ─────────────────────────────────────────────────────────────────────────────

function InputDataPage() {
  const [activeMode, setActiveMode] = useState<"form" | "ocr">("form");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AntropometriResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [lastSubmitted, setLastSubmitted] = useState<BalitaFormData | null>(null);
  // Prefill dari OCR → form manual
  const [ocrPrefill, setOcrPrefill] = useState<Partial<BalitaFormData> | null>(null);

  const handleValidSubmit = async (data: BalitaFormData) => {
    setLoading(true);
    setError(null);
    setResult(null);
    setSaveSuccess(false);
    setLastSubmitted(data);
    try {
      const res = await hitungAntropometri({
        nama_anak: data.nama_anak || undefined,
        umur_bulan: data.umur_bulan,
        berat_kg: data.berat_kg,
        tinggi_cm: data.tinggi_cm,
        jenis_kelamin: data.jenis_kelamin,
      });
      setResult(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToDb = async () => {
    if (!result || !lastSubmitted) return;
    setSaving(true);
    setError(null);
    try {
      const now = new Date();
      const months = lastSubmitted.umur_bulan;
      const estDate = new Date(now.getFullYear(), now.getMonth() - months, 15);
      const tanggalLahirStr = estDate.toISOString().split("T")[0];

      await simpanBalitaDanPenimbangan({
        balita: {
          nama: lastSubmitted.nama_anak?.trim() || `Balita ${lastSubmitted.jenis_kelamin}-${lastSubmitted.umur_bulan}bln`,
          tanggal_lahir: tanggalLahirStr,
          jenis_kelamin: lastSubmitted.jenis_kelamin,
          nama_ibu: lastSubmitted.nama_ibu || undefined,
          alamat: lastSubmitted.dusun_rt || undefined,
        },
        penimbangan: {
          umur_bulan: lastSubmitted.umur_bulan,
          berat_kg: lastSubmitted.berat_kg,
          tinggi_cm: lastSubmitted.tinggi_cm,
          input_mode: "manual_form_zod",
        },
      });
      setSaveSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan ke database");
    } finally {
      setSaving(false);
    }
  };

  // Handler OCR → lanjut ke form untuk konfirmasi akhir
  const handleOcrConfirm = (data: OcrExtractedData) => {
    setOcrPrefill({
      nama_anak: data.nama_anak ?? "",
      umur_bulan: data.umur_bulan ?? 0,
      berat_kg: data.berat_kg ?? 0,
      tinggi_cm: data.tinggi_cm ?? 0,
      jenis_kelamin: (data.jenis_kelamin as "L" | "P") ?? "L",
    });
    setActiveMode("form");
  };

  return (
    <div style={{ maxWidth: 980, margin: "0 auto" }}>
      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
        <span style={{ fontSize: 12, color: "#64748B", fontWeight: 500 }}>Dashboard</span>
        <ChevronRight size={13} color="#94A3B8" />
        <span style={{ fontSize: 12, color: "#16A34A", fontWeight: 700 }}>Input Data Balita</span>
      </div>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0F172A", marginBottom: 4 }}>
        Input Pengukuran Antropometri
      </h1>
      <p style={{ fontSize: 14, color: "#475569", marginBottom: 14 }}>
        Catat hasil timbang dan ukur balita untuk deteksi cepat status gizi.
      </p>

      {/* Tab pilihan mode input */}
      <div style={{
        display: "flex", gap: 8, marginBottom: 18,
        background: "#F1F5F9", borderRadius: 14, padding: 5,
        alignSelf: "flex-start",
      }}>
        {([
          { id: "form", label: "Isi Form Manual", icon: Keyboard },
          { id: "ocr",  label: "Scan Foto KMS",   icon: FileImage },
        ] as const).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              setActiveMode(id);
              setResult(null);
              setError(null);
            }}
            style={{
              display: "flex", alignItems: "center", gap: 7,
              padding: "8px 16px", borderRadius: 10,
              border: "none", fontSize: 13, fontWeight: 700,
              cursor: "pointer", transition: "all 0.15s ease",
              background: activeMode === id ? "#FFFFFF" : "transparent",
              color: activeMode === id ? "#15803D" : "#64748B",
              boxShadow: activeMode === id ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
            }}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* Mode OCR: render OcrUpload fullwidth, sembunyikan kolom 2 */}
      {activeMode === "ocr" && (
        <div style={{
          background: "#FFFFFF",
          border: "1.5px solid #E2E8F0",
          borderRadius: 20, padding: 24,
          boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
          marginBottom: 0,
        }}>
          <OcrUpload
            onConfirm={handleOcrConfirm}
            onCancel={() => setActiveMode("form")}
          />
        </div>
      )}

      {/* Banner Perhatian / Status Gizi di bagian atas agar kolom input & Z-score sejajar */}
      {activeMode === "form" && result && (
        <div
          className="slide-up"
          style={{
            borderRadius: 14,
            padding: "12px 16px",
            background: (result.ada_risiko_stunting || result.ada_risiko_wasting || result.ada_risiko_underweight)
              ? "#FEF2F2"
              : "#F0FDF4",
            border: `1.5px solid ${(result.ada_risiko_stunting || result.ada_risiko_wasting || result.ada_risiko_underweight) ? "#FECACA" : "#BBF7D0"}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 16,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {(result.ada_risiko_stunting || result.ada_risiko_wasting || result.ada_risiko_underweight) ? (
              <AlertTriangle size={20} color="#DC2626" style={{ flexShrink: 0 }} />
            ) : (
              <CheckCircle size={20} color="#16A34A" style={{ flexShrink: 0 }} />
            )}
            <div>
              <div style={{
                fontWeight: 800,
                fontSize: 14,
                color: (result.ada_risiko_stunting || result.ada_risiko_wasting || result.ada_risiko_underweight)
                  ? "#B91C1C"
                  : "#15803D",
              }}>
                {(result.ada_risiko_stunting || result.ada_risiko_wasting || result.ada_risiko_underweight)
                  ? "Perhatian : Terdeteksi Indikasi Risiko Gizi"
                  : "Status Tumbuh Kembang Baik (Normal)"}
              </div>
              <div style={{ fontSize: 12, color: "#334155" }}>
                {result.pesan_peringatan[0]}
              </div>
            </div>
          </div>

          {(result.ada_risiko_stunting || result.ada_risiko_wasting || result.ada_risiko_underweight) && (
            <div style={{ display: "flex", gap: 6 }}>
              {result.ada_risiko_stunting && (
                <span style={{ fontSize: 11, fontWeight: 700, color: "#B91C1C", background: "#FEE2E2", border: "1px solid #FECACA", borderRadius: 99, padding: "3px 10px" }}>
                  Stunting
                </span>
              )}
              {result.ada_risiko_wasting && (
                <span style={{ fontSize: 11, fontWeight: 700, color: "#B45309", background: "#FEF3C7", border: "1px solid #FDE68A", borderRadius: 99, padding: "3px 10px" }}>
                  Wasting
                </span>
              )}
              {result.ada_risiko_underweight && (
                <span style={{ fontSize: 11, fontWeight: 700, color: "#B91C1C", background: "#FEE2E2", border: "1px solid #FECACA", borderRadius: 99, padding: "3px 10px" }}>
                  BB Kurang
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {activeMode === "form" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))", gap: 20, alignItems: "flex-start" }}>
          {/* KOLOM KIRI: FORM */}
          <ManualForm onSubmitValid={handleValidSubmit} loading={loading} prefillData={ocrPrefill} />

          {/* KOLOM KANAN: RESULT PANEL (Z-SCORE GAUGE SAJA) */}
          <div>
            {error && (
              <div style={{
                display: "flex", gap: 8, padding: "12px 14px", borderRadius: 12,
                background: "#FEF2F2", border: "1px solid #FECACA", marginBottom: 14,
              }}>
                <XCircle size={16} color="#DC2626" style={{ flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontSize: 13, color: "#B91C1C", fontWeight: 600 }}>{error}</span>
              </div>
            )}

            {result ? (
              <ResultPanel
                result={result}
                onSave={handleSaveToDb}
                saving={saving}
                saveSuccess={saveSuccess}
              />
            ) : (
              <div style={{
                background: "#FFFFFF",
                border: "1.5px dashed #CBD5E1",
                borderRadius: 20, padding: 28,
                display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center",
                justifyContent: "center", minHeight: 400,
              }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 16,
                  background: "#DCFCE7",
                  display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12,
                }}>
                  <Sparkles size={24} color="#16A34A" />
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0F172A", marginBottom: 4 }}>
                  Hasil Indikator Z-Score
                </h3>
                <p style={{ fontSize: 12, color: "#64748B", maxWidth: 260, lineHeight: 1.5 }}>
                  Isi formulir di sebelah kiri lalu tekan <strong>Hitung Status Gizi</strong>.
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginTop: 18, width: "100%" }}>
                  {[
                    { ind: "BB/U", label: "Berat Badan" },
                    { ind: "PB/U", label: "Stunting" },
                    { ind: "BB/PB", label: "Wasting" },
                  ].map(({ ind, label }) => (
                    <div key={ind} style={{
                      borderRadius: 14, background: "#F8FAF8",
                      border: "1px solid #E2E8F0", padding: "10px 4px", textAlign: "center",
                    }}>
                      <p style={{ fontSize: 12, fontWeight: 700, color: "#16A34A", margin: 0 }}>{ind}</p>
                      <p style={{ fontSize: 10, color: "#64748B", margin: "2px 0 4px 0" }}>{label}</p>
                      <p style={{ fontSize: 16, fontWeight: 700, color: "#94A3B8", margin: 0 }}>-</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD PAGE (Simpel, Bersih, Ramah Posyandu)
// ─────────────────────────────────────────────────────────────────────────────

function DashboardPage({ onNavigate }: { onNavigate: (id: string) => void }) {
  // Contoh data pemantauan posyandu bulan berjalan
  const balitaList = [
    { nama: "Alisya Putri", umur: "22 bulan", tb: "76.5 cm", bb: "8.9 kg", status: "Perlu Rujukan", statusType: "danger" },
    { nama: "Siti Nurhaliza", umur: "18 bulan", tb: "73.5 cm", bb: "8.4 kg", status: "Waspada Stunting", statusType: "warning" },
    { nama: "Daffa Pratama", umur: "14 bulan", tb: "69.0 cm", bb: "7.2 kg", status: "Gizi Kurang", statusType: "warning" },
    { nama: "Budi Santoso", umur: "24 bulan", tb: "87.0 cm", bb: "12.5 kg", status: "Tumbuh Normal", statusType: "success" },
    { nama: "Muhammad Farhan", umur: "36 bulan", tb: "94.0 cm", bb: "14.2 kg", status: "Tumbuh Normal", statusType: "success" },
  ];

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", display: "flex", flexDirection: "column", gap: 28 }}>
      {/* 1. HEADER UTAMA (Ramah, Hangat, Langsung ke Inti) */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16 }}>
        <div>
          <div style={{ fontSize: 13, color: "#15803D", fontWeight: 700, letterSpacing: "0.04em", marginBottom: 4 }}>
            POSYANDU MELATI 01 • DESA SUKAMAJU
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#0F172A", margin: 0, letterSpacing: "-0.01em" }}>
            Selamat Datang, Ibu Kader
          </h1>
          <p style={{ fontSize: 15, color: "#475569", margin: "4px 0 0 0" }}>
            Rekap penimbangan dan pemantauan stunting periode Oktober 2026.
          </p>
        </div>

        {/* Tombol Utama */}
        <button
          type="button"
          onClick={() => onNavigate("input")}
          style={{
            background: "#16A34A",
            color: "#FFFFFF",
            border: "none",
            borderRadius: 12,
            padding: "12px 24px",
            fontSize: 15,
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
            boxShadow: "0 2px 8px rgba(22, 163, 74, 0.25)",
            transition: "transform 0.1s ease",
          }}
          onMouseDown={e => e.currentTarget.style.transform = "scale(0.98)"}
          onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
        >
          <Baby size={19} /> + Catat Penimbangan Balita
        </button>
      </div>

      {/* 2. RINGKASAN DATA (Satu Strip Bersih Terpadu — Bukan 4 Kotak Terpisah) */}
      <div style={{
        background: "#FFFFFF",
        border: "1.5px solid #E2E8F0",
        borderRadius: 16,
        padding: "20px 24px",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: 20,
      }}>
        {/* Total */}
        <div>
          <div style={{ fontSize: 13, color: "#64748B", fontWeight: 600, marginBottom: 4 }}>
            Total Balita Terdata
          </div>
          <div style={{ fontSize: 30, fontWeight: 800, color: "#0F172A", lineHeight: 1.1 }}>
            248 <span style={{ fontSize: 14, fontWeight: 600, color: "#64748B" }}>anak</span>
          </div>
        </div>

        {/* Normal */}
        <div style={{ borderLeft: "1px solid #F1F5F9", paddingLeft: 16 }}>
          <div style={{ fontSize: 13, color: "#15803D", fontWeight: 700, marginBottom: 4 }}>
            ● Tumbuh Normal
          </div>
          <div style={{ fontSize: 30, fontWeight: 800, color: "#15803D", lineHeight: 1.1 }}>
            202 <span style={{ fontSize: 14, fontWeight: 600, color: "#64748B" }}>(81.5%)</span>
          </div>
        </div>

        {/* Waspada Stunting */}
        <div style={{ borderLeft: "1px solid #F1F5F9", paddingLeft: 16 }}>
          <div style={{ fontSize: 13, color: "#D97706", fontWeight: 700, marginBottom: 4 }}>
            ▲ Waspada Stunting
          </div>
          <div style={{ fontSize: 30, fontWeight: 800, color: "#D97706", lineHeight: 1.1 }}>
            43 <span style={{ fontSize: 14, fontWeight: 600, color: "#64748B" }}>(17.3%)</span>
          </div>
        </div>

        {/* Rujukan Medis */}
        <div style={{ borderLeft: "1px solid #F1F5F9", paddingLeft: 16 }}>
          <div style={{ fontSize: 13, color: "#DC2626", fontWeight: 700, marginBottom: 4 }}>
            ■ Perlu Perhatian Bidan
          </div>
          <div style={{ fontSize: 30, fontWeight: 800, color: "#DC2626", lineHeight: 1.1 }}>
            3 <span style={{ fontSize: 14, fontWeight: 600, color: "#64748B" }}>anak</span>
          </div>
        </div>
      </div>

      {/* 3. DAFTAR BALITA TERKINI & PRIORITAS (Actionable, Nyata, dan Mudah Dibaca) */}
      <div style={{
        background: "#FFFFFF",
        border: "1.5px solid #E2E8F0",
        borderRadius: 16,
        padding: "22px 24px",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: "#0F172A", margin: 0 }}>
              Daftar Balita & Status Pengukuran Terkini
            </h2>
            <p style={{ fontSize: 13, color: "#64748B", margin: "2px 0 0 0" }}>
              Prioritaskan balita dengan tanda kuning/merah untuk pemantauan gizi intensif.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate("grafik")}
            style={{
              background: "none",
              border: "none",
              color: "#16A34A",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            Buka Kurva KMS <ChevronRight size={16} />
          </button>
        </div>

        {/* Tabel / List Bersih */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          {balitaList.map((b, idx) => {
            const badgeStyle =
              b.statusType === "danger"
                ? { bg: "#FEE2E2", text: "#B91C1C", border: "#FECACA" }
                : b.statusType === "warning"
                ? { bg: "#FEF3C7", text: "#B45309", border: "#FDE68A" }
                : { bg: "#DCFCE7", text: "#15803D", border: "#BBF7D0" };

            return (
              <div
                key={b.nama}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "14px 0",
                  borderBottom: idx === balitaList.length - 1 ? "none" : "1px solid #F1F5F9",
                  flexWrap: "wrap",
                  gap: 12,
                }}
              >
                {/* Info Balita */}
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    background: "#F1F5F9",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 800,
                    fontSize: 14,
                    color: "#334155",
                  }}>
                    {b.nama.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#0F172A" }}>
                      {b.nama}
                    </div>
                    <div style={{ fontSize: 13, color: "#64748B" }}>
                      Usia: {b.umur} • TB: <strong style={{ color: "#334155" }}>{b.tb}</strong> • BB: <strong style={{ color: "#334155" }}>{b.bb}</strong>
                    </div>
                  </div>
                </div>

                {/* Status & Aksi */}
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <span style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: badgeStyle.text,
                    background: badgeStyle.bg,
                    border: `1px solid ${badgeStyle.border}`,
                    padding: "4px 12px",
                    borderRadius: 99,
                  }}>
                    {b.status}
                  </span>
                  <button
                    type="button"
                    onClick={() => onNavigate("input")}
                    style={{
                      background: "#F8FAFC",
                      border: "1px solid #CBD5E1",
                      borderRadius: 8,
                      padding: "6px 12px",
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#334155",
                      cursor: "pointer",
                    }}
                  >
                    Ukur Ulang
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. PINTASAN MENU OPERASIONAL (Sederhana, Bersih, Berguna) */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", paddingTop: 4 }}>
        <div style={{ fontSize: 14, color: "#64748B" }}>
          Butuh mencetak laporan bulanan untuk Puskesmas?
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="button"
            onClick={() => onNavigate("grafik")}
            style={{
              padding: "10px 18px",
              background: "#FFFFFF",
              border: "1.5px solid #CBD5E1",
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 700,
              color: "#334155",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <TrendingUp size={16} /> Grafik Pertumbuhan KMS
          </button>
          <button
            type="button"
            onClick={() => onNavigate("laporan")}
            style={{
              padding: "10px 18px",
              background: "#FFFFFF",
              border: "1.5px solid #CBD5E1",
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 700,
              color: "#334155",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <BarChart3 size={16} /> Buka Laporan e-PPGBM
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GRAFIK KMS INTERAKTIF (Posyandu Friendly & Warm)
// ─────────────────────────────────────────────────────────────────────────────

function GrafikKmsPage() {
  const [gender, setGender] = useState<"L" | "P">("L");
  const [age, setAge] = useState<number>(18);
  const [weight, setWeight] = useState<number>(10.5);
  const [height, setHeight] = useState<number>(82.0);
  const [name, setName] = useState<string>("Budi Santoso");

  return (
    <div style={{ maxWidth: 980, margin: "0 auto", display: "flex", flexDirection: "column", gap: 22 }}>

      <div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0F172A", marginBottom: 4 }}>
          Grafik Kurva Pertumbuhan WHO (KMS Digital)
        </h1>
        <p style={{ fontSize: 14, color: "#475569" }}>
          Simulasi dan visualisasi pertumbuhan balita sesuai standar WHO 2006 untuk memudahkan konseling kader dengan ibu balita.
        </p>
      </div>

      {/* Control panel simulasi (Warm, White, Stable) */}
      <div style={{
        background: "#FFFFFF",
        border: "1.5px solid #E2E8F0",
        borderRadius: 20,
        padding: "20px 24px",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.03)",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: 18,
        alignItems: "flex-end",
      }}>
        <div>
          <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
            Nama Balita
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="input-field"
            placeholder="cth: Budi Santoso"
          />
        </div>

        <div>
          <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
            Jenis Kelamin
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            {(["L", "P"] as const).map(g => (
              <button
                key={g}
                type="button"
                onClick={() => setGender(g)}
                style={{
                  flex: 1,
                  padding: "9px 0",
                  borderRadius: 12,
                  border: gender === g ? "1.5px solid #16A34A" : "1.5px solid #CBD5E1",
                  background: gender === g ? "#DCFCE7" : "#FFFFFF",
                  color: gender === g ? "#15803D" : "#475569",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                {g === "L" ? "♂ Laki-laki" : "♀ Perempuan"}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
            Umur: <span style={{ color: "#16A34A", fontWeight: 800 }}>{age} Bulan</span>
          </label>
          <input
            type="range"
            min={0}
            max={60}
            value={age}
            onChange={e => setAge(Number(e.target.value))}
            style={{ width: "100%", accentColor: "#16A34A", cursor: "pointer", height: 6 }}
          />
        </div>

        <div>
          <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
            Berat Badan (kg)
          </label>
          <input
            type="number"
            min={1}
            max={35}
            step={0.1}
            value={weight}
            onChange={e => setWeight(Number(e.target.value))}
            className="input-field"
          />
        </div>

        <div>
          <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
            Panjang / Tinggi (cm)
          </label>
          <input
            type="number"
            min={40}
            max={130}
            step={0.1}
            value={height}
            onChange={e => setHeight(Number(e.target.value))}
            className="input-field"
          />
        </div>
      </div>

      {/* Komponen Grafik Pertumbuhan */}
      <GrowthChart
        namaAnak={name}
        jenisKelamin={gender}
        umurBulan={age}
        beratKg={weight}
        tinggiCm={height}
        initialIndicator="pbu"
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMING SOON
// ─────────────────────────────────────────────────────────────────────────────

function ComingSoonPage({ title }: { title: string }) {
  return (
    <div style={{ maxWidth: 980, margin: "0 auto" }}>
      <div style={{
        background: "#FFFFFF",
        border: "1.5px solid #E2E8F0",
        borderRadius: 20, padding: "80px 40px", textAlign: "center",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.03)",
      }}>
        <div style={{
          width: 68, height: 68, borderRadius: 20,
          background: "#DCFCE7",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 18px",
        }}>
          <Activity size={32} color="#16A34A" />
        </div>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: "#0F172A", marginBottom: 8 }}>{title}</h1>
        <p style={{ fontSize: 14, color: "#64748B", marginBottom: 4 }}>Fitur ini sedang dalam pengembangan tahap berikutnya</p>
        <p style={{ fontSize: 12, color: "#94A3B8" }}>Coming soon</p>
      </div>
    </div>
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// APP ROOT
// ─────────────────────────────────────────────────────────────────────────────

export default function App() {
  const [activePage, setActivePage] = useState("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const renderPage = () => {
    switch (activePage) {
      case "dashboard": return <DashboardPage onNavigate={setActivePage} />;
      case "input":     return <InputDataPage />;
      case "grafik":    return <GrafikKmsPage />;
      case "riwayat":   return <RiwayatData onCatatBaru={() => setActivePage("input")} onBukaGrafik={() => setActivePage("grafik")} />;
      case "laporan":   return <ComingSoonPage title="Laporan e-PPGBM" />;
      case "peta":      return <ComingSoonPage title="Peta Stunting" />;
      default:          return <DashboardPage onNavigate={setActivePage} />;
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "#F8FAF8" }}>
      {/* Sidebar (Desktop Collapsible & Mobile Drawer) */}
      <Sidebar
        active={activePage}
        onNav={setActivePage}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
      />

      {/* Main column */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
        {/* Topbar */}
        <header
          className="topbar-container"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 24px",
            height: 60,
            borderBottom: "1px solid #E2E8F0",
            background: "#FFFFFF",
            flexShrink: 0,
          }}
        >
          {/* Controls Kiri: Logo interaktif di Mobile & info konteks di Desktop */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* Mobile: Mengetuk logo ZeroStunting langsung membuka drawer navigasi */}
            <button
              type="button"
              className="mobile-brand-btn"
              onClick={() => setMobileDrawerOpen(true)}
              title="Buka menu navigasi"
              style={{
                alignItems: "center",
                gap: 8,
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "4px 0",
              }}
            >
              <div style={{
                width: 34, height: 34, borderRadius: 9,
                background: "#16A34A",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 2px 5px rgba(22, 163, 74, 0.2)",
              }}>
                <Activity size={18} color="white" />
              </div>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#0F172A", lineHeight: 1.15 }}>ZeroStunting</div>
                <div style={{ fontSize: 9, color: "#16A34A", fontWeight: 700, letterSpacing: "0.04em" }}>POSYANDU</div>
              </div>
            </button>

            {/* Desktop: Label konteks posyandu tenang tanpa tombol artificial */}
            <div
              className="desktop-context-tag"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                color: "#64748B",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              <MapPin size={15} color="#16A34A" />
              <span>Posyandu Melati 01 • Desa Sukamaju</span>
            </div>
          </div>

          {/* Controls Kanan */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "#F0FDF4", border: "1px solid #DCFCE7",
              padding: "5px 12px", borderRadius: 99,
            }}>
              <Wifi size={13} color="#16A34A" />
              <span style={{ fontSize: 12, color: "#15803D", fontWeight: 700 }}>WHO Engine Siap</span>
            </div>

            <div style={{
              width: 36, height: 36, borderRadius: "50%",
              background: "linear-gradient(135deg, #16A34A, #15803D)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 2px 6px rgba(22,163,74,0.25)",
            }}>
              <User size={18} color="white" />
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main
          className="main-content-scroll fade-in"
          style={{ flex: 1, overflowY: "auto", padding: 26 }}
        >
          {renderPage()}
        </main>
      </div>
    </div>
  );
}

