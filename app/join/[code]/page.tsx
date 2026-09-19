import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { JoinButton } from "./join-button";

export default async function JoinPage({
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
