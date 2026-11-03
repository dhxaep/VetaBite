"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ChevronRight, X, Sparkles, Store } from "lucide-react";
import { playChimeSound } from "@/lib/alarm";
import { api } from "@/lib/api";
import { showNativeNotification, requestNotificationPermission } from "@/lib/notifications";

export interface ReadyOrderData {
  order_id: string;
  queue_number: string;
  canteen_name?: string;
}

interface OrderItemApi {
  id: string;
  queue_number: string;
  order_status: string;
  canteen?: {
    name?: string;
  };
}

export function StudentReadyNotificationPopup() {
  const router = useRouter();
  const [readyOrder, setReadyOrder] = useState<ReadyOrderData | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const acknowledgedSet = useRef<Set<string>>(new Set());
  const autoDismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isAcked = useCallback((orderId: string): boolean => {
    if (!orderId) return true;
    if (acknowledgedSet.current.has(orderId)) return true;
    if (typeof window !== "undefined") {
      const val = sessionStorage.getItem(`vetabite_ready_ack_${orderId}`);
      if (val) return true;
    }
    return false;
  }, []);

  const triggerReadyBanner = useCallback((order: ReadyOrderData) => {
    if (!order.order_id || !order.queue_number) return;
    if (isAcked(order.order_id)) return;

    // Set order data and animate visibility
    setReadyOrder(order);
    setIsVisible(true);

    // 1. Play chime sound
    try {
      playChimeSound();
    } catch {}

    // 2. Trigger mobile device haptic vibration
    try {
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate([120, 80, 160]);
      }
    } catch {}

    // 3. Show native OS mobile notification banner (lockscreen / status bar)
    try {
      showNativeNotification(`VetaBite: Pesanan #${order.queue_number} Siap!`, {
        body: `Makanan dan minuman Anda di ${order.canteen_name || "Kantin UPNVJ"} sudah siap diambil.`,
        tag: `ready-${order.order_id}`,
      });
    } catch {}

    // 4. Auto dismiss after 10 seconds
    if (autoDismissTimer.current) {
      clearTimeout(autoDismissTimer.current);
    }
    autoDismissTimer.current = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => setReadyOrder(null), 300);
    }, 10000);
  }, [isAcked]);

  // Listen custom event dari SSE order detail atau tombol tes
  useEffect(() => {
    const handleCustomEvent = (e: Event) => {
      const customEvent = e as CustomEvent<ReadyOrderData>;
      if (customEvent.detail) {
        triggerReadyBanner(customEvent.detail);
      }
    };

    const handleTestEvent = () => {
      requestNotificationPermission();
      triggerReadyBanner({
        order_id: `test-${Date.now()}`,
        queue_number: "A-001",
        canteen_name: "Kantin Bu Tri — UPNVJ",
      });
    };

    window.addEventListener("vetabite:order-ready", handleCustomEvent);
    window.addEventListener("vetabite:test-ready-banner", handleTestEvent);

    return () => {
      window.removeEventListener("vetabite:order-ready", handleCustomEvent);
      window.removeEventListener("vetabite:test-ready-banner", handleTestEvent);
    };
  }, [triggerReadyBanner]);

  // Polling pengecekan status pesanan aktif (setiap 5 detik)
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;

    const checkActiveOrders = async () => {
      try {
        const orders = await api<OrderItemApi[]>("/api/orders");
        if (!Array.isArray(orders)) return;

        // Cari pesanan yang statusnya SIAP_AMBIL dan belum pernah di-ack
        const ready = orders.find(
          (o) => (o.order_status === "SIAP_AMBIL" || (o as { status?: string }).status === "SIAP_AMBIL") && !isAcked(o.id)
        );

        if (ready) {
          triggerReadyBanner({
            order_id: ready.id,
            queue_number: ready.queue_number,
            canteen_name: ready.canteen?.name || "Kantin UPNVJ",
          });
        }
      } catch {
        // Abaikan jika unauthenticated atau offline
      }
    };

    checkActiveOrders();
    timer = setInterval(checkActiveOrders, 5000);

    return () => clearInterval(timer);
  }, [triggerReadyBanner, isAcked]);

  const handleDismiss = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (autoDismissTimer.current) clearTimeout(autoDismissTimer.current);

    if (readyOrder) {
      acknowledgedSet.current.add(readyOrder.order_id);
      if (typeof window !== "undefined") {
        sessionStorage.setItem(`vetabite_ready_ack_${readyOrder.order_id}`, "1");
      }
    }

    setIsVisible(false);
    setTimeout(() => setReadyOrder(null), 300);
  };

  const handleOpenOrder = () => {
    if (!readyOrder) return;
    const targetId = readyOrder.order_id;
    handleDismiss();
    if (!targetId.startsWith("test-")) {
      router.push(`/pesanan/${targetId}`);
    }
  };

  if (!readyOrder) return null;

  return (
    <aside
      aria-label="Notifikasi Pesanan Siap Diambil"
      className="fixed top-2 sm:top-4 inset-x-0 z-[99999] px-3 pointer-events-none flex justify-center"
    >
      <div
        role="button"
        tabIndex={0}
        onClick={handleOpenOrder}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") handleOpenOrder();
        }}
        className={`pointer-events-auto w-full max-w-[410px] bg-surface-glass-alt/95 dark:bg-[#1E1412]/95 backdrop-blur-2xl rounded-[24px] border-2 border-emerald-400/90 dark:border-emerald-500/70 shadow-[0_16px_40px_rgba(0,0,0,0.25)] p-3.5 text-on-surface cursor-pointer select-none transition-all duration-300 ease-out transform ${
          isVisible
            ? "translate-y-0 opacity-100 scale-100"
            : "-translate-y-8 opacity-0 scale-95"
        }`}
      >
        {/* Glow ambient background hijau emerald */}
        <div className="absolute -top-8 -right-8 w-28 h-28 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-28 h-28 bg-teal-500/15 rounded-full blur-2xl pointer-events-none" />

        {/* 1. Baris Header Banner Notifikasi HP (App Header) */}
        <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-border-specular/60">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md overflow-hidden bg-primary shadow-xs flex-shrink-0">
              <img
                src="/LOGO.jpeg"
                alt="Logo VetaBite"
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-[11px] font-extrabold tracking-wider uppercase text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-500" />
              VetaBite • Pesanan Siap
            </span>
            <span className="text-[10px] text-text-muted">Baru saja</span>
          </div>

          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Tutup Banner Notifikasi"
            className="w-6 h-6 rounded-full bg-surface-container/80 hover:bg-surface-container flex items-center justify-center text-text-muted hover:text-on-surface transition-colors active:scale-90"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 2. Isi Konten Banner */}
        <div className="flex items-center gap-3">
          {/* Icon Badge Emerald Berkedip */}
          <div className="relative flex-shrink-0">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-950/20">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400 border-2 border-white" />
            </span>
          </div>

          {/* Teks Nomor Antrean & Loket */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-on-surface">Pesanan Siap:</span>
              <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 font-mono tracking-tight px-2 py-0.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30">
                #{readyOrder.queue_number}
              </span>
            </div>
            <p className="text-[11px] text-text-muted truncate mt-0.5 flex items-center gap-1">
              <Store className="w-3 h-3 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <span className="truncate">{readyOrder.canteen_name || "Kantin UPNVJ"}</span>
            </p>
          </div>

          {/* Action Arrow */}
          <div className="flex-shrink-0 flex items-center gap-1 text-emerald-700 dark:text-emerald-400 text-[11px] font-extrabold pr-0.5">
            <span className="hidden xs:inline">Ambil</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>

        {/* 3. Handle Grip Indicator Bawah (Menegaskan Banner HP) */}
        <div className="w-10 h-1 rounded-full bg-black/15 dark:bg-white/20 mx-auto mt-2.5" />
      </div>
    </aside>
  );
}
