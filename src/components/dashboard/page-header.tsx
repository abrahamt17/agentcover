import { CheckCircle2, type LucideIcon } from "lucide-react";
import { ComingSoonBadge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export function PageHeader({
  title,
  description,
  badge,
  actions,
}: {
  title: string;
  description?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">{title}</h1>
          {badge}
        </div>
        {description ? <p className="mt-1.5 max-w-2xl text-sm text-ink-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}

/**
 * Page for a module that is planned but not built. It states plainly that
 * nothing here works yet and what the module will provide when it ships.
 */
export function ModulePlaceholder({
  title,
  icon: Icon,
  phase,
  summary,
  capabilities,
  note,
}: {
  title: string;
  icon: LucideIcon;
  phase: string;
  summary: string;
  capabilities: string[];
  note?: string;
}) {
  return (
    <>
      <PageHeader title={title} badge={<ComingSoonBadge />} />
      <Card>
        <CardContent className="grid gap-8 py-8 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] md:py-10">
          <div>
            <div className="flex size-11 items-center justify-center glow-tile rounded-xl text-white">
              <Icon className="size-5" aria-hidden />
            </div>
            <p className="mt-5 text-xs font-medium uppercase tracking-wide text-ink-subtle">Planned · {phase}</p>
            <h2 className="mt-1.5 text-lg font-semibold tracking-tight text-ink">This module is not available yet</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">{summary}</p>
            {note ? (
              <p className="mt-4 rounded-lg border border-line bg-subtle/60 px-3.5 py-3 text-xs leading-relaxed text-ink-muted">
                {note}
              </p>
            ) : null}
          </div>
          <div className="md:border-l md:border-line md:pl-8">
            <p className="text-sm font-semibold text-ink">What it will provide</p>
            <ul className="mt-4 space-y-3.5">
              {capabilities.map((capability) => (
                <li key={capability} className="flex gap-3 text-sm leading-relaxed text-ink-muted">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-ink-subtle" aria-hidden />
                  {capability}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
