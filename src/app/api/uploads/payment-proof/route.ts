import { randomUUID } from 'crypto';
import { getSession } from '@/lib/auth';
import { jsonOk, jsonErr } from '@/lib/api';
import { processAndUploadImage, MAX_FILE_SIZE_BYTES } from '@/lib/storage/image';

export async function POST(req: Request) {
  try {
    const s = await getSession();
    if (!s) return jsonErr('UNAUTHORIZED', 'Silakan masuk terlebih dahulu.', 401);

    const fd = await req.formData();
    const f = fd.get('file') as unknown as File | null;
    if (!f) return jsonErr('VALIDATION_ERROR', 'File bukti pembayaran wajib diunggah.', 400);
    if (f.size > MAX_FILE_SIZE_BYTES) return jsonErr('VALIDATION_ERROR', 'Ukuran file maksimal 5 MB.', 400);

    const buf = Buffer.from(await f.arrayBuffer());
    const proofId = randomUUID();

    // Upload ke bucket private 'payment-proofs' (hanya path yang disimpan)
    const uploadResult = await processAndUploadImage(buf, {
      kind: 'payment_proof',
      id: proofId,
    });

    // Kembalikan path storage ke frontend untuk dikirim ke endpoint /api/orders
    return jsonOk(
      {
        path: uploadResult.path,
        fileUrl: uploadResult.path,
        sizeBytes: uploadResult.sizeBytes,
      },
      201
    );
  } catch (err: unknown) {
    console.error('POST /api/uploads/payment-proof error:', err);
    const message = err instanceof Error ? err.message : 'Terjadi kesalahan saat memproses file bukti pembayaran.';
    return jsonErr('SERVER_ERROR', message, 500);
  }
}
