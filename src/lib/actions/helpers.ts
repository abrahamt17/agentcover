import "server-only";
import { headers } from "next/headers";
import { z } from "zod";
import { rateLimit } from "@/lib/security/rate-limit";
import type { ActionResult } from "@/lib/types";

export const NOT_CONFIGURED: ActionResult<never> = {
  ok: false,
  error: "Authentication is not configured for this deployment yet. See the README for the Supabase setup steps.",
};

export const NOT_SIGNED_IN: ActionResult<never> = {
  ok: false,
  error: "Your session has expired. Sign in again to continue.",
};

export function invalid(error: z.ZodError): ActionResult<never> {
  return {
    ok: false,
    error: "Check the highlighted fields and try again.",
    fieldErrors: z.flattenError(error).fieldErrors as Record<string, string[]>,
  };
}

/** Best-effort client address for rate-limit keys. Set by the hosting platform's proxy. */
export async function clientAddress(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

export function limited(key: string, limit: number, windowMs: number): ActionResult<never> | null {
  const result = rateLimit(key, limit, windowMs);
  if (result.allowed) return null;
  const minutes = Math.max(1, Math.ceil(result.retryAfterSeconds / 60));
  return { ok: false, error: `Too many attempts. Try again in about ${minutes} minute${minutes === 1 ? "" : "s"}.` };
}

/**
 * Maps the stable error codes raised by the database functions to user-facing
 * text. Anything unrecognised becomes a generic message so that internal
 * details (SQL, constraint names) never reach the browser.
 */
const DB_MESSAGES: Record<string, string> = {
  not_authenticated: "Your session has expired. Sign in again to continue.",
  forbidden: "You do not have permission to do that.",
  invalid_role: "That role cannot be assigned.",
  cannot_modify_owner: "The organisation owner's membership cannot be changed here.",
  already_member: "That person is already a member of this organisation.",
  too_many_pending_invitations: "There are too many pending invitations. Revoke some before inviting more.",
  organisation_limit_reached: "You already own an organisation.",
  invitation_invalid: "This invitation is no longer valid. Ask the person who invited you for a new link.",
  invitation_email_mismatch:
    "This invitation was sent to a different email address, or your email is not verified yet.",
};

export function dbError(error: { message?: string } | null, fallback = "Something went wrong. Please try again."): ActionResult<never> {
  const message = error?.message ?? "";
  const code = Object.keys(DB_MESSAGES).find((key) => message.includes(key));
  if (!code) console.error("[db] unexpected error:", message);
  return { ok: false, error: code ? DB_MESSAGES[code] : fallback };
}
