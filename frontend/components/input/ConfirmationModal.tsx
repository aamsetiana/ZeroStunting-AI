"use client";

import { CheckCircle2, AlertTriangle, Info, X, Baby, Scale, Ruler, Calendar, User, MapPin } from "lucide-react";
import type { BalitaFormData, PlausibilityWarning } from "@/lib/validations";

interface ConfirmationModalProps {
  isOpen: boolean;
  data: BalitaFormData;
  warnings: PlausibilityWarning[];
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export function ConfirmationModal({
  isOpen,
  data,
  warnings,
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  const displayName = data.nama_anak?.trim() || `Balita ${data.jenis_kelamin} (${data.umur_bulan} Bulan)`;
  const posisiText = data.posisi_pengukuran
    ? data.posisi_pengukuran === "telentang"
      ? "Telentang (Panjang Badan / PB)"
      : "Berdiri (Tinggi Badan / TB)"
    : data.umur_bulan < 24
    ? "Telentang (Otomatis < 24 bln)"
    : "Berdiri (Otomatis >= 24 bln)";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        background: "rgba(15, 23, 42, 0.45)",
        backdropFilter: "blur(3px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        className="fade-in"
        style={{
          background: "#FFFFFF",
          border: "1.5px solid #BBF7D0",
          borderRadius: 22,
          padding: 26,
          maxWidth: 480,
          width: "100%",
          boxShadow: "0 10px 30px rgba(15, 23, 42, 0.15)",
          display: "flex",
          flexDirection: "column",
          gap: 18,
        }}
      >
        {/* Modal Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "#DCFCE7",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CheckCircle2 size={20} color="#15803D" />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#0F172A" }}>
                Konfirmasi Pengukuran Balita
              </div>
              <div style={{ fontSize: 11, color: "#64748B" }}>
                Pastikan angka hasil penimbangan sudah benar sebelum diproses.
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            style={{
              background: "transparent",
              border: "none",
              color: "#94A3B8",
              cursor: "pointer",
              padding: 4,
              borderRadius: 8,
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Data Summary Card */}
        <div
          style={{
            background: "#F8FAF8",
            border: "1.5px solid #E2E8F0",
            borderRadius: 16,
            padding: "16px 18px",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {/* Identitas */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, paddingBottom: 10, borderBottom: "1px solid #E2E8F0" }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background: data.jenis_kelamin === "L" ? "#E0F2FE" : "#FCE7F3",
                color: data.jenis_kelamin === "L" ? "#0284C7" : "#BE185D",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                fontSize: 13,
              }}
            >
              {data.jenis_kelamin}
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#0F172A" }}>{displayName}</div>
              <div style={{ fontSize: 11, color: "#64748B" }}>
                {data.jenis_kelamin === "L" ? "Laki-laki" : "Perempuan"} • {data.umur_bulan} Bulan
                {data.nama_ibu ? ` • Ibu: ${data.nama_ibu}` : ""}
              </div>
            </div>
          </div>

          {/* Pengukuran Fisik */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 12, padding: "10px 12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#64748B", marginBottom: 3 }}>
                <Scale size={13} color="#16A34A" /> Berat Badan
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#0F172A" }}>
                {data.berat_kg.toFixed(2)} <span style={{ fontSize: 12, fontWeight: 600, color: "#64748B" }}>kg</span>
              </div>
            </div>

            <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 12, padding: "10px 12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#64748B", marginBottom: 3 }}>
                <Ruler size={13} color="#16A34A" /> Panjang / Tinggi
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#0F172A" }}>
                {data.tinggi_cm.toFixed(1)} <span style={{ fontSize: 12, fontWeight: 600, color: "#64748B" }}>cm</span>
              </div>
            </div>
          </div>

          {/* Posisi Ukur */}
          <div style={{ fontSize: 11, color: "#475569" }}>
            Metode Ukur: <strong style={{ color: "#0F172A" }}>{posisiText}</strong>
          </div>
        </div>

        {/* Peringatan Biologis jika ada */}
        {warnings.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {warnings.map((w, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 8,
                  padding: "9px 12px",
                  borderRadius: 10,
                  fontSize: 11,
                  lineHeight: 1.4,
                  background: w.tipe === "danger" ? "#FEF2F2" : w.tipe === "warning" ? "#FFFBEB" : "#F0FDF4",
                  border: `1px solid ${w.tipe === "danger" ? "#FECACA" : w.tipe === "warning" ? "#FDE68A" : "#BBF7D0"}`,
                  color: w.tipe === "danger" ? "#991B1B" : w.tipe === "warning" ? "#92400E" : "#166534",
                }}
              >
                {w.tipe === "danger" ? (
                  <AlertTriangle size={14} color="#DC2626" style={{ flexShrink: 0, marginTop: 1 }} />
                ) : w.tipe === "warning" ? (
                  <AlertTriangle size={14} color="#D97706" style={{ flexShrink: 0, marginTop: 1 }} />
                ) : (
                  <Info size={14} color="#16A34A" style={{ flexShrink: 0, marginTop: 1 }} />
                )}
                <span>{w.pesan}</span>
              </div>
            ))}
          </div>
        )}

        {/* Modal Actions */}
        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            style={{
              flex: 1,
              padding: "11px 0",
              borderRadius: 12,
              border: "1.5px solid #CBD5E1",
              background: "#FFFFFF",
              color: "#475569",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Koreksi Angka
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="btn-primary"
            style={{
              flex: 1.4,
              padding: "11px 0",
              borderRadius: 12,
              fontSize: 13,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <CheckCircle2 size={16} />
            <span>{loading ? "Memproses..." : "Ya, Data Benar"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
