import { createClient } from "@/lib/supabase/server";
import type {
  Expense,
  GroupSummary,
  LedgerState,
  PaymentClaim,
  PaymentSource,
  Person,
  RepayMethod,
  ShareStatus,
  SourceKind,
} from "@/lib/types";

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function listMyGroups(): Promise<GroupSummary[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: memberships } = await supabase
    .from("group_members")
    .select("group_id, groups(id, name, invite_code, currency, created_by)")
    .eq("user_id", user.id);

  return (memberships ?? [])
    .map((row) => {
      const group = row.groups as unknown as {
        id: string;
        name: string;
        invite_code: string;
        currency: string;
        created_by: string;
      } | null;
      if (!group) return null;
      return {
        id: group.id,
        name: group.name,
        inviteCode: group.invite_code,
        currency: group.currency ?? "INR",
        createdBy: group.created_by,
      } satisfies GroupSummary;
    })
    .filter((g): g is GroupSummary => Boolean(g));
}

export async function loadGroupLedger(
  groupId: string
): Promise<LedgerState | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: membership } = await supabase
    .from("group_members")
    .select("user_id, role")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!membership) return null;

  const { data: group } = await supabase
    .from("groups")
    .select("id, name, invite_code, currency, created_by")
    .eq("id", groupId)
    .single();
  if (!group) return null;

  const { data: members } = await supabase
    .from("group_members")
    .select("user_id, profiles(id, display_name, color, email, upi_id, phone)")
    .eq("group_id", groupId);

  const people: Person[] = (members ?? []).flatMap((m) => {
    const profile = m.profiles as unknown as {
      id: string;
      display_name: string;
      color: string;
      email: string;
      upi_id: string | null;
      phone: string | null;
    } | null;
    if (!profile) return [];
    return [
      {
        id: profile.id,
        name: profile.display_name,
        color: profile.color,
        email: profile.email,
        upiId: profile.upi_id ?? undefined,
        phone: profile.phone ?? undefined,
      },
    ];
  });

  const { data: sourcesRaw } = await supabase
    .from("payment_sources")
    .select("*")
    .eq("group_id", groupId)
    .order("created_at", { ascending: true });

  const sources: PaymentSource[] = (sourcesRaw ?? []).map((s) => ({
    id: s.id,
    name: s.name,
    kind: s.kind as SourceKind,
    ownerId: s.owner_id ?? undefined,
    last4: s.last4 ?? undefined,
    provider: s.provider ?? undefined,
  }));

  const { data: expensesRaw } = await supabase
    .from("expenses")
    .select("*, shares(*)")
    .eq("group_id", groupId)
    .order("date", { ascending: false });

  const expenses: Expense[] = (expensesRaw ?? []).map((e) => {
    const billPath = (e.bill_path as string | null) ?? undefined;
    const billUrl = billPath
      ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/bills/${billPath}`
      : undefined;
    return {
      id: e.id,
      title: e.title,
      amountCents: e.amount_cents,
      date: e.date,
      dueDate: e.due_date,
      paidById: e.paid_by_id,
      usedById: e.used_by_id,
      sourceId: e.source_id,
      chargedToSourceId: e.charged_to_source_id ?? undefined,
      notes: e.notes ?? undefined,
      billPath,
      billUrl,
      shareMode: (e.share_mode as Expense["shareMode"]) ?? "assigned",
      createdAt: String(e.created_at).slice(0, 10),
      shares: ((e.shares as Array<Record<string, unknown>>) ?? []).map((s) => ({
        id: s.id as string,
        personId: s.person_id as string,
        amountCents: s.amount_cents as number,
        status: s.status as ShareStatus,
        paidAt: (s.paid_at as string | null) ?? undefined,
        repaidWith: (s.repaid_with as RepayMethod | null) ?? undefined,
      })),
    };
  });

  const shareIds = expenses.flatMap((e) => e.shares.map((s) => s.id));
  let claims: PaymentClaim[] = [];
  if (shareIds.length > 0) {
    const { data: claimsRaw } = await supabase
      .from("payment_claims")
      .select("*")
      .in("share_id", shareIds)
      .eq("status", "pending");
    claims = (claimsRaw ?? []).map((c) => ({
      id: c.id,
      shareId: c.share_id,
      claimedBy: c.claimed_by,
      method: c.method as RepayMethod,
      status: c.status as PaymentClaim["status"],
      createdAt: String(c.created_at),
    }));
  }

  return {
    groupId: group.id,
    groupName: group.name,
    inviteCode: group.invite_code,
    currency: (group.currency as string) ?? "INR",
    createdBy: group.created_by as string,
    currentUserRole:
      membership.role === "owner" ? ("owner" as const) : ("member" as const),
    people,
    sources,
    expenses,
    claims,
    currentUserId: user.id,
  };
}
