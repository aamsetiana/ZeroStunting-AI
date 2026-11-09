"use client";

import { useState } from "react";
import {
  Building2, Plus, Check, Trash2, MapPin, Pencil, X,
  CheckCircle2, AlertCircle, Loader2, ArrowRight
} from "lucide-react";
import { type PosyanduItem, tambahPosyandu, updatePosyandu, hapusPosyandu } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";
import { useEffect } from "react";

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
  // Form Tambah Posyandu (Default kosong semua tanpa isi otomatis)
  const [nama, setNama] = useState("");
  const [desa, setDesa] = useState("");
  const [kecamatan, setKecamatan] = useState("");
  const [kabupaten, setKabupaten] = useState("");
  const [provinsi, setProvinsi] = useState("");

  // State Modal Ubah / Edit Posyandu
  const [editingPosyandu, setEditingPosyandu] = useState<PosyanduItem | null>(null);
  const [editNama, setEditNama] = useState("");
  const [editDesa, setEditDesa] = useState("");
  const [editKecamatan, setEditKecamatan] = useState("");
  const [editKabupaten, setEditKabupaten] = useState("");
  const [editProvinsi, setEditProvinsi] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // State Modal Hapus Konfirmasi
  const [deletingPosyandu, setDeletingPosyandu] = useState<PosyanduItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // UI State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const toast = useToast();

  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => {
        setFeedback(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  // 1. CREATE: Tambah Posyandu Baru
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim()) {
      toast.warning("Nama Posyandu wajib diisi.");
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

      const msg = `Posyandu "${created.nama}" berhasil disimpan ke database Supabase!`;
      toast.success(msg);
      setFeedback({
        type: "success",
        msg,
      });

      // Reset seluruh field form menjadi kosong kembali
      setNama("");
      setDesa("");
      setKecamatan("");
      setKabupaten("");
      setProvinsi("");

      await onRefresh();
      // Pilih otomatis posyandu yang baru ditambahkan
      onSelectPosyandu(created);
    } catch (err: unknown) {
      const error = err as Error;
      const errMsg = error.message || "Gagal menyimpan data posyandu ke database.";
      toast.error(errMsg);
      setFeedback({
        type: "error",
        msg: errMsg,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. UPDATE: Buka Modal Ubah
  const handleOpenEdit = (item: PosyanduItem) => {
    setEditingPosyandu(item);
    setEditNama(item.nama || "");
    setEditDesa(item.desa || "");
    setEditKecamatan(item.kecamatan || "");
    setEditKabupaten(item.kabupaten || "");
    setEditProvinsi(item.provinsi || "");
  };

  // 2. UPDATE: Simpan Perubahan ke Database
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPosyandu) return;
    if (!editNama.trim()) {
      toast.warning("Nama Posyandu tidak boleh kosong.");
      return;
    }

    setIsUpdating(true);
    try {
      const updated = await updatePosyandu(editingPosyandu.id, {
        nama: editNama.trim(),
        desa: editDesa.trim() || undefined,
        kecamatan: editKecamatan.trim() || undefined,
        kabupaten: editKabupaten.trim() || undefined,
        provinsi: editProvinsi.trim() || undefined,
      });

      const msg = `Perubahan data Posyandu "${updated.nama}" berhasil disimpan!`;
      toast.success(msg);
      setFeedback({
        type: "success",
        msg,
      });
      setEditingPosyandu(null);
      await onRefresh();
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(`Gagal memperbarui data posyandu: ${error.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  // 3. DELETE: Konfirmasi & Hapus Posyandu
  const handleConfirmDelete = async () => {
    if (!deletingPosyandu) return;

    if (posyanduList.length <= 1) {
      toast.warning("Tidak dapat menghapus posyandu terakhir. Sistem membutuhkan minimal satu unit posyandu.");
      setDeletingPosyandu(null);
      return;
    }

    setIsDeleting(true);
    try {
      await hapusPosyandu(deletingPosyandu.id);
      await onRefresh();
      const msg = `Posyandu "${deletingPosyandu.nama}" berhasil dihapus dari sistem.`;
      toast.success(msg);
      setFeedback({
        type: "success",
        msg,
      });
      setDeletingPosyandu(null);
    } catch (err: unknown) {
      const error = err as Error;
      const errMsg = error.message || "Gagal menghapus data posyandu.";
      toast.error(errMsg);
      setFeedback({
        type: "error",
        msg: errMsg,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const activeItem = posyanduList.find((p) => p.id === activePosyanduId) || posyanduList[0];

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24, paddingBottom: 40, width: "100%" }}>
      {/* ── 1. HEADER ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
        <div style={{ flex: "1 1 320px", minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              background: "#EFF6FF", color: "#1D4ED8",
              padding: "4px 10px", borderRadius: 99, fontSize: 12, fontWeight: 800,
              border: "1px solid #BFDBFE",
            }}>
              <Building2 size={14} /> OTORITAS PUSKESMAS • PEMBINAAN UNIT POSYANDU
            </span>
            <span style={{ fontSize: 13, color: "#64748B", fontWeight: 600 }}>
              Database PostgreSQL Supabase
            </span>
          </div>
          <h1 style={{ fontSize: "clamp(20px, 3vw, 25px)", fontWeight: 900, color: "#0F172A", margin: 0, letterSpacing: "-0.02em" }}>
            Pengelolaan Unit Posyandu
          </h1>
          <p style={{ fontSize: 13.5, color: "#475569", margin: "4px 0 0 0", lineHeight: 1.5 }}>
            Tambah, ubah, dan kelola unit Posyandu yang dibina oleh Puskesmas. Pengaturan unit posyandu tersinkronisasi terpusat.
          </p>
        </div>

        {activeItem && (
          <div style={{
            background: "#F0FDF4",
            border: "1.5px solid #BBF7D0",
            borderRadius: 14,
            padding: "10px 16px",
            display: "flex",
            alignItems: "center",
            gap: 12,
            boxShadow: "0 2px 8px rgba(22, 163, 74, 0.08)",
            flexShrink: 0,
            maxWidth: "100%",
          }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: "#16A34A", color: "white",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 800, fontSize: 15, flexShrink: 0,
              boxShadow: "0 2px 6px rgba(22, 163, 74, 0.25)",
            }}>
              <Building2 size={20} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 11, color: "#15803D", fontWeight: 800, letterSpacing: "0.02em" }}>POSYANDU AKTIF SAAT INI</div>
              <div style={{ fontSize: 14.5, fontWeight: 800, color: "#0F172A", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {activeItem.nama}
              </div>
              <div style={{ fontSize: 11.5, color: "#64748B", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {activeItem.desa ? `Desa ${activeItem.desa}` : ""} {activeItem.kecamatan ? `• Kec. ${activeItem.kecamatan}` : ""}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* FEEDBACK BANNER */}
      {feedback && (
        <div
          className="toast-enter"
          style={{
            padding: "12px 16px",
            borderRadius: 12,
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: feedback.type === "success" ? "#F0FDF4" : "#FEF2F2",
            border: `1.5px solid ${feedback.type === "success" ? "#86EFAC" : "#FECACA"}`,
            color: feedback.type === "success" ? "#166534" : "#991B1B",
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          {feedback.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{feedback.msg}</span>
        </div>
      )}

      {/* ── 2. GRID UTAMA: FORM TAMBAH (5 COL) & DAFTAR POSYANDU (7 COL) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* FORM TAMBAH POSYANDU BARU */}
        <div className="lg:col-span-5" style={{
          background: "#FFFFFF",
          border: "1.5px solid #E2E8F0",
          borderRadius: 16,
          padding: "22px 20px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: "#ECFDF5", color: "#10B981",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <Plus size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: "#0F172A", margin: 0 }}>
                Tambah Unit Posyandu
              </h2>
              <p style={{ fontSize: 12, color: "#64748B", margin: "2px 0 0 0" }}>
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
                placeholder="Contoh: Posyandu Melati 03"
                required
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: "1.5px solid #CBD5E1",
                  fontSize: 13.5,
                  outline: "none",
                  boxSizing: "border-box",
                  background: "#FFFFFF",
                }}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                  Desa / Kelurahan
                </label>
                <input
                  type="text"
                  value={desa}
                  onChange={(e) => setDesa(e.target.value)}
                  placeholder="Contoh: Karangkancana"
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: 8,
                    border: "1.5px solid #CBD5E1",
                    fontSize: 13,
                    boxSizing: "border-box",
                    background: "#FFFFFF",
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
                  placeholder="Contoh: Ciwaru"
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: 8,
                    border: "1.5px solid #CBD5E1",
                    fontSize: 13,
                    boxSizing: "border-box",
                    background: "#FFFFFF",
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                  Kabupaten / Kota
                </label>
                <input
                  type="text"
                  value={kabupaten}
                  onChange={(e) => setKabupaten(e.target.value)}
                  placeholder="Contoh: Kuningan"
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: 8,
                    border: "1.5px solid #CBD5E1",
                    fontSize: 13,
                    boxSizing: "border-box",
                    background: "#FFFFFF",
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
                  placeholder="Contoh: Jawa Barat"
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: 8,
                    border: "1.5px solid #CBD5E1",
                    fontSize: 13,
                    boxSizing: "border-box",
                    background: "#FFFFFF",
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !nama.trim()}
              style={{
                marginTop: 6,
                padding: "11px 18px",
                borderRadius: 10,
                border: "none",
                background: isSubmitting || !nama.trim() ? "#94A3B8" : "#16A34A",
                color: "#FFFFFF",
                fontSize: 13.5,
                fontWeight: 800,
                cursor: isSubmitting || !nama.trim() ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                boxShadow: "0 2px 6px rgba(22,163,74,0.25)",
                transition: "all 0.15s ease",
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

        {/* DAFTAR POSYANDU YANG TERDAFTAR (7 COL) */}
        <div className="lg:col-span-7" style={{
          background: "#FFFFFF",
          border: "1.5px solid #E2E8F0",
          borderRadius: 16,
          padding: "22px 20px",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: "#0F172A", margin: 0 }}>
                Daftar Posyandu Terdaftar
              </h2>
              <p style={{ fontSize: 12, color: "#64748B", margin: "2px 0 0 0" }}>
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
                padding: "6px 14px",
                fontSize: 12,
                fontWeight: 700,
                color: "#334155",
                cursor: "pointer",
                whiteSpace: "nowrap",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              Segarkan Data
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12, flex: 1, overflowY: "auto", maxHeight: 520, paddingRight: 2 }}>
            {posyanduList.map((p) => {
              const isActive = (activePosyanduId ? p.id === activePosyanduId : p.id === posyanduList[0]?.id);

              return (
                <div
                  key={p.id}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                    padding: "16px 18px",
                    borderRadius: 14,
                    border: isActive ? "2px solid #16A34A" : "1.5px solid #E2E8F0",
                    background: isActive ? "#F0FDF4" : "#FFFFFF",
                    boxShadow: isActive ? "0 4px 12px rgba(22, 163, 74, 0.08)" : "0 1px 2px rgba(0,0,0,0.02)",
                    transition: "all 0.15s ease",
                  }}
                >
                  {/* BARIS ATAS: Info Identitas Posyandu & Badge */}
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0, flex: "1 1 220px" }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 12,
                        background: isActive ? "#16A34A" : "#F1F5F9",
                        color: isActive ? "#FFFFFF" : "#64748B",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontWeight: 800, flexShrink: 0,
                        boxShadow: isActive ? "0 2px 6px rgba(22, 163, 74, 0.25)" : "none",
                      }}>
                        <Building2 size={20} />
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 16, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.01em" }}>
                            {p.nama}
                          </span>
                          {isActive && (
                            <span style={{
                              background: "#DCFCE7", color: "#15803D",
                              fontSize: 11, fontWeight: 800, padding: "2px 8px", borderRadius: 99,
                              border: "1px solid #BBF7D0", display: "inline-flex", alignItems: "center", gap: 4,
                              whiteSpace: "nowrap",
                            }}>
                              <Check size={11} strokeWidth={3} /> Aktif
                            </span>
                          )}
                        </div>
                        <div style={{
                          fontSize: 12.5, color: "#64748B",
                          display: "flex", alignItems: "center", gap: 5,
                          marginTop: 3, flexWrap: "wrap",
                        }}>
                          <MapPin size={13} color="#16A34A" style={{ flexShrink: 0 }} />
                          <span>
                            {p.desa ? `Desa ${p.desa}` : ""}
                            {p.kecamatan ? ` • Kec. ${p.kecamatan}` : ""}
                            {p.kabupaten ? ` • ${p.kabupaten}` : ""}
                            {p.provinsi ? ` • ${p.provinsi}` : ""}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Badge Jumlah Balita */}
                    <div style={{
                      background: isActive ? "#DCFCE7" : "#F8FAFC",
                      border: `1px solid ${isActive ? "#BBF7D0" : "#E2E8F0"}`,
                      padding: "4px 10px",
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 700,
                      color: isActive ? "#15803D" : "#475569",
                      whiteSpace: "nowrap",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                      alignSelf: "flex-start",
                      flexShrink: 0,
                    }}>
                      <span>👥</span>
                      <span><strong>{p.total_balita ?? 0}</strong> Balita</span>
                    </div>
                  </div>

                  {/* BARIS BAWAH: Tombol Aksi Lengkap & Rapi Tanpa Tabrakan */}
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: 10,
                    paddingTop: 10,
                    borderTop: `1px solid ${isActive ? "#DCFCE7" : "#F1F5F9"}`,
                  }}>
                    <div>
                      {!isActive ? (
                        <button
                          type="button"
                          onClick={() => {
                            onSelectPosyandu(p);
                            setFeedback({
                              type: "success",
                              msg: `Posyandu "${p.nama}" berhasil dipilih sebagai Posyandu aktif! Pengaturan tersimpan otomatis.`,
                            });
                          }}
                          style={{
                            background: "#FFFFFF",
                            border: "1.5px solid #16A34A",
                            color: "#16A34A",
                            borderRadius: 8,
                            padding: "6px 14px",
                            fontSize: 12.5,
                            fontWeight: 700,
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            whiteSpace: "nowrap",
                            transition: "all 0.15s ease",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#16A34A";
                            e.currentTarget.style.color = "#FFFFFF";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "#FFFFFF";
                            e.currentTarget.style.color = "#16A34A";
                          }}
                        >
                          <Check size={14} /> Pilih Sebagai Posyandu Aktif
                        </button>
                      ) : (
                        <span style={{
                          color: "#15803D",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          fontSize: 12.5,
                          fontWeight: 800,
                          whiteSpace: "nowrap",
                        }}>
                          <CheckCircle2 size={16} /> Sedang Digunakan untuk Penimbangan
                        </span>
                      )}
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto", flexWrap: "wrap" }}>
                      {/* Tombol Ubah */}
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(p)}
                        title="Ubah Data Posyandu"
                        style={{
                          background: "#FFFFFF",
                          border: "1.5px solid #CBD5E1",
                          color: "#0F172A",
                          cursor: "pointer",
                          padding: "6px 12px",
                          borderRadius: 8,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                          fontSize: 12,
                          fontWeight: 700,
                          whiteSpace: "nowrap",
                          transition: "all 0.15s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#F1F5F9";
                          e.currentTarget.style.borderColor = "#94A3B8";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "#FFFFFF";
                          e.currentTarget.style.borderColor = "#CBD5E1";
                        }}
                      >
                        <Pencil size={13} color="#2563EB" />
                        <span>Ubah</span>
                      </button>

                      {/* Tombol Hapus */}
                      {posyanduList.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setDeletingPosyandu(p)}
                          title="Hapus Posyandu"
                          style={{
                            background: "#FEF2F2",
                            border: "1.5px solid #FECACA",
                            color: "#DC2626",
                            cursor: "pointer",
                            padding: "6px 12px",
                            borderRadius: 8,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            fontSize: 12,
                            fontWeight: 700,
                            whiteSpace: "nowrap",
                            transition: "all 0.15s ease",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#FEE2E2";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "#FEF2F2";
                          }}
                        >
                          <Trash2 size={13} />
                          <span>Hapus</span>
                        </button>
                      )}
                    </div>
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
                whiteSpace: "nowrap",
                boxShadow: "0 2px 6px rgba(22,163,74,0.2)",
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
                whiteSpace: "nowrap",
              }}
            >
              Lihat Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* ── MODAL UBAH / EDIT POSYANDU ── */}
      {editingPosyandu && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(15, 23, 42, 0.6)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          padding: 16,
        }}>
          <div style={{
            background: "#FFFFFF",
            borderRadius: 18,
            width: "100%",
            maxWidth: 480,
            padding: 24,
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: "#EFF6FF", color: "#2563EB",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Pencil size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: 17, fontWeight: 800, color: "#0F172A", margin: 0 }}>
                    Ubah Data Posyandu
                  </h3>
                  <p style={{ fontSize: 12, color: "#64748B", margin: 0 }}>
                    Perbarui informasi unit posyandu di database Supabase
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingPosyandu(null)}
                style={{
                  background: "none", border: "none", color: "#64748B", cursor: "pointer",
                  padding: 4, borderRadius: 6, display: "flex", alignItems: "center",
                }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                  Nama Posyandu <span style={{ color: "#EF4444" }}>*</span>
                </label>
                <input
                  type="text"
                  value={editNama}
                  onChange={(e) => setEditNama(e.target.value)}
                  placeholder="Contoh: Posyandu Melati 03"
                  required
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 10,
                    border: "1.5px solid #CBD5E1",
                    fontSize: 13.5,
                    outline: "none",
                    boxSizing: "border-box",
                    background: "#FFFFFF",
                  }}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                    Desa / Kelurahan
                  </label>
                  <input
                    type="text"
                    value={editDesa}
                    onChange={(e) => setEditDesa(e.target.value)}
                    placeholder="Contoh: Karangkancana"
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: 8,
                      border: "1.5px solid #CBD5E1",
                      fontSize: 13,
                      boxSizing: "border-box",
                      background: "#FFFFFF",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                    Kecamatan
                  </label>
                  <input
                    type="text"
                    value={editKecamatan}
                    onChange={(e) => setEditKecamatan(e.target.value)}
                    placeholder="Contoh: Ciwaru"
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: 8,
                      border: "1.5px solid #CBD5E1",
                      fontSize: 13,
                      boxSizing: "border-box",
                      background: "#FFFFFF",
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                    Kabupaten / Kota
                  </label>
                  <input
                    type="text"
                    value={editKabupaten}
                    onChange={(e) => setEditKabupaten(e.target.value)}
                    placeholder="Contoh: Kuningan"
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: 8,
                      border: "1.5px solid #CBD5E1",
                      fontSize: 13,
                      boxSizing: "border-box",
                      background: "#FFFFFF",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                    Provinsi
                  </label>
                  <input
                    type="text"
                    value={editProvinsi}
                    onChange={(e) => setEditProvinsi(e.target.value)}
                    placeholder="Contoh: Jawa Barat"
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: 8,
                      border: "1.5px solid #CBD5E1",
                      fontSize: 13,
                      boxSizing: "border-box",
                      background: "#FFFFFF",
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setEditingPosyandu(null)}
                  disabled={isUpdating}
                  style={{
                    padding: "9px 16px",
                    borderRadius: 8,
                    border: "1.5px solid #CBD5E1",
                    background: "#FFFFFF",
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#475569",
                    cursor: "pointer",
                  }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isUpdating || !editNama.trim()}
                  style={{
                    padding: "9px 18px",
                    borderRadius: 8,
                    border: "none",
                    background: isUpdating || !editNama.trim() ? "#94A3B8" : "#2563EB",
                    color: "#FFFFFF",
                    fontSize: 13,
                    fontWeight: 800,
                    cursor: isUpdating || !editNama.trim() ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  {isUpdating ? (
                    <>
                      <Loader2 size={15} className="animate-spin" /> Menyimpan...
                    </>
                  ) : (
                    <>
                      <Check size={15} /> Simpan Perubahan
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL KONFIRMASI HAPUS POSYANDU ── */}
      {deletingPosyandu && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(15, 23, 42, 0.6)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          padding: 16,
        }}>
          <div style={{
            background: "#FFFFFF",
            borderRadius: 16,
            width: "100%",
            maxWidth: 420,
            padding: 24,
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 42, height: 42, borderRadius: 12,
                background: "#FEE2E2", color: "#DC2626",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Trash2 size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: "#0F172A", margin: 0 }}>
                  Hapus Unit Posyandu?
                </h3>
                <p style={{ fontSize: 13, color: "#64748B", margin: "2px 0 0 0" }}>
                  Tindakan ini tidak dapat dibatalkan.
                </p>
              </div>
            </div>

            <p style={{ fontSize: 14, color: "#334155", margin: 0, lineHeight: 1.5 }}>
              Apakah Anda yakin ingin menghapus <strong>{deletingPosyandu.nama}</strong>? Data unit posyandu ini akan dihapus permanen dari Supabase.
            </p>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
              <button
                type="button"
                onClick={() => setDeletingPosyandu(null)}
                disabled={isDeleting}
                style={{
                  padding: "9px 16px",
                  borderRadius: 8,
                  border: "1.5px solid #CBD5E1",
                  background: "#FFFFFF",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#475569",
                  cursor: "pointer",
                }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                style={{
                  padding: "9px 18px",
                  borderRadius: 8,
                  border: "none",
                  background: isDeleting ? "#94A3B8" : "#DC2626",
                  color: "#FFFFFF",
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: isDeleting ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                {isDeleting ? (
                  <>
                    <Loader2 size={15} className="animate-spin" /> Menghapus...
                  </>
                ) : (
                  <>
                    <Trash2 size={15} /> Ya, Hapus Posyandu
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
