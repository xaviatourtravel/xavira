import {
  sendWhatsAppMedia,
  type WhatsAppMediaType,
} from "@/lib/integrations/whatsapp/evolution-client";
import { createBusinessBrainDocumentSignedUrl } from "@/modules/business-brain/lib/document-storage";
import type { BrainDocumentTrigger } from "@/modules/business-brain/types/documents";
import type { WhatsAppDocumentAction } from "@/modules/business-brain/types/prompt";
import {
  customerMessageMatchesDocumentTrigger,
  inferDocumentTypeFromRecord,
  normalizeDocumentActionConfidence,
  resolveDocumentMessageType,
  resolveDocumentMimeType,
  resolveWhatsAppMediaType,
  selectDocumentActionsForAutoSend,
  type DocumentAutoSendSkipCode,
} from "@/lib/whatsapp-inbox/ai/document-auto-send-rules";
import { insertAiEvent } from "@/lib/whatsapp-inbox/ai/event-log";
import { aiOwnershipService } from "@/lib/whatsapp-inbox/ai/ownership-service";
import {
  insertWhatsappMessage,
  updateWhatsappMessageById,
  type WhatsappSupabaseClient,
} from "@/lib/whatsapp-inbox/repository";
import type { WhatsappConversationRow } from "@/types/whatsapp-inbox";
import type { Json } from "@/types/database";

const WA_AI_DOC_LOG = "[WA_AI_DOC]";

type BrainDocumentRow = {
  id: string;
  business_brain_id: string;
  name: string;
  storage_path: string | null;
  public_url: string | null;
  mime_type: string | null;
  document_type: string;
  auto_send_enabled: boolean;
  status: string;
};

function logDocumentSend(message: string, data?: Record<string, unknown>) {
  if (data) {
    console.info(`${WA_AI_DOC_LOG} ${message}`, data);
  } else {
    console.info(`${WA_AI_DOC_LOG} ${message}`);
  }
}

async function loadBrainDocument(
  supabase: WhatsappSupabaseClient,
  documentId: string,
): Promise<BrainDocumentRow | null> {
  const { data, error } = await supabase
    .from("brain_documents")
    .select(
      "id, business_brain_id, name, storage_path, public_url, mime_type, document_type, auto_send_enabled, status",
    )
    .eq("id", documentId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function loadDocumentTriggers(
  supabase: WhatsappSupabaseClient,
  documentId: string,
): Promise<BrainDocumentTrigger[]> {
  const { data, error } = await supabase
    .from("brain_document_triggers")
    .select("trigger_key")
    .eq("document_id", documentId);

  if (error) {
    throw new Error(error.message);
  }

  const allowed: BrainDocumentTrigger[] = [
    "customer_asks_itinerary",
    "customer_asks_brochure",
    "customer_asks_package_details",
    "customer_asks_visa",
    "customer_asks_payment",
    "customer_asks_company_profile",
  ];

  return (data ?? [])
    .map((row) => row.trigger_key)
    .filter((value): value is BrainDocumentTrigger =>
      allowed.includes(value as BrainDocumentTrigger),
    );
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

async function resolveDocumentMediaUrl(
  document: BrainDocumentRow,
): Promise<string | null> {
  if (document.storage_path?.trim()) {
    return createBusinessBrainDocumentSignedUrl(document.storage_path, 900);
  }

  if (document.public_url?.trim()) {
    return document.public_url.trim();
  }

  return null;
}

async function logDocumentSkipped(
  supabase: WhatsappSupabaseClient,
  args: {
    workspaceId: string;
    conversationId: string;
    messageId?: string | null;
    documentId?: string;
    documentName?: string;
    reason: string;
    code: DocumentAutoSendSkipCode;
    confidence?: number;
  },
) {
  await insertAiEvent(supabase, {
    workspaceId: args.workspaceId,
    conversationId: args.conversationId,
    messageId: args.messageId ?? null,
    eventType: "AI_DOCUMENT_SKIPPED",
    reason: args.reason,
    metadata: {
      code: args.code,
      documentId: args.documentId ?? null,
      documentName: args.documentName ?? null,
      confidence: args.confidence ?? null,
      conversationId: args.conversationId,
    },
  });

  logDocumentSend("AI_DOCUMENT_SKIPPED", {
    conversationId: args.conversationId,
    code: args.code,
    documentId: args.documentId,
    reason: args.reason,
  });
}

export type ProcessAiDocumentAutoSendInput = {
  workspaceId: string;
  conversation: WhatsappConversationRow;
  incomingMessageId: string;
  customerMessage: string;
  handoffRequired: boolean;
  requiresHumanIntent: boolean;
  documentActions: WhatsAppDocumentAction[];
};

export async function processAiDocumentAutoSend(
  supabase: WhatsappSupabaseClient,
  input: ProcessAiDocumentAutoSendInput,
) {
  const {
    workspaceId,
    conversation,
    incomingMessageId,
    customerMessage,
    handoffRequired,
    requiresHumanIntent,
    documentActions,
  } = input;

  if (handoffRequired) {
    await logDocumentSkipped(supabase, {
      workspaceId,
      conversationId: conversation.id,
      messageId: incomingMessageId,
      reason: "Handoff required",
      code: "handoff_required",
    });
    return;
  }

  if (requiresHumanIntent) {
    await logDocumentSkipped(supabase, {
      workspaceId,
      conversationId: conversation.id,
      messageId: incomingMessageId,
      reason: "Intent requires human assistance",
      code: "human_required_intent",
    });
    return;
  }

  const autoReplyCheck = await aiOwnershipService.shouldAutoReply(
    supabase,
    workspaceId,
    conversation.id,
  );

  if (!autoReplyCheck.allowed) {
    await logDocumentSkipped(supabase, {
      workspaceId,
      conversationId: conversation.id,
      messageId: incomingMessageId,
      reason: autoReplyCheck.reason,
      code: "ai_not_active",
    });
    return;
  }

  if (documentActions.length === 0) {
    return;
  }

  const selectedActions = selectDocumentActionsForAutoSend(documentActions);

  if (selectedActions.length === 0) {
    await logDocumentSkipped(supabase, {
      workspaceId,
      conversationId: conversation.id,
      messageId: incomingMessageId,
      reason: "No document actions met confidence threshold",
      code: "low_confidence",
    });
    return;
  }

  for (const action of selectedActions) {
    const confidence = normalizeDocumentActionConfidence(action.confidence);
    const document = await loadBrainDocument(supabase, action.documentId);

    if (!document) {
      await logDocumentSkipped(supabase, {
        workspaceId,
        conversationId: conversation.id,
        messageId: incomingMessageId,
        documentId: action.documentId,
        reason: action.reason,
        code: "document_not_found",
        confidence,
      });
      continue;
    }

    const documentName = document.name.trim() || "Document";

    const workspaceMatches = await verifyDocumentWorkspace(
      supabase,
      workspaceId,
      document.business_brain_id,
    );

    if (!workspaceMatches) {
      await logDocumentSkipped(supabase, {
        workspaceId,
        conversationId: conversation.id,
        messageId: incomingMessageId,
        documentId: document.id,
        documentName,
        reason: action.reason,
        code: "workspace_mismatch",
        confidence,
      });
      continue;
    }

    if (document.status !== "published") {
      await logDocumentSkipped(supabase, {
        workspaceId,
        conversationId: conversation.id,
        messageId: incomingMessageId,
        documentId: document.id,
        documentName,
        reason: action.reason,
        code: "not_published",
        confidence,
      });
      continue;
    }

    if (!document.auto_send_enabled) {
      await logDocumentSkipped(supabase, {
        workspaceId,
        conversationId: conversation.id,
        messageId: incomingMessageId,
        documentId: document.id,
        documentName,
        reason: action.reason,
        code: "auto_send_disabled",
        confidence,
      });
      continue;
    }

    const triggers = await loadDocumentTriggers(supabase, document.id);

    if (triggers.length === 0) {
      await logDocumentSkipped(supabase, {
        workspaceId,
        conversationId: conversation.id,
        messageId: incomingMessageId,
        documentId: document.id,
        documentName,
        reason: action.reason,
        code: "no_triggers_configured",
        confidence,
      });
      continue;
    }

    if (
      !customerMessageMatchesDocumentTrigger(
        customerMessage,
        action.reason,
        triggers,
      )
    ) {
      await logDocumentSkipped(supabase, {
        workspaceId,
        conversationId: conversation.id,
        messageId: incomingMessageId,
        documentId: document.id,
        documentName,
        reason: action.reason,
        code: "trigger_mismatch",
        confidence,
      });
      continue;
    }

    const mediaUrl = await resolveDocumentMediaUrl(document);

    if (!mediaUrl) {
      await logDocumentSkipped(supabase, {
        workspaceId,
        conversationId: conversation.id,
        messageId: incomingMessageId,
        documentId: document.id,
        documentName,
        reason: action.reason,
        code: "missing_media_source",
        confidence,
      });
      continue;
    }

    const stillActive = await aiOwnershipService.shouldAutoReply(
      supabase,
      workspaceId,
      conversation.id,
    );

    if (!stillActive.allowed) {
      await logDocumentSkipped(supabase, {
        workspaceId,
        conversationId: conversation.id,
        messageId: incomingMessageId,
        documentId: document.id,
        documentName,
        reason: stillActive.reason,
        code: "ai_not_active",
        confidence,
      });
      return;
    }

    const documentType = inferDocumentTypeFromRecord(
      document.document_type,
      document.mime_type,
    );
    const mimetype = resolveDocumentMimeType(documentType, document.mime_type);
    const mediatype: WhatsAppMediaType = resolveWhatsAppMediaType(
      documentType,
      document.mime_type,
    );
    const messageType = resolveDocumentMessageType(mediatype);

    await insertAiEvent(supabase, {
      workspaceId,
      conversationId: conversation.id,
      messageId: incomingMessageId,
      eventType: "AI_DOCUMENT_SEND_ATTEMPTED",
      reason: action.reason,
      metadata: {
        documentId: document.id,
        documentName,
        reason: action.reason,
        confidence,
        conversationId: conversation.id,
      },
    });

    logDocumentSend("AI_DOCUMENT_SEND_ATTEMPTED", {
      conversationId: conversation.id,
      documentId: document.id,
      documentName,
      confidence,
    });

    const pending = await insertWhatsappMessage(supabase, {
      conversation_id: conversation.id,
      direction: "outgoing",
      message_type: messageType,
      text: documentName,
      media_url: mediaUrl,
      status: "sending",
      sender_type: "ai",
      timestamp: new Date().toISOString(),
      raw_payload: {
        source: "ai_auto_reply",
        aiAction: "document_send",
        documentId: document.id,
        documentName,
        reason: action.reason,
        confidence,
      } as Json,
    });

    try {
      const result = await sendWhatsAppMedia(
        {
          phoneNumber: conversation.phone_number,
          mediaUrl,
          mediatype,
          mimetype,
          fileName: documentName,
          instanceName: conversation.instance_name,
        },
        conversation.instance_name,
      );

      const sentMessage = await updateWhatsappMessageById(supabase, pending.id, {
        status: "sent",
        external_message_id: result.messageId,
        timestamp: new Date().toISOString(),
      });

      await aiOwnershipService.markAIAction(
        supabase,
        workspaceId,
        conversation.id,
      );

      await insertAiEvent(supabase, {
        workspaceId,
        conversationId: conversation.id,
        messageId: sentMessage.id,
        eventType: "AI_DOCUMENT_SENT",
        reason: action.reason,
        metadata: {
          documentId: document.id,
          documentName,
          reason: action.reason,
          confidence,
          conversationId: conversation.id,
          outgoingMessageId: sentMessage.id,
        },
      });

      logDocumentSend("AI_DOCUMENT_SENT", {
        conversationId: conversation.id,
        documentId: document.id,
        documentName,
        messageId: sentMessage.id,
      });
    } catch (error) {
      await updateWhatsappMessageById(supabase, pending.id, {
        status: "failed",
      }).catch(() => undefined);

      const message = error instanceof Error ? error.message : String(error);

      await insertAiEvent(supabase, {
        workspaceId,
        conversationId: conversation.id,
        messageId: incomingMessageId,
        eventType: "AI_DOCUMENT_FAILED",
        reason: message,
        metadata: {
          documentId: document.id,
          documentName,
          reason: action.reason,
          confidence,
          conversationId: conversation.id,
          error: message,
        },
      });

      logDocumentSend("AI_DOCUMENT_FAILED", {
        conversationId: conversation.id,
        documentId: document.id,
        documentName,
        error: message,
      });
    }
  }
}

/** Manual or Action Engine document send. */
export async function sendManualWhatsappDocument(
  supabase: WhatsappSupabaseClient,
  input: {
    workspaceId: string;
    conversation: WhatsappConversationRow;
    documentId: string;
    sentByUserId: string;
    senderType?: "ai" | "human";
    source?: string;
  },
) {
  const document = await loadBrainDocument(supabase, input.documentId);
  if (!document) {
    throw new Error("Document not found.");
  }

  const belongsToWorkspace = await verifyDocumentWorkspace(
    supabase,
    input.workspaceId,
    document.business_brain_id,
  );
  if (!belongsToWorkspace) {
    throw new Error("Document is not available in this workspace.");
  }

  const documentName = document.name?.trim() || "Document";
  const mediaUrl = await resolveDocumentMediaUrl(document);
  if (!mediaUrl) {
    throw new Error("Document has no file to send.");
  }

  const documentType = inferDocumentTypeFromRecord(
    document.document_type,
    document.mime_type,
  );
  const mimetype = resolveDocumentMimeType(documentType, document.mime_type);
  const mediatype: WhatsAppMediaType = resolveWhatsAppMediaType(
    documentType,
    document.mime_type,
  );
  const messageType = resolveDocumentMessageType(mediatype);

  const senderType = input.senderType ?? "human";
  const source = input.source ?? "ai_command_center";

  const pending = await insertWhatsappMessage(supabase, {
    conversation_id: input.conversation.id,
    direction: "outgoing",
    message_type: messageType,
    text: documentName,
    media_url: mediaUrl,
    status: "sending",
    sender_type: senderType,
    timestamp: new Date().toISOString(),
    raw_payload: {
      source,
      aiAction: "document_send",
      documentId: document.id,
      documentName,
      sentByUserId: input.sentByUserId,
    } as Json,
  });

  try {
    const result = await sendWhatsAppMedia(
      {
        phoneNumber: input.conversation.phone_number,
        mediaUrl,
        mediatype,
        mimetype,
        fileName: documentName,
        instanceName: input.conversation.instance_name,
      },
      input.conversation.instance_name,
    );

    const sentMessage = await updateWhatsappMessageById(supabase, pending.id, {
      status: "sent",
      external_message_id: result.messageId,
      timestamp: new Date().toISOString(),
    });

    await insertAiEvent(supabase, {
      workspaceId: input.workspaceId,
      conversationId: input.conversation.id,
      messageId: sentMessage.id,
      eventType: "AI_DOCUMENT_SENT",
      reason:
        source === "action_engine"
          ? "Sent by Action Engine"
          : "Sent from AI Command Center",
      metadata: {
        documentId: document.id,
        documentName,
        conversationId: input.conversation.id,
        source,
        sentByUserId: input.sentByUserId,
        senderType,
      },
    });

    return sentMessage;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await updateWhatsappMessageById(supabase, pending.id, {
      status: "failed",
    });
    throw new Error(message);
  }
}
