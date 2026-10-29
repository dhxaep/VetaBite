"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Lock,
  Store,
  Minus,
  Plus,
  Trash2,
  NotebookPen,
  QrCode,
  Banknote,
  ShieldCheck,
  CheckCircle2,
  ReceiptText,
  RefreshCw,
  Info,
  ArrowRight,
  Soup,
  Upload,
  Loader2,
  Download,
} from "lucide-react";
import { loadCart, saveCart, clearCart, cartTotal, Cart } from "@/lib/cart";
import { formatRupiah } from "@/lib/rupiah";
import { api } from "@/lib/api";
import { EmptyState, ErrorState } from "@/components/shared/States";

export default function CartPage() {
  const r = useRouter();
  const [cart, setCart] = useState<Cart | null>(null);
  const [canteenQris, setCanteenQris] = useState<string>("/images/qris-code.svg");
  const [ready, setReady] = useState(false);
  const [pay, setPay] = useState("QRIS");
  const [file, setFile] = useState<File | null>(null);
  const [prev, setPrev] = useState("");
  const [proof, setProof] = useState("");
  const [up, setUp] = useState(false);
  const [e, setE] = useState("");
  const [co, setCo] = useState(false);

  useEffect(() => {
    const c = loadCart();
    setCart(c);
    setReady(true);
    if (c?.canteen_id) {
      api<{ canteen: { qris_image_url?: string } }>(`/api/canteens/${c.canteen_id}`)
        .then((res) => {
          if (res?.canteen?.qris_image_url) {
            setCanteenQris(res.canteen.qris_image_url);
          }
        })
        .catch(() => {});
    }
  }, []);

  function upd(i: number, d: number, note?: string) {
    if (!cart) return;
    const c = {
      ...cart,
      items: cart.items.map((it, j) =>
        j === i ? { ...it, qty: Math.max(0, it.qty + d), ...(note !== undefined ? { note } : {}) } : it
      ),
    };
    c.items = c.items.filter((it) => it.qty > 0);
    const n = c.items.length ? c : null;
    setCart(n);
    saveCart(n);
  }

  async function upload(f: File) {
    setE("");
    if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) {
      setE("Format bukti harus JPG, PNG, atau WEBP.");
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setE("Ukuran bukti maksimal 5 MB.");
      return;
    }
    setFile(f);
    setPrev(URL.createObjectURL(f));
    setUp(true);
    try {
      const fd = new FormData();
      fd.append("file", f);
      const res = await fetch("/api/uploads/payment-proof", {
        method: "POST",
        body: fd,
        credentials: "include",
      });
      const j = await res.json();
      if (!res.ok || j.success === false) throw new Error(j?.error?.message || "Gagal mengunggah bukti.");
      setProof(j.data.fileUrl);
    } catch (err: unknown) {
      setE(err instanceof Error ? err.message : String(err));
      setProof("");
    } finally {
      setUp(false);
    }
  }

  async function checkout() {
    if (!cart || !proof || co) return;
    setE("");
    setCo(true);
    try {
      const d = await api<{ order_id?: string; id?: string }>("/api/orders", {
        method: "POST",
        body: JSON.stringify({
          canteen_id: cart.canteen_id,
          items: cart.items.map((i) => ({ menu_item_id: i.menu_item_id, qty: i.qty, note: i.note || "" })),
          payment_method: pay,
          payment_proof_url: proof,
        }),
      });
      clearCart();
      r.push(`/pesanan/${d.order_id || d.id}`);
    } catch (err: unknown) {
      setE(err instanceof Error ? err.message : String(err));
    } finally {
      setCo(false);
    }
  }

  if (!ready) return null;
  if (!cart || cart.items.length === 0) {
    return (
      <div className="p-4">
        <EmptyState title="Keranjang masih kosong" desc="Yuk jelajahi loket kantin dan tambahkan menu favoritmu." />
      </div>
    );
  }

  const total = cartTotal(cart);

  return (
    <div className="flex flex-col pb-16 px-space-lg">
      {/* Top App Bar */}
      <header className="sticky top-0 z-40 -mx-space-lg px-space-lg py-3 bg-surface-glass-alt backdrop-blur-xl border-b border-border-specular flex items-center justify-between shadow-sm">
        <button
          aria-label="Kembali ke Menu"
          onClick={() => r.back()}
          className="liquid-glass-pill w-9 h-9 rounded-full flex items-center justify-center active:scale-95 transition-transform"
          type="button"
        >
          <ArrowLeft className="w-5 h-5 text-on-surface" />
        </button>
        <div className="flex flex-col items-center">
          <h1 className="font-headline-md text-headline-md font-extrabold text-on-surface tracking-tight">
            Keranjang &amp; Checkout
          </h1>
          <span className="font-label-micro text-label-micro text-text-muted">{cart.canteen_name}</span>
        </div>
        <div className="w-9 h-9 rounded-full flex items-center justify-center liquid-glass-pill text-text-muted">
          <Lock className="w-4 h-4" />
        </div>
      </header>

      {/* Content Body */}
      <div className="pt-4 space-y-4">
        {e && <ErrorState msg={e} onRetry={() => setE("")} />}

        {/* Canteen Header Info */}
        <section className="liquid-glass-card rounded-[18px] p-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="bg-primary text-white font-label-micro text-label-micro px-2 py-0.5 rounded-full uppercase font-bold">
                  Loket Aktif
                </span>
                <span className="font-label-sm text-label-sm text-success flex items-center font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-success mr-1" />
                  Buka
                </span>
              </div>
              <h2 className="font-headline-sm text-headline-sm font-extrabold text-on-surface">{cart.canteen_name}</h2>
            </div>
          </div>
          <div className="liquid-glass-pill px-2.5 py-1 rounded-full font-label-micro text-label-micro text-text-muted">
            Siap ~8 Menit
          </div>
        </section>

        {/* Order Items */}
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-headline-sm text-headline-sm font-extrabold text-on-surface">
              Item Pesanan ({cart.items.reduce((a, i) => a + i.qty, 0)})
            </h3>
          </div>

          {cart.items.map((it, i) => (
            <article key={it.menu_item_id} className="liquid-glass-card rounded-[18px] p-3.5 space-y-3 shadow-sm">
              <div className="flex items-start space-x-3">
                <img
                  src={
                    it.photo_url ||
                    "https://lh3.googleusercontent.com/aida-public/AB6AXuDONUCpglL6jc-58eEFB9jmnxQIbojv28_kmIw_3_cOique7XHmwaWM2_GidCmfRafjTuZJaorhpiVxsItRpSbieUWQT8jR0crmX2VGi-m2rj1-150lHILHHQBL8twqncJOSKjfIhXCKvgpqHIvzCvs6sutxYWCrwTJ2_LKQlZFkQJokJfZVsJJX0fM0GO-EHibCrRrHOrqJVecR6roeobFxvqyhFeJWm4-LDX1oyFb"
                  }
                  alt={it.name}
                  className="w-20 h-20 rounded-xl object-cover border border-white/80 shadow-sm flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <h4 className="font-headline-sm text-headline-sm text-on-surface font-extrabold truncate">
                      {it.qty}x {it.name}
                    </h4>
                    <button
                      aria-label="Hapus item"
                      onClick={() => upd(i, -it.qty)}
                      className="text-text-muted hover:text-danger active:scale-90 transition-transform p-1"
                      type="button"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="mt-2.5 flex items-center justify-between">
                    <span className="font-label-lg text-label-lg font-extrabold text-primary">
                      {formatRupiah(it.price * it.qty)}
                    </span>
                    <div className="liquid-glass-pill rounded-full p-1 flex items-center space-x-2 border border-border-specular">
                      <button
                        aria-label="Kurangi kuantitas"
                        onClick={() => upd(i, -1)}
                        className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-on-surface font-bold text-xs shadow-xs active:scale-90 transition-transform"
                        type="button"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="font-label-md text-label-md font-bold text-on-surface w-4 text-center">
                        {it.qty}
                      </span>
                      <button
                        aria-label="Tambah kuantitas"
                        onClick={() => upd(i, 1)}
                        className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs shadow-xs active:scale-90 transition-transform"
                        type="button"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Note for Seller */}
              <div className="bg-surface-container-low/60 rounded-xl p-2.5 border border-border-subtle flex items-start gap-2">
                <NotebookPen className="w-4 h-4 text-text-muted mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <label className="font-label-micro text-label-micro text-text-muted block">Catatan untuk Penjual:</label>
                  <input
                    value={it.note || ""}
                    onChange={(ev) => upd(i, 0, ev.target.value)}
                    placeholder="Contoh: jangan terlalu pedas, kuah dipisah"
                    className="w-full bg-transparent border-0 p-0 font-body-sm text-body-sm text-on-surface placeholder:text-text-muted focus:ring-0 focus:outline-none"
                  />
                </div>
              </div>
            </article>
          ))}
        </section>

        {/* Price Breakdown */}
        <section className="liquid-glass-card rounded-[18px] p-4 space-y-2.5 shadow-sm">
          <h3 className="font-headline-sm text-headline-sm font-extrabold text-on-surface border-b border-border-subtle pb-2 flex justify-between">
            <span>Rincian Pembayaran</span>
            <span className="font-body-sm text-body-sm text-text-muted font-normal">{cart.canteen_name}</span>
          </h3>
          <div className="flex justify-between font-body-md text-body-md text-text-muted">
            <span>Subtotal Makanan &amp; Minuman</span>
            <span className="text-on-surface font-semibold">{formatRupiah(total)}</span>
          </div>
          <div className="flex justify-between font-body-md text-body-md text-text-muted">
            <span>Biaya Layanan Kampus</span>
            <span className="text-success font-semibold">Gratis (Rp 0)</span>
          </div>
          <div className="border-t border-dashed border-outline-variant pt-2.5 flex justify-between items-center">
            <div>
              <span className="font-headline-sm text-headline-sm font-extrabold text-on-surface block">
                Total Pembayaran
              </span>
              <span className="font-label-micro text-label-micro text-text-muted">
                Termasuk PPN &amp; Retribusi Kantin UPNVJ
              </span>
            </div>
            <span className="text-xl font-extrabold text-primary tracking-tight">{formatRupiah(total)}</span>
          </div>
        </section>

        {/* Payment Method Selector */}
        <section className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-headline-sm text-headline-sm font-extrabold text-on-surface">Metode Pembayaran</h3>
            <span className="font-label-micro text-label-micro bg-surface-container-high px-2 py-0.5 rounded-full text-text-muted font-bold">
              Pilih 1 Opsi
            </span>
          </div>

          <div
            onClick={() => setPay("QRIS")}
            className={`liquid-glass-card rounded-[18px] p-4 cursor-pointer transition-all ${
              pay === "QRIS" ? "border-2 border-primary/50 shadow-md" : "opacity-85"
            }`}
          >
            <label className="flex items-start justify-between cursor-pointer">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mt-0.5">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-headline-sm text-headline-sm font-extrabold text-on-surface block">
                    QRIS Dinamis (UPNVJ Pay / All E-Wallet)
                  </span>
                  <span className="font-body-sm text-body-sm text-text-muted block">
                    BCA, Mandiri, GoPay, OVO, ShopeePay, DANA
                  </span>
                </div>
              </div>
              <div
                className={`w-5 h-5 rounded-full border-2 mt-1 flex items-center justify-center p-0.5 ${
                  pay === "QRIS" ? "border-primary" : "border-outline"
                }`}
              >
                {pay === "QRIS" && <div className="w-full h-full bg-primary rounded-full" />}
              </div>
            </label>

            {pay === "QRIS" && (
              <div className="mt-4 pt-3.5 border-t border-border-subtle bg-white/70 rounded-2xl p-4 flex flex-col items-center text-center gap-3 shadow-inner">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-extrabold text-on-surface">
                    Pindai QRIS Gerai {cart.canteen_name}
                  </span>
                </div>

                {/* QR Code Frame */}
                <div className="relative group p-3 bg-white rounded-2xl border-2 border-primary/20 shadow-md">
                  <img
                    src={canteenQris || cart.qris_image_url || "/images/qris-code.svg"}
                    alt={`Kode QRIS ${cart.canteen_name}`}
                    className="w-48 h-48 sm:w-56 sm:h-56 object-contain rounded-xl"
                  />
                  <div className="mt-1 flex items-center justify-center gap-1 text-[10px] text-text-muted font-bold">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Terverifikasi Merchant UPNVJ</span>
                  </div>
                </div>

                {/* Amount & Download Action */}
                <div className="w-full bg-surface-container-low/80 rounded-xl p-2.5 border border-border-specular flex items-center justify-between">
                  <div className="text-left">
                    <span className="text-[10px] text-text-muted block font-bold uppercase tracking-wider">
                      Nominal Pas Bayar
                    </span>
                    <span className="text-base font-extrabold text-primary">
                      {formatRupiah(total)}
                    </span>
                  </div>
                  <a
                    href={canteenQris || cart.qris_image_url || "/images/qris-code.svg"}
                    download={`QRIS-${cart.canteen_name.replace(/\s+/g, "_")}.png`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-full bg-white hover:bg-surface-container border border-border-specular text-xs font-bold text-on-surface flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
                  >
                    <Download className="w-3.5 h-3.5 text-primary" />
                    <span>Unduh QR</span>
                  </a>
                </div>

                <div className="w-full bg-amber-500/10 border border-amber-500/20 rounded-xl p-2.5 text-left text-[11px] text-text-muted space-y-1">
                  <p className="font-bold text-on-surface flex items-center gap-1">
                    <Info className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>Petunjuk Pembayaran:</span>
                  </p>
                  <ol className="list-decimal list-inside space-y-0.5 text-[10px] pl-1">
                    <li>Pindai QR di atas menggunakan GoPay, OVO, BCA, Mandiri, dll.</li>
                    <li>Pastikan nominal transfer sesuai: <b>{formatRupiah(total)}</b>.</li>
                    <li>Simpan tangkapan layar bukti transfer dan unggah pada formulir di bawah.</li>
                  </ol>
                </div>
              </div>
            )}
          </div>

          <div
            onClick={() => setPay("TUNAI")}
            className={`liquid-glass-card rounded-[18px] p-3.5 cursor-pointer transition-all ${
              pay === "TUNAI" ? "border-2 border-primary/50 shadow-md" : "opacity-75"
            }`}
          >
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-surface-container-high border flex items-center justify-center text-text-muted">
                  <Banknote className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-headline-sm text-headline-sm font-extrabold text-on-surface block">
                    Tunai di Loket
                  </span>
                  <span className="font-body-sm text-body-sm text-text-muted block">
                    Bayar langsung saat mengambil pesanan
                  </span>
                </div>
              </div>
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center p-0.5 ${
                  pay === "TUNAI" ? "border-primary" : "border-outline"
                }`}
              >
                {pay === "TUNAI" && <div className="w-full h-full bg-primary rounded-full" />}
              </div>
            </label>
          </div>
        </section>

        {/* Mandatory Proof Upload Gate (Layar 08 Rule) */}
        <section className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <h3 className="font-headline-sm text-headline-sm font-extrabold text-on-surface">
                Verifikasi Bukti Pembayaran
              </h3>
            </div>
            <span className="font-label-micro text-label-micro bg-danger text-white px-2 py-0.5 rounded-full font-bold uppercase">
              Wajib Unggah
            </span>
          </div>

          <div className="liquid-glass-card rounded-[18px] p-3.5 space-y-3">
            <div className="liquid-glass-dashed rounded-xl p-4 flex flex-col items-center text-center gap-2 relative">
              {!proof ? (
                <label className="w-full cursor-pointer">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(ev) => {
                      const f = ev.target.files?.[0];
                      if (f) upload(f);
                    }}
                  />
                  <div className="flex flex-col items-center gap-2">
                    {up ? (
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    ) : (
                      <Upload className="w-8 h-8 text-primary" />
                    )}
                    <span className="font-headline-sm text-headline-sm font-extrabold text-on-surface">
                      Ketuk untuk unggah bukti transfer / struk
                    </span>
                    <p className="font-body-sm text-body-sm text-text-muted">Format JPG, PNG, atau WEBP (maks. 5 MB)</p>
                  </div>
                </label>
              ) : (
                <>
                  <div className="w-11 h-11 rounded-full bg-success/15 border border-success/30 flex items-center justify-center text-success">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div className="space-y-0.5">
                    <span className="font-headline-sm text-headline-sm font-extrabold text-on-surface block">
                      Bukti Transfer Terlampir
                    </span>
                    <p className="font-body-sm text-body-sm text-text-muted">Siap diverifikasi oleh loket kantin</p>
                  </div>
                  {prev && <img src={prev} alt="Bukti bayar" className="w-full max-h-48 object-cover rounded-xl border shadow-sm" />}
                  <div className="w-full bg-white/80 rounded-xl p-2.5 border flex items-center justify-between shadow-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <ReceiptText className="w-5 h-5 text-primary flex-shrink-0" />
                      <div className="text-left truncate">
                        <span className="text-xs font-bold block truncate">{file?.name || "bukti-bayar"}</span>
                        <span className="font-label-micro text-label-micro text-success font-bold">
                          Berhasil Diunggah
                        </span>
                      </div>
                    </div>
                    <label className="liquid-glass-pill px-2.5 py-1 rounded-full text-[11px] text-primary font-bold flex items-center gap-1 cursor-pointer hover:bg-white transition-colors">
                      <RefreshCw className="w-3 h-3" />
                      <span>Ganti</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={(ev) => {
                          const f = ev.target.files?.[0];
                          if (f) upload(f);
                        }}
                      />
                    </label>
                  </div>
                </>
              )}

              <div className="flex items-center gap-1 font-body-sm text-body-sm text-text-muted pt-1">
                <Info className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                <span>Pastikan nominal {formatRupiah(total)} dan waktu transfer terbaca jelas.</span>
              </div>
            </div>
          </div>
        </section>

        {/* Submit Button (Locked unless proof uploaded) */}
        <section className="pt-2 pb-6 space-y-2.5">
          <button
            onClick={checkout}
            disabled={co || !proof}
            className="w-full h-12 rounded-full primary-cta-gloss text-white font-headline-sm text-headline-sm font-extrabold flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 transition-all shadow-xl"
          >
            {co ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <span>Kirim Pesanan ke Ibu Kantin</span>
                <span className="font-normal text-white/70">|</span>
                <span className="font-extrabold">{formatRupiah(total)}</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
          <div className="flex items-center justify-center gap-1.5 text-center font-body-sm text-body-sm text-text-muted px-2">
            <Soup className="w-3.5 h-3.5 text-tertiary flex-shrink-0" />
            <span>Pesanan otomatis masuk ke antrean dapur {cart.canteen_name}</span>
          </div>
        </section>
      </div>
    </div>
  );
}
