import { LogOut } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Logo } from "@/components/logo";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/lib/actions/auth";
import { getMemberships, getProfile, requireUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Set up your organisation" };

export default async function OnboardingPage() {
  const user = await requireUser("/onboarding");
  const [memberships, profile] = await Promise.all([getMemberships(), getProfile()]);
  if (memberships.length > 0) redirect("/dashboard");

  return (
    <div className="flex min-h-dvh flex-1 flex-col">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex h-16 w-full max-w-3xl items-center justify-between px-5">
          <Logo />
          <form action={signOutAction}>
            <Button type="submit" variant="ghost" size="sm">
              <LogOut aria-hidden />
              Sign out
            </Button>
          </form>
        </div>
      </header>
      <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-10">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Set up your organisation</h1>
        <p className="mb-8 mt-2 text-sm text-ink-muted">
          Three short steps. You become the owner of the organisation and can invite colleagues afterwards.
        </p>
        <OnboardingForm defaultName={profile?.full_name ?? ""} email={user.email ?? ""} />
      </main>
    </div>
  );
}
