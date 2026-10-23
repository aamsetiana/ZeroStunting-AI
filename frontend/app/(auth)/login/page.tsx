"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Lock,
  Phone,
  Eye,
  EyeOff,
  UserCheck,
  Building2,
  CheckCircle2,
  ArrowRight,
  AlertCircle,
  UserPlus,
  LogIn,
  Loader2,
  Stethoscope,
  Baby,
  ShieldCheck,
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

  // Mode: "login" vs "register"
  const [authMode, setAuthMode] = useState<"login" | "register">("login");

  // Peran aktif: "kader" vs "bidan"
  const [selectedRole, setSelectedRole] = useState<"kader" | "bidan">("kader");

  // UI State
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form State: Login
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginPosyandu, setLoginPosyandu] = useState("Posyandu Melati 03 — Desa Sukamaju");

  // Form State: Register (Minimalist 4 fields)
  const [regName, setRegName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPosyandu, setRegPosyandu] = useState("");
  const [regPin, setRegPin] = useState("");

  // Sync existing user data after initial client mount to avoid SSR hydration mismatch
  useEffect(() => {
    const timer = setTimeout(() => {
      const existing = getStoredUser();
      if (existing) {
        setLoginIdentifier(existing.phone || existing.name);
        if (existing.posyandu) setLoginPosyandu(existing.posyandu);
        if (existing.role === "bidan" || existing.role === "kader") {
          setSelectedRole(existing.role);
        }
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Quick Switch Persona (Kader vs Bidan)
  const handleRoleSelect = (role: "kader" | "bidan") => {
    setSelectedRole(role);
    setErrorMessage(null);
    if (role === "kader") {
      setLoginPosyandu("Posyandu Melati 03 — Desa Sukamaju");
    } else {
      setLoginPosyandu("Puskesmas Pembantu Sukamaju");
    }
  };

  // 1-Click Demo Fill
  const handleApplyDemo = (role: "kader" | "bidan") => {
    const demo = DEMO_ACCOUNTS[role];
    setSelectedRole(role);
    setLoginIdentifier(demo.name);
    setLoginPassword("123456");
    setLoginPosyandu(demo.posyandu);
    setErrorMessage(null);
    setSuccessMessage(`⚡ Akun ${demo.name} terisi. Silakan tekan tombol Masuk.`);
  };

  // Handle Login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!loginIdentifier.trim()) {
      setErrorMessage("Silakan masukkan Nomor WhatsApp atau Nama Kader.");
      return;
    }

    if (!loginPassword.trim()) {
      setErrorMessage("Silakan masukkan PIN keamanan akun Anda.");
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const res = authenticateUser(loginIdentifier, loginPassword, selectedRole);
      setIsLoading(false);

      if (!res.success || !res.user) {
        setErrorMessage(res.error || "Nomor atau PIN tidak sesuai. Coba tombol akun demo.");
        return;
      }

      setSuccessMessage(`Selamat datang kembali, ${res.user.name}! Membuka sistem posyandu...`);
      setTimeout(() => {
        router.push("/");
      }, 600);
    }, 450);
  };

  // Handle Register
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!regName.trim() || !regPhone.trim() || !regPosyandu.trim()) {
      setErrorMessage("Harap lengkapi Nama, Nomor WhatsApp, dan Posyandu Anda.");
      return;
    }

    if (!regPin.trim() || regPin.length < 4) {
      setErrorMessage("PIN keamanan minimal terdiri dari 4 digit angka.");
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const res = registerNewUser({
        name: regName,
        role: selectedRole,
        phone: regPhone,
        posyandu: regPosyandu,
        desa: "Desa Sukamaju",
        kecamatan: "Kecamatan Cibinong",
        pin: regPin,
      });

      setIsLoading(false);

      if (!res.success || !res.user) {
        setErrorMessage(res.error || "Pendaftaran akun gagal. Silakan coba kembali.");
        return;
      }

      saveStoredUser(res.user);
      setSuccessMessage(`Registrasi Berhasil! Akun ${res.user.name} telah aktif. Masuk ke aplikasi...`);
      setTimeout(() => {
        router.push("/");
      }, 700);
    }, 550);
  };

  // PIN dot indicators (up to 6 dots)
  const currentPinLen = authMode === "login" ? loginPassword.length : regPin.length;

  return (
    <div className="auth-clean-container">
      {/* Friendly Context Header */}
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          background: "rgba(255, 255, 255, 0.9)",
          border: "1px solid #BBF7D0",
          borderRadius: 99,
          padding: "4px 14px",
          fontSize: 12,
          color: "#15803D",
          fontWeight: 700,
          boxShadow: "0 2px 6px rgba(22, 163, 74, 0.1)",
          marginBottom: 10,
        }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#16A34A" }} />
          Posyandu Melati 01 • Desa Sukamaju
        </div>

        <h1 style={{
          fontSize: 26,
          fontWeight: 800,
          color: "#0F172A",
          margin: "0 0 6px 0",
          letterSpacing: "-0.02em",
        }}>
          Masuk ke Ruang Kerja Posyandu
        </h1>
        <p style={{
          fontSize: 13.5,
          color: "#475569",
          margin: 0,
          maxWidth: 420,
          lineHeight: 1.45,
        }}>
          Deteksi dini risiko stunting dan rekapitulasi data balita berbasis standar WHO 2006.
        </p>
      </div>

      {/* Main Glassmorphic Card */}
      <div className="auth-clean-card">
        {/* Interactive Persona Pill Switcher */}
        <div style={{ marginBottom: 16 }}>
          <div style={{
            fontSize: 11,
            fontWeight: 700,
            color: "#64748B",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            marginBottom: 6,
            textAlign: "center",
          }}>
            Pilih Peran Petugas
          </div>
          <div className="auth-role-tabs">
            <button
              type="button"
              onClick={() => handleRoleSelect("kader")}
              className={`auth-role-tab ${selectedRole === "kader" ? "active" : ""}`}
            >
              <Baby size={16} color={selectedRole === "kader" ? "#16A34A" : "#64748B"} />
              <span>Ibu Kader Posyandu</span>
            </button>
            <button
              type="button"
              onClick={() => handleRoleSelect("bidan")}
              className={`auth-role-tab ${selectedRole === "bidan" ? "active" : ""}`}
            >
              <Stethoscope size={16} color={selectedRole === "bidan" ? "#16A34A" : "#64748B"} />
              <span>Bidan Desa / Puskesmas</span>
            </button>
          </div>
        </div>

        {/* 1-Click Interactive Demo Access */}
        {authMode === "login" && (
          <div style={{ marginBottom: 16 }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 6,
            }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#64748B" }}>
                ⚡ Akses Cepat Uji Coba:
              </span>
              <span style={{ fontSize: 10.5, color: "#16A34A", fontWeight: 600 }}>PIN: 123456</span>
            </div>
            <div className="auth-demo-chips">
              <button
                type="button"
                onClick={() => handleApplyDemo("kader")}
                className="auth-demo-chip-btn"
                title="Isi otomatis akun kader Kania Salsabila"
              >
                <UserCheck size={13} />
                <span>Ibu Kania (Kader)</span>
              </button>
              <button
                type="button"
                onClick={() => handleApplyDemo("bidan")}
                className="auth-demo-chip-btn"
                style={{ background: "#F0F9FF", borderColor: "#BAE6FD", color: "#0284C7" }}
                title="Isi otomatis akun Bidan Siti Rahma"
              >
                <Stethoscope size={13} />
                <span>Bidan Siti (Puskesmas)</span>
              </button>
            </div>
          </div>
        )}

        {/* Mode Switcher: Masuk vs Daftar Baru */}
        <div style={{
          display: "flex",
          borderBottom: "1px solid #E2E8F0",
          marginBottom: 18,
          gap: 16,
        }}>
          <button
            type="button"
            onClick={() => { setAuthMode("login"); setErrorMessage(null); }}
            style={{
              padding: "6px 0 10px 0",
              border: "none",
              borderBottom: authMode === "login" ? "2.5px solid #16A34A" : "2.5px solid transparent",
              background: "none",
              cursor: "pointer",
              fontSize: 13.5,
              fontWeight: authMode === "login" ? 800 : 600,
              color: authMode === "login" ? "#15803D" : "#64748B",
              display: "flex",
              alignItems: "center",
              gap: 6,
              transition: "all 0.15s ease",
            }}
          >
            <LogIn size={15} /> Masuk Akun
          </button>
          <button
            type="button"
            onClick={() => { setAuthMode("register"); setErrorMessage(null); }}
            style={{
              padding: "6px 0 10px 0",
              border: "none",
              borderBottom: authMode === "register" ? "2.5px solid #16A34A" : "2.5px solid transparent",
              background: "none",
              cursor: "pointer",
              fontSize: 13.5,
              fontWeight: authMode === "register" ? 800 : 600,
              color: authMode === "register" ? "#15803D" : "#64748B",
              display: "flex",
              alignItems: "center",
              gap: 6,
              transition: "all 0.15s ease",
            }}
          >
            <UserPlus size={15} /> Daftar Baru
          </button>
        </div>

        {/* Dynamic Alerts */}
        {errorMessage && (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 14px",
            background: "#FEF2F2",
            border: "1px solid #FECACA",
            borderRadius: 10,
            fontSize: 12.5,
            color: "#B91C1C",
            fontWeight: 600,
            marginBottom: 16,
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 14px",
            background: "#F0FDF4",
            border: "1px solid #BBF7D0",
            borderRadius: 10,
            fontSize: 12.5,
            color: "#15803D",
            fontWeight: 700,
            marginBottom: 16,
          }}>
            <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* FORM 1: LOGIN */}
        {authMode === "login" ? (
          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Input WhatsApp / Nama */}
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 5 }}>
                Nomor WhatsApp atau Nama Lengkap
              </label>
              <div className="auth-input-wrapper">
                <span className="auth-input-icon"><Phone size={15} color="#64748B" /></span>
                <input
                  type="text"
                  required
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  placeholder={selectedRole === "kader" ? "Contoh: 0812-3456-7890 atau Kania" : "Contoh: 0898-7654-3210 atau Siti"}
                  className="auth-input"
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Posyandu Wilayah Tugas */}
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 5 }}>
                Posyandu / Wilayah Kerja
              </label>
              <div className="auth-input-wrapper">
                <span className="auth-input-icon"><Building2 size={15} color="#64748B" /></span>
                <select
                  value={loginPosyandu}
                  onChange={(e) => setLoginPosyandu(e.target.value)}
                  className="auth-select"
                >
                  <option value="Posyandu Melati 01 — Desa Sukamaju">Posyandu Melati 01 — RW 01</option>
                  <option value="Posyandu Melati 02 — Desa Sukamaju">Posyandu Melati 02 — RW 02</option>
                  <option value="Posyandu Melati 03 — Desa Sukamaju">Posyandu Melati 03 — RW 03</option>
                  <option value="Posyandu Mawar 04 — Desa Sukamaju">Posyandu Mawar 04 — RW 04</option>
                  <option value="Puskesmas Pembantu Sukamaju">Puskesmas Pembantu Sukamaju</option>
                </select>
              </div>
            </div>

            {/* PIN Keamanan dengan Indikator Dots Interaktif */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#334155" }}>
                  PIN Keamanan
                </label>
                <button
                  type="button"
                  onClick={() => setLoginPassword("123456")}
                  style={{
                    background: "none", border: "none", padding: 0,
                    fontSize: 11, color: "#16A34A", fontWeight: 700, cursor: "pointer",
                  }}
                >
                  Gunakan PIN Demo (123456)
                </button>
              </div>

              <div className="auth-input-wrapper">
                <span className="auth-input-icon"><Lock size={15} color="#64748B" /></span>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Masukkan 6 digit PIN"
                  className="auth-input"
                  maxLength={12}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="auth-password-toggle"
                  title={showPassword ? "Sembunyikan PIN" : "Tampilkan PIN"}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>

              {/* Interactive PIN Dot Indicators */}
              <div className="auth-pin-dots">
                {[0, 1, 2, 3, 4, 5].map((idx) => (
                  <span
                    key={idx}
                    className={`auth-pin-dot ${idx < currentPinLen ? "filled" : ""}`}
                  />
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                background: "linear-gradient(135deg, #16A34A, #15803D)",
                color: "#FFFFFF",
                border: "none",
                borderRadius: 12,
                padding: "12px 18px",
                fontSize: 14.5,
                fontWeight: 700,
                cursor: isLoading ? "not-allowed" : "pointer",
                boxShadow: "0 4px 12px rgba(22, 163, 74, 0.28)",
                transition: "all 0.15s ease",
                marginTop: 6,
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 size={17} className="animate-spin" />
                  <span>Memverifikasi Akun...</span>
                </>
              ) : (
                <>
                  <span>Masuk ke Dashboard</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        ) : (
          /* FORM 2: REGISTER (Minimalist & Clean) */
          <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: 13 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                Nama Lengkap Kader
              </label>
              <div className="auth-input-wrapper">
                <span className="auth-input-icon"><UserCheck size={15} color="#64748B" /></span>
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="Contoh: Ibu Siti Rahayu"
                  className="auth-input"
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                Nomor WhatsApp Aktif
              </label>
              <div className="auth-input-wrapper">
                <span className="auth-input-icon"><Phone size={15} color="#64748B" /></span>
                <input
                  type="tel"
                  required
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  placeholder="08xxxxxxxxxx"
                  className="auth-input"
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                Nama Posyandu
              </label>
              <div className="auth-input-wrapper">
                <span className="auth-input-icon"><Building2 size={15} color="#64748B" /></span>
                <input
                  type="text"
                  required
                  value={regPosyandu}
                  onChange={(e) => setRegPosyandu(e.target.value)}
                  placeholder="Contoh: Posyandu Melati 04"
                  className="auth-input"
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                Buat PIN Keamanan (4-6 Angka)
              </label>
              <div className="auth-input-wrapper">
                <span className="auth-input-icon"><Lock size={15} color="#64748B" /></span>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={regPin}
                  onChange={(e) => setRegPin(e.target.value)}
                  placeholder="Contoh: 123456"
                  className="auth-input"
                  maxLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="auth-password-toggle"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                background: "linear-gradient(135deg, #16A34A, #15803D)",
                color: "#FFFFFF",
                border: "none",
                borderRadius: 12,
                padding: "12px 18px",
                fontSize: 14.5,
                fontWeight: 700,
                cursor: isLoading ? "not-allowed" : "pointer",
                boxShadow: "0 4px 12px rgba(22, 163, 74, 0.28)",
                transition: "all 0.15s ease",
                marginTop: 6,
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 size={17} className="animate-spin" />
                  <span>Mendaftarkan Akun...</span>
                </>
              ) : (
                <>
                  <span>Daftarkan Akun Kader</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        )}

        {/* Security & Standard Badge */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          fontSize: 11,
          color: "#64748B",
          marginTop: 18,
          paddingTop: 12,
          borderTop: "1px solid #F1F5F9",
        }}>
          <ShieldCheck size={14} color="#16A34A" />
          <span>Keamanan Data Medis Standar Kemenkes RI &amp; WHO 2006</span>
        </div>
      </div>
    </div>
  );
}
