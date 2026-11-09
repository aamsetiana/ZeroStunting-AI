"use client";

import React, { useMemo } from "react";
import {
  AlertTriangle,
  BarChart2,
  FileText,
  MapPin,
  Users,
  Activity,
  Eye,
  CheckCircle,
  XCircle,
  TrendingUp,
} from "lucide-react";
import type { PosyanduItem } from "@/lib/utils";
import type { BalitaItem } from "@/components/balita/RiwayatData";
import { User } from "@/lib/auth";

// ─── Types ───────────────────────────────────────────────────────────────────

interface PosyanduStat {
  posyandu: PosyanduItem;
  total: number;
  normal: number;
  waspada: number;
  rujukan: number;
  pctStunting: number;
}

interface PuskesmasDashboardProps {
  posyanduList: PosyanduItem[];
  allBalitaList: BalitaItem[];
  user: User;
  onNavigate: (page: string) => void;
}

// ─── Theme ───────────────────────────────────────────────────────────────────

const theme = {
  primary: "#2563EB",
  light: "#EFF6FF",
  border: "#BFDBFE",
  badge: "#1E40AF",
  success: "#16A34A",
  successLight: "#F0FDF4",
  successBorder: "#BBF7D0",
  warning: "#D97706",
  warningLight: "#FFFBEB",
  warningBorder: "#FDE68A",
  danger: "#DC2626",
  dangerLight: "#FEF2F2",
  dangerBorder: "#FECACA",
  muted: "#6B7280",
  mutedLight: "#F9FAFB",
  mutedBorder: "#E5E7EB",
  text: "#111827",
  textSecondary: "#374151",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function ReadOnlyBadge() {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        backgroundColor: "#FEF3C7",
        border: "1px solid #FCD34D",
        color: "#92400E",
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.08em",
        padding: "3px 10px",
        borderRadius: 999,
      }}
    >
      <Eye size={12} />
      MODE PEMANTAUAN — Hanya Lihat
    </span>
  );
}

function KpiCard({
  icon,
  label,
  value,
  color,
  bgColor,
  borderColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
  bgColor: string;
  borderColor: string;
}) {
  return (
    <div
      style={{
        backgroundColor: bgColor,
        border: `1px solid ${borderColor}`,
        borderRadius: 12,
        padding: "20px 24px",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        flex: "1 1 180px",
        minWidth: 160,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, color }}>
        {icon}
        <span style={{ fontSize: 13, fontWeight: 600, color: theme.textSecondary }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: 32, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
    </div>
  );
}

function AlertBanner({ problematic }: { problematic: PosyanduStat[] }) {
  if (problematic.length === 0) return null;
  return (
    <div
      style={{
        backgroundColor: "#FFF7ED",
        border: `1px solid #FDBA74`,
        borderRadius: 12,
        padding: "14px 20px",
        display: "flex",
        gap: 12,
        alignItems: "flex-start",
      }}
    >
      <AlertTriangle size={20} color="#EA580C" style={{ flexShrink: 0, marginTop: 2 }} />
      <div>
        <div style={{ fontWeight: 700, color: "#9A3412", marginBottom: 4, fontSize: 14 }}>
          Peringatan: {problematic.length} Posyandu Memerlukan Perhatian
        </div>
        <div style={{ fontSize: 13, color: "#C2410C" }}>
          Posyandu berikut memiliki &gt;20% kasus waspada/rujukan:{" "}
          <strong>
            {problematic.map((s) => `${s.posyandu.nama} (${s.pctStunting}%)`).join(", ")}
          </strong>
        </div>
      </div>
    </div>
  );
}

function DistribusiBar({
  total,
  normal,
  waspada,
  rujukan,
}: {
  total: number;
  normal: number;
  waspada: number;
  rujukan: number;
}) {
  const pctNormal = total > 0 ? (normal / total) * 100 : 0;
  const pctWaspada = total > 0 ? (waspada / total) * 100 : 0;
  const pctRujukan = total > 0 ? (rujukan / total) * 100 : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div
        style={{
          display: "flex",
          height: 28,
          borderRadius: 8,
          overflow: "hidden",
          border: `1px solid ${theme.mutedBorder}`,
        }}
      >
        {pctNormal > 0 && (
          <div
            title={`Normal: ${normal} balita (${Math.round(pctNormal)}%)`}
            style={{ width: `${pctNormal}%`, backgroundColor: "#16A34A" }}
          />
        )}
        {pctWaspada > 0 && (
          <div
            title={`Waspada: ${waspada} balita (${Math.round(pctWaspada)}%)`}
            style={{ width: `${pctWaspada}%`, backgroundColor: "#D97706" }}
          />
        )}
        {pctRujukan > 0 && (
          <div
            title={`Rujukan: ${rujukan} balita (${Math.round(pctRujukan)}%)`}
            style={{ width: `${pctRujukan}%`, backgroundColor: "#DC2626" }}
          />
        )}
        {total === 0 && (
          <div style={{ width: "100%", backgroundColor: theme.mutedBorder }} />
        )}
      </div>
      <div style={{ display: "flex", gap: 20, fontSize: 12 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span
            style={{
              width: 12,
              height: 12,
              borderRadius: 3,
              backgroundColor: "#16A34A",
              display: "inline-block",
            }}
          />
          <span style={{ color: theme.textSecondary }}>
            Normal: <strong style={{ color: "#15803D" }}>{normal}</strong> ({Math.round(pctNormal)}%)
          </span>
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span
            style={{
              width: 12,
              height: 12,
              borderRadius: 3,
              backgroundColor: "#D97706",
              display: "inline-block",
            }}
          />
          <span style={{ color: theme.textSecondary }}>
            Waspada: <strong style={{ color: "#B45309" }}>{waspada}</strong> ({Math.round(pctWaspada)}%)
          </span>
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span
            style={{
              width: 12,
              height: 12,
              borderRadius: 3,
              backgroundColor: "#DC2626",
              display: "inline-block",
            }}
          />
          <span style={{ color: theme.textSecondary }}>
            Rujukan: <strong style={{ color: "#B91C1C" }}>{rujukan}</strong> ({Math.round(pctRujukan)}%)
          </span>
        </span>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function PuskesmasDashboard({
  posyanduList,
  allBalitaList,
  user,
  onNavigate,
}: PuskesmasDashboardProps) {
  // ── Compute stats per posyandu ──
  const statsByPosyandu: PosyanduStat[] = useMemo(
    () =>
      posyanduList.map((p) => {
        const balita = allBalitaList.filter((b) => b.posyanduId === p.id);
        const normal = balita.filter((b) => b.statusGizi === "normal").length;
        const waspada = balita.filter((b) => b.statusGizi === "waspada").length;
        const rujukan = balita.filter((b) => b.statusGizi === "rujukan").length;
        const total = balita.length;
        const pctStunting =
          total > 0 ? Math.round(((waspada + rujukan) / total) * 100) : 0;
        return { posyandu: p, total, normal, waspada, rujukan, pctStunting };
      }),
    [posyanduList, allBalitaList]
  );

  // ── Aggregate KPIs ──
  const totalBalita = useMemo(
    () => statsByPosyandu.reduce((s, x) => s + x.total, 0),
    [statsByPosyandu]
  );
  const totalNormal = useMemo(
    () => statsByPosyandu.reduce((s, x) => s + x.normal, 0),
    [statsByPosyandu]
  );
  const totalWaspada = useMemo(
    () => statsByPosyandu.reduce((s, x) => s + x.waspada, 0),
    [statsByPosyandu]
  );
  const totalRujukan = useMemo(
    () => statsByPosyandu.reduce((s, x) => s + x.rujukan, 0),
    [statsByPosyandu]
  );
  const pctNormalGlobal =
    totalBalita > 0 ? Math.round((totalNormal / totalBalita) * 100) : 0;
  const posyanduAktif = statsByPosyandu.filter((s) => s.total > 0).length;

  // ── Alert: posyandu with >20% waspada+rujukan ──
  const problematicPosyandu = useMemo(
    () => statsByPosyandu.filter((s) => s.total > 0 && s.pctStunting > 20),
    [statsByPosyandu]
  );

  // ── Sorted for table: highest stunting first ──
  const sortedStats = useMemo(
    () => [...statsByPosyandu].sort((a, b) => b.pctStunting - a.pctStunting),
    [statsByPosyandu]
  );

  const maxPctStunting = sortedStats.length > 0 ? sortedStats[0].pctStunting : 0;

  return (
    <div
      style={{
        fontFamily: "'Inter', system-ui, sans-serif",
        color: theme.text,
        maxWidth: 1200,
        margin: "0 auto",
        padding: "0 0 40px 0",
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          background: `linear-gradient(135deg, ${theme.primary} 0%, #1D4ED8 100%)`,
          borderRadius: 16,
          padding: "28px 32px",
          marginBottom: 24,
          color: "#fff",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative circle */}
        <div
          style={{
            position: "absolute",
            top: -40,
            right: -40,
            width: 180,
            height: 180,
            borderRadius: "50%",
            backgroundColor: "rgba(255,255,255,0.07)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -60,
            right: 60,
            width: 220,
            height: 220,
            borderRadius: "50%",
            backgroundColor: "rgba(255,255,255,0.05)",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.12em",
                opacity: 0.8,
                marginBottom: 6,
              }}
            >
              SUPERVISOR PUSKESMAS • {user.posyandu}
            </div>
            <h1
              style={{
                fontSize: 26,
                fontWeight: 800,
                margin: 0,
                lineHeight: 1.2,
                marginBottom: 8,
              }}
            >
              Pemantauan Multi-Posyandu Terintegrasi
            </h1>
            <div
              style={{
                fontSize: 13,
                opacity: 0.85,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <MapPin size={14} />
              Kec. {user.kecamatan} • Kab. {user.kabupaten}
            </div>
          </div>
          <ReadOnlyBadge />
        </div>
      </div>

      {/* ── Alert Banner ── */}
      <div style={{ marginBottom: 24 }}>
        <AlertBanner problematic={problematicPosyandu} />
      </div>

      {/* ── KPI Cards ── */}
      <div
        className="grid"
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 16,
          marginBottom: 28,
        }}
      >
        <KpiCard
          icon={<Users size={20} />}
          label="Total Balita Terpantau"
          value={totalBalita}
          color={theme.primary}
          bgColor={theme.light}
          borderColor={theme.border}
        />
        <KpiCard
          icon={<Activity size={20} />}
          label="Posyandu Aktif"
          value={`${posyanduAktif} / ${posyanduList.length}`}
          color="#7C3AED"
          bgColor="#F5F3FF"
          borderColor="#DDD6FE"
        />
        <KpiCard
          icon={<CheckCircle size={20} />}
          label="% Gizi Normal"
          value={`${pctNormalGlobal}%`}
          color={theme.success}
          bgColor={theme.successLight}
          borderColor={theme.successBorder}
        />
        <KpiCard
          icon={<XCircle size={20} />}
          label="Perlu Rujukan"
          value={totalRujukan}
          color={theme.danger}
          bgColor={theme.dangerLight}
          borderColor={theme.dangerBorder}
        />
      </div>

      {/* ── Distribusi Status Gizi ── */}
      <div
        style={{
          backgroundColor: "#fff",
          border: `1px solid ${theme.mutedBorder}`,
          borderRadius: 12,
          padding: "20px 24px",
          marginBottom: 28,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 16,
          }}
        >
          <TrendingUp size={18} color={theme.primary} />
          <span style={{ fontWeight: 700, fontSize: 15 }}>
            Distribusi Status Gizi — Seluruh Wilayah
          </span>
          <span
            style={{
              marginLeft: "auto",
              fontSize: 12,
              color: theme.muted,
            }}
          >
            {totalBalita} balita total
          </span>
        </div>
        <DistribusiBar
          total={totalBalita}
          normal={totalNormal}
          waspada={totalWaspada}
          rujukan={totalRujukan}
        />
      </div>

      {/* ── Tabel Perbandingan ── */}
      <div
        style={{
          backgroundColor: "#fff",
          border: `1px solid ${theme.mutedBorder}`,
          borderRadius: 12,
          overflow: "hidden",
          marginBottom: 28,
        }}
      >
        <div
          style={{
            padding: "16px 24px",
            borderBottom: `1px solid ${theme.mutedBorder}`,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <BarChart2 size={18} color={theme.primary} />
          <span style={{ fontWeight: 700, fontSize: 15 }}>
            Perbandingan Antar Posyandu
          </span>
          <span
            style={{
              marginLeft: "auto",
              fontSize: 12,
              color: theme.muted,
              backgroundColor: theme.light,
              border: `1px solid ${theme.border}`,
              padding: "2px 10px",
              borderRadius: 999,
            }}
          >
            {posyanduList.length} posyandu
          </span>
        </div>

        {/* Scrollable wrapper for small screens */}
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              minWidth: 720,
              borderCollapse: "collapse",
              fontSize: 13,
            }}
          >
            <thead>
              <tr
                style={{
                  backgroundColor: theme.mutedLight,
                  borderBottom: `1px solid ${theme.mutedBorder}`,
                }}
              >
                {[
                  "Nama Posyandu",
                  "Jumlah Balita",
                  "Normal",
                  "Waspada",
                  "Perlu Rujukan",
                  "% Stunting",
                  "Aksi",
                ].map((col) => (
                  <th
                    key={col}
                    style={{
                      padding: "11px 16px",
                      textAlign: col === "Nama Posyandu" ? "left" : "center",
                      fontWeight: 600,
                      color: theme.textSecondary,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedStats.map((stat, idx) => {
                const isHighest =
                  stat.total > 0 && stat.pctStunting === maxPctStunting && maxPctStunting > 0;
                const isEmpty = stat.total === 0;

                const rowBg = isHighest
                  ? "#FFF1F2"
                  : isEmpty
                  ? "#F9FAFB"
                  : idx % 2 === 0
                  ? "#fff"
                  : "#FAFAFA";

                return (
                  <tr
                    key={stat.posyandu.id}
                    style={{
                      backgroundColor: rowBg,
                      borderBottom: `1px solid ${theme.mutedBorder}`,
                      opacity: isEmpty ? 0.55 : 1,
                    }}
                  >
                    {/* Nama Posyandu */}
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ fontWeight: 600, color: theme.text }}>
                        {stat.posyandu.nama}
                      </div>
                      {stat.posyandu.desa && (
                        <div style={{ fontSize: 11, color: theme.muted, marginTop: 2 }}>
                          {stat.posyandu.desa}
                        </div>
                      )}
                    </td>

                    {/* Jumlah Balita */}
                    <td style={{ padding: "12px 16px", textAlign: "center", fontWeight: 600 }}>
                      {stat.total === 0 ? (
                        <span style={{ color: theme.muted, fontSize: 12 }}>—</span>
                      ) : (
                        stat.total
                      )}
                    </td>

                    {/* Normal */}
                    <td style={{ padding: "12px 16px", textAlign: "center" }}>
                      <span
                        style={{
                          display: "inline-block",
                          backgroundColor: "#DCFCE7",
                          color: "#166534",
                          fontWeight: 600,
                          fontSize: 12,
                          padding: "2px 10px",
                          borderRadius: 999,
                          minWidth: 36,
                        }}
                      >
                        {stat.normal}
                      </span>
                    </td>

                    {/* Waspada */}
                    <td style={{ padding: "12px 16px", textAlign: "center" }}>
                      <span
                        style={{
                          display: "inline-block",
                          backgroundColor: "#FEF9C3",
                          color: "#854D0E",
                          fontWeight: 600,
                          fontSize: 12,
                          padding: "2px 10px",
                          borderRadius: 999,
                          minWidth: 36,
                        }}
                      >
                        {stat.waspada}
                      </span>
                    </td>

                    {/* Rujukan */}
                    <td style={{ padding: "12px 16px", textAlign: "center" }}>
                      <span
                        style={{
                          display: "inline-block",
                          backgroundColor: "#FEE2E2",
                          color: "#991B1B",
                          fontWeight: 600,
                          fontSize: 12,
                          padding: "2px 10px",
                          borderRadius: 999,
                          minWidth: 36,
                        }}
                      >
                        {stat.rujukan}
                      </span>
                    </td>

                    {/* % Stunting */}
                    <td style={{ padding: "12px 16px", textAlign: "center" }}>
                      {isEmpty ? (
                        <span style={{ color: theme.muted, fontSize: 12 }}>—</span>
                      ) : (
                        <span
                          style={{
                            display: "inline-block",
                            fontWeight: 700,
                            fontSize: 13,
                            color:
                              stat.pctStunting > 20
                                ? "#B91C1C"
                                : stat.pctStunting > 10
                                ? "#B45309"
                                : "#15803D",
                          }}
                        >
                          {stat.pctStunting}%
                          {isHighest && (
                            <span
                              style={{
                                marginLeft: 6,
                                fontSize: 10,
                                backgroundColor: "#FEE2E2",
                                color: "#991B1B",
                                padding: "1px 6px",
                                borderRadius: 999,
                                fontWeight: 600,
                                verticalAlign: "middle",
                              }}
                            >
                              Tertinggi
                            </span>
                          )}
                        </span>
                      )}
                    </td>

                    {/* Aksi */}
                    <td style={{ padding: "12px 16px", textAlign: "center" }}>
                      <button
                        onClick={() =>
                          onNavigate(`riwayat?posyanduId=${stat.posyandu.id}`)
                        }
                        disabled={isEmpty}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                          backgroundColor: isEmpty ? theme.mutedBorder : theme.light,
                          color: isEmpty ? theme.muted : theme.primary,
                          border: `1px solid ${isEmpty ? theme.mutedBorder : theme.border}`,
                          borderRadius: 7,
                          padding: "5px 12px",
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: isEmpty ? "not-allowed" : "pointer",
                          transition: "background 0.15s",
                          whiteSpace: "nowrap",
                        }}
                      >
                        <Eye size={13} />
                        Lihat Riwayat
                      </button>
                    </td>
                  </tr>
                );
              })}

              {sortedStats.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      padding: "32px 16px",
                      textAlign: "center",
                      color: theme.muted,
                      fontSize: 14,
                    }}
                  >
                    Belum ada data posyandu.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div
        style={{
          backgroundColor: theme.light,
          border: `1px solid ${theme.border}`,
          borderRadius: 12,
          padding: "20px 24px",
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: theme.text, marginBottom: 2 }}>
            Tindakan Cepat
          </div>
          <div style={{ fontSize: 12, color: theme.muted }}>
            Ekspor data atau lihat distribusi geografis stunting di wilayah Anda.
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button
            onClick={() => onNavigate("laporan")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              backgroundColor: theme.primary,
              color: "#fff",
              border: "none",
              borderRadius: 9,
              padding: "10px 20px",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(37,99,235,0.25)",
              transition: "opacity 0.15s",
            }}
            onMouseOver={(e) => (e.currentTarget.style.opacity = "0.9")}
            onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
          >
            <FileText size={15} />
            Export Laporan Gabungan
          </button>

          <button
            onClick={() => onNavigate("peta")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              backgroundColor: "#fff",
              color: theme.primary,
              border: `1.5px solid ${theme.border}`,
              borderRadius: 9,
              padding: "10px 20px",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              transition: "background 0.15s",
            }}
            onMouseOver={(e) =>
              (e.currentTarget.style.backgroundColor = theme.light)
            }
            onMouseOut={(e) =>
              (e.currentTarget.style.backgroundColor = "#fff")
            }
          >
            <MapPin size={15} />
            Lihat Peta Stunting
          </button>
        </div>
      </div>
    </div>
  );
}

export default PuskesmasDashboard;
