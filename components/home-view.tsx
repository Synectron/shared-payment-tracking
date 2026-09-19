"use client";

import Link from "next/link";
import { BalanceCards } from "@/components/balance-cards";
import { ExpenseCard } from "@/components/expense-card";
import { RemindersPanel } from "@/components/reminders-panel";
import { useDialogs } from "@/components/dialogs-provider";
import { Button } from "@/components/ui/button";
import { useLedger } from "@/lib/ledger-store";

export function HomeView() {
  const { state, markUnpaid } = useLedger();
  const { requestMarkPaid, requestSettle, openAddExpense } = useDialogs();
  const recent = [...state.expenses]
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
    .slice(0, 4);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Household tab</p>
          <h1 className="font-heading text-3xl tracking-tight">
            Who used whose card
          </h1>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Split the dinner, the ConEd hit, and the Costco run — then mark
            people paid before the reminder gets lost in the group chat.
          </p>
        </div>
        <Button className="sm:hidden" onClick={openAddExpense}>
          Log a charge
        </Button>
      </div>

      <RemindersPanel onMarkPaid={requestMarkPaid} />
      <BalanceCards onSettle={requestSettle} />

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg">Recent charges</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/expenses">See all</Link>
          </Button>
        </div>
        {recent.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No charges yet. Log the first card swipe or utility bill.
          </p>
        ) : (
          <div className="grid gap-3">
            {recent.map((expense) => (
              <ExpenseCard
                key={expense.id}
                expense={expense}
                people={state.people}
                sources={state.sources}
                onMarkPaid={requestMarkPaid}
                onMarkUnpaid={markUnpaid}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
