"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
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

const listeners = new Set<() => void>();
let memoryState: LedgerState | null = null;
let cachedServerSnapshot: LedgerState | null = null;

function newId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
  }
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function isValidLedgerState(value: unknown): value is LedgerState {
  if (!value || typeof value !== "object") return false;
  const candidate = value as LedgerState;
  return (
    Array.isArray(candidate.people) &&
    candidate.people.length > 0 &&
    Array.isArray(candidate.sources) &&
    Array.isArray(candidate.expenses) &&
    typeof candidate.currentUserId === "string" &&
    candidate.people.some((person) => person.id === candidate.currentUserId)
  );
}

function loadState(): LedgerState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    return isValidLedgerState(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function saveState(state: LedgerState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore quota / private-mode write failures.
  }
}

function emit() {
  for (const listener of listeners) listener();
}

function getServerSnapshot(): LedgerState {
  if (!cachedServerSnapshot) cachedServerSnapshot = createSeed();
  return cachedServerSnapshot;
}

function getClientSnapshot(): LedgerState {
  if (!memoryState) {
    memoryState = loadState() ?? createSeed();
  }
  return memoryState;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return;
    memoryState = loadState() ?? createSeed();
    emit();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function setLedgerState(next: LedgerState | ((prev: LedgerState) => LedgerState)) {
  const previous = getClientSnapshot();
  memoryState = typeof next === "function" ? next(previous) : next;
  saveState(memoryState);
  emit();
}

export function LedgerProvider({ children }: { children: React.ReactNode }) {
  const state = useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerSnapshot
  );

  const setCurrentUserId = useCallback((id: string) => {
    setLedgerState((current) => ({ ...current, currentUserId: id }));
  }, []);

  const addPerson = useCallback((person: Omit<Person, "id">) => {
    setLedgerState((current) => ({
      ...current,
      people: [...current.people, { ...person, id: newId("p") }],
    }));
  }, []);

  const addSource = useCallback((source: Omit<PaymentSource, "id">) => {
    setLedgerState((current) => ({
      ...current,
      sources: [...current.sources, { ...source, id: newId("s") }],
    }));
  }, []);

  const addExpense = useCallback((input: AddExpenseInput) => {
    setLedgerState((current) => {
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
  }, []);

  const markPaid = useCallback((input: MarkPaidInput) => {
    setLedgerState((current) => ({
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
  }, []);

  const markUnpaid = useCallback((expenseId: string, personId: string) => {
    setLedgerState((current) => ({
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
  }, []);

  const settleWith = useCallback((otherId: string, repaidWith: RepayMethod) => {
    let count = 0;
    setLedgerState((current) => {
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
  }, []);

  const resetDemo = useCallback(() => {
    setLedgerState(createSeed());
  }, []);

  const value = useMemo<LedgerContextValue>(() => {
    const currentUser = state.people.find((person) => person.id === state.currentUserId);
    return {
      ready: true,
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
