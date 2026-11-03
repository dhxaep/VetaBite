import { getSession } from "@/lib/auth";
import { jsonOk, jsonErr, zodMsg } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const dynamic = "force-dynamic";

const SEOSchema = z.object({
  title: z.string().min(1, "Judul website wajib diisi").max(100),
  description: z.string().min(1, "Deskripsi wajib diisi").max(300),
  keywords: z.string().max(500).optional().default(""),
  author: z.string().max(100).optional().default("VetaBite Team"),
  faviconUrl: z.string().optional().default("/LOGO.jpeg"),
  thumbnailUrl: z.string().optional().default("/LOGO.jpeg"),
  ogImageUrl: z.string().optional().default("/LOGO.jpeg"),
  twitterHandle: z.string().max(50).optional().default("@vetabite"),
  canonicalUrl: z.string().optional().default("https://vetabite.my.id"),
  googleSiteVerification: z.string().max(200).optional().default(""),
});

const DEFAULT_SEO = {
  title: "VetaBite - Portal Kantin UPN Veteran Jakarta",
  description: "Platform Pemesanan & Antrean Cerdas Kantin UPNVJ Tanpa Antre. Pesan makanan online, bayar digital, ambil tanpa antre.",
  keywords: "VetaBite, Kantin UPN, UPNVJ, Pesan Makanan Online, Antrean Digital, Kantin Digital, UPN Veteran Jakarta, Smart Queue, Food Ordering",
  author: "VetaBite Team",
  faviconUrl: "/LOGO.jpeg",
  thumbnailUrl: "/LOGO.jpeg",
  ogImageUrl: "/LOGO.jpeg",
  twitterHandle: "@vetabite",
  canonicalUrl: "https://vetabite.my.id",
  googleSiteVerification: "",
};

export async function GET() {
  try {
    const existing = await prisma.siteConfig.findFirst({
      where: { key: "seo" },
    });

    if (existing?.value) {
      try {
        const parsed = JSON.parse(existing.value);
        return jsonOk({ ...DEFAULT_SEO, ...parsed });
      } catch {
        return jsonOk(DEFAULT_SEO);
      }
    }

    return jsonOk(DEFAULT_SEO);
  } catch (err: unknown) {
    console.error("GET /api/admin/settings/seo error:", err);
    return jsonOk(DEFAULT_SEO);
  }
}

export async function POST(req: Request) {
  try {
    const s = await getSession();
    if (!s || s.role !== "ADMIN") {
      return jsonErr("FORBIDDEN", "Hanya administrator terverifikasi yang dapat mengubah pengaturan SEO.", 403);
    }

    const raw = await req.json();
    const parsed = SEOSchema.parse(raw);

    // Jika user mengirimkan data URI base64, simpan langsung ke aset SiteConfig terpisah
    if (parsed.faviconUrl && parsed.faviconUrl.startsWith("data:")) {
      await prisma.siteConfig.upsert({
        where: { key: "asset_favicon" },
        update: { value: parsed.faviconUrl, updatedAt: new Date() },
        create: { key: "asset_favicon", value: parsed.faviconUrl, description: "Aset Favicon SEO" },
      });
      parsed.faviconUrl = `/api/uploads/seo?asset=favicon&v=${Date.now()}`;
    }

    if (parsed.thumbnailUrl && parsed.thumbnailUrl.startsWith("data:")) {
      await prisma.siteConfig.upsert({
        where: { key: "asset_thumbnail" },
        update: { value: parsed.thumbnailUrl, updatedAt: new Date() },
        create: { key: "asset_thumbnail", value: parsed.thumbnailUrl, description: "Aset Thumbnail OG SEO" },
      });
      parsed.thumbnailUrl = `/api/uploads/seo?asset=thumbnail&v=${Date.now()}`;
      parsed.ogImageUrl = parsed.thumbnailUrl;
    }

    if (parsed.ogImageUrl && parsed.ogImageUrl.startsWith("data:")) {
      parsed.ogImageUrl = parsed.thumbnailUrl;
    }

    // Upsert konfigurasi SEO ke SiteConfig
    await prisma.siteConfig.upsert({
      where: { key: "seo" },
      update: {
        value: JSON.stringify(parsed),
        updatedAt: new Date(),
      },
      create: {
        key: "seo",
        value: JSON.stringify(parsed),
        description: "Pengaturan SEO, Favicon, dan OpenGraph VetaBite",
      },
    });

    return jsonOk({
      success: true,
      message: "Pengaturan SEO dan Favicon berhasil disimpan.",
      data: parsed,
    });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return jsonErr("VALIDATION_ERROR", zodMsg(err), 400);
    }
    console.error("POST /api/admin/settings/seo error:", err);
    return jsonErr("SERVER_ERROR", err instanceof Error ? err.message : "Gagal menyimpan konfigurasi SEO.", 500);
  }
}
