import type { Metadata } from "next";
import Link from "next/link";
import { ResetPasswordForm } from "@/components/auth/auth-forms";
import { AuthShell } from "@/components/auth/auth-shell";
import { Alert } from "@/components/ui/feedback";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Choose a new password" };

/** Reached from the password-recovery email via /auth/confirm, which establishes the session. */
export default async function ResetPasswordPage() {
  const user = await getCurrentUser();

  return (
    <AuthShell
      title="Choose a new password"
      description={user ? `Setting a new password for ${user.email}.` : "Use the link from your password reset email."}
      footer={
        <Link href="/sign-in" className="font-medium text-brand-600 hover:underline">
          Back to sign in
        </Link>
      }
    >
      {user ? (
        <ResetPasswordForm />
      ) : (
        <Alert tone="warning" title="This reset link is invalid or has expired">
          <Link href="/forgot-password">Request a new password reset link</Link>.
        </Alert>
      )}
    </AuthShell>
  );
}
