"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLedger } from "@/lib/ledger-store";
import type { SourceKind } from "@/lib/types";

export function AddSourceDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { addSource, state } = useLedger();
  const [kind, setKind] = useState<SourceKind>("card");
  const [name, setName] = useState("");
  const [ownerId, setOwnerId] = useState(state.currentUserId);
  const [last4, setLast4] = useState("");
  const [provider, setProvider] = useState("");
  const [error, setError] = useState("");

  async function submit() {
    if (!name.trim()) return;
    setError("");
    const result = await addSource({
      name: name.trim(),
      kind,
      ownerId: kind === "utility" ? undefined : ownerId,
      last4:
        kind === "card"
          ? last4.replace(/\D/g, "").slice(-4) || undefined
          : undefined,
      provider:
        kind === "utility" || kind === "upi"
          ? provider.trim() || undefined
          : undefined,
    });
    if (result) {
      setError(result);
      return;
    }
    setName("");
    setLast4("");
    setProvider("");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a payment source</DialogTitle>
          <DialogDescription>
            Card, UPI ID, or a utility bill the group shares.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label>Type</Label>
            <Select
              value={kind}
              onValueChange={(value) => setKind(value as SourceKind)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="upi">UPI</SelectItem>
                <SelectItem value="utility">Utility / bill</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="source-name">
              {kind === "card"
                ? "Card nickname"
                : kind === "upi"
                  ? "UPI nickname"
                  : "Bill name"}
            </Label>
            <Input
              id="source-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={
                kind === "card"
                  ? "HDFC credit"
                  : kind === "upi"
                    ? "Personal UPI"
                    : "Electric"
              }
            />
          </div>
          {kind !== "utility" ? (
            <div className="grid gap-1.5">
              <Label>Owner</Label>
              <Select value={ownerId} onValueChange={setOwnerId}>
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
          ) : null}
          {kind === "card" ? (
            <div className="grid gap-1.5">
              <Label htmlFor="last4">Last 4 (optional)</Label>
              <Input
                id="last4"
                inputMode="numeric"
                maxLength={4}
                value={last4}
                onChange={(event) => setLast4(event.target.value)}
                placeholder="4412"
              />
            </div>
          ) : null}
          {kind === "upi" || kind === "utility" ? (
            <div className="grid gap-1.5">
              <Label htmlFor="provider">
                {kind === "upi" ? "UPI ID / handle (optional)" : "Provider"}
              </Label>
              <Input
                id="provider"
                value={provider}
                onChange={(event) => setProvider(event.target.value)}
                placeholder={
                  kind === "upi" ? "name@okaxis" : "Electricity board…"
                }
              />
            </div>
          ) : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!name.trim()}>
            Add
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
