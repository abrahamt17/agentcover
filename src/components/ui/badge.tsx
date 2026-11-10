import { cva, type VariantProps } from "class-variance-authority";
import { Clock, FlaskConical } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
  {
    variants: {
      variant: {
        neutral: "bg-subtle text-ink-muted ring-line-strong",
        brand: "bg-brand-50 text-brand-700 ring-brand-100",
        success: "bg-success-50 text-success-700 ring-success-700/15",
        warning: "bg-warning-50 text-warning-700 ring-warning-700/20",
        orange: "bg-orange-50 text-orange-700 ring-orange-700/20",
        danger: "bg-danger-50 text-danger-700 ring-danger-700/15",
        navy: "bg-white text-black ring-white",
      },
    },
    defaultVariants: { variant: "neutral" },
  },
);

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>;

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export type RiskLevel = "low" | "medium" | "high" | "critical";

export const RISK_META: Record<RiskLevel, { label: string; variant: BadgeProps["variant"]; bar: string }> = {
  low: { label: "Low", variant: "success", bar: "bg-success-700" },
  medium: { label: "Medium", variant: "warning", bar: "bg-warning-700" },
  high: { label: "High", variant: "orange", bar: "bg-orange-700" },
  critical: { label: "Critical", variant: "danger", bar: "bg-danger-700" },
};

/** Risk level badge. Always pairs colour with a text label so it never relies on colour alone. */
export function RiskBadge({ level, className }: { level: RiskLevel; className?: string }) {
  const meta = RISK_META[level];
  return (
    <Badge variant={meta.variant} className={className}>
      <span className={cn("size-1.5 rounded-full", meta.bar)} aria-hidden />
      {meta.label} risk
    </Badge>
  );
}

type StatusTone = "success" | "warning" | "danger" | "neutral" | "brand";

const toneDot: Record<StatusTone, string> = {
  success: "bg-success-700",
  warning: "bg-warning-700",
  danger: "bg-danger-700",
  neutral: "bg-ink-subtle",
  brand: "bg-brand-500",
};

/** Inline status indicator: coloured dot plus label. */
export function Status({ tone = "neutral", children }: { tone?: StatusTone; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-ink-muted">
      <span className={cn("size-2 rounded-full", toneDot[tone])} aria-hidden />
      {children}
    </span>
  );
}

/** Marks synthetic sample content. Must be visible wherever fictional data is shown. */
export function DemoBadge({ className }: { className?: string }) {
  return (
    <Badge variant="warning" className={cn("font-semibold uppercase tracking-wide", className)}>
      <FlaskConical className="size-3" aria-hidden />
      Demo data
    </Badge>
  );
}

export function ComingSoonBadge({ className }: { className?: string }) {
  return (
    <Badge variant="neutral" className={className}>
      <Clock className="size-3" aria-hidden />
      Coming soon
    </Badge>
  );
}
