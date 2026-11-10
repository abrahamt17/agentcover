import { Sparkles } from "lucide-react";
import type { Metadata } from "next";
import { ModulePlaceholder } from "@/components/dashboard/page-header";
import { requireOrgContext } from "@/lib/auth/session";
import { PLANNED_MODULES } from "@/lib/modules";

export const metadata: Metadata = { title: PLANNED_MODULES.copilot.title };

export default async function Page() {
  await requireOrgContext();
  return <ModulePlaceholder icon={Sparkles} {...PLANNED_MODULES.copilot} capabilities={[...PLANNED_MODULES.copilot.capabilities]} />;
}
