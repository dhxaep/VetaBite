"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, X, Plus, History, Trash2, ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";
import { formatRupiah } from "@/lib/rupiah";
import { SkeletonList, EmptyState, ErrorState } from "@/components/shared/States";

type Hit = {
  id?: string;
  menu_id?: string;
  canteen_id?: string;
  name: string;
  description?: string;
  price?: number;
  photo_url?: string | null;
  is_open?: boolean;
};

const HK = "vetabite_search_hist";

export default function SearchPage() {
  const r = useRouter();
  const [q, setQ] = useState("");
  const [tab, setTab] = useState("Menu");
  const [res, setRes] = useState<Hit[] | null>([]);
  const [e, setE] = useState("");
  const [l, setL] = useState(false);
  const [hist, setHist] = useState<string[]>([]);

  useEffect(() => {
    try {
      setHist(JSON.parse(localStorage.getItem(HK) || '["Ayam Geprek", "Es Teh Jumbo", "Kantin Bu Tri"]'));
    } catch {}
  }, []);

  function saveH(h: string[]) {
    setHist(h);
    localStorage.setItem(HK, JSON.stringify(h));
  }

  function delH(item: string) {
    saveH(hist.filter((h) => h !== item));
  }

  async function go(term?: string) {
    const t = (term ?? q).trim();
    setE("");
    if (!t) {
      setRes([]);
      return;
    }
    setL(true);
    try {
      const d = await api<{ canteens: Hit[] } | Hit[]>(`/api/canteens?q=${encodeURIComponent(t)}`);
      const arr: Hit[] = Array.isArray(d) ? d : d.canteens || [];
      setRes(arr);
      if (!hist.includes(t)) saveH([t, ...hist].slice(0, 8));
    } catch (err: unknown) {
      setE(err instanceof Error ? err.message : String(err));
    } finally {
      setL(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(() => {
      if (q.trim()) go();
    }, 450);
    return () => clearTimeout(t);
  }, [q]);

  const menuList = (res || []).filter((x) => !!x.menu_id);
  const canteenList = (res || []).filter((x) => !x.menu_id);

  const displayed =
    tab === "Menu"
      ? (menuList.length > 0 ? menuList : res || [])
      : (canteenList.length > 0 ? canteenList : res || []);

  const tabs = [
    { n: "Menu", c: menuList.length || (res || []).length },
    { n: "Loket Kantin", c: canteenList.length || (res || []).length },
  ];

  return (
    <div className="flex flex-col gap-4 px-space-lg">
      {/* Search Header */}
      <header className="sticky top-0 z-40 -mx-space-lg px-space-lg py-3 bg-surface-glass-alt backdrop-blur-xl border-b border-border-specular shadow-sm">
        <div className="flex items-center justify-between gap-2.5 w-full">
          <button
            aria-label="Kembali ke Beranda"
            onClick={() => r.back()}
            className="w-10 h-10 rounded-full flex items-center justify-center liquid-glass active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-4 h-4 text-on-surface" />
          </button>
          <div className="flex-1 relative flex items-center">
            <Search className="absolute left-3.5 w-4 h-4 text-text-muted pointer-events-none" />
            <input
              autoFocus
              value={q}
              onChange={(ev) => setQ(ev.target.value)}
              placeholder="Cari menu, loket, atau kantin UPNVJ..."
              className="w-full h-10 pl-10 pr-10 rounded-full liquid-glass-input text-xs text-on-surface placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/25"
            />
            {q && (
              <button
                aria-label="Bersihkan pencarian"
                onClick={() => {
                  setQ("");
                  setRes([]);
                }}
                className="absolute right-3 w-5 h-5 rounded-full bg-surface-container-high flex items-center justify-center text-text-muted hover:text-on-surface active:scale-90"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          <div className="w-9 h-9 rounded-full ring-2 ring-border-specular overflow-hidden flex-shrink-0 bg-primary-fixed flex items-center justify-center font-extrabold text-primary text-xs shadow-sm">
            VB
          </div>
        </div>

        {/* Tab Switcher */}
        <nav className="mt-3 grid grid-cols-2 p-1 bg-surface-container/70 rounded-full border border-border-specular backdrop-blur-md">
          {tabs.map((t) => (
            <button
              key={t.n}
              onClick={() => setTab(t.n)}
              className={`py-1.5 rounded-full text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                tab === t.n ? "pill-active-gradient text-white shadow-sm" : "text-text-muted hover:text-on-surface"
              }`}
            >
              <span>{t.n}</span>
              <span className="px-1.5 bg-white/20 rounded-full text-[10px]">{t.c}</span>
            </button>
          ))}
        </nav>
      </header>

      {/* Filter Badges */}
      <section aria-label="Filter Hasil Pencarian" className="flex items-center gap-2 overflow-x-auto hide-scrollbar py-1">
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full liquid-glass text-primary text-xs font-bold flex-shrink-0">
          <span>Semua Loket</span>
        </button>
        <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary-fixed text-primary text-xs font-bold border border-primary/20 flex-shrink-0">
          <span>Pondok Labu</span>
        </div>
        <button className="px-3 py-1.5 rounded-full liquid-glass text-text-muted text-xs font-bold flex-shrink-0">
          Kampus Limo
        </button>
        <button className="px-3 py-1.5 rounded-full liquid-glass text-text-muted text-xs font-bold flex-shrink-0">
          &lt; Rp 20.000
        </button>
      </section>

      {/* Search Result Count */}
      <section className="flex items-center justify-between pt-1">
        <p className="font-body-sm text-body-sm text-text-muted">
          Menampilkan <span className="font-bold text-on-surface">{displayed.length} santapan</span>
          {q && (
            <span>
              {" "}
              untuk <span className="text-primary font-bold">&quot;{q}&quot;</span>
            </span>
          )}
        </p>
      </section>

      {l && <SkeletonList n={2} />}
      {e && <ErrorState msg={e} onRetry={() => go()} />}
      {!l && !e && displayed.length === 0 && (
        <EmptyState
          title={q ? "Tidak ada hasil" : "Cari Menu atau Loket"}
          desc={q ? `Tidak ditemukan untuk "${q}". Coba kata kunci lain.` : "Ketik nama loket atau menu favoritmu."}
        />
      )}

      {/* Results List */}
      <section className="flex flex-col gap-3">
        {!l &&
          displayed.map((c: Hit) => (
            <article
              key={c.id || c.menu_id}
              className="liquid-glass rounded-[18px] p-3 flex gap-3 relative overflow-hidden group hover-card-lift transition-smooth cursor-pointer"
            >
              <div className="relative w-[88px] h-[88px] rounded-[14px] overflow-hidden flex-shrink-0 bg-surface-dim">
                <img
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ease-out"
                  src={
                    c.photo_url ||
                    "https://lh3.googleusercontent.com/aida-public/AB6AXuDONUCpglL6jc-58eEFB9jmnxQIbojv28_kmIw_3_cOique7XHmwaWM2_GidCmfRafjTuZJaorhpiVxsItRpSbieUWQT8jR0crmX2VGi-m2rj1-150lHILHHQBL8twqncJOSKjfIhXCKvgpqHIvzCvs6sutxYWCrwTJ2_LKQlZFkQJokJfZVsJJX0fM0GO-EHibCrRrHOrqJVecR6roeobFxvqyhFeJWm4-LDX1oyFb"
                  }
                  alt={c.name}
                />
                <div className="absolute top-1.5 left-1.5 bg-emerald-600/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-sm">
                  <span className="w-1 h-1 rounded-full bg-white animate-pulse" />
                  {c.is_open === false ? "Tutup" : "Tersedia"}
                </div>
              </div>

              <div className="flex-1 flex flex-col justify-between min-w-0">
                <div>
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-label-sm text-label-sm text-text-muted truncate">
                      {c.canteen_id ? `Loket #${c.canteen_id}` : "Kantin UPNVJ"}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                      Siap Saji
                    </span>
                  </div>
                  <h4 className="font-headline-sm text-headline-sm text-on-surface font-extrabold leading-tight mt-0.5 line-clamp-1">
                    {c.name}
                  </h4>
                  <p className="font-body-sm text-body-sm text-text-muted mt-0.5 line-clamp-1">
                    {c.description || "Menu favorit mahasiswa UPNVJ"}
                  </p>
                </div>

                <div className="flex items-center justify-between mt-2 pt-1 border-t border-border-subtle">
                  <div className="flex flex-col">
                    <span className="font-label-micro text-label-micro text-text-muted uppercase">Harga</span>
                    <span className="font-label-lg text-label-lg font-extrabold text-primary tracking-tight">
                      {formatRupiah(c.price || 15000)}
                    </span>
                  </div>
                  <Link
                    href={c.canteen_id ? `/kantin/${c.canteen_id}` : `/kantin/${c.id}`}
                    className="cta-gradient text-white text-xs font-bold px-3.5 py-1.5 rounded-full flex items-center gap-1 active:scale-95 shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Pesan</span>
                  </Link>
                </div>
              </div>
            </article>
          ))}
      </section>

      {/* Riwayat Pencarian Section */}
      <section className="liquid-glass rounded-[20px] p-4 mt-1 flex flex-col gap-3">
        <div className="flex items-center justify-between border-b border-border-subtle pb-2">
          <div className="flex items-center gap-1.5">
            <History className="w-4 h-4 text-primary" />
            <h3 className="font-headline-sm text-headline-sm font-extrabold text-on-surface">Pencarian Terakhir</h3>
          </div>
          {hist.length > 0 && (
            <button
              onClick={() => saveH([])}
              className="text-xs text-primary font-bold flex items-center gap-1 hover:underline"
            >
              <Trash2 className="w-3 h-3" />
              <span>Hapus Semua</span>
            </button>
          )}
        </div>
        <ul className="flex flex-col gap-1.5">
          {hist.map((h) => (
            <li
              key={h}
              className="flex items-center justify-between py-1.5 px-2 rounded-xl hover:bg-white/60 transition-colors group"
            >
              <button
                onClick={() => {
                  setQ(h);
                  go(h);
                }}
                className="flex items-center gap-2.5 text-left flex-1 py-0.5"
              >
                <History className="w-3.5 h-3.5 text-text-muted group-hover:text-primary flex-shrink-0" />
                <span className="font-body-md text-body-md text-on-surface group-hover:text-primary">{h}</span>
              </button>
              <button
                aria-label="Hapus item riwayat"
                onClick={() => delH(h)}
                className="text-text-muted hover:text-danger p-1 rounded-full active:scale-90"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </li>
          ))}
          {hist.length === 0 && <p className="text-xs text-text-muted px-2">Belum ada riwayat pencarian.</p>}
        </ul>
      </section>
    </div>
  );
}
