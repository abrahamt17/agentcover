import type { Metadata } from "next";
import { Overview, type ActivityItem } from "@/components/dashboard/overview";
import { PageHeader } from "@/components/dashboard/page-header";
import { Alert } from "@/components/ui/feedback";
import { describeAuditEvent } from "@/lib/audit";
import { can } from "@/lib/auth/permissions";
import { requireOrgContext } from "@/lib/auth/session";
import { listAuditEvents } from "@/lib/data/organisation";
import { DEMO_OVERVIEW } from "@/lib/demo/fixtures";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Overview" };

export default async function DashboardPage() {
  const { organisation, profile, role } = await requireOrgContext();
  const isDemo = organisation.is_demo;

  let activity: ActivityItem[] | null = null;
  if (isDemo) {
    activity = DEMO_OVERVIEW.activity;
  } else if (can(role, "audit.view")) {
    const events = await listAuditEvents(organisation.id);
    activity = events.map((event) => ({
      id: event.id,
      actor: event.actor?.full_name || event.actor?.email || "A former member",
      text: describeAuditEvent(event),
      when: formatDateTime(event.created_at),
    }));
  }

  const firstName = profile.full_name?.trim().split(/\s+/)[0];

  return (
    <>
      <PageHeader
        title={firstName ? `Welcome, ${firstName}` : "Overview"}
        description={`Risk and insurance position for ${organisation.name}.`}
      />
      {!isDemo ? (
        <Alert tone="info" title="Your workspace is ready" className="mb-6">
          Organisation, team and access management are live. The agent registry, risk intelligence, insurance,
          monitoring and incident modules are in development, so their sections below are empty rather than
          filled with placeholder numbers.
        </Alert>
      ) : null}
      <Overview demo={isDemo ? DEMO_OVERVIEW : null} activity={activity} />
    </>
  );
}
