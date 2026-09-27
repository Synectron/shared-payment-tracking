"use client";

import { useMemo, useState } from "react";
import { XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updatePaymentContact } from "@/lib/actions";
import { useLedger } from "@/lib/ledger-store";
import {
  isoDate,
  parseMoneyToCents,
  splitEvenly,
  formatMoney,
} from "@/lib/money";
import { PersonAvatar } from "@/components/person-avatar";
import { Spinner } from "@/components/spinner";
import {
  formatClearBy,
  formatMonthLabel,
  monthKeyFromIso,
  monthRange,
} from "@/lib/month";
import type { SpendType } from "@/lib/types";

const MAX_BILLS = 10;
const MAX_BILL_BYTES = 10 * 1024 * 1024;

const SPEND_TYPES: { value: SpendType; label: string; hint: string }[] = [
  { value: "equal", label: "Equal split", hint: "Assign everyone's share now" },
  {
    value: "open",
    label: "Members add shares",
    hint: "Each person declares their amount; you or the owner approve",
  },
  {
    value: "tab",
    label: "Monthly tab",
    hint: "Whole group, equal split, clear at month end",
  },
];

export function AddExpenseDialog({
  open,
  initialType = "equal",
  onOpenChange,
}: {
  open: boolean;
  initialType?: SpendType;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open ? (
        <AddExpenseForm
          initialType={initialType}
          onClose={() => onOpenChange(false)}
        />
      ) : null}
    </Dialog>
  );
}

function AddExpenseForm({
  initialType,
  onClose,
}: {
  initialType: SpendType;
  onClose: () => void;
}) {
  const { state, addExpense, currentUser } = useLedger();

  const [spendType, setSpendType] = useState<SpendType>(initialType);
  const [upiId, setUpiId] = useState(currentUser?.upiId ?? "");
  const [phone, setPhone] = useState(currentUser?.phone ?? "");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(isoDate(0));
  const [dueDate, setDueDate] = useState(isoDate(7));
  const [splitWith, setSplitWith] = useState<string[]>(
    state.people.map((p) => p.id)
  );
  const [notes, setNotes] = useState("");
  const [billFiles, setBillFiles] = useState<File[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const isTab = spendType === "tab";
  const shareMode = spendType === "open" ? "open" : "assigned";
  const tabMonth = monthKeyFromIso(date || isoDate(0));
  const effectiveShareMode = shareMode;
  const effectiveSplitWith = isTab ? state.people.map((p) => p.id) : splitWith;

  const preview = useMemo(() => {
    if (effectiveShareMode === "open") return null;
    const cents = parseMoneyToCents(amount);
    if (!cents || effectiveSplitWith.length === 0) return null;
    const parts = splitEvenly(cents, effectiveSplitWith.length);
    return effectiveSplitWith.map((id, index) => ({
      person: state.people.find((p) => p.id === id),
      amountCents: parts[index],
    }));
  }, [amount, effectiveSplitWith, state.people, effectiveShareMode]);

  function addBillFiles(files: File[]) {
    const tooBig = files.filter((file) => file.size > MAX_BILL_BYTES);
    const room = MAX_BILLS - billFiles.length;
    const accepted = files
      .filter((file) => file.size <= MAX_BILL_BYTES)
      .slice(0, room);
    if (tooBig.length > 0) {
      setError(
        `${tooBig.map((f) => f.name).join(", ")} ${
          tooBig.length === 1 ? "is" : "are"
        } over 10 MB.`
      );
    } else if (files.length > room) {
      setError(`You can attach up to ${MAX_BILLS} files.`);
    } else {
      setError("");
    }
    if (accepted.length > 0) {
      setBillFiles((current) => [...current, ...accepted]);
    }
  }

  function removeBillFile(index: number) {
    setBillFiles((current) => current.filter((_, i) => i !== index));
  }

  function toggleSplit(id: string) {
    if (id === state.currentUserId) return;
    setSplitWith((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  }

  async function submit() {
    if (saving) return;
    const amountCents = parseMoneyToCents(amount);
    if (!title.trim()) {
      setError(
        isTab
          ? "Name this spend (e.g. groceries, dinner)."
          : "Name this spend (e.g. Saturday party)."
      );
      return;
    }
    if (!amountCents) {
      setError("Enter an amount.");
      return;
    }
    if (effectiveSplitWith.length === 0) {
      setError("Include at least yourself in the split.");
      return;
    }
    setSaving(true);
    setError("");
    const contactChanged =
      upiId.trim() !== (currentUser?.upiId ?? "") ||
      phone.trim() !== (currentUser?.phone ?? "");
    if (contactChanged) {
      const formData = new FormData();
      formData.set("group_id", state.groupId);
      formData.set("upi_id", upiId);
      formData.set("phone", phone);
      const result = await updatePaymentContact(formData);
      if (result.error) {
        setSaving(false);
        setError(result.error);
        return;
      }
    }
    const err = await addExpense({
      title,
      amountCents,
      date,
      dueDate: isTab ? monthRange(tabMonth).end : dueDate,
      notes,
      splitWith: effectiveSplitWith,
      billFiles,
      shareMode: effectiveShareMode,
      onTab: isTab,
    });
    setSaving(false);
    if (err) {
      setError(err);
      return;
    }
    onClose();
  }

  return (
    <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{isTab ? "Add to monthly tab" : "New spend"}</DialogTitle>
        <DialogDescription>
          You paid, so you create the spend and approve paybacks. Split it now,
          let members add their own shares, or put it on the group&apos;s
          monthly tab. Attach bills or receipts if you have them.
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-3">
        <div className="grid gap-2 rounded-lg border border-border p-3">
          <div>
            <Label>Your payment info</Label>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Friends pay{" "}
              <span className="font-medium text-foreground">
                {currentUser?.name ?? "you"}
              </span>{" "}
              back here. Changes are saved to your profile.
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-1">
              <Label htmlFor="spend-upi" className="text-xs font-normal">
                UPI ID
              </Label>
              <Input
                id="spend-upi"
                value={upiId}
                onChange={(event) => setUpiId(event.target.value)}
                placeholder="name@okaxis"
                autoComplete="off"
              />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="spend-phone" className="text-xs font-normal">
                Phone
              </Label>
              <Input
                id="spend-phone"
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="+91…"
                autoComplete="tel"
              />
            </div>
          </div>
          {!upiId.trim() && !phone.trim() ? (
            <p className="text-xs text-muted-foreground">
              Add at least one so people know where to send your share.
            </p>
          ) : null}
        </div>

        <div className="grid gap-2 rounded-lg border border-border p-3">
          <Label>How should this be shared?</Label>
          <div className="grid gap-2 sm:grid-cols-3">
            {SPEND_TYPES.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setSpendType(option.value)}
                aria-pressed={spendType === option.value}
                className={`rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                  spendType === option.value
                    ? "border-primary bg-primary/5 text-foreground"
                    : "border-border text-muted-foreground hover:bg-muted/50"
                }`}
              >
                <span className="font-medium text-foreground">
                  {option.label}
                </span>
                <span className="mt-0.5 block text-xs">{option.hint}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="title">What was it?</Label>
          <Input
            id="title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Saturday party, dinner, trip…"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              inputMode="decimal"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="2500"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          </div>
        </div>

        {!isTab ? (
          <div className="grid gap-1.5">
            <Label htmlFor="due">Pay-back due</Label>
            <Input
              id="due"
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
            />
          </div>
        ) : null}

        {!isTab ? (
          <div className="grid gap-2">
            <Label>
              {shareMode === "open" ? "Who is on this bill?" : "Split with"}
            </Label>
            <div className="grid gap-2">
              {state.people.map((person) => (
                <label
                  key={person.id}
                  className="flex items-center justify-between rounded-lg border border-border px-2.5 py-2"
                >
                  <span className="flex items-center gap-2">
                    <PersonAvatar person={person} size="sm" />
                    <span>
                      {person.name}
                      {person.id === state.currentUserId ? " · you" : ""}
                    </span>
                  </span>
                  <Checkbox
                    checked={splitWith.includes(person.id)}
                    disabled={person.id === state.currentUserId}
                    onCheckedChange={() => toggleSplit(person.id)}
                  />
                </label>
              ))}
            </div>
          </div>
        ) : null}

        {isTab ? (
          <div className="rounded-lg bg-muted/70 px-3 py-2 text-xs text-muted-foreground">
            Goes on the group&apos;s {formatMonthLabel(tabMonth)} tab, split
            equally across{" "}
            {state.people.length === 1
              ? "you (invite a partner or friend to share the tab)"
              : `all ${state.people.length} members`}
            . {formatClearBy(tabMonth)}, when paybacks are due.
          </div>
        ) : shareMode === "open" ? (
          <div className="rounded-lg bg-muted/70 px-3 py-2 text-xs text-muted-foreground space-y-1">
            <p>
              Selected members each enter their own share. Amounts only count
              for settlement after you or the group owner approve them.
            </p>
            <p>
              After approval, they pay your UPI or phone (People), claim paid,
              and you approve the payback.
            </p>
          </div>
        ) : (
          <div className="rounded-lg bg-muted/70 px-3 py-2 text-xs text-muted-foreground">
            Equal split assigns amounts now. Friends pay your UPI or phone on
            People, claim paid, and you approve.
          </div>
        )}

        {preview && (
          <div className="rounded-lg bg-muted/70 px-3 py-2 text-xs text-muted-foreground">
            {preview.map((row) => (
              <div
                key={row.person?.id}
                className="flex justify-between py-0.5"
              >
                <span>{row.person?.name}</span>
                <span className="tabular-nums text-foreground">
                  {formatMoney(row.amountCents, state.currency)}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="grid gap-1.5">
          <Label htmlFor="bill">Bills / receipts (optional)</Label>
          <Input
            id="bill"
            type="file"
            multiple
            accept="image/*,application/pdf"
            disabled={billFiles.length >= MAX_BILLS}
            onChange={(event) => {
              addBillFiles(Array.from(event.target.files ?? []));
              event.target.value = "";
            }}
          />
          {billFiles.length > 0 ? (
            <ul className="grid gap-1">
              {billFiles.map((file, index) => (
                <li
                  key={`${file.name}-${file.lastModified}-${index}`}
                  className="flex items-center justify-between gap-2 rounded-md bg-muted/70 px-2.5 py-1.5 text-xs"
                >
                  <span className="truncate">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => removeBillFile(index)}
                    className="shrink-0 rounded p-0.5 text-muted-foreground hover:bg-background hover:text-foreground"
                    aria-label={`Remove ${file.name}`}
                  >
                    <XIcon className="size-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground">
              Add up to {MAX_BILLS} photos or PDFs, 10 MB each.
            </p>
          )}
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="notes">Note</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Who ordered what, tip, etc."
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={submit} disabled={saving}>
          {saving ? (
            <>
              <Spinner className="text-primary-foreground" />
              Saving…
            </>
          ) : isTab ? (
            "Add to tab"
          ) : (
            "Create spend"
          )}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
