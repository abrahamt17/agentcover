import type { Metadata } from "next";
import { OrganisationForm } from "@/components/dashboard/settings-forms";
import { ComingSoonBadge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { can } from "@/lib/auth/permissions";
import { requireOrgContext } from "@/lib/auth/session";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Organisation settings" };

export default async function OrganisationSettingsPage() {
  const { organisation, role } = await requireOrgContext();

  return (
    <div className="grid gap-6 xl:grid-cols-3">
      <div className="xl:col-span-2">
        <OrganisationForm
          canEdit={can(role, "organisation.update") && !organisation.is_demo}
          defaults={{
            name: organisation.name,
            website: organisation.website ?? "",
            country: organisation.country ?? "",
            industry: organisation.industry ?? "",
            organisationType: organisation.organisation_type,
            estimatedAgentCount: organisation.estimated_agent_count ?? "",
            primaryUseCases: organisation.primary_use_cases ?? [],
          }}
        />
      </div>
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex-row items-start justify-between gap-3">
            <div className="space-y-1">
              <CardTitle>Plan and billing</CardTitle>
              <CardDescription>Managed by the organisation owner.</CardDescription>
            </div>
            <ComingSoonBadge className="shrink-0" />
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-ink-muted">
              AgentCover has no paid plans yet. Nothing is charged and no payment details are collected.
              Subscription management will appear here when plans are introduced.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Workspace</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-ink-subtle">Created</dt>
                <dd className="text-ink">{formatDate(organisation.created_at)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-ink-subtle">Organisation ID</dt>
                <dd className="truncate font-mono text-xs text-ink-muted">{organisation.id}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
