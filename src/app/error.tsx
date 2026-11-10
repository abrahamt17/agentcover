"use client";

import { Button } from "@/components/ui/button";

/** Generic error boundary. Shows no internal details; the digest lets support correlate server logs. */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-h-dvh flex-1 flex-col items-center justify-center bg-surface px-5 text-center">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">Something went wrong</h1>
      <p className="mt-2 max-w-sm text-sm text-ink-muted">
        The page could not be loaded. Try again, and if the problem continues, sign out and back in.
      </p>
      {error.digest ? <p className="mt-3 font-mono text-xs text-ink-subtle">Reference: {error.digest}</p> : null}
      <Button className="mt-6" onClick={reset}>
        Try again
      </Button>
    </main>
  );
}
