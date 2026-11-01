import { prisma } from '@/lib/prisma';
import { unlink } from 'fs/promises';
import path from 'path';

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

/**
 * Membersihkan bukti transfer yang sudah lewat dari 2 hari setelah pesanan diselesaikan pemilik kantin
 */
export async function expireOldPaymentProofs(): Promise<number> {
  try {
    const twoDaysAgo = new Date(Date.now() - PROOF_EXPIRATION_MS);

    // Cari pesanan selesai yang sudah lebih dari 2 hari dan masih memiliki payment_proof_url
    const expiredOrders = await prisma.order.findMany({
      where: {
        order_status: { in: ['PICKED_UP', 'SELESAI'] },
        payment_proof_url: { not: '' },
        OR: [
          { picked_up_at: { lte: twoDaysAgo } },
          { picked_up_at: null, updated_at: { lte: twoDaysAgo } },
        ],
      },
      select: {
        id: true,
        payment_proof_url: true,
      },
    });

    if (expiredOrders.length === 0) return 0;

    // Hapus file fisik jika tersimpan di disk lokal /uploads/proof-*
    for (const ord of expiredOrders) {
      if (ord.payment_proof_url && ord.payment_proof_url.startsWith('/uploads/')) {
        const filePath = path.join(process.cwd(), 'public', ord.payment_proof_url);
        try {
          await unlink(filePath);
        } catch {
          // File mungkin sudah dihapus atau dijalankan di serverless readonly
        }
      }
    }

    // Set payment_proof_url menjadi string kosong di database
    const updated = await prisma.order.updateMany({
      where: {
        id: { in: expiredOrders.map((o) => o.id) },
      },
      data: {
        payment_proof_url: '',
      },
    });

    return updated.count;
  } catch (err) {
    console.error('Error in expireOldPaymentProofs:', err);
    return 0;
  }
}
