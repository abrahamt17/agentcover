-- =============================================================================
-- AgentCover · Phase 1 foundation
-- Identity, organisations (tenancy), invitations, audit log, preferences.
--
-- Security model in one paragraph:
--   * Every table has Row Level Security enabled.
--   * Clients (role `authenticated`) get SELECT only, filtered by active
--     organisation membership. The only direct writes allowed are a user
--     editing their own profile name/avatar and their own preferences.
--   * Every tenancy-changing write (create organisation, invite, accept,
--     change role, remove member, update organisation) goes through a
--     SECURITY DEFINER function that derives the caller from auth.uid() and
--     re-checks their role in the database. Client-supplied roles or
--     organisation IDs are never trusted.
--   * Platform admins live in their own table with no write policy at all.
-- =============================================================================

create schema if not exists private;

-- -----------------------------------------------------------------------------
-- Tables
-- -----------------------------------------------------------------------------

create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text check (full_name is null or char_length(full_name) <= 120),
  email       text not null check (char_length(email) <= 320),
  avatar_url  text check (avatar_url is null or char_length(avatar_url) <= 2048),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.organisations (
  id                     uuid primary key default gen_random_uuid(),
  name                   text not null check (char_length(btrim(name)) between 2 and 120),
  website                text check (website is null or (char_length(website) <= 255 and website ~* '^https?://')),
  country                text check (country is null or country ~ '^[A-Z]{2}$'),
  industry               text check (industry is null or char_length(industry) <= 80),
  organisation_type      text not null check (organisation_type in
                           ('business', 'ai_agency', 'ai_software_company', 'independent_developer', 'other')),
  estimated_agent_count  text check (estimated_agent_count is null or estimated_agent_count in
                           ('1-5', '6-20', '21-50', '51-100', '100+')),
  primary_use_cases      text[] not null default '{}' check (cardinality(primary_use_cases) <= 12),
  -- Set only by the demo seed script (service role). Never settable by clients.
  is_demo                boolean not null default false,
  created_by             uuid references public.profiles (id) on delete set null,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create table public.organisation_members (
  id               uuid primary key default gen_random_uuid(),
  organisation_id  uuid not null references public.organisations (id) on delete cascade,
  user_id          uuid not null references public.profiles (id) on delete cascade,
  -- insurance_partner is reserved for a later phase; no Phase 1 function assigns it.
  role             text not null check (role in ('owner', 'admin', 'member', 'developer', 'insurance_partner')),
  status           text not null default 'active' check (status in ('active', 'suspended')),
  created_at       timestamptz not null default now(),
  unique (organisation_id, user_id)
);

create index organisation_members_user_id_idx on public.organisation_members (user_id);
create unique index organisation_members_one_owner_idx
  on public.organisation_members (organisation_id) where role = 'owner';

create table public.organisation_invitations (
  id                     uuid primary key default gen_random_uuid(),
  organisation_id        uuid not null references public.organisations (id) on delete cascade,
  email                  text not null check (email = lower(email) and char_length(email) <= 320 and email like '%_@_%'),
  role                   text not null check (role in ('admin', 'member', 'developer')),
  -- SHA-256 hex digest of the invitation token. The plaintext token is never stored.
  invitation_token_hash  text not null unique check (invitation_token_hash ~ '^[0-9a-f]{64}$'),
  expires_at             timestamptz not null,
  accepted_at            timestamptz,
  revoked_at             timestamptz,
  created_by             uuid references public.profiles (id) on delete set null,
  created_at             timestamptz not null default now()
);

create index organisation_invitations_org_idx on public.organisation_invitations (organisation_id);
create unique index organisation_invitations_pending_idx
  on public.organisation_invitations (organisation_id, email)
  where accepted_at is null and revoked_at is null;

create table public.audit_logs (
  id               uuid primary key default gen_random_uuid(),
  organisation_id  uuid references public.organisations (id) on delete cascade,
  actor_user_id    uuid references public.profiles (id) on delete set null,
  action           text not null check (char_length(action) <= 80),
  resource_type    text not null check (char_length(resource_type) <= 80),
  resource_id      uuid,
  metadata         jsonb not null default '{}'::jsonb,
  created_at       timestamptz not null default now()
);

create index audit_logs_org_created_idx on public.audit_logs (organisation_id, created_at desc);

create table public.user_preferences (
  id                        uuid primary key default gen_random_uuid(),
  user_id                   uuid not null unique references public.profiles (id) on delete cascade,
  theme                     text not null default 'system' check (theme in ('system', 'light', 'dark')),
  notification_preferences  jsonb not null default '{"security_alerts": true, "product_updates": false}'::jsonb
                              check (jsonb_typeof(notification_preferences) = 'object'),
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

-- Internal platform administrators. Assigned only by SQL / service role:
--   insert into public.platform_admins (user_id) values ('<uuid>');
create table public.platform_admins (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  granted_by  uuid references auth.users (id) on delete set null,
  created_at  timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Internal helpers (schema `private` is not exposed through the API)
-- -----------------------------------------------------------------------------

create function private.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function private.set_updated_at();
create trigger organisations_set_updated_at before update on public.organisations
  for each row execute function private.set_updated_at();
create trigger user_preferences_set_updated_at before update on public.user_preferences
  for each row execute function private.set_updated_at();

-- Create profile + preferences whenever an auth user is created.
-- Only the display name is read from user metadata; roles never are.
create function private.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    coalesce(lower(new.email), ''),
    nullif(left(btrim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), 120), '')
  );
  insert into public.user_preferences (user_id) values (new.id);
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function private.handle_new_user();

create function private.handle_user_email_change()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  update public.profiles set email = coalesce(lower(new.email), '') where id = new.id;
  return new;
end $$;

create trigger on_auth_user_email_changed after update of email on auth.users
  for each row when (old.email is distinct from new.email)
  execute function private.handle_user_email_change();

-- Role of the calling user in an organisation (null when not an active member).
create function private.org_role(p_organisation_id uuid)
returns text language sql stable security definer set search_path = '' as $$
  select m.role
  from public.organisation_members m
  where m.organisation_id = p_organisation_id
    and m.user_id = (select auth.uid())
    and m.status = 'active'
$$;

create function private.is_org_member(p_organisation_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select private.org_role(p_organisation_id) is not null
$$;

create function private.has_org_role(p_organisation_id uuid, p_roles text[])
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce(private.org_role(p_organisation_id) = any (p_roles), false)
$$;

-- True when the caller and p_user_id are both active members of some organisation.
create function private.shares_org_with(p_user_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.organisation_members mine
    join public.organisation_members theirs using (organisation_id)
    where mine.user_id = (select auth.uid())
      and mine.status = 'active'
      and theirs.user_id = p_user_id
      and theirs.status = 'active'
  )
$$;

create function private.log_audit(
  p_organisation_id uuid,
  p_actor uuid,
  p_action text,
  p_resource_type text,
  p_resource_id uuid,
  p_metadata jsonb default '{}'::jsonb
)
returns void language sql security definer set search_path = '' as $$
  insert into public.audit_logs (organisation_id, actor_user_id, action, resource_type, resource_id, metadata)
  values (p_organisation_id, p_actor, p_action, p_resource_type, p_resource_id, coalesce(p_metadata, '{}'::jsonb))
$$;

revoke all on schema private from public;
revoke execute on all functions in schema private from public;
grant usage on schema private to authenticated;
grant execute on function private.org_role(uuid) to authenticated;
grant execute on function private.is_org_member(uuid) to authenticated;
grant execute on function private.has_org_role(uuid, text[]) to authenticated;
grant execute on function private.shares_org_with(uuid) to authenticated;

-- -----------------------------------------------------------------------------
-- RPC: organisations
-- -----------------------------------------------------------------------------

-- Creates an organisation and makes the caller its owner. Used by onboarding.
-- Phase 1 rule: a user may own at most one organisation (they can still be
-- invited into others).
create function public.create_organisation(
  p_name text,
  p_organisation_type text,
  p_country text,
  p_website text default null,
  p_industry text default null,
  p_estimated_agent_count text default null,
  p_primary_use_cases text[] default '{}',
  p_full_name text default null
)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_org  uuid;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  -- Serialise per user so a double-submitted form cannot create two organisations.
  perform pg_advisory_xact_lock(hashtextextended(v_user::text, 0));

  if exists (select 1 from public.organisation_members m where m.user_id = v_user and m.role = 'owner') then
    raise exception 'organisation_limit_reached' using errcode = 'P0001';
  end if;

  insert into public.organisations
    (name, organisation_type, country, website, industry, estimated_agent_count, primary_use_cases, created_by)
  values (
    btrim(p_name),
    p_organisation_type,
    nullif(upper(btrim(coalesce(p_country, ''))), ''),
    nullif(btrim(coalesce(p_website, '')), ''),
    nullif(btrim(coalesce(p_industry, '')), ''),
    nullif(btrim(coalesce(p_estimated_agent_count, '')), ''),
    coalesce(p_primary_use_cases, '{}'),
    v_user
  )
  returning id into v_org;

  insert into public.organisation_members (organisation_id, user_id, role)
  values (v_org, v_user, 'owner');

  if nullif(btrim(coalesce(p_full_name, '')), '') is not null then
    update public.profiles set full_name = left(btrim(p_full_name), 120) where id = v_user;
  end if;

  perform private.log_audit(v_org, v_user, 'organisation.created', 'organisation', v_org,
    jsonb_build_object('name', btrim(p_name)));

  return v_org;
end $$;

create function public.update_organisation(
  p_organisation_id uuid,
  p_name text,
  p_organisation_type text,
  p_country text,
  p_website text default null,
  p_industry text default null,
  p_estimated_agent_count text default null,
  p_primary_use_cases text[] default '{}'
)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  if not private.has_org_role(p_organisation_id, array['owner']) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  update public.organisations set
    name = btrim(p_name),
    organisation_type = p_organisation_type,
    country = nullif(upper(btrim(coalesce(p_country, ''))), ''),
    website = nullif(btrim(coalesce(p_website, '')), ''),
    industry = nullif(btrim(coalesce(p_industry, '')), ''),
    estimated_agent_count = nullif(btrim(coalesce(p_estimated_agent_count, '')), ''),
    primary_use_cases = coalesce(p_primary_use_cases, '{}')
  where id = p_organisation_id;

  perform private.log_audit(p_organisation_id, v_user, 'organisation.updated', 'organisation', p_organisation_id);
end $$;

-- -----------------------------------------------------------------------------
-- RPC: invitations
-- -----------------------------------------------------------------------------

-- The application server generates a random token, keeps the plaintext only
-- long enough to show the inviter a link, and passes the SHA-256 hash here.
create function public.create_invitation(
  p_organisation_id uuid,
  p_email text,
  p_role text,
  p_token_hash text
)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_user   uuid := auth.uid();
  v_role   text;
  v_email  text := lower(btrim(coalesce(p_email, '')));
  v_id     uuid;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  v_role := private.org_role(p_organisation_id);
  if v_role is null or v_role not in ('owner', 'admin') then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if p_role is null or p_role not in ('admin', 'member', 'developer') then
    raise exception 'invalid_role' using errcode = '42501';
  end if;
  -- Admins may not create other admins; only the owner can.
  if v_role = 'admin' and p_role = 'admin' then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if exists (
    select 1
    from public.organisation_members m
    join public.profiles p on p.id = m.user_id
    where m.organisation_id = p_organisation_id and p.email = v_email
  ) then
    raise exception 'already_member' using errcode = 'P0001';
  end if;

  -- Re-inviting replaces any earlier pending invitation for the same address.
  update public.organisation_invitations
     set revoked_at = now()
   where organisation_id = p_organisation_id
     and email = v_email
     and accepted_at is null
     and revoked_at is null;

  if (select count(*) from public.organisation_invitations i
       where i.organisation_id = p_organisation_id
         and i.accepted_at is null and i.revoked_at is null and i.expires_at > now()) >= 50 then
    raise exception 'too_many_pending_invitations' using errcode = 'P0001';
  end if;

  insert into public.organisation_invitations
    (organisation_id, email, role, invitation_token_hash, expires_at, created_by)
  values (p_organisation_id, v_email, p_role, p_token_hash, now() + interval '7 days', v_user)
  returning id into v_id;

  perform private.log_audit(p_organisation_id, v_user, 'invitation.created', 'organisation_invitation', v_id,
    jsonb_build_object('email', v_email, 'role', p_role));

  return v_id;
end $$;

create function public.revoke_invitation(p_invitation_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_inv  public.organisation_invitations%rowtype;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  select * into v_inv from public.organisation_invitations where id = p_invitation_id;
  -- Same error whether the invitation is missing or belongs to another organisation.
  if not found or not private.has_org_role(v_inv.organisation_id, array['owner', 'admin']) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  update public.organisation_invitations
     set revoked_at = now()
   where id = p_invitation_id and accepted_at is null and revoked_at is null;

  perform private.log_audit(v_inv.organisation_id, v_user, 'invitation.revoked', 'organisation_invitation', v_inv.id,
    jsonb_build_object('email', v_inv.email));
end $$;

-- Accepts an invitation using the plaintext token from the invite link.
-- The caller must be signed in with a verified email matching the invitation.
create function public.accept_invitation(p_token text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_user       uuid := auth.uid();
  v_email      text;
  v_confirmed  timestamptz;
  v_inv        public.organisation_invitations%rowtype;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  select lower(u.email), u.email_confirmed_at into v_email, v_confirmed
  from auth.users u where u.id = v_user;

  select * into v_inv
  from public.organisation_invitations i
  where i.invitation_token_hash = encode(sha256(convert_to(coalesce(p_token, ''), 'UTF8')), 'hex')
  for update;

  if not found
     or v_inv.accepted_at is not null
     or v_inv.revoked_at is not null
     or v_inv.expires_at <= now() then
    raise exception 'invitation_invalid' using errcode = 'P0001';
  end if;

  if v_confirmed is null or v_email is distinct from v_inv.email then
    raise exception 'invitation_email_mismatch' using errcode = '42501';
  end if;

  insert into public.organisation_members (organisation_id, user_id, role)
  values (v_inv.organisation_id, v_user, v_inv.role)
  on conflict (organisation_id, user_id) do nothing;

  update public.organisation_invitations set accepted_at = now() where id = v_inv.id;

  perform private.log_audit(v_inv.organisation_id, v_user, 'invitation.accepted', 'organisation_invitation', v_inv.id,
    jsonb_build_object('role', v_inv.role));

  return v_inv.organisation_id;
end $$;

-- -----------------------------------------------------------------------------
-- RPC: membership management
-- -----------------------------------------------------------------------------

-- Owner-only. Cannot target yourself or the owner, and cannot grant `owner`.
create function public.update_member_role(p_member_id uuid, p_role text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_user    uuid := auth.uid();
  v_target  public.organisation_members%rowtype;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  select * into v_target from public.organisation_members where id = p_member_id;
  if not found or not private.has_org_role(v_target.organisation_id, array['owner']) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if v_target.user_id = v_user or v_target.role = 'owner' then
    raise exception 'cannot_modify_owner' using errcode = '42501';
  end if;
  if p_role is null or p_role not in ('admin', 'member', 'developer') then
    raise exception 'invalid_role' using errcode = '42501';
  end if;

  update public.organisation_members set role = p_role where id = p_member_id;

  perform private.log_audit(v_target.organisation_id, v_user, 'member.role_changed', 'organisation_member', v_target.id,
    jsonb_build_object('from', v_target.role, 'to', p_role));
end $$;

-- Owners can remove anyone except the owner. Admins can remove members and developers.
create function public.remove_member(p_member_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_user    uuid := auth.uid();
  v_role    text;
  v_target  public.organisation_members%rowtype;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  select * into v_target from public.organisation_members where id = p_member_id;
  if not found then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  v_role := private.org_role(v_target.organisation_id);
  if v_role is null or v_role not in ('owner', 'admin') then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if v_target.user_id = v_user or v_target.role = 'owner' then
    raise exception 'cannot_modify_owner' using errcode = '42501';
  end if;
  if v_role = 'admin' and v_target.role not in ('member', 'developer') then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  delete from public.organisation_members where id = p_member_id;

  perform private.log_audit(v_target.organisation_id, v_user, 'member.removed', 'organisation_member', v_target.id,
    jsonb_build_object('role', v_target.role));
end $$;

-- Functions are executable by PUBLIC by default; restrict to signed-in users.
revoke execute on function public.create_organisation(text, text, text, text, text, text, text[], text) from public, anon;
revoke execute on function public.update_organisation(uuid, text, text, text, text, text, text, text[]) from public, anon;
revoke execute on function public.create_invitation(uuid, text, text, text) from public, anon;
revoke execute on function public.revoke_invitation(uuid) from public, anon;
revoke execute on function public.accept_invitation(text) from public, anon;
revoke execute on function public.update_member_role(uuid, text) from public, anon;
revoke execute on function public.remove_member(uuid) from public, anon;

grant execute on function public.create_organisation(text, text, text, text, text, text, text[], text) to authenticated;
grant execute on function public.update_organisation(uuid, text, text, text, text, text, text, text[]) to authenticated;
grant execute on function public.create_invitation(uuid, text, text, text) to authenticated;
grant execute on function public.revoke_invitation(uuid) to authenticated;
grant execute on function public.accept_invitation(text) to authenticated;
grant execute on function public.update_member_role(uuid, text) to authenticated;
grant execute on function public.remove_member(uuid) to authenticated;

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------

alter table public.profiles                 enable row level security;
alter table public.organisations            enable row level security;
alter table public.organisation_members     enable row level security;
alter table public.organisation_invitations enable row level security;
alter table public.audit_logs               enable row level security;
alter table public.user_preferences         enable row level security;
alter table public.platform_admins          enable row level security;

-- Start from zero privileges, then grant exactly what the app needs.
revoke all on public.profiles,
              public.organisations,
              public.organisation_members,
              public.organisation_invitations,
              public.audit_logs,
              public.user_preferences,
              public.platform_admins
  from anon, authenticated;

-- profiles: read yourself and people you share an organisation with; edit your own name/avatar.
grant select on public.profiles to authenticated;
grant update (full_name, avatar_url) on public.profiles to authenticated;

create policy profiles_select on public.profiles for select to authenticated
  using (id = (select auth.uid()) or private.shares_org_with(id));
create policy profiles_update_own on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- organisations: read-only for active members. Writes go through RPCs.
grant select on public.organisations to authenticated;

create policy organisations_select on public.organisations for select to authenticated
  using (private.is_org_member(id));

-- organisation_members: read-only for active members of the same organisation.
grant select on public.organisation_members to authenticated;

create policy organisation_members_select on public.organisation_members for select to authenticated
  using (private.is_org_member(organisation_id));

-- organisation_invitations: owners/admins can list them; the token hash column is never readable.
grant select (id, organisation_id, email, role, expires_at, accepted_at, revoked_at, created_by, created_at)
  on public.organisation_invitations to authenticated;

create policy organisation_invitations_select on public.organisation_invitations for select to authenticated
  using (private.has_org_role(organisation_id, array['owner', 'admin']));

-- audit_logs: append-only (written by RPCs), readable by owners/admins.
grant select on public.audit_logs to authenticated;

create policy audit_logs_select on public.audit_logs for select to authenticated
  using (private.has_org_role(organisation_id, array['owner', 'admin']));

-- user_preferences: strictly per-user.
grant select on public.user_preferences to authenticated;
grant update (theme, notification_preferences) on public.user_preferences to authenticated;

create policy user_preferences_select_own on public.user_preferences for select to authenticated
  using (user_id = (select auth.uid()));
create policy user_preferences_update_own on public.user_preferences for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- platform_admins: a user can see whether they are one. No client can write.
grant select on public.platform_admins to authenticated;

create policy platform_admins_select_own on public.platform_admins for select to authenticated
  using (user_id = (select auth.uid()));
