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
import { isoDate, parseMoneyToCents, splitEvenly, formatMoney } from "@/lib/money";
import { sourceById } from "@/lib/ledger";
import { PersonAvatar } from "@/components/person-avatar";

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
  const cards = state.sources.filter((source) => source.kind === "card");
  const upis = state.sources.filter((source) => source.kind === "upi");
  const utilities = state.sources.filter((source) => source.kind === "utility");

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(isoDate(0));
  const [dueDate, setDueDate] = useState(isoDate(7));
  const [sourceId, setSourceId] = useState(cards[0]?.id ?? upis[0]?.id ?? "");
  const [chargedToSourceId, setChargedToSourceId] = useState(
    cards[0]?.id ?? upis[0]?.id ?? ""
  );
  const [splitWith, setSplitWith] = useState<string[]>(
    state.people.map((p) => p.id)
  );
  const [notes, setNotes] = useState("");
  const [billFile, setBillFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const selectedSource = sourceById(state.sources, sourceId);
  const isUtility = selectedSource?.kind === "utility";

  const preview = useMemo(() => {
    const cents = parseMoneyToCents(amount);
    if (!cents || splitWith.length === 0) return null;
    const parts = splitEvenly(cents, splitWith.length);
    return splitWith.map((id, index) => ({
      person: state.people.find((p) => p.id === id),
      amountCents: parts[index],
    }));
  }, [amount, splitWith, state.people]);

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
      setError("Name this spend (e.g. Saturday party).");
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
    if (splitWith.length === 0) {
      setError("Include at least yourself in the split.");
      return;
    }
    setSaving(true);
    setError("");
    const err = await addExpense({
      title,
      amountCents,
      date,
      dueDate,
      sourceId,
      chargedToSourceId: isUtility ? chargedToSourceId || undefined : undefined,
      notes,
      splitWith,
      billFile,
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
        <DialogTitle>New spend</DialogTitle>
        <DialogDescription>
          You paid, so you create the spend and you approve paybacks. Attach the
          bill if you have it.
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-3">
        <p className="rounded-lg bg-muted/70 px-3 py-2 text-xs text-muted-foreground">
          Receiver / approver:{" "}
          <span className="font-medium text-foreground">
            {currentUser?.name ?? "You"}
          </span>{" "}
          (whoever creates the spend)
        </p>

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

        <div className="grid gap-1.5">
          <Label htmlFor="due">Pay-back due</Label>
          <Input
            id="due"
            type="date"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
          />
        </div>

        <div className="grid gap-2">
          <Label>Split with</Label>
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
          {saving ? "Saving…" : "Create spend"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
