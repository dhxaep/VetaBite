import { getSession } from '@/lib/auth';
import { jsonOk, jsonErr } from '@/lib/api';
import { MAX, extFor } from '@/lib/upload';
import { randomUUID } from 'crypto';
import { writeFile } from 'fs/promises';
import path from 'path';

export async function POST(req: Request) {
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
  const filePath = path.join(process.cwd(), 'public', 'uploads', name);
  await writeFile(filePath, buf);

  const fileUrl = `/uploads/${name}`;
  return jsonOk({ fileUrl }, 201);
}
