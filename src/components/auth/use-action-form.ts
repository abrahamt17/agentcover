"use client";

import { useState, useTransition } from "react";
import type { FieldValues, Path, UseFormReturn } from "react-hook-form";
import type { ActionResult } from "@/lib/types";

/**
 * Bridges a react-hook-form instance to a server action:
 * client-side validation first, then the server's verdict (which re-validates
 * with the same schema) is mapped back onto the fields.
 */
export function useActionForm<TValues extends FieldValues, TData = undefined>(
  form: UseFormReturn<TValues>,
  action: (values: TValues) => Promise<ActionResult<TData> | void>,
  onSuccess?: (result: Extract<ActionResult<TData>, { ok: true }>) => void,
) {
  const [result, setResult] = useState<ActionResult<TData> | null>(null);
  const [pending, startTransition] = useTransition();

  const onSubmit = form.handleSubmit((values) => {
    setResult(null);
    startTransition(async () => {
      let response: ActionResult<TData> | void;
      try {
        response = await action(values);
      } catch (error) {
        // Redirects thrown by the server action must propagate to the router.
        if (isRedirect(error)) throw error;
        response = { ok: false, error: "Something went wrong. Please try again." };
      }
      if (!response) return;
      setResult(response);
      if (response.ok) {
        onSuccess?.(response);
        return;
      }
      for (const [field, messages] of Object.entries(response.fieldErrors ?? {})) {
        if (messages?.[0]) form.setError(field as Path<TValues>, { message: messages[0] });
      }
    });
  });

  return { onSubmit, pending, result, clearResult: () => setResult(null) };
}

function isRedirect(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest: unknown }).digest === "string" &&
    (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}
