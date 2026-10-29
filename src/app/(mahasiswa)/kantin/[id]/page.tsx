"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Heart, Clock, Plus, Minus, ShoppingBag, MapPin, Flame, ShieldAlert, CreditCard } from "lucide-react";
import { api } from "@/lib/api";
import { loadCart, saveCart, cartTotal, cartCount, Cart } from "@/lib/cart";
import { formatRupiah } from "@/lib/rupiah";
import { SkeletonList, EmptyState, ErrorState } from "@/components/shared/States";

type Menu = {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  category: string;
  photo_url?: string | null;
  is_bestseller?: boolean;
  is_available?: boolean;
};

type Detail = {
  canteen: Record<string, string | boolean | number | undefined>;
  categories: string[];
  menu_items: Menu[];
  current_queue_count: number;
  estimated_minutes: number;
};

export default function CanteenDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const r = useRouter();
  const [d, setD] = useState<Detail | null>(null);
  const [e, setE] = useState("");
  const [cat, setCat] = useState("Semua");
  const [fav, setFav] = useState(false);
  const [cart, setCart] = useState<Cart | null>(null);
  const [unpaidOther, setUnpaidOther] = useState<{ canteen_name: string; order_id: string } | null>(null);
  const [payAlert, setPayAlert] = useState<{ canteen_name: string; message: string; action_url: string; button_label: string } | null>(null);

  async function load() {
    setE("");
    setD(null);
    try {
      setD(await api<Detail>(`/api/canteens/${id}`));
      setCart(loadCart());
      api<{ orders: Array<{ canteen_id?: string; canteen_name?: string; order_status?: string; payment_status?: string; id: string }> }>("/api/orders")
        .then((res) => {
          const list = res?.orders || [];
          const unpaid = list.find(
            (o) =>
              o.canteen_id &&
              o.canteen_id !== id &&
              ["ANTRIAN", "MASAK"].includes(o.order_status || "") &&
              o.payment_status === "BELUM_DIBAYAR"
          );
          if (unpaid) {
            setUnpaidOther({
              canteen_name: unpaid.canteen_name || "Kantin Sebelumnya",
              order_id: unpaid.id,
            });
          }
        })
        .catch(() => {});
    } catch (err: unknown) {
      setE(err instanceof Error ? err.message : String(err));
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  function add(m: Menu) {
    if (unpaidOther) {
      setPayAlert({
        canteen_name: unpaidOther.canteen_name,
        message: `Anda masih memiliki pesanan aktif di ${unpaidOther.canteen_name} yang belum dibayar. Harap bayar pesanan tersebut terlebih dahulu sebelum memesan di kantin lain.`,
        action_url: `/pesanan/${unpaidOther.order_id}`,
        button_label: "Lihat & Bayar Pesanan",
      });
      return;
    }

    const cur = loadCart();
    if (cur && cur.canteen_id !== id && cur.items && cur.items.length > 0) {
      setPayAlert({
        canteen_name: cur.canteen_name,
        message: `Keranjang Anda masih berisi menu dari ${cur.canteen_name}. Harap selesaikan dan bayar pesanan di kantin tersebut terlebih dahulu sebelum beralih ke kantin lain.`,
        action_url: "/keranjang",
        button_label: "Buka Keranjang & Bayar Sekarang",
      });
      return;
    }

    const c = d?.canteen || {};
    let activeCart: Cart = cur || {
      canteen_id: id,
      canteen_name: String(c.name || "Kantin"),
      qris_image_url: c.qris_image_url ? String(c.qris_image_url) : undefined,
      items: [],
    };
    if (activeCart.canteen_id !== id) {
      activeCart = {
        canteen_id: id,
        canteen_name: String(c.name || "Kantin"),
        qris_image_url: c.qris_image_url ? String(c.qris_image_url) : undefined,
        items: [],
      };
    }
    const f = activeCart.items.find((i) => i.menu_item_id === m.id);
    if (f) f.qty++;
    else activeCart.items.push({ menu_item_id: m.id, name: m.name, price: m.price, qty: 1, photo_url: m.photo_url ?? undefined });
    saveCart(activeCart);
    setCart({ ...activeCart });
  }

  function dec(menuId: string) {
    const cur = loadCart();
    if (!cur) return;
    cur.items = cur.items
      .map((i) => (i.menu_item_id === menuId ? { ...i, qty: i.qty - 1 } : i))
      .filter((i) => i.qty > 0);
    saveCart(cur.items.length ? cur : null);
    setCart(cur.items.length ? { ...cur } : null);
  }

  function qty(menuId: string) {
    return cart?.items.find((i) => i.menu_item_id === menuId)?.qty || 0;
  }

  if (!d && !e) {
    return (
      <div className="p-4">
        <SkeletonList n={4} />
      </div>
    );
  }

  if (e) return <ErrorState msg={e} onRetry={load} />;

  const c = d ? d.canteen : {};
  const cats: string[] = d?.categories || ["Semua"];
  const menus: Menu[] = (d?.menu_items || []).filter((m: Menu) => cat === "Semua" || m.category === cat);

  return (
    <div className="flex flex-col pb-24">
      {/* Stall Banner Hero Section */}
      <header className="relative w-full h-[220px] overflow-hidden bg-surface-container">
        <img
          alt={String(c.name ?? "Kantin")}
          className="w-full h-full object-cover scale-105"
          src={String(c.banner_url ?? c.banner ?? "https://images.unsplash.com/photo-1546069901-ba9599a7e63c")}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/40" />

        {/* Top Action Floating Icons */}
        <div className="absolute top-4 left-0 right-0 px-space-lg flex items-center justify-between z-20">
          <button
            aria-label="Kembali"
            onClick={() => r.back()}
            className="w-10 h-10 rounded-full glass-surface flex items-center justify-center text-on-surface active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-2">
            <button
              aria-label="Favorit"
              onClick={() => setFav(!fav)}
              className="w-10 h-10 rounded-full glass-surface flex items-center justify-center text-primary active:scale-95 transition-transform"
            >
              <Heart className={`w-5 h-5 ${fav ? "fill-red-500 text-red-500" : ""}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Info Card Floating over Hero */}
      <div className="px-space-lg -mt-10 relative z-20">
        <div className="glass-surface rounded-[22px] p-4 flex flex-col gap-2.5 shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {c.queue_prefix && (
                  <span className="px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-extrabold uppercase tracking-wide">
                    LOKET #{String(c.queue_prefix)}
                  </span>
                )}
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
                  {c.is_open === false ? "Tutup" : "Buka • Siap Saji"}
                </span>
              </div>
              <h1 className="font-headline-lg text-headline-lg font-extrabold text-on-surface mt-1.5">
                {String(c.name)}
              </h1>
            </div>
            <div className="flex flex-col items-end flex-shrink-0">
              <span className="px-2.5 py-1 rounded-full bg-primary-fixed/60 text-primary text-[11px] font-extrabold shadow-sm">
                UPNVJ
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-text-muted font-body-sm text-body-sm pt-1 border-t border-border-subtle">
            <MapPin className="w-3.5 h-3.5 text-primary flex-shrink-0" />
            <span className="truncate">{String(c.description ?? "Kantin Barito, Kampus Pondok Labu")}</span>
          </div>

          <div className="flex items-center justify-between text-text-muted font-body-sm text-body-sm">
            <div className="flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>Operasional: 08:00 - 16:30 WIB</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
              Kampus UPNVJ
            </span>
          </div>
        </div>
      </div>

      {/* Real-time Queue Tracking Panel */}
      <section aria-label="Status Antrean" className="px-space-lg mt-3">
        <div className="glass-surface rounded-[20px] p-3.5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <p className="font-label-micro text-label-micro text-text-muted uppercase">Status Dapur Kantin</p>
                <h2 className="font-headline-sm text-headline-sm text-on-surface font-extrabold">
                  Estimasi: {d?.estimated_minutes ?? 10}–{(d?.estimated_minutes ?? 10) + 2} Menit
                </h2>
              </div>
            </div>
            <span className="px-2 py-1 rounded-full bg-white/70 border border-border-specular font-label-sm text-label-sm text-primary font-bold">
              {d?.current_queue_count ?? 0} Antrean Depanmu
            </span>
          </div>

          {/* 3-Step Real-time Process Bar */}
          <div className="grid grid-cols-3 gap-2 relative mb-1">
            <div className="flex flex-col items-center">
              <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-sm">
                1
              </div>
              <span className="font-label-micro text-label-micro text-emerald-700 mt-1 font-bold">1. Antrean</span>
            </div>
            <div className="flex flex-col items-center relative">
              <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center shadow-md relative">
                <span className="absolute w-full h-full rounded-full bg-primary/50 animate-ping" />
                <Flame className="w-4 h-4 relative z-10" />
              </div>
              <span className="font-label-micro text-label-micro text-primary mt-1 font-extrabold">2. Masak</span>
            </div>
            <div className="flex flex-col items-center opacity-60">
              <div className="w-7 h-7 rounded-full bg-white/80 border border-border-specular text-text-muted flex items-center justify-center">
                <ShoppingBag className="w-3.5 h-3.5" />
              </div>
              <span className="font-label-micro text-label-micro text-text-muted mt-1 font-medium">3. Siap Ambil</span>
            </div>
          </div>
        </div>
      </section>

      {/* Sticky Horizontal Category Tabs */}
      <div className="sticky top-0 z-30 pt-3 pb-2 px-space-lg bg-background-base/95 backdrop-blur-md">
        <nav aria-label="Kategori Menu" className="flex space-x-2 overflow-x-auto hide-scrollbar py-1">
          {cats.map((k) => (
            <button
              key={k}
              onClick={() => setCat(k)}
              className={`px-3.5 py-1.5 rounded-full font-label-md text-label-md whitespace-nowrap transition-all ${
                cat === k
                  ? "pill-active-gradient text-white shadow-sm"
                  : "bg-white/70 border border-border-specular text-text-muted hover:text-on-surface"
              }`}
            >
              {k}
              {k === "Semua" ? ` (${d?.menu_items.length ?? 0})` : ""}
            </button>
          ))}
        </nav>
      </div>

      {/* Menu Catalog Section */}
      <section aria-label="Daftar Menu" className="px-space-lg mt-2 flex flex-col space-y-3">
        {menus.length === 0 && (
          <EmptyState title="Menu kosong" desc="Loket ini belum menambah menu pada kategori ini." />
        )}
        {menus.map((m: Menu) => (
          <article
            key={m.id}
            className="glass-surface rounded-[20px] p-3 flex space-x-3 relative overflow-hidden hover-card-lift transition-smooth"
          >
            <div className="relative w-[88px] h-[88px] rounded-[14px] overflow-hidden flex-shrink-0 bg-surface-container">
              <img
                alt={m.name}
                className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ease-out ${
                  m.is_available === false ? "grayscale" : ""
                }`}
                src={
                  m.photo_url ||
                  (m.category === "Minuman"
                    ? "https://lh3.googleusercontent.com/aida-public/AB6AXuDE3roTy4e-Ia2y-1-RBpFR9bMGp6wnGQ_VBGC87apMJwkKQMjcqIUlRqjWCZF-OV5C7-4aj2aIvNPLWGwDBa2sh1mAq-XgLESAlc7hogRfvH19UHK6fKo3pOLFCTHmyWqf9syNZcBWc4EHyPD8TAqFSD7lMyXnvElmWOKfwWbbwG_miX21SPPJp4ciqRfwjSXrObkVM8vncvrTPnglr6RPnQKtUy1h5VbxW4w_naTg"
                    : m.category === "Camilan"
                    ? "https://lh3.googleusercontent.com/aida-public/AB6AXuCD-A-r10q-wEpuP4Hh_4nTQbValSaxtG7wVQY8HXjX1DXkQ7IMxllH0glCPClnw2GRus8bu8c1ik9WSpu-CVMlokdrodkLV-E-AvByMFd4oALb9-FLO1mf2ZiC3DJuHh76CA8U_ZT6LwAuN00_t9gndfNZLp3y8D7NXDxUPWdTDjay04IYzL_mmCNV_ANcKd5ECvfsKCOG48ROin1BF67QBWGpNGAXNNQNVyEhiCBl"
                    : "https://lh3.googleusercontent.com/aida-public/AB6AXuDONUCpglL6jc-58eEFB9jmnxQIbojv28_kmIw_3_cOique7XHmwaWM2_GidCmfRafjTuZJaorhpiVxsItRpSbieUWQT8jR0crmX2VGi-m2rj1-150lHILHHQBL8twqncJOSKjfIhXCKvgpqHIvzCvs6sutxYWCrwTJ2_LKQlZFkQJokJfZVsJJX0fM0GO-EHibCrRrHOrqJVecR6roeobFxvqyhFeJWm4-LDX1oyFb")
                }
              />
              {m.is_bestseller && (
                <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded-full bg-amber-500/90 text-white font-label-micro text-label-micro font-extrabold flex items-center space-x-0.5 shadow-sm">
                  <Flame className="w-2.5 h-2.5" />
                  <span>BEST</span>
                </div>
              )}
              {m.is_available === false && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <span className="text-white text-[10px] px-2 py-0.5 rounded-full bg-red-600 font-bold uppercase tracking-wider">
                    Habis
                  </span>
                </div>
              )}
            </div>

            <div className="flex-1 flex flex-col justify-between min-w-0">
              <div>
                <div className="flex items-start justify-between gap-1">
                  <h3
                    className={`font-headline-sm text-headline-sm text-on-surface font-extrabold line-clamp-1 ${
                      m.is_available === false ? "text-text-muted" : ""
                    }`}
                  >
                    {m.name}
                  </h3>
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      m.is_available === false
                        ? "bg-red-50 text-red-600 border-red-200"
                        : "bg-emerald-50 text-emerald-700 border-emerald-200"
                    }`}
                  >
                    {m.is_available === false ? "Habis" : "Tersedia"}
                  </span>
                </div>
                <p className="font-body-sm text-body-sm text-text-muted line-clamp-2 mt-0.5">{m.description}</p>
              </div>

              <div className="flex items-center justify-between mt-2 pt-1 border-t border-border-subtle">
                <span
                  className={`font-label-lg text-label-lg font-extrabold ${
                    m.is_available === false ? "text-text-muted" : "text-primary"
                  }`}
                >
                  {formatRupiah(m.price)}
                </span>

                {m.is_available === false ? (
                  <button
                    disabled
                    className="px-3 py-1.5 rounded-full bg-surface-dim text-text-muted text-xs font-semibold cursor-not-allowed border border-border-subtle shrink-0"
                  >
                    Habis Terjual
                  </button>
                ) : qty(m.id) > 0 ? (
                  <div className="flex items-center gap-1.5 bg-primary/10 rounded-full p-1 border border-primary/20 shrink-0">
                    <button
                      aria-label="Kurangi"
                      onClick={() => dec(m.id)}
                      className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-primary font-bold shadow-sm active:scale-90"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-bold text-primary px-1">{qty(m.id)}</span>
                    <button
                      aria-label="Tambah"
                      onClick={() => add(m)}
                      className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center shadow-sm active:scale-90"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => add(m)}
                    className="px-3 py-1.5 rounded-full cta-gradient text-white text-xs font-bold flex items-center gap-1 active:scale-95 shadow-sm shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Pick-Up</span>
                  </button>
                )}
              </div>
            </div>
          </article>
        ))}
      </section>

      {/* Floating Cart Indicator */}
      {cart && cartCount(cart) > 0 && (
        <aside className="fixed bottom-20 left-0 right-0 z-40 max-w-[430px] mx-auto px-space-lg pointer-events-none">
          <div className="pointer-events-auto p-2.5 rounded-2xl liquid-glass flex items-center justify-between shadow-xl border border-border-specular animate-bounce duration-1000">
            <div className="flex items-center gap-2.5">
              <div className="relative w-9 h-9 rounded-xl cta-gradient flex items-center justify-center text-white shadow-sm flex-shrink-0">
                <ShoppingBag className="w-4 h-4" />
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-on-surface text-white text-[9px] font-extrabold flex items-center justify-center ring-1 ring-white">
                  {cartCount(cart)}
                </span>
              </div>
              <div>
                <span className="font-label-sm text-label-sm font-bold text-on-surface">
                  {cartCount(cart)} Menu Dipilih
                </span>
                <p className="font-headline-sm text-headline-sm font-extrabold text-primary">
                  Total {formatRupiah(cartTotal(cart))}
                </p>
              </div>
            </div>
            <Link
              href="/keranjang"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full cta-gradient text-white text-xs font-bold shadow-md hover:brightness-105 active:scale-95 transition-all"
            >
              <span>Lihat Keranjang</span>
            </Link>
          </div>
        </aside>
      )}

      {/* Modal Verifikasi Pembayaran Antar-Kantin */}
      {payAlert && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="liquid-glass rounded-3xl w-full max-w-[360px] p-5 space-y-4 border-2 border-primary/30 modal-smooth-enter shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1.5">
              <h3 className="font-headline-sm text-headline-sm font-extrabold text-on-surface">
                Verifikasi Pembayaran Kantin
              </h3>
              <p className="font-body-sm text-body-sm text-text-muted leading-relaxed">
                {payAlert.message}
              </p>
            </div>
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => r.push(payAlert.action_url)}
                className="w-full py-3 rounded-full cta-gradient text-white text-xs font-bold shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <CreditCard className="w-4 h-4" />
                <span>{payAlert.button_label}</span>
              </button>
              <button
                type="button"
                onClick={() => setPayAlert(null)}
                className="w-full py-2.5 rounded-full bg-surface-container-high text-on-surface text-xs font-bold active:scale-95 transition-all"
              >
                Kembali
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
