"use client";

import { Check } from "lucide-react";
import { useFormContext, useWatch } from "react-hook-form";
import { Field, Input, Select } from "@/components/ui/form";
import { AGENT_COUNT_RANGES, COUNTRIES, INDUSTRIES, ORGANISATION_TYPES, USE_CASES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { OrganisationValues } from "@/lib/validation/organisation";

/** Name, website, country, industry and type. Used by onboarding and organisation settings. */
export function OrganisationDetailsFields({ disabled }: { disabled?: boolean }) {
  const { register, formState } = useFormContext<OrganisationValues>();
  const errors = formState.errors;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field id="name" label="Organisation name" error={errors.name?.message} className="sm:col-span-2">
        {(control) => <Input autoComplete="organization" disabled={disabled} {...control} {...register("name")} />}
      </Field>
      <Field id="website" label="Website" optional error={errors.website?.message} className="sm:col-span-2">
        {(control) => (
          <Input
            type="url"
            inputMode="url"
            placeholder="https://"
            autoComplete="url"
            disabled={disabled}
            {...control}
            {...register("website")}
          />
        )}
      </Field>
      <Field id="country" label="Country" error={errors.country?.message}>
        {(control) => (
          <Select disabled={disabled} {...control} {...register("country")}>
            <option value="">Select a country</option>
            {COUNTRIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </Select>
        )}
      </Field>
      <Field id="industry" label="Industry" optional error={errors.industry?.message}>
        {(control) => (
          <Select disabled={disabled} {...control} {...register("industry")}>
            <option value="">Select an industry</option>
            {INDUSTRIES.map((industry) => (
              <option key={industry} value={industry}>
                {industry}
              </option>
            ))}
          </Select>
        )}
      </Field>
      <Field
        id="organisationType"
        label="Organisation type"
        error={errors.organisationType?.message}
        className="sm:col-span-2"
      >
        {(control) => (
          <Select disabled={disabled} {...control} {...register("organisationType")}>
            <option value="">Select a type</option>
            {ORGANISATION_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </Select>
        )}
      </Field>
    </div>
  );
}

const choiceClass =
  "flex cursor-pointer items-center gap-2 rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm text-ink shadow-sm transition-colors hover:border-navy-300 has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50 has-[:checked]:text-brand-700 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand-500 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60";

/** Approximate agent count and primary use cases. Both optional. */
export function AgentUsageFields({ disabled }: { disabled?: boolean }) {
  const { register, control } = useFormContext<OrganisationValues>();
  const selectedCount = useWatch({ control, name: "estimatedAgentCount" });
  const selectedUseCases = useWatch({ control, name: "primaryUseCases" }) ?? [];

  return (
    <div className="space-y-6">
      <fieldset disabled={disabled}>
        <legend className="flex w-full items-baseline justify-between text-sm font-medium text-ink">
          Approximate number of AI agents deployed
          <span className="text-xs font-normal text-ink-subtle">Optional</span>
        </legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {AGENT_COUNT_RANGES.map((range) => (
            <label key={range.value} className={choiceClass}>
              <input type="radio" value={range.value} className="sr-only" {...register("estimatedAgentCount")} />
              {range.label}
            </label>
          ))}
          {selectedCount ? (
            <label className={cn(choiceClass, "border-dashed text-ink-muted")}>
              <input type="radio" value="" className="sr-only" {...register("estimatedAgentCount")} />
              Clear
            </label>
          ) : null}
        </div>
      </fieldset>

      <fieldset disabled={disabled}>
        <legend className="flex w-full items-baseline justify-between text-sm font-medium text-ink">
          Primary use cases for AI agents
          <span className="text-xs font-normal text-ink-subtle">Optional · select any</span>
        </legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {USE_CASES.map((useCase) => (
            <label key={useCase.value} className={choiceClass}>
              <input type="checkbox" value={useCase.value} className="sr-only" {...register("primaryUseCases")} />
              {selectedUseCases.includes(useCase.value) ? <Check className="size-3.5" aria-hidden /> : null}
              {useCase.label}
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  );
}
