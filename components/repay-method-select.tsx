"use client";

import { Label } from "@/components/ui/label";
import { REPAY_LABELS, type RepayMethod } from "@/lib/types";

const SELECT_CLASS =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30";

/** Native select — avoids Radix Select + Dialog portal/focus-trap click bugs. */
export function RepayMethodSelect({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: RepayMethod;
  onChange: (value: RepayMethod) => void;
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value as RepayMethod)}
        className={SELECT_CLASS}
      >
        {Object.entries(REPAY_LABELS).map(([method, methodLabel]) => (
          <option key={method} value={method}>
            {methodLabel}
          </option>
        ))}
      </select>
    </div>
  );
}
