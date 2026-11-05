"use client";

import { useEffect, useState } from "react";
import {
  Check,
  X,
  Search,
  Hourglass,
  Store,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  MapPin,
  RefreshCw,
  TrendingUp,
  CheckCircle2,
  Ban,
  AlertTriangle,
  FileText,
  CreditCard,
  QrCode,
  ExternalLink,
} from "lucide-react";
import { api } from "@/lib/api";
import { LoadingList, Empty, ErrorBox } from "@/components/States";

type K = {
  id: string;
  owner_name: string;
  name: string;
  description?: string;
  whatsapp?: string;
  created_at: string;
  banner_url?: string;
  status: string;
};

export default function VerifikasiPage() {
  const [tab, setTab] = useState("PENDING");
  const [list, setList] = useState<K[] | null>(null);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<K | null>(null);
  const [rejecting, setRejecting] = useState<K | null>(null);
  const [reasonCategory, setReasonCategory] = useState("berkas");
  const [reason, setReason] = useState("");
  const [counts, setCounts] = useState({ PENDING: 0, ACTIVE: 0, REJECTED: 0 });

  const load = async () => {
    try {
      setErr("");
      setList(null);
      const d = await api<{ canteens: K[]; counts: any }>(
        `/api/admin/canteens?status=${tab}`
      );
      setList(d.canteens);
      if (d.counts) setCounts(d.counts);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  };

  useEffect(() => {
    load();
  }, [tab]);

  const acc = async (id: string) => {
    await api(`/api/admin/canteens/${id}/approve`, { method: "POST" });
    setSel(null);
    setRejecting(null);
    load();
  };

  const rej = async () => {
    if (!rejecting) return;
    const finalReason = reason.trim()
      ? `[${reasonCategory}] ${reason}`
      : `Alasan: ${reasonCategory}`;
    await api(`/api/admin/canteens/${rejecting.id}/reject`, {
      method: "POST",
      body: JSON.stringify({ reason: finalReason }),
    });
    setRejecting(null);
    setSel(null);
    setReason("");
    load();
  };

  const filtered = (list ?? []).filter((k) =>
    (k.name + k.owner_name + (k.description ?? "")).toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="space-y-7">
      {/* 1. THREE LIQUID GLASS KPI STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Menunggu Verifikasi */}
        <div className="liquid-glass rounded-3xl p-5 relative overflow-hidden transition-transform duration-200 hover:-translate-y-1">
          <div className="absolute -right-4 -bottom-4 w-28 h-28 bg-warning/15 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-start justify-between">
            <div>
              <span className="px-2.5 py-1 rounded-full bg-warning/20 text-on-tertiary-fixed-variant text-[10px] uppercase tracking-wider inline-flex items-center gap-1 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-warning" />
                Perlu Ditinjau
              </span>
              <p className="mt-3 text-sm text-text-muted font-medium">Menunggu Verifikasi</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-[32px] font-extrabold text-on-surface leading-tight">
                  {counts.PENDING}
                </span>
                <span className="text-sm text-text-muted">Pengajuan Loket</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-warning/15 border border-warning/30 flex items-center justify-center text-tertiary shadow-inner">
              <Hourglass size={24} />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-border-subtle flex items-center justify-between text-xs">
            <span className="text-primary font-bold flex items-center gap-1">
              <TrendingUp size={14} /> Prioritas Verifikasi
            </span>
            <span className="text-text-muted">Jam istirahat kampus</span>
          </div>
        </div>

        {/* Card 2: Kantin Aktif */}
        <div className="liquid-glass rounded-3xl p-5 relative overflow-hidden transition-transform duration-200 hover:-translate-y-1">
          <div className="absolute -right-4 -bottom-4 w-28 h-28 bg-success/15 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-start justify-between">
            <div>
              <span className="px-2.5 py-1 rounded-full bg-success/15 text-success text-[10px] uppercase tracking-wider inline-flex items-center gap-1 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-success" />
                Beroperasi
              </span>
              <p className="mt-3 text-sm text-text-muted font-medium">Kantin Aktif</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-[32px] font-extrabold text-on-surface leading-tight">
                  {counts.ACTIVE}
                </span>
                <span className="text-sm text-text-muted">Loket Resmi</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-success/15 border border-success/30 flex items-center justify-center text-success shadow-inner">
              <Store size={24} />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-border-subtle flex items-center justify-between text-xs">
            <span className="text-success font-bold flex items-center gap-1">
              <CheckCircle2 size={14} /> 100% QRIS Siap
            </span>
            <span className="text-text-muted">Siap melayani mahasiswa</span>
          </div>
        </div>

        {/* Card 3: Kantin Nonaktif / Ditolak */}
        <div className="liquid-glass rounded-3xl p-5 relative overflow-hidden transition-transform duration-200 hover:-translate-y-1">
          <div className="absolute -right-4 -bottom-4 w-28 h-28 bg-outline/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-start justify-between">
            <div>
              <span className="px-2.5 py-1 rounded-full bg-outline-variant/50 text-on-surface-variant text-[10px] uppercase tracking-wider inline-flex items-center gap-1 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-outline" />
                Arsip &amp; Tolak
              </span>
              <p className="mt-3 text-sm text-text-muted font-medium">Kantin Nonaktif / Ditolak</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-[32px] font-extrabold text-on-surface leading-tight">
                  {counts.REJECTED}
                </span>
                <span className="text-sm text-text-muted">Loket Tercatat</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-surface-container-high border border-outline-variant flex items-center justify-center text-outline shadow-inner">
              <Ban size={24} />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-border-subtle flex items-center justify-between text-xs">
            <span className="text-text-muted">Berkas tidak memenuhi SOP</span>
            <span className="text-primary font-bold">Log Arsip</span>
          </div>
        </div>
      </div>

      {/* 2. SEARCH, FILTERS & SEGMENTED TABS ROW */}
      <div className="liquid-glass rounded-3xl p-4 flex flex-col lg:flex-row items-center justify-between gap-4">
        {/* Segmented Control Tabs */}
        <div className="flex items-center p-1.5 rounded-full bg-surface-container-lowest/90 border border-border-specular shadow-inner w-full lg:w-auto">
          {[
            { id: "PENDING", label: "Menunggu ACC", count: counts.PENDING },
            { id: "ACTIVE", label: "Aktif", count: counts.ACTIVE },
            { id: "REJECTED", label: "Nonaktif / Ditolak", count: counts.REJECTED },
          ].map((t) => {
            const isActive = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`px-5 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 ${
                  isActive
                    ? "bg-gradient-to-r from-primary to-primary-container text-on-primary shadow-sm"
                    : "text-text-muted hover:text-on-surface"
                }`}
              >
                <span>{t.label}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                    isActive ? "bg-white text-primary" : "bg-surface-container text-text-muted"
                  }`}
                >
                  {t.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Field & Refresh Button */}
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-80">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari nama loket / pemilik kantin..."
              className="w-full h-11 pl-10 pr-4 rounded-full bg-white/80 border border-white focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm placeholder:text-text-muted shadow-sm text-on-surface"
            />
          </div>
          <button
            type="button"
            onClick={load}
            title="Segarkan Data"
            className="w-11 h-11 rounded-full bg-white/80 hover:bg-white flex items-center justify-center text-text-muted hover:text-primary border border-white shadow-sm transition-all active:scale-95"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* 3. MAIN VERIFICATION DATA TABLE */}
      <div className="liquid-glass rounded-3xl overflow-hidden shadow-lg">
        <div className="px-6 py-4 border-b border-border-subtle flex items-center justify-between bg-white/40">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-primary" />
            <h3 className="text-sm font-extrabold text-on-surface">
              Antrean Verifikasi Loket Mitra ({filtered.length} Loket)
            </h3>
          </div>
          <span className="text-xs text-text-muted">
            Klik salah satu baris untuk membuka drawer berkas pendaftaran
          </span>
        </div>

        {err ? (
          <div className="p-6">
            <ErrorBox msg={err} onRetry={load} />
          </div>
        ) : !list ? (
          <div className="p-6">
            <LoadingList n={4} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8">
            <Empty
              title="Belum ada pendaftaran kantin"
              desc="Pengajuan loket mitra baru akan otomatis muncul di antrean ini."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-border-subtle/80 bg-surface-container-low/50 text-xs font-bold text-text-muted uppercase tracking-wider">
                  <th className="py-4 px-6">Nama Pemilik</th>
                  <th className="py-4 px-6">Nama Loket &amp; Lokasi</th>
                  <th className="py-4 px-6">Deskripsi Menu</th>
                  <th className="py-4 px-6">No. WhatsApp</th>
                  <th className="py-4 px-6">Tanggal Daftar</th>
                  <th className="py-4 px-6 text-right">Aksi Verifikasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle/60">
                {filtered.map((k) => (
                  <tr
                    key={k.id}
                    onClick={() => setSel(k)}
                    className={`hover:bg-primary-fixed/15 transition-colors cursor-pointer ${
                      sel?.id === k.id ? "bg-primary-fixed/25" : ""
                    }`}
                  >
                    {/* Owner column */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-surface-container-high ring-1 ring-black/10 overflow-hidden flex items-center justify-center font-bold text-primary shrink-0">
                          {k.owner_name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-on-surface">{k.owner_name}</p>
                          <span className="text-[10px] text-text-muted">
                            KTP Terunggah • Mitra Kampus
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Stall Name & Location */}
                    <td className="py-4 px-6">
                      <p className="font-bold text-on-surface">{k.name}</p>
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-primary bg-primary-fixed/50 px-2 py-0.5 rounded-full mt-0.5">
                        <MapPin size={11} /> Loket #{k.id.slice(0, 3)} Kantin UPNVJ
                      </span>
                    </td>

                    {/* Description */}
                    <td className="py-4 px-6 max-w-xs">
                      <p className="text-xs text-on-surface-variant font-medium line-clamp-2">
                        {k.description || "Menu hidangan kampus lezat & higienis."}
                      </p>
                      <span className="text-[10px] text-tertiary font-bold">
                        Estimasi saji: 5-8 Menit
                      </span>
                    </td>

                    {/* WhatsApp */}
                    <td className="py-4 px-6 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-on-surface">
                          {k.whatsapp || "-"}
                        </span>
                        {k.whatsapp && (
                          <a
                            href={`https://wa.me/${k.whatsapp.replace(/\D/g, "")}`}
                            onClick={(e) => e.stopPropagation()}
                            target="_blank"
                            rel="noreferrer"
                            title="Kirim Chat WhatsApp"
                            className="w-7 h-7 rounded-full bg-success/15 hover:bg-success text-success hover:text-white flex items-center justify-center transition-all"
                          >
                            <MessageCircle size={15} />
                          </a>
                        )}
                      </div>
                    </td>

                    {/* Registration Date */}
                    <td className="py-4 px-6 whitespace-nowrap">
                      <p className="text-xs text-on-surface">
                        {new Date(k.created_at).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                      <p className="text-[10px] text-text-muted">
                        {new Date(k.created_at).toLocaleTimeString("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        WIB
                      </p>
                    </td>

                    {/* Actions */}
                    <td
                      className="py-4 px-6 text-right whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="inline-flex items-center gap-2">
                        {tab === "PENDING" ? (
                          <>
                            <button
                              type="button"
                              onClick={() => acc(k.id)}
                              className="btn-liquid-green px-3.5 py-1.5 rounded-full text-white text-xs font-bold flex items-center gap-1 active:scale-95 transition-all shadow-sm"
                            >
                              <Check size={15} />
                              <span>ACC</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setRejecting(k)}
                              className="px-3 py-1.5 rounded-full border border-secondary text-secondary hover:bg-secondary hover:text-white text-xs font-bold flex items-center gap-1 active:scale-95 transition-all"
                            >
                              <X size={15} />
                              <span>Tolak</span>
                            </button>
                          </>
                        ) : (
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                              k.status === "ACTIVE"
                                ? "bg-success/15 text-success"
                                : "bg-error/15 text-error"
                            }`}
                          >
                            {k.status}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Bottom Pagination / Summary */}
        <div className="px-6 py-3.5 bg-surface-container-low/40 border-t border-border-subtle flex items-center justify-between text-xs text-text-muted">
          <p>
            Menampilkan {filtered.length} pengajuan pendaftaran kantin
          </p>
          <div className="flex items-center gap-1">
            <button
              disabled
              type="button"
              className="w-8 h-8 rounded-lg bg-white border border-border-specular flex items-center justify-center text-on-surface disabled:opacity-40"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              className="w-8 h-8 rounded-lg bg-primary text-white font-bold flex items-center justify-center shadow-sm"
            >
              1
            </button>
            <button
              disabled
              type="button"
              className="w-8 h-8 rounded-lg bg-white border border-border-specular flex items-center justify-center text-on-surface disabled:opacity-40"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* 4. SLIDE-OUT VERIFICATION DRAWER */}
      {sel && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm backdrop-smooth-fade"
          onClick={() => setSel(null)}
        >
          <aside
            className="fixed top-0 right-0 w-[min(490px,94vw)] h-screen z-50 liquid-glass-drawer flex flex-col shadow-2xl bg-white/95 drawer-smooth-enter"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="p-6 border-b border-border-subtle flex items-center justify-between bg-white/70">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-warning/20 text-on-tertiary-fixed-variant text-[10px] font-bold uppercase tracking-wider">
                  Review Berkas Pendaftaran
                </span>
                <h3 className="text-lg font-extrabold text-on-surface mt-1">{sel.name}</h3>
                <p className="text-xs text-text-muted">ID Pendaftaran: #{sel.id.slice(0, 8).toUpperCase()}</p>
              </div>
              <button
                type="button"
                onClick={() => setSel(null)}
                className="w-9 h-9 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface transition-colors"
                title="Tutup Detail"
              >
                <X size={20} />
              </button>
            </div>

            {/* Drawer Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Stall Location & Owner Identity Block */}
              <div className="p-4 rounded-2xl bg-white border border-border-specular shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-muted uppercase tracking-wider font-bold">
                    Profil Pemilik Loket
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-success/15 text-success text-[10px] font-bold">
                    KTP Valid
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-primary-fixed overflow-hidden ring-2 ring-primary/20 flex items-center justify-center font-black text-primary text-base shrink-0">
                    {sel.owner_name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-on-surface">{sel.owner_name}</p>
                    <p className="text-xs text-text-muted">
                      WhatsApp: {sel.whatsapp || "-"} • UPN Veteran Jakarta
                    </p>
                    <p className="text-xs text-primary font-semibold mt-0.5">
                      Loket #{sel.id.slice(0, 3)} - Kantin Terintegrasi
                    </p>
                  </div>
                </div>
              </div>

              {/* Legal Documents & Photo Preview */}
              <div>
                <h4 className="text-xs uppercase tracking-wider text-text-muted mb-3 font-bold">
                  Berkas Izin &amp; Foto Etalase Loket
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative group rounded-2xl overflow-hidden border border-border-specular bg-surface-container aspect-[4/3] flex items-center justify-center p-3 text-center">
                    {sel.banner_url ? (
                      <img
                        src={sel.banner_url}
                        alt="Banner Loket"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-1.5 text-text-muted">
                        <Store size={28} className="text-primary" />
                        <span className="text-[11px] font-bold">Foto Etalase Loket</span>
                      </div>
                    )}
                  </div>
                  <div className="relative group rounded-2xl overflow-hidden border border-border-specular bg-surface-container aspect-[4/3] flex flex-col items-center justify-center p-3 text-center">
                    <FileText size={28} className="text-success" />
                    <span className="text-[11px] font-bold mt-1 text-on-surface">
                      KTP &amp; Izin Usaha
                    </span>
                    <span className="text-[9px] text-text-muted">Terverifikasi Digital</span>
                  </div>
                </div>
              </div>

              {/* Stall Description */}
              <div className="p-4 rounded-2xl bg-white border border-border-specular shadow-sm space-y-2">
                <h4 className="text-xs uppercase tracking-wider text-text-muted font-bold">
                  Deskripsi Hidangan
                </h4>
                <p className="text-xs text-on-surface leading-relaxed">
                  {sel.description || "Hidangan kantin kampus lezat, segar, dan terjangkau bagi mahasiswa."}
                </p>
              </div>

              {/* Digital Payment & QRIS */}
              <div className="p-4 rounded-2xl bg-white border border-border-specular shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-muted uppercase tracking-wider font-bold">
                    Rekening &amp; QRIS
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-success">
                    <CheckCircle2 size={13} /> QRIS Kampus Siap
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <div>
                    <p className="text-xs font-bold text-on-surface">Rekening Mitra Terhubung</p>
                    <p className="text-xs font-mono text-on-surface">157-00-0982-XXXX</p>
                    <p className="text-[10px] text-text-muted">a.n. {sel.owner_name}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-surface-container p-2 border border-border-specular flex items-center justify-center text-primary">
                    <QrCode size={26} />
                  </div>
                </div>
              </div>
            </div>

            {/* Drawer Bottom Sticky Action Buttons */}
            {tab === "PENDING" && (
              <div className="p-6 bg-white/90 border-t border-border-subtle space-y-2">
                <button
                  type="button"
                  onClick={() => acc(sel.id)}
                  className="btn-liquid-terracotta w-full h-12 rounded-full text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
                >
                  <CheckCircle2 size={18} />
                  <span>Setujui Loket Sekarang (ACC)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRejecting(sel)}
                  className="w-full h-11 rounded-full border border-secondary text-secondary hover:bg-secondary hover:text-white font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all"
                >
                  <Ban size={16} />
                  <span>Tolak dengan Alasan</span>
                </button>
              </div>
            )}
          </aside>
        </div>
      )}

      {/* 5. REJECTION CONFIRMATION MODAL */}
      {rejecting && (
        <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm backdrop-smooth-fade flex items-center justify-center p-4">
          <div className="liquid-glass max-w-lg w-full rounded-3xl p-6 shadow-2xl border border-white space-y-5 modal-smooth-enter">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-secondary/15 text-secondary flex items-center justify-center shrink-0">
                  <AlertTriangle size={22} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-on-surface">
                    Tolak Pendaftaran Loket
                  </h3>
                  <p className="text-xs text-text-muted">{rejecting.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRejecting(null)}
                className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-text-muted"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1.5">
                  Pilih Alasan Utama Penolakan:
                </label>
                <select
                  value={reasonCategory}
                  onChange={(e) => setReasonCategory(e.target.value)}
                  className="w-full h-11 px-4 rounded-2xl bg-white border border-outline-variant/60 text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/40"
                >
                  <option value="Berkas Tidak Lengkap">
                    Berkas tidak lengkap (Foto KTP buram / Izin kedaluwarsa)
                  </option>
                  <option value="Menu Duplikat">
                    Menu duplikat dengan loket kantin yang sudah ada
                  </option>
                  <option value="Nomor Loket Tidak Sesuai">
                    Lokasi nomor loket tidak terdaftar di UPN Veteran Jakarta
                  </option>
                  <option value="Standar Higienitas">
                    Standar sanitasi &amp; peralatan belum memenuhi SOP UPNVJ
                  </option>
                  <option value="Lainnya">Alasan Lainnya</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1.5">
                  Catatan Penolakan untuk Pemilik Loket:
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Tuliskan detail perbaikan berkas agar pemilik kantin dapat mengunggah ulang pendaftaran..."
                  rows={3}
                  className="w-full p-3 rounded-2xl bg-white border border-outline-variant/60 text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/40 placeholder:text-text-muted resize-none"
                />
                <p className="text-[10px] text-text-muted mt-1">
                  Catatan ini akan otomatis tercatat dan dapat dikomunikasikan ke WhatsApp pemilik.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRejecting(null)}
                className="px-5 py-2.5 rounded-full border border-border-subtle text-text-muted text-xs font-bold hover:text-on-surface"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={rej}
                className="btn-gradient-danger px-6 py-2.5 rounded-full text-white text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all shadow-md"
              >
                <Ban size={15} />
                <span>Konfirmasi Tolak</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
