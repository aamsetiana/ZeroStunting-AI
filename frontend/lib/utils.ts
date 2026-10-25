// Utility: cn() - gabungkan Tailwind class secara aman
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
  lingkar_kepala_cm?: number;
  lingkar_lengan_cm?: number;
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
  lingkar_kepala_cm?: number;
  lingkar_lengan_cm?: number;
  bbu: ZScoreDetail;
  pbu: ZScoreDetail;
  bbpb: ZScoreDetail;
  lku?: ZScoreDetail;
  lila?: ZScoreDetail;
  ada_risiko_stunting: boolean;
  ada_risiko_wasting: boolean;
  ada_risiko_underweight: boolean;
  ada_risiko_mikrosefali?: boolean;
  ada_risiko_makrosefali?: boolean;
  pesan_peringatan: string[];
  peringatan_data: string[];
}

import { calculateFullAntropometri } from "@/lib/who-data";

export async function hitungAntropometri(data: AntropometriInput): Promise<AntropometriResult> {
  try {
    const res = await fetch(`${API_BASE}/anthropometry/calculate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Backend API offline / tidak sedang berjalan: gunakan kalkulator baku WHO lokal
  }

  return calculateFullAntropometri(data);
}

export interface SimpanPayload {
  balita: {
    posyandu_id?: string;
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
    lingkar_kepala_cm?: number;
    lingkar_lengan_cm?: number;
    input_mode?: string;
  };
}

export async function simpanBalitaDanPenimbangan(data: SimpanPayload) {
  const safeData: SimpanPayload = {
    ...data,
    penimbangan: {
      ...data.penimbangan,
      input_mode: "form",
    },
  };

  const res = await fetch(`${API_BASE}/records/simpan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(safeData),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? `HTTP ${res.status}`);
  }

  return res.json();
}

import type { BalitaItem, PenimbanganRecord } from "@/components/balita/RiwayatData";

export interface ApiPenimbanganItem {
  id: string;
  balita_id: string;
  tanggal_timbang: string;
  umur_bulan: number;
  berat_kg: number;
  tinggi_cm: number;
  lingkar_kepala_cm?: number | null;
  lingkar_lengan_cm?: number | null;
  zscore_bbu: number | null;
  zscore_pbu: number | null;
  zscore_bbpb: number | null;
  zscore_lku?: number | null;
  status_gizi: string | null;
  status_lingkar_kepala?: string | null;
  status_lingkar_lengan?: string | null;
  input_mode: string | null;
}

export interface ApiBalitaItem {
  id: string;
  posyandu_id: string;
  nama: string;
  tanggal_lahir: string;
  jenis_kelamin: "L" | "P";
  nama_ibu?: string | null;
  alamat?: string | null;
  created_at?: string;
  penimbangans?: ApiPenimbanganItem[];
}

export async function getBalitaFullList(posyanduId?: string): Promise<BalitaItem[]> {
  try {
    const url = posyanduId
      ? `${API_BASE}/records/balita-full?posyandu_id=${encodeURIComponent(posyanduId)}`
      : `${API_BASE}/records/balita-full`;
    const res = await fetch(url, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data: ApiBalitaItem[] = await res.json();
    return data.map((b: ApiBalitaItem): BalitaItem => {
      const penimbangans = (b.penimbangans || []).sort(
        (x: ApiPenimbanganItem, y: ApiPenimbanganItem) =>
          new Date(y.tanggal_timbang).getTime() - new Date(x.tanggal_timbang).getTime()
      );
      const latest = penimbangans[0];

      const riwayat: PenimbanganRecord[] = penimbangans.map((p: ApiPenimbanganItem) => {
        let bbu: "normal" | "kurang" | "buruk" | "lebih" = "normal";
        if (p.zscore_bbu !== null && p.zscore_bbu < -3) bbu = "buruk";
        else if (p.zscore_bbu !== null && p.zscore_bbu < -2) bbu = "kurang";
        else if (p.zscore_bbu !== null && p.zscore_bbu > 2) bbu = "lebih";

        let pbu: "normal" | "pendek" | "sangat_pendek" | "tinggi" = "normal";
        if (p.zscore_pbu !== null && p.zscore_pbu < -3) pbu = "sangat_pendek";
        else if (p.zscore_pbu !== null && p.zscore_pbu < -2) pbu = "pendek";
        else if (p.zscore_pbu !== null && p.zscore_pbu > 3) pbu = "tinggi";

        let bbpb: "normal" | "kurus" | "sangat_kurus" | "gemuk" = "normal";
        if (p.zscore_bbpb !== null && p.zscore_bbpb < -3) bbpb = "sangat_kurus";
        else if (p.zscore_bbpb !== null && p.zscore_bbpb < -2) bbpb = "kurus";
        else if (p.zscore_bbpb !== null && p.zscore_bbpb > 2) bbpb = "gemuk";

        return {
          tanggal: p.tanggal_timbang,
          umurBulan: p.umur_bulan,
          beratKg: Number(p.berat_kg),
          tinggiCm: Number(p.tinggi_cm),
          lingkarKepalaCm: p.lingkar_kepala_cm != null ? Number(p.lingkar_kepala_cm) : undefined,
          lingkarLenganCm: p.lingkar_lengan_cm != null ? Number(p.lingkar_lengan_cm) : undefined,
          statusBbu: bbu,
          statusPbu: pbu,
          statusBbpb: bbpb,
          statusTumbuh: "N",
          catatan: p.input_mode ? `Dicatat via ${p.input_mode}` : undefined,
        };
      });

      let statusGizi: "normal" | "waspada" | "rujukan" = "normal";
      let labelStatus = "Gizi Baik (Normal)";
      if (latest) {
        if (
          latest.status_gizi === "stunting" ||
          latest.status_gizi === "wasting" ||
          (latest.zscore_pbu !== null && latest.zscore_pbu < -3)
        ) {
          statusGizi = "rujukan";
          labelStatus = "Perlu Rujukan Bidan / Dokter";
        } else if (
          latest.status_gizi === "kurang" ||
          (latest.zscore_bbu !== null && latest.zscore_bbu < -2) ||
          (latest.zscore_pbu !== null && latest.zscore_pbu < -2)
        ) {
          statusGizi = "waspada";
          labelStatus = "Waspada / Pendampingan";
        }
      }

      return {
        id: b.id,
        posyanduId: b.posyandu_id || undefined,
        nama: b.nama,
        nik: `NIK-${b.id.substring(0, 8)}`,
        jenisKelamin: b.jenis_kelamin,
        tanggalLahir: b.tanggal_lahir,
        umurBulan: latest ? latest.umur_bulan : 0,
        namaIbu: b.nama_ibu || "Ibu Balita",
        dusun: b.alamat || "Desa Sukamaju",
        terakhirTimbang: latest ? latest.tanggal_timbang : "-",
        beratTerakhir: latest ? Number(latest.berat_kg) : 0,
        tinggiTerakhir: latest ? Number(latest.tinggi_cm) : 0,
        lingkarKepalaTerakhir: latest?.lingkar_kepala_cm != null ? Number(latest.lingkar_kepala_cm) : undefined,
        lingkarLenganTerakhir: latest?.lingkar_lengan_cm != null ? Number(latest.lingkar_lengan_cm) : undefined,
        statusGizi,
        labelStatus,
        riwayat,
      };
    });
  } catch (err) {
    console.error("Gagal memuat data balita dari database:", err);
    return [];
  }
}

export async function hapusBalitaDariDb(balitaId: string): Promise<{ sukses: boolean; pesan?: string }> {
  try {
    const res = await fetch(`${API_BASE}/records/balita/${balitaId}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { sukses: false, pesan: err.detail ?? `HTTP ${res.status}` };
    }
    const data = await res.json().catch(() => ({}));
    return { sukses: true, pesan: data.message || "Data balita berhasil dihapus." };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal menghubungi server";
    return { sukses: false, pesan: message };
  }
}

export interface UpdateBalitaPayload {
  nama?: string;
  tanggal_lahir?: string;
  jenis_kelamin?: "L" | "P";
  nama_ibu?: string;
  alamat?: string;
  umur_bulan?: number;
  berat_kg?: number;
  tinggi_cm?: number;
  lingkar_kepala_cm?: number;
  lingkar_lengan_cm?: number;
}

export async function updateBalitaDiDb(
  balitaId: string,
  data: UpdateBalitaPayload
): Promise<{ sukses: boolean; pesan?: string; data?: unknown }> {
  try {
    const res = await fetch(`${API_BASE}/records/balita/${balitaId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { sukses: false, pesan: err.detail ?? `HTTP ${res.status}` };
    }
    const result = await res.json();
    return { sukses: true, data: result };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal menghubungi server";
    return { sukses: false, pesan: message };
  }
}

export async function resetSemuaBalitaDiDb() {
  const res = await fetch(`${API_BASE}/records/reset`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? `HTTP ${res.status}`);
  }
  return res.json();
}

// ─── Posyandu API Client ───────────────────────────────────────────────────

export interface PosyanduItem {
  id: string;
  nama: string;
  desa?: string | null;
  kecamatan?: string | null;
  kabupaten?: string | null;
  provinsi?: string | null;
  created_at?: string;
  total_balita?: number;
}

export const ACTIVE_POSYANDU_STORAGE_KEY = "zerostunting_active_posyandu_id";

export function getStoredActivePosyanduId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(ACTIVE_POSYANDU_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredActivePosyanduId(id: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ACTIVE_POSYANDU_STORAGE_KEY, id);
  } catch (e) {
    console.warn("Gagal menyimpan active posyandu ke localStorage:", e);
  }
}

export function removeStoredActivePosyanduId(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(ACTIVE_POSYANDU_STORAGE_KEY);
  } catch {}
}

export async function getPosyanduList(): Promise<PosyanduItem[]> {
  try {
    const res = await fetch(`${API_BASE}/records/posyandu`, { cache: "no-store" });
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    console.error("Gagal mengambil daftar posyandu:", err);
    return [];
  }
}

export async function tambahPosyandu(data: {
  nama: string;
  desa?: string;
  kecamatan?: string;
  kabupaten?: string;
  provinsi?: string;
}): Promise<PosyanduItem> {
  const res = await fetch(`${API_BASE}/records/posyandu`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? `HTTP ${res.status}`);
  }
  return await res.json();
}

export async function updatePosyandu(
  posyanduId: string,
  data: {
    nama?: string;
    desa?: string;
    kecamatan?: string;
    kabupaten?: string;
    provinsi?: string;
  }
): Promise<PosyanduItem> {
  const res = await fetch(`${API_BASE}/records/posyandu/${posyanduId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? `HTTP ${res.status}`);
  }
  return await res.json();
}

export async function hapusPosyandu(posyanduId: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/records/posyandu/${posyanduId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? `HTTP ${res.status}`);
  }
  return true;
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
    makrosefali: "Makrosefali",
    mikrosefali: "Mikrosefali",
    mikrosefali_berat: "Mikrosefali Berat",
  };
  return labels[status] ?? status;
}

// Konversi Z-score (-4 s/d +4) ke posisi pixel (0–100%)
export function zscoreToPercent(zscore: number): number {
  const clamped = Math.max(-4, Math.min(4, zscore));
  return ((clamped + 4) / 8) * 100;
}
