"use client";

import { useState, useEffect, useMemo, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Activity, BarChart3, ClipboardList, Home, Map, Menu,
  Baby, Scale, Ruler, Calendar, User, ChevronRight, AlertTriangle,
  CheckCircle, XCircle, TrendingDown, Info, Loader2, Save,
  TrendingUp, Sparkles, HeartHandshake, MapPin, CalendarDays,
  Users, Target, ArrowUpRight, CheckCircle2, Layers, Search,
  Sliders, Eye, RefreshCw, FileText, Stethoscope, Utensils, Check,
  FileImage, Keyboard, X, DownloadCloud, LogIn, LogOut,
  Building2, RotateCcw, MessageCircle,
} from "lucide-react";
import {
  hitungAntropometri, simpanBalitaDanPenimbangan, getBalitaFullList, getPosyanduList,
  getStatusBadgeClass, getStatusLabel, getStatusColor, zscoreToPercent,
  getStoredActivePosyanduId, setStoredActivePosyanduId,
  type AntropometriResult, type PosyanduItem
} from "@/lib/utils";
import { GrowthChart } from "@/components/charts/GrowthChart";
import { calculateZScoreWHO, classifyAntropometriWHO } from "@/lib/who-data";
import { ManualForm } from "@/components/input/ManualForm";
import { OcrUpload, type OcrExtractedData } from "@/components/input/OcrUpload";
import { AdvisoryCard } from "@/components/advisory/AdvisoryCard";
import { RiwayatData, INITIAL_BALITA, type BalitaItem, type PenimbanganRecord } from "@/components/balita/RiwayatData";
import { KartuTimbangModal } from "@/components/balita/KartuTimbangModal";
import { SearchableBalitaSelect } from "@/components/balita/SearchableBalitaSelect";
import { LaporanEppgbm } from "@/components/laporan/LaporanEppgbm";
import { PetaStunting } from "@/components/peta/PetaStunting";
import { DashboardOverview } from "@/components/dashboard/DashboardOverview";
import { KelolaPosyandu } from "@/components/posyandu/KelolaPosyandu";
import { PuskesmasDashboard } from "@/components/puskesmas/PuskesmasDashboard";
import { useAuth, type AuthUser } from "@/lib/auth";
import { useToast } from "@/components/ui/Toast";
import type { BalitaFormData } from "@/lib/validations";

// ─────────────────────────────────────────────────────────────────────────────
// NAV CONFIG
// ─────────────────────────────────────────────────────────────────────────────

// Nav items for Kader Posyandu (operasional penimbangan lapangan)
const navItems = [
  { icon: Home,          label: "Dashboard",       id: "dashboard" },
  { icon: Baby,          label: "Input Data",      id: "input"     },
  { icon: TrendingUp,    label: "Grafik KMS",      id: "grafik"    },
  { icon: ClipboardList, label: "Riwayat",         id: "riwayat"   },
  { icon: BarChart3,     label: "Laporan",         id: "laporan"   },
  { icon: Map,           label: "Peta Stunting",   id: "peta"      },
];

// Nav items for Puskesmas Supervisor (pengawasan, pelaporan & pengelolaan multi-posyandu)
const navItemsPuskesmas = [
  { icon: Home,          label: "Pantau Multi-Posyandu", id: "dashboard" },
  { icon: ClipboardList, label: "Riwayat Balita",        id: "riwayat"   },
  { icon: BarChart3,     label: "Laporan Gabungan",      id: "laporan"   },
  { icon: Map,           label: "Peta Stunting",         id: "peta"      },
  { icon: Building2,     label: "Kelola Posyandu",       id: "posyandu"  },
];

// ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
// SIDEBAR (Warm, Clean, Approachable)
// ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ

function Sidebar({
  active,
  onNav,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onClose,
  user,
  activePosyanduName,
  onLogout,
  isPuskesmas,
}: {
  active: string;
  onNav: (id: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onClose: () => void;
  user?: AuthUser | null;
  activePosyanduName?: string;
  onLogout?: () => void;
  isPuskesmas?: boolean;
}) {
  // Choose nav list based on role
  const currentNavItems = isPuskesmas ? navItemsPuskesmas : navItems;
  return (
    <>
      {/* ÔöÇÔöÇ MOBILE DRAWER BACKDROP ÔöÇÔöÇ */}
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

      {/* ÔöÇÔöÇ MOBILE OFF-CANVAS DRAWER ÔöÇÔöÇ */}
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
              width: 38, height: 38, borderRadius: 10,
              background: "#FFFFFF",
              border: "1px solid #E2E8F0",
              display: "flex", alignItems: "center", justifyContent: "center",
              overflow: "hidden", padding: 2,
              boxShadow: "0 2px 5px rgba(0, 0, 0, 0.06)",
            }}>
              <img src="/ananta_baru_fix.png" alt="Logo Ananta" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.01em" }}>Ananta</div>
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
          {currentNavItems.map(({ icon: Icon, label, id }) => {
            const isActive = active === id;
            const activeBg = isPuskesmas ? "#DBEAFE" : "#DCFCE7";
            const activeBorder = isPuskesmas ? "#BFDBFE" : "#BBF7D0";
            const activeColor = isPuskesmas ? "#1E40AF" : "#15803D";
            return (
              <button
                key={id}
                onClick={() => { onNav(id); onClose(); }}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  width: "100%", padding: "12px 14px",
                  borderRadius: 12,
                  border: isActive ? `1px solid ${activeBorder}` : "1px solid transparent",
                  cursor: "pointer",
                  background: isActive ? activeBg : "transparent",
                  color: isActive ? activeColor : "#334155",
                  fontSize: 15, fontWeight: isActive ? 700 : 600,
                  marginBottom: 4,
                  textAlign: "left",
                }}
              >
                <Icon size={20} color={isActive ? activeColor : "#64748B"} />
                {label}
              </button>
            );
          })}
        </nav>

        {/* Drawer Footer Akun Kader */}
        <div style={{ padding: "14px 16px", borderTop: "1px solid #F1F5F9" }} suppressHydrationWarning>
          {user ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: "50%",
                  background: isPuskesmas
                    ? "linear-gradient(135deg, #2563EB, #1E40AF)"
                    : "linear-gradient(135deg, #16A34A, #15803D)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#FFFFFF", fontWeight: 700, fontSize: 13,
                }}>
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>{user.name}</div>
                  <div style={{ fontSize: 11, color: isPuskesmas ? "#2563EB" : "#16A34A", fontWeight: 600 }}>
                    {user.posyandu}
                  </div>
                </div>
              </div>
              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  title="Keluar Akun"
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    color: "#94A3B8", padding: 6,
                  }}
                >
                  <LogOut size={16} />
                </button>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              onClick={onClose}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                padding: "10px 14px", borderRadius: 10,
                background: "#16A34A", color: "#FFFFFF", fontSize: 13, fontWeight: 700,
                textDecoration: "none",
              }}
            >
              <LogIn size={15} /> Masuk Akun Kader
            </Link>
          )}
        </div>
      </aside>

      {/* ÔöÇÔöÇ DESKTOP SIDEBAR (Collapsible: 240px <-> 68px) ÔöÇÔöÇ */}
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
              background: "#FFFFFF",
              border: "1px solid #E2E8F0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              overflow: "hidden",
              padding: 2,
              boxShadow: "0 2px 6px rgba(0, 0, 0, 0.06)",
            }}>
              <img src="/ananta_baru_fix.png" alt="Logo Ananta" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
            </div>

            {!collapsed && (
              <div style={{ overflow: "hidden", textAlign: "left" }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.01em", whiteSpace: "nowrap" }}>
                  Ananta
                </div>
                <div style={{
                  fontSize: 10,
                  color: isPuskesmas ? "#2563EB" : "#16A34A",
                  fontWeight: 700,
                  letterSpacing: "0.05em",
                  whiteSpace: "nowrap"
                }}>
                  {isPuskesmas ? "SUPERVISOR PUSKESMAS" : "KADER POSYANDU"}
                </div>
              </div>
            )}
          </button>
        </div>

        {/* Nav Items */}
        <nav style={{ flex: 1, padding: collapsed ? "10px 8px" : "14px 10px", overflowY: "auto" }}>
          {!collapsed && (
            <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 700, letterSpacing: "0.06em", padding: "4px 8px", marginBottom: 6 }}>
              {isPuskesmas ? "MENU PENGAWASAN" : "MENU"}
            </div>
          )}

          {currentNavItems.map(({ icon: Icon, label, id }) => {
            const isActive = active === id;
            const activeBg = isPuskesmas ? "#EFF6FF" : "#DCFCE7";
            const activeBorder = isPuskesmas ? "#BFDBFE" : "#BBF7D0";
            const activeColor = isPuskesmas ? "#1D4ED8" : "#15803D";
            const iconActiveColor = isPuskesmas ? "#2563EB" : "#15803D";

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
                  border: isActive ? `1px solid ${activeBorder}` : "1px solid transparent",
                  cursor: "pointer",
                  background: isActive ? activeBg : "transparent",
                  color: isActive ? activeColor : "#475569",
                  fontSize: 14,
                  fontWeight: isActive ? 700 : 600,
                  transition: "all 0.15s ease",
                  marginBottom: 4,
                  textAlign: "left",
                }}
              >
                <Icon size={19} color={isActive ? iconActiveColor : "#64748B"} />
                {!collapsed && <span style={{ whiteSpace: "nowrap" }}>{label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Footer info box (only when expanded) */}
        {!collapsed && (
          <div style={{ padding: 12 }}>
            <div style={{
              background: isPuskesmas ? "#EFF6FF" : "#F0FDF4",
              border: `1px solid ${isPuskesmas ? "#BFDBFE" : "#DCFCE7"}`,
              borderRadius: 12, padding: "10px 12px",
              display: "flex", alignItems: "center", gap: 8,
            }}>
              {isPuskesmas ? (
                <Building2 size={16} color="#2563EB" style={{ flexShrink: 0 }} />
              ) : (
                <HeartHandshake size={16} color="#16A34A" style={{ flexShrink: 0 }} />
              )}
              <div style={{
                fontSize: 11,
                color: isPuskesmas ? "#1E40AF" : "#15803D",
                fontWeight: 700,
                lineHeight: 1.3
              }}>
                {isPuskesmas ? (user?.posyandu || "Puskesmas Ciwaru") : (activePosyanduName || user?.posyandu || "Posyandu Desa")}
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}

// ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
// Z-SCORE GAUGE (Light, Accessible, High Contrast)
// ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ

function ZScoreGauge({
  label, detail,
}: {
  label: string;
  detail: AntropometriResult["bbu"];
}) {
  const pct = zscoreToPercent(detail.zscore);

  const statusColors: Record<string, { text: string; bg: string; border: string }> = {
    normal:            { text: "#15803D", bg: "#DCFCE7", border: "#BBF7D0" },
    risiko_lebih:      { text: "#B45309", bg: "#FEF3C7", border: "#FDE68A" },
    berat_lebih:       { text: "#B45309", bg: "#FEF3C7", border: "#FDE68A" },
    gizi_kurang:       { text: "#B45309", bg: "#FEF3C7", border: "#FDE68A" },
    pendek:            { text: "#B45309", bg: "#FEF3C7", border: "#FDE68A" },
    kurus:             { text: "#B45309", bg: "#FEF3C7", border: "#FDE68A" },
    gizi_buruk:        { text: "#B91C1C", bg: "#FEE2E2", border: "#FECACA" },
    sangat_pendek:     { text: "#B91C1C", bg: "#FEE2E2", border: "#FECACA" },
    sangat_kurus:      { text: "#B91C1C", bg: "#FEE2E2", border: "#FECACA" },
    makrosefali:       { text: "#B45309", bg: "#FEF3C7", border: "#FDE68A" },
    mikrosefali:       { text: "#B45309", bg: "#FEF3C7", border: "#FDE68A" },
    mikrosefali_berat: { text: "#B91C1C", bg: "#FEE2E2", border: "#FECACA" },
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

// ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
// RESULT PANEL (Hanya Indikator Z-Score & Tombol Simpan)
// ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ

function ResultPanel({
  result,
  onSave,
  saving = false,
  saveSuccess = false,
  onBukaRiwayat,
  onInputBaru,
  onBukaKartu,
}: {
  result: AntropometriResult;
  onSave?: () => void;
  saving?: boolean;
  saveSuccess?: boolean;
  onBukaRiwayat?: () => void;
  onInputBaru?: () => void;
  onBukaKartu?: () => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }} className="slide-up">
      {/* Indikator Z-Score Standar WHO */}
      <ZScoreGauge label="BB/U : Berat Badan / Umur" detail={result.bbu} />
      <ZScoreGauge label="PB/U : Panjang Badan / Umur (Stunting)" detail={result.pbu} />
      <ZScoreGauge label="BB/PB : Berat / Panjang Badan (Wasting)" detail={result.bbpb} />
      {result.lku && (
        <ZScoreGauge label="LK/U : Lingkar Kepala / Umur (WHO HCFA)" detail={result.lku} />
      )}
      {result.lila && (
        <ZScoreGauge label="LiLA : Lingkar Lengan Atas (WHO & Kemenkes)" detail={result.lila} />
      )}

      {/* Tombol Buat Kartu Timbang Digital & WA Ibu */}
      {onBukaKartu && (
        <button
          type="button"
          onClick={onBukaKartu}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            padding: "10px 16px",
            borderRadius: 12,
            border: "1.5px solid #86EFAC",
            background: "#F0FDF4",
            color: "#166534",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            transition: "all 0.15s ease",
            boxShadow: "0 2px 4px rgba(22, 163, 74, 0.08)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#DCFCE7";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#F0FDF4";
          }}
        >
          <MessageCircle size={16} color="#16A34A" />
          <span>Kartu Timbang & WA Orang Tua</span>
        </button>
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

      {saveSuccess && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
          {onInputBaru && (
            <button
              type="button"
              onClick={onInputBaru}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                padding: "9px 14px",
                borderRadius: 10,
                background: "#F0FDF4",
                border: "1.5px solid #86EFAC",
                color: "#15803D",
                fontSize: 12.5,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              <RotateCcw size={14} /> Input Balita Baru
            </button>
          )}

          {onBukaRiwayat && (
            <button
              type="button"
              onClick={onBukaRiwayat}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                padding: "9px 14px",
                borderRadius: 10,
                background: "#FFFFFF",
                border: "1.5px solid #BBF7D0",
                color: "#15803D",
                fontSize: 12.5,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              <ClipboardList size={14} /> Lihat di Halaman Riwayat Balita →
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
// INPUT FORM PAGE (Clean, Warm, Validasi Langsung)
// ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ

function InputDataPage({
  activePosyandu,
  balitaList = [],
  allBalitaList = [],
  onSaved,
  onBukaRiwayat,
}: {
  activePosyandu?: PosyanduItem | null;
  balitaList?: BalitaItem[];
  allBalitaList?: BalitaItem[];
  onSaved?: () => void;
  onBukaRiwayat?: () => void;
}) {
  const toast = useToast();
  const [activeMode, setActiveMode] = useState<"form" | "ocr">("form");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AntropometriResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [lastSubmitted, setLastSubmitted] = useState<BalitaFormData | null>(null);
  const [savedChildName, setSavedChildName] = useState<string | null>(null);
  const [formResetKey, setFormResetKey] = useState(0);
  // Prefill dari OCR -> form manual
  const [ocrPrefill, setOcrPrefill] = useState<Partial<BalitaFormData> | null>(null);
  // State Kartu Timbang & WA Orang Tua
  const [lastSavedBalita, setLastSavedBalita] = useState<BalitaItem | null>(null);
  const [kartuModalBalita, setKartuModalBalita] = useState<BalitaItem | null>(null);

  // Buat objek balita untuk pratinjau Kartu Timbang langsung saat hasil kalkulasi siap
  const currentBalitaForSlip: BalitaItem | null = useMemo(() => {
    if (!lastSubmitted || !result) return null;
    const existing = allBalitaList.find((b) => b.id === lastSubmitted.balita_id);
    const now = new Date();
    const months = lastSubmitted.umur_bulan;
    const estDate = new Date(now.getFullYear(), now.getMonth() - months, 15);
    const tanggalLahirStr = existing?.tanggalLahir || estDate.toISOString().split("T")[0];
    const todayStr = lastSubmitted.tanggal_timbang || now.toISOString().split("T")[0];

    const isStunting = result.pbu?.status === "stunting" || result.bbpb?.status === "gizi_buruk";
    const isWaspada = result.pbu?.status === "perawakan_pendek" || result.bbpb?.status === "gizi_kurang" || result.bbu?.status === "berat_badan_kurang";

    const newRecord: PenimbanganRecord = {
      tanggal: todayStr,
      umurBulan: lastSubmitted.umur_bulan,
      beratKg: lastSubmitted.berat_kg,
      tinggiCm: lastSubmitted.tinggi_cm,
      lingkarKepalaCm: lastSubmitted.lingkar_kepala_cm,
      lingkarLenganCm: lastSubmitted.lingkar_lengan_cm,
      statusBbu: result.bbu?.status === "berat_badan_kurang" ? "kurang" : result.bbu?.status === "berat_badan_sangat_kurang" ? "buruk" : "normal",
      statusPbu: result.pbu?.status === "stunting" ? "sangat_pendek" : result.pbu?.status === "perawakan_pendek" ? "pendek" : "normal",
      statusBbpb: result.bbpb?.status === "gizi_buruk" ? "sangat_kurus" : result.bbpb?.status === "gizi_kurang" ? "kurus" : "normal",
      statusTumbuh: "N",
      catatan: lastSubmitted.catatan_kader || undefined,
    };

    const combinedRiwayat = existing
      ? [newRecord, ...existing.riwayat.filter(r => r.tanggal !== todayStr)]
      : [newRecord];

    return {
      id: existing?.id || "active-" + Date.now(),
      posyanduId: activePosyandu?.id || existing?.posyanduId,
      nama: lastSubmitted.nama_anak.trim() || existing?.nama || "Ananda",
      nik: existing?.nik,
      jenisKelamin: lastSubmitted.jenis_kelamin,
      tanggalLahir: tanggalLahirStr,
      umurBulan: lastSubmitted.umur_bulan,
      namaIbu: lastSubmitted.nama_ibu || existing?.namaIbu || "Ibu Balita",
      dusun: lastSubmitted.dusun_rt || existing?.dusun || "-",
      terakhirTimbang: todayStr,
      beratTerakhir: lastSubmitted.berat_kg,
      tinggiTerakhir: lastSubmitted.tinggi_cm,
      lingkarKepalaTerakhir: lastSubmitted.lingkar_kepala_cm,
      lingkarLenganTerakhir: lastSubmitted.lingkar_lengan_cm,
      statusGizi: isStunting ? "rujukan" : isWaspada ? "waspada" : "normal",
      labelStatus: result.pbu?.status === "stunting"
        ? "Stunting (Sangat Pendek)"
        : result.bbpb?.status === "gizi_buruk"
        ? "Gizi Buruk"
        : result.pbu?.status === "perawakan_pendek"
        ? "Perawakan Pendek"
        : "Gizi Baik (Normal)",
      riwayat: combinedRiwayat,
    };
  }, [lastSubmitted, result, activePosyandu, allBalitaList]);

  // Auto-dismiss notifikasi sukses setelah 4.5 detik
  useEffect(() => {
    if (saveSuccess) {
      const timer = setTimeout(() => {
        setSaveSuccess(false);
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [saveSuccess]);

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
        lingkar_kepala_cm: data.lingkar_kepala_cm,
        lingkar_lengan_cm: data.lingkar_lengan_cm,
      });
      setResult(res);
      toast.info("Perhitungan Z-Score WHO selesai dievaluasi.", 2500);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setError(errMsg);
      toast.error(errMsg);
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
      const existing = allBalitaList.find((b) => b.id === lastSubmitted.balita_id);
      const estDate = new Date(now.getFullYear(), now.getMonth() - months, 15);
      const tanggalLahirStr = existing?.tanggalLahir || estDate.toISOString().split("T")[0];
      const todayStr = lastSubmitted.tanggal_timbang || now.toISOString().split("T")[0];

      await simpanBalitaDanPenimbangan({
        balita_id: lastSubmitted.balita_id,
        balita: {
          posyandu_id: activePosyandu?.id,
          nama: lastSubmitted.nama_anak.trim(),
          tanggal_lahir: tanggalLahirStr,
          jenis_kelamin: lastSubmitted.jenis_kelamin,
          nama_ibu: lastSubmitted.nama_ibu || undefined,
          alamat: lastSubmitted.dusun_rt || undefined,
        },
        penimbangan: {
          tanggal_timbang: todayStr,
          umur_bulan: lastSubmitted.umur_bulan,
          berat_kg: lastSubmitted.berat_kg,
          tinggi_cm: lastSubmitted.tinggi_cm,
          lingkar_kepala_cm: lastSubmitted.lingkar_kepala_cm,
          lingkar_lengan_cm: lastSubmitted.lingkar_lengan_cm,
          input_mode: "form",
        },
      });

      // Simpan nama balita dan objek untuk notifikasi & Kartu Timbang
      const namaTersimpan = lastSubmitted.nama_anak.trim();
      setSavedChildName(namaTersimpan);
      if (currentBalitaForSlip) {
        setLastSavedBalita({ ...currentBalitaForSlip, nama: namaTersimpan });
      }
      setSaveSuccess(true);
      if (lastSubmitted.balita_id) {
        toast.success(`Penimbangan rutin "${namaTersimpan}" berhasil disimpan ke track record riwayat!`, 4000);
      } else {
        toast.success(`Data balita baru "${namaTersimpan}" berhasil didaftarkan ke database!`, 4000);
      }

      // KEMBALI KAYA AWAL LAGI:
      // Kosongkan hasil Z-Score & form input agar kembali ke tampilan awal (placeholder)
      setResult(null);
      setLastSubmitted(null);
      setFormResetKey(prev => prev + 1);
      setOcrPrefill(null);

      if (onSaved) onSaved();
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Gagal menyimpan ke database";
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleInputBaru = () => {
    setResult(null);
    setSaveSuccess(false);
    setSavedChildName(null);
    setFormResetKey(prev => prev + 1);
    setOcrPrefill(null);
    setError(null);
  };

  // Handler OCR -> lanjut ke form untuk konfirmasi akhir
  const handleOcrConfirm = (data: OcrExtractedData) => {
    setOcrPrefill({
      nama_anak: data.nama_anak ?? "",
      umur_bulan: data.umur_bulan ?? 0,
      berat_kg: data.berat_kg ?? 0,
      tinggi_cm: data.tinggi_cm ?? 0,
      jenis_kelamin: (data.jenis_kelamin as "L" | "P") ?? "L",
      lingkar_kepala_cm: data.lingkar_kepala_cm ?? undefined,
      lingkar_lengan_cm: data.lingkar_lengan_cm ?? undefined,
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10, marginBottom: 6 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0F172A", margin: "0 0 4px 0" }}>
            Input Pengukuran Antropometri
          </h1>
          <p style={{ fontSize: 14, color: "#475569", margin: 0 }}>
            Catat hasil timbang dan ukur balita untuk deteksi cepat status gizi.
          </p>
        </div>

        {activePosyandu && (
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: "#F0FDF4",
            border: "1.5px solid #BBF7D0",
            borderRadius: 10,
            padding: "6px 14px",
            fontSize: 12.5,
            color: "#15803D",
            fontWeight: 700,
          }}>
            <Building2 size={16} />
            <span>Tersimpan untuk: <strong>{activePosyandu.nama}</strong> ({activePosyandu.desa ? `Desa ${activePosyandu.desa}` : ""})</span>
          </div>
        )}
      </div>

      {/* Tab pilihan mode input */}
      <div style={{
        display: "flex", gap: 8, marginBottom: 18,
        background: "#F1F5F9", borderRadius: 14, padding: 5,
        alignSelf: "flex-start",
      }}>
        {([
          { id: "form",  label: "Isi Form Manual", icon: Keyboard },
          { id: "ocr",   label: "Scan Foto KMS",   icon: FileImage },
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

          {(result.ada_risiko_stunting || result.ada_risiko_wasting || result.ada_risiko_underweight || result.ada_risiko_mikrosefali || result.ada_risiko_makrosefali) && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
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
              {result.ada_risiko_mikrosefali && (
                <span style={{ fontSize: 11, fontWeight: 700, color: "#B91C1C", background: "#FEE2E2", border: "1px solid #FECACA", borderRadius: 99, padding: "3px 10px" }}>
                  Mikrosefali
                </span>
              )}
              {result.ada_risiko_makrosefali && (
                <span style={{ fontSize: 11, fontWeight: 700, color: "#B45309", background: "#FEF3C7", border: "1px solid #FDE68A", borderRadius: 99, padding: "3px 10px" }}>
                  Makrosefali
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Banner Sukses Simpan & Info Form Otomatis Dikosongkan */}
      {saveSuccess && (
        <div
          className="slide-up"
          style={{
            background: "#F0FDF4",
            border: "1.5px solid #86EFAC",
            borderRadius: 14,
            padding: "14px 18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 16,
            boxShadow: "0 2px 6px rgba(22, 163, 74, 0.08)",
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: "#DCFCE7",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}>
              <CheckCircle size={20} color="#16A34A" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 13.5, color: "#15803D" }}>
                Data Balita {savedChildName ? `"${savedChildName}" ` : ""}Berhasil Disimpan ke Riwayat!
              </div>
              <div style={{ fontSize: 12, color: "#166534", marginTop: 2 }}>
                Formulir input telah <strong>otomatis dikosongkan</strong>. Anda dapat langsung mengisikan data balita berikutnya tanpa perlu menghapus isian sebelumnya.
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {lastSavedBalita && (
              <button
                type="button"
                onClick={() => setKartuModalBalita(lastSavedBalita)}
                style={{
                  background: "#15803D",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: 8,
                  padding: "7px 12px",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  boxShadow: "0 2px 4px rgba(21, 128, 61, 0.25)",
                }}
              >
                <MessageCircle size={13} />
                <span>Kartu Timbang / WA</span>
              </button>
            )}
            {onBukaRiwayat && (
              <button
                type="button"
                onClick={onBukaRiwayat}
                style={{
                  background: "#16A34A",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: 8,
                  padding: "7px 12px",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <ClipboardList size={13} />
                <span>Lihat di Riwayat</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setSaveSuccess(false);
                setSavedChildName(null);
              }}
              style={{
                background: "#FFFFFF",
                border: "1px solid #BBF7D0",
                color: "#166534",
                borderRadius: 8,
                padding: "7px 11px",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
              title="Tutup pemberitahuan"
            >
              <X size={13} />
              <span>Tutup</span>
            </button>
          </div>
        </div>
      )}

      {activeMode === "form" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))", gap: 20, alignItems: "flex-start" }}>
          {/* KOLOM KIRI: FORM (Otomatis reset saat formResetKey berubah) */}
          <ManualForm
            key={formResetKey}
            resetKey={formResetKey}
            onSubmitValid={handleValidSubmit}
            loading={loading}
            prefillData={ocrPrefill}
            balitaList={balitaList}
            allBalitaList={allBalitaList}
            onReset={() => {
              setOcrPrefill(null);
            }}
          />

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
                onBukaRiwayat={onBukaRiwayat}
                onInputBaru={handleInputBaru}
                onBukaKartu={currentBalitaForSlip ? () => setKartuModalBalita(currentBalitaForSlip) : undefined}
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
                  <Activity size={24} color="#16A34A" />
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

          {/* PUSAT PANDUAN INTERVENSI GIZI & MENU MAKANAN (FULL-WIDTH DI BAWAH KEDUA KOLOM) */}
          {result && (
            <div id="advisory-section" style={{ gridColumn: "1 / -1", width: "100%", marginTop: 8 }}>
              <AdvisoryCard
                result={result}
                form={{
                  nama_anak: lastSubmitted?.nama_anak,
                  umur_bulan: lastSubmitted?.umur_bulan ?? 0,
                  berat_kg: lastSubmitted?.berat_kg ?? 0,
                  tinggi_cm: lastSubmitted?.tinggi_cm ?? 0,
                  jenis_kelamin: lastSubmitted?.jenis_kelamin ?? "L",
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* Modal Kartu Timbang Digital & Bagikan ke WhatsApp */}
      {kartuModalBalita && (
        <KartuTimbangModal
          balita={kartuModalBalita}
          activePosyandu={activePosyandu}
          onClose={() => setKartuModalBalita(null)}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GRAFIK KMS INTERAKTIF (Posyandu Friendly & Warm)
// ─────────────────────────────────────────────────────────────────────────────

function GrafikKmsPage({
  initialBalitaId,
  onSelectBalitaId,
  balitaList = [],
  allBalitaList = [],
  activePosyandu,
  onCatatBaru,
}: {
  initialBalitaId?: string;
  onSelectBalitaId?: (id: string) => void;
  balitaList?: BalitaItem[];
  allBalitaList?: BalitaItem[];
  activePosyandu?: PosyanduItem | null;
  onCatatBaru?: () => void;
}) {
  const [showAllBalita, setShowAllBalita] = useState<boolean>(false);

  // Jika balita yang dicari ada di daftar semua balita tetapi di posyandu aktif kosong, aktifkan showAllBalita otomatis
  useEffect(() => {
    if (
      initialBalitaId &&
      balitaList.length > 0 &&
      !balitaList.some((b) => b.id === initialBalitaId) &&
      allBalitaList.some((b) => b.id === initialBalitaId)
    ) {
      setShowAllBalita(true);
    }
  }, [initialBalitaId, balitaList, allBalitaList]);

  // List yang aktif untuk dropdown balita
  const list = useMemo(() => {
    if (showAllBalita && allBalitaList.length > 0) return allBalitaList;
    if (balitaList.length > 0) return balitaList;
    return allBalitaList;
  }, [showAllBalita, balitaList, allBalitaList]);

  const [selectedBalitaId, setSelectedBalitaId] = useState<string>(() => {
    if (initialBalitaId && list.some((b) => b.id === initialBalitaId)) {
      return initialBalitaId;
    }
    return list[0]?.id ?? "";
  });

  // Sinkronisasi saat initialBalitaId diperbarui dari parent (misal klik 'Lihat Grafik KMS' di tabel riwayat)
  useEffect(() => {
    if (initialBalitaId && list.some((b) => b.id === initialBalitaId)) {
      setSelectedBalitaId(initialBalitaId);
    }
  }, [initialBalitaId, list]);

  // Sinkronisasi jika balita terpilih tidak ada di list (misal ganti posyandu)
  useEffect(() => {
    if (list.length > 0 && !list.some((b) => b.id === selectedBalitaId)) {
      const fallbackId = list[0].id;
      setSelectedBalitaId(fallbackId);
      if (onSelectBalitaId) onSelectBalitaId(fallbackId);
    }
  }, [list, selectedBalitaId, onSelectBalitaId]);

  const handleSelectBalita = (balita: BalitaItem) => {
    setSelectedBalitaId(balita.id);
    if (onSelectBalitaId) {
      onSelectBalitaId(balita.id);
    }
  };

  const selectedBalita = useMemo(() => {
    return list.find((b) => b.id === selectedBalitaId) || list[0];
  }, [list, selectedBalitaId]);

  if (!selectedBalita) {
    return (
      <div style={{ maxWidth: 980, margin: "0 auto", padding: "60px 20px", textAlign: "center", background: "#FFFFFF", borderRadius: 16, border: "1.5px solid #E2E8F0" }}>
        <div style={{ width: 60, height: 60, borderRadius: "50%", background: "#F0FDF4", border: "1px solid #BBF7D0", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
          <TrendingUp size={30} color="#16A34A" />
        </div>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0F172A", marginBottom: 6 }}>
          {activePosyandu ? `Belum Ada Data Balita di ${activePosyandu.nama}` : "Belum Ada Data Balita untuk Ditampilkan Grafiknya"}
        </h2>
        <p style={{ fontSize: 13.5, color: "#64748B", margin: "0 auto 18px", maxWidth: 440, lineHeight: 1.5 }}>
          {activePosyandu
            ? `Belum ada balita yang terdaftar di ${activePosyandu.nama}. Segera setelah kader mencatat penimbangan balita untuk posyandu ini, grafik kurva WHO otomatis tampil di sini.`
            : "Database Posyandu Supabase siap digunakan. Segera setelah kader mencatat penimbangan balita, grafik kurva WHO otomatis tampil di sini."}
        </p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
          {allBalitaList.length > 0 && !showAllBalita && (
            <button
              type="button"
              onClick={() => setShowAllBalita(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                background: "#F8FAFC",
                color: "#16A34A",
                border: "1.5px solid #BBF7D0",
                borderRadius: 10,
                padding: "9px 18px",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Lihat Balita dari Posyandu Lain ({allBalitaList.length} anak)
            </button>
          )}
          {onCatatBaru && (
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
              }}
            >
              <Baby size={16} /> Catat Balita Sekarang
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1040, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header Utama & Filter Balita Terintegrasi (Bebas Tumpukan) */}
      <div
        style={{
          background: "#FFFFFF",
          border: "1px solid #E2E8F0",
          borderRadius: 14,
          padding: "16px 20px",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 14,
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
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
              color: "#15803D",
              flexShrink: 0,
            }}
          >
            <TrendingUp size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: "#0F172A", margin: 0 }}>
              Grafik Kurva Pertumbuhan WHO (KMS Digital)
            </h2>
            <p style={{ fontSize: 12, color: "#64748B", margin: "2px 0 0 0" }}>
              Visualisasi tren panjang/tinggi dan berat badan terhadap deviasi baku WHO 2006.
            </p>
          </div>
        </div>

        {/* Dropdown Live Search Balita */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", minWidth: 280 }}>
          <SearchableBalitaSelect
            balitaList={list}
            selectedId={selectedBalitaId}
            onSelect={handleSelectBalita}
            placeholder="Cari balita binaan Posyandu..."
          />

          {allBalitaList.length > balitaList.length && (
            <label
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontSize: 11.5,
                fontWeight: 700,
                color: "#475569",
                cursor: "pointer",
                userSelect: "none",
                background: showAllBalita ? "#F0FDF4" : "#F8FAFC",
                border: showAllBalita ? "1px solid #86EFAC" : "1px solid #CBD5E1",
                padding: "6px 10px",
                borderRadius: 7,
              }}
            >
              <input
                type="checkbox"
                checked={showAllBalita}
                onChange={(e) => setShowAllBalita(e.target.checked)}
                style={{ accentColor: "#16A34A", cursor: "pointer", width: 14, height: 14 }}
              />
              Semua Posyandu
            </label>
          )}
        </div>
      </div>

      {/* Komponen Grafik Pertumbuhan Standar WHO dengan data anak terpilih */}
      <GrowthChart
        namaAnak={selectedBalita.nama}
        jenisKelamin={selectedBalita.jenisKelamin}
        umurBulan={selectedBalita.umurBulan}
        beratKg={selectedBalita.beratTerakhir}
        tinggiCm={selectedBalita.tinggiTerakhir}
        initialIndicator="pbu"
        riwayat={selectedBalita.riwayat}
      />
    </div>
  );
}

// ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
// COMING SOON
// ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ

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


// ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
// APP ROOT
// ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ

export default function App() {
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();
  const toast = useToast();

  // Route Guard: Pengguna WAJIB login terlebih dahulu sebelum masuk ke sistem
  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [isLoading, user, router]);

  const [activePage, setActivePage] = useState("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [selectedKmsBalitaId, setSelectedKmsBalitaId] = useState<string>("");
  const [balitaList, setBalitaList] = useState<BalitaItem[]>([]);
  const [posyanduList, setPosyanduList] = useState<PosyanduItem[]>([]);
  const [activePosyandu, setActivePosyandu] = useState<PosyanduItem | null>(null);

  // Tanggal Hari Ini Dinamis & Aman SSR
  const currentFormattedDate = useSyncExternalStore(
    () => () => {},
    () => {
      try {
        return new Intl.DateTimeFormat("id-ID", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        }).format(new Date());
      } catch {
        return "Sabtu, 7 November 2026";
      }
    },
    () => "Sabtu, 7 November 2026"
  );

  const isPuskesmas = user?.role === "puskesmas";

  const currentNav = useMemo(() => {
    const list = isPuskesmas ? navItemsPuskesmas : navItems;
    return list.find((item) => item.id === activePage) || list[0];
  }, [activePage, isPuskesmas]);

  // Filter balita khusus posyandu yang sedang aktif (atau semua balita jika pengawas puskesmas)
  const activeBalitaList = useMemo(() => {
    if (isPuskesmas) return balitaList; // Puskesmas memantau semua posyandu
    if (!activePosyandu) return balitaList;
    return balitaList.filter((b) => {
      if (b.posyanduId) return b.posyanduId === activePosyandu.id;
      const text = (b.dusun || "").toLowerCase();
      if (text && activePosyandu.nama.toLowerCase().includes(text)) return true;
      return false;
    });
  }, [balitaList, activePosyandu, isPuskesmas]);

  // Sinkronisasi balita terpilih KMS saat posyandu aktif berganti
  useEffect(() => {
    if (activeBalitaList.length > 0) {
      if (!activeBalitaList.some((b) => b.id === selectedKmsBalitaId)) {
        setSelectedKmsBalitaId(activeBalitaList[0].id);
      }
    } else {
      setSelectedKmsBalitaId("");
    }
  }, [activeBalitaList, selectedKmsBalitaId]);

  const handleSelectActivePosyandu = (p: PosyanduItem) => {
    setActivePosyandu(p);
    setStoredActivePosyanduId(p.id);
  };

  const refreshBalitaList = async () => {
    try {
      const data = await getBalitaFullList();
      setBalitaList(data);
      if (data.length > 0 && !selectedKmsBalitaId) {
        setSelectedKmsBalitaId(data[0].id);
      }
    } catch (err) {
      console.error("Gagal sinkron database balita:", err);
    }
  };

  const refreshPosyanduList = async () => {
    try {
      const data = await getPosyanduList();
      setPosyanduList(data);
      if (data.length > 0) {
        setActivePosyandu((prev) => {
          const storedId = getStoredActivePosyanduId();
          const targetId = prev?.id || storedId;
          let chosen = data[0];
          if (targetId) {
            const found = data.find((p) => p.id === targetId);
            if (found) chosen = found;
          }
          setStoredActivePosyanduId(chosen.id);
          return chosen;
        });
      }
    } catch (err) {
      console.error("Gagal sinkron database posyandu:", err);
    }
  };

  useEffect(() => {
    let isMounted = true;
    getBalitaFullList()
      .then((data) => {
        if (isMounted) {
          setBalitaList(data);
          if (data.length > 0) {
            setSelectedKmsBalitaId(data[0].id);
          }
        }
      })
      .catch((err) => console.error("Gagal sinkron database balita:", err));

    getPosyanduList()
      .then((data) => {
        if (isMounted) {
          setPosyanduList(data);
          if (data.length > 0) {
            const storedId = getStoredActivePosyanduId();
            let chosen = data[0];
            if (storedId) {
              const found = data.find((p) => p.id === storedId);
              if (found) chosen = found;
            }
            setActivePosyandu(chosen);
            setStoredActivePosyanduId(chosen.id);
          }
        }
      })
      .catch((err) => console.error("Gagal sinkron database posyandu:", err));

    return () => {
      isMounted = false;
    };
  }, []);


  // PWA & Network status state
  interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
  }

  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        setIsOnline(false);
      }
    }, 0);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice?.outcome === "accepted") {
        setInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      alert("Aplikasi Ananta siap digunakan offline atau pasang melalui menu browser (Tambahkan ke Layar Utama).");
    }
  };

  const bukaGrafikBalita = (id?: string) => {
    if (id) setSelectedKmsBalitaId(id);
    setActivePage("grafik");
  };

  const renderPage = () => {
    switch (activePage) {
      case "dashboard":
        if (isPuskesmas && user) {
          return (
            <PuskesmasDashboard
              posyanduList={posyanduList}
              allBalitaList={balitaList}
              user={user}
              onNavigate={setActivePage}
            />
          );
        }
        return (
          <DashboardOverview
            balitaList={activeBalitaList}
            posyanduList={posyanduList}
            activePosyandu={activePosyandu}
            onNavigate={setActivePage}
            onBukaGrafikBalita={bukaGrafikBalita}
          />
        );
      case "posyandu":
        if (!isPuskesmas) {
          return (
            <div style={{
              maxWidth: 580,
              margin: "60px auto",
              padding: "36px 30px",
              background: "#FFFFFF",
              borderRadius: 16,
              border: "1.5px solid #FECACA",
              textAlign: "center",
              boxShadow: "0 4px 20px rgba(220, 38, 38, 0.08)",
            }}>
              <div style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                background: "#FEF2F2",
                color: "#DC2626",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
              }}>
                <Building2 size={28} />
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0F172A", margin: "0 0 8px 0" }}>
                Akses Dibatasi: Otoritas Puskesmas
              </h2>
              <p style={{ fontSize: 14, color: "#64748B", margin: "0 0 24px 0", lineHeight: 1.6 }}>
                Penambahan, perubahan, dan pengelolaan unit Posyandu hanya dapat dilakukan oleh otoritas <strong>Puskesmas</strong> pembina. Akun Kader berfokus pada pencatatan penimbangan balita di posyandu terdaftar.
              </p>
              <button
                type="button"
                onClick={() => setActivePage("dashboard")}
                style={{
                  background: "#16A34A",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: 10,
                  padding: "10px 22px",
                  fontWeight: 700,
                  fontSize: 13.5,
                  cursor: "pointer",
                  boxShadow: "0 2px 6px rgba(22, 163, 74, 0.25)",
                }}
              >
                Kembali ke Dashboard Kader
              </button>
            </div>
          );
        }
        return (
          <KelolaPosyandu
            posyanduList={posyanduList}
            activePosyanduId={activePosyandu?.id}
            onSelectPosyandu={handleSelectActivePosyandu}
            onRefresh={refreshPosyanduList}
            onNavInput={() => {
              if (isPuskesmas) {
                toast.info("Fitur Input Penimbangan hanya dapat dilakukan oleh Kader Posyandu.");
              } else {
                setActivePage("input");
              }
            }}
            onNavDashboard={() => setActivePage("dashboard")}
          />
        );
      case "input":
        if (isPuskesmas) {
          return (
            <div style={{
              maxWidth: 600,
              margin: "60px auto",
              padding: "36px 30px",
              background: "#FFFFFF",
              borderRadius: 16,
              border: "1.5px solid #BFDBFE",
              textAlign: "center",
              boxShadow: "0 4px 20px rgba(37, 99, 235, 0.08)",
            }}>
              <div style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                background: "#EFF6FF",
                color: "#2563EB",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
              }}>
                <Stethoscope size={28} />
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0F172A", margin: "0 0 8px 0" }}>
                Mode Pengawasan Puskesmas (Hanya Lihat)
              </h2>
              <p style={{ fontSize: 14, color: "#64748B", margin: "0 0 24px 0", lineHeight: 1.6 }}>
                Akun Puskesmas berfungsi sebagai pengawas dan pemantau perkembangan lintas posyandu.
                Pencatatan data antropometri baru dilakukan langsung oleh Kader Posyandu di lapangan.
              </p>
              <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => setActivePage("dashboard")}
                  style={{
                    background: "#2563EB",
                    color: "#FFFFFF",
                    border: "none",
                    borderRadius: 10,
                    padding: "10px 20px",
                    fontWeight: 700,
                    fontSize: 13.5,
                    cursor: "pointer",
                  }}
                >
                  Kembali ke Dashboard Pantau
                </button>
                <button
                  type="button"
                  onClick={() => setActivePage("riwayat")}
                  style={{
                    background: "#F8FAFC",
                    color: "#334155",
                    border: "1px solid #CBD5E1",
                    borderRadius: 10,
                    padding: "10px 20px",
                    fontWeight: 700,
                    fontSize: 13.5,
                    cursor: "pointer",
                  }}
                >
                  Lihat Riwayat Balita
                </button>
              </div>
            </div>
          );
        }
        return (
          <InputDataPage
            activePosyandu={activePosyandu}
            balitaList={activeBalitaList}
            allBalitaList={balitaList}
            onSaved={refreshBalitaList}
            onBukaRiwayat={() => setActivePage("riwayat")}
          />
        );
      case "grafik":
        return (
          <GrafikKmsPage
            initialBalitaId={selectedKmsBalitaId}
            onSelectBalitaId={setSelectedKmsBalitaId}
            balitaList={activeBalitaList}
            allBalitaList={balitaList}
            activePosyandu={activePosyandu}
            onCatatBaru={() => {
              if (isPuskesmas) {
                toast.info("Fitur Input Penimbangan hanya dapat dilakukan oleh Kader Posyandu.");
              } else {
                setActivePage("input");
              }
            }}
          />
        );
      case "riwayat":
        return (
          <RiwayatData
            balitaList={activeBalitaList}
            posyanduList={posyanduList}
            activePosyandu={activePosyandu}
            onRefresh={refreshBalitaList}
            onCatatBaru={() => {
              if (isPuskesmas) {
                toast.info("Fitur Input Penimbangan hanya dapat dilakukan oleh Kader Posyandu.");
              } else {
                setActivePage("input");
              }
            }}
            onBukaGrafik={bukaGrafikBalita}
          />
        );
      case "laporan":
        return <LaporanEppgbm balitaList={activeBalitaList} activePosyandu={activePosyandu} />;
      case "peta":
        return (
          <PetaStunting
            balitaList={balitaList}
            posyanduList={posyanduList}
            activePosyandu={activePosyandu}
            onCatatBaru={() => {
              if (isPuskesmas) {
                toast.info("Fitur Input Penimbangan hanya dapat dilakukan oleh Kader Posyandu.");
              } else {
                setActivePage("input");
              }
            }}
            onLihatRiwayat={() => setActivePage("riwayat")}
            onNavKelolaPosyandu={isPuskesmas ? () => setActivePage("posyandu") : undefined}
          />
        );
      default:
        if (isPuskesmas && user) {
          return (
            <PuskesmasDashboard
              posyanduList={posyanduList}
              allBalitaList={balitaList}
              user={user}
              onNavigate={setActivePage}
            />
          );
        }
        return (
          <DashboardOverview
            balitaList={activeBalitaList}
            posyanduList={posyanduList}
            activePosyandu={activePosyandu}
            onNavigate={setActivePage}
            onBukaGrafikBalita={bukaGrafikBalita}
          />
        );
    }
  };

  // Tampilkan layar pengalihan jika pengguna belum login
  if (isLoading || !user) {
    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "#F8FAF8",
        gap: 16,
      }}>
        <div style={{
          width: 64,
          height: 64,
          borderRadius: 20,
          background: "#FFFFFF",
          border: "1.5px solid #E2E8F0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 6,
          boxShadow: "0 6px 16px rgba(0, 0, 0, 0.06)",
        }}>
          <img src="/ananta_baru_fix.png" alt="Ananta" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#16A34A", fontWeight: 700, fontSize: 13.5 }}>
          <Loader2 size={18} className="animate-spin" />
          <span>Mengarahkan ke halaman login...</span>
        </div>
      </div>
    );
  }

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
        user={user}
        activePosyanduName={activePosyandu?.nama}
        onLogout={logout}
        isPuskesmas={isPuskesmas}
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
            {/* Mobile: Mengetuk logo Ananta langsung membuka drawer navigasi */}
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
                background: "#FFFFFF",
                border: "1px solid #E2E8F0",
                display: "flex", alignItems: "center", justifyContent: "center",
                overflow: "hidden", padding: 2,
                boxShadow: "0 2px 5px rgba(0, 0, 0, 0.06)",
              }}>
                <img src="/ananta_baru_fix.png" alt="Logo Ananta" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
              </div>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#0F172A", lineHeight: 1.15 }}>Ananta</div>
                <div style={{
                  fontSize: 9,
                  color: isPuskesmas ? "#2563EB" : "#16A34A",
                  fontWeight: 700,
                  letterSpacing: "0.04em"
                }}>
                  {isPuskesmas ? "PUSKESMAS" : "POSYANDU"}
                </div>
              </div>
            </button>

            {/* Desktop: Breadcrumb Menu & Tanggal Hari Ini (Elegan & Tidak Duplikat) */}
            <div
              className="desktop-context-tag"
              suppressHydrationWarning
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              {/* Breadcrumb Menu Aktif */}
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#64748B" }}>Portal</span>
                <span style={{ color: "#CBD5E1", fontSize: 13 }}>/</span>
                <span style={{ fontSize: 13.5, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.01em" }}>
                  {currentNav.label}
                </span>
              </div>

              <span style={{ width: 1, height: 16, background: "#E2E8F0" }} />

              {/* Tanggal Hari Ini */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  color: "#475569",
                  fontSize: 12.5,
                  fontWeight: 600,
                  background: "#F8FAFC",
                  border: "1px solid #E2E8F0",
                  padding: "4px 10px",
                  borderRadius: 8,
                }}
              >
                <CalendarDays size={13} color="#16A34A" />
                <span>{currentFormattedDate}</span>
              </div>
            </div>
          </div>

          {/* Controls Kanan */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Posyandu Badge (Kader Ditugaskan 1 Posyandu Spesifik) */}
            <div
              suppressHydrationWarning
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                background: "#F0FDF4",
                border: "1px solid #DCFCE7",
                padding: "5px 12px",
                borderRadius: 99,
              }}
            >
              <div
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: isOnline ? "#16A34A" : "#F59E0B",
                  flexShrink: 0,
                }}
                title={isOnline ? "Terhubung ke Database" : "Offline"}
              />
              <span
                style={{
                  fontSize: 12.5,
                  fontWeight: 700,
                  color: "#15803D",
                  letterSpacing: "-0.01em",
                  whiteSpace: "nowrap",
                }}
              >
                {user?.posyandu || activePosyandu?.nama || "Posyandu Dahlia 01"}
              </span>
            </div>

            {/* User Profile / Login Link */}
            <div suppressHydrationWarning style={{ display: "flex", alignItems: "center" }}>
              {user ? (
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  borderLeft: "1.5px solid #E2E8F0",
                  paddingLeft: 14,
                  marginLeft: 4,
                }}>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-end",
                      justifyContent: "center",
                      textAlign: "right",
                      lineHeight: 1.25,
                    }}
                    className="user-profile-meta"
                  >
                    <div style={{ fontSize: 13, fontWeight: 800, color: "#0F172A", whiteSpace: "nowrap" }}>
                      {user.name}
                    </div>
                    <div style={{ fontSize: 10.5, color: isPuskesmas ? "#2563EB" : "#16A34A", fontWeight: 700, whiteSpace: "nowrap" }}>
                      {user.role === "puskesmas"
                        ? "Supervisor Puskesmas"
                        : "Kader Posyandu"}
                    </div>
                  </div>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: isPuskesmas
                        ? "linear-gradient(135deg, #2563EB, #1D4ED8)"
                        : "linear-gradient(135deg, #16A34A, #15803D)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: isPuskesmas
                        ? "0 2px 6px rgba(37, 99, 235, 0.25)"
                        : "0 2px 6px rgba(22, 163, 74, 0.25)",
                      color: "#FFFFFF",
                      fontWeight: 800,
                      fontSize: 14,
                      flexShrink: 0,
                    }}
                    title={`${user.name} (${user.posyandu})`}
                  >
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <button
                    type="button"
                    onClick={logout}
                    title="Keluar Akun"
                    style={{
                      background: "#F8FAFC",
                      border: "1px solid #E2E8F0",
                      borderRadius: 8,
                      cursor: "pointer",
                      color: "#64748B",
                      padding: 6,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.15s ease",
                      marginLeft: 2,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "#DC2626";
                      e.currentTarget.style.borderColor = "#FECACA";
                      e.currentTarget.style.background = "#FEF2F2";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "#64748B";
                      e.currentTarget.style.borderColor = "#E2E8F0";
                      e.currentTarget.style.background = "#F8FAFC";
                    }}
                  >
                    <LogOut size={15} />
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "7px 14px",
                    borderRadius: 8,
                    background: "#16A34A",
                    color: "white",
                    fontSize: 12.5,
                    fontWeight: 700,
                    textDecoration: "none",
                    boxShadow: "0 2px 6px rgba(22,163,74,0.2)",
                  }}
                >
                  <LogIn size={14} /> <span>Masuk</span>
                </Link>
              )}
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

