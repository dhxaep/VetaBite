"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { BellRing, UtensilsCrossed, X, ChevronRight, User, DollarSign, VolumeX } from "lucide-react";
import { startAlarm, stopAlarm } from "@/lib/alarm";
import { formatRupiah } from "@/lib/rupiah";
import { api } from "@/lib/api";
import { showNativeNotification, requestNotificationPermission } from "@/lib/notifications";

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
  const [isVisible, setIsVisible] = useState(false);
  const [canteenId, setCanteenId] = useState<string | null>(null);
  const acknowledgedSet = useRef<Set<string>>(new Set());

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
    if (order.order_id && acknowledgedSet.current.has(order.order_id)) return;

    setActiveOrder(order);
    setIsVisible(true);

    // 1. Bunyikan Alarm Dapur
    try {
      startAlarm(`Pesanan Baru: #${order.queue_number}!`);
    } catch {}

    // 2. Getar HP Penjual
    try {
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate([200, 100, 200, 100, 200]);
      }
    } catch {}

    // 3. Notifikasi Native Banner HP / Desktop
    try {
      const priceText = order.total_price ? ` • ${formatRupiah(order.total_price)}` : "";
      showNativeNotification(`VetaBite: Pesanan Baru #${order.queue_number}!`, {
        body: `${order.buyer_name || "Mahasiswa"} memesan ${order.items_count || 1} menu${priceText}. Segera siapkan!`,
        tag: `new-order-${order.order_id || Date.now()}`,
      });
    } catch {}
  }, []);

  // 1. Listen custom event dari halaman /seller/pesanan atau tombol tes
  useEffect(() => {
    const handleCustomEvent = (e: Event) => {
      const customEvent = e as CustomEvent<NewOrderData>;
      if (customEvent.detail) {
        triggerNotification(customEvent.detail);
      }
    };

    const handleTestEvent = () => {
      requestNotificationPermission();
      triggerNotification({
        order_id: `test-seller-${Date.now()}`,
        queue_number: "B-008",
        buyer_name: "Dhafa Achmad Ghifari",
        buyer_nim: "2610511070",
        items_count: 2,
        total_price: 32000,
      });
    };

    window.addEventListener("vetabite:new-order", handleCustomEvent);
    window.addEventListener("vetabite:test-seller-banner", handleTestEvent);

    return () => {
      window.removeEventListener("vetabite:new-order", handleCustomEvent);
      window.removeEventListener("vetabite:test-seller-banner", handleTestEvent);
    };
  }, [triggerNotification]);

  // 2. SSE Listener real-time di level layout seller
  useEffect(() => {
    if (!canteenId) return;
    const es = new EventSource(`/api/sse/canteen/${canteenId}`);

    es.addEventListener("new_order", (ev: MessageEvent) => {
      try {
        const j = JSON.parse(ev.data) as NewOrderData;
        triggerNotification(j);
      } catch {
        triggerNotification({
          order_id: `new-${Date.now()}`,
          queue_number: "BARU",
          buyer_name: "Mahasiswa",
        });
      }
    });

    es.onerror = () => {};
    return () => es.close();
  }, [canteenId, triggerNotification]);

  const handleDismiss = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    stopAlarm();
    if (activeOrder?.order_id) {
      acknowledgedSet.current.add(activeOrder.order_id);
    }
    setIsVisible(false);
    setTimeout(() => setActiveOrder(null), 300);
  };

  const handleOpenAndCook = () => {
    stopAlarm();
    if (activeOrder?.order_id) {
      acknowledgedSet.current.add(activeOrder.order_id);
    }
    setIsVisible(false);
    setTimeout(() => setActiveOrder(null), 300);

    if (pathname !== "/seller/pesanan") {
      router.push("/seller/pesanan");
    }
  };

  if (!activeOrder) return null;

  return (
    <aside
      aria-label="Notifikasi Pesanan Masuk Penjual"
      className="fixed top-2 sm:top-4 inset-x-0 z-[99999] px-3 pointer-events-none flex justify-center"
    >
      <div
        role="button"
        tabIndex={0}
        onClick={handleOpenAndCook}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") handleOpenAndCook();
        }}
        className={`pointer-events-auto w-full max-w-[420px] bg-surface-glass-alt/95 dark:bg-[#1E1412]/95 backdrop-blur-2xl rounded-[24px] border-2 border-primary/90 shadow-[0_16px_40px_rgba(235,94,40,0.35)] p-3.5 text-on-surface cursor-pointer select-none transition-all duration-300 ease-out transform ${
          isVisible
            ? "translate-y-0 opacity-100 scale-100"
            : "-translate-y-8 opacity-0 scale-95"
        }`}
      >
        {/* Glow ambient background primary orange */}
        <div className="absolute -top-8 -right-8 w-28 h-28 bg-primary/25 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-28 h-28 bg-secondary/20 rounded-full blur-2xl pointer-events-none" />

        {/* 1. Baris Header Banner Notifikasi HP Penjual */}
        <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-border-specular/60">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md overflow-hidden bg-primary shadow-xs flex-shrink-0">
              <img
                src="/LOGO.jpeg"
                alt="Logo VetaBite"
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-[11px] font-extrabold tracking-wider uppercase text-primary flex items-center gap-1">
              <BellRing className="w-3 h-3 text-primary animate-pulse" />
              VetaBite Kantin • Pesanan Baru
            </span>
            <span className="text-[10px] text-text-muted">Baru saja</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleDismiss}
              aria-label="Matikan Alarm"
              title="Matikan Alarm"
              className="px-2 py-0.5 rounded-full bg-surface-container/80 hover:bg-surface-container text-text-muted hover:text-on-surface text-[10px] font-bold flex items-center gap-1 transition-colors"
            >
              <VolumeX className="w-3 h-3" />
              <span className="hidden xs:inline">Diam</span>
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              aria-label="Tutup Banner Notifikasi"
              className="w-6 h-6 rounded-full bg-surface-container/80 hover:bg-surface-container flex items-center justify-center text-text-muted hover:text-on-surface transition-colors active:scale-90"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 2. Isi Konten Banner Penjual */}
        <div className="flex items-center gap-3">
          {/* Icon Badge Antrean dengan Ping Pulse */}
          <div className="relative flex-shrink-0">
            <div className="w-11 h-11 rounded-2xl cta-gradient flex items-center justify-center text-white shadow-md shadow-orange-950/25">
              <UtensilsCrossed className="w-6 h-6" />
            </div>
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-white" />
            </span>
          </div>

          {/* Rincian Pesanan Baru */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-on-surface">Antrean:</span>
              <span className="text-sm font-extrabold text-primary font-mono tracking-tight px-2 py-0.5 rounded-lg bg-primary/10 border border-primary/25">
                #{activeOrder.queue_number}
              </span>
              {activeOrder.total_price !== undefined && (
                <span className="text-xs font-extrabold text-on-surface ml-auto">
                  {formatRupiah(activeOrder.total_price)}
                </span>
              )}
            </div>
            <p className="text-[11px] text-text-muted truncate mt-0.5 flex items-center gap-1">
              <User className="w-3 h-3 text-primary flex-shrink-0" />
              <span className="font-semibold text-on-surface truncate">
                {activeOrder.buyer_name || "Mahasiswa"}
              </span>
              {activeOrder.buyer_nim && (
                <span className="text-[10px] text-text-muted font-mono">
                  ({activeOrder.buyer_nim})
                </span>
              )}
              <span className="text-text-muted">• {activeOrder.items_count || 1} menu</span>
            </p>
          </div>

          {/* Action Arrow */}
          <div className="flex-shrink-0 flex items-center gap-1 text-primary text-[11px] font-extrabold pr-0.5">
            <span className="hidden xs:inline">Masak</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>

        {/* 3. Handle Grip Indicator Bawah */}
        <div className="w-10 h-1 rounded-full bg-black/15 dark:bg-white/20 mx-auto mt-2.5" />
      </div>
    </aside>
  );
}
