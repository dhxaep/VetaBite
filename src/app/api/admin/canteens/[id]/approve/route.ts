import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { jsonOk, jsonErr } from '@/lib/api';

export async function POST(_: Request, { params }: any) {
  const s = await getSession();
  if (!s) return jsonErr('UNAUTHORIZED', 'Silakan masuk terlebih dahulu.', 401);
  if (s.role !== 'ADMIN') return jsonErr('FORBIDDEN', 'Tidak memiliki hak akses.', 403);

  const targetId = params?.id ?? (await params)?.id;
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { id: targetId },
        { canteen: { id: targetId } },
      ],
    },
  });

  if (!user) return jsonErr('NOT_FOUND', 'Kantin atau pengguna tidak ditemukan.', 404);

  const u = await prisma.user.update({
    where: { id: user.id },
    data: { status: 'ACTIVE' },
  });

  return jsonOk({ id: u.id, status: u.status });
}
