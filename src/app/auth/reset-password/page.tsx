"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { KeyRound, CheckCircle2, Lock, ArrowLeft, AlertCircle, Eye, EyeOff } from "lucide-react";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") || "";

  const [loading, setLoading] = useState(true);
  const [tokenInfo, setTokenInfo] = useState<{
    userName: string;
    userRole: string;
    phone: string;
  } | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setTokenError("Token reset kata sandi tidak ditemukan pada tautan.");
      setLoading(false);
      return;
    }

    fetch(`/api/auth/reset-password?token=${encodeURIComponent(token)}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          setTokenInfo({
            userName: json.data.userName,
            userRole: json.data.userRole,
            phone: json.data.phone,
          });
        } else {
          setTokenError(
            json.error?.message ||
              "Tautan reset kata sandi tidak valid atau sudah kadaluarsa (melewati batas 15 menit)."
          );
        }
      })
      .catch(() => {
        setTokenError("Gagal memvalidasi token reset kata sandi.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (newPassword.length < 6) {
      setSubmitError("Kata sandi baru minimal 6 karakter.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setSubmitError("Konfirmasi kata sandi tidak cocok.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setSubmitError(json.error?.message || "Gagal memperbarui kata sandi.");
        setSubmitting(false);
        return;
      }

      setSubmitSuccess(true);
    } catch {
      setSubmitError("Terjadi kesalahan jaringan.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-background-base text-on-surface antialiased min-h-screen relative overflow-x-hidden flex flex-col justify-between selection:bg-primary selection:text-on-primary">
      {/* Ambient Lighting */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-32 left-1/4 w-[500px] h-[500px] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute -bottom-20 right-1/4 w-[450px] h-[450px] rounded-full bg-warning/10 blur-[100px]" />
      </div>

      {/* Header */}
      <header className="w-full relative z-20 px-8 py-6 flex items-center justify-between max-w-4xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/90 shadow-sm border border-border-specular flex items-center justify-center p-1 overflow-hidden shrink-0">
            <img src="/LOGO.jpeg" alt="Logo VetaBite" className="w-8 h-8 rounded-xl object-cover" />
          </div>
          <div>
            <span className="font-extrabold text-sm text-primary tracking-tight block leading-tight">
              VetaBite Kampus
            </span>
            <span className="text-[10px] text-text-muted tracking-widest uppercase block font-semibold">
              UPN &quot;Veteran&quot; Jakarta
            </span>
          </div>
        </div>
        <Link
          href="/login"
          className="text-xs font-semibold text-text-muted hover:text-primary transition-colors flex items-center gap-1"
        >
          <ArrowLeft size={14} />
          <span>Ke Halaman Masuk</span>
        </Link>
      </header>

      {/* Main Container */}
      <main className="relative z-20 flex-grow flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md bg-white/90 backdrop-blur-2xl border-[1.5px] border-white/95 rounded-3xl p-8 shadow-[0_20px_48px_-12px_rgba(45,20,8,0.12)] space-y-6">
          <div className="text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF6226] to-[#ad2b00] text-white flex items-center justify-center shadow-md mb-4">
              <KeyRound size={28} />
            </div>
            <h1 className="text-xl md:text-2xl font-extrabold text-on-surface tracking-tight">
              Atur Ulang Kata Sandi
            </h1>
            <p className="text-xs text-text-muted mt-1 leading-relaxed">
              Buat kata sandi baru untuk mengamankan akun civitas VetaBite Anda.
            </p>
          </div>

          {loading ? (
            <div className="py-8 text-center text-xs text-text-muted font-medium">
              Memverifikasi token reset kata sandi...
            </div>
          ) : tokenError ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-error-container/60 border border-error/20 text-error text-xs font-semibold flex items-start gap-2.5">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <p className="leading-relaxed">{tokenError}</p>
              </div>
              <p className="text-xs text-text-muted text-center leading-relaxed">
                Silakan hubungi Administrator Biro Kemahasiswaan atau Penjual Kantin untuk mendapatkan tautan reset baru via WhatsApp.
              </p>
              <div className="pt-2 text-center">
                <Link
                  href="/login"
                  className="inline-block px-5 py-2.5 rounded-full btn-liquid-terracotta text-white text-xs font-bold shadow-md"
                >
                  Kembali ke Halaman Masuk
                </Link>
              </div>
            </div>
          ) : submitSuccess ? (
            <div className="space-y-4 text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                <CheckCircle2 size={32} />
              </div>
              <h3 className="text-base font-bold text-on-surface">Kata Sandi Berhasil Diperbarui!</h3>
              <p className="text-xs text-text-muted leading-relaxed">
                Kata sandi baru akun Anda sudah aktif. Silakan masuk kembali menggunakan username dan kata sandi baru Anda.
              </p>
              <div className="pt-3">
                <Link
                  href="/login"
                  className="w-full inline-block py-3 px-6 rounded-full btn-liquid-terracotta text-white text-xs font-bold shadow-md"
                >
                  Masuk ke Akun Sekarang
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* User Identity Pill */}
              {tokenInfo && (
                <div className="p-3 rounded-2xl bg-surface-container-low border border-border-specular flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-on-surface">{tokenInfo.userName}</p>
                    <p className="text-[11px] text-text-muted">{tokenInfo.userRole}</p>
                  </div>
                  <span className="text-[10px] font-bold text-[#24A148]">{tokenInfo.phone}</span>
                </div>
              )}

              {submitError && (
                <div className="p-3 rounded-xl bg-error-container/60 border border-error/20 text-error text-xs font-semibold flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-error text-white flex items-center justify-center text-[10px] shrink-0">
                    !
                  </span>
                  <span>{submitError}</span>
                </div>
              )}

              {/* Password Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface flex items-center gap-1">
                  <span>Kata Sandi Baru</span>
                  <span className="text-primary">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                    <Lock size={15} />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimal 6 karakter..."
                    className="w-full h-11 pl-9 pr-10 text-xs md:text-sm bg-white border border-border-specular rounded-2xl focus:ring-2 focus:ring-primary focus:outline-none shadow-inner"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-muted hover:text-on-surface"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface flex items-center gap-1">
                  <span>Konfirmasi Kata Sandi Baru</span>
                  <span className="text-primary">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                    <Lock size={15} />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ulangi kata sandi baru..."
                    className="w-full h-11 pl-9 pr-4 text-xs md:text-sm bg-white border border-border-specular rounded-2xl focus:ring-2 focus:ring-primary focus:outline-none shadow-inner"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-12 rounded-full btn-liquid-terracotta text-white font-bold text-xs md:text-sm shadow-md active:scale-95 transition-all disabled:opacity-50"
                >
                  {submitting ? "Memperbarui Kata Sandi..." : "Simpan Kata Sandi Baru"}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-20 w-full px-8 py-5 text-center text-text-muted text-xs font-medium">
        &copy; 2025 VetaBite &bull; UPN &quot;Veteran&quot; Jakarta
      </footer>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-xs text-text-muted">
          Memuat...
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
