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
import { personById } from "@/lib/ledger";
import { useLedger } from "@/lib/ledger-store";
import { REPAY_LABELS, type RepayMethod } from "@/lib/types";

export function SettleDialog({
  otherId,
  onClose,
}: {
  otherId: string | null;
  onClose: () => void;
}) {
  const { state, settleWith } = useLedger();
  const [method, setMethod] = useState<RepayMethod>("venmo");
  const other = personById(state.people, otherId ?? "");
  const you = personById(state.people, state.currentUserId);

  function confirm() {
    if (!otherId) return;
    settleWith(otherId, method);
    onClose();
  }

  return (
    <Dialog open={Boolean(otherId)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Settle up</DialogTitle>
          <DialogDescription>
            Mark every open share between {you?.name} and {other?.name} as paid.
            Use this after a Venmo, Zelle, or cash catch-up.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-1.5">
          <Label>How was it settled?</Label>
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
          <Button onClick={confirm}>Mark all paid</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
