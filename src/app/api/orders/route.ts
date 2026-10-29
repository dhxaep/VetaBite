import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { jsonOk, jsonErr, zodMsg } from '@/lib/api';
import { publishCanteen } from '@/lib/sse';

const S = z.object({
  canteen_id: z.string().min(1, { message: 'Kantin wajib dipilih.' }),
  items: z
    .array(
      z.object({
        menu_item_id: z.string(),
        qty: z.number().int().min(1, { message: 'Jumlah minimal 1.' }),
        note: z.string().optional(),
      })
    )
    .min(1, { message: 'Pilih minimal satu menu.' }),
  payment_method: z.enum(['QRIS', 'TUNAI']).default('QRIS'),
  payment_proof_url: z.string().min(1, { message: 'Bukti pembayaran wajib diunggah sebelum pesanan diproses.' }),
});

function today() {
  return new Date().toISOString().slice(0, 10);
}

export async function GET() {
  const s = await getSession();
  if (!s) return jsonErr('UNAUTHORIZED', 'Silakan masuk terlebih dahulu.', 401);
  const os = await prisma.order.findMany({
    where: { buyer_id: s.uid },
    orderBy: { ordered_at: 'desc' },
    include: {
      order_items: {
        include: {
          menu_item: {
            select: { photo_url: true },
          },
        },
      },
      canteen: {
        select: { id: true, name: true, banner_url: true },
      },
      buyer: {
        select: { full_name: true, username: true },
      },
    },
  });

  const mapped = os.map((o) => ({
    ...o,
    buyer_name: o.buyer?.full_name || o.buyer?.username || 'Mahasiswa',
    canteen_name: o.canteen?.name,
    canteen_banner: o.canteen?.banner_url,
    items: o.order_items.map((it) => ({
      ...it,
      photo_url: it.menu_item?.photo_url || o.canteen?.banner_url || null,
    })),
  }));

  return jsonOk({ orders: mapped });
}

export async function POST(req: Request) {
  try {
    const s = await getSession();
    if (!s) return jsonErr('UNAUTHORIZED', 'Silakan masuk terlebih dahulu.', 401);
    const b = S.parse(await req.json());
    if (!b.payment_proof_url)
      return jsonErr('PAYMENT_PROOF_REQUIRED', 'Bukti pembayaran wajib diunggah sebelum pesanan diproses.', 400);

    // Verifikasi: Cek apakah mahasiswa masih memiliki pesanan di kantin lain yang belum dibayar / belum selesai
    const unpaidOther = await prisma.order.findFirst({
      where: {
        buyer_id: s.uid,
        canteen_id: { not: b.canteen_id },
        order_status: { in: ['ANTRIAN', 'MASAK'] },
        payment_status: 'BELUM_DIBAYAR',
      },
      include: { canteen: { select: { name: true } } },
    });
    if (unpaidOther) {
      return jsonErr(
        'UNPAID_ORDER_EXISTS',
        `Anda masih memiliki pesanan di ${unpaidOther.canteen.name} yang belum dibayar. Harap selesaikan pembayaran di kantin tersebut terlebih dahulu sebelum memesan di kantin lain.`,
        400
      );
    }

    const can = await prisma.canteen.findUnique({ where: { id: b.canteen_id } });
    if (!can) return jsonErr('NOT_FOUND', 'Kantin tidak ditemukan.', 404);
    if (!can.is_open) return jsonErr('VALIDATION_ERROR', 'Kantin sedang tutup.', 400);
    if (
      await prisma.canteenBan.findUnique({
        where: { canteen_id_user_id: { canteen_id: b.canteen_id, user_id: s.uid } },
      })
    )
      return jsonErr('USER_BANNED_BY_CANTEEN', 'Akun Anda diblokir oleh kantin ini.', 403);

    const menus = await prisma.menuItem.findMany({ where: { id: { in: b.items.map((i) => i.menu_item_id) } } });
    for (const it of b.items) {
      const m = menus.find((x) => x.id === it.menu_item_id);
      if (!m || m.canteen_id !== b.canteen_id) return jsonErr('NOT_FOUND', 'Menu tidak ditemukan.', 404);
      if (!m.is_available) return jsonErr('ITEM_OUT_OF_STOCK', `Menu ${m.name} sedang habis.`, 400);
    }
    const total = b.items.reduce((a, it) => a + menus.find((x) => x.id === it.menu_item_id)!.price * it.qty, 0);
    const d = today();

    const o = await prisma.$transaction(async (tx) => {
      const c = await tx.queueCounter.upsert({
        where: { canteen_id_date: { canteen_id: b.canteen_id, date: d } },
        create: { canteen_id: b.canteen_id, date: d, last_number: 1 },
        update: { last_number: { increment: 1 } },
      });
      const qn = `${can.queue_prefix}-${String(c.last_number).padStart(3, '0')}`;
      return tx.order.create({
        data: {
          canteen_id: b.canteen_id,
          buyer_id: s.uid,
          queue_number: qn,
          total_price: total,
          payment_method: b.payment_method,
          payment_proof_url: b.payment_proof_url,
          order_items: {
            create: b.items.map((it) => {
              const m = menus.find((x) => x.id === it.menu_item_id)!;
              return {
                menu_item_id: m.id,
                name_snapshot: m.name,
                price_snapshot: m.price,
                qty: it.qty,
                note: it.note,
              };
            }),
          },
        },
        include: { order_items: true },
      });
    });

    const buyer = await prisma.user.findUnique({ where: { id: s.uid }, select: { full_name: true } });
    publishCanteen(b.canteen_id, {
      event: 'new_order',
      data: {
        order_id: o.id,
        queue_number: o.queue_number,
        buyer_name: buyer?.full_name ?? 'Mahasiswa',
        total_price: o.total_price,
        items_count: o.order_items.length,
        ordered_at: o.ordered_at,
      },
    });

    return jsonOk(
      {
        order_id: o.id,
        queue_number: o.queue_number,
        order_status: o.order_status,
        payment_status: o.payment_status,
        total_price: o.total_price,
      },
      201
    );
  } catch (e: unknown) {
    if (e instanceof z.ZodError)
      return jsonErr(
        e.issues?.[0]?.message?.includes('Bukti') ? 'PAYMENT_PROOF_REQUIRED' : 'VALIDATION_ERROR',
        zodMsg(e),
        400
      );
    return jsonErr('SERVER_ERROR', 'Terjadi kesalahan server.', 500);
  }
}
