import { Loader2Icon } from "lucide-react";
import { cn } from "@/lib/utils";

/** Compact teal spinner for real in-flight work — not decorative. */
export function Spinner({
  className,
  label = "Loading",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <Loader2Icon
      className={cn("size-4 animate-spin text-primary", className)}
      aria-label={label}
      role="status"
    />
  );
}
