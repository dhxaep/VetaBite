"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShieldCheck,
  BarChart3,
  MessageSquareWarning,
  Store,
  Settings,
  LogOut,
  Download,
  HelpCircle,
  Bell,
  Contrast,
  ChevronRight,
  Sparkles,
} from "lucide-react";

const NAV = [
  {
    href: "/admin/verifikasi",
    label: "Verifikasi Kantin",
    Icon: ShieldCheck,
    badge: "Mitra Baru",
  },
  {
    href: "/admin/stats",
    label: "Statistika Pemakaian",
    Icon: BarChart3,
  },
  {
    href: "/admin/komplain",
    label: "Komplain User",
    Icon: MessageSquareWarning,
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const getPageInfo = () => {
    if (pathname.includes("/admin/verifikasi")) {
      return {
        section: "Manajemen Mitra Loket",
        title: "Verifikasi & Manajemen Akun Kantin",
      };
    }
    if (pathname.includes("/admin/stats")) {
      return {
        section: "Analitik Platform",
        title: "Statistika Pemakaian & Jam Sibuk",
      };
    }
    if (pathname.includes("/admin/komplain")) {
      return {
        section: "Pusat Resolusi Layanan",
        title: "Resolusi Komplain & Tiket Pengguna",
      };
    }
    return {
      section: "Admin Console",
      title: "Dashboard Administrator",
    };
  };

  const pageInfo = getPageInfo();

  return (
    <div className="relative min-h-screen bg-background-base text-on-surface antialiased selection:bg-primary-fixed selection:text-primary">
      {/* Ambient Background Lighting Mesh */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-32 left-64 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[140px]" />
        <div className="absolute top-1/2 -right-40 w-[550px] h-[550px] bg-warning/10 rounded-full blur-[160px]" />
        <div className="absolute -bottom-40 left-1/3 w-[700px] h-[700px] bg-secondary-container/10 rounded-full blur-[180px]" />
      </div>

      <div className="relative z-10 flex min-h-screen">
        {/* 1. LEFT FIXED SIDEBAR */}
        <aside className="fixed top-0 left-0 h-screen w-72 rounded-r-3xl border-r border-border-specular shadow-2xl z-40 liquid-glass-sidebar">
          <div className="flex flex-col justify-between h-full p-6 overflow-y-auto no-scrollbar">
            {/* Brand & Identity */}
            <div>
              <div className="flex items-center gap-3.5 px-2 pb-6 border-b border-border-subtle">
                <div className="w-12 h-12 rounded-2xl p-1 bg-white/90 shadow-md flex items-center justify-center border border-border-specular overflow-hidden shrink-0">
                  <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-container flex items-center justify-center text-white font-black text-xl shadow-inner">
                    VB
                  </span>
                </div>
                <div>
                  <h1 className="text-xl font-extrabold text-primary tracking-tight">
                    VetaBite <span className="text-on-surface font-semibold text-sm">Admin</span>
                  </h1>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                    <p className="text-xs text-text-muted">UPN Veteran Jakarta</p>
                  </div>
                </div>
              </div>

              {/* Scope Disclaimer Badge */}
              <div className="mt-4 px-3 py-2 rounded-xl bg-surface-container/70 border border-outline-variant/40 flex items-center gap-2">
                <Store size={18} className="text-primary shrink-0" />
                <span className="text-[10px] text-on-surface-variant font-bold leading-tight uppercase tracking-wider">
                  Khusus Manajemen Mitra Loket Kantin
                </span>
              </div>

              {/* Navigation Links */}
              <nav className="mt-6 flex flex-col gap-2">
                {NAV.map((n) => {
                  const isActive = pathname === n.href || (n.href !== "/admin" && pathname.startsWith(n.href));
                  return (
                    <Link
                      key={n.href}
                      href={n.href}
                      className={`flex items-center gap-3 px-4 py-3 rounded-full transition-all duration-150 ${
                        isActive
                          ? "bg-gradient-to-r from-primary to-primary-container text-on-primary font-bold shadow-md scale-[0.98]"
                          : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high font-semibold"
                      }`}
                    >
                      <n.Icon size={20} />
                      <span className="text-sm tracking-tight flex-1">{n.label}</span>
                      {n.badge && !isActive && (
                        <span className="px-2 py-0.5 rounded-full bg-warning/20 text-on-tertiary-fixed-variant text-[10px] font-extrabold">
                          {n.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Sidebar Footer */}
            <div className="flex flex-col gap-3 pt-4 border-t border-border-subtle">
              {/* Quick Actions */}
              <div className="flex flex-col gap-1">
                <Link
                  href="/admin/verifikasi"
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-on-surface-variant hover:bg-surface-container text-xs font-semibold transition-colors"
                >
                  <Settings size={16} />
                  <span>Pengaturan Sistem</span>
                </Link>
                <Link
                  href="/login"
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-secondary hover:bg-error-container/40 text-xs font-semibold transition-colors"
                >
                  <LogOut size={16} />
                  <span>Keluar</span>
                </Link>
              </div>

              {/* Admin Profile Pill */}
              <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-surface-container-low border border-border-specular">
                <div className="w-9 h-9 rounded-full ring-2 ring-primary/20 bg-primary-fixed flex items-center justify-center text-primary font-bold text-sm shrink-0">
                  ADM
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-on-surface truncate">Admin Kantin UPNVJ</p>
                  <p className="text-[10px] text-text-muted truncate">admin.kantin@upnvj.ac.id</p>
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-success ring-4 ring-white shrink-0" />
              </div>
            </div>
          </div>
        </aside>

        {/* 2. MAIN CONTENT AREA */}
        <main className="flex-1 ml-72 min-h-screen flex flex-col pb-16">
          {/* TOP APP BAR */}
          <header className="sticky top-0 h-20 border-b border-border-specular z-30 liquid-glass-header flex justify-between items-center px-8">
            {/* Left: Breadcrumbs & Title */}
            <div>
              <div className="flex items-center gap-2 text-text-muted text-xs uppercase tracking-wider font-semibold">
                <span>Admin Console</span>
                <ChevronRight size={13} />
                <span className="text-primary font-bold">{pageInfo.section}</span>
              </div>
              <h2 className="text-xl font-extrabold text-on-surface tracking-tight mt-0.5">
                {pageInfo.title}
              </h2>
            </div>

            {/* Right Action Cluster */}
            <div className="flex items-center gap-3">
              {/* Server Status Badge */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/90 border border-border-specular shadow-sm">
                <span className="w-2 h-2 rounded-full bg-success animate-ping" />
                <span className="text-xs text-on-surface font-semibold">
                  Server UPNVJ Siaga 100%
                </span>
              </div>

              {/* Secondary Help Action */}
              <button
                type="button"
                onClick={() => alert("Pusat Bantuan Admin UPN Veteran Jakarta aktif 24/7.")}
                className="px-4 py-2 rounded-full bg-white/80 hover:bg-surface-container text-on-surface text-xs font-bold border border-border-specular shadow-sm transition-all flex items-center gap-1.5 active:scale-95"
              >
                <HelpCircle size={15} />
                <span>Bantuan</span>
              </button>

              {/* Primary Report Download Action */}
              <button
                type="button"
                onClick={() => alert("Mengunduh rekapitulasi laporan transaksi admin...")}
                className="btn-liquid-terracotta px-4 py-2 rounded-full text-white text-xs font-bold flex items-center gap-2 active:scale-95 transition-all shadow-md"
              >
                <Download size={15} />
                <span>Unduh Laporan</span>
              </button>

              {/* Action Icons */}
              <div className="flex items-center gap-1.5 pl-2 border-l border-border-subtle">
                <button
                  type="button"
                  aria-label="Notifikasi"
                  className="w-9 h-9 rounded-full bg-white/70 hover:bg-white flex items-center justify-center text-on-surface transition-colors shadow-sm relative active:scale-95 border border-border-specular"
                >
                  <Bell size={17} />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary ring-2 ring-white" />
                </button>
              </div>
            </div>
          </header>

          {/* DASHBOARD BODY CONTAINER */}
          <div className="p-8 max-w-[1440px] w-full mx-auto space-y-7">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
