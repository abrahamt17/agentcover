import * as LabelPrimitive from "@radix-ui/react-label";
import { AlertCircle, ChevronDown } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

const controlClass =
  "h-10 w-full rounded-lg border border-line-strong bg-white/[0.04] px-3 text-sm text-ink shadow-sm transition-colors placeholder:text-ink-subtle hover:border-navy-300 focus-visible:border-brand-500 focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-brand-500/30 disabled:cursor-not-allowed disabled:bg-subtle disabled:text-ink-muted aria-[invalid=true]:border-danger-600";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(controlClass, className)} {...props} />;
}

export function Select({
  className,
  containerClassName,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { containerClassName?: string }) {
  return (
    <div className={cn("relative", containerClassName)}>
      <select className={cn(controlClass, "appearance-none pr-9", className)} {...props}>
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-ink-subtle"
        aria-hidden
      />
    </div>
  );
}

export function Label({ className, ...props }: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return <LabelPrimitive.Root className={cn("text-sm font-medium text-ink", className)} {...props} />;
}

type FieldProps = {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  optional?: boolean;
  className?: string;
  /** Receives the ids and invalid state to spread onto the control. */
  children: (control: { id: string; "aria-invalid": boolean; "aria-describedby": string | undefined }) => React.ReactNode;
};

/** Label + control + hint + error, wired together for assistive technology. */
export function Field({ id, label, error, hint, optional, className, children }: FieldProps) {
  const describedBy = [error ? `${id}-error` : null, hint ? `${id}-hint` : null].filter(Boolean).join(" ") || undefined;
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-baseline justify-between gap-2">
        <Label htmlFor={id}>{label}</Label>
        {optional ? <span className="text-xs text-ink-subtle">Optional</span> : null}
      </div>
      {children({ id, "aria-invalid": Boolean(error), "aria-describedby": describedBy })}
      {hint && !error ? (
        <p id={`${id}-hint`} className="text-xs text-ink-subtle">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="flex items-center gap-1.5 text-xs font-medium text-danger-700">
          <AlertCircle className="size-3.5 shrink-0" aria-hidden />
          {error}
        </p>
      ) : null}
    </div>
  );
}
