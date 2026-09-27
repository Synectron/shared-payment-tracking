import { redirect } from "next/navigation";
import { ProfileView } from "@/components/profile-view";
import { getMyProfile } from "@/lib/data";

export default async function GroupProfilePage() {
  const profile = await getMyProfile();
  if (!profile) redirect("/login");
  return <ProfileView profile={profile} />;
}
