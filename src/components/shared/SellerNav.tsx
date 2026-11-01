"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Receipt, Store, BarChart3, ShieldCheck } from "lucide-react";

const NAV = [
  { href: "/seller/pesanan", label: "Pesanan", Icon: Receipt },
  { href: "/seller/status-toko", label: "Status & Menu", Icon: Store },
  { href: "/seller/statistika", label: "Statistika", Icon: BarChart3 },
  { href: "/seller/banned", label: "Diblokir", Icon: ShieldCheck },
];

export function SellerNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Seller Bottom Navigation"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-2.5rem)] max-w-[390px] z-50 pointer-events-none"
    >
      <div className="pointer-events-auto w-full py-1.5 px-3 rounded-full liquid-dock flex items-center justify-around shadow-lg border border-border-specular">
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
              <div className="relative flex items-center justify-center">
                <Icon className="w-5 h-5 mb-0.5" strokeWidth={isActive ? 2.5 : 1.75} />
                {item.href === "/seller/banned" && (
                  <span className="absolute -top-0.5 -right-1 w-2 h-2 rounded-full bg-danger ring-1 ring-white" />
                )}
              </div>
              <span className="text-[10px] tracking-tight font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}