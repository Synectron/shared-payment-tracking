import Link from "next/link";
import { redirect } from "next/navigation";
import { ProfileView } from "@/components/profile-view";
import { SiteFooter } from "@/components/site-footer";
import { getMyProfile } from "@/lib/data";

export default async function ProfilePage() {
  const profile = await getMyProfile();
  if (!profile) redirect("/login?next=/profile");

  return (
    <div className="mx-auto flex min-h-full w-full max-w-lg flex-1 flex-col gap-6 px-4 py-10">
      <Link
        href="/"
        className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
      >
        ← Your groups
      </Link>
      <ProfileView profile={profile} />
      <SiteFooter className="-mx-4 mt-4 border-t-0" />
    </div>
  );
}
