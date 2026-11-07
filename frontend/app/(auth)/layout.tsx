import type { Metadata } from "next";
import "./auth.css";

export const metadata: Metadata = {
  title: "Masuk — Ananta",
  description:
    "Portal Kerja Digital Kader Posyandu Desa untuk Deteksi Dini Stunting dan Sinkronisasi e-PPGBM Standar Baku WHO 2006.",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="auth-page-root">
      {/* Background gradient */}
      <div className="auth-bg-gradient" />

      {/* Grid pattern */}
      <div className="auth-grid-pattern" />

      {/* Floating orbs */}
      <div className="auth-orb auth-orb-1" />
      <div className="auth-orb auth-orb-2" />
      <div className="auth-orb auth-orb-3" />

      {/* Main Content */}
      <main className="auth-main-area">{children}</main>
    </div>
  );
}
