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
import { ManualForm } from "@/components/input/ManualForm";
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
// INPUT FORM PAGE (Clean, Warm, Validasi Zod & Human-in-the-Loop)
// ─────────────────────────────────────────────────────────────────────────────

function InputDataPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AntropometriResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [lastSubmitted, setLastSubmitted] = useState<BalitaFormData | null>(null);

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
        Catat hasil timbang dan ukur balita untuk deteksi cepat status gizi dan risiko stunting sesuai standar WHO 2006.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "flex-start" }}>
        {/* ── FORM KOLOM KIRI (Modular ManualForm dengan Zod & Confirmation Modal) ── */}
        <ManualForm onSubmitValid={handleValidSubmit} loading={loading} />

        {/* ── HASIL KOLOM KANAN ── */}
        <div>
          {error && (
            <div style={{
              display: "flex", gap: 8, padding: "12px 14px", borderRadius: 12,
              background: "#FEF2F2", border: "1px solid #FECACA", marginBottom: 16,
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
              borderRadius: 20, padding: 40,
              display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center",
              justifyContent: "center", minHeight: 460,
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
              <p style={{ fontSize: 13, color: "#64748B", maxWidth: 260, lineHeight: 1.6 }}>
                Isi formulir pengukuran di sebelah kiri, lalu tekan tombol <strong>Periksa &amp; Hitung Z-Score</strong>.
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
// DASHBOARD PAGE (Simpel, Bersih, Ramah Posyandu)
// ─────────────────────────────────────────────────────────────────────────────

function DashboardPage({ onNavigate }: { onNavigate: (id: string) => void }) {
  const stats = [
    {
      label: "Total Balita Terdata",
      value: "248",
      sub: "Semua balita di wilayah kerja",
      icon: Baby,
      color: "#0284C7",
      bg: "#E0F2FE",
    },
    {
      label: "Pertumbuhan Normal",
      value: "81.5%",
      sub: "202 balita gizi ideal",
      icon: CheckCircle,
      color: "#15803D",
      bg: "#DCFCE7",
    },
    {
      label: "Waspada Stunting",
      value: "17.3%",
      sub: "43 balita PB/U < -2 SD",
      icon: TrendingDown,
      color: "#D97706",
      bg: "#FEF3C7",
    },
    {
      label: "Perlu Rujukan Medis",
      value: "3",
      sub: "Gizi buruk / atensi Bidan",
      icon: AlertTriangle,
      color: "#DC2626",
      bg: "#FEE2E2",
    },
  ];

  return (
    <div style={{ maxWidth: 980, margin: "0 auto", display: "flex", flexDirection: "column", gap: 22 }}>
      {/* Header Sederhana & Ramah Posyandu */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
          <span style={{
            display: "flex", alignItems: "center", gap: 5,
            background: "#F0FDF4", border: "1px solid #BBF7D0",
            color: "#15803D", fontSize: 11, fontWeight: 700,
            padding: "3px 10px", borderRadius: 99,
          }}>
            <MapPin size={12} color="#15803D" /> Posyandu Melati 01 • Desa Sukamaju
          </span>
          <span style={{
            display: "flex", alignItems: "center", gap: 5,
            background: "#F8FAF8", border: "1px solid #E2E8F0",
            color: "#64748B", fontSize: 11, fontWeight: 600,
            padding: "3px 10px", borderRadius: 99,
          }}>
            <CalendarDays size={12} color="#64748B" /> Periode Penimbangan: Oktober 2026
          </span>
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0F172A", margin: "0 0 4px 0", letterSpacing: "-0.01em" }}>
          Dashboard Posyandu Desa
        </h1>
        <p style={{ fontSize: 14, color: "#475569", margin: 0 }}>
          Selamat bertugas, Ibu Kader! Pantau tumbuh kembang dan cegah stunting pada balita di posyandu Anda.
        </p>
      </div>

      {/* 4 Kartu Metrik Utama (Ringkas, Jelas, Tidak Berlebihan) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 14 }}>
        {stats.map(({ label, value, sub, icon: Icon, color, bg }) => (
          <div
            key={label}
            style={{
              background: "#FFFFFF",
              border: "1.5px solid #E2E8F0",
              borderRadius: 18,
              padding: "20px 22px",
              boxShadow: "0 2px 6px rgba(0, 0, 0, 0.03)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <span style={{ fontSize: 13, color: "#475569", fontWeight: 700 }}>{label}</span>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: bg, display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Icon size={18} color={color} />
              </div>
            </div>
            <div>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#0F172A", lineHeight: 1, marginBottom: 6 }}>
                {value}
              </div>
              <div style={{ fontSize: 11, color: "#64748B" }}>
                {sub}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Action Card (Warna Hangat Posyandu, Tombol Jelas) */}
      <div style={{
        background: "linear-gradient(135deg, #15803D 0%, #16A34A 100%)",
        borderRadius: 20,
        padding: "24px 28px",
        boxShadow: "0 4px 16px rgba(22, 163, 74, 0.22)",
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 18,
        color: "#FFFFFF",
      }}>
        <div style={{ maxWidth: 520 }}>
          <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>
            Input Pengukuran Balita Baru
          </div>
          <div style={{ fontSize: 13, color: "#DCFCE7", lineHeight: 1.5 }}>
            Ukur berat dan panjang badan anak untuk deteksi dini risiko stunting dan gizi kurang berdasarkan standar WHO 2006.
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => onNavigate("input")}
            style={{
              background: "#FFFFFF",
              color: "#15803D",
              border: "none",
              borderRadius: 12,
              padding: "11px 20px",
              fontSize: 13,
              fontWeight: 800,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              whiteSpace: "nowrap",
              transition: "transform 0.15s ease",
            }}
          >
            <Baby size={17} /> Mulai Pengukuran
          </button>
          <button
            type="button"
            onClick={() => onNavigate("grafik")}
            style={{
              background: "rgba(255, 255, 255, 0.15)",
              color: "#FFFFFF",
              border: "1.5px solid rgba(255, 255, 255, 0.35)",
              borderRadius: 12,
              padding: "11px 18px",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
              whiteSpace: "nowrap",
              transition: "background 0.15s ease",
            }}
          >
            <TrendingUp size={16} /> Buka Kurva KMS
          </button>
        </div>
      </div>

      {/* 2 Panduan Esensial Kader (Sederhana, Bersih, Berguna) */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        {/* Panduan 1: Ambang Batas Z-Score WHO */}
        <div style={{
          background: "#FFFFFF",
          border: "1.5px solid #E2E8F0",
          borderRadius: 20,
          padding: 22,
          boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
        }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#0F172A", marginBottom: 14 }}>
            Cara Membaca Ambang Batas Z-Score WHO
          </div>
          {[
            { range: "< -3 SD",      label: "Sangat Pendek / Gizi Buruk", color: "#B91C1C", bg: "#FEE2E2" },
            { range: "-3 s/d -2 SD", label: "Pendek / Gizi Kurang",       color: "#B45309", bg: "#FEF3C7" },
            { range: "-2 s/d +2 SD", label: "Tumbuh Normal (Ideal)",      color: "#15803D", bg: "#DCFCE7" },
            { range: "> +2 SD",      label: "Risiko Berat Lebih",         color: "#B45309", bg: "#FEF3C7" },
          ].map(({ range, label, color, bg }) => (
            <div
              key={range}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 0",
                borderBottom: "1px solid #F1F5F9",
              }}
            >
              <span style={{ fontSize: 12, color: "#475569", fontWeight: 700 }}>{range}</span>
              <span style={{
                fontSize: 11, fontWeight: 700, color, background: bg,
                borderRadius: 99, padding: "3px 12px",
              }}>
                {label}
              </span>
            </div>
          ))}
          <div style={{ fontSize: 11, color: "#64748B", marginTop: 12, lineHeight: 1.4 }}>
            Baku rujukan: Standar Antropometri Anak Kemenkes RI / WHO Child Growth Standards 2006.
          </div>
        </div>

        {/* Panduan 2: Tiga Indikator Antropometri Kader */}
        <div style={{
          background: "#FFFFFF",
          border: "1.5px solid #E2E8F0",
          borderRadius: 20,
          padding: 22,
          boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
        }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#0F172A", marginBottom: 14 }}>
            Panduan Tiga Indikator Antropometri Kader
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { ind: "BB/U",  title: "Berat Badan per Umur",   desc: "Deteksi berat badan kurang (underweight)" },
              { ind: "PB/U",  title: "Panjang/Tinggi per Umur", desc: "Deteksi stunting atau perawakan pendek" },
              { ind: "BB/PB", title: "Berat per Panjang Badan", desc: "Deteksi kurus / wasting gizi buruk" },
            ].map(({ ind, title, desc }) => (
              <div key={ind} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span style={{
                  fontSize: 11, fontWeight: 800, color: "#15803D",
                  background: "#DCFCE7", padding: "2px 8px", borderRadius: 6,
                  flexShrink: 0, width: 48, textAlign: "center",
                }}>
                  {ind}
                </span>
                <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.4 }}>
                  <strong style={{ color: "#0F172A" }}>{title}:</strong> {desc}
                </div>
              </div>
            ))}
          </div>

          <div style={{
            borderTop: "1px solid #F1F5F9",
            marginTop: 12,
            paddingTop: 12,
            fontSize: 11,
            color: "#64748B",
            lineHeight: 1.45,
          }}>
            <div>• Usia 0 - 23 bulan: Ukur <strong style={{ color: "#0F172A" }}>telentang</strong> (Panjang Badan / PB)</div>
            <div style={{ marginTop: 2 }}>• Usia 24 - 60 bulan: Ukur <strong style={{ color: "#0F172A" }}>berdiri</strong> (Tinggi Badan / TB)</div>
          </div>
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
  const [mobileOpen, setMobileOpen] = useState(false);

  const renderPage = () => {
    switch (activePage) {
      case "dashboard": return <DashboardPage onNavigate={setActivePage} />;
      case "input":     return <InputDataPage />;
      case "grafik":    return <GrafikKmsPage />;
      case "riwayat":   return <ComingSoonPage title="Riwayat Data" />;
      case "laporan":   return <ComingSoonPage title="Laporan e-PPGBM" />;
      case "peta":      return <ComingSoonPage title="Peta Stunting" />;
      default:          return <DashboardPage onNavigate={setActivePage} />;
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

