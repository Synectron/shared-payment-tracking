export const SUPPORTED_CURRENCIES = [
  { code: "INR", label: "INR — Indian Rupee", locale: "en-IN" },
  { code: "USD", label: "USD — US Dollar", locale: "en-US" },
  { code: "EUR", label: "EUR — Euro", locale: "en-IE" },
  { code: "GBP", label: "GBP — British Pound", locale: "en-GB" },
  { code: "AED", label: "AED — UAE Dirham", locale: "en-AE" },
  { code: "SGD", label: "SGD — Singapore Dollar", locale: "en-SG" },
  { code: "AUD", label: "AUD — Australian Dollar", locale: "en-AU" },
  { code: "CAD", label: "CAD — Canadian Dollar", locale: "en-CA" },
] as const;

export type CurrencyCode = (typeof SUPPORTED_CURRENCIES)[number]["code"];

export const DEFAULT_CURRENCY: CurrencyCode = "INR";

const LOCALE_BY_CURRENCY: Record<string, string> = Object.fromEntries(
  SUPPORTED_CURRENCIES.map((c) => [c.code, c.locale])
);

export function isSupportedCurrency(code: string): code is CurrencyCode {
  return SUPPORTED_CURRENCIES.some((c) => c.code === code);
}

export function formatMoney(
  cents: number,
  currency: string = DEFAULT_CURRENCY
): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents) / 100;
  const locale = LOCALE_BY_CURRENCY[currency] ?? "en-US";
  try {
    return (
      sign +
      abs.toLocaleString(locale, {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    );
  } catch {
    return `${sign}${currency} ${abs.toFixed(2)}`;
  }
}

export function parseMoneyToCents(value: string): number | null {
  const cleaned = value.replace(/[^0-9.]/g, "");
  if (!cleaned) return null;
  const amount = Number.parseFloat(cleaned);
  if (!Number.isFinite(amount) || amount < 0) return null;
  return Math.round(amount * 100);
}

export function splitEvenly(totalCents: number, count: number): number[] {
  if (count <= 0) return [];
  const base = Math.floor(totalCents / count);
  const remainder = totalCents % count;
  return Array.from({ length: count }, (_, index) =>
    base + (index < remainder ? 1 : 0)
  );
}

export function isoDate(offsetDays = 0): string {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

export function todayIso(): string {
  return isoDate(0);
}

export function formatDisplayDate(iso: string): string {
  const date = new Date(`${iso}T12:00:00`);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function daysBetween(fromIso: string, toIso: string): number {
  const from = new Date(`${fromIso}T12:00:00`).getTime();
  const to = new Date(`${toIso}T12:00:00`).getTime();
  return Math.round((to - from) / 86_400_000);
}

export function relativeDueLabel(dueDate: string, today = todayIso()): string {
  const days = daysBetween(today, dueDate);
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  if (days === -1) return "Due yesterday";
  if (days > 1) return `Due in ${days} days`;
  return `${Math.abs(days)} days overdue`;
}
