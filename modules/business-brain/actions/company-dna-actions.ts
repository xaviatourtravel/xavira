"use server";

import { isAdminOrOwner } from "@/lib/auth/permissions";
import { requireProfile } from "@/lib/auth/session";
import {
  getCompanyDNA,
  saveDraft,
  updateCompanyDNA,
} from "@/modules/business-brain/services/company-dna-service";
import { companyDnaFormSchema } from "@/modules/business-brain/schemas/company-dna";

export async function loadCompanyDnaAction() {
  const { profile } = await requireProfile();

  if (!profile.organization_id) {
    throw new Error("Organization is required.");
  }

  return getCompanyDNA(profile.organization_id);
}

export async function saveCompanyDnaDraftAction(input: unknown) {
  const { profile } = await requireProfile();

  if (!profile.organization_id) {
    return { ok: false as const, error: "Organization is required." };
  }

  if (!isAdminOrOwner(profile)) {
    return {
      ok: false as const,
      error: "Only workspace owners and admins can update Company DNA.",
    };
  }

  const parsed = companyDnaFormSchema.safeParse(input);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]?.message ?? "Invalid form data.";
    return { ok: false as const, error: firstIssue, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    const record = await saveDraft(profile.organization_id, parsed.data);
    return { ok: true as const, record };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Failed to save draft.",
    };
  }
}

export async function updateCompanyDnaAction(input: unknown) {
  const { profile } = await requireProfile();

  if (!profile.organization_id) {
    return { ok: false as const, error: "Organization is required." };
  }

  if (!isAdminOrOwner(profile)) {
    return {
      ok: false as const,
      error: "Only workspace owners and admins can update Company DNA.",
    };
  }

  const parsed = companyDnaFormSchema.safeParse(input);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]?.message ?? "Invalid form data.";
    return { ok: false as const, error: firstIssue };
  }

  try {
    const record = await updateCompanyDNA(profile.organization_id, parsed.data);
    return { ok: true as const, record };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Failed to update Company DNA.",
    };
  }
}
