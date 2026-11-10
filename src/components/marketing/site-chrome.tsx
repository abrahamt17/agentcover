import Link from "next/link";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/security", label: "Security" },
  { href: "/about", label: "About" },
  { href: "/demo", label: "Demo" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-white/[0.08] bg-black/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-6 px-5">
        <Link href="/" aria-label="AgentCover home">
          <Logo />
        </Link>
        <nav className="hidden flex-1 items-center justify-center gap-1 md:flex" aria-label="Site">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-ink-subtle transition-colors hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/sign-in">Sign in</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/sign-up">Get started</Link>
          </Button>
        </div>
      </div>
      <nav className="flex gap-1 overflow-x-auto border-t border-white/[0.08] px-3 md:hidden" aria-label="Site">
        {LINKS.map((link) => (
          <Link key={link.href} href={link.href} className="whitespace-nowrap px-2.5 py-2.5 text-sm text-ink-muted">
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden border-t border-white/[0.08] bg-black text-ink-subtle">
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-64 w-[48rem] max-w-full -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/[0.07] blur-3xl"
        aria-hidden
      />
      <div className="relative mx-auto grid w-full max-w-6xl gap-10 px-5 py-14 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <div>
          <Logo />
          <p className="mt-4 max-w-md text-sm leading-relaxed">
            AgentCover is a technology and risk-intelligence platform. It is not an insurance carrier, broker or
            intermediary. It does not issue policies, underwrite insurance or make coverage decisions.
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Platform</p>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li><Link href="/how-it-works" className="hover:text-white">How it works</Link></li>
            <li><Link href="/demo" className="hover:text-white">Demo preview</Link></li>
            <li><Link href="/security" className="hover:text-white">Security</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Company</p>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li><Link href="/about" className="hover:text-white">About</Link></li>
            <li><Link href="/sign-in" className="hover:text-white">Sign in</Link></li>
            <li><Link href="/sign-up" className="hover:text-white">Create account</Link></li>
          </ul>
        </div>
      </div>
      <div className="relative border-t border-white/[0.08]">
        <p className="mx-auto w-full max-w-6xl px-5 py-5 text-xs">
          © {new Date().getFullYear()} AgentCover. Early-stage product in active development.
        </p>
      </div>
    </footer>
  );
}

export function Section({
  children,
  className,
  tone = "light",
  id,
}: {
  children: React.ReactNode;
  className?: string;
  tone?: "light" | "white" | "navy";
  id?: string;
}) {
  return (
    <section
      id={id}
      className={cn(
        "relative py-20 sm:py-28",
        tone === "white" && "border-y border-white/[0.06] bg-surface",
        tone === "navy" && "overflow-hidden bg-black",
        className,
      )}
    >
      {tone === "navy" ? (
        <div
          className="pointer-events-none absolute left-1/2 top-0 h-72 w-[56rem] max-w-full -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/[0.08] blur-3xl"
          aria-hidden
        />
      ) : null}
      <div className="relative mx-auto w-full max-w-6xl px-5">{children}</div>
    </section>
  );
}

/** Small outlined pill used above headings. */
export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-3 py-1 text-xs font-medium text-ink-muted shadow-[inset_0_0_12px_rgba(255,255,255,0.05)]",
        className,
      )}
    >
      {children}
    </p>
  );
}

export function SectionIntro({
  eyebrow,
  title,
  children,
  align = "left",
}: {
  eyebrow: string;
  title: string;
  children?: React.ReactNode;
  align?: "left" | "center";
  onDark?: boolean;
}) {
  return (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center")}>
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="text-fade mt-5 text-3xl font-semibold leading-[1.12] sm:text-[2.5rem]">{title}</h2>
      {children ? <p className="mt-5 text-base leading-relaxed text-ink-muted">{children}</p> : null}
    </div>
  );
}

/** Compact hero for secondary marketing pages. */
export function PageHero({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <div className="relative overflow-hidden border-b border-white/[0.06] bg-black">
      <div className="bg-grid pointer-events-none absolute inset-0" aria-hidden />
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-80 w-[52rem] max-w-full -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/[0.12] blur-3xl"
        aria-hidden
      />
      <div className="relative mx-auto w-full max-w-6xl px-5 py-20 sm:py-28">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1 className="text-fade mt-5 max-w-3xl text-4xl font-semibold leading-[1.1] sm:text-5xl">{title}</h1>
        <p className="mt-6 max-w-2xl text-base leading-relaxed text-ink-muted sm:text-lg">{children}</p>
      </div>
    </div>
  );
}
