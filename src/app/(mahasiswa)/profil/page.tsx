"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Settings,
  Check,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { api } from "@/lib/api";
import { useLocale } from "@/components/shared/Providers";

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
    } catch {
      // Ignore
    }
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
    } catch {
      // Ignore network patch error
    }
  }

  // Toggle Notifikasi Suara
  function toggleSound(val: boolean) {
    setSoundNotify(val);
    try {
      localStorage.setItem("vb-sound-notify", val ? "1" : "0");
    } catch {
      // Ignore
    }
    showMessage("success", val ? "Suara notifikasi diaktifkan." : "Suara notifikasi dinonaktifkan.");
  }

  // Toggle Notifikasi Getar
  function toggleHaptic(val: boolean) {
    setHapticNotify(val);
    try {
      localStorage.setItem("vb-haptic-notify", val ? "1" : "0");
    } catch {
      // Ignore
    }
    showMessage("success", val ? "Getar notifikasi diaktifkan." : "Getar notifikasi dinonaktifkan.");
  }

  // Logout
  async function handleLogout() {
    if (!confirm("Apakah Anda yakin ingin keluar dari akun VetaBite?")) return;
    try {
      await api("/api/auth/logout", { method: "POST" });
    } catch {
      // Ignore
    }
    router.push("/login");
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-base">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-xs font-semibold text-text-muted">Memuat data profil mahasiswa...</p>
        </div>
      </div>
    );
  }

  if (err && !me) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background-base">
        <div className="glass-panel rounded-2xl p-6 text-center max-w-sm w-full space-y-3">
          <AlertCircle className="w-8 h-8 text-danger mx-auto" />
          <p className="text-xs font-bold text-on-surface">{err}</p>
          <button
            type="button"
            onClick={loadUser}
            className="px-4 py-2 rounded-full cta-gradient-btn text-white text-xs font-bold shadow-md"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  const studentName = me?.full_name || me?.username || "Yumeko Jabami";
  const studentNim = me?.username || "2110511042";
  const studentEmail = me?.email || (me?.username?.includes("@") ? me.username : `${me?.username || "yumeko"}@mahasiswa.upnvj.ac.id`);
  const avatarSrc = me?.avatar_url || DEFAULT_AVATAR;

  return (
    <div className="relative min-h-screen bg-background-base text-on-surface antialiased selection:bg-primary selection:text-on-primary">
      {/* Ambient Amber Glow Background Layers */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-24 -left-20 w-96 h-96 rounded-full bg-gradient-to-br from-[#FF8A00]/20 to-[#E03A00]/10 blur-3xl" />
        <div className="absolute top-1/3 -right-24 w-80 h-80 rounded-full bg-gradient-to-bl from-[#B82900]/15 to-[#FF8A00]/5 blur-3xl" />
        <div className="absolute bottom-20 left-10 w-72 h-72 rounded-full bg-gradient-to-tr from-[#FF6226]/15 to-transparent blur-3xl" />
      </div>

      {/* Floating Status Feedback Toast */}
      {feedback && (
        <div
          className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 max-w-[390px] w-[90%] p-3.5 rounded-2xl shadow-xl border flex items-center gap-2.5 backdrop-blur-md ${
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

      {/* Mobile Viewport Wrapper (390px - 430px) */}
      <div className="relative z-10 max-w-[430px] mx-auto min-h-screen flex flex-col px-margin pb-margin-dock pb-28">
        {/* Top Navigation Header */}
        <header className="pt-6 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              aria-label="Kembali ke Dashboard Mahasiswa"
              className="w-10 h-10 rounded-full flex items-center justify-center bg-white/70 backdrop-blur-md border-[1.5px] border-border-specular shadow-sm active:scale-95 transition-transform duration-150 text-on-surface cursor-pointer"
              type="button"
              onClick={() => router.back()}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" viewBox="0 0 24 24">
                <line x1="19" x2="5" y1="12" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
            </button>
            <div>
              <h1 className="text-headline-md font-headline-md text-on-surface tracking-tight leading-tight">
                Profil &amp; Pengaturan
              </h1>
              <p className="text-body-sm font-body-sm text-text-muted">
                Mahasiswa UPN &quot;Veteran&quot; Jakarta
              </p>
            </div>
          </div>
          <div className="w-9 h-9 rounded-full bg-white/60 backdrop-blur-sm border border-border-specular flex items-center justify-center text-primary shadow-xs">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </div>
        </header>

        <main className="space-y-4 pt-1">
          {/* Top Profile Glass Card */}
          <section className="glass-panel rounded-2xl p-4 relative overflow-hidden">
            <div className="flex items-center gap-4">
              {/* Avatar with Green Badge */}
              <div className="relative shrink-0">
                <div className="w-20 h-20 rounded-full ring-2 ring-white/90 shadow-md overflow-hidden bg-surface-container-high">
                  <img
                    className="w-full h-full object-cover"
                    alt={studentName}
                    src={avatarSrc}
                  />
                </div>
                <div className="absolute -bottom-1 -right-1 bg-gradient-to-tr from-[#00873E] to-[#1DB954] text-white p-1 rounded-full ring-2 ring-white shadow-sm flex items-center justify-center">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" viewBox="0 0 24 24">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
              </div>
              {/* Name, NIM, Verified Email & SSO Badge */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h2 className="text-headline-sm font-headline-sm text-on-surface truncate font-bold">
                    {studentName}
                  </h2>
                </div>
                <p className="text-body-sm text-text-muted truncate mt-0.5">
                  NIM: {studentNim} &bull; S1 Informatika
                </p>
                <p className="text-body-sm font-bold text-primary truncate mt-0.5">
                  {studentEmail}
                </p>
                <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-success/10 border border-success/20 text-success text-[10px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-success" />
                  <span>Akun Civitas Terverifikasi Google SSO</span>
                </div>
              </div>
            </div>
            {/* Two Sub-cards */}
            <div className="mt-4 pt-3 border-t border-border-subtle grid grid-cols-2 gap-2 text-center">
              <div className="bg-surface-container-low/60 rounded-xl py-1.5 px-2 border border-white/50">
                <span className="text-label-micro font-label-micro uppercase tracking-wider text-text-muted block">
                  KAMPUS UTAMA
                </span>
                <span className="text-label-md font-label-md text-on-surface font-semibold">
                  Pondok Labu &amp; Limo
                </span>
              </div>
              <div className="bg-surface-container-low/60 rounded-xl py-1.5 px-2 border border-white/50">
                <span className="text-label-micro font-label-micro uppercase tracking-wider text-text-muted block">
                  STATUS AKUN
                </span>
                <span className="text-label-md font-label-md text-success flex items-center justify-center gap-1 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-success" /> Aktif Terverifikasi
                </span>
              </div>
            </div>
          </section>

          {/* Section 2: Bahasa Antarmuka */}
          <section className="glass-panel rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2 border-b border-border-subtle pb-2.5">
              <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
              </div>
              <h3 className="text-headline-sm font-headline-sm text-on-surface font-bold">
                Bahasa Antarmuka
              </h3>
            </div>
            <div className="pt-1">
              <label className="block text-body-sm text-on-surface font-semibold mb-2">
                Pilih Bahasa Utama
              </label>
              <div className="p-1 rounded-full bg-surface-container-high/70 backdrop-blur-sm border border-border-specular grid grid-cols-2 gap-1">
                <button
                  type="button"
                  onClick={() => handleSelectLocale("id")}
                  className={`py-2 rounded-full text-label-md font-label-md flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    locale === "id"
                      ? "text-white bg-gradient-to-r from-[#FF8A00] to-[#E03A00] shadow-sm font-bold"
                      : "text-text-muted hover:text-on-surface"
                  }`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                  <span>Bahasa Indonesia (ID)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectLocale("en")}
                  className={`py-2 rounded-full text-label-md font-label-md flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    locale === "en"
                      ? "text-white bg-gradient-to-r from-[#FF8A00] to-[#E03A00] shadow-sm font-bold"
                      : "text-text-muted hover:text-on-surface"
                  }`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M5 8l6 6" />
                    <path d="M4 14l6-6 2-3" />
                    <path d="M2 5h12" />
                    <path d="M7 2h1" />
                    <path d="M22 22l-5-10-5 10" />
                    <path d="M14 18h6" />
                  </svg>
                  <span>English (EN)</span>
                </button>
              </div>
            </div>
          </section>

          {/* Section 3: Notifikasi & Suara */}
          <section className="glass-panel rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2 border-b border-border-subtle pb-2.5">
              <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              </div>
              <h3 className="text-headline-sm font-headline-sm text-on-surface font-bold">
                Notifikasi &amp; Suara
              </h3>
            </div>
            <div className="space-y-3 pt-1 divide-y divide-border-subtle">
              {/* Row 1: Lonceng Suara Pesanan */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-start gap-2.5 pr-2">
                  <div className="text-on-surface mt-0.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-body-sm font-bold text-on-surface leading-tight">
                      Lonceng Suara Pesanan
                    </p>
                    <p className="text-[10px] text-text-muted leading-tight mt-0.5">
                      Berbunyi saat status antrean berubah ke Siap Ambil
                    </p>
                  </div>
                </div>
                {/* Switch */}
                <button
                  type="button"
                  onClick={() => toggleSound(!soundNotify)}
                  className={`w-11 h-6 rounded-full p-0.5 flex items-center transition-all shrink-0 shadow-sm cursor-pointer ${
                    soundNotify
                      ? "bg-gradient-to-r from-[#FF6226] to-[#B82900] justify-end"
                      : "bg-surface-dim justify-start"
                  }`}
                >
                  <div className="w-5 h-5 bg-white rounded-full shadow-md" />
                </button>
              </div>

              {/* Row 2: Getaran Perangkat */}
              <div className="flex items-center justify-between pt-3">
                <div className="flex items-start gap-2.5 pr-2">
                  <div className="text-on-surface mt-0.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-body-sm font-bold text-on-surface leading-tight">
                      Getaran Perangkat
                    </p>
                    <p className="text-[10px] text-text-muted leading-tight mt-0.5">
                      Memberikan sensasi getar haptik saat notifikasi masuk
                    </p>
                  </div>
                </div>
                {/* Switch */}
                <button
                  type="button"
                  onClick={() => toggleHaptic(!hapticNotify)}
                  className={`w-11 h-6 rounded-full p-0.5 flex items-center transition-all shrink-0 shadow-sm cursor-pointer ${
                    hapticNotify
                      ? "bg-gradient-to-r from-[#FF6226] to-[#B82900] justify-end"
                      : "bg-surface-dim justify-start"
                  }`}
                >
                  <div className="w-5 h-5 bg-white rounded-full shadow-md" />
                </button>
              </div>
            </div>
          </section>

          {/* Section 5: Standalone Logout Button */}
          <div className="pt-1 pb-4">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full py-3 rounded-2xl bg-white/70 backdrop-blur-md border border-red-200/80 hover:bg-white text-secondary font-bold text-body-md flex items-center justify-center gap-2 shadow-sm active:scale-98 transition-all cursor-pointer"
            >
              <svg className="w-5 h-5 text-secondary" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span>Keluar dari Akun</span>
            </button>
          </div>
        </main>

        {/* Floating Help & Layanan Mahasiswa CS Button (without bottom navigation bar) */}
        <div className="fixed bottom-6 right-4 z-50 flex items-center justify-end pointer-events-auto">
          <button
            type="button"
            aria-label="Bantuan &amp; Layanan Mahasiswa CS"
            onClick={() => {
              window.open("https://wa.me/6281298441102?text=Halo%20Admin%20VetaBite%20UPNVJ%2C%20saya%20butuh%20bantuan.", "_blank");
            }}
            className="relative w-14 h-14 rounded-full cta-gradient-btn flex items-center justify-center text-white shadow-lg active:scale-95 transition-all duration-150 border-[1.5px] border-white/90 cursor-pointer"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" viewBox="0 0 24 24">
              <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
              <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
              <path d="M8 21v-1a4 4 0 0 1 4-4h.5" />
            </svg>
            <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-success rounded-full ring-2 ring-white shadow-xs" />
          </button>
        </div>
      </div>
    </div>
  );
}
