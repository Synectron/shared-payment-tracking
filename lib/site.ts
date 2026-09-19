export function siteOrigin() {
  if (typeof window !== "undefined") return window.location.origin;
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:43123")
  );
}

export function getInviteLink(inviteCode: string) {
  return `${siteOrigin()}/join/${inviteCode}`;
}
