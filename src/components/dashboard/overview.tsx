import {
  ArrowRight,
  Bot,
  FileText,
  History,
  ListChecks,
  Radar,
  ShieldAlert,
  Siren,
  TrendingUp,
  Umbrella,
  type LucideIcon,
} from "lucide-react";
import { ComingSoonBadge, DemoBadge, RISK_META, RiskBadge, Status, type RiskLevel } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/feedback";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { OverviewData } from "@/lib/demo/fixtures";
import { cn } from "@/lib/utils";

export type ActivityItem = { id: string; actor: string; text: string; when: string };

type OverviewProps = {
  /** Synthetic module data. Null for real organisations, whose modules are not available yet. */
  demo: OverviewData | null;
  /** Organisation events. Real audit-log entries for real organisations. Null when the viewer may not see them. */
  activity: ActivityItem[] | null;
};

const RISK_ORDER: RiskLevel[] = ["low", "medium", "high", "critical"];

function SectionHeader({ title, description, demo }: { title: string; description: string; demo: boolean }) {
  return (
    <CardHeader className="flex-row items-start justify-between gap-3">
      <div className="space-y-1">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </div>
      {demo ? <DemoBadge className="shrink-0" /> : <ComingSoonBadge className="shrink-0" />}
    </CardHeader>
  );
}

function StatCard({
  label,
  value,
  caption,
  icon: Icon,
  demo,
}: {
  label: string;
  value: number | null;
  caption: string;
  icon: LucideIcon;
  demo: boolean;
}) {
  return (
    <Card>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-ink-muted">{label}</p>
          {demo ? <DemoBadge className="shrink-0" /> : <Icon className="size-4 shrink-0 text-ink-subtle" aria-hidden />}
        </div>
        <p className={cn("text-3xl font-semibold tabular-nums tracking-tight", value === null ? "text-line-strong" : "text-ink")}>
          {value === null ? <span aria-label="Not available yet">–</span> : value}
        </p>
        <p className="text-xs text-ink-subtle">{caption}</p>
      </CardContent>
    </Card>
  );
}

export function Overview({ demo, activity }: OverviewProps) {
  const isDemo = demo !== null;
  const totalRisk = demo ? RISK_ORDER.reduce((sum, level) => sum + demo.riskDistribution[level], 0) : 0;

  return (
    <div className="space-y-6">
      <section aria-label="Summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Registered AI agents" value={demo?.summary.registered ?? null} caption={isDemo ? "Across all clients" : "Available with the Agent Registry"} icon={Bot} demo={isDemo} />
        <StatCard label="Assessed agents" value={demo?.summary.assessed ?? null} caption={isDemo ? "With a current assessment" : "Available with Risk Intelligence"} icon={ListChecks} demo={isDemo} />
        <StatCard label="High-risk agents" value={demo?.summary.highRisk ?? null} caption={isDemo ? "High or critical" : "Available with Risk Intelligence"} icon={ShieldAlert} demo={isDemo} />
        <StatCard label="Open incidents" value={demo?.summary.openIncidents ?? null} caption={isDemo ? "Under investigation" : "Available with Incidents"} icon={Siren} demo={isDemo} />
      </section>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <SectionHeader title="Agent overview" description="Recently registered agents, their deployment and assessment status." demo={isDemo} />
          {demo ? (
            <div className="mt-4 border-t border-line">
              <Table>
                <TableHeader>
                  <tr>
                    <TableHead>Agent</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Deployment</TableHead>
                    <TableHead>Latest assessment</TableHead>
                  </tr>
                </TableHeader>
                <TableBody>
                  {demo.agents.map((agent) => (
                    <TableRow key={agent.name}>
                      <TableCell className="font-medium">{agent.name}</TableCell>
                      <TableCell>
                        <Status tone={agent.status === "Active" ? "success" : agent.status === "Paused" ? "warning" : "neutral"}>
                          {agent.status}
                        </Status>
                      </TableCell>
                      <TableCell className="text-ink-muted">{agent.deployment}</TableCell>
                      <TableCell>
                        {agent.risk ? <RiskBadge level={agent.risk} /> : <span className="text-ink-subtle">{agent.assessment}</span>}
                        {agent.risk && agent.assessment === "In review" ? (
                          <span className="ml-2 text-xs text-ink-subtle">In review</span>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <EmptyState
              icon={Bot}
              title="No agents registered"
              description="The Agent Registry is the next module to ship. You will be able to record each agent's purpose, permissions, tools and integrations here."
            />
          )}
        </Card>

        <Card>
          <SectionHeader title="Risk distribution" description="Assessed agents by risk level." demo={isDemo} />
          {demo ? (
            <CardContent>
              <div
                className="flex h-2.5 overflow-hidden rounded-full bg-subtle"
                role="img"
                aria-label={RISK_ORDER.map((l) => `${RISK_META[l].label}: ${demo.riskDistribution[l]}`).join(", ")}
              >
                {RISK_ORDER.map((level) => (
                  <div
                    key={level}
                    className={cn(RISK_META[level].bar, "border-r-2 border-surface last:border-r-0")}
                    style={{ width: `${(demo.riskDistribution[level] / totalRisk) * 100}%` }}
                  />
                ))}
              </div>
              <dl className="mt-5 space-y-3">
                {RISK_ORDER.map((level) => (
                  <div key={level} className="flex items-center justify-between text-sm">
                    <dt className="flex items-center gap-2 text-ink-muted">
                      <span className={cn("size-2.5 rounded-sm", RISK_META[level].bar)} aria-hidden />
                      {RISK_META[level].label}
                    </dt>
                    <dd className="font-medium tabular-nums text-ink">
                      {demo.riskDistribution[level]}
                      <span className="ml-2 inline-block w-9 text-right text-xs font-normal text-ink-subtle">
                        {Math.round((demo.riskDistribution[level] / totalRisk) * 100)}%
                      </span>
                    </dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          ) : (
            <EmptyState
              icon={Radar}
              title="No assessments yet"
              description="Once agents are assessed, the spread of risk levels across your portfolio appears here."
            />
          )}
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <SectionHeader title="Highest-priority findings" description="Issues to review first, ordered by severity." demo={isDemo} />
          {demo ? (
            <ul className="mt-4 divide-y divide-line border-t border-line">
              {demo.findings.map((finding) => (
                <li key={finding.title} className="flex items-start justify-between gap-4 px-5 py-3.5 sm:px-6">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink">{finding.title}</p>
                    <p className="mt-0.5 truncate text-xs text-ink-subtle">{finding.agent}</p>
                  </div>
                  <RiskBadge level={finding.level} className="shrink-0" />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={ShieldAlert}
              title="No findings"
              description="Risk assessments will list excessive permissions and potential exposures here, most severe first."
            />
          )}
        </Card>

        <Card>
          <SectionHeader title="Recent risk changes" description="Agents whose risk level moved after a configuration change." demo={isDemo} />
          {demo ? (
            <ul className="mt-4 divide-y divide-line border-t border-line">
              {demo.riskChanges.map((change) => (
                <li key={change.agent} className="px-5 py-3.5 sm:px-6">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-sm font-medium text-ink">{change.agent}</p>
                    <span className="shrink-0 text-xs text-ink-subtle">{change.when}</span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <RiskBadge level={change.from} />
                    <ArrowRight className="size-3.5 text-ink-subtle" aria-label="changed to" />
                    <RiskBadge level={change.to} />
                    <span className="text-xs text-ink-muted">{change.reason}</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={TrendingUp}
              title="No risk changes"
              description="Continuous monitoring will record when a configuration change raises or lowers an agent's risk level."
            />
          )}
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <SectionHeader title="Insurance overview" description="Policy documents and matching requests for your organisation." demo={isDemo} />
          {demo ? (
            <CardContent>
              <dl className="grid grid-cols-3 gap-4">
                {[
                  { label: "Policies uploaded", value: demo.insurance.policiesUploaded },
                  { label: "Expiring within 60 days", value: demo.insurance.expiringSoon },
                  { label: "Matching requests", value: demo.insurance.matchingRequests },
                ].map((item) => (
                  <div key={item.label} className="rounded-lg border border-line bg-subtle/50 p-3">
                    <dd className="text-2xl font-semibold tabular-nums text-ink">{item.value}</dd>
                    <dt className="mt-1 text-xs text-ink-muted">{item.label}</dt>
                  </div>
                ))}
              </dl>
              <p className="mt-4 text-xs leading-relaxed text-ink-subtle">
                AgentCover does not issue policies or decide coverage. Matching will indicate products that may be
                relevant, for review with a licensed broker or insurer.
              </p>
            </CardContent>
          ) : (
            <EmptyState
              icon={Umbrella}
              title="No policies uploaded"
              description="You will be able to upload existing policies, see expiry dates and request product matching. AgentCover does not issue policies or decide coverage."
            />
          )}
        </Card>

        <Card>
          <CardHeader className="flex-row items-start justify-between gap-3">
            <div className="space-y-1">
              <CardTitle>Activity</CardTitle>
              <CardDescription>Recent events in this organisation.</CardDescription>
            </div>
            {isDemo ? <DemoBadge className="shrink-0" /> : null}
          </CardHeader>
          {activity === null ? (
            <EmptyState
              icon={History}
              title="Visible to owners and admins"
              description="The organisation activity log is available to owners and admins."
            />
          ) : activity.length === 0 ? (
            <EmptyState icon={FileText} title="No activity yet" description="Organisation events such as invitations and role changes are recorded here." />
          ) : (
            <ul className="mt-4 divide-y divide-line border-t border-line">
              {activity.map((item) => (
                <li key={item.id} className="flex items-start justify-between gap-4 px-5 py-3 sm:px-6">
                  <p className="min-w-0 text-sm text-ink-muted">
                    <span className="font-medium text-ink">{item.actor}</span> {item.text}
                  </p>
                  <span className="shrink-0 whitespace-nowrap text-xs text-ink-subtle">{item.when}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
