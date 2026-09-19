"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { DownloadIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type PwaContextValue = {
  canInstall: boolean;
  isInstalled: boolean;
  isIos: boolean;
  install: () => Promise<void>;
};

const PwaContext = createContext<PwaContextValue | null>(null);

function isStandaloneDisplay(): boolean {
  if (typeof window === "undefined") return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    nav.standalone === true
  );
}

function isIosDevice(): boolean {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(ua)) return true;
  // iPadOS 13+ can report as Mac
  return (
    window.navigator.platform === "MacIntel" &&
    window.navigator.maxTouchPoints > 1
  );
}

/** Registers the service worker and captures `beforeinstallprompt` early. */
export function PwaProvider({ children }: { children: ReactNode }) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null
  );
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    setIsInstalled(isStandaloneDisplay());
    setIsIos(isIosDevice());

    if (!("serviceWorker" in navigator)) return;

    const isLocal =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    if (process.env.NODE_ENV !== "production" && !isLocal) return;

    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
      // Silent: install still works once SW is available on HTTPS.
    });
  }, []);

  useEffect(() => {
    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setIsInstalled(true);
      setDeferred(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === "accepted") setIsInstalled(true);
    setDeferred(null);
  }

  return (
    <PwaContext.Provider
      value={{
        canInstall: Boolean(deferred),
        isInstalled,
        isIos,
        install,
      }}
    >
      {children}
    </PwaContext.Provider>
  );
}

function usePwa() {
  const ctx = useContext(PwaContext);
  if (!ctx) {
    throw new Error("usePwa must be used within PwaProvider");
  }
  return ctx;
}

/** Visible Install Settora control — Chrome prompt or iOS Add to Home Screen tip. */
export function PwaInstallButton({ className }: { className?: string }) {
  const { canInstall, isInstalled, isIos, install } = usePwa();
  const [showIosTip, setShowIosTip] = useState(false);
  const [chromeHint, setChromeHint] = useState(false);

  if (isInstalled) return null;

  if (isIos) {
    return (
      <div className={cn("space-y-2", className)}>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowIosTip((v) => !v)}
        >
          <DownloadIcon />
          Install Settora
        </Button>
        {showIosTip ? (
          <p className="text-xs text-muted-foreground">
            On iPhone or iPad: tap{" "}
            <span className="font-medium text-foreground">Share</span>, then{" "}
            <span className="font-medium text-foreground">
              Add to Home Screen
            </span>
            .
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => {
          if (canInstall) {
            void install();
            return;
          }
          setChromeHint(true);
        }}
      >
        <DownloadIcon />
        Install Settora
      </Button>
      {chromeHint && !canInstall ? (
        <p className="text-xs text-muted-foreground">
          Chrome hasn&apos;t offered install yet. Look for the install icon in
          the address bar, or refresh after browsing Settora a bit, then try
          again.
        </p>
      ) : null}
    </div>
  );
}
