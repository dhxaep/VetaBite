import { getSession } from '@/lib/auth';
import { jsonOk, jsonErr } from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const SEOSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  description: z.string().min(1).max(300).optional(),
  keywords: z.string().min(1).max(500).optional(),
  author: z.string().max(100).optional(),
  thumbnailUrl: z.string().url().optional(),
  ogImageUrl: z.string().url().optional(),
  twitterHandle: z.string().max(50).optional(),
  canonicalUrl: z.string().url().optional(),
});

export async function GET() {
  const s = await getSession();
  if (!s || s.role !== 'ADMIN') {
    return jsonErr('FORBIDDEN', 'Hanya admin yang bisa mengakses setting SEO.', 403);
  }

  try {
    const existing = await prisma.siteConfig.findFirst({
      where: { key: 'seo' },
    });

    const defaultSeo = {
      title: 'VetaBite - Portal Kantin UPN Veteran Jakarta',
      description: 'Platform Pemesanan & Antrean Cerdas Kantin UPNVJ Tanpa Antre. Pesan makanan online, bayar digital, ambil tanpa antre.',
      keywords: 'VetaBite, Kantin UPN, UPNVJ, Pesan Makanan Online, Antrean Digital, Kantin Digital, UPN Veteran Jakarta, Smart Queue, Food Ordering',
      author: 'VetaBite Team',
      thumbnailUrl: '/LOGO.jpeg',
      ogImageUrl: '/LOGO.jpeg',
      twitterHandle: '@vetabite',
      canonicalUrl: 'https://vetabite.my.id',
    };

    const data = existing?.value ? JSON.parse(existing.value) : defaultSeo;

    return jsonOk(data);
  } catch (err) {
    console.error('GET /api/admin/settings/seo error:', err);
    return jsonErr('SERVER_ERROR', 'Gagal membaca setting SEO.', 500);
  }
}

export async function POST(req: Request) {
  const s = await getSession();
  if (!s || s.role !== 'ADMIN') {
    return jsonErr('FORBIDDEN', 'Hanya admin yang bisa mengubah setting SEO.', 403);
  }

  const body = await req.json();

  const result = SEOSchema.safeParse(body);
  if (!result.success) {
    return jsonErr('VALIDATION_ERROR', result.error.errors[0]?.message || 'Input SEO tidak valid.', 400);
  }

  try {
    const existing = await prisma.siteConfig.findFirst({
      where: { key: 'seo' },
    });

    if (existing) {
      await prisma.siteConfig.update({
        where: { id: existing.id },
        data: { value: JSON.stringify(result.data), updatedAt: new Date() },
      });
    } else {
      await prisma.siteConfig.create({
        data: {
          key: 'seo',
          value: JSON.stringify(result.data),
          description: 'SEO settings for VetaBite website',
        },
      });
    }

    return jsonOk({ success: true, message: 'SEO settings updated.' });
  } catch (err) {
    console.error('POST /api/admin/settings/seo error:', err);
    return jsonErr('SERVER_ERROR', 'Gagal menyimpan setting SEO.', 500);
  }
}