import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/shared/Providers";

export const metadata: Metadata = {
  title: "VetaBite - Portal Kantin UPN Veteran Jakarta",
  description: "Platform Pemesanan & Antrean Cerdas Kantin UPNVJ Tanpa Antre",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300..800;1,300..800&display=swap"
        />
      </head>
      <body className="min-h-screen text-on-surface antialiased bg-background-base selection:bg-primary selection:text-white">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}