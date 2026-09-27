"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  requestPasswordReset,
  signInWithMagicLink,
  signInWithPassword,
  signUpWithPassword,
} from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PwaInstallButton } from "@/components/pwa";
import { SiteFooter } from "@/components/site-footer";
import { Spinner } from "@/components/spinner";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

type Mode = "signin" | "signup" | "forgot" | "link";

const COPY: Record<
  Mode,
  { title: string; blurb: string; submit: string; pending: string }
> = {
  signin: {
    title: "Sign in",
    blurb: "Use your email and password.",
    submit: "Sign in",
    pending: "Signing in…",
  },
  signup: {
    title: "Create account",
    blurb: "Sign up with your email and a password. We'll email you to confirm.",
    submit: "Create account",
    pending: "Creating…",
  },
  forgot: {
    title: "Forgot password",
    blurb:
      "We'll email you a link to set a new password. Also works if you've only used email links so far.",
    submit: "Email me a reset link",
    pending: "Sending…",
  },
  link: {
    title: "Sign in with a link",
    blurb: "No password. We email you a one-time sign-in link.",
    submit: "Email me a link",
    pending: "Sending…",
  },
};

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [sentMessage, setSentMessage] = useState("");
  const [error, setError] = useState(
    searchParams.get("error") === "auth"
      ? "That link has expired or was already used. Try again."
      : ""
  );
  const [pending, setPending] = useState(false);
  const copy = COPY[mode];

  function switchMode(nextMode: Mode) {
    setMode(nextMode);
    setError("");
    setSentMessage("");
  }

  async function onSubmit(formData: FormData) {
    setPending(true);
    setError("");
    formData.set("next", next);
    try {
      if (mode === "signin") {
        const result = await signInWithPassword(formData);
        if (result.error) return setError(result.error);
        router.replace(result.next ?? "/");
        router.refresh();
        return;
      }
      if (mode === "signup") {
        const result = await signUpWithPassword(formData);
        if (result.error) return setError(result.error);
        if ("next" in result && result.next) {
          router.replace(result.next);
          router.refresh();
          return;
        }
        setSentMessage(
          `We sent a confirmation link to ${email}. Open it to finish signing up.`
        );
        return;
      }
      if (mode === "forgot") {
        const result = await requestPasswordReset(formData);
        if (result.error) return setError(result.error);
        setSentMessage(
          `If ${email} has an account, a reset link is on its way. Open it to set your password.`
        );
        return;
      }
      const result = await signInWithMagicLink(formData);
      if (result.error) return setError(result.error);
      setSentMessage("Check your inbox for the sign-in link. You can close this tab.");
    } finally {
      setPending(false);
    }
  }

  const showPassword = mode === "signin" || mode === "signup";

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <div className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="w-full max-w-md space-y-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-primary">Settora</p>
              <h1 className="font-heading text-3xl tracking-tight">
                {copy.title}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">{copy.blurb}</p>
            </div>
            <ThemeToggle />
          </div>

          <PwaInstallButton />

          {mode === "signin" || mode === "signup" ? (
            <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1 text-sm">
              {(["signin", "signup"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => switchMode(option)}
                  className={cn(
                    "rounded-md px-3 py-1.5 font-medium transition-colors",
                    mode === option
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {option === "signin" ? "Sign in" : "Create account"}
                </button>
              ))}
            </div>
          ) : null}

          {sentMessage ? (
            <div className="space-y-3 rounded-xl border bg-muted/40 px-4 py-5 text-sm">
              <p>{sentMessage}</p>
              <Button
                type="button"
                variant="link"
                className="h-auto p-0"
                onClick={() => switchMode("signin")}
              >
                Back to sign in
              </Button>
            </div>
          ) : (
            <form action={onSubmit} className="space-y-4">
              {mode === "signup" ? (
                <div className="grid gap-1.5">
                  <Label htmlFor="name">Your name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="What friends call you"
                    autoComplete="name"
                  />
                </div>
              ) : null}
              <div className="grid gap-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>
              {showPassword ? (
                <div className="grid gap-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    {mode === "signin" ? (
                      <button
                        type="button"
                        onClick={() => switchMode("forgot")}
                        className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                      >
                        Forgot password?
                      </button>
                    ) : null}
                  </div>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                    minLength={mode === "signup" ? 8 : undefined}
                    placeholder={mode === "signup" ? "At least 8 characters" : ""}
                    autoComplete={
                      mode === "signup" ? "new-password" : "current-password"
                    }
                  />
                </div>
              ) : null}
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
              <Button type="submit" className="w-full" disabled={pending}>
                {pending ? (
                  <>
                    <Spinner className="text-primary-foreground" />
                    {copy.pending}
                  </>
                ) : (
                  copy.submit
                )}
              </Button>
            </form>
          )}

          <div className="text-center text-sm text-muted-foreground">
            {mode === "link" || mode === "forgot" ? (
              <button
                type="button"
                onClick={() => switchMode("signin")}
                className="underline-offset-2 hover:text-foreground hover:underline"
              >
                Sign in with password
              </button>
            ) : (
              <button
                type="button"
                onClick={() => switchMode("link")}
                className="underline-offset-2 hover:text-foreground hover:underline"
              >
                Email me a sign-in link instead
              </button>
            )}
          </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
