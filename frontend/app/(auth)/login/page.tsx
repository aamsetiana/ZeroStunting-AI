"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Activity,
  Baby,
  Stethoscope,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  MapPin,
  Sparkles,
  Lock,
  Phone,
  User,
  Eye,
  EyeOff,
  Zap,
  KeyRound,
  RotateCcw,
} from "lucide-react";
import {
  saveStoredUser,
  getStoredUser,
  clearStoredUser,
  authenticateUser,
  DEMO_ACCOUNTS,
  type User as AuthUserType,
} from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();

  // Mode: "form" (Formulir Login Manual) vs "simulasi" (Pilihan Role Langsung Masuk)
  const [activeTab, setActiveTab] = useState<"form" | "simulasi">("form");

  // Form State: Role selection for form
  const [formRole, setFormRole] = useState<"kader" | "bidan">("kader");

  // Form State: Inputs
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Status / Feedback
  const [isLoading, setIsLoading] = useState(false);
  const [loadingPersona, setLoadingPersona] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Active session detection
  const [currentSession, setCurrentSession] = useState<AuthUserType | null>(null);

  useEffect(() => {
    const existing = getStoredUser();
    if (existing) {
      setCurrentSession(existing);
    }
  }, []);

  // Quick prefill form from demo account
  const handlePreFill = (role: "kader" | "bidan") => {
    const demo = DEMO_ACCOUNTS[role];
    setFormRole(role);
    setLoginIdentifier(demo.name);
    setLoginPassword("123456");
    setErrorMessage(null);
    setSuccessMessage(`Data ${demo.name} dimasukkan ke form. Tekan Masuk untuk melanjutkan.`);
  };

  // Immediate 1-Click Login (Simulasi tanpa password)
  const handleDirectSimulationLogin = (role: "kader" | "bidan") => {
    setErrorMessage(null);
    setIsLoading(true);
    setLoadingPersona(role);

    const demo = DEMO_ACCOUNTS[role];
    setTimeout(() => {
      const activeUser: AuthUserType = {
        ...demo,
        loginTime: new Date().toISOString(),
      };
      saveStoredUser(activeUser);
      setIsLoading(false);
      setLoadingPersona(null);
      setSuccessMessage(`⚡ Berhasil login langsung sebagai ${demo.name}! Membuka sistem...`);

      setTimeout(() => {
        router.push("/");
      }, 500);
    }, 450);
  };

  // Handle Form Submission with Username & Password
  const handleFormLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!loginIdentifier.trim()) {
      setErrorMessage("Silakan ketikkan Nama atau Nomor WhatsApp Anda.");
      return;
    }

    if (!loginPassword.trim()) {
      setErrorMessage("Silakan ketikkan PIN / Kata Sandi akun.");
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const res = authenticateUser(loginIdentifier, loginPassword, formRole);
      setIsLoading(false);

      if (!res.success || !res.user) {
        setErrorMessage(res.error || "Login gagal. Coba PIN demo '123456' atau gunakan opsi simulasi.");
        return;
      }

      setSuccessMessage(`Selamat datang kembali, ${res.user.name}! Membuka dashboard...`);
      setTimeout(() => {
        router.push("/");
      }, 500);
    }, 500);
  };

  // Handle Switch User (clear previous session)
  const handleSwitchUser = () => {
    clearStoredUser();
    setCurrentSession(null);
    setSuccessMessage("Sesi sebelumnya telah di-reset. Silakan login kembali.");
  };

  return (
    <div className="auth-main-area">
      <div className="auth-container">
        {/* ── Brand Header ── */}
        <div className="auth-brand">
          <div className="auth-brand-logo">
            <Activity size={28} color="#FFFFFF" strokeWidth={2.5} />
          </div>
          <div style={{ textAlign: "center" }}>
            <div className="auth-brand-name">
              Zero<span style={{ color: "#16A34A" }}>Stunting</span>
              <span
                style={{
                  fontSize: 10,
                  color: "#15803D",
                  background: "#DCFCE7",
                  padding: "2px 7px",
                  borderRadius: 6,
                  fontWeight: 800,
                  marginLeft: 3,
                }}
              >
                AI
              </span>
            </div>
            <p className="auth-brand-tagline">
              Platform Deteksi Dini Stunting Posyandu Standar WHO 2006
            </p>
          </div>
        </div>

        {/* ── Active Session Notice (If Already Logged In) ── */}
        {currentSession && (
          <div
            style={{
              padding: "10px 14px",
              borderRadius: 12,
              background: "#F0FDF4",
              border: "1px solid #BBF7D0",
              marginBottom: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: 11.5,
              color: "#15803D",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <CheckCircle2 size={15} />
              <span>
                Sedang aktif: <strong>{currentSession.name}</strong>
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Link
                href="/"
                style={{
                  color: "#15803D",
                  fontWeight: 700,
                  textDecoration: "underline",
                }}
              >
                Ke Beranda ➔
              </Link>
              <button
                type="button"
                onClick={handleSwitchUser}
                title="Keluar untuk ganti akun"
                style={{
                  background: "none",
                  border: "none",
                  color: "#DC2626",
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 3,
                }}
              >
                <RotateCcw size={11} /> Ganti
              </button>
            </div>
          </div>
        )}

        {/* ── Main Glassmorphic Card ── */}
        <div className="auth-card">
          {/* Top Switcher Tabs: Form Login vs Simulasi Langsung */}
          <div className="auth-mode-tabs">
            <button
              type="button"
              onClick={() => {
                setActiveTab("form");
                setErrorMessage(null);
              }}
              className={`auth-mode-tab ${activeTab === "form" ? "active" : ""}`}
            >
              <KeyRound size={14} />
              <span>Form Login Akun</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("simulasi");
                setErrorMessage(null);
              }}
              className={`auth-mode-tab sim-tab ${activeTab === "simulasi" ? "active" : ""}`}
            >
              <Zap size={14} />
              <span>Simulasi 1-Klik</span>
            </button>
          </div>

          {/* Alert Messages */}
          {errorMessage && (
            <div className="auth-alert error">
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="auth-alert success">
              <CheckCircle2 size={15} style={{ flexShrink: 0 }} />
              <span>{successMessage}</span>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              TAB 1: FORM LOGIN MANUAL
              ───────────────────────────────────────────────────────────── */}
          {activeTab === "form" && (
            <div>
              {/* Role Selector Pills */}
              <div style={{ marginBottom: 12 }}>
                <span className="auth-label">Pilih Peran Akun:</span>
                <div className="auth-role-switcher">
                  <button
                    type="button"
                    onClick={() => setFormRole("kader")}
                    className={`auth-role-pill ${formRole === "kader" ? "active" : ""}`}
                  >
                    <div className="auth-role-pill-icon">
                      <Baby size={16} />
                    </div>
                    <div>
                      <div className="auth-role-pill-label">Ibu Kader</div>
                      <div style={{ fontSize: 10, color: "#64748B" }}>Posyandu Desa</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormRole("bidan")}
                    className={`auth-role-pill ${formRole === "bidan" ? "active bidan-role" : ""}`}
                  >
                    <div className="auth-role-pill-icon">
                      <Stethoscope size={16} />
                    </div>
                    <div>
                      <div className="auth-role-pill-label">Bidan Desa</div>
                      <div style={{ fontSize: 10, color: "#64748B" }}>Puskesmas</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Form Input */}
              <form onSubmit={handleFormLogin}>
                {/* Field 1: Identifier */}
                <div className="auth-input-group">
                  <label className="auth-label">Nomor WhatsApp atau Nama Kader</label>
                  <div className="auth-input-wrapper">
                    <span className="auth-input-icon">
                      <Phone size={15} />
                    </span>
                    <input
                      type="text"
                      required
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      placeholder="Contoh: Kania Salsabila atau 0812-3456-7890"
                      className="auth-input"
                      autoComplete="username"
                    />
                  </div>
                </div>

                {/* Field 2: Password / PIN */}
                <div className="auth-input-group">
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 4,
                    }}
                  >
                    <label className="auth-label" style={{ marginBottom: 0 }}>
                      PIN / Kata Sandi
                    </label>
                    <span style={{ fontSize: 10.5, color: "#16A34A", fontWeight: 600 }}>
                      PIN Demo: 123456
                    </span>
                  </div>

                  <div className="auth-input-wrapper">
                    <span className="auth-input-icon">
                      <Lock size={15} />
                    </span>
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Masukkan 6 digit angka PIN"
                      className="auth-input"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="auth-password-toggle"
                      title={showPassword ? "Sembunyikan sandi" : "Tampilkan sandi"}
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                {/* Quick Pre-fill Chips */}
                <div className="auth-demo-chips">
                  <span style={{ fontSize: 10.5, color: "#64748B", fontWeight: 700 }}>
                    Isi otomatis:
                  </span>
                  <button
                    type="button"
                    onClick={() => handlePreFill("kader")}
                    className="auth-demo-chip-btn"
                    title="Klik untuk mengisi data Kader Kania"
                  >
                    <User size={11} />
                    <span>Ibu Kania (Kader)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePreFill("bidan")}
                    className="auth-demo-chip-btn bidan"
                    title="Klik untuk mengisi data Bidan Siti"
                  >
                    <Stethoscope size={11} />
                    <span>Bidan Siti (Bidan)</span>
                  </button>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="auth-btn-primary"
                >
                  {isLoading && !loadingPersona ? (
                    <>
                      <Loader2 size={16} className="auth-spinner" />
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

              {/* Quick Simulation Bypass Box */}
              <div className="auth-quick-sim-box">
                <div className="auth-quick-sim-header">
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <Zap size={12} color="#F59E0B" />
                    Atau masuk langsung tanpa ketik sandi:
                  </span>
                  <span style={{ color: "#16A34A", fontSize: 10 }}>1-Klik</span>
                </div>
                <div className="auth-quick-sim-buttons">
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => handleDirectSimulationLogin("kader")}
                    className="auth-quick-sim-btn"
                  >
                    {loadingPersona === "kader" ? (
                      <Loader2 size={13} className="auth-spinner" />
                    ) : (
                      <Baby size={13} />
                    )}
                    <span>Ibu Kader</span>
                  </button>
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => handleDirectSimulationLogin("bidan")}
                    className="auth-quick-sim-btn bidan"
                  >
                    {loadingPersona === "bidan" ? (
                      <Loader2 size={13} className="auth-spinner" />
                    ) : (
                      <Stethoscope size={13} />
                    )}
                    <span>Bidan Desa</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              TAB 2: SIMULASI ROLE (LANGSUNG MASUK 1-KLIK)
              ───────────────────────────────────────────────────────────── */}
          {activeTab === "simulasi" && (
            <div>
              <p
                style={{
                  fontSize: 12,
                  color: "#64748B",
                  marginTop: 0,
                  marginBottom: 14,
                  lineHeight: 1.4,
                }}
              >
                Pilih peran di bawah ini untuk <strong>langsung masuk ke sistem</strong> tanpa perlu
                mengetikkan kata sandi atau PIN:
              </p>

              <div className="auth-sim-cards">
                {/* Card 1: Ibu Kader */}
                <div
                  className="auth-sim-card"
                  onClick={() => !isLoading && handleDirectSimulationLogin("kader")}
                >
                  <div className="auth-sim-card-top">
                    <div className="auth-sim-avatar">KS</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="auth-sim-name">Kania Salsabila</div>
                      <div>
                        <span className="auth-sim-role-badge">
                          <Baby size={10} /> Kader Posyandu
                        </span>
                      </div>
                      <div className="auth-sim-posyandu">
                        <MapPin size={11} color="#94A3B8" />
                        <span>{DEMO_ACCOUNTS.kader.posyandu} — Desa {DEMO_ACCOUNTS.kader.desa}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDirectSimulationLogin("kader");
                    }}
                    className="auth-sim-btn-action"
                  >
                    {loadingPersona === "kader" ? (
                      <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <Loader2 size={13} className="auth-spinner" />
                        Membuka Ruang Kerja Kader...
                      </span>
                    ) : (
                      <>
                        <span>Masuk sebagai Ibu Kader</span>
                        <ArrowRight size={13} />
                      </>
                    )}
                  </button>
                </div>

                {/* Card 2: Bidan Puskesmas */}
                <div
                  className="auth-sim-card bidan"
                  onClick={() => !isLoading && handleDirectSimulationLogin("bidan")}
                >
                  <div className="auth-sim-card-top">
                    <div className="auth-sim-avatar bidan">SR</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="auth-sim-name">Bidan Siti Rahma, S.Tr.Keb</div>
                      <div>
                        <span className="auth-sim-role-badge bidan">
                          <Stethoscope size={10} /> Petugas Puskesmas / Bidan
                        </span>
                      </div>
                      <div className="auth-sim-posyandu">
                        <MapPin size={11} color="#94A3B8" />
                        <span>{DEMO_ACCOUNTS.bidan.posyandu}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDirectSimulationLogin("bidan");
                    }}
                    className="auth-sim-btn-action bidan"
                  >
                    {loadingPersona === "bidan" ? (
                      <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <Loader2 size={13} className="auth-spinner" />
                        Membuka Ruang Kerja Bidan...
                      </span>
                    ) : (
                      <>
                        <span>Masuk sebagai Bidan Desa</span>
                        <ArrowRight size={13} />
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div
                style={{
                  textAlign: "center",
                  marginTop: 8,
                }}
              >
                <button
                  type="button"
                  onClick={() => setActiveTab("form")}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#16A34A",
                    fontSize: 11.5,
                    fontWeight: 700,
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
                >
                  Atau ingin ketik nama dan password manual? Buka Form Login
                </button>
              </div>
            </div>
          )}

          {/* ── Footer ── */}
          <div className="auth-footer">
            <ShieldCheck size={12} color="#16A34A" />
            <span>Standar Medis Kemenkes RI · Baku Pertumbuhan WHO 2006</span>
          </div>
        </div>

        {/* ── Version Tag ── */}
        <div
          style={{
            textAlign: "center",
            marginTop: 12,
            fontSize: 11,
            color: "#94A3B8",
            fontWeight: 500,
          }}
        >
          ZeroStunting AI · Inovasi Digital Posyandu Terintegrasi
        </div>
      </div>
    </div>
  );
}
