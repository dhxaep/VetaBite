"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Settings,
  Check,
  AlertCircle,
  Loader2,
  Phone,
  Volume2,
  Smartphone,
  LogOut,
  Bell,
  X,
} from "lucide-react";
import { api } from "@/lib/api";
import { resolveImageUrl } from "@/lib/image-url";

type UserData = {
  id: string;
  email?: string;
  username: string;
  full_name?: string;
  whatsapp?: string;
  avatar_url?: string;
  role?: string;
  status?: string;
};

const DEFAULT_AVATAR =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuD4a-OG4I7OmbGRDtoE53vyzOBudPCi_uwRxWy1cA-UQxQKt_Gdh0cCznm5VUn03vdkVzjm3OtdBfP_LrFozXnOEYB1uwsoCulIpcLiQT0Gqj3CFSYSssPibmVRMbybEoy5qnUxWH0r7sOxtOz5MkMKP5WlTGpiL1zxjsGC3seMXEa3k5MuQbmR6uqbXp58EczbS4vpwzs8zbMn9_sNhBxyDKTSCZEeesIuqjeZAhtu";

export default function ProfilePage() {
  const router = useRouter();

  const [me, setMe] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // Settings Modal State
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // WhatsApp form
  const [whatsappInput, setWhatsappInput] = useState("");
  const [savingWhatsapp, setSavingWhatsapp] = useState(false);

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
      if (data.whatsapp) {
        setWhatsappInput(data.whatsapp);
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

  // Simpan Nomor WhatsApp
  async function handleSaveWhatsapp(e: React.FormEvent) {
    e.preventDefault();
    if (!whatsappInput.trim()) {
      showMessage("error", "Nomor WhatsApp tidak boleh kosong.");
      return;
    }
    setSavingWhatsapp(true);
    try {
      await api("/api/me", {
        method: "PATCH",
        body: JSON.stringify({ whatsapp: whatsappInput.trim() }),
      });
      if (me) {
        setMe({ ...me, whatsapp: whatsappInput.trim() });
      }
      setShowSettingsModal(false);
      showMessage("success", "Nomor WhatsApp berhasil disimpan.");
    } catch (e: unknown) {
      showMessage("error", e instanceof Error ? e.message : "Gagal memperbarui nomor WhatsApp.");
    } finally {
      setSavingWhatsapp(false);
    }
  }

  // Toggle Notifikasi Suara
  function toggleSound(val: boolean) {
    setSoundNotify(val);
    try {
      localStorage.setItem("vb-sound-notify", val ? "1" : "0");
      if (val && typeof window !== "undefined") {
        const audio = new Audio("/sounds/pickup-ready.mp3");
        audio.volume = 0.6;
        audio.play().catch(() => {});
      }
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
      if (val && typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate([40, 60, 40]);
      }
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
            className="px-4 py-2 rounded-full cta-gradient-btn text-white text-xs font-bold shadow-md cursor-pointer"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  const studentName = me?.full_name || me?.username || "Mahasiswa UPNVJ";
  const studentNim = me?.username || "2110511042";
  const studentEmail =
    me?.email ||
    (me?.username?.includes("@") ? me.username : `${me?.username || "mahasiswa"}@mahasiswa.upnvj.ac.id`);
  const avatarSrc = resolveImageUrl(me?.avatar_url, DEFAULT_AVATAR);

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

      {/* Settings Modal (Triggered by Gear Icon) */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-sm rounded-[28px] liquid-glass p-5 shadow-2xl border border-white/60 space-y-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Settings className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-body-md font-bold text-on-surface leading-tight">
                    Pengaturan Kontak
                  </h3>
                  <p className="text-[10px] text-text-muted">
                    Nomor civitas untuk notifikasi kantin
                  </p>
                </div>
              </div>
              <button
                type="button"
                aria-label="Tutup Pengaturan"
                onClick={() => setShowSettingsModal(false)}
                className="w-8 h-8 rounded-full bg-surface-container-high/60 hover:bg-surface-container-high flex items-center justify-center text-text-muted hover:text-on-surface transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form WhatsApp */}
            <form onSubmit={handleSaveWhatsapp} className="space-y-3">
              <div className="space-y-1">
                <label className="block text-body-sm text-on-surface font-semibold">
                  Nomor WhatsApp Aktif
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-text-muted flex items-center pointer-events-none">
                    <Phone className="w-4 h-4" />
                  </span>
                  <input
                    type="tel"
                    placeholder="Contoh: 081234567890"
                    value={whatsappInput}
                    onChange={(e) => setWhatsappInput(e.target.value)}
                    className="w-full h-11 pl-9 pr-3.5 rounded-xl bg-white/80 border border-border-specular text-body-md font-body-md text-on-surface shadow-xs placeholder:text-text-muted focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  />
                </div>
                <p className="text-[10px] text-text-muted leading-tight mt-1">
                  Nomor ini digunakan penjual loket kantin untuk konfirmasi pesanan atau jika menu siap diambil.
                </p>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-surface-container-high hover:bg-surface-dim text-on-surface text-xs font-bold transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingWhatsapp}
                  className="flex-1 py-2.5 rounded-xl cta-gradient text-white text-xs font-bold shadow-sm hover:brightness-105 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {savingWhatsapp ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Simpan Kontak</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
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
              <ArrowLeft className="w-5 h-5" />
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
          <button
            type="button"
            aria-label="Buka Pengaturan Akun"
            onClick={() => setShowSettingsModal(true)}
            className="w-9 h-9 rounded-full bg-white/70 hover:bg-white backdrop-blur-sm border border-border-specular flex items-center justify-center text-primary shadow-xs active:scale-95 transition-all cursor-pointer"
          >
            <Settings className="w-5 h-5" />
          </button>
        </header>

        <main className="space-y-4 pt-1">
          {/* Top Profile Glass Card */}
          <section className="glass-panel rounded-2xl p-4 relative overflow-hidden">
            <div className="flex items-center gap-4">
              {/* Avatar with Green Verified Badge */}
              <div className="relative shrink-0">
                <div className="w-20 h-20 rounded-full ring-2 ring-white/90 shadow-md overflow-hidden bg-surface-container-high">
                  <img
                    className="w-full h-full object-cover"
                    alt={studentName}
                    loading="lazy"
                    src={avatarSrc}
                  />
                </div>
                <div className="absolute -bottom-1 -right-1 bg-gradient-to-tr from-[#00873E] to-[#1DB954] text-white p-1 rounded-full ring-2 ring-white shadow-sm flex items-center justify-center">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
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
                  NIM: {studentNim} &bull; Sivitas Akademika
                </p>
                <p className="text-body-sm font-bold text-primary truncate mt-0.5">
                  {studentEmail}
                </p>
                {me?.whatsapp && (
                  <p className="text-body-sm text-text-muted truncate mt-0.5 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-primary shrink-0" />
                    <span className="font-semibold text-on-surface">{me.whatsapp}</span>
                  </p>
                )}
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

          {/* Section: Notifikasi & Suara */}
          <section className="glass-panel rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2 border-b border-border-subtle pb-2.5">
              <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Bell className="w-4 h-4" />
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
                    <Volume2 className="w-4 h-4" />
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
                  aria-label="Toggle suara notifikasi"
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
                    <Smartphone className="w-4 h-4" />
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
                  aria-label="Toggle getar notifikasi"
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

              {/* Row 3: Tombol Uji Coba Banner Notifikasi HP */}
              <div className="pt-3">
                <button
                  type="button"
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent("vetabite:test-ready-banner"));
                    showMessage("success", "Banner notifikasi antrean berhasil diuji coba.");
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-primary/10 hover:bg-primary/15 border border-primary/25 text-primary text-xs font-extrabold flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
                >
                  <Bell className="w-4 h-4 text-primary" />
                  <span>Tes Banner Notifikasi HP Sekarang</span>
                </button>
              </div>
            </div>
          </section>

          {/* Standalone Logout Button */}
          <div className="pt-1 pb-4">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full py-3 rounded-2xl bg-white/70 backdrop-blur-md border border-red-200/80 hover:bg-white text-secondary font-bold text-body-md flex items-center justify-center gap-2 shadow-sm active:scale-98 transition-all cursor-pointer"
            >
              <LogOut className="w-5 h-5 text-secondary" />
              <span>Keluar dari Akun</span>
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
