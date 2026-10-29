"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Flame, ShieldCheck, Loader2, GraduationCap, Store, Check, ArrowRight, Eye, EyeOff } from "lucide-react";
import { api } from "@/lib/api";

type Role = "MAHASISWA" | "PENJUAL";

export default function Register() {
  const r = useRouter();
  const [role, setRole] = useState<Role>("MAHASISWA");
  const [f, setF] = useState({ full_name: "", username: "", password: "", whatsapp: "", canteen_name: "", canteen_description: "" });
  const [show, setShow] = useState(false);
  const [e, setE] = useState("");
  const [l, setL] = useState(false);

  function set(k: string, v: string) { setF((s) => ({ ...s, [k]: v })); }

  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    setE("");
    if (f.username.trim().length < 4) { setE("Username minimal 4 karakter alfanumerik."); return; }
    if (f.password.length < 8) { setE("Kata sandi minimal 8 karakter."); return; }
    if (!f.full_name.trim() || !f.whatsapp.trim()) { setE("Nama lengkap dan WhatsApp wajib diisi."); return; }
    if (role === "PENJUAL" && !f.canteen_name.trim()) { setE("Nama loket wajib diisi untuk penjual."); return; }
    setL(true);
    try {
      const d = await api<{ status: string }>("/api/auth/register", { method: "POST", body: JSON.stringify({ ...f, role }) });
      if (d.status === "PENDING" || role === "PENJUAL") r.push("/pending-verification");
      else r.push("/login");
    } catch (err: unknown) { setE(err instanceof Error ? err.message : "Pendaftaran gagal."); } finally { setL(false); }
  }

  const buyer = role === "MAHASISWA";
  const inp = "bg-transparent outline-none flex-1 text-sm text-on-surface placeholder:text-text-muted";
  return (
    <div className="min-h-screen flex justify-center items-start sm:py-6 bg-background-base">
      <div className="relative w-full max-w-[430px] min-h-screen sm:min-h-[880px] sm:rounded-[46px] sm:border-[5px] sm:border-surface-glass-alt bg-background-base flex flex-col overflow-hidden pb-10 shadow-2xl">
      <div className="pointer-events-none absolute top-0 left-0 right-0 h-96 ambient-glow-top z-0" />
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
          <div className="relative z-10 flex flex-col space-y-2">
            <div className="self-start inline-flex items-center space-x-1.5 bg-black/25 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
              <ShieldCheck className="w-3.5 h-3.5 text-primary-fixed" />
              <span className="font-label-sm text-label-sm tracking-wider uppercase text-primary-fixed">PORTAL BELA NEGARA</span>
            </div>
            <h2 className="font-headline-lg text-headline-lg text-white font-extrabold tracking-tight pt-0.5">Daftar Akun VetaBite.</h2>
            <p className="font-body-sm text-body-sm text-white/85 leading-relaxed pr-2">Satu akun untuk pesan di semua loket kantin UPNVJ. Penjual diverifikasi admin sebelum loket tampil.</p>
          </div>
        </section>
        <section className="liquid-panel rounded-[26px] p-5 flex flex-col space-y-4">
          <div className="p-1 bg-surface-dim/50 rounded-2xl flex items-center shadow-inner border border-white/60">
            <Link href="/login" className="flex-1 py-2 rounded-xl text-label-md font-bold transition-all text-text-muted hover:text-on-surface text-center">Masuk (Login)</Link>
            <span className="flex-1 py-2 rounded-xl text-label-md font-bold transition-all shadow-sm bg-white text-on-surface text-center">Daftar (Register)</span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="font-label-sm text-label-sm text-text-muted uppercase tracking-wider font-extrabold">PILIH PERAN AKUN</span>
              <span className="text-[10px] font-bold text-primary bg-primary-fixed/60 px-2 py-0.5 rounded-full">{buyer ? "Civitas & Pengunjung" : "Mitra Kantin"}</span>
            </div>
            <div className="flex flex-row space-x-2.5">
              <button type="button" onClick={() => setRole("MAHASISWA")} className={`liquid-card-role ${buyer ? "is-active" : ""} rounded-2xl p-3 flex flex-col flex-1 min-w-0 text-left`}>
                <div className="flex items-center justify-between w-full mb-2">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${buyer ? "bg-primary text-white" : "bg-surface-container-high text-on-surface-variant"}`}><GraduationCap className="w-4 h-4" /></div>
                  {buyer && <span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center shrink-0"><Check className="w-3 h-3" /></span>}
                </div>
                <h4 className="text-[13px] font-extrabold mb-1">Pembeli / Mahasiswa</h4>
                <p className="text-[11px] text-text-muted leading-snug">Pesan makanan &amp; pick-up cepat tanpa antri di kantin.</p>
              </button>
              <button type="button" onClick={() => setRole("PENJUAL")} className={`liquid-card-role ${!buyer ? "is-active" : ""} rounded-2xl p-3 flex flex-col flex-1 min-w-0 text-left`}>
                <div className="flex items-center justify-between w-full mb-2">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${!buyer ? "bg-primary text-white" : "bg-surface-container-high text-on-surface-variant"}`}><Store className="w-4 h-4" /></div>
                  {!buyer && <span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center shrink-0"><Check className="w-3 h-3" /></span>}
                </div>
                <h4 className="text-[13px] font-extrabold mb-1">Pemilik / Ibu Kantin</h4>
                <p className="text-[11px] text-text-muted leading-snug">Kelola stan loket, stok harian, &amp; pesanan mahasiswa.</p>
              </button>
            </div>
          </div>
          <form onSubmit={submit} className="flex flex-col space-y-3">
            <label className="liquid-field rounded-2xl px-3 py-3 flex"><input value={f.full_name} onChange={(ev) => set("full_name", ev.target.value)} placeholder="Nama lengkap" className={inp} /></label>
            <label className="liquid-field rounded-2xl px-3 py-3 flex"><input value={f.whatsapp} onChange={(ev) => set("whatsapp", ev.target.value)} placeholder="Nomor WhatsApp (08...)" inputMode="tel" className={inp} /></label>
            <label className="liquid-field rounded-2xl px-3 py-3 flex"><input value={f.username} onChange={(ev) => set("username", ev.target.value)} placeholder="Username" autoComplete="username" className={inp} /></label>
            <label className="liquid-field rounded-2xl flex items-center gap-2 px-3 py-3">
              <input value={f.password} onChange={(ev) => set("password", ev.target.value)} type={show ? "text" : "password"} placeholder="Kata sandi (min. 8 karakter)" autoComplete="new-password" className={inp} />
              <button type="button" onClick={() => setShow((s) => !s)} aria-label="Tampilkan sandi">{show ? <EyeOff className="w-4 h-4 text-text-muted" /> : <Eye className="w-4 h-4 text-text-muted" />}</button>
            </label>
            {!buyer && (
              <>
                <label className="liquid-field rounded-2xl px-3 py-3 flex"><input value={f.canteen_name} onChange={(ev) => set("canteen_name", ev.target.value)} placeholder="Nama loket (mis. Warung Bu Rini)" className={inp} /></label>
                <label className="liquid-field rounded-2xl px-3 py-3 flex"><input value={f.canteen_description} onChange={(ev) => set("canteen_description", ev.target.value)} placeholder="Deskripsi singkat loket (opsional)" className={inp} /></label>
              </>
            )}
            {e && <p className="text-sm font-bold text-danger bg-danger/10 border border-danger/30 rounded-xl px-3 py-2">{e}</p>}
            <button disabled={l} className="btn-tangy-gradient w-full py-3 rounded-full flex items-center justify-center gap-2 text-white font-extrabold text-sm active:scale-[0.98] transition-all disabled:opacity-60" type="submit">
              {l ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              {l ? "Mendaftarkan..." : buyer ? "Daftar sebagai Pembeli" : "Daftar sebagai Penjual"}
            </button>
          </form>
          <div className="p-3 rounded-2xl bg-white/75 border border-white/90 flex items-start space-x-2.5 shadow-sm">
            <div className="w-6 h-6 rounded-full bg-emerald-100 text-success flex items-center justify-center shrink-0 mt-0.5"><Check className="w-3.5 h-3.5" /></div>
            <div className="flex flex-col space-y-0.5">
              <span className="font-label-sm text-label-sm text-on-surface font-extrabold tracking-tight">{buyer ? "Akses Langsung Seketika" : "Verifikasi Admin 1x24 Jam"}</span>
              <p className="text-[11px] text-text-muted leading-snug">{buyer ? "Akun pembeli aktif otomatis dan langsung bisa memesan." : "Akun penjual diperiksa admin. Pantau status di halaman verifikasi."} Sudah punya akun? <Link href="/login" className="text-primary font-bold hover:underline">Masuk</Link></p>
            </div>
          </div>
        </section>
      </main>
      </div>
    </div>
  );
}
