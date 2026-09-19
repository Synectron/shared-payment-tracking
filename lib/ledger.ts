/**
 * Settora settlement ledger — proprietary calculation engine.
 * Copyright (c) OpusKiln / Shubham Mishra. All rights reserved.
 * Do not copy, redistribute, or reuse outside OpusKiln products without permission.
 */
import { daysBetween, todayIso } from "./money";
import type {
  Expense,
  LedgerState,
  PaymentSource,
  Person,
  Share,
} from "./types";

export type PairBalance = {
  fromId: string;
  toId: string;
  amountCents: number;
};

export type Reminder = {
  expense: Expense;
  share: Share;
  daysOverdue: number;
};

export function personById(people: Person[], id: string): Person | undefined {
  return people.find((person) => person.id === id);
}

export function sourceById(
  sources: PaymentSource[],
  id: string
): PaymentSource | undefined {
  return sources.find((source) => source.id === id);
}

export function unpaidShares(expense: Expense): Share[] {
  return expense.shares.filter(
    (share) =>
      (share.status === "unpaid" || share.status === "pending") &&
      share.personId !== expense.paidById
  );
}

export function isExpenseSettled(expense: Expense): boolean {
  return unpaidShares(expense).length === 0;
}

export function outstandingCents(expense: Expense): number {
  return unpaidShares(expense).reduce((sum, share) => sum + share.amountCents, 0);
}

export function isOverdue(expense: Expense, today = todayIso()): boolean {
  return !isExpenseSettled(expense) && expense.dueDate < today;
}

export function isDueSoon(expense: Expense, today = todayIso()): boolean {
  if (isExpenseSettled(expense) || isOverdue(expense, today)) return false;
  const days = daysBetween(today, expense.dueDate);
  return days >= 0 && days <= 2;
}

export function getReminders(
  state: LedgerState,
  today = todayIso()
): Reminder[] {
  const reminders: Reminder[] = [];
  for (const expense of state.expenses) {
    if (!isOverdue(expense, today)) continue;
    for (const share of unpaidShares(expense)) {
      reminders.push({
        expense,
        share,
        daysOverdue: daysBetween(expense.dueDate, today),
      });
    }
  }
  return reminders.sort((a, b) => b.daysOverdue - a.daysOverdue);
}

export function netBalances(state: LedgerState): PairBalance[] {
  const totals = new Map<string, number>();

  for (const expense of state.expenses) {
    for (const share of unpaidShares(expense)) {
      const key = pairKey(share.personId, expense.paidById);
      totals.set(key, (totals.get(key) ?? 0) + share.amountCents);
    }
  }

  const nets: PairBalance[] = [];
  const seen = new Set<string>();

  for (const [key, amount] of totals) {
    const [fromId, toId] = key.split(">");
    const reverseKey = pairKey(toId, fromId);
    if (seen.has(key) || seen.has(reverseKey)) continue;
    seen.add(key);
    seen.add(reverseKey);

    const reverse = totals.get(reverseKey) ?? 0;
    const net = amount - reverse;
    if (net > 0) nets.push({ fromId, toId, amountCents: net });
    else if (net < 0) nets.push({ fromId: toId, toId: fromId, amountCents: -net });
  }

  return nets.sort((a, b) => b.amountCents - a.amountCents);
}

export function balancesForPerson(state: LedgerState, personId: string) {
  const pairs = netBalances(state);
  const owedToYou = pairs
    .filter((pair) => pair.toId === personId)
    .reduce((sum, pair) => sum + pair.amountCents, 0);
  const youOwe = pairs
    .filter((pair) => pair.fromId === personId)
    .reduce((sum, pair) => sum + pair.amountCents, 0);
  return { owedToYou, youOwe, net: owedToYou - youOwe, pairs };
}

export function sourceSpend(state: LedgerState, sourceId: string): number {
  return state.expenses
    .filter(
      (expense) =>
        expense.sourceId === sourceId || expense.chargedToSourceId === sourceId
    )
    .reduce((sum, expense) => sum + expense.amountCents, 0);
}

export function sourceUnpaid(state: LedgerState, sourceId: string): number {
  return state.expenses
    .filter(
      (expense) =>
        expense.sourceId === sourceId || expense.chargedToSourceId === sourceId
    )
    .reduce((sum, expense) => sum + outstandingCents(expense), 0);
}

export function nudgeText(
  expense: Expense,
  share: Share,
  people: Person[],
  sources: PaymentSource[]
): string {
  const debtor = personById(people, share.personId)?.name ?? "Friend";
  const creditor = personById(people, expense.paidById)?.name ?? "them";
  const source = sourceById(sources, expense.sourceId)?.name ?? "a shared card";
  const amount = `$${(share.amountCents / 100).toFixed(2)}`;
  return `Hey ${debtor} — reminder that ${amount} for ${expense.title} is still unpaid. It went on ${source} and is owed to ${creditor}. Due ${expense.dueDate}.`;
}

function pairKey(fromId: string, toId: string): string {
  return `${fromId}>${toId}`;
}
