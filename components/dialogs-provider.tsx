"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { AddExpenseDialog } from "@/components/add-expense-dialog";
import { AddSourceDialog } from "@/components/add-source-dialog";
import { MarkPaidDialog, type PaidTarget } from "@/components/mark-paid-dialog";
import { SettleDialog } from "@/components/settle-dialog";

type DialogsContextValue = {
  openAddExpense: () => void;
  openAddSource: () => void;
  requestMarkPaid: (target: PaidTarget) => void;
  requestSettle: (otherId: string) => void;
};

const DialogsContext = createContext<DialogsContextValue | null>(null);

export function DialogsProvider({ children }: { children: React.ReactNode }) {
  const [addExpense, setAddExpense] = useState(false);
  const [addSource, setAddSource] = useState(false);
  const [paidTarget, setPaidTarget] = useState<PaidTarget | null>(null);
  const [settleId, setSettleId] = useState<string | null>(null);

  const value = useMemo<DialogsContextValue>(
    () => ({
      openAddExpense: () => setAddExpense(true),
      openAddSource: () => setAddSource(true),
      requestMarkPaid: setPaidTarget,
      requestSettle: setSettleId,
    }),
    []
  );

  return (
    <DialogsContext.Provider value={value}>
      {children}
      <AddExpenseDialog open={addExpense} onOpenChange={setAddExpense} />
      <AddSourceDialog open={addSource} onOpenChange={setAddSource} />
      <MarkPaidDialog target={paidTarget} onClose={() => setPaidTarget(null)} />
      <SettleDialog otherId={settleId} onClose={() => setSettleId(null)} />
    </DialogsContext.Provider>
  );
}

export function useDialogs() {
  const value = useContext(DialogsContext);
  if (!value) throw new Error("useDialogs must be used inside DialogsProvider");
  return value;
}
