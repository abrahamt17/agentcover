import type { RiskLevel } from "@/components/ui/badge";

/**
 * Synthetic sample data for the demo organisation.
 *
 * Everything in this file is fictional. It is rendered only on the public
 * /demo preview and for organisations flagged `is_demo`, and always under a
 * visible "DEMO DATA" label. It is static: nothing here is read from, or
 * written to, the database.
 */

export type OverviewData = {
  summary: { registered: number; assessed: number; highRisk: number; openIncidents: number };
  agents: {
    name: string;
    status: "Active" | "Paused" | "Draft";
    deployment: string;
    assessment: "Assessed" | "In review" | "Not assessed";
    risk: RiskLevel | null;
  }[];
  riskDistribution: Record<RiskLevel, number>;
  riskChanges: { agent: string; from: RiskLevel; to: RiskLevel; when: string; reason: string }[];
  findings: { title: string; agent: string; level: RiskLevel }[];
  insurance: { policiesUploaded: number; expiringSoon: number; matchingRequests: number };
  activity: { id: string; actor: string; text: string; when: string }[];
};

export const DEMO_ORGANISATION = {
  name: "Northstar Automation GmbH",
  type: "AI development agency",
  country: "Germany",
};

export const DEMO_MEMBERS = [
  { name: "Demo Owner", email: "owner@northstar-automation.example", role: "Owner" },
  { name: "Demo Admin", email: "admin@northstar-automation.example", role: "Admin" },
  { name: "Demo Developer", email: "developer@northstar-automation.example", role: "AI Developer" },
];

export const DEMO_OVERVIEW: OverviewData = {
  summary: { registered: 12, assessed: 9, highRisk: 3, openIncidents: 1 },
  agents: [
    { name: "Invoice Reconciliation Agent", status: "Active", deployment: "Client production", assessment: "Assessed", risk: "high" },
    { name: "Support Triage Agent", status: "Active", deployment: "Client production", assessment: "Assessed", risk: "medium" },
    { name: "Procurement Negotiation Agent", status: "Paused", deployment: "Client pilot", assessment: "In review", risk: "critical" },
    { name: "Sales Outreach Assistant", status: "Active", deployment: "Internal", assessment: "Assessed", risk: "low" },
    { name: "Contract Review Assistant", status: "Draft", deployment: "Development", assessment: "Not assessed", risk: null },
  ],
  riskDistribution: { low: 4, medium: 2, high: 2, critical: 1 },
  riskChanges: [
    { agent: "Procurement Negotiation Agent", from: "high", to: "critical", when: "2 days ago", reason: "Payment approval tool added" },
    { agent: "Support Triage Agent", from: "high", to: "medium", when: "5 days ago", reason: "Refund limit introduced" },
    { agent: "Invoice Reconciliation Agent", from: "medium", to: "high", when: "9 days ago", reason: "Write access to ledger granted" },
  ],
  findings: [
    { title: "Can approve payments without human review", agent: "Procurement Negotiation Agent", level: "critical" },
    { title: "Write access to the general ledger exceeds stated purpose", agent: "Invoice Reconciliation Agent", level: "high" },
    { title: "No spending limit configured for supplier orders", agent: "Procurement Negotiation Agent", level: "high" },
    { title: "Customer personal data sent to a third-party tool", agent: "Support Triage Agent", level: "medium" },
  ],
  insurance: { policiesUploaded: 2, expiringSoon: 1, matchingRequests: 1 },
  activity: [
    { id: "a1", actor: "Demo Developer", text: "registered Contract Review Assistant", when: "Today, 09:14" },
    { id: "a2", actor: "Demo Admin", text: "paused Procurement Negotiation Agent", when: "Yesterday, 16:40" },
    { id: "a3", actor: "Demo Owner", text: "uploaded a professional indemnity policy", when: "3 days ago" },
    { id: "a4", actor: "Demo Admin", text: "opened an incident for a duplicate supplier payment", when: "4 days ago" },
    { id: "a5", actor: "Demo Owner", text: "invited Demo Developer to the organisation", when: "2 weeks ago" },
  ],
};
