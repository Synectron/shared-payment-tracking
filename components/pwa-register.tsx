"use client";

import { useEffect } from "react";

/** Registers the Settora service worker for installability (production + secure origins). */
export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    const isLocal =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    // Allow local testing; production always registers.
    if (process.env.NODE_ENV !== "production" && !isLocal) return;

    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
      // Silent: install still works once SW is available on HTTPS.
    });
  }, []);

  return null;
}
