"use client";

import { useState, useEffect } from "react";
import {
  Activity, BarChart3, ClipboardList, Home, Map, Menu,
  Baby, Scale, Ruler, Calendar, User, ChevronRight, AlertTriangle,
  CheckCircle, XCircle, TrendingDown, Info, Loader2, Wifi, Save,
  TrendingUp, Sparkles, HeartHandshake, MapPin, CalendarDays,
  Users, Target, ArrowUpRight, CheckCircle2, Layers, Search,
  Sliders, Eye, RefreshCw, FileText, Stethoscope, Utensils, Check
} from "lucide-react";
import {
  hitungAntropometri, simpanBalitaDanPenimbangan, getStatusBadgeClass, getStatusLabel,
  getStatusColor, zscoreToPercent, type AntropometriResult
} from "@/lib/utils";
import { GrowthChart } from "@/components/charts/GrowthChart";
import { calculateZScoreWHO, classifyAntropometriWHO } from "@/lib/who-data";

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
  active, onNav, mobileOpen, onClose,
}: {
  active: string;
  onNav: (id: string) => void;
  mobileOpen: boolean;
  onClose: () => void;
}) {
  return (
    <>
      {/* Mobile dimmer */}
      {mobileOpen && (
        <div
          onClick={onClose}
          style={{
            position: "fixed", inset: 0, background: "rgba(15,23,42,0.4)",
            zIndex: 40,
          }}
        />
      )}

      {/* Sidebar panel */}
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
      }}>
        {/* Logo */}
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "20px 20px 18px",
          borderBottom: "1px solid #F1F5F9",
        }}>
          <div style={{
            width: 38, height: 38, borderRadius: 12,
            background: "linear-gradient(135deg, #16A34A, #15803D)",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
            boxShadow: "0 3px 8px rgba(22,163,74,0.25)",
          }}>
            <Activity size={20} color="white" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.01em" }}>
              ZeroStunting
            </div>
            <div style={{ fontSize: 10, color: "#16A34A", fontWeight: 700, letterSpacing: "0.06em" }}>
              KADER POSYANDU
            </div>
          </div>
        </div>

        {/* Navigation list */}
        <nav style={{ flex: 1, padding: "14px 12px" }}>
          <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 700, letterSpacing: "0.08em", padding: "6px 10px", marginBottom: 4 }}>
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
                  width: "100%", padding: "11px 14px",
                  borderRadius: 12,
                  border: isActive ? "1px solid #BBF7D0" : "1px solid transparent",
                  cursor: "pointer",
                  background: isActive ? "#DCFCE7" : "transparent",
                  color: isActive ? "#15803D" : "#475569",
                  fontSize: 14, fontWeight: isActive ? 700 : 600,
                  transition: "all 0.15s ease",
                  marginBottom: 3,
                  textAlign: "left",
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.background = "#F0FDF4";
                    (e.currentTarget as HTMLElement).style.color = "#15803D";
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.background = "transparent";
                    (e.currentTarget as HTMLElement).style.color = "#475569";
                  }
                }}
              >
                <Icon size={18} color={isActive ? "#15803D" : "#64748B"} />
                {label}
              </button>
            );
          })}
        </nav>

        {/* Footer info box */}
        <div style={{ padding: 14 }}>
          <div style={{
            background: "#F0FDF4",
            border: "1px solid #DCFCE7",
            borderRadius: 14, padding: "12px 14px",
            display: "flex", alignItems: "flex-start", gap: 8,
          }}>
            <HeartHandshake size={18} color="#16A34A" style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <div style={{ fontSize: 12, color: "#15803D", fontWeight: 700, marginBottom: 2 }}>
                Posyandu Digital
              </div>
              <div style={{ fontSize: 11, color: "#475569", lineHeight: 1.4 }}>
                Membantu pencegahan stunting balita desa.
              </div>
            </div>
          </div>
        </div>
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
      borderRadius: 16, padding: "16px 18px",
      boxShadow: "0 1px 4px rgba(0,0,0,0.03)",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <span style={{ fontSize: 12, color: "#334155", fontWeight: 700 }}>
          {label}
        </span>
        <span style={{
          fontSize: 11, fontWeight: 700,
          color: sc.text, background: sc.bg, border: `1px solid ${sc.border}`,
          padding: "3px 10px", borderRadius: 99,
        }}>
          {getStatusLabel(detail.status)}
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "flex-end", gap: 6, marginBottom: 12 }}>
        <span style={{ fontSize: 28, fontWeight: 800, lineHeight: 1, color: numColor, fontVariantNumeric: "tabular-nums" }}>
          {detail.zscore >= 0 ? "+" : ""}{detail.zscore.toFixed(2)}
        </span>
        <span style={{ fontSize: 13, color: "#64748B", fontWeight: 600, marginBottom: 2 }}>SD</span>
      </div>

      {/* Gradient bar */}
      <div style={{
        height: 10, borderRadius: 5, margin: "0 4px",
        background: "linear-gradient(90deg, #EF4444 0%, #F59E0B 25%, #22C55E 50%, #F59E0B 75%, #EF4444 100%)",
        position: "relative",
      }}>
        <div style={{
          width: 16, height: 16, borderRadius: "50%",
          background: "#FFFFFF", border: "3px solid #0F172A",
          position: "absolute", top: "50%",
          left: `calc(${pct}% - 8px)`,
          transform: "translateY(-50%)",
          boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
          transition: "left 0.5s cubic-bezier(0.34,1.56,0.64,1)",
        }} />
      </div>

      {/* Axis */}
      <div style={{
        display: "flex", justifyContent: "space-between",
        fontSize: 10, color: "#64748B", fontWeight: 600, marginTop: 7, marginBottom: 10,
      }}>
        {["-4","-3","-2","0","+2","+3","+4"].map(v => <span key={v}>{v}</span>)}
      </div>

      <div style={{ display: "flex", gap: 18, fontSize: 12, color: "#475569", borderTop: "1px solid #F1F5F9", paddingTop: 8 }}>
        <span>Nilai Aktual: <strong style={{ color: "#0F172A" }}>{detail.nilai_actual}</strong></span>
        <span>Median WHO: <strong style={{ color: "#0F172A" }}>{detail.median_referensi}</strong></span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RESULT PANEL (Warm & Friendly)
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
  const [viewMode, setViewMode] = useState<"chart" | "gauge">("chart");
  const hasRisk = result.ada_risiko_stunting || result.ada_risiko_wasting || result.ada_risiko_underweight;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }} className="slide-up">
      {/* Banner Status */}
      <div style={{
        borderRadius: 16, padding: "16px 18px",
        background: hasRisk ? "#FEF2F2" : "#F0FDF4",
        border: `1.5px solid ${hasRisk ? "#FECACA" : "#BBF7D0"}`,
        display: "flex", gap: 12, alignItems: "flex-start",
      }}>
        {hasRisk
          ? <AlertTriangle size={22} color="#DC2626" style={{ flexShrink: 0, marginTop: 2 }} />
          : <CheckCircle size={22} color="#16A34A" style={{ flexShrink: 0, marginTop: 2 }} />
        }
        <div>
          <div style={{ fontWeight: 800, fontSize: 15, color: hasRisk ? "#B91C1C" : "#15803D", marginBottom: 4 }}>
            {hasRisk ? "Perhatian : Terdeteksi Indikasi Risiko Gizi" : "Status Tumbuh Kembang Baik (Normal)"}
          </div>
          {result.pesan_peringatan.map((msg, i) => (
            <div key={i} style={{ fontSize: 13, color: "#334155", lineHeight: 1.5, marginBottom: i < result.pesan_peringatan.length - 1 ? 4 : 0 }}>
              {msg}
            </div>
          ))}
        </div>
      </div>

      {/* Risk tags */}
      {hasRisk && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {result.ada_risiko_stunting && (
            <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: "#B91C1C", background: "#FEE2E2", border: "1px solid #FECACA", borderRadius: 99, padding: "5px 14px" }}>
              <TrendingDown size={14} /> Risiko Stunting
            </span>
          )}
          {result.ada_risiko_wasting && (
            <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: "#B45309", background: "#FEF3C7", border: "1px solid #FDE68A", borderRadius: 99, padding: "5px 14px" }}>
              <AlertTriangle size={14} /> Risiko Wasting
            </span>
          )}
          {result.ada_risiko_underweight && (
            <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: "#B91C1C", background: "#FEE2E2", border: "1px solid #FECACA", borderRadius: 99, padding: "5px 14px" }}>
              <AlertTriangle size={14} /> Berat Badan Kurang
            </span>
          )}
        </div>
      )}

      {/* Mode Switcher: Kurva KMS vs Indikator SD */}
      <div style={{
        display: "flex",
        background: "#F1F5F9",
        border: "1px solid #E2E8F0",
        borderRadius: 14,
        padding: 4,
        gap: 4,
      }}>
        <button
          type="button"
          onClick={() => setViewMode("chart")}
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 7,
            padding: "9px 14px",
            borderRadius: 10,
            border: "none",
            background: viewMode === "chart" ? "#16A34A" : "transparent",
            color: viewMode === "chart" ? "#FFFFFF" : "#475569",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            transition: "all 0.15s ease",
            boxShadow: viewMode === "chart" ? "0 2px 6px rgba(22,163,74,0.25)" : "none",
          }}
        >
          <TrendingUp size={16} /> Grafik Kurva KMS
        </button>
        <button
          type="button"
          onClick={() => setViewMode("gauge")}
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 7,
            padding: "9px 14px",
            borderRadius: 10,
            border: "none",
            background: viewMode === "gauge" ? "#16A34A" : "transparent",
            color: viewMode === "gauge" ? "#FFFFFF" : "#475569",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            transition: "all 0.15s ease",
            boxShadow: viewMode === "gauge" ? "0 2px 6px rgba(22,163,74,0.25)" : "none",
          }}
        >
          <Activity size={16} /> Indikator Z-Score
        </button>
      </div>

      {/* Main Visualizer */}
      {viewMode === "chart" ? (
        <GrowthChart
          namaAnak={result.nama_anak}
          jenisKelamin={result.jenis_kelamin}
          umurBulan={result.umur_bulan}
          beratKg={result.berat_kg}
          tinggiCm={result.tinggi_cm}
          initialIndicator={result.ada_risiko_stunting ? "pbu" : "bbu"}
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <ZScoreGauge label="BB/U : Berat Badan / Umur" detail={result.bbu} />
          <ZScoreGauge label="PB/U : Panjang Badan / Umur (Stunting)" detail={result.pbu} />
          <ZScoreGauge label="BB/PB : Berat / Panjang Badan (Wasting)" detail={result.bbpb} />
        </div>
      )}

      {result.peringatan_data.length > 0 && (
        <div style={{
          borderRadius: 14, padding: "12px 16px",
          background: "#FFFBEB", border: "1px solid #FDE68A",
          display: "flex", gap: 10, alignItems: "flex-start",
        }}>
          <Info size={18} color="#D97706" style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#92400E", marginBottom: 3 }}>Peringatan Data Pengukuran:</div>
            {result.peringatan_data.map((w, i) => (
              <div key={i} style={{ fontSize: 12, color: "#78350F" }}>{w}</div>
            ))}
          </div>
        </div>
      )}

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
            padding: "13px 20px",
            borderRadius: 12,
            border: saveSuccess ? "1.5px solid #BBF7D0" : "none",
            background: saveSuccess
              ? "#DCFCE7"
              : "linear-gradient(135deg, #16A34A, #15803D)",
            color: saveSuccess ? "#15803D" : "#FFFFFF",
            fontSize: 14,
            fontWeight: 700,
            cursor: saving || saveSuccess ? "default" : "pointer",
            transition: "all 0.2s ease",
            boxShadow: saveSuccess ? "none" : "0 4px 12px rgba(22,163,74,0.3)",
          }}
        >
          {saving ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>Menyimpan ke Database Posyandu...</span>
            </>
          ) : saveSuccess ? (
            <>
              <CheckCircle size={18} color="#15803D" />
              <span>Data Berhasil Tersimpan di Posyandu</span>
            </>
          ) : (
            <>
              <Save size={18} />
              <span>Simpan Catatan Pengukuran Ini</span>
            </>
          )}
        </button>
      )}

      <div style={{ fontSize: 11, color: "#64748B", textAlign: "center" }}>
        WHO Child Growth Standards 2006 • Metode LMS Box-Cox
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// INPUT FORM PAGE (Clean, Warm, High Usability)
// ─────────────────────────────────────────────────────────────────────────────

function InputDataPage() {
  const [form, setForm] = useState({
    nama_anak: "", umur_bulan: "", berat_kg: "", tinggi_cm: "",
    jenis_kelamin: "L" as "L" | "P",
  });
  const [loading, setLoading]        = useState(false);
  const [result, setResult]          = useState<AntropometriResult | null>(null);
  const [error, setError]            = useState<string | null>(null);
  const [saving, setSaving]          = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(null); setResult(null); setSaveSuccess(false);
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

  const handleSaveToDb = async () => {
    if (!result) return;
    setSaving(true);
    setError(null);
    try {
      const now = new Date();
      const months = parseInt(form.umur_bulan || "0");
      const estDate = new Date(now.getFullYear(), now.getMonth() - months, 15);
      const tanggalLahirStr = estDate.toISOString().split("T")[0];

      await simpanBalitaDanPenimbangan({
        balita: {
          nama: form.nama_anak.trim() || `Balita ${form.jenis_kelamin}-${form.umur_bulan}bln`,
          tanggal_lahir: tanggalLahirStr,
          jenis_kelamin: form.jenis_kelamin,
        },
        penimbangan: {
          umur_bulan: parseInt(form.umur_bulan),
          berat_kg: parseFloat(form.berat_kg),
          tinggi_cm: parseFloat(form.tinggi_cm),
          input_mode: "form",
        },
      });
      setSaveSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan ke database");
    } finally {
      setSaving(false);
    }
  };

  const labelStyle: React.CSSProperties = {
    display: "flex", alignItems: "center", gap: 6,
    fontSize: 13, color: "#334155", fontWeight: 700, marginBottom: 6,
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
      <p style={{ fontSize: 14, color: "#475569", marginBottom: 24 }}>
        Catat hasil timbang dan ukur balita untuk deteksi cepat status gizi dan risiko stunting.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        {/* ── FORM ── */}
        <div style={{
          background: "#FFFFFF",
          border: "1.5px solid #E2E8F0",
          borderRadius: 20, padding: 26,
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.03)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              background: "#DCFCE7", display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Baby size={18} color="#15803D" />
            </div>
            <span style={{ fontSize: 16, fontWeight: 800, color: "#0F172A" }}>Formulir Posyandu</span>
            <span style={{
              marginLeft: "auto", fontSize: 11, color: "#15803D", fontWeight: 700,
              background: "#F0FDF4", border: "1px solid #BBF7D0",
              borderRadius: 99, padding: "3px 10px",
            }}>
              Mode Manual
            </span>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {/* Nama */}
            <div>
              <label style={labelStyle}>
                <User size={14} color="#16A34A" /> Nama Anak
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
                <Calendar size={14} color="#16A34A" /> Umur Balita
                <span style={{ color: "#16A34A", fontWeight: 700, marginLeft: "auto", fontSize: 11 }}>0 - 60 bulan</span>
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type="number"
                  min={0}
                  max={60}
                  step={1}
                  required
                  className="input-field"
                  placeholder="24"
                  style={{ paddingRight: 56 }}
                  value={form.umur_bulan}
                  onChange={e => setForm(p => ({ ...p, umur_bulan: e.target.value }))}
                />
                <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "#64748B", fontWeight: 600 }}>
                  bulan
                </span>
              </div>
            </div>

            {/* Berat */}
            <div>
              <label style={labelStyle}>
                <Scale size={14} color="#16A34A" /> Berat Badan (BB)
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type="number"
                  min={0.5}
                  max={35}
                  step={0.1}
                  required
                  className="input-field"
                  placeholder="12.5"
                  style={{ paddingRight: 40 }}
                  value={form.berat_kg}
                  onChange={e => setForm(p => ({ ...p, berat_kg: e.target.value }))}
                />
                <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "#64748B", fontWeight: 600 }}>
                  kg
                </span>
              </div>
            </div>

            {/* Tinggi */}
            <div>
              <label style={labelStyle}>
                <Ruler size={14} color="#16A34A" /> Panjang / Tinggi Badan
                <span style={{ marginLeft: "auto", fontSize: 11, color: "#64748B", fontWeight: 500 }}>
                  {parseInt(form.umur_bulan || "0") < 24 ? "posisi telentang (PB)" : "posisi berdiri (TB)"}
                </span>
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type="number"
                  min={40}
                  max={130}
                  step={0.1}
                  required
                  className="input-field"
                  placeholder="87.0"
                  style={{ paddingRight: 40 }}
                  value={form.tinggi_cm}
                  onChange={e => setForm(p => ({ ...p, tinggi_cm: e.target.value }))}
                />
                <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "#64748B", fontWeight: 600 }}>
                  cm
                </span>
              </div>
            </div>

            {/* Jenis Kelamin */}
            <div>
              <label style={{ ...labelStyle, marginBottom: 8 }}>Jenis Kelamin</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {(["L", "P"] as const).map(jk => (
                  <button
                    key={jk}
                    type="button"
                    onClick={() => setForm(p => ({ ...p, jenis_kelamin: jk }))}
                    style={{
                      padding: "11px 0",
                      borderRadius: 12,
                      border: form.jenis_kelamin === jk ? "1.5px solid #16A34A" : "1.5px solid #CBD5E1",
                      background: form.jenis_kelamin === jk ? "#DCFCE7" : "#FFFFFF",
                      color: form.jenis_kelamin === jk ? "#15803D" : "#475569",
                      fontSize: 13, fontWeight: 700, cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {jk === "L" ? "♂ Laki-laki" : "♀ Perempuan"}
                  </button>
                ))}
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div style={{
                display: "flex", gap: 8, padding: "11px 14px", borderRadius: 12,
                background: "#FEF2F2", border: "1px solid #FECACA",
              }}>
                <XCircle size={16} color="#DC2626" style={{ flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontSize: 13, color: "#B91C1C", fontWeight: 600 }}>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 15, marginTop: 6 }}
            >
              {loading
                ? <><Loader2 size={18} className="animate-spin" /> Menghitung Z-Score...</>
                : <><Activity size={18} /> Hitung Z-Score Sekarang</>
              }
            </button>
          </form>
        </div>

        {/* ── RESULT COLUMN ── */}
        <div>
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
              borderRadius: 20, padding: 40,
              display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center",
              height: "100%", justifyContent: "center",
            }}>
              <div style={{
                width: 68, height: 68, borderRadius: 20,
                background: "#DCFCE7",
                display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16,
              }}>
                <Sparkles size={32} color="#16A34A" />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", marginBottom: 6 }}>
                Hasil Z-Score Akan Tampil di Sini
              </h3>
              <p style={{ fontSize: 13, color: "#64748B", maxWidth: 240, lineHeight: 1.6 }}>
                Lengkapi formulir di sebelah kiri, kemudian klik tombol <strong>Hitung Z-Score Sekarang</strong>.
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginTop: 26, width: "100%" }}>
                {[
                  { ind: "BB/U", label: "Berat Badan" },
                  { ind: "PB/U", label: "Stunting" },
                  { ind: "BB/PB", label: "Wasting" },
                ].map(({ ind, label }) => (
                  <div key={ind} style={{
                    borderRadius: 14, background: "#F8FAF8",
                    border: "1px solid #E2E8F0", padding: "14px 6px", textAlign: "center",
                  }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: "#16A34A", margin: 0 }}>{ind}</p>
                    <p style={{ fontSize: 10, color: "#64748B", margin: "2px 0 6px 0" }}>{label}</p>
                    <p style={{ fontSize: 18, fontWeight: 700, color: "#94A3B8", margin: 0 }}>-</p>
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
// DASHBOARD PAGE (Autentik Posyandu, Interaktif, Non-AI-Template)
// ─────────────────────────────────────────────────────────────────────────────

export interface InitialBalitaData {
  nama: string;
  jenis_kelamin: "L" | "P";
  umur_bulan: number;
  berat_kg: number;
  tinggi_cm: number;
}

interface PriorityBalita {
  id: string;
  nama: string;
  umur_bulan: number;
  jenis_kelamin: "L" | "P";
  berat_kg: number;
  tinggi_cm: number;
  pbu_zscore: number;
  bbu_zscore: number;
  status: "stunting" | "wasting" | "normal";
  nama_ibu: string;
  dusun_rt: string;
  pmt_status: string;
  catatan: string;
  rekomendasi: string[];
}

const SAMPLE_PRIORITY_BALITA: PriorityBalita[] = [
  {
    id: "1",
    nama: "Siti Rahmawati",
    umur_bulan: 16,
    jenis_kelamin: "P",
    berat_kg: 8.2,
    tinggi_cm: 72.5,
    pbu_zscore: -2.45,
    bbu_zscore: -1.82,
    status: "stunting",
    nama_ibu: "Ibu Nurhayati",
    dusun_rt: "RT 02 / Dusun Manis",
    pmt_status: "Paket Telur & Biskuit Balita",
    catatan: "Pertumbuhan panjang badan di bawah -2 SD (perawakan pendek). Nafsu makan menurun pasca batuk pilek bulan lalu.",
    rekomendasi: [
      "Edukasi MP-ASI 1 butir telur rebus setiap hari (protein hewani)",
      "Pemberian Makanan Tambahan (PMT) pemulihan berbasis pangan lokal",
      "Kunjungan rumah pemantauan konseling gizi dalam 14 hari",
    ],
  },
  {
    id: "2",
    nama: "Muhammad Dimas",
    umur_bulan: 10,
    jenis_kelamin: "L",
    berat_kg: 6.8,
    tinggi_cm: 70.0,
    pbu_zscore: -1.35,
    bbu_zscore: -3.10,
    status: "wasting",
    nama_ibu: "Ibu Siti Aminah",
    dusun_rt: "RT 04 / Dusun Pahing",
    pmt_status: "Formula Padat Gizi / Rujukan",
    catatan: "BB/U sangat kurang (< -3 SD / Gizi Buruk akut). Berat badan tidak naik dalam 2 kali penimbangan berturut-turut.",
    rekomendasi: [
      "Rujukan segera ke Bidan Desa dan Poli Gizi Puskesmas",
      "Pemberian makanan padat gizi (F-75/F-100 atau pangan lokal berprotein tinggi)",
      "Evaluasi riwayat infeksi, sanitasi air bersih, dan teknik menyusui",
    ],
  },
  {
    id: "3",
    nama: "Aisyah Putri",
    umur_bulan: 22,
    jenis_kelamin: "P",
    berat_kg: 9.4,
    tinggi_cm: 77.2,
    pbu_zscore: -2.15,
    bbu_zscore: -1.65,
    status: "stunting",
    nama_ibu: "Ibu Dewi Sartika",
    dusun_rt: "RT 01 / Dusun Wage",
    pmt_status: "PMT Pangan Lokal Desa",
    catatan: "Terindikasi perawakan pendek (stunted). Tinggi badan relatif stagnan selama 2 bulan terakhir.",
    rekomendasi: [
      "Konseling gizi Meja 4: tingkatkan porsi protein hewani (ikan kembung & hati ayam)",
      "Pantau kebiasaan cuci tangan pakai sabun (CTPS) sebelum makan",
      "Plotting kurva KMS secara berkala setiap tanggal penimbangan",
    ],
  },
  {
    id: "4",
    nama: "Rizky Pratama",
    umur_bulan: 14,
    jenis_kelamin: "L",
    berat_kg: 7.6,
    tinggi_cm: 73.8,
    pbu_zscore: -2.08,
    bbu_zscore: -2.25,
    status: "stunting",
    nama_ibu: "Ibu Rina Wulandari",
    dusun_rt: "RT 03 / Dusun Kliwon",
    pmt_status: "PMT Pemulihan Desa",
    catatan: "Kedua indikator PB/U dan BB/U berada di zona waspada. Butuh pendampingan kader dalam variasi tekstur makanan.",
    rekomendasi: [
      "Edukasi porsi makan aktif responsif pada anak",
      "Pemberian camilan padat kalori (bubur kacang hijau campur santan & telur)",
      "Pemeriksaan kesehatan umum di Pustu",
    ],
  },
  {
    id: "5",
    nama: "Budi Santoso",
    umur_bulan: 24,
    jenis_kelamin: "L",
    berat_kg: 12.2,
    tinggi_cm: 87.5,
    pbu_zscore: 0.15,
    bbu_zscore: -0.10,
    status: "normal",
    nama_ibu: "Ibu Maryani",
    dusun_rt: "RT 02 / Dusun Manis",
    pmt_status: "Kudapan Sehat Posyandu",
    catatan: "Tumbuh kembang sangat ideal tepat di garis hijau median WHO 2006. Pola asuh dan asupan gizi baik.",
    rekomendasi: [
      "Pertahankan menu gizi seimbang beragam sesuai pedoman Isi Piringku",
      "Lanjutkan pemantauan tumbuh kembang rutin setiap bulan di Posyandu",
      "Lakukan stimulasi motorik dan bicara sesuai buku KIA",
    ],
  },
  {
    id: "6",
    nama: "Zahra Hanifah",
    umur_bulan: 18,
    jenis_kelamin: "P",
    berat_kg: 10.4,
    tinggi_cm: 81.0,
    pbu_zscore: -0.20,
    bbu_zscore: 0.10,
    status: "normal",
    nama_ibu: "Ibu Halimah",
    dusun_rt: "RT 05 / Dusun Puhun",
    pmt_status: "Kudapan Sehat Posyandu",
    catatan: "Pertumbuhan stabil, nafsu makan baik, dan riwayat imunisasi dasar lengkap.",
    rekomendasi: [
      "Pemberian kapsul Vitamin A pada bulan Februari dan Agustus",
      "Pantau kebersihan lingkungan tempat bermain balita",
      "Apresiasi ibu balita atas pemantauan KMS yang konsisten",
    ],
  },
];

interface DashboardPageProps {
  onNavigate: (id: string) => void;
  onInspectBalita: (balita: InitialBalitaData) => void;
}

function DashboardPage({ onNavigate, onInspectBalita }: DashboardPageProps) {
  const [selectedBalita, setSelectedBalita] = useState<PriorityBalita>(SAMPLE_PRIORITY_BALITA[0]);
  const [filterStatus, setFilterStatus] = useState<"all" | "stunting" | "wasting" | "normal">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"pantauan" | "sandbox">("pantauan");

  // State untuk Sandbox Simulasi Z-Score Cepat
  const [simGender, setSimGender] = useState<"L" | "P">("L");
  const [simAge, setSimAge] = useState<number>(18);
  const [simWeight, setSimWeight] = useState<number>(10.2);
  const [simHeight, setSimHeight] = useState<number>(80.5);

  // Perhitungan realtime Z-Score di sandbox
  const livePbuZ = calculateZScoreWHO("pbu", simGender, simAge, simHeight);
  const liveBbuZ = calculateZScoreWHO("bbu", simGender, simAge, simWeight);
  const liveClass = classifyAntropometriWHO(livePbuZ, liveBbuZ);

  // Filter balita
  const filteredBalita = SAMPLE_PRIORITY_BALITA.filter(b => {
    const matchFilter = filterStatus === "all" || b.status === filterStatus;
    const matchSearch =
      b.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.nama_ibu.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.dusun_rt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <div style={{ maxWidth: 1040, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>
      {/* ── 1. CONTEXT HEADER (Warm, Respectful, Authentic Posyandu) ── */}
      <div style={{
        background: "linear-gradient(135deg, #F0FDF4 0%, #FFFFFF 65%)",
        border: "1.5px solid #BBF7D0",
        borderRadius: 22,
        padding: "24px 28px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 18,
      }}>
        <div style={{ maxWidth: 620 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
            <span style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "#DCFCE7", border: "1px solid #86EFAC",
              color: "#15803D", fontSize: 11, fontWeight: 700,
              padding: "4px 10px", borderRadius: 99,
            }}>
              <MapPin size={13} color="#15803D" /> Posyandu Melati 01 • Desa Sukamaju, Kab. Kuningan
            </span>
            <span style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "#FFFFFF", border: "1px solid #CBD5E1",
              color: "#475569", fontSize: 11, fontWeight: 600,
              padding: "4px 10px", borderRadius: 99,
            }}>
              <CalendarDays size={13} color="#64748B" /> Bulan Penimbangan Balita (BPB) • Oktober 2026
            </span>
            <span style={{
              display: "flex", alignItems: "center", gap: 5,
              background: "#FEF3C7", border: "1px solid #FDE68A",
              color: "#B45309", fontSize: 11, fontWeight: 700,
              padding: "4px 10px", borderRadius: 99,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#D97706", display: "inline-block" }} />
              Hari Buka Aktif
            </span>
          </div>

          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0F172A", margin: "0 0 8px 0", letterSpacing: "-0.015em" }}>
            Dasbor Pemantauan Pertumbuhan &amp; Intervensi Stunting
          </h1>
          <p style={{ fontSize: 13, color: "#475569", margin: 0, lineHeight: 1.55 }}>
            Sistem pendukung kerja kader posyandu untuk plotting kurva KMS WHO 2006, deteksi dini gagal tumbuh, serta panduan intervensi gizi pangan lokal terarah.
          </p>
        </div>

        {/* Action button cluster */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 210 }}>
          <button
            onClick={() => onNavigate("input")}
            className="btn-primary"
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              fontSize: 13, padding: "12px 18px", borderRadius: 12,
            }}
          >
            <Baby size={16} /> Catat Pengukuran Balita
          </button>
          <button
            onClick={() => onNavigate("grafik")}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              fontSize: 13, padding: "11px 18px", borderRadius: 12,
              background: "#FFFFFF", border: "1.5px solid #BBF7D0",
              color: "#15803D", fontWeight: 700, cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <TrendingUp size={16} /> Buka Kurva KMS WHO
          </button>
        </div>
      </div>

      {/* ── 2. INDIKATOR OPERASIONAL POSYANDU: SKDN KEMENKES RI ── */}
      <div style={{
        background: "#FFFFFF",
        border: "1.5px solid #E2E8F0",
        borderRadius: 20,
        padding: "22px 24px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
      }}>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#0F172A" }}>
              Indikator Operasional SKDN Posyandu (Standar Kemenkes RI)
            </div>
            <div style={{ fontSize: 12, color: "#64748B" }}>
              Evaluasi kinerja penimbangan, partisipasi masyarakat, dan tingkat kenaikan berat badan balita bulan ini.
            </div>
          </div>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: "#F0FDF4", border: "1px solid #BBF7D0",
            padding: "4px 10px", borderRadius: 8, fontSize: 11, fontWeight: 700, color: "#15803D",
          }}>
            <Target size={13} />
            <span>Target Nasional D/S: Minimal 85%</span>
          </div>
        </div>

        {/* 4 Cards SKDN Cascade */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 12 }}>
          {/* S */}
          <div style={{
            background: "#F8FAF8", border: "1.5px solid #E2E8F0",
            borderRadius: 14, padding: "14px 16px",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: "#64748B" }}>S (Sasaran Balita)</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#475569", background: "#E2E8F0", padding: "2px 6px", borderRadius: 6 }}>Total</span>
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: "#0F172A", lineHeight: 1.1 }}>248</div>
            <div style={{ fontSize: 11, color: "#475569", marginTop: 4 }}>Semua balita usia 0-59 bulan di desa</div>
          </div>

          {/* K */}
          <div style={{
            background: "#F8FAF8", border: "1.5px solid #E2E8F0",
            borderRadius: 14, padding: "14px 16px",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: "#64748B" }}>K (Punya Buku KIA)</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#15803D", background: "#DCFCE7", padding: "2px 6px", borderRadius: 6 }}>100% (K/S)</span>
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: "#0F172A", lineHeight: 1.1 }}>248</div>
            <div style={{ fontSize: 11, color: "#475569", marginTop: 4 }}>Seluruh balita memiliki buku KMS / KIA</div>
          </div>

          {/* D */}
          <div style={{
            background: "#F0FDF4", border: "1.5px solid #BBF7D0",
            borderRadius: 14, padding: "14px 16px",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: "#15803D" }}>D (Hadir Ditimbang)</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#15803D", background: "#DCFCE7", padding: "2px 6px", borderRadius: 6 }}>87.9% (D/S)</span>
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: "#0F172A", lineHeight: 1.1 }}>218</div>
            <div style={{ fontSize: 11, color: "#15803D", marginTop: 4 }}>Memenuhi target partisipasi masyarakat</div>
          </div>

          {/* N */}
          <div style={{
            background: "#F0FDF4", border: "1.5px solid #BBF7D0",
            borderRadius: 14, padding: "14px 16px",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: "#15803D" }}>N (Naik Timbangannya)</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#15803D", background: "#DCFCE7", padding: "2px 6px", borderRadius: 6 }}>83.5% (N/D)</span>
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: "#0F172A", lineHeight: 1.1 }}>182</div>
            <div style={{ fontSize: 11, color: "#15803D", marginTop: 4 }}>Pertumbuhan BB balita sesuai kurva hijau</div>
          </div>
        </div>

        {/* Status Perhatian Operasional */}
        <div style={{
          marginTop: 14,
          padding: "12px 16px",
          borderRadius: 12,
          background: "#FFFBEB",
          border: "1px solid #FDE68A",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <AlertTriangle size={18} color="#D97706" style={{ flexShrink: 0 }} />
            <div style={{ fontSize: 12, color: "#92400E" }}>
              <strong>Atensi Kader:</strong> Terdapat <strong>36 balita (T / Tidak Naik)</strong> yang membutuhkan konseling gizi MP-ASI dan <strong>3 balita prioritas rujukan</strong> ke Puskesmas.
            </div>
          </div>
          <button
            onClick={() => {
              setActiveTab("pantauan");
              setFilterStatus("stunting");
              const el = document.getElementById("section-utama");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }}
            style={{
              padding: "6px 12px",
              borderRadius: 8,
              border: "1px solid #F59E0B",
              background: "#FFFFFF",
              color: "#B45309",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            Tampilkan Kasus Prioritas
          </button>
        </div>
      </div>

      {/* ── 3. DISTRIBUSI STATUS GIZI BALITA (Standar Baku WHO 2006) ── */}
      <div style={{
        background: "#FFFFFF",
        border: "1.5px solid #E2E8F0",
        borderRadius: 20,
        padding: "22px 24px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
      }}>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#0F172A" }}>
              Distribusi Antropometri Lapangan (248 Balita)
            </div>
            <div style={{ fontSize: 12, color: "#64748B" }}>
              Klasifikasi status gizi berdasarkan indeks Panjang Badan menurut Umur (PB/U) dan Berat Badan menurut Umur (BB/U).
            </div>
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#15803D", background: "#DCFCE7", padding: "3px 10px", borderRadius: 99 }}>
            Metode LMS WHO Child Growth Standards 2006
          </span>
        </div>

        {/* Proportional Segmented Progress Bar */}
        <div style={{
          height: 20,
          width: "100%",
          borderRadius: 99,
          background: "#E2E8F0",
          display: "flex",
          overflow: "hidden",
          marginBottom: 14,
        }}>
          <div style={{ width: "81.5%", background: "#16A34A" }} title="Gizi Baik / Normal: 202 anak (81.5%)" />
          <div style={{ width: "15.3%", background: "#F59E0B" }} title="Waspada Stunting: 38 anak (15.3%)" />
          <div style={{ width: "2.0%", background: "#EA580C" }} title="Gizi Kurang: 5 anak (2.0%)" />
          <div style={{ width: "1.2%", background: "#DC2626" }} title="Gizi Buruk / Sangat Pendek: 3 anak (1.2%)" />
        </div>

        {/* 4 Interactive Pills */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
          <div
            onClick={() => { setActiveTab("pantauan"); setFilterStatus("normal"); }}
            style={{
              background: "#F0FDF4", border: "1px solid #BBF7D0",
              borderRadius: 12, padding: "10px 14px", cursor: "pointer",
              transition: "transform 0.15s ease",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#16A34A" }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: "#15803D" }}>Normal / Baik</span>
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#0F172A" }}>202 Anak</div>
            <div style={{ fontSize: 10, color: "#475569" }}>81.5% balita tumbuh ideal</div>
          </div>

          <div
            onClick={() => { setActiveTab("pantauan"); setFilterStatus("stunting"); }}
            style={{
              background: "#FFFBEB", border: "1px solid #FDE68A",
              borderRadius: 12, padding: "10px 14px", cursor: "pointer",
              transition: "transform 0.15s ease",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#F59E0B" }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: "#B45309" }}>Waspada Stunting</span>
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#0F172A" }}>38 Anak</div>
            <div style={{ fontSize: 10, color: "#475569" }}>15.3% PB/U di bawah -2 SD</div>
          </div>

          <div
            onClick={() => { setActiveTab("pantauan"); setFilterStatus("stunting"); }}
            style={{
              background: "#FFF7ED", border: "1px solid #FED7AA",
              borderRadius: 12, padding: "10px 14px", cursor: "pointer",
              transition: "transform 0.15s ease",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#EA580C" }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: "#C2410C" }}>Gizi Kurang</span>
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#0F172A" }}>5 Anak</div>
            <div style={{ fontSize: 10, color: "#475569" }}>2.0% BB/U di bawah -2 SD</div>
          </div>

          <div
            onClick={() => { setActiveTab("pantauan"); setFilterStatus("wasting"); }}
            style={{
              background: "#FEF2F2", border: "1px solid #FECACA",
              borderRadius: 12, padding: "10px 14px", cursor: "pointer",
              transition: "transform 0.15s ease",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#DC2626" }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: "#B91C1C" }}>Rujukan Medis</span>
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#0F172A" }}>3 Anak</div>
            <div style={{ fontSize: 10, color: "#475569" }}>1.2% balita perlu atensi Bidan</div>
          </div>
        </div>
      </div>

      {/* ── 4. SECTION UTAMA INTERAKTIF: TAB SWITCHER ── */}
      <div id="section-utama" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Navigation Tabs */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
        }}>
          <div style={{
            display: "inline-flex",
            background: "#F1F5F9",
            border: "1px solid #E2E8F0",
            borderRadius: 14,
            padding: 4,
            gap: 4,
          }}>
            <button
              type="button"
              onClick={() => setActiveTab("pantauan")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                padding: "8px 16px",
                borderRadius: 10,
                border: "none",
                background: activeTab === "pantauan" ? "#16A34A" : "transparent",
                color: activeTab === "pantauan" ? "#FFFFFF" : "#475569",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.15s ease",
                boxShadow: activeTab === "pantauan" ? "0 2px 6px rgba(22,163,74,0.25)" : "none",
              }}
            >
              <Users size={15} /> Daftar Balita Pantauan ({filteredBalita.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("sandbox")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                padding: "8px 16px",
                borderRadius: 10,
                border: "none",
                background: activeTab === "sandbox" ? "#16A34A" : "transparent",
                color: activeTab === "sandbox" ? "#FFFFFF" : "#475569",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.15s ease",
                boxShadow: activeTab === "sandbox" ? "0 2px 6px rgba(22,163,74,0.25)" : "none",
              }}
            >
              <Sliders size={15} /> Simulasi Cepat Z-Score (Sandbox)
            </button>
          </div>

          <div style={{ fontSize: 12, color: "#64748B" }}>
            {activeTab === "pantauan"
              ? "Klik salah satu balita untuk membuka lembar rekam KIA & kurva KMS"
              : "Geser parameter untuk simulasi klasifikasi instan WHO 2006"}
          </div>
        </div>

        {/* TAB 1: DAFTAR BALITA + LEMBAR REKAM KIA / KMS */}
        {activeTab === "pantauan" && (
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 20 }}>
            {/* KOLOM KIRI: DAFTAR BALITA */}
            <div style={{
              background: "#FFFFFF",
              border: "1.5px solid #E2E8F0",
              borderRadius: 20,
              padding: 22,
              boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}>
              {/* Header & Search */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ position: "relative" }}>
                  <Search size={16} color="#94A3B8" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Cari nama balita, ibu, atau dusun..."
                    className="input-field"
                    style={{ paddingLeft: 40, fontSize: 13 }}
                  />
                </div>

                {/* Filter chips */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {[
                    { id: "all", label: "Semua" },
                    { id: "stunting", label: "Waspada Stunting" },
                    { id: "wasting", label: "Gizi Buruk / Wasting" },
                    { id: "normal", label: "Normal" },
                  ].map(f => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFilterStatus(f.id as typeof filterStatus)}
                      style={{
                        padding: "5px 11px",
                        borderRadius: 8,
                        border: filterStatus === f.id ? "1.5px solid #16A34A" : "1px solid #CBD5E1",
                        background: filterStatus === f.id ? "#DCFCE7" : "#FFFFFF",
                        color: filterStatus === f.id ? "#15803D" : "#475569",
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* List of Toddlers */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 520, overflowY: "auto", paddingRight: 4 }}>
                {filteredBalita.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px 10px", color: "#64748B", fontSize: 13 }}>
                    Tidak ada balita yang cocok dengan pencarian atau filter ini.
                  </div>
                ) : (
                  filteredBalita.map(b => {
                    const isSelected = selectedBalita.id === b.id;
                    const isAlert = b.status === "stunting" || b.status === "wasting";

                    return (
                      <div
                        key={b.id}
                        onClick={() => setSelectedBalita(b)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "12px 14px",
                          borderRadius: 14,
                          background: isSelected ? "#F0FDF4" : "#FFFFFF",
                          border: isSelected ? "2px solid #16A34A" : "1.5px solid #E2E8F0",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                          boxShadow: isSelected ? "0 2px 8px rgba(22,163,74,0.15)" : "none",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          {/* Avatar Gender */}
                          <div style={{
                            width: 38, height: 38, borderRadius: 10,
                            background: b.jenis_kelamin === "L" ? "#E0F2FE" : "#FCE7F3",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 14, fontWeight: 800,
                            color: b.jenis_kelamin === "L" ? "#0284C7" : "#BE185D",
                            flexShrink: 0,
                          }}>
                            {b.jenis_kelamin}
                          </div>

                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <span style={{ fontSize: 14, fontWeight: 800, color: "#0F172A" }}>
                                {b.nama}
                              </span>
                              {isSelected && <Check size={14} color="#16A34A" />}
                            </div>
                            <div style={{ fontSize: 11, color: "#64748B" }}>
                              {b.umur_bulan} Bulan • {b.dusun_rt}
                            </div>
                          </div>
                        </div>

                        {/* Indicators */}
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3 }}>
                          <span style={{
                            fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 6,
                            background: b.pbu_zscore < -2 ? "#FEE2E2" : "#DCFCE7",
                            color: b.pbu_zscore < -2 ? "#B91C1C" : "#15803D",
                          }}>
                            PB/U: {b.pbu_zscore > 0 ? "+" : ""}{b.pbu_zscore.toFixed(2)} SD
                          </span>
                          <span style={{ fontSize: 11, color: "#475569", fontWeight: 600 }}>
                            {b.berat_kg} kg • {b.tinggi_cm} cm
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* KOLOM KANAN: LEMBAR REKAM KIA / KARTU KMS DIGITAL */}
            <div style={{
              background: "#FFFFFF",
              border: "1.5px solid #BBF7D0",
              borderRadius: 20,
              padding: 24,
              boxShadow: "0 4px 14px rgba(22,163,74,0.06)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: 18,
            }}>
              <div>
                {/* Header Kartu KIA */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingBottom: 12,
                  borderBottom: "1.5px solid #F1F5F9",
                  marginBottom: 16,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 8,
                      background: "#DCFCE7", display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <Baby size={18} color="#15803D" />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: "#0F172A" }}>
                        KARTU MENUJU SEHAT (KMS) DIGITAL
                      </div>
                      <div style={{ fontSize: 10, color: "#16A34A", fontWeight: 700 }}>
                        BUKU KESEHATAN IBU DAN ANAK (KIA)
                      </div>
                    </div>
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 6,
                    background: selectedBalita.status === "normal" ? "#DCFCE7" : selectedBalita.status === "wasting" ? "#FEE2E2" : "#FEF3C7",
                    color: selectedBalita.status === "normal" ? "#15803D" : selectedBalita.status === "wasting" ? "#B91C1C" : "#B45309",
                  }}>
                    {selectedBalita.status === "normal" ? "Gizi Baik" : selectedBalita.status === "wasting" ? "Gizi Buruk" : "Waspada Stunting"}
                  </span>
                </div>

                {/* Profil Anak */}
                <div style={{
                  background: "#F8FAF8", border: "1px solid #E2E8F0",
                  borderRadius: 14, padding: "12px 14px", marginBottom: 16,
                }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "#0F172A", marginBottom: 4 }}>
                    {selectedBalita.nama}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, fontSize: 12, color: "#475569" }}>
                    <div>Jenis Kelamin: <strong style={{ color: "#0F172A" }}>{selectedBalita.jenis_kelamin === "L" ? "Laki-laki" : "Perempuan"}</strong></div>
                    <div>Usia Balita: <strong style={{ color: "#0F172A" }}>{selectedBalita.umur_bulan} Bulan</strong></div>
                    <div>Ibu Kandung: <strong style={{ color: "#0F172A" }}>{selectedBalita.nama_ibu}</strong></div>
                    <div>Wilayah: <strong style={{ color: "#0F172A" }}>{selectedBalita.dusun_rt}</strong></div>
                  </div>
                </div>

                {/* Dua Meter Z-Score WHO */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                  {/* PB/U (Stunting) */}
                  <div style={{
                    background: selectedBalita.pbu_zscore < -2 ? "#FEF2F2" : "#F0FDF4",
                    border: `1.5px solid ${selectedBalita.pbu_zscore < -2 ? "#FECACA" : "#BBF7D0"}`,
                    borderRadius: 14, padding: "12px 14px",
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", marginBottom: 4 }}>
                      PB/U (Panjang Badan / Usia)
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: selectedBalita.pbu_zscore < -2 ? "#DC2626" : "#16A34A", lineHeight: 1.1 }}>
                      {selectedBalita.pbu_zscore > 0 ? "+" : ""}{selectedBalita.pbu_zscore.toFixed(2)} SD
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: selectedBalita.pbu_zscore < -2 ? "#B91C1C" : "#15803D", marginTop: 4 }}>
                      {selectedBalita.pbu_zscore < -3 ? "Sangat Pendek" : selectedBalita.pbu_zscore < -2 ? "Pendek (Stunted)" : "Normal"}
                    </div>
                    <div style={{ fontSize: 10, color: "#64748B", marginTop: 2 }}>
                      Panjang: {selectedBalita.tinggi_cm} cm
                    </div>
                  </div>

                  {/* BB/U (Underweight) */}
                  <div style={{
                    background: selectedBalita.bbu_zscore < -2 ? "#FFFBEB" : "#F0FDF4",
                    border: `1.5px solid ${selectedBalita.bbu_zscore < -2 ? "#FDE68A" : "#BBF7D0"}`,
                    borderRadius: 14, padding: "12px 14px",
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", marginBottom: 4 }}>
                      BB/U (Berat Badan / Usia)
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: selectedBalita.bbu_zscore < -2 ? "#D97706" : "#16A34A", lineHeight: 1.1 }}>
                      {selectedBalita.bbu_zscore > 0 ? "+" : ""}{selectedBalita.bbu_zscore.toFixed(2)} SD
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: selectedBalita.bbu_zscore < -2 ? "#B45309" : "#15803D", marginTop: 4 }}>
                      {selectedBalita.bbu_zscore < -3 ? "Gizi Buruk" : selectedBalita.bbu_zscore < -2 ? "Gizi Kurang" : "Gizi Baik"}
                    </div>
                    <div style={{ fontSize: 10, color: "#64748B", marginTop: 2 }}>
                      Berat: {selectedBalita.berat_kg} kg
                    </div>
                  </div>
                </div>

                {/* Catatan Kader & Rekomendasi Alur Meja 4 */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "#0F172A", marginBottom: 6 }}>
                    Catatan Kader &amp; Rencana Intervensi:
                  </div>
                  <p style={{ fontSize: 12, color: "#475569", lineHeight: 1.45, margin: "0 0 10px 0" }}>
                    {selectedBalita.catatan}
                  </p>

                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    {selectedBalita.rekomendasi.map((rec, idx) => (
                      <div key={idx} style={{ display: "flex", alignItems: "flex-start", gap: 7, fontSize: 11, color: "#334155" }}>
                        <CheckCircle2 size={13} color="#16A34A" style={{ flexShrink: 0, marginTop: 2 }} />
                        <span>{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Button: Buka Kurva KMS */}
              <button
                type="button"
                onClick={() => onInspectBalita({
                  nama: selectedBalita.nama,
                  jenis_kelamin: selectedBalita.jenis_kelamin,
                  umur_bulan: selectedBalita.umur_bulan,
                  berat_kg: selectedBalita.berat_kg,
                  tinggi_cm: selectedBalita.tinggi_cm,
                })}
                className="btn-primary"
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  fontSize: 13,
                  padding: "13px 18px",
                  borderRadius: 12,
                }}
              >
                <TrendingUp size={16} />
                <span>Buka Posisi di Kurva WHO (KMS) Lengkap</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: SANDBOX SIMULASI Z-SCORE CEPAT */}
        {activeTab === "sandbox" && (
          <div style={{
            background: "#FFFFFF",
            border: "1.5px solid #BBF7D0",
            borderRadius: 20,
            padding: 26,
            boxShadow: "0 4px 14px rgba(22,163,74,0.06)",
            display: "grid",
            gridTemplateColumns: "1.2fr 1fr",
            gap: 24,
            alignItems: "center",
          }}>
            {/* Input Controls Sandbox */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#0F172A", marginBottom: 4 }}>
                  Simulasi Pengukuran Antropometri Cepat
                </div>
                <p style={{ fontSize: 12, color: "#64748B", margin: 0 }}>
                  Geser parameter usia, tinggi, dan berat untuk melihat kalkulasi Z-score WHO 2006 secara seketika tanpa harus membuka formulir input.
                </p>
              </div>

              {/* Gender Toggle */}
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                  Jenis Kelamin Balita
                </label>
                <div style={{ display: "flex", gap: 8 }}>
                  {(["L", "P"] as const).map(g => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setSimGender(g)}
                      style={{
                        flex: 1,
                        padding: "8px 0",
                        borderRadius: 10,
                        border: simGender === g ? "1.5px solid #16A34A" : "1.5px solid #CBD5E1",
                        background: simGender === g ? "#DCFCE7" : "#FFFFFF",
                        color: simGender === g ? "#15803D" : "#475569",
                        fontSize: 12,
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

              {/* Slider Umur */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                  <span>Umur Balita</span>
                  <span style={{ color: "#16A34A", fontWeight: 800 }}>{simAge} Bulan</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={60}
                  value={simAge}
                  onChange={e => setSimAge(Number(e.target.value))}
                  style={{ width: "100%", accentColor: "#16A34A", cursor: "pointer", height: 6 }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#94A3B8", marginTop: 4 }}>
                  <span>0 bln (Baru Lahir)</span>
                  <span>24 bln (Baduta)</span>
                  <span>60 bln (5 Tahun)</span>
                </div>
              </div>

              {/* Input Berat & Tinggi */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                    Berat Badan (kg)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={35}
                    step={0.1}
                    value={simWeight}
                    onChange={e => setSimWeight(Number(e.target.value))}
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
                    value={simHeight}
                    onChange={e => setSimHeight(Number(e.target.value))}
                    className="input-field"
                  />
                </div>
              </div>
            </div>

            {/* Live Calculation Preview Card */}
            <div style={{
              background: "#F8FAF8",
              border: "1.5px solid #E2E8F0",
              borderRadius: 18,
              padding: 20,
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: "#0F172A" }}>Hasil Simulasi WHO 2006</span>
                <span style={{
                  fontSize: 11, fontWeight: 700,
                  color: liveClass.badgeColor,
                  background: liveClass.badgeBg,
                  padding: "3px 8px", borderRadius: 6,
                }}>
                  {liveClass.stuntingStatus}
                </span>
              </div>

              {/* PB/U Meter */}
              <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 12, padding: "12px 14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 700, color: "#475569", marginBottom: 4 }}>
                  <span>PB/U (Indikator Stunting)</span>
                  <span style={{ color: livePbuZ < -2 ? "#DC2626" : "#16A34A" }}>
                    {livePbuZ > 0 ? "+" : ""}{livePbuZ.toFixed(2)} SD
                  </span>
                </div>
                <div style={{ height: 8, borderRadius: 4, background: "#E2E8F0", overflow: "hidden" }}>
                  <div style={{
                    height: "100%",
                    width: `${Math.min(100, Math.max(5, ((livePbuZ + 4) / 8) * 100))}%`,
                    background: livePbuZ < -2 ? "#EF4444" : "#22C55E",
                    borderRadius: 4,
                  }} />
                </div>
                <div style={{ fontSize: 10, color: "#64748B", marginTop: 4 }}>
                  {liveClass.stuntingStatus}
                </div>
              </div>

              {/* BB/U Meter */}
              <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 12, padding: "12px 14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 700, color: "#475569", marginBottom: 4 }}>
                  <span>BB/U (Indikator Berat Badan)</span>
                  <span style={{ color: liveBbuZ < -2 ? "#D97706" : "#16A34A" }}>
                    {liveBbuZ > 0 ? "+" : ""}{liveBbuZ.toFixed(2)} SD
                  </span>
                </div>
                <div style={{ height: 8, borderRadius: 4, background: "#E2E8F0", overflow: "hidden" }}>
                  <div style={{
                    height: "100%",
                    width: `${Math.min(100, Math.max(5, ((liveBbuZ + 4) / 8) * 100))}%`,
                    background: liveBbuZ < -2 ? "#F59E0B" : "#22C55E",
                    borderRadius: 4,
                  }} />
                </div>
                <div style={{ fontSize: 10, color: "#64748B", marginTop: 4 }}>
                  {liveClass.weightStatus}
                </div>
              </div>

              {/* Tombol kirim ke Kurva */}
              <button
                type="button"
                onClick={() => onInspectBalita({
                  nama: `Simulasi Balita ${simGender}-${simAge}bln`,
                  jenis_kelamin: simGender,
                  umur_bulan: simAge,
                  berat_kg: simWeight,
                  tinggi_cm: simHeight,
                })}
                className="btn-primary"
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  fontSize: 13,
                  padding: "11px 16px",
                  borderRadius: 12,
                }}
              >
                <TrendingUp size={16} /> Buka Hasil Simulasi Ini di Kurva KMS
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── 5. PANDUAN TERINTEGRASI: ALUR 5 MEJA POSYANDU KEMENKES RI ── */}
      <div style={{
        background: "#FFFFFF",
        border: "1.5px solid #E2E8F0",
        borderRadius: 20,
        padding: "22px 24px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
      }}>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Layers size={18} color="#16A34A" />
            <h3 style={{ fontSize: 15, fontWeight: 800, color: "#0F172A", margin: 0 }}>
              Alur Pelayanan 5 Meja Posyandu Kemenkes RI
            </h3>
          </div>
          <button
            onClick={() => onNavigate("input")}
            style={{
              padding: "6px 12px",
              borderRadius: 8,
              border: "1px solid #BBF7D0",
              background: "#F0FDF4",
              color: "#15803D",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span>Mulai Pengukuran di Meja 3</span>
            <ChevronRight size={14} />
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 10 }}>
          {[
            { step: "Meja 1", title: "Pendaftaran", desc: "Registrasi balita & orang tua di buku register", highlight: false },
            { step: "Meja 2", title: "Penimbangan", desc: "Timbang dacin/baby scale & ukur panjang badan", highlight: false },
            { step: "Meja 3", title: "Pengisian KMS & AI", desc: "ZeroStunting AI menghitung Z-score seketika", highlight: true },
            { step: "Meja 4", title: "Penyuluhan Gizi", desc: "Konseling MP-ASI kaya protein & PMT pangan lokal", highlight: false },
            { step: "Meja 5", title: "Pelayanan Kesehatan", desc: "Imunisasi, Vitamin A, dan rujukan Bidan Desa", highlight: false },
          ].map(m => (
            <div
              key={m.step}
              style={{
                borderRadius: 14,
                padding: "12px 14px",
                background: m.highlight ? "#F0FDF4" : "#F8FAF8",
                border: `1.5px solid ${m.highlight ? "#16A34A" : "#E2E8F0"}`,
                display: "flex", flexDirection: "column", gap: 4,
                boxShadow: m.highlight ? "0 2px 6px rgba(22,163,74,0.15)" : "none",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{
                  fontSize: 10, fontWeight: 800,
                  color: m.highlight ? "#15803D" : "#64748B",
                  textTransform: "uppercase", letterSpacing: "0.05em",
                }}>
                  {m.step}
                </span>
                {m.highlight && (
                  <span style={{ fontSize: 9, fontWeight: 800, background: "#16A34A", color: "#FFFFFF", padding: "1px 5px", borderRadius: 4 }}>
                    Sistem Ini
                  </span>
                )}
              </div>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#0F172A" }}>{m.title}</div>
              <div style={{ fontSize: 11, color: "#475569", lineHeight: 1.4 }}>{m.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GRAFIK KMS INTERAKTIF (Posyandu Friendly, Preloaded, Stable)
// ─────────────────────────────────────────────────────────────────────────────

function GrafikKmsPage({ initialData }: { initialData?: InitialBalitaData | null }) {
  const [gender, setGender] = useState<"L" | "P">(initialData?.jenis_kelamin ?? "L");
  const [age, setAge] = useState<number>(initialData?.umur_bulan ?? 18);
  const [weight, setWeight] = useState<number>(initialData?.berat_kg ?? 10.5);
  const [height, setHeight] = useState<number>(initialData?.tinggi_cm ?? 82.0);
  const [name, setName] = useState<string>(initialData?.nama ?? "Budi Santoso");

  // Sinkronisasi data ketika balita terpilih berganti dari Dashboard
  useEffect(() => {
    if (initialData) {
      setGender(initialData.jenis_kelamin);
      setAge(initialData.umur_bulan);
      setWeight(initialData.berat_kg);
      setHeight(initialData.tinggi_cm);
      setName(initialData.nama);
    }
  }, [initialData]);

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
  const [mobileOpen, setMobileOpen] = useState(false);
  const [selectedBalitaForGrafik, setSelectedBalitaForGrafik] = useState<InitialBalitaData | null>(null);

  const handleInspectBalita = (balita: InitialBalitaData) => {
    setSelectedBalitaForGrafik(balita);
    setActivePage("grafik");
  };

  const renderPage = () => {
    switch (activePage) {
      case "dashboard":
        return <DashboardPage onNavigate={setActivePage} onInspectBalita={handleInspectBalita} />;
      case "input":
        return <InputDataPage />;
      case "grafik":
        return <GrafikKmsPage initialData={selectedBalitaForGrafik} />;
      case "riwayat":
        return <ComingSoonPage title="Riwayat Data" />;
      case "laporan":
        return <ComingSoonPage title="Laporan e-PPGBM" />;
      case "peta":
        return <ComingSoonPage title="Peta Stunting" />;
      default:
        return <DashboardPage onNavigate={setActivePage} onInspectBalita={handleInspectBalita} />;
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "#F8FAF8" }}>
      {/* Sidebar */}
      <Sidebar
        active={activePage}
        onNav={setActivePage}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      {/* Main column */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
        {/* Topbar */}
        <header style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "0 26px", height: 60,
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

          <div style={{
            display: "flex", alignItems: "center", gap: 7,
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
        </header>

        {/* Content Area */}
        <main style={{ flex: 1, overflowY: "auto", padding: 26 }} className="fade-in">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}

