"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import {
  Baby, Scale, Ruler, Calendar, User, Activity,
  AlertCircle, AlertTriangle, ChevronDown, ChevronUp, RotateCcw
} from "lucide-react";
import {
  balitaFormSchema,
  type BalitaFormData,
  periksaKewajaranBiologis,
  getRentangWajar,
  sanitizeDecimalInput,
  type PlausibilityWarning,
} from "@/lib/validations";

const INITIAL_FORM_DATA = {
  nama_anak: "",
  jenis_kelamin: "L" as "L" | "P",
  umur_bulan: "",
  berat_kg: "",
  tinggi_cm: "",
  lingkar_kepala_cm: "",
  lingkar_lengan_cm: "",
  posisi_pengukuran: "telentang" as "telentang" | "berdiri",
  nama_ibu: "",
  dusun_rt: "",
  catatan_kader: "",
};

interface ManualFormProps {
  onSubmitValid: (data: BalitaFormData) => Promise<void> | void;
  loading?: boolean;
  prefillData?: Partial<BalitaFormData> | null;
  resetKey?: number;
  onReset?: () => void;
}

export function ManualForm({
  onSubmitValid,
  loading = false,
  prefillData,
  resetKey,
  onReset,
}: ManualFormProps) {
  const firstInputRef = useRef<HTMLInputElement>(null);
  const beratInputRef = useRef<HTMLInputElement>(null);
  const tinggiInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    nama_anak: prefillData?.nama_anak ?? "",
    jenis_kelamin: (prefillData?.jenis_kelamin as "L" | "P") ?? "L",
    umur_bulan: prefillData?.umur_bulan != null ? String(prefillData.umur_bulan) : "",
    berat_kg: prefillData?.berat_kg != null ? String(prefillData.berat_kg) : "",
    tinggi_cm: prefillData?.tinggi_cm != null ? String(prefillData.tinggi_cm) : "",
    lingkar_kepala_cm: prefillData?.lingkar_kepala_cm != null ? String(prefillData.lingkar_kepala_cm) : "",
    lingkar_lengan_cm: prefillData?.lingkar_lengan_cm != null ? String(prefillData.lingkar_lengan_cm) : "",
    posisi_pengukuran: "telentang" as "telentang" | "berdiri",
    nama_ibu: "",
    dusun_rt: "",
    catatan_kader: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showOptional, setShowOptional] = useState(false);

  // Modal konfirmasi jika terdeteksi nilai ekstrem
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingData, setPendingData] = useState<BalitaFormData | null>(null);
  const [hasConfirmedExtreme, setHasConfirmedExtreme] = useState(false);

  // Parse angka untuk kalkulasi panduan & validasi real-time
  const ageNum = formData.umur_bulan !== "" ? Number(formData.umur_bulan) : NaN;
  const weightNum = formData.berat_kg !== "" ? Number(formData.berat_kg) : NaN;
  const heightNum = formData.tinggi_cm !== "" ? Number(formData.tinggi_cm) : NaN;

  // Panduan rentang wajar WHO sesuai umur
  const rentangWajar = useMemo(() => {
    if (!isNaN(ageNum) && ageNum >= 0 && ageNum <= 60) {
      return getRentangWajar(ageNum);
    }
    return null;
  }, [ageNum]);

  // Pemeriksaan kewajaran biologis real-time
  const plausibilityWarnings = useMemo(() => {
    if (isNaN(ageNum) || isNaN(weightNum) || isNaN(heightNum)) return [];
    return periksaKewajaranBiologis({
      umur_bulan: ageNum,
      berat_kg: weightNum,
      tinggi_cm: heightNum,
      posisi_pengukuran: formData.posisi_pengukuran,
    });
  }, [ageNum, weightNum, heightNum, formData.posisi_pengukuran]);

  // Autofocus langsung ke inputan pertama (Nama Balita) saat awal mount & setiap kali form di-reset
  useEffect(() => {
    const timer = setTimeout(() => {
      if (firstInputRef.current) {
        firstInputRef.current.focus();
      }
    }, 80);
    return () => clearTimeout(timer);
  }, [resetKey]);

  // Sync state when resetKey changes (otomatis reset saat simpan sukses)
  const [lastResetKey, setLastResetKey] = useState(resetKey);
  if (resetKey !== undefined && resetKey !== lastResetKey) {
    setLastResetKey(resetKey);
    setFormData(INITIAL_FORM_DATA);
    setErrors({});
    setShowOptional(false);
    setShowConfirmModal(false);
    setPendingData(null);
    setHasConfirmedExtreme(false);
  }

  // Sync state when prefillData changes
  const [lastPrefill, setLastPrefill] = useState(prefillData);
  if (prefillData !== lastPrefill) {
    setLastPrefill(prefillData);
    if (prefillData) {
      setFormData(p => ({
        ...p,
        nama_anak: prefillData.nama_anak ?? p.nama_anak,
        jenis_kelamin: prefillData.jenis_kelamin ?? p.jenis_kelamin,
        umur_bulan: prefillData.umur_bulan != null ? String(prefillData.umur_bulan) : p.umur_bulan,
        berat_kg: prefillData.berat_kg != null ? String(prefillData.berat_kg) : p.berat_kg,
        tinggi_cm: prefillData.tinggi_cm != null ? String(prefillData.tinggi_cm) : p.tinggi_cm,
        lingkar_kepala_cm: prefillData.lingkar_kepala_cm != null ? String(prefillData.lingkar_kepala_cm) : p.lingkar_kepala_cm,
        lingkar_lengan_cm: prefillData.lingkar_lengan_cm != null ? String(prefillData.lingkar_lengan_cm) : p.lingkar_lengan_cm,
      }));
    } else if (prefillData === null && lastPrefill !== null) {
      // Prefill dibersihkan -> kosongkan inputan
      setFormData(INITIAL_FORM_DATA);
      setErrors({});
      setShowConfirmModal(false);
      setPendingData(null);
      setHasConfirmedExtreme(false);
    }
  }

  const handleResetForm = () => {
    setFormData(INITIAL_FORM_DATA);
    setErrors({});
    setShowOptional(false);
    setShowConfirmModal(false);
    setPendingData(null);
    setHasConfirmedExtreme(false);
    if (onReset) onReset();
    setTimeout(() => {
      firstInputRef.current?.focus();
    }, 50);
  };

  const clearFieldError = (field: string) => {
    setErrors(prev => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const rawData = {
      nama_anak: formData.nama_anak.trim(),
      jenis_kelamin: formData.jenis_kelamin,
      umur_bulan: formData.umur_bulan === "" ? undefined : Number(formData.umur_bulan),
      berat_kg: formData.berat_kg === "" ? undefined : Number(formData.berat_kg),
      tinggi_cm: formData.tinggi_cm === "" ? undefined : Number(formData.tinggi_cm),
      lingkar_kepala_cm: formData.lingkar_kepala_cm === "" ? undefined : Number(formData.lingkar_kepala_cm),
      lingkar_lengan_cm: formData.lingkar_lengan_cm === "" ? undefined : Number(formData.lingkar_lengan_cm),
      posisi_pengukuran: formData.posisi_pengukuran,
      nama_ibu: formData.nama_ibu.trim(),
      dusun_rt: formData.dusun_rt.trim(),
      catatan_kader: formData.catatan_kader.trim(),
    };

    const result = balitaFormSchema.safeParse(rawData);

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach(issue => {
        const path = issue.path[0] as string;
        if (path && !fieldErrors[path]) {
          fieldErrors[path] = issue.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    // Periksa apakah ada anomali pengukuran ekstrem (danger)
    const dangerWarnings = plausibilityWarnings.filter(w => w.tipe === "danger");
    if (dangerWarnings.length > 0 && !hasConfirmedExtreme) {
      setPendingData(result.data);
      setShowConfirmModal(true);
      return;
    }

    // Langsung proses kalkulasi
    await onSubmitValid(result.data);
  };

  const labelStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 13,
    color: "#334155",
    fontWeight: 700,
    marginBottom: 6,
  };

  return (
    <div
      style={{
        background: "#FFFFFF",
        border: "1.5px solid #E2E8F0",
        borderRadius: 20,
        padding: 24,
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.03)",
      }}
    >
      {/* Header Form Bersih */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18, gap: 10 }}>
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
            <Baby size={18} color="#15803D" />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#0F172A" }}>
              Input Pengukuran Balita
            </div>
          </div>
        </div>

        {/* Tombol Cepat Kosongkan Inputan */}
        <button
          type="button"
          onClick={handleResetForm}
          title="Kosongkan semua isian form"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            fontSize: 12,
            fontWeight: 700,
            color: "#64748B",
            background: "#F8FAFC",
            border: "1px solid #E2E8F0",
            borderRadius: 8,
            padding: "5px 10px",
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.color = "#DC2626";
            e.currentTarget.style.borderColor = "#FECACA";
            e.currentTarget.style.background = "#FEF2F2";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color = "#64748B";
            e.currentTarget.style.borderColor = "#E2E8F0";
            e.currentTarget.style.background = "#F8FAFC";
          }}
        >
          <RotateCcw size={12} />
          <span>Kosongkan Form</span>
        </button>
      </div>

      <form onSubmit={handleFormSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Nama Balita - Wajib Diisi */}
        <div>
          <label style={labelStyle}>
            <User size={14} color="#16A34A" /> Nama Balita
            <span style={{ color: "#DC2626", marginLeft: 2 }}>*</span>
          </label>
          <input
            ref={firstInputRef}
            autoFocus
            type="text"
            className="input-field"
            placeholder="Masukkan nama lengkap balita"
            required
            value={formData.nama_anak}
            onChange={e => {
              setFormData(p => ({ ...p, nama_anak: e.target.value }));
              clearFieldError("nama_anak");
            }}
          />
          {errors.nama_anak && (
            <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#DC2626", fontSize: 12, marginTop: 4 }}>
              <AlertCircle size={13} /> {errors.nama_anak}
            </div>
          )}
        </div>

        {/* Jenis Kelamin */}
        <div>
          <label style={labelStyle}>
            Jenis Kelamin
            <span style={{ color: "#DC2626", marginLeft: 2 }}>*</span>
          </label>
          <div style={{ display: "flex", gap: 10 }}>
            {(["L", "P"] as const).map(g => (
              <button
                key={g}
                type="button"
                onClick={() => setFormData(p => ({ ...p, jenis_kelamin: g }))}
                style={{
                  flex: 1,
                  padding: "10px 0",
                  borderRadius: 12,
                  border: formData.jenis_kelamin === g ? "1.5px solid #16A34A" : "1.5px solid #CBD5E1",
                  background: formData.jenis_kelamin === g ? "#DCFCE7" : "#FFFFFF",
                  color: formData.jenis_kelamin === g ? "#15803D" : "#475569",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                {g === "L" ? "Laki-laki" : "Perempuan"}
              </button>
            ))}
          </div>
        </div>

        {/* Umur Balita */}
        <div>
          <label style={labelStyle}>
            <Calendar size={14} color="#16A34A" /> Umur Balita
            <span style={{ color: "#DC2626", marginLeft: 2 }}>*</span>
          </label>
          <div style={{ position: "relative" }}>
            <input
              type="number"
              min={0}
              max={60}
              step={1}
              required
              className="input-field"
              placeholder="Masukkan umur balita (bulan)"
              style={{ paddingRight: 56 }}
              value={formData.umur_bulan}
              onChange={e => {
                const val = e.target.value;
                const ageNum = parseInt(val);
                const pos = !isNaN(ageNum) && ageNum >= 24 ? "berdiri" : "telentang";
                setFormData(p => ({ ...p, umur_bulan: val, posisi_pengukuran: pos }));
                clearFieldError("umur_bulan");
              }}
            />
            <span
              style={{
                position: "absolute",
                right: 14,
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: 13,
                color: "#64748B",
                fontWeight: 600,
              }}
            >
              bulan
            </span>
          </div>
          {errors.umur_bulan && (
            <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#DC2626", fontSize: 12, marginTop: 4 }}>
              <AlertCircle size={13} /> {errors.umur_bulan}
            </div>
          )}
        </div>

        {/* Berat & Tinggi Badan */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {/* Berat Badan */}
          <div>
            <label style={labelStyle}>
              <Scale size={14} color="#16A34A" /> Berat Badan
              <span style={{ color: "#DC2626", marginLeft: 2 }}>*</span>
            </label>
            <div style={{ position: "relative" }}>
              <input
                ref={beratInputRef}
                type="text"
                inputMode="decimal"
                required
                className="input-field"
                placeholder="Contoh: 8.5"
                style={{ paddingRight: 38 }}
                value={formData.berat_kg}
                onChange={e => {
                  const val = sanitizeDecimalInput(e.target.value);
                  setFormData(p => ({ ...p, berat_kg: val }));
                  clearFieldError("berat_kg");
                  setHasConfirmedExtreme(false);
                }}
              />
              <span
                style={{
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  fontSize: 13,
                  color: "#64748B",
                  fontWeight: 600,
                }}
              >
                kg
              </span>
            </div>
            {errors.berat_kg && (
              <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#DC2626", fontSize: 12, marginTop: 4 }}>
                <AlertCircle size={13} /> {errors.berat_kg}
              </div>
            )}
          </div>

          {/* Tinggi Badan */}
          <div>
            <label style={labelStyle}>
              <Ruler size={14} color="#16A34A" /> Tinggi Badan
              <span style={{ color: "#DC2626", marginLeft: 2 }}>*</span>
            </label>
            <div style={{ position: "relative" }}>
              <input
                ref={tinggiInputRef}
                type="text"
                inputMode="decimal"
                required
                className="input-field"
                placeholder="Contoh: 74.5"
                style={{ paddingRight: 38 }}
                value={formData.tinggi_cm}
                onChange={e => {
                  const val = sanitizeDecimalInput(e.target.value);
                  setFormData(p => ({ ...p, tinggi_cm: val }));
                  clearFieldError("tinggi_cm");
                  setHasConfirmedExtreme(false);
                }}
              />
              <span
                style={{
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  fontSize: 13,
                  color: "#64748B",
                  fontWeight: 600,
                }}
              >
                cm
              </span>
            </div>
            {errors.tinggi_cm && (
              <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#DC2626", fontSize: 12, marginTop: 4 }}>
                <AlertCircle size={13} /> {errors.tinggi_cm}
              </div>
            )}
          </div>
        </div>

        {/* Info Panduan Rentang Wajar WHO Sesuai Umur */}
        {rentangWajar && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "7px 12px",
              background: "#F0FDF4",
              border: "1px solid #BBF7D0",
              borderRadius: 10,
              fontSize: 12,
              color: "#166534",
              fontWeight: 600,
            }}
          >
            <span style={{ fontSize: 13 }}>💡</span>
            <span>
              <strong>Rentang Baku Usia {ageNum} Bulan:</strong> BB {rentangWajar.bbMin}–{rentangWajar.bbMax} kg • PB/TB {rentangWajar.tbMin}–{rentangWajar.tbMax} cm
            </span>
          </div>
        )}

        {/* Peringatan Real-Time Nilai Tidak Lazim / Anomali Biologis */}
        {plausibilityWarnings.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {plausibilityWarnings.map((w, idx) => {
              const isDanger = w.tipe === "danger";
              const isWarning = w.tipe === "warning";
              const bgColor = isDanger ? "#FEF2F2" : isWarning ? "#FFFBEB" : "#F0FDF4";
              const borderColor = isDanger ? "#FECACA" : isWarning ? "#FDE68A" : "#BBF7D0";
              const textColor = isDanger ? "#B91C1C" : isWarning ? "#B45309" : "#15803D";

              return (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 8,
                    padding: "9px 12px",
                    background: bgColor,
                    border: `1.5px solid ${borderColor}`,
                    borderRadius: 10,
                    fontSize: 12,
                    color: textColor,
                    fontWeight: 600,
                    lineHeight: 1.45,
                  }}
                >
                  <AlertTriangle size={15} color={textColor} style={{ flexShrink: 0, marginTop: 1 }} />
                  <span>{w.pesan}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Lingkar Kepala & Lingkar Lengan (Opsional) */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {/* Lingkar Kepala */}
          <div>
            <label style={labelStyle}>
              <Activity size={14} color="#16A34A" /> Lingkar Kepala
              <span style={{ fontSize: 11, color: "#64748B", fontWeight: 500 }}>(Opsional)</span>
            </label>
            <div style={{ position: "relative" }}>
              <input
                type="text"
                inputMode="decimal"
                className="input-field"
                placeholder="Contoh: 45.0"
                style={{ paddingRight: 38 }}
                value={formData.lingkar_kepala_cm}
                onChange={e => {
                  const val = sanitizeDecimalInput(e.target.value);
                  setFormData(p => ({ ...p, lingkar_kepala_cm: val }));
                  clearFieldError("lingkar_kepala_cm");
                }}
              />
              <span
                style={{
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  fontSize: 13,
                  color: "#64748B",
                  fontWeight: 600,
                }}
              >
                cm
              </span>
            </div>
            {errors.lingkar_kepala_cm && (
              <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#DC2626", fontSize: 12, marginTop: 4 }}>
                <AlertCircle size={13} /> {errors.lingkar_kepala_cm}
              </div>
            )}
          </div>

          {/* Lingkar Lengan (LiLA) */}
          <div>
            <label style={labelStyle}>
              <Activity size={14} color="#16A34A" /> Lingkar Lengan / LiLA
              <span style={{ fontSize: 11, color: "#64748B", fontWeight: 500 }}>(Opsional)</span>
            </label>
            <div style={{ position: "relative" }}>
              <input
                type="text"
                inputMode="decimal"
                className="input-field"
                placeholder="Contoh: 14.0"
                style={{ paddingRight: 38 }}
                value={formData.lingkar_lengan_cm}
                onChange={e => {
                  const val = sanitizeDecimalInput(e.target.value);
                  setFormData(p => ({ ...p, lingkar_lengan_cm: val }));
                  clearFieldError("lingkar_lengan_cm");
                }}
              />
              <span
                style={{
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  fontSize: 13,
                  color: "#64748B",
                  fontWeight: 600,
                }}
              >
                cm
              </span>
            </div>
            {errors.lingkar_lengan_cm && (
              <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#DC2626", fontSize: 12, marginTop: 4 }}>
                <AlertCircle size={13} /> {errors.lingkar_lengan_cm}
              </div>
            )}
          </div>
        </div>

        {/* Posisi Pengukuran */}
        <div>
          <label style={labelStyle}>
            Posisi Pengukuran
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            {[
              { id: "telentang", label: "Telentang (PB)" },
              { id: "berdiri", label: "Berdiri (TB)" },
            ].map(m => (
              <button
                key={m.id}
                type="button"
                onClick={() => setFormData(p => ({ ...p, posisi_pengukuran: m.id as "telentang" | "berdiri" }))}
                style={{
                  flex: 1,
                  padding: "9px 8px",
                  borderRadius: 10,
                  border: formData.posisi_pengukuran === m.id ? "1.5px solid #16A34A" : "1px solid #CBD5E1",
                  background: formData.posisi_pengukuran === m.id ? "#DCFCE7" : "#FFFFFF",
                  color: formData.posisi_pengukuran === m.id ? "#15803D" : "#64748B",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Data Tambahan (Opsional) */}
        <div>
          <button
            type="button"
            onClick={() => setShowOptional(!showOptional)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: "6px 0",
              color: "#64748B",
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            <span>+ Data Tambahan (Opsional)</span>
            {showOptional ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {showOptional && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8, padding: 12, background: "#F8FAF8", borderRadius: 12, border: "1px solid #E2E8F0" }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                  Nama Ibu
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Masukkan nama ibu / orang tua"
                  value={formData.nama_ibu}
                  onChange={e => setFormData(p => ({ ...p, nama_ibu: e.target.value }))}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                  Wilayah / RT
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Masukkan nama dusun, RT, atau alamat"
                  value={formData.dusun_rt}
                  onChange={e => setFormData(p => ({ ...p, dusun_rt: e.target.value }))}
                />
              </div>
            </div>
          )}
        </div>

        {/* Tombol Hitung */}
        <button
          type="submit"
          disabled={loading}
          className="btn-primary"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            fontSize: 14,
            padding: "12px 20px",
            borderRadius: 12,
            marginTop: 4,
          }}
        >
          <Scale size={18} />
          <span>{loading ? "Menghitung..." : "Hitung Status Gizi"}</span>
        </button>
      </form>

      {/* MODAL KONFIRMASI PENGUKURAN TIDAK LAZIM / EKSTREM */}
      {showConfirmModal && pendingData && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 99999,
            padding: 16,
          }}
        >
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: 20,
              maxWidth: 480,
              width: "100%",
              padding: 24,
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: "#FEF2F2",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <AlertTriangle size={24} color="#DC2626" />
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: "#0F172A", margin: 0 }}>
                  Konfirmasi Pengukuran Tidak Lazim
                </h3>
                <p style={{ fontSize: 12, color: "#64748B", margin: "2px 0 0 0" }}>
                  Pemeriksaan Kewajaran Biologis Standar Baku WHO 2006
                </p>
              </div>
            </div>

            {/* Ringkasan Input Balita */}
            <div
              style={{
                background: "#F8FAFC",
                border: "1px solid #E2E8F0",
                borderRadius: 12,
                padding: "10px 14px",
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: 8,
                fontSize: 12.5,
                marginBottom: 14,
              }}
            >
              <div>
                <span style={{ color: "#64748B" }}>Nama Balita: </span>
                <strong style={{ color: "#0F172A" }}>{pendingData.nama_anak}</strong>
              </div>
              <div>
                <span style={{ color: "#64748B" }}>Umur: </span>
                <strong style={{ color: "#0F172A" }}>{pendingData.umur_bulan} Bulan</strong>
              </div>
              <div>
                <span style={{ color: "#64748B" }}>Berat Badan: </span>
                <strong style={{ color: "#DC2626" }}>{pendingData.berat_kg} kg</strong>
              </div>
              <div>
                <span style={{ color: "#64748B" }}>Tinggi/PB: </span>
                <strong style={{ color: "#DC2626" }}>{pendingData.tinggi_cm} cm</strong>
              </div>
            </div>

            {/* Detail Peringatan Ekstrem */}
            <div
              style={{
                background: "#FEF2F2",
                border: "1.5px solid #FECACA",
                borderRadius: 12,
                padding: "12px 14px",
                marginBottom: 16,
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 700, color: "#991B1B" }}>
                Anomali Yang Terdeteksi:
              </div>
              {plausibilityWarnings
                .filter(w => w.tipe === "danger")
                .map((w, i) => (
                  <div key={i} style={{ fontSize: 12, color: "#B91C1C", display: "flex", gap: 6, lineHeight: 1.4 }}>
                    <span>•</span>
                    <span>{w.pesan}</span>
                  </div>
                ))}
            </div>

            <p style={{ fontSize: 12.5, color: "#475569", lineHeight: 1.45, margin: "0 0 20px 0" }}>
              Mohon pastikan angka di atas bukan karena <strong>salah ketik titik desimal</strong> (misal mengetik 85 alih-alih 8.5 kg) atau alat timbangan belum dinolkan.
            </p>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => {
                  setShowConfirmModal(false);
                  setTimeout(() => {
                    const firstDanger = plausibilityWarnings.find(w => w.tipe === "danger");
                    if (firstDanger?.field === "tinggi_cm") {
                      tinggiInputRef.current?.focus();
                    } else {
                      beratInputRef.current?.focus();
                    }
                  }, 50);
                }}
                style={{
                  padding: "9px 16px",
                  borderRadius: 10,
                  border: "1.5px solid #CBD5E1",
                  background: "#FFFFFF",
                  color: "#334155",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Periksa & Koreksi Input
              </button>
              <button
                type="button"
                onClick={async () => {
                  setShowConfirmModal(false);
                  setHasConfirmedExtreme(true);
                  await onSubmitValid(pendingData);
                }}
                style={{
                  padding: "9px 16px",
                  borderRadius: 10,
                  border: "none",
                  background: "#DC2626",
                  color: "#FFFFFF",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 2px 6px rgba(220, 38, 38, 0.3)",
                }}
              >
                Tetap Lanjutkan (Data Asli)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
