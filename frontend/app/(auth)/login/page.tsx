"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Mail,
  Lock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  Baby,
  Stethoscope,
  Sparkles,
  RotateCcw,
  Hospital,
} from "lucide-react";
import {
  getStoredUser,
  clearStoredUser,
  authenticateUser,
  DEMO_ACCOUNTS,
  type User as AuthUserType,
} from "@/lib/auth";
import { useToast } from "@/components/ui/Toast";

export default function LoginPage() {
  const router = useRouter();
  const toast = useToast();

  // Form State: Email & Password
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Status & Feedback State
  const [isLoading, setIsLoading] = useState(false);

  // Active session detection
  const [currentSession, setCurrentSession] = useState<AuthUserType | null>(null);

  useEffect(() => {
    const existing = getStoredUser();
    if (existing) {
      setCurrentSession(existing);
    }
  }, []);

  // Helper Pengisian Otomatis (HANYA PEMBANTU MENGISI FORM, TIDAK LANGSUNG MASUK)
  const handleAutoFill = (role: "kader" | "puskesmas") => {
    const demo = DEMO_ACCOUNTS[role];
    setEmail(demo.email || "");
    setPassword("123456");
    toast.info(
      `Email & password untuk ${demo.roleLabel} (${demo.name}) telah otomatis terisi. Silakan tekan tombol "Masuk ke Sistem".`,
      4000
    );
  };

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.warning("Silakan masukkan alamat email Anda.");
      return;
    }

    if (!password.trim()) {
      toast.warning("Silakan masukkan kata sandi Anda.");
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const res = authenticateUser(email, password);
      setIsLoading(false);

      if (!res.success || !res.user) {
        toast.error(
          res.error || "Login gagal. Silakan periksa kembali email dan kata sandi Anda."
        );
        return;
      }

      toast.success(
        `Berhasil masuk sebagai ${res.user.name} (${res.user.roleLabel}). Mengarahkan...`,
        2500
      );

      setTimeout(() => {
        router.push("/");
      }, 500);
    }, 450);
  };

  // Reset sesi aktif sebelumnya
  const handleSwitchUser = () => {
    clearStoredUser();
    setCurrentSession(null);
    setEmail("");
    setPassword("");
    toast.info("Sesi akun telah di-reset. Silakan masuk kembali.");
  };

  return (
    <div className="auth-main-area">
      <div className="auth-container">
        {/* ── Brand Header ── */}
        <div className="auth-brand">
          <div
            className="auth-brand-logo"
            style={{
              background: "#FFFFFF",
              width: 72,
              height: 72,
              borderRadius: 20,
              padding: 4,
              boxShadow: "0 10px 25px rgba(22, 163, 74, 0.15), 0 0 0 1px #E2E8F0 inset",
            }}
          >
            <img
              src="/ananta_baru_fix.png"
              alt="Logo Ananta"
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
          </div>
          <div style={{ textAlign: "center" }}>
            <div className="auth-brand-name" style={{ justifyContent: "center" }}>
              <span style={{ fontSize: 26, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em" }}>
                Ananta
              </span>
            </div>
            <p className="auth-brand-tagline">
              Platform Deteksi Dini Stunting Posyandu Standar WHO 2006
            </p>
          </div>
        </div>

        {/* ── Notifikasi Jika Sesi Sudah Aktif ── */}
        {currentSession && (
          <div
            style={{
              padding: "11px 14px",
              borderRadius: 12,
              background: "#F0FDF4",
              border: "1.5px solid #BBF7D0",
              marginBottom: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: 12,
              color: "#15803D",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <CheckCircle2 size={16} />
              <span>
                Sedang aktif: <strong>{currentSession.name}</strong> ({currentSession.roleLabel})
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Link
                href="/"
                style={{
                  color: "#15803D",
                  fontWeight: 700,
                  textDecoration: "underline",
                }}
              >
                Buka Sistem ➔
              </Link>
              <button
                type="button"
                onClick={handleSwitchUser}
                title="Keluar untuk ganti akun"
                style={{
                  background: "none",
                  border: "none",
                  color: "#DC2626",
                  fontSize: 11.5,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 3,
                }}
              >
                <RotateCcw size={12} /> Keluar
              </button>
            </div>
          </div>
        )}

        {/* ── Kartu Login Sederhana & Bersih ── */}
        <div className="auth-card" style={{ padding: "26px 28px" }}>
          <div style={{ marginBottom: 18 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0F172A", margin: "0 0 4px 0" }}>
              Masuk ke Akun Anda
            </h2>
            <p style={{ fontSize: 13, color: "#64748B", margin: 0 }}>
              Silakan masukkan email dan password untuk melanjutkan.
            </p>
          </div>

          {/* Form Login */}
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Field 1: Email */}
            <div className="auth-input-group" style={{ margin: 0 }}>
              <label className="auth-label" htmlFor="login-email">
                Alamat Email
              </label>
              <div className="auth-input-wrapper">
                <span className="auth-input-icon">
                  <Mail size={16} />
                </span>
                <input
                  id="login-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Masukkan alamat email Anda"
                  className="auth-input"
                  autoComplete="email"
                  autoFocus
                />
              </div>
            </div>

            {/* Field 2: Password */}
            <div className="auth-input-group" style={{ margin: 0 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 6,
                }}
              >
                <label className="auth-label" htmlFor="login-password" style={{ margin: 0 }}>
                  Kata Sandi
                </label>
              </div>

              <div className="auth-input-wrapper">
                <span className="auth-input-icon">
                  <Lock size={16} />
                </span>
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi Anda"
                  className="auth-input"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="auth-password-toggle"
                  title={showPassword ? "Sembunyikan sandi" : "Tampilkan sandi"}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Tombol Submit Utama */}
            <button
              type="submit"
              disabled={isLoading}
              className="auth-btn-primary"
              style={{ marginTop: 4 }}
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="auth-spinner" />
                  <span>Memverifikasi Akun...</span>
                </>
              ) : (
                <>
                  <span>Masuk ke Sistem</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* ── Bagian Pembantu: Pengisian Otomatis Akun Demo ── */}
          <div
            style={{
              marginTop: 22,
              paddingTop: 18,
              borderTop: "1px dashed #E2E8F0",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 8,
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#475569",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <Sparkles size={13} color="#16A34A" />
                <span>Bantuan Pengisian Cepat (Demo):</span>
              </div>
              <span style={{ fontSize: 11, color: "#16A34A", fontWeight: 700 }}>
                Otomatis Isi
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {/* Pembantu Kader */}
              <button
                type="button"
                onClick={() => handleAutoFill("kader")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  padding: "10px 14px",
                  borderRadius: 10,
                  background: "#F0FDF4",
                  border: "1.5px solid #BBF7D0",
                  color: "#166534",
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#DCFCE7";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#F0FDF4";
                }}
                title="Klik untuk mengisi email & password Kader Posyandu"
              >
                <Baby size={15} color="#16A34A" />
                <span>Kader Posyandu</span>
              </button>

              {/* Pembantu Puskesmas */}
              <button
                type="button"
                onClick={() => handleAutoFill("puskesmas")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  padding: "10px 14px",
                  borderRadius: 10,
                  background: "#EFF6FF",
                  border: "1.5px solid #BFDBFE",
                  color: "#1E40AF",
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#DBEAFE";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#EFF6FF";
                }}
                title="Klik untuk mengisi email & password Petugas Puskesmas"
              >
                <Hospital size={15} color="#2563EB" />
                <span>Puskesmas</span>
              </button>
            </div>

            <p style={{ fontSize: 11, color: "#94A3B8", margin: "8px 0 0 0", textAlign: "center", lineHeight: 1.4 }}>
              Klik tombol pembantu di atas untuk mengisi formulir secara otomatis, kemudian klik tombol <strong>Masuk ke Sistem</strong>.
            </p>
          </div>
        </div>

        {/* ── Version Tag ── */}
        <div
          style={{
            textAlign: "center",
            marginTop: 14,
            fontSize: 11.5,
            color: "#94A3B8",
            fontWeight: 500,
          }}
        >
          Ananta · Inovasi Digital Posyandu Terintegrasi
        </div>
      </div>
    </div>
  );
}
