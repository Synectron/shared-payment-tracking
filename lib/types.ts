export type SourceKind = "card" | "upi" | "utility";

export type RepayMethod =
  | "upi"
  | "card"
  | "bank"
  | "cash"
  | "paid-the-card"
  | "other";

export type ShareStatus =
  | "unpaid"
  | "pending"
  | "paid"
  /** Open bill: member has not declared their amount yet */
  | "open"
  /** Member declared an amount; awaiting owner/creator approval before settlement */
  | "amount_pending";

export type ShareMode = "assigned" | "open";

/** standard = per-spend splits; monthly_tab = running month account cleared at month end */
export type TrackingMode = "standard" | "monthly_tab";

export type ClaimStatus = "pending" | "approved" | "rejected";

export type Person = {
  id: string;
  name: string;
  color: string;
  email?: string;
  upiId?: string;
  phone?: string;
};

export type PaymentSource = {
  id: string;
  name: string;
  kind: SourceKind;
  ownerId?: string;
  last4?: string;
  provider?: string;
};

export type Share = {
  id: string;
  personId: string;
  amountCents: number;
  status: ShareStatus;
  paidAt?: string;
  repaidWith?: RepayMethod;
};

export type PaymentClaim = {
  id: string;
  shareId: string;
  claimedBy: string;
  method: RepayMethod;
  status: ClaimStatus;
  createdAt: string;
};

export type Expense = {
  id: string;
  title: string;
  amountCents: number;
  date: string;
  dueDate: string;
  /** Person who created the spend — always the receiver / approver */
  paidById: string;
  usedById: string;
  sourceId: string;
  chargedToSourceId?: string;
  notes?: string;
  billPath?: string;
  billUrl?: string;
  /** assigned = equal split; open = members declare own shares for approval */
  shareMode: ShareMode;
  shares: Share[];
  createdAt: string;
};

export type GroupSummary = {
  id: string;
  name: string;
  inviteCode: string;
  currency: string;
  trackingMode: TrackingMode;
  createdBy: string;
};

export type LedgerState = {
  groupId: string;
  groupName: string;
  inviteCode: string;
  currency: string;
  trackingMode: TrackingMode;
  createdBy: string;
  currentUserRole: "owner" | "member";
  people: Person[];
  sources: PaymentSource[];
  expenses: Expense[];
  claims: PaymentClaim[];
  currentUserId: string;
};

export const REPAY_LABELS: Record<RepayMethod, string> = {
  upi: "UPI",
  card: "Card",
  bank: "Bank transfer",
  cash: "Cash",
  "paid-the-card": "Paid the card directly",
  other: "Other",
};

export const SOURCE_KIND_LABELS: Record<SourceKind, string> = {
  card: "Card",
  upi: "UPI",
  utility: "Utility / bill",
};

export const PERSON_COLORS = [
  "#0f766e",
  "#b45309",
  "#1d4ed8",
  "#be123c",
  "#7c3aed",
  "#047857",
];
