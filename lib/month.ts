/** Calendar-month helpers for Settora's monthly settlement layer (default IST). */

export const GROUP_TIMEZONE = "Asia/Kolkata";

/** YYYY-MM */
export type MonthKey = string;

export function todayInTz(timeZone: string = GROUP_TIMEZONE): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function monthKeyFromIso(isoDate: string): MonthKey {
  return isoDate.slice(0, 7);
}

export function currentMonthKey(timeZone: string = GROUP_TIMEZONE): MonthKey {
  return monthKeyFromIso(todayInTz(timeZone));
}

export function monthRange(monthKey: MonthKey): { start: string; end: string } {
  const [year, month] = monthKey.split("-").map(Number);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const day = String(lastDay).padStart(2, "0");
  return {
    start: monthKey + "-01",
    end: monthKey + "-" + day,
  };
}

export function expenseInMonth(
  expense: { date: string },
  monthKey: MonthKey
): boolean {
  return monthKeyFromIso(expense.date) === monthKey;
}

export function formatMonthLabel(monthKey: MonthKey): string {
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function formatSettleBy(monthKey: MonthKey): string {
  const { end } = monthRange(monthKey);
  const [year, month, day] = end.split("-").map(Number);
  const label = new Date(Date.UTC(year, month - 1, day)).toLocaleDateString(
    "en-US",
    { month: "short", day: "numeric", timeZone: "UTC" }
  );
  return "Settle by " + label;
}

export function formatClearBy(monthKey: MonthKey): string {
  const { end } = monthRange(monthKey);
  const [year, month, day] = end.split("-").map(Number);
  const label = new Date(Date.UTC(year, month - 1, day)).toLocaleDateString(
    "en-US",
    { month: "short", day: "numeric", timeZone: "UTC" }
  );
  return "Clear by " + label;
}

export function daysLeftInMonth(
  monthKey: MonthKey,
  today: string = todayInTz()
): number {
  const { end } = monthRange(monthKey);
  const from = new Date(today + "T12:00:00").getTime();
  const to = new Date(end + "T12:00:00").getTime();
  return Math.round((to - from) / 86_400_000);
}

export function settleCountdownLabel(
  monthKey: MonthKey,
  today: string = todayInTz(),
  opts?: { monthlyTab?: boolean }
): string {
  const days = daysLeftInMonth(monthKey, today);
  const clear = opts?.monthlyTab;
  if (days < 0) {
    return clear
      ? "Month ended. Clear leftover tab when you can."
      : "Month ended. Settle leftover shares when you can.";
  }
  if (days === 0) {
    return clear ? "Last day: clear the tab today" : "Last day: settle today";
  }
  if (days === 1) {
    return clear ? "1 day left to clear the tab" : "1 day left to settle";
  }
  return (
    days +
    " days left · " +
    (clear ? formatClearBy(monthKey) : formatSettleBy(monthKey))
  );
}

export function shiftMonth(monthKey: MonthKey, delta: number): MonthKey {
  const [year, month] = monthKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1 + delta, 1));
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  return y + "-" + m;
}

export function availableMonthKeys(
  expenses: { date: string }[],
  current: MonthKey = currentMonthKey()
): MonthKey[] {
  const keys = new Set<MonthKey>([current]);
  for (const expense of expenses) {
    if (expense.date?.length >= 7) keys.add(monthKeyFromIso(expense.date));
  }
  return [...keys].sort((a, b) => b.localeCompare(a));
}

export function isCurrentMonth(
  monthKey: MonthKey,
  current: MonthKey = currentMonthKey()
): boolean {
  return monthKey === current;
}
