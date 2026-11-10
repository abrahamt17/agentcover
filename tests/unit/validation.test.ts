import { afterEach, describe, expect, it, vi } from "vitest";
import { describeAuditEvent } from "@/lib/audit";
import { getPublicEnv, isSupabaseConfigured } from "@/lib/env";
import { forgotPasswordSchema, resetPasswordSchema, signInSchema, signUpSchema } from "@/lib/validation/auth";
import { inviteSchema, memberRoleSchema, onboardingSchema } from "@/lib/validation/organisation";

const validOnboarding = {
  fullName: "Ada Example",
  name: "Example GmbH",
  website: "",
  country: "DE",
  industry: "",
  organisationType: "ai_agency",
  estimatedAgentCount: "",
  primaryUseCases: [],
};

describe("authentication schemas", () => {
  it("accepts a valid sign-up", () => {
    expect(signUpSchema.safeParse({ fullName: "Ada Example", email: "ada@example.eu", password: "Str0ngEnough" }).success).toBe(true);
  });

  it.each([
    ["too short", "Sh0rt"],
    ["no uppercase", "alllowercase1"],
    ["no lowercase", "ALLUPPERCASE1"],
    ["no number", "NoNumbersHere"],
    ["too long", `Aa1${"x".repeat(80)}`],
  ])("rejects a weak password (%s)", (_label, password) => {
    expect(signUpSchema.safeParse({ fullName: "Ada Example", email: "ada@example.eu", password }).success).toBe(false);
  });

  it("rejects malformed emails everywhere", () => {
    for (const email of ["", "not-an-email", "a@b", "a b@example.eu"]) {
      expect(signInSchema.safeParse({ email, password: "x" }).success).toBe(false);
      expect(forgotPasswordSchema.safeParse({ email }).success).toBe(false);
    }
  });

  it("requires matching passwords on reset", () => {
    const result = resetPasswordSchema.safeParse({ password: "Str0ngEnough", confirmPassword: "Str0ngEnoughX" });
    expect(result.success).toBe(false);
    expect(resetPasswordSchema.safeParse({ password: "Str0ngEnough", confirmPassword: "Str0ngEnough" }).success).toBe(true);
  });
});

describe("onboarding schema", () => {
  it("accepts the minimum required fields, leaving optional ones empty", () => {
    expect(onboardingSchema.safeParse(validOnboarding).success).toBe(true);
  });

  it("accepts a fully completed form", () => {
    const result = onboardingSchema.safeParse({
      ...validOnboarding,
      website: "https://example.eu",
      industry: "Insurance",
      estimatedAgentCount: "6-20",
      primaryUseCases: ["customer_support", "procurement"],
    });
    expect(result.success).toBe(true);
  });

  it.each([
    ["missing name", { fullName: "" }],
    ["missing organisation name", { name: " " }],
    ["missing country", { country: "" }],
    ["unknown country", { country: "ZZ" }],
    ["missing organisation type", { organisationType: "" }],
    ["unknown organisation type", { organisationType: "insurer" }],
    ["website without scheme", { website: "example.eu" }],
    ["javascript website", { website: "javascript:alert(1)" }],
    ["unknown agent count", { estimatedAgentCount: "1000" }],
    ["unknown use case", { primaryUseCases: ["world_domination"] }],
    ["unknown industry", { industry: "Alchemy" }],
  ])("rejects %s", (_label, override) => {
    expect(onboardingSchema.safeParse({ ...validOnboarding, ...override }).success).toBe(false);
  });

  it("drops unknown keys such as a client-supplied organisation id or role", () => {
    const result = onboardingSchema.safeParse({ ...validOnboarding, organisationId: "x", role: "owner", is_demo: true });
    expect(result.success).toBe(true);
    expect(Object.keys(result.data ?? {})).not.toEqual(expect.arrayContaining(["organisationId", "role", "is_demo"]));
  });
});

describe("team schemas", () => {
  it("only allows assignable roles", () => {
    expect(inviteSchema.safeParse({ email: "x@example.eu", role: "member" }).success).toBe(true);
    for (const role of ["owner", "insurance_partner", "platform_admin", ""]) {
      expect(inviteSchema.safeParse({ email: "x@example.eu", role }).success).toBe(false);
      expect(memberRoleSchema.safeParse({ memberId: "00000000-0000-4000-8000-000000000000", role }).success).toBe(false);
    }
  });

  it("requires a UUID member id", () => {
    expect(memberRoleSchema.safeParse({ memberId: "1; drop table", role: "member" }).success).toBe(false);
  });
});

describe("environment validation", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("reports unconfigured when variables are missing, without throwing", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
    expect(isSupabaseConfigured()).toBe(false);
    expect(() => getPublicEnv()).toThrow(/NEXT_PUBLIC_SUPABASE_URL/);
  });

  it("names invalid variables but never echoes their values", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "not a url");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "short-secret");
    try {
      getPublicEnv();
      expect.unreachable();
    } catch (error) {
      expect(String(error)).toContain("NEXT_PUBLIC_SUPABASE_ANON_KEY");
      expect(String(error)).not.toContain("short-secret");
      expect(String(error)).not.toContain("not a url");
    }
  });

  it("accepts a well-formed configuration", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://abc.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "x".repeat(40));
    expect(isSupabaseConfigured()).toBe(true);
  });
});

describe("describeAuditEvent", () => {
  it("renders known events and degrades gracefully for unknown ones", () => {
    expect(describeAuditEvent({ action: "invitation.created", metadata: { email: "a@b.eu", role: "admin" } })).toBe("invited a@b.eu as Admin");
    expect(describeAuditEvent({ action: "member.role_changed", metadata: { from: "member", to: "developer" } })).toBe(
      "changed a member's role from Member to AI Developer",
    );
    expect(describeAuditEvent({ action: "agent.registered", metadata: {} })).toBe("agent registered");
  });
});
