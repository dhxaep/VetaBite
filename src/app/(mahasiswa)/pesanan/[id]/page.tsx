"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Clock3,
  Store,
  Flame,
  Check,
  ShoppingBag,
  QrCode,
  LifeBuoy,
  MapPin,
  Loader2,
  CheckCircle2,
  User,
  BellRing,
} from "lucide-react";
import { api } from "@/lib/api";
import { formatRupiah } from "@/lib/rupiah";
import { SkeletonList, ErrorState } from "@/components/shared/States";
import { startAlarm, stopAlarm, onAlarmChange } from "@/lib/alarm";

type OrderItem = {
  qty: number;
  name?: string;
  name_snapshot?: string;
  price?: number;
  price_snapshot?: number;
};

type OrderData = {
  id: string;
  queue_number?: string;
  queueNumber?: string;
  buyer_name?: string;
  buyer?: { full_name?: string; username?: string };
  order_status?: string;
  status?: string;
  payment_method?: string;
  payment_status?: string;
  total_price?: number;
  totalPrice?: number;
  canteen_name?: string;
  canteen?: { name: string; description?: string };
  items?: OrderItem[];
  order_items?: OrderItem[];
};

const STEPS = ["ANTRIAN", "MASAK", "SIAP_AMBIL"];
const STEP_LABEL: Record<string, string> = {
  ANTRIAN: "Pesanan Dikirim & Menunggu Konfirmasi",
  MASAK: "Sedang Dimasak & Disiapkan Dapur",
  SIAP_AMBIL: "Siap Diambil di Loket Kantin",
  PICKED_UP: "Pesanan Selesai Diambil",
};

export default function OrderTrackingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const r = useRouter();
  const [o, setO] = useState<OrderData | null>(null);
  const [e, setE] = useState("");
  const [ok, setOk] = useState(false);
  const [alarmRinging, setAlarmRinging] = useState(false);

  useEffect(() => {
    return onAlarmChange(setAlarmRinging);
  }, []);

  async function load() {
    setE("");
    try {
      const data = await api<OrderData>(`/api/orders/${id}`);
      setO(data);
    } catch (err: unknown) {
      setE(err instanceof Error ? err.message : String(err));
    }
  }

  useEffect(() => {
    load();

    // Auto reload berkala setiap 4 detik (Auto-sync)
    const reloadTimer = setInterval(() => {
      load();
    }, 4000);

    const onVisible = () => {
      if (document.visibilityState === "visible") load();
    };
    window.addEventListener("focus", onVisible);
    document.addEventListener("visibilitychange", onVisible);

    const es = new EventSource(`/api/sse/order/${id}`);
    es.onmessage = (ev) => {
      try {
        const j = JSON.parse(ev.data);
        const d = j.data || j;
        setO((p) => {
          const nextStatus = d.order_status || d.status || p?.order_status;
          if (nextStatus === "SIAP_AMBIL") {
            startAlarm("Pesanan Anda Siap Diambil di Loket!");
          } else if (nextStatus === "PICKED_UP" || nextStatus === "SELESAI") {
            stopAlarm();
          }
          return p ? { ...p, ...d, order_status: nextStatus } : d;
        });
      } catch {}
    };
    es.onerror = () => es.close();

    return () => {
      clearInterval(reloadTimer);
      window.removeEventListener("focus", onVisible);
      document.removeEventListener("visibilitychange", onVisible);
      es.close();
      stopAlarm();
    };
  }, [id]);

  useEffect(() => {
    if (o?.order_status === "SIAP_AMBIL" || o?.status === "SIAP_AMBIL") {
      startAlarm("Pesanan Anda Siap Diambil di Loket!");
    } else if (o?.order_status === "PICKED_UP" || o?.order_status === "SELESAI") {
      stopAlarm();
    }
  }, [o?.order_status, o?.status]);

  async function pickup() {
    stopAlarm();
    setOk(true);
    try {
      await api(`/api/orders/${id}/pickup`, { method: "PATCH" });
      setO((p) => (p ? { ...p, order_status: "PICKED_UP" } : null));
    } catch (err: unknown) {
      setE(err instanceof Error ? err.message : String(err));
    } finally {
      setOk(false);
    }
  }

  if (!o && !e) {
    return (
      <div className="p-4">
        <SkeletonList n={3} />
      </div>
    );
  }

  if (e && !o) return <ErrorState msg={e} onRetry={load} />;
  if (!o) return null;

  const st = o.order_status || o.status || "ANTRIAN";
  const idx = STEPS.indexOf(st);
  const ready = st === "SIAP_AMBIL";
  const done = st === "PICKED_UP" || st === "SELESAI";
  const items = o.items || o.order_items || [];

  return (
    <div className="flex flex-col pb-20 px-space-lg">
      {/* Alarm Banner Berdering Keras saat Siap Ambil */}
      {alarmRinging && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[70] w-[92%] max-w-[400px] liquid-glass rounded-2xl p-3.5 shadow-2xl flex items-center justify-between gap-3 border-2 border-danger bg-red-500/20 backdrop-blur-xl animate-pulse">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-10 h-10 rounded-full bg-danger text-white flex items-center justify-center shrink-0">
              <BellRing className="w-5 h-5 animate-bounce" />
            </span>
            <div className="min-w-0">
              <h4 className="text-xs font-extrabold text-on-surface truncate">Pesanan Anda Siap Diambil!</h4>
              <p className="text-[10px] text-text-muted leading-tight">Alarm berdering terus sampai Anda konfirmasi selesai</p>
            </div>
          </div>
          <button
            type="button"
            onClick={pickup}
            className="px-3.5 py-2 rounded-full bg-danger hover:bg-red-700 text-white text-xs font-extrabold shrink-0 shadow-md active:scale-95 transition-all"
          >
            Selesaikan
          </button>
        </div>
      )}
      {/* Top Header */}
      <header className="sticky top-0 z-40 -mx-space-lg px-space-lg pt-4 pb-3 bg-surface-glass-alt backdrop-blur-xl border-b border-border-specular flex items-center justify-between shadow-sm">
        <button
          aria-label="Kembali"
          onClick={() => r.back()}
          className="w-9 h-9 rounded-full liquid-glass flex items-center justify-center text-on-surface active:scale-95 transition-transform"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="text-center">
          <h1 className="font-headline-md text-headline-md font-extrabold text-on-surface tracking-tight">
            Pelacakan Status Pesanan
          </h1>
          <p className="font-label-micro text-label-micro text-text-muted uppercase tracking-wider">
            UPN Veteran Jakarta • Live SSE
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/25">
          <span className="w-2 h-2 rounded-full bg-primary pulse-ring" />
          <span className="font-label-micro text-label-micro text-primary uppercase font-extrabold tracking-wider">
            LIVE
          </span>
        </div>
      </header>

      {/* Main Content */}
      <div className="pt-4 flex flex-col gap-4">
        {e && <ErrorState msg={e} onRetry={load} />}

        {/* Hero Queue Number Card */}
        <section className="liquid-glass-accent rounded-[24px] p-5 relative overflow-hidden shadow-lg">
          <div className="absolute -right-8 -top-8 w-36 h-36 bg-gradient-to-br from-[#FF8A00]/25 to-[#E03A00]/15 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-start justify-between relative z-10">
            <div>
              <span className="font-label-sm text-label-sm text-text-muted uppercase tracking-wider block font-bold">
                Nomor Antrean Anda
              </span>
              <div className="text-[44px] leading-[48px] font-extrabold tracking-tight text-primary mt-1">
                #{o.queue_number || o.queueNumber || "A-001"}
              </div>
            </div>
            <div className="liquid-glass px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-xs">
              <Clock3 className="w-3.5 h-3.5 text-primary" />
              <span className="font-label-sm text-label-sm font-bold text-on-surface">
                {ready ? "Siap Diambil" : done ? "Selesai" : "Siap ~8 Menit"}
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3.5 border-t border-border-subtle flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 text-primary">
                <Store className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-headline-sm text-headline-sm font-extrabold text-on-surface truncate">
                  {o.canteen?.name || o.canteen_name || "Loket Kantin"}
                </h2>
                <p className="font-body-sm text-body-sm text-text-muted truncate">ID: #{o.id.slice(0, 8)}</p>
              </div>
            </div>
            <div className="liquid-glass px-3 py-1.5 rounded-xl border border-border-specular flex items-center gap-2 shrink-0">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <User className="w-3.5 h-3.5" />
              </div>
              <div className="text-left">
                <span className="text-[10px] uppercase font-bold text-text-muted block">Pelanggan</span>
                <span className="text-xs font-extrabold text-on-surface block truncate max-w-[120px]">
                  {o.buyer_name || o.buyer?.full_name || o.buyer?.username || "Mahasiswa"}
                </span>
              </div>
            </div>
          </div>

          {!done && (
            <div className="mt-3.5 p-3 rounded-2xl bg-gradient-to-r from-primary/10 via-secondary-container/15 to-primary/10 border border-primary/25 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center pulse-ring">
                  <Flame className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-label-sm text-label-sm text-primary font-extrabold">{STEP_LABEL[st] || st}</div>
                  <div className="font-body-sm text-body-sm text-text-muted">
                    {o.payment_method ? `Metode: ${o.payment_method}` : "Sedang diproses loket"}
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Real-time Dapur Progress Stepper */}
        <section className="liquid-glass rounded-[24px] p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-primary" />
              <h3 className="font-headline-sm text-headline-sm font-extrabold text-on-surface">
                Progres Dapur Real-Time
              </h3>
            </div>
            <span className="font-label-micro text-label-micro text-text-muted">SSE Terhubung</span>
          </div>

          <div className="relative pl-2">
            <div className="absolute left-[19px] top-4 bottom-5 w-0.5 bg-gradient-to-b from-success via-primary to-outline-variant" />
            <div className="space-y-4 relative">
              {STEPS.map((s, i) => {
                const active = i <= (idx < 0 ? 0 : idx);
                const cur = i === (idx < 0 ? 0 : idx) && !done;
                return (
                  <div
                    key={s}
                    className={`flex items-start gap-3.5 ${
                      cur ? "p-2.5 -ml-1 rounded-2xl bg-white/80 border border-primary/30 shadow-sm" : ""
                    }`}
                  >
                    <div
                      className={`relative z-10 w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                        done || active
                          ? "bg-success text-white shadow-sm"
                          : "bg-surface-container-high border border-outline-variant text-text-muted"
                      }`}
                    >
                      {done || active ? <Check className="w-4 h-4" /> : <ShoppingBag className="w-3.5 h-3.5" />}
                    </div>
                    <div className="flex-1 flex items-baseline justify-between pt-0.5">
                      <div>
                        <div
                          className={`font-body-md text-body-md ${
                            cur ? "text-primary font-extrabold" : active ? "font-bold text-on-surface" : "text-text-muted"
                          }`}
                        >
                          {STEP_LABEL[s]}
                        </div>
                      </div>
                      {cur && (
                        <span className="font-label-micro text-label-micro text-primary font-extrabold ml-2 bg-primary/10 px-2 py-0.5 rounded-full">
                          SEKARANG
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              <div className="flex items-start gap-3.5">
                <div
                  className={`relative z-10 w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    done
                      ? "bg-success text-white shadow-sm"
                      : "bg-surface-container-high border border-outline-variant text-text-muted"
                  }`}
                >
                  {done ? <Check className="w-4 h-4" /> : <ShoppingBag className="w-3.5 h-3.5" />}
                </div>
                <div className="flex-1 pt-0.5">
                  <div className={`font-body-md text-body-md ${done ? "font-bold text-success" : "text-text-muted"}`}>
                    {done ? "Pesanan Selesai Diambil" : "Ambil Pesanan di Counter"}
                  </div>
                  <p className="font-body-sm text-body-sm text-text-muted">
                    {done
                      ? "Terima kasih telah memesan di VetaBite!"
                      : "Tunjukkan nomor antrean ini saat dipanggil oleh Ibu Kantin"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Order Items Breakdown */}
        <section className="liquid-glass rounded-[22px] p-4 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
            <div>
              <span className="font-headline-sm text-headline-sm font-extrabold text-on-surface block">Rincian Pesanan</span>
              <span className="text-xs text-text-muted font-medium">
                Nama Pelanggan: <b className="text-on-surface">{o.buyer_name || o.buyer?.full_name || o.buyer?.username || "Mahasiswa"}</b>
              </span>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="font-label-micro text-label-micro px-2 py-0.5 rounded-full bg-success/15 text-success font-extrabold border border-success/20">
                {o.payment_method || "QRIS"}
              </span>
              <span className="text-[10px] text-text-muted font-mono">#{o.id.slice(0, 8)}</span>
            </div>
          </div>

          <div className="mt-3 space-y-2">
            {items.map((it, i) => (
              <div key={i} className="flex justify-between font-body-md text-body-md text-on-surface">
                <span>
                  {it.qty}x {it.name || it.name_snapshot}
                </span>
                <span className="font-bold">
                  {formatRupiah(Number(it.price || it.price_snapshot || 0) * Number(it.qty || 1))}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-3 pt-3 border-t border-dashed border-outline-variant flex justify-between items-center">
            <span className="font-body-md text-body-md text-text-muted">Total Pembayaran</span>
            <span className="font-headline-md text-headline-md font-extrabold text-primary">
              {formatRupiah(Number(o.total_price || o.totalPrice || 0))}
            </span>
          </div>
        </section>

        {/* Action Controls */}
        <section className="flex flex-col gap-2.5 mt-1">
          {ready && (
            <button
              type="button"
              onClick={pickup}
              disabled={ok}
              className="w-full py-4 px-5 rounded-full flex items-center justify-center gap-2.5 font-headline-sm text-headline-sm font-extrabold shadow-xl active:scale-95 disabled:opacity-50 transition-all cta-gradient-btn text-white animate-pulse"
            >
              {ok ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <BellRing className="w-5 h-5 animate-bounce text-white" />
                  <span>Matikan Alarm &amp; Selesaikan Pesanan</span>
                </>
              )}
            </button>
          )}

          {done && (
            <div className="liquid-glass rounded-2xl p-4 flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/30">
              <CheckCircle2 className="w-6 h-6 text-success flex-shrink-0" />
              <div>
                <h4 className="font-headline-sm text-headline-sm font-extrabold text-on-surface">Pesanan Selesai</h4>
                <p className="font-body-sm text-body-sm text-text-muted">Selamat menikmati hidangan kantin UPNVJ!</p>
              </div>
            </div>
          )}

          <div className="liquid-glass rounded-2xl p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <MapPin className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="font-label-sm text-label-sm font-bold text-on-surface">Ambil di Counter Loket</div>
              <div className="font-body-sm text-body-sm text-text-muted">
                Siapkan layar ini saat nomor #{o.queue_number || "A-001"} dipanggil
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
