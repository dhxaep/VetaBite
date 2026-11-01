"use client";

import { useState } from "react";
import {
  Headphones,
  X,
  Send,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  MessageSquare,
  HelpCircle,
  PhoneCall,
  Clock
} from "lucide-react";
import { api } from "@/lib/api";

const CATEGORIES = [
  "Pesanan Salah / Kurang",
  "Makanan Terlambat Saji",
  "Kendala Pembayaran / QRIS",
  "Keluhan Pelayanan Loket",
  "Masalah Akun / Teknis",
  "Lainnya"
];

export function CustomerServiceBubble() {
  const [isOpen, setIsOpen] = useState(false);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [orderId, setOrderId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const fullSubject = `[${category}] ${subject.trim()}`;
    if (subject.trim().length < 3) {
      setError("Subjek laporan minimal 3 karakter.");
      return;
    }
    if (body.trim().length < 5) {
      setError("Rincian masalah minimal 5 karakter.");
      return;
    }

    setLoading(true);
    try {
      await api("/api/admin/complaints", {
        method: "POST",
        body: JSON.stringify({
          subject: fullSubject,
          body: body.trim(),
          order_id: orderId.trim() || undefined
        })
      });
      setIsSuccess(true);
      setSubject("");
      setBody("");
      setOrderId("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal mengirim laporan masalah.");
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setIsSuccess(false);
    setError("");
    setSubject("");
    setBody("");
    setOrderId("");
  }

  return (
    <>
      {/* Floating CS Chat Bubble Trigger Button - Bound to 430px mobile envelope */}
      <div className="fixed bottom-24 left-0 right-0 max-w-[430px] mx-auto pointer-events-none z-40 px-4 flex justify-end">
        <button
          type="button"
          aria-label="Pusat Bantuan dan Lapor Masalah"
          onClick={() => {
            setIsOpen(true);
            if (isSuccess) handleReset();
          }}
          className="pointer-events-auto relative w-12 h-12 rounded-full btn-tangy-gradient p-3 shadow-xl shadow-orange-950/30 border-2 border-white/95 active:scale-95 transition-all flex items-center justify-center text-white hover:brightness-105"
        >
          {/* Pulsing Admin Ready Indicator Ring */}
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white shadow-xs" />
          </span>

          <Headphones className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Floating Liquid Glass Modal Dialog - Centered with high z-index */}
      {isOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsOpen(false);
          }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md modal-smooth-enter"
        >
          <div
            className="w-full max-w-[390px] max-h-[85vh] bg-surface-glass-alt backdrop-blur-2xl rounded-[30px] border-2 border-white/95 shadow-2xl flex flex-col overflow-hidden text-on-surface"
            role="dialog"
            aria-modal="true"
          >
            {/* Header Modal */}
            <div className="p-4 pb-3 border-b border-border-subtle flex items-center justify-between bg-white/40">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl btn-tangy-gradient flex items-center justify-center text-white shadow-sm">
                  <Headphones className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-headline-sm text-headline-sm font-extrabold text-on-surface leading-tight">
                      Pusat Bantuan &amp; Komplain
                    </h3>
                    <span className="px-1.5 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      Admin Siaga
                    </span>
                  </div>
                  <p className="font-label-micro text-label-micro text-text-muted">
                    Laporan masuk langsung ke Admin Kampus UPNVJ
                  </p>
                </div>
              </div>
              <button
                type="button"
                aria-label="Tutup Bantuan"
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-white/80 border border-white flex items-center justify-center text-text-muted hover:text-on-surface active:scale-90 transition-transform shadow-xs"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto space-y-3.5">
              {isSuccess ? (
                /* Success Confirmation State */
                <div className="py-6 flex flex-col items-center text-center space-y-3">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 border border-emerald-300 text-success flex items-center justify-center shadow-inner">
                    <CheckCircle2 className="w-9 h-9" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-headline-md text-headline-md font-extrabold text-on-surface">
                      Laporan Berhasil Terkirim!
                    </h4>
                    <p className="font-body-sm text-body-sm text-text-muted px-2 leading-relaxed">
                      Laporan masalah Anda telah diteruskan ke layar admin (<span className="font-semibold text-primary">/admin/komplain</span>). Tim layanan akan memverifikasi dan merespon secepatnya.
                    </p>
                  </div>

                  <div className="w-full p-3 rounded-2xl bg-white/70 border border-white/90 text-left space-y-1 mt-2 shadow-xs">
                    <div className="flex items-center gap-1.5 text-success font-bold text-xs">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Estimasi Tindak Lanjut</span>
                    </div>
                    <p className="text-[11px] text-text-muted leading-snug">
                      Maksimal 1x24 jam kerja hari kuliah. Pantau status berkala atau cek respon admin di loket terkait.
                    </p>
                  </div>

                  <div className="pt-2 w-full flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      className="w-full py-2.5 rounded-full btn-tangy-gradient text-white font-bold text-sm shadow-sm active:scale-95 transition-all"
                    >
                      Selesai &amp; Tutup
                    </button>
                    <button
                      type="button"
                      onClick={handleReset}
                      className="w-full py-2 rounded-full bg-white/60 border border-border-subtle text-text-muted hover:text-on-surface font-bold text-xs active:scale-95 transition-all"
                    >
                      Lapor Masalah Lain
                    </button>
                  </div>
                </div>
              ) : (
                /* Report Form State */
                <form onSubmit={handleSubmit} className="space-y-3">
                  {/* Category Pills */}
                  <div>
                    <label className="font-label-sm text-label-sm text-text-muted font-bold block mb-1.5">
                      Pilih Jenis Kendala
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {CATEGORIES.map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setCategory(cat)}
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all border ${
                            category === cat
                              ? "bg-primary text-white border-primary shadow-xs"
                              : "bg-white/70 text-text-muted hover:text-on-surface border-white/90"
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Subject Input */}
                  <div>
                    <label className="font-label-sm text-label-sm text-text-muted font-bold block mb-1">
                      Subjek Singkat Kendala
                    </label>
                    <div className="relative flex items-center">
                      <HelpCircle className="w-4 h-4 text-text-muted absolute left-3 pointer-events-none" />
                      <input
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="Contoh: Salah menu di Loket Bu Darto"
                        className="w-full rounded-xl liquid-glass-input pl-9 pr-3 py-2 text-xs font-medium text-on-surface placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 border border-border-specular"
                      />
                    </div>
                  </div>

                  {/* Body Textarea */}
                  <div>
                    <label className="font-label-sm text-label-sm text-text-muted font-bold block mb-1">
                      Keterangan Rinci
                    </label>
                    <textarea
                      rows={3}
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      placeholder="Jelaskan kendala yang dialami secara singkat, kronologi, atau catatan untuk pengelola kantin..."
                      className="w-full rounded-xl liquid-glass-input p-3 text-xs font-medium text-on-surface placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 border border-border-specular resize-none"
                    />
                  </div>

                  {/* Order ID (Optional) */}
                  <div>
                    <label className="font-label-sm text-label-sm text-text-muted font-bold block mb-1">
                      Nomor Antrean / ID Pesanan <span className="font-normal text-[10px] text-text-muted">(Opsional)</span>
                    </label>
                    <input
                      type="text"
                      value={orderId}
                      onChange={(e) => setOrderId(e.target.value)}
                      placeholder="Misal: A-012 atau ID Transaksi"
                      className="w-full rounded-xl liquid-glass-input px-3 py-2 text-xs font-medium text-on-surface placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 border border-border-specular"
                    />
                  </div>

                  {error && (
                    <div className="p-2.5 rounded-xl bg-danger/10 border border-danger/30 flex items-center gap-2 text-danger text-xs font-bold">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 rounded-full btn-tangy-gradient text-white font-bold text-xs shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    <span>{loading ? "Mengirim ke Admin..." : "Kirim Laporan ke Admin"}</span>
                  </button>
                </form>
              )}

              {/* Urgent WhatsApp Contact Fallback */}
              <div className="pt-2 border-t border-border-subtle flex items-center justify-between text-[11px] text-text-muted">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-success" />
                  Layanan Resmi Kemahasiswaan
                </span>
                <a
                  href="https://wa.me/6281234567890?text=Halo%20Admin%20VetaBite,%20saya%20butuh%20bantuan"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-primary font-bold hover:underline"
                >
                  <PhoneCall className="w-3 h-3" />
                  <span>WhatsApp Admin</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
