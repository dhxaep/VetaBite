import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { jsonOk, jsonErr, zodMsg } from '@/lib/api';

export async function GET(req: Request) {
  const s = await getSession();
  if (!s) return jsonErr('UNAUTHORIZED', 'Silakan masuk terlebih dahulu.', 401);
  if (s.role !== 'ADMIN') return jsonErr('FORBIDDEN', 'Tidak memiliki hak akses.', 403);

  const url = new URL(req.url);
  const roleParam = url.searchParams.get('role');
  const statusParam = url.searchParams.get('status');

  const where: any = {};
  if (roleParam && roleParam !== 'Semua') {
    where.reporter_role = roleParam.toUpperCase();
  }
  if (statusParam && statusParam !== 'Semua') {
    where.status = statusParam.toUpperCase();
  }

  const rawComplaints = await prisma.complaint.findMany({
    where,
    orderBy: { created_at: 'desc' },
    include: {
      reporter: { select: { full_name: true, role: true } },
      messages: {
        include: { author: { select: { full_name: true, role: true } } },
        orderBy: { created_at: 'asc' },
      },
    },
  });

  const complaints = rawComplaints.map((c) => ({
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
  }));

  return jsonOk({ complaints });
}

export async function POST(req: Request) {
  const s = await getSession();
  if (!s) return jsonErr('UNAUTHORIZED', 'Silakan masuk terlebih dahulu.', 401);
  try {
    const b = z
      .object({
        subject: z.string().min(3, { message: 'Subjek wajib diisi.' }),
        body: z.string().min(5, { message: 'Isi komplain minimal 5 karakter.' }),
        canteen_id: z.string().optional(),
        order_id: z.string().optional(),
      })
      .parse(await req.json());
    const c = await prisma.complaint.create({
      data: {
        reporter_id: s.uid,
        reporter_role: s.role,
        subject: b.subject,
        body: b.body,
        canteen_id: b.canteen_id,
        order_id: b.order_id,
      },
    });
    return jsonOk(c, 201);
  } catch (e: unknown) {
    if (e instanceof z.ZodError) return jsonErr('VALIDATION_ERROR', zodMsg(e), 400);
    return jsonErr('SERVER_ERROR', 'Terjadi kesalahan server.', 500);
  }
}
