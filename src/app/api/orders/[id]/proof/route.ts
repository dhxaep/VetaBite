import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { jsonErr } from '@/lib/api';
import { isPaymentProofExpired } from '@/lib/payment-proof';
import { getSignedProofUrl } from '@/lib/storage/image';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const s = await getSession();
  if (!s) return jsonErr('UNAUTHORIZED', 'Silakan masuk terlebih dahulu.', 401);

  const { id } = await params;
  const o = await prisma.order.findUnique({
    where: { id },
    select: {
      buyer_id: true,
      order_status: true,
      payment_proof_url: true,
      payment_proof_expires_at: true,
      created_at: true,
      ordered_at: true,
      canteen: { select: { owner_id: true } },
    },
  });

  if (!o) return jsonErr('NOT_FOUND', 'Pesanan tidak ditemukan.', 404);

  // Otorisasi ketat: hanya admin, pembeli yang bersangkutan, atau pemilik kantin tujuan
  const allowed = s.role === 'ADMIN' || o.buyer_id === s.uid || o.canteen?.owner_id === s.uid;
  if (!allowed) return jsonErr('FORBIDDEN', 'Tidak memiliki hak akses ke bukti pembayaran ini.', 403);

  // Verifikasi hangus / tidak ada bukti
  if (!o.payment_proof_url || isPaymentProofExpired(o)) {
    return jsonErr('NOT_FOUND', 'Bukti pembayaran sudah hangus atau tidak tersedia.', 404);
  }

  // Fallback untuk data lama base64 yang belum termigrasi
  if (o.payment_proof_url.startsWith('data:')) {
    const match = o.payment_proof_url.match(/^data:([^;]+);base64,(.+)$/);
    if (match) {
      return new Response(Buffer.from(match[2], 'base64'), {
        headers: { 'Content-Type': match[1], 'Cache-Control': 'private, max-age=600' },
      });
    }
  }

  // Untuk file di Supabase Storage (bucket private): buat signed URL
  const signedUrl = await getSignedProofUrl(o.payment_proof_url, o.payment_proof_expires_at);
  if (!signedUrl) {
    return jsonErr('NOT_FOUND', 'Bukti pembayaran sudah hangus.', 404);
  }

  // Redirect client ke signed URL dengan status 302
  return Response.redirect(new URL(signedUrl, req.url), 302);
}
