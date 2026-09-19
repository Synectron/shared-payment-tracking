"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { RepayMethod, SourceKind } from "@/lib/types";
import {
  groupInviteEmailHtml,
  magicLinkEmailHtml,
  sendEmail,
} from "@/lib/email";
import { DEFAULT_CURRENCY, isSupportedCurrency } from "@/lib/money";
import { getInviteLink, siteOrigin } from "@/lib/site";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  return { supabase, user };
}

export async function ensureProfile() {
  const { supabase, user } = await requireUser();
  const email = user.email ?? "";
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (!existing) {
    await supabase.from("profiles").insert({
      id: user.id,
      email,
      display_name:
        (user.user_metadata?.display_name as string | undefined) ||
        email.split("@")[0] ||
        "Friend",
      color: "#0f766e",
    });
  }
  return user;
}

export async function signInWithMagicLink(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const next = String(formData.get("next") ?? "/");
  if (!email) return { error: "Enter your email." };

  const redirectTo = `${siteOrigin()}/auth/callback?next=${encodeURIComponent(next)}`;

  // Prefer Resend + admin generateLink (bypasses Supabase 2/hr email limit)
  if (process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.RESEND_API_KEY) {
    try {
      const admin = createAdminClient();
      const { data, error } = await admin.auth.admin.generateLink({
        type: "magiclink",
        email,
        options: { redirectTo },
      });

      if (error) return { error: error.message };

      const actionLink = data.properties?.action_link;
      if (!actionLink) {
        return { error: "Could not generate a sign-in link." };
      }

      const mailed = await sendEmail({
        to: email,
        subject: "Sign in to Settora",
        html: magicLinkEmailHtml(actionLink),
        text: `Here’s your one-time Settora sign-in link: ${actionLink}`,
      });

      if (mailed.error) return { error: mailed.error };
      return { ok: true as const };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { error: message };
    }
  }

  // Fallback: Supabase built-in email (rate-limited ~2/hr on free tier)
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: redirectTo },
  });
  if (error) return { error: error.message };
  return { ok: true as const };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function createGroup(formData: FormData): Promise<void> {
  const name = String(formData.get("name") ?? "").trim();
  const currencyRaw = String(formData.get("currency") ?? DEFAULT_CURRENCY)
    .trim()
    .toUpperCase();
  const currency = isSupportedCurrency(currencyRaw)
    ? currencyRaw
    : DEFAULT_CURRENCY;
  if (!name) return;

  const { supabase, user } = await requireUser();
  await ensureProfile();

  const { data, error } = await supabase
    .from("groups")
    .insert({ name, created_by: user.id, currency })
    .select("id")
    .single();

  if (error || !data) return;
  revalidatePath("/");
  redirect(`/g/${data.id}`);
}

export async function joinGroupByCode(formData: FormData): Promise<void> {
  const code = String(formData.get("code") ?? "").trim();
  if (!code) return;

  const { supabase } = await requireUser();
  await ensureProfile();

  const { data, error } = await supabase.rpc("join_group_by_code", { code });
  if (error || !data) return;
  revalidatePath("/");
  redirect(`/g/${data}`);
}

export async function joinGroupByCodeValue(code: string) {
  const { supabase } = await requireUser();
  await ensureProfile();
  const { data, error } = await supabase.rpc("join_group_by_code", {
    code: code.trim(),
  });
  if (error) return { error: error.message };
  revalidatePath("/");
  redirect(`/g/${data}`);
}

export async function regenerateInviteCode(groupId: string) {
  const { supabase } = await requireUser();
  const { data, error } = await supabase.rpc("regenerate_invite_code", {
    gid: groupId,
  });
  if (error) return { error: error.message };
  revalidatePath(`/g/${groupId}/people`);
  return { ok: true as const, inviteCode: data as string };
}

export async function sendGroupInviteEmail(groupId: string, email: string) {
  const to = email.trim().toLowerCase();
  if (!to) return { error: "Enter an email address." };

  const { supabase, user } = await requireUser();

  const { data: group } = await supabase
    .from("groups")
    .select("id, name, invite_code")
    .eq("id", groupId)
    .single();
  if (!group) return { error: "Group not found." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();

  const inviteLink = getInviteLink(group.invite_code);
  const inviterName = profile?.display_name || user.email || "A friend";

  const mailed = await sendEmail({
    to,
    subject: `Join ${group.name} on Settora`,
    html: groupInviteEmailHtml({
      groupName: group.name,
      inviteLink,
      inviteCode: group.invite_code,
      inviterName,
    }),
    text: `${inviterName} wants you in ${group.name} on Settora.\n\nJoin: ${inviteLink}\nCode: ${group.invite_code}`,
  });

  if (mailed.error) return { error: mailed.error };
  return { ok: true as const };
}

export async function addPaymentSource(
  groupId: string,
  input: {
    name: string;
    kind: SourceKind;
    ownerId?: string;
    last4?: string;
    provider?: string;
  }
) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("payment_sources").insert({
    group_id: groupId,
    name: input.name,
    kind: input.kind,
    owner_id: input.ownerId ?? null,
    last4: input.last4 ?? null,
    provider: input.provider ?? null,
  });
  if (error) return { error: error.message };
  revalidatePath(`/g/${groupId}`);
  return { ok: true as const };
}

export async function addExpense(
  groupId: string,
  input: {
    title: string;
    amountCents: number;
    date: string;
    dueDate: string;
    usedById?: string;
    sourceId: string;
    chargedToSourceId?: string;
    notes?: string;
    splitWith: string[];
    billPath?: string;
  }
) {
  const { supabase, user } = await requireUser();
  // Creator of the spend is always the receiver / approver
  const paidById = user.id;
  let splitWith = input.splitWith.filter(Boolean);
  if (!splitWith.includes(paidById)) {
    splitWith = [...splitWith, paidById];
  }
  if (splitWith.length === 0) return { error: "Split with at least one person." };

  const { data: expense, error } = await supabase
    .from("expenses")
    .insert({
      group_id: groupId,
      title: input.title.trim(),
      amount_cents: input.amountCents,
      date: input.date,
      due_date: input.dueDate,
      paid_by_id: paidById,
      created_by: paidById,
      used_by_id: input.usedById ?? paidById,
      source_id: input.sourceId,
      charged_to_source_id: input.chargedToSourceId ?? null,
      notes: input.notes?.trim() || null,
      bill_path: input.billPath ?? null,
    })
    .select("id")
    .single();

  if (error || !expense) return { error: error?.message ?? "Failed to save." };

  const base = Math.floor(input.amountCents / splitWith.length);
  const remainder = input.amountCents % splitWith.length;
  const shares = splitWith.map((personId, index) => {
    const isPayer = personId === paidById;
    return {
      expense_id: expense.id,
      person_id: personId,
      amount_cents: base + (index < remainder ? 1 : 0),
      status: isPayer ? "paid" : "unpaid",
      paid_at: isPayer ? input.date : null,
      repaid_with: isPayer ? "paid-the-card" : null,
    };
  });

  const { error: shareError } = await supabase.from("shares").insert(shares);
  if (shareError) return { error: shareError.message };

  revalidatePath(`/g/${groupId}`);
  return { ok: true as const };
}

export async function claimPayment(
  groupId: string,
  input: { expenseId: string; personId: string; method: RepayMethod }
) {
  const { supabase, user } = await requireUser();

  const { data: share, error: shareError } = await supabase
    .from("shares")
    .select("id, status")
    .eq("expense_id", input.expenseId)
    .eq("person_id", input.personId)
    .maybeSingle();

  if (shareError || !share) return { error: "Share not found." };
  if (share.status === "paid") return { error: "Already marked paid." };
  if (share.status === "pending") {
    return { error: "A payment claim is already waiting for approval." };
  }

  const { error: claimError } = await supabase.from("payment_claims").insert({
    share_id: share.id,
    claimed_by: user.id,
    method: input.method,
    status: "pending",
  });
  if (claimError) return { error: claimError.message };

  const { error: updateError } = await supabase
    .from("shares")
    .update({ status: "pending", repaid_with: input.method })
    .eq("id", share.id);

  if (updateError) return { error: updateError.message };

  revalidatePath(`/g/${groupId}`);
  return { ok: true as const };
}

export async function approveClaim(
  groupId: string,
  input: { expenseId: string; personId: string }
) {
  const { supabase, user } = await requireUser();

  const { data: expense } = await supabase
    .from("expenses")
    .select("paid_by_id")
    .eq("id", input.expenseId)
    .maybeSingle();

  if (!expense) return { error: "Expense not found." };
  if (expense.paid_by_id !== user.id) {
    return { error: "Only the person who is owed can approve." };
  }

  const { data: share } = await supabase
    .from("shares")
    .select("id, status")
    .eq("expense_id", input.expenseId)
    .eq("person_id", input.personId)
    .maybeSingle();

  if (!share || share.status !== "pending") {
    return { error: "No pending claim to approve." };
  }

  const today = new Date().toISOString().slice(0, 10);

  await supabase
    .from("payment_claims")
    .update({
      status: "approved",
      resolved_at: new Date().toISOString(),
      resolved_by: user.id,
    })
    .eq("share_id", share.id)
    .eq("status", "pending");

  const { error } = await supabase
    .from("shares")
    .update({ status: "paid", paid_at: today })
    .eq("id", share.id);

  if (error) return { error: error.message };
  revalidatePath(`/g/${groupId}`);
  return { ok: true as const };
}

export async function rejectClaim(
  groupId: string,
  input: { expenseId: string; personId: string }
) {
  const { supabase, user } = await requireUser();

  const { data: expense } = await supabase
    .from("expenses")
    .select("paid_by_id")
    .eq("id", input.expenseId)
    .maybeSingle();

  if (!expense) return { error: "Expense not found." };
  if (expense.paid_by_id !== user.id) {
    return { error: "Only the person who is owed can reject." };
  }

  const { data: share } = await supabase
    .from("shares")
    .select("id, status")
    .eq("expense_id", input.expenseId)
    .eq("person_id", input.personId)
    .maybeSingle();

  if (!share || share.status !== "pending") {
    return { error: "No pending claim to reject." };
  }

  await supabase
    .from("payment_claims")
    .update({
      status: "rejected",
      resolved_at: new Date().toISOString(),
      resolved_by: user.id,
    })
    .eq("share_id", share.id)
    .eq("status", "pending");

  const { error } = await supabase
    .from("shares")
    .update({ status: "unpaid", repaid_with: null, paid_at: null })
    .eq("id", share.id);

  if (error) return { error: error.message };
  revalidatePath(`/g/${groupId}`);
  return { ok: true as const };
}

export async function claimSettleWith(
  groupId: string,
  otherId: string,
  method: RepayMethod
) {
  const { supabase, user } = await requireUser();

  const { data: expenses } = await supabase
    .from("expenses")
    .select("id, paid_by_id, shares(id, person_id, status)")
    .eq("group_id", groupId);

  let count = 0;
  for (const expense of expenses ?? []) {
    const shares = (expense.shares ?? []) as Array<{
      id: string;
      person_id: string;
      status: string;
    }>;
    for (const share of shares) {
      if (share.status !== "unpaid") continue;
      if (share.person_id !== user.id) continue;
      if (expense.paid_by_id !== otherId) continue;

      await supabase.from("payment_claims").insert({
        share_id: share.id,
        claimed_by: user.id,
        method,
        status: "pending",
      });
      await supabase
        .from("shares")
        .update({ status: "pending", repaid_with: method })
        .eq("id", share.id);
      count += 1;
    }
  }

  revalidatePath(`/g/${groupId}`);
  return { ok: true as const, count };
}
