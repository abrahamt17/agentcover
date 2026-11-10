import type { Metadata } from "next";
import Link from "next/link";
import { SignInForm } from "@/components/auth/auth-forms";
import { AuthShell } from "@/components/auth/auth-shell";
import { Alert } from "@/components/ui/feedback";
import { safeRedirectPath } from "@/lib/security/redirect";

export const metadata: Metadata = { title: "Sign in" };

type SearchParams = Promise<{ next?: string | string[]; error?: string | string[] }>;

export default async function SignInPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const rawNext = typeof params.next === "string" ? params.next : undefined;
  const next = rawNext ? safeRedirectPath(rawNext, "/dashboard") : undefined;
  const signUpHref = next ? `/sign-up?next=${encodeURIComponent(next)}` : "/sign-up";

  return (
    <AuthShell
      title="Sign in"
      description="Access your organisation's AgentCover workspace."
      footer={
        <>
          New to AgentCover?{" "}
          <Link href={signUpHref} className="font-medium text-brand-600 hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      {params.error === "link_invalid" ? (
        <Alert tone="danger" title="That link is invalid or has expired" className="mb-4">
          Request a new one, or sign in if you have already verified your email.
        </Alert>
      ) : null}
      <SignInForm next={next} />
    </AuthShell>
  );
}
