import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { JoinButton } from "@/components/join-button";

export default async function GroupJoinPage({
  params,
}: {
  params: Promise<{ groupId: string; code: string }>;
}) {
  const { groupId, code } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(
      `/login?next=${encodeURIComponent(`/join/${groupId}/${code}`)}`
    );
  }

  // Already a member → go straight into the group
  const { data: membership } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (membership) {
    redirect(`/g/${groupId}`);
  }

  const { data: group } = await supabase
    .from("groups")
    .select("name")
    .eq("id", groupId)
    .maybeSingle();

  return (
    <div className="mx-auto flex min-h-full max-w-md flex-1 flex-col justify-center gap-4 px-4 py-16">
      <div>
        <p className="text-sm font-medium text-primary">Settora</p>
        <h1 className="font-heading text-3xl tracking-tight">
          Join {group?.name ?? "group"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You were invited to this group. Invite code{" "}
          <span className="font-mono text-foreground">{code}</span>
        </p>
      </div>
      <JoinButton code={code} />
    </div>
  );
}
