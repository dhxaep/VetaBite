import { randomUUID } from 'crypto';
import { getSession } from '@/lib/auth';
import { jsonOk, jsonErr } from '@/lib/api';
import { ownerCanteen } from '@/lib/owner';
import { processAndUploadImage, ImageKind, MAX_FILE_SIZE_BYTES } from '@/lib/storage/image';

export async function POST(req: Request) {
  try {
    const s = await getSession();
    if (!s) return jsonErr('UNAUTHORIZED', 'Silakan masuk terlebih dahulu.', 401);
    if (s.role !== 'PENJUAL' && s.role !== 'ADMIN') {
      return jsonErr('FORBIDDEN', 'Tidak memiliki hak akses.', 403);
    }

    const fd = await req.formData();
    const f = fd.get('file') as unknown as File | null;
    const kind = ((fd.get('kind') as string) || 'menu').toLowerCase();
    const entityId = (fd.get('id') as string) || null;

    if (!f) return jsonErr('VALIDATION_ERROR', 'File gambar wajib dipilih.', 400);
    if (f.size > MAX_FILE_SIZE_BYTES) return jsonErr('VALIDATION_ERROR', 'Ukuran file gambar maksimal 5 MB.', 400);

    let canteenId = entityId;
    if (s.role === 'PENJUAL') {
      const c = await ownerCanteen(s.uid);
      if (!c) return jsonErr('NOT_FOUND', 'Kantin milik Anda tidak ditemukan.', 404);
      canteenId = c.id;
    }

    let imageKind: ImageKind = 'menu';
    let targetId: string = randomUUID();

    if (kind === 'banner') {
      imageKind = 'canteen_banner';
      targetId = canteenId || randomUUID();
    } else if (kind === 'qris') {
      imageKind = 'qris';
      targetId = canteenId || randomUUID();
    } else {
      imageKind = 'menu';
      targetId = entityId || randomUUID();
    }

    const buf = Buffer.from(await f.arrayBuffer());
    const uploadResult = await processAndUploadImage(buf, {
      kind: imageKind,
      id: targetId,
    });

    return jsonOk(
      {
        fileUrl: uploadResult.url,
        path: uploadResult.path,
        sizeBytes: uploadResult.sizeBytes,
      },
      201
    );
  } catch (err: unknown) {
    console.error('POST /api/uploads/canteen error:', err);
    const message = err instanceof Error ? err.message : 'Terjadi kesalahan saat memproses file unggahan.';
    return jsonErr('SERVER_ERROR', message, 500);
  }
}
