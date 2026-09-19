"use client";

import { useState } from "react";
import { CheckIcon, CopyIcon, CreditCardIcon, PaperclipIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PersonAvatar } from "@/components/person-avatar";
import {
  isDueSoon,
  isOverdue,
  nudgeText,
  personById,
  sourceById,
} from "@/lib/ledger";
import { formatDisplayDate, formatMoney, parseMoneyToCents, relativeDueLabel } from "@/lib/money";
import { REPAY_LABELS, type Expense, type Person, type PaymentSource } from "@/lib/types";
import type { PaidTarget } from "@/components/mark-paid-dialog";
import { useLedger } from "@/lib/ledger-store";

export function ExpenseCard({
  expense,
  people,
  sources,
  onMarkPaid,
}: {
  expense: Expense;
  people: Person[];
  sources: PaymentSource[];
  onMarkPaid: (target: PaidTarget) => void;
}) {
  const {
    currentUser,
    approveClaim,
    rejectClaim,
    declareShareAmount,
    approveShareAmount,
    rejectShareAmount,
    state,
  } = useLedger();
  const source = sourceById(sources, expense.sourceId);
  const charged = expense.chargedToSourceId
    ? sourceById(sources, expense.chargedToSourceId)
    : undefined;
  const payer = personById(people, expense.paidById);
  const overdue = isOverdue(expense);
  const dueSoon = isDueSoon(expense);
  const isReceiver = currentUser?.id === expense.paidById;
  const canApproveShares =
    isReceiver ||
    state.currentUserRole === "owner" ||
    state.createdBy === state.currentUserId;
  const isOpenBill = expense.shareMode === "open";

  const [declareAmount, setDeclareAmount] = useState("");
  const [declareError, setDeclareError] = useState("");
  const [declareSaving, setDeclareSaving] = useState(false);

  async function copyNudge(personId: string) {
    const share = expense.shares.find((item) => item.personId === personId);
    if (!share) return;
    const text = nudgeText(expense, share, people, sources);
    await navigator.clipboard.writeText(text);
  }

  async function submitMyShare() {
    const cents = parseMoneyToCents(declareAmount);
    if (!cents) {
      setDeclareError("Enter your share amount.");
      return;
    }
    setDeclareSaving(true);
    setDeclareError("");
    const err = await declareShareAmount(expense.id, cents);
    setDeclareSaving(false);
    if (err) {
      setDeclareError(err);
      return;
    }
    setDeclareAmount("");
  }

  const myShare = expense.shares.find(
    (s) => s.personId === state.currentUserId
  );
  const showDeclareForm =
    isOpenBill &&
    myShare &&
    (myShare.status === "open" || myShare.status === "amount_pending") &&
    myShare.personId !== expense.paidById;

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
              {formatMoney(expense.amountCents, state.currency)}
            </p>
            {overdue ? (
              <Badge variant="destructive">Overdue</Badge>
            ) : dueSoon ? (
              <Badge variant="outline">Due soon</Badge>
            ) : isOpenBill &&
              expense.shares.some(
                (s) => s.status === "open" || s.status === "amount_pending"
              ) ? (
              <Badge variant="outline">Shares open</Badge>
            ) : (
              <Badge variant="secondary">
                {expense.shares.every(
                  (share) =>
                    share.status === "paid" ||
                    share.personId === expense.paidById ||
                    share.status === "open"
                )
                  ? expense.shares.some((s) => s.status === "open")
                    ? "Awaiting shares"
                    : "Settled"
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
          {payer && (
            <span className="rounded-full bg-muted px-2 py-1">
              {payer.name} created · approves paybacks
            </span>
          )}
          {isOpenBill && (
            <span className="rounded-full bg-muted px-2 py-1">
              Members declare shares
            </span>
          )}
          {charged && (
            <span className="rounded-full bg-muted px-2 py-1">
              Billed to {charged.name}
            </span>
          )}
          {expense.billUrl && (
            <a
              href={expense.billUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-foreground underline-offset-2 hover:underline"
            >
              <PaperclipIcon className="size-3" />
              View bill
            </a>
          )}
        </div>

        {expense.notes && (
          <p className="text-sm text-muted-foreground">{expense.notes}</p>
        )}

        {showDeclareForm && (
          <div className="rounded-lg border border-border bg-muted/40 px-3 py-2.5 space-y-2">
            <p className="text-xs text-muted-foreground">
              {myShare?.status === "amount_pending"
                ? "Update your declared share (still awaiting approval):"
                : "Enter your share of this bill:"}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Input
                className="max-w-[140px]"
                inputMode="decimal"
                value={declareAmount}
                onChange={(e) => setDeclareAmount(e.target.value)}
                placeholder={
                  myShare?.amountCents
                    ? String(myShare.amountCents / 100)
                    : "0"
                }
              />
              <Button
                size="sm"
                onClick={submitMyShare}
                disabled={declareSaving}
              >
                {declareSaving
                  ? "Saving…"
                  : myShare?.status === "amount_pending"
                    ? "Update share"
                    : "Submit share"}
              </Button>
            </div>
            {declareError ? (
              <p className="text-xs text-destructive">{declareError}</p>
            ) : null}
          </div>
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
                      {isPayer ? " · covered (creator)" : ""}
                    </p>
                    <p className="text-xs text-muted-foreground tabular-nums">
                      {share.status === "open"
                        ? "No share yet"
                        : formatMoney(share.amountCents, state.currency)}
                      {share.status === "paid" && share.repaidWith
                        ? ` · ${REPAY_LABELS[share.repaidWith]}`
                        : share.status === "pending"
                          ? " · awaiting payment approval"
                          : share.status === "amount_pending"
                            ? " · awaiting share approval"
                            : ""}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {share.status === "paid" ? (
                    <Badge variant="secondary">
                      <CheckIcon />
                      Paid
                    </Badge>
                  ) : share.status === "open" ? (
                    <Badge variant="outline">Awaiting share</Badge>
                  ) : share.status === "amount_pending" ? (
                    canApproveShares ? (
                      <>
                        <Button
                          size="xs"
                          onClick={() =>
                            approveShareAmount(expense.id, share.personId)
                          }
                        >
                          Approve share
                        </Button>
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() =>
                            rejectShareAmount(expense.id, share.personId)
                          }
                        >
                          Reject
                        </Button>
                      </>
                    ) : (
                      <Badge variant="outline">Share pending</Badge>
                    )
                  ) : share.status === "pending" ? (
                    isReceiver ? (
                      <>
                        <Button
                          size="xs"
                          onClick={() =>
                            approveClaim(expense.id, share.personId)
                          }
                        >
                          Approve
                        </Button>
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() =>
                            rejectClaim(expense.id, share.personId)
                          }
                        >
                          Reject
                        </Button>
                      </>
                    ) : (
                      <Badge variant="outline">Pending approval</Badge>
                    )
                  ) : (
                    <>
                      {!isPayer && (
                        <Button
                          size="xs"
                          onClick={() =>
                            onMarkPaid({
                              expenseId: expense.id,
                              personId: share.personId,
                            })
                          }
                        >
                          Claim paid
                        </Button>
                      )}
                      {!isPayer && (
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => copyNudge(share.personId)}
                        >
                          <CopyIcon />
                          Nudge
                        </Button>
                      )}
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
