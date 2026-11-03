"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { BellRing, UtensilsCrossed, X, Clock, User, DollarSign } from "lucide-react";
import { startAlarm, stopAlarm } from "@/lib/alarm";
import { formatRupiah } from "@/lib/rupiah";
import { api } from "@/lib/api";

export interface NewOrderData {
  order_id: string;
  queue_number: string;
  buyer_name?: string;
  buyer_nim?: string;
  total_price?: number;
  items_count?: number;
  ordered_at?: string;
}

export function SellerOrderNotificationPopup() {
  const router = useRouter();
  const pathname = usePathname();
  const [activeOrder, setActiveOrder] = useState<NewOrderData | null>(null);
  const [canteenId, setCanteenId] = useState<string | null>(null);
  const knownOrderIds = useRef<Set<string>>(new Set());

  // Load canteen ID untuk koneksi SSE
  useEffect(() => {
    let mounted = true;
    api<{ canteen?: { id: string } }>("/api/seller/canteen")
      .then((res) => {
        if (mounted && res?.canteen?.id) {
          setCanteenId(res.canteen.id);
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const triggerNotification = useCallback((order: NewOrderData) => {
    if (!order.queue_number) return;
    setActiveOrder(order);
    startAlarm(`Pesanan Baru: #${order.queue_number}!`);
  }, []);

  // 1. Listen custom event dari halaman /seller/pesanan
  useEffect(() => {
    const handleCustomEvent = (e: Event) => {
      const customEvent = e as CustomEvent<NewOrderData>;
      if (customEvent.detail) {
        triggerNotification(customEvent.detail);
      }
    };

    window.addEventListener("vetabite:new-order", handleCustomEvent);
    return () => {
      window.removeEventListener("vetabite:new-order", handleCustomEvent);
    };
  }, [triggerNotification]);

  // 2. SSE Listener real-time di level layout
  useEffect(() => {
    if (!canteenId) return;
    const es = new EventSource(`/api/sse/canteen/${canteenId}`);

    es.addEventListener("new_order", (ev: MessageEvent) => {
      try {
        const j = JSON.parse(ev.data) as NewOrderData;
        triggerNotification(j);
      } catch {
        triggerNotification({
          order_id: "new",
          queue_number: "BARU",
          buyer_name: "Mahasiswa",
        });
      }
    });

    es.onerror = () => {};
    return () => es.close();
  }, [canteenId, triggerNotification]);

  const handleClose = () => {
    stopAlarm();
    setActiveOrder(null);
  };

  const handleOpenAndCook = () => {
    stopAlarm();
    setActiveOrder(null);
    if (pathname !== "/seller/pesanan") {
      router.push("/seller/pesanan");
    }
  };

  if (!activeOrder) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 modal-smooth-enter"
    >
      <div className="w-full max-w-[390px] bg-surface-glass-alt backdrop-blur-2xl rounded-[32px] border-2 border-white/90 shadow-2xl p-6 text-on-surface relative overflow-hidden flex flex-col items-center text-center">
        {/* Glow ambient background */}
        <div className="absolute -top-10 -right-10 w-36 h-36 bg-primary/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-secondary/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button pojok kanan atas */}
        <button
          type="button"
          onClick={handleClose}
          aria-label="Tutup Notifikasi"
          className="absolute top-4 right-4 w-8 h-8 rounded-full border border-border-specular flex items-center justify-center text-text-muted hover:text-on-surface hover:bg-white/40 transition-all active:scale-95"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon Notifikasi dengan pulse */}
        <div className="relative mb-3 mt-1">
          <div className="w-16 h-16 rounded-2xl cta-gradient flex items-center justify-center text-white shadow-xl shadow-orange-950/20 animate-bounce">
            <BellRing className="w-8 h-8" />
          </div>
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white shadow-xs" />
          </span>
        </div>

        {/* Title & Badge */}
        <span className="text-[11px] font-extrabold uppercase tracking-wider text-primary bg-primary/10 px-3 py-0.5 rounded-full border border-primary/20 mb-1">
          Pesanan Baru Masuk
        </span>
        <h2 className="font-headline-lg text-lg font-extrabold text-on-surface">
          Segera Siapkan Pesanan
        </h2>

        {/* Nomor Antrean Besar */}
        <div className="w-full my-3 py-2.5 px-4 rounded-2xl bg-white/70 dark:bg-white/10 border-2 border-primary/30 shadow-inner flex flex-col items-center">
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
            Nomor Antrean
          </span>
          <span className="text-3xl font-extrabold text-primary font-mono tracking-tight mt-0.5">
            #{activeOrder.queue_number}
          </span>
        </div>

        {/* Detail Pembeli & Menu */}
        <div className="w-full bg-surface-container/60 rounded-xl p-3 border border-border-specular text-left space-y-2 mb-4 text-xs">
          <div className="flex items-center gap-2">
            <User className="w-3.5 h-3.5 text-primary flex-shrink-0" />
            <span className="font-bold text-on-surface truncate">
              {activeOrder.buyer_name || "Mahasiswa"}
            </span>
            {activeOrder.buyer_nim && (
              <span className="ml-auto text-[10px] text-text-muted font-mono font-bold">
                {activeOrder.buyer_nim}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-border-specular/60 pt-2 text-[11px]">
            <div className="flex items-center gap-1.5 text-text-muted">
              <Clock className="w-3.5 h-3.5" />
              <span>{activeOrder.items_count || 1} menu dipesan</span>
            </div>
            {activeOrder.total_price !== undefined && (
              <span className="font-extrabold text-primary">
                {formatRupiah(activeOrder.total_price)}
              </span>
            )}
          </div>
        </div>

        {/* Tombol Aksi */}
        <div className="w-full space-y-2">
          <button
            type="button"
            onClick={handleOpenAndCook}
            className="w-full h-11 rounded-2xl cta-gradient text-white font-extrabold text-xs shadow-md hover:brightness-105 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <UtensilsCrossed className="w-4 h-4" />
            <span>Lihat &amp; Masak Sekarang</span>
          </button>

          <button
            type="button"
            onClick={handleClose}
            className="w-full h-9 rounded-xl border border-border-specular text-xs font-semibold text-text-muted hover:text-on-surface active:scale-95 transition-all"
          >
            Matikan Alarm &amp; Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

