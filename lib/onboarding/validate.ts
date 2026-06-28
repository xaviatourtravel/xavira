import { z } from "zod";

import {
  COMPANY_SIZES,
  SOLUTION_INDUSTRIES,
} from "@/lib/onboarding/types";

const emailListSchema = z
  .array(z.string().email())
  .max(5, "Maksimal 5 undangan per setup");

export const firstRunWizardSchema = z.object({
  industry: z.enum(SOLUTION_INDUSTRIES),
  companyName: z
    .string()
    .trim()
    .min(2, "Nama perusahaan minimal 2 karakter")
    .max(120),
  workspaceName: z
    .string()
    .trim()
    .min(2, "Nama workspace minimal 2 karakter")
    .max(120),
  companySize: z.enum(COMPANY_SIZES),
  inviteEmails: emailListSchema.default([]),
});

export function parseInviteEmailInput(raw: string): string[] {
  const tokens = raw
    .split(/[\n,;]+/)
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  return [...new Set(tokens)].slice(0, 5);
}
