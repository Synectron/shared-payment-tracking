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
import { RepayMethodSelect } from "@/components/repay-method-select";
import { personById } from "@/lib/ledger";
import { useLedger } from "@/lib/ledger-store";
import type { RepayMethod } from "@/lib/types";

export function SettleDialog({
  otherId,
  onClose,
}: {
  otherId: string | null;
  onClose: () => void;
}) {
  const { state, settleWith } = useLedger();
  const [method, setMethod] = useState<RepayMethod>("upi");
  const [message, setMessage] = useState("");
  const other = personById(state.people, otherId ?? "");
  const you = personById(state.people, state.currentUserId);

  async function confirm() {
    if (!otherId) return;
    const count = await settleWith(otherId, method);
    setMessage(
      count > 0
        ? `Submitted ${count} payment claim${count === 1 ? "" : "s"} for ${other?.name} to approve.`
        : `No open shares you owe ${other?.name}. They must claim payments for what they owe you.`
    );
    if (count > 0) onClose();
  }

  return (
    <Dialog open={Boolean(otherId)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Settle up</DialogTitle>
          <DialogDescription>
            Claim every unpaid share you owe {other?.name}. They still need to
            approve each claim. ({you?.name})
          </DialogDescription>
        </DialogHeader>
        <RepayMethodSelect
          id="settle-repay-method"
          label="How was it settled?"
          value={method}
          onChange={setMethod}
        />
        {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={confirm}>Submit claims</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
