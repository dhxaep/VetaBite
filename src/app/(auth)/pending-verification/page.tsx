"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Clock, FileSearch, RefreshCw, ArrowLeft, LogOut, Check, Store } from "lucide-react";
import { api } from "@/lib/api";

export default function Pending() {
  const r = useRouter();
  const [checking, setChecking] = useState(false);
  const [msg, setMsg] = useState("");

  async function refresh() {
    setChecking(true); setMsg("");
    try {
      const d = await api<{ approved: boolean; status: string; reject_reason?: string }>("/api/auth/me", { method: "GET" });
      if (d.approved) { r.push("/seller/pesanan"); }
      else if (d.status === "REJECTED") {
        setMsg(`Pengajuan loket ditolak. Alasan: ${d.reject_reason || "Tidak memenuhi kriteria"}`);
      } else {
        setMsg("Status masih menunggu. Admin belum menyetujui loket Anda.");
      }
    } catch (err: unknown) { setMsg(err instanceof Error ? err.message : "Gagal memeriksa status."); }
    finally { setChecking(false); }
  }
  async function logout() {
    try { await api("/api/auth/logout", { method: "POST" }); } catch { /* abaikan */ }
    r.push("/login");
  }

  return (
    <div className="min-h-screen flex justify-center items-start sm:py-6 bg-background-base">
      <main className="w-full max-w-[430px] min-h-screen sm:min-h-[880px] sm:rounded-[46px] sm:border-[5px] sm:border-surface-glass-alt relative flex flex-col bg-background-base overflow-x-hidden shadow-2xl">
      <div className="px-margin py-3 flex-1 flex flex-col space-y-4">
        <section className="glass-panel rounded-[22px] p-5 flex flex-col items-center text-center relative overflow-hidden">
          <div className="inline-flex items-center space-x-1.5 bg-warning/15 text-tertiary border border-warning/30 px-3 py-1 rounded-full mb-4">
            <span className="w-2 h-2 rounded-full bg-warning pulse-dot" />
            <span className="font-label-sm text-label-sm font-extrabold uppercase tracking-wider">Menunggu Persetujuan Admin</span>
          </div>
          <div className="relative w-24 h-24 mb-4 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-primary/20 via-tertiary-fixed to-secondary-fixed/30 blur-lg" />
            <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-b from-white/95 to-surface-container-low p-3.5 border border-border-specular shadow-md flex items-center justify-center">
              <FileSearch className="w-12 h-12 text-primary" />
            </div>
          </div>
          <h2 className="font-headline-lg text-headline-lg-mobile text-on-surface mb-2 tracking-tight">Akun kamu sedang diverifikasi</h2>
          <p className="font-body-md text-body-md text-text-muted leading-relaxed px-1">Admin Utama Biro Kemahasiswaan &amp; Pengelola Kantin sedang memeriksa kelengkapan berkas loketmu.</p>
          <div className="w-full mt-4 p-3 rounded-xl bg-surface-container/60 border border-border-specular/80 text-left flex items-start space-x-3">
            <div className="w-8 h-8 rounded-lg bg-primary-fixed flex items-center justify-center text-primary flex-shrink-0 mt-0.5"><Store className="w-4 h-4" /></div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm text-primary font-extrabold uppercase">Loket Terdaftar</span>
                <span className="font-label-micro text-label-micro text-text-muted font-bold">Kantin UPNVJ</span>
              </div>
              <p className="font-headline-sm text-headline-sm text-on-surface">Pendaftaran Anda tercatat</p>
              <p className="font-body-sm text-body-sm text-text-muted">Kami akan memberi kabar lewat WhatsApp setelah disetujui.</p>
            </div>
          </div>
          <div className="w-full mt-5 pt-4 border-t border-border-subtle/40">
            <div className="relative flex items-center justify-between w-full px-2">
              <div className="absolute left-6 right-6 top-4 h-[2px] bg-outline-variant/40 -z-0" />
              <div className="absolute left-6 w-1/2 top-4 h-[2px] bg-gradient-to-r from-success to-warning -z-0" />
              <div className="flex flex-col items-center z-10">
                <div className="w-8 h-8 rounded-full bg-success text-white flex items-center justify-center shadow-sm ring-4 ring-background-base"><Check className="w-4 h-4" /></div>
                <span className="font-label-micro text-label-micro font-extrabold text-success mt-1.5 uppercase">Terkirim</span>
              </div>
              <div className="flex flex-col items-center z-10">
                <div className="w-8 h-8 rounded-full bg-warning text-white flex items-center justify-center shadow-md ring-4 ring-background-base relative"><Clock className="w-4 h-4" /></div>
                <span className="font-label-micro text-label-micro font-extrabold text-tertiary mt-1.5 uppercase">Verifikasi</span>
                <span className="text-tertiary font-bold text-[10px]">Sedang Dicek</span>
              </div>
              <div className="flex flex-col items-center z-10">
                <div className="w-8 h-8 rounded-full bg-surface-container-high text-text-muted flex items-center justify-center border border-outline-variant/60 ring-4 ring-background-base"><Store className="w-3.5 h-3.5" /></div>
                <span className="font-label-micro text-label-micro font-extrabold text-text-muted mt-1.5 uppercase">Aktif</span>
                <span className="text-text-muted text-[10px]">Siap Buka</span>
              </div>
            </div>
          </div>
          <div className="w-full mt-4 p-3 rounded-xl bg-surface-container-lowest/70 border border-border-specular flex items-center space-x-2.5 text-left">
            <Clock className="w-5 h-5 text-tertiary flex-shrink-0" />
            <p className="font-body-sm text-body-sm text-text-muted leading-tight">Estimasi waktu verifikasi <span className="font-bold text-on-surface">1x24 jam kerja</span> hari aktif kampus UPN &quot;Veteran&quot; Jakarta.</p>
          </div>
          {msg && <p className="w-full mt-3 text-sm font-bold text-text-muted bg-surface-container/60 border border-border-specular rounded-xl px-3 py-2">{msg}</p>}
        </section>
        <div className="space-y-2.5 pt-1">
          <button onClick={refresh} disabled={checking} className="w-full py-3 px-4 rounded-full glass-btn text-on-surface font-headline-sm text-headline-sm flex items-center justify-center space-x-2 hover:bg-white transition-all disabled:opacity-60">
            <RefreshCw className={`w-4 h-4 text-primary ${checking ? "animate-spin" : ""}`} />
            <span>{checking ? "Memeriksa..." : "Periksa Status Terkini"}</span>
          </button>
          <Link className="w-full py-2.5 px-4 rounded-full text-center font-label-lg text-label-lg text-text-muted hover:text-on-surface flex items-center justify-center space-x-1.5 transition-colors" href="/login">
            <ArrowLeft className="w-4 h-4" />
            <span>Keluar ke Halaman Masuk</span>
          </Link>
          <button onClick={logout} className="w-full py-2.5 px-4 rounded-full text-center text-sm font-bold text-text-muted hover:text-danger flex items-center justify-center gap-1.5">
            <LogOut className="w-4 h-4" /> Keluar dari akun
          </button>
        </div>
        <div className="text-center pt-2 pb-6">
          <p className="font-body-sm text-body-sm text-text-muted">Perlu bantuan aktivasi loket kantin?</p>
          <span className="font-label-sm text-label-sm text-primary font-bold inline-flex items-center space-x-1 mt-0.5">Hubungi Tim Kemahasiswaan UPNVJ</span>
        </div>
      </div>
    </main>
    </div>
  );
}
