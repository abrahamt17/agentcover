import { ROLE_LABELS, type OrgRole } from "@/lib/constants";
import type { AuditEvent } from "@/lib/types";

const role = (value: unknown) => ROLE_LABELS[value as OrgRole] ?? "member";
const text = (value: unknown) => (typeof value === "string" ? value : "someone");

/** Human-readable sentence fragment for an audit event, e.g. "invited x@y.eu as Admin". */
export function describeAuditEvent(event: Pick<AuditEvent, "action" | "metadata">): string {
  const m = event.metadata ?? {};
  switch (event.action) {
    case "organisation.created":
      return "created the organisation";
    case "organisation.updated":
      return "updated the organisation details";
    case "invitation.created":
      return `invited ${text(m.email)} as ${role(m.role)}`;
    case "invitation.revoked":
      return `revoked the invitation for ${text(m.email)}`;
    case "invitation.accepted":
      return `joined the organisation as ${role(m.role)}`;
    case "member.role_changed":
      return `changed a member's role from ${role(m.from)} to ${role(m.to)}`;
    case "member.removed":
      return "removed a member from the organisation";
    default:
      return event.action.replaceAll(/[._]/g, " ");
  }
}
