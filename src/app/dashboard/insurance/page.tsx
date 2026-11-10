import { Umbrella } from "lucide-react";
import type { Metadata } from "next";
import { ModulePlaceholder } from "@/components/dashboard/page-header";
import { requireOrgContext } from "@/lib/auth/session";
import { PLANNED_MODULES } from "@/lib/modules";

export const metadata: Metadata = { title: PLANNED_MODULES.insurance.title };

export default async function Page() {
  await requireOrgContext();
  return <ModulePlaceholder icon={Umbrella} {...PLANNED_MODULES.insurance} capabilities={[...PLANNED_MODULES.insurance.capabilities]} />;
}
