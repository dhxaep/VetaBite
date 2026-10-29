import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ownerCanteen } from '@/lib/owner';
import { jsonOk, jsonErr, zodMsg } from '@/lib/api';
import { publishOrder, publishCanteen } from '@/lib/sse';

const LEGAL: Record<string, string[]> = {
  DIBUAT: ['MASAK', 'DIBATALKAN'],
  MENUNGGU: ['MASAK', 'DIBATALKAN'],
  ANTRIAN: ['MASAK', 'DIBATALKAN'],
  MASAK: ['SIAP_AMBIL', 'DIBATALKAN'],
  SIAP_AMBIL: ['PICKED_UP', 'SELESAI', 'DIBATALKAN'],
};

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const s = await getSession();
  if (!s) return jsonErr('UNAUTHORIZED', 'Silakan masuk terlebih dahulu.', 401);
  if (s.role !== 'PENJUAL') return jsonErr('FORBIDDEN', 'Tidak memiliki hak akses.', 403);

  const c = await ownerCanteen(s.uid);
  if (!c) return jsonErr('NOT_FOUND', 'Kantin tidak ditemukan.', 404);

  const resolved = await params;
  const targetId = resolved.id;
  const o = await prisma.order.findUnique({ where: { id: targetId } });
  if (!o || o.canteen_id !== c.id) return jsonErr('NOT_FOUND', 'Pesanan tidak ditemukan.', 404);

  try {
    const raw = await req.json();
    let toStatus = raw.toStatus || raw.order_status || raw.status;
    if (toStatus === 'SELESAI') toStatus = 'PICKED_UP';

    const b = z
      .object({
        toStatus: z.enum(['MASAK', 'SIAP_AMBIL', 'PICKED_UP', 'DIBATALKAN']),
        estimated_minutes: z.number().int().min(1).optional(),
        reason: z.string().optional(),
      })
      .parse({
        toStatus,
        estimated_minutes: raw.estimated_minutes,
        reason: raw.reason,
      });

    const allowed = LEGAL[o.order_status] ?? [];
    if (!allowed.includes(b.toStatus)) {
      return jsonErr('VALIDATION_ERROR', `Transisi ${o.order_status} ke ${b.toStatus} tidak diizinkan.`, 409);
    }

    if (b.toStatus === 'MASAK' && o.payment_status !== 'SUDAH_DIBAYAR') {
      return jsonErr('VALIDATION_ERROR', 'Pesanan belum dibayar, tidak bisa dimasak.', 409);
    }

    const data: any = { order_status: b.toStatus };
    if (b.estimated_minutes) data.estimated_minutes = b.estimated_minutes;
    if (b.toStatus === 'SIAP_AMBIL') data.can_pickup = true;
    if (b.toStatus === 'PICKED_UP') {
      data.can_pickup = false;
      data.picked_up_at = new Date();
    }

    const u = await prisma.order.update({ where: { id: o.id }, data });
    const p = {
      event: 'order_update',
      data: {
        order_id: u.id,
        order_status: u.order_status,
        payment_status: u.payment_status,
        can_pickup: u.can_pickup,
        estimated_minutes: u.estimated_minutes,
        updated_at: u.updated_at,
      },
    };
    publishOrder(o.id, p);
    publishCanteen(c.id, p);
    return jsonOk(u);
  } catch (e: unknown) {
    if (e instanceof z.ZodError) return jsonErr('VALIDATION_ERROR', zodMsg(e), 400);
    return jsonErr('SERVER_ERROR', 'Terjadi kesalahan server.', 500);
  }
}

