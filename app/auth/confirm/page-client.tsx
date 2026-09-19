"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AuthConfirmClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams.get("next") ?? "/";
  const next = nextParam.startsWith("/") ? nextParam : "/";
  const [message, setMessage] = useState("Finishing sign-in…");

  useEffect(() => {
    let cancelled = false;

    async function finish() {
      const supabase = createClient();
      const hash = window.location.hash.replace(/^#/, "");
      const params = new URLSearchParams(hash);
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (cancelled) return;
        if (error) {
          setMessage("Sign-in link expired. Request a new one.");
          router.replace("/login?error=auth");
          return;
        }
        window.history.replaceState(null, "", window.location.pathname);
        router.replace(next);
        router.refresh();
        return;
      }

      if (!cancelled) {
        setMessage("Sign-in link expired. Request a new one.");
        router.replace("/login?error=auth");
      }
    }

    void finish();
    return () => {
      cancelled = true;
    };
  }, [next, router]);

  return (
    <div className="flex min-h-full flex-1 items-center justify-center px-4 py-16">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
