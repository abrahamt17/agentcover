import type { AssignableRole, OrgRole } from "@/lib/constants";

/**
 * Application-level permission map.
 *
 * This drives what the UI offers and lets server actions fail fast with a clear
 * message. It is NOT the security boundary: the same rules are enforced again in
 * Postgres (RLS policies and SECURITY DEFINER functions), which is what actually
 * protects the data.
 */
export const PERMISSIONS = {
  "organisation.update": ["owner"],
  "members.invite": ["owner", "admin"],
  "members.remove": ["owner", "admin"],
  "members.change_role": ["owner"],
  "audit.view": ["owner", "admin"],
  "billing.manage": ["owner"],
} as const satisfies Record<string, readonly OrgRole[]>;

export type Permission = keyof typeof PERMISSIONS;

export function can(role: OrgRole | null | undefined, permission: Permission): boolean {
  if (!role) return false;
  return (PERMISSIONS[permission] as readonly OrgRole[]).includes(role);
}

/** Which roles `actor` may hand out when inviting. Owners are never created by invitation. */
export function invitableRoles(actor: OrgRole | null | undefined): AssignableRole[] {
  if (actor === "owner") return ["admin", "member", "developer"];
  if (actor === "admin") return ["member", "developer"];
  return [];
}

export function canRemoveMember(actor: OrgRole | null | undefined, target: OrgRole, isSelf: boolean): boolean {
  if (isSelf || target === "owner") return false;
  if (actor === "owner") return true;
  if (actor === "admin") return target === "member" || target === "developer";
  return false;
}
