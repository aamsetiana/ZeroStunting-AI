// Utility: cn() — gabungkan Tailwind class secara aman
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── API Client ────────────────────────────────────────────────────────────

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

export interface AntropometriInput {
  nama_anak?: string;
  umur_bulan: number;
  berat_kg: number;
  tinggi_cm: number;
  jenis_kelamin: "L" | "P";
}

export interface ZScoreDetail {
  indikator: string;
  zscore: number;
  status: string;
  nilai_actual: number;
  median_referensi: number;
  interpretasi: string;
}

export interface AntropometriResult {
  nama_anak?: string;
  umur_bulan: number;
  berat_kg: number;
  tinggi_cm: number;
  jenis_kelamin: "L" | "P";
  bbu: ZScoreDetail;
  pbu: ZScoreDetail;
  bbpb: ZScoreDetail;
  ada_risiko_stunting: boolean;
  ada_risiko_wasting: boolean;
  ada_risiko_underweight: boolean;
  pesan_peringatan: string[];
  peringatan_data: string[];
}

export async function hitungAntropometri(data: AntropometriInput): Promise<AntropometriResult> {
  const res = await fetch(`${API_BASE}/anthropometry/calculate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? `HTTP ${res.status}`);
  }

  return res.json();
}

export interface SimpanPayload {
  balita: {
    nama: string;
    tanggal_lahir: string;
    jenis_kelamin: "L" | "P";
    nama_ibu?: string;
    alamat?: string;
  };
  penimbangan: {
    tanggal_timbang?: string;
    umur_bulan: number;
    berat_kg: number;
    tinggi_cm: number;
    input_mode?: string;
  };
}

export async function simpanBalitaDanPenimbangan(data: SimpanPayload) {
  const res = await fetch(`${API_BASE}/records/simpan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? `HTTP ${res.status}`);
  }

  return res.json();
}

// ─── Status Helpers ────────────────────────────────────────────────────────

export function getStatusColor(status: string): string {
  switch (status) {
    case "normal": return "text-green-400";
    case "risiko_lebih":
    case "berat_lebih":
    case "gizi_kurang":
    case "kurus":
    case "pendek":
      return "text-yellow-400";
    case "gizi_buruk":
    case "sangat_kurus":
    case "sangat_pendek":
      return "text-red-400";
    default: return "text-slate-400";
  }
}

export function getStatusBadgeClass(status: string): string {
  switch (status) {
    case "normal": return "badge-normal";
    case "risiko_lebih":
    case "berat_lebih":
    case "gizi_kurang":
    case "kurus":
    case "pendek":
      return "badge-warning";
    case "gizi_buruk":
    case "sangat_kurus":
    case "sangat_pendek":
      return "badge-danger";
    default: return "badge-normal";
  }
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    normal: "Normal",
    risiko_lebih: "Risiko Lebih",
    berat_lebih: "Berat Lebih",
    gizi_kurang: "Gizi Kurang",
    gizi_buruk: "Gizi Buruk",
    pendek: "Pendek (Stunting)",
    sangat_pendek: "Sangat Pendek",
    kurus: "Kurus (Wasting)",
    sangat_kurus: "Sangat Kurus",
  };
  return labels[status] ?? status;
}

// Konversi Z-score (-4 s/d +4) ke posisi pixel (0–100%)
export function zscoreToPercent(zscore: number): number {
  const clamped = Math.max(-4, Math.min(4, zscore));
  return ((clamped + 4) / 8) * 100;
}
