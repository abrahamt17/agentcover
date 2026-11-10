"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/feedback";
import { acceptInvitationAction } from "@/lib/actions/auth";

export function AcceptInvitation({ token }: { token: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-4">
      {error ? <Alert tone="danger" title={error} /> : null}
      <Button
        size="lg"
        className="w-full"
        loading={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await acceptInvitationAction(token);
            if (result && !result.ok) setError(result.error);
          })
        }
      >
        Accept invitation
      </Button>
    </div>
  );
}
