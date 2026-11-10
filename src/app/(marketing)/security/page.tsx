import { CheckCircle2, Clock } from "lucide-react";
import type { Metadata } from "next";
import { PageHero, Section, SectionIntro } from "@/components/marketing/site-chrome";

export const metadata: Metadata = {
  title: "Security",
  description: "The security controls implemented in AgentCover today, what is planned, and how AI features will be governed.",
};

const IMPLEMENTED = [
  { title: "Organisation-level isolation", text: "Row Level Security is enabled on every table. Queries return only rows from organisations where the signed-in user has an active membership." },
  { title: "Server-side authorisation", text: "Role checks run on the server and are enforced again inside the database. A role sent from the browser is never treated as proof of access." },
  { title: "Controlled privilege changes", text: "Memberships and roles can only be changed through audited database functions. Users cannot edit their own role, and platform administrators can only be assigned directly in the database." },
  { title: "Authentication", text: "Email and password sign-in with email verification and password reset, using Supabase Auth with secure, HTTP-only session cookies." },
  { title: "Invitation safety", text: "Invitation tokens are stored only as SHA-256 hashes, expire after seven days and can be accepted only by the invited, verified email address." },
  { title: "Audit log", text: "Organisation creation and updates, invitations, role changes and removals are written to an append-only log visible to owners and admins." },
  { title: "Input validation", text: "Every form is validated on the server with the same schema used in the browser, and constrained again by the database." },
  { title: "Secret handling", text: "No secret keys are shipped to the browser. The application runs entirely with the signed-in user's own permissions." },
];

const PLANNED = [
  "Multi-factor authentication and single sign-on.",
  "Shared-store rate limiting across all server instances.",
  "Data export and deletion tooling for organisations.",
  "Encrypted document storage with per-organisation access policies for policy uploads.",
  "Independent security testing before any production launch.",
];

const AI_PRINCIPLES = [
  { title: "Human approval for consequential actions", text: "AI analysts will propose; people will decide. Workflows will include explicit approval checkpoints." },
  { title: "Reasoning and sources", text: "Assessments and answers will show how they were reached and which documents they rely on." },
  { title: "Traceability", text: "AI executions will be traced, with cost and latency recorded, and outputs evaluated automatically against test sets." },
  { title: "No overstated authority", text: "AI output will be presented as decision support. It will not be described as a coverage decision, legal advice or an actuarial result." },
];

export default function SecurityPage() {
  return (
    <>
      <PageHero eyebrow="Security" title="Built so that one organisation can never see another's risk record.">
        This page lists the controls that are implemented today and those that are planned. AgentCover holds no
        security certifications and has not yet been independently audited.
      </PageHero>

      <Section>
        <SectionIntro eyebrow="Implemented today" title="Controls in the current release." />
        <div className="mt-10 grid gap-x-10 gap-y-7 md:grid-cols-2">
          {IMPLEMENTED.map((item) => (
            <div key={item.title} className="flex gap-3.5">
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success-700" aria-hidden />
              <div>
                <h3 className="text-sm font-semibold text-ink">{item.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-ink-muted">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section tone="white">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <SectionIntro eyebrow="Planned" title="Not yet implemented." />
            <ul className="mt-8 space-y-4">
              {PLANNED.map((item) => (
                <li key={item} className="flex gap-3.5 text-sm leading-relaxed text-ink-muted">
                  <Clock className="mt-0.5 size-4 shrink-0 text-ink-subtle" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <SectionIntro eyebrow="Responsible AI" title="How AI features will be governed.">
              No AI model is connected to the platform yet. These are the commitments the AI modules are being
              designed around.
            </SectionIntro>
            <dl className="mt-8 space-y-5">
              {AI_PRINCIPLES.map((item) => (
                <div key={item.title}>
                  <dt className="text-sm font-semibold text-ink">{item.title}</dt>
                  <dd className="mt-1 text-sm leading-relaxed text-ink-muted">{item.text}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </Section>
    </>
  );
}
