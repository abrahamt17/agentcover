import type { Metadata } from "next";
import Link from "next/link";
import { SignUpForm } from "@/components/auth/auth-forms";
import { AuthShell } from "@/components/auth/auth-shell";
import { safeRedirectPath } from "@/lib/security/redirect";

export const metadata: Metadata = { title: "Create account" };

type SearchParams = Promise<{ next?: string | string[] }>;

export default async function SignUpPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const rawNext = typeof params.next === "string" ? params.next : undefined;
  const next = rawNext ? safeRedirectPath(rawNext, "/onboarding") : undefined;
  const signInHref = next ? `/sign-in?next=${encodeURIComponent(next)}` : "/sign-in";

  return (
    <AuthShell
      title="Create your account"
      description="Set up a workspace for your organisation. You will verify your email before continuing."
      footer={
        <>
          Already have an account?{" "}
          <Link href={signInHref} className="font-medium text-brand-600 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <SignUpForm next={next} />
    </AuthShell>
  );
}
