import {
  insertWorkspaceAssignmentEvent,
} from "@/lib/workspace/assignment-events";
import { parseOmnichannelConversationStatus } from "@/lib/omnichannel-inbox/constants";
import { parseWhatsappManualAiState } from "@/lib/whatsapp-inbox/ai/constants";
import { aiOwnershipService } from "@/lib/whatsapp-inbox/ai/ownership-service";
import {
  findWhatsappConversationById,
  insertWhatsappConversationNote,
  updateWhatsappConversationById,
  type WhatsappSupabaseClient,
} from "@/lib/whatsapp-inbox/repository";
import type { WhatsappConversationNoteRow } from "@/types/whatsapp-inbox";

export class WhatsappInboxError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WhatsappInboxError";
  }
}

async function requireWhatsappConversation(
  supabase: WhatsappSupabaseClient,
  workspaceId: string,
  conversationId: string,
) {
  const conversation = await findWhatsappConversationById(
    supabase,
    workspaceId,
    conversationId,
  );

  if (!conversation) {
    throw new WhatsappInboxError("Conversation tidak ditemukan.");
  }

  return conversation;
}

export async function assignWhatsappConversation(
  supabase: WhatsappSupabaseClient,
  workspaceId: string,
  conversationId: string,
  assignedUserId: string | null,
  assignedBy?: string,
) {
  const conversation = await requireWhatsappConversation(
    supabase,
    workspaceId,
    conversationId,
  );

  const updated = await updateWhatsappConversationById(
    supabase,
    workspaceId,
    conversationId,
    { assigned_user_id: assignedUserId },
  );

  if (assignedBy) {
    await insertWorkspaceAssignmentEvent(supabase, {
      organizationId: workspaceId,
      conversationChannel: "whatsapp",
      conversationId,
      assignedFrom: conversation.assigned_user_id,
      assignedTo: assignedUserId,
      assignedBy,
    });
  }

  return updated;
}

export async function updateWhatsappConversationStatus(
  supabase: WhatsappSupabaseClient,
  workspaceId: string,
  conversationId: string,
  status: string,
) {
  const parsedStatus = parseOmnichannelConversationStatus(status);

  if (!parsedStatus) {
    throw new WhatsappInboxError("Status conversation tidak valid.");
  }

  await requireWhatsappConversation(supabase, workspaceId, conversationId);

  return updateWhatsappConversationById(
    supabase,
    workspaceId,
    conversationId,
    { status: parsedStatus },
  );
}

export async function updateWhatsappConversationAiState(
  supabase: WhatsappSupabaseClient,
  workspaceId: string,
  conversationId: string,
  aiState: string,
  options: {
    handoffReason?: string | null;
    userId?: string | null;
  } = {},
) {
  const parsedState = parseWhatsappManualAiState(aiState);

  if (!parsedState) {
    throw new WhatsappInboxError("Status AI conversation tidak valid.");
  }

  return aiOwnershipService.updateConversationAIState(
    supabase,
    workspaceId,
    conversationId,
    parsedState,
    {
      handoffReason: options.handoffReason,
      changedBy: "user",
      userId: options.userId ?? null,
    },
  );
}

export async function addWhatsappConversationNote(
  supabase: WhatsappSupabaseClient,
  workspaceId: string,
  input: {
    conversationId: string;
    note: string;
    createdBy: string;
  },
): Promise<WhatsappConversationNoteRow> {
  const trimmedNote = input.note.trim();

  if (!trimmedNote) {
    throw new WhatsappInboxError("Catatan wajib diisi.");
  }

  await requireWhatsappConversation(
    supabase,
    workspaceId,
    input.conversationId,
  );

  return insertWhatsappConversationNote(supabase, {
    conversation_id: input.conversationId,
    note: trimmedNote,
    created_by: input.createdBy,
  });
}
