export function siteOrigin() {
  if (typeof window !== "undefined") return window.location.origin;
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:43123")
  );
}

/** Group-scoped invite URL (not a generic app-wide join path). */
export function getInviteLink(groupId: string, inviteCode: string) {
  return `${siteOrigin()}/join/${groupId}/${inviteCode}`;
}

/**
 * Accept a raw invite code or a pasted invite URL.
 * Supports `/join/{groupId}/{code}` and legacy `/join/{code}`.
 */
export function parseInviteInput(raw: string): {
  code: string;
  groupId?: string;
} | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // Bare code (8 hex chars typical, allow a bit of slack)
  if (/^[a-zA-Z0-9_-]{4,32}$/.test(trimmed) && !trimmed.includes("/")) {
    return { code: trimmed.toLowerCase() };
  }

  try {
    const url = new URL(
      trimmed.startsWith("http") ? trimmed : `https://placeholder.local${trimmed.startsWith("/") ? "" : "/"}${trimmed}`
    );
    const parts = url.pathname.split("/").filter(Boolean);
    const joinIdx = parts.findIndex((p) => p === "join");
    if (joinIdx >= 0) {
      const a = parts[joinIdx + 1];
      const b = parts[joinIdx + 2];
      if (a && b) {
        // /join/{groupId}/{code}
        return { groupId: a, code: b.toLowerCase() };
      }
      if (a) {
        // legacy /join/{code}
        return { code: a.toLowerCase() };
      }
    }
  } catch {
    // fall through
  }

  // Last path segment as code if it looks like one
  const segment = trimmed.split(/[/?#]/).filter(Boolean).pop();
  if (segment && /^[a-zA-Z0-9_-]{4,32}$/.test(segment)) {
    return { code: segment.toLowerCase() };
  }

  return null;
}
