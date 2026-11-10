import type { OrgRole } from "@/lib/constants";

/**
 * Row shapes for the Phase 1 schema (supabase/migrations).
 * Hand-maintained for now; once a Supabase project is linked these can be
 * replaced with `supabase gen types typescript`.
 */
export type Profile = {
  id: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
};

export type Organisation = {
  id: string;
  name: string;
  website: string | null;
  country: string | null;
  industry: string | null;
  organisation_type: string;
  estimated_agent_count: string | null;
  primary_use_cases: string[];
  is_demo: boolean;
  created_at: string;
};

export type Membership = {
  id: string;
  role: OrgRole;
  status: "active" | "suspended";
  organisation: Organisation;
};

export type TeamMember = {
  id: string;
  user_id: string;
  role: OrgRole;
  status: "active" | "suspended";
  created_at: string;
  profile: { full_name: string | null; email: string } | null;
};

export type Invitation = {
  id: string;
  email: string;
  role: OrgRole;
  expires_at: string;
  created_at: string;
};

export type AuditEvent = {
  id: string;
  action: string;
  resource_type: string;
  metadata: Record<string, unknown>;
  created_at: string;
  actor: { full_name: string | null; email: string } | null;
};

export type NotificationPreferences = {
  security_alerts: boolean;
  product_updates: boolean;
};

/** Uniform return type for server actions. */
export type ActionResult<T = undefined> =
  | { ok: true; message?: string; data?: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };
