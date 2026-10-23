"use client";

import { useState, useRef, useCallback } from "react";
import {
  Upload, Camera, FileImage, CheckCircle, AlertTriangle,
  RefreshCw, Edit3, ChevronRight, Loader2, X,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface OcrExtractedData {
  nama_anak: string | null;
  umur_bulan: number | null;
  berat_kg: number | null;
  tinggi_cm: number | null;
  jenis_kelamin: "L" | "P" | null;
}

interface OcrUploadProps {
  onConfirm: (data: OcrExtractedData) => void;
  onCancel?: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function callOcrEndpoint(file: File): Promise<OcrExtractedData & { pesan: string; engine: string; confidence: number }> {
  const form = new FormData();
  form.append("file", file);

  const res = await fetch(`${BACKEND_URL}/api/v1/ocr/extract`, {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Gagal menghubungi server OCR" }));
    throw new Error(err.detail ?? "Gagal ekstrak OCR");
  }

  const json = await res.json();
  if (!json.sukses || !json.data) throw new Error("Respons OCR tidak valid");

  return {
    nama_anak: json.data.nama_anak ?? null,
    umur_bulan: json.data.umur_bulan ?? null,
    berat_kg: json.data.berat_kg ?? null,
    tinggi_cm: json.data.tinggi_cm ?? null,
    jenis_kelamin: json.data.jenis_kelamin ?? null,
    pesan: json.data.pesan,
    engine: json.data.engine_used,
    confidence: json.data.confidence,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// KOMPONEN FIELD EDIT
// ─────────────────────────────────────────────────────────────────────────────

function EditField({
  label, value, placeholder, type = "text", step, min, max,
  onChange,
}: {
  label: string;
  value: string | number | "";
  placeholder: string;
  type?: string;
  step?: string;
  min?: number;
  max?: number;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 5 }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        step={step}
        min={min}
        max={max}
        onChange={e => onChange(e.target.value)}
        style={{
          width: "100%",
          padding: "9px 12px",
          border: "1.5px solid #CBD5E1",
          borderRadius: 10,
          fontSize: 14,
          color: "#0F172A",
          background: "#FFFFFF",
          outline: "none",
          boxSizing: "border-box",
        }}
        onFocus={e => { e.currentTarget.style.borderColor = "#16A34A"; }}
        onBlur={e => { e.currentTarget.style.borderColor = "#CBD5E1"; }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// KOMPONEN UTAMA
// ─────────────────────────────────────────────────────────────────────────────

export function OcrUpload({ onConfirm, onCancel }: OcrUploadProps) {
  const [step, setStep] = useState<"upload" | "preview" | "edit">("upload");
  const [dragging, setDragging] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [engineInfo, setEngineInfo] = useState<{ pesan: string; engine: string; confidence: number } | null>(null);

  // Form state (editable setelah OCR)
  const [namaAnak, setNamaAnak] = useState("");
  const [umurBulan, setUmurBulan] = useState("");
  const [beratKg, setBeratKg] = useState("");
  const [tinggiCm, setTinggiCm] = useState("");
  const [jenisKelamin, setJenisKelamin] = useState<"L" | "P" | "">("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Populate form dari hasil OCR ──
  const populateForm = (data: OcrExtractedData) => {
    setNamaAnak(data.nama_anak ?? "");
    setUmurBulan(data.umur_bulan != null ? String(data.umur_bulan) : "");
    setBeratKg(data.berat_kg != null ? String(data.berat_kg) : "");
    setTinggiCm(data.tinggi_cm != null ? String(data.tinggi_cm) : "");
    setJenisKelamin(data.jenis_kelamin ?? "");
  };

  // ── Proses file ──
  const processFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Hanya file gambar (JPEG, PNG) yang diterima.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Ukuran file melebihi 10 MB.");
      return;
    }

    setError(null);
    setImageUrl(URL.createObjectURL(file));
    setStep("preview");
    setLoading(true);

    try {
      const result = await callOcrEndpoint(file);
      populateForm(result);
      setEngineInfo({ pesan: result.pesan, engine: result.engine, confidence: result.confidence });
      setStep("edit");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal ekstrak teks dari foto.");
      setStep("preview");
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Drop handler ──
  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  // ── File input change ──
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  // ── Reset ──
  const handleReset = () => {
    setStep("upload");
    setImageUrl(null);
    setError(null);
    setLoading(false);
    setEngineInfo(null);
    setNamaAnak(""); setUmurBulan(""); setBeratKg(""); setTinggiCm(""); setJenisKelamin("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Konfirmasi data ──
  const handleConfirm = () => {
    onConfirm({
      nama_anak: namaAnak.trim() || null,
      umur_bulan: umurBulan ? parseInt(umurBulan, 10) : null,
      berat_kg: beratKg ? parseFloat(beratKg) : null,
      tinggi_cm: tinggiCm ? parseFloat(tinggiCm) : null,
      jenis_kelamin: jenisKelamin || null,
    });
  };

  const isValid = umurBulan && beratKg && tinggiCm && jenisKelamin;

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: UPLOAD ZONE
  // ─────────────────────────────────────────────────────────────────────────

  if (step === "upload") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Instruksi */}
        <div style={{
          background: "#F0FDF4",
          border: "1.5px solid #BBF7D0",
          borderRadius: 14,
          padding: "12px 16px",
          fontSize: 13,
          color: "#166534",
        }}>
          <strong>Cara pakai:</strong> Foto catatan timbang atau buku KMS, lalu upload di sini.
          Sistem akan membaca angka secara otomatis. Kader bisa koreksi jika ada yang tidak tepat.
        </div>

        {/* Drop Zone */}
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: `2px dashed ${dragging ? "#16A34A" : "#CBD5E1"}`,
            borderRadius: 18,
            background: dragging ? "#F0FDF4" : "#FAFAFA",
            padding: "48px 24px",
            textAlign: "center",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
        >
          <div style={{
            width: 60, height: 60, borderRadius: 16,
            background: dragging ? "#DCFCE7" : "#F1F5F9",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 14px",
            transition: "background 0.2s ease",
          }}>
            <FileImage size={28} color={dragging ? "#16A34A" : "#64748B"} />
          </div>
          <p style={{ fontSize: 15, fontWeight: 700, color: "#0F172A", marginBottom: 4 }}>
            {dragging ? "Lepas foto di sini" : "Seret foto ke sini"}
          </p>
          <p style={{ fontSize: 13, color: "#64748B", marginBottom: 16 }}>
            atau klik untuk pilih dari galeri
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
            <button
              type="button"
              style={{
                display: "flex", alignItems: "center", gap: 7,
                background: "#16A34A", color: "#FFFFFF",
                border: "none", borderRadius: 10,
                padding: "9px 18px", fontSize: 13, fontWeight: 700,
                cursor: "pointer",
              }}
            >
              <Upload size={15} /> Pilih Foto
            </button>
            <button
              type="button"
              onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }}
              style={{
                display: "flex", alignItems: "center", gap: 7,
                background: "#FFFFFF", color: "#334155",
                border: "1.5px solid #CBD5E1", borderRadius: 10,
                padding: "9px 18px", fontSize: 13, fontWeight: 700,
                cursor: "pointer",
              }}
            >
              <Camera size={15} /> Kamera
            </button>
          </div>
          <p style={{ fontSize: 11, color: "#94A3B8", marginTop: 12 }}>
            JPEG, PNG — maks 10 MB
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          capture="environment"
          onChange={onFileChange}
          style={{ display: "none" }}
        />

        {error && (
          <div style={{
            background: "#FEF2F2", border: "1.5px solid #FECACA",
            borderRadius: 10, padding: "10px 14px",
            display: "flex", alignItems: "center", gap: 8,
            fontSize: 13, color: "#B91C1C",
          }}>
            <AlertTriangle size={16} style={{ flexShrink: 0 }} /> {error}
          </div>
        )}

        {onCancel && (
          <button type="button" onClick={onCancel}
            style={{ background: "none", border: "none", color: "#64748B", fontSize: 13, cursor: "pointer", padding: 0 }}>
            Batal
          </button>
        )}
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: PREVIEW + LOADING
  // ─────────────────────────────────────────────────────────────────────────

  if (step === "preview") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {imageUrl && (
          <div style={{ position: "relative", borderRadius: 14, overflow: "hidden" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt="Foto catatan timbang" style={{ width: "100%", maxHeight: 280, objectFit: "contain", background: "#F8FAFC" }} />
            {loading && (
              <div style={{
                position: "absolute", inset: 0,
                background: "rgba(255,255,255,0.75)",
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", gap: 8,
              }}>
                <Loader2 size={32} color="#16A34A" style={{ animation: "spin 1s linear infinite" }} />
                <span style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>Membaca foto...</span>
              </div>
            )}
          </div>
        )}

        {error && (
          <div style={{
            background: "#FEF2F2", border: "1.5px solid #FECACA",
            borderRadius: 10, padding: "10px 14px",
            display: "flex", alignItems: "center", gap: 8,
            fontSize: 13, color: "#B91C1C",
          }}>
            <AlertTriangle size={16} style={{ flexShrink: 0 }} /> {error}
            <button type="button" onClick={handleReset}
              style={{ marginLeft: "auto", background: "none", border: "none", color: "#B91C1C", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
              Coba Lagi
            </button>
          </div>
        )}
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: EDIT + KONFIRMASI
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Foto preview kecil */}
      {imageUrl && (
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt="Foto catatan" style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 10, border: "1.5px solid #E2E8F0", flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", marginBottom: 2 }}>
              Data berhasil dibaca dari foto
            </div>
            {engineInfo && (
              <div style={{ fontSize: 12, color: "#64748B" }}>
                Mesin: <strong>{engineInfo.engine}</strong> &bull; Akurasi: <strong>{Math.round(engineInfo.confidence * 100)}%</strong>
              </div>
            )}
            <div style={{ fontSize: 12, color: "#475569", marginTop: 4 }}>
              {engineInfo?.pesan}
            </div>
          </div>
          <button type="button" onClick={handleReset}
            style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "#64748B", padding: 4 }}>
            <X size={18} />
          </button>
        </div>
      )}

      {/* Peringatan edit */}
      <div style={{
        background: "#FFFBEB", border: "1.5px solid #FDE68A",
        borderRadius: 10, padding: "9px 14px",
        display: "flex", alignItems: "center", gap: 8,
        fontSize: 12, color: "#92400E",
      }}>
        <Edit3 size={14} style={{ flexShrink: 0 }} />
        Periksa dan koreksi data di bawah ini sebelum dikonfirmasi. Data yang salah dapat mempengaruhi hasil Z-score.
      </div>

      {/* Form edit */}
      <div style={{
        background: "#FFFFFF", border: "1.5px solid #E2E8F0",
        borderRadius: 14, padding: "18px 20px",
        display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: 14,
      }}>
        <EditField label="Nama Anak" value={namaAnak} placeholder="cth: Budi Santoso" onChange={setNamaAnak} />

        {/* Jenis Kelamin */}
        <div>
          <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 5 }}>
            Jenis Kelamin <span style={{ color: "#DC2626" }}>*</span>
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            {(["L", "P"] as const).map(g => (
              <button key={g} type="button" onClick={() => setJenisKelamin(g)}
                style={{
                  flex: 1, padding: "9px 0", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer",
                  border: jenisKelamin === g ? "1.5px solid #16A34A" : "1.5px solid #CBD5E1",
                  background: jenisKelamin === g ? "#DCFCE7" : "#FFFFFF",
                  color: jenisKelamin === g ? "#15803D" : "#475569",
                  transition: "all 0.15s ease",
                }}
              >
                {g === "L" ? "♂ Laki" : "♀ Perempuan"}
              </button>
            ))}
          </div>
        </div>

        <EditField label="Umur (bulan) *" value={umurBulan} placeholder="0–60" type="number" min={0} max={60} onChange={setUmurBulan} />
        <EditField label="Berat Badan (kg) *" value={beratKg} placeholder="cth: 12.5" type="number" step="0.1" min={1.5} max={35} onChange={setBeratKg} />
        <EditField label="Panjang/Tinggi (cm) *" value={tinggiCm} placeholder="cth: 87.0" type="number" step="0.1" min={40} max={130} onChange={setTinggiCm} />
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={!isValid}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            background: isValid ? "#16A34A" : "#E2E8F0",
            color: isValid ? "#FFFFFF" : "#94A3B8",
            border: "none", borderRadius: 12,
            padding: "11px 22px", fontSize: 14, fontWeight: 700,
            cursor: isValid ? "pointer" : "not-allowed",
            transition: "background 0.15s ease",
          }}
        >
          <CheckCircle size={17} />
          Konfirmasi dan Hitung Z-Score
          <ChevronRight size={15} />
        </button>

        <button type="button" onClick={handleReset}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            background: "#FFFFFF", color: "#334155",
            border: "1.5px solid #CBD5E1", borderRadius: 12,
            padding: "11px 18px", fontSize: 14, fontWeight: 700, cursor: "pointer",
          }}
        >
          <RefreshCw size={15} /> Upload Foto Lain
        </button>
      </div>
    </div>
  );
}
