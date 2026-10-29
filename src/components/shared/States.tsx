"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";

export function SkeletonList({ n = 3 }: { n?: number }) {
  return (
    <div className="flex flex-col gap-3.5">
      {Array.from({ length: n }).map((_, i) => (
        <div
          key={i}
          style={{ animationDelay: `${i * 120}ms` }}
          className="liquid-glass-card rounded-[22px] p-4 flex items-center gap-4 border border-border-specular shadow-sm transition-smooth"
        >
          {/* Thumbnail Skeleton */}
          <div className="w-20 h-20 rounded-2xl liquid-shimmer shrink-0" />

          {/* Text & Content Skeleton */}
          <div className="flex-1 min-w-0 space-y-2.5">
            <div className="h-4 w-3/4 rounded-lg liquid-shimmer" />
            <div className="h-3 w-1/2 rounded-md liquid-shimmer" />
            <div className="flex items-center gap-2 pt-1">
              <div className="h-5 w-16 rounded-full liquid-shimmer" />
              <div className="h-5 w-20 rounded-full liquid-shimmer" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="liquid-glass-card rounded-[24px] p-8 text-center flex flex-col items-center gap-3.5 border border-border-specular shadow-sm">
      <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center text-text-muted border border-border-specular/60">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
          <line x1="8" y1="11" x2="14" y2="11" />
        </svg>
      </div>
      <div className="max-w-xs space-y-1">
        <p className="font-extrabold text-base text-on-surface">{title}</p>
        <p className="text-body-sm text-text-muted text-xs leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

export function ErrorState({ msg, onRetry }: { msg: string; onRetry: () => void }) {
  const isAuth =
    /hak akses|unauthorized|forbidden|masuk terlebih dahulu|tidak memiliki/i.test(msg);

  return (
    <div className="liquid-glass-card rounded-[24px] p-6 text-center flex flex-col items-center gap-3.5 border border-danger/30 bg-danger/5 shadow-sm">
      <div className="w-12 h-12 rounded-2xl bg-danger/10 border border-danger/25 flex items-center justify-center text-danger">
        <AlertTriangle className="w-6 h-6" />
      </div>
      <div className="space-y-1">
        <p className="font-bold text-sm text-on-surface">
          {isAuth ? "Akses Dibatasi" : "Terjadi Kendala"}
        </p>
        <p className="text-xs text-text-muted max-w-sm">
          {isAuth
            ? "Akun Anda saat ini tidak memiliki izin untuk melihat halaman ini. Silakan masuk dengan akun yang sesuai atau kembali ke beranda."
            : msg}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 mt-1">
        {isAuth ? (
          <>
            <a
              href="/login"
              className="px-4 py-2 rounded-full cta-gradient-btn text-white text-xs font-bold shadow-md transition-all active:scale-95 flex items-center gap-1.5"
            >
              <span>Ganti Akun</span>
            </a>
            <a
              href="/dashboard"
              className="px-4 py-2 rounded-full bg-white hover:bg-surface-container text-on-surface text-xs font-bold border border-border-specular shadow-sm transition-all active:scale-95 flex items-center gap-1.5"
            >
              <span>Ke Beranda</span>
            </a>
          </>
        ) : (
          <button
            onClick={onRetry}
            type="button"
            className="px-5 py-2 rounded-full bg-white hover:bg-surface-container text-on-surface text-xs font-bold border border-border-specular shadow-sm transition-all flex items-center gap-1.5 active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Coba Lagi</span>
          </button>
        )}
      </div>
    </div>
  );
}
