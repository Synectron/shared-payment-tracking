"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FlowTip } from "@/components/flow-tip";
import { PersonAvatar } from "@/components/person-avatar";
import { updatePaymentContact } from "@/lib/actions";
import { balancesForPerson } from "@/lib/ledger";
import { useLedger } from "@/lib/ledger-store";
import { formatMoney } from "@/lib/money";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function PeopleView() {
  const router = useRouter();
  const {
    state,
    inviteLink,
    regenerateInviteCode,
    sendInviteEmail,
    deleteGroup,
    updateTrackingMode,
  } = useLedger();
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteStatus, setInviteStatus] = useState("");
  const [sending, setSending] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [savingMode, setSavingMode] = useState(false);
  const [modeStatus, setModeStatus] = useState("");
  const me = state.people.find((person) => person.id === state.currentUserId);
  const [upiId, setUpiId] = useState(me?.upiId ?? "");
  const [phone, setPhone] = useState(me?.phone ?? "");
  const [savingContact, setSavingContact] = useState(false);
  const [contactStatus, setContactStatus] = useState("");
  const isMonthlyTab = state.trackingMode === "monthly_tab";

  useEffect(() => {
    setUpiId(me?.upiId ?? "");
    setPhone(me?.phone ?? "");
  }, [me?.upiId, me?.phone]);

  const canDelete =
    state.currentUserRole === "owner" ||
    state.createdBy === state.currentUserId;
  const canEditMode = canDelete;

  async function copyLink() {
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function rotateCode() {
    setError("");
    const result = await regenerateInviteCode();
    if (result) setError(result);
  }

  async function onSendInvite(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setInviteStatus("");
    setSending(true);
    const result = await sendInviteEmail(inviteEmail);
    setSending(false);
    if (result) {
      setError(result);
      return;
    }
    setInviteStatus(`Invite sent to ${inviteEmail}`);
    setInviteEmail("");
  }

  async function onDeleteGroup() {
    setError("");
    setDeleting(true);
    const result = await deleteGroup();
    setDeleting(false);
    if (result) {
      setError(result);
      setDeleteOpen(false);
    }
  }

  async function onSavePaymentContact(e: React.FormEvent) {
    e.preventDefault();
    setContactStatus("");
    setError("");
    setSavingContact(true);
    const formData = new FormData();
    formData.set("group_id", state.groupId);
    formData.set("upi_id", upiId);
    formData.set("phone", phone);
    const result = await updatePaymentContact(formData);
    setSavingContact(false);
    if (result.error) {
      setContactStatus("");
      setError(result.error);
      return;
    }
    setError("");
    setContactStatus("Payment details saved");
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-heading text-3xl tracking-tight">People</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isMonthlyTab
            ? "Invite a partner or friend, add your UPI or phone, keep logging spends through the month. Clear the tab from Home before month end."
            : "Invite a friend, add your UPI or phone, keep logging spends. Settle from Home before the month ends."}
        </p>
      </div>

      <FlowTip title="Paying someone back">
        <p>
          Settora tracks who owes what. You still pay in your UPI app (or by
          bank transfer) using their UPI ID or phone below.
        </p>
        <p>
          After you send the money, tap Claim paid on the spend, or use{" "}
          {isMonthlyTab ? "Clear month" : "Settle this month"} on Home. It only
          counts once the creator approves.
        </p>
      </FlowTip>

      {canEditMode ? (
        <Card>
          <CardContent className="space-y-3 pt-4">
            <div>
              <p className="text-sm font-medium">Tracking style</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Monthly tab is a running account you clear at month end.
                Standard keeps equal-split and open-share per spend.
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                disabled={savingMode}
                onClick={async () => {
                  setModeStatus("");
                  setError("");
                  setSavingMode(true);
                  const result = await updateTrackingMode("monthly_tab");
                  setSavingMode(false);
                  if (result) {
                    setError(result);
                    return;
                  }
                  setModeStatus("Switched to monthly tab");
                }}
                className={`rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                  isMonthlyTab
                    ? "border-primary bg-primary/5 text-foreground"
                    : "border-border text-muted-foreground hover:bg-muted/50"
                }`}
              >
                <span className="font-medium text-foreground">Monthly tab</span>
                <span className="mt-0.5 block text-xs">
                  Log spends, equal split, clear by month end
                </span>
              </button>
              <button
                type="button"
                disabled={savingMode}
                onClick={async () => {
                  setModeStatus("");
                  setError("");
                  setSavingMode(true);
                  const result = await updateTrackingMode("standard");
                  setSavingMode(false);
                  if (result) {
                    setError(result);
                    return;
                  }
                  setModeStatus("Switched to standard shared group");
                }}
                className={`rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                  !isMonthlyTab
                    ? "border-primary bg-primary/5 text-foreground"
                    : "border-border text-muted-foreground hover:bg-muted/50"
                }`}
              >
                <span className="font-medium text-foreground">
                  Standard shared
                </span>
                <span className="mt-0.5 block text-xs">
                  Equal split or members add shares per spend
                </span>
              </button>
            </div>
            {modeStatus ? (
              <p className="text-sm text-primary">{modeStatus}</p>
            ) : null}
          </CardContent>
        </Card>
      ) : (
        <p className="text-xs text-muted-foreground">
          Mode:{" "}
          <span className="font-medium text-foreground">
            {isMonthlyTab ? "Monthly tab" : "Standard shared"}
          </span>
        </p>
      )}

      <Card>
        <CardContent className="space-y-3 pt-4">
          <p className="text-sm font-medium">Invite link</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input readOnly value={inviteLink} className="font-mono text-xs" />
            <Button type="button" onClick={copyLink}>
              {copied ? "Copied" : "Copy link"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Code:{" "}
            <span className="font-mono text-foreground">{state.inviteCode}</span>
            {" · "}
            Currency:{" "}
            <span className="font-mono text-foreground">{state.currency}</span>
          </p>
          <Button type="button" variant="outline" size="sm" onClick={rotateCode}>
            Regenerate code
          </Button>

          <form onSubmit={onSendInvite} className="space-y-2 border-t pt-3">
            <Label htmlFor="invite-email">Email invite</Label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                id="invite-email"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="friend@email.com"
                required
              />
              <Button type="submit" disabled={sending} variant="secondary">
                {sending ? "Sending…" : "Send invite"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Friend gets a join link for this group. Sent from
              contact@mail.opuskiln.com.
            </p>
          </form>

          {inviteStatus ? (
            <p className="text-sm text-primary">{inviteStatus}</p>
          ) : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 pt-4">
          <div>
            <p className="text-sm font-medium">Your payment details</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Everyone in this group can see these. When they owe you, they pay
              your UPI ID or phone in their own app, then claim paid on the
              spend for you to approve.
            </p>
          </div>
          <form onSubmit={onSavePaymentContact} className="space-y-3">
            <div className="grid gap-1.5">
              <Label htmlFor="my-upi">UPI ID</Label>
              <Input
                id="my-upi"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="name@okaxis"
                autoComplete="off"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="my-phone">Phone</Label>
              <Input
                id="my-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91…"
                autoComplete="tel"
              />
            </div>
            <Button type="submit" size="sm" disabled={savingContact}>
              {savingContact ? "Saving…" : "Save payment details"}
            </Button>
            <p className="text-xs text-muted-foreground">
              Tip: fill at least one field. Without it, friends have to ask you
              how to pay.
            </p>
            {contactStatus ? (
              <p className="text-sm text-primary">{contactStatus}</p>
            ) : null}
            {error && !inviteStatus ? (
              <p className="text-sm text-destructive">{error}</p>
            ) : null}
          </form>
        </CardContent>
      </Card>

      {state.people.length === 0 ? (
        <div className="rounded-xl border border-dashed px-4 py-10 text-center">
          <p className="font-medium">No one in the group yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Share the invite link or email an invite so friends can join.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {state.people.map((person) => {
            const balances = balancesForPerson(state, person.id);
            const cards = state.sources.filter(
              (source) =>
                (source.kind === "card" || source.kind === "upi") &&
                source.ownerId === person.id
            );
            return (
              <Card key={person.id}>
                <CardContent className="flex items-start gap-3">
                  <PersonAvatar person={person} />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">
                      {person.name}
                      {person.id === state.currentUserId ? " · you" : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {cards.length === 0
                        ? "No card/UPI source on file"
                        : cards.map((card) => card.name).join(" · ")}
                    </p>
                    {person.upiId || person.phone ? (
                      <div className="mt-1 space-y-0.5">
                        <p className="text-xs text-foreground/80">
                          {person.upiId ? (
                            <span className="font-mono">{person.upiId}</span>
                          ) : null}
                          {person.upiId && person.phone ? " · " : null}
                          {person.phone ? <span>{person.phone}</span> : null}
                        </p>
                        {person.id !== state.currentUserId ? (
                          <p className="text-[11px] text-muted-foreground">
                            Pay this UPI or number when you owe them
                          </p>
                        ) : null}
                      </div>
                    ) : (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {person.id === state.currentUserId
                          ? "Add your UPI or phone above"
                          : "No payment contact yet · ask them to add one"}
                      </p>
                    )}
                    <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <dt className="text-xs text-muted-foreground">
                          Owed to them
                        </dt>
                        <dd className="tabular-nums font-medium">
                          {formatMoney(balances.owedToYou, state.currency)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs text-muted-foreground">
                          They still owe
                        </dt>
                        <dd className="tabular-nums font-medium">
                          {formatMoney(balances.youOwe, state.currency)}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {canDelete ? (
        <Card className="border-destructive/40">
          <CardContent className="space-y-3 pt-4">
            <p className="text-sm font-medium text-destructive">Danger zone</p>
            <p className="text-sm text-muted-foreground">
              Permanently delete this group and all of its expenses, shares, and
              payment sources. This cannot be undone.
            </p>
            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
              <DialogTrigger asChild>
                <Button type="button" variant="destructive" size="sm">
                  Delete group
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete {state.groupName}?</DialogTitle>
                  <DialogDescription>
                    All expenses, balances, and members will be removed. You
                    will be taken back to your groups list.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDeleteOpen(false)}
                    disabled={deleting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={onDeleteGroup}
                    disabled={deleting}
                  >
                    {deleting ? "Deleting…" : "Delete permanently"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
