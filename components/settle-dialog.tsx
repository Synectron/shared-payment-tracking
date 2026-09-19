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
import { monthBalancesForPerson, personById } from "@/lib/ledger";
import { useLedger } from "@/lib/ledger-store";
import { formatMoney } from "@/lib/money";
import { formatMonthLabel } from "@/lib/month";

const DEFAULT_REPAY_METHOD = "upi" as const;

export type SettleTarget = {
  otherId: string;
  /** When set, only claim unpaid shares for expenses in this YYYY-MM month. */
  monthKey?: string;
};

export function SettleDialog({
  target,
  onClose,
}: {
  target: SettleTarget | null;
  onClose: () => void;
}) {
  const { state, settleWith } = useLedger();
  const [message, setMessage] = useState("");
  const otherId = target?.otherId ?? null;
  const monthKey = target?.monthKey;
  const other = personById(state.people, otherId ?? "");
  const you = personById(state.people, state.currentUserId);
  const isMonthlyTab = state.trackingMode === "monthly_tab";
  const clearingMonth = Boolean(monthKey && isMonthlyTab);

  const monthNet =
    otherId && monthKey
      ? monthBalancesForPerson(state, monthKey, state.currentUserId).pairs.find(
          (pair) =>
            (pair.fromId === state.currentUserId && pair.toId === otherId) ||
            (pair.toId === state.currentUserId && pair.fromId === otherId)
        )
      : undefined;

  async function confirm() {
    if (!otherId) return;
    const count = await settleWith(otherId, DEFAULT_REPAY_METHOD, monthKey);
    const scope = monthKey ? ` for ${formatMonthLabel(monthKey)}` : "";
    setMessage(
      count > 0
        ? clearingMonth
          ? `Submitted ${count} claim${count === 1 ? "" : "s"} to clear ${formatMonthLabel(monthKey!)} with ${other?.name}. They still need to approve.`
          : `Submitted ${count} payment claim${count === 1 ? "" : "s"}${scope} for ${other?.name} to approve.`
        : `No open shares you owe ${other?.name}${scope}. They must claim payments for what they owe you.`
    );
    if (count > 0) onClose();
  }

  return (
    <Dialog
      open={Boolean(target)}
      onOpenChange={(open) => {
        if (!open) {
          setMessage("");
          onClose();
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {clearingMonth
              ? `Clear ${formatMonthLabel(monthKey!)}`
              : monthKey
                ? `Settle ${formatMonthLabel(monthKey)}`
                : "Settle up"}
          </DialogTitle>
          <DialogDescription>
            {clearingMonth ? (
              <>
                Close this month&apos;s tab with {other?.name} by claiming what
                you owe ({you?.name}). They still need to approve each claim.
                {monthNet && monthNet.fromId === state.currentUserId ? (
                  <>
                    {" "}
                    Net this month:{" "}
                    {formatMoney(monthNet.amountCents, state.currency)}.
                  </>
                ) : null}
              </>
            ) : (
              <>
                Claim unpaid shares you owe {other?.name}
                {monthKey ? ` from ${formatMonthLabel(monthKey)}` : ""}. They
                still need to approve each claim. ({you?.name})
                {monthNet && monthNet.fromId === state.currentUserId ? (
                  <>
                    {" "}
                    Net this month:{" "}
                    {formatMoney(monthNet.amountCents, state.currency)}.
                  </>
                ) : null}
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        {message ? (
          <p className="text-sm text-muted-foreground">{message}</p>
        ) : null}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={confirm}>
            {clearingMonth ? "Clear tab" : "Submit claims"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
