import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ownerCanteen } from '@/lib/owner';
import { jsonOk, jsonErr } from '@/lib/api';

export async function GET(req: Request) {
  const s = await getSession();
  if (!s) return jsonErr('UNAUTHORIZED', 'Silakan masuk terlebih dahulu.', 401);
  if (s.role !== 'PENJUAL') return jsonErr('FORBIDDEN', 'Tidak memiliki hak akses.', 403);

  const c = await ownerCanteen(s.uid);
  if (!c) return jsonErr('NOT_FOUND', 'Kantin tidak ditemukan.', 404);

  const p = new URL(req.url).searchParams.get('period') ?? 'week';
  const days = p === 'month' ? 30 : p === 'day' ? 1 : 7;
  const since = new Date(Date.now() - days * 864e5);

  const os = await prisma.order.findMany({
    where: {
      canteen_id: c.id,
      ordered_at: { gte: since },
      order_status: { not: 'DIBATALKAN' },
    },
    include: { order_items: true },
    orderBy: { ordered_at: 'asc' },
  });

  const revenue = os.reduce((a, o) => a + o.total_price, 0);
  const portions = os.flatMap((o) => o.order_items).reduce((a, i) => a + i.qty, 0);

  // Top 5 menus
  const byMenu: Record<string, { name: string; qty: number; omzet: number }> = {};
  os.flatMap((o) => o.order_items).forEach((i) => {
    const k = i.menu_item_id ?? i.name_snapshot;
    byMenu[k] = byMenu[k] ?? { name: i.name_snapshot, qty: 0, omzet: 0 };
    byMenu[k].qty += i.qty;
    byMenu[k].omzet += (i.price_snapshot || 0) * i.qty;
  });
  const top5 = Object.values(byMenu)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  // Chart data generation based on period
  let chart: { label: string; omzet: number }[] = [];

  if (p === 'day') {
    const slots = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00'];
    chart = slots.map((lbl, idx) => {
      const startH = 8 + idx * 2;
      const endH = startH + 2;
      const slotSum = os
        .filter((o) => {
          const h = o.ordered_at.getHours();
          return h >= startH && h < endH;
        })
        .reduce((sum, o) => sum + o.total_price, 0);
      return { label: lbl, omzet: slotSum };
    });
  } else if (p === 'month') {
    const weeks = ['Minggu 1', 'Minggu 2', 'Minggu 3', 'Minggu 4'];
    chart = weeks.map((lbl, idx) => {
      const wStart = new Date(Date.now() - (4 - idx) * 7 * 864e5);
      const wEnd = new Date(Date.now() - (3 - idx) * 7 * 864e5);
      const wSum = os
        .filter((o) => o.ordered_at >= wStart && o.ordered_at < wEnd)
        .reduce((sum, o) => sum + o.total_price, 0);
      return { label: lbl, omzet: wSum };
    });
  } else {
    // 7 Days
    const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    chart = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(Date.now() - (6 - i) * 864e5);
      const dayDate = d.toISOString().slice(0, 10);
      const daySum = os
        .filter((o) => o.ordered_at.toISOString().slice(0, 10) === dayDate)
        .reduce((sum, o) => sum + o.total_price, 0);
      return { label: dayNames[d.getDay()], omzet: daySum };
    });
  }

  return jsonOk({
    period: p,
    omzet: revenue,
    porsi: portions,
    avg_rating: 4.8,
    revenue,
    portions,
    orders: os.length,
    chart,
    top5,
    top_menus: top5,
  });
}

