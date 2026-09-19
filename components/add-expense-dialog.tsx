"use client";

import { useMemo, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useLedger } from "@/lib/ledger-store";
import {
  isoDate,
  parseMoneyToCents,
  splitEvenly,
  formatMoney,
} from "@/lib/money";
import { sourceById } from "@/lib/ledger";
import { PersonAvatar } from "@/components/person-avatar";
import { currentMonthKey, monthRange } from "@/lib/month";

export function AddExpenseDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open ? <AddExpenseForm onClose={() => onOpenChange(false)} /> : null}
    </Dialog>
  );
}

function AddExpenseForm({ onClose }: { onClose: () => void }) {
  const { state, addExpense, currentUser } = useLedger();
  const isMonthlyTab = state.trackingMode === "monthly_tab";
  const cards = state.sources.filter((source) => source.kind === "card");
  const upis = state.sources.filter((source) => source.kind === "upi");
  const utilities = state.sources.filter((source) => source.kind === "utility");
  const monthEnd = monthRange(currentMonthKey()).end;

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(isoDate(0));
  const [dueDate, setDueDate] = useState(
    isMonthlyTab ? monthEnd : isoDate(7)
  );
  const [sourceId, setSourceId] = useState(cards[0]?.id ?? upis[0]?.id ?? "");
  const [chargedToSourceId, setChargedToSourceId] = useState(
    cards[0]?.id ?? upis[0]?.id ?? ""
  );
  const [splitWith, setSplitWith] = useState<string[]>(
    state.people.map((p) => p.id)
  );
  const [notes, setNotes] = useState("");
  const [billFile, setBillFile] = useState<File | null>(null);
  const [shareMode, setShareMode] = useState<"assigned" | "open">("assigned");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const selectedSource = sourceById(state.sources, sourceId);
  const isUtility = selectedSource?.kind === "utility";
  const effectiveShareMode = isMonthlyTab ? "assigned" : shareMode;
  const effectiveSplitWith = isMonthlyTab
    ? state.people.map((p) => p.id)
    : splitWith;

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

  function toggleSplit(id: string) {
    if (id === state.currentUserId) return;
    setSplitWith((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  }

  async function submit() {
    const amountCents = parseMoneyToCents(amount);
    if (!title.trim()) {
      setError(
        isMonthlyTab
          ? "Name this spend (e.g. groceries, dinner)."
          : "Name this spend (e.g. Saturday party)."
      );
      return;
    }
    if (!amountCents) {
      setError("Enter an amount.");
      return;
    }
    if (!sourceId) {
      setError("Pick how you paid (card / UPI / utility).");
      return;
    }
    if (effectiveSplitWith.length === 0) {
      setError("Include at least yourself in the split.");
      return;
    }
    setSaving(true);
    setError("");
    const err = await addExpense({
      title,
      amountCents,
      date,
      dueDate: isMonthlyTab ? monthEnd : dueDate,
      sourceId,
      chargedToSourceId: isUtility ? chargedToSourceId || undefined : undefined,
      notes,
      splitWith: effectiveSplitWith,
      billFile,
      shareMode: effectiveShareMode,
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
        <DialogTitle>{isMonthlyTab ? "Add spend" : "New spend"}</DialogTitle>
        <DialogDescription>
          {isMonthlyTab
            ? "You paid, so log it on this month’s tab. Equal split across members is automatic. Clear the tab before month end."
            : "You paid, so you create the spend and approve paybacks. Choose equal split, or let each member submit their own share for you (or the group owner) to approve. Attach the bill if you have it."}
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-3">
        <p className="rounded-lg bg-muted/70 px-3 py-2 text-xs text-muted-foreground">
          Receiver / approver:{" "}
          <span className="font-medium text-foreground">
            {currentUser?.name ?? "You"}
          </span>{" "}
          (whoever creates the spend). Friends pay you via the UPI ID or phone
          on your People profile.
        </p>

        {!isMonthlyTab ? (
          <div className="grid gap-2 rounded-lg border border-border p-3">
            <Label>How should shares work?</Label>
            <div className="grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setShareMode("assigned")}
                className={`rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                  shareMode === "assigned"
                    ? "border-primary bg-primary/5 text-foreground"
                    : "border-border text-muted-foreground hover:bg-muted/50"
                }`}
              >
                <span className="font-medium text-foreground">Equal split</span>
                <span className="mt-0.5 block text-xs">
                  Assign everyone&apos;s share now
                </span>
              </button>
              <button
                type="button"
                onClick={() => setShareMode("open")}
                className={`rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                  shareMode === "open"
                    ? "border-primary bg-primary/5 text-foreground"
                    : "border-border text-muted-foreground hover:bg-muted/50"
                }`}
              >
                <span className="font-medium text-foreground">
                  Members add shares
                </span>
                <span className="mt-0.5 block text-xs">
                  Each person declares their amount; you or the group owner
                  approve
                </span>
              </button>
            </div>
          </div>
        ) : (
          <p className="rounded-lg bg-muted/70 px-3 py-2 text-xs text-muted-foreground">
            Monthly tab: everyone in the group shares equally. No need to pick
            share mode or declare amounts per person.
          </p>
        )}

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

        <div className="grid gap-1.5">
          <Label>How did you pay?</Label>
          <Select value={sourceId} onValueChange={setSourceId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Card / UPI / utility" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Cards</SelectLabel>
                {cards.map((source) => (
                  <SelectItem key={source.id} value={source.id}>
                    {source.name}
                    {source.last4 ? ` · ${source.last4}` : ""}
                  </SelectItem>
                ))}
              </SelectGroup>
              <SelectGroup>
                <SelectLabel>UPI</SelectLabel>
                {upis.map((source) => (
                  <SelectItem key={source.id} value={source.id}>
                    {source.name}
                    {source.provider ? ` · ${source.provider}` : ""}
                  </SelectItem>
                ))}
              </SelectGroup>
              <SelectGroup>
                <SelectLabel>Utilities</SelectLabel>
                {utilities.map((source) => (
                  <SelectItem key={source.id} value={source.id}>
                    {source.name}
                    {source.provider ? ` · ${source.provider}` : ""}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        {isUtility && (
          <div className="grid gap-1.5">
            <Label>Which card paid this bill?</Label>
            <Select
              value={chargedToSourceId}
              onValueChange={setChargedToSourceId}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Card that was charged" />
              </SelectTrigger>
              <SelectContent>
                {cards.map((source) => (
                  <SelectItem key={source.id} value={source.id}>
                    {source.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {!isMonthlyTab ? (
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

        {!isMonthlyTab ? (
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

        {isMonthlyTab ? (
          <div className="rounded-lg bg-muted/70 px-3 py-2 text-xs text-muted-foreground">
            Equal split across{" "}
            {state.people.length === 1
              ? "you (invite a partner or friend to share the tab)"
              : `${state.people.length} members`}
            . Paybacks are due when you clear the month.
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
          <Label htmlFor="bill">Bill / receipt (optional)</Label>
          <Input
            id="bill"
            type="file"
            accept="image/*,application/pdf"
            onChange={(event) =>
              setBillFile(event.target.files?.[0] ?? null)
            }
          />
          {billFile ? (
            <p className="text-xs text-muted-foreground">{billFile.name}</p>
          ) : null}
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
          {saving ? "Saving…" : isMonthlyTab ? "Add to tab" : "Create spend"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
