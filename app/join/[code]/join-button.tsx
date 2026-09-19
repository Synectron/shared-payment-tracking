"use client";

import { useState } from "react";
import { joinGroupByCodeValue } from "@/lib/actions";
import { Button } from "@/components/ui/button";

export function JoinButton({ code }: { code: string }) {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function join() {
    setPending(true);
    setError("");
    const result = await joinGroupByCodeValue(code);
    if (result?.error) {
      setError(result.error);
      setPending(false);
    }
  }

  return (
    <div className="space-y-3">
      <Button className="w-full" onClick={join} disabled={pending}>
        {pending ? "Joining…" : "Join this group"}
      </Button>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
