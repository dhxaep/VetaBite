"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Receipt, Store, BarChart3, UserX } from "lucide-react";

const NAV = [
  { href: "/seller/pesanan", label: "Pesanan", Icon: Receipt },
  { href: "/seller/status-toko", label: "Status & Menu", Icon: Store },
  { href: "/seller/statistika", label: "Statistika", Icon: BarChart3 },
  { href: "/seller/banned", label: "Diblokir", Icon: UserX },
];

export function SellerNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Seller Bottom Navigation"
      className="fixed bottom-0 left-0 right-0 z-50 max-w-[430px] mx-auto px-space-lg pb-space-lg pointer-events-none"
    >
      <div className="pointer-events-auto w-full py-2 px-3 rounded-full liquid-glass-dock flex items-center justify-around shadow-xl border border-border-specular">
        {NAV.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.Icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center transition-colors px-2 py-1 ${
                isActive ? "text-primary font-bold" : "text-text-muted hover:text-primary font-medium"
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