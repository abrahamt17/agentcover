"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/feedback";
import { Field, Input } from "@/components/ui/form";
import {
  forgotPasswordAction,
  resetPasswordAction,
  signInAction,
  signUpAction,
} from "@/lib/actions/auth";
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
  type ForgotPasswordValues,
  type ResetPasswordValues,
  type SignInValues,
  type SignUpValues,
} from "@/lib/validation/auth";
import { useActionForm } from "./use-action-form";

const PASSWORD_HINT = "At least 10 characters, with upper and lower case letters and a number.";

export function SignInForm({ next, disabled }: { next?: string; disabled?: boolean }) {
  const form = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });
  const { onSubmit, pending, result } = useActionForm(form, (values) => signInAction(values, next));
  const errors = form.formState.errors;

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      {result && !result.ok ? <Alert tone="danger" title={result.error} /> : null}
      <Field id="email" label="Email" error={errors.email?.message}>
        {(control) => <Input type="email" autoComplete="email" {...control} {...form.register("email")} />}
      </Field>
      <Field id="password" label="Password" error={errors.password?.message}>
        {(control) => (
          <Input type="password" autoComplete="current-password" {...control} {...form.register("password")} />
        )}
      </Field>
      <div className="flex justify-end">
        <Link href="/forgot-password" className="text-sm font-medium text-brand-600 hover:underline">
          Forgot password?
        </Link>
      </div>
      <Button type="submit" size="lg" className="w-full" loading={pending} disabled={disabled}>
        Sign in
      </Button>
    </form>
  );
}

export function SignUpForm({ next, disabled }: { next?: string; disabled?: boolean }) {
  const form = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { fullName: "", email: "", password: "" },
  });
  const { onSubmit, pending, result } = useActionForm(form, (values) => signUpAction(values, next));
  const errors = form.formState.errors;

  if (result?.ok) {
    return (
      <Alert tone="success" title="Verify your email">
        <p>{result.message}</p>
        <p className="mt-2">
          Once verified you will continue to organisation setup. Already verified? <Link href="/sign-in">Sign in</Link>.
        </p>
      </Alert>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      {result && !result.ok ? <Alert tone="danger" title={result.error} /> : null}
      <Field id="fullName" label="Full name" error={errors.fullName?.message}>
        {(control) => <Input autoComplete="name" {...control} {...form.register("fullName")} />}
      </Field>
      <Field id="email" label="Business email" error={errors.email?.message}>
        {(control) => <Input type="email" autoComplete="email" {...control} {...form.register("email")} />}
      </Field>
      <Field id="password" label="Password" error={errors.password?.message} hint={PASSWORD_HINT}>
        {(control) => (
          <Input type="password" autoComplete="new-password" {...control} {...form.register("password")} />
        )}
      </Field>
      <Button type="submit" size="lg" className="w-full" loading={pending} disabled={disabled}>
        Create account
      </Button>
    </form>
  );
}

export function ForgotPasswordForm({ disabled }: { disabled?: boolean }) {
  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });
  const { onSubmit, pending, result } = useActionForm(form, forgotPasswordAction);

  if (result?.ok) {
    return <Alert tone="success" title="Check your inbox">{result.message}</Alert>;
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      {result && !result.ok ? <Alert tone="danger" title={result.error} /> : null}
      <Field id="email" label="Email" error={form.formState.errors.email?.message}>
        {(control) => <Input type="email" autoComplete="email" {...control} {...form.register("email")} />}
      </Field>
      <Button type="submit" size="lg" className="w-full" loading={pending} disabled={disabled}>
        Send reset link
      </Button>
    </form>
  );
}

export function ResetPasswordForm() {
  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });
  const { onSubmit, pending, result } = useActionForm(form, resetPasswordAction);
  const errors = form.formState.errors;

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      {result && !result.ok ? <Alert tone="danger" title={result.error} /> : null}
      <Field id="password" label="New password" error={errors.password?.message} hint={PASSWORD_HINT}>
        {(control) => (
          <Input type="password" autoComplete="new-password" {...control} {...form.register("password")} />
        )}
      </Field>
      <Field id="confirmPassword" label="Confirm new password" error={errors.confirmPassword?.message}>
        {(control) => (
          <Input type="password" autoComplete="new-password" {...control} {...form.register("confirmPassword")} />
        )}
      </Field>
      <Button type="submit" size="lg" className="w-full" loading={pending}>
        Update password
      </Button>
    </form>
  );
}
