"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { BalanceCards } from "@/components/balance-cards";
import { ExpenseCard } from "@/components/expense-card";
import { FlowTip } from "@/components/flow-tip";
import { MonthPeriodPanel } from "@/components/month-period-panel";
import { RemindersPanel } from "@/components/reminders-panel";
import { useDialogs } from "@/components/dialogs-provider";
import { Button } from "@/components/ui/button";
import { useLedger } from "@/lib/ledger-store";

export function HomeView() {
  const { state } = useLedger();
  const { groupId } = useParams<{ groupId: string }>();
  const { requestMarkPaid, requestSettle, openAddExpense } = useDialogs();
  const recent = [...state.expenses]
    .sort(
      (a, b) =>
        b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)
    )
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
            Paid for the group? Log a spend. Keep adding through the month —
            settle before it ends.
          </p>
        </div>
        <Button className="sm:hidden" onClick={openAddExpense}>
          New spend
        </Button>
      </div>

      <FlowTip title="Monthly rhythm">
        <p>
          Invite her on People. She adds spends as they happen. Before month
          end, settle what&apos;s still open — claims still need approval.
        </p>
      </FlowTip>

      <MonthPeriodPanel />

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
          <div className="rounded-xl border border-dashed px-4 py-8 text-center space-y-2">
            <p className="font-medium">No spends yet</p>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Invite her on People, then log dinner or trips as you go. Settle
              the month before it ends — UPI details live on People too.
            </p>
            <Button size="sm" onClick={openAddExpense}>
              New spend
            </Button>
          </div>
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
