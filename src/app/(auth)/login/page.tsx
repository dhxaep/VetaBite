"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  User,
  Lock,
  Eye,
  EyeOff,
  ShoppingBag,
  Store,
  Check,
  ArrowRight,
  Loader2,
  AlertCircle,
  Clock,
  GraduationCap,
  CreditCard,
  MapPin,
  ChevronDown,
  CheckCircle2,
  X
} from "lucide-react";
import { api } from "@/lib/api";

type AuthMode = "login" | "register";
type AuthRole = "buyer" | "canteen";

interface DemoAccount {
  name: string;
  email: string;
  nim: string;
  faculty: string;
}

const DEFAULT_DEMO_ACCOUNTS: DemoAccount[] = [
  {
    name: "Dimas Arya Pratama",
    email: "2110511001@mahasiswa.upnvj.ac.id",
    nim: "2110511001",
    faculty: "Fakultas Ilmu Komputer",
  },
  {
    name: "Gheffira Nurul",
    email: "2110511045@mahasiswa.upnvj.ac.id",
    nim: "2110511045",
    faculty: "Fakultas Ilmu Komputer",
  },
  {
    name: "Salma Putri Anindya",
    email: "2210611023@mahasiswa.upnvj.ac.id",
    nim: "2210611023",
    faculty: "Fakultas Ekonomi dan Bisnis",
  },
  {
    name: "Rizky Fauzan",
    email: "2010411088@mahasiswa.upnvj.ac.id",
    nim: "2010411088",
    faculty: "Fakultas Ilmu Sosial dan Ilmu Politik",
  },
];

export default function LoginPage() {
  const router = useRouter();

  // Role: buyer (Mahasiswa via Google OAuth) or canteen (Ibu Kantin / Loket)
  const [role, setRole] = useState<AuthRole>("buyer");
  // Mode for canteen: login or register
  const [mode, setMode] = useState<AuthMode>("login");

  // Google Student OAuth States
  const [googleModalOpen, setGoogleModalOpen] = useState(false);
  const [customStudentEmail, setCustomStudentEmail] = useState("");
  const [customStudentName, setCustomStudentName] = useState("");
  const [studentRememberMe, setStudentRememberMe] = useState(true);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState("");
  const [oauthConfigured, setOauthConfigured] = useState<boolean | null>(null);

  // Canteen Login inputs
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [canteenRememberMe, setCanteenRememberMe] = useState(false);

  // Canteen Register inputs
  const [ownerName, setOwnerName] = useState("");
  const [canteenName, setCanteenName] = useState("");
  const [canteenContact, setCanteenContact] = useState("");
  const [canteenLocation, setCanteenLocation] = useState("kantin-soetomo");
  const [regPassword, setRegPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isBuyer = role === "buyer";

  // Check OAuth config and restore saved identifier from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("vb_remember_user");
      if (saved) {
        setIdentifier(saved);
        setCanteenRememberMe(true);
      }
    } catch {
      // Ignore if localStorage unavailable
    }

    // Check if Google OAuth Client ID & Secret are set
    fetch("/api/auth/google/config")
      .then((r) => r.json())
      .then((d) => setOauthConfigured(Boolean(d.configured)))
      .catch(() => setOauthConfigured(false));

    // Handle OAuth Callback errors from URL query params
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const errParam = params.get("error");
      if (errParam === "invalid_domain") {
        setError("Hanya akun resmi mahasiswa UPN Veteran Jakarta (@mahasiswa.upnvj.ac.id) yang dapat masuk.");
      } else if (errParam === "oauth_not_configured") {
        setError("Kunci Google OAuth (GOOGLE_CLIENT_ID & GOOGLE_CLIENT_SECRET) belum diatur di file .env.");
      } else if (errParam === "access_denied") {
        setError("Proses masuk Google dibatalkan oleh pengguna.");
      } else if (errParam === "account_suspended") {
        setError("Akun Anda berstatus non-aktif atau ditangguhkan.");
      } else if (errParam) {
        setError(`Gagal masuk via Google: ${errParam}`);
      }
    }
  }, []);

  function handleGooglePrimaryClick() {
    if (oauthConfigured) {
      // Directly launch real official Google OAuth SSO page
      window.location.href = "/api/auth/google/login";
    } else {
      // Show interactive modal with dev test accounts & instructions
      setGoogleModalOpen(true);
    }
  }

  // Handle Student Google OAuth (Auto Login / Auto Register)
  async function handleStudentGoogleAuth(emailToUse?: string, nameToUse?: string) {
    const targetEmail = (emailToUse || customStudentEmail).trim().toLowerCase();
    const targetName = (nameToUse || customStudentName).trim();
    setGoogleError("");

    if (!targetEmail) {
      setGoogleError("Email mahasiswa wajib diisi.");
      return;
    }

    if (!targetEmail.endsWith("@mahasiswa.upnvj.ac.id") && !targetEmail.endsWith("@upnvj.ac.id")) {
      setGoogleError("Hanya akun resmi sivitas UPN Veteran Jakarta (@mahasiswa.upnvj.ac.id / @upnvj.ac.id) yang dapat masuk.");
      return;
    }

    setGoogleLoading(true);
    try {
      const res = await api<{ redirectTo?: string; user?: unknown }>("/api/auth/google", {
        method: "POST",
        body: JSON.stringify({
          email: targetEmail,
          full_name: targetName || undefined,
          remember_me: studentRememberMe,
        }),
      });

      setGoogleModalOpen(false);
      router.push(res.redirectTo || "/dashboard");
    } catch (err: unknown) {
      setGoogleError(err instanceof Error ? err.message : "Gagal masuk via Google Akun Mahasiswa.");
    } finally {
      setGoogleLoading(false);
    }
  }

  // Handle Canteen Login
  async function handleCanteenLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (identifier.trim().length < 3) {
      setError("Username atau Kontak Loket minimal 3 karakter.");
      return;
    }
    if (password.length < 6) {
      setError("Kata sandi minimal 6 karakter.");
      return;
    }

    setLoading(true);
    try {
      try {
        if (canteenRememberMe) {
          localStorage.setItem("vb_remember_user", identifier.trim());
        } else {
          localStorage.removeItem("vb_remember_user");
        }
      } catch {
        // Ignore localStorage error
      }

      const res = await api<{ redirectTo?: string }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          username: identifier.trim(),
          password,
          remember_me: canteenRememberMe,
        }),
      });
      router.push(res.redirectTo || "/seller/pesanan");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal masuk ke akun loket.");
    } finally {
      setLoading(false);
    }
  }

  // Handle Canteen Register
  async function handleCanteenRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (regPassword.length < 8) {
      setError("Kata sandi minimal 8 karakter.");
      return;
    }

    if (regPassword !== confirmPassword) {
      setError("Konfirmasi kata sandi tidak cocok.");
      return;
    }

    if (!ownerName.trim() || !canteenName.trim() || !canteenContact.trim()) {
      setError("Nama pemilik, nama stan loket, dan kontak wajib diisi.");
      return;
    }

    const payloadUsername = canteenName
      .trim()
      .toLowerCase()
      .replace(/[^a-zA-Z0-9_]/g, "_")
      .slice(0, 18);
    const finalUsername = payloadUsername.length >= 3 ? payloadUsername : `loket_${Date.now().toString().slice(-6)}`;

    const locationMap: Record<string, string> = {
      "kantin-soetomo": "Kantin Gedung Dr. Soetomo (Pondok Labu)",
      "kantin-fik": "Kantin FIK (Pondok Labu)",
      "kantin-fisip": "Kantin FISIP (Pondok Labu)",
      "kantin-limo": "Kantin Kampus Limo",
    };
    const payloadCanteenDesc = locationMap[canteenLocation] || canteenLocation;

    setLoading(true);
    try {
      const res = await api<{ status: string }>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          full_name: ownerName.trim(),
          whatsapp: canteenContact.trim(),
          username: finalUsername,
          password: regPassword,
          role: "PENJUAL",
          canteen_name: canteenName.trim(),
          canteen_description: payloadCanteenDesc,
        }),
      });

      if (res.status === "PENDING") {
        router.push("/pending-verification");
      } else {
        setMode("login");
        setIdentifier(finalUsername);
        setError("");
        alert("Pendaftaran loket berhasil! Silakan menunggu verifikasi admin atau login.");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Pendaftaran stan loket gagal.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-[#F6EFEA] text-on-surface antialiased min-h-screen flex justify-center items-start selection:bg-primary-fixed selection:text-primary sm:py-6">
      {/* Fixed Mobile Canvas Envelope (Max 430px) */}
      <div className="relative w-full max-w-[430px] min-h-screen sm:min-h-[880px] sm:rounded-[46px] sm:border-[5px] sm:border-surface-glass-alt bg-background-base flex flex-col overflow-hidden pb-10 shadow-2xl">
        {/* Atmospheric Background Radial Lights */}
        <div className="pointer-events-none absolute top-0 left-0 right-0 h-96 ambient-glow-top z-0" />
        <div className="pointer-events-none absolute top-72 -left-20 w-64 h-64 bg-secondary-container/20 rounded-full blur-3xl z-0" />
        <div className="pointer-events-none absolute bottom-40 -right-20 w-64 h-64 bg-primary-fixed/40 rounded-full blur-3xl z-0" />

        {/* 1. iOS Status Bar */}
        <header className="relative z-10 w-full pt-3 px-6 flex justify-between items-center text-on-surface">
          <span className="font-headline-sm text-headline-sm tracking-tight font-extrabold">9:41</span>
          <div className="flex items-center space-x-2 text-on-surface">
            {/* Signal Indicator SVG */}
            <svg className="w-4 h-3.5 fill-current" viewBox="0 0 16 12">
              <rect height="4" rx="0.5" width="2.5" x="0" y="8" />
              <rect height="6.5" rx="0.5" width="2.5" x="4.5" y="5.5" />
              <rect height="9" rx="0.5" width="2.5" x="9" y="3" />
              <rect height="11.5" rx="0.5" width="2.5" x="13.5" y="0.5" />
            </svg>
            {/* Wifi SVG */}
            <svg className="w-4 h-3.5 fill-current" viewBox="0 0 16 12">
              <path
                d="M8 9.5C6.9 9.5 6 10.4 6 11.5S6.9 13.5 8 13.5 10 12.6 10 11.5 9.1 9.5 8 9.5ZM0.5 3.5C2.7 1.3 5.3 0 8 0C10.7 0 13.3 1.3 15.5 3.5L13.7 5.3C12.1 3.7 10.1 2.7 8 2.7C5.9 2.7 3.9 3.7 2.3 5.3L0.5 3.5ZM3.8 6.8C4.9 5.7 6.4 5.1 8 5.1C9.6 5.1 11.1 5.7 12.2 6.8L10.4 8.6C9.8 8 8.9 7.7 8 7.7C7.1 7.7 6.2 8 5.6 8.6L3.8 6.8Z"
                transform="translate(0 -0.5)"
              />
            </svg>
            {/* Battery SVG */}
            <svg className="w-6 h-3 fill-current" viewBox="0 0 24 12">
              <rect fill="none" height="10" rx="2.5" stroke="currentColor" strokeWidth="1.8" width="19" x="1" y="1" />
              <rect height="6" rx="1.5" width="13" x="3" y="3" />
              <path d="M22 4.5C22.6 4.5 23 5.1 23 6C23 6.9 22.6 7.5 22 7.5V4.5Z" />
            </svg>
          </div>
        </header>

        {/* Top Brand Header Container */}
        <div className="relative z-10 px-margin pt-3 pb-2 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Logo Orb */}
            <div className="relative w-11 h-11 rounded-full btn-tangy-gradient flex items-center justify-center p-0.5 shadow-lg overflow-hidden">
              <div className="absolute inset-0 rounded-full border border-white/60 pointer-events-none z-10" />
              <img
                src="/LOGO.jpeg"
                alt="Logo VetaBite"
                className="w-full h-full object-cover rounded-full select-none"
              />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <h1 className="font-headline-hero-mobile text-headline-hero-mobile text-on-surface tracking-tight leading-none">
                  Veta<span className="text-primary-container">Bite</span>
                </h1>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-label-micro font-label-micro bg-primary text-white font-extrabold uppercase tracking-wider">
                  UPNVJ
                </span>
              </div>
              <p className="font-label-sm text-label-sm text-text-muted uppercase tracking-wider mt-0.5">
                UPN VETERAN JAKARTA • PICK-UP KANTIN
              </p>
            </div>
          </div>
          {/* Campus Identity Seal */}
          <div className="w-9 h-9 rounded-full bg-white/70 border border-white/90 flex items-center justify-center shadow-sm">
            <svg className="w-5 h-5 text-secondary" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3zm0 2.18l6 2.25v4.66c0 4.1-2.6 7.9-6 9-3.4-1.1-6-4.9-6-9V6.43l6-2.25z" />
              <polygon points="12,7 13.5,10.5 17,11 14.5,13.5 15,17 12,15 9,17 9.5,13.5 7,11 10.5,10.5" />
            </svg>
          </div>
        </div>

        {/* Main Content Flow */}
        <main className="relative z-10 px-margin pt-2 flex flex-col space-y-4">
          {/* 2. Hero Welcome Card */}
          <section className="liquid-panel-dark rounded-[24px] p-5 text-white relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none opacity-20">
              <svg className="w-full h-full" fill="none" viewBox="0 0 390 140">
                <circle cx="340" cy="20" r="90" stroke="white" strokeDasharray="4 4" strokeWidth="1.2" />
                <path d="M-10 130 Q120 40 260 90 T420 20" stroke="white" strokeWidth="1" />
              </svg>
            </div>

            <div className="relative z-10 flex flex-col space-y-2">
              <div className="self-start inline-flex items-center space-x-1.5 bg-black/25 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
                {isBuyer ? (
                  <GraduationCap className="w-3.5 h-3.5 text-primary-fixed" strokeWidth={2} />
                ) : (
                  <Store className="w-3.5 h-3.5 text-primary-fixed" strokeWidth={2} />
                )}
                <span className="font-label-sm text-label-sm tracking-wider uppercase text-primary-fixed">
                  {isBuyer ? "SSO MAHASISWA UPNVJ" : "PORTAL MITRA KANTIN"}
                </span>
              </div>

              <h2 className="font-headline-lg text-headline-lg text-white font-extrabold tracking-tight pt-0.5">
                {isBuyer
                  ? "Satu Akun Google Mahasiswa."
                  : mode === "login"
                  ? "Masuk Akun Kantin."
                  : "Daftar Akun Loket Kantin."}
              </h2>

              <p className="font-body-sm text-body-sm text-white/85 leading-relaxed pr-2">
                {isBuyer
                  ? "Cukup 1 langkah dengan akun Google resmi (@mahasiswa.upnvj.ac.id). Otomatis login jika sudah terdaftar, atau otomatis buat akun baru seketika tanpa perlu registrasi terpisah!"
                  : mode === "login"
                  ? "Portal operasional loket kantin UPNVJ. Kelola pesanan mahasiswa secara real-time, perbarui stok menu harian, dan pantau omzet penjualan."
                  : "Daftarkan stan loket Anda di ekosistem VetaBite UPNVJ. Layani pesanan mahasiswa tanpa antrean tunai dan kembangkan usaha kuliner kampus."}
              </p>
            </div>
          </section>

          {/* 3. Main Auth Liquid Glass Card */}
          <section className="liquid-panel rounded-[26px] p-5 flex flex-col space-y-4">
            {/* If Canteen role, show Mode Switcher */}
            {!isBuyer && (
              <div className="p-1 bg-surface-dim/50 rounded-2xl flex items-center shadow-inner border border-white/60">
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className={`flex-1 py-2 rounded-xl text-label-md font-bold transition-all ${
                    mode === "login"
                      ? "shadow-sm bg-white text-on-surface"
                      : "text-text-muted hover:text-on-surface"
                  }`}
                >
                  Masuk (Login)
                </button>
                <button
                  type="button"
                  onClick={() => setMode("register")}
                  className={`flex-1 py-2 rounded-xl text-label-md font-bold transition-all ${
                    mode === "register"
                      ? "shadow-sm bg-white text-on-surface"
                      : "text-text-muted hover:text-on-surface"
                  }`}
                >
                  Daftar (Register)
                </button>
              </div>
            )}

            {/* Header Prompt */}
            <div className="flex flex-col items-center text-center space-y-1">
              <h3 className="font-headline-md text-headline-md text-on-surface font-extrabold tracking-tight">
                {isBuyer
                  ? "Masuk / Daftar Akun Mahasiswa"
                  : mode === "login"
                  ? "Login Akun Loket Kantin"
                  : "Registrasi Mitra / Ibu Kantin"}
              </h3>
              <p className="font-body-sm text-body-sm text-text-muted leading-relaxed px-1">
                {isBuyer
                  ? "Gunakan akun email kampus Google (@mahasiswa.upnvj.ac.id) untuk akses instan ke seluruh loket."
                  : mode === "login"
                  ? "Masuk untuk mengakses dashboard pesanan loket dan stok harian."
                  : "Lengkapi data stan loket untuk pengajuan izin operasional oleh Admin Utama."}
              </p>
            </div>

            {/* Error Message Box (from OAuth callback or canteen form) */}
            {error && (
              <div className="p-2.5 rounded-xl bg-danger/10 border border-danger/30 flex items-center gap-2 text-danger text-xs font-bold">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* === 1-CLICK UNIFIED OAUTH FOR MAHASISWA === */}
            {isBuyer ? (
              <div className="space-y-4">
                {/* Domain Restriction Badge */}
                <div className="p-3 rounded-2xl bg-primary-fixed/30 border border-primary/20 flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center shrink-0 shadow-xs">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-[12px] font-bold text-on-surface leading-tight">
                      Khusus Mahasiswa UPN Veteran Jakarta
                    </span>
                    <span className="text-[11px] font-semibold text-primary">
                      Wajib berakhiran @mahasiswa.upnvj.ac.id
                    </span>
                  </div>
                </div>

                {/* Primary Google OAuth Button */}
                <button
                  type="button"
                  onClick={handleGooglePrimaryClick}
                  className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-white/90 border-2 border-primary/30 shadow-md hover:shadow-lg flex items-center justify-center gap-3 transition-all active:scale-[0.98] group cursor-pointer"
                >
                  {/* Google SVG G Icon */}
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
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
                  <span className="font-headline-sm text-[14px] font-extrabold text-on-surface group-hover:text-primary transition-colors">
                    Masuk dengan Akun Google Mahasiswa
                  </span>
                </button>

                {/* Quick Student Fast-Login Chips */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">
                      AKUN DEMO MAHASISWA CEPAT
                    </span>
                    <span className="text-[10px] font-semibold text-primary bg-primary-fixed/50 px-2 py-0.5 rounded-full">
                      1-Klik Masuk
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {DEFAULT_DEMO_ACCOUNTS.map((acc) => (
                      <button
                        key={acc.email}
                        type="button"
                        onClick={() => handleStudentGoogleAuth(acc.email, acc.name)}
                        disabled={googleLoading}
                        className="w-full p-2.5 rounded-xl bg-white/70 hover:bg-white border border-white/90 text-left flex items-center justify-between transition-all hover:shadow-xs group cursor-pointer disabled:opacity-50"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                            {acc.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[12px] font-bold text-on-surface truncate group-hover:text-primary transition-colors">
                              {acc.name}
                            </p>
                            <p className="text-[11px] text-text-muted truncate">
                              {acc.email}
                            </p>
                          </div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-text-muted group-hover:text-primary shrink-0 transition-transform group-hover:translate-x-0.5" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Remember Me Checkbox for Student */}
                <div className="flex items-center justify-between px-1 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none group">
                    <div className="relative flex items-center justify-center">
                      <input
                        type="checkbox"
                        checked={studentRememberMe}
                        onChange={(e) => setStudentRememberMe(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-4 h-4 rounded-md border border-border-specular bg-white/90 peer-checked:bg-primary peer-checked:border-primary shadow-xs transition-all flex items-center justify-center group-hover:border-primary/60">
                        <Check className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity stroke-[3]" />
                      </div>
                    </div>
                    <span className="text-xs text-text-muted group-hover:text-on-surface font-semibold transition-colors">
                      Ingat Saya di Perangkat Ini
                    </span>
                  </label>
                  <span className="text-[10px] text-text-muted/70 font-semibold px-2 py-0.5 rounded-full bg-black/5">
                    30 Hari Sesi
                  </span>
                </div>
              </div>
            ) : (
              /* === CANTEEN LOGIN & REGISTER FORMS === */
              <form onSubmit={mode === "login" ? handleCanteenLogin : handleCanteenRegister} className="space-y-3.5">
                {mode === "login" ? (
                  <>
                    {/* Canteen Username / Kontak */}
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-on-surface uppercase tracking-wider px-1">
                        USERNAME LOKET / EMAIL / NO. HP
                      </label>
                      <div className="relative flex items-center">
                        <div className="absolute left-3.5 flex items-center pointer-events-none text-text-muted">
                          <User className="w-4 h-4" />
                        </div>
                        <input
                          className="w-full h-11 pl-10 pr-3.5 rounded-xl bg-white/80 border border-white/90 text-[13px] text-on-surface placeholder:text-text-muted/60 focus:outline-none focus:ring-2 focus:ring-primary shadow-sm transition-all"
                          placeholder="Contoh: loket01.burini atau 0812xxxx"
                          required
                          value={identifier}
                          onChange={(e) => setIdentifier(e.target.value)}
                          type="text"
                        />
                      </div>
                    </div>

                    {/* Canteen Password */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between px-1">
                        <label className="block text-[11px] font-bold text-on-surface uppercase tracking-wider">
                          KATA SANDI
                        </label>
                        <a
                          className="text-[11px] font-bold text-primary hover:underline"
                          href="https://wa.me/6281234567890?text=Halo%20Admin%20VetaBite,%20saya%20lupa%20kata%20sandi"
                          target="_blank"
                          rel="noreferrer"
                        >
                          Lupa Kata Sandi?
                        </a>
                      </div>
                      <div className="relative flex items-center">
                        <div className="absolute left-3.5 flex items-center pointer-events-none text-text-muted">
                          <Lock className="w-4 h-4" />
                        </div>
                        <input
                          className="w-full h-11 pl-10 pr-10 rounded-xl bg-white/80 border border-white/90 text-[13px] text-on-surface placeholder:text-text-muted/60 focus:outline-none focus:ring-2 focus:ring-primary shadow-sm transition-all"
                          placeholder="Masukkan kata sandi"
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          type={showPassword ? "text" : "password"}
                        />
                        <button
                          className="absolute right-3 text-text-muted hover:text-on-surface focus:outline-none p-1"
                          onClick={() => setShowPassword((prev) => !prev)}
                          type="button"
                          aria-label="Tampilkan sandi"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Remember Me Checkbox */}
                    <div className="flex items-center justify-between px-1 pt-0.5 pb-1">
                      <label className="flex items-center gap-2 cursor-pointer select-none group">
                        <div className="relative flex items-center justify-center">
                          <input
                            type="checkbox"
                            checked={canteenRememberMe}
                            onChange={(e) => setCanteenRememberMe(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-4 h-4 rounded-md border border-border-specular bg-white/90 peer-checked:bg-primary peer-checked:border-primary shadow-xs transition-all flex items-center justify-center group-hover:border-primary/60">
                            <Check className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity stroke-[3]" />
                          </div>
                        </div>
                        <span className="text-xs text-text-muted group-hover:text-on-surface font-semibold transition-colors">
                          Ingat Saya (Remember Me)
                        </span>
                      </label>
                      <span className="text-[10px] text-text-muted/70 font-semibold px-2 py-0.5 rounded-full bg-black/5">
                        30 Hari Sesi
                      </span>
                    </div>

                    {/* Submit Canteen Login */}
                    <div className="pt-1">
                      <button
                        disabled={loading}
                        className="btn-tangy-gradient w-full h-12 rounded-full flex items-center justify-center space-x-2 text-white font-headline-sm text-headline-sm font-extrabold tracking-tight active:scale-[0.98] transition-all shadow-lg group disabled:opacity-60 cursor-pointer"
                        type="submit"
                      >
                        {loading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <span>Masuk ke Dashboard Loket</span>
                        )}
                        {!loading && (
                          <ArrowRight className="w-4 h-4 text-white transition-transform group-hover:translate-x-0.5" strokeWidth={2.5} />
                        )}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Canteen Register Form */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-label-sm font-label-sm text-text-muted tracking-wider uppercase flex items-center justify-between">
                        <span>NAMA PEMILIK / PENANGGUNG JAWAB</span>
                        <span className="text-primary font-bold">*Wajib</span>
                      </label>
                      <div className="relative flex items-center">
                        <span className="absolute left-3.5 text-text-muted flex items-center pointer-events-none">
                          <User className="w-4 h-4" />
                        </span>
                        <input
                          className="w-full h-11 pl-10 pr-4 rounded-xl bg-white/70 border border-white focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary text-body-md font-body-md text-on-surface placeholder:text-text-muted/60 shadow-sm transition-all"
                          placeholder="Contoh: Ibu Rini Wulandari"
                          required
                          value={ownerName}
                          onChange={(e) => setOwnerName(e.target.value)}
                          type="text"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-label-sm font-label-sm text-text-muted tracking-wider uppercase flex items-center justify-between">
                        <span>NAMA STAN / LOKET KANTIN</span>
                        <span className="text-primary font-bold">*Loket</span>
                      </label>
                      <div className="relative flex items-center">
                        <span className="absolute left-3.5 text-text-muted flex items-center pointer-events-none">
                          <Store className="w-4 h-4" />
                        </span>
                        <input
                          className="w-full h-11 pl-10 pr-4 rounded-xl bg-white/70 border border-white focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary text-body-md font-body-md text-on-surface placeholder:text-text-muted/60 shadow-sm transition-all"
                          placeholder="Contoh: Ayam Geprek & Penyet Bu Rini (Loket #01)"
                          required
                          value={canteenName}
                          onChange={(e) => setCanteenName(e.target.value)}
                          type="text"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-label-sm font-label-sm text-text-muted tracking-wider uppercase flex items-center justify-between">
                        <span>NO. WHATSAPP AKTIF / EMAIL LOKET</span>
                        <span className="text-primary font-bold">*Kontak</span>
                      </label>
                      <div className="relative flex items-center">
                        <span className="absolute left-3.5 text-text-muted flex items-center pointer-events-none">
                          <CreditCard className="w-4 h-4" />
                        </span>
                        <input
                          className="w-full h-11 pl-10 pr-4 rounded-xl bg-white/70 border border-white focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary text-body-md font-body-md text-on-surface placeholder:text-text-muted/60 shadow-sm transition-all"
                          placeholder="Contoh: 081234567890 atau loket01@upnvj.ac.id"
                          required
                          value={canteenContact}
                          onChange={(e) => setCanteenContact(e.target.value)}
                          type="text"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-label-sm font-label-sm text-text-muted tracking-wider uppercase flex items-center justify-between">
                        <span>LOKASI KANTIN KAMPUS</span>
                        <span className="text-primary font-bold">*Pilih Area</span>
                      </label>
                      <div className="relative flex items-center">
                        <span className="absolute left-3.5 text-text-muted flex items-center pointer-events-none">
                          <MapPin className="w-4 h-4" />
                        </span>
                        <select
                          className="w-full h-11 pl-10 pr-9 rounded-xl bg-white/70 border border-white focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary text-body-md font-body-md text-on-surface shadow-sm transition-all appearance-none cursor-pointer"
                          value={canteenLocation}
                          onChange={(e) => setCanteenLocation(e.target.value)}
                        >
                          <option value="kantin-soetomo">Kantin Gedung Dr. Soetomo (Pondok Labu)</option>
                          <option value="kantin-fik">Kantin FIK (Pondok Labu)</option>
                          <option value="kantin-fisip">Kantin FISIP (Pondok Labu)</option>
                          <option value="kantin-limo">Kantin Kampus Limo</option>
                        </select>
                        <span className="absolute right-3.5 text-text-muted flex items-center pointer-events-none">
                          <ChevronDown className="w-4 h-4" />
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-label-sm font-label-sm text-text-muted tracking-wider uppercase flex items-center justify-between">
                        <span>KATA SANDI BARU</span>
                        <span className="text-text-muted">Min. 8 Karakter</span>
                      </label>
                      <div className="relative flex items-center">
                        <span className="absolute left-3.5 text-text-muted flex items-center pointer-events-none">
                          <Lock className="w-4 h-4" />
                        </span>
                        <input
                          className="w-full h-11 pl-10 pr-11 rounded-xl bg-white/70 border border-white focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary text-body-md font-body-md text-on-surface placeholder:text-text-muted/60 shadow-sm transition-all"
                          placeholder="Minimal 8 karakter"
                          required
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          type={showRegPassword ? "text" : "password"}
                        />
                        <button
                          aria-label="Tampilkan sandi"
                          className="absolute right-3 text-text-muted hover:text-on-surface p-1 transition-colors"
                          onClick={() => setShowRegPassword((prev) => !prev)}
                          type="button"
                        >
                          {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-label-sm font-label-sm text-text-muted tracking-wider uppercase">
                        KONFIRMASI KATA SANDI
                      </label>
                      <div className="relative flex items-center">
                        <span className="absolute left-3.5 text-text-muted flex items-center pointer-events-none">
                          <Lock className="w-4 h-4" />
                        </span>
                        <input
                          className="w-full h-11 pl-10 pr-4 rounded-xl bg-white/70 border border-white focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary text-body-md font-body-md text-on-surface placeholder:text-text-muted/60 shadow-sm transition-all"
                          placeholder="Ulangi kata sandi"
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          type={showRegPassword ? "text" : "password"}
                        />
                      </div>
                    </div>

                    <button
                      disabled={loading}
                      className="w-full h-12 mt-2 rounded-full primary-cta-gradient text-white text-body-lg font-body-lg font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg active:scale-[0.98] disabled:opacity-60"
                      type="submit"
                    >
                      {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <span>Daftar &amp; Ajukan Loket</span>
                          <span className="text-lg leading-none">→</span>
                        </>
                      )}
                    </button>
                  </>
                )}
              </form>
            )}

            {/* Role Selection Section: 2-Column Side-by-Side Grid Layout */}
            <div className="space-y-2 pt-1 border-t border-white/60">
              <div className="flex items-center justify-between px-1">
                <span className="font-label-sm text-label-sm text-text-muted uppercase tracking-wider font-extrabold">
                  PILIH PERAN AKUN
                </span>
                <span className="text-[10px] font-bold text-primary bg-primary-fixed/60 px-2 py-0.5 rounded-full">
                  {isBuyer ? "Civitas Mahasiswa (OAuth)" : "Mitra Kantin"}
                </span>
              </div>

              <div className="flex flex-row space-x-2.5">
                {/* Option 1: Pembeli / Mahasiswa */}
                <div
                  className={`liquid-card-role ${
                    isBuyer ? "is-active" : "opacity-80 hover:opacity-100"
                  } rounded-2xl p-3 cursor-pointer relative overflow-hidden flex flex-col flex-1 min-w-0 transition-all`}
                  onClick={() => setRole("buyer")}
                >
                  <div className="flex items-center justify-between w-full mb-2">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                        isBuyer ? "bg-primary text-white" : "bg-surface-container-high text-on-surface-variant"
                      }`}
                    >
                      <ShoppingBag className="w-4 h-4" strokeWidth={2.2} />
                    </div>
                    {isBuyer ? (
                      <span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3" strokeWidth={3} />
                      </span>
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-outline-variant" />
                    )}
                  </div>
                  <h4 className="font-headline-sm text-[13px] leading-snug text-on-surface font-extrabold tracking-tight mb-1">
                    Mahasiswa UPNVJ
                  </h4>
                  <p className="text-[11px] font-body-sm text-text-muted leading-snug">
                    1-Klik login/daftar dengan Google @mahasiswa.upnvj.ac.id
                  </p>
                </div>

                {/* Option 2: Pemilik / Ibu Kantin */}
                <div
                  className={`liquid-card-role ${
                    !isBuyer ? "is-active" : "opacity-80 hover:opacity-100"
                  } rounded-2xl p-3 cursor-pointer relative overflow-hidden flex flex-col flex-1 min-w-0 transition-all`}
                  onClick={() => setRole("canteen")}
                >
                  <div className="flex items-center justify-between w-full mb-2">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                        !isBuyer ? "bg-primary text-white" : "bg-surface-container-high text-on-surface-variant"
                      }`}
                    >
                      <Store className="w-4 h-4" strokeWidth={2.2} />
                    </div>
                    {!isBuyer ? (
                      <span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3" strokeWidth={3} />
                      </span>
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-outline-variant" />
                    )}
                  </div>
                  <h4 className="font-headline-sm text-[13px] leading-snug text-on-surface font-extrabold tracking-tight mb-1">
                    Mitra / Ibu Kantin
                  </h4>
                  <p className="text-[11px] font-body-sm text-text-muted leading-snug">
                    Kelola stan loket, stok harian, &amp; pesanan mahasiswa.
                  </p>
                </div>
              </div>
            </div>

            {/* Informational Banner */}
            {isBuyer ? (
              <div className="p-3 rounded-2xl bg-white/75 border border-white/90 flex items-start space-x-2.5 shadow-sm">
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-success flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2.5} />
                </div>
                <div className="flex flex-col space-y-0.5">
                  <span className="font-label-sm text-label-sm text-on-surface font-extrabold tracking-tight">
                    Autentikasi Otomatis Mahasiswa
                  </span>
                  <p className="text-[11px] text-text-muted leading-snug">
                    Tidak perlu kata sandi terpisah. Data profil otomatis tersinkronisasi langsung dari Akun Google Mahasiswa UPNVJ.
                  </p>
                </div>
              </div>
            ) : mode === "login" ? (
              <div className="p-3 rounded-2xl bg-white/75 border border-white/90 flex items-start space-x-2.5 shadow-sm">
                <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Clock className="w-3.5 h-3.5" strokeWidth={2.5} />
                </div>
                <div className="flex flex-col space-y-0.5">
                  <span className="font-label-sm text-label-sm text-on-surface font-extrabold tracking-tight">
                    Verifikasi Admin 1x24 Jam
                  </span>
                  <p className="text-[11px] text-text-muted leading-snug">
                    Akun penjual diverifikasi sebelum stan tayang. Belum punya akun?{" "}
                    <button
                      type="button"
                      onClick={() => setMode("register")}
                      className="font-bold underline text-primary cursor-pointer"
                    >
                      Daftar stan loket
                    </button>
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl p-3.5 bg-white/80 border border-white flex items-start gap-3 shadow-xs">
                <div className="w-6 h-6 rounded-full bg-[#FF8A00]/15 text-[#FF8A00] flex items-center justify-center shrink-0 mt-0.5">
                  <Clock className="w-3.5 h-3.5" strokeWidth={2.5} />
                </div>
                <div className="flex flex-col">
                  <span className="text-label-md font-label-md text-on-surface font-extrabold">
                    Menunggu Verifikasi Admin (1x24 Jam)
                  </span>
                  <span className="text-body-sm font-body-sm text-text-muted leading-tight mt-0.5">
                    Akun loket Anda akan ditinjau oleh Admin Utama UPNVJ sebelum stan dan menu dapat tayang di portal.
                  </span>
                </div>
              </div>
            )}
          </section>

          {/* Quick Canteen Status Pill Ticker */}
          <div className="flex items-center justify-between px-2 pt-1 pb-1">
            <div className="flex items-center space-x-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              <span className="font-label-sm text-label-sm text-on-surface font-bold">
                18 Loket Buka di Kampus Pondok Labu &amp; Limo
              </span>
            </div>
            <Link
              href="/"
              className="font-label-sm text-label-sm text-primary font-bold cursor-pointer hover:underline"
            >
              Cek Lokasi
            </Link>
          </div>
        </main>

        {/* Version & System Copyright Footer */}
        <footer className="mt-auto px-margin pt-3 pb-6 flex flex-col items-center justify-center text-center space-y-1">
          <div className="flex items-center space-x-2 text-text-muted">
            <ShieldCheck className="w-3.5 h-3.5 text-success" strokeWidth={2} />
            <span className="font-label-sm text-label-sm">Autentikasi Aman &amp; Terenkripsi</span>
          </div>
          <p className="font-label-micro text-label-micro text-text-muted">
            VetaBite UPN &quot;Veteran&quot; Jakarta v2.5 • Portal Layanan Kantin Terintegrasi
          </p>
          <p className="font-label-micro text-label-micro text-text-muted/60">
            Biro Kemahasiswaan &amp; Kerjasama UPNVJ © 2024
          </p>
        </footer>
      </div>

      {/* === MODAL: GOOGLE OAUTH SSO SELECTOR FOR MAHASISWA === */}
      {googleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-[28px] bg-white text-on-surface shadow-2xl border border-white/80 overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-5 pb-3 border-b border-surface-container flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {/* Google Icon */}
                <svg className="w-6 h-6 shrink-0" viewBox="0 0 24 24">
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
                <div>
                  <h4 className="text-sm font-extrabold text-on-surface">Masuk dengan Google</h4>
                  <p className="text-[11px] text-text-muted">Single Sign-On UPN Veteran Jakarta</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setGoogleModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-black/5 flex items-center justify-center text-text-muted hover:text-on-surface transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4">
              {googleError && (
                <div className="p-2.5 rounded-xl bg-danger/10 border border-danger/30 flex items-start gap-2 text-danger text-xs font-semibold">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{googleError}</span>
                </div>
              )}

              {/* Real Google OAuth Redirect Info Box */}
              <div className="p-3 rounded-2xl bg-surface-container/60 border border-border-specular flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-on-surface">OAuth Asli Google</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      oauthConfigured ? "bg-emerald-100 text-success" : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {oauthConfigured ? "Terkonfigurasi Aktif" : "Menunggu Kunci .env"}
                  </span>
                </div>
                <p className="text-[11px] text-text-muted leading-tight">
                  {oauthConfigured
                    ? "Kunci Google OAuth terhubung. Anda dapat langsung membuka akun resmi Google."
                    : "Untuk mengalihkan langsung ke accounts.google.com resmi, pasang GOOGLE_CLIENT_ID di .env."}
                </p>
                <a
                  href="/api/auth/google/login"
                  className="w-full py-2 px-3 rounded-xl bg-white border border-border-specular hover:border-primary text-xs font-bold text-center text-on-surface hover:text-primary transition-all flex items-center justify-center gap-2"
                >
                  <span>Buka Halaman Resmi accounts.google.com</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Account list */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">
                  Pilih Akun Mahasiswa
                </span>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {DEFAULT_DEMO_ACCOUNTS.map((acc) => (
                    <button
                      key={acc.email}
                      type="button"
                      disabled={googleLoading}
                      onClick={() => handleStudentGoogleAuth(acc.email, acc.name)}
                      className="w-full p-2.5 rounded-xl border border-border-specular/80 hover:border-primary hover:bg-primary-fixed/20 flex items-center gap-3 transition-all text-left group cursor-pointer disabled:opacity-50"
                    >
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                        {acc.name.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-on-surface truncate group-hover:text-primary">
                          {acc.name}
                        </p>
                        <p className="text-[11px] text-text-muted truncate">
                          {acc.email}
                        </p>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-text-muted group-hover:text-primary shrink-0 transition-transform group-hover:translate-x-0.5" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Email Form */}
              <div className="pt-2 border-t border-surface-container space-y-2.5">
                <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider block">
                  Atau Ketik Email Mahasiswa
                </span>

                <div className="space-y-1.5">
                  <input
                    type="text"
                    value={customStudentName}
                    onChange={(e) => setCustomStudentName(e.target.value)}
                    placeholder="Nama lengkap mahasiswa (opsional)"
                    className="w-full h-10 px-3 rounded-xl bg-surface-dim/60 border border-border-specular text-xs text-on-surface placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-primary"
                  />

                  <div className="relative">
                    <input
                      type="email"
                      value={customStudentEmail}
                      onChange={(e) => setCustomStudentEmail(e.target.value)}
                      placeholder="nim@mahasiswa.upnvj.ac.id"
                      className="w-full h-10 pl-3 pr-3 rounded-xl bg-surface-dim/60 border border-border-specular text-xs text-on-surface placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  disabled={googleLoading || !customStudentEmail.trim()}
                  onClick={() => handleStudentGoogleAuth()}
                  className="w-full h-10 rounded-xl btn-tangy-gradient text-white text-xs font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  {googleLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Lanjutkan dengan Akun Ini</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>

              {/* Domain Notice Footer */}
              <p className="text-[10px] text-text-muted text-center pt-1 leading-relaxed">
                Hanya akun dengan domain <strong>@mahasiswa.upnvj.ac.id</strong> yang dapat diotentikasi. Akun Google eksternal akan otomatis ditolak.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
