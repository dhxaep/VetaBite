import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/shared/Providers";
import { prisma } from "@/lib/prisma";

interface SeoSettings {
  title: string;
  description: string;
  keywords: string;
  author: string;
  thumbnailUrl: string;
  ogImageUrl: string;
  twitterHandle: string;
  canonicalUrl: string;
}

async function getSeoSettings(): Promise<SeoSettings> {
  try {
    const config = await prisma.siteConfig.findFirst({
      where: { key: "seo" },
    });

    if (config) {
      return JSON.parse(config.value);
    }
  } catch (err) {
    console.warn("Failed to fetch SEO settings, using defaults:", err);
  }

  // Fallback default
  return {
    title: "VetaBite - Portal Kantin UPN Veteran Jakarta",
    description: "Platform Pemesanan & Antrean Cerdas Kantin UPNVJ Tanpa Antre. Pesan makanan online, bayar digital, ambil tanpa antre.",
    keywords: "VetaBite, Kantin UPN, UPNVJ, Pesan Makanan Online, Antrean Digital, Kantin Digital, UPN Veteran Jakarta, Smart Queue, Food Ordering",
    author: "VetaBite Team",
    thumbnailUrl: "/LOGO.jpeg",
    ogImageUrl: "/LOGO.jpeg",
    twitterHandle: "@vetabite",
    canonicalUrl: "https://vetabite.my.id",
  };
}

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSeoSettings();
  const keywords = seo.keywords.split(",").map(k => k.trim());

  return {
    metadataBase: new URL(seo.canonicalUrl || "https://vetabite.my.id"),
    title: {
      default: seo.title,
      template: "%s | VetaBite",
    },
    description: seo.description,
    keywords: keywords,
    authors: [{ name: seo.author }],
    creator: "VetaBite",
    publisher: "VetaBite",
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    icons: {
      icon: seo.thumbnailUrl || "/LOGO.jpeg",
      shortcut: seo.thumbnailUrl || "/LOGO.jpeg",
      apple: seo.thumbnailUrl || "/LOGO.jpeg",
    },
    openGraph: {
      type: "website",
      locale: "id_ID",
      url: seo.canonicalUrl || "https://vetabite.my.id",
      title: seo.title,
      description: seo.description,
      siteName: "VetaBite",
      images: [
        {
          url: seo.ogImageUrl || "/LOGO.jpeg",
          width: 1200,
          height: 630,
          alt: "VetaBite Logo",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: seo.title,
      description: seo.description,
      images: [seo.ogImageUrl || "/LOGO.jpeg"],
      creator: seo.twitterHandle || "@vetabite",
    },
    manifest: "/manifest.json",
    alternates: {
      canonical: seo.canonicalUrl || "https://vetabite.my.id",
    },
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/LOGO.jpeg" type="image/jpeg" />
        <link rel="apple-touch-icon" href="/LOGO.jpeg" />
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