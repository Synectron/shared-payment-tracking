"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
import { PersonAvatar } from "@/components/person-avatar";
import { useDialogs } from "@/components/dialogs-provider";
import { useLedger } from "@/lib/ledger-store";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Home", icon: LayoutDashboardIcon },
  { href: "/expenses", label: "Charges", icon: ReceiptIcon },
  { href: "/cards", label: "Cards", icon: CreditCardIcon },
  { href: "/people", label: "People", icon: UsersIcon },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { ready, state, currentUser, setCurrentUserId, reminders } = useLedger();
  const { openAddExpense } = useDialogs();

  if (!ready) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        Opening the household tab…
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground font-heading text-sm">
              Tw
            </span>
            <span className="font-heading text-lg leading-none">Tabwise</span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-sm",
                    active
                      ? "bg-muted font-medium text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-2">
            <Select value={state.currentUserId} onValueChange={setCurrentUserId}>
              <SelectTrigger className="h-8 w-[8.5rem] sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {state.people.map((person) => (
                  <SelectItem key={person.id} value={person.id}>
                    <span className="flex items-center gap-2">
                      <PersonAvatar person={person} size="sm" />
                      {person.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button className="hidden sm:inline-flex" onClick={openAddExpense}>
              <PlusIcon />
              Log charge
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 pb-24 md:pb-8">
        {reminders.length > 0 && pathname !== "/" && (
          <p className="mb-4 text-sm">
            <Link href="/" className="font-medium text-destructive underline-offset-4 hover:underline">
              {reminders.length} missed payment{reminders.length === 1 ? "" : "s"} need a reminder
            </Link>
          </p>
        )}
        {children}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        <div className="grid grid-cols-5 px-1 py-1">
          {NAV.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-lg py-1.5 text-[11px]",
                  active ? "text-foreground" : "text-muted-foreground"
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
      <span className="sr-only">Viewing as {currentUser?.name}</span>
    </div>
  );
}
