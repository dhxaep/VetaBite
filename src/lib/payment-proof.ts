import { prisma } from '@/lib/prisma';

export const PROOF_EXPIRATION_MS = 2 * 24 * 60 * 60 * 1000; // 2 hari (48 jam)

/**
 * Memeriksa apakah bukti transfer suatu pesanan sudah hangus (2 hari setelah diselesaikan pemilik kantin)
 */
export function isPaymentProofExpired(order: {
  order_status?: string | null;
  picked_up_at?: Date | string | null;
  updated_at?: Date | string | null;
}): boolean {
  const isCompleted = order.order_status === 'PICKED_UP' || order.order_status === 'SELESAI';
  if (!isCompleted) return false;

  const completedTime = order.picked_up_at
    ? new Date(order.picked_up_at).getTime()
    : order.updated_at
    ? new Date(order.updated_at).getTime()
    : null;

  if (!completedTime) return false;
  return Date.now() - completedTime >= PROOF_EXPIRATION_MS;
}

let lastExpireRun = 0;
const EXPIRE_INTERVAL_MS = 60 * 60 * 1000;

/**
 * Membersihkan bukti transfer yang sudah lewat dari 2 hari setelah pesanan diselesaikan pemilik kantin.
 * Dibatasi sekali per jam karena dipanggil dari endpoint yang di-polling.
 */
export async function expireOldPaymentProofs(): Promise<number> {
  if (Date.now() - lastExpireRun < EXPIRE_INTERVAL_MS) return 0;
  lastExpireRun = Date.now();
  try {
    const twoDaysAgo = new Date(Date.now() - PROOF_EXPIRATION_MS);
    const updated = await prisma.order.updateMany({
      where: {
        order_status: { in: ['PICKED_UP', 'SELESAI'] },
        payment_proof_url: { not: '' },
        OR: [
          { picked_up_at: { lte: twoDaysAgo } },
          { picked_up_at: null, updated_at: { lte: twoDaysAgo } },
        ],
      },
      data: { payment_proof_url: '' },
    });
    return updated.count;
  } catch (err) {
    console.error('Error in expireOldPaymentProofs:', err);
    return 0;
  }
}

/**
 * Daftar id pesanan yang punya bukti transfer, tanpa memuat isi gambarnya.
 */
export async function ordersWithProof(ids: string[]): Promise<Set<string>> {
  if (ids.length === 0) return new Set();
  const rows = await prisma.order.findMany({
    where: { id: { in: ids }, payment_proof_url: { not: '' } },
    select: { id: true },
  });
  return new Set(rows.map((r) => r.id));
}

export function proofUrl(orderId: string) {
  return `/api/orders/${orderId}/proof`;
}
