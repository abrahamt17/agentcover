import { ShieldAlert } from "lucide-react";
import type { Metadata } from "next";
import { ModulePlaceholder } from "@/components/dashboard/page-header";
import { requireOrgContext } from "@/lib/auth/session";
import { PLANNED_MODULES } from "@/lib/modules";

export const metadata: Metadata = { title: PLANNED_MODULES.risk.title };

export default async function Page() {
  await requireOrgContext();
  return <ModulePlaceholder icon={ShieldAlert} {...PLANNED_MODULES.risk} capabilities={[...PLANNED_MODULES.risk.capabilities]} />;
}
