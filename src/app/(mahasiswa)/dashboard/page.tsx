"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Heart, Clock, Plus, History, SlidersHorizontal, Flame, ShoppingBag, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";
import { loadCart, cartCount, cartTotal } from "@/lib/cart";
import { formatRupiah } from "@/lib/rupiah";
import { SkeletonList, EmptyState, ErrorState } from "@/components/shared/States";

type C = {
  id: string;
  name: string;
  description: string;
  banner_url?: string;
  is_open: boolean;
  queue_prefix?: string;
  estimated_wait_minutes?: number;
};

export default function Dash() {
  const [cs, setCs] = useState<C[] | null>(null);
  const [e, setE] = useState("");
  const [cat, setCat] = useState("Semua");
  const [sort, setSort] = useState("Termurah - Termahal");
  const [n, setN] = useState(0);
  const [total, setTotal] = useState(0);

  async function load() {
    setE("");
    setCs(null);
    try {
      setCs(await api<C[]>("/api/canteens"));
      const cart = loadCart();
      setN(cartCount(cart));
      setTotal(cartTotal(cart));
    } catch (err: unknown) {
      setE(err instanceof Error ? err.message : "Gagal memuat");
    }
  }

  useEffect(() => {
    load();
  }, []);

  const cats = ["Semua", "Makanan", "Minuman", "Camilan"];
  const list = (cs || []).filter(
    (c) => cat === "Semua" || (c.description || "").toLowerCase().includes(cat.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-4 px-space-lg">
      {/* 1. STICKY LIQUID GLASS NAVBAR */}
      <header className="sticky top-0 z-40 -mx-space-lg px-space-lg pt-3 pb-2.5 bg-surface-glass-alt backdrop-blur-xl border-b border-border-specular shadow-sm">
        <div className="flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <div className="w-8 h-8 rounded-full cta-gradient flex items-center justify-center text-white shadow-sm">
              <Flame className="w-4 h-4" />
            </div>
            <span className="font-headline-md text-headline-md font-extrabold text-primary tracking-tight">VetaBite</span>
          </div>

          <Link
            href="/search"
            className="flex-1 flex items-center h-10 px-3 rounded-full liquid-glass-input text-[11px] text-text-muted gap-2 transition-all hover:bg-white/90"
          >
            <Search className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">Cari makanan, minuman, loket...</span>
          </Link>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Link
              href="/riwayat"
              aria-label="Riwayat Pesanan"
              className="relative w-9 h-9 rounded-full liquid-glass-input flex items-center justify-center text-on-surface hover:text-primary active:scale-95 transition-transform"
            >
              <History className="w-4 h-4" />
              {n > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary ring-2 ring-white" />}
            </Link>

            <Link
              href="/profil"
              aria-label="Profil"
              className="w-9 h-9 rounded-full ring-2 ring-border-specular overflow-hidden flex items-center justify-center font-extrabold bg-primary-fixed text-primary text-xs shadow-sm"
            >
              VB
            </Link>
          </div>
        </div>
      </header>

      {/* Greeting Banner */}
      <section className="space-y-0.5 pt-1">
        <h1 className="font-headline-lg text-headline-lg font-extrabold text-on-surface">
          Halo, <span className="text-primary font-extrabold">Sobat Kampus</span>
        </h1>
        <p className="font-body-sm text-body-sm text-text-muted">Mau makan apa hari ini di kantin UPNVJ?</p>
      </section>

      {/* Hero Promo Card */}
      <section className="relative">
        <div className="relative w-full aspect-[16/7] rounded-[22px] overflow-hidden border border-border-specular shadow-md">
          <img
            alt={cs?.[0]?.name || "Loket Rekomendasi"}
            className="w-full h-full object-cover"
            src={
              cs?.[0]?.banner_url ||
              "https://lh3.googleusercontent.com/aida-public/AB6AXuA9O0X2Eh8UOrZooEZ3B2x24a6rWYOFTlMPrR37YWMZpn8LMBWo1bzWA-aODFrP2maFLVoMbg6EhUVscXgsFl61klQYZR--Gd9amGbqw6-Ttag1IrszA07kI1rfvGH5vDdyAn0xLwwlTLAWch6DveNXBAh4vZKfk5GNKA_eUZguy0Oki61JnwByJCdB5YTBfj4kZ54KPkqCWye2ptMsNx-R9yDVBoFPJmbWD7iThqgd"
            }
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
          <div className="absolute top-3 left-3 flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-600/90 text-white backdrop-blur-md border border-white/40 flex items-center gap-1 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              Buka
            </span>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold text-white bg-black/40 backdrop-blur-md border border-white/20">
              Spesial Siang Ini
            </span>
          </div>
          <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
            <div>
              <span className="text-[10px] text-zinc-300 font-bold uppercase tracking-wider">Loket Rekomendasi</span>
              <h2 className="text-white font-headline-md text-headline-md font-extrabold leading-tight">
                {cs?.[0]?.name || "Kantin Bu Tri — Spesial Geprek"}
              </h2>
            </div>
            <div className="px-2.5 py-1 rounded-full text-white bg-primary text-xs font-bold shadow-md">
              {formatRupiah(16000)}
            </div>
          </div>
        </div>
      </section>

      {/* Filter Categories */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-label-sm text-label-sm text-text-muted font-bold tracking-wider uppercase">
            Kategori Kantin
          </span>
          <button
            onClick={() => setSort(sort.startsWith("Termurah") ? "Termahal - Termurah" : "Termurah - Termahal")}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full liquid-glass text-primary text-[11px] font-bold shadow-xs hover:bg-white"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>{sort}</span>
          </button>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar py-1">
          {cats.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex-shrink-0 active:scale-95 transition-all ${
                cat === c ? "pill-active-gradient text-white shadow-sm" : "liquid-glass text-text-muted hover:text-on-surface"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </section>

      {/* Directory Stall Cards */}
      <section className="space-y-3 pb-6">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-4 rounded-full bg-primary" />
          <h3 className="font-headline-sm text-headline-sm font-extrabold text-on-surface">Pilihan Loket Kantin</h3>
          <span className="font-label-sm text-label-sm text-text-muted ml-auto">
            {(cs || []).filter((c) => c.is_open).length} Loket Buka
          </span>
        </div>

        {!cs && !e && <SkeletonList />}
        {e && <ErrorState msg={e} onRetry={load} />}
        {cs && list.length === 0 && (
          <EmptyState title="Belum ada loket ditemukan" desc="Coba ganti kata kunci atau kategori filter." />
        )}

        <div className="space-y-3.5">
          {cs &&
            list.map((c) => (
              <article
                key={c.id}
                className="p-3.5 rounded-[22px] liquid-glass flex flex-col gap-3 group hover-card-lift transition-smooth cursor-pointer"
              >
                <div className="relative w-full h-32 rounded-xl overflow-hidden">
                  <img
                    alt={c.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                    src={
                      c.banner_url ||
                      "https://lh3.googleusercontent.com/aida-public/AB6AXuA9O0X2Eh8UOrZooEZ3B2x24a6rWYOFTlMPrR37YWMZpn8LMBWo1bzWA-aODFrP2maFLVoMbg6EhUVscXgsFl61klQYZR--Gd9amGbqw6-Ttag1IrszA07kI1rfvGH5vDdyAn0xLwwlTLAWch6DveNXBAh4vZKfk5GNKA_eUZguy0Oki61JnwByJCdB5YTBfj4kZ54KPkqCWye2ptMsNx-R9yDVBoFPJmbWD7iThqgd"
                    }
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold backdrop-blur-md border border-white/40 shadow-sm flex items-center gap-1 ${
                        c.is_open ? "bg-emerald-600/90 text-white" : "bg-zinc-600/90 text-zinc-100"
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      {c.is_open ? "Buka" : "Tutup"}
                    </span>
                    {c.queue_prefix && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/45 backdrop-blur-md text-white border border-white/20">
                        Loket #{c.queue_prefix}
                      </span>
                    )}
                  </div>
                  <button
                    aria-label="Favorit"
                    className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center text-primary shadow-sm active:scale-90 transition-transform"
                  >
                    <Heart className="w-4 h-4 fill-primary" />
                  </button>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <h4 className="font-headline-md text-headline-md font-extrabold text-on-surface">{c.name}</h4>
                    <div className="flex items-center gap-1 text-primary text-[11px] font-bold">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Siap {c.estimated_wait_minutes ?? 10} mnt</span>
                    </div>
                  </div>
                  <p className="font-body-sm text-body-sm text-text-muted line-clamp-1">
                    <strong className="text-on-surface font-semibold">Menjual:</strong> {c.description}
                  </p>
                  <div className="pt-2 flex items-center justify-between border-t border-border-subtle">
                    <div className="flex items-center gap-2">
                      <span className="font-label-sm text-label-sm text-text-muted">Mulai dari</span>
                      <span className="font-label-lg text-label-lg font-extrabold text-primary">
                        {formatRupiah(12000)}
                      </span>
                    </div>
                    <Link
                      href={`/kantin/${c.id}`}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full cta-gradient text-white text-[11px] font-bold shadow-sm active:scale-95 transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Pesan Pick-Up
                    </Link>
                  </div>
                </div>
              </article>
            ))}
        </div>
      </section>

      {/* Floating Mini Keranjang Widget if cart is not empty */}
      {n > 0 && (
        <aside className="fixed bottom-20 left-0 right-0 z-40 max-w-[430px] mx-auto px-space-lg pointer-events-none">
          <div className="pointer-events-auto p-2.5 rounded-2xl liquid-glass flex items-center justify-between shadow-xl border border-border-specular animate-bounce duration-1000">
            <div className="flex items-center gap-2.5">
              <div className="relative w-9 h-9 rounded-xl cta-gradient flex items-center justify-center text-white shadow-sm flex-shrink-0">
                <ShoppingBag className="w-4 h-4" />
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-on-surface text-white text-[9px] font-extrabold flex items-center justify-center ring-1 ring-white">
                  {n}
                </span>
              </div>
              <div>
                <span className="font-label-sm text-label-sm font-bold text-on-surface">{n} Item di Keranjang</span>
                <p className="font-headline-sm text-headline-sm font-extrabold text-primary">
                  Total {formatRupiah(total)}
                </p>
              </div>
            </div>
            <Link
              href="/keranjang"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full cta-gradient text-white text-xs font-bold shadow-md hover:brightness-105 active:scale-95 transition-all"
            >
              <span>Lihat Keranjang</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </aside>
      )}
    </div>
  );
}
