"use client";
import { useEffect, useState } from "react";
import { Bell, TrendingUp, Clock3, CalendarCheck2, Crown } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { api } from "@/lib/api";
import { formatRupiah } from "@/lib/format";
import { LoadingList, ErrorBox, Empty } from "@/components/States";
type S={omzet:number;porsi:number;avg_rating:number;chart:{label:string;omzet:number}[];top5:{name:string;qty:number;omzet:number}[]};
export default function StatistikaPage(){
  const [p,setP]=useState("week"); const [d,setD]=useState<S|null>(null); const [err,setErr]=useState("");
  const load=async()=>{try{setErr("");setD(null);setD(await api<S>(`/api/seller/stats?period=${p}`))}catch(e:unknown){setErr(e instanceof Error?e.message:String(e))}};
  useEffect(()=>{load()},[p]);
  const tabs=[["day","Harian"],["week","Mingguan"],["month","Bulanan"]] as const;
  return<div className="px-space-lg pt-3 space-y-4">
    <section className="pt-1">
      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-container border border-border-specular text-[10px] font-bold uppercase tracking-wider text-primary mb-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"/>Loket #01 Aktif</div>
      <div className="flex items-start justify-between"><div><h1 className="text-2xl font-extrabold tracking-tight">Statistika Penjualan</h1><p className="text-xs text-text-muted">Ayam Geprek Bu Rini • Kantin Utama UPNVJ</p></div>
      <div className="p-2 rounded-xl liquid-glass text-center shrink-0"><span className="text-[10px] text-text-muted block">SYNC KASIR</span><span className="text-xs font-bold text-primary">{new Date().toLocaleTimeString("id-ID",{hour:"2-digit",minute:"2-digit"})} WIB</span></div></div>
      <div className="mt-4 p-1 rounded-full bg-surface-container/70 border border-border-specular backdrop-blur-md flex items-center shadow-inner">
        {tabs.map(([v,l])=><button key={v} onClick={()=>setP(v)} className={`flex-1 py-2 min-h-[40px] text-center text-xs rounded-full transition-all font-bold ${p===v?"bg-primary text-white shadow-sm":"text-text-muted hover:text-on-surface"}`}>{l}</button>)}
      </div>
    </section>
    {err?<ErrorBox msg={err} onRetry={load}/>:!d?<LoadingList n={4}/>:<>
    <div className="grid grid-cols-12 gap-3">
      <div className="col-span-12 liquid-glass rounded-2xl p-4 relative overflow-hidden">
        <div className="flex items-center justify-between"><span className="text-xs text-text-muted uppercase tracking-wider font-bold">Total Pemasukan ({p==="day"?"Hari Ini":p==="week"?"Minggu Ini":"Bulan Ini"})</span><div className="w-8 h-8 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600"><TrendingUp size={16}/></div></div>
        <div className="mt-2 text-3xl font-extrabold tracking-tight">{formatRupiah(d.omzet)}</div>
        <div className="mt-3 w-full bg-surface-container/60 h-1.5 rounded-full overflow-hidden"><div className="bg-gradient-to-r from-primary to-primary-container h-full rounded-full" style={{width:"84%"}}/></div>
      </div>
      <div className="col-span-6 liquid-glass rounded-2xl p-3.5"><div className="flex items-center justify-between"><span className="text-[10px] text-text-muted uppercase font-bold">Porsi Terjual</span><div className="w-6 h-6 rounded-full bg-primary-fixed flex items-center justify-center text-primary"><Clock3 size={14}/></div></div><div className="mt-2 text-xl font-extrabold">{d.porsi} Porsi</div></div>
      <div className="col-span-6 liquid-glass rounded-2xl p-3.5"><div className="flex items-center justify-between"><span className="text-[10px] text-text-muted uppercase font-bold">Total Pesanan</span><div className="w-6 h-6 rounded-full bg-secondary-fixed flex items-center justify-center text-secondary"><CalendarCheck2 size={14}/></div></div><div className="mt-2 text-xl font-extrabold">{d.chart.length} Periode</div><div className="text-xs text-emerald-600 font-semibold">Siap Layani</div></div>
    </div>
    <section className="liquid-glass rounded-2xl p-4">
      <div className="flex items-center justify-between mb-2"><div><h2 className="text-sm font-bold">Tren Omset {p==="day"?"Harian":p==="week"?"7 Hari":"Bulanan"}</h2><p className="text-xs text-text-muted">Nominal dalam ribuan rupiah</p></div></div>
      <div className="mb-3 py-1.5 px-2.5 rounded-lg bg-surface-container border border-border-specular flex items-center justify-between text-xs"><span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-primary animate-ping"/>JAM PUNCAK</span><span className="font-semibold">12:00 - 13:30 WIB</span></div>
      {d.chart.length===0?<Empty title="Belum ada data" desc="Grafik muncul setelah ada transaksi pada periode ini."/>:
      <div className="h-44"><ResponsiveContainer><BarChart data={d.chart}><XAxis dataKey="label" fontSize={10} tickLine={false} axisLine={false}/><YAxis fontSize={10} tickLine={false} axisLine={false} tickFormatter={v=>`${Math.round(Number(v)/1000)}rb`}/><Tooltip formatter={v=>formatRupiah(Number(v))}/><Bar dataKey="omzet" radius={[6,6,0,0]}>{d.chart.map((_,i)=><Cell key={i} fill={i===d.chart.length-1?"#B82900":"#E03A00"}/>)}</Bar><Tooltip cursor={{fill:"rgba(224,58,0,.06)"}}/></BarChart></ResponsiveContainer></div>}
    </section>
    <section className="liquid-glass rounded-2xl p-4">
      <h2 className="text-sm font-bold flex items-center gap-1.5"><Crown size={16} className="text-primary"/>Menu Terlaris (Top 5)</h2>
      {d.top5.length===0?<Empty title="Belum ada penjualan" desc="Data menu terlaris muncul setelah ada transaksi."/>:
      <div className="mt-2 space-y-2">{d.top5.map((m,i)=><div key={i} className="flex items-center justify-between py-1.5 border-b border-border-subtle last:border-0"><span className="text-sm"><b className="text-primary">{i+1}.</b> {m.name}</span><strong className="text-sm">{m.qty} porsi • {formatRupiah(m.omzet)}</strong></div>)}</div>}
    </section></>}
  </div>;
}
