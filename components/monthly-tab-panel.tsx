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
import { ledgerForTab, personById, tabBalancesForPerson } from "@/lib/ledger";
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

export function MonthlyTabPanel() {
  const { state } = useLedger();
  const { requestSettle, openAddToTab } = useDialogs();
  const active = currentMonthKey();
  const [monthKey, setMonthKey] = useState<MonthKey>(active);
  const viewingCurrent = isCurrentMonth(monthKey, active);

  const tabSpends = ledgerForTab(state, monthKey).expenses;
  const tabTotal = tabSpends.reduce((sum, e) => sum + e.amountCents, 0);
  const balances = tabBalancesForPerson(state, monthKey, state.currentUserId);
  const yourPairs = balances.pairs.filter(
    (pair) =>
      pair.fromId === state.currentUserId || pair.toId === state.currentUserId
  );
  const youOwePairs = yourPairs.filter(
    (pair) => pair.fromId === state.currentUserId
  );

  function goNext() {
    const next = shiftMonth(monthKey, 1);
    if (next <= active) setMonthKey(next);
  }

  function clearTab() {
    if (youOwePairs.length === 0) return;
    const top = [...youOwePairs].sort(
      (a, b) => b.amountCents - a.amountCents
    )[0];
    requestSettle(top.toId, monthKey, true);
  }

  return (
    <Card>
      <CardHeader className="gap-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle className="font-heading text-xl tracking-tight">
              Monthly tab · {formatMonthLabel(monthKey)}
            </CardTitle>
            <CardDescription className="mt-1">
              {viewingCurrent
                ? "The group's running account. Everyone shares tab spends equally; clear it before month end."
                : "Past month's tab. You can still clear leftover claims."}
            </CardDescription>
          </div>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              size="xs"
              variant="outline"
              onClick={() => setMonthKey((current) => shiftMonth(current, -1))}
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
            {settleCountdownLabel(monthKey, undefined, { monthlyTab: true })}
          </p>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <p className="text-xs text-muted-foreground">
              On the tab · {tabSpends.length}{" "}
              {tabSpends.length === 1 ? "spend" : "spends"}
            </p>
            <p className="font-heading text-lg tabular-nums">
              {formatMoney(tabTotal, state.currency)}
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
                  {pair.fromId === state.currentUserId ? (
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => requestSettle(pair.toId, monthKey, true)}
                    >
                      Clear
                    </Button>
                  ) : null}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            {tabTotal === 0
              ? viewingCurrent
                ? "Nothing on the tab yet. Add groceries, rent or anything the whole group shares."
                : "Nothing was on the tab this month."
              : "This month's tab is even. Nothing left to clear."}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          {viewingCurrent ? (
            <Button variant="outline" onClick={openAddToTab}>
              Add to tab
            </Button>
          ) : null}
          {youOwePairs.length > 0 ? (
            <Button onClick={clearTab}>Clear tab</Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
