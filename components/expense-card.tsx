"use client";

import { CheckIcon, CopyIcon, CreditCardIcon, RotateCcwIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PersonAvatar } from "@/components/person-avatar";
import {
  isDueSoon,
  isOverdue,
  nudgeText,
  personById,
  sourceById,
} from "@/lib/ledger";
import { formatDisplayDate, formatMoney, relativeDueLabel } from "@/lib/money";
import { REPAY_LABELS, type Expense, type Person, type PaymentSource } from "@/lib/types";
import type { PaidTarget } from "@/components/mark-paid-dialog";

export function ExpenseCard({
  expense,
  people,
  sources,
  onMarkPaid,
  onMarkUnpaid,
}: {
  expense: Expense;
  people: Person[];
  sources: PaymentSource[];
  onMarkPaid: (target: PaidTarget) => void;
  onMarkUnpaid: (expenseId: string, personId: string) => void;
}) {
  const source = sourceById(sources, expense.sourceId);
  const charged = expense.chargedToSourceId
    ? sourceById(sources, expense.chargedToSourceId)
    : undefined;
  const payer = personById(people, expense.paidById);
  const user = personById(people, expense.usedById);
  const overdue = isOverdue(expense);
  const dueSoon = isDueSoon(expense);

  async function copyNudge(personId: string) {
    const share = expense.shares.find((item) => item.personId === personId);
    if (!share) return;
    const text = nudgeText(expense, share, people, sources);
    await navigator.clipboard.writeText(text);
  }

  return (
    <Card>
      <CardContent className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-heading text-base font-medium leading-tight">
              {expense.title}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {formatDisplayDate(expense.date)} · {relativeDueLabel(expense.dueDate)}
            </p>
          </div>
          <div className="text-right">
            <p className="tabular-nums text-base font-semibold">
              {formatMoney(expense.amountCents)}
            </p>
            {overdue ? (
              <Badge variant="destructive">Overdue</Badge>
            ) : dueSoon ? (
              <Badge variant="outline">Due soon</Badge>
            ) : (
              <Badge variant="secondary">
                {expense.shares.every(
                  (share) =>
                    share.status === "paid" || share.personId === expense.paidById
                )
                  ? "Settled"
                  : "Open"}
              </Badge>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-foreground">
            <CreditCardIcon className="size-3" />
            {source?.name ?? "Unknown source"}
            {source?.last4 ? ` · ${source.last4}` : ""}
            {source?.provider ? ` · ${source.provider}` : ""}
          </span>
          {charged && (
            <span className="rounded-full bg-muted px-2 py-1">
              Billed to {charged.name}
            </span>
          )}
          {user && payer && user.id !== payer.id && (
            <span className="rounded-full bg-muted px-2 py-1">
              {user.name} used {payer.name}&apos;s card
            </span>
          )}
          {user && payer && user.id === payer.id && (
            <span className="rounded-full bg-muted px-2 py-1">
              {payer.name} paid
            </span>
          )}
        </div>

        {expense.notes && (
          <p className="text-sm text-muted-foreground">{expense.notes}</p>
        )}

        <ul className="divide-y divide-border rounded-lg border">
          {expense.shares.map((share) => {
            const person = personById(people, share.personId);
            const isPayer = share.personId === expense.paidById;
            return (
              <li
                key={share.personId}
                className="flex flex-col gap-2 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <PersonAvatar person={person} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {person?.name}
                      {isPayer ? " · covered the card" : ""}
                    </p>
                    <p className="text-xs text-muted-foreground tabular-nums">
                      {formatMoney(share.amountCents)}
                      {share.status === "paid" && share.repaidWith
                        ? ` · ${REPAY_LABELS[share.repaidWith]}`
                        : ""}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {share.status === "paid" ? (
                    <>
                      <Badge variant="secondary">
                        <CheckIcon />
                        Paid
                      </Badge>
                      {!isPayer && (
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => onMarkUnpaid(expense.id, share.personId)}
                        >
                          <RotateCcwIcon />
                          Undo
                        </Button>
                      )}
                    </>
                  ) : (
                    <>
                      <Button
                        size="xs"
                        onClick={() =>
                          onMarkPaid({
                            expenseId: expense.id,
                            personId: share.personId,
                          })
                        }
                      >
                        Mark paid
                      </Button>
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => copyNudge(share.personId)}
                      >
                        <CopyIcon />
                        Nudge
                      </Button>
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
