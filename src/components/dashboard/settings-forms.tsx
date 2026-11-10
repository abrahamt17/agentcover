"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";
import { useActionForm } from "@/components/auth/use-action-form";
import { AgentUsageFields, OrganisationDetailsFields } from "@/components/organisation/organisation-fields";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert } from "@/components/ui/feedback";
import { Field, Input } from "@/components/ui/form";
import { updateOrganisationAction, updateProfileAction } from "@/lib/actions/organisation";
import {
  organisationSchema,
  profileSchema,
  type OrganisationValues,
  type ProfileValues,
} from "@/lib/validation/organisation";

export function ProfileForm({ defaults, email }: { defaults: ProfileValues; email: string }) {
  const form = useForm<ProfileValues>({ resolver: zodResolver(profileSchema), defaultValues: defaults });
  const { onSubmit, pending, result } = useActionForm(form, updateProfileAction, (r) => {
    toast.success(r.message ?? "Saved");
    form.reset(form.getValues());
  });

  return (
    <form onSubmit={onSubmit} noValidate>
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>How you appear to other members of your organisation.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {result && !result.ok ? <Alert tone="danger" title={result.error} /> : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="fullName" label="Full name" error={form.formState.errors.fullName?.message}>
              {(control) => <Input autoComplete="name" {...control} {...form.register("fullName")} />}
            </Field>
            <Field id="email" label="Email" hint="Your sign-in address. It cannot be changed here yet.">
              {(control) => <Input type="email" value={email} readOnly disabled {...control} />}
            </Field>
          </div>

          <fieldset className="border-t border-line pt-5">
            <legend className="float-left mb-1 w-full text-sm font-semibold text-ink">Email notifications</legend>
            <p className="clear-both text-sm text-ink-muted">
              Your choices are saved now. AgentCover does not send notification emails yet; delivery starts when
              the monitoring and incident modules are released.
            </p>
            <div className="mt-4 space-y-3">
              {[
                { name: "securityAlerts" as const, label: "Security alerts", text: "Changes to roles, members and access in your organisation." },
                { name: "productUpdates" as const, label: "Product updates", text: "Occasional notes when a new module becomes available." },
              ].map((option) => (
                <label key={option.name} className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    className="mt-0.5 size-4 rounded border-line-strong accent-brand-600"
                    {...form.register(option.name)}
                  />
                  <span>
                    <span className="block text-sm font-medium text-ink">{option.label}</span>
                    <span className="block text-sm text-ink-muted">{option.text}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        </CardContent>
        <CardFooter className="justify-end">
          <Button type="submit" loading={pending} disabled={!form.formState.isDirty}>
            Save changes
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}

export function OrganisationForm({ defaults, canEdit }: { defaults: OrganisationValues; canEdit: boolean }) {
  const form = useForm<OrganisationValues>({ resolver: zodResolver(organisationSchema), defaultValues: defaults });
  const { onSubmit, pending, result } = useActionForm(form, updateOrganisationAction, (r) => {
    toast.success(r.message ?? "Saved");
    form.reset(form.getValues());
  });

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} noValidate>
        <Card>
          <CardHeader>
            <CardTitle>Organisation details</CardTitle>
            <CardDescription>
              {canEdit
                ? "Used across the workspace and, later, in risk reports."
                : "Only the organisation owner can change these details."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {result && !result.ok ? <Alert tone="danger" title={result.error} /> : null}
            <OrganisationDetailsFields disabled={!canEdit} />
            <div className="border-t border-line pt-6">
              <AgentUsageFields disabled={!canEdit} />
            </div>
          </CardContent>
          {canEdit ? (
            <CardFooter className="justify-end">
              <Button type="submit" loading={pending} disabled={!form.formState.isDirty}>
                Save changes
              </Button>
            </CardFooter>
          ) : null}
        </Card>
      </form>
    </FormProvider>
  );
}
