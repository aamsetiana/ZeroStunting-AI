"use client";

import { useState } from "react";
import {
  Activity, BarChart3, ClipboardList, Home, Map, Menu, X,
  Baby, Scale, Ruler, Calendar, User, ChevronRight, AlertTriangle,
  CheckCircle, XCircle, TrendingDown, Info, Loader2, Wifi, Save
} from "lucide-react";
import {
  hitungAntropometri, simpanBalitaDanPenimbangan, getStatusBadgeClass, getStatusLabel,
  getStatusColor, zscoreToPercent, type AntropometriResult
} from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// NAV CONFIG
// ─────────────────────────────────────────────────────────────────────────────

const navItems = [
  { icon: Home,          label: "Dashboard",     id: "dashboard" },
  { icon: Baby,          label: "Input Data",    id: "input"     },
  { icon: ClipboardList, label: "Riwayat",       id: "riwayat"   },
  { icon: BarChart3,     label: "Laporan",       id: "laporan"   },
  { icon: Map,           label: "Peta Stunting", id: "peta"      },
];

// ─────────────────────────────────────────────────────────────────────────────
// SIDEBAR
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
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)",
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
        background: "#0d1526",
        borderRight: "1px solid rgba(148,163,184,0.08)",
        height: "100vh",
        position: "sticky",
        top: 0,
        zIndex: 10,
        overflowY: "auto",
        // Mobile: overlay behavior handled via inline overrides
      }}>
        {/* Logo */}
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "20px 20px 18px",
          borderBottom: "1px solid rgba(148,163,184,0.08)",
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "linear-gradient(135deg, #22C55E, #15803D)",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <Activity size={18} color="white" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#F1F5F9" }}>ZeroStunting</div>
            <div style={{ fontSize: 10, color: "#22C55E", fontWeight: 600, letterSpacing: "0.08em" }}>AI PLATFORM</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "12px 12px" }}>
          <div style={{ fontSize: 10, color: "#475569", fontWeight: 600, letterSpacing: "0.1em", padding: "8px 10px 6px", marginBottom: 2 }}>
            MENU
          </div>
          {navItems.map(({ icon: Icon, label, id }) => {
            const isActive = active === id;
            return (
              <button
                key={id}
                onClick={() => { onNav(id); onClose(); }}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  width: "100%", padding: "10px 12px",
                  borderRadius: 10, border: "none", cursor: "pointer",
                  background: isActive ? "rgba(34,197,94,0.12)" : "transparent",
                  color: isActive ? "#4ADE80" : "#94A3B8",
                  fontSize: 14, fontWeight: 500,
                  transition: "all 0.15s",
                  marginBottom: 2,
                  textAlign: "left",
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.background = "rgba(34,197,94,0.06)";
                    (e.currentTarget as HTMLElement).style.color = "#CBD5E1";
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.background = "transparent";
                    (e.currentTarget as HTMLElement).style.color = "#94A3B8";
                  }
                }}
              >
                <Icon size={16} />
                {label}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div style={{ padding: 12 }}>
          <div style={{
            background: "rgba(34,197,94,0.06)",
            border: "1px solid rgba(34,197,94,0.15)",
            borderRadius: 12, padding: "12px 14px",
          }}>
            <div style={{ fontSize: 11, color: "#22C55E", fontWeight: 600, marginBottom: 3 }}>Mode Kader Aktif</div>
            <div style={{ fontSize: 10, color: "#475569" }}>Data Anda dilindungi &amp; aman</div>
          </div>
        </div>
      </aside>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Z-SCORE GAUGE
// ─────────────────────────────────────────────────────────────────────────────

function ZScoreGauge({
  label, detail,
}: {
  label: string;
  detail: AntropometriResult["bbu"];
}) {
  const pct = zscoreToPercent(detail.zscore);

  const statusColors: Record<string, { text: string; bg: string; border: string }> = {
    normal:        { text: "#4ADE80", bg: "rgba(34,197,94,0.12)",  border: "rgba(34,197,94,0.25)"  },
    risiko_lebih:  { text: "#FCD34D", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.25)" },
    berat_lebih:   { text: "#FCD34D", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.25)" },
    gizi_kurang:   { text: "#FCD34D", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.25)" },
    pendek:        { text: "#FCD34D", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.25)" },
    kurus:         { text: "#FCD34D", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.25)" },
    gizi_buruk:    { text: "#FCA5A5", bg: "rgba(239,68,68,0.12)",  border: "rgba(239,68,68,0.25)"  },
    sangat_pendek: { text: "#FCA5A5", bg: "rgba(239,68,68,0.12)",  border: "rgba(239,68,68,0.25)"  },
    sangat_kurus:  { text: "#FCA5A5", bg: "rgba(239,68,68,0.12)",  border: "rgba(239,68,68,0.25)"  },
  };

  const sc = statusColors[detail.status] ?? statusColors.normal;
  const zColor = getStatusColor(detail.status);

  return (
    <div style={{
      background: "rgba(15,23,42,0.7)",
      border: "1px solid rgba(148,163,184,0.1)",
      borderRadius: 14, padding: "16px 18px",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <span style={{ fontSize: 11, color: "#64748B", fontWeight: 600, letterSpacing: "0.07em" }}>
          {label}
        </span>
        <span style={{
          fontSize: 11, fontWeight: 600,
          color: sc.text, background: sc.bg, border: `1px solid ${sc.border}`,
          padding: "2px 10px", borderRadius: 99,
        }}>
          {getStatusLabel(detail.status)}
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "flex-end", gap: 6, marginBottom: 12 }}>
        <span className={zColor} style={{ fontSize: 28, fontWeight: 800, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
          {detail.zscore >= 0 ? "+" : ""}{detail.zscore.toFixed(2)}
        </span>
        <span style={{ fontSize: 12, color: "#475569", marginBottom: 2 }}>SD</span>
      </div>

      {/* Gradient bar */}
      <div style={{
        height: 8, borderRadius: 4, margin: "0 4px",
        background: "linear-gradient(90deg, #EF4444 0%, #F59E0B 25%, #22C55E 50%, #F59E0B 75%, #EF4444 100%)",
        position: "relative",
      }}>
        <div style={{
          width: 14, height: 14, borderRadius: "50%",
          background: "white", border: "2.5px solid #0F172A",
          position: "absolute", top: "50%",
          left: `calc(${pct}% - 7px)`,
          transform: "translateY(-50%)",
          boxShadow: "0 0 0 3px rgba(255,255,255,0.2)",
          transition: "left 0.6s cubic-bezier(0.34,1.56,0.64,1)",
        }} />
      </div>

      {/* Axis */}
      <div style={{
        display: "flex", justifyContent: "space-between",
        fontSize: 10, color: "#334155", marginTop: 6, marginBottom: 10,
      }}>
        {["-4","-3","-2","0","+2","+3","+4"].map(v => <span key={v}>{v}</span>)}
      </div>

      <div style={{ display: "flex", gap: 16, fontSize: 11, color: "#475569" }}>
        <span>Aktual: <strong style={{ color: "#94A3B8" }}>{detail.nilai_actual}</strong></span>
        <span>Median: <strong style={{ color: "#94A3B8" }}>{detail.median_referensi}</strong></span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RESULT PANEL
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
  const hasRisk = result.ada_risiko_stunting || result.ada_risiko_wasting || result.ada_risiko_underweight;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }} className="slide-up">
      {/* Banner */}
      <div style={{
        borderRadius: 16, padding: "16px 18px",
        background: hasRisk ? "rgba(127,29,29,0.3)" : "rgba(20,83,45,0.3)",
        border: `1px solid ${hasRisk ? "rgba(239,68,68,0.2)" : "rgba(34,197,94,0.2)"}`,
        display: "flex", gap: 12,
      }}>
        {hasRisk
          ? <XCircle size={18} color="#F87171" style={{ flexShrink: 0, marginTop: 2 }} />
          : <CheckCircle size={18} color="#4ADE80" style={{ flexShrink: 0, marginTop: 2 }} />
        }
        <div>
          <div style={{ fontWeight: 600, fontSize: 14, color: hasRisk ? "#FCA5A5" : "#86EFAC", marginBottom: 6 }}>
            {hasRisk ? "Terdeteksi Risiko Gizi!" : "Status Gizi Baik ✓"}
          </div>
          {result.pesan_peringatan.map((msg, i) => (
            <div key={i} style={{ fontSize: 12, color: "#CBD5E1", lineHeight: 1.6, marginBottom: i < result.pesan_peringatan.length - 1 ? 4 : 0 }}>
              {msg}
            </div>
          ))}
        </div>
      </div>

      {/* Risk flags */}
      {hasRisk && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {result.ada_risiko_stunting && (
            <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, color: "#FCA5A5", background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 99, padding: "4px 12px" }}>
              <TrendingDown size={12} /> Risiko Stunting
            </span>
          )}
          {result.ada_risiko_wasting && (
            <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, color: "#FCD34D", background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: 99, padding: "4px 12px" }}>
              <AlertTriangle size={12} /> Risiko Wasting
            </span>
          )}
          {result.ada_risiko_underweight && (
            <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, color: "#FCA5A5", background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 99, padding: "4px 12px" }}>
              <AlertTriangle size={12} /> Underweight
            </span>
          )}
        </div>
      )}

      {/* Gauges */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <ZScoreGauge label="BB/U — Berat Badan / Umur" detail={result.bbu} />
        <ZScoreGauge label="PB/U — Panjang Badan / Umur  (Stunting)" detail={result.pbu} />
        <ZScoreGauge label="BB/PB — Berat / Panjang Badan  (Wasting)" detail={result.bbpb} />
      </div>

      {result.peringatan_data.length > 0 && (
        <div style={{
          borderRadius: 12, padding: "12px 14px",
          background: "rgba(120,53,15,0.25)", border: "1px solid rgba(245,158,11,0.2)",
          display: "flex", gap: 10,
        }}>
          <Info size={15} color="#FBBF24" style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#FCD34D", marginBottom: 4 }}>Periksa Kembali Data:</div>
            {result.peringatan_data.map((w, i) => (
              <div key={i} style={{ fontSize: 11, color: "#94A3B8" }}>{w}</div>
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
            padding: "12px 18px",
            borderRadius: 12,
            border: saveSuccess ? "1px solid rgba(34,197,94,0.4)" : "1px solid rgba(59,130,246,0.3)",
            background: saveSuccess
              ? "rgba(34,197,94,0.15)"
              : "linear-gradient(135deg, #2563EB, #1D4ED8)",
            color: "#FFFFFF",
            fontSize: 13,
            fontWeight: 700,
            cursor: saving || saveSuccess ? "default" : "pointer",
            transition: "all 0.2s",
            boxShadow: saveSuccess ? "none" : "0 4px 14px rgba(37,99,235,0.3)",
          }}
        >
          {saving ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Menyimpan ke Supabase...</span>
            </>
          ) : saveSuccess ? (
            <>
              <CheckCircle size={16} color="#4ADE80" />
              <span>Data Tersimpan di Posyandu Melati 01</span>
            </>
          ) : (
            <>
              <Save size={16} />
              <span>Simpan ke Database Posyandu</span>
            </>
          )}
        </button>
      )}

      <div style={{ fontSize: 10, color: "#334155", textAlign: "center" }}>
        WHO Child Growth Standards 2006 • Metode LMS Box-Cox
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// INPUT FORM PAGE
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
      // Hitung tanggal lahir estimasi jika tidak diinput
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

  // reusable label style
  const labelStyle: React.CSSProperties = {
    display: "flex", alignItems: "center", gap: 6,
    fontSize: 12, color: "#64748B", fontWeight: 600, marginBottom: 6,
  };

  return (
    <div style={{ maxWidth: 960, margin: "0 auto" }}>
      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
        <span style={{ fontSize: 11, color: "#475569" }}>Dashboard</span>
        <ChevronRight size={12} color="#334155" />
        <span style={{ fontSize: 11, color: "#22C55E", fontWeight: 600 }}>Input Data</span>
      </div>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: "#F1F5F9", marginBottom: 4 }}>Input Data Antropometri</h1>
      <p style={{ fontSize: 13, color: "#64748B", marginBottom: 24 }}>
        Masukkan data pengukuran balita untuk menghitung Z-score status gizi
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* ── FORM ── */}
        <div style={{
          background: "rgba(15,23,42,0.7)", border: "1px solid rgba(148,163,184,0.1)",
          borderRadius: 18, padding: 24,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(34,197,94,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Baby size={16} color="#22C55E" />
            </div>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#E2E8F0" }}>Data Balita</span>
            <span style={{ marginLeft: "auto", fontSize: 10, color: "#22C55E", fontWeight: 600, background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 99, padding: "2px 10px" }}>
              Form Manual
            </span>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Nama */}
            <div>
              <label style={labelStyle}><User size={12} /> Nama Anak <span style={{ color: "#334155", fontWeight: 400, marginLeft: "auto" }}>opsional</span></label>
              <input type="text" className="input-field" placeholder="cth: Budi Santoso"
                value={form.nama_anak} onChange={e => setForm(p => ({ ...p, nama_anak: e.target.value }))} />
            </div>

            {/* Umur */}
            <div>
              <label style={labelStyle}><Calendar size={12} /> Umur <span style={{ color: "#22C55E", fontWeight: 600, marginLeft: "auto", fontSize: 11 }}>0 – 60 bulan</span></label>
              <div style={{ position: "relative" }}>
                <input type="number" min={0} max={60} step={1} required className="input-field" placeholder="24"
                  style={{ paddingRight: 52 }}
                  value={form.umur_bulan} onChange={e => setForm(p => ({ ...p, umur_bulan: e.target.value }))} />
                <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "#475569" }}>bulan</span>
              </div>
            </div>

            {/* Berat */}
            <div>
              <label style={labelStyle}><Scale size={12} /> Berat Badan</label>
              <div style={{ position: "relative" }}>
                <input type="number" min={0.5} max={35} step={0.1} required className="input-field" placeholder="12.5"
                  style={{ paddingRight: 36 }}
                  value={form.berat_kg} onChange={e => setForm(p => ({ ...p, berat_kg: e.target.value }))} />
                <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "#475569" }}>kg</span>
              </div>
            </div>

            {/* Tinggi */}
            <div>
              <label style={labelStyle}>
                <Ruler size={12} /> Panjang / Tinggi Badan
                <span style={{ marginLeft: "auto", fontSize: 10, color: "#475569", fontWeight: 400 }}>
                  {parseInt(form.umur_bulan || "0") < 24 ? "telentang (PB)" : "berdiri (TB)"}
                </span>
              </label>
              <div style={{ position: "relative" }}>
                <input type="number" min={40} max={130} step={0.1} required className="input-field" placeholder="87.0"
                  style={{ paddingRight: 36 }}
                  value={form.tinggi_cm} onChange={e => setForm(p => ({ ...p, tinggi_cm: e.target.value }))} />
                <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "#475569" }}>cm</span>
              </div>
            </div>

            {/* Jenis Kelamin */}
            <div>
              <label style={{ ...labelStyle, marginBottom: 8 }}>Jenis Kelamin</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {(["L", "P"] as const).map(jk => (
                  <button key={jk} type="button"
                    onClick={() => setForm(p => ({ ...p, jenis_kelamin: jk }))}
                    style={{
                      padding: "10px 0", borderRadius: 12, border: "1px solid",
                      borderColor: form.jenis_kelamin === jk ? "rgba(34,197,94,0.5)" : "rgba(148,163,184,0.12)",
                      background: form.jenis_kelamin === jk ? "rgba(34,197,94,0.1)" : "transparent",
                      color: form.jenis_kelamin === jk ? "#4ADE80" : "#64748B",
                      fontSize: 13, fontWeight: 600, cursor: "pointer",
                      transition: "all 0.15s",
                    }}>
                    {jk === "L" ? "♂ Laki-laki" : "♀ Perempuan"}
                  </button>
                ))}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                display: "flex", gap: 8, padding: "10px 12px", borderRadius: 10,
                background: "rgba(127,29,29,0.3)", border: "1px solid rgba(239,68,68,0.2)",
              }}>
                <XCircle size={15} color="#F87171" style={{ flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontSize: 12, color: "#FCA5A5" }}>{error}</span>
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary"
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 14, marginTop: 4 }}>
              {loading
                ? <><Loader2 size={16} className="animate-spin" /> Menghitung Z-Score...</>
                : <><Activity size={16} /> Hitung Z-Score Sekarang</>
              }
            </button>
          </form>
        </div>

        {/* ── RESULT ── */}
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
              background: "rgba(15,23,42,0.5)", border: "1px solid rgba(148,163,184,0.08)",
              borderRadius: 18, padding: 40,
              display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center",
              height: "100%", justifyContent: "center",
            }}>
              <div style={{ width: 64, height: 64, borderRadius: 18, background: "rgba(34,197,94,0.07)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                <Activity size={30} color="rgba(34,197,94,0.35)" />
              </div>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#475569", marginBottom: 6 }}>Hasil Z-Score akan tampil di sini</p>
              <p style={{ fontSize: 12, color: "#334155", maxWidth: 200, lineHeight: 1.6 }}>
                Isi formulir di sebelah kiri, lalu klik &ldquo;Hitung Z-Score Sekarang&rdquo;
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginTop: 24, width: "100%" }}>
                {["BB/U", "PB/U", "BB/PB"].map(ind => (
                  <div key={ind} style={{
                    borderRadius: 12, background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.04)", padding: "12px 0", textAlign: "center",
                  }}>
                    <p style={{ fontSize: 10, color: "#334155", marginBottom: 4 }}>{ind}</p>
                    <p style={{ fontSize: 20, fontWeight: 700, color: "#1E293B" }}>—</p>
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
// DASHBOARD PAGE
// ─────────────────────────────────────────────────────────────────────────────

function DashboardPage({ onNavigate }: { onNavigate: (id: string) => void }) {
  const stats = [
    { label: "Total Balita",  value: "248",    sub: "+12 bulan ini",   icon: Baby,          c1: "#60A5FA", c2: "rgba(96,165,250,0.12)"  },
    { label: "Stunting",      value: "18.5%",  sub: "46 balita",       icon: TrendingDown,  c1: "#F87171", c2: "rgba(248,113,113,0.12)" },
    { label: "Gizi Buruk",    value: "3",      sub: "Perlu rujukan",   icon: AlertTriangle, c1: "#FBBF24", c2: "rgba(251,191,36,0.12)"  },
    { label: "Normal",        value: "81.5%",  sub: "202 balita",      icon: CheckCircle,   c1: "#4ADE80", c2: "rgba(74,222,128,0.12)"  },
  ];

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", display: "flex", flexDirection: "column", gap: 22 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#F1F5F9", marginBottom: 4 }}>Dashboard Posyandu</h1>
        <p style={{ fontSize: 13, color: "#64748B" }}>
          Selamat datang, Kader! Pantau status gizi balita di wilayah Anda.
        </p>
      </div>

      {/* Stats grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
        {stats.map(({ label, value, sub, icon: Icon, c1, c2 }) => (
          <div key={label} style={{
            background: "rgba(15,23,42,0.8)", border: "1px solid rgba(148,163,184,0.08)",
            borderRadius: 16, padding: 20, position: "relative", overflow: "hidden",
          }}>
            {/* Top accent line */}
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${c1}, transparent)` }} />
            <div style={{ width: 34, height: 34, borderRadius: 10, background: c2, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
              <Icon size={17} color={c1} />
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: "#F1F5F9", marginBottom: 2 }}>{value}</div>
            <div style={{ fontSize: 12, color: "#64748B", fontWeight: 600 }}>{label}</div>
            <div style={{ fontSize: 10, color: "#334155", marginTop: 4 }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Quick action */}
      <div style={{
        background: "rgba(15,23,42,0.8)", border: "1px solid rgba(34,197,94,0.15)",
        borderRadius: 18, padding: "22px 26px",
        boxShadow: "0 0 40px rgba(34,197,94,0.08)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#F1F5F9", marginBottom: 5 }}>Input Data Balita Baru</div>
          <div style={{ fontSize: 13, color: "#64748B" }}>Ukur dan catat data antropometri menggunakan standar WHO 2006</div>
        </div>
        <button
          onClick={() => onNavigate("input")}
          className="btn-primary"
          style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, whiteSpace: "nowrap", marginLeft: 24 }}>
          <Baby size={15} /> Mulai Input
        </button>
      </div>

      {/* Info cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div style={{ background: "rgba(15,23,42,0.7)", border: "1px solid rgba(148,163,184,0.08)", borderRadius: 16, padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#E2E8F0", marginBottom: 14 }}>Cara Membaca Z-Score</div>
          {[
            { range: "< −3 SD",      label: "Sangat Pendek / Gizi Buruk", color: "#FCA5A5", bg: "rgba(239,68,68,0.1)" },
            { range: "−3 s/d −2 SD", label: "Pendek / Gizi Kurang",       color: "#FCD34D", bg: "rgba(245,158,11,0.1)" },
            { range: "−2 s/d +2 SD", label: "Normal",                      color: "#4ADE80", bg: "rgba(34,197,94,0.1)" },
            { range: "> +2 SD",      label: "Risiko Lebih",                 color: "#FCD34D", bg: "rgba(245,158,11,0.1)" },
          ].map(({ range, label, color, bg }) => (
            <div key={range} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 11, color: "#475569", fontFamily: "monospace" }}>{range}</span>
              <span style={{ fontSize: 10, fontWeight: 600, color, background: bg, borderRadius: 99, padding: "2px 10px" }}>{label}</span>
            </div>
          ))}
        </div>

        <div style={{ background: "rgba(15,23,42,0.7)", border: "1px solid rgba(148,163,184,0.08)", borderRadius: 16, padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#E2E8F0", marginBottom: 14 }}>Panduan Input Data</div>
          {[
            { ind: "BB/U",  desc: "Berat badan / umur → deteksi underweight" },
            { ind: "PB/U",  desc: "Panjang badan / umur → deteksi stunting" },
            { ind: "BB/PB", desc: "Berat / panjang → deteksi wasting" },
          ].map(({ ind, desc }) => (
            <div key={ind} style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#22C55E", flexShrink: 0, width: 40 }}>{ind}</span>
              <span style={{ fontSize: 11, color: "#64748B" }}>{desc}</span>
            </div>
          ))}
          <div style={{ borderTop: "1px solid rgba(148,163,184,0.08)", marginTop: 10, paddingTop: 10 }}>
            <div style={{ fontSize: 11, color: "#475569" }}>0–23 bln: ukur <strong style={{ color: "#94A3B8" }}>telentang</strong> (panjang)</div>
            <div style={{ fontSize: 11, color: "#475569", marginTop: 3 }}>24–60 bln: ukur <strong style={{ color: "#94A3B8" }}>berdiri</strong> (tinggi)</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMING SOON
// ─────────────────────────────────────────────────────────────────────────────

function ComingSoonPage({ title }: { title: string }) {
  return (
    <div style={{ maxWidth: 960, margin: "0 auto" }}>
      <div style={{
        background: "rgba(15,23,42,0.7)", border: "1px solid rgba(148,163,184,0.08)",
        borderRadius: 20, padding: "80px 40px", textAlign: "center",
      }}>
        <div style={{ width: 64, height: 64, borderRadius: 18, background: "rgba(34,197,94,0.07)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}>
          <Activity size={28} color="rgba(34,197,94,0.3)" />
        </div>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "#E2E8F0", marginBottom: 8 }}>{title}</h1>
        <p style={{ fontSize: 13, color: "#475569", marginBottom: 4 }}>Fitur ini sedang dalam pengembangan 🚧</p>
        <p style={{ fontSize: 11, color: "#334155" }}>Coming soon dalam Fase 2</p>
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
      case "riwayat":   return <ComingSoonPage title="Riwayat Data" />;
      case "laporan":   return <ComingSoonPage title="Laporan e-PPGBM" />;
      case "peta":      return <ComingSoonPage title="Peta Stunting" />;
      default:          return <DashboardPage onNavigate={setActivePage} />;
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", fontFamily: "'Inter', sans-serif" }}>
      {/* Sidebar — always visible on desktop */}
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
          padding: "0 24px", height: 58,
          borderBottom: "1px solid rgba(148,163,184,0.07)",
          background: "rgba(13,21,38,0.9)",
          backdropFilter: "blur(8px)",
          flexShrink: 0,
        }}>
          <button
            onClick={() => setMobileOpen(true)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#64748B", padding: 4, display: "none" }}
          >
            <Menu size={20} />
          </button>

          <div style={{ flex: 1 }} />

          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Wifi size={12} color="#22C55E" />
            <span style={{ fontSize: 12, color: "#475569" }}>WHO Engine Online</span>
          </div>

          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            background: "linear-gradient(135deg, #22C55E, #15803D)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <User size={15} color="white" />
          </div>
        </header>

        {/* Content */}
        <main style={{ flex: 1, overflowY: "auto", padding: 24 }} className="fade-in">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}
