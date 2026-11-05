import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { jsonOk, jsonErr } from '@/lib/api';
import { processAndUploadImage, deleteImage, MAX_FILE_SIZE_BYTES } from '@/lib/storage/image';

export async function POST(req: Request) {
  try {
    const s = await getSession();
    if (!s) return jsonErr('UNAUTHORIZED', 'Silakan masuk terlebih dahulu.', 401);

    const fd = await req.formData();
    const f = fd.get('file') as unknown as File | null;
    if (!f) return jsonErr('VALIDATION_ERROR', 'File foto profil wajib dipilih.', 400);
    if (f.size > MAX_FILE_SIZE_BYTES) return jsonErr('VALIDATION_ERROR', 'Ukuran file foto maksimal 5 MB.', 400);

    const buf = Buffer.from(await f.arrayBuffer());

    // 1. Ambil data avatar lama untuk pembersihan berkas lama
    const existing = await prisma.user.findUnique({
      where: { id: s.uid },
      select: { avatar_url: true },
    });

    // 2. Upload avatar baru ke bucket 'images' (WebP + kompres)
    const uploadResult = await processAndUploadImage(buf, {
      kind: 'avatar',
      id: s.uid,
    });

    // 3. Simpan URL baru ke database
    await prisma.user.update({
      where: { id: s.uid },
      data: { avatar_url: uploadResult.url },
    });

    // 4. Hapus foto profil lama dari storage jika sebelumnya sudah berupa URL storage
    if (existing?.avatar_url && !existing.avatar_url.startsWith('data:') && !existing.avatar_url.includes('googleusercontent')) {
      await deleteImage('images', existing.avatar_url);
    }

    return jsonOk({ avatar_url: uploadResult.url }, 201);
  } catch (err: unknown) {
    console.error('POST /api/uploads/avatar error:', err);
    const message = err instanceof Error ? err.message : 'Terjadi kesalahan saat memproses foto profil.';
    return jsonErr('SERVER_ERROR', message, 500);
  }
}
