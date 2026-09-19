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
  const { state, addExpense } = useLedger();
  const cards = state.sources.filter((source) => source.kind === "card");
  const utilities = state.sources.filter((source) => source.kind === "utility");

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(isoDate(0));
  const [dueDate, setDueDate] = useState(isoDate(7));
  const [sourceId, setSourceId] = useState(cards[0]?.id ?? "");
  const [chargedToSourceId, setChargedToSourceId] = useState(cards[0]?.id ?? "");
  const [usedById, setUsedById] = useState(state.currentUserId);
  const [paidById, setPaidById] = useState(state.currentUserId);
  const [splitWith, setSplitWith] = useState<string[]>(state.people.map((p) => p.id));
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

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

  function onSourceChange(next: string) {
    setSourceId(next);
    const source = sourceById(state.sources, next);
    if (source?.kind === "card" && source.ownerId) {
      setPaidById(source.ownerId);
    }
  }

  function toggleSplit(id: string) {
    setSplitWith((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  }

  function submit() {
    const amountCents = parseMoneyToCents(amount);
    if (!title.trim()) {
      setError("Add a short title so the group knows what this was.");
      return;
    }
    if (!amountCents) {
      setError("Enter an amount.");
      return;
    }
    if (!sourceId) {
      setError("Pick the card or utility this went on.");
      return;
    }
    if (splitWith.length === 0) {
      setError("Split with at least one person.");
      return;
    }
    if (!splitWith.includes(paidById)) {
      setError("The person who is owed should be in the split.");
      return;
    }
    addExpense({
      title,
      amountCents,
      date,
      dueDate,
      paidById,
      usedById,
      sourceId,
      chargedToSourceId: isUtility ? chargedToSourceId || undefined : undefined,
      notes,
      splitWith,
    });
    onClose();
  }

  return (
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Log a charge</DialogTitle>
          <DialogDescription>
            Record who used whose card or which bill hit — then split it before
            the reminder slips.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="title">What was it?</Label>
            <Input
              id="title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Friday dinner, ConEd, Costco…"
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
                placeholder="64.50"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="date">Charged on</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label>Card or utility</Label>
            <Select value={sourceId} onValueChange={onSourceChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a card or bill" />
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
              <Select value={chargedToSourceId} onValueChange={setChargedToSourceId}>
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

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Who used it</Label>
              <Select value={usedById} onValueChange={setUsedById}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {state.people.map((person) => (
                    <SelectItem key={person.id} value={person.id}>
                      {person.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Who is owed</Label>
              <Select value={paidById} onValueChange={setPaidById}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {state.people.map((person) => (
                    <SelectItem key={person.id} value={person.id}>
                      {person.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

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
                    <span>{person.name}</span>
                  </span>
                  <Checkbox
                    checked={splitWith.includes(person.id)}
                    onCheckedChange={() => toggleSplit(person.id)}
                  />
                </label>
              ))}
            </div>
          </div>

          {preview && (
            <div className="rounded-lg bg-muted/70 px-3 py-2 text-xs text-muted-foreground">
              {preview.map((row) => (
                <div key={row.person?.id} className="flex justify-between py-0.5">
                  <span>{row.person?.name}</span>
                  <span className="tabular-nums text-foreground">
                    {formatMoney(row.amountCents)}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="grid gap-1.5">
            <Label htmlFor="notes">Note</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Alex borrowed Maya’s card at Costco…"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit}>Save charge</Button>
        </DialogFooter>
      </DialogContent>
  );
}
