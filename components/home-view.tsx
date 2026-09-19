"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { BalanceCards } from "@/components/balance-cards";
import { ExpenseCard } from "@/components/expense-card";
import { RemindersPanel } from "@/components/reminders-panel";
import { useDialogs } from "@/components/dialogs-provider";
import { Button } from "@/components/ui/button";
import { useLedger } from "@/lib/ledger-store";

export function HomeView() {
  const { state } = useLedger();
  const { groupId } = useParams<{ groupId: string }>();
  const { requestMarkPaid, requestSettle, openAddExpense } = useDialogs();
  const recent = [...state.expenses]
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
    .slice(0, 4);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">{state.groupName}</p>
          <h1 className="font-heading text-3xl tracking-tight">
            Group spends
          </h1>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Create a spend when you pay (party, dinner, trip). You become the
            receiver — friends claim paybacks, you approve.
          </p>
        </div>
        <Button className="sm:hidden" onClick={openAddExpense}>
          New spend
        </Button>
      </div>

      <RemindersPanel onMarkPaid={requestMarkPaid} />
      <BalanceCards onSettle={requestSettle} />

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg">Recent spends</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/g/${groupId}/expenses`}>See all</Link>
          </Button>
        </div>
        {recent.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No spends yet. Create one after you pay for the group.
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
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
