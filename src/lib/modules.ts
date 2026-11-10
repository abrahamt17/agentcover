/**
 * Copy for modules that are planned but not yet built. Used by the dashboard
 * placeholder pages so that "what is coming" is described in one place and
 * stays consistent with docs/ROADMAP.md.
 */
export const PLANNED_MODULES = {
  agents: {
    title: "AI Agents",
    phase: "Phase 2",
    summary:
      "A structured register of every AI agent your organisation deploys or builds for clients, so that risk can be assessed against what each agent can actually do.",
    capabilities: [
      "Inventory of agents with owner, purpose, deployment environment and status.",
      "Configuration records: model, tools, integrations and data the agent can reach.",
      "Permission mapping, including what the agent can do without human approval.",
      "Version history, so changes to an agent's capabilities are traceable.",
    ],
  },
  risk: {
    title: "Risk Intelligence",
    phase: "Phase 3",
    summary:
      "Assessments that translate an agent's configuration and permissions into operational and financial exposure, with findings you can act on.",
    capabilities: [
      "Risk scoring per agent with the reasoning behind each score.",
      "Exposure mapping from permissions to concrete loss scenarios.",
      "Findings for excessive permissions, with recommended controls.",
      "What-if simulations to see how a configuration change would move the risk level.",
      "Exportable risk reports for clients and internal stakeholders.",
    ],
    note: "Scores will be decision support based on documented rules and model analysis. They are not an actuarial model and are not underwriting.",
  },
  insurance: {
    title: "Insurance",
    phase: "Phase 4",
    summary:
      "Tools to understand how your existing insurance relates to AI-agent risk and which products may be relevant to discuss with a licensed intermediary.",
    capabilities: [
      "Upload policy documents and extract key terms, limits and exclusions.",
      "Coverage-gap analysis against the risks identified for your agents.",
      "Product matching that highlights potentially relevant insurance products.",
      "Expiry tracking for uploaded policies.",
    ],
    note: "AgentCover is a technology and risk-intelligence platform. It does not issue policies, underwrite insurance or make coverage decisions, and it currently has no insurer or broker partnerships.",
  },
  monitoring: {
    title: "Monitoring",
    phase: "Phase 5",
    summary:
      "Continuous tracking of your registered agents, so that a change in configuration is reflected in the risk picture without waiting for the next review.",
    capabilities: [
      "Detection of configuration and permission changes.",
      "Alerts when a change raises an agent's risk level.",
      "Risk history per agent over time.",
      "Notification rules for owners and admins.",
    ],
  },
  incidents: {
    title: "Incidents",
    phase: "Phase 6",
    summary:
      "A structured record of things that go wrong with an AI agent, built to preserve the evidence an insurer or auditor would later ask for.",
    capabilities: [
      "Incident records linked to the agent and version involved.",
      "Evidence collection: logs, configuration snapshots and timelines.",
      "Assisted incident analysis and root-cause notes.",
      "Reports suitable for sharing with a broker or insurer when notifying a claim.",
    ],
    note: "AgentCover will help prepare documentation. Claims are always decided by the insurer.",
  },
  copilot: {
    title: "AI Copilot",
    phase: "Phase 7",
    summary:
      "A conversational assistant over your own registry, assessments and policy documents, backed by specialised agents and retrieval.",
    capabilities: [
      "Questions answered from your organisation's own records, with sources cited.",
      "Specialised analysts for agent risk, policy wording, matching and incident response.",
      "Human approval checkpoints before any consequential action.",
      "Tracing, cost and latency monitoring, and automated evaluation of answers.",
    ],
    note: "No AI model is connected to the platform in the current phase.",
  },
} as const;
