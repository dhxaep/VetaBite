import type { ReactNode } from "react";
import { BottomDock } from "@/components/shared/BottomDock";

export default function MhsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex justify-center bg-background-base sm:py-4">
      <div className="w-full max-w-[430px] min-h-screen sm:min-h-[880px] relative flex flex-col bg-background-base overflow-x-hidden ambient-underglow pb-margin-dock sm:rounded-[46px] sm:border-[5px] sm:border-surface-glass-alt sm:shadow-2xl">
        {children}
        <BottomDock />
      </div>
    </div>
  );
}
