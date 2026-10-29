import { prisma } from '@/lib/prisma';
import { jsonOk, jsonErr } from '@/lib/api';

export async function GET(req: Request) {
  try {
    const u = new URL(req.url);
    const q = (u.searchParams.get('q') ?? '').trim().toLowerCase();
    const cat = (u.searchParams.get('category') ?? '').trim().toLowerCase();
    const max = u.searchParams.get('max_price');
    const min = u.searchParams.get('min_price');

    // Fetch active canteens with menu items and active orders
    const cs = await prisma.canteen.findMany({
      where: {
        owner: { status: 'ACTIVE' },
      },
      include: {
        menu_items: true,
        orders: { where: { order_status: { in: ['ANTRIAN', 'MASAK'] } } },
      },
    });

    if (q) {
      // Find matching menu items across all active canteens
      const menuHits: any[] = [];
      const canteenHits: any[] = [];

      for (const c of cs) {
        const cMatches =
          c.name.toLowerCase().includes(q) ||
          (c.description && c.description.toLowerCase().includes(q));

        if (cMatches) {
          canteenHits.push({
            id: c.id,
            canteen_id: c.id,
            name: c.name,
            description: c.description || 'Kantin Mitra Kampus UPNVJ',
            price: c.menu_items[0]?.price || 15000,
            banner_url: c.banner_url,
            photo_url: c.banner_url,
            is_open: c.is_open,
            queue_prefix: c.queue_prefix,
            estimated_wait_minutes: c.orders.length * 5 || 5,
          });
        }

        for (const m of c.menu_items) {
          const mMatches =
            m.name.toLowerCase().includes(q) ||
            (m.description && m.description.toLowerCase().includes(q)) ||
            m.category.toLowerCase().includes(q);

          if (mMatches) {
            menuHits.push({
              id: m.id,
              menu_id: m.id,
              canteen_id: c.id,
              name: m.name,
              description: `${c.name} • ${m.description || m.category}`,
              price: m.price,
              banner_url: m.photo_url || c.banner_url,
              photo_url: m.photo_url || c.banner_url,
              is_open: c.is_open && m.is_available,
              queue_prefix: c.queue_prefix,
              estimated_wait_minutes: 8,
            });
          }
        }
      }

      // If user searched for menu, return menu hits first, then canteen hits
      const results = [...menuHits, ...canteenHits];
      return jsonOk(results);
    }

    let out = cs.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description || 'Kantin resmi kampus UPN Veteran Jakarta.',
      banner_url: c.banner_url,
      is_open: c.is_open,
      queue_prefix: c.queue_prefix,
      estimated_wait_minutes: c.orders.length * 5 || 5,
    }));

    if (cat && cat !== 'semua') {
      out = out.filter((c) => {
        const origin = cs.find((x) => x.id === c.id);
        return (
          c.description.toLowerCase().includes(cat) ||
          origin?.menu_items.some((m) => m.category.toLowerCase().includes(cat))
        );
      });
    }

    if (min) out = out.filter((c) => cs.find((x) => x.id === c.id)?.menu_items.some((m) => m.price >= Number(min)));
    if (max) out = out.filter((c) => cs.find((x) => x.id === c.id)?.menu_items.some((m) => m.price <= Number(max)));

    return jsonOk(out);
  } catch (err) {
    console.error('Error in /api/canteens GET:', err);
    return jsonErr('SERVER_ERROR', 'Terjadi kesalahan server.', 500);
  }
}
