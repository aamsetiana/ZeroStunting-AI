"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import {
  Baby, Scale, Ruler, Calendar, User, Activity,
  AlertCircle, AlertTriangle, ChevronDown, ChevronUp, RotateCcw,
  UserCheck, UserPlus, History, TrendingUp, TrendingDown, Minus,
  Sparkles, CheckCircle2, ArrowRight, MapPin, Info
} from "lucide-react";
import {
  balitaFormSchema,
  type BalitaFormData,
  periksaKewajaranBiologis,
  getRentangWajar,
  sanitizeDecimalInput,
  type PlausibilityWarning,
} from "@/lib/validations";
import type { BalitaItem } from "@/components/balita/RiwayatData";
import { SearchableBalitaSelect } from "@/components/balita/SearchableBalitaSelect";

const INITIAL_FORM_DATA = {
  balita_id: "",
  nama_anak: "",
  jenis_kelamin: "L" as "L" | "P",
  tanggal_lahir: "",
  tanggal_timbang: new Date().toISOString().split("T")[0],
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

function calculateAgeInMonths(birthDateStr?: string, targetDateStr?: string): number {
  if (!birthDateStr) return 0;
  const birth = new Date(birthDateStr);
  const target = targetDateStr ? new Date(targetDateStr) : new Date();
  if (isNaN(birth.getTime()) || isNaN(target.getTime())) return 0;
  const years = target.getFullYear() - birth.getFullYear();
  const months = target.getMonth() - birth.getMonth();
  const days = target.getDate() - birth.getDate();
  let totalMonths = years * 12 + months;
  if (days < 0) totalMonths -= 1;
  return Math.max(0, Math.min(60, totalMonths));
}

interface ManualFormProps {
  onSubmitValid: (data: BalitaFormData) => Promise<void> | void;
  loading?: boolean;
  prefillData?: Partial<BalitaFormData> | null;
  resetKey?: number;
  onReset?: () => void;
  balitaList?: BalitaItem[];
  allBalitaList?: BalitaItem[];
}

export function ManualForm({
  onSubmitValid,
  loading = false,
  prefillData,
  resetKey,
  onReset,
  balitaList = [],
  allBalitaList = [],
}: ManualFormProps) {
  const firstInputRef = useRef<HTMLInputElement>(null);
  const beratInputRef = useRef<HTMLInputElement>(null);
  const tinggiInputRef = useRef<HTMLInputElement>(null);

  // Kategori input: Balita Sudah Terdaftar vs Daftarkan Balita Baru
  const [showAllPosyanduBalita, setShowAllPosyanduBalita] = useState(false);
  const availableBalitaList = useMemo(() => {
    if (showAllPosyanduBalita && allBalitaList.length > 0) {
      return allBalitaList;
    }
    if (balitaList.length > 0) {
      return balitaList;
    }
    return allBalitaList;
  }, [showAllPosyanduBalita, balitaList, allBalitaList]);

  const [inputCategory, setInputCategory] = useState<"terdaftar" | "baru">(() => {
    return availableBalitaList.length > 0 ? "terdaftar" : "baru";
  });

  const [selectedExistingBalita, setSelectedExistingBalita] = useState<BalitaItem | null>(null);

  const [formData, setFormData] = useState({
    balita_id: prefillData?.balita_id ?? "",
    nama_anak: prefillData?.nama_anak ?? "",
    jenis_kelamin: (prefillData?.jenis_kelamin as "L" | "P") ?? "L",
    tanggal_lahir: prefillData?.tanggal_lahir ?? "",
    tanggal_timbang: prefillData?.tanggal_timbang ?? new Date().toISOString().split("T")[0],
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

  // Progressive Disclosure: Formulir pengukuran hanya muncul jika mode "baru" ATAU balita sudah dipilih
  const shouldShowMeasurementFields =
    inputCategory === "baru" || (inputCategory === "terdaftar" && selectedExistingBalita !== null);

  // Handler saat balita terdaftar dipilih dari dropdown atau tombol cepat
  const handleSelectExistingBalita = (balita: BalitaItem) => {
    setSelectedExistingBalita(balita);
    const ageMonths = calculateAgeInMonths(balita.tanggalLahir, formData.tanggal_timbang);
    const pos = ageMonths >= 24 ? "berdiri" : "telentang";

    setFormData((prev) => ({
      ...prev,
      balita_id: balita.id,
      nama_anak: balita.nama,
      jenis_kelamin: balita.jenisKelamin,
      tanggal_lahir: balita.tanggalLahir || "",
      umur_bulan: String(ageMonths),
      nama_ibu: balita.namaIbu && balita.namaIbu !== "-" ? balita.namaIbu : "",
      dusun_rt: balita.dusun && balita.dusun !== "-" ? balita.dusun : "",
      posisi_pengukuran: pos,
      // Siapkan kolom hasil timbang kosong agar fokus ke input hari ini
      berat_kg: "",
      tinggi_cm: "",
      lingkar_kepala_cm: "",
      lingkar_lengan_cm: "",
    }));

    setErrors({});
    setTimeout(() => {
      beratInputRef.current?.focus();
    }, 150);
  };

  // Live delta berat badan dibandingkan dengan hasil penimbangan terakhir (KBM)
  const deltaBB = useMemo(() => {
    if (!selectedExistingBalita || !selectedExistingBalita.beratTerakhir) return null;
    const currentWeight = Number(formData.berat_kg);
    if (isNaN(currentWeight) || currentWeight <= 0) return null;
    return Number((currentWeight - selectedExistingBalita.beratTerakhir).toFixed(2));
  }, [selectedExistingBalita, formData.berat_kg]);

  // Live delta tinggi badan dibandingkan dengan hasil terakhir
  const deltaTB = useMemo(() => {
    if (!selectedExistingBalita || !selectedExistingBalita.tinggiTerakhir) return null;
    const currentHeight = Number(formData.tinggi_cm);
    if (isNaN(currentHeight) || currentHeight <= 0) return null;
    return Number((currentHeight - selectedExistingBalita.tinggiTerakhir).toFixed(1));
  }, [selectedExistingBalita, formData.tinggi_cm]);

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

  // Autofocus saat mount / reset / pemilihan balita
  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputCategory === "baru" && firstInputRef.current) {
        firstInputRef.current.focus();
      } else if (inputCategory === "terdaftar" && selectedExistingBalita && beratInputRef.current) {
        beratInputRef.current.focus();
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [resetKey, inputCategory, selectedExistingBalita]);

  // Sync state when resetKey changes (otomatis reset saat simpan sukses)
  const [lastResetKey, setLastResetKey] = useState(resetKey);
  if (resetKey !== undefined && resetKey !== lastResetKey) {
    setLastResetKey(resetKey);
    setFormData(INITIAL_FORM_DATA);
    setSelectedExistingBalita(null);
    setErrors({});
    setShowOptional(false);
    setShowConfirmModal(false);
    setPendingData(null);
    setHasConfirmedExtreme(false);
  }

  // Sync state when prefillData changes (misal dari OCR)
  const [lastPrefill, setLastPrefill] = useState(prefillData);
  if (prefillData !== lastPrefill) {
    setLastPrefill(prefillData);
    if (prefillData) {
      setInputCategory("baru");
      setSelectedExistingBalita(null);
      setFormData(p => ({
        ...p,
        balita_id: "",
        nama_anak: prefillData.nama_anak ?? p.nama_anak,
        jenis_kelamin: prefillData.jenis_kelamin ?? p.jenis_kelamin,
        umur_bulan: prefillData.umur_bulan != null ? String(prefillData.umur_bulan) : p.umur_bulan,
        berat_kg: prefillData.berat_kg != null ? String(prefillData.berat_kg) : p.berat_kg,
        tinggi_cm: prefillData.tinggi_cm != null ? String(prefillData.tinggi_cm) : p.tinggi_cm,
        lingkar_kepala_cm: prefillData.lingkar_kepala_cm != null ? String(prefillData.lingkar_kepala_cm) : p.lingkar_kepala_cm,
        lingkar_lengan_cm: prefillData.lingkar_lengan_cm != null ? String(prefillData.lingkar_lengan_cm) : p.lingkar_lengan_cm,
      }));
    } else if (prefillData === null && lastPrefill !== null) {
      setFormData(INITIAL_FORM_DATA);
      setSelectedExistingBalita(null);
      setErrors({});
      setShowConfirmModal(false);
      setPendingData(null);
      setHasConfirmedExtreme(false);
    }
  }

  const handleResetForm = () => {
    setSelectedExistingBalita(null);
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

    // Jika mode "Balita Sudah Ada" tapi belum memilih balita
    if (inputCategory === "terdaftar" && !selectedExistingBalita) {
      setErrors({ selected_balita: "Silakan pilih salah satu balita dari daftar di bawah terlebih dahulu." });
      return;
    }

    const rawData = {
      balita_id: formData.balita_id || undefined,
      nama_anak: formData.nama_anak.trim(),
      jenis_kelamin: formData.jenis_kelamin,
      tanggal_lahir: formData.tanggal_lahir || undefined,
      tanggal_timbang: formData.tanggal_timbang || undefined,
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

    // Langsung proses kalkulasi & simpan
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
        border: "1px solid #E2E8F0",
        borderRadius: 16,
        padding: 24,
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
      }}
    >
      {/* Header Form */}
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
            <Scale size={18} color="#15803D" />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#0F172A" }}>
              Input Pengukuran Balita
            </div>
            <div style={{ fontSize: 12, color: "#64748B" }}>
              Standar Antropometri WHO & Kemenkes RI
            </div>
          </div>
        </div>

        {/* Tombol Kosongkan / Reset Form */}
        <button
          type="button"
          onClick={handleResetForm}
          title="Kosongkan semua isian form"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            fontSize: 12,
            fontWeight: 600,
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
          <span>Reset Form</span>
        </button>
      </div>

      <form onSubmit={handleFormSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* ── Mode Switcher: Balita Terdaftar vs Balita Baru ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 6,
            background: "#F1F5F9",
            padding: 4,
            borderRadius: 10,
          }}
        >
          {/* Opsi 1: Balita Sudah Ada */}
          <button
            type="button"
            onClick={() => {
              setInputCategory("terdaftar");
              setErrors({});
            }}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: "9px 12px",
              borderRadius: 8,
              border: "none",
              background: inputCategory === "terdaftar" ? "#FFFFFF" : "transparent",
              color: inputCategory === "terdaftar" ? "#0F172A" : "#64748B",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
              boxShadow: inputCategory === "terdaftar" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              transition: "all 0.15s ease",
            }}
          >
            <UserCheck size={16} color={inputCategory === "terdaftar" ? "#16A34A" : "#64748B"} />
            <span>Balita Terdaftar</span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                padding: "1px 7px",
                borderRadius: 99,
                background: inputCategory === "terdaftar" ? "#DCFCE7" : "#E2E8F0",
                color: inputCategory === "terdaftar" ? "#15803D" : "#475569",
              }}
            >
              {availableBalitaList.length}
            </span>
          </button>

          {/* Opsi 2: Daftarkan Balita Baru */}
          <button
            type="button"
            onClick={() => {
              setInputCategory("baru");
              setSelectedExistingBalita(null);
              setFormData(INITIAL_FORM_DATA);
              setErrors({});
              setTimeout(() => firstInputRef.current?.focus(), 80);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: "9px 12px",
              borderRadius: 8,
              border: "none",
              background: inputCategory === "baru" ? "#FFFFFF" : "transparent",
              color: inputCategory === "baru" ? "#0F172A" : "#64748B",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
              boxShadow: inputCategory === "baru" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              transition: "all 0.15s ease",
            }}
          >
            <UserPlus size={16} color={inputCategory === "baru" ? "#0284C7" : "#64748B"} />
            <span>Registrasi Balita Baru</span>
          </button>
        </div>

        {/* ── Mode 1: Pemilihan Balita yang Sudah Terdaftar ── */}
        {inputCategory === "terdaftar" && (
          <div>
            {!selectedExistingBalita ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
                  <label style={labelStyle}>
                    <User size={14} color="#16A34A" /> Pilih Data Balita
                    <span style={{ color: "#DC2626", marginLeft: 2 }}>*</span>
                  </label>

                  {allBalitaList.length > (balitaList.length || 0) && (
                    <label
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        fontSize: 11.5,
                        fontWeight: 600,
                        color: "#475569",
                        cursor: "pointer",
                        userSelect: "none",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={showAllPosyanduBalita}
                        onChange={(e) => setShowAllPosyanduBalita(e.target.checked)}
                        style={{ accentColor: "#16A34A", cursor: "pointer" }}
                      />
                      Cari lintas Posyandu ({allBalitaList.length} anak)
                    </label>
                  )}
                </div>

                {availableBalitaList.length === 0 ? (
                  <div
                    style={{
                      padding: "20px 16px",
                      borderRadius: 12,
                      background: "#F8FAFC",
                      border: "1px dashed #CBD5E1",
                      textAlign: "center",
                      fontSize: 13,
                      color: "#64748B",
                    }}
                  >
                    <p style={{ margin: "0 0 10px 0" }}>Belum ada data balita terdaftar di posyandu ini.</p>
                    <button
                      type="button"
                      onClick={() => setInputCategory("baru")}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        background: "#16A34A",
                        color: "#FFFFFF",
                        border: "none",
                        borderRadius: 8,
                        padding: "7px 14px",
                        fontSize: 12.5,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      <UserPlus size={15} />
                      <span>Daftarkan Balita Baru</span>
                    </button>
                  </div>
                ) : (
                  <SearchableBalitaSelect
                    balitaList={availableBalitaList}
                    selectedId=""
                    onSelect={handleSelectExistingBalita}
                    placeholder="Cari nama balita, NIK, nama ibu, atau dusun..."
                  />
                )}

                {errors.selected_balita && (
                  <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#DC2626", fontSize: 12, marginTop: 4 }}>
                    <AlertCircle size={13} /> {errors.selected_balita}
                  </div>
                )}
              </div>
            ) : (
              /* Kartu Balita Aktif yang Terpilih */
              <div
                style={{
                  background: "#F8FAFC",
                  border: "1px solid #E2E8F0",
                  borderRadius: 12,
                  padding: "14px 16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#0F172A", display: "flex", alignItems: "center", gap: 8 }}>
                      {selectedExistingBalita.nama}
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          padding: "2px 8px",
                          borderRadius: 6,
                          background: selectedExistingBalita.jenisKelamin === "L" ? "#E0F2FE" : "#FCE7F3",
                          color: selectedExistingBalita.jenisKelamin === "L" ? "#0284C7" : "#BE185D",
                        }}
                      >
                        {selectedExistingBalita.jenisKelamin === "L" ? "Laki-laki" : "Perempuan"}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          padding: "2px 8px",
                          borderRadius: 6,
                          background: "#DCFCE7",
                          color: "#15803D",
                        }}
                      >
                        {formData.umur_bulan} Bulan
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: "#64748B", marginTop: 4 }}>
                      Lahir: <span style={{ color: "#334155", fontWeight: 500 }}>{selectedExistingBalita.tanggalLahir || "-"}</span> &bull; Ibu: <span style={{ color: "#334155", fontWeight: 500 }}>{selectedExistingBalita.namaIbu || "-"}</span> &bull; <span style={{ color: "#334155", fontWeight: 500 }}>{selectedExistingBalita.dusun || "-"}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedExistingBalita(null);
                      setFormData(INITIAL_FORM_DATA);
                    }}
                    style={{
                      background: "#FFFFFF",
                      border: "1px solid #CBD5E1",
                      color: "#475569",
                      borderRadius: 8,
                      padding: "5px 10px",
                      fontSize: 11.5,
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "#94A3B8";
                      e.currentTarget.style.color = "#0F172A";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "#CBD5E1";
                      e.currentTarget.style.color = "#475569";
                    }}
                  >
                    <RotateCcw size={12} />
                    <span>Ganti</span>
                  </button>
                </div>

                {/* Track Record Pengukuran Terakhir */}
                <div
                  style={{
                    background: "#FFFFFF",
                    borderRadius: 8,
                    padding: "8px 12px",
                    border: "1px solid #E2E8F0",
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: 8,
                    textAlign: "center",
                  }}
                >
                  <div>
                    <span style={{ fontSize: 11, color: "#64748B" }}>Timbang Terakhir</span>
                    <p style={{ margin: "2px 0 0", fontSize: 12, fontWeight: 700, color: "#0F172A" }}>
                      {selectedExistingBalita.terakhirTimbang || "-"}
                    </p>
                  </div>
                  <div>
                    <span style={{ fontSize: 11, color: "#64748B" }}>BB Terakhir</span>
                    <p style={{ margin: "2px 0 0", fontSize: 12.5, fontWeight: 700, color: "#0284C7" }}>
                      {selectedExistingBalita.beratTerakhir ? `${selectedExistingBalita.beratTerakhir} kg` : "-"}
                    </p>
                  </div>
                  <div>
                    <span style={{ fontSize: 11, color: "#64748B" }}>TB Terakhir</span>
                    <p style={{ margin: "2px 0 0", fontSize: 12.5, fontWeight: 700, color: "#0284C7" }}>
                      {selectedExistingBalita.tinggiTerakhir ? `${selectedExistingBalita.tinggiTerakhir} cm` : "-"}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Mode 2: Input Balita Baru ── */}
        {inputCategory === "baru" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Nama Balita Baru */}
            <div>
              <label style={labelStyle}>
                <User size={14} color="#0284C7" /> Nama Lengkap Balita
                <span style={{ color: "#DC2626", marginLeft: 2 }}>*</span>
              </label>
              <input
                ref={firstInputRef}
                autoFocus
                type="text"
                className="input-field"
                placeholder="Nama lengkap balita"
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

            {/* Jenis Kelamin & Tanggal Lahir (Dua Kolom) */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {/* Jenis Kelamin */}
              <div>
                <label style={labelStyle}>
                  Jenis Kelamin
                  <span style={{ color: "#DC2626", marginLeft: 2 }}>*</span>
                </label>
                <div style={{ display: "flex", gap: 6 }}>
                  {(["L", "P"] as const).map(g => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setFormData(p => ({ ...p, jenis_kelamin: g }))}
                      style={{
                        flex: 1,
                        padding: "8px 0",
                        borderRadius: 8,
                        border: formData.jenis_kelamin === g ? "1.5px solid #0284C7" : "1px solid #CBD5E1",
                        background: formData.jenis_kelamin === g ? "#F0F9FF" : "#FFFFFF",
                        color: formData.jenis_kelamin === g ? "#0284C7" : "#475569",
                        fontSize: 12.5,
                        fontWeight: 600,
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {g === "L" ? "Laki-laki" : "Perempuan"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tanggal Lahir */}
              <div>
                <label style={labelStyle}>
                  <Calendar size={14} color="#0284C7" /> Tanggal Lahir
                  <span style={{ fontSize: 11, color: "#64748B", fontWeight: 400 }}>(Opsional)</span>
                </label>
                <input
                  type="date"
                  className="input-field"
                  value={formData.tanggal_lahir}
                  onChange={e => {
                    const val = e.target.value;
                    const calculatedAge = val ? calculateAgeInMonths(val, formData.tanggal_timbang) : formData.umur_bulan;
                    const pos = Number(calculatedAge) >= 24 ? "berdiri" : "telentang";
                    setFormData(p => ({
                      ...p,
                      tanggal_lahir: val,
                      umur_bulan: val ? String(calculatedAge) : p.umur_bulan,
                      posisi_pengukuran: pos,
                    }));
                    if (val) clearFieldError("umur_bulan");
                  }}
                />
              </div>
            </div>

            {/* Nama Ibu & Dusun / RT */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={labelStyle}>
                  Nama Ibu Kandung
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Nama ibu kandung"
                  value={formData.nama_ibu}
                  onChange={e => setFormData(p => ({ ...p, nama_ibu: e.target.value }))}
                />
              </div>
              <div>
                <label style={labelStyle}>
                  Dusun / RT
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Dusun / RT"
                  value={formData.dusun_rt}
                  onChange={e => setFormData(p => ({ ...p, dusun_rt: e.target.value }))}
                />
              </div>
            </div>
          </div>
        )}

        {/* ── Formulir Isian Pengukuran ── */}
        {shouldShowMeasurementFields && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Header Seksi Pengukuran */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                paddingTop: 12,
                borderTop: "1px solid #E2E8F0",
              }}
            >
              <span style={{ fontSize: 12.5, fontWeight: 700, color: "#0F172A", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                Parameter Pengukuran
              </span>
              <span style={{ fontSize: 11.5, color: "#64748B", fontWeight: 500 }}>
                Standar Baku WHO 2006
              </span>
            </div>

            {/* Tanggal Penimbangan & Umur Balita */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={labelStyle}>
                  <Calendar size={14} color="#16A34A" /> Tanggal Timbang
                  <span style={{ color: "#DC2626", marginLeft: 2 }}>*</span>
                </label>
                <input
                  type="date"
                  className="input-field"
                  value={formData.tanggal_timbang}
                  onChange={e => {
                    const val = e.target.value;
                    setFormData(p => {
                      let updatedAge = p.umur_bulan;
                      if (formData.tanggal_lahir) {
                        updatedAge = String(calculateAgeInMonths(formData.tanggal_lahir, val));
                      }
                      return { ...p, tanggal_timbang: val, umur_bulan: updatedAge };
                    });
                  }}
                />
              </div>

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
                    placeholder="0"
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
                      fontSize: 12.5,
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
                    placeholder="0.0"
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
                      fontSize: 12.5,
                      color: "#64748B",
                      fontWeight: 600,
                    }}
                  >
                    kg
                  </span>
                </div>

                {/* Live Delta KBM Indicator */}
                {deltaBB !== null && (
                  <div
                    style={{
                      marginTop: 6,
                      padding: "3px 8px",
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 600,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      background: deltaBB > 0 ? "#F0FDF4" : deltaBB === 0 ? "#FEF3C7" : "#FEF2F2",
                      color: deltaBB > 0 ? "#15803D" : deltaBB === 0 ? "#B45309" : "#B91C1C",
                      border: `1px solid ${deltaBB > 0 ? "#BBF7D0" : deltaBB === 0 ? "#FDE68A" : "#FECACA"}`,
                    }}
                  >
                    {deltaBB > 0 ? (
                      <>
                        <TrendingUp size={12} />
                        <span>+{deltaBB} kg (Naik)</span>
                      </>
                    ) : deltaBB === 0 ? (
                      <>
                        <Minus size={12} />
                        <span>+0.0 kg (Tetap)</span>
                      </>
                    ) : (
                      <>
                        <TrendingDown size={12} />
                        <span>{deltaBB} kg (Turun)</span>
                      </>
                    )}
                  </div>
                )}

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
                    placeholder="0.0"
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
                      fontSize: 12.5,
                      color: "#64748B",
                      fontWeight: 600,
                    }}
                  >
                    cm
                  </span>
                </div>

                {/* Live Delta TB Indicator */}
                {deltaTB !== null && (
                  <div
                    style={{
                      marginTop: 6,
                      padding: "3px 8px",
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 600,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      background: deltaTB >= 0 ? "#F0FDF4" : "#FEF2F2",
                      color: deltaTB >= 0 ? "#15803D" : "#B91C1C",
                      border: `1px solid ${deltaTB >= 0 ? "#BBF7D0" : "#FECACA"}`,
                    }}
                  >
                    <Ruler size={11} />
                    <span>{deltaTB >= 0 ? `+${deltaTB}` : deltaTB} cm</span>
                  </div>
                )}

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
                  justifyContent: "space-between",
                  padding: "7px 12px",
                  background: "#F8FAFC",
                  border: "1px solid #E2E8F0",
                  borderRadius: 8,
                  fontSize: 12,
                  color: "#334155",
                  flexWrap: "wrap",
                  gap: 6,
                }}
              >
                <span style={{ fontWeight: 600 }}>Rentang Baku WHO ({ageNum} bln):</span>
                <span style={{ color: "#475569" }}>
                  BB: <strong>{rentangWajar.bbMin}–{rentangWajar.bbMax} kg</strong> &bull; PB/TB: <strong>{rentangWajar.tbMin}–{rentangWajar.tbMax} cm</strong>
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
                        padding: "8px 12px",
                        background: bgColor,
                        border: `1px solid ${borderColor}`,
                        borderRadius: 8,
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

            {/* Posisi Pengukuran */}
            <div>
              <label style={labelStyle}>
                Posisi Pengukuran
              </label>
              <div style={{ display: "flex", gap: 8 }}>
                {[
                  { id: "telentang", label: "Telentang (Panjang Badan / PB)" },
                  { id: "berdiri", label: "Berdiri (Tinggi Badan / TB)" },
                ].map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setFormData(p => ({ ...p, posisi_pengukuran: m.id as "telentang" | "berdiri" }))}
                    style={{
                      flex: 1,
                      padding: "8px 8px",
                      borderRadius: 8,
                      border: formData.posisi_pengukuran === m.id ? "1.5px solid #16A34A" : "1px solid #CBD5E1",
                      background: formData.posisi_pengukuran === m.id ? "#F0FDF4" : "#FFFFFF",
                      color: formData.posisi_pengukuran === m.id ? "#15803D" : "#64748B",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Data Tambahan (LiLA, Lingkar Kepala, Catatan) */}
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
                  padding: "4px 0",
                  color: "#64748B",
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                <span>{showOptional ? "- Sembunyikan Parameter Tambahan" : "+ Parameter Tambahan (LiLA, Lingkar Kepala, Catatan)"}</span>
                {showOptional ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              </button>

              {showOptional && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8, padding: 12, background: "#F8FAFC", borderRadius: 10, border: "1px solid #E2E8F0" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    {/* Lingkar Kepala */}
                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#334155", marginBottom: 4 }}>
                        Lingkar Kepala (cm)
                      </label>
                      <input
                        type="text"
                        inputMode="decimal"
                        className="input-field"
                        placeholder="0.0"
                        value={formData.lingkar_kepala_cm}
                        onChange={e => {
                          const val = sanitizeDecimalInput(e.target.value);
                          setFormData(p => ({ ...p, lingkar_kepala_cm: val }));
                          clearFieldError("lingkar_kepala_cm");
                        }}
                      />
                    </div>

                    {/* LiLA */}
                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#334155", marginBottom: 4 }}>
                        Lingkar Lengan / LiLA (cm)
                      </label>
                      <input
                        type="text"
                        inputMode="decimal"
                        className="input-field"
                        placeholder="0.0"
                        value={formData.lingkar_lengan_cm}
                        onChange={e => {
                          const val = sanitizeDecimalInput(e.target.value);
                          setFormData(p => ({ ...p, lingkar_lengan_cm: val }));
                          clearFieldError("lingkar_lengan_cm");
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#334155", marginBottom: 4 }}>
                      Catatan Kader
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Catatan kondisi balita (opsional)"
                      value={formData.catatan_kader}
                      onChange={e => setFormData(p => ({ ...p, catatan_kader: e.target.value }))}
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
                borderRadius: 10,
                marginTop: 4,
              }}
            >
              <Scale size={18} />
              <span>
                {loading
                  ? "Menghitung Z-Score WHO..."
                  : inputCategory === "terdaftar"
                  ? "Hitung Z-Score & Simpan Penimbangan"
                  : "Hitung Status Gizi & Simpan Balita"}
              </span>
            </button>
          </div>
        )}
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
