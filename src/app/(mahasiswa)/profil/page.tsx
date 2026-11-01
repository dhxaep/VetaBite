"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Settings,
  BadgeCheck,
  Globe,
  LogOut,
  Bell,
  Volume2,
  Check,
  AlertCircle,
  ShieldCheck,
  Mail,
  GraduationCap,
  Sparkles,
} from "lucide-react";
import { api } from "@/lib/api";
import { useLocale } from "@/components/shared/Providers";
import { SkeletonList, ErrorState } from "@/components/shared/States";

type UserData = {
  id: string;
  email?: string;
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
  const router = useRouter();
  const { locale, setLocale } = useLocale();

  const [me, setMe] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // Toggles
  const [soundNotify, setSoundNotify] = useState(true);
  const [hapticNotify, setHapticNotify] = useState(true);

  // Status feedback toast
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function loadUser() {
    setLoading(true);
    setErr("");
    try {
      const data = await api<UserData>("/api/me");
      setMe(data);
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

  // Ganti Bahasa
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

  // Toggle Notifikasi Suara
  function toggleSound(val: boolean) {
    setSoundNotify(val);
    try {
      localStorage.setItem("vb-sound-notify", val ? "1" : "0");
    } catch {}
    showMessage("success", val ? "Suara notifikasi diaktifkan." : "Suara notifikasi dinonaktifkan.");
  }

  // Toggle Notifikasi Getar
  function toggleHaptic(val: boolean) {
    setHapticNotify(val);
    try {
      localStorage.setItem("vb-haptic-notify", val ? "1" : "0");
    } catch {}
    showMessage("success", val ? "Getar notifikasi diaktifkan." : "Getar notifikasi dinonaktifkan.");
  }

  // Logout
  async function handleLogout() {
    if (!confirm("Apakah Anda yakin ingin keluar dari akun VetaBite?")) return;
    try {
      await api("/api/auth/logout", { method: "POST" });
    } catch {}
    router.push("/login");
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

  const studentName = me?.full_name || "Mahasiswa UPNVJ";
  const studentEmail = me?.email || `${me?.username || "mahasiswa"}@mahasiswa.upnvj.ac.id`;
  const avatarSrc = me?.avatar_url || DEFAULT_AVATAR;

  return (
    <div className="flex flex-col pb-24 px-space-lg">
      {/* Top Header */}
      <header className="sticky top-0 z-40 -mx-space-lg px-space-lg pt-4 pb-3 bg-surface-glass-alt backdrop-blur-xl border-b border-border-specular shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            aria-label="Kembali"
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full flex items-center justify-center liquid-glass active:scale-95 transition-transform cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5 text-on-surface" />
          </button>
          <div>
            <h1 className="font-headline-md text-headline-md font-extrabold text-on-surface tracking-tight leading-tight">
              Profil Mahasiswa
            </h1>
            <p className="font-label-micro text-label-micro text-text-muted">
              Sivitas UPN &quot;Veteran&quot; Jakarta
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

      {/* Main Content Flow */}
      <main className="space-y-4 pt-3">
        {/* SECTION 1: Pure Profile Card (Read-Only: Nama & Email Mahasiswa) */}
        <section className="liquid-glass-card rounded-[26px] p-5 relative overflow-hidden shadow-sm border border-border-specular">
          {/* Subtle Ambient Radial Highlight */}
          <div className="pointer-events-none absolute -top-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-2xl" />

          <div className="flex items-center gap-4 relative z-10">
            {/* Student Avatar with Verified Badge */}
            <div className="relative shrink-0">
              <div className="w-20 h-20 rounded-full ring-3 ring-white shadow-md overflow-hidden bg-surface-container flex items-center justify-center">
                <img
                  src={avatarSrc}
                  alt={studentName}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* UPNVJ Verified Seal Badge */}
              <div
                className="absolute -bottom-1 -right-1 bg-gradient-to-tr from-[#00873E] to-[#1DB954] text-white p-1 rounded-full ring-2 ring-white shadow-sm flex items-center justify-center"
                title="Terverifikasi Civitas Akademika UPNVJ"
              >
                <BadgeCheck className="w-4 h-4" />
              </div>
            </div>

            {/* Pure Student Name & Email */}
            <div className="flex-1 min-w-0 space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                <GraduationCap className="w-3 h-3 text-primary" />
                <span className="text-[10px] font-extrabold text-primary uppercase tracking-wider">
                  MAHASISWA RESMI
                </span>
              </div>

              <h2 className="font-headline-md text-[17px] font-extrabold text-on-surface truncate leading-tight">
                {studentName}
              </h2>

              <div className="flex items-center gap-1.5 text-text-muted">
                <Mail className="w-3.5 h-3.5 text-primary shrink-0" />
                <p className="font-body-sm text-[12px] font-semibold text-on-surface/90 truncate">
                  {studentEmail}
                </p>
              </div>
            </div>
          </div>

          {/* Locked Identity Information Badge */}
          <div className="mt-4 pt-3.5 border-t border-border-subtle grid grid-cols-2 gap-2 text-center relative z-10">
            <div className="bg-surface-container-low/60 rounded-xl py-2 px-2.5 border border-white/60 text-left">
              <span className="font-label-micro text-[10px] uppercase tracking-wider text-text-muted block font-bold">
                Asal Kampus
              </span>
              <span className="font-label-md text-xs font-extrabold text-on-surface block truncate mt-0.5">
                UPN &quot;Veteran&quot; Jakarta
              </span>
            </div>
            <div className="bg-surface-container-low/60 rounded-xl py-2 px-2.5 border border-white/60 text-left">
              <span className="font-label-micro text-[10px] uppercase tracking-wider text-text-muted block font-bold">
                Status Autentikasi
              </span>
              <span className="font-label-md text-xs text-success font-extrabold flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-success animate-pulse shrink-0" />
                SSO Google Aktif
              </span>
            </div>
          </div>
        </section>

        {/* SECTION 2: SSO Protection Notice Card */}
        <section className="p-4 rounded-[22px] bg-white/70 border border-white/90 shadow-xs flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
            <ShieldCheck className="w-4 h-4" strokeWidth={2.2} />
          </div>
          <div className="flex flex-col space-y-0.5">
            <span className="font-label-md text-xs font-extrabold text-on-surface">
              Data Profil Terproteksi Single Sign-On
            </span>
            <p className="text-[11px] text-text-muted leading-relaxed">
              Nama lengkap dan email mahasiswa disinkronkan langsung dari Akun Google resmi UPN Veteran Jakarta. Kredensial tidak dapat diubah secara manual demi keamanan dan integritas transaksi di kantin.
            </p>
          </div>
        </section>

        {/* SECTION 3: Preferensi Bahasa Antarmuka */}
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
              Pilih Bahasa Utama Aplikasi
            </label>
            <div className="p-1 rounded-full bg-surface-container-high/70 border border-border-specular grid grid-cols-2 gap-1">
              <button
                type="button"
                onClick={() => handleSelectLocale("id")}
                className={`py-2 rounded-full font-label-md text-label-md font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
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
                className={`py-2 rounded-full font-label-md text-label-md font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
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

        {/* SECTION 4: Preferensi Notifikasi & Getaran */}
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
            {/* Lonceng Suara */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Volume2 className="w-4 h-4 text-text-muted" />
                <div>
                  <p className="font-label-md text-label-md font-bold text-on-surface">
                    Lonceng Suara Pesanan
                  </p>
                  <p className="font-label-micro text-label-micro text-text-muted">
                    Berbunyi otomatis saat pesanan siap diambil di loket
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => toggleSound(!soundNotify)}
                className={`w-12 h-6 rounded-full transition-colors relative p-0.5 border cursor-pointer ${
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

            {/* Getaran Haptic */}
            <div className="flex items-center justify-between pt-2 border-t border-border-subtle">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-text-muted" />
                <div>
                  <p className="font-label-md text-label-md font-bold text-on-surface">
                    Getaran Perangkat
                  </p>
                  <p className="font-label-micro text-label-micro text-text-muted">
                    Sensasi getar saat status pesanan diperbarui
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => toggleHaptic(!hapticNotify)}
                className={`w-12 h-6 rounded-full transition-colors relative p-0.5 border cursor-pointer ${
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

        {/* SECTION 5: Logout / Keluar Akun */}
        <section className="liquid-glass-card rounded-[24px] p-3 shadow-sm border border-border-specular">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full py-3 rounded-full bg-danger/10 border border-danger/30 text-danger font-headline-sm text-headline-sm font-extrabold flex items-center justify-center gap-2 hover:bg-danger/20 active:scale-95 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar dari Akun</span>
          </button>
        </section>
      </main>
    </div>
  );
}
