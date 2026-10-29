"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, ShoppingBag, History, User } from "lucide-react";

const items = [
  { href: "/dashboard", icon: Home, label: "Home" },
  { href: "/search", icon: Search, label: "Cari" },
  { href: "/keranjang", icon: ShoppingBag, label: "Keranjang" },
  { href: "/riwayat", icon: History, label: "Riwayat" },
  { href: "/profil", icon: User, label: "Profil" },
];

export function BottomDock() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Bottom Navigation"
      className="fixed bottom-0 left-0 right-0 z-50 max-w-[430px] mx-auto px-space-lg pb-space-lg pointer-events-none"
    >
      <div className="pointer-events-auto w-full py-2 px-3 rounded-full liquid-glass-dock flex items-center justify-around shadow-xl border border-border-specular">
        {items.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center px-2 py-1 spring-tap ${
                isActive ? "text-primary font-bold scale-105" : "text-text-muted hover:text-primary font-medium"
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" strokeWidth={isActive ? 2.5 : 1.75} />
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}