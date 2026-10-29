"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Settings,
  Camera,
  BadgeCheck,
  Globe,
  Lock,
  LogOut,
  Phone,
  User,
  Bell,
  Volume2,
  Check,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { api } from "@/lib/api";
import { useLocale } from "@/components/shared/Providers";
import { SkeletonList, ErrorState } from "@/components/shared/States";

type UserData = {
  id: string;
  username: string;
  full_name?: string;
  whatsapp?: string;
  avatar_url?: string;
  language?: string;
  theme?: string;
  role?: string;
  status?: string;
};

const DEFAULT_AVATAR =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuD4a-OG4I7OmbGRDtoE53vyzOBudPCi_uwRxWy1cA-UQxQKt_Gdh0cCznm5VUn03vdkVzjm3OtdBfP_LrFozXnOEYB1uwsoCulIpcLiQT0Gqj3CFSYSssPibmVRMbybEoy5qnUxWH0r7sOxtOz5MkMKP5WlTGpiL1zxjsGC3seMXEa3k5MuQbmR6uqbXp58EczbS4vpwzs8zbMn9_sNhBxyDKTSCZEeesIuqjeZAhtu";

export default function ProfilePage() {
  const r = useRouter();
  const { locale, setLocale } = useLocale();

  const [me, setMe] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // Edit fields
  const [fullName, setFullName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  // Password fields
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // Toggles
  const [soundNotify, setSoundNotify] = useState(true);
  const [hapticNotify, setHapticNotify] = useState(true);

  // Status feedback
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  async function loadUser() {
    setLoading(true);
    setErr("");
    try {
      const data = await api<UserData>("/api/me");
      setMe(data);
      setFullName(data.full_name || "");
      setWhatsapp(data.whatsapp || "");
      setAvatarUrl(data.avatar_url || DEFAULT_AVATAR);
      if (data.language && data.language !== locale) {
        setLocale(data.language);
      }
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUser();
    try {
      setSoundNotify(localStorage.getItem("vb-sound-notify") !== "0");
      setHapticNotify(localStorage.getItem("vb-haptic-notify") !== "0");
    } catch {}
  }, []);

  function showMessage(type: "success" | "error", text: string) {
    setFeedback({ type, text });
    setTimeout(() => {
      setFeedback(null);
    }, 4000);
  }

  // 1. Ganti Bahasa
  async function handleSelectLocale(nextLocale: "id" | "en") {
    setLocale(nextLocale);
    try {
      await api("/api/me", {
        method: "PATCH",
        body: JSON.stringify({ language: nextLocale }),
      });
      showMessage(
        "success",
        nextLocale === "id" ? "Bahasa diubah ke Bahasa Indonesia." : "Language switched to English."
      );
    } catch {}
  }

  // 3. Simpan Profil (Nama & WhatsApp)
  async function handleSaveProfile(ev: React.FormEvent) {
    ev.preventDefault();
    if (!fullName.trim()) {
      showMessage("error", "Nama lengkap tidak boleh kosong.");
      return;
    }
    setSavingProfile(true);
    try {
      const res = await api<UserData>("/api/me", {
        method: "PATCH",
        body: JSON.stringify({
          full_name: fullName.trim(),
          whatsapp: whatsapp.trim(),
        }),
      });
      setMe((prev) => (prev ? { ...prev, ...res } : res));
      showMessage("success", "Data profil berhasil diperbarui!");
    } catch (e: unknown) {
      showMessage("error", e instanceof Error ? e.message : "Gagal memperbarui profil.");
    } finally {
      setSavingProfile(false);
    }
  }

  // 4. Unggah Foto Profil (Avatar)
  async function handleAvatarChange(ev: React.ChangeEvent<HTMLInputElement>) {
    const file = ev.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      showMessage("error", "Format foto harus JPG, PNG, atau WEBP.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showMessage("error", "Ukuran foto maksimal 5 MB.");
      return;
    }

    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/uploads/avatar", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data?.error?.message || "Gagal mengunggah foto profil.");
      }
      setAvatarUrl(data.data.avatar_url);
      setMe((prev) => (prev ? { ...prev, avatar_url: data.data.avatar_url } : null));
      showMessage("success", "Foto profil berhasil diperbarui!");
    } catch (e: unknown) {
      showMessage("error", e instanceof Error ? e.message : "Gagal mengunggah foto.");
    } finally {
      setUploadingAvatar(false);
    }
  }

  // 5. Ganti Kata Sandi
  async function handleSavePassword(ev: React.FormEvent) {
    ev.preventDefault();
    if (!oldPassword) {
      showMessage("error", "Kata sandi lama wajib diisi.");
      return;
    }
    if (newPassword.length < 6) {
      showMessage("error", "Kata sandi baru minimal 6 karakter.");
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
      showMessage("success", "Kata sandi berhasil diperbarui!");
    } catch (e: unknown) {
      showMessage("error", e instanceof Error ? e.message : "Gagal mengganti kata sandi.");
    } finally {
      setSavingPassword(false);
    }
  }

  // 6. Toggle Notifikasi
  function toggleSound(val: boolean) {
    setSoundNotify(val);
    try {
      localStorage.setItem("vb-sound-notify", val ? "1" : "0");
    } catch {}
    showMessage("success", val ? "Suara notifikasi diaktifkan." : "Suara notifikasi dinonaktifkan.");
  }

  function toggleHaptic(val: boolean) {
    setHapticNotify(val);
    try {
      localStorage.setItem("vb-haptic-notify", val ? "1" : "0");
    } catch {}
    showMessage("success", val ? "Getar notifikasi diaktifkan." : "Getar notifikasi dinonaktifkan.");
  }

  // 7. Logout
  async function handleLogout() {
    if (!confirm("Apakah Anda yakin ingin keluar dari akun VetaBite?")) return;
    try {
      await api("/api/auth/logout", { method: "POST" });
    } catch {}
    r.push("/login");
  }

  if (loading) {
    return (
      <div className="p-4 pt-8">
        <SkeletonList n={4} />
      </div>
    );
  }

  if (err && !me) {
    return (
      <div className="p-4 pt-8">
        <ErrorState msg={err} onRetry={loadUser} />
      </div>
    );
  }

  return (
    <div className="flex flex-col pb-24 px-space-lg">
      {/* Top Header */}
      <header className="sticky top-0 z-40 -mx-space-lg px-space-lg pt-4 pb-3 bg-surface-glass-alt backdrop-blur-xl border-b border-border-specular shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            aria-label="Kembali"
            onClick={() => r.back()}
            className="w-10 h-10 rounded-full flex items-center justify-center liquid-glass active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-5 h-5 text-on-surface" />
          </button>
          <div>
            <h1 className="font-headline-md text-headline-md font-extrabold text-on-surface tracking-tight leading-tight">
              Profil &amp; Pengaturan
            </h1>
            <p className="font-label-micro text-label-micro text-text-muted">
              Mahasiswa UPN &quot;Veteran&quot; Jakarta
            </p>
          </div>
        </div>
        <div className="w-10 h-10 rounded-full liquid-glass flex items-center justify-center text-primary shadow-sm">
          <Settings className="w-5 h-5" />
        </div>
      </header>

      {/* Floating Status Feedback Toast */}
      {feedback && (
        <div
          className={`fixed top-16 left-1/2 -translate-x-1/2 z-50 max-w-[390px] w-[90%] p-3.5 rounded-2xl shadow-xl border flex items-center gap-2.5 modal-smooth-enter backdrop-blur-md ${
            feedback.type === "success"
              ? "bg-emerald-600/95 text-white border-emerald-400/40"
              : "bg-red-600/95 text-white border-red-400/40"
          }`}
        >
          {feedback.type === "success" ? (
            <Check className="w-5 h-5 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0" />
          )}
          <p className="text-xs font-bold leading-snug">{feedback.text}</p>
        </div>
      )}

      {/* Hidden File Input for Avatar */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleAvatarChange}
      />

      {/* Main Settings Sections */}
      <main className="space-y-4 pt-3">
        {/* SECTION 1: Identity & Avatar Card */}
        <section className="liquid-glass-card rounded-[24px] p-4 relative overflow-hidden shadow-sm border border-border-specular">
          <div className="flex items-center gap-4">
            {/* Avatar with Verified Badge */}
            <div className="relative shrink-0">
              <div className="w-20 h-20 rounded-full ring-2 ring-white/90 shadow-md overflow-hidden bg-surface-container">
                <img
                  src={avatarUrl}
                  alt={me?.full_name || "Avatar Mahasiswa"}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* UPNVJ Verified Badge */}
              <div
                className="absolute -bottom-1 -right-1 bg-gradient-to-tr from-[#00873E] to-[#1DB954] text-white p-1 rounded-full ring-2 ring-white shadow-sm flex items-center justify-center"
                title="Terverifikasi Civitas UPNVJ"
              >
                <BadgeCheck className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Bio & Change Photo Button */}
            <div className="flex-1 min-w-0">
              <h2 className="font-headline-sm text-headline-sm font-extrabold text-on-surface truncate">
                {me?.full_name || "Mahasiswa UPNVJ"}
              </h2>
              <p className="font-body-sm text-body-sm font-bold text-primary truncate mt-0.5">
                @{me?.username}
              </p>
              <p className="font-label-micro text-label-micro text-text-muted truncate mt-0.5">
                {me?.whatsapp || "Belum ada nomor WhatsApp"}
              </p>

              <button
                type="button"
                disabled={uploadingAvatar}
                onClick={() => fileInputRef.current?.click()}
                className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full liquid-glass-pill hover:bg-white text-on-surface border border-white/90 shadow-xs active:scale-95 transition-all text-xs font-bold disabled:opacity-50"
              >
                {uploadingAvatar ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                ) : (
                  <Camera className="w-3.5 h-3.5 text-primary" />
                )}
                <span>{uploadingAvatar ? "Mengunggah..." : "Ubah Foto Profil"}</span>
              </button>
            </div>
          </div>

          {/* Mini Status Strip */}
          <div className="mt-4 pt-3 border-t border-border-subtle grid grid-cols-2 gap-2 text-center">
            <div className="bg-surface-container-low/60 rounded-xl py-1.5 px-2 border border-white/50">
              <span className="font-label-micro text-label-micro uppercase tracking-wider text-text-muted block">
                Kampus Utama
              </span>
              <span className="font-label-md text-label-md font-bold text-on-surface">
                Pondok Labu &amp; Limo
              </span>
            </div>
            <div className="bg-surface-container-low/60 rounded-xl py-1.5 px-2 border border-white/50">
              <span className="font-label-micro text-label-micro uppercase tracking-wider text-text-muted block">
                Status Akun
              </span>
              <span className="font-label-md text-label-md text-success font-bold flex items-center justify-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-success" />
                Aktif Terverifikasi
              </span>
            </div>
          </div>
        </section>

        {/* SECTION 2: Edit Data Diri Form */}
        <section className="liquid-glass-card rounded-[24px] p-4 space-y-3.5 shadow-sm border border-border-specular">
          <div className="flex items-center gap-2 border-b border-border-subtle pb-2.5">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <User className="w-4 h-4" />
            </div>
            <h3 className="font-headline-sm text-headline-sm font-extrabold text-on-surface">
              Data Diri Civitas
            </h3>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-3">
            <div>
              <label className="font-label-sm text-label-sm text-text-muted font-bold block mb-1">
                Nama Lengkap
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Masukkan nama lengkap Anda"
                className="w-full rounded-xl liquid-glass-input px-3.5 py-2.5 font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 border border-border-specular"
              />
            </div>

            <div>
              <label className="font-label-sm text-label-sm text-text-muted font-bold block mb-1">
                Nomor WhatsApp (Untuk Notifikasi Pesanan)
              </label>
              <div className="relative flex items-center">
                <Phone className="w-4 h-4 text-text-muted absolute left-3.5 pointer-events-none" />
                <input
                  type="tel"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="Contoh: 081234567890"
                  className="w-full rounded-xl liquid-glass-input pl-10 pr-3.5 py-2.5 font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 border border-border-specular"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="w-full py-2.5 rounded-xl cta-gradient text-white font-label-md text-label-md font-bold shadow-sm active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {savingProfile && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{savingProfile ? "Menyimpan Perubahan..." : "Simpan Data Diri"}</span>
            </button>
          </form>
        </section>

        {/* SECTION 3: Preferensi Bahasa */}
        <section className="liquid-glass-card rounded-[24px] p-4 space-y-3 shadow-sm border border-border-specular">
          <div className="flex items-center gap-2 border-b border-border-subtle pb-2.5">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Globe className="w-4 h-4" />
            </div>
            <h3 className="font-headline-sm text-headline-sm font-extrabold text-on-surface">
              Bahasa Antarmuka
            </h3>
          </div>

          <div>
            <label className="block font-label-sm text-label-sm text-text-muted mb-2 font-bold">
              Pilih Bahasa Utama
            </label>
            <div className="p-1 rounded-full bg-surface-container-high/70 border border-border-specular grid grid-cols-2 gap-1">
              <button
                type="button"
                onClick={() => handleSelectLocale("id")}
                className={`py-2 rounded-full font-label-md text-label-md font-bold flex items-center justify-center gap-1.5 transition-all ${
                  locale === "id"
                    ? "cta-gradient text-white shadow-sm"
                    : "text-text-muted hover:text-on-surface"
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Bahasa Indonesia (ID)</span>
              </button>
              <button
                type="button"
                onClick={() => handleSelectLocale("en")}
                className={`py-2 rounded-full font-label-md text-label-md font-bold flex items-center justify-center gap-1.5 transition-all ${
                  locale === "en"
                    ? "cta-gradient text-white shadow-sm"
                    : "text-text-muted hover:text-on-surface"
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>English (EN)</span>
              </button>
            </div>
          </div>
        </section>

        {/* SECTION 5: Preferensi Notifikasi & Suara */}
        <section className="liquid-glass-card rounded-[24px] p-4 space-y-3.5 shadow-sm border border-border-specular">
          <div className="flex items-center gap-2 border-b border-border-subtle pb-2.5">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Bell className="w-4 h-4" />
            </div>
            <h3 className="font-headline-sm text-headline-sm font-extrabold text-on-surface">
              Notifikasi &amp; Suara
            </h3>
          </div>

          <div className="space-y-3">
            {/* Sound Notification Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Volume2 className="w-4 h-4 text-text-muted" />
                <div>
                  <p className="font-label-md text-label-md font-bold text-on-surface">
                    Lonceng Suara Pesanan
                  </p>
                  <p className="font-label-micro text-label-micro text-text-muted">
                    Berbunyi saat status antrean berubah ke Siap Ambil
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => toggleSound(!soundNotify)}
                className={`w-12 h-6 rounded-full transition-colors relative p-0.5 border ${
                  soundNotify ? "bg-primary border-primary" : "bg-surface-container-high border-border-subtle"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform shadow-xs ${
                    soundNotify ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Haptic / Vibration Toggle */}
            <div className="flex items-center justify-between pt-2 border-t border-border-subtle">
              <div className="flex items-center gap-2.5">
                <Bell className="w-4 h-4 text-text-muted" />
                <div>
                  <p className="font-label-md text-label-md font-bold text-on-surface">
                    Getaran Perangkat
                  </p>
                  <p className="font-label-micro text-label-micro text-text-muted">
                    Memberikan sensasi getar haptic saat notifikasi masuk
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => toggleHaptic(!hapticNotify)}
                className={`w-12 h-6 rounded-full transition-colors relative p-0.5 border ${
                  hapticNotify ? "bg-primary border-primary" : "bg-surface-container-high border-border-subtle"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform shadow-xs ${
                    hapticNotify ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        </section>

        {/* SECTION 6: Keamanan & Ganti Kata Sandi */}
        <section className="liquid-glass-card rounded-[24px] p-4 space-y-3.5 shadow-sm border border-border-specular">
          <div className="flex items-center gap-2 border-b border-border-subtle pb-2.5">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Lock className="w-4 h-4" />
            </div>
            <h3 className="font-headline-sm text-headline-sm font-extrabold text-on-surface">
              Keamanan Kata Sandi
            </h3>
          </div>

          <form onSubmit={handleSavePassword} className="space-y-3">
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="font-label-micro text-label-micro text-text-muted uppercase font-bold block mb-1">
                  Kata Sandi Lama
                </label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl liquid-glass-input px-3 py-2 font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 border border-border-specular"
                />
              </div>
              <div>
                <label className="font-label-micro text-label-micro text-text-muted uppercase font-bold block mb-1">
                  Kata Sandi Baru
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 6 karakter"
                  className="w-full rounded-xl liquid-glass-input px-3 py-2 font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 border border-border-specular"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={savingPassword}
              className="w-full py-2.5 rounded-full cta-gradient text-white font-headline-sm text-headline-sm font-extrabold shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-1"
            >
              {savingPassword && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{savingPassword ? "Memproses..." : "Perbarui Kata Sandi"}</span>
            </button>
          </form>
        </section>

        {/* SECTION 7: Logout / Keluar Akun */}
        <section className="liquid-glass-card rounded-[24px] p-3 shadow-sm border border-border-specular">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full py-2.5 rounded-full bg-danger/10 border border-danger/30 text-danger font-headline-sm text-headline-sm font-extrabold flex items-center justify-center gap-2 hover:bg-danger/20 active:scale-95 transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar dari Akun</span>
          </button>
        </section>
      </main>
    </div>
  );
}
