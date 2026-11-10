import type { Metadata } from "next";
import { TeamManager } from "@/components/dashboard/team-manager";
import { can, invitableRoles } from "@/lib/auth/permissions";
import { requireOrgContext } from "@/lib/auth/session";
import { listMembers, listPendingInvitations } from "@/lib/data/organisation";

export const metadata: Metadata = { title: "Team" };

export default async function TeamSettingsPage() {
  const { user, organisation, role } = await requireOrgContext();
  const canInvite = can(role, "members.invite");

  const [members, invitations] = await Promise.all([
    listMembers(organisation.id),
    canInvite ? listPendingInvitations(organisation.id) : Promise.resolve([]),
  ]);

  return (
    <TeamManager
      members={members}
      invitations={invitations}
      currentUserId={user.id}
      currentRole={role}
      invitableRoles={invitableRoles(role)}
      canChangeRoles={can(role, "members.change_role")}
      readOnly={organisation.is_demo}
    />
  );
}
