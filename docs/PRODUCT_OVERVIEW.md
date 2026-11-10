# Product overview

## What AgentCover is

AgentCover helps organisations understand, manage and prepare to insure the risks created by autonomous
AI agents: software that can take actions (send messages, change records, place orders, approve
payments) rather than only give advice.

It is a technology and risk-intelligence platform. It is not an insurance carrier, broker or
intermediary. It never issues policies, underwrites, or decides whether a loss is covered.

## Who it is for

**Businesses deploying AI agents**
- register the agents they use and what those agents are permitted to do;
- assess operational and financial risk;
- review potentially relevant insurance products;
- monitor changes and manage incidents.

**AI developers and agencies**
- register agents they build for clients;
- find excessive permissions and exposures before deployment;
- generate risk reports and demonstrate responsible deployment practice.

**Later:** licensed brokers, insurers and MGAs as authorised partners. No partnerships exist today.

## The platform (target design)

```
1. AI Agent Registry            Inventory · Configuration · Permissions · Integrations
        ↓
2. AI Risk Intelligence Engine  Risk scoring · Exposure mapping · What-if simulations · Controls
        ↓
3. Insurance Intelligence   |   4. Continuous Monitoring
   Policy analysis              Configuration changes
   Product matching             Alerts
   Coverage gaps                Risk history
        ↓
5. Incident & Claims Intelligence   Incident analysis · Evidence collection · Reports

─────────────────────────────────────────────────────────────
AI Orchestration Layer   Specialised agents · RAG · Tool calling · Evaluation · Observability
```

Planned AI specialists: Agent Risk Analyst, Insurance Policy Analyst, Insurance Matching Agent,
Compliance Research Agent, Incident Response Agent, Customer Support Agent.

## What exists in Phase 1

- Accounts with email verification and password reset.
- Onboarding that creates an organisation and makes the creator its owner.
- Organisation workspaces with roles: Owner, Admin, Member, AI Developer (and reserved Insurance
  Partner; separately assigned Platform Admin).
- Invitations, role changes and member removal, all audited.
- A dashboard shell with an overview, settings and placeholder pages for the six future modules.
- A public site and a read-only demo preview using a fictional organisation.

## Product rules

These are enforced in copy and UI, and checked in the browser tests where practical.

1. **No invented evidence.** No customer numbers, testimonials or statistics that are not real.
2. **Label everything.** Each feature is visibly one of: available, coming soon, or demo data. Synthetic
   data always carries a "DEMO DATA" badge.
3. **No fake functionality.** Unbuilt modules have explanatory pages, not mock interactions.
4. **Claims we do not make:** being first in any market; guaranteeing coverage; having insurer
   partnerships; having validated demand; having a proprietary actuarial model.
5. **Decision support only.** Risk outputs will be explained and attributable, and never presented as
   underwriting, legal advice or a coverage decision.
