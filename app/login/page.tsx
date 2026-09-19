import { Suspense } from "react";
import LoginPage from "./page-client";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-muted-foreground">Loading…</div>}>
      <LoginPage />
    </Suspense>
  );
}
