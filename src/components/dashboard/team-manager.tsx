"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Copy, Mail, Trash2, UserPlus } from "lucide-react";
import { useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { useActionForm } from "@/components/auth/use-action-form";
import { Badge, Status } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, EmptyState } from "@/components/ui/feedback";
import { Field, Input, Select } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  inviteMemberAction,
  removeMemberAction,
  revokeInvitationAction,
  updateMemberRoleAction,
} from "@/lib/actions/organisation";
import { canRemoveMember } from "@/lib/auth/permissions";
import { ROLE_DESCRIPTIONS, ROLE_LABELS, type AssignableRole, type OrgRole } from "@/lib/constants";
import type { ActionResult, Invitation, TeamMember } from "@/lib/types";
import { formatDate, initials } from "@/lib/utils";
import { inviteSchema, type InviteValues } from "@/lib/validation/organisation";

type TeamManagerProps = {
  members: TeamMember[];
  invitations: Invitation[];
  currentUserId: string;
  currentRole: OrgRole;
  /** Roles the current user may grant by invitation. Empty when they cannot invite. */
  invitableRoles: AssignableRole[];
  canChangeRoles: boolean;
  readOnly: boolean;
};

export function TeamManager({
  members,
  invitations,
  currentUserId,
  currentRole,
  invitableRoles,
  canChangeRoles,
  readOnly,
}: TeamManagerProps) {
  const [pending, startTransition] = useTransition();
  const canInvite = invitableRoles.length > 0 && !readOnly;

  const run = (action: () => Promise<ActionResult>) =>
    startTransition(async () => {
      const result = await action();
      if (result.ok) toast.success(result.message ?? "Done");
      else toast.error(result.error);
    });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex-row flex-wrap items-start justify-between gap-3 pb-5">
          <div className="space-y-1">
            <CardTitle>Members</CardTitle>
            <CardDescription>
              {members.length} {members.length === 1 ? "person has" : "people have"} access to this organisation.
            </CardDescription>
          </div>
          {canInvite ? <InviteDialog roles={invitableRoles} /> : null}
        </CardHeader>
        <div className="border-t border-line">
          <Table>
            <TableHeader>
              <tr>
                <TableHead>Member</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </tr>
            </TableHeader>
            <TableBody>
              {members.map((member) => {
                const isSelf = member.user_id === currentUserId;
                const name = member.profile?.full_name || member.profile?.email || "Unknown user";
                const editableRole = canChangeRoles && !readOnly && !isSelf && member.role !== "owner";
                const removable = !readOnly && canRemoveMember(currentRole, member.role, isSelf);
                return (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-subtle text-xs font-semibold text-ink-muted">
                          {initials(name)}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-medium">
                            {name}
                            {isSelf ? <span className="ml-2 text-xs font-normal text-ink-subtle">You</span> : null}
                          </p>
                          <p className="truncate text-xs text-ink-subtle">{member.profile?.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {editableRole ? (
                        <Select
                          aria-label={`Role for ${name}`}
                          containerClassName="w-40"
                          className="h-8"
                          value={member.role}
                          disabled={pending}
                          onChange={(event) =>
                            run(() => updateMemberRoleAction({ memberId: member.id, role: event.target.value }))
                          }
                        >
                          {(["admin", "member", "developer"] as const).map((role) => (
                            <option key={role} value={role}>
                              {ROLE_LABELS[role]}
                            </option>
                          ))}
                        </Select>
                      ) : (
                        <Badge variant={member.role === "owner" ? "navy" : "neutral"}>{ROLE_LABELS[member.role]}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Status tone={member.status === "active" ? "success" : "warning"}>
                        {member.status === "active" ? "Active" : "Suspended"}
                      </Status>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-ink-muted">{formatDate(member.created_at)}</TableCell>
                    <TableCell className="text-right">
                      {removable ? <RemoveMemberDialog name={name} onConfirm={() => run(() => removeMemberAction(member.id))} /> : null}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Card>

      {invitableRoles.length > 0 ? (
        <Card>
          <CardHeader className="pb-5">
            <CardTitle>Pending invitations</CardTitle>
            <CardDescription>Invitations expire after 7 days and can only be accepted by the invited email address.</CardDescription>
          </CardHeader>
          <div className="border-t border-line">
            {invitations.length === 0 ? (
              <EmptyState icon={Mail} title="No pending invitations" description="People you invite appear here until they accept." />
            ) : (
              <Table>
                <TableHeader>
                  <tr>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </tr>
                </TableHeader>
                <TableBody>
                  {invitations.map((invitation) => (
                    <TableRow key={invitation.id}>
                      <TableCell className="font-medium">{invitation.email}</TableCell>
                      <TableCell>
                        <Badge>{ROLE_LABELS[invitation.role]}</Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-ink-muted">{formatDate(invitation.expires_at)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={pending || readOnly}
                          onClick={() => run(() => revokeInvitationAction(invitation.id))}
                        >
                          Revoke
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </Card>
      ) : null}
    </div>
  );
}

function InviteDialog({ roles }: { roles: AssignableRole[] }) {
  const [open, setOpen] = useState(false);
  const [created, setCreated] = useState<{ inviteUrl: string; email: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const form = useForm<InviteValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: "", role: roles.includes("member") ? "member" : roles[0] },
  });
  const { onSubmit, pending, result, clearResult } = useActionForm(form, inviteMemberAction, (r) => {
    if (r.data) setCreated(r.data);
  });
  const selectedRole = useWatch({ control: form.control, name: "role" });

  const onOpenChange = (value: boolean) => {
    setOpen(value);
    if (!value) {
      setCreated(null);
      setCopied(false);
      clearResult();
      form.reset();
    }
  };

  const copy = async () => {
    if (!created) return;
    try {
      await navigator.clipboard.writeText(created.inviteUrl);
      setCopied(true);
    } catch {
      toast.error("Could not copy. Select the link and copy it manually.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm">
          <UserPlus aria-hidden />
          Invite member
        </Button>
      </DialogTrigger>
      <DialogContent>
        {created ? (
          <>
            <DialogHeader>
              <DialogTitle>Invitation created</DialogTitle>
              <DialogDescription>
                Send this link to {created.email}. AgentCover does not email invitations yet, so share it yourself.
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-2">
              <Input readOnly value={created.inviteUrl} aria-label="Invitation link" onFocus={(e) => e.currentTarget.select()} className="font-mono text-xs" />
              <Button type="button" variant="secondary" onClick={copy} className="shrink-0">
                {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
            <Alert tone="warning" className="mt-4" title="This link is shown only once">
              It is not stored and cannot be retrieved later. It expires in 7 days and only works for the invited
              email address.
            </Alert>
            <DialogFooter>
              <DialogClose asChild>
                <Button>Done</Button>
              </DialogClose>
            </DialogFooter>
          </>
        ) : (
          <form onSubmit={onSubmit} noValidate>
            <DialogHeader>
              <DialogTitle>Invite a member</DialogTitle>
              <DialogDescription>They will need an account with the same email address to accept.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {result && !result.ok ? <Alert tone="danger" title={result.error} /> : null}
              <Field id="invite-email" label="Email" error={form.formState.errors.email?.message}>
                {(control) => <Input type="email" autoComplete="off" {...control} {...form.register("email")} />}
              </Field>
              <Field
                id="invite-role"
                label="Role"
                error={form.formState.errors.role?.message}
                hint={ROLE_DESCRIPTIONS[selectedRole]}
              >
                {(control) => (
                  <Select {...control} {...form.register("role")}>
                    {roles.map((role) => (
                      <option key={role} value={role}>
                        {ROLE_LABELS[role]}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" loading={pending}>
                Create invitation
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function RemoveMemberDialog({ name, onConfirm }: { name: string; onConfirm: () => void }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`Remove ${name}`}>
          <Trash2 />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remove {name}?</DialogTitle>
          <DialogDescription>
            They will immediately lose access to this organisation. You can invite them again later.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary">Cancel</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button variant="danger" onClick={onConfirm}>
              Remove member
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
