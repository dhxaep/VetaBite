import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ownerCanteen } from '@/lib/owner';
import { jsonOk, jsonErr } from '@/lib/api';

export async function GET(req: Request) {
  const s = await getSession();
  if (!s) return jsonErr('UNAUTHORIZED', 'Silakan masuk terlebih dahulu.', 401);
  if (s.role !== 'PENJUAL') return jsonErr('FORBIDDEN', 'Tidak memiliki hak akses.', 403);
  const c = await ownerCanteen(s.uid);
  if (!c) return jsonErr('NOT_FOUND', 'Kantin tidak ditemukan.', 404);
  const st = new URL(req.url).searchParams.get('status');
  const allowed = ['MENUNGGU', 'ANTRIAN', 'MASAK', 'SIAP_AMBIL', 'SELESAI', 'DIBATALKAN', 'PICKED_UP'];
  const os = await prisma.order.findMany({
    where: {
      canteen_id: c.id,
      ...(st && allowed.includes(st) ? { order_status: st } : {}),
    },
    orderBy: { ordered_at: 'desc' },
    include: {
      order_items: true,
      buyer: { select: { full_name: true, username: true } },
    },
  });

  const mapped = os.map((o) => ({
    ...o,
    buyer_name: o.buyer?.full_name || o.buyer?.username || 'Mahasiswa',
    created_at: o.ordered_at ? o.ordered_at.toISOString() : o.created_at.toISOString(),
    items: o.order_items.map((it) => ({
      name: it.name_snapshot,
      qty: it.qty,
      note: it.note || '',
      price: it.price_snapshot,
    })),
  }));

  return jsonOk({ orders: mapped, canteen_id: c.id });
}
