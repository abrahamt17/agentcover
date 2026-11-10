import type { Metadata } from "next";
import Link from "next/link";
import { PlatformDiagram } from "@/components/marketing/platform-diagram";
import { PageHero, Section, SectionIntro } from "@/components/marketing/site-chrome";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "How it works",
  description: "How AgentCover connects an AI-agent registry, risk intelligence, insurance analysis, monitoring and incident handling.",
};

const STAGES = [
  {
    title: "Set up your organisation",
    status: "Available",
    text: "Create a workspace, describe your organisation and invite colleagues. Owners, admins, members and AI developers each get the access their role needs, and every change is written to an audit log.",
  },
  {
    title: "Register your AI agents",
    status: "Phase 2",
    text: "Record each agent: what it is for, where it is deployed, which model and tools it uses, which systems it can reach and what it can do without human approval. Versions keep a history of how its capabilities change.",
  },
  {
    title: "Assess the risk",
    status: "Phase 3",
    text: "The risk engine will map an agent's permissions to concrete loss scenarios, score the exposure, explain its reasoning and recommend controls. What-if simulations show how a configuration change would move the result.",
  },
  {
    title: "Review insurance",
    status: "Phase 4",
    text: "Upload existing policies to extract key terms, limits and exclusions, compare them with identified risks and see products that may be relevant to discuss with a licensed broker or insurer.",
  },
  {
    title: "Monitor continuously",
    status: "Phase 5",
    text: "Configuration changes will be detected and reflected in the risk picture, with alerts when a change raises an agent's risk level.",
  },
  {
    title: "Handle incidents",
    status: "Phase 6",
    text: "When something goes wrong, record the incident against the agent and version involved, collect evidence and produce a report suitable for notifying a claim.",
  },
];

export default function HowItWorksPage() {
  return (
    <>
      <PageHero eyebrow="How it works" title="A single record that links what an agent can do to what could go wrong.">
        AgentCover is being built in stages. This page describes the full design and states clearly which parts
        are available today.
      </PageHero>

      <Section>
        <div className="grid gap-12 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)]">
          <div>
            <SectionIntro eyebrow="The workflow" title="Six stages, one continuous record." />
            <ol className="mt-8 space-y-4">
              {STAGES.map((stage, index) => (
                <li key={stage.title} className="rounded-card border border-line bg-surface p-5 shadow-card sm:p-6">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="flex size-7 items-center justify-center rounded-full bg-white text-xs font-semibold text-black">
                      {index + 1}
                    </span>
                    <h3 className="text-base font-semibold text-ink">{stage.title}</h3>
                    <Badge variant={stage.status === "Available" ? "success" : "neutral"} className="ml-auto">
                      {stage.status === "Available" ? "Available" : `Planned · ${stage.status}`}
                    </Badge>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-ink-muted">{stage.text}</p>
                </li>
              ))}
            </ol>
          </div>
          <div className="lg:sticky lg:top-24 lg:self-start">
            <PlatformDiagram />
            <p className="mt-4 text-xs leading-relaxed text-ink-subtle">
              The orchestration layer will coordinate specialised AI analysts across the modules, with retrieval
              over your own documents, human approval checkpoints and evaluation of outputs. It is planned for
              Phase 7; no AI model is connected to the platform today.
            </p>
          </div>
        </div>
      </Section>

      <Section tone="white">
        <SectionIntro eyebrow="What AgentCover is not" title="Decision support, not insurance.">
          AgentCover does not issue policies, underwrite risk or decide whether a loss is covered. Risk scores
          will be based on documented rules and analysis, not an actuarial model. Insurance decisions belong to
          licensed insurers and intermediaries.
        </SectionIntro>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/sign-up">Get started</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/demo">Explore the demo preview</Link>
          </Button>
        </div>
      </Section>
    </>
  );
}
