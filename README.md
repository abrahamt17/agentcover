# AgentCover

AI-agent risk intelligence for European organisations. AgentCover helps businesses and AI developers
assess, manage and prepare to insure the risks created by autonomous AI agents.

> AgentCover is a technology and risk-intelligence platform. It is **not** an insurer or broker. It does
> not issue policies, underwrite insurance or make coverage decisions.

This repository contains **Phase 1**: the multi-tenant SaaS foundation (authentication, organisation
tenancy, roles, invitations, audit log, dashboard shell, public site). The agent registry, risk engine,
insurance intelligence, monitoring, incidents and AI layer are planned for later phases and are shown in
the product as clearly labelled "coming soon" pages. See [docs/ROADMAP.md](docs/ROADMAP.md).

## What works today

| Area | Status |
| --- | --- |
| Public site: `/`, `/how-it-works`, `/about`, `/security` | Implemented, browser-tested |
| Demo preview: `/demo` (fictional organisation, static synthetic data, labelled DEMO DATA) | Implemented, browser-tested |
| Sign up, sign in, sign out, forgot/reset password, email verification | Implemented. Needs a Supabase project; **not yet exercised against a live project** |
| Onboarding (3 steps) creating organisation + owner membership | Implemented. Form flow checked manually in the browser; database function tested |
| Organisation tenancy, roles, Row Level Security | Implemented, tested against real Postgres (PGlite) |
| Team: invitations (hashed tokens), role changes, member removal | Implemented, database rules tested |
| Audit log of organisation events | Implemented, tested |
| Dashboard shell, overview, settings | Implemented |
| AI Agents, Risk, Insurance, Incidents, Monitoring, AI Copilot | **Not built.** Honest placeholder pages only |

## Tech stack

- Next.js 16 (App Router, Turbopack), React 19, TypeScript
- Tailwind CSS 4, shadcn-style components on Radix primitives, Lucide icons
- React Hook Form + Zod 4 (one schema shared by browser and server)
- Supabase: Postgres, Auth, Row Level Security (`@supabase/ssr`)
- Vitest + PGlite (in-process Postgres) for unit and database tests, Playwright for browser tests

Recharts and Supabase Storage are part of the planned stack but are not installed or used yet, because
nothing in Phase 1 needs them.

## Getting started

Requirements: Node.js 20.9 or newer, npm.

```bash
npm install
cp .env.example .env.local   # then fill in the values, see below
npm run dev
```

Open http://localhost:3000. Without Supabase configured the public site and `/demo` work, the sign-in
pages show a "not configured" notice, and every protected route redirects to sign-in.

### Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (or `NEXT_PUBLIC_SUPABASE_ANON_KEY`) | Yes | Supabase publishable (anon) key. Public by design; RLS protects the data |
| `NEXT_PUBLIC_SITE_URL` | Yes in production | Public origin, used in email and invitation links. Defaults to `http://localhost:3000` |
| `SUPABASE_SERVICE_ROLE_KEY` | No | **Only** for `npm run seed:demo`, from your own shell. The app never reads it. Do not add it to your host |
| `DEMO_USER_PASSWORD`, `DEMO_SEED_CONFIRM` | No | Demo seed script only |

### Configure Supabase

1. Create a project at https://supabase.com and copy the project URL and anon key into `.env.local`.
2. Apply the migration (pick one):
   - **SQL editor:** paste the contents of
     `supabase/migrations/20261110000001_phase1_foundation.sql` and run it.
   - **CLI:** `npx supabase link --project-ref <ref>` then `npx supabase db push`.
3. Authentication → URL Configuration: set **Site URL** to your origin and add
   `http://localhost:3000/auth/confirm` (and your production equivalent) to **Redirect URLs**.
4. Authentication → Sign In / Providers → Email: keep **Confirm email** enabled.
5. Recommended: Authentication → Email Templates, so links work when opened on another device:
   - Confirm signup: `{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=email`
   - Reset password: `{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=recovery`

   The default templates also work (the app handles the `?code=` flow), but only in the browser that
   started the flow.
6. Do **not** add the `private` schema to the API's exposed schemas.

To make someone a platform administrator (there is no UI for this, by design):

```sql
insert into public.platform_admins (user_id) values ('<auth user uuid>');
```

### Demo data

- `/demo` is a public, read-only preview built from static fixtures. No database or login is involved.
- Optionally seed the fictional organisation *Northstar Automation GmbH* with three demo users into a
  **non-production** project:

  ```bash
  DEMO_SEED_CONFIRM=northstar DEMO_USER_PASSWORD='<choose one>' SUPABASE_SERVICE_ROLE_KEY='<key>' npm run seed:demo
  ```

  Demo users are ordinary users confined to the demo organisation by the same RLS rules as everyone
  else. The seed script has not been run against a live project yet.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm run start` | Production build / serve |
| `npm run lint` | ESLint |
| `npm run typecheck` | Generate route types, then `tsc --noEmit` |
| `npm run test` | Unit tests + database security tests (no external services needed) |
| `npm run test:db` | Only the RLS / RPC tests against in-process Postgres |
| `npm run test:e2e` | Playwright browser tests against a production build (uses installed Edge; set `E2E_BROWSER_CHANNEL=chrome` to change) |
| `npm run check` | Lint, typecheck, tests and build in sequence |

## Testing approach

- **Database security** (`tests/db`): the real migration files are applied to PGlite and exercised as
  the `authenticated` and `anon` roles, exactly as requests arrive through Supabase. Covers organisation
  isolation, privilege escalation, onboarding, invitations and the audit log.
- **Unit** (`tests/unit`): validation schemas, permission map, redirect sanitiser, rate limiter, token
  hashing, env validation.
- **Browser** (`tests/e2e`): public pages, demo labelling, form validation, and that all protected
  routes redirect signed-out visitors. Runs without Supabase.

Not covered automatically: signed-in browser flows (sign-up through to dashboard), which need a live
Supabase project. See "Current limitations".

## Current limitations

- Auth flows are implemented against the Supabase API but have not been run end to end against a live
  project in this repository's test suite.
- Invitations produce a link for the inviter to share; no invitation email is sent.
- One active organisation per session (the earliest membership). The organisation switcher is a placeholder.
- A user can own one organisation. Ownership transfer is not implemented.
- Rate limiting is in-memory per server instance; Supabase Auth's own limits are the backstop.
- Notification preferences are stored but nothing is sent yet. Light theme only.
- No Content-Security-Policy header yet. No MFA or SSO.
- `Insurance Partner` and `Platform Admin` roles exist in the access model but have no workflows.

## Documentation

- [Product overview](docs/PRODUCT_OVERVIEW.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Database schema](docs/DATABASE_SCHEMA.md)
- [Security](docs/SECURITY.md)
- [Roadmap](docs/ROADMAP.md)
