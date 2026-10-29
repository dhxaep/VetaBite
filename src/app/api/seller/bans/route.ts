import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ownerCanteen } from '@/lib/owner';
import { jsonOk, jsonErr, zodMsg } from '@/lib/api';

export async function GET() {
  const s = await getSession();
  if (!s) return jsonErr('UNAUTHORIZED', 'Silakan masuk terlebih dahulu.', 401);
  if (s.role !== 'PENJUAL') return jsonErr('FORBIDDEN', 'Tidak memiliki hak akses.', 403);
  const c = await ownerCanteen(s.uid);
  if (!c) return jsonErr('NOT_FOUND', 'Kantin tidak ditemukan.', 404);

  const rawBans = await prisma.canteenBan.findMany({
    where: { canteen_id: c.id },
    include: { user: { select: { id: true, username: true, full_name: true } } },
    orderBy: { created_at: 'desc' },
  });

  const bans = rawBans.map((b) => ({
    user_id: b.user_id,
    full_name: b.user?.full_name ?? 'Mahasiswa',
    username: b.user?.username ?? 'mahasiswa',
    reason: b.reason,
    created_at: b.created_at.toISOString(),
  }));

  return jsonOk(bans);
}

export async function POST(req: Request) {
  const s = await getSession();
  if (!s) return jsonErr('UNAUTHORIZED', 'Silakan masuk terlebih dahulu.', 401);
  if (s.role !== 'PENJUAL') return jsonErr('FORBIDDEN', 'Tidak memiliki hak akses.', 403);
  const c = await ownerCanteen(s.uid);
  if (!c) return jsonErr('NOT_FOUND', 'Kantin tidak ditemukan.', 404);

  try {
    const raw = await req.json();
    const reason = raw.reason || 'Pelanggaran aturan loket kantin';

    let targetUserId = raw.user_id;

    if (!targetUserId && raw.order_id) {
      const order = await prisma.order.findUnique({ where: { id: raw.order_id } });
      if (order) targetUserId = order.buyer_id;
    }

    if (!targetUserId && raw.username) {
      const cleanUser = String(raw.username).replace(/^@/, '').trim();
      const user = await prisma.user.findFirst({ where: { username: cleanUser } });
      if (user) targetUserId = user.id;
      else return jsonErr('NOT_FOUND', `Pengguna @${cleanUser} tidak ditemukan.`, 404);
    }

    if (!targetUserId) {
      return jsonErr('VALIDATION_ERROR', 'Informasi pengguna yang akan diblokir tidak valid.', 400);
    }

    const ban = await prisma.canteenBan.upsert({
      where: {
        canteen_id_user_id: {
          canteen_id: c.id,
          user_id: targetUserId,
        },
      },
      create: {
        canteen_id: c.id,
        user_id: targetUserId,
        reason,
        note: raw.note,
      },
      update: {
        reason,
        note: raw.note,
      },
    });

    return jsonOk(ban, 201);
  } catch (e: unknown) {
    if (e instanceof z.ZodError) return jsonErr('VALIDATION_ERROR', zodMsg(e), 400);
    return jsonErr('SERVER_ERROR', 'Terjadi kesalahan server.', 500);
  }
}

