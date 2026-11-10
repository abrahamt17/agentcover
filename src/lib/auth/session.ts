import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import type { User } from "@supabase/supabase-js";
import type { OrgRole } from "@/lib/constants";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { Membership, Organisation, Profile } from "@/lib/types";

/**
 * Data access layer for identity and tenancy.
 *
 * Everything here runs on the server with the caller's own session. The active
 * organisation is always derived from the user's memberships in the database,
 * never from a value sent by the browser.
 */

/** The authenticated user, verified with the Supabase Auth server. Null when signed out. */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  // Identity is always resolved per request. Without this, a build that runs
  // before Supabase is configured could prerender a signed-out result.
  await connection();
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
});

export async function requireUser(next = "/dashboard"): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect(`/sign-in?next=${encodeURIComponent(next)}`);
  return user;
}

/** Active memberships of the current user, oldest first. RLS guarantees they are the caller's own. */
export const getMemberships = cache(async (): Promise<Membership[]> => {
  const user = await getCurrentUser();
  if (!user) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organisation_members")
    .select(
      "id, role, status, organisation:organisations (id, name, website, country, industry, organisation_type, estimated_agent_count, primary_use_cases, is_demo, created_at)",
    )
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("created_at", { ascending: true });

  if (error) throw new Error("Could not load your organisations.");

  return (data ?? [])
    .map((row) => ({
      id: row.id as string,
      role: row.role as OrgRole,
      status: row.status as Membership["status"],
      organisation: (Array.isArray(row.organisation) ? row.organisation[0] : row.organisation) as Organisation,
    }))
    .filter((m) => Boolean(m.organisation));
});

export const getProfile = cache(async (): Promise<Profile | null> => {
  const user = await getCurrentUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, email, avatar_url")
    .eq("id", user.id)
    .maybeSingle();
  return (data as Profile | null) ?? null;
});

export type OrgContext = {
  user: User;
  profile: Profile;
  membership: Membership;
  organisation: Organisation;
  role: OrgRole;
};

/**
 * Resolves the caller's organisation context without redirecting.
 * Phase 1 has no organisation switcher, so the active organisation is the
 * user's earliest active membership.
 */
export const getOrgContext = cache(async (): Promise<OrgContext | null> => {
  const user = await getCurrentUser();
  if (!user) return null;
  const [memberships, profile] = await Promise.all([getMemberships(), getProfile()]);
  const membership = memberships[0];
  if (!membership) return null;
  return {
    user,
    profile: profile ?? { id: user.id, full_name: null, email: user.email ?? "", avatar_url: null },
    membership,
    organisation: membership.organisation,
    role: membership.role,
  };
});

/** For dashboard pages: signed-out users go to sign-in, users without an organisation to onboarding. */
export async function requireOrgContext(): Promise<OrgContext> {
  await requireUser();
  const context = await getOrgContext();
  if (!context) redirect("/onboarding");
  return context;
}
