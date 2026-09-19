"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  balancesForPerson,
  getReminders,
  netBalances,
} from "./ledger";
import { createSeed } from "./seed";
import { todayIso } from "./money";
import type {
  Expense,
  LedgerState,
  PaymentSource,
  Person,
  RepayMethod,
  Share,
} from "./types";

const STORAGE_KEY = "tabwise.ledger.v1";

type AddExpenseInput = {
  title: string;
  amountCents: number;
  date: string;
  dueDate: string;
  paidById: string;
  usedById: string;
  sourceId: string;
  chargedToSourceId?: string;
  notes?: string;
  splitWith: string[];
};

type MarkPaidInput = {
  expenseId: string;
  personId: string;
  repaidWith: RepayMethod;
};

type LedgerContextValue = {
  ready: boolean;
  state: LedgerState;
  currentUser: Person | undefined;
  reminders: ReturnType<typeof getReminders>;
  pairs: ReturnType<typeof netBalances>;
  you: ReturnType<typeof balancesForPerson>;
  setCurrentUserId: (id: string) => void;
  addPerson: (person: Omit<Person, "id">) => void;
  addSource: (source: Omit<PaymentSource, "id">) => void;
  addExpense: (input: AddExpenseInput) => void;
  markPaid: (input: MarkPaidInput) => void;
  markUnpaid: (expenseId: string, personId: string) => void;
  settleWith: (otherId: string, repaidWith: RepayMethod) => number;
  resetDemo: () => void;
};

const LedgerContext = createContext<LedgerContextValue | null>(null);

function newId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}

function loadState(): LedgerState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LedgerState;
    if (!parsed?.people?.length || !parsed.currentUserId) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveState(state: LedgerState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function LedgerProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<LedgerState>(createSeed);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // localStorage is the source of truth after first paint (SSR stays on the seed).
    const stored = loadState() ?? createSeed();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from localStorage
    setState(stored);
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) saveState(state);
  }, [ready, state]);

  const update = useCallback((recipe: (draft: LedgerState) => LedgerState) => {
    setState((current) => recipe(current));
  }, []);

  const setCurrentUserId = useCallback((id: string) => {
    update((current) => ({ ...current, currentUserId: id }));
  }, [update]);

  const addPerson = useCallback((person: Omit<Person, "id">) => {
    update((current) => ({
      ...current,
      people: [...current.people, { ...person, id: newId("p") }],
    }));
  }, [update]);

  const addSource = useCallback((source: Omit<PaymentSource, "id">) => {
    update((current) => ({
      ...current,
      sources: [...current.sources, { ...source, id: newId("s") }],
    }));
  }, [update]);

  const addExpense = useCallback((input: AddExpenseInput) => {
    update((current) => {
      const splitWith = input.splitWith.filter(Boolean);
      if (splitWith.length === 0) return current;
      const base = Math.floor(input.amountCents / splitWith.length);
      const remainder = input.amountCents % splitWith.length;
      const shares: Share[] = splitWith.map((personId, index) => {
        const isPayer = personId === input.paidById;
        return {
          personId,
          amountCents: base + (index < remainder ? 1 : 0),
          status: isPayer ? "paid" : "unpaid",
          paidAt: isPayer ? todayIso() : undefined,
          repaidWith: isPayer ? "paid-the-card" : undefined,
        };
      });
      const expense: Expense = {
        id: newId("e"),
        title: input.title.trim(),
        amountCents: input.amountCents,
        date: input.date,
        dueDate: input.dueDate,
        paidById: input.paidById,
        usedById: input.usedById,
        sourceId: input.sourceId,
        chargedToSourceId: input.chargedToSourceId,
        notes: input.notes?.trim() || undefined,
        shares,
        createdAt: todayIso(),
      };
      return { ...current, expenses: [expense, ...current.expenses] };
    });
  }, [update]);

  const markPaid = useCallback((input: MarkPaidInput) => {
    update((current) => ({
      ...current,
      expenses: current.expenses.map((expense) => {
        if (expense.id !== input.expenseId) return expense;
        return {
          ...expense,
          shares: expense.shares.map((share) =>
            share.personId === input.personId
              ? {
                  ...share,
                  status: "paid",
                  paidAt: todayIso(),
                  repaidWith: input.repaidWith,
                }
              : share
          ),
        };
      }),
    }));
  }, [update]);

  const markUnpaid = useCallback((expenseId: string, personId: string) => {
    update((current) => ({
      ...current,
      expenses: current.expenses.map((expense) => {
        if (expense.id !== expenseId) return expense;
        return {
          ...expense,
          shares: expense.shares.map((share) =>
            share.personId === personId
              ? {
                  ...share,
                  status: "unpaid",
                  paidAt: undefined,
                  repaidWith: undefined,
                }
              : share
          ),
        };
      }),
    }));
  }, [update]);

  const settleWith = useCallback((otherId: string, repaidWith: RepayMethod) => {
    let count = 0;
    update((current) => {
      const you = current.currentUserId;
      return {
        ...current,
        expenses: current.expenses.map((expense) => {
          const involvesYou =
            (expense.paidById === you &&
              expense.shares.some(
                (share) => share.personId === otherId && share.status === "unpaid"
              )) ||
            (expense.paidById === otherId &&
              expense.shares.some(
                (share) => share.personId === you && share.status === "unpaid"
              ));
          if (!involvesYou) return expense;
          return {
            ...expense,
            shares: expense.shares.map((share) => {
              const shouldSettle =
                share.status === "unpaid" &&
                ((expense.paidById === you && share.personId === otherId) ||
                  (expense.paidById === otherId && share.personId === you));
              if (!shouldSettle) return share;
              count += 1;
              return {
                ...share,
                status: "paid",
                paidAt: todayIso(),
                repaidWith,
              };
            }),
          };
        }),
      };
    });
    return count;
  }, [update]);

  const resetDemo = useCallback(() => {
    setState(createSeed());
  }, []);

  const value = useMemo<LedgerContextValue>(() => {
    const currentUser = state.people.find((person) => person.id === state.currentUserId);
    return {
      ready,
      state,
      currentUser,
      reminders: getReminders(state),
      pairs: netBalances(state),
      you: balancesForPerson(state, state.currentUserId),
      setCurrentUserId,
      addPerson,
      addSource,
      addExpense,
      markPaid,
      markUnpaid,
      settleWith,
      resetDemo,
    };
  }, [
    ready,
    state,
    setCurrentUserId,
    addPerson,
    addSource,
    addExpense,
    markPaid,
    markUnpaid,
    settleWith,
    resetDemo,
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
