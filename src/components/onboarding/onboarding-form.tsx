"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useActionForm } from "@/components/auth/use-action-form";
import { AgentUsageFields, OrganisationDetailsFields } from "@/components/organisation/organisation-fields";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Alert } from "@/components/ui/feedback";
import { Field, Input } from "@/components/ui/form";
import { completeOnboardingAction } from "@/lib/actions/organisation";
import { cn } from "@/lib/utils";
import {
  onboardingSchema,
  type OnboardingValues,
} from "@/lib/validation/organisation";

const STEPS = [
  {
    title: "About you",
    description: "Confirm how you will appear to colleagues in your workspace.",
    fields: ["fullName"],
  },
  {
    title: "Your organisation",
    description: "The organisation whose AI agents you will register and assess.",
    fields: ["name", "website", "country", "industry", "organisationType"],
  },
  {
    title: "AI agent usage",
    description: "Optional context that helps tailor the workspace. You can change this later.",
    fields: ["estimatedAgentCount", "primaryUseCases"],
  },
] as const satisfies readonly { title: string; description: string; fields: readonly (keyof OnboardingValues)[] }[];

export function OnboardingForm({ defaultName, email }: { defaultName: string; email: string }) {
  const [step, setStep] = useState(0);
  const form = useForm<OnboardingValues>({
    resolver: zodResolver(onboardingSchema),
    mode: "onTouched",
    defaultValues: {
      fullName: defaultName,
      name: "",
      website: "",
      country: "",
      industry: "",
      organisationType: "",
      estimatedAgentCount: "",
      primaryUseCases: [],
    },
  });
  const { onSubmit, pending, result } = useActionForm(form, completeOnboardingAction);
  const isLast = step === STEPS.length - 1;

  const next = async () => {
    if (await form.trigger([...STEPS[step].fields])) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  return (
    <FormProvider {...form}>
      <form
        noValidate
        onSubmit={(event) => {
          if (isLast) return onSubmit(event);
          event.preventDefault();
          void next();
        }}
      >
        <ol className="mb-6 flex items-center gap-2" aria-label="Onboarding progress">
          {STEPS.map((s, index) => (
            <li key={s.title} className="flex flex-1 items-center gap-2" aria-current={index === step ? "step" : undefined}>
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                  index < step && "bg-white/20 text-white",
                  index === step && "bg-white text-black shadow-glow",
                  index > step && "border border-line-strong bg-surface text-ink-subtle",
                )}
              >
                {index < step ? <Check className="size-3.5" aria-hidden /> : index + 1}
              </span>
              <span className={cn("hidden text-sm sm:block", index === step ? "font-medium text-ink" : "text-ink-subtle")}>
                {s.title}
              </span>
              {index < STEPS.length - 1 ? <span className="h-px flex-1 bg-line-strong" aria-hidden /> : null}
            </li>
          ))}
        </ol>

        <Card>
          <CardContent className="space-y-5">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-ink-subtle">
                Step {step + 1} of {STEPS.length}
              </p>
              <h2 className="mt-1 text-lg font-semibold tracking-tight text-ink">{STEPS[step].title}</h2>
              <p className="mt-1 text-sm text-ink-muted">{STEPS[step].description}</p>
            </div>

            {result && !result.ok ? <Alert tone="danger" title={result.error} /> : null}

            <div hidden={step !== 0} className="space-y-4">
              <Field id="fullName" label="Full name" error={form.formState.errors.fullName?.message}>
                {(control) => <Input autoComplete="name" {...control} {...form.register("fullName")} />}
              </Field>
              <Field
                id="businessEmail"
                label="Business email"
                hint="This is the verified email address on your account."
              >
                {(control) => <Input type="email" value={email} readOnly disabled {...control} />}
              </Field>
            </div>

            <div hidden={step !== 1}>
              <OrganisationDetailsFields />
            </div>

            <div hidden={step !== 2}>
              <AgentUsageFields />
            </div>
          </CardContent>
          <CardFooter className="justify-between">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setStep((s) => Math.max(s - 1, 0))}
              disabled={step === 0 || pending}
            >
              <ArrowLeft aria-hidden />
              Back
            </Button>
            {isLast ? (
              <Button type="submit" loading={pending}>
                Create organisation
              </Button>
            ) : (
              <Button type="submit">
                Continue
                <ArrowRight aria-hidden />
              </Button>
            )}
          </CardFooter>
        </Card>
      </form>
    </FormProvider>
  );
}

