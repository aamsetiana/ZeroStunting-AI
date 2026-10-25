"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  Upload, Camera, FileImage, CheckCircle,
  RefreshCw, Edit3, ChevronRight, Loader2, X, SwitchCamera,
  Sparkles, Info,
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
  lingkar_kepala_cm?: number | null;
  lingkar_lengan_cm?: number | null;
}

interface OcrUploadProps {
  onConfirm: (data: OcrExtractedData) => void;
  onCancel?: () => void;
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
// KOMPONEN UTAMA (UI/UX MOCKUP)
// ─────────────────────────────────────────────────────────────────────────────

export function OcrUpload({ onConfirm, onCancel }: OcrUploadProps) {
  const [step, setStep] = useState<"upload" | "scanning" | "edit">("upload");
  const [dragging, setDragging] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  // Form State
  const [namaAnak, setNamaAnak] = useState("Budi Santoso");
  const [umurBulan, setUmurBulan] = useState("24");
  const [beratKg, setBeratKg] = useState("12.5");
  const [tinggiCm, setTinggiCm] = useState("87.0");
  const [lingkarKepalaCm, setLingkarKepalaCm] = useState("");
  const [lingkarLenganCm, setLingkarLenganCm] = useState("");
  const [jenisKelamin, setJenisKelamin] = useState<"L" | "P" | "">("L");

  // Camera State
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Matikan stream kamera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraOpen(false);
  }, []);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Buka kamera langsung
  const startCamera = useCallback(async (mode: "environment" | "user" = "environment") => {
    setIsCameraOpen(true);

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: mode },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }

      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter((d) => d.kind === "videoinput");
        setHasMultipleCameras(videoDevices.length > 1);
      } catch {
        setHasMultipleCameras(false);
      }
    } catch {
      // Jika kamera fisik tidak bisa diakses, buka file dialog sebagai fallback
      setIsCameraOpen(false);
      fileInputRef.current?.click();
    }
  }, []);

  // Ambil foto dari kamera
  const handleCapturePhoto = useCallback(() => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) {
      stopCamera();
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      if (facingMode === "user") {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
      setImageUrl(dataUrl);
      stopCamera();

      // Jalankan animasi scan simulasi UI
      setStep("scanning");
      setTimeout(() => {
        setStep("edit");
      }, 1200);
    }
  }, [facingMode, stopCamera]);

  // Tangani file yang dipilih/di-drop
  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setImageUrl(URL.createObjectURL(file));

    // Simulasi scanning UI yang halus (1.2 detik)
    setStep("scanning");
    setTimeout(() => {
      setStep("edit");
    }, 1200);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, []);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  // Reset
  const handleReset = () => {
    stopCamera();
    setStep("upload");
    setImageUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Konfirmasi
  const handleConfirm = () => {
    onConfirm({
      nama_anak: namaAnak.trim() || null,
      umur_bulan: umurBulan ? parseInt(umurBulan, 10) : null,
      berat_kg: beratKg ? parseFloat(beratKg) : null,
      tinggi_cm: tinggiCm ? parseFloat(tinggiCm) : null,
      jenis_kelamin: jenisKelamin || null,
      lingkar_kepala_cm: lingkarKepalaCm ? parseFloat(lingkarKepalaCm) : null,
      lingkar_lengan_cm: lingkarLenganCm ? parseFloat(lingkarLenganCm) : null,
    });
  };

  const isValid = Boolean(namaAnak.trim() && umurBulan && beratKg && tinggiCm && jenisKelamin);

  // ─────────────────────────────────────────────────────────────────────────
  // 1. TAMPILAN: UPLOAD & KAMERA
  // ─────────────────────────────────────────────────────────────────────────

  if (step === "upload") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Banner Penjelasan */}
        <div style={{
          background: "#F0FDF4",
          border: "1.5px solid #BBF7D0",
          borderRadius: 14,
          padding: "12px 16px",
          fontSize: 13,
          color: "#166534",
          display: "flex",
          gap: 10,
          alignItems: "flex-start",
        }}>
          <Sparkles size={18} color="#16A34A" style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <strong>Mode Scan KMS (Mockup UI):</strong> Foto atau unggah lembar catatan timbang Posyandu.
            Sistem akan menyimulasikan pembacaan angka otomatis untuk diverifikasi kader.
          </div>
        </div>

        {/* JIKA KAMERA AKTIF */}
        {isCameraOpen ? (
          <div style={{
            position: "relative",
            background: "#0F172A",
            borderRadius: 18,
            overflow: "hidden",
            boxShadow: "0 10px 25px -5px rgba(0,0,0,0.25)",
            display: "flex",
            flexDirection: "column",
          }}>
            {/* Header Kamera */}
            <div style={{
              position: "absolute",
              top: 12,
              left: 12,
              right: 12,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              zIndex: 10,
            }}>
              <div style={{
                background: "rgba(15, 23, 42, 0.75)",
                backdropFilter: "blur(6px)",
                color: "#F8FAFC",
                fontSize: 12,
                fontWeight: 600,
                padding: "6px 12px",
                borderRadius: 20,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#22C55E", display: "inline-block" }} />
                Kamera Aktif
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                {hasMultipleCameras && (
                  <button
                    type="button"
                    onClick={() => {
                      const next = facingMode === "environment" ? "user" : "environment";
                      setFacingMode(next);
                      startCamera(next);
                    }}
                    style={{
                      background: "rgba(15, 23, 42, 0.75)",
                      color: "#FFFFFF",
                      border: "none",
                      borderRadius: "50%",
                      width: 36,
                      height: 36,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                    }}
                  >
                    <SwitchCamera size={16} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={stopCamera}
                  style={{
                    background: "rgba(15, 23, 42, 0.75)",
                    color: "#FFFFFF",
                    border: "none",
                    borderRadius: "50%",
                    width: 36,
                    height: 36,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                  }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Video Viewfinder */}
            <div style={{ position: "relative", width: "100%", minHeight: 320, background: "#000", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{ width: "100%", maxHeight: 380, objectFit: "contain", transform: facingMode === "user" ? "scaleX(-1)" : "none" }}
              />
              <div style={{
                position: "absolute",
                inset: "24px 28px 48px",
                border: "2px dashed rgba(255, 255, 255, 0.65)",
                borderRadius: 14,
                pointerEvents: "none",
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "center",
                paddingBottom: 8,
              }}>
                <span style={{ background: "rgba(15, 23, 42, 0.75)", color: "#FFFFFF", fontSize: 11, padding: "4px 10px", borderRadius: 12 }}>
                  Posisikan catatan KMS di dalam kotak
                </span>
              </div>
            </div>

            {/* Shutter Button */}
            <div style={{ background: "#0F172A", padding: "14px 20px", display: "flex", justifyContent: "center" }}>
              <button
                type="button"
                onClick={handleCapturePhoto}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background: "#16A34A",
                  color: "#FFFFFF",
                  border: "3px solid #DCFCE7",
                  borderRadius: 40,
                  padding: "10px 24px",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(22, 163, 74, 0.4)",
                }}
              >
                <Camera size={18} /> Ambil Foto
              </button>
            </div>
          </div>
        ) : (
          /* DROPZONE BIASA */
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${dragging ? "#16A34A" : "#CBD5E1"}`,
              borderRadius: 18,
              background: dragging ? "#F0FDF4" : "#FAFAFA",
              padding: "44px 24px",
              textAlign: "center",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            <div style={{
              width: 58, height: 58, borderRadius: 16,
              background: dragging ? "#DCFCE7" : "#F1F5F9",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 14px",
              transition: "background 0.2s ease",
            }}>
              <FileImage size={28} color={dragging ? "#16A34A" : "#64748B"} />
            </div>
            <p style={{ fontSize: 15, fontWeight: 700, color: "#0F172A", marginBottom: 4 }}>
              {dragging ? "Lepas foto di sini" : "Tarik & lepas foto catatan KMS di sini"}
            </p>
            <p style={{ fontSize: 13, color: "#64748B", marginBottom: 18 }}>
              atau pilih opsi di bawah ini
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={e => {
                  e.stopPropagation();
                  startCamera("environment");
                }}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  background: "#16A34A", color: "#FFFFFF",
                  border: "none", borderRadius: 10,
                  padding: "10px 20px", fontSize: 13, fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 2px 6px rgba(22, 163, 74, 0.25)",
                }}
              >
                <Camera size={16} /> Buka Kamera
              </button>

              <button
                type="button"
                onClick={e => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  background: "#FFFFFF", color: "#334155",
                  border: "1.5px solid #CBD5E1", borderRadius: 10,
                  padding: "10px 20px", fontSize: 13, fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                <Upload size={16} /> Pilih dari File
              </button>
            </div>
          </div>
        )}

        {/* Input file sembunyi */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={onFileChange}
          style={{ display: "none" }}
        />

        {onCancel && (
          <button type="button" onClick={() => { stopCamera(); onCancel(); }}
            style={{ background: "none", border: "none", color: "#64748B", fontSize: 13, cursor: "pointer", padding: 0 }}>
            Batal
          </button>
        )}
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 2. TAMPILAN: SCANNING ANIMATION (SIMULASI PROSES)
  // ─────────────────────────────────────────────────────────────────────────

  if (step === "scanning") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {imageUrl && (
          <div style={{ position: "relative", borderRadius: 14, overflow: "hidden" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt="Foto KMS" style={{ width: "100%", maxHeight: 300, objectFit: "contain", background: "#F8FAFC" }} />
            <div style={{
              position: "absolute", inset: 0,
              background: "rgba(255,255,255,0.85)",
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 10,
            }}>
              <Loader2 size={36} color="#16A34A" style={{ animation: "spin 1s linear infinite" }} />
              <span style={{ fontSize: 15, fontWeight: 700, color: "#0F172A" }}>Memindai Foto KMS...</span>
              <span style={{ fontSize: 12, color: "#64748B" }}>Mengekstrak nama, berat, tinggi, dan usia balita</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 3. TAMPILAN: EDIT & VERIFIKASI DATA
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header Info Foto */}
      {imageUrl && (
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt="Foto catatan" style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 10, border: "1.5px solid #E2E8F0", flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", marginBottom: 2 }}>
              Data berhasil diekstrak dari foto
            </div>
            <div style={{ fontSize: 12, color: "#16A34A", fontWeight: 600 }}>
              ✓ Akurasi pembacaan: 95%
            </div>
            <div style={{ fontSize: 12, color: "#475569", marginTop: 4 }}>
              Kader dapat memeriksa dan mengubah angka di bawah ini bila diperlukan.
            </div>
          </div>
          <button type="button" onClick={handleReset}
            style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "#64748B", padding: 4 }}>
            <X size={18} />
          </button>
        </div>
      )}

      {/* Info Banner Mockup */}
      <div style={{
        background: "#F8FAFC", border: "1.5px solid #E2E8F0",
        borderRadius: 10, padding: "8px 12px",
        display: "flex", alignItems: "center", gap: 8,
        fontSize: 12, color: "#475569",
      }}>
        <Info size={14} color="#64748B" style={{ flexShrink: 0 }} />
        <span>Pratinjau Mockup Frontend: Form otomatis terisi dan siap dikonfirmasi ke kalkulasi Z-Score.</span>
      </div>

      {/* Form Input Editable */}
      <div style={{
        background: "#FFFFFF", border: "1.5px solid #E2E8F0",
        borderRadius: 14, padding: "18px 20px",
        display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: 14,
      }}>
        <EditField label="Nama Balita *" value={namaAnak} placeholder="Masukkan nama lengkap balita" onChange={setNamaAnak} />

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

        <EditField label="Umur (bulan) *" value={umurBulan} placeholder="Masukkan umur balita (bulan)" type="number" min={0} max={60} onChange={setUmurBulan} />
        <EditField label="Berat Badan (kg) *" value={beratKg} placeholder="Masukkan berat badan (kg)" type="number" step="0.1" min={1.5} max={35} onChange={setBeratKg} />
        <EditField label="Panjang/Tinggi (cm) *" value={tinggiCm} placeholder="Masukkan panjang / tinggi badan (cm)" type="number" step="0.1" min={40} max={130} onChange={setTinggiCm} />
        <EditField label="Lingkar Kepala (cm) (Opsional)" value={lingkarKepalaCm} placeholder="Masukkan lingkar kepala (cm)" type="number" step="0.1" min={25} max={65} onChange={setLingkarKepalaCm} />
        <EditField label="Lingkar Lengan (cm) (Opsional)" value={lingkarLenganCm} placeholder="Masukkan lingkar lengan (cm)" type="number" step="0.1" min={7} max={30} onChange={setLingkarLenganCm} />
      </div>

      {/* Action Buttons */}
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
          <RefreshCw size={15} /> Ganti Foto
        </button>
      </div>
    </div>
  );
}
