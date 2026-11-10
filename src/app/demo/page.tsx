import type { Metadata } from "next";
import { Overview } from "@/components/dashboard/overview";
import { PageHeader } from "@/components/dashboard/page-header";
import { DashboardShell } from "@/components/dashboard/shell";
import { Badge, DemoBadge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DEMO_MEMBERS, DEMO_ORGANISATION, DEMO_OVERVIEW } from "@/lib/demo/fixtures";

export const metadata: Metadata = {
  title: "Demo preview",
  description: "A read-only preview of the AgentCover dashboard using a fictional organisation and synthetic data.",
};

/**
 * Public, read-only preview of the dashboard.
 *
 * It renders static fixtures only. There is no session, no database access and
 * no credential involved, so it cannot expose or reach any customer data.
 */
export default function DemoPage() {
  return (
    <DashboardShell
      preview
      organisation={{ name: DEMO_ORGANISATION.name, isDemo: true }}
      user={{ name: "Demo Owner", email: DEMO_MEMBERS[0].email }}
      roleLabel="Owner"
    >
      <PageHeader
        title="Overview"
        description={`${DEMO_ORGANISATION.name} · ${DEMO_ORGANISATION.type} · ${DEMO_ORGANISATION.country}. A fictional organisation showing how the dashboard is intended to look once the risk and insurance modules are released.`}
      />
      <Overview demo={DEMO_OVERVIEW} activity={DEMO_OVERVIEW.activity} />

      <Card className="mt-6">
        <CardHeader className="flex-row items-start justify-between gap-3 pb-5">
          <div className="space-y-1">
            <CardTitle>Workspace members</CardTitle>
            <CardDescription>Roles control what each person can see and change.</CardDescription>
          </div>
          <DemoBadge className="shrink-0" />
        </CardHeader>
        <div className="border-t border-line">
          <Table>
            <TableHeader>
              <tr>
                <TableHead>Member</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
              </tr>
            </TableHeader>
            <TableBody>
              {DEMO_MEMBERS.map((member) => (
                <TableRow key={member.email}>
                  <TableCell className="font-medium">{member.name}</TableCell>
                  <TableCell className="text-ink-muted">{member.email}</TableCell>
                  <TableCell>
                    <Badge variant={member.role === "Owner" ? "navy" : "neutral"}>{member.role}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </DashboardShell>
  );
}
