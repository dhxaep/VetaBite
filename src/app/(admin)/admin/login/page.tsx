"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldCheck, Lock, CheckCircle2, HelpCircle, ArrowLeft } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const err = params.get("error");
      const details = params.get("details");
      if (err === "server_error") {
        setErrorMsg(
          details
            ? `Terjadi kesalahan internal: ${decodeURIComponent(details)}`
            : "Terjadi gangguan internal saat memproses autentikasi Google. Silakan coba lagi."
        );
      } else if (err === "oauth_not_configured") {
        setErrorMsg("Kredensial Google OAuth (GOOGLE_CLIENT_ID / SECRET) belum diatur di server.");
      } else if (err === "access_denied") {
        setErrorMsg("Otentikasi dibatalkan oleh pengguna.");
      } else if (err === "token_exchange_failed") {
        setErrorMsg("Pertukaran token Google OAuth gagal. Silakan verifikasi konfigurasi redirect URI.");
      } else if (err) {
        setErrorMsg(`Gagal masuk via Google Administrator: ${err}`);
      }
    }
  }, []);

  const handleGoogleLoginDirect = () => {
    setLoading(true);
    setErrorMsg(null);
    window.location.href = "/api/auth/admin/google/login";
  };

  return (
    <div className="bg-background-base text-on-surface antialiased min-h-screen relative overflow-x-hidden flex flex-col justify-between selection:bg-primary selection:text-on-primary">
      {/* Ambient Chromatic Refraction Backplates */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-24 left-[15%] w-[640px] h-[640px] rounded-full bg-gradient-to-br from-primary/15 via-warning/10 to-transparent blur-[120px]" />
        <div className="absolute -bottom-20 right-[18%] w-[520px] h-[520px] rounded-full bg-gradient-to-tr from-success/15 via-primary/5 to-transparent blur-[110px]" />
        <div className="absolute bottom-[5%] left-[5%] w-[420px] h-[420px] rounded-full bg-gradient-to-tl from-secondary-container/10 via-primary-fixed/20 to-transparent blur-[90px] opacity-60" />
      </div>

      {/* Subtle Top Decorative Header Anchor Bar */}
      <header className="w-full relative z-20 px-6 sm:px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/90 shadow-sm border border-border-specular flex items-center justify-center p-1 overflow-hidden shrink-0">
            <img src="/LOGO.jpeg" alt="Logo UPNVJ" className="w-8 h-8 rounded-xl object-cover" />
          </div>
          <div>
            <span className="font-headline-sm text-sm font-extrabold text-on-surface tracking-tight block leading-tight">
              UPN &quot;Veteran&quot; Jakarta
            </span>
            <span className="text-[10px] text-text-muted tracking-widest uppercase block font-semibold">
              Biro Kemahasiswaan &amp; Fasilitas Kampus
            </span>
          </div>
        </div>

        {/* Right Server Status Pill Badge */}
        <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/80 border border-border-specular shadow-sm">
          <div className="relative flex items-center justify-center w-2.5 h-2.5">
            <span className="absolute w-4 h-4 rounded-full bg-success/30 animate-ping" />
            <span className="w-2 h-2 rounded-full bg-success" />
          </div>
          <span className="text-xs text-on-surface font-semibold hidden sm:inline">
            Google SSO Online &bull; Domain Bebas (Gmail, Workspace, dll)
          </span>
          <span className="text-xs text-on-surface font-semibold sm:hidden">
            SSO Bebas Domain
          </span>
        </div>
      </header>

      {/* Central Viewport: Liquid Glass Authentication Architecture */}
      <main className="relative z-20 flex-grow flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-[512px] bg-white/85 backdrop-blur-2xl border-[1.5px] border-white/90 rounded-[32px] p-8 md:p-10 shadow-[0_20px_48px_-12px_rgba(45,20,8,0.12)] relative">
          {/* Top Specular Highlight Line Bar */}
          <div className="w-20 h-1 bg-gradient-to-r from-transparent via-primary/40 to-transparent mx-auto mb-6 rounded-full opacity-80" />

          {/* Mascot & Brand Identity Header Cluster */}
          <div className="text-center flex flex-col items-center">
            {/* VetaBite Mascot Badge */}
            <div className="relative mb-5 group">
              <div className="w-24 h-24 rounded-3xl bg-white/95 p-2 flex items-center justify-center shadow-lg border-[1.5px] border-border-specular transition-transform duration-300 group-hover:scale-105 overflow-hidden">
                <img
                  src="/LOGO.jpeg"
                  alt="VetaBite Mascot"
                  className="w-full h-full object-cover rounded-2xl drop-shadow-md"
                />
              </div>
              {/* Verified Shield Overlap */}
              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-gradient-to-tr from-primary to-primary-container text-white flex items-center justify-center shadow-md border-2 border-white">
                <ShieldCheck size={16} />
              </div>
            </div>

            <h1 className="text-2xl md:text-[26px] font-extrabold text-on-surface tracking-tight mb-2">
              VetaBite Admin Console
            </h1>
            <p className="text-xs md:text-sm text-text-muted max-w-sm mb-6 leading-relaxed font-medium">
              Portal Akses Khusus Administrator &amp; Pengelola Kantin UPN &quot;Veteran&quot; Jakarta
            </p>
          </div>

          {/* Error Message Box */}
          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-2xl bg-error-container/60 border border-error/20 text-error text-xs font-semibold flex items-start gap-2.5">
              <div className="w-4 h-4 rounded-full bg-error text-white flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                !
              </div>
              <p className="flex-1 leading-snug">{errorMsg}</p>
            </div>
          )}

          {/* Action Box: Google OAuth Single Authentication Anchor */}
          <div className="space-y-4">
            {!loading ? (
              <>
                {/* Google OAuth Dedicated Button */}
                <button
                  type="button"
                  onClick={handleGoogleLoginDirect}
                  className="w-full rounded-full py-4 px-6 flex items-center justify-center gap-3.5 bg-gradient-to-b from-white to-[#FFF9F5] border-[1.5px] border-white/95 shadow-[0_6px_20px_rgba(45,20,8,0.07)] hover:shadow-[0_10px_28px_rgba(224,58,0,0.12)] hover:-translate-y-0.5 hover:scale-[1.008] active:scale-[0.98] transition-all duration-200 group text-on-surface cursor-pointer"
                >
                  {/* Official Multicolor Google 'G' Vector Icon */}
                  <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
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
                  </div>
                  {/* Action Typography Label */}
                  <span className="text-sm font-bold tracking-tight text-on-surface group-hover:text-primary transition-colors">
                    Masuk dengan Akun Google Administrator
                  </span>
                </button>
              </>
            ) : (
              /* Loading State Simulator */
              <div className="flex flex-col items-center justify-center gap-3 py-4 text-text-muted">
                <svg
                  className="animate-spin h-7 w-7 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path
                    className="opacity-75"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    fill="currentColor"
                  />
                </svg>
                <span className="text-xs font-bold text-on-surface">
                  Menghubungkan ke Google Identity Platform...
                </span>
                <span className="text-[11px] text-text-muted">
                  Memverifikasi otorisasi SSO Google Administrator (Bebas Domain)
                </span>
              </div>
            )}
          </div>

          {/* Credential & Access Information Container: BEBAS DOMAIN */}
          <div className="mt-8 pt-6 border-t border-border-subtle">
            <div className="rounded-2xl p-4 flex items-start gap-3.5 bg-surface-container-low/70 border border-border-specular">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                <Lock size={16} />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-primary uppercase tracking-wide">
                    Otorisasi Google SSO
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-primary/15 text-primary font-bold">
                    BEBAS DOMAIN
                  </span>
                </div>
                <p className="text-xs text-text-muted leading-relaxed font-medium">
                  Dapat masuk menggunakan akun Google dengan domain apa saja (<span className="font-bold text-on-surface">Gmail, Workspace, institusi, atau domain kustom</span>). Seluruh akun yang terotentikasi otomatis memiliki wewenang akses Administrator.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Domain Guide Tags */}
          <div className="mt-5 flex items-center justify-center gap-2 text-text-muted">
            <CheckCircle2 size={14} className="text-success" />
            <span className="text-xs font-semibold">Otentikasi Google OAuth 2.0 Aktif (Bebas Domain)</span>
          </div>
        </div>
      </main>

      {/* Grounding Footer with Essential Direct Links */}
      <footer className="relative z-20 w-full px-6 sm:px-8 py-6 text-center text-text-muted flex flex-col md:flex-row items-center justify-between gap-4 max-w-5xl mx-auto text-xs font-medium">
        <div>
          &copy; 2025 VetaBite &bull; UPN &quot;Veteran&quot; Jakarta. Seluruh hak cipta dilindungi
          undang-undang.
        </div>
        {/* Mandatory Footer Navigation Links */}
        <div className="flex items-center gap-5">
          <Link href="/login" className="hover:text-primary transition-colors">
            Portal Mahasiswa / Kantin
          </Link>
          <span className="text-border-subtle">&bull;</span>
          <button
            type="button"
            onClick={() => alert("Bantuan Akses Admin UPNVJ: Hubungi Biro Kemahasiswaan di kemahasiswaan@upnvj.ac.id")}
            className="hover:text-primary transition-colors flex items-center gap-1"
          >
            <HelpCircle size={13} />
            <span>Bantuan Akses</span>
          </button>
          <span className="text-border-subtle">&bull;</span>
          <Link href="/" className="hover:text-primary transition-colors flex items-center gap-1">
            <ArrowLeft size={13} />
            <span>Kembali ke Beranda</span>
          </Link>
        </div>
      </footer>
    </div>
  );
}
