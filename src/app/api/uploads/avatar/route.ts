import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { jsonOk, jsonErr } from '@/lib/api';
import { MAX, extFor } from '@/lib/upload';

export async function POST(req: Request) {
  try {
    const s = await getSession();
    if (!s) return jsonErr('UNAUTHORIZED', 'Silakan masuk terlebih dahulu.', 401);

    const fd = await req.formData();
    const f = fd.get('file') as unknown as File | null;
    if (!f) return jsonErr('VALIDATION_ERROR', 'File foto profil wajib dipilih.', 400);
    if (f.size > MAX) return jsonErr('VALIDATION_ERROR', 'Ukuran file foto maksimal 5 MB.', 400);

    const buf = Buffer.from(await f.arrayBuffer());
    const ext = extFor(buf.subarray(0, 16), f.type);
    if (!ext) return jsonErr('VALIDATION_ERROR', 'Format foto harus JPEG, PNG, atau WebP.', 400);

    // Cloudflare Workers tidak punya disk persisten: simpan sebagai data URI di database
    const mimeType = f.type || (ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg");
    const avatarUrl = `data:${mimeType};base64,${buf.toString("base64")}`;

    await prisma.user.update({
      where: { id: s.uid },
      data: { avatar_url: avatarUrl },
    });

    return jsonOk({ avatar_url: avatarUrl }, 201);
  } catch (err: unknown) {
    console.error("POST /api/uploads/avatar error:", err);
    return jsonErr('SERVER_ERROR', 'Terjadi kesalahan saat memproses foto profil.', 500);
  }
}

