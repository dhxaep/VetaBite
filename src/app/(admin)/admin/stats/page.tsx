"use client";

import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  Search,
  TrendingUp,
  Users,
  CheckCircle2,
  Store,
  ArrowRight,
  Zap,
  CreditCard,
  Download,
  Calendar,
  Sparkles,
  MapPin,
  Clock,
} from "lucide-react";
import { api } from "@/lib/api";
import { formatRupiah } from "@/lib/format";
import { LoadingList, ErrorBox } from "@/components/States";

type D = {
  kpi: {
    transactions: number;
    omzet: number;
    active_users: number;
    pickup_rate: number;
    open_canteens: number;
  };
  trend: { label: string; total: number }[];
  peak: { label: string; count: number }[];
  canteens: {
    name: string;
    omzet: number;
    rating: number;
    avg_minutes: number;
  }[];
};

export default function AdminStatsPage() {
  const [range, setRange] = useState("today");
  const [data, setData] = useState<D | null>(null);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const load = async () => {
    try {
      setErr("");
      setData(null);
      const res = await api<D>(`/api/admin/stats?range=${range}`);
      setData(res);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  };

  useEffect(() => {
    load();
  }, [range]);

  const cards = data
    ? [
        {
          label: "Total Transaksi Hari Ini",
          val: formatRupiah(data.kpi.omzet),
          sub: `${data.kpi.transactions} Pesanan sukses`,
          badge: "+14.2%",
          Icon: CreditCard,
          chipColor: "bg-success/15 text-success",
        },
        {
          label: "Pengguna Aktif",
          val: `${data.kpi.active_users} Mahasiswa`,
          sub: "Online saat jam jeda istirahat",
          badge: "Jam Kuliah",
          Icon: Users,
          chipColor: "bg-tertiary-fixed text-on-tertiary-fixed-variant",
        },
        {
          label: "Keberhasilan Pick-Up",
          val: `${data.kpi.pickup_rate.toFixed(1)}%`,
          sub: "Tanpa antrean mangkrak di loket",
          badge: "Zero Antre",
          Icon: CheckCircle2,
          chipColor: "bg-success/15 text-success",
        },
        {
          label: "Kantin & Loket Aktif",
          val: `${data.kpi.open_canteens} Loket`,
          sub: "Siap melayani pesanan online",
          badge: "Operasional 100%",
          Icon: Store,
          chipColor: "bg-primary-fixed text-on-primary-fixed-variant",
        },
      ]
    : [];

  return (
    <div className="space-y-7">
      {/* TIME FILTER & HEADER CONTROLS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs text-text-muted font-bold uppercase tracking-wider">
            Ringkasan Analitik Makro Operasional
          </p>
          <h2 className="text-xl font-extrabold text-on-surface tracking-tight mt-0.5">
            Performa Transaksi Kantin UPNVJ
          </h2>
        </div>

        <div className="flex items-center gap-3">
          {/* Segmented Pill */}
          <div className="bg-surface-container-low/80 p-1 rounded-full border border-border-specular flex items-center shadow-inner">
            {[
              { id: "today", label: "Hari Ini" },
              { id: "week", label: "7 Hari Terakhir" },
              { id: "month", label: "30 Hari Terakhir" },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setRange(t.id)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  range === t.id
                    ? "bg-gradient-to-r from-primary to-primary-container text-white shadow-sm"
                    : "text-text-muted hover:text-on-surface"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {err ? (
        <ErrorBox msg={err} onRetry={load} />
      ) : !data ? (
        <LoadingList n={4} />
      ) : (
        <>
          {/* 1. KPI SUMMARY: 4 LIQUID GLASS CARDS */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {cards.map((c) => (
              <div
                key={c.label}
                className="liquid-glass rounded-2xl p-5 relative overflow-hidden transition-transform duration-200 hover:-translate-y-1 shadow-md"
              >
                <div className="flex items-start justify-between">
                  <span className="text-xs font-semibold text-text-muted">{c.label}</span>
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                    <c.Icon size={18} />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-extrabold text-on-surface tracking-tight">
                    {c.val}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold ${c.chipColor}`}
                    >
                      <TrendingUp size={11} />
                      {c.badge}
                    </span>
                    <span className="text-xs text-text-muted">{c.sub}</span>
                  </div>
                </div>
                <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-primary/5 rounded-full pointer-events-none" />
              </div>
            ))}
          </section>

          {/* 2. ANALYTICS CHARTS: 2 COLUMN BENTO GRID */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Chart Left: Tren Transaksi Harian */}
            <div className="lg:col-span-7 liquid-glass rounded-3xl p-6 shadow-md flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-extrabold text-on-surface">
                      Tren Transaksi Harian
                    </h3>
                    <p className="text-xs text-text-muted">
                      Lonjakan pesanan selama jam operasional kampus (08:00 - 17:00 WIB)
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                      <span className="text-[11px] font-semibold text-text-muted">Hari Ini</span>
                    </div>
                  </div>
                </div>

                <div className="w-full h-64 mt-2">
                  {mounted && data?.trend ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={data.trend}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#E03A00" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#E03A00" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(28, 19, 14, 0.06)" />
                        <XAxis
                          dataKey="label"
                          tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "rgba(255, 255, 255, 0.95)",
                            backdropFilter: "blur(12px)",
                            borderRadius: "14px",
                            border: "1px solid rgba(255, 255, 255, 0.92)",
                            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                            fontSize: "12px",
                            fontWeight: 700,
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="total"
                          name="Pesanan"
                          stroke="#E03A00"
                          strokeWidth={3}
                          fillOpacity={1}
                          fill="url(#colorTotal)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-text-muted">
                      Memuat grafik tren...
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-border-subtle flex items-center justify-between text-xs text-text-muted">
                <span>Puncak Lonjakan: Jam Makan Siang (12:00 - 13:00 WIB)</span>
                <span className="text-primary font-bold">Terpantau Lancar</span>
              </div>
            </div>

            {/* Chart Right: Jam Sibuk Pemesanan */}
            <div className="lg:col-span-5 liquid-glass rounded-3xl p-6 shadow-md flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-base font-extrabold text-on-surface">
                    Jam Sibuk Pemesanan
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-extrabold uppercase">
                    Peak Hours
                  </span>
                </div>
                <p className="text-xs text-text-muted mb-4">
                  Distribusi jam sibuk pergantian SKS mahasiswa UPNVJ. Pukul{" "}
                  <strong className="text-primary">11:30 - 13:30 WIB</strong> menyumbang volume
                  terbesar.
                </p>

                <div className="space-y-3">
                  {data.peak.map((p, i) => {
                    const max = Math.max(...data.peak.map((x) => x.count), 1);
                    const pct = Math.round((p.count / max) * 100);
                    const isHigh = i === 1;

                    return (
                      <div
                        key={p.label}
                        className={`rounded-2xl transition-all ${
                          isHigh
                            ? "p-3 bg-primary-fixed/30 border border-primary-fixed-dim/60 shadow-sm"
                            : ""
                        }`}
                      >
                        <div className="flex justify-between items-center text-xs mb-1">
                          <span
                            className={
                              isHigh
                                ? "font-extrabold text-primary flex items-center gap-1"
                                : "text-on-surface font-semibold"
                            }
                          >
                            {isHigh && <Zap size={14} />}
                            {p.label}
                          </span>
                          <span className="text-text-muted font-bold">{p.count} Pesanan</span>
                        </div>
                        <div className="w-full h-3 rounded-full bg-surface-container-high overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isHigh
                                ? "bg-gradient-to-r from-primary to-secondary-container"
                                : "bg-primary-fixed-dim"
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-border-subtle flex items-center justify-between text-xs">
                <span className="text-text-muted">Kapasitas Pick-Up Tersedia</span>
                <span className="text-success font-extrabold flex items-center gap-1">
                  <CheckCircle2 size={15} /> Siap 1.800 porsi/jam
                </span>
              </div>
            </div>
          </section>

          {/* 3. TABLE SECTION: PERFORMA PER KANTIN & LOKET UPNVJ */}
          <section className="liquid-glass rounded-3xl p-6 shadow-md space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-extrabold text-on-surface">
                  Performa per Kantin &amp; Loket UPNVJ
                </h3>
                <p className="text-xs text-text-muted">
                  Monitoring transaksi langsung, porsi terjual, kepuasan bintang, dan efektivitas
                  pick-up loket
                </p>
              </div>
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                />
                <input
                  type="text"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Cari nama loket..."
                  className="h-10 pl-9 pr-4 rounded-full bg-white/80 border border-white text-xs text-on-surface placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/40 shadow-inner w-64"
                />
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-white/60 bg-white/40 shadow-inner">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border-subtle bg-surface-container-low/60 text-text-muted font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-4 text-center w-14">Rank</th>
                    <th className="py-3.5 px-4">Nama Loket</th>
                    <th className="py-3.5 px-4">Total Transaksi</th>
                    <th className="py-3.5 px-4">Status Operasional</th>
                    <th className="py-3.5 px-4">Rata-rata Saji</th>
                    <th className="py-3.5 px-4 text-right">Detail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle/60 text-sm">
                  {data.canteens
                    .filter((c) => c.name.toLowerCase().includes(q.toLowerCase()))
                    .map((c, i) => (
                      <tr key={c.name} className="hover:bg-white/70 transition-colors">
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`w-6 h-6 rounded-full inline-flex items-center justify-center text-xs font-bold ${
                              i === 0
                                ? "bg-gradient-to-r from-primary to-primary-container text-white shadow-sm"
                                : "bg-surface-container-high text-on-surface"
                            }`}
                          >
                            {i + 1}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-on-surface">{c.name}</p>
                          <span className="text-[10px] text-text-muted">
                            Kantin Kampus Terintegrasi UPNVJ
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-on-surface">
                          {formatRupiah(c.omzet)}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-800 border border-emerald-500/20 text-[11px] font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Siaga Melayani
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-text-muted font-medium">
                          <span className="inline-flex items-center gap-1">
                            <Clock size={13} />
                            {c.avg_minutes} menit
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => alert(`Detail performa loket ${c.name}`)}
                            className="w-8 h-8 rounded-full bg-white hover:bg-surface-container text-on-surface-variant inline-flex items-center justify-center border border-white shadow-sm transition-all active:scale-95"
                          >
                            <ArrowRight size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            <div className="pt-2 flex items-center justify-between text-xs text-text-muted">
              <div>
                Menampilkan <strong className="text-on-surface">{data.canteens.length}</strong> loket aktif UPNVJ
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
