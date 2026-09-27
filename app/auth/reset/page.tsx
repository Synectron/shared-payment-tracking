"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updatePassword } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SiteFooter } from "@/components/site-footer";
import { Spinner } from "@/components/spinner";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(formData: FormData) {
    if (formData.get("password") !== formData.get("confirm")) {
      setError("Passwords don't match.");
      return;
    }
    setPending(true);
    setError("");
    const result = await updatePassword(formData);
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.replace("/");
    router.refresh();
  }

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <div className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="w-full max-w-md space-y-6">
          <div>
            <p className="text-sm font-medium text-primary">Settora</p>
            <h1 className="font-heading text-3xl tracking-tight">
              Set a new password
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              You&apos;ll use it with your email to sign in from now on.
            </p>
          </div>
          <form action={onSubmit} className="space-y-4">
            <div className="grid gap-1.5">
              <Label htmlFor="password">New password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                placeholder="At least 8 characters"
                autoComplete="new-password"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="confirm">Confirm password</Label>
              <Input
                id="confirm"
                name="confirm"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? (
                <>
                  <Spinner className="text-primary-foreground" />
                  Saving…
                </>
              ) : (
                "Save password"
              )}
            </Button>
          </form>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
