import "server-only";
import type { OrgRole } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import type { AuditEvent, Invitation, NotificationPreferences, TeamMember } from "@/lib/types";

/**
 * Read queries for organisation-scoped data.
 *
 * Each query filters by organisation for clarity and index use, but the filter
 * is not what protects the data: Row Level Security returns only rows from
 * organisations the caller is an active member of, whatever ID is passed.
 */

const one = <T>(value: T | T[] | null): T | null => (Array.isArray(value) ? (value[0] ?? null) : value);

export async function listMembers(organisationId: string): Promise<TeamMember[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organisation_members")
    .select("id, user_id, role, status, created_at, profile:profiles (full_name, email)")
    .eq("organisation_id", organisationId)
    .order("created_at", { ascending: true });
  if (error) throw new Error("Could not load team members.");
  return (data ?? []).map((row) => ({
    id: row.id as string,
    user_id: row.user_id as string,
    role: row.role as OrgRole,
    status: row.status as TeamMember["status"],
    created_at: row.created_at as string,
    profile: one(row.profile) as TeamMember["profile"],
  }));
}

/** Pending, unexpired invitations. Only owners and admins receive rows (RLS). */
export async function listPendingInvitations(organisationId: string): Promise<Invitation[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organisation_invitations")
    .select("id, email, role, expires_at, created_at")
    .eq("organisation_id", organisationId)
    .is("accepted_at", null)
    .is("revoked_at", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });
  if (error) throw new Error("Could not load invitations.");
  return (data ?? []) as Invitation[];
}

/** Most recent audit events. Only owners and admins receive rows (RLS). */
export async function listAuditEvents(organisationId: string, limit = 8): Promise<AuditEvent[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("audit_logs")
    .select("id, action, resource_type, metadata, created_at, actor:profiles (full_name, email)")
    .eq("organisation_id", organisationId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error("Could not load activity.");
  return (data ?? []).map((row) => ({
    id: row.id as string,
    action: row.action as string,
    resource_type: row.resource_type as string,
    metadata: (row.metadata ?? {}) as Record<string, unknown>,
    created_at: row.created_at as string,
    actor: one(row.actor) as AuditEvent["actor"],
  }));
}

export async function getNotificationPreferences(userId: string): Promise<NotificationPreferences> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("user_preferences")
    .select("notification_preferences")
    .eq("user_id", userId)
    .maybeSingle();
  const stored = (data?.notification_preferences ?? {}) as Partial<NotificationPreferences>;
  return {
    security_alerts: stored.security_alerts ?? true,
    product_updates: stored.product_updates ?? false,
  };
}
