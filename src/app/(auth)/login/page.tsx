"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  Check,
  ArrowRight,
  AlertCircle,
  X,
  Loader2,
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
  const [canteenRememberMe, setCanteenRememberMe] = useState(true);

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

  useEffect(() => {
    try {
      const saved = localStorage.getItem("vb_remember_user");
      if (saved) {
        setIdentifier(saved);
        setCanteenRememberMe(true);
      }
    } catch {
      // Ignore
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
        setError("Hanya akun resmi mahasiswa UPN Veteran Jakarta (@mahasiswa.upnvj.ac.id / @upnvj.ac.id) yang dapat masuk.");
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
      window.location.href = "/api/auth/google/login";
    } else {
      setGoogleModalOpen(true);
    }
  }

  // Handle Student Google OAuth
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
      const res = await api<{ redirectTo?: string }>("/api/auth/google", {
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
        // Ignore
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
            <div className="relative w-11 h-11 rounded-full btn-tangy-gradient flex items-center justify-center p-2 shadow-lg">
              <div className="absolute inset-0 rounded-full border border-white/60 pointer-events-none" />
              {/* Cutlery & Flame Monogram SVG */}
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" viewBox="0 0 24 24">
                <path d="M12 2C8.5 6 7 9 7 13a5 5 0 0 0 10 0c0-2-0.5-3.5-2-5.5" />
                <path d="M12 18v-4" />
                <path d="M10 14h4" />
                <path d="M12 7v2" />
              </svg>
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <h1 className="font-headline-hero-mobile text-headline-hero-mobile text-on-surface tracking-tight leading-none">
                  Veta<span className="text-primary-container">Bite</span>
                </h1>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-label-micro font-label-micro bg-primary-fixed text-primary font-extrabold uppercase">
                  UPNVJ
                </span>
              </div>
              <p className="font-label-sm text-label-sm text-text-muted uppercase tracking-wider mt-0.5">
                UPN VETERAN JAKARTA • PICK-UP KANTIN
              </p>
            </div>
          </div>
          {/* Campus Identity Seal / Flag Symbol Vector */}
          <div className="w-9 h-9 rounded-full bg-white/70 border border-white/90 flex items-center justify-center shadow-sm">
            <svg className="w-5 h-5 text-secondary" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3zm0 2.18l6 2.25v4.66c0 4.1-2.6 7.9-6 9-3.4-1.1-6-4.9-6-9V6.43l6-2.25z" />
              <polygon points="12,7 13.5,10.5 17,11 14.5,13.5 15,17 12,15 9,17 9.5,13.5 7,11 10.5,10.5" />
            </svg>
          </div>
        </div>

        {/* Main Content Flow */}
        <main className="relative z-10 px-margin pt-2 flex flex-col space-y-4">
          {/* 2. Hero Welcome Card (Deep Chili Crimson Ambient Card) */}
          <section className="liquid-panel-dark rounded-[24px] p-5 text-white relative overflow-hidden">
            {/* Background Subtle Geometry Lines */}
            <div className="absolute inset-0 pointer-events-none opacity-20">
              <svg className="w-full h-full" fill="none" viewBox="0 0 390 140">
                <circle cx="340" cy="20" r="90" stroke="white" strokeDasharray="4 4" strokeWidth="1.2" />
                <path d="M-10 130 Q120 40 260 90 T420 20" stroke="white" strokeWidth="1" />
              </svg>
            </div>
            <div className="relative z-10 flex flex-col space-y-2">
              {/* Top Pill Badge */}
              <div className="self-start inline-flex items-center space-x-1.5 bg-black/25 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
                {isBuyer ? (
                  <>
                    <svg className="w-3.5 h-3.5 text-primary-fixed" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" />
                    </svg>
                    <span className="font-label-sm text-label-sm tracking-wider uppercase text-primary-fixed">
                      PORTAL BELA NEGARA
                    </span>
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5 text-primary-fixed" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                      <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                    <span className="font-label-sm text-label-sm tracking-wider uppercase text-primary-fixed">
                      PORTAL MITRA KANTIN
                    </span>
                  </>
                )}
              </div>

              {/* Bold Hero Headline */}
              <h2 className="font-headline-lg text-headline-lg text-white font-extrabold tracking-tight pt-0.5">
                {isBuyer
                  ? "Masuk ke VetaBite."
                  : mode === "login"
                  ? "Masuk Akun Kantin."
                  : "Daftar Akun Loket Kantin."}
              </h2>

              {/* Descriptive Campus Subtitle */}
              <p className="font-body-sm text-body-sm text-white/85 leading-relaxed pr-2">
                {isBuyer
                  ? "Pesan kuliner kantin favoritmu tanpa antre. Terbuka untuk seluruh mahasiswa, dosen, staf, hingga pengunjung umum di Kantin FISIP, FIK, FH, dan Gedung Dr. Soetomo."
                  : mode === "login"
                  ? "Portal operasional loket kantin UPNVJ. Kelola pesanan mahasiswa secara real-time, perbarui stok menu harian, dan pantau omzet penjualan."
                  : "Daftarkan stan loket Anda di ekosistem VetaBite UPNVJ. Layani pesanan mahasiswa tanpa antrean tunai dan kembangkan usaha kuliner kampus."}
              </p>
            </div>
          </section>

          {/* 3. Main Auth Liquid Glass Card */}
          <section className="liquid-panel rounded-[26px] p-5 flex flex-col space-y-4">
            {/* If Canteen, Mode Segmented Control Switcher */}
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

            {/* If Buyer, show Mode Segmented Control Switcher info badge */}
            {isBuyer && (
              <div className="p-3 rounded-2xl bg-white/70 border border-white/90 flex items-center justify-between shadow-xs">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-xl bg-primary-fixed/60 text-primary flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z" />
                    </svg>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[12px] font-extrabold text-on-surface leading-tight">
                      Single Sign-On UPNVJ
                    </span>
                    <span className="text-[10px] text-text-muted font-medium">
                      Login &amp; Registrasi Otomatis
                    </span>
                  </div>
                </div>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-label-micro font-label-micro bg-emerald-100 text-emerald-500 font-extrabold uppercase">
                  Otomatis
                </span>
              </div>
            )}

            {/* Header Prompt */}
            <div className="flex flex-col items-center text-center space-y-1">
              <h3 className="font-headline-md text-headline-md text-on-surface font-extrabold tracking-tight">
                {isBuyer
                  ? "Akses Instan Mahasiswa"
                  : mode === "login"
                  ? "Login Akun Loket"
                  : "Registrasi Mitra / Ibu Kantin"}
              </h3>
              <p className="font-body-sm text-body-sm text-text-muted leading-relaxed px-1">
                {isBuyer
                  ? "Tidak perlu registrasi manual. Masuk 1-klik menggunakan akun Google SSO resmi kampus untuk aktivasi profil seketika."
                  : mode === "login"
                  ? "Masuk untuk mengakses dashboard dapur dan pesanan masuk."
                  : "Lengkapi data stan loket untuk pengajuan verifikasi izin operasional oleh Admin Utama."}
              </p>
            </div>

            {/* Global Error Banner */}
            {error && (
              <div className="p-3 rounded-2xl bg-danger/10 border border-danger/30 flex items-center gap-2.5 text-danger text-xs font-bold shadow-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Form Input Fields */}
            {isBuyer ? (
              /* Mahasiswa Exclusive Google SSO Flow Container */
              <div className="flex flex-col space-y-3">
                {/* Reference Top Info Card: Khusus Mahasiswa UPN Veteran Jakarta */}
                <div
                  className="w-full rounded-[24px] px-4 py-3.5 flex items-center space-x-3.5 shadow-sm transition-all"
                  style={{ background: "rgb(250, 234, 227)", border: "1.5px solid rgba(210, 100, 75, 0.35)" }}
                >
                  {/* Graduation Cap Icon Circle */}
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 shadow-sm"
                    style={{ backgroundColor: "#9c2712" }}
                  >
                    <svg className="w-6 h-6 text-white fill-current" viewBox="0 0 24 24">
                      <path d="M12 3L1 9l11 6l9-4.91V17h2V9L12 3z M5 13.18v4L12 21l7-3.82v-4L12 17L5 13.18z" />
                    </svg>
                  </div>
                  {/* Two-line Notice Text */}
                  <div className="flex flex-col justify-center text-left leading-tight">
                    <span className="text-[14px] font-extrabold tracking-tight" style={{ color: "#1f140e" }}>
                      Khusus Mahasiswa UPN Veteran Jakarta
                    </span>
                    <span className="text-[13px] font-bold mt-0.5" style={{ color: "#a83416" }}>
                      Wajib berakhiran @mahasiswa.upnvj.ac.id
                    </span>
                  </div>
                </div>

                {/* Reference Bottom Button: Masuk dengan Akun Google Mahasiswa */}
                <div className="pt-0.5">
                  <button
                    type="button"
                    onClick={handleGooglePrimaryClick}
                    className="w-full h-14 rounded-[24px] flex items-center px-4 bg-white shadow-sm active:scale-[0.98] transition-all hover:bg-white/90 cursor-pointer"
                    style={{ border: "1.5px solid rgba(210, 100, 75, 0.35)" }}
                  >
                    <div className="flex items-center space-x-3.5 min-w-0">
                      {/* Official Multi-color Google G Icon */}
                      <div className="w-7 h-7 flex items-center justify-center shrink-0">
                        <svg className="w-6 h-6" viewBox="0 0 24 24">
                          <path
                            fill="#4285F4"
                            d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.27-2.09 3.665-5.17 3.665-9.12z"
                          />
                          <path
                            fill="#34A853"
                            d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.13C3.25 21.31 7.31 24 12 24z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.58H1.26C.46 8.18 0 9.99 0 12s.46 3.82 1.26 5.42l4.02-3.13z"
                          />
                          <path
                            fill="#EA4335"
                            d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.69 1.26 6.58l4.02 3.13c.95-2.83 3.6-4.96 6.72-4.96z"
                          />
                        </svg>
                      </div>
                      <span className="text-[15px] font-extrabold tracking-tight text-left" style={{ color: "#1a120c" }}>
                        Masuk dengan Akun Google Mahasiswa
                      </span>
                    </div>
                  </button>
                </div>

                {/* Quick Student Fast-Login Chips */}
                <div className="space-y-2 pt-1">
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
              </div>
            ) : mode === "login" ? (
              /* Pemilik Kantin Credential Login Flow Container (Snippet 2) */
              <form onSubmit={handleCanteenLogin} className="space-y-3">
                {/* Field 1: Username / NIM / Email */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-on-surface uppercase tracking-wider px-1" htmlFor="input-identifier">
                    USERNAME LOKET / EMAIL / NO. HP
                  </label>
                  <div className="relative flex items-center">
                    <div className="absolute left-3.5 flex items-center pointer-events-none text-text-muted">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </div>
                    <input
                      className="w-full h-11 pl-10 pr-3.5 rounded-xl bg-white/80 border border-white/90 text-[13px] text-on-surface placeholder:text-text-muted/60 focus:outline-none focus:ring-2 focus:ring-primary shadow-sm transition-all"
                      id="input-identifier"
                      placeholder="Contoh: loket01.burini atau 0812xxxx"
                      required
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                    />
                  </div>
                </div>

                {/* Field 2: Password */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between px-1">
                    <label className="block text-[11px] font-bold text-on-surface uppercase tracking-wider" htmlFor="input-password">
                      Kata Sandi
                    </label>
                  </div>
                  <div className="relative flex items-center">
                    <div className="absolute left-3.5 flex items-center pointer-events-none text-text-muted">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
                        <rect height="11" rx="2" ry="2" width="18" x="3" y="11" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    </div>
                    <input
                      className="w-full h-11 pl-10 pr-10 rounded-xl bg-white/80 border border-white/90 text-[13px] text-on-surface placeholder:text-text-muted/60 focus:outline-none focus:ring-2 focus:ring-primary shadow-sm transition-all"
                      id="input-password"
                      placeholder="Masukkan kata sandi"
                      required
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      className="absolute right-3 text-text-muted hover:text-on-surface focus:outline-none p-1"
                      onClick={() => setShowPassword(!showPassword)}
                      type="button"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember & Forgot Password */}
                <div className="flex items-center justify-between px-1 pt-0.5 text-[11px]">
                  <label className="flex items-center space-x-2 cursor-pointer select-none group">
                    <input
                      type="checkbox"
                      id="remember-me"
                      checked={canteenRememberMe}
                      onChange={(e) => setCanteenRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-outline-variant/60 text-primary focus:ring-primary/40 bg-white/80 transition-all cursor-pointer"
                    />
                    <span className="font-medium text-text-muted group-hover:text-on-surface transition-all">
                      Ingat sesi loket ini
                    </span>
                  </label>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      alert("Silakan hubungi Administrator Kantin UPNVJ untuk reset password loket stan Anda.");
                    }}
                    id="link-forgot-pass"
                    className="font-bold text-primary hover:underline transition-all"
                  >
                    Lupa Kata Sandi?
                  </a>
                </div>

                {/* Submit Action Button */}
                <div className="pt-1">
                  <button
                    className="btn-tangy-gradient w-full h-12 rounded-full flex items-center justify-center space-x-2 text-white font-headline-sm text-headline-sm font-extrabold tracking-tight active:scale-[0.98] transition-all shadow-lg group cursor-pointer disabled:opacity-50"
                    id="btn-submit-auth"
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                    ) : (
                      <>
                        <span id="btn-submit-label">Masuk ke Dashboard Loket</span>
                        <svg className="w-4 h-4 text-white transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24">
                          <line x1="5" x2="19" y1="12" y2="12" />
                          <polyline points="12 5 19 12 12 19" />
                        </svg>
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              /* Pemilik Kantin Register Form (Snippet 3) */
              <form onSubmit={handleCanteenRegister} className="flex flex-col gap-3.5">
                {/* Field 1: Nama Pemilik / Penanggung Jawab */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-label-sm font-label-sm text-text-muted tracking-wider uppercase flex items-center justify-between">
                    <span>NAMA PEMILIK / PENANGGUNG JAWAB</span>
                    <span className="text-primary font-bold">*Wajib</span>
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-text-muted flex items-center pointer-events-none">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" viewBox="0 0 24 24">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </span>
                    <input
                      className="w-full h-11 pl-10 pr-4 rounded-xl bg-white/70 border border-white focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary text-body-md font-body-md text-on-surface placeholder:text-text-muted/60 shadow-sm transition-all"
                      placeholder="Contoh: Ibu Rini Wulandari"
                      type="text"
                      required
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                    />
                  </div>
                </div>

                {/* Field 2: Nama Stan / Loket Kantin */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-label-sm font-label-sm text-text-muted tracking-wider uppercase flex items-center justify-between">
                    <span>NAMA STAN / LOKET KANTIN</span>
                    <span className="text-primary font-bold">*Loket</span>
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-text-muted flex items-center pointer-events-none">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" viewBox="0 0 24 24">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                        <polyline points="9 22 9 12 15 12 15 22" />
                      </svg>
                    </span>
                    <input
                      className="w-full h-11 pl-10 pr-4 rounded-xl bg-white/70 border border-white focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary text-body-md font-body-md text-on-surface placeholder:text-text-muted/60 shadow-sm transition-all"
                      placeholder="Contoh: Ayam Geprek &amp; Penyet Bu Rini (Loket #01)"
                      type="text"
                      required
                      value={canteenName}
                      onChange={(e) => setCanteenName(e.target.value)}
                    />
                  </div>
                </div>

                {/* Field 3: No. WhatsApp Aktif / Email Loket */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-label-sm font-label-sm text-text-muted tracking-wider uppercase flex items-center justify-between">
                    <span>NO. WHATSAPP AKTIF / EMAIL LOKET</span>
                    <span className="text-primary font-bold">*Kontak</span>
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-text-muted flex items-center pointer-events-none">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" viewBox="0 0 24 24">
                        <rect height="14" rx="2" width="20" x="2" y="5" />
                        <line x1="2" x2="22" y1="10" y2="10" />
                      </svg>
                    </span>
                    <input
                      className="w-full h-11 pl-10 pr-4 rounded-xl bg-white/70 border border-white focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary text-body-md font-body-md text-on-surface placeholder:text-text-muted/60 shadow-sm transition-all"
                      placeholder="Contoh: 081234567890 atau loket01@upnvj.ac.id"
                      type="text"
                      required
                      value={canteenContact}
                      onChange={(e) => setCanteenContact(e.target.value)}
                    />
                  </div>
                </div>

                {/* Field 4: Lokasi Kantin Kampus */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-label-sm font-label-sm text-text-muted tracking-wider uppercase flex items-center justify-between">
                    <span>LOKASI KANTIN KAMPUS</span>
                    <span className="text-primary font-bold">*Pilih Area</span>
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-text-muted flex items-center pointer-events-none">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" viewBox="0 0 24 24">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                    </span>
                    <select
                      className="w-full h-11 pl-10 pr-8 rounded-xl bg-white/70 border border-white focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary text-body-md font-body-md text-on-surface shadow-sm transition-all appearance-none cursor-pointer"
                      value={canteenLocation}
                      onChange={(e) => setCanteenLocation(e.target.value)}
                    >
                      <option value="kantin-soetomo">Kantin Gedung Dr. Soetomo (Pondok Labu)</option>
                      <option value="kantin-fik">Kantin FIK (Pondok Labu)</option>
                      <option value="kantin-fisip">Kantin FISIP (Pondok Labu)</option>
                      <option value="kantin-limo">Kantin Kampus Limo</option>
                    </select>
                    <span className="absolute right-3.5 text-text-muted flex items-center pointer-events-none">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </span>
                  </div>
                </div>

                {/* Field 5: Kata Sandi Baru */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-label-sm font-label-sm text-text-muted tracking-wider uppercase flex items-center justify-between">
                    <span>KATA SANDI BARU</span>
                    <span className="text-text-muted">Min. 8 Karakter</span>
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-text-muted flex items-center pointer-events-none">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" viewBox="0 0 24 24">
                        <rect height="11" rx="2" ry="2" width="18" x="3" y="11" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    </span>
                    <input
                      className="w-full h-11 pl-10 pr-11 rounded-xl bg-white/70 border border-white focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary text-body-md font-body-md text-on-surface placeholder:text-text-muted/60 shadow-sm transition-all"
                      id="password-input"
                      placeholder="Minimal 8 karakter"
                      type={showRegPassword ? "text" : "password"}
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                    />
                    <button
                      aria-label="Tampilkan sandi"
                      className="absolute right-3 text-text-muted hover:text-on-surface p-1 transition-colors"
                      id="toggle-password"
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                    >
                      {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Field 6: Konfirmasi Kata Sandi */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-label-sm font-label-sm text-text-muted tracking-wider uppercase">
                    KONFIRMASI KATA SANDI
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-text-muted flex items-center pointer-events-none">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" viewBox="0 0 24 24">
                        <rect height="11" rx="2" ry="2" width="18" x="3" y="11" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    </span>
                    <input
                      className="w-full h-11 pl-10 pr-4 rounded-xl bg-white/70 border border-white focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary text-body-md font-body-md text-on-surface placeholder:text-text-muted/60 shadow-sm transition-all"
                      placeholder="Ulangi kata sandi"
                      type={showRegPassword ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>

                {/* Primary Action Button */}
                <button
                  className="w-full h-12 mt-2 rounded-full primary-cta-gradient text-white text-body-lg font-body-lg font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg disabled:opacity-50"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <>
                      <span>Daftar &amp; Ajukan Loket</span>
                      <span className="text-lg leading-none">&rarr;</span>
                    </>
                  )}
                </button>

                {/* Bottom Informational Banner */}
                <div className="rounded-2xl p-3.5 bg-white/80 border border-white flex items-start gap-3 shadow-xs mt-1">
                  <div className="w-6 h-6 rounded-full bg-[#FF8A00]/15 text-[#FF8A00] flex items-center justify-center shrink-0 mt-0.5">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-label-md font-label-md text-on-surface font-extrabold">
                      Menunggu Verifikasi Admin (1x24 Jam)
                    </span>
                    <span className="text-body-sm font-body-sm text-text-muted leading-tight mt-0.5">
                      Akun loket Anda akan ditinjau oleh Admin Utama UPNVJ sebelum stan dan menu dapat tayang dan menerima pesanan dari mahasiswa.
                    </span>
                  </div>
                </div>
              </form>
            )}

            {/* Role Selection Section: 2-Column Side-by-Side Grid Layout */}
            <div className="space-y-2 pt-1 border-t border-white/60">
              <div className="flex items-center justify-between px-1">
                <span className="font-label-sm text-label-sm text-text-muted uppercase tracking-wider font-extrabold">
                  PILIH PERAN AKUN
                </span>
                <span
                  className="text-[10px] font-bold text-primary bg-primary-fixed/60 px-2 py-0.5 rounded-full"
                  id="role-pill-badge"
                >
                  {isBuyer ? "Google SSO (@mahasiswa.upnvj.ac.id)" : "Mitra Kantin"}
                </span>
              </div>
              <div className="flex flex-row space-x-2.5">
                {/* Option 1: Pembeli / Mahasiswa */}
                <div
                  className={`liquid-card-role ${
                    isBuyer ? "is-active" : ""
                  } rounded-2xl p-3 cursor-pointer relative overflow-hidden flex flex-col flex-1 min-w-0 transition-all`}
                  id="role-card-buyer"
                  onClick={() => setRole("buyer")}
                >
                  <div className="flex items-center justify-between w-full mb-2">
                    <div
                      className={`w-9 h-9 rounded-xl ${
                        isBuyer ? "bg-primary text-white" : "bg-surface-container-high text-on-surface-variant"
                      } flex items-center justify-center shrink-0 shadow-sm`}
                      id="role-icon-buyer"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" viewBox="0 0 24 24">
                        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-5z" />
                        <line x1="3" x2="21" y1="6" y2="6" />
                        <path d="M16 10a4 4 0 0 1-8 0" />
                      </svg>
                    </div>
                    <span
                      className={`w-5 h-5 rounded-full ${
                        isBuyer ? "bg-primary text-white flex items-center justify-center" : "border-2 border-outline-variant hidden"
                      } shrink-0`}
                      id="check-icon-buyer"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" viewBox="0 0 24 24">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </span>
                  </div>
                  <h4 className="font-headline-sm text-[13px] leading-snug text-on-surface font-extrabold tracking-tight mb-1">
                    Pembeli / Mahasiswa
                  </h4>
                  <p className="text-[11px] font-body-sm text-text-muted leading-snug">
                    <span className="block text-primary font-bold mb-0.5">Otomatisasi Akun Mahasiswa</span>
                    <span className="text-[10px] text-text-muted">Cukup 1x Klik Google SSO (@mahasiswa.upnvj.ac.id), tanpa registrasi manual.</span>
                  </p>
                </div>

                {/* Option 2: Pemilik / Ibu Kantin */}
                <div
                  className={`liquid-card-role ${
                    !isBuyer ? "is-active" : ""
                  } rounded-2xl p-3 cursor-pointer relative overflow-hidden flex flex-col flex-1 min-w-0 transition-all`}
                  id="role-card-canteen"
                  onClick={() => setRole("canteen")}
                >
                  <div className="flex items-center justify-between w-full mb-2">
                    <div
                      className={`w-9 h-9 rounded-xl ${
                        !isBuyer ? "bg-primary text-white" : "bg-surface-container-high text-on-surface-variant"
                      } flex items-center justify-center shrink-0 shadow-sm`}
                      id="role-icon-canteen"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" viewBox="0 0 24 24">
                        <path d="M3 3h18v4H3z" />
                        <path d="M4 7v13a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V7" />
                        <path d="M10 11v6" />
                        <path d="M14 11v6" />
                      </svg>
                    </div>
                    <span
                      className={`w-5 h-5 rounded-full ${
                        !isBuyer ? "bg-primary text-white flex items-center justify-center" : "border-2 border-outline-variant hidden"
                      } shrink-0`}
                      id="check-icon-canteen"
                    >
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" viewBox="0 0 24 24">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </span>
                  </div>
                  <h4 className="font-headline-sm text-[13px] leading-snug text-on-surface font-extrabold tracking-tight mb-1">
                    Pemilik / Ibu Kantin
                  </h4>
                  <p className="text-[11px] font-body-sm text-text-muted leading-snug">
                    Kelola stan loket, stok harian, &amp; pesanan mahasiswa.
                  </p>
                </div>
              </div>
            </div>

            {/* Dynamic Role Clarification Box */}
            <div className="p-3 rounded-2xl bg-white/75 border border-white/90 flex items-start space-x-2.5 shadow-sm" id="role-note-box">
              {isBuyer ? (
                <>
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-success flex items-center justify-center shrink-0 mt-0.5" id="note-icon-wrap">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <div className="flex flex-col space-y-0.5">
                    <span className="font-label-sm text-label-sm text-on-surface font-extrabold tracking-tight" id="note-title">
                      Verifikasi Otomatis @mahasiswa.upnvj.ac.id
                    </span>
                    <p className="text-[11px] text-text-muted leading-snug" id="note-desc">
                      Hanya akun resmi Google Kampus UPNVJ (@mahasiswa.upnvj.ac.id) yang diizinkan untuk menjamin ketepatan identitas mahasiswa dan saldo VetaBite.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5" id="note-icon-wrap">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                  </div>
                  <div className="flex flex-col space-y-1">
                    <span className="font-label-sm text-label-sm text-on-surface font-extrabold tracking-tight" id="note-title">
                      Ketentuan Akun &amp; Verifikasi Loket
                    </span>
                    <p className="text-[11px] text-text-muted leading-relaxed" id="note-desc">
                      Akun Pemilik/Ibu Kantin dikelola dan diverifikasi oleh pihak Pengelola Kantin UPNVJ. Untuk akun Mahasiswa/Pembeli terhubung langsung dengan identitas kampus <span className="font-semibold text-on-surface">@mahasiswa.upnvj.ac.id</span>.
                    </p>
                  </div>
                </>
              )}
            </div>
          </section>

          {/* 4. Quick Canteen Status Pill Ticker */}
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
            <span
              onClick={() => alert("Kantin buka di Gedung Soetomo, FIK, FISIP, dan Limo.")}
              className="font-label-sm text-label-sm text-primary font-bold cursor-pointer hover:underline"
            >
              Cek Lokasi
            </span>
          </div>
        </main>

        {/* Version & System Copyright Footer */}
        <footer className="mt-auto px-margin pt-3 pb-6 flex flex-col items-center justify-center text-center space-y-1">
          <div className="flex items-center space-x-2 text-text-muted">
            <svg className="w-3.5 h-3.5 text-success" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
            <span className="font-label-sm text-label-sm">Autentikasi Aman &amp; Terenkripsi</span>
          </div>
          <p className="font-label-micro text-label-micro text-text-muted">
            VetaBite UPN &quot;Veteran&quot; Jakarta v2.5 • Portal Layanan Kantin Terintegrasi
          </p>
          <p className="font-label-micro text-label-micro text-text-muted/60">
            Biro Kemahasiswaan &amp; Kerjasama UPNVJ &copy; 2024
          </p>
        </footer>
      </div>

      {/* Developer / Fallback Student OAuth Modal (if Google credentials not loaded or manual simulation needed) */}
      {googleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="relative w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-white/90">
            <button
              type="button"
              onClick={() => setGoogleModalOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-full text-text-muted hover:text-on-surface hover:bg-surface-dim transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 flex items-center justify-center">
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.27-2.09 3.665-5.17 3.665-9.12z" />
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.13C3.25 21.31 7.31 24 12 24z" />
                  <path fill="#FBBC05" d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.58H1.26C.46 8.18 0 9.99 0 12s.46 3.82 1.26 5.42l4.02-3.13z" />
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.69 1.26 6.58l4.02 3.13c.95-2.83 3.6-4.96 6.72-4.96z" />
                </svg>
              </div>
              <h3 className="font-headline-sm font-bold text-on-surface">Masuk dengan Akun Google</h3>
            </div>

            <p className="text-xs text-text-muted mb-4 leading-relaxed">
              Masukkan alamat email mahasiswa resmi UPNVJ Anda untuk masuk otomatis:
            </p>

            {googleError && (
              <div className="p-2.5 rounded-xl bg-danger/10 border border-danger/30 text-danger text-xs font-bold mb-3">
                {googleError}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-text-muted uppercase mb-1">
                  Nama Mahasiswa (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Dimas Arya Pratama"
                  value={customStudentName}
                  onChange={(e) => setCustomStudentName(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl bg-surface-dim/60 border border-border-specular text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-text-muted uppercase mb-1">
                  Email Mahasiswa Kampus *
                </label>
                <input
                  type="email"
                  placeholder="2110511001@mahasiswa.upnvj.ac.id"
                  value={customStudentEmail}
                  onChange={(e) => setCustomStudentEmail(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl bg-surface-dim/60 border border-border-specular text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <button
                type="button"
                onClick={() => handleStudentGoogleAuth()}
                disabled={googleLoading}
                className="w-full h-11 rounded-full btn-tangy-gradient text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                {googleLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Lanjutkan Masuk"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
