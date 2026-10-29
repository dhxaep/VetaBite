import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { jsonOk, jsonErr, zodMsg } from '@/lib/api';

export async function GET(_: Request, { params }: any) {
  const s = await getSession();
  if (!s) return jsonErr('UNAUTHORIZED', 'Silakan masuk terlebih dahulu.', 401);
  if (s.role !== 'ADMIN') return jsonErr('FORBIDDEN', 'Tidak memiliki hak akses.', 403);

  const targetId = params?.id ?? (await params)?.id;
  const c = await prisma.complaint.findUnique({
    where: { id: targetId },
    include: {
      reporter: { select: { full_name: true, role: true } },
      messages: {
        include: { author: { select: { full_name: true, role: true } } },
        orderBy: { created_at: 'asc' },
      },
    },
  });

  if (!c) return jsonErr('NOT_FOUND', 'Komplain tidak ditemukan.', 404);

  return jsonOk({
    id: c.id,
    reporter_name: c.reporter?.full_name ?? 'Pengguna',
    reporter_role: c.reporter_role,
    subject: c.subject,
    preview: c.body,
    status: c.status,
    created_at: c.created_at.toISOString(),
    order_id: c.order_id ?? undefined,
    messages: c.messages.map((m) => ({
      id: m.id,
      sender: m.author?.role === 'ADMIN' ? 'Admin Layanan' : (m.author?.full_name ?? 'Pengirim'),
      body: m.body,
      created_at: m.created_at.toISOString(),
    })),
  });
}

export async function PATCH(req: Request, { params }: any) {
  const s = await getSession();
  if (!s) return jsonErr('UNAUTHORIZED', 'Silakan masuk terlebih dahulu.', 401);
  if (s.role !== 'ADMIN') return jsonErr('FORBIDDEN', 'Tidak memiliki hak akses.', 403);
  try {
    const targetId = params?.id ?? (await params)?.id;
    const b = z.object({ status: z.enum(['BARU', 'DIPROSES', 'SELESAI']) }).parse(await req.json());
    return jsonOk(await prisma.complaint.update({ where: { id: targetId }, data: { status: b.status } }));
  } catch (e: unknown) {
    if (e instanceof z.ZodError) return jsonErr('VALIDATION_ERROR', zodMsg(e), 400);
    return jsonErr('SERVER_ERROR', 'Terjadi kesalahan server.', 500);
  }
}

