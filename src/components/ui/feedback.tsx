import { AlertTriangle, CheckCircle2, Info, type LucideIcon } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

type AlertTone = "info" | "success" | "warning" | "danger";

const alertTone: Record<AlertTone, { box: string; icon: LucideIcon }> = {
  info: { box: "border-brand-100 bg-brand-50 text-brand-700", icon: Info },
  success: { box: "border-success-700/20 bg-success-50 text-success-700", icon: CheckCircle2 },
  warning: { box: "border-warning-700/25 bg-warning-50 text-warning-700", icon: AlertTriangle },
  danger: { box: "border-danger-700/20 bg-danger-50 text-danger-700", icon: AlertTriangle },
};

/** Inline notification for form results and page-level notices. */
export function Alert({
  tone = "info",
  title,
  children,
  className,
}: {
  tone?: AlertTone;
  title?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  const { box, icon: Icon } = alertTone[tone];
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={cn("flex gap-3 rounded-lg border px-3.5 py-3 text-sm", box, className)}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div className="min-w-0 space-y-0.5">
        {title ? <p className="font-semibold">{title}</p> : null}
        {children ? <div className="text-ink-muted [&_a]:font-medium [&_a]:text-brand-700 [&_a]:underline">{children}</div> : null}
      </div>
    </div>
  );
}

/** Placeholder for a section that has no data yet. Says why, and what will appear. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center px-6 py-10 text-center", className)}>
      <div className="mb-3 flex size-10 items-center justify-center rounded-lg border border-line bg-subtle text-ink-subtle">
        <Icon className="size-5" aria-hidden />
      </div>
      <p className="text-sm font-semibold text-ink">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-ink-muted">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-line", className)} aria-hidden />;
}
