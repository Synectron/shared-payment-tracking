"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { signInWithMagicLink } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SiteFooter } from "@/components/site-footer";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(formData: FormData) {
    setPending(true);
    setError("");
    formData.set("next", next);
    const result = await signInWithMagicLink(formData);
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setSent(true);
  }

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <div className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="w-full max-w-md space-y-6">
          <div>
            <p className="text-sm font-medium text-primary">Settora</p>
            <h1 className="font-heading text-3xl tracking-tight">Sign in</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              No password. We email you a one-time sign-in link.
            </p>
          </div>

          {sent ? (
            <div className="rounded-xl border bg-muted/40 px-4 py-5 text-sm">
              Check your inbox for the sign-in link. You can close this tab.
            </div>
          ) : (
            <form action={onSubmit} className="space-y-4">
              <div className="grid gap-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
              <Button type="submit" className="w-full" disabled={pending}>
                {pending ? "Sending…" : "Email me a link"}
              </Button>
            </form>
          )}
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
