"use client";

import { useEffect, useState } from "react";
import {
  Send,
  Search,
  Clock,
  User,
  Store,
  BadgeCheck,
  ReceiptText,
  FileText,
  MessagesSquare,
  CheckCircle2,
  AlertCircle,
  MessageCircle,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";
import { api } from "@/lib/api";
import { LoadingList, Empty, ErrorBox } from "@/components/States";

type M = {
  id: string;
  sender: string;
  body: string;
  created_at: string;
  photo_url?: string;
};

type T = {
  id: string;
  reporter_name: string;
  reporter_role: string;
  subject: string;
  preview: string;
  status: string;
  created_at: string;
  order_id?: string;
  messages: M[];
};

export default function KomplainPage() {
  const [role, setRole] = useState("Semua");
  const [st, setSt] = useState("Semua");
  const [list, setList] = useState<T[] | null>(null);
  const [err, setErr] = useState("");
  const [sel, setSel] = useState<T | null>(null);
  const [reply, setReply] = useState("");
  const [q, setQ] = useState("");

  const load = async () => {
    try {
      setErr("");
      const d = await api<{ complaints: T[] }>(
        `/api/admin/complaints?role=${role}&status=${st}`
      );
      setList(d.complaints);
      if (d.complaints.length && !sel) setSel(d.complaints[0]);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  };

  useEffect(() => {
    load();
  }, [role, st]);

  const send = async () => {
    if (!reply.trim() || !sel) return;
    await api(`/api/admin/complaints/${sel.id}/messages`, {
      method: "POST",
      body: JSON.stringify({ body: reply }),
    });
    setReply("");
    const d = await api<T>(`/api/admin/complaints/${sel.id}`);
    setSel(d);
    load();
  };

  const setStatus = async (s: string) => {
    if (!sel) return;
    await api(`/api/admin/complaints/${sel.id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: s }),
    });
    setSel({ ...sel, status: s });
    load();
  };

  const filtered = (list ?? []).filter((t) =>
    (t.subject + t.preview + t.reporter_name + (t.order_id ?? ""))
      .toLowerCase()
      .includes(q.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* TWO-PANEL RESOLUTION & COMPLAINTS LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT PANEL: Ticket Inbox Cluster */}
        <section className="lg:col-span-5 liquid-glass rounded-3xl overflow-hidden shadow-lg border border-border-specular flex flex-col max-h-[calc(100vh-140px)]">
          {/* Inbox Header & Statistics */}
          <div className="p-5 pb-3 border-b border-border-subtle flex flex-col gap-3 bg-white/40">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold text-on-surface">Pusat Komplain &amp; Tiket</h2>
                <p className="text-xs text-text-muted mt-0.5">Pantau keluhan transaksi real-time</p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary font-bold text-[10px] uppercase tracking-wider animate-pulse">
                {filtered.length} Tiket
              </span>
            </div>

            {/* Source Segmented Control */}
            <div className="grid grid-cols-3 gap-1 p-1 bg-surface-container-high/60 rounded-full border border-white/60">
              {["Semua", "Mahasiswa", "Penjual"].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setRole(v)}
                  className={`py-1.5 px-2 rounded-full text-center text-xs font-bold transition-all ${
                    role === v
                      ? "bg-white shadow-sm text-primary"
                      : "text-text-muted hover:text-on-surface"
                  }`}
                >
                  {v === "Semua" ? "Semua Tiket" : v === "Mahasiswa" ? "Mahasiswa" : "Pemilik Loket"}
                </button>
              ))}
            </div>

            {/* Status Filter Horizontal Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-1 text-xs">
              {[
                ["Semua", "Semua Status"],
                ["BARU", "Baru"],
                ["DIPROSES", "Diproses"],
                ["SELESAI", "Selesai"],
              ].map(([v, l]) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setSt(v)}
                  className={`px-3 py-1 rounded-full shrink-0 font-bold transition-all ${
                    st === v
                      ? "bg-primary text-white shadow-sm"
                      : "bg-white/70 text-text-muted hover:bg-white"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>

            {/* Ticket Search Field */}
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Saring kata kunci subjek keluhan..."
                className="w-full h-9 pl-9 pr-3 text-xs rounded-full bg-white/80 border border-white shadow-inner focus:outline-none focus:ring-1 focus:ring-primary/40 text-on-surface placeholder:text-text-muted"
              />
            </div>
          </div>

          {/* Tickets Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {err ? (
              <ErrorBox msg={err} onRetry={load} />
            ) : !list ? (
              <LoadingList n={4} />
            ) : filtered.length === 0 ? (
              <Empty
                title="Tidak ada tiket"
                desc="Semua keluhan telah terselesaikan dengan baik."
              />
            ) : (
              filtered.map((t) => {
                const isSelected = sel?.id === t.id;
                return (
                  <div
                    key={t.id}
                    onClick={() => setSel(t)}
                    className={`rounded-2xl p-4 cursor-pointer transition-all duration-200 border ${
                      isSelected
                        ? "bg-white/95 border-primary shadow-lg ring-2 ring-primary/20 scale-[0.99]"
                        : "bg-white/70 border-white hover:bg-white/90 shadow-sm"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            t.reporter_role === "Mahasiswa"
                              ? "bg-gradient-to-r from-primary to-primary-container text-white"
                              : "bg-amber-500/20 text-amber-800 border border-amber-500/30"
                          }`}
                        >
                          {t.reporter_role}
                        </span>
                        <span className="text-xs font-extrabold text-on-surface">
                          #{t.id.slice(0, 6).toUpperCase()}
                        </span>
                      </div>
                      <span className="text-[10px] text-text-muted flex items-center gap-1 font-medium">
                        <Clock size={11} />
                        {new Date(t.created_at).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    </div>

                    <h3 className="text-xs font-bold text-on-surface leading-snug">
                      {t.subject}
                    </h3>
                    <p className="text-xs text-text-muted line-clamp-2 mt-1">
                      {t.preview}
                    </p>

                    <div className="mt-3 pt-2.5 border-t border-border-subtle flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        {t.reporter_role === "Mahasiswa" ? (
                          <User size={13} className="text-text-muted" />
                        ) : (
                          <Store size={13} className="text-text-muted" />
                        )}
                        <span className="text-xs font-semibold text-on-surface">
                          {t.reporter_name}
                        </span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          t.status === "BARU"
                            ? "bg-primary-fixed text-primary"
                            : t.status === "DIPROSES"
                            ? "bg-warning/20 text-tertiary-container"
                            : "bg-surface-container-high text-on-surface-variant"
                        }`}
                      >
                        {t.status === "BARU"
                          ? "Baru Masuk"
                          : t.status === "DIPROSES"
                          ? "Sedang Ditinjau"
                          : "Selesai"}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* RIGHT PANEL: Selected Ticket Detailed Resolution Canvas */}
        <section className="lg:col-span-7 flex flex-col space-y-5">
          {!sel ? (
            <div className="liquid-glass rounded-3xl p-12 text-center shadow-md">
              <Empty
                title="Pilih Tiket Komplain"
                desc="Klik tiket pada daftar di sebelah kiri untuk melihat rincian investigasi dan resolusi."
              />
            </div>
          ) : (
            <>
              {/* Top Resolution Bar */}
              <div className="liquid-glass rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black shrink-0 border border-primary/20">
                    <ShieldAlert size={22} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="text-base font-extrabold text-on-surface">
                        Tiket #{sel.id.slice(0, 6).toUpperCase()}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-primary text-white text-[10px] font-extrabold uppercase">
                        Prioritas Tinggi
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-text-muted">
                      <span>
                        Dilaporkan{" "}
                        {new Date(sel.created_at).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                      <span>•</span>
                      <span className="text-primary font-semibold">
                        SLA Respon 15 Menit
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status Dropdown & Actions */}
                <div className="flex items-center gap-3">
                  <select
                    value={sel.status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="bg-white/80 border border-white rounded-full px-3.5 py-2 text-xs font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 shadow-sm"
                  >
                    <option value="BARU">Baru Masuk</option>
                    <option value="DIPROSES">Sedang Diproses</option>
                    <option value="SELESAI">Selesai (Ditutup)</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => setStatus("SELESAI")}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-success text-white text-xs font-bold shadow-md hover:brightness-105 active:scale-95 transition-all"
                  >
                    <CheckCircle2 size={16} />
                    <span>Tandai Selesai</span>
                  </button>
                </div>
              </div>

              {/* Bento Cluster: User Profile & Order Context */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                {/* Reporter Profile (7 cols) */}
                <div className="md:col-span-7 liquid-glass rounded-3xl p-5 shadow-sm space-y-3">
                  <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
                    <span className="text-xs uppercase text-text-muted tracking-wider font-bold flex items-center gap-1.5">
                      <BadgeCheck size={15} className="text-primary" />
                      Profil Pelapor ({sel.reporter_role})
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-success/15 text-success font-bold">
                      Akun SIAKAD Terverifikasi
                    </span>
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-on-surface">
                      {sel.reporter_name}
                    </h4>
                    <p className="text-xs text-text-muted mt-0.5">
                      Mahasiswa Aktif UPN Veteran Jakarta
                    </p>
                    <div className="flex items-center gap-3 pt-2 text-xs">
                      <span className="text-success font-bold flex items-center gap-1">
                        <MessageCircle size={14} /> WhatsApp Terhubung
                      </span>
                      <span className="text-border-subtle">|</span>
                      <span className="text-text-muted">Skor Reputasi: 98/100</span>
                    </div>
                  </div>
                </div>

                {/* Associated Order (5 cols) */}
                <div className="md:col-span-5 liquid-glass rounded-3xl p-5 shadow-sm space-y-2">
                  <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
                    <span className="text-xs uppercase text-text-muted tracking-wider font-bold flex items-center gap-1.5">
                      <ReceiptText size={15} className="text-primary" />
                      Pesanan Terkait
                    </span>
                    <span className="text-[10px] text-primary font-bold">Log Kantin</span>
                  </div>
                  <div>
                    <span className="text-xs font-extrabold text-primary">
                      {sel.order_id ? `#ORD-${sel.order_id.slice(0, 6).toUpperCase()}` : "Tanpa Nomor Order"}
                    </span>
                    <p className="text-xs font-bold text-on-surface mt-0.5 line-clamp-1">
                      {sel.subject}
                    </p>
                    <p className="text-[11px] text-text-muted mt-1">
                      Metode: QRIS Statis UPNVJ (Lunas)
                    </p>
                  </div>
                </div>
              </div>

              {/* Chat & Investigation History Feed */}
              <div className="liquid-glass rounded-3xl p-6 shadow-md space-y-4">
                <h4 className="text-xs font-extrabold text-on-surface uppercase tracking-wider flex items-center gap-2">
                  <MessagesSquare size={16} className="text-primary" />
                  Riwayat Penanganan &amp; Catatan Investigasi
                </h4>
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {sel.messages.map((m) => (
                    <div key={m.id} className="flex items-start gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ring-2 ring-white shrink-0 ${
                          m.sender === "ADMIN"
                            ? "bg-primary text-white"
                            : "bg-surface-container-high text-primary"
                        }`}
                      >
                        {m.sender === "ADMIN" ? "ADM" : m.sender.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 bg-white/70 p-3.5 rounded-2xl rounded-tl-none border border-white shadow-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-on-surface">{m.sender}</span>
                          <span className="text-[10px] text-text-muted">
                            {new Date(m.created_at).toLocaleTimeString("id-ID", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}{" "}
                            WIB
                          </span>
                        </div>
                        <p className="text-xs text-on-surface leading-relaxed">{m.body}</p>
                        {m.photo_url && (
                          <img
                            src={m.photo_url}
                            alt="Bukti Foto"
                            className="w-24 h-24 rounded-xl object-cover mt-2 border border-border-specular shadow-sm"
                          />
                        )}
                      </div>
                    </div>
                  ))}
                  {sel.messages.length === 0 && (
                    <p className="text-xs text-text-muted italic">
                      Belum ada pesan resmi. Kirim solusi pertama melalui form di bawah.
                    </p>
                  )}
                </div>
              </div>

              {/* Official Resolution Response Form */}
              <div className="liquid-glass rounded-3xl p-6 shadow-md space-y-4">
                <h4 className="text-xs font-extrabold text-on-surface uppercase tracking-wider flex items-center gap-2">
                  <Send size={16} className="text-primary" />
                  Kirim Respon Resmi &amp; Resolusi Tiket
                </h4>

                {/* Quick Solution Templates */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-text-muted font-bold">Template Solusi:</span>
                  {[
                    "Pengembalian Saldo QRIS",
                    "Peringatan SOP Higienitas ke Loket",
                    "Klarifikasi Makanan Telah Ditukar",
                  ].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setReply(t)}
                      className="px-3 py-1 rounded-full bg-surface-container border border-border-specular text-primary font-bold text-xs hover:bg-primary hover:text-white transition-all active:scale-95"
                    >
                      {t}
                    </button>
                  ))}
                </div>

                <textarea
                  rows={3}
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Tuliskan keterangan resmi resolusi komplain kepada mahasiswa dan pemilik loket..."
                  className="w-full p-3.5 rounded-2xl bg-white border border-border-specular text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 shadow-inner resize-none"
                />

                <div className="flex items-center justify-end">
                  <button
                    type="button"
                    onClick={send}
                    className="btn-liquid-terracotta px-6 py-2.5 rounded-full text-white font-bold text-xs flex items-center gap-2 active:scale-95 transition-all shadow-md"
                  >
                    <CheckCircle2 size={16} />
                    <span>Kirim Solusi &amp; Notifikasi Pelapor</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
