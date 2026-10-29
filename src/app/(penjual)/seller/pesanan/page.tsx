"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Bell,
  BellRing,
  CalendarDays,
  ReceiptText,
  Clock3,
  Minus,
  Plus,
  CheckCheck,
  CookingPot,
  PackageCheck,
  XCircle,
  Ban,
  EllipsisVertical,
  X,
  Hourglass,
  CircleCheck,
  ShieldCheck,
  CircleCheckBig,
  Volume2,
  VolumeX,
} from "lucide-react";
import { api } from "@/lib/api";
import { formatRupiah } from "@/lib/format";
import { LoadingList, Empty, ErrorBox } from "@/components/States";
import {
  startAlarm,
  stopAlarm,
  onAlarmChange,
  unlockAudio,
  testAlarmSound,
  onUnlockChange,
} from "@/lib/alarm";

type O = {
  id: string;
  queue_number: string;
  buyer_name: string;
  created_at: string;
  payment_status: string;
  order_status: string;
  items: { name: string; qty: number; note?: string; price?: number }[];
  payment_proof_url?: string;
  total_price: number;
  estimated_minutes?: number;
};

const TABS = ["ANTRIAN", "MASAK", "SIAP_AMBIL"] as const;

export default function PesananPage() {
  const [orders, setOrders] = useState<O[] | null>(null);
  const [err, setErr] = useState("");
  const [tab, setTab] = useState<string>("ANTRIAN");
  const [est, setEst] = useState<Record<string, number>>({});
  const [proof, setProof] = useState<O | null>(null);
  const [blockT, setBlockT] = useState<O | null>(null);
  const [blockR, setBlockR] = useState("Bukti pembayaran palsu berulang");
  const [cancelT, setCancelT] = useState<O | null>(null);
  const [cancelR, setCancelR] = useState("Stok menu habis mendadak");
  const [toast, setToast] = useState("");
  const [cid, setCid] = useState<string | null>(null);
  const [alarmRinging, setAlarmRinging] = useState(false);
  const [audioReady, setAudioReady] = useState(false);

  const knownOrderIds = useRef<Set<string> | null>(null);

  useEffect(() => {
    const unsubAlarm = onAlarmChange(setAlarmRinging);
    const unsubUnlock = onUnlockChange(setAudioReady);
    return () => {
      unsubAlarm();
      unsubUnlock();
    };
  }, []);

  const load = useCallback(async () => {
    try {
      setErr("");
      const d = await api<{ orders: O[]; canteen_id: string }>("/api/seller/orders");

      // Deteksi pesanan baru yang baru masuk lewat polling auto-reload
      if (knownOrderIds.current !== null) {
        const newArrivals = d.orders.filter((o) => !knownOrderIds.current!.has(o.id));
        if (newArrivals.length > 0) {
          newArrivals.forEach((o) => knownOrderIds.current!.add(o.id));
          startAlarm(`Pesanan Baru Masuk: #${newArrivals[0].queue_number}!`);
          setToast(`Pesanan Baru #${newArrivals[0].queue_number} Masuk ke Antrean!`);
        }
      } else {
        knownOrderIds.current = new Set(d.orders.map((o) => o.id));
      }

      setOrders(d.orders);
      setCid(d.canteen_id);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  }, []);

  // Auto reload berkala setiap 4 detik (Auto-sync) + saat tab dibuka/fokus
  useEffect(() => {
    load();
    const reloadTimer = setInterval(() => {
      load();
    }, 4000);

    const onVisible = () => {
      if (document.visibilityState === "visible") load();
    };
    window.addEventListener("focus", onVisible);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(reloadTimer);
      window.removeEventListener("focus", onVisible);
      document.removeEventListener("visibilitychange", onVisible);
      stopAlarm();
    };
  }, [load]);

  // Real-time Server Sent Events (SSE)
  useEffect(() => {
    if (!cid) return;
    const es = new EventSource(`/api/sse/canteen/${cid}`);

    es.addEventListener("new_order", (ev: MessageEvent) => {
      try {
        const j = JSON.parse(ev.data);
        startAlarm(`Pesanan Baru Masuk: #${j.queue_number || ""}!`);
        setToast(`Pesanan #${j.queue_number || ""} baru saja masuk ke antrean!`);
      } catch {
        startAlarm("Pesanan Baru Masuk ke Antrean!");
        setToast("Pesanan baru masuk ke antrean!");
      }
      load();
    });

    es.addEventListener("order_update", () => {
      load();
    });

    es.onerror = () => {};
    return () => es.close();
  }, [load, cid]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const act = async (id: string, path: string, body?: object) => {
    await api(`/api/seller/orders/${id}/${path}`, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    });
    load();
  };

  const verify = async (o: O) => {
    await act(o.id, "verify-payment");
    setProof(null);
    setToast(`${o.queue_number} ditandai lunas`);
  };

  const doBlock = async () => {
    if (!blockT) return;
    await api("/api/seller/bans", {
      method: "POST",
      body: JSON.stringify({ order_id: blockT.id, reason: blockR }),
    });
    setBlockT(null);
    load();
    setToast(`${blockT.buyer_name} diblokir dari loket`);
  };

  if (err && !orders) return <ErrorBox msg={err} onRetry={load} />;
  if (!orders)
    return (
      <div>
        <h1 className="text-headline-hero-mobile font-extrabold">Pesanan Masuk</h1>
        <LoadingList n={4} />
      </div>
    );

  const count = (s: string) =>
    (orders || []).filter((o) =>
      s === "ANTRIAN"
        ? ["ANTRIAN", "DIBUAT", "MENUNGGU"].includes(o.order_status)
        : s === "MASAK"
        ? o.order_status === "MASAK"
        : ["SIAP_AMBIL", "SIAP"].includes(o.order_status)
    ).length;

  const shown = (orders || []).filter((o) =>
    tab === "ANTRIAN"
      ? ["ANTRIAN", "DIBUAT", "MENUNGGU"].includes(o.order_status)
      : tab === "MASAK"
      ? o.order_status === "MASAK"
      : ["SIAP_AMBIL", "SIAP"].includes(o.order_status)
  );

  return (
    <div className="px-space-lg pt-3 pb-20">
      {/* Banner Izin Suara Browser jika belum diaktifkan */}
      {!audioReady && (
        <div className="mb-3 rounded-2xl p-3.5 bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 border-2 border-amber-500/50 shadow-md flex items-center justify-between gap-3 animate-pulse">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-9 h-9 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0">
              <Volume2 className="w-5 h-5" />
            </span>
            <div className="min-w-0">
              <h4 className="text-xs font-extrabold text-on-surface">Aktifkan Suara Notifikasi Pesanan</h4>
              <p className="text-[10px] text-text-muted leading-tight">
                Klik tombol untuk mengizinkan browser membunyikan alarm saat pesanan masuk
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={async () => {
              await testAlarmSound();
              setToast("Suara alarm aktif & berhasil diuji coba!");
            }}
            className="px-3.5 py-2 rounded-full bg-amber-500 hover:bg-amber-600 text-white text-xs font-extrabold shrink-0 shadow-sm active:scale-95 transition-all flex items-center gap-1.5"
          >
            <BellRing size={14} />
            <span>Aktifkan & Tes</span>
          </button>
        </div>
      )}

      {/* Sticky Alarm Bar jika Alarm Sedang Berdering Keras */}
      {alarmRinging && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[70] w-[92%] max-w-[420px] liquid-glass rounded-2xl p-3.5 shadow-2xl flex items-center justify-between gap-3 border-2 border-danger bg-red-500/20 backdrop-blur-xl animate-pulse">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-10 h-10 rounded-full bg-danger text-white flex items-center justify-center shrink-0 shadow-md">
              <BellRing className="w-5 h-5 animate-bounce" />
            </span>
            <div className="min-w-0">
              <h4 className="text-xs font-extrabold text-on-surface truncate">Alarm Pesanan Aktif!</h4>
              <p className="text-[10px] text-text-muted leading-tight">
                Berdering keras sampai Anda klik &quot;Selesai&quot; atau matikan
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => stopAlarm()}
            className="px-3.5 py-2 rounded-full bg-danger hover:bg-red-700 text-white text-xs font-extrabold shrink-0 shadow-md active:scale-95 transition-all flex items-center gap-1.5"
          >
            <VolumeX size={14} />
            <span>Matikan</span>
          </button>
        </div>
      )}

      {toast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[60] w-[90%] max-w-[390px] liquid-glass rounded-2xl p-3 shadow-xl flex items-center gap-3 border border-success/40">
          <span className="w-8 h-8 rounded-full bg-success text-white flex items-center justify-center shrink-0">
            <CircleCheckBig size={18} />
          </span>
          <p className="text-sm font-bold">{toast}</p>
        </div>
      )}

      <section className="space-y-2 pt-1">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-headline-hero-mobile font-extrabold">Pesanan Masuk</h1>
            <p className="text-sm text-text-muted mt-0.5">Pantauan pesanan langsung dari loket digital</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={async () => {
                await testAlarmSound();
                setToast("Memutar suara alarm pengujian...");
              }}
              className="px-2.5 py-1.5 rounded-full liquid-glass flex items-center gap-1.5 text-xs font-bold text-on-surface hover:text-primary active:scale-95 transition-all border border-border-specular"
              title="Uji coba speaker/bunyi alarm"
            >
              <Volume2 size={14} className="text-primary" />
              <span>Tes Suara</span>
            </button>
            {alarmRinging ? (
              <button
                onClick={() => stopAlarm()}
                className="px-2.5 py-1.5 rounded-full bg-danger/20 text-danger border border-danger/40 flex items-center gap-1.5 text-xs font-extrabold animate-pulse"
              >
                <BellRing size={14} className="animate-bounce" />
                <span>Alarm Aktif</span>
              </button>
            ) : (
              <div className="px-2.5 py-1.5 rounded-full liquid-glass flex items-center gap-1.5 text-primary text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                <span>Live Loket</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-1.5 text-xs text-text-muted bg-surface-container/70 px-3 py-1.5 rounded-full border border-border-specular">
            <CalendarDays size={15} className="text-primary" />
            <span>
              Hari Ini ({new Date().toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })})
            </span>
          </div>
          <div className="bg-primary/10 text-primary px-3 py-1.5 rounded-full text-xs flex items-center gap-1 font-bold">
            <ReceiptText size={15} />
            <span>{orders.length} Pesanan Aktif</span>
          </div>
        </div>
      </section>

      <nav
        aria-label="Status Pesanan"
        className="liquid-glass rounded-full p-1.5 flex items-center justify-between gap-1 shadow-md mt-4"
      >
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 min-h-[48px] rounded-full py-2.5 px-2 flex items-center justify-center gap-1.5 text-xs font-bold transition-all ${
              tab === t ? "cta-gradient-btn text-white" : "text-text-muted hover:text-on-surface active:scale-95"
            }`}
          >
            <span>{t === "ANTRIAN" ? "Antrian" : t === "MASAK" ? "Masak" : "Siap Ambil"}</span>
            <span
              className={`w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-extrabold ${
                tab === t ? "bg-white/25 text-white" : "bg-surface-container-high"
              }`}
            >
              {count(t)}
            </span>
          </button>
        ))}
      </nav>

      <div className="space-y-4 mt-4">
        {shown.length === 0 ? (
          <Empty
            title={tab === "ANTRIAN" ? "Belum ada antrean" : "Belum ada pesanan " + tab.toLowerCase()}
            desc="Pesanan baru muncul otomatis di sini beserta bunyi alarm peringatan."
          />
        ) : (
          shown.map((o) => {
            const paid = o.payment_status === "SUDAH_DIBAYAR";
            const e = est[o.id] ?? o.estimated_minutes ?? 10;
            return (
              <article
                key={o.id}
                className="liquid-glass rounded-[22px] p-4 space-y-3.5 relative overflow-hidden hover-card-lift transition-smooth"
              >
                <div className="flex items-start justify-between border-b border-border-subtle pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl text-primary font-extrabold tracking-tight">{o.queue_number}</span>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold ${
                          paid ? "bg-emerald-100 text-emerald-900" : "bg-primary-fixed text-primary"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${paid ? "bg-emerald-600" : "bg-primary animate-ping"}`} />
                        {paid
                          ? "Lunas"
                          : tab === "ANTRIAN"
                          ? "Antrian Baru"
                          : tab === "MASAK"
                          ? "Sedang Dimasak"
                          : "Siap Diambil"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm font-bold">{o.buyer_name}</span>
                      <span className="text-xs text-text-muted">
                        • Jam{" "}
                        {new Date(o.created_at).toLocaleTimeString("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        WIB
                      </span>
                    </div>
                  </div>
                  <button
                    aria-label="Opsi pesanan"
                    onClick={() => setBlockT(o)}
                    className="w-9 h-9 rounded-full liquid-glass-soft flex items-center justify-center text-text-muted active:scale-95"
                  >
                    <EllipsisVertical size={20} />
                  </button>
                </div>

                <div className="space-y-2">
                  {(o.items || []).map((it, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-primary">{it.qty}x</span>
                        <span className="font-semibold">
                          {it.name}
                          {it.note ? ` (${it.note})` : ""}
                        </span>
                      </div>
                      <span className="text-text-muted font-medium">
                        {it.price ? formatRupiah(it.price * it.qty) : ""}
                      </span>
                    </div>
                  ))}
                </div>

                {(o.items || []).some((i) => i.note) && (
                  <div className="rounded-xl bg-amber-50 border border-amber-200/80 p-3 flex items-start gap-2.5">
                    <Clock3 size={18} className="text-amber-700 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs text-amber-900 block uppercase font-bold">
                        Catatan Khusus Mahasiswa:
                      </span>
                      <p className="text-sm text-amber-950 font-medium leading-snug">
                        {(o.items || [])
                          .filter((i) => i.note)
                          .map((i) => i.note)
                          .join("; ")}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-1">
                  <div>
                    <span className="text-[10px] text-text-muted block uppercase">Total Tagihan</span>
                    <span className="text-lg font-extrabold text-primary">Total {formatRupiah(o.total_price)}</span>
                  </div>
                  {o.payment_proof_url && (
                    <button
                      onClick={() => setProof(o)}
                      className="liquid-glass-soft px-3 py-1.5 rounded-xl flex items-center gap-2 active:scale-95 border border-border-specular text-left"
                    >
                      <ReceiptText size={18} className="text-primary" />
                      <div>
                        <span className="text-xs font-bold block">Bukti QRIS</span>
                        <span className="text-[10px] text-primary">Lihat</span>
                      </div>
                    </button>
                  )}
                </div>

                {!paid && tab === "ANTRIAN" && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-xs text-text-muted">Konfirmasi Pembayaran:</span>
                    <div className="liquid-glass-soft p-1 rounded-full flex items-center gap-1">
                      <button className="flex-1 min-h-[48px] rounded-full flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold bg-amber-500 text-white shadow-sm">
                        <Hourglass size={16} />
                        <span>Belum Dibayar</span>
                      </button>
                      <button
                        onClick={() => verify(o)}
                        className="flex-1 min-h-[48px] rounded-full flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold text-text-muted hover:text-emerald-700"
                      >
                        <CircleCheck size={16} />
                        <span>Sudah Dibayar</span>
                      </button>
                    </div>
                  </div>
                )}

                {tab === "ANTRIAN" && (
                  <div className="grid grid-cols-1 gap-2 pt-2 border-t border-border-subtle">
                    <div className="flex items-center justify-between liquid-glass-soft px-3.5 py-2 rounded-xl">
                      <span className="text-sm font-semibold flex items-center gap-2">
                        <Clock3 size={19} className="text-primary" />
                        Estimasi: <b className="text-primary">{e} Menit</b>
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          aria-label="Kurangi waktu"
                          onClick={() => setEst({ ...est, [o.id]: Math.max(2, e - 2) })}
                          className="w-8 h-8 rounded-full liquid-glass flex items-center justify-center font-bold active:scale-90"
                        >
                          <Minus size={15} />
                        </button>
                        <button
                          aria-label="Tambah waktu"
                          onClick={() => setEst({ ...est, [o.id]: e + 2 })}
                          className="w-8 h-8 rounded-full liquid-glass flex items-center justify-center font-bold active:scale-90"
                        >
                          <Plus size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 pt-1">
                  {tab === "ANTRIAN" && (
                    <button
                      disabled={!paid}
                      onClick={() => act(o.id, "status", { order_status: "MASAK", estimated_minutes: e })}
                      className={`flex-1 min-h-[48px] rounded-full py-3 px-4 text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                        paid
                          ? "cta-gradient-btn text-white active:scale-95"
                          : "bg-surface-container-high text-outline cursor-not-allowed opacity-70"
                      }`}
                    >
                      <CookingPot size={18} />
                      <span>Mulai Masak</span>
                    </button>
                  )}

                  {tab === "MASAK" && (
                    <button
                      onClick={async () => {
                        await act(o.id, "status", { order_status: "SIAP_AMBIL" });
                        startAlarm(`Pesanan #${o.queue_number} Siap Diambil!`);
                        setToast(`Pesanan ${o.queue_number} siap diambil`);
                      }}
                      className="w-full min-h-[48px] rounded-full py-3 px-4 text-sm font-bold flex items-center justify-center gap-2 cta-green-btn text-white active:scale-95 shadow-md"
                    >
                      <CheckCheck size={20} />
                      <span>Tandai Siap Ambil & Bunyikan Alarm</span>
                    </button>
                  )}

                  {tab === "SIAP_AMBIL" && (
                    <button
                      onClick={async () => {
                        await act(o.id, "status", { order_status: "SELESAI" });
                        stopAlarm();
                        setToast(`Pesanan ${o.queue_number} selesai & diserahkan`);
                      }}
                      className="w-full min-h-[48px] rounded-full py-3 px-4 text-sm font-bold flex items-center justify-center gap-2 cta-green-btn text-white active:scale-95 shadow-md"
                    >
                      <PackageCheck size={18} />
                      <span>Selesai / Sudah Diambil (Matikan Alarm)</span>
                    </button>
                  )}

                  <div className="flex gap-2 w-full">
                    <button
                      onClick={() => setCancelT(o)}
                      className="flex-1 min-h-[44px] rounded-full text-xs font-bold text-danger border border-danger/30 hover:bg-red-50 active:scale-95 flex items-center justify-center gap-1.5"
                    >
                      <XCircle size={17} />
                      <span>Batal</span>
                    </button>
                    <button
                      onClick={() => setBlockT(o)}
                      className="flex-1 min-h-[44px] rounded-full text-xs font-bold text-text-muted border border-border-specular active:scale-95 flex items-center justify-center gap-1.5"
                    >
                      <Ban size={15} />
                      <span>Blokir</span>
                    </button>
                  </div>
                </div>

                {tab === "ANTRIAN" && !paid && (
                  <p className="text-[10px] text-center text-amber-800">
                    Verifikasi bukti pembayaran QRIS sebelum memulai masak
                  </p>
                )}
              </article>
            );
          })
        )}
      </div>

      {proof && (
        <div
          className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm backdrop-smooth-fade flex items-center justify-center p-4"
          onClick={() => setProof(null)}
        >
          <div
            className="liquid-glass rounded-3xl w-full max-w-[380px] p-5 space-y-4 shadow-2xl border-2 border-white modal-smooth-enter"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <div className="flex items-center gap-2">
                <ReceiptText size={22} className="text-primary" />
                <span className="font-bold">Bukti Transfer QRIS</span>
              </div>
              <button
                onClick={() => setProof(null)}
                className="w-8 h-8 rounded-full liquid-glass-soft flex items-center justify-center"
              >
                <X size={18} />
              </button>
            </div>
            {proof.payment_proof_url && (
              <div className="w-full h-56 rounded-2xl overflow-hidden border bg-white">
                <img src={proof.payment_proof_url} alt="Bukti bayar" className="w-full h-full object-contain p-2" />
              </div>
            )}
            <div className="liquid-glass-soft rounded-xl p-3 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-text-muted">Nominal:</span>
                <span className="font-bold text-primary">{formatRupiah(proof.total_price)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Pembeli:</span>
                <span className="font-semibold">{proof.buyer_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Antrean:</span>
                <span className="font-semibold">{proof.queue_number}</span>
              </div>
            </div>
            <div className="space-y-2">
              <button
                onClick={() => verify(proof)}
                className="w-full min-h-[48px] rounded-full py-3 px-4 font-bold cta-green-btn text-white flex items-center justify-center gap-2 active:scale-95"
              >
                <CircleCheck size={18} />
                <span>Verifikasi dan Tandai Lunas</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {blockT && (
        <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm backdrop-smooth-fade flex items-center justify-center p-4">
          <div className="liquid-glass rounded-3xl w-full max-w-[360px] p-5 space-y-4 border-2 border-red-100 modal-smooth-enter">
            <div className="w-12 h-12 rounded-full bg-error-container text-danger flex items-center justify-center mx-auto">
              <Ban size={28} />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-bold">Blokir Mahasiswa?</h3>
              <p className="text-sm text-text-muted">
                Anda akan memblokir <b className="text-on-surface">{blockT.buyer_name}</b> ({blockT.queue_number}). Akun
                ini tidak dapat memesan di loket Anda sementara waktu.
              </p>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-text-muted">Alasan Pemblokiran:</label>
              <select
                value={blockR}
                onChange={(e) => setBlockR(e.target.value)}
                className="w-full liquid-glass-soft rounded-xl text-sm p-2.5 border"
              >
                <option>Bukti pembayaran palsu berulang</option>
                <option>Pesanan tidak pernah diambil (Ghosting)</option>
                <option>Catatan kasar / pelecehan</option>
                <option>Lainnya</option>
              </select>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setBlockT(null)}
                className="flex-1 min-h-[48px] rounded-full py-2.5 text-sm liquid-glass-soft active:scale-95"
              >
                Batal
              </button>
              <button
                onClick={doBlock}
                className="flex-1 min-h-[48px] rounded-full py-2.5 text-sm bg-danger text-white shadow-md active:scale-95"
              >
                Ya, Blokir
              </button>
            </div>
          </div>
        </div>
      )}

      {cancelT && (
        <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="liquid-glass rounded-3xl w-full max-w-[360px] p-5 space-y-3.5 border-2 border-red-100 modal-smooth-enter">
            <div className="w-12 h-12 rounded-full bg-error-container text-danger flex items-center justify-center mx-auto">
              <XCircle size={28} />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-extrabold text-base text-on-surface">Batalkan Pesanan?</h3>
              <p className="text-xs text-text-muted">
                Pesanan <b className="text-on-surface">{cancelT.queue_number}</b> milik <b>{cancelT.buyer_name}</b> akan
                dibatalkan.
              </p>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-on-surface">Alasan Pembatalan:</label>
              <input
                type="text"
                value={cancelR}
                onChange={(e) => setCancelR(e.target.value)}
                placeholder="Misal: Stok menu habis mendadak"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/80 border border-border-specular text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-danger/40 shadow-sm"
              />
            </div>
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => setCancelT(null)}
                className="flex-1 min-h-[46px] rounded-full bg-white hover:bg-surface-container border border-border-specular text-xs font-bold active:scale-95 transition-all shadow-sm"
              >
                Kembali
              </button>
              <button
                onClick={async () => {
                  await act(cancelT.id, "status", { order_status: "DIBATALKAN", reason: cancelR });
                  setCancelT(null);
                  setToast("Pesanan dibatalkan");
                }}
                className="flex-1 min-h-[46px] rounded-full bg-danger text-white text-xs font-bold active:scale-95 transition-all shadow-md"
              >
                Ya, Batalkan
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="h-4" />
    </div>
  );
}

