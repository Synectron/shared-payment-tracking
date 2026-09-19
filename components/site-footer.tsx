import { cn } from "@/lib/utils";

export function SiteFooter({ className }: { className?: string }) {
  return (
    <footer
      className={cn(
        "mt-auto border-t border-primary/10 bg-muted/45",
        className
      )}
    >
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-center gap-2 px-4 py-5 text-center sm:flex-row sm:gap-3">
        <span
          className="inline-block size-2 shrink-0 rounded-full bg-primary/40 ring-2 ring-primary/15"
          aria-hidden
        />
        <p className="text-[11px] leading-relaxed text-muted-foreground sm:text-xs">
          Property of{" "}
          <a
            href="https://www.opuskiln.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary/75 underline-offset-2 hover:underline"
          >
            Opus Kiln
          </a>
          {" · "}
          made with love by{" "}
          <span className="font-medium text-primary/75">Shubham</span>
        </p>
      </div>
    </footer>
  );
}
