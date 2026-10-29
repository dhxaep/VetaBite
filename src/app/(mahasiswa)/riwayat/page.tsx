"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Clock3, Check, RotateCcw, CircleHelp, ArrowRight, BellRing } from "lucide-react";
import { api } from "@/lib/api";
import { saveCart } from "@/lib/cart";
import { formatRupiah } from "@/lib/rupiah";
import { SkeletonList, EmptyState, ErrorState } from "@/components/shared/States";

type OrderItem = {
  menu_item_id?: string;
  menuItemId?: string;
  name?: string;
  name_snapshot?: string;
  price?: number;
  price_snapshot?: number;
  qty: number;
  photo_url?: string | null;
};

type Order = {
  id: string;
  canteen_id?: string;
  canteenId?: string;
  canteen_name?: string;
  buyer_name?: string;
  order_status?: string;
  status?: string;
  queue_number?: string;
  created_at?: string;
  total_price?: number;
  totalPrice?: number;
  canteen?: { name?: string };
  items?: OrderItem[];
  order_items?: OrderItem[];
};

const TABS = ["Semua", "Sedang Berjalan", "Selesai", "Dibatalkan"];

function grp(s: string) {
  if (["ANTRIAN", "MASAK", "SIAP_AMBIL"].includes(s)) return "Sedang Berjalan";
  if (s === "PICKED_UP" || s === "SELESAI") return "Selesai";
  return "Dibatalkan";
}

function label(s: string) {
  return s === "ANTRIAN"
    ? "Sedang Dimasak"
    : s === "MASAK"
    ? "Sedang Dimasak"
    : s === "SIAP_AMBIL"
    ? "Siap Diambil"
    : s === "PICKED_UP" || s === "SELESAI"
    ? "Selesai Diambil"
    : "Dibatalkan";
}

export default function OrderHistoryPage() {
  const [os, setOs] = useState<Order[] | null>(null);
  const [e, setE] = useState("");
  const [t, setT] = useState("Semua");

  async function load(showSkeleton = true) {
    if (showSkeleton) {
      setE("");
      setOs(null);
    }
    try {
      const d = await api<{ orders: Order[] } | Order[]>("/api/orders");
      setOs(Array.isArray(d) ? d : d.orders || []);
    } catch (err: unknown) {
      if (showSkeleton) {
        setE(err instanceof Error ? err.message : String(err));
      }
    }
  }

  useEffect(() => {
    load(true);

    // Auto reload berkala setiap 4 detik (Auto-sync)
    const timer = setInterval(() => {
      load(false);
    }, 4000);

    const onVisible = () => {
      if (document.visibilityState === "visible") load(false);
    };
    window.addEventListener("focus", onVisible);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", onVisible);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  function reorder(o: Order) {
    const items = (o.items || o.order_items || [])
      .filter((it: OrderItem) => !!(it.menu_item_id || it.menuItemId))
      .map((it: OrderItem) => ({
        menu_item_id: String(it.menu_item_id || it.menuItemId || ""),
        name: String(it.name || it.name_snapshot || "Menu"),
        price: Number(it.price || it.price_snapshot || 0),
        qty: it.qty,
        photo_url: it.photo_url ?? undefined,
      }));
    saveCart({
      canteen_id: String(o.canteen_id || o.canteenId || ""),
      canteen_name: String(o.canteen_name || o.canteen?.name || "Kantin"),
      items,
    });
    location.href = "/keranjang";
  }

  if (!os && !e) return <SkeletonList />;
  if (e) return <ErrorState msg={e} onRetry={() => load(true)} />;

  const list = (os || []).filter((o: Order) => t === "Semua" || grp(String(o.order_status || o.status || "")) === t);
  const activeCount = (os || []).filter(
    (o) => grp(String(o.order_status || o.status || "")) === "Sedang Berjalan"
  ).length;

  const readyOrder = (os || []).find(
    (o) => (o.order_status || o.status) === "SIAP_AMBIL"
  );

  return (
    <div className="flex flex-col pb-16 px-space-lg">
      {/* Banner Pesanan Siap Ambil jika ada */}
      {readyOrder && (
        <div className="mt-2 liquid-glass rounded-2xl p-3 border-2 border-danger bg-red-500/20 shadow-lg flex items-center justify-between gap-3 animate-pulse">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-9 h-9 rounded-full bg-danger text-white flex items-center justify-center shrink-0">
              <BellRing className="w-4 h-4 animate-bounce" />
            </span>
            <div className="min-w-0">
              <h4 className="text-xs font-extrabold text-on-surface truncate">
                Pesanan #{readyOrder.queue_number || "A-001"} Siap Diambil!
              </h4>
              <p className="text-[10px] text-text-muted leading-tight">
                Loket {readyOrder.canteen?.name || readyOrder.canteen_name || "Kantin"}
              </p>
            </div>
          </div>
          <Link
            href={`/pesanan/${readyOrder.id}`}
            className="px-3 py-1.5 rounded-full bg-danger text-white text-xs font-bold shrink-0 shadow-sm active:scale-95"
          >
            Lihat Pesanan
          </Link>
        </div>
      )}
      {/* Top Header with Tab Switcher */}
      <header className="sticky top-0 z-40 -mx-space-lg px-space-lg pt-4 pb-3 bg-surface-glass-alt backdrop-blur-xl border-b border-border-specular shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="font-headline-md text-headline-md font-extrabold text-on-surface tracking-tight">
              Riwayat Pemesanan
            </h1>
            <p className="font-body-sm text-body-sm text-text-muted">
              {activeCount > 0 ? `${activeCount} pesanan aktif` : "Semua transaksi kantin UPNVJ"}
            </p>
          </div>
        </div>

        {/* Tab Pills */}
        <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar py-1">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setT(tab)}
              className={`px-3.5 py-1.5 rounded-full font-label-md text-label-md whitespace-nowrap transition-all ${
                t === tab ? "liquid-lens-active text-white shadow-sm" : "liquid-lens text-text-muted hover:text-on-surface"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </header>

      {/* Main Order List */}
      <main className="pt-4 space-y-3.5">
        {list.length === 0 && (
          <EmptyState
            title="Belum ada pesanan"
            desc="Riwayat transaksimu akan muncul di sini setelah kamu melakukan pemesanan."
          />
        )}

        {list.map((o: Order) => {
          const s = String(o.order_status || o.status || "");
          const g = grp(s);
          const items = o.items || o.order_items || [];
          const first = items[0];
          const total = Number(o.total_price || o.totalPrice || 0);

          return (
            <article key={o.id} className="liquid-lens rounded-[20px] p-4 space-y-3 relative overflow-hidden shadow-sm">
              <div className="flex items-start justify-between border-b border-border-subtle pb-2.5">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="bg-primary/10 text-primary font-label-micro text-label-micro px-2 py-0.5 rounded-full font-extrabold border border-primary/20">
                      LOKET
                    </span>
                    <span className="font-label-md text-label-md font-extrabold text-on-surface">
                      #{o.queue_number || "A-001"}
                    </span>
                  </div>
                  <h3 className="font-headline-sm text-headline-sm font-extrabold text-on-surface tracking-tight mt-0.5">
                    {o.canteen_name || o.canteen?.name || "Kantin UPNVJ"}
                  </h3>
                  <p className="font-body-sm text-body-sm text-text-muted flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-on-surface">Pemesan: {o.buyer_name || "Mahasiswa"}</span>
                    <span>•</span>
                    <Clock3 className="w-3.5 h-3.5" />
                    <span>
                      {o.created_at
                        ? new Date(String(o.created_at)).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "Hari ini"}
                    </span>
                  </p>
                </div>

                <div className="flex flex-col items-end">
                  <div
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-full shadow-xs font-label-micro text-label-micro font-bold border ${
                      g === "Selesai"
                        ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-800"
                        : g === "Sedang Berjalan"
                        ? "bg-amber-500/15 border-amber-500/30 text-amber-800"
                        : "bg-surface-container text-text-muted border-border-subtle"
                    }`}
                  >
                    {g === "Selesai" ? <Check className="w-3 h-3" /> : <Clock3 className="w-3 h-3" />}
                    <span>{label(s)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <img
                  src={
                    first?.photo_url ||
                    (o as { canteen_banner?: string }).canteen_banner ||
                    "https://lh3.googleusercontent.com/aida-public/AB6AXuDONUCpglL6jc-58eEFB9jmnxQIbojv28_kmIw_3_cOique7XHmwaWM2_GidCmfRafjTuZJaorhpiVxsItRpSbieUWQT8jR0crmX2VGi-m2rj1-150lHILHHQBL8twqncJOSKjfIhXCKvgpqHIvzCvs6sutxYWCrwTJ2_LKQlZFkQJokJfZVsJJX0fM0GO-EHibCrRrHOrqJVecR6roeobFxvqyhFeJWm4-LDX1oyFb"
                  }
                  alt={first?.name || first?.name_snapshot || "Menu"}
                  className="w-16 h-16 rounded-[14px] object-cover border border-border-specular shadow-sm flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-body-md text-body-md font-semibold text-on-surface truncate">
                    {items.map((it: OrderItem) => `${it.qty}x ${it.name || it.name_snapshot}`).join(", ") || "Pesanan"}
                  </p>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="font-label-micro text-label-micro text-text-muted">Total Pembayaran</span>
                    <span className="font-label-lg text-label-lg font-extrabold text-primary">
                      {formatRupiah(total)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border-subtle gap-2">
                {g === "Sedang Berjalan" ? (
                  <Link
                    href={`/pesanan/${o.id}`}
                    className="liquid-btn-primary px-4 py-2 rounded-full text-white font-label-md text-label-md font-extrabold flex items-center justify-center gap-1.5 w-full shadow-sm"
                  >
                    <span>Lacak Status Antrean Live</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <button
                    onClick={() => reorder(o)}
                    className="liquid-btn-secondary px-4 py-2 rounded-full font-label-md text-label-md font-bold text-on-surface flex items-center justify-center gap-1.5 w-full hover:bg-white transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-primary" />
                    <span>Pesan Lagi Menu Ini</span>
                  </button>
                )}
              </div>
            </article>
          );
        })}

        <div className="p-3.5 rounded-[16px] liquid-lens flex items-center gap-3 text-text-muted">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary">
            <CircleHelp className="w-4 h-4" />
          </div>
          <p className="font-body-sm text-body-sm leading-snug">
            Tunjukkan nomor antrean transaksi di counter loket untuk pengambilan makanan langsung tanpa antre.
          </p>
        </div>
      </main>
    </div>
  );
}
