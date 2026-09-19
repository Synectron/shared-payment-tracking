"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useDialogs } from "@/components/dialogs-provider";
import {
  monthBalancesForPerson,
  monthSpendTotal,
  personById,
} from "@/lib/ledger";
import { useLedger } from "@/lib/ledger-store";
import { formatMoney } from "@/lib/money";
import {
  currentMonthKey,
  formatMonthLabel,
  isCurrentMonth,
  settleCountdownLabel,
  shiftMonth,
  type MonthKey,
} from "@/lib/month";

export function MonthPeriodPanel() {
  const { state } = useLedger();
  const { requestSettle } = useDialogs();
  const isMonthlyTab = state.trackingMode === "monthly_tab";
  const active = currentMonthKey();
  const [monthKey, setMonthKey] = useState<MonthKey>(active);
  const viewingCurrent = isCurrentMonth(monthKey, active);

  const totalSpent = monthSpendTotal(state, monthKey);
  const balances = monthBalancesForPerson(
    state,
    monthKey,
    state.currentUserId
  );
  const yourPairs = balances.pairs.filter(
    (pair) =>
      pair.fromId === state.currentUserId || pair.toId === state.currentUserId
  );
  const youOwePairs = yourPairs.filter(
    (pair) => pair.fromId === state.currentUserId
  );

  function goPrev() {
    setMonthKey((current) => shiftMonth(current, -1));
  }

  function goNext() {
    const next = shiftMonth(monthKey, 1);
    if (next <= active) setMonthKey(next);
  }

  function settleMonth() {
    if (youOwePairs.length === 0) return;
    const top = [...youOwePairs].sort(
      (a, b) => b.amountCents - a.amountCents
    )[0];
    requestSettle(top.toId, monthKey);
  }

  return (
    <Card>
      <CardHeader className="gap-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle className="font-heading text-xl tracking-tight">
              {isMonthlyTab
                ? `Tab · ${formatMonthLabel(monthKey)}`
                : formatMonthLabel(monthKey)}
            </CardTitle>
            <CardDescription className="mt-1">
              {viewingCurrent
                ? isMonthlyTab
                  ? "Running account for the month. Add spends as you go, then clear the tab."
                  : "Keep logging spends. Settle before the month ends."
                : isMonthlyTab
                  ? "Past month, summary only. You can still clear leftover claims."
                  : "Past month, summary only. Open shares still settle the usual way."}
            </CardDescription>
          </div>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              size="xs"
              variant="outline"
              onClick={goPrev}
              aria-label="Previous month"
            >
              ←
            </Button>
            <Button
              type="button"
              size="xs"
              variant="outline"
              onClick={goNext}
              disabled={monthKey >= active}
              aria-label="Next month"
            >
              →
            </Button>
          </div>
        </div>
        {viewingCurrent ? (
          <p className="text-xs text-muted-foreground">
            {settleCountdownLabel(monthKey, undefined, {
              monthlyTab: isMonthlyTab,
            })}
          </p>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <p className="text-xs text-muted-foreground">
              {isMonthlyTab ? "On the tab" : "Total spent"}
            </p>
            <p className="font-heading text-lg tabular-nums">
              {formatMoney(totalSpent, state.currency)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">You still owe</p>
            <p className="font-heading text-lg tabular-nums">
              {formatMoney(balances.youOwe, state.currency)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Owed to you</p>
            <p className="font-heading text-lg tabular-nums">
              {formatMoney(balances.owedToYou, state.currency)}
            </p>
          </div>
        </div>

        {yourPairs.length > 0 ? (
          <ul className="space-y-1.5 text-sm">
            {yourPairs.map((pair) => {
              const from = personById(state.people, pair.fromId);
              const to = personById(state.people, pair.toId);
              return (
                <li
                  key={`${monthKey}-${pair.fromId}-${pair.toId}`}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2"
                >
                  <span>
                    <span className="font-medium">{from?.name}</span> owes{" "}
                    <span className="font-medium">{to?.name}</span>{" "}
                    <span className="tabular-nums font-semibold">
                      {formatMoney(pair.amountCents, state.currency)}
                    </span>
                  </span>
                  {viewingCurrent && pair.fromId === state.currentUserId ? (
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => requestSettle(pair.toId, monthKey)}
                    >
                      {isMonthlyTab ? "Clear" : "Settle"}
                    </Button>
                  ) : null}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            {totalSpent === 0
              ? viewingCurrent
                ? isMonthlyTab
                  ? "Nothing on the tab yet. Invite a partner or friend on People, log what you pay, and clear before month end."
                  : "No spends this month yet. Invite a friend on People, log what you pay, and settle before month end."
                : "No spends logged this month."
              : isMonthlyTab
                ? "This month’s tab is even. Nothing left to clear."
                : "This month’s shares are even. Nothing left to settle."}
          </p>
        )}

        {viewingCurrent && youOwePairs.length > 0 ? (
          <Button onClick={settleMonth} className="w-full sm:w-auto">
            {isMonthlyTab ? "Clear month / Close tab" : "Settle this month"}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
