import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { DialogsProvider } from "@/components/dialogs-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { loadGroupLedger, listMyGroups } from "@/lib/data";
import { LedgerProvider } from "@/lib/ledger-store";
import { getInviteLink } from "@/lib/site";

export default async function GroupLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  const [ledger, groups] = await Promise.all([
    loadGroupLedger(groupId),
    listMyGroups(),
  ]);

  if (!ledger) notFound();

  const inviteLink = getInviteLink(ledger.inviteCode);

  return (
    <TooltipProvider>
      <LedgerProvider initialState={ledger} inviteLink={inviteLink}>
        <DialogsProvider>
          <AppShell groups={groups}>{children}</AppShell>
        </DialogsProvider>
      </LedgerProvider>
    </TooltipProvider>
  );
}
