"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Loader2,
  GraduationCap,
  Store,
  Check,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  X,
  CreditCard,
  MapPin,
  ChevronDown,
  User,
  Lock,
} from "lucide-react";
import { api } from "@/lib/api";

type Role = "MAHASISWA" | "PENJUAL";

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

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<Role>("MAHASISWA");

  // Google Student OAuth Modal
  const [googleModalOpen, setGoogleModalOpen] = useState(false);
  const [customEmail, setCustomEmail] = useState("");
  const [customName, setCustomName] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState("");

  // Canteen Loket Form
  const [ownerName, setOwnerName] = useState("");
  const [canteenName, setCanteenName] = useState("");
  const [canteenContact, setCanteenContact] = useState("");
  const [canteenLocation, setCanteenLocation] = useState("kantin-soetomo");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const buyer = role === "MAHASISWA";

  async function handleStudentGoogleRegister(emailToUse?: string, nameToUse?: string) {
    const targetEmail = (emailToUse || customEmail).trim().toLowerCase();
    const targetName = (nameToUse || customName).trim();
    setGoogleError("");

    if (!targetEmail) {
      setGoogleError("Email mahasiswa wajib diisi.");
      return;
    }

    if (!targetEmail.endsWith("@mahasiswa.upnvj.ac.id")) {
      setGoogleError("Hanya akun resmi mahasiswa UPN Veteran Jakarta (@mahasiswa.upnvj.ac.id) yang dapat didaftarkan.");
      return;
    }

    setGoogleLoading(true);
    try {
      const res = await api<{ redirectTo?: string }>("/api/auth/google", {
        method: "POST",
        body: JSON.stringify({
          email: targetEmail,
          full_name: targetName || undefined,
          remember_me: true,
        }),
      });

      setGoogleModalOpen(false);
      router.push(res.redirectTo || "/dashboard");
    } catch (err: unknown) {
      setGoogleError(err instanceof Error ? err.message : "Pendaftaran via Google Akun Mahasiswa gagal.");
    } finally {
      setGoogleLoading(false);
    }
  }

  async function handleCanteenRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Kata sandi minimal 8 karakter.");
      return;
    }

    if (password !== confirmPassword) {
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

    setLoading(true);
    try {
      const res = await api<{ status: string }>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          full_name: ownerName.trim(),
          whatsapp: canteenContact.trim(),
          username: finalUsername,
          password,
          role: "PENJUAL",
          canteen_name: canteenName.trim(),
          canteen_description: locationMap[canteenLocation] || canteenLocation,
        }),
      });

      if (res.status === "PENDING") {
        router.push("/pending-verification");
      } else {
        router.push("/login");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Pendaftaran stan loket gagal.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex justify-center items-start sm:py-6 bg-[#F6EFEA]">
      <div className="relative w-full max-w-[430px] min-h-screen sm:min-h-[880px] sm:rounded-[46px] sm:border-[5px] sm:border-surface-glass-alt bg-background-base flex flex-col overflow-hidden pb-10 shadow-2xl">
        <div className="pointer-events-none absolute top-0 left-0 right-0 h-96 ambient-glow-top z-0" />

        {/* Top Header */}
        <div className="relative z-10 px-margin pt-3 pb-2 flex items-center justify-between">
          <div className="flex items-center space-x-3">
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
                <h1 className="font-headline-hero-mobile text-headline-hero-mobile text-on-surface tracking-tight">
                  Veta<span className="text-primary-container">Bite</span>
                </h1>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-label-micro font-label-micro bg-primary text-white font-extrabold uppercase">
                  UPNVJ
                </span>
              </div>
              <p className="font-label-sm text-label-sm text-text-muted uppercase tracking-wider">
                UPN VETERAN JAKARTA • PICK-UP KANTIN
              </p>
            </div>
          </div>
          <div className="w-9 h-9 rounded-full bg-white/70 border border-white/90 flex items-center justify-center shadow-sm">
            <ShieldCheck className="w-5 h-5 text-secondary" />
          </div>
        </div>

        <main className="relative z-10 px-margin pt-2 flex flex-col space-y-4">
          {/* Welcome Card */}
          <section className="liquid-panel-dark rounded-[24px] p-5 text-white relative overflow-hidden">
            <div className="relative z-10 flex flex-col space-y-2">
              <div className="self-start inline-flex items-center space-x-1.5 bg-black/25 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
                <ShieldCheck className="w-3.5 h-3.5 text-primary-fixed" />
                <span className="font-label-sm text-label-sm tracking-wider uppercase text-primary-fixed">
                  PORTAL BELA NEGARA
                </span>
              </div>
              <h2 className="font-headline-lg text-headline-lg text-white font-extrabold tracking-tight pt-0.5">
                {buyer ? "Daftar Akun Mahasiswa." : "Daftar Loket Kantin."}
              </h2>
              <p className="font-body-sm text-body-sm text-white/85 leading-relaxed pr-2">
                {buyer
                  ? "Mahasiswa UPNVJ cukup masuk dengan Akun Google Kampus (@mahasiswa.upnvj.ac.id). Registrasi akun dilakukan otomatis seketika."
                  : "Daftarkan stan loket Anda di ekosistem VetaBite UPNVJ. Penjual diverifikasi admin sebelum loket tampil."}
              </p>
            </div>
          </section>

          {/* Form / OAuth Section */}
          <section className="liquid-panel rounded-[26px] p-5 flex flex-col space-y-4">
            <div className="p-1 bg-surface-dim/50 rounded-2xl flex items-center shadow-inner border border-white/60">
              <Link
                href="/login"
                className="flex-1 py-2 rounded-xl text-label-md font-bold transition-all text-text-muted hover:text-on-surface text-center"
              >
                Masuk (Login)
              </Link>
              <span className="flex-1 py-2 rounded-xl text-label-md font-bold transition-all shadow-sm bg-white text-on-surface text-center">
                Daftar (Register)
              </span>
            </div>

            {/* Role Switcher */}
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="font-label-sm text-label-sm text-text-muted uppercase tracking-wider font-extrabold">
                  PILIH PERAN AKUN
                </span>
                <span className="text-[10px] font-bold text-primary bg-primary-fixed/60 px-2 py-0.5 rounded-full">
                  {buyer ? "Mahasiswa (Google SSO)" : "Mitra Kantin"}
                </span>
              </div>
              <div className="flex flex-row space-x-2.5">
                <button
                  type="button"
                  onClick={() => setRole("MAHASISWA")}
                  className={`liquid-card-role ${
                    buyer ? "is-active" : ""
                  } rounded-2xl p-3 flex flex-col flex-1 min-w-0 text-left cursor-pointer transition-all`}
                >
                  <div className="flex items-center justify-between w-full mb-2">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                        buyer ? "bg-primary text-white" : "bg-surface-container-high text-on-surface-variant"
                      }`}
                    >
                      <GraduationCap className="w-4 h-4" />
                    </div>
                    {buyer && (
                      <span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                  <h4 className="text-[13px] font-extrabold mb-1">Mahasiswa UPNVJ</h4>
                  <p className="text-[11px] text-text-muted leading-snug">
                    Otomatis via Google @mahasiswa.upnvj.ac.id
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setRole("PENJUAL")}
                  className={`liquid-card-role ${
                    !buyer ? "is-active" : ""
                  } rounded-2xl p-3 flex flex-col flex-1 min-w-0 text-left cursor-pointer transition-all`}
                >
                  <div className="flex items-center justify-between w-full mb-2">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                        !buyer ? "bg-primary text-white" : "bg-surface-container-high text-on-surface-variant"
                      }`}
                    >
                      <Store className="w-4 h-4" />
                    </div>
                    {!buyer && (
                      <span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                  <h4 className="text-[13px] font-extrabold mb-1">Pemilik / Ibu Kantin</h4>
                  <p className="text-[11px] text-text-muted leading-snug">
                    Kelola stan loket &amp; pesanan mahasiswa.
                  </p>
                </button>
              </div>
            </div>

            {/* Content for Mahasiswa: 1-Click Google OAuth */}
            {buyer ? (
              <div className="space-y-4 pt-1">
                <div className="p-3.5 rounded-2xl bg-primary-fixed/25 border border-primary/20 flex flex-col gap-1.5 text-left">
                  <span className="text-xs font-extrabold text-on-surface">
                    Pendaftaran Otomatis Seketika
                  </span>
                  <p className="text-[11px] text-text-muted leading-relaxed">
                    Mahasiswa tidak perlu mengisi formulir panjang. Cukup hubungkan dengan akun Google kampus UPNVJ (@mahasiswa.upnvj.ac.id), akun Anda langsung aktif dan dapat langsung memesan makanan.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setGoogleModalOpen(true)}
                  className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-white/90 border-2 border-primary/30 shadow-md hover:shadow-lg flex items-center justify-center gap-3 transition-all active:scale-[0.98] group cursor-pointer"
                >
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
                    Daftar dengan Google Mahasiswa
                  </span>
                </button>

                {/* Fast Account Chips */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider block px-1">
                    Atau Pilih Akun Demo Mahasiswa
                  </span>
                  <div className="grid grid-cols-1 gap-2">
                    {DEFAULT_DEMO_ACCOUNTS.slice(0, 3).map((acc) => (
                      <button
                        key={acc.email}
                        type="button"
                        onClick={() => handleStudentGoogleRegister(acc.email, acc.name)}
                        disabled={googleLoading}
                        className="w-full p-2.5 rounded-xl bg-white/70 hover:bg-white border border-white/90 text-left flex items-center justify-between transition-all hover:shadow-xs group cursor-pointer disabled:opacity-50"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                            {acc.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[12px] font-bold text-on-surface truncate group-hover:text-primary">
                              {acc.name}
                            </p>
                            <p className="text-[11px] text-text-muted truncate">{acc.email}</p>
                          </div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-text-muted group-hover:text-primary shrink-0 transition-transform group-hover:translate-x-0.5" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* Canteen Form */
              <form onSubmit={handleCanteenRegister} className="flex flex-col space-y-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-text-muted uppercase">Nama Pemilik Stan</label>
                  <div className="relative flex items-center">
                    <User className="w-4 h-4 text-text-muted absolute left-3 pointer-events-none" />
                    <input
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      placeholder="Contoh: Ibu Rini Wulandari"
                      required
                      className="w-full h-11 pl-9 pr-3 rounded-xl bg-white/80 border border-white text-xs text-on-surface placeholder:text-text-muted/60 focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-text-muted uppercase">Nama Stan Loket</label>
                  <div className="relative flex items-center">
                    <Store className="w-4 h-4 text-text-muted absolute left-3 pointer-events-none" />
                    <input
                      value={canteenName}
                      onChange={(e) => setCanteenName(e.target.value)}
                      placeholder="Contoh: Ayam Geprek Bu Rini (Loket 01)"
                      required
                      className="w-full h-11 pl-9 pr-3 rounded-xl bg-white/80 border border-white text-xs text-on-surface placeholder:text-text-muted/60 focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-text-muted uppercase">Kontak WhatsApp</label>
                  <div className="relative flex items-center">
                    <CreditCard className="w-4 h-4 text-text-muted absolute left-3 pointer-events-none" />
                    <input
                      value={canteenContact}
                      onChange={(e) => setCanteenContact(e.target.value)}
                      placeholder="081234567890"
                      required
                      className="w-full h-11 pl-9 pr-3 rounded-xl bg-white/80 border border-white text-xs text-on-surface placeholder:text-text-muted/60 focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-text-muted uppercase">Lokasi Kampus</label>
                  <div className="relative flex items-center">
                    <MapPin className="w-4 h-4 text-text-muted absolute left-3 pointer-events-none" />
                    <select
                      value={canteenLocation}
                      onChange={(e) => setCanteenLocation(e.target.value)}
                      className="w-full h-11 pl-9 pr-8 rounded-xl bg-white/80 border border-white text-xs text-on-surface appearance-none focus:outline-none focus:ring-1 focus:ring-primary shadow-xs cursor-pointer"
                    >
                      <option value="kantin-soetomo">Kantin Gedung Dr. Soetomo (Pondok Labu)</option>
                      <option value="kantin-fik">Kantin FIK (Pondok Labu)</option>
                      <option value="kantin-fisip">Kantin FISIP (Pondok Labu)</option>
                      <option value="kantin-limo">Kantin Kampus Limo</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-text-muted absolute right-3 pointer-events-none" />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-text-muted uppercase">Kata Sandi Baru</label>
                  <div className="relative flex items-center">
                    <Lock className="w-4 h-4 text-text-muted absolute left-3 pointer-events-none" />
                    <input
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      type={showPassword ? "text" : "password"}
                      placeholder="Minimal 8 karakter"
                      required
                      className="w-full h-11 pl-9 pr-10 rounded-xl bg-white/80 border border-white text-xs text-on-surface placeholder:text-text-muted/60 focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      className="absolute right-3 text-text-muted hover:text-on-surface"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-text-muted uppercase">Konfirmasi Kata Sandi</label>
                  <div className="relative flex items-center">
                    <Lock className="w-4 h-4 text-text-muted absolute left-3 pointer-events-none" />
                    <input
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      type={showPassword ? "text" : "password"}
                      placeholder="Ulangi kata sandi"
                      required
                      className="w-full h-11 pl-9 pr-3 rounded-xl bg-white/80 border border-white text-xs text-on-surface placeholder:text-text-muted/60 focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
                    />
                  </div>
                </div>

                {error && (
                  <p className="text-xs font-bold text-danger bg-danger/10 border border-danger/30 rounded-xl px-3 py-2 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </p>
                )}

                <button
                  disabled={loading}
                  className="btn-tangy-gradient w-full py-3 rounded-full flex items-center justify-center gap-2 text-white font-extrabold text-sm active:scale-[0.98] transition-all disabled:opacity-60 cursor-pointer shadow-md"
                  type="submit"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                  <span>{loading ? "Mendaftarkan..." : "Daftar sebagai Penjual Loket"}</span>
                </button>
              </form>
            )}

            <div className="p-3 rounded-2xl bg-white/75 border border-white/90 flex items-start space-x-2.5 shadow-sm">
              <div className="w-6 h-6 rounded-full bg-emerald-100 text-success flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3.5 h-3.5" />
              </div>
              <div className="flex flex-col space-y-0.5">
                <span className="font-label-sm text-label-sm text-on-surface font-extrabold tracking-tight">
                  {buyer ? "Langsung Aktif Tanpa Menunggu" : "Verifikasi Admin 1x24 Jam"}
                </span>
                <p className="text-[11px] text-text-muted leading-snug">
                  {buyer
                    ? "Akun mahasiswa langsung aktif otomatis untuk memesan."
                    : "Akun penjual diverifikasi terlebih dahulu sebelum menerima pesanan."}{" "}
                  Sudah punya akun?{" "}
                  <Link href="/login" className="text-primary font-bold hover:underline">
                    Masuk di sini
                  </Link>
                </p>
              </div>
            </div>
          </section>
        </main>
      </div>

      {/* Google Modal */}
      {googleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-[28px] bg-white text-on-surface shadow-2xl border border-white/80 overflow-hidden flex flex-col">
            <div className="p-5 pb-3 border-b border-surface-container flex items-center justify-between">
              <div className="flex items-center gap-2.5">
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
                  <h4 className="text-sm font-extrabold text-on-surface">Daftar Akun Mahasiswa</h4>
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

            <div className="p-5 space-y-4">
              {googleError && (
                <div className="p-2.5 rounded-xl bg-danger/10 border border-danger/30 flex items-start gap-2 text-danger text-xs font-semibold">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{googleError}</span>
                </div>
              )}

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
                      onClick={() => handleStudentGoogleRegister(acc.email, acc.name)}
                      className="w-full p-2.5 rounded-xl border border-border-specular/80 hover:border-primary hover:bg-primary-fixed/20 flex items-center gap-3 transition-all text-left group cursor-pointer disabled:opacity-50"
                    >
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                        {acc.name.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-on-surface truncate group-hover:text-primary">
                          {acc.name}
                        </p>
                        <p className="text-[11px] text-text-muted truncate">{acc.email}</p>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-text-muted group-hover:text-primary shrink-0 transition-transform group-hover:translate-x-0.5" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-surface-container space-y-2.5">
                <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider block">
                  Atau Ketik Email Mahasiswa
                </span>

                <div className="space-y-1.5">
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="Nama lengkap mahasiswa (opsional)"
                    className="w-full h-10 px-3 rounded-xl bg-surface-dim/60 border border-border-specular text-xs text-on-surface placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-primary"
                  />

                  <div className="relative">
                    <input
                      type="email"
                      value={customEmail}
                      onChange={(e) => setCustomEmail(e.target.value)}
                      placeholder="nim@mahasiswa.upnvj.ac.id"
                      className="w-full h-10 pl-3 pr-3 rounded-xl bg-surface-dim/60 border border-border-specular text-xs text-on-surface placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  disabled={googleLoading || !customEmail.trim()}
                  onClick={() => handleStudentGoogleRegister()}
                  className="w-full h-10 rounded-xl btn-tangy-gradient text-white text-xs font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  {googleLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Daftarkan Akun Ini</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>

              <p className="text-[10px] text-text-muted text-center pt-1 leading-relaxed">
                Hanya akun dengan domain <strong>@mahasiswa.upnvj.ac.id</strong> yang dapat diotentikasi.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
