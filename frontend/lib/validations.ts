// Validasi Antropometri Balita Standar WHO 2006 & Kemenkes RI
import { z } from "zod";

export const balitaFormSchema = z.object({
  balita_id: z.string().optional(),
  nama_anak: z
    .string()
    .trim()
    .min(1, "Nama balita wajib diisi")
    .max(80, "Nama anak maksimal 80 karakter"),
  jenis_kelamin: z.enum(["L", "P"], {
    message: "Pilih jenis kelamin (Laki-laki atau Perempuan)",
  }),
  tanggal_lahir: z.string().optional(),
  tanggal_timbang: z.string().optional(),
  umur_bulan: z
    .number({ message: "Umur balita wajib diisi angka" })
    .int("Umur harus bilangan bulat dalam bulan")
    .min(0, "Umur minimal 0 bulan (bayi baru lahir)")
    .max(60, "Umur maksimal 60 bulan (5 tahun)"),
  berat_kg: z
    .number({ message: "Berat badan wajib diisi angka" })
    .min(1.0, "Berat badan minimal 1.0 kg")
    .max(35.0, "Berat badan maksimal 35.0 kg"),
  tinggi_cm: z
    .number({ message: "Panjang/tinggi badan wajib diisi angka" })
    .min(40.0, "Panjang/tinggi minimal 40.0 cm")
    .max(130.0, "Panjang/tinggi maksimal 130.0 cm"),
  lingkar_kepala_cm: z
    .number()
    .min(25.0, "Lingkar kepala minimal 25.0 cm")
    .max(65.0, "Lingkar kepala maksimal 65.0 cm")
    .optional(),
  lingkar_lengan_cm: z
    .number()
    .min(7.0, "Lingkar lengan minimal 7.0 cm")
    .max(30.0, "Lingkar lengan maksimal 30.0 cm")
    .optional(),
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
  field?: "berat_kg" | "tinggi_cm" | "umur_bulan" | "umum";
  pesan: string;
}

/**
 * Sanitasi input desimal: otomatis mengganti koma (,) menjadi titik (.)
 * dan menghapus karakter non-numerik yang tidak valid.
 */
export function sanitizeDecimalInput(val: string): string {
  let sanitized = val.replace(/,/g, ".");
  sanitized = sanitized.replace(/[^0-9.]/g, "");
  const parts = sanitized.split(".");
  if (parts.length > 2) {
    sanitized = parts[0] + "." + parts.slice(1).join("");
  }
  return sanitized;
}

/**
 * Mendapatkan rentang wajar (WHO 2006 Median ± 2.5 SD) untuk panduan kader.
 */
export function getRentangWajar(umur_bulan: number): {
  bbMin: number;
  bbMax: number;
  tbMin: number;
  tbMax: number;
} {
  if (umur_bulan <= 1) return { bbMin: 2.2, bbMax: 5.2, tbMin: 45.0, tbMax: 58.0 };
  if (umur_bulan <= 3) return { bbMin: 3.5, bbMax: 7.8, tbMin: 51.0, tbMax: 65.0 };
  if (umur_bulan <= 6) return { bbMin: 4.8, bbMax: 9.8, tbMin: 58.0, tbMax: 72.0 };
  if (umur_bulan <= 9) return { bbMin: 6.0, bbMax: 11.2, tbMin: 64.0, tbMax: 77.0 };
  if (umur_bulan <= 12) return { bbMin: 6.8, bbMax: 12.5, tbMin: 68.0, tbMax: 83.0 };
  if (umur_bulan <= 18) return { bbMin: 7.8, bbMax: 14.0, tbMin: 73.0, tbMax: 90.0 };
  if (umur_bulan <= 24) return { bbMin: 8.5, bbMax: 15.5, tbMin: 78.0, tbMax: 96.0 };
  if (umur_bulan <= 36) return { bbMin: 9.8, bbMax: 18.5, tbMin: 83.0, tbMax: 104.0 };
  if (umur_bulan <= 48) return { bbMin: 11.0, bbMax: 22.0, tbMin: 89.0, tbMax: 113.0 };
  return { bbMin: 12.0, bbMax: 26.0, tbMin: 95.0, tbMax: 122.0 };
}

// Pemeriksaan batas biologis dan rekomendasi posisi ukur lapangan
export function periksaKewajaranBiologis(data: {
  umur_bulan: number;
  berat_kg: number;
  tinggi_cm: number;
  posisi_pengukuran?: "telentang" | "berdiri";
}): PlausibilityWarning[] {
  const warnings: PlausibilityWarning[] = [];
  const { umur_bulan, berat_kg, tinggi_cm, posisi_pengukuran } = data;

  if (isNaN(umur_bulan) || isNaN(berat_kg) || isNaN(tinggi_cm)) {
    return warnings;
  }

  // 1. Rekomendasi posisi ukur standar Kemenkes / WHO
  if (umur_bulan < 24 && posisi_pengukuran === "berdiri") {
    warnings.push({
      tipe: "info",
      field: "umum",
      pesan: "Balita < 24 bulan lazimnya diukur telentang (PB). Pengukuran berdiri akan dikoreksi -0.7 cm sesuai standar baku WHO.",
    });
  } else if (umur_bulan >= 24 && posisi_pengukuran === "telentang") {
    warnings.push({
      tipe: "info",
      field: "umum",
      pesan: "Anak ≥ 24 bulan lazimnya diukur berdiri (TB). Pengukuran telentang akan dikoreksi +0.7 cm sesuai standar baku WHO.",
    });
  }

  // 2. Deteksi Typo Desimal / Nilai Ekstrem Spesifik Umur
  if (umur_bulan <= 12 && berat_kg >= 20) {
    warnings.push({
      tipe: "danger",
      field: "berat_kg",
      pesan: `Berat ${berat_kg} kg untuk bayi usia ${umur_bulan} bulan sangat tidak wajar. Kemungkinan salah ketik titik desimal (misal ingin mengetik ${(berat_kg / 10).toFixed(1)} kg).`,
    });
  } else if (umur_bulan <= 6 && berat_kg > 12) {
    warnings.push({
      tipe: "warning",
      field: "berat_kg",
      pesan: `Berat ${berat_kg} kg pada bayi ≤ 6 bulan tergolong sangat tinggi (lazimnya 4.5 – 9.5 kg). Konfirmasi ulang angka pada timbangan.`,
    });
  } else if (umur_bulan >= 24 && berat_kg < 6.5) {
    warnings.push({
      tipe: "danger",
      field: "berat_kg",
      pesan: `Berat ${berat_kg} kg pada anak usia ${umur_bulan} bulan tergolong sangat rendah/kritis. Periksa ulang pembacaan alat timbang.`,
    });
  }

  // 3. Deteksi Tinggi Ekstrem
  if (umur_bulan <= 12 && tinggi_cm > 95) {
    warnings.push({
      tipe: "danger",
      field: "tinggi_cm",
      pesan: `Panjang badan ${tinggi_cm} cm untuk bayi usia ${umur_bulan} bulan sangat tidak lazim (lazimnya 65 – 83 cm). Pastikan pembacaan meteran akurat.`,
    });
  } else if (umur_bulan >= 24 && tinggi_cm < 65) {
    warnings.push({
      tipe: "danger",
      field: "tinggi_cm",
      pesan: `Tinggi badan ${tinggi_cm} cm untuk anak usia ${umur_bulan} bulan sangat rendah (lazimnya ≥ 78 cm). Periksa posisi pita ukur/stadiometer.`,
    });
  }

  // 4. Cek rasio ekstrem berat vs tinggi (BMI Indeks)
  if (tinggi_cm > 0) {
    const bmiApprox = berat_kg / Math.pow(tinggi_cm / 100, 2);
    if (bmiApprox > 26) {
      warnings.push({
        tipe: "warning",
        field: "umum",
        pesan: `Rasio berat terhadap tinggi sangat besar (BMI ~ ${bmiApprox.toFixed(1)}). Pastikan timbangan terkalibrasi dan anak tidak mengenakan jaket/pakaian tebal.`,
      });
    } else if (bmiApprox < 9.5) {
      warnings.push({
        tipe: "danger",
        field: "umum",
        pesan: `Rasio berat terhadap tinggi sangat rendah (BMI ~ ${bmiApprox.toFixed(1)}). Indikasi gizi buruk akut / wasting parah, atau terdapat salah catat angka tinggi/berat.`,
      });
    }
  }

  return warnings;
}
