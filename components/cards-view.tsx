"use client";

import { BoltIcon, CreditCardIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDialogs } from "@/components/dialogs-provider";
import { PersonAvatar } from "@/components/person-avatar";
import { personById, sourceSpend, sourceUnpaid } from "@/lib/ledger";
import { useLedger } from "@/lib/ledger-store";
import { formatMoney } from "@/lib/money";

export function CardsView() {
  const { state } = useLedger();
  const { openAddSource } = useDialogs();
  const cards = state.sources.filter((source) => source.kind === "card");
  const upis = state.sources.filter((source) => source.kind === "upi");
  const utilities = state.sources.filter((source) => source.kind === "utility");

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl tracking-tight">
            Cards, UPI & bills
          </h1>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            See which card or UPI took the hit, and what&apos;s still unpaid.
          </p>
        </div>
        <Button onClick={openAddSource}>Add source</Button>
      </div>

      <section className="space-y-3">
        <h2 className="font-heading text-lg">Cards</h2>
        {cards.length === 0 ? (
          <p className="text-sm text-muted-foreground">No cards yet.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {cards.map((source) => {
              const owner = personById(state.people, source.ownerId ?? "");
              const spend = sourceSpend(state, source.id);
              const unpaid = sourceUnpaid(state, source.id);
              return (
                <Card key={source.id}>
                  <CardHeader>
                    <CardTitle className="flex items-start justify-between gap-2">
                      <span className="flex items-center gap-2">
                        <CreditCardIcon className="size-4 text-muted-foreground" />
                        {source.name}
                      </span>
                      {unpaid > 0 ? (
                        <Badge variant="destructive">Unpaid</Badge>
                      ) : (
                        <Badge variant="secondary">Caught up</Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      {owner && <PersonAvatar person={owner} size="sm" />}
                      <span>
                        {owner ? `${owner.name}'s card` : "Shared card"}
                        {source.last4 ? ` · ${source.last4}` : ""}
                      </span>
                    </div>
                    <div className="flex justify-between tabular-nums">
                      <span className="text-muted-foreground">Logged</span>
                      <span className="font-medium">{formatMoney(spend, state.currency)}</span>
                    </div>
                    <div className="flex justify-between tabular-nums">
                      <span className="text-muted-foreground">Still unpaid</span>
                      <span className="font-medium">{formatMoney(unpaid, state.currency)}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-lg">UPI</h2>
        {upis.length === 0 ? (
          <p className="text-sm text-muted-foreground">No UPI IDs yet.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {upis.map((source) => {
              const owner = personById(state.people, source.ownerId ?? "");
              const spend = sourceSpend(state, source.id);
              const unpaid = sourceUnpaid(state, source.id);
              return (
                <Card key={source.id}>
                  <CardHeader>
                    <CardTitle className="flex items-start justify-between gap-2">
                      <span>{source.name}</span>
                      {unpaid > 0 ? (
                        <Badge variant="destructive">Unpaid</Badge>
                      ) : (
                        <Badge variant="secondary">Caught up</Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      {owner && <PersonAvatar person={owner} size="sm" />}
                      <span>
                        {owner ? `${owner.name}'s UPI` : "Shared UPI"}
                        {source.provider ? ` · ${source.provider}` : ""}
                      </span>
                    </div>
                    <div className="flex justify-between tabular-nums">
                      <span className="text-muted-foreground">Logged</span>
                      <span className="font-medium">{formatMoney(spend, state.currency)}</span>
                    </div>
                    <div className="flex justify-between tabular-nums">
                      <span className="text-muted-foreground">Still unpaid</span>
                      <span className="font-medium">{formatMoney(unpaid, state.currency)}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-lg">Utilities & bills</h2>
        {utilities.length === 0 ? (
          <p className="text-sm text-muted-foreground">No utilities yet.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {utilities.map((source) => {
              const spend = sourceSpend(state, source.id);
              const unpaid = sourceUnpaid(state, source.id);
              return (
                <Card key={source.id}>
                  <CardHeader>
                    <CardTitle className="flex items-start justify-between gap-2">
                      <span className="flex items-center gap-2">
                        <BoltIcon className="size-4 text-muted-foreground" />
                        {source.name}
                      </span>
                      {unpaid > 0 ? (
                        <Badge variant="destructive">Open shares</Badge>
                      ) : (
                        <Badge variant="secondary">Settled</Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    {source.provider && (
                      <p className="text-muted-foreground">{source.provider}</p>
                    )}
                    <div className="flex justify-between tabular-nums">
                      <span className="text-muted-foreground">Logged total</span>
                      <span className="font-medium">{formatMoney(spend, state.currency)}</span>
                    </div>
                    <div className="flex justify-between tabular-nums">
                      <span className="text-muted-foreground">Still unpaid</span>
                      <span className="font-medium">{formatMoney(unpaid, state.currency)}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
