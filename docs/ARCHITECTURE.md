# Architecture

## Overview

```
Browser
  │  HTML, Server Actions (no Supabase client in the browser)
  ▼
Next.js 16 (App Router) on Vercel
  ├─ src/proxy.ts            session refresh + optimistic route gate
  ├─ Server Components       read data with the caller's session
  ├─ Server Actions          validate (Zod) → check permission → call database
  └─ /auth/confirm           email-link landing (verification, recovery)
  │  anon key + user session cookie (never the service-role key)
  ▼
Supabase
  ├─ Auth                    users, sessions, emails
  └─ Postgres                RLS policies + SECURITY DEFINER functions
```

A single Next.js application is the only deployable in Phase 1. Supabase provides the database and
authentication. There is no separate API service.

## Key decisions

| Decision | Reason |
| --- | --- |
| Authorisation lives in Postgres (RLS + functions) | The database is the one place every code path goes through. UI and server checks are conveniences on top |
| Tenancy writes go through `SECURITY DEFINER` functions | The client gets no INSERT/UPDATE/DELETE on tenancy tables at all; each function derives the caller from `auth.uid()` and re-checks their role |
| No service-role client in the app | Every request runs as the signed-in user, so a bug in app code cannot bypass RLS |
| No Supabase client in the browser | All auth and data calls are Server Actions or Server Components; less surface, simpler reasoning |
| Platform admin in its own table | Separate from organisation roles and unreachable from any client write path |
| Hand-built shadcn-style components | Tailwind 4 tokens and a small, auditable component set; no generator dependency |
| `cacheComponents` disabled | Nearly every route is per-user and session-dependent, so partial prerendering adds complexity for little gain now. Revisit when public, data-driven pages exist |
| `proxy.ts` rather than `middleware.ts` | Next.js 16 renamed the convention |
| PGlite for database tests | Runs the real migration in real Postgres with no Docker or network, so RLS tests run anywhere |

## Directory layout

```
src/
  app/
    (marketing)/        public site: /, /how-it-works, /about, /security
    (auth)/             /sign-in, /sign-up, /forgot-password, /reset-password
    auth/confirm/       route handler for email links
    invite/[token]/     accept an organisation invitation
    onboarding/         organisation setup
    dashboard/          authenticated workspace (layout resolves organisation context)
    demo/               public read-only preview (static fixtures only)
  components/
    ui/                 design system: button, form, card, badge, table, dialog, dropdown, feedback
    dashboard/ auth/ onboarding/ organisation/ marketing/
  lib/
    actions/            Server Actions (auth, organisation, team, profile)
    auth/               session.ts (data access layer), permissions.ts
    data/               organisation-scoped read queries
    security/           rate-limit, redirect sanitiser, invitation tokens
    supabase/           server client, proxy session handling
    validation/         Zod schemas shared by client and server
    demo/               synthetic fixtures (clearly fictional)
    ai/                 interface types for future AI services (no implementation)
  proxy.ts
supabase/migrations/    SQL migrations (source of truth for the schema)
tests/                  unit/, db/, e2e/
scripts/seed-demo.mjs   optional demo organisation seed
```

## Request flow and trust boundaries

1. **`proxy.ts`** refreshes the session cookie and redirects signed-out requests away from `/dashboard`
   and `/onboarding`. This is an optimistic gate for navigation, not a security control.
2. **`requireOrgContext()`** (in `lib/auth/session.ts`) runs in the dashboard layout and in every
   dashboard page. It verifies the user with the Auth server (`getUser`), loads their active
   memberships and resolves the organisation. No membership → `/onboarding`.
3. **Server Actions** parse input with Zod, resolve the organisation context on the server, check the
   permission map for a fast, clear failure, then call a database function.
4. **Postgres** makes the final decision. Functions raise stable error codes (`forbidden`,
   `invalid_role`, …) which `lib/actions/helpers.ts` maps to user-facing messages; anything else
   becomes a generic error so SQL details never reach the browser.

**The organisation ID is never taken from the client.** It comes from the caller's memberships. Where a
function accepts an organisation ID parameter, it verifies the caller's role in that organisation.

## Roles

| Role | Stored in | Notes |
| --- | --- | --- |
| Owner | `organisation_members.role` | Created by onboarding. One per organisation. Organisation settings, role changes, billing placeholder |
| Admin | same | Invite and remove members/developers; view audit log |
| Member | same | Read access to organisation records |
| AI Developer | same (`developer`) | Same access as Member in Phase 1; diverges when the registry ships |
| Insurance Partner | same (`insurance_partner`) | Reserved. No function can assign it yet |
| Platform Admin | `platform_admins` table | Assigned only via SQL / service role. No workflows yet |

`lib/auth/permissions.ts` mirrors these rules for the UI. The database is authoritative.

## Design system

Tokens are defined once in `src/app/globals.css` (`@theme`): navy scale for structure, a single blue
accent, neutral surfaces, and four semantic risk colours. Components reference semantic names
(`bg-surface`, `text-ink-muted`, `border-line`) rather than raw colours. Risk and status indicators
always pair colour with a text label.

## Preparing for later phases

### Data model

Future tables (`ai_agents`, `agent_versions`, `agent_permissions`, `risk_assessments`, `risk_findings`,
`risk_controls`, `insurance_products`, `policies`, `policy_documents`, `knowledge_documents`,
`knowledge_chunks`, `incidents`, `incident_evidence`, `ai_tasks`, `ai_execution_traces`,
`ai_evaluations`) are **not** created yet. Each will be added in the phase that uses it, following the
pattern established here:

- an `organisation_id uuid not null references organisations(id)` column;
- RLS using `private.is_org_member(organisation_id)` / `private.has_org_role(...)`;
- writes through functions where the rule is more than "member of the organisation";
- audit entries via `private.log_audit(...)`.

`knowledge_chunks` will use `pgvector`; document files will use Supabase Storage with per-organisation
path policies.

### AI layer

`src/lib/ai/types.ts` defines the seam, as types only:

- `LlmProvider`: one adapter per vendor (OpenAI first; Anthropic and Gemini later). Application code
  depends on this interface, never on a vendor SDK.
- `AiTaskService`: the contract between the web app and AI execution (`submit` / `get`), scoped to an
  organisation resolved on the server, with a `requiresApproval` flag for human checkpoints and a
  `traceId` for observability.

This lets AI execution start in-process and later move to a dedicated Python/FastAPI service and a
background job queue without changing callers. UI components will consume task results, not provider
responses.
