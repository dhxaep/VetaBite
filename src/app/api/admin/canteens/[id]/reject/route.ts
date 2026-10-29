import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { jsonOk, jsonErr, zodMsg } from '@/lib/api';

export async function POST(req: Request, { params }: any) {
  const s = await getSession();
  if (!s) return jsonErr('UNAUTHORIZED', 'Silakan masuk terlebih dahulu.', 401);
  if (s.role !== 'ADMIN') return jsonErr('FORBIDDEN', 'Tidak memiliki hak akses.', 403);

  try {
    const targetId = params?.id ?? (await params)?.id;
    const b = z
      .object({ reason: z.string().min(3, { message: 'Alasan penolakan wajib diisi.' }) })
      .parse(await req.json());

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { id: targetId },
          { canteen: { id: targetId } },
        ],
      },
    });

    if (!user) return jsonErr('NOT_FOUND', 'Kantin atau pengguna tidak ditemukan.', 404);

    const u = await prisma.user.update({
      where: { id: user.id },
      data: { status: 'REJECTED', reject_reason: b.reason },
    });

    return jsonOk({ id: u.id, status: u.status });
  } catch (e: unknown) {
    if (e instanceof z.ZodError) return jsonErr('VALIDATION_ERROR', zodMsg(e), 400);
    return jsonErr('SERVER_ERROR', 'Terjadi kesalahan server.', 500);
  }
}
