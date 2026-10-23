"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  Lock,
  Phone,
  Eye,
  EyeOff,
  UserCheck,
  Building2,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Baby,
  FileSpreadsheet,
  AlertCircle,
  UserPlus,
  LogIn,
  MapPin,
  HeartHandshake,
  Zap,
  Loader2,
} from "lucide-react";
import {
  saveStoredUser,
  getStoredUser,
  registerNewUser,
  authenticateUser,
  DEMO_ACCOUNTS,
} from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();

  // Mode: "login" (Masuk ke Akun) vs "register" (Daftar Kader Baru)
  const [authMode, setAuthMode] = useState<"login" | "register">("login");

  // Common UI State
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Login Form State (Khusus Kader)
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginPosyandu, setLoginPosyandu] = useState("Posyandu Melati 03 — Desa Sukamaju");
  const [rememberMe, setRememberMe] = useState(true);

  // Registration Form State (Khusus Kader)
  const [regName, setRegName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPosyandu, setRegPosyandu] = useState("");
  const [regDesa, setRegDesa] = useState("");
  const [regKecamatan, setRegKecamatan] = useState("");
  const [regPin, setRegPin] = useState("");
  const [regConfirmPin, setRegConfirmPin] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Pre-fill if there is an existing session
  useEffect(() => {
    const existing = getStoredUser();
    if (existing) {
      setLoginIdentifier(existing.phone || existing.name);
      if (existing.posyandu) setLoginPosyandu(existing.posyandu);
    }
  }, []);

  // PIN strength helper
  const getPinStrength = (pin: string) => {
    if (!pin) return 0;
    if (pin.length < 4) return 1;
    if (pin.length >= 4 && pin.length < 6) return 2;
    return 3;
  };
  const pinStrength = getPinStrength(regPin);

  // ─────────────────────────────────────────────────────────────────────────────
  // HANDLERS
  // ─────────────────────────────────────────────────────────────────────────────

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!loginIdentifier.trim()) {
      setErrorMessage("Silakan masukkan Nomor WhatsApp, ID Kader, atau Nama Lengkap Anda.");
      return;
    }

    if (!loginPassword.trim()) {
      setErrorMessage("Silakan masukkan PIN / Kata Sandi akun Anda.");
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const res = authenticateUser(loginIdentifier, loginPassword, "kader");
      setIsLoading(false);

      if (!res.success || !res.user) {
        setErrorMessage(res.error || "Nomor HP atau PIN tidak sesuai. Periksa kembali atau gunakan akun demo.");
        return;
      }

      setSuccessMessage(`Selamat datang kembali, Ibu ${res.user.name}! Membuka dashboard kerja Posyandu...`);
      setTimeout(() => {
        router.push("/");
      }, 700);
    }, 500);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!regName.trim()) {
      setErrorMessage("Silakan masukkan Nama Lengkap Kader.");
      return;
    }

    if (!regPhone.trim()) {
      setErrorMessage("Silakan masukkan Nomor WhatsApp aktif Anda.");
      return;
    }

    if (!regPosyandu.trim()) {
      setErrorMessage("Silakan masukkan Nama Posyandu tempat Anda bertugas.");
      return;
    }

    if (!regPin.trim() || regPin.length < 4) {
      setErrorMessage("PIN Keamanan minimal terdiri dari 4 digit angka.");
      return;
    }

    if (regPin !== regConfirmPin) {
      setErrorMessage("Konfirmasi PIN tidak cocok dengan PIN yang dibuat. Silakan periksa kembali.");
      return;
    }

    if (!agreeTerms) {
      setErrorMessage("Harap centang persetujuan menjaga kerahasiaan data anak sesuai standar Kemenkes.");
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const res = registerNewUser({
        name: regName,
        role: "kader",
        phone: regPhone,
        posyandu: regPosyandu,
        desa: regDesa || "Desa Sukamaju",
        kecamatan: regKecamatan || "Kecamatan Cibinong",
        pin: regPin,
      });

      setIsLoading(false);

      if (!res.success || !res.user) {
        setErrorMessage(res.error || "Pendaftaran akun gagal. Silakan coba kembali.");
        return;
      }

      saveStoredUser(res.user);
      setSuccessMessage(
        `Registrasi Berhasil! Akun ${res.user.name} (${res.user.id}) telah aktif. Menyiapkan sistem...`
      );

      setTimeout(() => {
        router.push("/");
      }, 1000);
    }, 600);
  };

  // Instant 1-Click Demo Login untuk Kader Kania
  const handleQuickDemoKader = () => {
    setErrorMessage(null);
    const demo = DEMO_ACCOUNTS["kader"];

    setLoginIdentifier(demo.name);
    setLoginPassword("123456");
    setLoginPosyandu(demo.posyandu);

    setIsLoading(true);
    setTimeout(() => {
      saveStoredUser(demo);
      setIsLoading(false);
      setSuccessMessage(`⚡ Masuk cepat sebagai Kader ${demo.name} (${demo.posyandu})...`);
      setTimeout(() => {
        router.push("/");
      }, 600);
    }, 450);
  };

  return (
    <div className="auth-grid-layout">
      {/* ─────────────────────────────────────────────────────────────────────────────
          LEFT PANEL: Hero Overview & Edukasi Kader Posyandu
         ───────────────────────────────────────────────────────────────────────────── */}
      <div className="auth-hero-panel">
        <div>
          <div className="auth-status-badge">
            <span className="auth-pulse-dot" />
            <span>WHO LMS Engine Online • Khusus Kader Posyandu</span>
          </div>
        </div>

        <div>
          <h1 className="auth-hero-title">
            Portal Kerja Digital{" "}
            <span className="auth-gradient-text">Kader Posyandu</span>
          </h1>
          <p className="auth-hero-desc" style={{ marginTop: 8 }}>
            Alat bantu profesional kader posyandu desa untuk mendeteksi dini risiko stunting balita, menghitung Z-score otomatis standar baku WHO 2006, dan mencetak laporan e-PPGBM tanpa perhitungan manual.
          </p>
        </div>

        {/* Feature Grid: 4 Core Pillars */}
        <div className="auth-feature-grid">
          <div className="auth-feature-card">
            <h4>
              <Baby size={16} color="#16A34A" />
              Z-Score WHO Otomatis
            </h4>
            <p>Kalkulasi instan BB/U, PB/U, BB/PB dengan klasifikasi stunting, wasting, dan underweight.</p>
          </div>

          <div className="auth-feature-card">
            <h4>
              <Sparkles size={16} color="#0D9488" />
              Multi-Modal Input (OCR/Suara)
            </h4>
            <p>Scan foto catatan timbang KMS fisik dan input suara saat hari penimbangan balita ramai.</p>
          </div>

          <div className="auth-feature-card">
            <h4>
              <FileSpreadsheet size={16} color="#0284C7" />
              Ekspor e-PPGBM 1-Klik
            </h4>
            <p>Rekapitulasi otomatis siap kirim ke Puskesmas tanpa harus menyalin buku register tebal.</p>
          </div>

          <div className="auth-feature-card">
            <h4>
              <HeartHandshake size={16} color="#EA580C" />
              Panduan Pangan Lokal
            </h4>
            <p>Rekomendasi menu MP-ASI pemulihan gizi berbasis bahan pangan lokal yang terjangkau.</p>
          </div>
        </div>

        {/* Fast Access Demo Pod untuk Kader Kania */}
        <div className="auth-demo-pod">
          <div className="auth-demo-header">
            <span className="auth-demo-title">
              <Zap size={15} />
              Akses Cepat Mode Uji Coba (1-Klik Masuk)
            </span>
            <span className="auth-demo-badge">Akun Simulasi</span>
          </div>
          <p className="auth-demo-desc">
            Ingin langsung mencoba fitur pengukuran balita tanpa mengetik formulir? Klik tombol simulasi di bawah:
          </p>
          <button
            type="button"
            onClick={handleQuickDemoKader}
            className="auth-demo-card-btn"
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div className="auth-demo-avatar">
                <UserCheck size={18} />
              </div>
              <div className="auth-demo-btn-text">
                <h5>Ibu Kania Salsabila</h5>
                <span>Kader Posyandu Melati 03 — Desa Sukamaju</span>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#16A34A", fontSize: 12, fontWeight: 700 }}>
              <span>Masuk Langsung</span>
              <ArrowRight size={14} />
            </div>
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          RIGHT PANEL: Clean White Form Card
         ───────────────────────────────────────────────────────────────────────────── */}
      <div className="auth-form-card">
        <div className="auth-card-top-accent" />

        {/* Top Segmented Mode Switcher: Masuk vs Daftar Baru */}
        <div className="auth-mode-switch">
          <button
            type="button"
            onClick={() => {
              setAuthMode("login");
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            className={`auth-mode-btn ${authMode === "login" ? "active" : ""}`}
          >
            <LogIn size={15} />
            <span>1. Masuk ke Akun</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode("register");
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            className={`auth-mode-btn ${authMode === "register" ? "active" : ""}`}
          >
            <UserPlus size={15} />
            <span>2. Daftar Kader Baru</span>
          </button>
        </div>

        {/* Card Header Context */}
        <div className="auth-form-heading">
          <h2 className="auth-form-title">
            {authMode === "login" ? "Masuk ke Ruang Kerja Kader" : "Pendaftaran Kader Posyandu Baru"}
          </h2>
          <p className="auth-form-subtitle">
            {authMode === "login"
              ? "Masukkan nomor WhatsApp atau nama dan PIN Anda untuk membuka data penimbangan."
              : "Daftarkan diri Anda untuk mengelola pemantauan tumbuh kembang balita Posyandu secara digital."}
          </p>
        </div>

        {/* Dynamic Alerts */}
        {errorMessage && (
          <div className="auth-alert-box error">
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="auth-alert-box success">
            <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────────────────
            FORM 1: LOGIN KADER
           ───────────────────────────────────────────────────────────────────────── */}
        {authMode === "login" ? (
          <form onSubmit={handleLogin}>
            {/* WhatsApp / ID Kader / Nama */}
            <div className="auth-field">
              <label className="auth-field-label">
                <span>
                  Nomor WhatsApp / ID Kader / Nama Lengkap
                  <span className="auth-field-required">*</span>
                </span>
                <span style={{ fontSize: 11, color: "#64748B" }}>Akun Kader</span>
              </label>
              <div className="auth-input-wrapper">
                <span className="auth-input-icon"><Phone size={15} /></span>
                <input
                  type="text"
                  required
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  placeholder="Contoh: 0812-3456-7890 atau Kania"
                  className="auth-input"
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Posyandu & Wilayah Kerja */}
            <div className="auth-field">
              <label className="auth-field-label">
                <span>Posyandu &amp; Wilayah Tugas</span>
              </label>
              <div className="auth-input-wrapper">
                <span className="auth-input-icon"><Building2 size={15} /></span>
                <select
                  value={loginPosyandu}
                  onChange={(e) => setLoginPosyandu(e.target.value)}
                  className="auth-select"
                >
                  <option value="Posyandu Melati 03 — Desa Sukamaju">
                    Posyandu Melati 03 — Desa Sukamaju (Kader Kania)
                  </option>
                  <option value="Posyandu Mawar 01 — Desa Sukamaju">
                    Posyandu Mawar 01 — Desa Sukamaju
                  </option>
                  <option value="Posyandu Anggrek 02 — Desa Karanganyar">
                    Posyandu Anggrek 02 — Desa Karanganyar
                  </option>
                  <option value="Posyandu Dahlia 04 — Desa Sukamaju">
                    Posyandu Dahlia 04 — Desa Sukamaju
                  </option>
                  <option value="Posyandu Kenanga 05 — Desa Cibinong">
                    Posyandu Kenanga 05 — Desa Cibinong
                  </option>
                </select>
              </div>
            </div>

            {/* PIN Keamanan */}
            <div className="auth-field">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label className="auth-field-label">
                  <span>
                    PIN Keamanan (6 Digit)
                    <span className="auth-field-required">*</span>
                  </span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setLoginPassword("123456");
                    setSuccessMessage("PIN demo '123456' telah otomatis terisi.");
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#16A34A",
                    fontSize: 11.5,
                    fontWeight: 600,
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
                >
                  Gunakan PIN Demo 123456
                </button>
              </div>
              <div className="auth-input-wrapper">
                <span className="auth-input-icon"><Lock size={15} /></span>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Masukkan 6 digit PIN akun Anda"
                  className="auth-input"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="auth-input-toggle-btn"
                  title={showPassword ? "Sembunyikan PIN" : "Tampilkan PIN"}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Ingat Saya & Enkripsi */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "12px 0 18px 0" }}>
              <label style={{ display: "flex", alignItems: "center", gap: 7, cursor: "pointer", fontSize: 12, color: "#475569" }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ accentColor: "#16A34A", cursor: "pointer" }}
                />
                <span>Ingat saya di perangkat ini</span>
              </label>

              <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11.5, color: "#16A34A", fontWeight: 600 }}>
                <ShieldCheck size={13} />
                <span>Enkripsi Sesi Aktif</span>
              </div>
            </div>

            {/* Tombol Submit Login */}
            <button type="submit" disabled={isLoading} className="auth-submit-btn">
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Memverifikasi Akun Kader...</span>
                </>
              ) : (
                <>
                  <LogIn size={16} />
                  <span>Masuk ke Dashboard Posyandu</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            {/* Switch to Register */}
            <div style={{ textAlign: "center", marginTop: 16 }}>
              <span style={{ fontSize: 12, color: "#64748B" }}>Belum terdaftar sebagai Kader Posyandu? </span>
              <button
                type="button"
                onClick={() => {
                  setAuthMode("register");
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className="auth-switch-link"
              >
                Daftar Akun Kader Baru Sekarang
              </button>
            </div>
          </form>
        ) : (
          /* ─────────────────────────────────────────────────────────────────────────
              FORM 2: REGISTRASI KADER BARU
             ───────────────────────────────────────────────────────────────────────── */
          <form onSubmit={handleRegister}>
            {/* Nama Lengkap */}
            <div className="auth-field">
              <label className="auth-field-label">
                <span>Nama Lengkap Kader <span className="auth-field-required">*</span></span>
              </label>
              <div className="auth-input-wrapper">
                <span className="auth-input-icon"><UserCheck size={15} /></span>
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="Contoh: Kania Salsabila"
                  className="auth-input"
                />
              </div>
            </div>

            {/* WhatsApp */}
            <div className="auth-field">
              <label className="auth-field-label">
                <span>Nomor WhatsApp / HP Aktif <span className="auth-field-required">*</span></span>
                <span style={{ fontSize: 11, color: "#64748B" }}>Untuk login</span>
              </label>
              <div className="auth-input-wrapper">
                <span className="auth-input-icon"><Phone size={15} /></span>
                <input
                  type="tel"
                  required
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  placeholder="Contoh: 0812-3456-7890"
                  className="auth-input"
                />
              </div>
            </div>

            {/* Nama Posyandu */}
            <div className="auth-field">
              <label className="auth-field-label">
                <span>Nama Posyandu Tempat Bertugas <span className="auth-field-required">*</span></span>
              </label>
              <div className="auth-input-wrapper">
                <span className="auth-input-icon"><Building2 size={15} /></span>
                <input
                  type="text"
                  required
                  value={regPosyandu}
                  onChange={(e) => setRegPosyandu(e.target.value)}
                  placeholder="Contoh: Posyandu Melati 03"
                  className="auth-input"
                />
              </div>
            </div>

            {/* Desa & Kecamatan Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div className="auth-field">
                <label className="auth-field-label">
                  <span>Desa / Kelurahan</span>
                </label>
                <div className="auth-input-wrapper">
                  <span className="auth-input-icon"><MapPin size={14} /></span>
                  <input
                    type="text"
                    value={regDesa}
                    onChange={(e) => setRegDesa(e.target.value)}
                    placeholder="Sukamaju"
                    className="auth-input"
                  />
                </div>
              </div>

              <div className="auth-field">
                <label className="auth-field-label">
                  <span>Kecamatan</span>
                </label>
                <div className="auth-input-wrapper">
                  <span className="auth-input-icon"><MapPin size={14} /></span>
                  <input
                    type="text"
                    value={regKecamatan}
                    onChange={(e) => setRegKecamatan(e.target.value)}
                    placeholder="Cibinong"
                    className="auth-input"
                  />
                </div>
              </div>
            </div>

            {/* PIN & Konfirmasi PIN Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div className="auth-field">
                <label className="auth-field-label">
                  <span>Buat PIN (min. 4 digit) <span className="auth-field-required">*</span></span>
                </label>
                <div className="auth-input-wrapper">
                  <span className="auth-input-icon"><Lock size={14} /></span>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={regPin}
                    onChange={(e) => setRegPin(e.target.value)}
                    placeholder="6 digit PIN"
                    className="auth-input"
                  />
                </div>
                {/* Visual PIN Strength Bar */}
                <div className="auth-pin-strength-bar">
                  <div
                    className={`auth-pin-strength-segment ${
                      pinStrength >= 1 ? (pinStrength === 1 ? "active-weak" : pinStrength === 2 ? "active-medium" : "active-strong") : ""
                    }`}
                  />
                  <div
                    className={`auth-pin-strength-segment ${
                      pinStrength >= 2 ? (pinStrength === 2 ? "active-medium" : "active-strong") : ""
                    }`}
                  />
                  <div
                    className={`auth-pin-strength-segment ${
                      pinStrength === 3 ? "active-strong" : ""
                    }`}
                  />
                </div>
              </div>

              <div className="auth-field">
                <label className="auth-field-label">
                  <span>Konfirmasi PIN <span className="auth-field-required">*</span></span>
                </label>
                <div className="auth-input-wrapper">
                  <span className="auth-input-icon"><Lock size={14} /></span>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={regConfirmPin}
                    onChange={(e) => setRegConfirmPin(e.target.value)}
                    placeholder="Ulangi PIN"
                    className="auth-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="auth-input-toggle-btn"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Pakta Integritas Checkbox */}
            <div style={{ marginTop: 6, marginBottom: 16 }}>
              <label style={{ display: "flex", alignItems: "flex-start", gap: 8, cursor: "pointer", fontSize: 11.5, color: "#475569", lineHeight: 1.5 }}>
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  style={{ marginTop: 2, accentColor: "#16A34A", cursor: "pointer" }}
                />
                <span>
                  Saya menyatakan data pendaftaran ini benar dan berkomitmen menjaga kerahasiaan data kesehatan anak sesuai standar Kemenkes RI.
                </span>
              </label>
            </div>

            {/* Tombol Submit Registrasi */}
            <button type="submit" disabled={isLoading} className="auth-submit-btn">
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Mendaftarkan Akun Kader...</span>
                </>
              ) : (
                <>
                  <UserPlus size={16} />
                  <span>Daftarkan Akun Kader Sekarang</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            {/* Switch to Login */}
            <div style={{ textAlign: "center", marginTop: 14 }}>
              <span style={{ fontSize: 12, color: "#64748B" }}>Sudah punya akun sebelumnya? </span>
              <button
                type="button"
                onClick={() => {
                  setAuthMode("login");
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className="auth-switch-link"
              >
                Masuk di sini
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
