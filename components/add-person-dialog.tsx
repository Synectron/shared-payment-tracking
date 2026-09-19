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
import { useLedger } from "@/lib/ledger-store";

const COLORS = ["#2F6F5E", "#C45C26", "#3D5A80", "#7A5C8E", "#B4532A", "#1F6B6B"];

export function AddPersonDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { addPerson, state } = useLedger();
  const [name, setName] = useState("");
  const [color, setColor] = useState(COLORS[state.people.length % COLORS.length]);

  function submit() {
    if (!name.trim()) return;
    addPerson({ name: name.trim(), color });
    setName("");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a friend</DialogTitle>
          <DialogDescription>
            Anyone who borrows a card or splits a bill.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="friend-name">Name</Label>
            <Input
              id="friend-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Sam"
            />
          </div>
          <div className="grid gap-1.5">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((swatch) => (
                <button
                  key={swatch}
                  type="button"
                  onClick={() => setColor(swatch)}
                  className="size-7 rounded-full ring-offset-2 ring-offset-background"
                  style={{
                    backgroundColor: swatch,
                    outline: color === swatch ? "2px solid var(--foreground)" : undefined,
                  }}
                  aria-label={`Choose ${swatch}`}
                />
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!name.trim()}>
            Add friend
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
