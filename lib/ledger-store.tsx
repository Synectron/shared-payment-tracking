"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import {
  addExpense as addExpenseAction,
  addPaymentSource as addSourceAction,
  approveClaim as approveClaimAction,
  approveShareAmount as approveShareAmountAction,
  claimPayment as claimPaymentAction,
  claimSettleWith as claimSettleAction,
  declareShareAmount as declareShareAmountAction,
  rejectClaim as rejectClaimAction,
  rejectShareAmount as rejectShareAmountAction,
  regenerateInviteCode as regenerateInviteCodeAction,
  sendGroupInviteEmail as sendGroupInviteEmailAction,
  deleteGroup as deleteGroupAction,
  updateGroupTrackingMode as updateGroupTrackingModeAction,
} from "@/lib/actions";
import { createClient } from "@/lib/supabase/client";
import {
  balancesForPerson,
  getReminders,
  netBalances,
} from "@/lib/ledger";
import type {
  LedgerState,
  PaymentSource,
  RepayMethod,
  ShareMode,
  SourceKind,
  TrackingMode,
} from "@/lib/types";

type AddExpenseInput = {
  title: string;
  amountCents: number;
  date: string;
  dueDate: string;
  sourceId: string;
  chargedToSourceId?: string;
  notes?: string;
  splitWith: string[];
  billFile?: File | null;
  shareMode?: ShareMode;
};

type ClaimPaidInput = {
  expenseId: string;
  personId: string;
  repaidWith: RepayMethod;
};

type LedgerContextValue = {
  ready: boolean;
  pending: boolean;
  state: LedgerState;
  currentUser: LedgerState["people"][number] | undefined;
  reminders: ReturnType<typeof getReminders>;
  pairs: ReturnType<typeof netBalances>;
  you: ReturnType<typeof balancesForPerson>;
  inviteLink: string;
  addSource: (source: Omit<PaymentSource, "id">) => Promise<string | null>;
  addExpense: (input: AddExpenseInput) => Promise<string | null>;
  claimPaid: (input: ClaimPaidInput) => Promise<string | null>;
  approveClaim: (expenseId: string, personId: string) => Promise<string | null>;
  rejectClaim: (expenseId: string, personId: string) => Promise<string | null>;
  declareShareAmount: (
    expenseId: string,
    amountCents: number
  ) => Promise<string | null>;
  approveShareAmount: (
    expenseId: string,
    personId: string
  ) => Promise<string | null>;
  rejectShareAmount: (
    expenseId: string,
    personId: string
  ) => Promise<string | null>;
  settleWith: (
    otherId: string,
    method: RepayMethod,
    monthKey?: string
  ) => Promise<number>;
  regenerateInviteCode: () => Promise<string | null>;
  sendInviteEmail: (email: string) => Promise<string | null>;
  deleteGroup: () => Promise<string | null>;
  updateTrackingMode: (mode: TrackingMode) => Promise<string | null>;
};

const LedgerContext = createContext<LedgerContextValue | null>(null);

export function LedgerProvider({
  initialState,
  inviteLink,
  children,
}: {
  initialState: LedgerState;
  inviteLink: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [state, setState] = useState(initialState);
  const [link, setLink] = useState(inviteLink);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setState(initialState);
    setLink(inviteLink);
  }, [initialState, inviteLink]);

  const refresh = useCallback(() => {
    startTransition(() => router.refresh());
  }, [router]);

  const addSource = useCallback(
    async (source: Omit<PaymentSource, "id">) => {
      const result = await addSourceAction(state.groupId, {
        name: source.name,
        kind: source.kind as SourceKind,
        ownerId: source.ownerId,
        last4: source.last4,
        provider: source.provider,
      });
      if (result?.error) return result.error;
      refresh();
      return null;
    },
    [state.groupId, refresh]
  );

  const addExpense = useCallback(
    async (input: AddExpenseInput) => {
      let billPath: string | undefined;
      if (input.billFile) {
        const supabase = createClient();
        const ext = input.billFile.name.split(".").pop() || "jpg";
        const path = `${state.groupId}/${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("bills")
          .upload(path, input.billFile, {
            cacheControl: "3600",
            upsert: false,
          });
        if (uploadError) return uploadError.message;
        billPath = path;
      }

      const result = await addExpenseAction(state.groupId, {
        title: input.title,
        amountCents: input.amountCents,
        date: input.date,
        dueDate: input.dueDate,
        sourceId: input.sourceId,
        chargedToSourceId: input.chargedToSourceId,
        notes: input.notes,
        splitWith: input.splitWith,
        billPath,
        shareMode: input.shareMode,
      });
      if (result?.error) return result.error;
      refresh();
      return null;
    },
    [state.groupId, refresh]
  );

  const claimPaid = useCallback(
    async (input: ClaimPaidInput) => {
      const result = await claimPaymentAction(state.groupId, {
        expenseId: input.expenseId,
        personId: input.personId,
        method: input.repaidWith,
      });
      if (result?.error) return result.error;
      refresh();
      return null;
    },
    [state.groupId, refresh]
  );

  const approveClaim = useCallback(
    async (expenseId: string, personId: string) => {
      const result = await approveClaimAction(state.groupId, {
        expenseId,
        personId,
      });
      if (result?.error) return result.error;
      refresh();
      return null;
    },
    [state.groupId, refresh]
  );

  const rejectClaim = useCallback(
    async (expenseId: string, personId: string) => {
      const result = await rejectClaimAction(state.groupId, {
        expenseId,
        personId,
      });
      if (result?.error) return result.error;
      refresh();
      return null;
    },
    [state.groupId, refresh]
  );

  const declareShareAmount = useCallback(
    async (expenseId: string, amountCents: number) => {
      const result = await declareShareAmountAction(state.groupId, {
        expenseId,
        amountCents,
      });
      if (result?.error) return result.error;
      refresh();
      return null;
    },
    [state.groupId, refresh]
  );

  const approveShareAmount = useCallback(
    async (expenseId: string, personId: string) => {
      const result = await approveShareAmountAction(state.groupId, {
        expenseId,
        personId,
      });
      if (result?.error) return result.error;
      refresh();
      return null;
    },
    [state.groupId, refresh]
  );

  const rejectShareAmount = useCallback(
    async (expenseId: string, personId: string) => {
      const result = await rejectShareAmountAction(state.groupId, {
        expenseId,
        personId,
      });
      if (result?.error) return result.error;
      refresh();
      return null;
    },
    [state.groupId, refresh]
  );

  const settleWith = useCallback(
    async (otherId: string, method: RepayMethod, monthKey?: string) => {
      const result = await claimSettleAction(
        state.groupId,
        otherId,
        method,
        monthKey
      );
      refresh();
      return result.count ?? 0;
    },
    [state.groupId, refresh]
  );

  const regenerateInviteCode = useCallback(async () => {
    const result = await regenerateInviteCodeAction(state.groupId);
    if (result.error) return result.error;
    if (result.inviteCode) {
      setState((current) => ({ ...current, inviteCode: result.inviteCode! }));
      setLink(
        `${window.location.origin}/join/${state.groupId}/${result.inviteCode}`
      );
    }
    refresh();
    return null;
  }, [state.groupId, refresh]);

  const sendInviteEmail = useCallback(
    async (email: string) => {
      const result = await sendGroupInviteEmailAction(state.groupId, email);
      if (result.error) return result.error;
      return null;
    },
    [state.groupId]
  );

  const deleteGroup = useCallback(async () => {
    const result = await deleteGroupAction(state.groupId);
    if (result?.error) return result.error;
    return null;
  }, [state.groupId]);

  const updateTrackingMode = useCallback(
    async (mode: TrackingMode) => {
      const result = await updateGroupTrackingModeAction(state.groupId, mode);
      if (result?.error) return result.error;
      setState((current) => ({ ...current, trackingMode: mode }));
      refresh();
      return null;
    },
    [state.groupId, refresh]
  );

  const value = useMemo<LedgerContextValue>(() => {
    const currentUser = state.people.find(
      (person) => person.id === state.currentUserId
    );
    return {
      ready: true,
      pending: isPending,
      state,
      currentUser,
      reminders: getReminders(state),
      pairs: netBalances(state),
      you: balancesForPerson(state, state.currentUserId),
      inviteLink: link,
      addSource,
      addExpense,
      claimPaid,
      approveClaim,
      rejectClaim,
      declareShareAmount,
      approveShareAmount,
      rejectShareAmount,
      settleWith,
      regenerateInviteCode,
      sendInviteEmail,
      deleteGroup,
      updateTrackingMode,
    };
  }, [
    state,
    isPending,
    link,
    addSource,
    addExpense,
    claimPaid,
    approveClaim,
    rejectClaim,
    declareShareAmount,
    approveShareAmount,
    rejectShareAmount,
    settleWith,
    regenerateInviteCode,
    sendInviteEmail,
    deleteGroup,
    updateTrackingMode,
  ]);

  return (
    <LedgerContext.Provider value={value}>{children}</LedgerContext.Provider>
  );
}

export function useLedger() {
  const value = useContext(LedgerContext);
  if (!value) throw new Error("useLedger must be used inside LedgerProvider");
  return value;
}
