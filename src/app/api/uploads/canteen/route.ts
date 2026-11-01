import { getSession } from '@/lib/auth';
import { jsonOk, jsonErr } from '@/lib/api';
import { MAX, extFor } from '@/lib/upload';
import { randomUUID } from 'crypto';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(req: Request) {
  try {
    const s = await getSession();
    if (!s) return jsonErr('UNAUTHORIZED', 'Silakan masuk terlebih dahulu.', 401);
    if (s.role !== 'PENJUAL' && s.role !== 'ADMIN') {
      return jsonErr('FORBIDDEN', 'Tidak memiliki hak akses.', 403);
    }

    const fd = await req.formData();
    const f = fd.get('file') as unknown as File | null;
    const kind = (fd.get('kind') as string) || 'canteen';

    if (!f) return jsonErr('VALIDATION_ERROR', 'File gambar wajib dipilih.', 400);
    if (f.size > MAX) return jsonErr('VALIDATION_ERROR', 'Ukuran file gambar maksimal 5 MB.', 400);

    const buf = Buffer.from(await f.arrayBuffer());
    const ext = extFor(buf.subarray(0, 16), f.type);
    if (!ext) return jsonErr('VALIDATION_ERROR', 'Format gambar harus JPEG, PNG, atau WebP.', 400);

    const name = `${kind}-${randomUUID()}.${ext}`;
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');

    let fileUrl = `/uploads/${name}`;
    try {
      await mkdir(uploadsDir, { recursive: true });
      await writeFile(path.join(uploadsDir, name), buf);
    } catch (fsErr) {
      console.warn("Filesystem read-only, using base64 fallback:", fsErr);
      const mimeType = f.type || (ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg");
      fileUrl = `data:${mimeType};base64,${buf.toString("base64")}`;
    }

    return jsonOk({ fileUrl }, 201);
  } catch (err: unknown) {
    console.error("POST /api/uploads/canteen error:", err);
    return jsonErr('SERVER_ERROR', 'Terjadi kesalahan saat memproses file unggahan.', 500);
  }
}

