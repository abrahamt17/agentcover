# Database schema (Phase 1)

Source of truth: `supabase/migrations/20261110000001_phase1_foundation.sql`.

All primary keys are UUIDs. All timestamps are `timestamptz` defaulting to `now()`; `updated_at` is
maintained by a trigger. Every table has Row Level Security enabled.

## Applying migrations

- **Supabase SQL editor:** paste the migration file and run it once.
- **Supabase CLI:** `npx supabase link --project-ref <ref>` then `npx supabase db push`.
- **Local verification without Supabase:** `npm run test:db` applies the same file to an in-process
  Postgres and runs the security tests.

New migrations go in `supabase/migrations/` with a timestamp prefix; the test harness applies them in
filename order automatically.

## Tables

### `profiles`
One row per auth user, created by a trigger on `auth.users`.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid PK | references `auth.users(id)` on delete cascade |
| `full_name` | text | ≤ 120 chars |
| `email` | text | lower-cased copy of the auth email, kept in sync by trigger |
| `avatar_url` | text | unused in the UI yet |
| `created_at`, `updated_at` | timestamptz | |

### `organisations`
| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid PK | |
| `name` | text | 2–120 chars |
| `website` | text | optional, must start with `http(s)://` |
| `country` | text | ISO 3166-1 alpha-2 |
| `industry` | text | optional |
| `organisation_type` | text | `business`, `ai_agency`, `ai_software_company`, `independent_developer`, `other` |
| `estimated_agent_count` | text | `1-5`, `6-20`, `21-50`, `51-100`, `100+` |
| `primary_use_cases` | text[] | ≤ 12 entries |
| `is_demo` | boolean | set only by the seed script; never writable by clients |
| `created_by` | uuid | references `profiles` |
| `created_at`, `updated_at` | timestamptz | |

### `organisation_members`
| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid PK | |
| `organisation_id` | uuid FK | cascade |
| `user_id` | uuid FK | references `profiles`, cascade |
| `role` | text | `owner`, `admin`, `member`, `developer`, `insurance_partner` |
| `status` | text | `active`, `suspended` |
| `created_at` | timestamptz | |

Constraints: unique `(organisation_id, user_id)`; partial unique index allowing one `owner` per
organisation; index on `user_id`.

### `organisation_invitations`
| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid PK | |
| `organisation_id` | uuid FK | cascade |
| `email` | text | lower-case |
| `role` | text | `admin`, `member`, `developer` only |
| `invitation_token_hash` | text | SHA-256 hex of the token; **plaintext is never stored**; not selectable by API roles |
| `expires_at` | timestamptz | 7 days after creation |
| `accepted_at`, `revoked_at` | timestamptz | |
| `created_by` | uuid | |
| `created_at` | timestamptz | |

Constraints: unique token hash; one pending invitation per `(organisation_id, email)`.

### `audit_logs`
Append-only. Written only by database functions.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid PK | |
| `organisation_id` | uuid FK | cascade |
| `actor_user_id` | uuid | references `profiles`, set null on delete |
| `action` | text | e.g. `invitation.created`, `member.role_changed` |
| `resource_type`, `resource_id` | text, uuid | |
| `metadata` | jsonb | small, non-sensitive context |
| `created_at` | timestamptz | indexed with `organisation_id` |

### `user_preferences`
| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid PK | |
| `user_id` | uuid unique FK | |
| `theme` | text | `system`, `light`, `dark` (only light is rendered today) |
| `notification_preferences` | jsonb | `{ security_alerts, product_updates }` |
| `created_at`, `updated_at` | timestamptz | |

### `platform_admins`
| Column | Type | Notes |
| --- | --- | --- |
| `user_id` | uuid PK | references `auth.users` |
| `granted_by` | uuid | |
| `created_at` | timestamptz | |

Added beyond the original table list so that platform administration is separate from organisation
roles and cannot be reached by any client write.

## Access rules

API role `anon` has no privileges on any of these tables. For `authenticated`:

| Table | SELECT | Direct writes |
| --- | --- | --- |
| `profiles` | own row; rows of people sharing an active organisation | UPDATE own `full_name`, `avatar_url` |
| `organisations` | active members | none |
| `organisation_members` | active members of the same organisation | none |
| `organisation_invitations` | owners and admins; token hash column excluded | none |
| `audit_logs` | owners and admins | none |
| `user_preferences` | own row | UPDATE own `theme`, `notification_preferences` |
| `platform_admins` | own row | none |

A suspended membership grants nothing: every helper checks `status = 'active'`.

## Functions

Callable by `authenticated` only (`SECURITY DEFINER`, `search_path = ''`):

| Function | Who | Effect |
| --- | --- | --- |
| `create_organisation(...)` | any signed-in user without an owned organisation | creates organisation + owner membership |
| `update_organisation(...)` | owner | updates descriptive fields |
| `create_invitation(org, email, role, token_hash)` | owner; admin (not for `admin` role) | replaces any pending invite for that email |
| `revoke_invitation(id)` | owner, admin | |
| `accept_invitation(token)` | signed-in user whose **verified** email matches | creates membership, marks accepted |
| `update_member_role(member_id, role)` | owner | never to `owner`; never on self or the owner |
| `remove_member(member_id)` | owner; admin for members/developers | never self or the owner |

Internal helpers in schema `private` (not exposed by the API): `org_role`, `is_org_member`,
`has_org_role`, `shares_org_with`, `log_audit`, and the triggers.

Error codes raised: `not_authenticated`, `forbidden`, `invalid_role`, `cannot_modify_owner`,
`already_member`, `organisation_limit_reached`, `too_many_pending_invitations`, `invitation_invalid`,
`invitation_email_mismatch`.

## Not created yet

`ai_agents`, `agent_versions`, `agent_permissions`, `risk_assessments`, `risk_findings`,
`risk_controls`, `insurance_products`, `policies`, `policy_documents`, `knowledge_documents`,
`knowledge_chunks`, `incidents`, `incident_evidence`, `ai_tasks`, `ai_execution_traces`,
`ai_evaluations`. They will be added by the phase that implements them; see `ARCHITECTURE.md`.
