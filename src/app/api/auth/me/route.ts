import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { jsonOk, jsonErr } from '@/lib/api';

export async function GET() {
  const s = await getSession();
  if (!s) return jsonErr('UNAUTHORIZED', 'Silakan masuk terlebih dahulu.', 401);

  const u = await prisma.user.findUnique({
    where: { id: s.uid },
    include: { canteen: true },
  });
  if (!u) return jsonErr('NOT_FOUND', 'Pengguna tidak ditemukan.', 404);

  return jsonOk({
    id: u.id,
    username: u.username,
    full_name: u.full_name,
    role: u.role,
    status: u.status,
    approved: u.status === 'ACTIVE',
    canteen: u.canteen,
    reject_reason: u.reject_reason,
  });
}
