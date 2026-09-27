"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { AddExpenseDialog } from "@/components/add-expense-dialog";
import { AddSourceDialog } from "@/components/add-source-dialog";
import { MarkPaidDialog, type PaidTarget } from "@/components/mark-paid-dialog";
import { SettleDialog, type SettleTarget } from "@/components/settle-dialog";
import type { SpendType } from "@/lib/types";

type DialogsContextValue = {
  openAddExpense: () => void;
  openAddToTab: () => void;
  openAddSource: () => void;
  requestMarkPaid: (target: PaidTarget) => void;
  requestSettle: (otherId: string, monthKey?: string, tabOnly?: boolean) => void;
};

const DialogsContext = createContext<DialogsContextValue | null>(null);

export function DialogsProvider({ children }: { children: React.ReactNode }) {
  const [addExpense, setAddExpense] = useState<SpendType | null>(null);
  const [addSource, setAddSource] = useState(false);
  const [paidTarget, setPaidTarget] = useState<PaidTarget | null>(null);
  const [settleTarget, setSettleTarget] = useState<SettleTarget | null>(null);

  const value = useMemo<DialogsContextValue>(
    () => ({
      openAddExpense: () => setAddExpense("equal"),
      openAddToTab: () => setAddExpense("tab"),
      openAddSource: () => setAddSource(true),
      requestMarkPaid: setPaidTarget,
      requestSettle: (otherId, monthKey, tabOnly) =>
        setSettleTarget({ otherId, monthKey, tabOnly }),
    }),
    []
  );

  return (
    <DialogsContext.Provider value={value}>
      {children}
      <AddExpenseDialog
        open={addExpense !== null}
        initialType={addExpense ?? "equal"}
        onOpenChange={(open) => {
          if (!open) setAddExpense(null);
        }}
      />
      <AddSourceDialog open={addSource} onOpenChange={setAddSource} />
      <MarkPaidDialog target={paidTarget} onClose={() => setPaidTarget(null)} />
      <SettleDialog
        target={settleTarget}
        onClose={() => setSettleTarget(null)}
      />
    </DialogsContext.Provider>
  );
}

export function useDialogs() {
  const value = useContext(DialogsContext);
  if (!value) throw new Error("useDialogs must be used inside DialogsProvider");
  return value;
}
