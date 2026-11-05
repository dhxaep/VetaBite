import { NextRequest } from 'next/server';
import { jsonOk, jsonErr } from '@/lib/api';
import { expireOldPaymentProofs } from '@/lib/payment-proof';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  return handleCron(req);
}

export async function POST(req: NextRequest) {
  return handleCron(req);
}

async function handleCron(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // Proteksi: Endpoint cron wajib menggunakan secret header Bearer
  if (!cronSecret) {
    console.error('CRON_SECRET belum disetel di environment server.');
    return jsonErr('SERVER_CONFIG_ERROR', 'CRON_SECRET belum dikonfigurasi di server.', 500);
  }

  const expectedHeader = `Bearer ${cronSecret}`;
  if (authHeader !== expectedHeader) {
    return jsonErr('UNAUTHORIZED', 'Akses ditolak: Secret token cron tidak valid.', 401);
  }

  try {
    const result = await expireOldPaymentProofs(50);
    console.log(`[CRON] Cleanup bukti pembayaran selesai:`, result);
    return jsonOk({
      message: 'Cleanup bukti pembayaran berhasil dijalankan.',
      timestamp: new Date().toISOString(),
      ...result,
    });
  } catch (err: unknown) {
    console.error('[CRON] Error saat pembersihan bukti pembayaran:', err);
    return jsonErr('SERVER_ERROR', 'Terjadi kesalahan server saat menjalankan cron.', 500);
  }
}

