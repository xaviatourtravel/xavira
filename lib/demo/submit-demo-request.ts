import { createAdminClient } from "@/utils/supabase/admin";

import { createAuditLog } from "@/lib/audit/create-audit-log";
import {
  DEMO_SOURCE_DETAIL,
  getDemoCompanySizeLabel,
  getDemoIndustryLabel,
  getDemoMainChallengeLabel,
} from "@/lib/demo/constants";
import type { DemoRequestInput } from "@/lib/demo/validate";
import { formatActionError, logServerError } from "@/lib/errors";

type SubmitDemoRequestResult =
  | { success: true; demoRequestId: string; leadId: string | null; spam: boolean }
  | { success: false; message: string };

function getMarketingOrganizationId() {
  return process.env.DESKLABS_MARKETING_ORG_ID?.trim() || null;
}

function buildLeadNotes(input: DemoRequestInput) {
  const lines = [
    "Demo request from desklabs.id",
    `Industry: ${getDemoIndustryLabel(input.industry)}`,
  ];

  if (input.companySize) {
    lines.push(`Company size: ${getDemoCompanySizeLabel(input.companySize)}`);
  }

  if (input.mainChallenge) {
    lines.push(`Main challenge: ${getDemoMainChallengeLabel(input.mainChallenge)}`);
  }

  if (input.message) {
    lines.push("", "Notes:", input.message);
  }

  return lines.join("\n");
}

async function createLinkedLead(
  admin: ReturnType<typeof createAdminClient>,
  organizationId: string,
  input: DemoRequestInput,
) {
  const { data, error } = await admin
    .from("leads")
    .insert({
      organization_id: organizationId,
      full_name: input.fullName,
      email: input.workEmail,
      phone: input.phone,
      whatsapp_number: input.phone,
      source: "website",
      source_detail: DEMO_SOURCE_DETAIL,
      status: "new",
      notes: buildLeadNotes(input),
      metadata: {
        demo_request: true,
        industry: input.industry,
        company_name: input.companyName,
        company_size: input.companySize || null,
        main_challenge: input.mainChallenge || null,
      },
    })
    .select("id")
    .single();

  if (error || !data) {
    logServerError("createLinkedLead", error);
    return null;
  }

  return data.id;
}

export async function submitDemoRequest(
  input: DemoRequestInput,
): Promise<SubmitDemoRequestResult> {
  if (input.honeypot) {
    return { success: true, demoRequestId: "spam", leadId: null, spam: true };
  }

  const admin = createAdminClient();
  const organizationId = getMarketingOrganizationId();
  let leadId: string | null = null;

  if (organizationId) {
    leadId = await createLinkedLead(admin, organizationId, input);
  }

  const { data, error } = await admin
    .from("demo_requests")
    .insert({
      organization_id: organizationId,
      lead_id: leadId,
      full_name: input.fullName,
      work_email: input.workEmail,
      company_name: input.companyName,
      phone: input.phone,
      industry: input.industry,
      company_size: input.companySize || null,
      main_challenge: input.mainChallenge || null,
      message: input.message || null,
      status: "new",
      metadata_json: {
        source: DEMO_SOURCE_DETAIL,
        company_size: input.companySize || null,
        main_challenge: input.mainChallenge || null,
      },
    })
    .select("id")
    .single();

  if (error || !data) {
    logServerError("submitDemoRequest", error);
    return {
      success: false,
      message: formatActionError(error, "submitDemoRequest"),
    };
  }

  if (organizationId) {
    await createAuditLog(admin, {
      organizationId,
      actorUserId: null,
      actorName: "Website Visitor",
      actorRole: "system",
      action: "demo_request_submitted",
      entityType: "demo_request",
      entityId: data.id,
      entityLabel: input.fullName,
      metadata: {
        company_name: input.companyName,
        work_email: input.workEmail,
        industry: input.industry,
        lead_id: leadId,
      },
    });
  }

  return {
    success: true,
    demoRequestId: data.id,
    leadId,
    spam: false,
  };
}
