import type { Metadata } from "next";
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

      {/* Main Container - Centered */}
      <main className="auth-main-area">
        {children}
      </main>
    </div>
  );
}

