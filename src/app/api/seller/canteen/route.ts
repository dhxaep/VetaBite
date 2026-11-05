import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ownerCanteen } from '@/lib/owner';
import { jsonOk, jsonErr, zodMsg } from '@/lib/api';
import { publishCanteen } from '@/lib/sse';
import { processAndUploadImage, deleteImage } from '@/lib/storage/image';

export async function GET() {
  const s = await getSession();
  if (!s) return jsonErr('UNAUTHORIZED', 'Silakan masuk terlebih dahulu.', 401);
  if (s.role !== 'PENJUAL') return jsonErr('FORBIDDEN', 'Tidak memiliki hak akses.', 403);
  const c = await ownerCanteen(s.uid);
  if (!c) return jsonErr('NOT_FOUND', 'Kantin tidak ditemukan.', 404);
  const menus = await prisma.menuItem.findMany({
    where: { canteen_id: c.id },
    orderBy: { created_at: 'desc' },
  });
  return jsonOk({ canteen: c, menus });
}

export async function PATCH(req: Request) {
  const s = await getSession();
  if (!s) return jsonErr('UNAUTHORIZED', 'Silakan masuk terlebih dahulu.', 401);
  if (s.role !== 'PENJUAL') return jsonErr('FORBIDDEN', 'Tidak memiliki hak akses.', 403);
  const c = await ownerCanteen(s.uid);
  if (!c) return jsonErr('NOT_FOUND', 'Kantin tidak ditemukan.', 404);

  try {
    const b = z
      .object({
        is_open: z.boolean().optional(),
        banner_url: z.string().optional(),
        description: z.string().optional(),
        qris_image_url: z.string().optional(),
        name: z.string().optional(),
      })
      .parse(await req.json());

    let finalBannerUrl = b.banner_url;
    if (finalBannerUrl && finalBannerUrl.startsWith('data:')) {
      const match = finalBannerUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        const buf = Buffer.from(match[2], 'base64');
        const uploadRes = await processAndUploadImage(buf, { kind: 'canteen_banner', id: c.id });
        finalBannerUrl = uploadRes.url || '';
      }
    }

    let finalQrisUrl = b.qris_image_url;
    if (finalQrisUrl && finalQrisUrl.startsWith('data:')) {
      const match = finalQrisUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        const buf = Buffer.from(match[2], 'base64');
        const uploadRes = await processAndUploadImage(buf, { kind: 'qris', id: c.id });
        finalQrisUrl = uploadRes.url || '';
      }
    }

    const updatePayload: any = { ...b };
    if (finalBannerUrl !== undefined) updatePayload.banner_url = finalBannerUrl;
    if (finalQrisUrl !== undefined) updatePayload.qris_image_url = finalQrisUrl;

    const u = await prisma.canteen.update({ where: { id: c.id }, data: updatePayload });

    // Hapus berkas lama jika diganti
    if (finalBannerUrl !== undefined && c.banner_url && c.banner_url !== finalBannerUrl) {
      await deleteImage('images', c.banner_url);
    }
    if (finalQrisUrl !== undefined && c.qris_image_url && c.qris_image_url !== finalQrisUrl) {
      await deleteImage('images', c.qris_image_url);
    }

    publishCanteen(c.id, { event: 'canteen_update', data: { canteen_id: u.id, is_open: u.is_open } });
    return jsonOk(u);
  } catch (e: unknown) {
    if (e instanceof z.ZodError) return jsonErr('VALIDATION_ERROR', zodMsg(e), 400);
    return jsonErr('SERVER_ERROR', 'Terjadi kesalahan server.', 500);
  }
}
