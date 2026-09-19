import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Compact instructional note matching Settora tip styling. */
export function FlowTip({
  title,
  children,
  className,
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-xs text-muted-foreground",
        className
      )}
    >
      {title ? (
        <p className="font-medium text-foreground">{title}</p>
      ) : null}
      <div className={cn(title ? "mt-1 space-y-1" : "space-y-1")}>{children}</div>
    </div>
  );
}
