"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { LaptopIcon, MoonIcon, SunIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PendingSubmitButton } from "@/components/pending-submit-button";
import { PersonAvatar } from "@/components/person-avatar";
import { PwaInstallButton } from "@/components/pwa";
import { Spinner } from "@/components/spinner";
import {
  signOut,
  signOutEverywhere,
  updatePassword,
  updateProfile,
} from "@/lib/actions";
import type { MyProfile } from "@/lib/data";
import { cn } from "@/lib/utils";

const THEMES = [
  { value: "light", label: "Light", icon: SunIcon },
  { value: "dark", label: "Dark", icon: MoonIcon },
  { value: "system", label: "System", icon: LaptopIcon },
] as const;

const noopSubscribe = () => () => {};

export function ProfileView({ profile }: { profile: MyProfile }) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <PersonAvatar
          person={{ id: "me", name: profile.name || profile.email, color: "" }}
          className="size-12 text-xl"
        />
        <div className="min-w-0">
          <h1 className="font-heading text-3xl tracking-tight">Profile</h1>
          <p className="truncate text-sm text-muted-foreground">
            {profile.email}
          </p>
        </div>
      </div>

      <DetailsCard profile={profile} />
      <PasswordCard />
      <PreferencesCard />
      <AccountCard />
    </div>
  );
}

function DetailsCard({ profile }: { profile: MyProfile }) {
  const router = useRouter();
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function onSubmit(formData: FormData) {
    setSaving(true);
    setStatus("");
    setError("");
    const result = await updateProfile(formData);
    setSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setStatus("Saved");
    router.refresh();
  }

  return (
    <Card>
      <CardContent className="space-y-3 pt-4">
        <div>
          <p className="text-sm font-medium">Your details</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Your name shows on spends and balances. Everyone in your groups sees
            your UPI ID or phone so they can pay you back.
          </p>
        </div>
        <form action={onSubmit} className="space-y-3">
          <div className="grid gap-1.5">
            <Label htmlFor="profile-name">Name</Label>
            <Input
              id="profile-name"
              name="name"
              required
              maxLength={40}
              defaultValue={profile.name}
              autoComplete="name"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="profile-upi">UPI ID</Label>
              <Input
                id="profile-upi"
                name="upi_id"
                defaultValue={profile.upiId}
                placeholder="name@okaxis"
                autoComplete="off"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="profile-phone">Phone</Label>
              <Input
                id="profile-phone"
                name="phone"
                type="tel"
                defaultValue={profile.phone}
                placeholder="+91…"
                autoComplete="tel"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button type="submit" size="sm" disabled={saving}>
              {saving ? (
                <>
                  <Spinner className="text-primary-foreground" />
                  Saving…
                </>
              ) : (
                "Save details"
              )}
            </Button>
            {status ? <p className="text-sm text-primary">{status}</p> : null}
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </form>
      </CardContent>
    </Card>
  );
}

function PasswordCard() {
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function onSubmit(formData: FormData) {
    setStatus("");
    setError("");
    if (formData.get("password") !== formData.get("confirm")) {
      setError("Passwords don't match.");
      return;
    }
    setSaving(true);
    const result = await updatePassword(formData);
    setSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setStatus("Password saved. Use it with your email next time you sign in.");
  }

  return (
    <Card>
      <CardContent className="space-y-3 pt-4">
        <div>
          <p className="text-sm font-medium">Password</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Set or change the password you sign in with. If you&apos;ve only
            used email links so far, this adds a password to your account.
          </p>
        </div>
        <form action={onSubmit} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="profile-password">New password</Label>
              <Input
                id="profile-password"
                name="password"
                type="password"
                required
                minLength={8}
                placeholder="At least 8 characters"
                autoComplete="new-password"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="profile-confirm">Confirm password</Label>
              <Input
                id="profile-confirm"
                name="confirm"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>
          </div>
          <Button type="submit" size="sm" disabled={saving}>
            {saving ? (
              <>
                <Spinner className="text-primary-foreground" />
                Saving…
              </>
            ) : (
              "Save password"
            )}
          </Button>
          {status ? <p className="text-sm text-primary">{status}</p> : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </form>
      </CardContent>
    </Card>
  );
}

function PreferencesCard() {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  );

  return (
    <Card>
      <CardContent className="space-y-4 pt-4">
        <div className="space-y-2">
          <p className="text-sm font-medium">Theme</p>
          <div className="grid grid-cols-3 gap-1 rounded-lg bg-muted p-1 text-sm">
            {THEMES.map(({ value, label, icon: Icon }) => {
              const active = mounted && theme === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTheme(value)}
                  aria-pressed={active}
                  className={cn(
                    "inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 font-medium transition-colors",
                    active
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="size-3.5" />
                  {label}
                </button>
              );
            })}
          </div>
        </div>
        <div className="space-y-2 border-t pt-4">
          <p className="text-sm font-medium">App</p>
          <p className="text-xs text-muted-foreground">
            Install Settora on your phone or desktop for one-tap access.
          </p>
          <PwaInstallButton />
        </div>
      </CardContent>
    </Card>
  );
}

function AccountCard() {
  return (
    <Card>
      <CardContent className="space-y-3 pt-4">
        <p className="text-sm font-medium">Account</p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/">Your groups</Link>
          </Button>
          <form action={signOut}>
            <PendingSubmitButton size="sm" pendingLabel="Signing out…">
              Sign out
            </PendingSubmitButton>
          </form>
          <form action={signOutEverywhere}>
            <PendingSubmitButton
              size="sm"
              variant="outline"
              pendingLabel="Signing out…"
            >
              Sign out on all devices
            </PendingSubmitButton>
          </form>
        </div>
        <p className="text-xs text-muted-foreground">
          Signing out on all devices ends every session, including installed
          apps on other phones.
        </p>
      </CardContent>
    </Card>
  );
}
