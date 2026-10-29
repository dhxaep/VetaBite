import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { jsonOk, jsonErr } from '@/lib/api';
import { publishOrder } from '@/lib/sse';

async function handlePickup(_: Request, { params }: any) {
  const s = await getSession();
  if (!s) return jsonErr('UNAUTHORIZED', 'Silakan masuk terlebih dahulu.', 401);
  const targetId = params?.id ?? (await params)?.id;
  const o = await prisma.order.findUnique({ where: { id: targetId } });
  if (!o) return jsonErr('NOT_FOUND', 'Pesanan tidak ditemukan.', 404);
  if (o.buyer_id !== s.uid && s.role !== 'PENJUAL' && s.role !== 'ADMIN') {
    return jsonErr('FORBIDDEN', 'Tidak memiliki hak akses.', 403);
  }
  if (o.order_status !== 'SIAP_AMBIL' && o.order_status !== 'SELESAI') {
    return jsonErr('VALIDATION_ERROR', 'Pesanan belum siap diambil.', 409);
  }
  const u = await prisma.order.update({
    where: { id: o.id },
    data: { order_status: 'PICKED_UP', can_pickup: false, picked_up_at: new Date() },
  });
  publishOrder(o.id, {
    event: 'order_update',
    data: {
      order_id: u.id,
      order_status: u.order_status,
      payment_status: u.payment_status,
      can_pickup: false,
      updated_at: u.updated_at,
    },
  });
  return jsonOk(u);
}

export const POST = handlePickup;
export const PATCH = handlePickup;

