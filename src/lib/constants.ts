export const ORGANISATION_TYPES = [
  { value: "business", label: "Business deploying AI agents" },
  { value: "ai_agency", label: "AI development agency" },
  { value: "ai_software_company", label: "AI software company" },
  { value: "independent_developer", label: "Independent AI developer" },
  { value: "other", label: "Other" },
] as const;

export const AGENT_COUNT_RANGES = [
  { value: "1-5", label: "1–5" },
  { value: "6-20", label: "6–20" },
  { value: "21-50", label: "21–50" },
  { value: "51-100", label: "51–100" },
  { value: "100+", label: "More than 100" },
] as const;

export const USE_CASES = [
  { value: "customer_support", label: "Customer support" },
  { value: "sales_outreach", label: "Sales and outreach" },
  { value: "internal_operations", label: "Internal operations" },
  { value: "software_engineering", label: "Software engineering" },
  { value: "finance_accounting", label: "Finance and accounting" },
  { value: "data_analysis", label: "Data analysis and reporting" },
  { value: "document_processing", label: "Document processing" },
  { value: "procurement", label: "Procurement and purchasing" },
  { value: "hr_recruiting", label: "HR and recruiting" },
  { value: "other", label: "Other" },
] as const;

export const INDUSTRIES = [
  "Technology and software",
  "Financial services",
  "Insurance",
  "Professional services",
  "Healthcare and life sciences",
  "Retail and e-commerce",
  "Manufacturing",
  "Logistics and transport",
  "Energy and utilities",
  "Media and telecommunications",
  "Public sector",
  "Education",
  "Other",
] as const;

const COUNTRY_PAIRS: [string, string][] = [
  ["AT", "Austria"], ["BE", "Belgium"], ["BG", "Bulgaria"], ["HR", "Croatia"], ["CY", "Cyprus"],
  ["CZ", "Czechia"], ["DK", "Denmark"], ["EE", "Estonia"], ["FI", "Finland"], ["FR", "France"],
  ["DE", "Germany"], ["GR", "Greece"], ["HU", "Hungary"], ["IS", "Iceland"], ["IE", "Ireland"],
  ["IT", "Italy"], ["LV", "Latvia"], ["LI", "Liechtenstein"], ["LT", "Lithuania"], ["LU", "Luxembourg"],
  ["MT", "Malta"], ["NL", "Netherlands"], ["NO", "Norway"], ["PL", "Poland"], ["PT", "Portugal"],
  ["RO", "Romania"], ["SK", "Slovakia"], ["SI", "Slovenia"], ["ES", "Spain"], ["SE", "Sweden"],
  ["CH", "Switzerland"], ["GB", "United Kingdom"], ["UA", "Ukraine"], ["RS", "Serbia"], ["TR", "Türkiye"],
  ["US", "United States"], ["CA", "Canada"], ["AU", "Australia"], ["SG", "Singapore"],
  ["AE", "United Arab Emirates"], ["IL", "Israel"], ["IN", "India"], ["JP", "Japan"], ["BR", "Brazil"],
  ["ZA", "South Africa"], ["ET", "Ethiopia"], ["KE", "Kenya"], ["NG", "Nigeria"],
];

/** ISO 3166-1 alpha-2 codes. A deliberately short list for Phase 1, Europe first. */
export const COUNTRIES = COUNTRY_PAIRS.map(([value, label]) => ({ value, label })).sort((a, b) =>
  a.label.localeCompare(b.label),
);

export const ORG_ROLES = ["owner", "admin", "member", "developer", "insurance_partner"] as const;
export type OrgRole = (typeof ORG_ROLES)[number];

/** Roles that can be granted through invitations or role changes in Phase 1. */
export const ASSIGNABLE_ROLES = ["admin", "member", "developer"] as const;
export type AssignableRole = (typeof ASSIGNABLE_ROLES)[number];

export const ROLE_LABELS: Record<OrgRole, string> = {
  owner: "Owner",
  admin: "Admin",
  member: "Member",
  developer: "AI Developer",
  insurance_partner: "Insurance Partner",
};

export const ROLE_DESCRIPTIONS: Record<AssignableRole, string> = {
  admin: "Manages agents and risk information, and can invite or remove members.",
  member: "Views and works with the records they are permitted to access.",
  developer: "Registers agents built for clients and prepares risk reports.",
};

export function labelFor(
  list: readonly { value: string; label: string }[],
  value: string | null | undefined,
): string {
  return list.find((item) => item.value === value)?.label ?? "Not provided";
}
