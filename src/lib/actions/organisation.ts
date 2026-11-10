"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { can, invitableRoles } from "@/lib/auth/permissions";
import { getCurrentUser, getMemberships, getOrgContext } from "@/lib/auth/session";
import { getSiteUrl, isSupabaseConfigured } from "@/lib/env";
import { generateInvitationToken, hashToken } from "@/lib/security/tokens";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/types";
import {
  inviteSchema,
  memberRoleSchema,
  onboardingSchema,
  organisationSchema,
  profileSchema,
} from "@/lib/validation/organisation";
import { z } from "zod";
import { dbError, invalid, limited, NOT_CONFIGURED, NOT_SIGNED_IN } from "./helpers";

const ONE_HOUR = 60 * 60 * 1000;
const FORBIDDEN: ActionResult<never> = { ok: false, error: "You do not have permission to do that." };
const DEMO_READ_ONLY: ActionResult<never> = {
  ok: false,
  error: "The demo organisation is read-only. Create your own organisation to make changes.",
};

/**
 * Onboarding: creates the organisation and the caller's owner membership in one
 * database transaction. No organisation ID is accepted from the client; the
 * database derives the owner from the session.
 */
export async function completeOnboardingAction(input: unknown): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  const user = await getCurrentUser();
  if (!user) return NOT_SIGNED_IN;

  const parsed = onboardingSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  if ((await getMemberships()).length > 0) redirect("/dashboard");

  const blocked = limited(`onboarding:${user.id}`, 10, ONE_HOUR);
  if (blocked) return blocked;

  const v = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.rpc("create_organisation", {
    p_name: v.name,
    p_organisation_type: v.organisationType,
    p_country: v.country,
    p_website: v.website || null,
    p_industry: v.industry || null,
    p_estimated_agent_count: v.estimatedAgentCount || null,
    p_primary_use_cases: v.primaryUseCases,
    p_full_name: v.fullName,
  });
  if (error) return dbError(error, "We could not create your organisation. Please try again.");

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function updateOrganisationAction(input: unknown): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  const context = await getOrgContext();
  if (!context) return NOT_SIGNED_IN;
  if (context.organisation.is_demo) return DEMO_READ_ONLY;
  if (!can(context.role, "organisation.update")) return FORBIDDEN;

  const parsed = organisationSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  const v = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.rpc("update_organisation", {
    p_organisation_id: context.organisation.id,
    p_name: v.name,
    p_organisation_type: v.organisationType,
    p_country: v.country,
    p_website: v.website || null,
    p_industry: v.industry || null,
    p_estimated_agent_count: v.estimatedAgentCount || null,
    p_primary_use_cases: v.primaryUseCases,
  });
  if (error) return dbError(error);

  revalidatePath("/dashboard", "layout");
  return { ok: true, message: "Organisation details saved." };
}

/**
 * Creates an invitation and returns the one-time link to the inviter.
 * Phase 1 does not send invitation emails; the inviter shares the link.
 * Only the SHA-256 hash of the token is stored.
 */
export async function inviteMemberAction(input: unknown): Promise<ActionResult<{ inviteUrl: string; email: string }>> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  const context = await getOrgContext();
  if (!context) return NOT_SIGNED_IN;
  if (context.organisation.is_demo) return DEMO_READ_ONLY;
  if (!can(context.role, "members.invite")) return FORBIDDEN;

  const parsed = inviteSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  if (!invitableRoles(context.role).includes(parsed.data.role)) return FORBIDDEN;

  const blocked = limited(`invite:${context.user.id}`, 20, ONE_HOUR);
  if (blocked) return blocked;

  const token = generateInvitationToken();
  const email = parsed.data.email.toLowerCase();
  const supabase = await createClient();
  const { error } = await supabase.rpc("create_invitation", {
    p_organisation_id: context.organisation.id,
    p_email: email,
    p_role: parsed.data.role,
    p_token_hash: hashToken(token),
  });
  if (error) return dbError(error, "The invitation could not be created.");

  revalidatePath("/dashboard/settings/team");
  return { ok: true, data: { inviteUrl: `${getSiteUrl()}/invite/${token}`, email } };
}

export async function revokeInvitationAction(invitationId: unknown): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  const context = await getOrgContext();
  if (!context) return NOT_SIGNED_IN;
  if (context.organisation.is_demo) return DEMO_READ_ONLY;
  if (!can(context.role, "members.invite")) return FORBIDDEN;

  const id = z.uuid().safeParse(invitationId);
  if (!id.success) return { ok: false, error: "Unknown invitation." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("revoke_invitation", { p_invitation_id: id.data });
  if (error) return dbError(error);

  revalidatePath("/dashboard/settings/team");
  return { ok: true, message: "Invitation revoked." };
}

export async function updateMemberRoleAction(input: unknown): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  const context = await getOrgContext();
  if (!context) return NOT_SIGNED_IN;
  if (context.organisation.is_demo) return DEMO_READ_ONLY;
  if (!can(context.role, "members.change_role")) return FORBIDDEN;

  const parsed = memberRoleSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "That role cannot be assigned." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("update_member_role", {
    p_member_id: parsed.data.memberId,
    p_role: parsed.data.role,
  });
  if (error) return dbError(error);

  revalidatePath("/dashboard/settings/team");
  return { ok: true, message: "Role updated." };
}

export async function removeMemberAction(memberId: unknown): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  const context = await getOrgContext();
  if (!context) return NOT_SIGNED_IN;
  if (context.organisation.is_demo) return DEMO_READ_ONLY;
  if (!can(context.role, "members.remove")) return FORBIDDEN;

  const id = z.uuid().safeParse(memberId);
  if (!id.success) return { ok: false, error: "Unknown member." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("remove_member", { p_member_id: id.data });
  if (error) return dbError(error);

  revalidatePath("/dashboard/settings/team");
  return { ok: true, message: "Member removed." };
}

export async function updateProfileAction(input: unknown): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  const user = await getCurrentUser();
  if (!user) return NOT_SIGNED_IN;

  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  const supabase = await createClient();
  // Both updates are filtered to the caller's own rows here and again by RLS.
  const [profile, preferences] = await Promise.all([
    supabase.from("profiles").update({ full_name: parsed.data.fullName }).eq("id", user.id),
    supabase
      .from("user_preferences")
      .update({
        notification_preferences: {
          security_alerts: parsed.data.securityAlerts,
          product_updates: parsed.data.productUpdates,
        },
      })
      .eq("user_id", user.id),
  ]);
  if (profile.error || preferences.error) return dbError(profile.error ?? preferences.error);

  revalidatePath("/dashboard", "layout");
  return { ok: true, message: "Profile saved." };
}
