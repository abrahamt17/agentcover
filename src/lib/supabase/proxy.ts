import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getPublicEnv, isSupabaseConfigured } from "@/lib/env";

const PROTECTED_PREFIXES = ["/dashboard", "/onboarding"];
const AUTH_PAGES = ["/sign-in", "/sign-up", "/forgot-password"];

const matches = (path: string, prefixes: string[]) =>
  prefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));

/**
 * Runs before every matched request:
 *  1. refreshes the Supabase session cookie when it is close to expiry;
 *  2. sends signed-out visitors away from protected routes;
 *  3. sends signed-in visitors away from the sign-in / sign-up pages.
 *
 * This is an optimistic gate for navigation. Pages and server actions verify
 * the user again, and the database enforces access with RLS.
 */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  const { pathname, search } = request.nextUrl;
  const isProtected = matches(pathname, PROTECTED_PREFIXES);

  const toSignIn = () => {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    url.search = "";
    url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  };

  if (!isSupabaseConfigured()) {
    // Fail closed: without an auth backend nothing behind the gate is reachable.
    return isProtected ? toSignIn() : NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });
  const env = getPublicEnv();

  const supabase = createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
      },
    },
  });

  // Do not add logic between createServerClient and getClaims: this call is
  // what validates the token and triggers a refresh.
  let isAuthenticated = false;
  try {
    const { data } = await supabase.auth.getClaims();
    isAuthenticated = Boolean(data?.claims?.sub);
  } catch {
    isAuthenticated = false;
  }

  const withSessionCookies = (redirect: NextResponse) => {
    for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
    return redirect;
  };

  if (!isAuthenticated && isProtected) {
    return withSessionCookies(toSignIn());
  }

  if (isAuthenticated && matches(pathname, AUTH_PAGES)) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return withSessionCookies(NextResponse.redirect(url));
  }

  return response;
}
