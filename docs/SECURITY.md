# Security

This document describes what is implemented, how it is verified, and what is not done yet. AgentCover
has not been independently audited and holds no certifications.

## Threat model for Phase 1

| Threat | Control |
| --- | --- |
| A user reads another organisation's data | RLS on every table keyed on active membership |
| A user grants themselves a higher role | No client write access to memberships; role changes only via owner-only function that cannot target self |
| A user makes themselves platform admin | `platform_admins` has no client write privilege or policy |
| Sign-up metadata used to smuggle a role | Trigger reads only `full_name` from metadata |
| Client sends someone else's organisation ID | Organisation is resolved from memberships on the server; functions re-check role for any ID they receive |
| Stolen database dump reveals invitation links | Only SHA-256 hashes of 256-bit tokens are stored |
| Invitation link used by the wrong person | Must be signed in with the invited, verified email; single use; 7-day expiry; revocable |
| Account enumeration | Identical responses for unknown account / wrong password, and for password-reset requests |
| Open redirect after sign-in or email link | `next` is restricted to same-origin paths (`lib/security/redirect.ts`) |
| Service-role key leaks to the browser | The application has no service-role client and reads no server secrets |
| Credential stuffing / email flooding | Per-IP and per-account rate limits in server actions, plus Supabase Auth limits |
| Clickjacking, MIME sniffing | `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, HSTS, Referrer-Policy, Permissions-Policy |
| Internal errors leak details | Database errors are mapped to a fixed set of messages; unknown errors are logged server-side and shown generically |

## Authorisation layers

1. `src/proxy.ts`: navigation gate and session refresh. Convenience only.
2. Server (`requireOrgContext`, permission map): verifies the user with the Auth server on every
   request and fails fast with clear messages.
3. Postgres (RLS + `SECURITY DEFINER` functions): the security boundary. Everything above could be
   wrong and data would still be protected.

Roles are never accepted from the client. The permission map in `lib/auth/permissions.ts` exists for UX
and is duplicated, deliberately, by the database rules.

## How this is verified

`npm run test:db` applies the real migration to Postgres (PGlite) and acts as the `authenticated` and
`anon` roles. It asserts, among other things:

- a member of organisation A sees no organisations, members, profiles, invitations or audit entries of B;
- cross-organisation calls to every write function are refused;
- direct INSERT/UPDATE/DELETE on tenancy tables is refused;
- a user cannot insert a membership, change their own role, be granted `owner`, or add themselves to
  `platform_admins`;
- roles in sign-up metadata are ignored;
- the invitation token hash cannot be selected; tokens for another email, unverified emails, expired,
  revoked, reused or unknown tokens are refused;
- suspended and removed members lose access immediately;
- the audit log is readable only by owners/admins and cannot be written or altered by clients.

`npm run test:e2e` asserts that every protected route redirects a signed-out visitor, that the email
confirmation endpoint cannot be used to redirect off-site, and that security headers are present.

## Demo isolation

- `/demo` renders static fixtures. No session, database query or credential is involved.
- The optional seeded demo organisation is flagged `is_demo`. Its users are ordinary accounts bound by
  the same RLS as everyone else; there is no shared or hard-coded credential and no bypass path. The
  app treats demo organisations as read-only in its server actions.
- The seed script requires explicit confirmation, takes its password from the environment, and is
  intended for non-production projects only.

## Secrets

- `.env*` files are git-ignored except `.env.example`, which contains no values.
- Only `NEXT_PUBLIC_*` variables are read by the app; both Supabase values are public by design.
- Environment validation reports the names of invalid variables, never their values.

## Personal data

Stored: name, email, optional avatar URL, organisation details, notification preferences, and audit
entries (which include invited email addresses). No tracking, analytics or third-party scripts are
included. Deleting an auth user cascades to their profile, preferences and memberships.

## Known gaps

- Rate limiting is in-memory per instance; a shared store is needed for real production traffic.
- No Content-Security-Policy yet.
- No MFA, SSO, session management UI or account deletion UI.
- No data export tooling.
- Signed-in flows have not been tested end to end against a live Supabase project.
- No independent penetration test.

## Reporting

This is an early-stage project without a formal disclosure programme. Report issues privately to the
repository owner rather than in a public issue.
