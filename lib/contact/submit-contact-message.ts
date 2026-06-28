import { createAdminClient } from "@/utils/supabase/admin";

import { createAuditLog } from "@/lib/audit/create-audit-log";
import {
  CONTACT_SOURCE,
  getContactTopicLabel,
} from "@/lib/contact/constants";
import type { ContactMessageInput } from "@/lib/contact/validate";
import { formatActionError, logServerError } from "@/lib/errors";

type SubmitContactMessageResult =
  | { success: true; contactMessageId: string; leadId: string | null; spam: boolean }
  | { success: false; message: string };

function getMarketingOrganizationId() {
  return process.env.DESKLABS_MARKETING_ORG_ID?.trim() || null;
}

function buildLeadNotes(input: ContactMessageInput) {
  const lines = [
    "Contact message from desklabs.id",
    `Topic: ${getContactTopicLabel(input.topic)}`,
  ];

  if (input.companyName) {
    lines.push(`Company: ${input.companyName}`);
  }

  lines.push("", "Message:", input.message);

  return lines.join("\n");
}

async function createLinkedLead(
  admin: ReturnType<typeof createAdminClient>,
  organizationId: string,
  input: ContactMessageInput,
) {
  const { data, error } = await admin
    .from("leads")
    .insert({
      organization_id: organizationId,
      full_name: input.fullName,
      email: input.email,
      source: "website",
      source_detail: CONTACT_SOURCE,
      status: "new",
      notes: buildLeadNotes(input),
      metadata: {
        contact_message: true,
        topic: input.topic,
        company_name: input.companyName || null,
      },
    })
    .select("id")
    .single();

  if (error || !data) {
    logServerError("createContactLinkedLead", error);
    return null;
  }

  return data.id;
}

export async function submitContactMessage(
  input: ContactMessageInput,
): Promise<SubmitContactMessageResult> {
  if (input.honeypot) {
    return { success: true, contactMessageId: "spam", leadId: null, spam: true };
  }

  const admin = createAdminClient();
  const organizationId = getMarketingOrganizationId();
  let leadId: string | null = null;

  if (organizationId) {
    leadId = await createLinkedLead(admin, organizationId, input);
  }

  const { data, error } = await admin
    .from("contact_messages")
    .insert({
      organization_id: organizationId,
      lead_id: leadId,
      full_name: input.fullName,
      email: input.email,
      company_name: input.companyName || null,
      topic: input.topic,
      message: input.message,
      status: "new",
      metadata_json: {
        source: CONTACT_SOURCE,
        topic_label: getContactTopicLabel(input.topic),
      },
    })
    .select("id")
    .single();

  if (error || !data) {
    logServerError("submitContactMessage", error);
    return {
      success: false,
      message: formatActionError(error, "submitContactMessage"),
    };
  }

  if (organizationId) {
    await createAuditLog(admin, {
      organizationId,
      actorUserId: null,
      actorName: "Website Visitor",
      actorRole: "system",
      action: "contact_message_submitted",
      entityType: "contact_message",
      entityId: data.id,
      entityLabel: input.fullName,
      metadata: {
        email: input.email,
        topic: input.topic,
        company_name: input.companyName || null,
        lead_id: leadId,
      },
    });
  }

  return {
    success: true,
    contactMessageId: data.id,
    leadId,
    spam: false,
  };
}
