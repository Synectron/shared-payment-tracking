import Link from "next/link";
import { createGroup, joinGroupByCode, signOut } from "@/lib/actions";
import { ensureProfile } from "@/lib/actions";
import { listMyGroups } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SiteFooter } from "@/components/site-footer";
import { DEFAULT_CURRENCY, SUPPORTED_CURRENCIES } from "@/lib/money";

export default async function HomePage() {
  await ensureProfile();
  const groups = await listMyGroups();

  return (
    <div className="mx-auto flex min-h-full w-full max-w-lg flex-1 flex-col gap-8 px-4 py-10">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-primary">Settora</p>
          <h1 className="font-heading text-3xl tracking-tight">Your groups</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Start a group, or paste an invite link or code to join one.
          </p>
        </div>
        <form action={signOut}>
          <Button type="submit" variant="outline" size="sm">
            Sign out
          </Button>
        </form>
      </div>

      {groups.length > 0 ? (
        <ul className="space-y-2">
          {groups.map((group) => (
            <li key={group.id}>
              <Link
                href={`/g/${group.id}`}
                className="flex items-center justify-between rounded-xl border px-4 py-3 hover:bg-muted/50"
              >
                <span className="font-medium">{group.name}</span>
                <span className="font-mono text-xs text-muted-foreground">
                  {group.currency}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
          No groups yet. Make one here, or paste an invite code below.
        </p>
      )}

      <form action={createGroup} className="space-y-3 rounded-xl border p-4">
        <h2 className="font-heading text-lg">Create a group</h2>
        <div className="grid gap-1.5">
          <Label htmlFor="name">Group name</Label>
          <Input id="name" name="name" required placeholder="Flatmates, Trip…" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="currency">Currency</Label>
          <select
            id="currency"
            name="currency"
            defaultValue={DEFAULT_CURRENCY}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            {SUPPORTED_CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-1.5 border-t pt-3">
          <p className="text-sm font-medium">Your payment contact</p>
          <p className="text-xs text-muted-foreground">
            Optional now — members will see these when settling up. You can edit
            them later on People.
          </p>
          <Label htmlFor="upi_id">UPI ID</Label>
          <Input
            id="upi_id"
            name="upi_id"
            placeholder="name@okaxis"
            autoComplete="off"
          />
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            placeholder="+91…"
            autoComplete="tel"
          />
        </div>
        <Button type="submit">Create group</Button>
      </form>

      <form action={joinGroupByCode} className="space-y-3 rounded-xl border p-4">
        <h2 className="font-heading text-lg">Join with code</h2>
        <div className="grid gap-1.5">
          <Label htmlFor="code">Invite link or code</Label>
          <Input
            id="code"
            name="code"
            required
            placeholder="Paste link or code"
            className="font-mono"
          />
        </div>
        <Button type="submit" variant="secondary">
          Join group
        </Button>
      </form>

      <SiteFooter className="-mx-4 mt-4 border-t-0" />
    </div>
  );
}
