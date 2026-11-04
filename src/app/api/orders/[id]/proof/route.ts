import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { jsonErr } from '@/lib/api';
import { isPaymentProofExpired } from '@/lib/payment-proof';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const s = await getSession();
  if (!s) return jsonErr('UNAUTHORIZED', 'Silakan masuk terlebih dahulu.', 401);
  const { id } = await params;
  const o = await prisma.order.findUnique({
    where: { id },
    select: {
      buyer_id: true,
      order_status: true,
      picked_up_at: true,
      updated_at: true,
      payment_proof_url: true,
      canteen: { select: { owner_id: true } },
    },
  });
  if (!o) return jsonErr('NOT_FOUND', 'Pesanan tidak ditemukan.', 404);
  const allowed = s.role === 'ADMIN' || o.buyer_id === s.uid || o.canteen?.owner_id === s.uid;
  if (!allowed) return jsonErr('FORBIDDEN', 'Tidak memiliki hak akses.', 403);
  if (!o.payment_proof_url || isPaymentProofExpired(o)) return jsonErr('NOT_FOUND', 'Bukti pembayaran tidak tersedia.', 404);

  const match = o.payment_proof_url.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return Response.redirect(new URL(o.payment_proof_url, req.url), 302);
  return new Response(Buffer.from(match[2], 'base64'), {
    headers: { 'Content-Type': match[1], 'Cache-Control': 'private, max-age=3600' },
  });
}
