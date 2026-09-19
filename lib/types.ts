export type SourceKind = "card" | "utility";

export type RepayMethod =
  | "venmo"
  | "zelle"
  | "cash"
  | "bank"
  | "paid-the-card"
  | "other";

export type Person = {
  id: string;
  name: string;
  color: string;
};

export type PaymentSource = {
  id: string;
  name: string;
  kind: SourceKind;
  ownerId?: string;
  last4?: string;
  provider?: string;
};

export type ShareStatus = "unpaid" | "paid";

export type Share = {
  personId: string;
  amountCents: number;
  status: ShareStatus;
  paidAt?: string;
  repaidWith?: RepayMethod;
};

export type Expense = {
  id: string;
  title: string;
  amountCents: number;
  date: string;
  dueDate: string;
  paidById: string;
  usedById: string;
  sourceId: string;
  chargedToSourceId?: string;
  notes?: string;
  shares: Share[];
  createdAt: string;
};

export type LedgerState = {
  people: Person[];
  sources: PaymentSource[];
  expenses: Expense[];
  currentUserId: string;
};

export const REPAY_LABELS: Record<RepayMethod, string> = {
  venmo: "Venmo",
  zelle: "Zelle",
  cash: "Cash",
  bank: "Bank transfer",
  "paid-the-card": "Paid the card directly",
  other: "Other",
};

export const SOURCE_KIND_LABELS: Record<SourceKind, string> = {
  card: "Card",
  utility: "Utility / bill",
};
