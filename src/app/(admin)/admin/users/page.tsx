"use client";

import { useState, useEffect } from "react";
import {
  Users,
  GraduationCap,
  Store,
  Ban,
  Search,
  KeyRound,
  RotateCw,
  CheckCircle2,
  Copy,
  Check,
  X,
  History,
  Lock,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import type { CivitasUser } from "@/app/api/admin/users/route";
import type { UserAuditLog } from "@/lib/admin-data";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<CivitasUser[]>([]);
  const [auditLogs, setAuditLogs] = useState<UserAuditLog[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    mahasiswa: 0,
    kantin: 0,
    banned: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [roleFilter, setRoleFilter] = useState<"ALL" | "MAHASISWA" | "PENJUAL">("ALL");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "banned">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal / Reset panel state
  const [showModal, setShowModal] = useState(false);
  const [resetModalData, setResetModalData] = useState<{
    user: CivitasUser | null;
    token: string;
    resetUrl: string;
    waText: string;
    waUrl: string;
  }>({
    user: null,
    token: "",
    resetUrl: "",
    waText: "",
    waUrl: "",
  });
  const [copySuccess, setCopySuccess] = useState(false);
  const [generatingToken, setGeneratingToken] = useState(false);

  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams();
      if (roleFilter !== "ALL") params.set("role", roleFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (searchQuery.trim()) params.set("search", searchQuery.trim());

      const res = await fetch(`/api/admin/users?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setUsers(json.data.users);
        setStats(json.data.stats);
        setAuditLogs(json.data.auditLogs);
      }
    } catch (err) {
      console.error("Gagal memuat pengguna civitas:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, statusFilter, searchQuery]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  const handleToggleStatus = async (user: CivitasUser) => {
    const isCurrentlyBanned = user.status === "BANNED";
    const targetStatus = isCurrentlyBanned ? "ACTIVE" : "BANNED";

    const promptText = isCurrentlyBanned
      ? `Aktifkan kembali akun ${user.name}?`
      : `Tangguhkan (Banned) akun ${user.name}? Masukkan alasan jika ada:`;

    let reason = "";
    if (!isCurrentlyBanned) {
      const input = prompt(promptText, "Pesanan fiktif berulang di kantin kampus.");
      if (input === null) return;
      reason = input || "Pelanggaran ketertiban transaksi.";
    } else {
      if (!confirm(promptText)) return;
    }

    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          status: targetStatus,
          reason,
        }),
      });

      const json = await res.json();
      if (json.success) {
        // Optimistically update
        setUsers((prev) =>
          prev.map((u) =>
            u.id === user.id
              ? {
                  ...u,
                  status: targetStatus,
                  statusLabel: targetStatus === "ACTIVE" ? "Aktif" : "Banned",
                }
              : u
          )
        );
        fetchUsers();
      } else {
        alert(json.error?.message || "Gagal mengubah status pengguna.");
      }
    } catch {
      alert("Terjadi kesalahan jaringan.");
    }
  };

  const handleOpenResetModal = async (user: CivitasUser) => {
    if (user.role === "MAHASISWA") {
      alert("Akun mahasiswa terhubung langsung dengan Google SSO Kampus (@mahasiswa.upnvj.ac.id / @upnvj.ac.id) dan tidak menggunakan kata sandi lokal.");
      return;
    }
    setGeneratingToken(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          userName: user.name,
          userRole: `${user.roleLabel} (${user.identity})`,
          phone: user.phone,
        }),
      });

      const json = await res.json();
      if (json.success) {
        const { token, resetUrl, waText, waUrl } = json.data;
        setResetModalData({
          user,
          token,
          resetUrl,
          waText,
          waUrl,
        });
        setCopySuccess(false);
        setShowModal(true);
      } else {
        alert(json.error?.message || "Gagal membuat tautan reset password.");
      }
    } catch {
      alert("Terjadi kesalahan jaringan.");
    } finally {
      setGeneratingToken(false);
    }
  };

  const handleCopyLink = () => {
    if (!resetModalData.resetUrl) return;
    navigator.clipboard.writeText(resetModalData.resetUrl);
    setCopySuccess(true);
    setTimeout(() => {
      setCopySuccess(false);
    }, 2500);
  };

  return (
    <div className="space-y-6 max-w-[1440px] mx-auto w-full">
      {/* Top Page Header Intro */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-on-surface tracking-tight">
            Kelola User &amp; Akun Civitas
          </h2>
          <p className="text-xs md:text-sm text-text-muted mt-0.5 leading-relaxed max-w-3xl">
            Monitoring seluruh akun civitas UPN Veteran Jakarta, verifikasi WhatsApp, status penangguhan (banned), serta dispatch reset kata sandi mandiri mitra kantin (mahasiswa terproteksi via Google SSO).
          </p>
        </div>
        {/* Quick Actions */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleRefresh}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/80 hover:bg-white text-on-surface border border-border-specular shadow-sm text-xs md:text-sm font-semibold transition-all active:scale-95 group"
          >
            <RotateCw
              size={16}
              className={`text-text-muted transition-transform ${
                refreshing ? "animate-spin text-primary" : "group-hover:rotate-180"
              }`}
            />
            <span>Refresh Data Civitas</span>
          </button>
        </div>
      </div>

      {/* 4 TOP KPI METRIC CARDS (Bento Grid 4 Cards) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Pengguna Terdaftar */}
        <div className="p-5 rounded-3xl bg-white/80 backdrop-blur-xl border border-border-specular shadow-sm flex flex-col justify-between group hover:-translate-y-0.5 transition-transform duration-200">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-text-muted truncate">Total Pengguna Terdaftar</p>
              <h3 className="text-2xl md:text-3xl font-extrabold text-on-surface mt-1 tracking-tight">
                {stats.total.toLocaleString("id-ID")}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-primary-fixed text-primary flex items-center justify-center shrink-0 shadow-inner">
              <Users size={20} />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-border-subtle flex items-center justify-between gap-2 text-xs">
            <span className="text-text-muted truncate">Mahasiswa &amp; Mitra</span>
            <span className="text-success font-bold flex items-center gap-0.5 text-[11px] shrink-0 whitespace-nowrap">
              <span>&uarr;</span> +142 minggu ini
            </span>
          </div>
        </div>

        {/* KPI 2: Mahasiswa Aktif */}
        <div className="p-5 rounded-3xl bg-white/80 backdrop-blur-xl border border-border-specular shadow-sm flex flex-col justify-between group hover:-translate-y-0.5 transition-transform duration-200">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-text-muted truncate">Mahasiswa Aktif</p>
              <h3 className="text-2xl md:text-3xl font-extrabold text-on-surface mt-1 tracking-tight">
                {stats.mahasiswa.toLocaleString("id-ID")}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-surface-container-high text-primary-container flex items-center justify-center shrink-0 shadow-inner">
              <GraduationCap size={20} />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-border-subtle flex items-center justify-between gap-2 text-xs">
            <span className="text-text-muted truncate">Sinkronisasi SIAD UPNVJ</span>
            <span className="text-primary font-bold text-[11px] shrink-0 whitespace-nowrap">
              99.2% Terdaftar
            </span>
          </div>
        </div>

        {/* KPI 3: Mitra Ibu Kantin */}
        <div className="p-5 rounded-3xl bg-white/80 backdrop-blur-xl border border-border-specular shadow-sm flex flex-col justify-between group hover:-translate-y-0.5 transition-transform duration-200">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-text-muted truncate">Mitra Ibu Kantin</p>
              <h3 className="text-2xl md:text-3xl font-extrabold text-on-surface mt-1 tracking-tight">
                {stats.kantin} Loket
              </h3>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-tertiary-fixed text-tertiary flex items-center justify-center shrink-0 shadow-inner">
              <Store size={20} />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-border-subtle flex items-center justify-between gap-2 text-xs">
            <span className="text-text-muted truncate">FK, FIK &amp; Boulevard</span>
            <span className="text-success font-bold text-[11px] shrink-0 whitespace-nowrap">
              Semua Loket Aktif
            </span>
          </div>
        </div>

        {/* KPI 4: Akun Dibanned / Ditangguhkan */}
        <div className="p-5 rounded-3xl bg-white/80 backdrop-blur-xl border border-border-specular shadow-sm flex flex-col justify-between group hover:-translate-y-0.5 transition-transform duration-200">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-text-muted truncate">Ditangguhkan (Banned)</p>
              <h3 className="text-2xl md:text-3xl font-extrabold text-danger mt-1 tracking-tight">
                {stats.banned}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-error-container text-error flex items-center justify-center shrink-0 shadow-inner">
              <Ban size={20} />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-border-subtle flex items-center justify-between gap-2 text-xs">
            <span className="text-text-muted truncate">Pesanan Fiktif</span>
            <span className="text-danger font-bold text-[11px] shrink-0 whitespace-nowrap">
              Perlu Peninjauan
            </span>
          </div>
        </div>
      </section>

      {/* MAIN CONTROLS & FILTER BAR */}
      <div className="p-3.5 rounded-2xl bg-white/80 backdrop-blur-2xl border border-border-specular shadow-sm flex flex-wrap items-center justify-between gap-3">
        {/* Role Segmented Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-surface-container-high/60 rounded-full border border-border-specular">
          <button
            type="button"
            onClick={() => setRoleFilter("ALL")}
            className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
              roleFilter === "ALL"
                ? "bg-gradient-to-r from-primary to-primary-container text-white shadow-sm"
                : "text-text-muted hover:text-on-surface hover:bg-white/60"
            }`}
          >
            <span>Semua Pengguna</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] leading-none font-bold ${
                roleFilter === "ALL" ? "bg-white/20" : "bg-black/5"
              }`}
            >
              {stats.total.toLocaleString("id-ID")}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setRoleFilter("MAHASISWA")}
            className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all ${
              roleFilter === "MAHASISWA"
                ? "bg-gradient-to-r from-primary to-primary-container text-white shadow-sm"
                : "text-text-muted hover:text-on-surface hover:bg-white/60"
            }`}
          >
            <GraduationCap size={15} />
            <span>Mahasiswa (Pembeli)</span>
            <span className="text-text-muted text-[10px] font-medium">
              ({stats.mahasiswa.toLocaleString("id-ID")})
            </span>
          </button>
          <button
            type="button"
            onClick={() => setRoleFilter("PENJUAL")}
            className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all ${
              roleFilter === "PENJUAL"
                ? "bg-gradient-to-r from-primary to-primary-container text-white shadow-sm"
                : "text-text-muted hover:text-on-surface hover:bg-white/60"
            }`}
          >
            <Store size={15} />
            <span>Ibu Kantin (Penjual)</span>
            <span className="text-text-muted text-[10px] font-medium">({stats.kantin})</span>
          </button>
        </div>

        {/* Secondary Controls & Status Dropdown & Search */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama, NIM, kantin, WA..."
              className="pl-9 pr-3 py-1.5 rounded-full bg-white/90 border border-border-specular text-xs font-medium text-on-surface focus:outline-none focus:ring-1 focus:ring-primary shadow-sm w-44 sm:w-60"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-text-muted whitespace-nowrap">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "banned")}
              className="px-3.5 py-1.5 rounded-full bg-white/90 border border-border-specular text-xs font-medium text-on-surface focus:outline-none focus:ring-1 focus:ring-primary shadow-sm cursor-pointer"
            >
              <option value="all">Semua Status</option>
              <option value="active">Aktif Normal</option>
              <option value="banned">Banned / Ditangguhkan</option>
            </select>
          </div>
        </div>
      </div>

      {/* USER MANAGEMENT DATA TABLE */}
      <div className="rounded-3xl bg-white/80 backdrop-blur-2xl overflow-hidden shadow-sm border border-border-specular">
        <div className="p-4 px-6 border-b border-border-subtle bg-surface-container-high/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-primary" />
            <h3 className="text-sm md:text-base font-extrabold text-on-surface">
              Daftar Pengguna Civitas Terdaftar
            </h3>
          </div>
          <span className="text-xs text-text-muted font-medium">
            Menampilkan: <strong>{users.length} akun</strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border-subtle bg-surface-container-high/50 text-text-muted text-[11px] uppercase tracking-wider font-bold">
                <th className="py-3.5 px-6 font-semibold whitespace-nowrap">Pengguna &amp; Identitas</th>
                <th className="py-3.5 px-4 font-semibold whitespace-nowrap">Peran</th>
                <th className="py-3.5 px-4 font-semibold whitespace-nowrap">Nomor WhatsApp</th>
                <th className="py-3.5 px-4 font-semibold whitespace-nowrap">Status Akun</th>
                <th className="py-3.5 px-6 font-semibold text-center whitespace-nowrap">Aksi Manajemen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle/50 text-xs md:text-sm">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-text-muted font-medium">
                    Memuat data civitas kampus...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-text-muted font-medium">
                    Tidak ditemukan pengguna yang sesuai dengan filter pencarian.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isBanned = u.status === "BANNED";
                  return (
                    <tr
                      key={u.id}
                      className={`transition-colors ${
                        isBanned ? "bg-error-container/15 hover:bg-error-container/25" : "hover:bg-white/60"
                      }`}
                    >
                      {/* Column 1: Pengguna & Identitas */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3.5">
                          <div
                            className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-xs ring-2 ring-white shadow-sm shrink-0 ${
                              isBanned
                                ? "bg-error-container text-error"
                                : u.role === "PENJUAL"
                                ? "bg-tertiary-fixed text-tertiary"
                                : "bg-primary-fixed text-primary"
                            }`}
                          >
                            {u.initials}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-on-surface text-xs md:text-sm leading-tight truncate">
                              {u.name}
                            </p>
                            <p className="text-xs text-text-muted mt-0.5 truncate">
                              {u.identity} &bull; {u.facultyOrStall}
                            </p>
                            <p className="text-[11px] text-text-muted/80 truncate">{u.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Column 2: Peran */}
                      <td className="py-4 px-4 whitespace-nowrap align-middle">
                        {u.role === "MAHASISWA" ? (
                          <span className="px-3 py-1 rounded-full bg-primary-fixed-dim/80 text-primary text-[10px] font-bold inline-flex items-center gap-1.5">
                            <GraduationCap size={13} /> Mahasiswa
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full bg-tertiary-fixed-dim/80 text-tertiary text-[10px] font-bold inline-flex items-center gap-1.5">
                            <Store size={13} /> Ibu Kantin
                          </span>
                        )}
                      </td>

                      {/* Column 3: Nomor WhatsApp */}
                      <td className="py-4 px-4 whitespace-nowrap align-middle">
                        <span className="inline-flex items-center gap-1.5 text-[#24A148] font-bold text-xs">
                          {/* Official WhatsApp SVG icon */}
                          <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.63C8.75 21.41 10.38 21.82 12.04 21.82C17.5 21.82 21.95 17.37 21.95 11.91C21.95 6.45 17.5 2 12.04 2ZM12.04 20.15C10.56 20.15 9.11 19.76 7.85 19L7.55 18.82L4.44 19.64L5.27 16.61L5.07 16.3C4.24 14.98 3.8 13.47 3.8 11.91C3.8 7.37 7.5 3.67 12.05 3.67C16.6 3.67 20.3 7.37 20.3 11.91C20.3 16.45 16.59 20.15 12.04 20.15Z" />
                          </svg>
                          {u.phone}
                        </span>
                      </td>

                      {/* Column 4: Status Akun */}
                      <td className="py-4 px-4 whitespace-nowrap align-middle">
                        {!isBanned ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-success/15 border border-success/30 text-success text-xs font-bold">
                            <span className="w-2 h-2 rounded-full bg-success animate-pulse shrink-0" />
                            <span>Aktif</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-error-container text-error text-xs font-bold border border-error/25">
                            <Ban size={13} />
                            <span>Banned</span>
                          </div>
                        )}
                      </td>

                      {/* Column 5: Aksi Manajemen */}
                      <td className="py-4 px-6 whitespace-nowrap align-middle">
                        <div className="flex items-center justify-center gap-2">
                          {/* Ubah Password Action: Khusus Mitra Ibu Kantin; Mahasiswa terproteksi via Google SSO */}
                          {u.role === "PENJUAL" ? (
                            <button
                              type="button"
                              onClick={() => handleOpenResetModal(u)}
                              disabled={generatingToken}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-surface-container-high hover:bg-primary-fixed text-primary border border-border-specular shadow-sm text-xs font-bold transition-all active:scale-95 group"
                              title="Kirim tautan reset kata sandi via WhatsApp"
                            >
                              <KeyRound
                                size={14}
                                className="group-hover:rotate-45 transition-transform shrink-0"
                              />
                              <span>Ubah Password</span>
                            </button>
                          ) : (
                            <div
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container-low text-text-muted border border-border-subtle text-xs font-semibold select-none shadow-2xs"
                              title="Akun mahasiswa menggunakan Google SSO kampus (@mahasiswa.upnvj.ac.id) tanpa kata sandi lokal"
                            >
                              <ShieldCheck size={13} className="text-primary shrink-0" />
                              <span>Google SSO</span>
                            </div>
                          )}

                          {/* Status Toggle Button */}
                          {!isBanned ? (
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(u)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-white hover:bg-error-container/30 text-error border border-border-specular shadow-sm text-xs font-semibold transition-all"
                              title="Tangguhkan Akun Civitas"
                            >
                              <Ban size={14} />
                              <span>Ubah ke Banned</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(u)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-success/20 hover:bg-success/30 text-success border border-success/30 shadow-sm text-xs font-bold transition-all"
                              title="Pulihkan Akun Civitas"
                            >
                              <CheckCircle2 size={14} />
                              <span>Aktifkan</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 px-6 border-t border-border-subtle bg-surface-container-high/30 flex items-center justify-between text-xs text-text-muted">
          <span>
            Menampilkan 1 - {users.length} dari {stats.total.toLocaleString("id-ID")} total akun civitas
          </span>
          <div className="flex items-center gap-1.5">
            <button
              disabled
              className="p-1.5 rounded-lg border border-border-specular bg-white text-text-muted opacity-40 cursor-not-allowed"
            >
              &larr;
            </button>
            <span className="px-3 py-1 rounded-lg bg-primary text-white font-bold text-xs">1</span>
            <span className="px-3 py-1 rounded-lg hover:bg-white text-text-muted font-bold text-xs cursor-pointer">
              2
            </span>
            <span className="px-3 py-1 rounded-lg hover:bg-white text-text-muted font-bold text-xs cursor-pointer">
              3
            </span>
            <span className="px-1 text-text-muted">&bull;&bull;&bull;</span>
            <button
              disabled
              className="p-1.5 rounded-lg border border-border-specular bg-white text-text-muted opacity-40 cursor-not-allowed"
            >
              &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* AUDIT LOG SEKSI BAWAH */}
      <section className="p-5 rounded-3xl bg-white/80 backdrop-blur-2xl border border-border-specular shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-border-subtle pb-3.5 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary-fixed text-primary flex items-center justify-center shrink-0 shadow-inner">
              <History size={18} />
            </div>
            <div>
              <h4 className="text-sm md:text-base font-bold text-on-surface">
                Log Perubahan Status &amp; Reset Password Terkini
              </h4>
              <p className="text-xs text-text-muted mt-0.5">
                Audit trail resmi aksi administrator terhadap akun civitas kampus.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => alert("Membuka riwayat log audit akun civitas...")}
            className="text-xs text-primary hover:underline font-bold flex items-center gap-1.5 shrink-0"
          >
            <span>Lihat Log Lengkap</span>
            <ArrowRight size={14} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
          {auditLogs.slice(0, 3).map((al) => (
            <div
              key={al.id}
              className="p-4 rounded-2xl bg-white/70 border border-border-specular flex items-start gap-3 shadow-xs"
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                  al.type === "banned"
                    ? "bg-error-container text-error"
                    : al.type === "key"
                    ? "bg-primary-fixed text-primary"
                    : "bg-success/20 text-success"
                }`}
              >
                {al.type === "banned" ? (
                  <Ban size={14} />
                ) : al.type === "key" ? (
                  <KeyRound size={14} />
                ) : (
                  <CheckCircle2 size={14} />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-on-surface font-bold truncate">{al.title}</p>
                <p className="text-[10px] font-semibold text-text-muted truncate mt-0.5">
                  {al.targetUser}
                </p>
                <p className="text-xs text-text-muted mt-1 leading-snug line-clamp-2">{al.detail}</p>
                <span className="text-[10px] font-medium text-primary mt-2 inline-block">
                  {al.timestamp} &bull; {al.meta}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* INTERACTIVE MODAL: KIRIM TAUTAN UBAH PASSWORD VIA WHATSAPP */}
      {showModal && resetModalData.user && (
        <div className="fixed inset-0 bg-inverse-surface/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all duration-300">
          <div className="bg-white/95 backdrop-blur-2xl border-[1.5px] border-white/95 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative">
            {/* Close Button Top Right */}
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-surface-container text-text-muted hover:text-on-surface transition-all"
            >
              <X size={18} />
            </button>

            {/* Modal Header */}
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FF6226] to-[#ad2b00] text-white flex items-center justify-center shadow-md shrink-0">
                <KeyRound size={22} />
              </div>
              <div>
                <h3 className="text-base md:text-lg font-bold text-on-surface">
                  Tautan Reset Password Mitra Ibu Kantin
                </h3>
                <p className="text-xs text-text-muted leading-relaxed">
                  Buat token aman sekali pakai dan kirimkan langsung ke nomor WhatsApp resmi mitra kantin.
                </p>
              </div>
            </div>

            {/* User Identification Badge */}
            <div className="p-3.5 rounded-2xl bg-surface-container-high/60 border border-border-specular flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  {resetModalData.user.initials}
                </div>
                <div>
                  <p className="text-xs md:text-sm font-bold text-on-surface">
                    {resetModalData.user.name}
                  </p>
                  <p className="text-[11px] text-text-muted">
                    {resetModalData.user.roleLabel} &bull; {resetModalData.user.identity}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-text-muted uppercase font-bold block">
                  WhatsApp Tujuan
                </span>
                <p className="text-xs text-[#24A148] font-bold">{resetModalData.user.phone}</p>
              </div>
            </div>

            {/* Generated Secure Link Field with Copy Trigger */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-bold text-on-surface">Tautan Reset Password Terenkripsi</label>
                <span className="text-[10px] text-primary font-bold">SHA-256 Token</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-xl bg-white border border-border-specular shadow-inner">
                <input
                  type="text"
                  readOnly
                  value={resetModalData.resetUrl}
                  className="bg-transparent text-xs text-on-surface-variant flex-1 outline-none font-mono select-all truncate px-1"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-variant text-primary text-xs font-bold transition-all active:scale-95 whitespace-nowrap shadow-xs"
                >
                  {copySuccess ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                  <span>{copySuccess ? "Tersalin!" : "Salin Tautan"}</span>
                </button>
              </div>
              <p className="text-[10px] text-text-muted flex items-center gap-1 mt-1">
                <span className="text-warning">&bull;</span>
                <span>Tautan unik ini berlaku selama 15 menit dan hanya dapat digunakan 1 kali oleh pemilik akun.</span>
              </p>
            </div>

            {/* Message Preview Box for WhatsApp Dispatch */}
            <div className="space-y-1.5">
              <label className="text-[11px] text-text-muted uppercase tracking-wider font-bold">
                Pratinjau Pesan WhatsApp Otomatis
              </label>
              <div className="p-3.5 rounded-xl bg-[#DCF8C6]/30 border border-[#25D366]/30 text-xs text-on-surface relative">
                <p className="leading-relaxed">
                  Halo <strong>{resetModalData.user.name}</strong>, Administrator VetaBite UPNVJ telah
                  membuatkan tautan pengaturan ulang kata sandi untuk akun Anda. Silakan klik tautan
                  aman berikut untuk membuat password baru:{" "}
                  <span className="text-primary font-mono underline break-all">
                    {resetModalData.resetUrl}
                  </span>
                </p>
                <div className="mt-2 flex items-center justify-between text-[10px] text-text-muted border-t border-[#25D366]/20 pt-1.5">
                  <span>Template Resmi VetaBite UPNVJ</span>
                  <span>12:45 WIB &bull; Centang Ganda</span>
                </div>
              </div>
            </div>

            {/* Action Footer Buttons */}
            <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2.5 rounded-full bg-white/80 hover:bg-white text-on-surface-variant text-xs font-semibold border border-border-specular transition-all"
              >
                Tutup
              </button>

              {/* Direct Link Open Trigger */}
              <a
                href={resetModalData.resetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 rounded-full bg-white hover:bg-surface-container text-primary text-xs font-bold border border-border-specular shadow-sm transition-all flex items-center gap-1.5 active:scale-95"
              >
                <ExternalLink size={14} />
                <span>Buka Tautan Reset</span>
              </a>

              {/* Primary WhatsApp Direct Dispatch Trigger */}
              <a
                href={resetModalData.waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-liquid-terracotta flex items-center gap-2 px-5 py-2.5 rounded-full text-white text-xs font-bold transition-all shadow-lg active:scale-95 cursor-pointer"
              >
                {/* Official WhatsApp Vector SVG */}
                <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.63C8.75 21.41 10.38 21.82 12.04 21.82C17.5 21.82 21.95 17.37 21.95 11.91C21.95 6.45 17.5 2 12.04 2ZM12.04 20.15C10.56 20.15 9.11 19.76 7.85 19L7.55 18.82L4.44 19.64L5.27 16.61L5.07 16.3C4.24 14.98 3.8 13.47 3.8 11.91C3.8 7.37 7.5 3.67 12.05 3.67C16.6 3.67 20.3 7.37 20.3 11.91C20.3 16.45 16.59 20.15 12.04 20.15Z" />
                </svg>
                <span>Kirim ke WhatsApp Pengguna</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
