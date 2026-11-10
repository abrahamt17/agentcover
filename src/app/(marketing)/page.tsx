import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  Bot,
  Briefcase,
  Building2,
  CheckCircle2,
  CodeXml,
  FileSearch,
  Handshake,
  KeyRound,
  Lock,
  Scale,
  ShieldAlert,
  ShieldCheck,
  Siren,
  Sparkles,
  Umbrella,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { Reveal } from "@/components/marketing/reveal";
import { Eyebrow, Section, SectionIntro } from "@/components/marketing/site-chrome";
import { Badge, DemoBadge, RiskBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PROBLEMS = [
  {
    icon: KeyRound,
    title: "Agents hold real permissions",
    text: "An agent that can send email, move money or change records can cause loss without a person in the loop. Few organisations have a single view of what each agent is allowed to do.",
  },
  {
    icon: Workflow,
    title: "Configurations change quietly",
    text: "A new tool, a wider data scope or a removed approval step can change an agent's risk overnight. Point-in-time reviews miss it.",
  },
  {
    icon: Scale,
    title: "Insurance was not written for this",
    text: "Many policies were drafted before autonomous agents existed. How they respond to a loss caused by an agent is often unclear until someone reads the wording closely.",
  },
];

const STEPS = [
  { title: "Register", text: "Record each agent, its purpose, tools, integrations and permissions." },
  { title: "Assess", text: "Translate configurations into operational and financial exposure, with findings." },
  { title: "Review insurance", text: "Compare identified risks with existing policies and potentially relevant products." },
  { title: "Monitor", text: "Track configuration changes and how they move each agent's risk level." },
  { title: "Respond", text: "Document incidents and collect the evidence an insurer or auditor would ask for." },
];

type Capability = { icon: LucideIcon; title: string; text: string; available: boolean; wide?: boolean };

const CAPABILITIES: Capability[] = [
  { icon: Building2, title: "Organisation workspaces", text: "Multi-tenant workspaces with roles, invitations and an audit log. Isolation is enforced in the database.", available: true },
  { icon: Bot, title: "AI Agent Registry", text: "A structured inventory of agents, their configuration, permissions and version history.", available: false },
  { icon: ShieldAlert, title: "Risk Intelligence", text: "Risk scoring, exposure mapping, what-if simulations and recommended controls.", available: false },
  { icon: Umbrella, title: "Insurance Intelligence", text: "Policy document analysis, coverage-gap identification and product matching.", available: false, wide: true },
  { icon: Activity, title: "Continuous Monitoring", text: "Change detection, alerts and risk history for every registered agent.", available: false },
  { icon: Siren, title: "Incident and Claims Intelligence", text: "Incident records, evidence collection and reports to support a claim notification.", available: false, wide: true },
];

const AUDIENCES = [
  {
    icon: Briefcase,
    title: "Businesses deploying AI agents",
    points: [
      "See every agent in use and what it is permitted to do.",
      "Understand operational and financial exposure before it becomes a loss.",
      "Prepare the information an insurer or broker will ask for.",
      "Keep a record of changes and incidents.",
    ],
  },
  {
    icon: CodeXml,
    title: "AI developers and agencies",
    points: [
      "Register the agents you build for each client.",
      "Catch excessive permissions before deployment.",
      "Produce risk reports that show how an agent was assessed.",
      "Demonstrate responsible deployment practice to clients.",
    ],
  },
];

const WHY = [
  { term: "Accountability", text: "When an agent makes a costly mistake, the organisation that deployed it, and sometimes the firm that built it, answers for it." },
  { term: "Regulation", text: "The EU AI Act introduces obligations for providers and deployers of AI systems, phased in over several years. Knowing what your agents do is a precondition for meeting them." },
  { term: "Insurability", text: "Insurers price what they can understand. A clear record of agents, permissions, controls and incidents is the starting point for any conversation about cover." },
];

const SECURITY = [
  { icon: Lock, title: "Tenant isolation", text: "Row Level Security on every table. Members see only their own organisation's data." },
  { icon: KeyRound, title: "Server-side authorisation", text: "Roles are checked on the server and again in the database, never taken from the browser." },
  { icon: FileSearch, title: "Audit trail", text: "Invitations, role changes and organisation updates are recorded in an append-only log." },
  { icon: Sparkles, title: "No invented data", text: "Sample data is always labelled as demo data. Unbuilt features are marked as coming soon." },
];

function FloatingTile({ icon: Icon, className }: { icon: LucideIcon; className?: string }) {
  return (
    <div className={cn("glow-tile absolute flex size-16 items-center justify-center rounded-2xl text-white", className)}>
      <Icon className="size-7 drop-shadow-[0_0_8px_rgba(255,255,255,0.9)]" strokeWidth={1.6} aria-hidden />
    </div>
  );
}

/** Concentric glass arches and floating icon tiles behind the headline. */
function HeroArt() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 h-[40rem] overflow-hidden" aria-hidden>
      <div className="bg-grid absolute inset-0" />
      <div className="absolute inset-0 [mask-image:linear-gradient(to_bottom,black_55%,transparent_96%)]">
        <div className="absolute bottom-0 left-1/2 h-[30rem] w-[30rem] -translate-x-1/2 rounded-full bg-white/[0.16] blur-[110px]" />
        {[
          "h-[34rem] w-[46rem] border-white/[0.07] from-white/[0.05]",
          "h-[28rem] w-[36rem] border-white/[0.09] from-white/[0.06]",
          "h-[22rem] w-[26rem] border-white/[0.12] from-white/[0.08]",
        ].map((arch) => (
          <div
            key={arch}
            className={cn(
              "absolute bottom-0 left-1/2 max-w-[calc(100vw-1rem)] -translate-x-1/2 rounded-t-full border bg-gradient-to-b to-transparent shadow-[inset_0_24px_60px_rgba(255,255,255,0.05)]",
              arch,
            )}
          />
        ))}
      </div>
      <FloatingTile icon={Bot} className="animate-float left-[calc(50%-21rem)] top-28 hidden -rotate-12 md:flex" />
      <FloatingTile icon={ShieldCheck} className="animate-float-slow left-1/2 top-16 -ml-8 rotate-6" />
      <FloatingTile icon={Activity} className="animate-float left-[calc(50%+17rem)] top-28 hidden rotate-12 md:flex" />
    </div>
  );
}

function HeroPreview() {
  const rows = [
    { name: "Procurement Negotiation Agent", level: "critical" as const },
    { name: "Invoice Reconciliation Agent", level: "high" as const },
    { name: "Support Triage Agent", level: "medium" as const },
    { name: "Sales Outreach Assistant", level: "low" as const },
  ];
  return (
    <div className="glow-frame mx-auto max-w-3xl rounded-3xl bg-black/60 p-2 backdrop-blur">
      <div className="rounded-2xl border border-white/[0.07] bg-surface p-5 text-left sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex gap-1.5" aria-hidden>
              <span className="size-2.5 rounded-full bg-white/25" />
              <span className="size-2.5 rounded-full bg-white/15" />
              <span className="size-2.5 rounded-full bg-white/10" />
            </span>
            <p className="text-sm font-semibold text-ink">Agent risk overview</p>
          </div>
          <DemoBadge />
        </div>
        <div className="mt-5 grid grid-cols-3 gap-3">
          {[
            { label: "Registered", value: "12" },
            { label: "Assessed", value: "9" },
            { label: "High risk", value: "3" },
          ].map((stat) => (
            <div key={stat.label} className="glass rounded-xl px-4 py-3">
              <p className="text-2xl font-semibold tabular-nums text-white">{stat.value}</p>
              <p className="text-xs text-ink-subtle">{stat.label}</p>
            </div>
          ))}
        </div>
        <ul className="mt-4 divide-y divide-white/[0.06] rounded-xl border border-white/[0.07]">
          {rows.map((row) => (
            <li key={row.name} className="flex items-center justify-between gap-3 px-4 py-3">
              <span className="truncate text-sm text-ink">{row.name}</span>
              <RiskBadge level={row.level} className="shrink-0" />
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-ink-subtle">
          Illustrative example with fictional agents. Risk assessment is in development.
        </p>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <>
      {/* 1. Hero */}
      <div className="relative overflow-hidden bg-black">
        <HeroArt />
        <div className="relative mx-auto w-full max-w-6xl px-5 pb-20 pt-52 text-center sm:pb-28 sm:pt-60">
          <Eyebrow>
            <ShieldCheck className="size-3.5" aria-hidden />
            AI-agent risk intelligence for European organisations
          </Eyebrow>
          <h1 className="mx-auto mt-7 max-w-3xl text-[2.75rem] font-semibold leading-[1.05] text-white sm:text-6xl">
            <span className="text-ink-subtle">Understand the</span> risks behind{" "}
            <span className="text-ink-subtle">your</span> AI agents.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-ink-muted sm:text-lg">
            AgentCover helps businesses and AI developers assess, manage and prepare to insure the risks created
            by autonomous AI agents.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/sign-up">
                Get started
                <ArrowUpRight aria-hidden />
              </Link>
            </Button>
            <Button asChild size="lg" variant="on-dark">
              <Link href="/demo">
                Explore the platform
                <ArrowUpRight aria-hidden />
              </Link>
            </Button>
          </div>
          <p className="mx-auto mt-6 max-w-lg text-sm text-ink-subtle">
            Early-stage product. Workspaces, roles and access control are available today; the risk and
            insurance modules are in development.
          </p>
          <Reveal className="mt-16 sm:mt-20" delay={0.1}>
            <HeroPreview />
          </Reveal>
        </div>
        <div className="relative border-y border-white/[0.06]">
          <ul className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-center gap-x-10 gap-y-3 px-5 py-6 text-sm font-semibold uppercase tracking-[0.18em] text-white/25">
            {["Registry", "Risk", "Insurance", "Monitoring", "Incidents"].map((stage) => (
              <li key={stage}>{stage}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* 2. The problem */}
      <Section>
        <Reveal>
          <SectionIntro
            align="center"
            eyebrow="The emerging problem"
            title="AI agents act. Most risk processes assume software only advises."
          >
            Autonomous agents now take actions with financial and legal consequences. The tools for
            understanding that exposure have not kept pace.
          </SectionIntro>
        </Reveal>
        <div className="mt-14 grid gap-4 md:grid-cols-3">
          {PROBLEMS.map(({ icon: Icon, title, text }, index) => (
            <Reveal key={title} delay={index * 0.08}>
              <div className="glass h-full rounded-3xl p-7">
                <Icon className="size-7 text-white" strokeWidth={1.5} aria-hidden />
                <h3 className="mt-14 text-lg font-semibold text-ink">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">{text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* 3. How it works */}
      <Section tone="white" id="how-it-works">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <Reveal>
            <SectionIntro eyebrow="How AgentCover works" title="From an inventory of agents to an insurable picture of risk.">
              Five connected steps. Each builds on the record created by the one before it.
            </SectionIntro>
          </Reveal>
          <Button asChild variant="secondary">
            <Link href="/how-it-works">
              See the full platform design
              <ArrowRight aria-hidden />
            </Link>
          </Button>
        </div>
        <ol className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {STEPS.map((step, index) => (
            <li key={step.title}>
              <Reveal delay={index * 0.06} className="h-full">
                <div className="glass h-full rounded-2xl p-5">
                  <span className="text-3xl font-semibold tabular-nums text-white/20">0{index + 1}</span>
                  <h3 className="mt-8 text-base font-semibold text-ink">{step.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{step.text}</p>
                </div>
              </Reveal>
            </li>
          ))}
        </ol>
      </Section>

      {/* 4. Capabilities */}
      <Section>
        <Reveal>
          <SectionIntro align="center" eyebrow="Main capabilities" title="One platform, built in stages.">
            We label what works today and what is planned, so you always know which is which.
          </SectionIntro>
        </Reveal>
        <div className="mt-14 grid gap-4 md:grid-cols-6">
          {CAPABILITIES.map(({ icon: Icon, title, text, available, wide }, index) => (
            <Reveal key={title} delay={(index % 3) * 0.08} className={wide ? "md:col-span-3" : "md:col-span-2"}>
              <div
                className={cn(
                  "glass flex h-full flex-col rounded-3xl p-7",
                  available && "border-white/30 shadow-[0_0_40px_rgba(255,255,255,0.1),inset_0_0_28px_rgba(255,255,255,0.06)]",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <Icon className="size-7 text-white" strokeWidth={1.5} aria-hidden />
                  <Badge variant={available ? "success" : "neutral"}>{available ? "Available" : "In development"}</Badge>
                </div>
                <h3 className="mt-14 text-lg font-semibold text-ink">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">{text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* 5. Who it is for */}
      <Section tone="white">
        <Reveal>
          <SectionIntro eyebrow="Who it is for" title="Built for the teams that deploy agents and the teams that build them." />
        </Reveal>
        <div className="mt-14 grid gap-4 md:grid-cols-2">
          {AUDIENCES.map(({ icon: Icon, title, points }, index) => (
            <Reveal key={title} delay={index * 0.08}>
              <div className="glass h-full rounded-3xl p-7 sm:p-9">
                <Icon className="size-7 text-white" strokeWidth={1.5} aria-hidden />
                <h3 className="mt-6 text-xl font-semibold text-ink">{title}</h3>
                <ul className="mt-6 space-y-3.5">
                  {points.map((point) => (
                    <li key={point} className="flex gap-3 text-sm leading-relaxed text-ink-muted">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-white/70" aria-hidden />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* 6. Why it matters */}
      <Section tone="navy">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-16">
          <Reveal>
            <SectionIntro eyebrow="Why it matters" title="Responsibility for an agent's actions stays with the organisation.">
              Delegating a task to an agent does not delegate accountability for the outcome.
            </SectionIntro>
          </Reveal>
          <dl className="space-y-4">
            {WHY.map((item, index) => (
              <Reveal key={item.term} delay={index * 0.08}>
                <div className="glass rounded-2xl p-6">
                  <dt className="text-base font-semibold text-white">{item.term}</dt>
                  <dd className="mt-1.5 text-sm leading-relaxed text-ink-muted">{item.text}</dd>
                </div>
              </Reveal>
            ))}
          </dl>
        </div>
      </Section>

      {/* 7. Insurance partner ecosystem */}
      <Section tone="white">
        <div className="grid items-start gap-12 lg:grid-cols-2">
          <Reveal>
            <SectionIntro eyebrow="Future insurance partner ecosystem" title="Designed to work with licensed insurance professionals.">
              AgentCover is a technology platform. Insurance is arranged and underwritten by licensed brokers,
              insurers and MGAs, and the platform is being designed so that they can work from the same risk
              record as their clients.
            </SectionIntro>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="glass rounded-3xl p-7 sm:p-9">
              <Handshake className="size-7 text-white" strokeWidth={1.5} aria-hidden />
              <h3 className="mt-6 text-lg font-semibold text-ink">Where this stands today</h3>
              <ul className="mt-5 space-y-3.5 text-sm leading-relaxed text-ink-muted">
                {[
                  "AgentCover has no insurer, broker or MGA partnerships at present.",
                  "It does not sell, issue or underwrite insurance, and cannot confirm whether a policy covers a loss.",
                  "A partner role is reserved in the access model so that authorised partners can be added later.",
                ].map((point) => (
                  <li key={point} className="flex gap-3">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-white/50" aria-hidden />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* 8. Security and responsible AI */}
      <Section>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <Reveal>
            <SectionIntro eyebrow="Security and responsible AI" title="A risk platform has to be careful with its own.">
              The foundation is built around tenant isolation and honest product behaviour.
            </SectionIntro>
          </Reveal>
          <Button asChild variant="secondary">
            <Link href="/security">Read the security overview</Link>
          </Button>
        </div>
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SECURITY.map(({ icon: Icon, title, text }, index) => (
            <Reveal key={title} delay={index * 0.06}>
              <div className="glass h-full rounded-2xl p-6">
                <Icon className="size-6 text-white" strokeWidth={1.5} aria-hidden />
                <h3 className="mt-8 text-base font-semibold text-ink">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* 9. Final CTA */}
      <Section className="pt-0 sm:pt-0">
        <Reveal>
          <div className="glow-frame relative overflow-hidden rounded-[2rem] bg-black px-6 py-16 text-center sm:py-20">
            <div className="bg-grid pointer-events-none absolute inset-0" aria-hidden />
            <div
              className="pointer-events-none absolute bottom-0 left-1/2 h-56 w-[40rem] max-w-full -translate-x-1/2 translate-y-1/2 rounded-full bg-white/[0.18] blur-3xl"
              aria-hidden
            />
            <div className="relative">
              <h2 className="text-fade mx-auto max-w-2xl text-3xl font-semibold leading-[1.12] sm:text-[2.5rem]">
                Start with a clear record of your organisation and team.
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-ink-muted">
                Create a workspace now and be ready for the agent registry and risk assessments as they are
                released.
              </p>
              <div className="mt-9 flex flex-wrap justify-center gap-3">
                <Button asChild size="lg">
                  <Link href="/sign-up">
                    Get started
                    <ArrowUpRight aria-hidden />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="on-dark">
                  <Link href="/demo">Explore the platform</Link>
                </Button>
              </div>
            </div>
          </div>
        </Reveal>
      </Section>
    </>
  );
}
