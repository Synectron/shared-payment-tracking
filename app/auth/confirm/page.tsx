import { Suspense } from "react";
import AuthConfirmClient from "./confirm-client";

export default function AuthConfirmPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-full flex-1 items-center justify-center px-4 py-16">
          <p className="text-sm text-muted-foreground">Finishing sign-in…</p>
        </div>
      }
    >
      <AuthConfirmClient />
    </Suspense>
  );
}
