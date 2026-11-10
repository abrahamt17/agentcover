/**
 * Seeds the fictional demo organisation "Northstar Automation GmbH" with three
 * demo users. Intended for a development or dedicated demo Supabase project.
 *
 *   node --env-file=.env.local scripts/seed-demo.mjs
 *
 * Safety properties:
 *  - Refuses to run unless DEMO_SEED_CONFIRM=northstar is set explicitly.
 *  - No credentials are hardcoded: the password comes from DEMO_USER_PASSWORD.
 *  - Demo users are ordinary users. They are members of the demo organisation
 *    only and are subject to the same Row Level Security as everyone else, so
 *    they cannot read any other organisation's data.
 *  - Uses the service-role key from your shell. The web application never
 *    reads that key.
 *
 * Do not run this against a production project that holds customer data.
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const password = process.env.DEMO_USER_PASSWORD;

function fail(message) {
  console.error(`seed-demo: ${message}`);
  process.exit(1);
}

if (process.env.DEMO_SEED_CONFIRM !== "northstar") {
  fail("refusing to run. Set DEMO_SEED_CONFIRM=northstar to confirm this is a non-production project.");
}
if (!url || !serviceKey) fail("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
if (!password || password.length < 12) fail("DEMO_USER_PASSWORD is required and must be at least 12 characters.");

const ORGANISATION = {
  name: "Northstar Automation GmbH",
  organisation_type: "ai_agency",
  country: "DE",
  industry: "Technology and software",
  estimated_agent_count: "6-20",
  primary_use_cases: ["customer_support", "finance_accounting", "procurement"],
  is_demo: true,
};

const USERS = [
  { email: "demo-owner@northstar-automation.example", full_name: "Demo Owner", role: "owner" },
  { email: "demo-admin@northstar-automation.example", full_name: "Demo Admin", role: "admin" },
  { email: "demo-developer@northstar-automation.example", full_name: "Demo Developer", role: "developer" },
];

const supabase = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

const existing = await supabase.from("organisations").select("id").eq("is_demo", true).eq("name", ORGANISATION.name).maybeSingle();
if (existing.error) fail(`could not query organisations: ${existing.error.message}`);
if (existing.data) {
  console.log("seed-demo: demo organisation already exists, nothing to do.");
  process.exit(0);
}

const userIds = [];
for (const user of USERS) {
  const created = await supabase.auth.admin.createUser({
    email: user.email,
    password,
    email_confirm: true,
    user_metadata: { full_name: user.full_name },
  });
  if (created.error) fail(`could not create ${user.email}: ${created.error.message}`);
  userIds.push(created.data.user.id);
  console.log(`seed-demo: created ${user.email}`);
}

const organisation = await supabase
  .from("organisations")
  .insert({ ...ORGANISATION, created_by: userIds[0] })
  .select("id")
  .single();
if (organisation.error) fail(`could not create organisation: ${organisation.error.message}`);

const members = await supabase.from("organisation_members").insert(
  USERS.map((user, index) => ({ organisation_id: organisation.data.id, user_id: userIds[index], role: user.role })),
);
if (members.error) fail(`could not create memberships: ${members.error.message}`);

const audit = await supabase.from("audit_logs").insert({
  organisation_id: organisation.data.id,
  actor_user_id: userIds[0],
  action: "organisation.created",
  resource_type: "organisation",
  resource_id: organisation.data.id,
  metadata: { name: ORGANISATION.name, seeded: true },
});
if (audit.error) fail(`could not write audit entry: ${audit.error.message}`);

console.log(`seed-demo: created "${ORGANISATION.name}" with ${USERS.length} members.`);
console.log("seed-demo: sign in with any demo email and the password from DEMO_USER_PASSWORD.");
