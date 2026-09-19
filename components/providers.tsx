"use client";

import { LedgerProvider } from "@/lib/ledger-store";
import { TooltipProvider } from "@/components/ui/tooltip";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      <LedgerProvider>{children}</LedgerProvider>
    </TooltipProvider>
  );
}
