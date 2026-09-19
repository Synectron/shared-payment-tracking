"use client";

import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  CreditCardIcon,
  LayoutDashboardIcon,
  PlusIcon,
  ReceiptIcon,
  UsersIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDialogs } from "@/components/dialogs-provider";
import { PwaInstallButton } from "@/components/pwa";
import { SiteFooter } from "@/components/site-footer";
import { Spinner } from "@/components/spinner";
import { ThemeToggle } from "@/components/theme-toggle";
import { useLedger } from "@/lib/ledger-store";
import { cn } from "@/lib/utils";
import type { GroupSummary } from "@/lib/types";

export function AppShell({
  children,
  groups,
}: {
  children: React.ReactNode;
  groups: GroupSummary[];
}) {
  const pathname = usePathname();
  const params = useParams<{ groupId: string }>();
  const router = useRouter();
  const groupId = params.groupId;
  const { state, reminders, currentUser, pending } = useLedger();
  const { openAddExpense } = useDialogs();
  const isMonthlyTab = state.trackingMode === "monthly_tab";
  const addSpendLabel = isMonthlyTab ? "Add spend" : "New spend";
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  useEffect(() => {
    for (const href of [
      `/g/${groupId}`,
      `/g/${groupId}/expenses`,
      `/g/${groupId}/cards`,
      `/g/${groupId}/people`,
    ]) {
      router.prefetch(href);
    }
  }, [groupId, router]);

  const nav = [
    { href: `/g/${groupId}`, label: "Home", icon: LayoutDashboardIcon, exact: true },
    {
      href: `/g/${groupId}/expenses`,
      label: isMonthlyTab ? "Tab" : "Spends",
      icon: ReceiptIcon,
    },
    { href: `/g/${groupId}/cards`, label: "Sources", icon: CreditCardIcon },
    { href: `/g/${groupId}/people`, label: "People", icon: UsersIcon },
  ];

  const tabNavigating = pendingHref != null && pendingHref !== pathname;

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground font-heading text-sm">
              Tw
            </span>
            <span className="font-heading text-lg leading-none">Settora</span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {nav.map((item) => {
              const active = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);
              const navigating = pendingHref === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch
                  onClick={() => {
                    if (!active) setPendingHref(item.href);
                  }}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-sm transition-opacity",
                    active
                      ? "bg-muted font-medium text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                    navigating && "opacity-70"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-2">
            {pending || tabNavigating ? (
              <Spinner
                className="size-3.5 opacity-80"
                label={tabNavigating ? "Loading tab" : "Saving changes"}
              />
            ) : null}
            {groups.length > 0 ? (
              <Select
                value={groupId}
                onValueChange={(id) => router.push(`/g/${id}`)}
              >
                <SelectTrigger className="h-8 w-[8.5rem] sm:w-44">
                  <SelectValue placeholder="Group" />
                </SelectTrigger>
                <SelectContent>
                  {groups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}
            <ThemeToggle />
            <Button className="hidden sm:inline-flex" onClick={openAddExpense}>
              <PlusIcon />
              {addSpendLabel}
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 pb-24 md:pb-8">
        {reminders.length > 0 && pathname !== `/g/${groupId}` && (
          <p className="mb-4 text-sm">
            <Link
              href={`/g/${groupId}`}
              prefetch
              className="font-medium text-destructive underline-offset-4 hover:underline"
            >
              {reminders.length} missed payment
              {reminders.length === 1 ? "" : "s"} need a reminder
            </Link>
          </p>
        )}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            {state.groupName}
            {currentUser ? ` · signed in as ${currentUser.name}` : ""}
          </p>
          <PwaInstallButton className="hidden sm:block" />
        </div>
        <div
          className={cn(
            "transition-opacity duration-150",
            tabNavigating && "opacity-60"
          )}
        >
          {children}
        </div>
      </main>

      <div className="mx-auto w-full max-w-5xl px-4 pb-2 sm:hidden">
        <PwaInstallButton />
      </div>

      <SiteFooter className="pb-20 md:pb-0" />

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        <div className="grid grid-cols-5 px-1 py-1">
          {nav.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            const navigating = pendingHref === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch
                onClick={() => {
                  if (!active) setPendingHref(item.href);
                }}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-lg py-1.5 text-[11px] transition-opacity",
                  active ? "text-foreground" : "text-muted-foreground",
                  navigating && "opacity-70"
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={openAddExpense}
            className="flex flex-col items-center gap-0.5 rounded-lg py-1.5 text-[11px] text-foreground"
          >
            <span className="grid size-5 place-items-center rounded-full bg-primary text-primary-foreground">
              <PlusIcon className="size-3" />
            </span>
            Add
          </button>
        </div>
      </nav>
    </div>
  );
}
