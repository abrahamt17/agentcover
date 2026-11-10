import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured } from "@/lib/env";
import { safeRedirectPath } from "@/lib/security/redirect";
import { createClient } from "@/lib/supabase/server";

const OTP_TYPES: EmailOtpType[] = ["signup", "email", "recovery", "invite", "magiclink", "email_change"];

/**
 * Landing point for links in Supabase Auth emails (email verification and
 * password recovery). Supports both link formats:
 *   - ?token_hash=...&type=...  (recommended email templates, works across devices)
 *   - ?code=...                 (default PKCE templates, same browser only)
 * The `next` parameter is restricted to same-origin paths.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const next = safeRedirectPath(searchParams.get("next"), "/dashboard");

  const fail = () => {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    url.search = "?error=link_invalid";
    return NextResponse.redirect(url);
  };

  if (!isSupabaseConfigured()) return fail();

  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");
  const supabase = await createClient();

  let verified = false;
  if (tokenHash && type && OTP_TYPES.includes(type)) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    verified = !error;
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    verified = !error;
  }

  if (!verified) return fail();

  const url = request.nextUrl.clone();
  const destination = new URL(next, url.origin);
  url.pathname = destination.pathname;
  url.search = destination.search;
  return NextResponse.redirect(url);
}
