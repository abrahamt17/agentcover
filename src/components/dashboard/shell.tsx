"use client";

import {
  Activity,
  Bell,
  Bot,
  Building2,
  Check,
  ChevronsUpDown,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Settings,
  ShieldAlert,
  Siren,
  Sparkles,
  Umbrella,
  User,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/logo";
import { DemoBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOutAction } from "@/lib/actions/auth";
import { cn, initials } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: LucideIcon; exact?: boolean; soon?: boolean };

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/agents", label: "AI Agents", icon: Bot, soon: true },
  { href: "/dashboard/risk", label: "Risk Intelligence", icon: ShieldAlert, soon: true },
  { href: "/dashboard/insurance", label: "Insurance", icon: Umbrella, soon: true },
  { href: "/dashboard/incidents", label: "Incidents", icon: Siren, soon: true },
  { href: "/dashboard/monitoring", label: "Monitoring", icon: Activity, soon: true },
  { href: "/dashboard/ai-copilot", label: "AI Copilot", icon: Sparkles, soon: true },
];

const SETTINGS: NavItem = { href: "/dashboard/settings", label: "Settings", icon: Settings };

export type ShellProps = {
  organisation: { name: string; isDemo: boolean };
  user: { name: string; email: string };
  roleLabel: string;
  /**
   * Public read-only preview (/demo). No session exists: navigation to real
   * workspace routes is disabled and account menus are replaced by sign-up links.
   */
  preview?: boolean;
  children: React.ReactNode;
};

export function DashboardShell({ organisation, user, roleLabel, preview = false, children }: ShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const showDemoBanner = preview || organisation.isDemo;

  const isActive = (item: NavItem) =>
    preview ? item.exact === true : item.exact ? pathname === item.href : pathname.startsWith(item.href);

  const navLink = (item: NavItem) => {
    const active = isActive(item);
    const className = cn(
      "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
      active ? "bg-white/10 text-white shadow-[inset_0_0_14px_rgba(255,255,255,0.08)]" : "text-navy-200 hover:bg-white/5 hover:text-white",
    );
    const content = (
      <>
        <item.icon className={cn("size-4 shrink-0", active ? "text-white" : "text-navy-300")} aria-hidden />
        <span className="flex-1 truncate">{item.label}</span>
        {item.soon ? (
          <span className="rounded border border-white/15 px-1.5 py-px text-[0.625rem] font-medium uppercase tracking-wide text-navy-300">
            Soon
          </span>
        ) : null}
      </>
    );

    if (preview && !item.exact) {
      return (
        <span
          className={cn(className, "cursor-not-allowed opacity-60 hover:bg-transparent hover:text-navy-200")}
          aria-disabled="true"
          title="Not part of the public preview"
        >
          {content}
        </span>
      );
    }
    return (
      <Link
        href={preview ? "/demo" : item.href}
        className={className}
        aria-current={active ? "page" : undefined}
        onClick={() => setMobileOpen(false)}
      >
        {content}
      </Link>
    );
  };

  const sidebar = (
    <div className="flex h-full flex-col border-r border-white/[0.08] bg-black">
      <div className="flex h-16 shrink-0 items-center justify-between px-5">
        <Link href={preview ? "/" : "/dashboard"} onClick={() => setMobileOpen(false)}>
          <Logo onDark />
        </Link>
        <button
          type="button"
          className="rounded-md p-1.5 text-navy-200 hover:bg-white/10 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Close navigation"
        >
          <X className="size-5" />
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4 [scrollbar-color:var(--color-navy-700)_transparent] [scrollbar-width:thin]" aria-label="Main">
        <p className="px-3 pb-2 text-[0.6875rem] font-medium uppercase tracking-wider text-navy-300">Workspace</p>
        <ul className="space-y-0.5">
          {NAV.map((item) => (
            <li key={item.href}>{navLink(item)}</li>
          ))}
        </ul>
      </nav>
      <div className="border-t border-white/10 px-3 py-3">{navLink(SETTINGS)}</div>
    </div>
  );

  return (
    <div className="flex min-h-dvh flex-1">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">{sidebar}</aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <button
            type="button"
            className="absolute inset-0 bg-navy-950/60"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation"
          />
          <div className="relative h-full w-72 max-w-[85vw] shadow-raised">{sidebar}</div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        {showDemoBanner ? (
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-b border-warning-700/20 bg-warning-50 px-4 py-2 text-center text-xs text-warning-700">
            <DemoBadge />
            <span>
              {preview
                ? "Public preview with a fictional organisation. Every name and figure on this page is synthetic."
                : "This is a demo organisation. Its records are fictional sample data."}
            </span>
          </div>
        ) : null}

        <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-3 border-b border-white/[0.08] bg-black/70 px-4 backdrop-blur-xl sm:px-6">
          <button
            type="button"
            className="rounded-md p-2 text-ink-muted hover:bg-subtle lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
          >
            <Menu className="size-5" />
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex min-w-0 items-center gap-2.5 rounded-lg border border-line px-2.5 py-1.5 text-left hover:bg-subtle"
              >
                <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-white text-[0.625rem] font-semibold text-black">
                  {initials(organisation.name, "O")}
                </span>
                <span className="max-w-[9rem] truncate text-sm font-medium text-ink sm:max-w-[14rem]">
                  {organisation.name}
                </span>
                <ChevronsUpDown className="size-3.5 shrink-0 text-ink-subtle" aria-hidden />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
              <DropdownMenuLabel>Organisation</DropdownMenuLabel>
              <DropdownMenuItem disabled className="data-[disabled]:opacity-100">
                <Building2 />
                <span className="flex-1 truncate">{organisation.name}</span>
                <Check className="!text-brand-600" />
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled>Switch organisation · Coming soon</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            <div className="relative hidden md:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-subtle" aria-hidden />
              <input
                type="search"
                disabled
                aria-label="Search (coming soon)"
                placeholder="Search · Coming soon"
                className="h-9 w-56 cursor-not-allowed rounded-lg border border-line bg-subtle pl-9 pr-3 text-sm placeholder:text-ink-subtle"
              />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Notifications">
                  <Bell />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <div className="px-2.5 pb-3 pt-1 text-sm text-ink-muted">
                  No notifications yet. Alerts from monitoring and incidents will appear here once those
                  modules are available.
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {preview ? (
              <Button asChild size="sm">
                <Link href="/sign-up">Get started</Link>
              </Button>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex size-9 items-center justify-center rounded-full bg-white text-xs font-semibold text-black shadow-glow hover:bg-brand-700"
                    aria-label="Account menu"
                  >
                    {initials(user.name || user.email)}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <div className="px-2.5 py-2">
                    <p className="truncate text-sm font-medium text-ink">{user.name || "Unnamed user"}</p>
                    <p className="truncate text-xs text-ink-subtle">{user.email}</p>
                    <p className="mt-1.5 text-xs text-ink-muted">Role: {roleLabel}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/settings">
                      <User />
                      Profile and preferences
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/settings/organisation">
                      <Building2 />
                      Organisation
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/settings/team">
                      <Users />
                      Team
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => void signOutAction()}>
                    <LogOut />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </div>
    </div>
  );
}
