# Roadmap

Phases are ordered by dependency: each builds on the record created by the one before. Dates are
deliberately omitted.

## Phase 1 · Foundation (this release)

- [x] Next.js application, design system, public site
- [x] Authentication: sign up, sign in, sign out, password reset, email verification
- [x] Onboarding and organisation tenancy
- [x] Roles, invitations, member management, audit log
- [x] Row Level Security and database-enforced authorisation, with tests
- [x] Dashboard shell with honest empty states; demo preview
- [x] Documentation

Follow-ups before building further:

- [ ] Run the auth and onboarding flows end to end against a live Supabase project; add signed-in
      Playwright tests against a dedicated test project
- [ ] Invitation emails
- [ ] Organisation switcher and ownership transfer
- [ ] Shared-store rate limiting; Content-Security-Policy
- [ ] Generated database types (`supabase gen types`)

## Phase 2 · AI Agent Registry

Tables: `ai_agents`, `agent_versions`, `agent_permissions`.

- Register agents: purpose, owner, deployment, status
- Configuration: model, tools, integrations, data access
- Permission mapping and autonomy level
- Version history
- Developer/agency view: agents grouped by client

## Phase 3 · Risk Intelligence Engine

Tables: `risk_assessments`, `risk_findings`, `risk_controls`.

- Rule-based scoring first, with documented, explainable rules
- Findings and recommended controls
- What-if simulation of configuration changes
- Risk reports (export)
- Dashboards with Recharts

## Phase 4 · Insurance Intelligence

Tables: `insurance_products`, `policies`, `policy_documents`, `knowledge_documents`,
`knowledge_chunks` (pgvector). Supabase Storage for documents.

- Policy upload and structured extraction
- Coverage-gap analysis against identified risks
- Product matching (indicative only)
- First LLM provider behind the `LlmProvider` interface; RAG over policy documents

## Phase 5 · Continuous Monitoring

- Configuration change detection and risk history
- Alerts and notification delivery (uses the stored preferences)
- Background jobs

## Phase 6 · Incident and Claims Intelligence

Tables: `incidents`, `incident_evidence`.

- Incident records linked to agent versions
- Evidence collection and timelines
- Reports to support claim notification

## Phase 7 · AI Copilot and orchestration

Tables: `ai_tasks`, `ai_execution_traces`, `ai_evaluations`.

- Specialised analysts (risk, policy, matching, compliance, incident, support)
- Tool calling, structured outputs, human approval checkpoints
- Tracing, cost and latency monitoring, automated evaluation
- Optional dedicated Python/FastAPI AI service behind `AiTaskService`

## Later

- Insurance partner workspace and authorised report sharing
- Platform admin console
- MFA, SSO, data export and deletion tooling
- Billing and subscriptions
