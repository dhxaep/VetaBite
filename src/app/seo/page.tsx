"use client";

import { useState, useEffect, useRef, FormEvent, ChangeEvent } from "react";
import Link from "next/link";
import {
  Search,
  Globe,
  Upload,
  Save,
  RefreshCw,
  ShieldCheck,
  ExternalLink,
  LogOut,
  Sparkles,
  Lock,
  User,
  AlertCircle,
  CheckCircle2,
  FileImage,
  Share2,
} from "lucide-react";
import { api } from "@/lib/api";

interface SeoData {
  title: string;
  description: string;
  keywords: string;
  author: string;
  faviconUrl: string;
  thumbnailUrl: string;
  ogImageUrl: string;
  twitterHandle: string;
  canonicalUrl: string;
}

interface CurrentUser {
  id: string;
  username: string;
  full_name: string;
  role: string;
}

const DEFAULT_SEO: SeoData = {
  title: "VetaBite - Portal Kantin UPN Veteran Jakarta",
  description: "Platform Pemesanan & Antrean Cerdas Kantin UPNVJ Tanpa Antre. Pesan makanan online, bayar digital, ambil tanpa antre.",
  keywords: "VetaBite, Kantin UPN, UPNVJ, Pesan Makanan Online, Antrean Digital, Kantin Digital, UPN Veteran Jakarta, Smart Queue, Food Ordering",
  author: "VetaBite Team",
  faviconUrl: "/LOGO.jpeg",
  thumbnailUrl: "/LOGO.jpeg",
  ogImageUrl: "/LOGO.jpeg",
  twitterHandle: "@vetabite",
  canonicalUrl: "https://vetabite.my.id",
};

export default function SeoPanelPage() {
  // Auth state
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [adminUser, setAdminUser] = useState<CurrentUser | null>(null);

  // Login form state
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  // SEO Form state
  const [seoData, setSeoData] = useState<SeoData>(DEFAULT_SEO);
  const [loadingSeo, setLoadingSeo] = useState(false);
  const [savingSeo, setSavingSeo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const faviconInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    checkAdminAuth();
  }, []);

  const checkAdminAuth = async () => {
    try {
      setCheckingAuth(true);
      const res = await api<{ user: CurrentUser }>("/api/auth/me");
      if (res?.user && res.user.role === "ADMIN") {
        setAdminUser(res.user);
        await loadSeoSettings();
      } else {
        setAdminUser(null);
      }
    } catch {
      setAdminUser(null);
    } finally {
      setCheckingAuth(false);
    }
  };

  const handleAdminLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);

    try {
      const res = await api<{ user: CurrentUser }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          username: loginUsername.trim(),
          password: loginPassword,
        }),
      });

      if (!res?.user || res.user.role !== "ADMIN") {
        setLoginError("Akses ditolak: Akun ini bukan administrator.");
        return;
      }

      setAdminUser(res.user);
      await loadSeoSettings();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal masuk. Periksa username dan password.";
      setLoginError(msg);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.warn("Logout error:", err);
    }
    setAdminUser(null);
    setLoginUsername("");
    setLoginPassword("");
  };

  const loadSeoSettings = async () => {
    try {
      setLoadingSeo(true);
      const res = await api<SeoData>("/api/admin/settings/seo");
      if (res) {
        setSeoData({
          title: res.title || DEFAULT_SEO.title,
          description: res.description || DEFAULT_SEO.description,
          keywords: res.keywords || DEFAULT_SEO.keywords,
          author: res.author || DEFAULT_SEO.author,
          faviconUrl: res.faviconUrl || DEFAULT_SEO.faviconUrl,
          thumbnailUrl: res.thumbnailUrl || res.ogImageUrl || DEFAULT_SEO.thumbnailUrl,
          ogImageUrl: res.ogImageUrl || res.thumbnailUrl || DEFAULT_SEO.ogImageUrl,
          twitterHandle: res.twitterHandle || DEFAULT_SEO.twitterHandle,
          canonicalUrl: res.canonicalUrl || DEFAULT_SEO.canonicalUrl,
        });
      }
    } catch (err) {
      console.error("Gagal memuat SEO:", err);
      showFeedback("Gagal memuat pengaturan SEO dari database.", "error");
    } finally {
      setLoadingSeo(false);
    }
  };

  const showFeedback = (text: string, type: "success" | "error") => {
    setFeedback({ text, type });
    setTimeout(() => {
      setFeedback(null);
    }, 4500);
  };

  const handleFieldChange = (field: keyof SeoData, val: string) => {
    setSeoData((prev) => {
      const updated = { ...prev, [field]: val };
      if (field === "thumbnailUrl" && !prev.ogImageUrl) {
        updated.ogImageUrl = val;
      } else if (field === "ogImageUrl" && !prev.thumbnailUrl) {
        updated.thumbnailUrl = val;
      }
      return updated;
    });
  };

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>, kind: "favicon" | "thumbnail") => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isFavicon = kind === "favicon";
    if (isFavicon) setUploadingFavicon(true);
    else setUploadingThumbnail(true);

    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("kind", isFavicon ? "favicon" : "og-thumbnail");

      const res = await fetch("/api/uploads/seo", {
        method: "POST",
        body: fd,
      });

      const json = await res.json();
      if (!res.ok || !json.data?.fileUrl) {
        throw new Error(json.error?.message || "Gagal mengunggah file gambar.");
      }

      const uploadedUrl = json.data.fileUrl;
      if (isFavicon) {
        handleFieldChange("faviconUrl", uploadedUrl);
        showFeedback("Favicon berhasil diunggah dan diperbarui.", "success");
      } else {
        handleFieldChange("thumbnailUrl", uploadedUrl);
        handleFieldChange("ogImageUrl", uploadedUrl);
        showFeedback("Meta Thumbnail berhasil diunggah dan diperbarui.", "success");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat upload gambar.";
      showFeedback(msg, "error");
    } finally {
      if (isFavicon) setUploadingFavicon(false);
      else setUploadingThumbnail(false);
      e.target.value = "";
    }
  };

  const handleSaveSeo = async (e: FormEvent) => {
    e.preventDefault();
    setSavingSeo(true);

    try {
      const res = await api<{ success: boolean; message: string }>("/api/admin/settings/seo", {
        method: "POST",
        body: JSON.stringify(seoData),
      });

      showFeedback(res?.message || "Pengaturan SEO dan Favicon berhasil disimpan ke database.", "success");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menyimpan pengaturan SEO.";
      showFeedback(msg, "error");
    } finally {
      setSavingSeo(false);
    }
  };

  const handleResetToDefault = () => {
    setSeoData(DEFAULT_SEO);
    showFeedback("Pengaturan SEO di-reset ke konfigurasi awal.", "success");
  };

  // 1. Loading screen saat cek auth
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-background-base flex items-center justify-center p-6 text-on-surface">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-primary animate-spin" />
          <p className="font-headline-md font-semibold text-text-muted">Memeriksa hak akses Administrator...</p>
        </div>
      </div>
    );
  }

  // 2. Layar Login jika belum authenticated sebagai ADMIN
  if (!adminUser) {
    return (
      <div className="min-h-screen bg-background-base flex items-center justify-center p-4 md:p-6 text-on-surface">
        <div className="w-full max-w-md bg-surface-glass-alt backdrop-blur-2xl border border-border-specular rounded-[28px] p-6 md:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

          {/* Header Login */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-2xl cta-gradient p-1 mx-auto shadow-md mb-4 flex items-center justify-center">
              <img src="/LOGO.jpeg" alt="Logo VetaBite" className="w-full h-full object-cover rounded-xl" />
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-primary/10 text-primary border border-primary/20 mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              Portal Khusus Administrator
            </span>
            <h1 className="font-headline-lg text-2xl font-extrabold text-on-surface tracking-tight">
              Panel Pengaturan SEO
            </h1>
            <p className="text-xs text-text-muted mt-1">
              Masuk dengan akun Admin untuk mengelola Meta Tag, Favicon, dan Thumbnail VetaBite.
            </p>
          </div>

          {loginError && (
            <div className="mb-4 p-3 rounded-xl bg-error/10 border border-error/20 text-error text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          {/* Form Login Kredensial */}
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-text-muted mb-1.5">
                Username / Email Administrator
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="text"
                  required
                  placeholder="admin@upnvj.ac.id"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  className="w-full pl-10 pr-3.5 h-11 rounded-xl liquid-glass-input text-xs font-medium text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 border border-border-specular"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-text-muted mb-1.5">
                Kata Sandi Administrator
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="password"
                  required
                  placeholder="Masukkan kata sandi..."
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full pl-10 pr-3.5 h-11 rounded-xl liquid-glass-input text-xs font-medium text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 border border-border-specular"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full h-11 rounded-xl cta-gradient text-white font-bold text-xs shadow-md hover:brightness-105 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loginLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              <span>Masuk ke Panel SEO</span>
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-5 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border-specular" />
            </div>
            <span className="relative bg-surface px-3 text-[10px] text-text-muted font-bold uppercase tracking-wider">
              atau via Google Admin SSO
            </span>
          </div>

          {/* Google SSO Login */}
          <a
            href="/api/auth/admin/google/login?returnTo=/seo"
            className="w-full h-11 rounded-xl bg-white/80 dark:bg-white/10 hover:bg-white border border-border-specular text-on-surface font-semibold text-xs shadow-sm flex items-center justify-center gap-2.5 transition-all active:scale-[0.98]"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Masuk via Google SSO (Kembali ke /seo)</span>
          </a>

          <div className="mt-6 pt-4 border-t border-border-specular text-center">
            <Link
              href="/"
              className="text-[11px] text-primary hover:underline font-semibold inline-flex items-center gap-1"
            >
              <ExternalLink className="w-3 h-3" />
              Kembali ke Beranda VetaBite
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 3. Layar Panel SEO untuk Admin
  return (
    <div className="min-h-screen bg-background-base text-on-surface p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Sticky Header Nav Panel */}
        <header className="sticky top-4 z-40 bg-surface-glass-alt backdrop-blur-2xl border border-border-specular rounded-2xl p-4 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl cta-gradient p-0.5 shadow-sm overflow-hidden flex-shrink-0">
              <img src={seoData.faviconUrl || "/LOGO.jpeg"} alt="Favicon" className="w-full h-full object-cover rounded-lg" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-headline-md text-base font-extrabold text-on-surface tracking-tight">
                  Panel Pengaturan SEO &amp; Favicon
                </h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  Mandiri / Standalone
                </span>
              </div>
              <p className="text-[11px] text-text-muted">
                Admin Aktif: <strong className="text-on-surface">{adminUser.full_name || adminUser.username}</strong> ({adminUser.role})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              target="_blank"
              className="px-3 py-1.5 rounded-xl liquid-glass-input text-xs font-semibold flex items-center gap-1.5 hover:text-primary transition-all shadow-sm"
              title="Buka Website"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Lihat Web</span>
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-xl border border-border-specular text-xs font-semibold text-text-muted hover:text-error hover:border-error/30 transition-all flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar</span>
            </button>
          </div>
        </header>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-3.5 rounded-2xl text-xs font-medium border flex items-center gap-2.5 transition-all shadow-sm ${
              feedback.type === "success"
                ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-800 dark:text-emerald-300"
                : "bg-error/15 border-error/30 text-error"
            }`}
          >
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-error" />
            )}
            <span>{feedback.text}</span>
          </div>
        )}

        {/* Main Content Grid: Form (Left) & Live Previews (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: FORM SETTINGS (7 COLS) */}
          <form onSubmit={handleSaveSeo} className="lg:col-span-7 space-y-6">
            {/* CARD 1: FAVICON & ICON IDENTITAS */}
            <div className="bg-surface-glass-alt backdrop-blur-xl border border-border-specular rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-border-specular pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <h2 className="font-headline-md text-sm font-extrabold text-on-surface">
                    1. Favicon &amp; Ikon Tab Browser
                  </h2>
                </div>
                <span className="text-[10px] text-text-muted font-bold">Rekomendasi: 192x192 atau .ico / .png</span>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4 pt-1">
                <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-border-specular bg-white/50 flex items-center justify-center p-1 overflow-hidden shadow-inner flex-shrink-0 relative">
                  <img
                    src={seoData.faviconUrl || "/LOGO.jpeg"}
                    alt="Favicon Preview"
                    className="w-full h-full object-cover rounded-xl"
                  />
                  {uploadingFavicon && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    </div>
                  )}
                </div>

                <div className="flex-1 w-full space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={seoData.faviconUrl}
                      onChange={(e) => handleFieldChange("faviconUrl", e.target.value)}
                      placeholder="/LOGO.jpeg atau https://..."
                      className="flex-1 h-9 px-3 rounded-xl liquid-glass-input text-xs font-mono text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 border border-border-specular"
                    />
                    <input
                      type="file"
                      ref={faviconInputRef}
                      onChange={(e) => handleFileUpload(e, "favicon")}
                      accept="image/png,image/jpeg,image/x-icon,image/svg+xml,image/webp,.ico"
                      className="hidden"
                    />
                    <button
                      type="button"
                      disabled={uploadingFavicon}
                      onClick={() => faviconInputRef.current?.click()}
                      className="h-9 px-3 rounded-xl cta-gradient text-white text-xs font-bold shadow-sm hover:brightness-105 active:scale-95 transition-all flex items-center gap-1.5 flex-shrink-0"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Unggah</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-text-muted">
                    Favicon akan muncul di tab browser pengguna dan bookmark bar.
                  </p>
                </div>
              </div>
            </div>

            {/* CARD 2: META THUMBNAIL (OPEN GRAPH & TWITTER CARD) */}
            <div className="bg-surface-glass-alt backdrop-blur-xl border border-border-specular rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-border-specular pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <Share2 className="w-4 h-4" />
                  </div>
                  <h2 className="font-headline-md text-sm font-extrabold text-on-surface">
                    2. Meta Thumbnail &amp; Share Preview (OG Image)
                  </h2>
                </div>
                <span className="text-[10px] text-text-muted font-bold">Rasio 1.91:1 (1200 x 630 px)</span>
              </div>

              <div className="space-y-3 pt-1">
                <div className="relative aspect-[1200/630] w-full rounded-xl overflow-hidden border border-border-specular bg-neutral-900/10 flex items-center justify-center">
                  <img
                    src={seoData.thumbnailUrl || seoData.ogImageUrl || "/LOGO.jpeg"}
                    alt="OG Thumbnail Preview"
                    className="w-full h-full object-cover"
                  />
                  {uploadingThumbnail && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white gap-2 text-xs font-bold">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Mengunggah Thumbnail...</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={seoData.thumbnailUrl}
                    onChange={(e) => {
                      handleFieldChange("thumbnailUrl", e.target.value);
                      handleFieldChange("ogImageUrl", e.target.value);
                    }}
                    placeholder="/LOGO.jpeg atau URL Gambar Thumbnail"
                    className="flex-1 h-9 px-3 rounded-xl liquid-glass-input text-xs font-mono text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 border border-border-specular"
                  />
                  <input
                    type="file"
                    ref={thumbnailInputRef}
                    onChange={(e) => handleFileUpload(e, "thumbnail")}
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                  />
                  <button
                    type="button"
                    disabled={uploadingThumbnail}
                    onClick={() => thumbnailInputRef.current?.click()}
                    className="h-9 px-3 rounded-xl cta-gradient text-white text-xs font-bold shadow-sm hover:brightness-105 active:scale-95 transition-all flex items-center gap-1.5 flex-shrink-0"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Unggah Gambar</span>
                  </button>
                </div>
                <p className="text-[11px] text-text-muted">
                  Gambar ini otomatis muncul saat tautan <code>vetabite.my.id</code> dibagikan di WhatsApp, Twitter/X, Telegram, LinkedIn, dan Facebook.
                </p>
              </div>
            </div>

            {/* CARD 3: CORE SEO (TITLE, DESCRIPTION, KEYWORDS) */}
            <div className="bg-surface-glass-alt backdrop-blur-xl border border-border-specular rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-border-specular pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <Search className="w-4 h-4" />
                  </div>
                  <h2 className="font-headline-md text-sm font-extrabold text-on-surface">
                    3. Metadata Search Engine (Google SEO)
                  </h2>
                </div>
                <span className="text-[10px] text-primary font-bold">Terindeks Otomatis</span>
              </div>

              <div className="space-y-4 pt-1">
                {/* Title */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-on-surface">
                      Judul Website (Title Tag)
                    </label>
                    <span className={`text-[10px] font-mono ${seoData.title.length > 70 ? "text-error font-bold" : "text-text-muted"}`}>
                      {seoData.title.length} / 60 karakter disarankan
                    </span>
                  </div>
                  <input
                    type="text"
                    required
                    value={seoData.title}
                    onChange={(e) => handleFieldChange("title", e.target.value)}
                    placeholder="VetaBite - Portal Kantin UPN Veteran Jakarta"
                    className="w-full h-10 px-3 rounded-xl liquid-glass-input text-xs font-semibold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 border border-border-specular"
                  />
                </div>

                {/* Description */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-on-surface">
                      Deskripsi Website (Meta Description)
                    </label>
                    <span className={`text-[10px] font-mono ${seoData.description.length > 160 ? "text-amber-500 font-bold" : "text-text-muted"}`}>
                      {seoData.description.length} / 155 karakter disarankan
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    required
                    value={seoData.description}
                    onChange={(e) => handleFieldChange("description", e.target.value)}
                    placeholder="Deskripsi singkat portal untuk hasil pencarian Google..."
                    className="w-full p-3 rounded-xl liquid-glass-input text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 border border-border-specular resize-none"
                  />
                </div>

                {/* Keywords */}
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">
                    Kata Kunci (Keywords dipisahkan tanda koma)
                  </label>
                  <input
                    type="text"
                    value={seoData.keywords}
                    onChange={(e) => handleFieldChange("keywords", e.target.value)}
                    placeholder="VetaBite, Kantin UPN, UPNVJ, Pesan Makanan Online..."
                    className="w-full h-10 px-3 rounded-xl liquid-glass-input text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 border border-border-specular"
                  />
                </div>

                {/* Grid 2 Columns: Canonical URL & Twitter Handle */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-on-surface mb-1">
                      URL Kanonikal (Canonical URL)
                    </label>
                    <input
                      type="text"
                      value={seoData.canonicalUrl}
                      onChange={(e) => handleFieldChange("canonicalUrl", e.target.value)}
                      placeholder="https://vetabite.my.id"
                      className="w-full h-9 px-3 rounded-xl liquid-glass-input text-xs font-mono text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 border border-border-specular"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-on-surface mb-1">
                      Twitter / X Handle
                    </label>
                    <input
                      type="text"
                      value={seoData.twitterHandle}
                      onChange={(e) => handleFieldChange("twitterHandle", e.target.value)}
                      placeholder="@vetabite"
                      className="w-full h-9 px-3 rounded-xl liquid-glass-input text-xs font-mono text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 border border-border-specular"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleResetToDefault}
                className="px-4 py-2.5 rounded-xl border border-border-specular text-xs font-semibold text-text-muted hover:text-on-surface hover:bg-white/40 transition-all"
              >
                Reset ke Default
              </button>

              <button
                type="submit"
                disabled={savingSeo}
                className="px-6 py-2.5 rounded-xl cta-gradient text-white font-bold text-xs shadow-md hover:brightness-105 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {savingSeo ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Simpan Pengaturan SEO</span>
              </button>
            </div>
          </form>

          {/* RIGHT COLUMN: LIVE REAL-TIME PREVIEWS (5 COLS) */}
          <div className="lg:col-span-5 space-y-6">
            {/* PREVIEW 1: MOCKUP TAB BROWSER CHROME DENGAN FAVICON */}
            <div className="bg-surface-glass-alt backdrop-blur-xl border border-border-specular rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-text-muted">
                <FileImage className="w-4 h-4 text-primary" />
                <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider">
                  Pratinjau Tab Browser (Favicon)
                </h3>
              </div>

              {/* Chrome Browser Tab Mockup */}
              <div className="rounded-xl overflow-hidden border border-border-specular bg-neutral-200 dark:bg-neutral-800 p-2 pt-2.5 shadow-inner">
                <div className="flex items-center gap-2 max-w-[240px] bg-white dark:bg-neutral-900 px-3 py-1.5 rounded-t-lg shadow-sm border-t border-x border-border-specular text-xs">
                  <img
                    src={seoData.faviconUrl || "/LOGO.jpeg"}
                    alt="Tab Favicon"
                    className="w-4 h-4 rounded-sm object-cover flex-shrink-0"
                  />
                  <span className="font-semibold text-[11px] truncate text-on-surface">
                    {seoData.title || "VetaBite"}
                  </span>
                  <span className="ml-auto text-[10px] text-text-muted">x</span>
                </div>
                <div className="bg-white dark:bg-neutral-900 h-6 rounded-b-md px-3 flex items-center text-[10px] text-text-muted font-mono border-t border-border-specular">
                  <span>{seoData.canonicalUrl || "https://vetabite.my.id"}</span>
                </div>
              </div>
            </div>

            {/* PREVIEW 2: MOCKUP GOOGLE SEARCH SNIPPET */}
            <div className="bg-surface-glass-alt backdrop-blur-xl border border-border-specular rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-text-muted">
                <Globe className="w-4 h-4 text-primary" />
                <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider">
                  Pratinjau Hasil Pencarian Google
                </h3>
              </div>

              {/* Google Result Card */}
              <div className="bg-white dark:bg-[#202124] rounded-xl p-4 border border-border-specular shadow-sm space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center p-0.5 overflow-hidden">
                    <img src={seoData.faviconUrl || "/LOGO.jpeg"} alt="Icon" className="w-full h-full object-cover rounded-full" />
                  </div>
                  <div>
                    <div className="text-[12px] font-semibold text-[#202124] dark:text-[#bdc1c6] leading-none">
                      VetaBite
                    </div>
                    <div className="text-[10px] text-[#4d5156] dark:text-[#9aa0a6] font-mono leading-none mt-0.5 truncate max-w-[260px]">
                      {seoData.canonicalUrl || "https://vetabite.my.id"}
                    </div>
                  </div>
                </div>

                <div className="text-[#1a0dab] dark:text-[#8ab4f8] text-sm font-semibold hover:underline cursor-pointer line-clamp-1 pt-1">
                  {seoData.title || "VetaBite - Portal Kantin UPN Veteran Jakarta"}
                </div>

                <div className="text-[12px] text-[#4d5156] dark:text-[#bdc1c6] line-clamp-2 leading-relaxed">
                  {seoData.description || "Platform Pemesanan & Antrean Cerdas Kantin UPNVJ Tanpa Antre..."}
                </div>
              </div>
            </div>

            {/* PREVIEW 3: MOCKUP KARTU MEDIA SOSIAL / WHATSAPP SHARE */}
            <div className="bg-surface-glass-alt backdrop-blur-xl border border-border-specular rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-text-muted">
                <Share2 className="w-4 h-4 text-primary" />
                <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider">
                  Pratinjau Berbagi Tautan (WhatsApp &amp; Medsos)
                </h3>
              </div>

              {/* Social Media Share Card */}
              <div className="rounded-xl overflow-hidden border border-border-specular bg-white dark:bg-neutral-900 shadow-md">
                <div className="aspect-[1200/630] w-full bg-neutral-800 relative">
                  <img
                    src={seoData.thumbnailUrl || seoData.ogImageUrl || "/LOGO.jpeg"}
                    alt="Social Card"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-3 space-y-1 bg-surface-container/60">
                  <div className="text-[10px] uppercase font-bold text-text-muted tracking-wider">
                    {seoData.canonicalUrl ? new URL(seoData.canonicalUrl).hostname : "vetabite.my.id"}
                  </div>
                  <div className="text-xs font-extrabold text-on-surface line-clamp-1">
                    {seoData.title || "VetaBite - Portal Kantin UPN Veteran Jakarta"}
                  </div>
                  <div className="text-[11px] text-text-muted line-clamp-2">
                    {seoData.description || "Platform Pemesanan & Antrean Cerdas Kantin UPNVJ..."}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

