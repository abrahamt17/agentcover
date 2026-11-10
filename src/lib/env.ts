import { z } from "zod";

/**
 * Public environment variables. These are safe to expose to the browser.
 * They are referenced statically so Next.js can inline them.
 *
 * No server-side secret is required by the application in Phase 1: every
 * request runs with the signed-in user's own session and is constrained by
 * Row Level Security. The service-role key is used only by the optional
 * demo seed script, which reads it directly from the shell environment.
 */
const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url({ protocol: /^https?$/ }),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20),
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;

function read() {
  return publicEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || undefined,
    // Supabase now calls this the "publishable" key; older projects call it the "anon" key. Either works.
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || undefined,
  });
}

/** True when the Supabase connection variables are present and well-formed. */
export function isSupabaseConfigured(): boolean {
  return read().success;
}

/** Returns validated public env, or throws naming the invalid variables (never their values). */
export function getPublicEnv(): PublicEnv {
  const parsed = read();
  if (!parsed.success) {
    const names = [...new Set(parsed.error.issues.map((issue) => issue.path.join(".")))].join(", ");
    throw new Error(`Missing or invalid environment variables: ${names}. See .env.example.`);
  }
  return parsed.data;
}

/** Canonical origin used to build links in auth emails and invitations. */
export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return raw.replace(/\/+$/, "");
}
