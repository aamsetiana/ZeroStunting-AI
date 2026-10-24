"use client";

import { useState } from "react";
import {
  Building2, Plus, Check, Trash2, MapPin,
  CheckCircle2, AlertCircle, Loader2, ArrowRight
} from "lucide-react";
import { type PosyanduItem, tambahPosyandu, hapusPosyandu } from "@/lib/utils";

interface KelolaPosyanduProps {
  posyanduList: PosyanduItem[];
  activePosyanduId?: string;
  onSelectPosyandu: (posyandu: PosyanduItem) => void;
  onRefresh: () => Promise<void>;
  onNavInput: () => void;
  onNavDashboard: () => void;
}

export function KelolaPosyandu({
  posyanduList,
  activePosyanduId,
  onSelectPosyandu,
  onRefresh,
  onNavInput,
  onNavDashboard,
}: KelolaPosyanduProps) {
  // Form State
  const [nama, setNama] = useState("");
  const [desa, setDesa] = useState("Sukamaju");
  const [kecamatan, setKecamatan] = useState("Ciawi");
  const [kabupaten, setKabupaten] = useState("Bogor");
  const [provinsi, setProvinsi] = useState("Jawa Barat");

  // UI State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim()) {
      setFeedback({ type: "error", msg: "Nama Posyandu wajib diisi." });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);
    try {
      const created = await tambahPosyandu({
        nama: nama.trim(),
        desa: desa.trim() || undefined,
        kecamatan: kecamatan.trim() || undefined,
        kabupaten: kabupaten.trim() || undefined,
        provinsi: provinsi.trim() || undefined,
      });

      setFeedback({
        type: "success",
        msg: `Posyandu "${created.nama}" berhasil disimpan ke database Supabase!`,
      });
      setNama("");
      await onRefresh();
      // Pilih otomatis posyandu yang baru ditambahkan
      onSelectPosyandu(created);
    } catch (err: unknown) {
      const error = err as Error;
      setFeedback({
        type: "error",
        msg: error.message || "Gagal menyimpan data posyandu ke database.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (item: PosyanduItem) => {
    if (posyanduList.length <= 1) {
      alert("Tidak dapat menghapus posyandu terakhir. Sistem membutuhkan minimal satu unit posyandu.");
      return;
    }

    if (!confirm(`Yakin ingin menghapus ${item.nama}? Data posyandu ini akan dihapus dari Supabase.`)) {
      return;
    }

    setDeletingId(item.id);
    try {
      await hapusPosyandu(item.id);
      await onRefresh();
      setFeedback({
        type: "success",
        msg: `Posyandu "${item.nama}" berhasil dihapus.`,
      });
    } catch (err: unknown) {
      const error = err as Error;
      setFeedback({
        type: "error",
        msg: error.message || "Gagal menghapus data posyandu.",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const activeItem = posyanduList.find((p) => p.id === activePosyanduId) || posyanduList[0];

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24, paddingBottom: 40 }}>
      {/* ── 1. HEADER ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 14 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              background: "#DCFCE7", color: "#15803D",
              padding: "4px 10px", borderRadius: 99, fontSize: 12, fontWeight: 800,
            }}>
              <Building2 size={14} /> UNIT PELAYANAN DESA
            </span>
            <span style={{ fontSize: 13, color: "#64748B", fontWeight: 600 }}>
              Database PostgreSQL Supabase
            </span>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: "#0F172A", margin: 0, letterSpacing: "-0.02em" }}>
            Pengelolaan Unit Posyandu
          </h1>
          <p style={{ fontSize: 14, color: "#475569", margin: "4px 0 0 0" }}>
            Tambah dan kelola unit Posyandu yang Anda bina. Pilih Posyandu aktif untuk mencatat penimbangan balita.
          </p>
        </div>

        {activeItem && (
          <div style={{
            background: "#F0FDF4",
            border: "1.5px solid #BBF7D0",
            borderRadius: 12,
            padding: "10px 16px",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: "#16A34A", color: "white",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 800, fontSize: 15,
            }}>
              <Building2 size={20} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: "#15803D", fontWeight: 800 }}>POSYANDU AKTIF SAAT INI</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#0F172A" }}>{activeItem.nama}</div>
              <div style={{ fontSize: 11, color: "#64748B" }}>
                {activeItem.desa ? `Desa ${activeItem.desa}` : ""} {activeItem.kecamatan ? `• Kec. ${activeItem.kecamatan}` : ""}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* FEEDBACK BANNER */}
      {feedback && (
        <div style={{
          padding: "12px 16px",
          borderRadius: 10,
          display: "flex",
          alignItems: "center",
          gap: 10,
          background: feedback.type === "success" ? "#F0FDF4" : "#FEF2F2",
          border: `1.5px solid ${feedback.type === "success" ? "#86EFAC" : "#FECACA"}`,
          color: feedback.type === "success" ? "#166534" : "#991B1B",
          fontSize: 13,
          fontWeight: 700,
        }}>
          {feedback.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{feedback.msg}</span>
        </div>
      )}

      {/* ── 2. GRID UTAMA: FORM TAMBAH & DAFTAR POSYANDU ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
        gap: 22,
      }}>
        {/* FORM TAMBAH POSYANDU BARU */}
        <div style={{
          background: "#FFFFFF",
          border: "1.5px solid #E2E8F0",
          borderRadius: 16,
          padding: 24,
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: "#ECFDF5", color: "#10B981",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Plus size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: "#0F172A", margin: 0 }}>
                Tambah Unit Posyandu
              </h2>
              <p style={{ fontSize: 12, color: "#64748B", margin: 0 }}>
                Data akan tersimpan langsung ke database Supabase
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                Nama Posyandu <span style={{ color: "#EF4444" }}>*</span>
              </label>
              <input
                type="text"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                placeholder="Contoh: Posyandu Mawar 02"
                required
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: "1.5px solid #CBD5E1",
                  fontSize: 14,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                  Desa / Kelurahan
                </label>
                <input
                  type="text"
                  value={desa}
                  onChange={(e) => setDesa(e.target.value)}
                  placeholder="Sukamaju"
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: 8,
                    border: "1.5px solid #CBD5E1",
                    fontSize: 13,
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                  Kecamatan
                </label>
                <input
                  type="text"
                  value={kecamatan}
                  onChange={(e) => setKecamatan(e.target.value)}
                  placeholder="Ciawi"
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: 8,
                    border: "1.5px solid #CBD5E1",
                    fontSize: 13,
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                  Kabupaten / Kota
                </label>
                <input
                  type="text"
                  value={kabupaten}
                  onChange={(e) => setKabupaten(e.target.value)}
                  placeholder="Bogor"
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: 8,
                    border: "1.5px solid #CBD5E1",
                    fontSize: 13,
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                  Provinsi
                </label>
                <input
                  type="text"
                  value={provinsi}
                  onChange={(e) => setProvinsi(e.target.value)}
                  placeholder="Jawa Barat"
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: 8,
                    border: "1.5px solid #CBD5E1",
                    fontSize: 13,
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !nama.trim()}
              style={{
                marginTop: 8,
                padding: "12px 18px",
                borderRadius: 10,
                border: "none",
                background: isSubmitting || !nama.trim() ? "#94A3B8" : "#16A34A",
                color: "#FFFFFF",
                fontSize: 14,
                fontWeight: 800,
                cursor: isSubmitting || !nama.trim() ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                boxShadow: "0 2px 6px rgba(22,163,74,0.25)",
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Menyimpan ke Supabase...
                </>
              ) : (
                <>
                  <Plus size={16} />
                  Simpan Unit Posyandu Baru
                </>
              )}
            </button>
          </form>
        </div>

        {/* DAFTAR POSYANDU YANG TERDAFTAR */}
        <div style={{
          background: "#FFFFFF",
          border: "1.5px solid #E2E8F0",
          borderRadius: 16,
          padding: 24,
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: "#0F172A", margin: 0 }}>
                Daftar Posyandu Terdaftar
              </h2>
              <p style={{ fontSize: 12, color: "#64748B", margin: 0 }}>
                Total <strong>{posyanduList.length}</strong> unit posyandu di database
              </p>
            </div>
            <button
              type="button"
              onClick={() => onRefresh()}
              style={{
                background: "#F8FAFC",
                border: "1px solid #CBD5E1",
                borderRadius: 8,
                padding: "6px 12px",
                fontSize: 12,
                fontWeight: 700,
                color: "#334155",
                cursor: "pointer",
              }}
            >
              Segarkan
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1, overflowY: "auto", maxHeight: 380 }}>
            {posyanduList.map((p) => {
              const isActive = (activePosyanduId ? p.id === activePosyanduId : p.id === posyanduList[0]?.id);
              const isDeleting = deletingId === p.id;

              return (
                <div
                  key={p.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "14px 16px",
                    borderRadius: 12,
                    border: isActive ? "2px solid #16A34A" : "1.5px solid #E2E8F0",
                    background: isActive ? "#F0FDF4" : "#FFFFFF",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10,
                      background: isActive ? "#16A34A" : "#F1F5F9",
                      color: isActive ? "#FFFFFF" : "#64748B",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontWeight: 800,
                    }}>
                      <Building2 size={18} />
                    </div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 15, fontWeight: 800, color: "#0F172A" }}>
                          {p.nama}
                        </span>
                        {isActive && (
                          <span style={{
                            background: "#DCFCE7", color: "#15803D",
                            fontSize: 11, fontWeight: 800, padding: "2px 8px", borderRadius: 99,
                            border: "1px solid #BBF7D0",
                          }}>
                            Aktif
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: "#64748B", display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                        <MapPin size={12} />
                        <span>{p.desa ? `Desa ${p.desa}` : ""} {p.kecamatan ? `• Kec. ${p.kecamatan}` : ""}</span>
                        <span style={{ marginLeft: 8, color: "#334155", fontWeight: 700 }}>
                          • {p.total_balita ?? 0} balita
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {!isActive ? (
                      <button
                        type="button"
                        onClick={() => onSelectPosyandu(p)}
                        style={{
                          background: "#FFFFFF",
                          border: "1.5px solid #CBD5E1",
                          borderRadius: 8,
                          padding: "6px 12px",
                          fontSize: 12,
                          fontWeight: 700,
                          color: "#1E293B",
                          cursor: "pointer",
                        }}
                      >
                        Pilih Aktif
                      </button>
                    ) : (
                      <span style={{ color: "#16A34A", display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 800 }}>
                        <Check size={16} /> Terpilih
                      </span>
                    )}

                    {posyanduList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleDelete(p)}
                        disabled={isDeleting}
                        title="Hapus Posyandu"
                        style={{
                          background: "none",
                          border: "none",
                          color: "#DC2626",
                          cursor: isDeleting ? "not-allowed" : "pointer",
                          padding: 6,
                          borderRadius: 6,
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Action Footer */}
          <div style={{
            marginTop: 18,
            paddingTop: 16,
            borderTop: "1px solid #F1F5F9",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 10,
          }}>
            <button
              type="button"
              onClick={onNavInput}
              style={{
                background: "#16A34A",
                color: "#FFFFFF",
                border: "none",
                borderRadius: 8,
                padding: "8px 16px",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              Mulai Input Balita di Posyandu Ini <ArrowRight size={14} />
            </button>

            <button
              type="button"
              onClick={onNavDashboard}
              style={{
                background: "#F8FAFC",
                color: "#334155",
                border: "1px solid #CBD5E1",
                borderRadius: 8,
                padding: "8px 14px",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Lihat Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
