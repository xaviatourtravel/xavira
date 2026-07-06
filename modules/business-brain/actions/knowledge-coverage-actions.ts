"use server";

import { requireProfile } from "@/lib/auth/session";
import { calculateKnowledgeCoverage } from "@/modules/business-brain/services/knowledge-coverage-engine";
import { emptyKnowledgeCoverageResult } from "@/modules/business-brain/lib/knowledge-coverage-calculator";

export async function loadKnowledgeCoverageAction() {
  const { profile } = await requireProfile();
  const organizationId = profile.organization_id?.trim() ?? "";
  if (!organizationId) {
    return emptyKnowledgeCoverageResult();
  }
  return calculateKnowledgeCoverage({ workspaceId: organizationId });
}
