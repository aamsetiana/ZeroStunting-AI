"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Lock,
  Phone,
  Eye,
  EyeOff,
  UserCheck,
  Building2,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  UserPlus,
  LogIn,
  Loader2,
  Stethoscope,
  Baby,
  ShieldCheck,
  Activity,
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
  };

  // 1-Click Demo Fill
  const handleApplyDemo = (role: "kader" | "bidan") => {
    const demo = DEMO_ACCOUNTS[role];
    setSelectedRole(role);
    setLoginIdentifier(demo.name);
    setLoginPassword("123456");
    setErrorMessage(null);
    setSuccessMessage(`⚡ Akun demo ${demo.name} terisi. Silakan tekan Masuk.`);
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

      setSuccessMessage(`Selamat datang kembali, ${res.user.name}! Membuka sistem...`);
      setTimeout(() => {
        router.push("/");
      }, 500);
    }, 400);
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
      setSuccessMessage(`Registrasi Berhasil! Akun ${res.user.name} aktif. Masuk ke aplikasi...`);
      setTimeout(() => {
        router.push("/");
      }, 600);
    }, 500);
  };

  // PIN dot indicators (up to 6 dots)
  const currentPinLen = authMode === "login" ? loginPassword.length : regPin.length;

  return (
    <div className="auth-clean-container">
      {/* Main Glassmorphic Card */}
      <div className="auth-clean-card">
        {/* Brand Header Inside Card */}
        <div style={{ textAlign: "center", marginBottom: 12 }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            marginBottom: 3,
          }}>
            <div style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: "linear-gradient(135deg, #22C55E 0%, #16A34A 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 6px rgba(22, 163, 74, 0.25)",
            }}>
              <Activity size={15} color="#FFFFFF" strokeWidth={2.5} />
            </div>
            <span style={{ fontSize: 17, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.01em" }}>
              ZeroStunting <span style={{ fontSize: 10.5, color: "#15803D", background: "#DCFCE7", padding: "1px 6px", borderRadius: 5, fontWeight: 700 }}>AI</span>
            </span>
          </div>
          <p style={{ fontSize: 11.5, color: "#64748B", margin: 0, fontWeight: 500 }}>
            Ruang Kerja Digital Kader Posyandu &amp; Bidan Desa
          </p>
        </div>

        {/* Interactive Persona Pill Switcher */}
        <div style={{ marginBottom: 10 }}>
          <div className="auth-role-tabs">
            <button
              type="button"
              onClick={() => handleRoleSelect("kader")}
              className={`auth-role-tab ${selectedRole === "kader" ? "active" : ""}`}
            >
              <Baby size={14} color={selectedRole === "kader" ? "#16A34A" : "#64748B"} />
              <span>Ibu Kader Posyandu</span>
            </button>
            <button
              type="button"
              onClick={() => handleRoleSelect("bidan")}
              className={`auth-role-tab ${selectedRole === "bidan" ? "active" : ""}`}
            >
              <Stethoscope size={14} color={selectedRole === "bidan" ? "#16A34A" : "#64748B"} />
              <span>Bidan Puskesmas</span>
            </button>
          </div>
        </div>

        {/* 1-Click Interactive Demo Access */}
        {authMode === "login" && (
          <div style={{ marginBottom: 10 }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 4,
            }}>
              <span style={{ fontSize: 10.5, fontWeight: 700, color: "#64748B" }}>
                ⚡ Akun Uji Coba (Demo):
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
                <UserCheck size={12} />
                <span>Ibu Kania (Kader)</span>
              </button>
              <button
                type="button"
                onClick={() => handleApplyDemo("bidan")}
                className="auth-demo-chip-btn"
                style={{ background: "#F0F9FF", borderColor: "#BAE6FD", color: "#0284C7" }}
                title="Isi otomatis akun Bidan Siti Rahma"
              >
                <Stethoscope size={12} />
                <span>Bidan Siti (Bidan)</span>
              </button>
            </div>
          </div>
        )}

        {/* Mode Switcher: Masuk vs Daftar Baru */}
        <div style={{
          display: "flex",
          borderBottom: "1px solid #E2E8F0",
          marginBottom: 12,
          gap: 16,
        }}>
          <button
            type="button"
            onClick={() => { setAuthMode("login"); setErrorMessage(null); }}
            style={{
              padding: "4px 0 8px 0",
              border: "none",
              borderBottom: authMode === "login" ? "2px solid #16A34A" : "2px solid transparent",
              background: "none",
              cursor: "pointer",
              fontSize: 12.5,
              fontWeight: authMode === "login" ? 800 : 600,
              color: authMode === "login" ? "#15803D" : "#64748B",
              display: "flex",
              alignItems: "center",
              gap: 5,
              transition: "all 0.15s ease",
            }}
          >
            <LogIn size={13} /> Masuk Akun
          </button>
          <button
            type="button"
            onClick={() => { setAuthMode("register"); setErrorMessage(null); }}
            style={{
              padding: "4px 0 8px 0",
              border: "none",
              borderBottom: authMode === "register" ? "2px solid #16A34A" : "2px solid transparent",
              background: "none",
              cursor: "pointer",
              fontSize: 12.5,
              fontWeight: authMode === "register" ? 800 : 600,
              color: authMode === "register" ? "#15803D" : "#64748B",
              display: "flex",
              alignItems: "center",
              gap: 5,
              transition: "all 0.15s ease",
            }}
          >
            <UserPlus size={13} /> Daftar Baru
          </button>
        </div>

        {/* Dynamic Alerts */}
        {errorMessage && (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 12px",
            background: "#FEF2F2",
            border: "1px solid #FECACA",
            borderRadius: 8,
            fontSize: 11.5,
            color: "#B91C1C",
            fontWeight: 600,
            marginBottom: 10,
          }}>
            <AlertCircle size={14} style={{ flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 12px",
            background: "#F0FDF4",
            border: "1px solid #BBF7D0",
            borderRadius: 8,
            fontSize: 11.5,
            color: "#15803D",
            fontWeight: 700,
            marginBottom: 10,
          }}>
            <CheckCircle2 size={14} style={{ flexShrink: 0 }} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* FORM 1: LOGIN */}
        {authMode === "login" ? (
          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {/* Input WhatsApp / Nama */}
            <div>
              <label style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: "#334155", marginBottom: 3 }}>
                Nomor WhatsApp atau Nama
              </label>
              <div className="auth-input-wrapper">
                <span className="auth-input-icon"><Phone size={14} color="#64748B" /></span>
                <input
                  type="text"
                  required
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  placeholder={selectedRole === "kader" ? "0812-3456-7890 atau Kania" : "0898-7654-3210 atau Siti"}
                  className="auth-input"
                  autoComplete="username"
                />
              </div>
            </div>

            {/* PIN Keamanan dengan Indikator Dots Interaktif */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: "#334155" }}>
                  PIN Keamanan
                </label>
                <button
                  type="button"
                  onClick={() => setLoginPassword("123456")}
                  style={{
                    background: "none", border: "none", padding: 0,
                    fontSize: 10.5, color: "#16A34A", fontWeight: 700, cursor: "pointer",
                  }}
                >
                  Isi PIN: 123456
                </button>
              </div>

              <div className="auth-input-wrapper">
                <span className="auth-input-icon"><Lock size={14} color="#64748B" /></span>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="6 digit angka PIN"
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
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
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
                gap: 7,
                background: "linear-gradient(135deg, #16A34A, #15803D)",
                color: "#FFFFFF",
                border: "none",
                borderRadius: 10,
                padding: "10px 16px",
                fontSize: 13.5,
                fontWeight: 700,
                cursor: isLoading ? "not-allowed" : "pointer",
                boxShadow: "0 3px 10px rgba(22, 163, 74, 0.25)",
                transition: "all 0.15s ease",
                marginTop: 2,
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Memverifikasi Akun...</span>
                </>
              ) : (
                <>
                  <span>Masuk ke Dashboard</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>
        ) : (
          /* FORM 2: REGISTER (Minimalist & Clean) */
          <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#334155", marginBottom: 2 }}>
                Nama Lengkap
              </label>
              <div className="auth-input-wrapper">
                <span className="auth-input-icon"><UserCheck size={14} color="#64748B" /></span>
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="Ibu Siti Rahayu"
                  className="auth-input"
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#334155", marginBottom: 2 }}>
                Nomor WhatsApp
              </label>
              <div className="auth-input-wrapper">
                <span className="auth-input-icon"><Phone size={14} color="#64748B" /></span>
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
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#334155", marginBottom: 2 }}>
                Nama Posyandu
              </label>
              <div className="auth-input-wrapper">
                <span className="auth-input-icon"><Building2 size={14} color="#64748B" /></span>
                <input
                  type="text"
                  required
                  value={regPosyandu}
                  onChange={(e) => setRegPosyandu(e.target.value)}
                  placeholder="Posyandu Melati 04"
                  className="auth-input"
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#334155", marginBottom: 2 }}>
                Buat PIN Keamanan (4-6 Angka)
              </label>
              <div className="auth-input-wrapper">
                <span className="auth-input-icon"><Lock size={14} color="#64748B" /></span>
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
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
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
                gap: 7,
                background: "linear-gradient(135deg, #16A34A, #15803D)",
                color: "#FFFFFF",
                border: "none",
                borderRadius: 10,
                padding: "10px 16px",
                fontSize: 13.5,
                fontWeight: 700,
                cursor: isLoading ? "not-allowed" : "pointer",
                boxShadow: "0 3px 10px rgba(22, 163, 74, 0.25)",
                transition: "all 0.15s ease",
                marginTop: 2,
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Mendaftarkan Akun...</span>
                </>
              ) : (
                <>
                  <span>Daftarkan Akun Kader</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>
        )}

        {/* Back Link to Home */}
        <div style={{ textAlign: "center", marginTop: 10 }}>
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontSize: 11.5,
              color: "#64748B",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            <ArrowLeft size={12} />
            <span>Kembali ke Beranda Dashboard</span>
          </Link>
        </div>

        {/* Security & Standard Badge */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 5,
          fontSize: 10.5,
          color: "#94A3B8",
          marginTop: 10,
          paddingTop: 8,
          borderTop: "1px solid #F1F5F9",
        }}>
          <ShieldCheck size={12} color="#16A34A" />
          <span>Standar Medis Kemenkes RI &amp; Baku WHO 2006</span>
        </div>
      </div>
    </div>
  );
}
