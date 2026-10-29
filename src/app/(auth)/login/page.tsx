"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Flame, ShieldCheck, User, Lock, Loader2, Eye, EyeOff, GraduationCap, Store, Check, ArrowRight, ShieldCheck as ShieldIcon } from "lucide-react";
import { api } from "@/lib/api";

type Mode = "login" | "register";
export default function Login() {
  const r = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [role, setRole] = useState<"MAHASISWA" | "PENJUAL">("MAHASISWA");
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [show, setShow] = useState(false);
  const [e, setE] = useState("");
  const [l, setL] = useState(false);

  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    setE("");
    if (u.trim().length < 4) { setE("Username minimal 4 karakter."); return; }
    if (p.length < 6) { setE("Kata sandi minimal 6 karakter."); return; }
    setL(true);
    try {
      const d = await api<{ redirectTo?: string }>("/api/auth/login", { method: "POST", body: JSON.stringify({ username: u.trim(), password: p }) });
      r.push(d.redirectTo || "/dashboard");
    } catch (err: unknown) { setE(err instanceof Error ? err.message : "Login gagal."); } finally { setL(false); }
  }

  const buyer = role === "MAHASISWA";
  return (
    <div className="min-h-screen flex justify-center items-start sm:py-6 bg-background-base">
      <div className="relative w-full max-w-[430px] min-h-screen sm:min-h-[880px] sm:rounded-[46px] sm:border-[5px] sm:border-surface-glass-alt bg-background-base flex flex-col overflow-hidden pb-10 shadow-2xl">
      <div className="pointer-events-none absolute top-0 left-0 right-0 h-96 ambient-glow-top z-0" />
      <div className="pointer-events-none absolute top-72 -left-20 w-64 h-64 bg-secondary-container/20 rounded-full blur-3xl z-0" />
      <div className="pointer-events-none absolute bottom-40 -right-20 w-64 h-64 bg-primary-fixed/40 rounded-full blur-3xl z-0" />
      <div className="relative z-10 px-margin pt-3 pb-2 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="relative w-11 h-11 rounded-full btn-tangy-gradient flex items-center justify-center p-2 shadow-lg">
            <div className="absolute inset-0 rounded-full border border-white/60" />
            <Flame className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <h1 className="font-headline-hero-mobile text-headline-hero-mobile text-on-surface tracking-tight">Veta<span className="text-primary-container">Bite</span></h1>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-label-micro font-label-micro bg-primary-fixed text-primary font-extrabold uppercase">UPNVJ</span>
            </div>
            <p className="font-label-sm text-label-sm text-text-muted uppercase tracking-wider">UPN VETERAN JAKARTA • PICK-UP KANTIN</p>
          </div>
        </div>
        <div className="w-9 h-9 rounded-full bg-white/70 border border-white/90 flex items-center justify-center shadow-sm">
          <ShieldCheck className="w-5 h-5 text-secondary" />
        </div>
      </div>
      <main className="relative z-10 px-margin pt-2 flex flex-col space-y-4">
        <section className="liquid-panel-dark rounded-[24px] p-5 text-white relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none opacity-20">
            <svg className="w-full h-full" fill="none" viewBox="0 0 390 140"><circle cx="340" cy="20" r="90" stroke="white" strokeDasharray="4 4" strokeWidth="1.2" /><path d="M-10 130 Q120 40 260 90 T420 20" stroke="white" strokeWidth="1" /></svg>
          </div>
          <div className="relative z-10 flex flex-col space-y-2">
            <div className="self-start inline-flex items-center space-x-1.5 bg-black/25 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
              <ShieldCheck className="w-3.5 h-3.5 text-primary-fixed" />
              <span className="font-label-sm text-label-sm tracking-wider uppercase text-primary-fixed">PORTAL BELA NEGARA</span>
            </div>
            <h2 className="font-headline-lg text-headline-lg text-white font-extrabold tracking-tight pt-0.5">{mode === "login" ? "Masuk ke VetaBite." : "Daftar Akun VetaBite."}</h2>
            <p className="font-body-sm text-body-sm text-white/85 leading-relaxed pr-2">Pesan kuliner kantin favoritmu tanpa antre. Terbuka untuk seluruh mahasiswa, dosen, staf, hingga pengunjung umum di Kantin FISIP, FIK, FH, dan Gedung Dr. Soetomo.</p>
          </div>
        </section>
        <section className="liquid-panel rounded-[26px] p-5 flex flex-col space-y-4">
          <div className="p-1 bg-surface-dim/50 rounded-2xl flex items-center shadow-inner border border-white/60">
            <button className={`flex-1 py-2 rounded-xl text-label-md font-bold transition-all ${mode === "login" ? "shadow-sm bg-white text-on-surface" : "text-text-muted hover:text-on-surface"}`} type="button" onClick={() => setMode("login")}>Masuk (Login)</button>
            <button className={`flex-1 py-2 rounded-xl text-label-md font-bold transition-all ${mode === "register" ? "shadow-sm bg-white text-on-surface" : "text-text-muted hover:text-on-surface"}`} type="button" onClick={() => { setMode("register"); r.push("/register"); }}>Daftar (Register)</button>
          </div>
          <div className="flex flex-col items-center text-center space-y-1">
            <h3 className="font-headline-md text-headline-md text-on-surface font-extrabold tracking-tight">Login Akun Kampus</h3>
            <p className="font-body-sm text-body-sm text-text-muted leading-relaxed px-1">Pilih peran akun Anda untuk melanjutkan akses cepat.</p>
          </div>
          <form onSubmit={submit} className="flex flex-col space-y-3">
            <label className="liquid-field rounded-2xl flex items-center gap-2 px-3 py-3">
              <User className="w-4 h-4 text-text-muted shrink-0" />
              <input value={u} onChange={(ev) => setU(ev.target.value)} placeholder="Username" autoComplete="username" className="bg-transparent outline-none flex-1 text-sm text-on-surface placeholder:text-text-muted" />
            </label>
            <label className="liquid-field rounded-2xl flex items-center gap-2 px-3 py-3">
              <Lock className="w-4 h-4 text-text-muted shrink-0" />
              <input value={p} onChange={(ev) => setP(ev.target.value)} type={show ? "text" : "password"} placeholder="Kata sandi" autoComplete="current-password" className="bg-transparent outline-none flex-1 text-sm text-on-surface placeholder:text-text-muted" />
              <button type="button" onClick={() => setShow((s) => !s)} aria-label="Tampilkan sandi">{show ? <EyeOff className="w-4 h-4 text-text-muted" /> : <Eye className="w-4 h-4 text-text-muted" />}</button>
            </label>
            {e && <p className="text-sm font-bold text-danger bg-danger/10 border border-danger/30 rounded-xl px-3 py-2">{e}</p>}
            <button disabled={l} className="btn-tangy-gradient w-full py-3 rounded-full flex items-center justify-center gap-2 text-white font-extrabold text-sm active:scale-[0.98] transition-all disabled:opacity-60" type="submit">
              {l ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              {l ? "Memproses..." : "Masuk ke VetaBite"}
            </button>
          </form>
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="font-label-sm text-label-sm text-text-muted uppercase tracking-wider font-extrabold">PILIH PERAN AKUN</span>
              <span className="text-[10px] font-bold text-primary bg-primary-fixed/60 px-2 py-0.5 rounded-full">Civitas &amp; Pengunjung</span>
            </div>
            <div className="flex flex-row space-x-2.5">
              <button type="button" onClick={() => setRole("MAHASISWA")} className={`liquid-card-role ${buyer ? "is-active" : ""} rounded-2xl p-3 relative overflow-hidden flex flex-col flex-1 min-w-0 transition-all text-left`}>
                <div className="flex items-center justify-between w-full mb-2">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${buyer ? "bg-primary text-white" : "bg-surface-container-high text-on-surface-variant"}`}><GraduationCap className="w-4 h-4" /></div>
                  {buyer && <span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center shrink-0"><Check className="w-3 h-3" /></span>}
                </div>
                <h4 className="text-[13px] leading-snug text-on-surface font-extrabold tracking-tight mb-1">Pembeli / Mahasiswa</h4>
                <p className="text-[11px] text-text-muted leading-snug">Pesan makanan &amp; pick-up cepat tanpa antri di kantin.</p>
              </button>
              <button type="button" onClick={() => setRole("PENJUAL")} className={`liquid-card-role ${!buyer ? "is-active" : ""} rounded-2xl p-3 relative overflow-hidden flex flex-col flex-1 min-w-0 transition-all text-left`}>
                <div className="flex items-center justify-between w-full mb-2">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${!buyer ? "bg-primary text-white" : "bg-surface-container-high text-on-surface-variant"}`}><Store className="w-4 h-4" /></div>
                  {!buyer && <span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center shrink-0"><Check className="w-3 h-3" /></span>}
                </div>
                <h4 className="text-[13px] leading-snug text-on-surface font-extrabold tracking-tight mb-1">Pemilik / Ibu Kantin</h4>
                <p className="text-[11px] text-text-muted leading-snug">Kelola stan loket, stok harian, &amp; pesanan mahasiswa.</p>
              </button>
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-white/75 border border-white/90 flex items-start space-x-2.5 shadow-sm">
            <div className="w-6 h-6 rounded-full bg-emerald-100 text-success flex items-center justify-center shrink-0 mt-0.5"><Check className="w-3.5 h-3.5" /></div>
            <div className="flex flex-col space-y-0.5">
              <span className="font-label-sm text-label-sm text-on-surface font-extrabold tracking-tight">{buyer ? "Akses Langsung Seketika" : "Verifikasi Admin 1x24 Jam"}</span>
              <p className="text-[11px] text-text-muted leading-snug">{buyer ? "Akun pembeli aktif otomatis setelah login pertama." : "Akun penjual diperiksa admin sebelum loket tampil. Belum punya akun? "}<Link href="/register" className="text-primary font-bold hover:underline">Daftar di sini</Link></p>
            </div>
          </div>
        </section>
        <div className="flex items-center justify-between px-2 pt-1 pb-1">
          <div className="flex items-center space-x-2">
            <span className="relative flex h-2.5 w-2.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" /></span>
            <span className="font-label-sm text-label-sm text-on-surface font-bold">18 Loket Buka di Kampus Pondok Labu &amp; Limo</span>
          </div>
          <Link href="/" className="font-label-sm text-label-sm text-primary font-bold hover:underline">Beranda</Link>
        </div>
      </main>
      <footer className="mt-auto px-margin pt-3 pb-6 flex flex-col items-center justify-center text-center space-y-1">
        <div className="flex items-center space-x-2 text-text-muted">
          <ShieldIcon className="w-3.5 h-3.5 text-success" />
          <span className="font-label-sm text-label-sm">Autentikasi Terenkripsi VetaBite</span>
        </div>
        <p className="font-label-micro text-label-micro text-text-muted">VetaBite UPN &quot;Veteran&quot; Jakarta v2.5</p>
        <p className="font-label-micro text-label-micro text-text-muted/60">Biro Kemahasiswaan &amp; Kerjasama UPNVJ © 2024</p>
      </footer>
      </div>
    </div>
  );
}
