"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { CheckCircle2, Store, ArrowRight, X, Sparkles } from "lucide-react";
import { playChimeSound } from "@/lib/alarm";
import { api } from "@/lib/api";

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
  const pathname = usePathname();
  const [readyOrder, setReadyOrder] = useState<ReadyOrderData | null>(null);
  const acknowledgedSet = useRef<Set<string>>(new Set());

  const triggerReadyPopup = useCallback((order: ReadyOrderData) => {
    if (!order.order_id || !order.queue_number) return;

    // Cek apakah sudah pernah ditutup/diakui pada sesi ini
    const key = `vetabite_ready_ack_${order.order_id}`;
    if (typeof window !== "undefined" && sessionStorage.getItem(key)) {
      return;
    }
    if (acknowledgedSet.current.has(order.order_id)) {
      return;
    }

    setReadyOrder(order);
    playChimeSound();
  }, []);

  // 1. Listen custom event saat detail pesanan menerima update SSE
  useEffect(() => {
    const handleCustomEvent = (e: Event) => {
      const customEvent = e as CustomEvent<ReadyOrderData>;
      if (customEvent.detail) {
        triggerReadyPopup(customEvent.detail);
      }
    };

    window.addEventListener("vetabite:order-ready", handleCustomEvent);
    return () => {
      window.removeEventListener("vetabite:order-ready", handleCustomEvent);
    };
  }, [triggerReadyPopup]);

  // 2. Polling pengecekan status pesanan aktif (setiap 5 detik)
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;

    const checkActiveOrders = async () => {
      try {
        const orders = await api<OrderItemApi[]>("/api/orders");
        if (!Array.isArray(orders)) return;

        // Cari pesanan yang statusnya SIAP_AMBIL
        const ready = orders.find((o) => o.order_status === "SIAP_AMBIL");
        if (ready) {
          triggerReadyPopup({
            order_id: ready.id,
            queue_number: ready.queue_number,
            canteen_name: ready.canteen?.name || "Kantin UPNVJ",
          });
        }
      } catch {
        // Abaikan jika unauthenticated atau offline
      }
    };

    // Jalankan awal
    checkActiveOrders();
    timer = setInterval(checkActiveOrders, 5000);

    return () => clearInterval(timer);
  }, [triggerReadyPopup]);

  const handleAcknowledge = () => {
    if (readyOrder) {
      acknowledgedSet.current.add(readyOrder.order_id);
      if (typeof window !== "undefined") {
        sessionStorage.setItem(`vetabite_ready_ack_${readyOrder.order_id}`, "1");
      }
    }
    setReadyOrder(null);
  };

  const handleGoToOrder = () => {
    if (readyOrder) {
      const targetId = readyOrder.order_id;
      handleAcknowledge();
      router.push(`/pesanan/${targetId}`);
    }
  };

  if (!readyOrder) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 modal-smooth-enter"
    >
      <div className="w-full max-w-[390px] bg-surface-glass-alt backdrop-blur-2xl rounded-[32px] border-2 border-emerald-400/80 shadow-2xl p-6 text-on-surface relative overflow-hidden flex flex-col items-center text-center">
        {/* Glow ambient background hijau emerald */}
        <div className="absolute -top-10 -right-10 w-36 h-36 bg-emerald-500/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close button */}
        <button
          type="button"
          onClick={handleAcknowledge}
          aria-label="Tutup Notifikasi"
          className="absolute top-4 right-4 w-8 h-8 rounded-full border border-border-specular flex items-center justify-center text-text-muted hover:text-on-surface hover:bg-white/40 transition-all active:scale-95"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Celebratory Icon */}
        <div className="relative mb-3 mt-1">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-xl shadow-emerald-950/20 animate-bounce">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75" />
            <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-400 border-2 border-white shadow-xs" />
          </span>
        </div>

        {/* Title & Badge */}
        <span className="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 px-3 py-0.5 rounded-full border border-emerald-500/30 mb-1">
          <Sparkles className="w-3 h-3" />
          Pesanan Selesai Dimasak
        </span>
        <h2 className="font-headline-lg text-lg font-extrabold text-on-surface">
          Pesanan Anda Sudah Siap!
        </h2>

        {/* Nomor Antrean Besar */}
        <div className="w-full my-3 py-2.5 px-4 rounded-2xl bg-emerald-500/10 dark:bg-emerald-950/30 border-2 border-emerald-500/30 shadow-inner flex flex-col items-center">
          <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
            Nomor Antrean Anda
          </span>
          <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono tracking-tight mt-0.5">
            #{readyOrder.queue_number}
          </span>
        </div>

        {/* Loket Info */}
        <div className="w-full bg-surface-container/60 rounded-xl p-3 border border-border-specular text-left flex items-center gap-2 mb-4 text-xs">
          <Store className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          <div className="truncate">
            <span className="text-[10px] text-text-muted block">Ambil di Loket:</span>
            <span className="font-extrabold text-on-surface truncate block">
              {readyOrder.canteen_name || "Kantin UPN Veteran Jakarta"}
            </span>
          </div>
        </div>

        <p className="text-xs text-text-muted mb-4 leading-relaxed">
          Makanan dan minuman Anda sudah siap disajikan. Silakan menuju loket untuk mengambil pesanan sekarang.
        </p>

        {/* Tombol Aksi */}
        <div className="w-full space-y-2">
          <button
            type="button"
            onClick={handleGoToOrder}
            className="w-full h-11 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold text-xs shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <span>Lihat Rincian &amp; Ambil Pesanan</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleAcknowledge}
            className="w-full h-9 rounded-xl border border-border-specular text-xs font-semibold text-text-muted hover:text-on-surface active:scale-95 transition-all"
          >
            Nanti Saja / Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

