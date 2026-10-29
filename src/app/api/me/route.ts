import { z } from 'zod';
import { getSession, verifyPassword, hashPassword } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { jsonOk, jsonErr, zodMsg } from '@/lib/api';

const S = z.object({
  full_name: z.string().min(2, { message: 'Nama lengkap minimal 2 karakter.' }).optional(),
  whatsapp: z.string().optional(),
  avatar_url: z.string().optional(),
  language: z.enum(['id', 'en']).optional(),
  theme: z.enum(['light', 'dark']).optional(),
  old_password: z.string().optional(),
  new_password: z.string().min(6, { message: 'Kata sandi baru minimal 6 karakter.' }).optional(),
});

export async function GET() {
  const s = await getSession();
  if (!s) return jsonErr('UNAUTHORIZED', 'Silakan masuk terlebih dahulu.', 401);
  const u = await prisma.user.findUnique({ where: { id: s.uid } });
  if (!u) return jsonErr('NOT_FOUND', 'Akun tidak ditemukan.', 404);
  return jsonOk({
    id: u.id,
    username: u.username,
    full_name: u.full_name,
    role: u.role,
    status: u.status,
    whatsapp: u.whatsapp,
    avatar_url: u.avatar_url,
    language: u.language,
    theme: u.theme,
  });
}

export async function PATCH(req: Request) {
  const s = await getSession();
  if (!s) return jsonErr('UNAUTHORIZED', 'Silakan masuk terlebih dahulu.', 401);

  try {
    const b = S.parse(await req.json());
    const u = await prisma.user.findUnique({ where: { id: s.uid } });
    if (!u) return jsonErr('NOT_FOUND', 'Akun tidak ditemukan.', 404);

    const updateData: Record<string, any> = {};
    if (b.full_name !== undefined) updateData.full_name = b.full_name;
    if (b.whatsapp !== undefined) updateData.whatsapp = b.whatsapp;
    if (b.avatar_url !== undefined) updateData.avatar_url = b.avatar_url;
    if (b.language !== undefined) updateData.language = b.language;
    if (b.theme !== undefined) updateData.theme = b.theme;

    if (b.new_password) {
      if (!b.old_password) {
        return jsonErr('VALIDATION_ERROR', 'Kata sandi lama wajib diisi.', 400);
      }
      const match = await verifyPassword(b.old_password, u.password_hash);
      if (!match) {
        return jsonErr('VALIDATION_ERROR', 'Kata sandi lama tidak sesuai.', 400);
      }
      updateData.password_hash = await hashPassword(b.new_password);
    }

    const updated = await prisma.user.update({
      where: { id: s.uid },
      data: updateData,
    });

    return jsonOk({
      id: updated.id,
      username: updated.username,
      full_name: updated.full_name,
      whatsapp: updated.whatsapp,
      avatar_url: updated.avatar_url,
      language: updated.language,
      theme: updated.theme,
    });
  } catch (e: unknown) {
    if (e instanceof z.ZodError) return jsonErr('VALIDATION_ERROR', zodMsg(e), 400);
    return jsonErr('SERVER_ERROR', 'Terjadi kesalahan server.', 500);
  }
}
