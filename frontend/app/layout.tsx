import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "ZeroStunting AI — Deteksi Dini Stunting untuk Kader Posyandu",
  description:
    "Platform AI untuk membantu kader Posyandu mendeteksi risiko stunting lebih cepat dan akurat menggunakan standar WHO 2006. Input via foto, suara, atau form manual.",
  keywords: ["stunting", "posyandu", "kader", "gizi balita", "WHO", "kesehatan anak", "Indonesia"],
  authors: [{ name: "ZeroStunting AI Team" }],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ZeroStunting AI",
  },
  openGraph: {
    title: "ZeroStunting AI",
    description: "Deteksi Dini Stunting Berbasis AI untuk Indonesia",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#16A34A",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className="bg-grid min-h-screen antialiased" suppressHydrationWarning>
        {children}
        <Script id="pwa-service-worker" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator && window.location.protocol === 'http:' || window.location.protocol === 'https:') {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js').then(
                  function(registration) {
                    console.log('ZeroStunting PWA ServiceWorker ready: ', registration.scope);
                  },
                  function(err) {
                    console.log('ZeroStunting PWA ServiceWorker setup notice: ', err);
                  }
                );
              });
            }
          `}
        </Script>
      </body>
    </html>
  );
}
