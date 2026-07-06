export {
  generateIdentityPreview,
  type IdentityPreview,
} from "@/modules/business-brain/lib/generate-identity-preview";

import {
  generateIdentityPreview,
  type IdentityPreview,
} from "@/modules/business-brain/lib/generate-identity-preview";
import type { CompanyDnaFormValues } from "@/modules/business-brain/types/company-dna";

/** @deprecated Use IdentityPreview */
export type CompanyDNAPreview = IdentityPreview;

/** @deprecated Use generateIdentityPreview */
export function generateCompanyDNAPreview(
  formState: CompanyDnaFormValues,
): IdentityPreview {
  return generateIdentityPreview(formState);
}

/** @deprecated Use generateIdentityPreview */
export function generateCompanyDnaPreviewReply(
  formState: CompanyDnaFormValues,
): string {
  return generateIdentityPreview(formState).aiReply;
}

export const COMPANY_DNA_PREVIEW_CUSTOMER_MESSAGE = "Halo kak";
