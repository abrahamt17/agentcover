import type { Metadata } from "next";
import Link from "next/link";
import { AcceptInvitation } from "@/components/auth/accept-invitation";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Organisation invitation",
  // Invitation links carry a secret token; keep them out of search indexes and referrers.
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const user = await getCurrentUser();
  const next = encodeURIComponent(`/invite/${token}`);

  return (
    <AuthShell
      title="You have been invited"
      description={
        user
          ? `Accept to join the organisation as ${user.email}. The invitation must have been sent to this address.`
          : "Sign in or create an account with the email address the invitation was sent to, then accept it."
      }
    >
      {user ? (
        <AcceptInvitation token={token} />
      ) : (
        <div className="flex flex-col gap-3">
          <Button asChild size="lg">
            <Link href={`/sign-in?next=${next}`}>Sign in to accept</Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <Link href={`/sign-up?next=${next}`}>Create an account</Link>
          </Button>
        </div>
      )}
    </AuthShell>
  );
}
