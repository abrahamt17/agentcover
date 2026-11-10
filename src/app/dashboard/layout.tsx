import { DashboardShell } from "@/components/dashboard/shell";
import { requireOrgContext } from "@/lib/auth/session";
import { ROLE_LABELS } from "@/lib/constants";

/**
 * Every dashboard route renders inside this layout, which resolves the caller's
 * organisation on the server. Signed-out users are redirected to sign-in and
 * users without an organisation to onboarding. Pages call requireOrgContext()
 * themselves as well, so no page depends on the layout for its access check.
 */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const context = await requireOrgContext();

  return (
    <DashboardShell
      organisation={{ name: context.organisation.name, isDemo: context.organisation.is_demo }}
      user={{ name: context.profile.full_name ?? "", email: context.profile.email }}
      roleLabel={ROLE_LABELS[context.role]}
    >
      {children}
    </DashboardShell>
  );
}
