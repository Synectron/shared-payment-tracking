"use client";

import { useMemo, useState } from "react";
import { ExpenseCard } from "@/components/expense-card";
import { FlowTip } from "@/components/flow-tip";
import { MonthPeriodPanel } from "@/components/month-period-panel";
import { useDialogs } from "@/components/dialogs-provider";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { isExpenseSettled, isOverdue } from "@/lib/ledger";
import { useLedger } from "@/lib/ledger-store";
import { currentMonthKey, expenseInMonth } from "@/lib/month";

type Filter = "all" | "month" | "open" | "overdue" | "settled";

export function ExpensesView() {
  const { state } = useLedger();
  const { requestMarkPaid, openAddExpense } = useDialogs();
  const [filter, setFilter] = useState<Filter>("month");
  const thisMonth = currentMonthKey();

  const items = useMemo(() => {
    const sorted = [...state.expenses].sort((a, b) =>
      b.date.localeCompare(a.date)
    );
    return sorted.filter((expense) => {
      if (filter === "month") return expenseInMonth(expense, thisMonth);
      if (filter === "open") return !isExpenseSettled(expense);
      if (filter === "overdue") return isOverdue(expense);
      if (filter === "settled") return isExpenseSettled(expense);
      return true;
    });
  }, [state.expenses, filter, thisMonth]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl tracking-tight">Spends</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Log spends through the month. Settle open shares before month end —
            creators still approve claims.
          </p>
        </div>
        <Button onClick={openAddExpense}>New spend</Button>
      </div>

      <MonthPeriodPanel />

      <FlowTip title="Adding your share">
        <p>
          On an open bill, enter your amount and submit. It stays pending until
          the bill creator or group owner approves. After that, pay them via the
          UPI ID or phone on People, then Claim paid.
        </p>
        <p>
          Equal-split bills already have amounts. Just pay, claim, and wait for
          approval.
        </p>
      </FlowTip>

      <Tabs
        value={filter}
        onValueChange={(value) => setFilter(value as Filter)}
      >
        <TabsList>
          <TabsTrigger value="month">This month</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="open">Open</TabsTrigger>
          <TabsTrigger value="overdue">Overdue</TabsTrigger>
          <TabsTrigger value="settled">Settled</TabsTrigger>
        </TabsList>
      </Tabs>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed px-4 py-10 text-center space-y-2">
          <p className="font-medium">Nothing in this list</p>
          <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">
            {filter === "month"
              ? "No spends this month yet. Invite her, keep logging, settle before month end."
              : filter === "overdue"
                ? "No overdue shares. Check Open if people still owe."
                : filter === "settled"
                  ? "Nothing settled yet. Claims count after the creator approves."
                  : "Create a spend after you pay for the group. Pick equal split or let members add their own shares."}
          </p>
          {filter === "all" || filter === "open" || filter === "month" ? (
            <Button size="sm" onClick={openAddExpense}>
              New spend
            </Button>
          ) : null}
        </div>
      ) : (
        <div className="grid gap-3">
          {items.map((expense) => (
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
    </div>
  );
}
