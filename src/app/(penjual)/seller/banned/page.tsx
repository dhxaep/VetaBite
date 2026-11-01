"use client";

import { useEffect, useState, useRef } from "react";
import {
  User,
  Store,
  Phone,
  KeyRound,
  ShieldAlert,
  LogOut,
  Camera,
  Search,
  Lock,
  Eye,
  EyeOff,
  UserCheck,
  ShieldCheck,
  UserX,
  LockKeyhole,
  LockOpen,
  TriangleAlert,
  CircleCheckBig,
  Loader2,
  AlertCircle,
  IdCard,
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
  const [showPassword, setShowPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // Ban Mahasiswa (NIM Saja) State
  const [bans, setBans] = useState<BanItem[]>([]);
  const [nimInput, setNimInput] = useState("");
  const [lookingUpNim, setLookingUpNim] = useState(false);
  const [studentPreview, setStudentPreview] = useState<StudentPreview | null>(null);
  const [lookupError, setLookupError] = useState("");
  const [reason, setReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [banning, setBanning] = useState(false);

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
      showToast("Nama stan / loket wajib diisi.", "error");
      return;
    }

    setSavingProfile(true);
    try {
      // 1. Update User Profile
      const updatedUser = await api<UserProfile>("/api/me", {
        method: "PATCH",
        body: JSON.stringify({
          full_name: editFullName.trim(),
          whatsapp: editWhatsapp.trim(),
        }),
      });
      setProfile(updatedUser);

      // 2. Update Canteen Name & Description
      const updatedCanteen = await api<CanteenProfile>("/api/seller/canteen", {
        method: "PATCH",
        body: JSON.stringify({
          name: editCanteenName.trim(),
          description: editDescription.trim(),
        }),
      });
      setCanteen(updatedCanteen);

      showToast("Data profil pemilik dan loket berhasil disimpan.");
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
      showToast("Kata sandi lama wajib diisi.", "error");
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
      setLookupError(err instanceof Error ? err.message : "Mahasiswa tidak ditemukan.");
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

    const finalReason = reason === "Lainnya" ? customReason.trim() : reason;
    if (!finalReason) {
      showToast("Alasan pemblokiran wajib dipilih.", "error");
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
      setReason("");
      setCustomReason("");
      setStudentPreview(null);
      setLookupError("");

      // Refresh ban list
      const updatedBans = await api<BanItem[]>("/api/seller/bans");
      setBans(updatedBans);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Gagal memblokir mahasiswa.", "error");
    } finally {
      setBanning(false);
    }
  };

  // Unban Mahasiswa
  const handleUnban = async (b: BanItem) => {
    if (!confirm(`Buka blokir untuk ${b.full_name} (${b.username})? Mahasiswa ini akan dapat memesan kembali.`)) {
      return;
    }

    try {
      await api(`/api/seller/bans/${b.user_id}`, { method: "DELETE" });
      setBans((prev) => prev.filter((item) => item.user_id !== b.user_id));
      showToast(`Blokir untuk ${b.full_name} telah dibuka.`);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Gagal membuka blokir.", "error");
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
      <div className="px-space-lg pt-6">
        <ErrorBox msg={error} onRetry={loadAll} />
      </div>
    );
  }

  if (loading || !profile || !canteen) {
    return (
      <div className="px-space-lg pt-6 pb-24 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-surface-container animate-pulse" />
          <div className="h-5 w-40 bg-surface-container rounded-md animate-pulse" />
        </div>
        <LoadingList n={4} />
      </div>
    );
  }

  return (
    <div className="px-space-lg pt-4 pb-28 flex flex-col gap-5 antialiased">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-14 left-1/2 -translate-x-1/2 z-[70] w-[90%] max-w-[390px] liquid-glass rounded-2xl p-3.5 shadow-2xl flex items-center gap-3 border transition-all ${
            toast.type === "success"
              ? "border-emerald-500/40 text-on-surface"
              : "border-error/40 text-error"
          }`}
        >
          <span
            className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white ${
              toast.type === "success" ? "bg-emerald-600" : "bg-error"
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

      {/* ========================================================
          BAGIAN 1: PROFILE SI KANTIN DULU
          ======================================================== */}
      <section className="relative liquid-glass rounded-[28px] p-5 shadow-sm border border-border-specular overflow-hidden">
        {/* Decorative specular background gradient */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-primary/10 rounded-full blur-2xl pointer-events-none -mr-8 -mt-8" />

        <div className="relative z-10 flex items-start gap-4">
          {/* Avatar with Camera Overlay */}
          <div className="relative group shrink-0">
            <div className="w-20 h-20 rounded-[22px] bg-surface-container border-2 border-white shadow-md overflow-hidden flex items-center justify-center text-primary">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-2xl font-black uppercase text-primary">
                  {profile.full_name?.charAt(0) || "K"}
                </span>
              )}
            </div>
            <button
              type="button"
              disabled={uploadingAvatar}
              onClick={() => avatarInputRef.current?.click()}
              className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center shadow-md active:scale-95 transition-transform hover:bg-primary-hover"
              title="Ganti Foto Profil"
            >
              {uploadingAvatar ? <Loader2 size={13} className="animate-spin" /> : <Camera size={13} />}
            </button>
          </div>

          {/* Identity Information */}
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                Mitra Kantin Aktif
              </span>
              <span className="text-[10px] text-text-muted font-mono font-semibold">
                @{profile.username}
              </span>
            </div>

            <h1 className="text-base font-extrabold text-on-surface truncate leading-tight">
              {profile.full_name}
            </h1>
            <p className="text-xs font-bold text-primary truncate flex items-center gap-1">
              <Store size={13} className="shrink-0" />
              <span>{canteen.name}</span>
            </p>
            <p className="text-[11px] text-text-muted flex items-center gap-1">
              <Phone size={11} className="shrink-0 text-[#24A148]" />
              <span>{profile.whatsapp || "Belum ada nomor WhatsApp"}</span>
            </p>
          </div>
        </div>

        {/* Canteen Summary Badges */}
        <div className="mt-4 pt-3 border-t border-border-specular/80 grid grid-cols-2 gap-2 text-center">
          <div className="bg-surface-container-lowest/80 p-2.5 rounded-2xl border border-border-specular">
            <span className="text-[10px] text-text-muted block font-semibold">Status Operasional</span>
            <span
              className={`text-xs font-black ${
                canteen.is_open ? "text-emerald-600" : "text-amber-600"
              }`}
            >
              {canteen.is_open ? "Buka (Menerima Pesanan)" : "Tutup Sementara"}
            </span>
          </div>
          <div className="bg-surface-container-lowest/80 p-2.5 rounded-2xl border border-border-specular">
            <span className="text-[10px] text-text-muted block font-semibold">Mahasiswa Diblokir</span>
            <span className="text-xs font-black text-danger">{bans.length} Akun</span>
          </div>
        </div>
      </section>

      {/* ========================================================
          BAGIAN 2: GANTI SEGALA MACEM (KELOLA PROFIL & KEAMANAN)
          ======================================================== */}
      <section className="liquid-glass rounded-[26px] p-4.5 shadow-sm border border-border-specular space-y-4">
        <div className="flex items-center gap-2 border-b border-border-specular pb-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Store size={16} />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-on-surface">Ubah Informasi Gerai & Pemilik</h2>
            <p className="text-[11px] text-text-muted">Perbarui data kontak, nama stan, dan profil loket</p>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-3">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-on-surface flex items-center gap-1">
              <User size={12} className="text-primary" />
              <span>Nama Lengkap Pemilik Loket</span>
              <span className="text-primary">*</span>
            </label>
            <input
              type="text"
              required
              value={editFullName}
              onChange={(e) => setEditFullName(e.target.value)}
              placeholder="Contoh: Ibu Ariani"
              className="w-full h-10 px-3.5 rounded-xl bg-surface-container-lowest border border-border-specular text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 font-medium"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-on-surface flex items-center gap-1">
              <Store size={12} className="text-primary" />
              <span>Nama Stan / Gerai Kantin</span>
              <span className="text-primary">*</span>
            </label>
            <input
              type="text"
              required
              value={editCanteenName}
              onChange={(e) => setEditCanteenName(e.target.value)}
              placeholder="Contoh: Ayam Geprek Ariani"
              className="w-full h-10 px-3.5 rounded-xl bg-surface-container-lowest border border-border-specular text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 font-medium"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-on-surface flex items-center gap-1">
              <Phone size={12} className="text-[#24A148]" />
              <span>Nomor Kontak WhatsApp</span>
            </label>
            <input
              type="tel"
              value={editWhatsapp}
              onChange={(e) => setEditWhatsapp(e.target.value)}
              placeholder="Contoh: 085121132186"
              className="w-full h-10 px-3.5 rounded-xl bg-surface-container-lowest border border-border-specular text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 font-medium font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-text-muted">Deskripsi / Slogan Stan (Opsional)</label>
            <textarea
              rows={2}
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="Deskripsi singkat menu andalan atau lokasi meja gerai..."
              className="w-full p-2.5 rounded-xl bg-surface-container-lowest border border-border-specular text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 font-medium resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={savingProfile}
            className="w-full min-h-[42px] rounded-full btn-tangy-gradient text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all disabled:opacity-50"
          >
            {savingProfile ? (
              <Loader2 size={14} className="animate-spin text-white" />
            ) : (
              <UserCheck size={14} />
            )}
            <span>{savingProfile ? "Menyimpan Data..." : "Simpan Perubahan Profil & Loket"}</span>
          </button>
        </form>

        {/* Sub-form: Keamanan & Kata Sandi */}
        <div className="pt-3 border-t border-border-specular space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <KeyRound size={14} />
            </div>
            <div>
              <h3 className="text-xs font-extrabold text-on-surface">Ubah Kata Sandi Akun Loket</h3>
              <p className="text-[10px] text-text-muted">Perbarui kata sandi untuk keamanan akses dapur</p>
            </div>
          </div>

          <form onSubmit={handleSavePassword} className="space-y-2.5">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                <Lock size={13} />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="Kata sandi saat ini..."
                className="w-full h-10 pl-8 pr-9 text-xs bg-surface-container-lowest border border-border-specular rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-muted hover:text-on-surface"
              >
                {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                <KeyRound size={13} />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Kata sandi baru (min. 6 karakter)..."
                className="w-full h-10 pl-8 pr-9 text-xs bg-surface-container-lowest border border-border-specular rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none"
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                <KeyRound size={13} />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Konfirmasi kata sandi baru..."
                className="w-full h-10 pl-8 pr-9 text-xs bg-surface-container-lowest border border-border-specular rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={savingPassword}
              className="w-full min-h-[40px] rounded-full bg-white hover:bg-surface-container text-on-surface border border-border-specular text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all disabled:opacity-50"
            >
              {savingPassword ? (
                <Loader2 size={13} className="animate-spin text-primary" />
              ) : (
                <Lock size={13} className="text-primary" />
              )}
              <span>{savingPassword ? "Memperbarui Kata Sandi..." : "Perbarui Kata Sandi Loket"}</span>
            </button>
          </form>
        </div>
      </section>

      {/* ========================================================
          BAGIAN 3: BLOKIR MAHASISWA (NIM SAJA)
          ======================================================== */}
      <section className="liquid-glass rounded-[26px] p-4.5 shadow-sm border border-border-specular space-y-4">
        <div className="flex items-center justify-between border-b border-border-specular pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-danger/10 text-danger flex items-center justify-center">
              <ShieldAlert size={16} />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-on-surface">Perlindungan Loket & Daftar Hitam</h2>
              <p className="text-[11px] text-text-muted">Blokir mahasiswa bermasalah menggunakan NIM</p>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-error-container text-error text-[10px] font-black shrink-0">
            {bans.length} Diblokir
          </span>
        </div>

        {/* Input Form Blokir Mahasiswa Menggunakan NIM */}
        <form onSubmit={handleBanStudent} className="space-y-3 bg-surface-container-low/60 p-3.5 rounded-2xl border border-border-specular">
          <div className="space-y-1">
            <label className="text-[11px] font-extrabold text-on-surface flex items-center justify-between">
              <span className="flex items-center gap-1">
                <IdCard size={13} className="text-primary" />
                <span>NIM Mahasiswa (10 Digit)</span>
                <span className="text-primary">*</span>
              </span>
              <span className="text-[10px] text-text-muted font-normal font-mono">
                Hanya gunakan NIM
              </span>
            </label>

            <div className="relative flex items-center">
              <input
                type="text"
                required
                value={nimInput}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, "");
                  setNimInput(val);
                  handleLookupNim(val);
                }}
                placeholder="Ketik 10 digit NIM (contoh: 2610511070)"
                maxLength={12}
                className="w-full h-10 pl-3.5 pr-20 rounded-xl bg-surface-container-lowest border border-border-specular text-xs font-mono font-bold text-on-surface placeholder:font-sans placeholder:font-normal placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <button
                type="button"
                onClick={() => handleLookupNim(nimInput)}
                disabled={lookingUpNim || !nimInput}
                className="absolute right-1.5 px-2.5 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high text-[10px] font-bold text-on-surface flex items-center gap-1 border border-border-specular"
              >
                {lookingUpNim ? <Loader2 size={11} className="animate-spin text-primary" /> : <Search size={11} />}
                <span>Cek NIM</span>
              </button>
            </div>
          </div>

          {/* Student Lookup Preview Card */}
          {studentPreview && (
            <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200 flex items-center justify-between text-xs animate-in fade-in">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-emerald-200 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
                  {studentPreview.full_name?.charAt(0) || "M"}
                </div>
                <div className="truncate">
                  <p className="font-bold text-on-surface truncate">{studentPreview.full_name}</p>
                  <p className="text-[10px] text-text-muted font-mono">
                    NIM: {studentPreview.nim} {studentPreview.email && `• ${studentPreview.email}`}
                  </p>
                </div>
              </div>
              {studentPreview.isBanned && (
                <span className="text-[9px] font-black uppercase text-danger bg-red-100 px-2 py-0.5 rounded-full shrink-0">
                  Sudah Terblokir
                </span>
              )}
            </div>
          )}

          {lookupError && (
            <div className="p-2.5 rounded-xl bg-error-container/60 border border-error/20 text-error text-[11px] font-semibold flex items-center gap-2">
              <AlertCircle size={14} className="shrink-0" />
              <span>{lookupError}</span>
            </div>
          )}

          {/* Alasan Pemblokiran */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-on-surface">Pilih Alasan Pemblokiran *</label>
            <select
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full h-10 px-3 rounded-xl bg-surface-container-lowest border border-border-specular text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 font-medium"
            >
              <option value="">-- Pilih alasan pemblokiran --</option>
              <option value="Bukti pembayaran palsu / manipulasi QRIS">Bukti pembayaran palsu / manipulasi QRIS</option>
              <option value="Pesanan tidak pernah diambil (Ghosting)">Pesanan tidak pernah diambil (Ghosting)</option>
              <option value="Spam pesanan fiktif berulang">Spam pesanan fiktif berulang</option>
              <option value="Catatan pesanan kasar / tidak sopan">Catatan pesanan kasar / tidak sopan</option>
              <option value="Lainnya">Alasan Lainnya (Ketik sendiri)</option>
            </select>
          </div>

          {reason === "Lainnya" && (
            <input
              type="text"
              required
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="Jelaskan alasan pemblokiran secara spesifik..."
              className="w-full h-10 px-3.5 rounded-xl bg-surface-container-lowest border border-border-specular text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          )}

          <button
            type="submit"
            disabled={banning || !nimInput}
            className="w-full min-h-[42px] rounded-full btn-gradient-danger text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all disabled:opacity-50"
          >
            {banning ? (
              <Loader2 size={14} className="animate-spin text-white" />
            ) : (
              <UserX size={14} />
            )}
            <span>{banning ? "Memproses Pemblokiran..." : "Blokir Mahasiswa (NIM)"}</span>
          </button>
        </form>

        {/* Daftar Mahasiswa yang Diblokir */}
        <div className="space-y-2.5 pt-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-extrabold text-on-surface">Daftar Hitam Loket Saat Ini</h3>
            <span className="text-[10px] text-text-muted">{bans.length} Mahasiswa</span>
          </div>

          {bans.length === 0 ? (
            <div className="liquid-glass rounded-2xl p-6 flex flex-col items-center text-center gap-2 border border-border-specular">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
                <ShieldCheck size={26} />
              </div>
              <h4 className="text-xs font-extrabold text-on-surface">Loket Bersih & Aman</h4>
              <p className="text-[11px] text-text-muted leading-relaxed max-w-[280px]">
                Tidak ada mahasiswa yang sedang diblokir. Seluruh civitas kampus dapat memesan di loket ini.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {bans.map((b) => (
                <article
                  key={b.user_id}
                  className="bg-surface-container-lowest/90 rounded-2xl p-3 border border-border-specular flex flex-col gap-2 shadow-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-red-100 text-danger border border-red-200 flex items-center justify-center shrink-0">
                        <UserX size={16} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-extrabold text-on-surface truncate">
                          {b.full_name}
                        </h4>
                        <p className="text-[10px] font-mono text-text-muted">NIM: {b.username}</p>
                      </div>
                    </div>
                    <span className="text-[9px] text-text-muted bg-surface-container px-2 py-0.5 rounded-md font-medium shrink-0">
                      {new Date(b.created_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  <div className="bg-red-50/60 rounded-xl p-2 border border-red-100/80 flex items-center gap-1.5 text-danger">
                    <TriangleAlert size={12} className="shrink-0" />
                    <span className="text-[11px] font-semibold leading-tight">{b.reason}</span>
                  </div>

                  <div className="flex items-center justify-between pt-0.5">
                    <span className="text-[10px] text-text-muted flex items-center gap-1 font-medium">
                      <LockKeyhole size={11} className="text-danger" />
                      <span>Akses Ditolak Server</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleUnban(b)}
                      className="min-h-[32px] px-3 py-1 rounded-full bg-white hover:bg-surface-container text-text-muted hover:text-on-surface border border-border-specular text-[11px] font-bold flex items-center gap-1 active:scale-95 transition-all shadow-xs"
                    >
                      <LockOpen size={12} className="text-emerald-600" />
                      <span>Buka Blokir</span>
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ========================================================
          BAGIAN 4: LOGOUT AKUN
          ======================================================== */}
      <section className="pt-2">
        <button
          type="button"
          onClick={() => setShowLogoutModal(true)}
          className="w-full min-h-[48px] rounded-2xl bg-white hover:bg-red-50/60 text-danger border border-red-200 text-xs font-bold flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all group"
        >
          <LogOut size={16} className="transition-transform group-hover:-translate-x-0.5" />
          <span>Keluar dari Akun Loket</span>
        </button>
        <p className="text-[10px] text-text-muted text-center mt-2">
          VetaBite Kampus &bull; Sesi Loket Aman
        </p>
      </section>

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
                className="min-h-[42px] rounded-full btn-gradient-danger text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1.5"
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
