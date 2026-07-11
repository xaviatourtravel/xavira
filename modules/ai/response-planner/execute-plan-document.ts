import { sendManualWhatsappDocument } from "@/lib/whatsapp-inbox/ai/document-send-service";
import { insertAiEvent } from "@/lib/whatsapp-inbox/ai/event-log";
import type { WhatsappSupabaseClient } from "@/lib/whatsapp-inbox/repository";
import type { WhatsappConversationRow } from "@/types/whatsapp-inbox";
import type { AttachmentAction } from "@/modules/ai/response-planner/types";

export type PlanDocumentExecutionResult = {
  success: boolean;
  documentId: string | null;
  documentName: string | null;
  errorCategory: string | null;
  sentMessageId: string | null;
};

type BrainDocumentRow = {
  id: string;
  business_brain_id: string;
  name: string;
  status: string;
};

async function loadDocument(
  supabase: WhatsappSupabaseClient,
  documentId: string,
): Promise<BrainDocumentRow | null> {
  const { data, error } = await supabase
    .from("brain_documents")
    .select("id, business_brain_id, name, status")
    .eq("id", documentId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function verifyDocumentWorkspace(
  supabase: WhatsappSupabaseClient,
  workspaceId: string,
  businessBrainId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("business_brains")
    .select("id")
    .eq("id", businessBrainId)
    .eq("organization_id", workspaceId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return Boolean(data);
}

export async function validatePlanDocumentForLive(input: {
  supabase: WhatsappSupabaseClient;
  workspaceId: string;
  attachmentAction: AttachmentAction;
  productId: string | null;
}): Promise<{ ok: boolean; reason: string | null; document: BrainDocumentRow | null }> {
  const document = await loadDocument(input.supabase, input.attachmentAction.documentId);
  if (!document) {
    return { ok: false, reason: "document_not_found", document: null };
  }

  if (document.status !== "published") {
    return { ok: false, reason: "document_not_published", document };
  }

  const belongsToWorkspace = await verifyDocumentWorkspace(
    input.supabase,
    input.workspaceId,
    document.business_brain_id,
  );
  if (!belongsToWorkspace) {
    return { ok: false, reason: "cross_workspace_document", document };
  }

  return { ok: true, reason: null, document };
}

export async function executePlanDocumentDelivery(input: {
  supabase: WhatsappSupabaseClient;
  workspaceId: string;
  conversation: WhatsappConversationRow;
  attachmentAction: AttachmentAction;
  incomingMessageId: string;
  productId: string | null;
}): Promise<PlanDocumentExecutionResult> {
  const validation = await validatePlanDocumentForLive({
    supabase: input.supabase,
    workspaceId: input.workspaceId,
    attachmentAction: input.attachmentAction,
    productId: input.productId,
  });

  if (!validation.ok || !validation.document) {
    await insertAiEvent(input.supabase, {
      workspaceId: input.workspaceId,
      conversationId: input.conversation.id,
      messageId: input.incomingMessageId,
      eventType: "AI_DOCUMENT_FAILED",
      reason: validation.reason ?? "document_validation_failed",
      metadata: {
        documentId: input.attachmentAction.documentId,
        documentName: input.attachmentAction.documentName,
        errorCategory: validation.reason,
        source: "answer_first_plan",
      },
    });

    return {
      success: false,
      documentId: input.attachmentAction.documentId,
      documentName: input.attachmentAction.documentName,
      errorCategory: validation.reason,
      sentMessageId: null,
    };
  }

  try {
    const sentMessage = await sendManualWhatsappDocument(input.supabase, {
      workspaceId: input.workspaceId,
      conversation: input.conversation,
      documentId: input.attachmentAction.documentId,
      sentByUserId: "answer_first_plan",
      senderType: "ai",
      source: "answer_first_plan",
    });

    await insertAiEvent(input.supabase, {
      workspaceId: input.workspaceId,
      conversationId: input.conversation.id,
      messageId: sentMessage.id,
      eventType: "AI_DOCUMENT_SENT",
      reason: "Sent by answer-first response plan",
      metadata: {
        documentId: input.attachmentAction.documentId,
        documentName: input.attachmentAction.documentName,
        source: "answer_first_plan",
        incomingMessageId: input.incomingMessageId,
      },
    });

    return {
      success: true,
      documentId: input.attachmentAction.documentId,
      documentName: input.attachmentAction.documentName,
      errorCategory: null,
      sentMessageId: sentMessage.id,
    };
  } catch (error) {
    const errorCategory =
      error instanceof Error && error.message.includes("no file")
        ? "missing_media_url"
        : "provider_send_failed";

    await insertAiEvent(input.supabase, {
      workspaceId: input.workspaceId,
      conversationId: input.conversation.id,
      messageId: input.incomingMessageId,
      eventType: "AI_DOCUMENT_FAILED",
      reason: errorCategory,
      metadata: {
        documentId: input.attachmentAction.documentId,
        documentName: input.attachmentAction.documentName,
        errorCategory,
        source: "answer_first_plan",
      },
    });

    return {
      success: false,
      documentId: input.attachmentAction.documentId,
      documentName: input.attachmentAction.documentName,
      errorCategory,
      sentMessageId: null,
    };
  }
}

export const DOCUMENT_DELIVERY_FAILURE_REPLY_ID =
  "Dokumen belum berhasil dikirim melalui sistem. Saya teruskan ke tim sales agar dapat dibantu.";

export const DOCUMENT_DELIVERY_FAILURE_REPLY_EN =
  "The document could not be delivered through the system. I'll pass this to the team so they can assist.";
