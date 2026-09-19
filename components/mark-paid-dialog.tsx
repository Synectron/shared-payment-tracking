"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLedger } from "@/lib/ledger-store";
import { formatMoney } from "@/lib/money";
import { personById, sourceById } from "@/lib/ledger";
import { Spinner } from "@/components/spinner";

const DEFAULT_REPAY_METHOD = "upi" as const;

export type PaidTarget = {
  expenseId: string;
  personId: string;
};

export function MarkPaidDialog({
  target,
  onClose,
}: {
  target: PaidTarget | null;
  onClose: () => void;
}) {
  const { state, claimPaid, approveClaim, rejectClaim, currentUser } =
    useLedger();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const expense = state.expenses.find((item) => item.id === target?.expenseId);
  const share = expense?.shares.find((item) => item.personId === target?.personId);
  const debtor = personById(state.people, target?.personId ?? "");
  const creditor = personById(state.people, expense?.paidById ?? "");
  const source = sourceById(state.sources, expense?.sourceId ?? "");
  const isReceiver = currentUser?.id === expense?.paidById;
  const isPendingClaim = share?.status === "pending";

  async function confirmClaim() {
    if (!target) return;
    setPending(true);
    setError("");
    const result = await claimPaid({
      ...target,
      repaidWith: DEFAULT_REPAY_METHOD,
    });
    setPending(false);
    if (result) {
      setError(result);
      return;
    }
    onClose();
  }

  async function confirmApprove() {
    if (!target) return;
    setPending(true);
    setError("");
    const result = await approveClaim(target.expenseId, target.personId);
    setPending(false);
    if (result) {
      setError(result);
      return;
    }
    onClose();
  }

  async function confirmReject() {
    if (!target) return;
    setPending(true);
    setError("");
    const result = await rejectClaim(target.expenseId, target.personId);
    setPending(false);
    if (result) {
      setError(result);
      return;
    }
    onClose();
  }

  return (
    <Dialog open={Boolean(target)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isPendingClaim && isReceiver ? "Approve payment" : "Claim payment"}
          </DialogTitle>
          <DialogDescription>
            {debtor && share && expense ? (
              <>
                {debtor.name} · {formatMoney(share.amountCents, state.currency)}{" "}
                for {expense.title}
                {source ? ` on ${source.name}` : ""}, owed to {creditor?.name}.
                {isPendingClaim
                  ? " Waiting for the receiver to approve."
                  : " This stays pending until the receiver approves."}
              </>
            ) : (
              "Confirm this repayment claim."
            )}
          </DialogDescription>
        </DialogHeader>

        {!isPendingClaim && creditor ? (
          <div className="rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-xs text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">
              Pay {creditor.name} first
            </p>
            {creditor.upiId || creditor.phone ? (
              <>
                <p>
                  Use their UPI ID or phone in your payment app, then submit the
                  claim here.
                </p>
                <p className="font-mono text-sm text-foreground">
                  {[creditor.upiId, creditor.phone].filter(Boolean).join(" · ")}
                </p>
              </>
            ) : (
              <p>
                They haven&apos;t added a UPI ID or phone yet. Check People, or
                ask them before you claim.
              </p>
            )}
          </div>
        ) : null}

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          {isPendingClaim && isReceiver ? (
            <>
              <Button
                variant="outline"
                onClick={confirmReject}
                disabled={pending}
              >
                {pending ? <Spinner /> : null}
                Reject
              </Button>
              <Button onClick={confirmApprove} disabled={pending}>
                {pending ? (
                  <Spinner className="text-primary-foreground" />
                ) : null}
                Approve
              </Button>
            </>
          ) : isPendingClaim ? (
            <Button disabled>Awaiting approval</Button>
          ) : (
            <Button onClick={confirmClaim} disabled={pending}>
              {pending ? (
                <>
                  <Spinner className="text-primary-foreground" />
                  Submitting…
                </>
              ) : (
                "Submit claim"
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
