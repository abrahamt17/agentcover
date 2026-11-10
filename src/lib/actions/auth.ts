"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getSiteUrl, isSupabaseConfigured } from "@/lib/env";
import { safeRedirectPath } from "@/lib/security/redirect";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/types";
import { forgotPasswordSchema, resetPasswordSchema, signInSchema, signUpSchema } from "@/lib/validation/auth";
import { clientAddress, dbError, invalid, limited, NOT_CONFIGURED, NOT_SIGNED_IN } from "./helpers";

const TEN_MINUTES = 10 * 60 * 1000;
const ONE_HOUR = 60 * 60 * 1000;

export async function signInAction(input: unknown, next?: string): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  const parsed = signInSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  const ip = await clientAddress();
  const email = parsed.data.email.toLowerCase();
  const blocked =
    limited(`sign-in:ip:${ip}`, 30, TEN_MINUTES) ?? limited(`sign-in:account:${ip}:${email}`, 8, TEN_MINUTES);
  if (blocked) return blocked;

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password: parsed.data.password });
  if (error) {
    if (error.code === "email_not_confirmed") {
      return { ok: false, error: "Confirm your email address first. Check your inbox for the verification link." };
    }
    // Same message for unknown accounts and wrong passwords.
    return { ok: false, error: "Incorrect email or password." };
  }

  redirect(safeRedirectPath(next, "/dashboard"));
}

export async function signUpAction(input: unknown, next?: string): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  const parsed = signUpSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  const ip = await clientAddress();
  const blocked = limited(`sign-up:ip:${ip}`, 10, ONE_HOUR);
  if (blocked) return blocked;

  const destination = safeRedirectPath(next, "/onboarding");
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email.toLowerCase(),
    password: parsed.data.password,
    options: {
      // Only a display name is sent as metadata. Roles are never derived from it.
      data: { full_name: parsed.data.fullName },
      emailRedirectTo: `${getSiteUrl()}/auth/confirm?next=${encodeURIComponent(destination)}`,
    },
  });

  if (error) {
    if (error.code === "weak_password") {
      return { ok: false, error: "Choose a stronger password.", fieldErrors: { password: [error.message] } };
    }
    if (error.code === "over_email_send_rate_limit" || error.status === 429) {
      return { ok: false, error: "Too many sign-up attempts. Please try again later." };
    }
    console.error("[auth] sign-up failed:", error.code ?? error.message);
    return { ok: false, error: "We could not create your account. Please try again." };
  }

  // When email confirmation is disabled in Supabase a session is returned immediately.
  if (data.session) redirect(destination);

  return {
    ok: true,
    message: "Check your inbox. We sent a verification link to confirm your email address.",
  };
}

export async function forgotPasswordAction(input: unknown): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  const ip = await clientAddress();
  const email = parsed.data.email.toLowerCase();
  const blocked =
    limited(`forgot:ip:${ip}`, 10, ONE_HOUR) ?? limited(`forgot:account:${email}`, 3, ONE_HOUR);
  if (blocked) return blocked;

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${getSiteUrl()}/auth/confirm?next=${encodeURIComponent("/reset-password")}`,
  });
  if (error) console.error("[auth] password reset request failed:", error.code ?? error.message);

  // Identical response whether or not the account exists.
  return {
    ok: true,
    message: "If an account exists for that address, a password reset link is on its way.",
  };
}

export async function resetPasswordAction(input: unknown): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, error: "This reset link has expired. Request a new one from the forgot password page." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    if (error.code === "same_password") {
      return { ok: false, error: "Choose a password you have not used for this account before." };
    }
    if (error.code === "weak_password") {
      return { ok: false, error: "Choose a stronger password.", fieldErrors: { password: [error.message] } };
    }
    console.error("[auth] password update failed:", error.code ?? error.message);
    return { ok: false, error: "We could not update your password. Please try again." };
  }

  redirect("/dashboard");
}

export async function signOutAction(): Promise<void> {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/sign-in");
}

/** Accepts an organisation invitation for the signed-in user. */
export async function acceptInvitationAction(token: string): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  const user = await getCurrentUser();
  if (!user) return NOT_SIGNED_IN;
  if (typeof token !== "string" || token.length < 20 || token.length > 200) {
    return { ok: false, error: "This invitation link is not valid." };
  }

  const blocked = limited(`accept-invite:${user.id}`, 10, TEN_MINUTES);
  if (blocked) return blocked;

  const supabase = await createClient();
  const { error } = await supabase.rpc("accept_invitation", { p_token: token });
  if (error) return dbError(error, "This invitation could not be accepted.");

  redirect("/dashboard");
}
