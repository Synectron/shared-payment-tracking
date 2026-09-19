import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { JoinButton } from "@/components/join-button";

/** Legacy invite URLs: /join/{code} → resolve group and send to group-scoped link. */
export default async function LegacyJoinPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/join/${code}`)}`);
  }

  try {
    const admin = createAdminClient();
    const { data: group } = await admin
      .from("groups")
      .select("id")
      .eq("invite_code", code)
      .maybeSingle();

    if (group) {
      redirect(`/join/${group.id}/${code}`);
    }
  } catch {
    // Fall through to bare join UI if admin is unavailable
  }

  return (
    <div className="mx-auto flex min-h-full max-w-md flex-1 flex-col justify-center gap-4 px-4 py-16">
      <div>
        <p className="text-sm font-medium text-primary">Settora</p>
        <h1 className="font-heading text-3xl tracking-tight">Join group</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Invite code <span className="font-mono text-foreground">{code}</span>
        </p>
      </div>
      <JoinButton code={code} />
    </div>
  );
}
