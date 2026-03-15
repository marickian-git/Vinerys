import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from '@/components/Navbar';
import Providers from './providers';
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Vinerys — Pivnița Digitală",
  description: "Gestionează-ți colecția de vinuri cu eleganță",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Vinerys",
  },
};

export const viewport = {
  themeColor: "#8b1a2e",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }) {
  return (
    <html lang="ro">
      <head>
        {/* PWA */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#8b1a2e" />
        <meta name="application-name" content="Vinerys" />

        {/* iOS PWA */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Vinerys" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152.png" />
        <link rel="apple-touch-icon" sizes="144x144" href="/icons/icon-144.png" />
        <link rel="apple-touch-icon" sizes="128x128" href="/icons/icon-128.png" />
        <link rel="apple-touch-startup-image" href="/icons/icon-512.png" />

        {/* Favicon */}
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-96.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/icon-72.png" />

        {/* Microsoft */}
        <meta name="msapplication-TileColor" content="#8b1a2e" />
        <meta name="msapplication-TileImage" content="/icons/icon-144.png" />
      </head>
      <body className={inter.className} style={{background: "#0d0608"}}>
        <Providers>
          <Navbar />
          <main className="pt-16 min-h-screen" style={{ background: '#0d0608' }}>
            {children}
          </main>
        </Providers>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}