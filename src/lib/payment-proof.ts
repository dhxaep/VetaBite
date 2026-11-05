import { prisma } from '@/lib/prisma';
import { PAYMENT_PROOF_TTL_HOURS, PAYMENT_PROOF_TTL_MS, deleteImage, getSignedProofUrl } from '@/lib/storage/image';

export { PAYMENT_PROOF_TTL_HOURS, PAYMENT_PROOF_TTL_MS };

/**
 * Memeriksa apakah bukti transfer suatu pesanan sudah hangus (5 jam setelah diunggah)
 */
export function isPaymentProofExpired(order: {
  payment_proof_expires_at?: Date | string | null;
  payment_proof_url?: string | null;
  created_at?: Date | string | null;
  ordered_at?: Date | string | null;
}): boolean {
  if (!order.payment_proof_url || order.payment_proof_url === '') return true;

  if (order.payment_proof_expires_at) {
    return new Date(order.payment_proof_expires_at).getTime() <= Date.now();
  }

  // Fallback untuk pesanan lama yang belum memiliki payment_proof_expires_at:
  // Acuan adalah ordered_at atau created_at + 5 jam
  const baseTime = order.ordered_at
    ? new Date(order.ordered_at).getTime()
    : order.created_at
    ? new Date(order.created_at).getTime()
    : null;

  if (!baseTime) return false;
  return Date.now() - baseTime >= PAYMENT_PROOF_TTL_MS;
}

/**
 * Menghitung sisa waktu aktif bukti pembayaran dalam format teks yang ramah pengguna.
 * Contoh: "Hangus dalam 3 jam 12 menit" atau "Bukti pembayaran sudah dihapus".
 */
export function formatRemainingProofTime(expiresAt?: Date | string | null): string {
  if (!expiresAt) return 'Bukti pembayaran sudah dihapus';
  const remainingMs = new Date(expiresAt).getTime() - Date.now();
  if (remainingMs <= 0) return 'Bukti pembayaran sudah dihapus';

  const totalMinutes = Math.floor(remainingMs / (60 * 1000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) {
    return `Hangus dalam ${hours} jam ${minutes} menit`;
  }
  return `Hangus dalam ${minutes} menit`;
}

/**
 * Membersihkan bukti transfer yang sudah lewat 5 jam sejak diunggah.
 * Menghapus file fisik dari Supabase Storage (bucket payment-proofs) lalu mengosongkan kolom database.
 */
export async function expireOldPaymentProofs(batchSize = 50): Promise<{ processed: number; deleted: number; errors: number }> {
  const now = new Date();
  let deletedCount = 0;
  let errorCount = 0;

  try {
    const expiredOrders = await prisma.order.findMany({
      where: {
        payment_proof_url: { not: '' },
        OR: [
          { payment_proof_expires_at: { lte: now } },
          {
            payment_proof_expires_at: null,
            created_at: { lte: new Date(Date.now() - PAYMENT_PROOF_TTL_MS) },
          },
        ],
      },
      select: {
        id: true,
        payment_proof_url: true,
      },
      take: batchSize,
    });

    for (const order of expiredOrders) {
      try {
        // Hapus berkas fisik dari bucket 'payment-proofs' jika berupa path storage
        if (order.payment_proof_url && !order.payment_proof_url.startsWith('data:')) {
          await deleteImage('payment-proofs', order.payment_proof_url);
        }

        // Update database: kosongkan bukti dan waktu kadaluarsa (jangan ubah status pesanan!)
        await prisma.order.update({
          where: { id: order.id },
          data: {
            payment_proof_url: '',
            payment_proof_expires_at: null,
          },
        });
        deletedCount++;
      } catch (err) {
        console.error(`Gagal menghapus bukti pembayaran expired untuk order ${order.id}:`, err);
        errorCount++;
      }
    }

    return { processed: expiredOrders.length, deleted: deletedCount, errors: errorCount };
  } catch (err) {
    console.error('Error saat expireOldPaymentProofs:', err);
    return { processed: 0, deleted: deletedCount, errors: errorCount + 1 };
  }
}

/**
 * Daftar id pesanan yang punya bukti transfer aktif (belum hangus).
 */
export async function ordersWithProof(ids: string[]): Promise<Set<string>> {
  if (ids.length === 0) return new Set();
  const rows = await prisma.order.findMany({
    where: {
      id: { in: ids },
      payment_proof_url: { not: '' },
      OR: [
        { payment_proof_expires_at: { gt: new Date() } },
        { payment_proof_expires_at: null },
      ],
    },
    select: { id: true },
  });
  return new Set(rows.map((r) => r.id));
}

export function proofUrl(orderId: string): string {
  return `/api/orders/${orderId}/proof`;
}
