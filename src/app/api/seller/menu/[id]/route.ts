import { z } from 'zod';
import { randomUUID } from 'crypto';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ownerCanteen } from '@/lib/owner';
import { jsonOk, jsonErr, zodMsg } from '@/lib/api';
import { processAndUploadImage, deleteImage } from '@/lib/storage/image';

export async function PATCH(req: Request, { params }: any) {
  const s = await getSession();
  if (!s) return jsonErr('UNAUTHORIZED', 'Silakan masuk terlebih dahulu.', 401);
  if (s.role !== 'PENJUAL') return jsonErr('FORBIDDEN', 'Tidak memiliki hak akses.', 403);
  const c = await ownerCanteen(s.uid);
  if (!c) return jsonErr('NOT_FOUND', 'Kantin tidak ditemukan.', 404);
  const targetId = params?.id ?? (await params)?.id;
  const m = await prisma.menuItem.findUnique({ where: { id: targetId } });
  if (!m || m.canteen_id !== c.id) return jsonErr('NOT_FOUND', 'Menu tidak ditemukan.', 404);

  try {
    const b = z
      .object({
        name: z.string().min(2).optional(),
        price: z.number().int().min(1000).optional(),
        category: z.string().optional(),
        description: z.string().optional(),
        photo_url: z.string().optional(),
        is_available: z.boolean().optional(),
        is_bestseller: z.boolean().optional(),
      })
      .parse(await req.json());

    let finalPhotoUrl = b.photo_url;
    if (finalPhotoUrl && finalPhotoUrl.startsWith('data:')) {
      const match = finalPhotoUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        const buf = Buffer.from(match[2], 'base64');
        const uploadRes = await processAndUploadImage(buf, { kind: 'menu', id: m.id || randomUUID() });
        finalPhotoUrl = uploadRes.url || '';
      }
    }

    const updated = await prisma.menuItem.update({
      where: { id: m.id },
      data: { ...b, ...(finalPhotoUrl !== undefined ? { photo_url: finalPhotoUrl } : {}) },
    });

    // Bersihkan file lama di Supabase storage jika foto diganti
    if (finalPhotoUrl !== undefined && m.photo_url && m.photo_url !== finalPhotoUrl) {
      await deleteImage('images', m.photo_url);
    }

    return jsonOk(updated);
  } catch (e: unknown) {
    if (e instanceof z.ZodError) return jsonErr('VALIDATION_ERROR', zodMsg(e), 400);
    return jsonErr('SERVER_ERROR', 'Terjadi kesalahan server.', 500);
  }
}

export async function DELETE(_: Request, { params }: any) {
  const s = await getSession();
  if (!s) return jsonErr('UNAUTHORIZED', 'Silakan masuk terlebih dahulu.', 401);
  if (s.role !== 'PENJUAL') return jsonErr('FORBIDDEN', 'Tidak memiliki hak akses.', 403);
  const c = await ownerCanteen(s.uid);
  if (!c) return jsonErr('NOT_FOUND', 'Kantin tidak ditemukan.', 404);
  const targetId = params?.id ?? (await params)?.id;
  const m = await prisma.menuItem.findUnique({ where: { id: targetId } });
  if (!m || m.canteen_id !== c.id) return jsonErr('NOT_FOUND', 'Menu tidak ditemukan.', 404);

  await prisma.menuItem.delete({ where: { id: m.id } });

  // Hapus file fisik gambar menu dari storage jika ada
  if (m.photo_url) {
    await deleteImage('images', m.photo_url);
  }

  return jsonOk({ id: m.id, deleted: true });
}
