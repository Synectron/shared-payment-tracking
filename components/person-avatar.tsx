import { cn } from "@/lib/utils";
import type { Person } from "@/lib/types";

export function PersonAvatar({
  person,
  size = "md",
  className,
}: {
  person?: Person;
  size?: "sm" | "md";
  className?: string;
}) {
  const initial = person?.name?.trim()?.[0]?.toUpperCase() ?? "?";
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-primary font-heading font-bold text-primary-foreground",
        size === "sm" ? "size-6 text-xs" : "size-8 text-base",
        className
      )}
      aria-hidden
    >
      {initial}
    </span>
  );
}
