import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import Script from "next/script";
import { ToastProvider } from "@/components/ui/Toast";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Ananta — Deteksi Dini Stunting untuk Kader Posyandu",
  description:
    "Platform digital cerdas untuk membantu kader Posyandu mendeteksi risiko stunting lebih cepat dan akurat menggunakan standar WHO 2006. Input via foto KMS atau form manual.",
  keywords: ["stunting", "posyandu", "kader", "gizi balita", "WHO", "kesehatan anak", "Indonesia", "Ananta"],
  authors: [{ name: "Ananta Team" }],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Ananta",
  },
  openGraph: {
    title: "Ananta",
    description: "Deteksi Dini Stunting untuk Kader Posyandu Indonesia",
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
    <html lang="id" className={poppins.variable}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className={`bg-grid min-h-screen antialiased ${poppins.className}`} suppressHydrationWarning>
        <ToastProvider>{children}</ToastProvider>
        <Script id="pwa-service-worker" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator && window.location.protocol === 'http:' || window.location.protocol === 'https:') {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js').then(
                  function(registration) {
                    console.log('Ananta PWA ServiceWorker ready: ', registration.scope);
                  },
                  function(err) {
                    console.log('Ananta PWA ServiceWorker setup notice: ', err);
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
