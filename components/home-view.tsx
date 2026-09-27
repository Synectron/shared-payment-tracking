"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { BalanceCards } from "@/components/balance-cards";
import { ExpenseCard } from "@/components/expense-card";
import { FlowTip } from "@/components/flow-tip";
import { MonthPeriodPanel } from "@/components/month-period-panel";
import { MonthlyTabPanel } from "@/components/monthly-tab-panel";
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
          <h1 className="font-heading text-3xl tracking-tight">Group spends</h1>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Paid for the group? Log it as a one-off spend or put it on the
            monthly tab. Settle before the month ends.
          </p>
        </div>
        <Button className="sm:hidden" onClick={openAddExpense}>
          New spend
        </Button>
      </div>

      <FlowTip title="Spends and the monthly tab">
        <p>
          One-off spends split however you choose: equally, or members add
          their own shares. Shared running costs go on the group&apos;s monthly
          tab, split equally and cleared at month end. Claims still need the
          creator&apos;s approval.
        </p>
      </FlowTip>

      <MonthlyTabPanel />
      <MonthPeriodPanel />

      <RemindersPanel onMarkPaid={requestMarkPaid} />
      <BalanceCards onSettle={requestSettle} />

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg">
            Recent spends
          </h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/g/${groupId}/expenses`}>See all</Link>
          </Button>
        </div>
        {recent.length === 0 ? (
          <div className="rounded-xl border border-dashed px-4 py-8 text-center space-y-2">
            <p className="font-medium">
              No spends yet
            </p>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Invite a friend on People, then log dinner, trips or shared
              groceries as you go. Settle the month before it ends. UPI details
              are on People too.
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
