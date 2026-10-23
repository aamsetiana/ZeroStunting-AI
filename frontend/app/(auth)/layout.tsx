import type { Metadata } from "next";
import Link from "next/link";
import { Activity, ShieldCheck, HeartHandshake, ArrowLeft, CheckCircle2 } from "lucide-react";
import "./auth.css";

export const metadata: Metadata = {
  title: "Portal Kerja Kader Posyandu — ZeroStunting AI",
  description: "Portal Kerja Digital Kader Posyandu Desa untuk Deteksi Dini Stunting dan Sinkronisasi e-PPGBM Standar Baku WHO 2006.",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="auth-page-root">
      {/* Background Soft Accent Orbs */}
      <div className="auth-ambient-orb auth-ambient-orb-1" />
      <div className="auth-ambient-orb auth-ambient-orb-2" />

      {/* Top Navbar */}
      <header className="auth-header-bar">
        <Link href="/" className="auth-brand-logo">
          <div className="auth-logo-icon">
            <Activity size={20} color="#FFFFFF" strokeWidth={2.5} />
          </div>
          <div>
            <div className="auth-brand-name">
              ZeroStunting <span className="auth-brand-pill">Posyandu Digital</span>
            </div>
            <div className="auth-brand-tagline">
              Platform Deteksi Dini Stunting &amp; Pencatatan Balita Desa
            </div>
          </div>
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            display: "none",
            alignItems: "center",
            gap: 6,
            fontSize: 11.5,
            color: "#166534",
            background: "#DCFCE7",
            padding: "5px 12px",
            borderRadius: 999,
            border: "1px solid #BBF7D0",
            fontWeight: 600,
          }} className="sm:flex">
            <CheckCircle2 size={13} color="#16A34A" />
            <span>Standar WHO 2006 (LMS)</span>
          </div>

          <Link href="/" className="auth-nav-link">
            <ArrowLeft size={14} />
            <span>Ke Dashboard</span>
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="auth-main-area">
        {children}
      </main>

      {/* Footer */}
      <footer className="auth-footer">
        <HeartHandshake size={15} color="#16A34A" />
        <span>
          ZeroStunting AI © 2026 — Didedikasikan Khusus untuk Kader Posyandu Desa Menuju Generasi Bebas Stunting
        </span>
      </footer>
    </div>
  );
}
