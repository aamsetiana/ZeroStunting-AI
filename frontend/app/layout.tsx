import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ZeroStunting AI : Deteksi Dini Stunting untuk Kader Posyandu",
  description:
    "Platform AI untuk membantu kader Posyandu mendeteksi risiko stunting lebih cepat dan akurat menggunakan standar WHO 2006. Input via foto, suara, atau form manual.",
  keywords: ["stunting", "posyandu", "kader", "gizi balita", "WHO", "kesehatan anak", "Indonesia"],
  authors: [{ name: "ZeroStunting AI Team" }],
  openGraph: {
    title: "ZeroStunting AI",
    description: "Deteksi Dini Stunting Berbasis AI untuk Indonesia",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="bg-grid min-h-screen antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
