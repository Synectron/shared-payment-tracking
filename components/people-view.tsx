"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PersonAvatar } from "@/components/person-avatar";
import { balancesForPerson } from "@/lib/ledger";
import { useLedger } from "@/lib/ledger-store";
import { formatMoney } from "@/lib/money";
import { useState } from "react";

export function PeopleView() {
  const { state, inviteLink, regenerateInviteCode, sendInviteEmail } =
    useLedger();
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteStatus, setInviteStatus] = useState("");
  const [sending, setSending] = useState(false);

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

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-heading text-3xl tracking-tight">People</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Share a link/code, or email a custom invite from contact@mail.opuskiln.com.
        </p>
      </div>

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
              Sent via Resend from contact@mail.opuskiln.com (not Supabase mail).
            </p>
          </form>

          {inviteStatus ? (
            <p className="text-sm text-primary">{inviteStatus}</p>
          ) : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
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
                        ? "No card/UPI on file"
                        : cards.map((card) => card.name).join(" · ")}
                    </p>
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
    </div>
  );
}
