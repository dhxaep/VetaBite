"use client";

import { useEffect, useRef, useState } from "react";
import {
  Pencil,
  Plus,
  Power,
  Upload,
  ImagePlus,
  QrCode,
  CheckCheck,
  X,
  Trash2,
  UtensilsCrossed,
  Store,
  Sparkles,
  Loader2,
  Link2,
  RotateCcw,
} from "lucide-react";
import { api } from "@/lib/api";
import { formatRupiah } from "@/lib/format";
import { LoadingList, Empty, ErrorBox } from "@/components/States";

type M = {
  id: string;
  name: string;
  description?: string;
  price: number;
  photo_url?: string;
  is_available: boolean;
  category: string;
};

type C = {
  id: string;
  name: string;
  is_open: boolean;
  banner_url?: string;
  qris_image_url?: string;
};

const CATEGORIES = ["Makanan", "Minuman", "Camilan"];

export default function StatusTokoPage() {
  const [c, setC] = useState<C | null>(null);
  const [menus, setMenus] = useState<M[] | null>(null);
  const [err, setErr] = useState("");
  const [modal, setModal] = useState<Partial<M> | null>(null);
  const [toast, setToast] = useState("");
  const [uploading, setUploading] = useState(false);
  const [customQrisUrl, setCustomQrisUrl] = useState("");
  const [showQrisUrlInput, setShowQrisUrlInput] = useState(false);

  const bannerInputRef = useRef<HTMLInputElement | null>(null);
  const qrisInputRef = useRef<HTMLInputElement | null>(null);
  const menuImgInputRef = useRef<HTMLInputElement | null>(null);

  const load = async () => {
    try {
      setErr("");
      const d = await api<{ canteen: C; menus: M[] }>("/api/seller/canteen");
      setC(d.canteen);
      setMenus(d.menus);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const toggleOpen = async () => {
    if (!c) return;
    try {
      const n = await api<C>("/api/seller/canteen", {
        method: "PATCH",
        body: JSON.stringify({ is_open: !c.is_open }),
      });
      setC(n);
      setToast(n.is_open ? "Loket dibuka, mahasiswa bisa memesan" : "Loket ditutup sementara");
    } catch (e: unknown) {
      setToast(e instanceof Error ? e.message : "Gagal mengubah status loket");
    }
  };

  const toggleStock = async (m: M) => {
    try {
      await api(`/api/seller/menu/${m.id}/toggle-stock`, {
        method: "PATCH",
        body: JSON.stringify({ is_available: !m.is_available }),
      });
      load();
      setToast(m.is_available ? `${m.name} ditandai habis` : `${m.name} tersedia kembali`);
    } catch (e: unknown) {
      setToast(e instanceof Error ? e.message : "Gagal mengubah ketersediaan stok");
    }
  };

  const uploadAsset = async (file: File, kind: "banner" | "qris" | "menu"): Promise<string | null> => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("kind", kind);
      const res = await fetch("/api/uploads/canteen", {
        method: "POST",
        body: fd,
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok || json.success === false) {
        throw new Error(json?.error?.message || "Gagal mengunggah file gambar.");
      }
      return json.data.fileUrl;
    } catch (e: unknown) {
      setToast(e instanceof Error ? e.message : "Upload gagal.");
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleBannerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !c) return;
    const fileUrl = await uploadAsset(file, "banner");
    if (fileUrl) {
      const updated = await api<C>("/api/seller/canteen", {
        method: "PATCH",
        body: JSON.stringify({ banner_url: fileUrl }),
      });
      setC(updated);
      setToast("Banner loket berhasil diperbarui.");
    }
  };

  const handleQrisChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !c) return;
    const fileUrl = await uploadAsset(file, "qris");
    if (fileUrl) {
      const updated = await api<C>("/api/seller/canteen", {
        method: "PATCH",
        body: JSON.stringify({ qris_image_url: fileUrl }),
      });
      setC(updated);
      setToast("Kode QRIS loket berhasil diperbarui.");
    }
  };

  const handleSaveQrisUrl = async () => {
    if (!customQrisUrl.trim() || !c) return;
    try {
      const updated = await api<C>("/api/seller/canteen", {
        method: "PATCH",
        body: JSON.stringify({ qris_image_url: customQrisUrl.trim() }),
      });
      setC(updated);
      setCustomQrisUrl("");
      setShowQrisUrlInput(false);
      setToast("Kode QRIS loket berhasil diperbarui.");
    } catch (e: unknown) {
      setToast(e instanceof Error ? e.message : "Gagal memperbarui QRIS");
    }
  };

  const handleResetQrisDefault = async () => {
    if (!c) return;
    try {
      const updated = await api<C>("/api/seller/canteen", {
        method: "PATCH",
        body: JSON.stringify({ qris_image_url: "/images/qris-code.svg" }),
      });
      setC(updated);
      setToast("QRIS diatur ke template standar UPNVJ.");
    } catch (e: unknown) {
      setToast(e instanceof Error ? e.message : "Gagal mereset QRIS");
    }
  };

  const handleMenuPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fileUrl = await uploadAsset(file, "menu");
    if (fileUrl && modal) {
      setModal({ ...modal, photo_url: fileUrl });
      setToast("Foto hidangan terunggah.");
    }
  };

  const save = async () => {
    if (!modal?.name?.trim()) return alert("Nama hidangan wajib diisi.");
    if (!modal?.price || Number(modal.price) <= 0) return alert("Harga wajib diisi dengan benar.");

    try {
      const payload = {
        name: modal.name.trim(),
        price: Number(modal.price),
        category: modal.category || "Makanan",
        description: modal.description?.trim() || "",
        photo_url: modal.photo_url || "",
        is_available: modal.is_available ?? true,
      };

      if (modal.id) {
        await api(`/api/seller/menu/${modal.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        await api("/api/seller/menu", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      setModal(null);
      load();
      setToast(modal.id ? "Perubahan menu disimpan." : "Menu baru berhasil ditambahkan.");
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Gagal menyimpan menu.");
    }
  };

  const del = async (id: string) => {
    if (!confirm("Hapus hidangan ini dari daftar loket?")) return;
    try {
      await api(`/api/seller/menu/${id}`, { method: "DELETE" });
      setModal(null);
      load();
      setToast("Menu berhasil dihapus.");
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Gagal menghapus menu.");
    }
  };

  if (err && !c) return <ErrorBox msg={err} onRetry={load} />;
  if (!c || !menus) {
    return (
      <div className="px-space-lg pt-4">
        <h1 className="text-2xl font-extrabold text-on-surface">Status Toko</h1>
        <LoadingList n={4} />
      </div>
    );
  }

  return (
    <div className="px-space-lg pt-3 pb-8 space-y-4">
      {/* Hidden file inputs for real image uploading */}
      <input
        type="file"
        ref={bannerInputRef}
        onChange={handleBannerChange}
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
      />
      <input
        type="file"
        ref={qrisInputRef}
        onChange={handleQrisChange}
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
      />
      <input
        type="file"
        ref={menuImgInputRef}
        onChange={handleMenuPhotoChange}
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
      />

      {/* Floating Success Toast */}
      {toast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[60] w-[90%] max-w-[390px] liquid-glass rounded-2xl p-3.5 shadow-2xl flex items-center gap-3 border border-emerald-500/40 backdrop-blur-xl animate-fade-in">
          <span className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            <CheckCheck size={18} />
          </span>
          <p className="text-xs font-bold text-on-surface leading-tight">{toast}</p>
        </div>
      )}

      {/* SECTION 1: Status Operasional Toko */}
      <section className="liquid-glass rounded-[26px] p-4 relative overflow-hidden shadow-sm border border-border-specular">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${c.is_open ? "bg-emerald-500 animate-pulse" : "bg-gray-400"}`} />
            <h2 className="text-xs font-bold uppercase tracking-wider text-text-muted">Status Operasional Loket</h2>
          </div>
          <span className="text-[11px] font-extrabold px-3 py-1 rounded-full bg-surface-container text-text-muted border border-border-specular">
            Kantin Utama UPNVJ
          </span>
        </div>

        <div className="bg-white/70 rounded-[20px] p-3.5 border border-border-specular mb-3.5 shadow-inner">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] text-text-muted">Tampilan di HP Mahasiswa:</p>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5 ${
                    c.is_open ? "bg-emerald-500/15 text-emerald-800" : "bg-gray-200 text-gray-700"
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${c.is_open ? "bg-emerald-500" : "bg-gray-400"}`} />
                  {c.is_open ? "BUKA" : "TUTUP"}
                </span>
                <span className="text-xs font-bold text-on-surface">
                  {c.is_open ? "(Menerima Pesanan)" : "(Pesanan Dijeda)"}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={toggleOpen}
              className={`min-h-[46px] px-5 rounded-full font-extrabold text-xs flex items-center justify-center gap-2 text-white shadow-md active:scale-95 transition-all ${
                c.is_open
                  ? "bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800"
                  : "bg-gradient-to-r from-primary to-[#C63000]"
              }`}
            >
              <Power size={18} />
              <span>{c.is_open ? "Tutup Loket" : "Buka Loket"}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="p-3 rounded-2xl bg-white/50 border border-white/80 shadow-sm">
            <span className="text-[10px] uppercase text-text-muted font-bold tracking-wider block">Nama Loket</span>
            <p className="text-sm font-extrabold text-on-surface mt-0.5 truncate">{c.name}</p>
          </div>
          <div className="p-3 rounded-2xl bg-white/50 border border-white/80 shadow-sm">
            <span className="text-[10px] uppercase text-text-muted font-bold tracking-wider block">QRIS Toko</span>
            <p className="text-sm font-extrabold text-primary mt-0.5">{c.qris_image_url ? "Terpasang" : "Belum Ada"}</p>
          </div>
        </div>
      </section>

      {/* SECTION 2: Banner & QRIS Gerai */}
      <section className="liquid-glass rounded-[26px] p-4 shadow-sm border border-border-specular space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-extrabold text-on-surface">Banner Gerai {c.name}</h2>
            <p className="text-xs text-text-muted">Pratinjau visual header etalase mahasiswa</p>
          </div>
          <span className="text-[10px] text-primary font-bold bg-primary-fixed/60 px-2.5 py-0.5 rounded-full">
            Rasio 16:7
          </span>
        </div>

        <div className="relative w-full aspect-[16/7] rounded-[20px] overflow-hidden border border-border-specular shadow-inner group bg-surface-container">
          {c.banner_url ? (
            <img src={c.banner_url} alt={`Banner ${c.name}`} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-text-muted text-xs gap-1.5">
              <ImagePlus size={32} />
              <span>Belum ada foto banner</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent flex flex-col justify-end p-3.5 text-white">
            <p className="text-sm font-extrabold drop-shadow">{c.name}</p>
            <p className="text-xs text-white/90">Kantin UPN Veteran Jakarta • Kampus Pondok Labu &amp; Limo</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-1">
          <span className="text-[10px] text-text-muted leading-tight">
            Format: JPG, PNG, WebP • Rekomendasi 1200x525px • Maks 5MB
          </span>
          <button
            type="button"
            disabled={uploading}
            onClick={() => bannerInputRef.current?.click()}
            className="min-h-[44px] px-4 py-2 rounded-full bg-white hover:bg-surface-container text-on-surface border border-border-specular font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-sm shrink-0"
          >
            {uploading ? <Loader2 size={16} className="animate-spin text-primary" /> : <Upload size={16} className="text-primary" />}
            <span>Ganti Banner</span>
          </button>
        </div>
      </section>

      {/* SECTION 2.5: Kode QRIS Pembayaran Toko */}
      <section className="liquid-glass rounded-[26px] p-4 shadow-sm border border-border-specular space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <QrCode size={18} />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-on-surface">Kode QRIS Pembayaran</h2>
              <p className="text-xs text-text-muted">Ditampilkan kepada mahasiswa saat checkout pesanan</p>
            </div>
          </div>
          <span className="text-[10px] text-emerald-800 bg-emerald-100 font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
            Live Checkout
          </span>
        </div>

        {/* QRIS Active Display Card */}
        <div className="bg-white/80 rounded-[22px] p-4 border border-border-specular flex flex-col sm:flex-row items-center gap-4 shadow-inner">
          <div className="relative group p-2.5 bg-white rounded-2xl border-2 border-primary/20 shadow-sm shrink-0 text-center">
            <img
              src={c.qris_image_url || "/images/qris-code.svg"}
              alt={`QRIS ${c.name}`}
              className="w-36 h-36 object-contain rounded-xl"
            />
            <div className="mt-1.5">
              <span className="bg-primary text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full shadow-xs">
                QRIS Aktif Mahasiswa
              </span>
            </div>
          </div>

          <div className="flex-1 space-y-2 text-center sm:text-left">
            <div>
              <h3 className="text-xs font-bold text-on-surface">QRIS Gerai {c.name}</h3>
              <p className="text-[11px] text-text-muted leading-relaxed">
                Mahasiswa akan memindai QR ini melalui aplikasi GoPay, OVO, BCA, Mandiri, ShopeePay, atau DANA. Anda dapat mengganti gambar QRIS kapan saja.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 pt-1 justify-center sm:justify-start">
              <button
                type="button"
                disabled={uploading}
                onClick={() => qrisInputRef.current?.click()}
                className="min-h-[38px] px-3.5 rounded-full bg-primary hover:bg-primary-hover text-white font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
              >
                {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                <span>Unggah Gambar QRIS Baru</span>
              </button>

              <button
                type="button"
                onClick={() => setShowQrisUrlInput(!showQrisUrlInput)}
                className="min-h-[38px] px-3.5 rounded-full bg-white hover:bg-surface-container text-on-surface border border-border-specular font-bold text-xs flex items-center gap-1.5 active:scale-95 transition-all shadow-xs"
              >
                <Link2 size={14} className="text-primary" />
                <span>Ganti via URL</span>
              </button>

              {c.qris_image_url !== "/images/qris-code.svg" && (
                <button
                  type="button"
                  onClick={handleResetQrisDefault}
                  className="min-h-[38px] px-3 rounded-full bg-surface-container hover:bg-surface-container-high text-text-muted hover:text-on-surface font-bold text-[11px] flex items-center gap-1 active:scale-95 transition-all"
                >
                  <RotateCcw size={13} />
                  <span>Reset Default UPNVJ</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Optional Custom URL Input Row */}
        {showQrisUrlInput && (
          <div className="p-3 bg-white/95 rounded-2xl border border-primary/30 space-y-2 shadow-sm animate-fade-in">
            <label className="text-xs font-bold text-on-surface block">
              Masukkan URL Gambar Kode QRIS:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="url"
                value={customQrisUrl}
                onChange={(e) => setCustomQrisUrl(e.target.value)}
                placeholder="https://contoh.com/foto-qris-toko.png"
                className="flex-1 px-3.5 py-2 rounded-xl bg-white border border-border-specular text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 shadow-xs"
              />
              <button
                type="button"
                onClick={handleSaveQrisUrl}
                className="min-h-[38px] px-4 rounded-xl cta-gradient-btn text-white text-xs font-bold active:scale-95 transition-all shadow-xs"
              >
                Simpan
              </button>
              <button
                type="button"
                onClick={() => setShowQrisUrlInput(false)}
                className="min-h-[38px] px-3 rounded-xl bg-white text-text-muted border text-xs active:scale-95"
              >
                Batal
              </button>
            </div>
            <p className="text-[10px] text-text-muted">
              Tautan gambar harus berupa URL langsung ke gambar (.png, .jpg, atau .svg).
            </p>
          </div>
        )}
      </section>

      {/* SECTION 3: Daftar Menu Hidangan */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div>
            <h2 className="text-base font-extrabold text-on-surface">Daftar Menu Hidangan</h2>
            <p className="text-xs text-text-muted">Kelola harga dan ketersediaan stok menu</p>
          </div>
          <span className="text-xs px-2.5 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full font-extrabold">
            {menus.length} Hidangan
          </span>
        </div>

        <button
          type="button"
          onClick={() =>
            setModal({
              name: "",
              price: 15000,
              category: "Makanan",
              description: "",
              photo_url: "",
              is_available: true,
            })
          }
          className="w-full min-h-[48px] rounded-full cta-gradient-btn text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
        >
          <Plus size={18} />
          <span>Tambah Menu Baru</span>
        </button>

        {menus.length === 0 ? (
          <Empty title="Belum ada menu" desc="Tambahkan menu hidangan pertama Anda agar mahasiswa dapat mulai memesan." />
        ) : (
          <div className="space-y-2.5">
            {menus.map((m) => (
              <article
                key={m.id}
                className="liquid-glass rounded-[22px] p-3.5 flex items-center gap-3.5 border border-border-specular shadow-sm transition-all"
              >
                {m.photo_url ? (
                  <img src={m.photo_url} alt={m.name} className="w-16 h-16 rounded-2xl object-cover border shrink-0 bg-white" />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center text-text-muted shrink-0 border border-border-specular">
                    <UtensilsCrossed size={22} />
                  </div>
                )}

                <div className="flex-1 min-w-0 space-y-0.5">
                  <h3 className="text-sm font-extrabold text-on-surface truncate">{m.name}</h3>
                  <p className="text-xs font-bold text-primary">
                    {formatRupiah(m.price)} <span className="text-text-muted font-normal">• {m.category}</span>
                  </p>
                  <p className="text-[11px] text-text-muted truncate">{m.description || "Tanpa catatan deskripsi"}</p>
                </div>

                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => toggleStock(m)}
                    className={`min-h-[36px] px-3 rounded-full text-[11px] font-extrabold flex items-center gap-1.5 active:scale-95 transition-all border ${
                      m.is_available
                        ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                        : "bg-gray-100 text-gray-600 border-gray-300"
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${m.is_available ? "bg-emerald-500" : "bg-gray-400"}`} />
                    <span>{m.is_available ? "Tersedia" : "Habis"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setModal(m)}
                    className="w-9 h-9 rounded-full bg-white hover:bg-surface-container border border-border-specular flex items-center justify-center text-text-muted hover:text-on-surface active:scale-95 shadow-sm transition-all"
                    aria-label="Edit menu"
                  >
                    <Pencil size={15} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* SECTION 4: Liquid Glass Modal Tambah / Edit Menu */}
      {modal && (
        <div
          className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 modal-smooth-enter"
          onClick={() => setModal(null)}
        >
          <div
            className="liquid-glass rounded-[28px] w-full max-w-[420px] max-h-[88vh] flex flex-col p-6 shadow-2xl border-2 border-white/90 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <UtensilsCrossed size={18} />
                </span>
                <div>
                  <h3 className="font-extrabold text-base text-on-surface">
                    {modal.id ? "Edit Menu Hidangan" : "Tambah Menu Baru"}
                  </h3>
                  <p className="text-[11px] text-text-muted">Kantin Utama UPN Veteran Jakarta</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModal(null)}
                className="w-8 h-8 rounded-full bg-white/80 hover:bg-white text-text-muted hover:text-on-surface border border-border-specular flex items-center justify-center transition-all active:scale-90"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Form Inputs */}
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {/* Nama Menu */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface block">Nama Hidangan</label>
                <input
                  type="text"
                  placeholder="Contoh: Ayam Geprek Sambal Korek"
                  value={modal.name ?? ""}
                  onChange={(e) => setModal({ ...modal, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/80 border border-border-specular text-sm text-on-surface placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-white transition-all shadow-sm"
                />
              </div>

              {/* Harga */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface block">Harga Porsi (Rp)</label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-xs font-extrabold text-text-muted">Rp</span>
                  <input
                    type="number"
                    placeholder="15000"
                    value={modal.price || ""}
                    onChange={(e) => setModal({ ...modal, price: Number(e.target.value) })}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-white/80 border border-border-specular text-sm font-bold text-on-surface placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-white transition-all shadow-sm"
                  />
                </div>
              </div>

              {/* Kategori Pills */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface block">Kategori Menu</label>
                <div className="flex gap-1.5">
                  {CATEGORIES.map((cat) => {
                    const isSel = (modal.category || "Makanan") === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setModal({ ...modal, category: cat })}
                        className={`flex-1 py-2 rounded-xl text-xs font-extrabold transition-all border ${
                          isSel
                            ? "bg-primary text-white border-primary shadow-sm"
                            : "bg-white/70 text-text-muted border-border-specular hover:bg-white"
                        }`}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Deskripsi */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface block">Deskripsi Hidangan</label>
                <textarea
                  rows={2}
                  placeholder="Catatan porsi, bahan, atau tingkat kepedasan"
                  value={modal.description ?? ""}
                  onChange={(e) => setModal({ ...modal, description: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-white/80 border border-border-specular text-sm text-on-surface placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-white transition-all shadow-sm resize-none"
                />
              </div>

              {/* Foto Menu */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface block">Foto Hidangan</label>
                <div className="flex items-center gap-3">
                  {modal.photo_url ? (
                    <img
                      src={modal.photo_url}
                      alt="Pratinjau"
                      className="w-16 h-16 rounded-xl object-cover border bg-white shadow-sm shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-surface-container flex items-center justify-center text-text-muted border shrink-0">
                      <ImagePlus size={22} />
                    </div>
                  )}

                  <div className="flex-1 space-y-1.5">
                    <button
                      type="button"
                      disabled={uploading}
                      onClick={() => menuImgInputRef.current?.click()}
                      className="w-full min-h-[38px] px-3 rounded-xl bg-white hover:bg-surface-container border border-border-specular font-bold text-xs text-on-surface flex items-center justify-center gap-1.5 active:scale-95 shadow-sm transition-all"
                    >
                      {uploading ? <Loader2 size={14} className="animate-spin text-primary" /> : <Upload size={14} className="text-primary" />}
                      <span>Pilih Foto dari Perangkat</span>
                    </button>
                    <input
                      type="text"
                      placeholder="Atau masukkan URL foto"
                      value={modal.photo_url ?? ""}
                      onChange={(e) => setModal({ ...modal, photo_url: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg bg-white/60 border border-border-specular text-xs text-on-surface placeholder:text-text-muted focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center gap-2 pt-2 border-t border-border-subtle">
              <button
                type="button"
                onClick={() => setModal(null)}
                className="flex-1 min-h-[46px] rounded-full bg-white hover:bg-surface-container text-on-surface border border-border-specular text-xs font-bold active:scale-95 transition-all shadow-sm"
              >
                Batal
              </button>

              {modal.id && (
                <button
                  type="button"
                  onClick={() => modal.id && del(modal.id)}
                  className="px-4 min-h-[46px] rounded-full border border-danger/30 text-danger hover:bg-danger/10 text-xs font-bold active:scale-95 transition-all flex items-center gap-1"
                >
                  <Trash2 size={14} />
                  <span>Hapus</span>
                </button>
              )}

              <button
                type="button"
                onClick={save}
                className="flex-1 min-h-[46px] rounded-full cta-gradient-btn text-white text-xs font-extrabold shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                <CheckCheck size={16} />
                <span>Simpan Menu</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
