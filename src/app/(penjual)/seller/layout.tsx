import type { ReactNode } from "react";
import { SellerNav } from "@/components/shared/SellerNav";

export default function SellerLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex justify-center bg-background-base sm:py-4">
      <div className="relative w-full max-w-[430px] min-h-screen sm:min-h-[880px] bg-background-base flex flex-col shadow-2xl sm:rounded-[46px] sm:border-[5px] sm:border-surface-glass-alt overflow-x-hidden pb-margin-dock">
        {/* Ambient Warm Gradient Background Blobs */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-primary-fixed/40 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/4" />
        <div className="absolute top-96 right-0 w-80 h-80 bg-secondary-fixed/30 rounded-full blur-3xl pointer-events-none translate-x-1/3" />
        {children}
        <SellerNav />
      </div>
    </div>
  );
}
