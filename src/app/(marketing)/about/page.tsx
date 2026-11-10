import type { Metadata } from "next";
import Link from "next/link";
import { PageHero, Section, SectionIntro } from "@/components/marketing/site-chrome";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "About",
  description: "What AgentCover is, what it is not, and where the product stands today.",
};

const PRINCIPLES = [
  {
    title: "Say what is true",
    text: "No invented customers, statistics or partnerships. Sample data is labelled as demo data and unbuilt features are marked as planned.",
  },
  {
    title: "Stay in our lane",
    text: "AgentCover provides technology and risk intelligence. Insurance is arranged and underwritten by licensed professionals.",
  },
  {
    title: "Keep people in control",
    text: "AI features will support decisions with reasoning and sources, and will require human approval before anything consequential happens.",
  },
  {
    title: "Protect the record",
    text: "A risk register is sensitive. Isolation between organisations is enforced in the database and access is granted by role.",
  },
];

export default function AboutPage() {
  return (
    <>
      <PageHero eyebrow="About" title="Making AI-agent risk something an organisation can see, manage and discuss with an insurer.">
        AgentCover is an early-stage European insurtech product. It starts from a simple observation: you cannot
        manage or insure a risk that nobody has written down.
      </PageHero>

      <Section>
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <SectionIntro eyebrow="What we are building" title="A risk-intelligence platform for autonomous AI agents." />
            <div className="mt-6 space-y-4 text-base leading-relaxed text-ink-muted">
              <p>
                Organisations are giving AI agents the ability to act: to send messages, change records, place
                orders and approve transactions. Each of those permissions is a source of operational and
                financial risk, and most organisations have no structured record of them.
              </p>
              <p>
                AgentCover is intended to provide that record, and to connect it to risk assessment, to the
                organisation&apos;s existing insurance, to ongoing monitoring and to incident handling.
              </p>
              <p>
                The platform serves two groups: businesses that deploy agents, and the developers and agencies
                that build agents for them.
              </p>
            </div>
          </div>
          <div className="rounded-card border border-line bg-surface p-6 shadow-card sm:p-8">
            <h2 className="text-base font-semibold text-ink">Where the product stands</h2>
            <dl className="mt-5 space-y-5 text-sm">
              <div>
                <dt className="font-medium text-ink">Available now</dt>
                <dd className="mt-1 leading-relaxed text-ink-muted">
                  Accounts, organisation workspaces, roles, invitations, an audit log and the dashboard shell.
                </dd>
              </div>
              <div>
                <dt className="font-medium text-ink">In development</dt>
                <dd className="mt-1 leading-relaxed text-ink-muted">
                  The agent registry, risk intelligence, insurance analysis, monitoring, incident handling and
                  the AI copilot.
                </dd>
              </div>
              <div>
                <dt className="font-medium text-ink">Not claimed</dt>
                <dd className="mt-1 leading-relaxed text-ink-muted">
                  AgentCover is not an insurer or broker, has no insurance partnerships, holds no security
                  certifications and has not yet validated market demand.
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </Section>

      <Section tone="white">
        <SectionIntro eyebrow="Principles" title="How we intend to build it." />
        <div className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2">
          {PRINCIPLES.map((principle) => (
            <div key={principle.title} className="border-l-2 border-brand-500 pl-5">
              <h3 className="text-base font-semibold text-ink">{principle.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{principle.text}</p>
            </div>
          ))}
        </div>
        <div className="mt-10">
          <Button asChild>
            <Link href="/how-it-works">See how it works</Link>
          </Button>
        </div>
      </Section>
    </>
  );
}
