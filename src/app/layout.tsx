import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/shared/Providers";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

interface SeoSettings {
  title: string;
  description: string;
  keywords: string;
  author: string;
  faviconUrl: string;
  thumbnailUrl: string;
  ogImageUrl: string;
  twitterHandle: string;
  canonicalUrl: string;
  googleSiteVerification?: string;
}

const DEFAULT_SEO: SeoSettings = {
  title: "VetaBite - Portal Kantin UPN Veteran Jakarta",
  description: "Platform Pemesanan & Antrean Cerdas Kantin UPNVJ Tanpa Antre. Pesan makanan online, bayar digital, ambil tanpa antre.",
  keywords: "VetaBite, Kantin UPN, UPNVJ, Pesan Makanan Online, Antrean Digital, Kantin Digital, UPN Veteran Jakarta, Smart Queue, Food Ordering",
  author: "VetaBite Team",
  faviconUrl: "/LOGO.jpeg",
  thumbnailUrl: "/LOGO.jpeg",
  ogImageUrl: "/LOGO.jpeg",
  twitterHandle: "@vetabite",
  canonicalUrl: "https://vetabite.my.id",
  googleSiteVerification: "dXyCTujHqvHHCebNQyx1nmNHQ_jucXVnrH9wPuc6Zqs",
};

async function getSeoSettings(): Promise<SeoSettings> {
  try {
    const config = await prisma.siteConfig.findFirst({
      where: { key: "seo" },
    });
    if (config?.value) {
      return { ...DEFAULT_SEO, ...JSON.parse(config.value) };
    }
  } catch (err) {
    console.warn("Failed to fetch SEO settings from database, using defaults:", err);
  }
  return DEFAULT_SEO;
}

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSeoSettings();
  const keywords = seo.keywords
    ? seo.keywords.split(",").map((k) => k.trim()).filter(Boolean)
    : ["VetaBite", "Kantin UPNVJ"];

  const ogImage = seo.ogImageUrl || seo.thumbnailUrl || "/LOGO.jpeg";
  const favicon = seo.faviconUrl || "/LOGO.jpeg";

  return {
    metadataBase: new URL(seo.canonicalUrl || "https://vetabite.my.id"),
    title: {
      default: seo.title,
      template: "%s | VetaBite",
    },
    description: seo.description,
    keywords,
    authors: [{ name: seo.author }],
    creator: "VetaBite",
    publisher: "VetaBite UPNVJ",
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
      icon: favicon,
      shortcut: favicon,
      apple: favicon,
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
          url: ogImage,
          width: 1200,
          height: 630,
          alt: seo.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: seo.title,
      description: seo.description,
      images: [ogImage],
      creator: seo.twitterHandle || "@vetabite",
    },
    manifest: "/manifest.json",
    alternates: {
      canonical: seo.canonicalUrl || "https://vetabite.my.id",
    },
    verification: seo.googleSiteVerification ? { google: seo.googleSiteVerification } : undefined,
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const seo = await getSeoSettings();
  const favicon = seo.faviconUrl || "/LOGO.jpeg";

  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <meta
          name="google-site-verification"
          content={seo.googleSiteVerification || "dXyCTujHqvHHCebNQyx1nmNHQ_jucXVnrH9wPuc6Zqs"}
        />
        <link rel="icon" href={favicon} />
        <link rel="apple-touch-icon" href={favicon} />
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
