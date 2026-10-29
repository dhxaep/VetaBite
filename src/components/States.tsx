"use client";

import { AlertTriangle, Inbox, RotateCcw } from "lucide-react";

export function LoadingList({ n = 3 }: { n?: number }) {
  return (
    <div className="flex flex-col gap-3.5">
      {Array.from({ length: n }).map((_, i) => (
        <div
          key={i}
          style={{ animationDelay: `${i * 120}ms` }}
          className="liquid-glass rounded-2xl p-4 flex items-center gap-4 border border-border-specular shadow-sm transition-smooth"
        >
          {/* Thumbnail Skeleton */}
          <div className="w-14 h-14 rounded-xl liquid-shimmer shrink-0" />

          {/* Text Skeletons */}
          <div className="flex-1 space-y-2.5">
            <div className="h-4 w-3/5 rounded-md liquid-shimmer" />
            <div className="h-3 w-2/5 rounded-md liquid-shimmer" />
          </div>

          {/* Action/Pill Skeleton */}
          <div className="h-7 w-16 rounded-full liquid-shimmer shrink-0" />
        </div>
      ))}
    </div>
  );
}

export function Empty({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="liquid-glass rounded-3xl p-8 flex flex-col items-center justify-center text-center gap-3 shadow-sm border border-border-specular">
      <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center text-text-muted border border-border-specular/60">
        <Inbox size={32} />
      </div>
      <div className="max-w-sm space-y-1">
        <h3 className="font-extrabold text-base text-on-surface">{title}</h3>
        <p className="text-xs text-text-muted leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

export function ErrorBox({ msg, onRetry }: { msg: string; onRetry: () => void }) {
  const isAuth =
    /hak akses|unauthorized|forbidden|masuk terlebih dahulu|tidak memiliki/i.test(msg);

  return (
    <div className="liquid-glass rounded-3xl p-8 flex flex-col items-center justify-center text-center gap-3.5 shadow-sm border border-danger/30 bg-danger/5">
      <div className="w-14 h-14 rounded-2xl bg-danger/10 border border-danger/25 flex items-center justify-center text-danger">
        <AlertTriangle size={28} />
      </div>
      <div className="max-w-md space-y-1">
        <h3 className="font-bold text-sm text-on-surface">
          {isAuth ? "Akses Dibatasi" : "Terjadi Kendala"}
        </h3>
        <p className="text-xs text-text-muted leading-relaxed">
          {isAuth
            ? "Akun Anda saat ini tidak memiliki izin untuk melihat halaman ini. Silakan masuk dengan akun yang sesuai atau kembali ke beranda."
            : msg}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
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
            type="button"
            onClick={onRetry}
            className="px-5 py-2 rounded-full bg-white hover:bg-surface-container text-on-surface text-xs font-bold border border-border-specular shadow-sm transition-all flex items-center gap-1.5 active:scale-95"
          >
            <RotateCcw size={14} />
            <span>Coba Lagi</span>
          </button>
        )}
      </div>
    </div>
  );
}

// Aliases for compatibility
export function SkeletonList({ n = 3 }: { n?: number }) {
  return <LoadingList n={n} />;
}

export function EmptyState({ title, desc }: { title: string; desc: string }) {
  return <Empty title={title} desc={desc} />;
}

export function ErrorState({ msg, onRetry }: { msg: string; onRetry: () => void }) {
  return <ErrorBox msg={msg} onRetry={onRetry} />;
}
