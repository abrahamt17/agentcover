/**
 * Database security tests.
 *
 * These run the real migration files against an in-process Postgres (PGlite)
 * and exercise them as the `authenticated` / `anon` API roles, the same way
 * requests arrive through Supabase. They cover tenancy isolation, privilege
 * escalation and the onboarding / invitation RPCs.
 */
import type { PGlite } from "@electric-sql/pglite";
import { beforeAll, describe, expect, it } from "vitest";
import { generateInvitationToken, hashToken } from "@/lib/security/tokens";
import { as, createTestDb, createUser, rows } from "./harness";

let db: PGlite;
let alice: string; // owner of org A
let bob: string; // owner of org B
let carol: string; // invited to org A as member
let dave: string; // invited to org A as admin
let mallory: string; // no organisation
let orgA: string;
let orgB: string;

const createOrg = (userId: string | null, name: string, type = "business") =>
  as(db, userId, async () => {
    const r = await rows<{ id: string }>(db, `select public.create_organisation($1, $2, 'DE') as id`, [name, type]);
    return r[0].id;
  });

async function invite(inviter: string, org: string, email: string, role: string) {
  const token = generateInvitationToken();
  await as(db, inviter, () =>
    db.query(`select public.create_invitation($1, $2, $3, $4)`, [org, email, role, hashToken(token)]),
  );
  return token;
}

const accept = (userId: string, token: string) =>
  as(db, userId, () => db.query(`select public.accept_invitation($1)`, [token]));

const memberId = async (org: string, userId: string) =>
  (await rows<{ id: string }>(db, `select id from public.organisation_members where organisation_id = $1 and user_id = $2`, [org, userId]))[0]?.id;

beforeAll(async () => {
  db = await createTestDb();
  alice = await createUser(db, "alice@org-a.test", { metadata: { full_name: "Alice Owner" } });
  bob = await createUser(db, "bob@org-b.test");
  carol = await createUser(db, "carol@org-a.test");
  dave = await createUser(db, "dave@org-a.test");
  // A hostile sign-up that tries to smuggle privileges through user metadata.
  mallory = await createUser(db, "mallory@evil.test", {
    metadata: { full_name: "Mallory", role: "owner", is_platform_admin: true, organisation_id: "x" },
  });
  orgA = await createOrg(alice, "Org A");
  orgB = await createOrg(bob, "Org B", "ai_agency");
});

describe("sign-up trigger", () => {
  it("creates a profile and preferences row for each new user", async () => {
    const profile = await rows(db, `select full_name, email from public.profiles where id = $1`, [alice]);
    expect(profile).toEqual([{ full_name: "Alice Owner", email: "alice@org-a.test" }]);
    const prefs = await rows(db, `select theme from public.user_preferences where user_id = $1`, [alice]);
    expect(prefs).toEqual([{ theme: "system" }]);
  });

  it("ignores roles supplied in sign-up metadata", async () => {
    expect(await rows(db, `select 1 from public.organisation_members where user_id = $1`, [mallory])).toHaveLength(0);
    expect(await rows(db, `select 1 from public.platform_admins where user_id = $1`, [mallory])).toHaveLength(0);
  });
});

describe("onboarding: create_organisation", () => {
  it("makes the caller the active owner", async () => {
    const m = await rows(db, `select role, status from public.organisation_members where organisation_id = $1`, [orgA]);
    expect(m).toEqual([{ role: "owner", status: "active" }]);
  });

  it("rejects a second organisation for the same owner (double submit)", async () => {
    await expect(createOrg(alice, "Another")).rejects.toThrow(/organisation_limit_reached/);
  });

  it("rejects unauthenticated callers", async () => {
    await expect(createOrg(null, "Anon Org")).rejects.toThrow(/permission denied/);
  });

  it("rejects values outside the allowed organisation types", async () => {
    await expect(createOrg(mallory, "Bad Type", "insurer")).rejects.toThrow(/check constraint/);
  });

  it("writes an audit event", async () => {
    const log = await rows(db, `select action, actor_user_id from public.audit_logs where organisation_id = $1`, [orgA]);
    expect(log).toContainEqual({ action: "organisation.created", actor_user_id: alice });
  });
});

describe("organisation isolation", () => {
  it("only returns organisations the user is an active member of", async () => {
    const visible = await as(db, alice, () => rows<{ id: string }>(db, `select id from public.organisations`));
    expect(visible.map((o) => o.id)).toEqual([orgA]);
  });

  it("hides another organisation's members, profiles, invitations and audit log", async () => {
    await invite(bob, orgB, "someone@org-b.test", "member");
    await as(db, alice, async () => {
      expect(await rows(db, `select 1 from public.organisation_members where organisation_id = $1`, [orgB])).toHaveLength(0);
      expect(await rows(db, `select 1 from public.profiles where id = $1`, [bob])).toHaveLength(0);
      expect(await rows(db, `select id from public.organisation_invitations where organisation_id = $1`, [orgB])).toHaveLength(0);
      expect(await rows(db, `select 1 from public.audit_logs where organisation_id = $1`, [orgB])).toHaveLength(0);
    });
  });

  it("shows nothing to a user with no membership, and nothing to anon", async () => {
    await as(db, mallory, async () => {
      expect(await rows(db, `select 1 from public.organisations`)).toHaveLength(0);
      expect(await rows(db, `select 1 from public.organisation_members`)).toHaveLength(0);
      expect(await rows(db, `select id from public.profiles`)).toEqual([{ id: mallory }]);
    });
    await expect(as(db, null, () => rows(db, `select 1 from public.organisations`))).rejects.toThrow(/permission denied/);
    await expect(as(db, null, () => rows(db, `select 1 from public.profiles`))).rejects.toThrow(/permission denied/);
  });

  it("blocks cross-organisation writes through RPCs", async () => {
    await expect(
      as(db, alice, () => db.query(`select public.update_organisation($1, 'Hacked', 'business', 'DE')`, [orgB])),
    ).rejects.toThrow(/forbidden/);
    await expect(invite(alice, orgB, "alice@org-a.test", "member")).rejects.toThrow(/forbidden/);
    const bobMember = await memberId(orgB, bob);
    await expect(as(db, alice, () => db.query(`select public.remove_member($1)`, [bobMember]))).rejects.toThrow(/forbidden/);
    expect((await rows<{ name: string }>(db, `select name from public.organisations where id = $1`, [orgB]))[0].name).toBe("Org B");
  });

  it("blocks direct table writes on tenancy tables", async () => {
    await as(db, alice, async () => {
      await expect(db.query(`update public.organisations set name = 'x' where id = $1`, [orgA])).rejects.toThrow(/permission denied/);
      await expect(db.query(`update public.organisations set is_demo = true where id = $1`, [orgA])).rejects.toThrow(/permission denied/);
      await expect(db.query(`insert into public.organisations (name, organisation_type) values ('x', 'business')`)).rejects.toThrow(/permission denied/);
      await expect(db.query(`delete from public.organisations where id = $1`, [orgB])).rejects.toThrow(/permission denied/);
    });
  });
});

describe("invitations", () => {
  let carolToken: string;

  it("lets the owner invite, storing only a hash of the token", async () => {
    carolToken = await invite(alice, orgA, "Carol@Org-A.test", "member");
    const stored = await rows<{ email: string; invitation_token_hash: string }>(
      db, `select email, invitation_token_hash from public.organisation_invitations where organisation_id = $1`, [orgA]);
    expect(stored).toHaveLength(1);
    expect(stored[0].email).toBe("carol@org-a.test");
    expect(stored[0].invitation_token_hash).toBe(hashToken(carolToken));
    expect(JSON.stringify(stored)).not.toContain(carolToken);
  });

  it("never exposes the token hash through the API role", async () => {
    await as(db, alice, async () => {
      expect(await rows(db, `select id, email, role from public.organisation_invitations`)).toHaveLength(1);
      await expect(rows(db, `select invitation_token_hash from public.organisation_invitations`)).rejects.toThrow(/permission denied/);
    });
  });

  it("refuses a token presented by a different email address", async () => {
    await expect(accept(mallory, carolToken)).rejects.toThrow(/invitation_email_mismatch/);
    expect(await memberId(orgA, mallory)).toBeUndefined();
  });

  it("refuses an unknown token", async () => {
    await expect(accept(carol, generateInvitationToken())).rejects.toThrow(/invitation_invalid/);
  });

  it("adds the invited user with the invited role, once", async () => {
    await accept(carol, carolToken);
    const m = await rows(db, `select role, status from public.organisation_members where organisation_id = $1 and user_id = $2`, [orgA, carol]);
    expect(m).toEqual([{ role: "member", status: "active" }]);
    await expect(accept(carol, carolToken)).rejects.toThrow(/invitation_invalid/);
  });

  it("refuses expired and revoked invitations", async () => {
    const expired = await invite(alice, orgA, "dave@org-a.test", "admin");
    await db.query(`update public.organisation_invitations set expires_at = now() - interval '1 minute' where invitation_token_hash = $1`, [hashToken(expired)]);
    await expect(accept(dave, expired)).rejects.toThrow(/invitation_invalid/);

    const revoked = await invite(alice, orgA, "dave@org-a.test", "admin");
    const inv = await rows<{ id: string }>(db, `select id from public.organisation_invitations where invitation_token_hash = $1`, [hashToken(revoked)]);
    await as(db, alice, () => db.query(`select public.revoke_invitation($1)`, [inv[0].id]));
    await expect(accept(dave, revoked)).rejects.toThrow(/invitation_invalid/);

    await accept(dave, await invite(alice, orgA, "dave@org-a.test", "admin"));
    expect((await rows<{ role: string }>(db, `select role from public.organisation_members where user_id = $1`, [dave]))[0].role).toBe("admin");
  });

  it("refuses an unverified email address", async () => {
    const eve = await createUser(db, "eve@org-a.test", { confirmed: false });
    const token = await invite(alice, orgA, "eve@org-a.test", "member");
    await expect(accept(eve, token)).rejects.toThrow(/invitation_email_mismatch/);
  });

  it("never allows inviting an owner or insurance partner, and admins cannot invite admins", async () => {
    await expect(invite(alice, orgA, "x@org-a.test", "owner")).rejects.toThrow(/invalid_role/);
    await expect(invite(alice, orgA, "x@org-a.test", "insurance_partner")).rejects.toThrow(/invalid_role/);
    await expect(invite(dave, orgA, "x@org-a.test", "admin")).rejects.toThrow(/forbidden/);
    await expect(invite(carol, orgA, "x@org-a.test", "member")).rejects.toThrow(/forbidden/);
    await expect(invite(mallory, orgA, "mallory@evil.test", "member")).rejects.toThrow(/forbidden/);
  });

  it("hides invitations from ordinary members", async () => {
    expect(await as(db, carol, () => rows(db, `select id from public.organisation_invitations`))).toHaveLength(0);
  });
});

describe("privilege escalation", () => {
  it("blocks inserting or editing membership rows directly", async () => {
    await as(db, mallory, async () => {
      await expect(
        db.query(`insert into public.organisation_members (organisation_id, user_id, role) values ($1, $2, 'owner')`, [orgA, mallory]),
      ).rejects.toThrow(/permission denied/);
    });
    await as(db, carol, async () => {
      await expect(db.query(`update public.organisation_members set role = 'owner' where user_id = $1`, [carol])).rejects.toThrow(/permission denied/);
      await expect(db.query(`delete from public.organisation_members where user_id = $1`, [alice])).rejects.toThrow(/permission denied/);
    });
  });

  it("blocks members and admins from changing roles, including their own", async () => {
    const carolMember = await memberId(orgA, carol);
    const daveMember = await memberId(orgA, dave);
    await expect(as(db, carol, () => db.query(`select public.update_member_role($1, 'admin')`, [carolMember]))).rejects.toThrow(/forbidden/);
    await expect(as(db, dave, () => db.query(`select public.update_member_role($1, 'admin')`, [carolMember]))).rejects.toThrow(/forbidden/);
    await expect(as(db, dave, () => db.query(`select public.update_member_role($1, 'member')`, [daveMember]))).rejects.toThrow(/forbidden/);
  });

  it("never grants owner through update_member_role and protects the owner row", async () => {
    const carolMember = await memberId(orgA, carol);
    const aliceMember = await memberId(orgA, alice);
    await expect(as(db, alice, () => db.query(`select public.update_member_role($1, 'owner')`, [carolMember]))).rejects.toThrow(/invalid_role/);
    await expect(as(db, alice, () => db.query(`select public.update_member_role($1, 'member')`, [aliceMember]))).rejects.toThrow(/cannot_modify_owner/);
    await expect(as(db, dave, () => db.query(`select public.remove_member($1)`, [aliceMember]))).rejects.toThrow(/cannot_modify_owner/);
  });

  it("lets the owner change a role, and records it", async () => {
    const carolMember = await memberId(orgA, carol);
    await as(db, alice, () => db.query(`select public.update_member_role($1, 'developer')`, [carolMember]));
    expect((await rows<{ role: string }>(db, `select role from public.organisation_members where id = $1`, [carolMember]))[0].role).toBe("developer");
    const log = await rows<{ metadata: unknown }>(db, `select metadata from public.audit_logs where action = 'member.role_changed' and resource_id = $1`, [carolMember]);
    expect(log[0].metadata).toEqual({ from: "member", to: "developer" });
  });

  it("blocks self-assignment as platform admin", async () => {
    await as(db, mallory, async () => {
      await expect(db.query(`insert into public.platform_admins (user_id) values ($1)`, [mallory])).rejects.toThrow(/permission denied/);
      expect(await rows(db, `select 1 from public.platform_admins`)).toHaveLength(0);
    });
  });

  it("blocks calling internal helpers that write", async () => {
    await expect(
      as(db, mallory, () => db.query(`select private.log_audit($1, $2, 'forged', 'x', null)`, [orgA, mallory])),
    ).rejects.toThrow(/permission denied/);
  });
});

describe("audit log", () => {
  it("is readable by owners and admins only", async () => {
    expect((await as(db, alice, () => rows(db, `select 1 from public.audit_logs`))).length).toBeGreaterThan(3);
    expect((await as(db, dave, () => rows(db, `select 1 from public.audit_logs`))).length).toBeGreaterThan(3);
    expect(await as(db, carol, () => rows(db, `select 1 from public.audit_logs`))).toHaveLength(0);
  });

  it("is append-only for clients", async () => {
    await as(db, alice, async () => {
      await expect(db.query(`insert into public.audit_logs (organisation_id, action, resource_type) values ($1, 'forged', 'x')`, [orgA])).rejects.toThrow(/permission denied/);
      await expect(db.query(`delete from public.audit_logs`)).rejects.toThrow(/permission denied/);
      await expect(db.query(`update public.audit_logs set action = 'x'`)).rejects.toThrow(/permission denied/);
    });
  });
});

describe("member removal", () => {
  it("lets an admin remove a developer, after which their access is gone", async () => {
    const carolMember = await memberId(orgA, carol);
    await as(db, dave, () => db.query(`select public.remove_member($1)`, [carolMember]));
    expect(await as(db, carol, () => rows(db, `select 1 from public.organisations`))).toHaveLength(0);
  });

  it("cuts off a suspended member immediately", async () => {
    await db.query(`update public.organisation_members set status = 'suspended' where user_id = $1`, [dave]);
    await as(db, dave, async () => {
      expect(await rows(db, `select 1 from public.organisations`)).toHaveLength(0);
      expect(await rows(db, `select 1 from public.audit_logs`)).toHaveLength(0);
    });
    await expect(invite(dave, orgA, "y@org-a.test", "member")).rejects.toThrow(/forbidden/);
  });
});

describe("profiles and preferences", () => {
  it("lets a user edit only their own name, and not their email", async () => {
    await as(db, alice, async () => {
      await db.query(`update public.profiles set full_name = 'Alice Renamed' where id = $1`, [alice]);
      const other = await db.query(`update public.profiles set full_name = 'Hacked' where id = $1`, [bob]);
      expect(other.affectedRows).toBe(0);
      await expect(db.query(`update public.profiles set email = 'x@y.test' where id = $1`, [alice])).rejects.toThrow(/permission denied/);
    });
    expect((await rows<{ full_name: string | null }>(db, `select full_name from public.profiles where id = $1`, [bob]))[0].full_name).toBeNull();
  });

  it("keeps preferences private to each user", async () => {
    await as(db, alice, async () => {
      expect(await rows(db, `select 1 from public.user_preferences`)).toHaveLength(1);
      await db.query(`update public.user_preferences set theme = 'dark' where user_id = $1`, [alice]);
      const other = await db.query(`update public.user_preferences set theme = 'dark' where user_id = $1`, [bob]);
      expect(other.affectedRows).toBe(0);
    });
  });
});
