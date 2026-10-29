import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { jsonOk, jsonErr } from '@/lib/api';

export async function GET(req: Request) {
  const s = await getSession();
  if (!s) return jsonErr('UNAUTHORIZED', 'Silakan masuk terlebih dahulu.', 401);
  if (s.role !== 'ADMIN') return jsonErr('FORBIDDEN', 'Tidak memiliki hak akses.', 403);

  const url = new URL(req.url);
  const st = url.searchParams.get('status');

  // Count by status across all PENJUAL
  const [countPending, countActive, countRejected] = await Promise.all([
    prisma.user.count({ where: { role: 'PENJUAL', status: 'PENDING' } }),
    prisma.user.count({ where: { role: 'PENJUAL', status: 'ACTIVE' } }),
    prisma.user.count({ where: { role: 'PENJUAL', status: { in: ['REJECTED', 'INACTIVE'] } } }),
  ]);

  const owners = await prisma.user.findMany({
    where: st
      ? st === 'REJECTED'
        ? { role: 'PENJUAL', status: { in: ['REJECTED', 'INACTIVE'] } }
        : { role: 'PENJUAL', status: st }
      : { role: 'PENJUAL' },
    include: { canteen: true },
    orderBy: { created_at: 'desc' },
  });

  const canteens = owners.map((o) => ({
    id: o.canteen?.id ?? o.id,
    user_id: o.id,
    owner_name: o.full_name,
    username: o.username,
    name: o.canteen?.name ?? o.full_name,
    description: o.canteen?.description ?? 'Pengajuan loket mitra kantin kampus UPNVJ.',
    whatsapp: o.whatsapp ?? '-',
    created_at: o.created_at.toISOString(),
    banner_url: o.canteen?.banner_url ?? '',
    status: o.status,
  }));

  return jsonOk({
    canteens,
    counts: {
      PENDING: countPending,
      ACTIVE: countActive,
      REJECTED: countRejected,
    },
  });
}
