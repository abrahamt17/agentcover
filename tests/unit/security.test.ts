import { beforeEach, describe, expect, it } from "vitest";
import { can, canRemoveMember, invitableRoles, PERMISSIONS } from "@/lib/auth/permissions";
import { ORG_ROLES } from "@/lib/constants";
import { rateLimit, resetRateLimits } from "@/lib/security/rate-limit";
import { safeRedirectPath } from "@/lib/security/redirect";
import { generateInvitationToken, hashToken } from "@/lib/security/tokens";

describe("safeRedirectPath", () => {
  it("keeps same-origin paths, including query strings", () => {
    expect(safeRedirectPath("/dashboard/settings/team")).toBe("/dashboard/settings/team");
    expect(safeRedirectPath("/invite/abc?x=1")).toBe("/invite/abc?x=1");
  });

  it.each([
    "https://evil.example/phish",
    "//evil.example",
    "/\\evil.example",
    "\\\\evil.example",
    "javascript:alert(1)",
    "dashboard",
    "",
    "/ok\nSet-Cookie: x=1",
    "/" + "a".repeat(600),
  ])("rejects %j", (value) => {
    expect(safeRedirectPath(value, "/dashboard")).toBe("/dashboard");
  });

  it("rejects non-string input", () => {
    expect(safeRedirectPath(undefined, "/onboarding")).toBe("/onboarding");
    expect(safeRedirectPath(["/a"], "/onboarding")).toBe("/onboarding");
    expect(safeRedirectPath(null)).toBe("/dashboard");
  });
});

describe("rateLimit", () => {
  beforeEach(() => resetRateLimits());

  it("allows up to the limit, then blocks until the window resets", () => {
    const t0 = 1_000_000;
    for (let i = 0; i < 3; i += 1) expect(rateLimit("k", 3, 60_000, t0 + i).allowed).toBe(true);
    const blocked = rateLimit("k", 3, 60_000, t0 + 10);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
    expect(rateLimit("k", 3, 60_000, t0 + 60_001).allowed).toBe(true);
  });

  it("tracks keys independently", () => {
    expect(rateLimit("a", 1, 60_000).allowed).toBe(true);
    expect(rateLimit("a", 1, 60_000).allowed).toBe(false);
    expect(rateLimit("b", 1, 60_000).allowed).toBe(true);
  });
});

describe("invitation tokens", () => {
  it("generates unique, URL-safe tokens with at least 256 bits", () => {
    const a = generateInvitationToken();
    const b = generateInvitationToken();
    expect(a).not.toBe(b);
    expect(a).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  it("hashes to a 64-character hex digest that is not the token", () => {
    const token = generateInvitationToken();
    const hash = hashToken(token);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hash).not.toContain(token);
    expect(hashToken(token)).toBe(hash);
    // Known vector: SHA-256("abc").
    expect(hashToken("abc")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  });
});

describe("permissions", () => {
  it("grants nothing to a missing role", () => {
    for (const permission of Object.keys(PERMISSIONS) as (keyof typeof PERMISSIONS)[]) {
      expect(can(null, permission)).toBe(false);
      expect(can(undefined, permission)).toBe(false);
    }
  });

  it("reserves organisation settings, role changes and billing for the owner", () => {
    for (const role of ORG_ROLES) {
      const isOwner = role === "owner";
      expect(can(role, "organisation.update")).toBe(isOwner);
      expect(can(role, "members.change_role")).toBe(isOwner);
      expect(can(role, "billing.manage")).toBe(isOwner);
    }
  });

  it("gives members, developers and partners no team-management rights", () => {
    for (const role of ["member", "developer", "insurance_partner"] as const) {
      expect(can(role, "members.invite")).toBe(false);
      expect(can(role, "members.remove")).toBe(false);
      expect(can(role, "audit.view")).toBe(false);
      expect(invitableRoles(role)).toEqual([]);
    }
  });

  it("never lets anyone invite an owner, and stops admins inviting admins", () => {
    expect(invitableRoles("owner")).toEqual(["admin", "member", "developer"]);
    expect(invitableRoles("admin")).toEqual(["member", "developer"]);
    for (const role of ORG_ROLES) expect(invitableRoles(role)).not.toContain("owner");
  });

  it("protects the owner and yourself from removal", () => {
    expect(canRemoveMember("owner", "owner", false)).toBe(false);
    expect(canRemoveMember("owner", "admin", true)).toBe(false);
    expect(canRemoveMember("owner", "admin", false)).toBe(true);
    expect(canRemoveMember("admin", "admin", false)).toBe(false);
    expect(canRemoveMember("admin", "member", false)).toBe(true);
    expect(canRemoveMember("member", "member", false)).toBe(false);
  });
});
