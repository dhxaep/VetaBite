"use client";
import { useEffect, useState } from "react";
import { Bell, ShieldCheck, UserX, LockKeyhole, LockOpen, TriangleAlert, CircleCheckBig } from "lucide-react";
import { api } from "@/lib/api";
import { LoadingList, Empty, ErrorBox } from "@/components/States";
type B={user_id:string;full_name:string;username:string;reason:string;created_at:string};
export default function BannedPage(){
  const [list,setList]=useState<B[]|null>(null); const [err,setErr]=useState(""); const [u,setU]=useState(""); const [r,setR]=useState(""); const [toast,setToast]=useState("");
  const load=async()=>{try{setErr("");setList(await api<B[]>("/api/seller/bans"))}catch(e:unknown){setErr(e instanceof Error?e.message:String(e))}};
  useEffect(()=>{load()},[]);
  useEffect(()=>{if(!toast)return;const t=setTimeout(()=>setToast(""),2400);return()=>clearTimeout(t)},[toast]);
  const add=async()=>{if(!u||!r)return alert("Username dan alasan wajib diisi");await api("/api/seller/bans",{method:"POST",body:JSON.stringify({username:u,reason:r})});setU("");setR("");load();setToast(`@${u} diblokir dari loket`)};
  const unban=async(b:B)=>{if(!confirm(`Buka blokir ${b.full_name}?`))return;await api(`/api/seller/bans/${b.user_id}`,{method:"DELETE"});load();setToast(`${b.full_name} dibuka blokirnya`)};
  if (err && !list) return <ErrorBox msg={err} onRetry={load} />;
  if (!list)
    return (
      <div className="px-space-lg pt-4">
        <h1 className="text-xl font-extrabold text-on-surface mb-3">Pengguna Diblokir</h1>
        <LoadingList n={3} />
      </div>
    );
  return (
    <div className="px-space-lg pt-4 pb-8 flex flex-col gap-4">
      {toast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[60] w-[90%] max-w-[390px] liquid-glass rounded-2xl p-3 shadow-xl flex items-center gap-3 border border-emerald-500/40">
          <span className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
            <CircleCheckBig size={18} />
          </span>
          <p className="text-sm font-bold">{toast}</p>
        </div>
      )}
      <section className="mt-1 flex items-center justify-between bg-surface-container-low/80 backdrop-blur-md p-3 rounded-2xl border border-border-specular">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary-fixed flex items-center justify-center text-primary">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h1 className="text-sm font-bold leading-tight">Perlindungan Loket</h1>
            <p className="text-xs text-text-muted">Proteksi transaksi dan anti-pesanan fiktif</p>
          </div>
        </div>
      </section>
      <div className="liquid-glass rounded-[18px] p-3.5 space-y-2.5">
        <h3 className="text-sm font-bold flex items-center gap-1.5 text-on-surface">
          <UserX size={15} className="text-primary" />
          Blokir Baru
        </h3>
        <input
          className="w-full px-3.5 py-2 rounded-xl bg-surface-container-lowest/80 border border-border-specular text-sm text-on-surface placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/40"
          placeholder="Username mahasiswa (tanpa @)"
          value={u}
          onChange={(e) => setU(e.target.value)}
        />
        <select
          className="w-full px-3.5 py-2 rounded-xl bg-surface-container-lowest/80 border border-border-specular text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
          value={r}
          onChange={(e) => setR(e.target.value)}
        >
          <option value="">Pilih alasan pemblokiran</option>
          <option>Bukti pembayaran palsu berulang</option>
          <option>Pesanan tidak pernah diambil (Ghosting)</option>
          <option>Spam pesanan fiktif</option>
          <option>Catatan kasar / pelecehan</option>
          <option>Lainnya</option>
        </select>
        {r === "Lainnya" && (
          <input
            className="w-full px-3.5 py-2 rounded-xl bg-surface-container-lowest/80 border border-border-specular text-sm text-on-surface placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/40"
            placeholder="Tulis alasan lain"
            onChange={(e) => setR(e.target.value)}
          />
        )}
        <button
          onClick={add}
          className="w-full min-h-[44px] rounded-full btn-gradient-danger text-white text-sm font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-transform shadow-md"
        >
          <UserX size={15} />
          <span>Blokir Pengguna</span>
        </button>
      </div>
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between px-1"><div className="flex items-center gap-2"><h2 className="text-base font-bold">Pengguna Diblokir</h2><span className="px-2 py-0.5 rounded-full bg-error-container text-error text-xs font-bold">{list.length} Akun</span></div><span className="text-xs text-text-muted">Loket #01 Aktif</span></div>
      <div className="flex flex-col gap-3">
      {list.length===0?<div className="liquid-glass rounded-[22px] p-6 flex flex-col items-center text-center gap-3"><div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center border"><ShieldCheck size={40} className="text-emerald-600"/></div><h3 className="font-bold">Loket Aman</h3><p className="text-sm text-text-muted">Daftar hitam kosong. Semua mahasiswa bisa memesan di loket ini.</p></div>:
      list.map(b=><article key={b.user_id} className="liquid-glass rounded-[18px] p-3.5 flex flex-col gap-2.5">
        <div className="flex items-start justify-between"><div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-full border border-border-specular bg-surface-container flex items-center justify-center text-secondary relative overflow-hidden"><UserX size={22}/><span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-danger rounded-full border-2 border-white"/></div>
          <div><h3 className="text-sm font-bold leading-snug">{b.full_name}</h3><p className="text-xs text-text-muted">@{b.username}</p></div></div>
          <span className="px-2 py-0.5 rounded-md bg-surface-variant text-on-surface-variant text-[10px]">{new Date(b.created_at).toLocaleDateString("id-ID",{day:"numeric",month:"short",year:"numeric"})}</span></div>
        <div className="bg-surface-container-lowest/70 rounded-xl p-2.5 border border-border-subtle flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-danger"><TriangleAlert size={15}/><span className="text-xs font-bold">Alasan: {b.reason}</span></div>
        </div>
        <div className="flex items-center justify-between pt-1">
          <span className="text-[10px] text-outline flex items-center gap-1">
            <LockKeyhole size={13} />
            Akses Dibatasi
          </span>
          <button
            onClick={() => unban(b)}
            className="min-h-[38px] px-3.5 py-1.5 rounded-full bg-surface-glass-alt border border-border-specular text-text-muted text-xs font-bold hover:text-on-surface active:scale-95 transition-all flex items-center gap-1"
          >
            <LockOpen size={14} />
            <span>Buka Blokir</span>
          </button>
        </div>
      </article>)}
      </div>
    </section>
  </div>
);
}

