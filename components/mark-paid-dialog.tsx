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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLedger } from "@/lib/ledger-store";
import { formatMoney } from "@/lib/money";
import { personById, sourceById } from "@/lib/ledger";
import { REPAY_LABELS, type RepayMethod } from "@/lib/types";

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
  const { state, markPaid } = useLedger();
  const [method, setMethod] = useState<RepayMethod>("venmo");

  const expense = state.expenses.find((item) => item.id === target?.expenseId);
  const share = expense?.shares.find((item) => item.personId === target?.personId);
  const debtor = personById(state.people, target?.personId ?? "");
  const creditor = personById(state.people, expense?.paidById ?? "");
  const source = sourceById(state.sources, expense?.sourceId ?? "");

  function confirm() {
    if (!target) return;
    markPaid({ ...target, repaidWith: method });
    onClose();
  }

  return (
    <Dialog open={Boolean(target)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mark as paid</DialogTitle>
          <DialogDescription>
            {debtor && share && expense ? (
              <>
                {debtor.name} is settling {formatMoney(share.amountCents)} for{" "}
                {expense.title}
                {source ? ` on ${source.name}` : ""}, owed to {creditor?.name}.
              </>
            ) : (
              "Confirm this repayment."
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-1.5">
          <Label>How did they pay you back?</Label>
          <Select value={method} onValueChange={(value) => setMethod(value as RepayMethod)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(REPAY_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={confirm}>Mark paid</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
