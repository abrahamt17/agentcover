import { cn } from "@/lib/utils";

/** AgentCover mark: a shield outline enclosing a node, i.e. an agent under cover. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={cn("size-8", className)} aria-hidden>
      <rect width="32" height="32" rx="8" fill="white" />
      <path
        d="M16 6.5 8.5 9.4v6.3c0 4.6 3 8.4 7.5 9.8 4.5-1.4 7.5-5.2 7.5-9.8V9.4L16 6.5Z"
        stroke="black"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="16" cy="15.5" r="2.6" fill="black" />
    </svg>
  );
}

export function Logo({ className }: { className?: string; onDark?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark className="drop-shadow-[0_0_10px_rgba(255,255,255,0.35)]" />
      <span className="text-[1.0625rem] font-semibold tracking-tight text-white">AgentCover</span>
    </span>
  );
}
