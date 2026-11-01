import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ownerCanteen } from '@/lib/owner';
import { jsonOk, jsonErr, zodMsg } from '@/lib/api';

export async function GET(req: Request) {
  const s = await getSession();
  if (!s) return jsonErr('UNAUTHORIZED', 'Silakan masuk terlebih dahulu.', 401);
  if (s.role !== 'PENJUAL') return jsonErr('FORBIDDEN', 'Tidak memiliki hak akses.', 403);
  const c = await ownerCanteen(s.uid);
  if (!c) return jsonErr('NOT_FOUND', 'Kantin tidak ditemukan.', 404);

  const { searchParams } = new URL(req.url);
  const lookupNim = searchParams.get('lookup_nim');

  if (lookupNim) {
    const cleanNim = lookupNim.trim();
    const student = await prisma.user.findFirst({
      where: {
        OR: [
          { username: { equals: cleanNim, mode: 'insensitive' } },
          { email: { startsWith: cleanNim, mode: 'insensitive' } },
        ],
        role: 'MAHASISWA',
      },
      select: {
        id: true,
        username: true,
        full_name: true,
        email: true,
        avatar_url: true,
      },
    });

    if (!student) {
      return jsonErr('NOT_FOUND', `Mahasiswa dengan NIM "${cleanNim}" tidak ditemukan di database kampus.`, 404);
    }

    const isAlreadyBanned = await prisma.canteenBan.findUnique({
      where: {
        canteen_id_user_id: {
          canteen_id: c.id,
          user_id: student.id,
        },
      },
    });

    return jsonOk({
      student: {
        id: student.id,
        nim: student.username,
        full_name: student.full_name,
        email: student.email,
        avatar_url: student.avatar_url,
        isBanned: Boolean(isAlreadyBanned),
      },
    });
  }

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

    if (!targetUserId && (raw.nim || raw.username)) {
      const cleanNim = String(raw.nim || raw.username).replace(/^@/, '').trim();
      const student = await prisma.user.findFirst({
        where: {
          OR: [
            { username: { equals: cleanNim, mode: 'insensitive' } },
            { email: { startsWith: cleanNim, mode: 'insensitive' } },
          ],
          role: 'MAHASISWA',
        },
      });

      if (student) {
        targetUserId = student.id;
      } else {
        return jsonErr('NOT_FOUND', `Mahasiswa dengan NIM "${cleanNim}" tidak ditemukan di database. Pastikan NIM sudah benar.`, 404);
      }
    }

    if (!targetUserId) {
      return jsonErr('VALIDATION_ERROR', 'NIM mahasiswa wajib diisi untuk melakukan pemblokiran.', 400);
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
      include: {
        user: { select: { id: true, username: true, full_name: true } },
      },
    });

    return jsonOk(ban, 201);
  } catch (e: unknown) {
    if (e instanceof z.ZodError) return jsonErr('VALIDATION_ERROR', zodMsg(e), 400);
    return jsonErr('SERVER_ERROR', 'Terjadi kesalahan server.', 500);
  }
}

