"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Search,
  Heart,
  Clock,
  Plus,
  History,
  SlidersHorizontal,
  ShoppingBag,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { api } from "@/lib/api";
import { loadCart, cartCount, cartTotal } from "@/lib/cart";
import { formatRupiah } from "@/lib/rupiah";
import {
  SkeletonList,
  EmptyState,
  ErrorState,
} from "@/components/shared/States";

type C = {
  id: string;
  name: string;
  description: string;
  sample_items?: string | null;
  min_price?: number;
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

  // Recommended Canteens Carousel
  const [activeSlide, setActiveSlide] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);

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

  const slides = (cs || []).filter((c) => c.is_open).length > 0
    ? (cs || []).filter((c) => c.is_open).slice(0, 5)
    : (cs || []).slice(0, 5);

  useEffect(() => {
    if (!slides.length || slides.length <= 1) return;
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [slides.length]);

  const handlePrevSlide = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleNextSlide = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveSlide((prev) => (prev + 1) % slides.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;
    if (diff > 45) {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    } else if (diff < -45) {
      setActiveSlide((prev) => (prev - 1 + slides.length) % slides.length);
    }
    setTouchStart(null);
  };

  const cats = ["Semua", "Makanan", "Minuman", "Camilan"];
  let list = (cs || []).filter(
    (c) =>
      cat === "Semua" ||
      (c.description || "").toLowerCase().includes(cat.toLowerCase()) ||
      (c.sample_items || "").toLowerCase().includes(cat.toLowerCase()),
  );
  if (sort === "Termurah - Termahal") {
    list = [...list].sort((a, b) => (a.min_price || 12000) - (b.min_price || 12000));
  } else {
    list = [...list].sort((a, b) => (b.min_price || 12000) - (a.min_price || 12000));
  }

  return (
    <div className="flex flex-col gap-4 px-space-lg">
      {/* 1. STICKY LIQUID GLASS NAVBAR */}
      <header className="sticky top-0 z-40 -mx-space-lg px-space-lg pt-3 pb-3 bg-surface-glass-alt backdrop-blur-xl border-b border-border-specular shadow-sm sm:rounded-t-[41px]">
        {/* Baris 1: Brand & Tombol Aksi */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 rounded-full cta-gradient flex items-center justify-center p-0.5 shadow-sm overflow-hidden flex-shrink-0">
              <img
                src="/LOGO.jpeg"
                alt="Logo VetaBite"
                className="w-full h-full object-cover rounded-full select-none"
              />
            </div>
            <span className="font-headline-md text-headline-md font-extrabold text-primary tracking-tight">
              VetaBite
            </span>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Link
              href="/riwayat"
              aria-label="Riwayat Pesanan"
              className="relative w-9 h-9 rounded-full liquid-glass-input flex items-center justify-center text-on-surface hover:text-primary active:scale-95 transition-transform shadow-sm"
            >
              <History className="w-4 h-4" />
              {n > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary ring-2 ring-white" />
              )}
            </Link>

            <Link
              href="/profil"
              aria-label="Profil"
              className="w-9 h-9 rounded-full ring-2 ring-border-specular overflow-hidden flex items-center justify-center font-extrabold bg-primary-fixed text-primary text-xs shadow-sm active:scale-95 transition-transform"
            >
              VB
            </Link>
          </div>
        </div>

        {/* Baris 2: Search Trigger Lebar Penuh (Touch-friendly & tidak terpotong di mobile) */}
        <div className="mt-2.5">
          <Link
            href="/search"
            className="w-full flex items-center h-10 px-3.5 rounded-full liquid-glass-input text-xs text-text-muted gap-2.5 transition-all hover:bg-white/90 shadow-sm"
          >
            <Search className="w-4 h-4 flex-shrink-0 text-text-muted" />
            <span className="truncate font-medium">
              Cari makanan, minuman, loket...
            </span>
          </Link>
        </div>
      </header>

      {/* Greeting Banner */}
      <section className="space-y-0.5 pt-1">
        <h1 className="font-headline-lg text-headline-lg font-extrabold text-on-surface">
          Halo,{" "}
          <span className="text-primary font-extrabold">Sobat Kampus</span>
        </h1>
        <p className="font-body-sm text-body-sm text-text-muted">
          Mau makan apa hari ini di kantin UPNVJ?
        </p>
      </section>

      {/* Hero Promo Card / Interactive Recommended Slider */}
      <section className="relative select-none">
        {slides.length === 0 ? (
          <div className="relative w-full aspect-[16/7] rounded-[22px] overflow-hidden border border-border-specular shadow-md bg-surface-container flex items-center justify-center">
            <span className="text-xs font-bold text-text-muted">Memuat loket rekomendasi...</span>
          </div>
        ) : (
          <div
            className="relative w-full aspect-[16/7] rounded-[22px] overflow-hidden border border-border-specular shadow-md group"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {/* Carousel Slides */}
            {slides.map((slide, idx) => {
              const isActive = idx === activeSlide;
              return (
                <Link
                  key={slide.id}
                  href={`/kantin/${slide.id}`}
                  className={`absolute inset-0 transition-opacity duration-700 ease-in-out cursor-pointer ${
                    isActive ? "opacity-100 z-10 pointer-events-auto" : "opacity-0 z-0 pointer-events-none"
                  }`}
                >
                  <img
                    alt={slide.name}
                    className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                    src={
                      slide.banner_url ||
                      "https://lh3.googleusercontent.com/aida-public/AB6AXuA9O0X2Eh8UOrZooEZ3B2x24a6rWYOFTlMPrR37YWMZpn8LMBWo1bzWA-aODFrP2maFLVoMbg6EhUVscXgsFl61klQYZR--Gd9amGbqw6-Ttag1IrszA07kI1rfvGH5vDdyAn0xLwwlTLAWch6DveNXBAh4vZKfk5GNKA_eUZguy0Oki61JnwByJCdB5YTBfj4kZ54KPkqCWye2ptMsNx-R9yDVBoFPJmbWD7iThqgd"
                    }
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase backdrop-blur-md border border-white/40 flex items-center gap-1 shadow-sm ${
                        slide.is_open ? "bg-emerald-600/90 text-white" : "bg-zinc-700/90 text-zinc-200"
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      {slide.is_open ? "Buka" : "Tutup"}
                    </span>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold text-white bg-primary/80 backdrop-blur-md border border-white/20">
                      Rekomendasi
                    </span>
                  </div>

                  {/* Bottom Text Info */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] text-zinc-300 font-bold uppercase tracking-wider block truncate">
                        {slide.sample_items || "Menu Favorit Mahasiswa"}
                      </span>
                      <h2 className="text-white font-headline-md text-headline-md font-extrabold leading-tight truncate">
                        {slide.name}
                      </h2>
                    </div>
                    <div className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-white bg-primary text-xs font-extrabold shadow-md active:scale-95 transition-transform">
                      <span>Pesan</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </Link>
              );
            })}

            {/* Left / Right Navigation Controls */}
            {slides.length > 1 && (
              <>
                <button
                  type="button"
                  aria-label="Slide Sebelumnya"
                  onClick={handlePrevSlide}
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center backdrop-blur-sm transition-all active:scale-90 opacity-80 hover:opacity-100 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  aria-label="Slide Berikutnya"
                  onClick={handleNextSlide}
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center backdrop-blur-sm transition-all active:scale-90 opacity-80 hover:opacity-100 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                {/* Dot Indicators */}
                <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5">
                  {slides.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      aria-label={`Pindah ke slide ${i + 1}`}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setActiveSlide(i);
                      }}
                      className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                        i === activeSlide ? "w-5 bg-primary" : "w-1.5 bg-white/60 hover:bg-white"
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </section>

      {/* Filter Categories */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-label-sm text-label-sm text-text-muted font-bold tracking-wider uppercase">
            Kategori Kantin
          </span>
          <button
            onClick={() =>
              setSort(
                sort.startsWith("Termurah")
                  ? "Termahal - Termurah"
                  : "Termurah - Termahal",
              )
            }
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
                cat === c
                  ? "pill-active-gradient text-white shadow-sm"
                  : "liquid-glass text-text-muted hover:text-on-surface"
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
          <h3 className="font-headline-sm text-headline-sm font-extrabold text-on-surface">
            Pilihan Loket Kantin
          </h3>
          <span className="font-label-sm text-label-sm text-text-muted ml-auto">
            {(cs || []).filter((c) => c.is_open).length} Loket Buka
          </span>
        </div>

        {!cs && !e && <SkeletonList />}
        {e && <ErrorState msg={e} onRetry={load} />}
        {cs && list.length === 0 && (
          <EmptyState
            title="Belum ada loket ditemukan"
            desc="Coba ganti kata kunci atau kategori filter."
          />
        )}

        <div className="space-y-3.5">
          {cs &&
            list.map((c) => (
              <article
                key={c.id}
                className="p-3.5 rounded-[22px] liquid-glass flex flex-col gap-3 group hover-card-lift transition-smooth"
              >
                <Link
                  href={`/kantin/${c.id}`}
                  className="relative w-full h-32 rounded-xl overflow-hidden block cursor-pointer"
                >
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
                        c.is_open
                          ? "bg-emerald-600/90 text-white"
                          : "bg-zinc-600/90 text-zinc-100"
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      {c.is_open ? "Buka" : "Tutup"}
                    </span>
                  </div>
                  <button
                    type="button"
                    aria-label="Favorit"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center text-primary shadow-sm active:scale-90 transition-transform cursor-pointer"
                  >
                    <Heart className="w-4 h-4 fill-primary" />
                  </button>
                </Link>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Link
                      href={`/kantin/${c.id}`}
                      className="font-headline-md text-headline-md font-extrabold text-on-surface hover:text-primary transition-colors truncate"
                    >
                      {c.name}
                    </Link>
                    <div className="flex items-center gap-1 text-primary text-[11px] font-bold shrink-0">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Siap {c.estimated_wait_minutes ?? 10} mnt</span>
                    </div>
                  </div>
                  <p className="font-body-sm text-body-sm text-text-muted line-clamp-1">
                    <strong className="text-on-surface font-semibold">
                      Menjual:
                    </strong>{" "}
                    {c.sample_items ||
                      (c.description && !c.description.toLowerCase().includes("kantin gedung")
                        ? c.description
                        : "Ayam Geprek, Ayam Cabe Ijo, Mie Goreng, Nasi Padang")}
                  </p>
                  <div className="pt-2 flex items-center justify-between border-t border-border-subtle">
                    <div className="flex items-center gap-2">
                      <span className="font-label-sm text-label-sm text-text-muted">
                        Mulai dari
                      </span>
                      <span className="font-label-lg text-label-lg font-extrabold text-primary">
                        {formatRupiah(c.min_price || 12000)}
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
                <span className="font-label-sm text-label-sm font-bold text-on-surface">
                  {n} Item di Keranjang
                </span>
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
