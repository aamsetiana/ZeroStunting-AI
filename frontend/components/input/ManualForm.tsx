"use client";

import { useState, useEffect } from "react";
import {
  Baby, Scale, Ruler, Calendar, User,
  AlertCircle, ChevronDown, ChevronUp
} from "lucide-react";
import { balitaFormSchema, type BalitaFormData } from "@/lib/validations";

interface ManualFormProps {
  onSubmitValid: (data: BalitaFormData) => Promise<void> | void;
  loading?: boolean;
  prefillData?: Partial<BalitaFormData> | null;
}

export function ManualForm({ onSubmitValid, loading = false, prefillData }: ManualFormProps) {
  const [formData, setFormData] = useState({
    nama_anak: "",
    jenis_kelamin: "L" as "L" | "P",
    umur_bulan: "",
    berat_kg: "",
    tinggi_cm: "",
    posisi_pengukuran: "telentang" as "telentang" | "berdiri",
    nama_ibu: "",
    dusun_rt: "",
    catatan_kader: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showOptional, setShowOptional] = useState(false);

  // Otomatis sesuaikan posisi ukur saat umur berubah
  useEffect(() => {
    const ageNum = parseInt(formData.umur_bulan);
    if (!isNaN(ageNum)) {
      if (ageNum < 24) {
        setFormData(p => ({ ...p, posisi_pengukuran: "telentang" }));
      } else {
        setFormData(p => ({ ...p, posisi_pengukuran: "berdiri" }));
      }
    }
  }, [formData.umur_bulan]);

  // Isi form dari data hasil OCR jika tersedia
  useEffect(() => {
    if (!prefillData) return;
    setFormData(p => ({
      ...p,
      nama_anak: prefillData.nama_anak ?? p.nama_anak,
      jenis_kelamin: prefillData.jenis_kelamin ?? p.jenis_kelamin,
      umur_bulan: prefillData.umur_bulan != null ? String(prefillData.umur_bulan) : p.umur_bulan,
      berat_kg: prefillData.berat_kg != null ? String(prefillData.berat_kg) : p.berat_kg,
      tinggi_cm: prefillData.tinggi_cm != null ? String(prefillData.tinggi_cm) : p.tinggi_cm,
    }));
  }, [prefillData]);

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

    // Langsung proses kalkulasi tanpa jeda modal
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
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
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

      <form onSubmit={handleFormSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Nama Balita */}
        <div>
          <label style={labelStyle}>
            <User size={14} color="#16A34A" /> Nama Balita
          </label>
          <input
            type="text"
            className="input-field"
            placeholder="Nama balita (opsional)"
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
              placeholder="cth: 18"
              style={{ paddingRight: 56 }}
              value={formData.umur_bulan}
              onChange={e => {
                setFormData(p => ({ ...p, umur_bulan: e.target.value }));
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
                type="number"
                min={0.5}
                max={35.0}
                step={0.05}
                required
                className="input-field"
                placeholder="cth: 10.2"
                style={{ paddingRight: 38 }}
                value={formData.berat_kg}
                onChange={e => {
                  setFormData(p => ({ ...p, berat_kg: e.target.value }));
                  clearFieldError("berat_kg");
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
                type="number"
                min={40.0}
                max={130.0}
                step={0.1}
                required
                className="input-field"
                placeholder="cth: 81.5"
                style={{ paddingRight: 38 }}
                value={formData.tinggi_cm}
                onChange={e => {
                  setFormData(p => ({ ...p, tinggi_cm: e.target.value }));
                  clearFieldError("tinggi_cm");
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
                  placeholder="cth: Ibu Siti Rahayu"
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
                  placeholder="cth: RT 03 / Dusun Kliwon"
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
    </div>
  );
}
