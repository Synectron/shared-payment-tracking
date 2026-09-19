"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useDialogs } from "@/components/dialogs-provider";
import { PersonAvatar } from "@/components/person-avatar";
import { balancesForPerson } from "@/lib/ledger";
import { useLedger } from "@/lib/ledger-store";
import { formatMoney } from "@/lib/money";

export function PeopleView() {
  const { state, resetDemo } = useLedger();
  const { openAddPerson } = useDialogs();

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl tracking-tight">People</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Friends who share cards. Switch “viewing as” in the header to see
            the tab from someone else’s side.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={resetDemo}>
            Reset demo
          </Button>
          <Button onClick={openAddPerson}>Add friend</Button>
        </div>
      </div>

      {state.people.length === 0 ? (
        <div className="rounded-xl border border-dashed px-4 py-10 text-center">
          <p className="font-medium">No one in the group yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Add the friends who borrow each other’s cards.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {state.people.map((person) => {
            const balances = balancesForPerson(state, person.id);
            const cards = state.sources.filter(
              (source) => source.kind === "card" && source.ownerId === person.id
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
                        ? "No card on file"
                        : cards.map((card) => card.name).join(" · ")}
                    </p>
                    <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <dt className="text-xs text-muted-foreground">Owed to them</dt>
                        <dd className="tabular-nums font-medium">
                          {formatMoney(balances.owedToYou)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs text-muted-foreground">They still owe</dt>
                        <dd className="tabular-nums font-medium">
                          {formatMoney(balances.youOwe)}
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
