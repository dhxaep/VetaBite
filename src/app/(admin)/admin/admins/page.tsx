"use client";

import { useState, useEffect } from "react";
import {
  Users,
  LockOpen,
  Globe,
  UserPlus,
  Mail,
  BadgeAlert,
  Plus,
  Info,
  CheckCircle2,
  Trash2,
  History,
  Shield,
  Search,
  UserMinus,
  X,
  Lock,
} from "lucide-react";
import type { GoogleAdmin, AdminAuditLog } from "@/lib/admin-data";

const SUPERADMIN_EMAIL = "dhafagifari0412@gmail.com";

export default function AdminAdminsPage() {
  const [admins, setAdmins] = useState<GoogleAdmin[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [stats, setStats] = useState({
    total: 4,
    ssoStatus: "100%",
    domainCoverage: "Bebas",
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Form states
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Detail modal state
  const [detailAdmin, setDetailAdmin] = useState<GoogleAdmin | null>(null);

  const fetchAdmins = async () => {
    try {
      const res = await fetch("/api/admin/admins");
      const json = await res.json();
      if (json.success) {
        setAdmins(json.data.admins);
        setStats(json.data.stats);
        setAuditLogs(json.data.auditLogs);
      }
    } catch (err) {
      console.error("Gagal memuat administrator:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);
    setFormSuccess(null);

    try {
      const res = await fetch("/api/admin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          full_name: fullName,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setFormError(json.error?.message || "Gagal menambahkan administrator.");
        setFormLoading(false);
        return;
      }

      setFormSuccess(json.data?.message || "Administrator berhasil ditambahkan!");
      setEmail("");
      setFullName("");
      fetchAdmins();
    } catch {
      setFormError("Terjadi kesalahan saat menghubungi server.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleKickAdmin = async (adm: GoogleAdmin) => {
    if (adm.email.toLowerCase() === SUPERADMIN_EMAIL.toLowerCase()) {
      alert("Superadmin utama (dhafagifari0412@gmail.com) dilindungi oleh sistem dan tidak dapat di-kick.");
      return;
    }

    if (!confirm(`Yakin ingin langsung kick administrator ${adm.full_name} (${adm.email})?\nHak akses ke portal admin akan segera dicabut.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/admins?id=${adm.id}`, { method: "DELETE" });
      const json = await res.json();
      if (res.ok && json.success) {
        setAdmins((prev) => prev.filter((a) => a.id !== adm.id));
        fetchAdmins();
      } else {
        alert(json.error?.message || "Gagal melakukan kick administrator.");
      }
    } catch {
      alert("Terjadi kesalahan jaringan saat mencoba kick administrator.");
    }
  };

  // Filtered list based on search
  const filteredAdmins = admins.filter((a) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return a.full_name.toLowerCase().includes(q) || a.email.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto w-full">
      {/* Header Section with Breadcrumb & Context Banner */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-primary-fixed text-primary tracking-wider uppercase border border-border-specular">
              Akses &amp; Hak Istimewa
            </span>
            <span className="text-xs text-text-muted">&bull; SSO Google Workspace UPNVJ</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-on-surface tracking-tight">
            Kelola Administrator &amp; Hak Akses Akun Google
          </h1>
          <p className="text-xs md:text-sm text-text-muted mt-1 max-w-3xl leading-relaxed">
            Atur delegasi hak akses Google SSO untuk tim operasional kemahasiswaan dan pengelola kantin kampus
            UPN &quot;Veteran&quot; Jakarta. Admin terdaftar dapat mengakses konsol langsung menggunakan
            otentikasi Google institusi.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Google Workspace Domain Indicator Pill: Bebas (Gmail, Workspace, dll) */}
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white/80 border border-border-specular text-xs font-semibold text-on-surface-variant shadow-sm">
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                fill="#EA4335"
              />
            </svg>
            <span className="flex items-center gap-1.5">
              Domain Email: <strong className="text-on-surface font-bold">Bebas (Gmail, Workspace, dll)</strong>
            </span>
          </div>
        </div>
      </section>

      {/* Stat KPI Cards (Bento 4-Column Grid) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 (Col Span 2) */}
        <div className="p-5 rounded-3xl bg-white/80 backdrop-blur-xl border border-border-specular shadow-sm relative overflow-hidden group hover:scale-[1.01] transition-transform md:col-span-2 lg:col-span-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">
              Total Administrator Aktif
            </span>
            <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-primary">
              <Users size={17} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-on-surface">{stats.total}</span>
            <span className="text-xs text-text-muted font-medium">Akun Terdaftar</span>
          </div>
          <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] bg-primary-fixed/60 text-primary font-bold border border-border-specular">
            <span className="w-1.5 h-1.5 rounded-full bg-success" />
            <span>Semua Berperan Tunggal: Administrator</span>
          </div>
        </div>

        {/* KPI 2: Status Otentikasi */}
        <div className="p-5 rounded-3xl bg-white/80 backdrop-blur-xl border border-border-specular shadow-sm relative overflow-hidden group hover:scale-[1.01] transition-transform">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">
              Status Otentikasi
            </span>
            <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <LockOpen size={17} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-on-surface">{stats.ssoStatus}</span>
            <span className="text-xs text-emerald-700 font-bold">Aktif SSO</span>
          </div>
          <p className="mt-3 text-xs text-text-muted font-medium">Google OAuth 2.0 Single Sign-On</p>
        </div>

        {/* KPI 3: Cakupan Domain */}
        <div className="p-5 rounded-3xl bg-white/80 backdrop-blur-xl border border-border-specular shadow-sm relative overflow-hidden group hover:scale-[1.01] transition-transform">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">
              Cakupan Domain
            </span>
            <div className="w-8 h-8 rounded-full bg-surface-container-low flex items-center justify-center text-primary">
              <Globe size={17} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-on-surface">{stats.domainCoverage}</span>
            <span className="text-xs text-text-muted font-medium">Domain</span>
          </div>
          <p className="mt-3 text-xs text-text-muted font-medium">Gmail, Akun Kampus, Domain Pribadi</p>
        </div>
      </section>

      {/* FORM TAMBAH ADMINISTRATOR BARU (Liquid Glass Panel) */}
      <section className="p-6 md:p-8 rounded-3xl bg-white/80 backdrop-blur-2xl border border-border-specular shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-border-subtle">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-fixed to-surface-container flex items-center justify-center text-primary shadow-inner border border-border-specular">
              <UserPlus size={22} />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-extrabold text-on-surface">
                Undang &amp; Tambah Administrator Baru via Akun Google
              </h2>
              <p className="text-xs md:text-sm text-text-muted mt-0.5">
                Akun Google yang ditambahkan akan otomatis diizinkan login melalui tombol Google OAuth di portal admin VetaBite.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container-low border border-border-specular text-xs font-semibold text-on-surface-variant shrink-0">
            <LockOpen size={14} className="text-success" />
            <span>Otorisasi Instan Google SSO</span>
          </div>
        </div>

        {formSuccess && (
          <div className="mt-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600" />
            <span>{formSuccess}</span>
          </div>
        )}

        {formError && (
          <div className="mt-4 p-3 rounded-2xl bg-error-container/60 border border-error/20 text-error text-xs font-semibold flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-error text-white flex items-center justify-center text-[10px]">
              !
            </span>
            <span>{formError}</span>
          </div>
        )}

        {/* Form Fields Grid - Revised to 3 columns without role dropdown */}
        <form onSubmit={handleAddAdmin} className="mt-6 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-12 gap-5 items-end">
          {/* Email Input (lg:col-span-5) */}
          <div className="lg:col-span-5 flex flex-col gap-2">
            <label className="text-xs font-bold text-on-surface flex items-center gap-1.5">
              <span>Email Akun Google (Domain Bebas)</span>
              <span className="text-primary">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-muted">
                <Mail size={16} />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contoh.nama@gmail.com / nama@domain.com"
                className="w-full h-12 pl-10 pr-4 text-xs md:text-sm bg-surface-container-lowest/80 border border-border-specular rounded-2xl placeholder:text-text-muted/60 focus:ring-2 focus:ring-primary focus:outline-none shadow-inner"
              />
            </div>
          </div>

          {/* Full Name Input (lg:col-span-4) */}
          <div className="lg:col-span-4 flex flex-col gap-2">
            <label className="text-xs font-bold text-on-surface flex items-center gap-1.5">
              <span>Nama Lengkap Staf / Pejabat</span>
              <span className="text-primary">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-muted">
                <BadgeAlert size={16} />
              </div>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Contoh: Rian Pratama, M.Kom."
                className="w-full h-12 pl-10 pr-4 text-xs md:text-sm bg-surface-container-lowest/80 border border-border-specular rounded-2xl placeholder:text-text-muted/60 focus:ring-2 focus:ring-primary focus:outline-none shadow-inner"
              />
            </div>
          </div>

          {/* Submit Button (lg:col-span-3) */}
          <div className="lg:col-span-3">
            <button
              type="submit"
              disabled={formLoading}
              className="w-full h-12 rounded-full btn-liquid-terracotta text-white font-bold text-xs md:text-sm flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.97] transition-all cursor-pointer shadow-md disabled:opacity-50"
            >
              <Plus size={18} />
              <span>{formLoading ? "Menyimpan..." : "+ Tambah Admin"}</span>
            </button>
          </div>
        </form>

        <div className="mt-4 flex items-center gap-2 text-[11px] text-text-muted">
          <Info size={14} className="text-tertiary shrink-0" />
          <span>
            Dapat menggunakan semua akun Google aktif dengan domain apa saja (Gmail, institusi, atau domain kustom). Seluruh akun yang ditambahkan otomatis memiliki peran tunggal <strong>Administrator</strong>.
          </span>
        </div>
      </section>

      {/* TABEL MANAJEMEN ADMINISTRATOR GOOGLE AKTIF (Liquid Glass Table Card) */}
      <section className="rounded-3xl bg-white/80 backdrop-blur-2xl overflow-hidden border border-border-specular shadow-sm">
        {/* Table Controls Header & Filter Tabs */}
        <div className="p-6 border-b border-border-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg md:text-xl font-extrabold text-on-surface">
              Daftar Administrator Google Berwenang
            </h2>
            <p className="text-xs text-text-muted mt-0.5">
              Pengguna aktif yang memiliki kewenangan otentikasi Single Sign-On (SSO)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Filter */}
            <div className="relative">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama atau email..."
                className="pl-9 pr-3.5 py-1.5 rounded-full text-xs bg-white border border-border-specular text-on-surface focus:outline-none focus:ring-1 focus:ring-primary shadow-inner w-44 sm:w-60"
              />
            </div>

            {/* Single Unified Admin Chip */}
            <div className="flex items-center gap-2 p-1 rounded-full bg-surface-container-high/60 border border-border-specular">
              <span className="px-4 py-1.5 rounded-full text-xs bg-gradient-to-r from-primary to-primary-container text-white font-bold shadow-sm flex items-center gap-1.5">
                <Shield size={14} />
                <span>Semua Admin ({admins.length})</span>
              </span>
            </div>
          </div>
        </div>

        {/* Table Canvas */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container/60 border-b border-border-subtle text-[11px] font-bold text-text-muted uppercase tracking-wider">
                <th className="py-4 px-6 font-bold">PENGGUNA &amp; AKUN GOOGLE</th>
                <th className="py-4 px-6 font-bold">PERAN &amp; OTORISASI</th>
                <th className="py-4 px-6 font-bold">STATUS GOOGLE SSO</th>
                <th className="py-4 px-6 font-bold">TANGGAL DITAMBAHKAN</th>
                <th className="py-4 px-6 font-bold text-right">AKSI KELOLA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle/50 text-xs md:text-sm">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-text-muted">
                    Memuat data administrator...
                  </td>
                </tr>
              ) : filteredAdmins.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-text-muted">
                    Tidak ada administrator yang cocok dengan pencarian.
                  </td>
                </tr>
              ) : (
                filteredAdmins.map((adm) => (
                  <tr key={adm.id} className="hover:bg-white/60 transition-colors">
                    {/* Column 1: Pengguna & Akun Google */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-2xl bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center font-bold text-xs shadow-sm border border-border-specular shrink-0">
                          {adm.initials}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-on-surface flex items-center gap-1.5">
                            <span className="truncate">{adm.full_name}</span>
                            <CheckCircle2 size={15} className="text-primary shrink-0" />
                          </div>
                          <div className="text-xs text-text-muted flex items-center gap-1.5 mt-0.5">
                            <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                              <path
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                fill="#4285F4"
                              />
                              <path
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                fill="#34A853"
                              />
                              <path
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                                fill="#FBBC05"
                              />
                              <path
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                                fill="#EA4335"
                              />
                            </svg>
                            <span className="truncate">{adm.email}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Column 2: Peran & Otorisasi */}
                    <td className="py-4 px-6 whitespace-nowrap">
                      {adm.email.toLowerCase() === SUPERADMIN_EMAIL.toLowerCase() ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs bg-amber-50 text-amber-800 border border-amber-300 font-extrabold shadow-xs">
                          <Shield size={14} className="text-amber-600" />
                          Superadmin Utama
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs bg-gradient-to-r from-primary-fixed to-surface-container text-on-primary-fixed-variant border border-border-specular font-bold shadow-xs">
                          <Shield size={14} />
                          Administrator
                        </span>
                      )}
                    </td>

                    {/* Column 3: Status Google SSO */}
                    <td className="py-4 px-6 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        Aktif SSO
                      </span>
                    </td>

                    {/* Column 4: Tanggal Ditambahkan */}
                    <td className="py-4 px-6 text-on-surface-variant font-medium text-xs whitespace-nowrap">
                      {adm.added_at}
                    </td>

                    {/* Column 5: Aksi Kelola */}
                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setDetailAdmin(adm)}
                          className="px-3.5 py-1.5 rounded-full bg-white/80 hover:bg-white text-xs font-semibold text-on-surface hover:text-primary transition-colors border border-border-specular shadow-sm cursor-pointer"
                        >
                          Detail
                        </button>
                        {adm.email.toLowerCase() === SUPERADMIN_EMAIL.toLowerCase() ? (
                          <span
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-100 text-slate-500 text-xs font-bold cursor-not-allowed border border-slate-200 select-none shadow-xs"
                            title="Superadmin Utama Dilindungi (Tidak dapat di-kick)"
                          >
                            <Lock size={13} className="text-slate-500" />
                            <span>Dilindungi</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleKickAdmin(adm)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 text-xs font-bold transition-all border border-rose-200 shadow-xs active:scale-95 cursor-pointer"
                            title={`Kick Administrator ${adm.full_name}`}
                          >
                            <UserMinus size={14} />
                            <span>Kick</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Pagination Footer */}
        <div className="p-4 px-6 bg-surface-container-low/40 border-t border-border-subtle flex items-center justify-between text-xs text-text-muted">
          <span>
            Menampilkan <strong>{filteredAdmins.length}</strong> dari <strong>{admins.length}</strong> administrator aktif
          </span>
          <div className="flex items-center gap-2">
            <button disabled className="px-3 py-1 rounded-lg border border-border-subtle opacity-50 cursor-not-allowed">
              Sebelumnya
            </button>
            <span className="px-3 py-1 rounded-lg bg-primary text-white font-bold text-xs">1</span>
            <button disabled className="px-3 py-1 rounded-lg border border-border-subtle opacity-50 cursor-not-allowed">
              Selanjutnya
            </button>
          </div>
        </div>
      </section>

      {/* SEKSI LOG AUDIT & KEAMANAN GOOGLE SSO (Riwayat Terakhir Autentikasi) */}
      <section className="p-6 md:p-8 rounded-3xl bg-white/80 backdrop-blur-2xl border border-border-specular shadow-sm">
        <div className="flex items-center justify-between pb-6 border-b border-border-subtle">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-surface-container flex items-center justify-center text-primary shadow-inner">
              <History size={18} />
            </div>
            <div>
              <h3 className="text-base md:text-lg font-extrabold text-on-surface">
                Log Audit &amp; Keamanan Google SSO
              </h3>
              <p className="text-xs text-text-muted mt-0.5">
                Jejak autentikasi OAuth 2.0 dan perubahan delegasi wewenang oleh Superadmin
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => alert("Membuka log audit keamanan Google Workspace UPNVJ...")}
            className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
          >
            <span>Buka Seluruh Audit Log</span>
            <span>&rarr;</span>
          </button>
        </div>

        {/* Timeline Grid List */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {auditLogs.slice(0, 3).map((log) => (
            <div
              key={log.id}
              className="p-4 rounded-2xl bg-white/70 border border-border-specular flex flex-col gap-2 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-text-muted font-medium">{log.timestamp}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    log.statusBadgeColor === "emerald"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-primary-fixed text-primary"
                  }`}
                >
                  {log.statusBadge}
                </span>
              </div>
              <p className="text-xs font-bold text-on-surface truncate">{log.email}</p>
              <p className="text-xs text-text-muted leading-relaxed">{log.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Admin Detail Modal */}
      {detailAdmin && (
        <div className="fixed inset-0 z-50 bg-inverse-surface/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border-[1.5px] border-border-specular space-y-5 relative">
            <button
              type="button"
              onClick={() => setDetailAdmin(null)}
              className="absolute top-5 right-5 text-text-muted hover:text-on-surface p-1 rounded-full"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center font-bold text-sm shadow-sm border border-border-specular">
                {detailAdmin.initials}
              </div>
              <div>
                <h3 className="text-sm font-bold text-on-surface">{detailAdmin.full_name}</h3>
                <p className="text-xs text-text-muted">{detailAdmin.email}</p>
              </div>
            </div>

            <div className="space-y-3 pt-2 border-t border-border-subtle text-xs">
              <div className="flex items-center justify-between py-1">
                <span className="text-text-muted">Peran Otorisasi:</span>
                {detailAdmin.email.toLowerCase() === SUPERADMIN_EMAIL.toLowerCase() ? (
                  <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-300 font-extrabold text-xs inline-flex items-center gap-1 shadow-xs">
                    <Shield size={13} className="text-amber-600" /> Superadmin Utama
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full bg-primary-fixed text-primary font-bold text-xs inline-flex items-center gap-1 shadow-xs">
                    <Shield size={13} /> Administrator
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-text-muted">Status Autentikasi:</span>
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Aktif SSO
                </span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-text-muted">Tanggal Ditambahkan:</span>
                <span className="font-semibold text-on-surface">{detailAdmin.added_at}</span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-text-muted">Metode Masuk:</span>
                <span className="font-semibold text-on-surface">Google Identity SSO OAuth 2.0</span>
              </div>
            </div>

            <div className="pt-3 border-t border-border-subtle flex items-center justify-between gap-3">
              {detailAdmin.email.toLowerCase() === SUPERADMIN_EMAIL.toLowerCase() ? (
                <span className="inline-flex items-center gap-1.5 text-xs text-text-muted font-semibold">
                  <Lock size={13} className="text-slate-400" /> Superadmin Utama Dilindungi
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    const target = detailAdmin;
                    setDetailAdmin(null);
                    handleKickAdmin(target);
                  }}
                  className="px-3.5 py-2 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 border border-rose-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <UserMinus size={14} />
                  <span>Kick Admin Ini</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setDetailAdmin(null)}
                className="px-5 py-2 rounded-full btn-liquid-terracotta text-white font-bold text-xs shadow-md cursor-pointer ml-auto"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
