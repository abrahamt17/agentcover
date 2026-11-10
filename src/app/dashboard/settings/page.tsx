import type { Metadata } from "next";
import { ProfileForm } from "@/components/dashboard/settings-forms";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireOrgContext } from "@/lib/auth/session";
import { ROLE_LABELS } from "@/lib/constants";
import { getNotificationPreferences } from "@/lib/data/organisation";

export const metadata: Metadata = { title: "Profile settings" };

export default async function ProfileSettingsPage() {
  const { user, profile, organisation, role } = await requireOrgContext();
  const preferences = await getNotificationPreferences(user.id);

  return (
    <div className="grid gap-6 xl:grid-cols-3">
      <div className="xl:col-span-2">
        <ProfileForm
          email={profile.email}
          defaults={{
            fullName: profile.full_name ?? "",
            securityAlerts: preferences.security_alerts,
            productUpdates: preferences.product_updates,
          }}
        />
      </div>
      <Card className="h-fit">
        <CardHeader>
          <CardTitle>Your access</CardTitle>
          <CardDescription>Roles are assigned by the organisation owner.</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="space-y-4 text-sm">
            <div>
              <dt className="text-ink-subtle">Organisation</dt>
              <dd className="mt-0.5 font-medium text-ink">{organisation.name}</dd>
            </div>
            <div>
              <dt className="text-ink-subtle">Role</dt>
              <dd className="mt-1">
                <Badge variant="brand">{ROLE_LABELS[role]}</Badge>
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
