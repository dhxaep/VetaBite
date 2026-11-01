"use client";

import { useEffect, useState, useRef } from "react";
import {
  Store,
  Phone,
  KeyRound,
  LogOut,
  Camera,
  Search,
  Lock,
  Eye,
  EyeOff,
  UserCheck,
  ShieldCheck,
  ShieldAlert,
  UserX,
  LockOpen,
  CircleCheckBig,
  Loader2,
  AlertCircle,
  Headset,
  X,
  Check,
  Bell,
  SlidersHorizontal,
  Save,
} from "lucide-react";
import { api } from "@/lib/api";
import { LoadingList, ErrorBox } from "@/components/States";

interface BanItem {
  user_id: string;
  full_name: string;
  username: string;
  reason: string;
  created_at: string;
}

interface UserProfile {
  id: string;
  username: string;
  full_name: string;
  whatsapp: string | null;
  avatar_url: string | null;
  role: string;
  status: string;
}

interface CanteenProfile {
  id: string;
  name: string;
  queue_prefix?: string;
  description: string | null;
  banner_url: string | null;
  is_open: boolean;
}

interface StudentPreview {
  id: string;
  nim: string;
  full_name: string;
  email: string | null;
  avatar_url: string | null;
  isBanned: boolean;
}

export default function SellerAccountAndBannedPage() {
  // Global & Profile State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [canteen, setCanteen] = useState<CanteenProfile | null>(null);

  // Edit Profile Form State
  const [editFullName, setEditFullName] = useState("");
  const [editCanteenName, setEditCanteenName] = useState("");
  const [editWhatsapp, setEditWhatsapp] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  // Password Change Form State
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // Ban Mahasiswa (NIM Saja) State
  const [bans, setBans] = useState<BanItem[]>([]);
  const [nimInput, setNimInput] = useState("");
  const [lookingUpNim, setLookingUpNim] = useState(false);
  const [studentPreview, setStudentPreview] = useState<StudentPreview | null>(null);
  const [lookupError, setLookupError] = useState("");
  const [reason, setReason] = useState("Bukti transfer QRIS palsu / diedit");
  const [customReason, setCustomReason] = useState("");
  const [banning, setBanning] = useState(false);

  // Unban confirmation modal state
  const [unbanTarget, setUnbanTarget] = useState<BanItem | null>(null);
  const [unbanning, setUnbanning] = useState(false);

  // CS Modal
  const [showCsModal, setShowCsModal] = useState(false);

  // Logout Confirmation State
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Load all data
  const loadAll = async () => {
    try {
      setError("");
      const [userRes, canteenRes, bansRes] = await Promise.all([
        api<UserProfile>("/api/me"),
        api<{ canteen: CanteenProfile }>("/api/seller/canteen"),
        api<BanItem[]>("/api/seller/bans"),
      ]);

      setProfile(userRes);
      setEditFullName(userRes.full_name || "");
      setEditWhatsapp(userRes.whatsapp || "");

      setCanteen(canteenRes.canteen);
      setEditCanteenName(canteenRes.canteen.name || "");
      setEditDescription(canteenRes.canteen.description || "");

      setBans(bansRes);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal memuat profil loket.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  // Toast Auto-dismiss
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
  };

  // Helper Initials
  const getInitials = (name?: string) => {
    if (!name) return "LK";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Avatar Upload
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast("Ukuran foto maksimal 5 MB.", "error");
      return;
    }

    setUploadingAvatar(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/uploads/avatar", {
        method: "POST",
        body: fd,
        credentials: "include",
      });

      let json;
      try {
        json = await res.json();
      } catch {
        throw new Error("Gagal mengurai respon server.");
      }

      if (!res.ok || json.success === false) {
        throw new Error(json?.error?.message || "Gagal mengunggah foto profil.");
      }

      setProfile((prev) => (prev ? { ...prev, avatar_url: json.data.avatar_url } : null));
      showToast("Foto profil loket berhasil diperbarui.");
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Upload gagal.", "error");
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Save Profile & Canteen Info
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFullName.trim()) {
      showToast("Nama lengkap pemilik wajib diisi.", "error");
      return;
    }
    if (!editCanteenName.trim()) {
      showToast("Nama stan / gerai wajib diisi.", "error");
      return;
    }

    setSavingProfile(true);
    try {
      const updatedUser = await api<UserProfile>("/api/me", {
        method: "PATCH",
        body: JSON.stringify({
          full_name: editFullName.trim(),
          whatsapp: editWhatsapp.trim(),
        }),
      });
      setProfile(updatedUser);

      const updatedCanteen = await api<CanteenProfile>("/api/seller/canteen", {
        method: "PATCH",
        body: JSON.stringify({
          name: editCanteenName.trim(),
          description: editDescription.trim(),
        }),
      });
      setCanteen(updatedCanteen);

      showToast("Perubahan data profil pemilik & gerai berhasil disimpan.");
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Gagal menyimpan data profil.", "error");
    } finally {
      setSavingProfile(false);
    }
  };

  // Save Password Change
  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword) {
      showToast("Kata sandi saat ini wajib diisi.", "error");
      return;
    }
    if (newPassword.length < 6) {
      showToast("Kata sandi baru minimal 6 karakter.", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast("Konfirmasi kata sandi baru tidak cocok.", "error");
      return;
    }

    setSavingPassword(true);
    try {
      await api("/api/me", {
        method: "PATCH",
        body: JSON.stringify({
          old_password: oldPassword,
          new_password: newPassword,
        }),
      });
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      showToast("Kata sandi loket berhasil diperbarui.");
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Gagal mengganti kata sandi.", "error");
    } finally {
      setSavingPassword(false);
    }
  };

  // Lookup Student by NIM
  const handleLookupNim = async (nimToLookup: string) => {
    const clean = nimToLookup.trim();
    if (!clean || clean.length < 5) {
      setStudentPreview(null);
      setLookupError("");
      return;
    }

    setLookingUpNim(true);
    setLookupError("");
    try {
      const res = await api<{ student: StudentPreview }>(
        `/api/seller/bans?lookup_nim=${encodeURIComponent(clean)}`
      );
      setStudentPreview(res.student);
    } catch (err: unknown) {
      setStudentPreview(null);
      setLookupError(err instanceof Error ? err.message : "Mahasiswa tidak ditemukan di SIAKAD.");
    } finally {
      setLookingUpNim(false);
    }
  };

  // Ban Mahasiswa (NIM Saja)
  const handleBanStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNim = nimInput.trim();
    if (!cleanNim) {
      showToast("NIM mahasiswa wajib diisi.", "error");
      return;
    }

    const finalReason = reason === "Lainnya (Input Alasan Khusus)" ? customReason.trim() : reason;
    if (!finalReason) {
      showToast("Alasan pemblokiran wajib diisi.", "error");
      return;
    }

    setBanning(true);
    try {
      await api("/api/seller/bans", {
        method: "POST",
        body: JSON.stringify({
          nim: cleanNim,
          reason: finalReason,
        }),
      });

      showToast(`Mahasiswa NIM ${cleanNim} berhasil diblokir dari loket.`);
      setNimInput("");
      setReason("Bukti transfer QRIS palsu / diedit");
      setCustomReason("");
      setStudentPreview(null);
      setLookupError("");

      const updatedBans = await api<BanItem[]>("/api/seller/bans");
      setBans(updatedBans);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Gagal memblokir mahasiswa.", "error");
    } finally {
      setBanning(false);
    }
  };

  // Unban Mahasiswa
  const handleExecuteUnban = async () => {
    if (!unbanTarget) return;
    setUnbanning(true);
    try {
      await api(`/api/seller/bans/${unbanTarget.user_id}`, { method: "DELETE" });
      setBans((prev) => prev.filter((item) => item.user_id !== unbanTarget.user_id));
      showToast(`Akses memesan untuk ${unbanTarget.full_name} (${unbanTarget.username}) berhasil dipulihkan.`);
      setUnbanTarget(null);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Gagal membuka blokir.", "error");
    } finally {
      setUnbanning(false);
    }
  };

  // Logout
  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/login";
    } catch {
      window.location.href = "/login";
    }
  };

  if (error && !profile) {
    return (
      <div className="px-4 pt-6">
        <ErrorBox msg={error} onRetry={loadAll} />
      </div>
    );
  }

  if (loading || !profile || !canteen) {
    return (
      <div className="px-4 pt-6 pb-24 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-surface-container animate-pulse" />
          <div className="h-5 w-40 bg-surface-container rounded-md animate-pulse" />
        </div>
        <LoadingList n={4} />
      </div>
    );
  }

  return (
    <div className="relative flex flex-col min-h-screen">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-[70] w-[90%] max-w-[390px] liquid-glass rounded-2xl p-3.5 shadow-2xl flex items-center gap-3 border transition-all ${
            toast.type === "success"
              ? "border-emerald-500/40 text-on-surface"
              : "border-danger/40 text-danger"
          }`}
        >
          <span
            className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white ${
              toast.type === "success" ? "bg-emerald-600" : "bg-danger"
            }`}
          >
            {toast.type === "success" ? <CircleCheckBig size={18} /> : <AlertCircle size={18} />}
          </span>
          <p className="text-xs font-bold leading-snug">{toast.message}</p>
        </div>
      )}

      {/* Hidden File Input for Avatar */}
      <input
        ref={avatarInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleAvatarChange}
      />

      {/* Sticky Header (Glass docked) matching updated Stitch UI */}
      <header className="sticky top-0 z-40 w-full bg-surface-glass-alt dark:bg-inverse-surface backdrop-blur-md border-b border-border-specular dark:border-border-subtle shadow-sm dark:shadow-none px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-primary-container/30 overflow-hidden shadow-sm flex-shrink-0 bg-surface-container">
            {profile.avatar_url ? (
              <img
                className="w-full h-full object-cover"
                src={profile.avatar_url}
                alt={profile.full_name}
              />
            ) : (
              <div className="w-full h-full bg-[#faede6] flex items-center justify-center font-extrabold text-sm text-primary">
                {getInitials(profile.full_name)}
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-extrabold text-primary dark:text-inverse-primary tracking-tight">
                VetaBite
              </span>
              <span className="bg-primary/10 text-primary dark:text-primary-fixed-dim text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                Mitra
              </span>
            </div>
            <p className="text-xs text-text-muted dark:text-outline font-semibold">
              {canteen.queue_prefix ? `Loket #${canteen.queue_prefix}` : "Loket"} {canteen.name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            aria-label="Notifikasi Pesanan"
            onClick={() => showToast("Pemberitahuan loket aktif")}
            className="w-10 h-10 relative flex items-center justify-center rounded-full text-primary dark:text-inverse-primary hover:bg-surface-container transition-colors duration-150 active:scale-95"
            type="button"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-danger rounded-full ring-2 ring-white" />
          </button>
        </div>
      </header>

      {/* Scrollable Content Canvas */}
      <div className="px-4 pt-4 space-y-4 relative z-10 pb-8">
        {/* SECTION 1: CANTEEN PROFILE HERO CARD */}
        <section className="liquid-glass-card rounded-[24px] p-4 relative overflow-hidden border border-border-specular shadow-sm">
          <div className="flex items-start justify-between gap-3 mb-3.5">
            <div className="flex items-center gap-3.5">
              <div className="relative flex-shrink-0">
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#FF8A00] to-[#E03A00] p-[2.5px] shadow-md flex items-center justify-center">
                  <div className="w-full h-full bg-[#faede6] rounded-full flex items-center justify-center font-extrabold text-[22px] text-primary overflow-hidden">
                    {profile.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={profile.full_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{getInitials(profile.full_name)}</span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  disabled={uploadingAvatar}
                  onClick={() => avatarInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center shadow-md border-2 border-white hover:bg-primary-container transition active:scale-95"
                  title="Ganti Foto Profil"
                >
                  {uploadingAvatar ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Camera className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
              <div className="flex flex-col">
                <h3 className="text-base font-extrabold text-on-surface leading-tight">
                  {profile.full_name}
                </h3>
                <div className="flex items-center gap-1.5 text-xs text-primary font-bold mt-0.5">
                  <Store className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span>
                    {canteen.name} ({canteen.queue_prefix ? `Loket #${canteen.queue_prefix}` : "Loket"})
                  </span>
                </div>
                <span className="text-[11px] text-text-muted font-mono">@{profile.username}</span>
                <span className="text-[11px] text-text-muted font-mono">
                  {profile.whatsapp || "Belum ada nomor WhatsApp"}
                </span>
              </div>
            </div>
            <div className="liquid-glass-pill px-2.5 py-1 rounded-full flex items-center gap-1.5 flex-shrink-0">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span className="text-[10px] font-bold text-on-surface">Mitra Kantin Aktif</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-center pt-2 border-t border-border-subtle/50">
            <div className="p-2.5 rounded-[16px] bg-white/50 dark:bg-white/5 border border-white/70">
              <span className="text-[10px] font-bold uppercase text-text-muted tracking-wider">
                Status Loket
              </span>
              <p className="text-sm font-black text-success mt-0.5 flex items-center justify-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    canteen.is_open ? "bg-success" : "bg-warning"
                  }`}
                />
                {canteen.is_open ? "BUKA" : "TUTUP"}
              </p>
            </div>
            <div className="p-2.5 rounded-[16px] bg-white/50 dark:bg-white/5 border border-white/70">
              <span className="text-[10px] font-bold uppercase text-text-muted tracking-wider">
                Mahasiswa Diblokir
              </span>
              <p className="text-sm font-black text-danger mt-0.5 flex items-center justify-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-danger" />
                {bans.length} Akun
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 2: ACCOUNT & SECURITY MANAGEMENT */}
        <section className="liquid-glass-card rounded-[24px] p-4 flex flex-col gap-3.5 border border-border-specular shadow-sm">
          <div className="flex items-center justify-between border-b border-border-subtle/50 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <SlidersHorizontal className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-extrabold text-on-surface">
                Ubah Informasi Gerai &amp; Pemilik
              </h3>
            </div>
            <span className="text-[10px] font-bold text-text-muted bg-surface-container px-2 py-0.5 rounded-full">
              Profil
            </span>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-3">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-on-surface-variant">
                Nama Lengkap Pemilik
              </label>
              <input
                type="text"
                required
                value={editFullName}
                onChange={(e) => setEditFullName(e.target.value)}
                placeholder="Contoh: Ibu Ariani"
                className="w-full h-11 px-3.5 rounded-xl bg-white/70 dark:bg-black/30 border border-border-specular text-xs font-medium text-on-surface focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary shadow-sm transition"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-on-surface-variant">
                Nama Gerai / Loket
              </label>
              <input
                type="text"
                required
                value={editCanteenName}
                onChange={(e) => setEditCanteenName(e.target.value)}
                placeholder="Contoh: Ayam Geprek Ariani"
                className="w-full h-11 px-3.5 rounded-xl bg-white/70 dark:bg-black/30 border border-border-specular text-xs font-medium text-on-surface focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary shadow-sm transition"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-on-surface-variant">
                Nomor WhatsApp Loket
              </label>
              <input
                type="tel"
                value={editWhatsapp}
                onChange={(e) => setEditWhatsapp(e.target.value)}
                placeholder="Contoh: 081298765432"
                className="w-full h-11 px-3.5 rounded-xl bg-white/70 dark:bg-black/30 border border-border-specular text-xs font-mono font-medium text-on-surface focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary shadow-sm transition"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-on-surface-variant">Deskripsi Gerai</label>
              <textarea
                rows={2}
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Spesialis ayam geprek sambal korek & cabe ijo kampus UPNVJ."
                className="w-full p-2.5 rounded-xl bg-white/70 dark:bg-black/30 border border-border-specular text-xs font-medium text-on-surface focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary shadow-sm transition resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="btn-crimson-block w-full h-[46px] rounded-full text-white font-extrabold text-[14px] flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-md cursor-pointer disabled:opacity-50"
            >
              {savingProfile ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <Save className="w-4 h-4 text-white" />
              )}
              <span>{savingProfile ? "Menyimpan Data..." : "Simpan Perubahan Profil & Loket"}</span>
            </button>
          </form>

          {/* Sub-form: Keamanan Kata Sandi Loket */}
          <div className="mt-2 pt-3 border-t border-border-subtle/50 flex flex-col gap-2.5">
            <div className="flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-primary" />
              <h4 className="text-xs font-extrabold text-on-surface">Keamanan Kata Sandi Loket</h4>
            </div>

            <form onSubmit={handleSavePassword} className="space-y-2.5">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-on-surface-variant">
                  Kata Sandi Saat Ini
                </label>
                <div className="relative">
                  <input
                    type={showOldPass ? "text" : "password"}
                    required
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="Kata sandi saat ini"
                    className="w-full h-10 px-3.5 pr-10 rounded-xl bg-white/70 dark:bg-black/30 border border-border-specular text-xs text-on-surface focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary shadow-sm transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPass(!showOldPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-on-surface"
                  >
                    {showOldPass ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-on-surface-variant">Kata Sandi Baru</label>
                <div className="relative">
                  <input
                    type={showNewPass ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimal 8 karakter"
                    className="w-full h-10 px-3.5 pr-10 rounded-xl bg-white/70 dark:bg-black/30 border border-border-specular text-xs text-on-surface focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary shadow-sm transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-on-surface"
                  >
                    {showNewPass ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-on-surface-variant">
                  Konfirmasi Kata Sandi Baru
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPass ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ulangi kata sandi baru"
                    className="w-full h-10 px-3.5 pr-10 rounded-xl bg-white/70 dark:bg-black/30 border border-border-specular text-xs text-on-surface focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary shadow-sm transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-on-surface"
                  >
                    {showConfirmPass ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={savingPassword}
                className="w-full h-10 rounded-full border border-primary/40 bg-surface-container-lowest/90 text-primary font-bold text-[13px] hover:bg-primary hover:text-white transition active:scale-95 flex items-center justify-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
              >
                {savingPassword ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <KeyRound className="w-3.5 h-3.5" />
                )}
                <span>
                  {savingPassword ? "Memperbarui Kata Sandi..." : "Perbarui Kata Sandi Loket"}
                </span>
              </button>
            </form>
          </div>
        </section>

        {/* SECTION 3: BAN STUDENT BY NIM ONLY */}
        <section className="liquid-glass-card rounded-[24px] p-4 flex flex-col gap-3.5 border border-border-specular shadow-sm">
          <div className="flex items-center justify-between border-b border-border-subtle/50 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-danger/10 text-danger flex items-center justify-center">
                <UserX className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-on-surface">Blokir Mahasiswa Berdasarkan NIM</h3>
            </div>
            <span className="text-[10px] font-bold text-danger bg-error-container px-2 py-0.5 rounded-md">
              10 Digit UPNVJ
            </span>
          </div>

          <form onSubmit={handleBanStudent} className="space-y-3">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-on-surface-variant flex items-center justify-between">
                <span>Nomor Induk Mahasiswa (NIM)</span>
                <span className="text-[9px] text-primary font-bold">Auto-Fetch SIAKAD</span>
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    required
                    value={nimInput}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, "");
                      setNimInput(val);
                      handleLookupNim(val);
                    }}
                    placeholder="Contoh: 2610511070"
                    maxLength={12}
                    className="w-full h-11 px-3.5 rounded-xl bg-white/70 border border-border-specular text-xs font-mono font-bold text-on-surface focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 shadow-sm transition"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleLookupNim(nimInput)}
                  disabled={lookingUpNim || !nimInput}
                  className="px-4 h-11 rounded-xl bg-primary text-white font-bold text-xs flex items-center justify-center gap-1 active:scale-95 shadow-sm transition shrink-0 disabled:opacity-50"
                >
                  {lookingUpNim ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <Search className="w-4 h-4 text-white" />
                  )}
                  <span>Cek NIM</span>
                </button>
              </div>
            </div>

            {/* Student SIAKAD Preview Card */}
            {studentPreview && (
              <div className="bg-surface-container-low/80 rounded-2xl p-3 border border-primary/20 flex flex-col gap-2 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-primary flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 text-primary" strokeWidth={3} />
                    Terverifikasi di SIAKAD UPNVJ
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-primary/10 text-primary">
                    Aktif S1
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#FF8A00] to-[#E03A00] text-white flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
                    {getInitials(studentPreview.full_name)}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <h4 className="text-xs font-bold text-on-surface truncate">
                      {studentPreview.full_name}
                    </h4>
                    <p className="text-[11px] font-mono font-bold text-on-surface-variant">
                      NIM: {studentPreview.nim}
                    </p>
                    <p className="text-[11px] text-text-muted truncate">
                      {studentPreview.email || `${studentPreview.nim}@mahasiswa.upnvj.ac.id`}
                    </p>
                    <span className="text-[10px] text-primary font-bold mt-0.5">
                      FIK • S1 Informatika UPNVJ
                    </span>
                  </div>
                </div>
                {studentPreview.isBanned && (
                  <div className="text-[10px] font-bold text-danger bg-red-100/80 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                    <ShieldAlert size={12} className="shrink-0" />
                    <span>Mahasiswa ini saat ini sedang masuk dalam daftar blokir loket Anda.</span>
                  </div>
                )}
              </div>
            )}

            {lookupError && (
              <div className="p-2.5 rounded-xl bg-error-container/60 border border-error/20 text-danger text-[11px] font-semibold flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0" />
                <span>{lookupError}</span>
              </div>
            )}

            {/* Reason Dropdown Menu */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-on-surface-variant">
                Alasan Pemblokiran
              </label>
              <select
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl bg-white/70 border border-border-specular text-xs font-medium text-on-surface focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 shadow-sm transition"
              >
                <option value="Bukti transfer QRIS palsu / diedit">Bukti transfer QRIS palsu / diedit</option>
                <option value="Pesanan fiktif (tidak diambil saat jam istirahat)">
                  Pesanan fiktif (tidak diambil saat jam istirahat)
                </option>
                <option value="Spam pesanan saat antrean ramai">Spam pesanan saat antrean ramai</option>
                <option value="Catatan pesanan tidak sopan / kasar">Catatan pesanan tidak sopan / kasar</option>
                <option value="Lainnya (Input Alasan Khusus)">Lainnya (Input Alasan Khusus)</option>
              </select>
            </div>

            {reason === "Lainnya (Input Alasan Khusus)" && (
              <input
                type="text"
                required
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Tuliskan alasan pemblokiran khusus..."
                className="w-full h-11 px-3.5 rounded-xl bg-white/70 border border-border-specular text-xs font-medium text-on-surface focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 shadow-sm transition"
              />
            )}

            {/* Danger Action Button */}
            <button
              type="submit"
              disabled={banning || !nimInput}
              className="w-full h-11 rounded-full bg-gradient-to-r from-danger to-primary text-white font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-md disabled:opacity-50 cursor-pointer"
            >
              {banning ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <ShieldAlert className="w-4 h-4 text-white" />
              )}
              <span>{banning ? "Memproses Pemblokiran..." : "Blokir Mahasiswa (NIM)"}</span>
            </button>
          </form>

          {/* Banned Student Records */}
          <div className="mt-2 pt-3 border-t border-border-subtle/50 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-on-surface">Daftar Mahasiswa Terblokir</h4>
              <span className="text-[11px] font-bold text-text-muted">{bans.length} Mahasiswa</span>
            </div>

            {bans.length === 0 ? (
              <div className="bg-surface-container-low/70 rounded-xl p-5 border border-border-subtle/50 flex flex-col items-center text-center gap-2">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h5 className="text-xs font-bold text-on-surface">Loket Bersih &amp; Terlindungi</h5>
                <p className="text-[11px] text-text-muted leading-relaxed max-w-[260px]">
                  Belum ada mahasiswa yang diblokir. Seluruh mahasiswa dapat bertransaksi normal di loket ini.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {bans.map((b) => (
                  <div
                    key={b.user_id}
                    className="bg-surface-container-low/70 rounded-xl p-3 border border-border-subtle/50 flex flex-col gap-2 shadow-xs"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h5 className="text-xs font-bold text-on-surface">{b.full_name}</h5>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-surface-container-high text-on-surface-variant">
                            UPNVJ
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-on-surface-variant font-bold">
                          NIM: {b.username}
                        </span>
                      </div>
                      <span className="badge-blocked text-danger px-2 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-1 shrink-0">
                        <UserX className="w-3 h-3 text-danger" /> Diblokir
                      </span>
                    </div>

                    <div className="text-[11px] text-text-muted bg-white/50 p-2 rounded-lg">
                      <p>
                        <span className="font-bold text-on-surface">Alasan:</span> {b.reason}
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-text-muted pt-1 mt-1 border-t border-border-subtle/30">
                        <span>
                          {new Date(b.created_at).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                        <span className="italic">Oleh: Loket Kantin</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setUnbanTarget(b)}
                      className="self-end px-3 py-1 rounded-full border border-primary/40 bg-surface-container-lowest text-primary text-[11px] font-bold hover:bg-primary hover:text-white transition active:scale-95 flex items-center gap-1 shadow-sm cursor-pointer"
                    >
                      <LockOpen className="w-3.5 h-3.5" />
                      <span>Buka Blokir</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* SECTION 4: LOGOUT ACTION */}
        <section className="pt-2 pb-6 flex flex-col items-center">
          <button
            type="button"
            onClick={() => setShowLogoutModal(true)}
            className="w-full h-[48px] rounded-full border-2 border-danger/40 bg-white/80 dark:bg-white/5 text-danger font-extrabold text-[14px] hover:bg-danger hover:text-white transition-all active:scale-95 flex items-center justify-center gap-2 shadow-sm cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
            <span>Keluar dari Akun Loket</span>
          </button>
          <span className="text-[11px] text-text-muted mt-2.5 font-medium">
            VetaBite Kantin UPNVJ v2.4 • Loket #{canteen.queue_prefix || "01"}
          </span>
        </section>
      </div>

      {/* Floating Customer Service (CS) Button matching Stitch */}
      <div className="fixed bottom-24 right-4 z-40 max-w-[430px]">
        <button
          onClick={() => setShowCsModal(true)}
          type="button"
          aria-label="Pusat Bantuan CS VetaBite"
          className="relative w-[54px] h-[54px] rounded-full flex items-center justify-center bg-gradient-to-br from-[#FF5722] to-[#B82900] text-white shadow-2xl border-[1.5px] border-white/90 active:scale-95 transition-transform duration-150 group cursor-pointer hover:shadow-primary/40"
        >
          <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-success border-2 border-white" />
          </span>
          <Headset className="w-6 h-6 text-white drop-shadow" />
        </button>
      </div>

      {/* Modal Buka Blokir */}
      {unbanTarget && (
        <div className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-[340px] bg-white rounded-3xl p-5 shadow-2xl border border-border-specular space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary mx-auto flex items-center justify-center">
              <LockOpen size={24} />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-on-surface">Buka Blokir Mahasiswa?</h3>
              <p className="text-xs text-text-muted mt-1 leading-relaxed">
                Apakah Anda yakin ingin memulihkan akses memesan untuk{" "}
                <b className="text-on-surface">{unbanTarget.full_name}</b> (NIM: {unbanTarget.username})?
                Mahasiswa ini akan dapat memesan kembali di loket Anda.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                disabled={unbanning}
                onClick={() => setUnbanTarget(null)}
                className="min-h-[40px] rounded-full bg-surface-container hover:bg-surface-container-high text-xs font-bold text-on-surface transition-all"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={unbanning}
                onClick={handleExecuteUnban}
                className="min-h-[40px] rounded-full btn-crimson-block text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1 cursor-pointer"
              >
                {unbanning ? <Loader2 size={13} className="animate-spin text-white" /> : <Check size={14} />}
                <span>{unbanning ? "Membuka..." : "Ya, Buka"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Customer Service (Canteen Care) */}
      {showCsModal && (
        <div className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-[350px] bg-white rounded-3xl p-5 shadow-2xl border border-border-specular space-y-4">
            <div className="flex items-center justify-between border-b border-border-subtle/50 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Headset size={18} />
                </div>
                <div>
                  <h3 className="text-xs font-extrabold text-on-surface">Canteen Care Helpdesk</h3>
                  <p className="text-[10px] text-text-muted">Layanan Pengaduan &amp; Bantuan Loket</p>
                </div>
              </div>
              <button
                onClick={() => setShowCsModal(false)}
                className="w-7 h-7 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-text-muted hover:text-on-surface"
              >
                <X size={14} />
              </button>
            </div>

            <div className="bg-surface-container-low/80 rounded-2xl p-3 border border-border-subtle/50 space-y-2 text-xs text-text-muted">
              <p className="text-on-surface font-semibold">
                Pusat Bantuan Resmi Mitra Kantin UPN Veteran Jakarta.
              </p>
              <p>
                Jika mengalami kendala transaksi QRIS, gangguan sistem loket, atau membutuhkan mediasi pesanan dengan mahasiswa, tim pengelola kantin kampus siap membantu.
              </p>
              <div className="pt-1 border-t border-border-subtle/40 flex items-center justify-between text-[11px]">
                <span className="font-bold text-on-surface">Jam Operasional:</span>
                <span className="text-primary font-bold">Senin - Jumat 07:30 - 17:00</span>
              </div>
            </div>

            <a
              href="https://wa.me/6281298765432?text=Halo%20Admin%20VetaBite%2C%20saya%20pemilik%20loket%20butuh%20bantuan."
              target="_blank"
              rel="noopener noreferrer"
              className="w-full h-11 rounded-full btn-crimson-block text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md active:scale-95 transition-transform"
            >
              <Phone size={14} />
              <span>Hubungi Pengelola via WhatsApp</span>
            </a>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Logout */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-[340px] bg-white rounded-3xl p-5 shadow-2xl border border-border-specular space-y-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-red-100 text-danger mx-auto flex items-center justify-center">
              <LogOut size={26} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-on-surface">Konfirmasi Keluar?</h3>
              <p className="text-xs text-text-muted mt-1 leading-relaxed">
                Sesi loket Anda akan diakhiri. Anda perlu memasukkan kredensial login kembali untuk membuka dapur loket.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                disabled={loggingOut}
                onClick={() => setShowLogoutModal(false)}
                className="min-h-[42px] rounded-full bg-surface-container hover:bg-surface-container-high text-xs font-bold text-on-surface transition-all"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={loggingOut}
                onClick={handleLogout}
                className="min-h-[42px] rounded-full bg-danger text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {loggingOut ? <Loader2 size={14} className="animate-spin text-white" /> : <LogOut size={14} />}
                <span>{loggingOut ? "Keluar..." : "Ya, Keluar"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
