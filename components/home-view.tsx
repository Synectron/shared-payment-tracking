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
import { currentMonthKey, formatClearBy } from "@/lib/month";

export function HomeView() {
  const { state } = useLedger();
  const { groupId } = useParams<{ groupId: string }>();
  const { requestMarkPaid, requestSettle, openAddExpense } = useDialogs();
  const isMonthlyTab = state.trackingMode === "monthly_tab";
  const monthKey = currentMonthKey();
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
            {isMonthlyTab ? "Your tab this month" : "Group spends"}
          </h1>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            {isMonthlyTab
              ? `Running month account. Log spends as they happen, then clear by ${formatClearBy(monthKey).replace(/^Clear by /, "")}.`
              : "Paid for the group? Log it. Keep going through the month, then settle before it ends."}
          </p>
        </div>
        <Button className="sm:hidden" onClick={openAddExpense}>
          {isMonthlyTab ? "Add spend" : "New spend"}
        </Button>
      </div>

      <FlowTip title={isMonthlyTab ? "Monthly tab" : "Monthly rhythm"}>
        {isMonthlyTab ? (
          <p>
            Invite your partner or friend on People. Everyone logs spends as
            they happen; equal split is automatic. Clear the tab before month
            end. Claims still need the creator&apos;s approval.
          </p>
        ) : (
          <p>
            Invite a friend on People. Members add spends as they happen.
            Before month end, settle what&apos;s still open. Claims still need
            approval.
          </p>
        )}
      </FlowTip>

      <MonthPeriodPanel />

      <RemindersPanel onMarkPaid={requestMarkPaid} />
      <BalanceCards onSettle={requestSettle} />

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg">
            {isMonthlyTab ? "Recent on the tab" : "Recent spends"}
          </h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/g/${groupId}/expenses`}>See all</Link>
          </Button>
        </div>
        {recent.length === 0 ? (
          <div className="rounded-xl border border-dashed px-4 py-8 text-center space-y-2">
            <p className="font-medium">
              {isMonthlyTab ? "Tab is empty" : "No spends yet"}
            </p>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              {isMonthlyTab
                ? "Invite a partner or friend on People, then log dinner or trips as you go. Clear the month before it ends. UPI details are on People too."
                : "Invite a friend on People, then log dinner or trips as you go. Settle the month before it ends. UPI details are on People too."}
            </p>
            <Button size="sm" onClick={openAddExpense}>
              {isMonthlyTab ? "Add spend" : "New spend"}
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
