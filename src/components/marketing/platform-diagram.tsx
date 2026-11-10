import { ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

type Block = { step: string; title: string; items: string };

const REGISTRY: Block = { step: "1", title: "AI Agent Registry", items: "Inventory · Configuration · Permissions · Integrations" };
const RISK: Block = { step: "2", title: "AI Risk Intelligence Engine", items: "Risk scoring · Exposure mapping · What-if simulations · Controls" };
const INSURANCE: Block = { step: "3", title: "Insurance Intelligence", items: "Policy analysis · Product matching · Coverage gaps" };
const MONITORING: Block = { step: "4", title: "Continuous Monitoring", items: "Configuration changes · Alerts · Risk history" };
const INCIDENTS: Block = { step: "5", title: "Incident & Claims Intelligence", items: "Incident analysis · Evidence collection · Reports" };

function Node({ block, className }: { block: Block; className?: string }) {
  return (
    <div className={cn("rounded-xl border border-white/10 bg-white/[0.04] px-5 py-4 text-center", className)}>
      <p className="text-[0.9375rem] font-semibold text-white">
        <span className="text-navy-300">{block.step}.</span> {block.title}
      </p>
      <p className="mt-1 text-xs leading-relaxed text-navy-200">{block.items}</p>
    </div>
  );
}

const Arrow = () => (
  <div className="flex justify-center py-2.5" aria-hidden>
    <ArrowDown className="size-4 text-navy-300" />
  </div>
);

/** The planned platform, top to bottom. Describes the target architecture, not what is live today. */
export function PlatformDiagram() {
  return (
    <figure className="glow-frame rounded-3xl bg-black p-5 sm:p-7">
      <figcaption className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-semibold text-white">AgentCover platform</span>
        <span className="rounded-md border border-white/15 px-2 py-0.5 text-xs text-navy-200">Target architecture</span>
      </figcaption>
      <Node block={REGISTRY} />
      <Arrow />
      <Node block={RISK} />
      <Arrow />
      <div className="grid gap-3 sm:grid-cols-2">
        <Node block={INSURANCE} />
        <Node block={MONITORING} />
      </div>
      <Arrow />
      <Node block={INCIDENTS} />
      <div className="my-5 border-t border-dashed border-white/15" />
      <div className="rounded-xl border border-white/30 bg-white/[0.07] shadow-[0_0_30px_rgba(255,255,255,0.08)] px-5 py-4 text-center">
        <p className="text-[0.9375rem] font-semibold text-white">AI Orchestration Layer</p>
        <p className="mt-1 text-xs leading-relaxed text-navy-200">
          Specialised agents · RAG · Tool calling · Evaluation · Observability
        </p>
        <p className="mt-2.5 inline-block rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-medium text-white">
          Cross-platform intelligence
        </p>
      </div>
    </figure>
  );
}
