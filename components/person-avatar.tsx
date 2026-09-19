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
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white",
        size === "sm" ? "size-6 text-[11px]" : "size-8 text-sm",
        className
      )}
      style={{ backgroundColor: person?.color ?? "#6B7280" }}
      aria-hidden
    >
      {initial}
    </span>
  );
}
