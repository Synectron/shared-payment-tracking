"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/spinner";

/** Submit button that disables + shows a spinner while a server action is pending. */
export function PendingSubmitButton({
  children,
  pendingLabel,
  disabled,
  ...props
}: Omit<React.ComponentProps<typeof Button>, "type"> & {
  pendingLabel?: string;
}) {
  const { pending } = useFormStatus();
  const isPending = pending;

  return (
    <Button type="submit" {...props} disabled={disabled || isPending}>
      {isPending ? (
        <>
          <Spinner
            className={
              props.variant === "secondary" || props.variant === "outline"
                ? undefined
                : "text-primary-foreground"
            }
          />
          {pendingLabel ?? children}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
