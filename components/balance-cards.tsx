"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PersonAvatar } from "@/components/person-avatar";
import { personById } from "@/lib/ledger";
import { useLedger } from "@/lib/ledger-store";
import { formatMoney } from "@/lib/money";

export function BalanceCards({
  onSettle,
}: {
  onSettle: (otherId: string) => void;
}) {
  const { you, currentUser, state } = useLedger();

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">
            Owed to {currentUser?.name ?? "you"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="font-heading text-2xl tabular-nums">
            {formatMoney(you.owedToYou, state.currency)}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">
            {currentUser?.name ?? "You"} still owe
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="font-heading text-2xl tabular-nums">
            {formatMoney(you.youOwe, state.currency)}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">Net</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="font-heading text-2xl tabular-nums">
            {you.net >= 0 ? "+" : "−"}
            {formatMoney(Math.abs(you.net), state.currency)}
          </p>
        </CardContent>
      </Card>

      <Card className="sm:col-span-3">
        <CardHeader>
          <CardTitle>Who owes whom</CardTitle>
        </CardHeader>
        <CardContent>
          {you.pairs.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              The group is even. New charges will show up here until they are
              marked paid.
            </p>
          ) : (
            <ul className="space-y-2">
              {you.pairs.map((pair) => {
                const from = personById(state.people, pair.fromId);
                const to = personById(state.people, pair.toId);
                const involvesYou =
                  pair.fromId === state.currentUserId ||
                  pair.toId === state.currentUserId;
                const otherId =
                  pair.fromId === state.currentUserId ? pair.toId : pair.fromId;
                return (
                  <li
                    key={`${pair.fromId}-${pair.toId}`}
                    className="flex flex-col gap-2 rounded-lg border px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-1.5">
                        <PersonAvatar person={from} size="sm" />
                        <PersonAvatar person={to} size="sm" />
                      </div>
                      <p className="text-sm">
                        <span className="font-medium">{from?.name}</span> owes{" "}
                        <span className="font-medium">{to?.name}</span>{" "}
                        <span className="tabular-nums font-semibold">
                          {formatMoney(pair.amountCents, state.currency)}
                        </span>
                      </p>
                    </div>
                    {involvesYou && (
                      <Button size="xs" variant="outline" onClick={() => onSettle(otherId)}>
                        Settle with {personById(state.people, otherId)?.name}
                      </Button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
