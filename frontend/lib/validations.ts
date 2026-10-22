// Validasi Antropometri Balita Standar WHO 2006 & Kemenkes RI
import { z } from "zod";

export const balitaFormSchema = z.object({
  nama_anak: z
    .string()
    .trim()
    .max(80, "Nama anak maksimal 80 karakter")
    .optional()
    .or(z.literal("")),
  jenis_kelamin: z.enum(["L", "P"], {
    message: "Pilih jenis kelamin (Laki-laki atau Perempuan)",
  }),
  umur_bulan: z
    .number({ message: "Umur balita wajib diisi angka" })
    .int("Umur harus bilangan bulat dalam bulan")
    .min(0, "Umur minimal 0 bulan (bayi baru lahir)")
    .max(60, "Umur maksimal 60 bulan (5 tahun)"),
  berat_kg: z
    .number({ message: "Berat badan wajib diisi angka" })
    .min(0.5, "Berat badan minimal 0.5 kg")
    .max(35.0, "Berat badan maksimal 35.0 kg"),
  tinggi_cm: z
    .number({ message: "Panjang/tinggi badan wajib diisi angka" })
    .min(40.0, "Panjang/tinggi minimal 40.0 cm")
    .max(130.0, "Panjang/tinggi maksimal 130.0 cm"),
  posisi_pengukuran: z.enum(["telentang", "berdiri"]).optional(),
  nama_ibu: z
    .string()
    .trim()
    .max(80, "Nama ibu maksimal 80 karakter")
    .optional()
    .or(z.literal("")),
  dusun_rt: z
    .string()
    .trim()
    .max(100, "Wilayah dusun/RT maksimal 100 karakter")
    .optional()
    .or(z.literal("")),
  catatan_kader: z
    .string()
    .trim()
    .max(250, "Catatan maksimal 250 karakter")
    .optional()
    .or(z.literal("")),
});

export type BalitaFormData = z.infer<typeof balitaFormSchema>;

export interface PlausibilityWarning {
  tipe: "info" | "warning" | "danger";
  pesan: string;
}

// Pemeriksaan batas biologis dan rekomendasi posisi ukur lapangan
export function periksaKewajaranBiologis(data: {
  umur_bulan: number;
  berat_kg: number;
  tinggi_cm: number;
  posisi_pengukuran?: "telentang" | "berdiri";
}): PlausibilityWarning[] {
  const warnings: PlausibilityWarning[] = [];

  // 1. Rekomendasi posisi ukur standar Kemenkes / WHO
  if (data.umur_bulan < 24 && data.posisi_pengukuran === "berdiri") {
    warnings.push({
      tipe: "info",
      pesan: "Balita < 24 bulan lazimnya diukur telentang (PB). Pengukuran berdiri akan dikoreksi -0.7 cm sesuai standar WHO.",
    });
  } else if (data.umur_bulan >= 24 && data.posisi_pengukuran === "telentang") {
    warnings.push({
      tipe: "info",
      pesan: "Anak >= 24 bulan lazimnya diukur berdiri (TB). Pengukuran telentang akan dikoreksi +0.7 cm sesuai standar WHO.",
    });
  }

  // 2. Cek rasio ekstrem berat vs tinggi
  const bmiApprox = data.berat_kg / Math.pow(data.tinggi_cm / 100, 2);
  if (bmiApprox > 26) {
    warnings.push({
      tipe: "warning",
      pesan: "Rasio berat terhadap tinggi sangat besar. Pastikan timbangan terkalibrasi dan anak tidak mengenakan pakaian tebal.",
    });
  } else if (bmiApprox < 10) {
    warnings.push({
      tipe: "danger",
      pesan: "Rasio berat terhadap tinggi sangat rendah (indikasi gizi kurang akut / wasting). Periksa ulang pembacaan alat.",
    });
  }

  // 3. Batas pertumbuhan per kelompok umur
  if (data.umur_bulan <= 6 && data.berat_kg > 12) {
    warnings.push({
      tipe: "warning",
      pesan: "Berat badan > 12 kg pada bayi <= 6 bulan tergolong sangat tinggi. Konfirmasi ulang angka pada timbangan.",
    });
  }

  if (data.umur_bulan >= 36 && data.berat_kg < 8) {
    warnings.push({
      tipe: "danger",
      pesan: "Berat badan < 8 kg pada anak >= 3 tahun tergolong sangat rendah. Butuh atensi segera kader dan bidan.",
    });
  }

  return warnings;
}
