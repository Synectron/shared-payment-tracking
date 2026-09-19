"use client";

import { BellIcon, CopyIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PersonAvatar } from "@/components/person-avatar";
import { nudgeText, personById, sourceById } from "@/lib/ledger";
import { useLedger } from "@/lib/ledger-store";
import { formatMoney } from "@/lib/money";
import type { PaidTarget } from "@/components/mark-paid-dialog";

export function RemindersPanel({
  onMarkPaid,
}: {
  onMarkPaid: (target: PaidTarget) => void;
}) {
  const { reminders, state } = useLedger();

  if (reminders.length === 0) {
    return (
      <Alert>
        <BellIcon />
        <AlertTitle>No missed payments</AlertTitle>
        <AlertDescription>
          Everyone who owes on a past-due charge has settled or claimed. New due
          dates still show on each expense.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="border-destructive/30 bg-[color-mix(in_oklch,var(--destructive),white_92%)]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BellIcon className="size-4" />
          {reminders.length} missed{" "}
          {reminders.length === 1 ? "payment" : "payments"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm text-muted-foreground">
          These shares passed their due date. Claim paid when the money lands
          (receiver must approve), or copy a reminder.
        </p>
        <ul className="space-y-2">
          {reminders.map((reminder) => {
            const debtor = personById(state.people, reminder.share.personId);
            const source = sourceById(state.sources, reminder.expense.sourceId);
            return (
              <li
                key={`${reminder.expense.id}-${reminder.share.personId}`}
                className="flex flex-col gap-2 rounded-lg bg-background/80 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-start gap-2 min-w-0">
                  <PersonAvatar person={debtor} size="sm" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      {debtor?.name} still owes{" "}
                      {formatMoney(reminder.share.amountCents, state.currency)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {reminder.expense.title}
                      {source ? ` · ${source.name}` : ""} ·{" "}
                      {reminder.daysOverdue}{" "}
                      {reminder.daysOverdue === 1 ? "day" : "days"} overdue
                    </p>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <Button
                    size="xs"
                    onClick={() =>
                      onMarkPaid({
                        expenseId: reminder.expense.id,
                        personId: reminder.share.personId,
                      })
                    }
                  >
                    Claim paid
                  </Button>
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() =>
                      navigator.clipboard.writeText(
                        nudgeText(
                          reminder.expense,
                          reminder.share,
                          state.people,
                          state.sources
                        )
                      )
                    }
                  >
                    <CopyIcon />
                    Copy reminder
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
