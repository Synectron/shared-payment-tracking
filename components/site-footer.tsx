"use client";

import { cn } from "@/lib/utils";

export function SiteFooter({ className }: { className?: string }) {
  return (
    <footer
      className={cn(
        "mt-auto border-t border-border/60 bg-background/80",
        className
      )}
    >
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-center gap-2 px-4 py-5 text-center sm:flex-row sm:gap-3">
        <span
          className="settora-spin inline-block size-3.5 shrink-0 rounded-full border-2 border-primary/25 border-t-primary"
          aria-hidden
        />
        <p className="text-[11px] leading-relaxed text-muted-foreground sm:text-xs">
          Property of{" "}
          <span className="font-medium text-foreground/80">Opus Kiln</span>
          {" · "}
          made with love by{" "}
          <span className="font-medium text-foreground/80">Shubham</span>
        </p>
      </div>
    </footer>
  );
}
