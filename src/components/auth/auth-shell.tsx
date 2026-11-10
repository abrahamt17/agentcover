import { Building2, ClipboardList, Lock } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { Alert } from "@/components/ui/feedback";
import { isSupabaseConfigured } from "@/lib/env";

const POINTS = [
  { icon: ClipboardList, text: "One register for every AI agent your organisation deploys or builds." },
  { icon: Building2, text: "Organisation workspaces with roles for owners, admins, members and developers." },
  { icon: Lock, text: "Tenant isolation enforced in the database, not just in the interface." },
];

/** Two-column frame shared by sign-in, sign-up and password pages. */
export function AuthShell({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const configured = isSupabaseConfigured();

  return (
    <div className="grid min-h-dvh flex-1 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <aside className="relative hidden flex-col justify-between overflow-hidden border-r border-white/[0.08] bg-black p-10 text-white lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:linear-gradient(white_1px,transparent_1px),linear-gradient(90deg,white_1px,transparent_1px)] [background-size:48px_48px]"
          aria-hidden
        />
        <Link href="/" className="relative w-fit">
          <Logo onDark />
        </Link>
        <div className="relative max-w-md">
          <p className="text-2xl font-semibold leading-snug tracking-tight">
            Understand the risks behind your AI agents.
          </p>
          <ul className="mt-8 space-y-5">
            {POINTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex gap-3 text-sm leading-relaxed text-navy-200">
                <Icon className="mt-0.5 size-4 shrink-0 text-navy-300" aria-hidden />
                {text}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs leading-relaxed text-navy-300">
          AgentCover is a risk-intelligence platform. It is not an insurer and does not issue policies or make
          coverage decisions.
        </p>
      </aside>

      <main className="flex flex-col bg-canvas px-5 py-8 sm:px-10">
        <Link href="/" className="w-fit lg:hidden">
          <Logo />
        </Link>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
          <h1 className="text-2xl font-semibold tracking-tight text-ink">{title}</h1>
          <p className="mt-2 text-sm text-ink-muted">{description}</p>
          {!configured ? (
            <Alert tone="warning" title="Authentication is not configured" className="mt-6">
              This deployment has no Supabase project connected, so accounts cannot be created or used yet. Add
              the variables from <code className="font-mono text-xs">.env.example</code> to enable it.
            </Alert>
          ) : null}
          <div className="mt-6">{children}</div>
          {footer ? <div className="mt-6 text-sm text-ink-muted">{footer}</div> : null}
        </div>
      </main>
    </div>
  );
}
