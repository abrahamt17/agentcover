import { z } from "zod";
import {
  AGENT_COUNT_RANGES,
  ASSIGNABLE_ROLES,
  COUNTRIES,
  INDUSTRIES,
  ORGANISATION_TYPES,
  USE_CASES,
} from "@/lib/constants";
import { emailSchema } from "./auth";

const oneOf = (list: readonly string[], message: string) =>
  z.string().refine((v) => list.includes(v), message);

const optionalOneOf = (list: readonly string[]) =>
  z.string().refine((v) => v === "" || list.includes(v), "Select a valid option");

const codes = (list: readonly { value: string }[]) => list.map((i) => i.value);

const websiteSchema = z
  .string()
  .trim()
  .max(255)
  .refine((v) => v === "" || /^https?:\/\/[^\s.]+\.[^\s]+$/i.test(v), "Enter a full URL starting with https://");

/** Fields describing an organisation. Shared by onboarding and organisation settings. */
export const organisationSchema = z.object({
  name: z.string().trim().min(2, "Enter the organisation name").max(120),
  website: websiteSchema,
  country: oneOf(codes(COUNTRIES), "Select a country"),
  industry: optionalOneOf(INDUSTRIES),
  organisationType: oneOf(codes(ORGANISATION_TYPES), "Select an organisation type"),
  estimatedAgentCount: optionalOneOf(codes(AGENT_COUNT_RANGES)),
  primaryUseCases: z.array(oneOf(codes(USE_CASES), "Unknown use case")).max(USE_CASES.length),
});

export const onboardingSchema = organisationSchema.extend({
  fullName: z.string().trim().min(2, "Enter your full name").max(120),
});

export const inviteSchema = z.object({
  email: emailSchema,
  role: z.enum(ASSIGNABLE_ROLES, "Select a role"),
});

export const memberRoleSchema = z.object({
  memberId: z.uuid(),
  role: z.enum(ASSIGNABLE_ROLES),
});

export const profileSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name").max(120),
  securityAlerts: z.boolean(),
  productUpdates: z.boolean(),
});

export type OrganisationValues = z.infer<typeof organisationSchema>;
export type OnboardingValues = z.infer<typeof onboardingSchema>;
export type InviteValues = z.infer<typeof inviteSchema>;
export type ProfileValues = z.infer<typeof profileSchema>;
