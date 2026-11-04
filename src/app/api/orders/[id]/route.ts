import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { jsonOk, jsonErr } from '@/lib/api';
import { isPaymentProofExpired, ordersWithProof, proofUrl } from '@/lib/payment-proof';

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const s = await getSession();
  if (!s) return jsonErr('UNAUTHORIZED', 'Silakan masuk terlebih dahulu.', 401);
  const resolved = await params;
  const id = resolved.id;
  const o = await prisma.order.findUnique({
    where: { id },
    omit: { payment_proof_url: true },
    include: {
      order_items: true,
      canteen: { select: { name: true, queue_prefix: true } },
      buyer: { select: { id: true, full_name: true, username: true, email: true } },
    },
  });
  if (!o) return jsonErr('NOT_FOUND', 'Pesanan tidak ditemukan.', 404);
  if (o.buyer_id !== s.uid && s.role === 'MAHASISWA') return jsonErr('FORBIDDEN', 'Tidak memiliki hak akses.', 403);
  const nim = o.buyer?.username || (o.buyer?.email ? o.buyer.email.split('@')[0] : '') || '-';
  const withProof = await ordersWithProof([o.id]);
  const isExpired = isPaymentProofExpired(o) || !withProof.has(o.id);
  return jsonOk({
    ...o,
    buyer_name: o.buyer?.full_name || 'Mahasiswa',
    buyer_nim: nim,
    payment_proof_url: isExpired ? '' : proofUrl(o.id),
    proof_expired: isExpired,
  });
}
