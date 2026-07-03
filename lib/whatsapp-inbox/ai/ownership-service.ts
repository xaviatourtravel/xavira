import { resolveWhatsappAiState } from "@/lib/whatsapp-inbox/ai/constants";
import { insertAiEvent } from "@/lib/whatsapp-inbox/ai/event-log";
import type {
  AiStateUpdateOptions,
  ShouldAutoReplyResult,
  WhatsappAiState,
} from "@/lib/whatsapp-inbox/ai/types";
import {
  findWhatsappConversationById,
  updateWhatsappConversationById,
  type WhatsappSupabaseClient,
} from "@/lib/whatsapp-inbox/repository";
import type { WhatsappConversationRow } from "@/types/whatsapp-inbox";

function resolveAiState(
  conversation: WhatsappConversationRow,
): WhatsappAiState {
  return resolveWhatsappAiState(conversation.ai_state);
}

export const aiOwnershipService = {
  async getConversationAIState(
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
      return null;
    }

    return {
      state: resolveAiState(conversation),
      handoffReason: conversation.ai_handoff_reason,
      lastActionAt: conversation.ai_last_action_at,
      conversation,
    };
  },

  async updateConversationAIState(
    supabase: WhatsappSupabaseClient,
    workspaceId: string,
    conversationId: string,
    state: WhatsappAiState,
    options: AiStateUpdateOptions = {},
  ) {
    const conversation = await findWhatsappConversationById(
      supabase,
      workspaceId,
      conversationId,
    );

    if (!conversation) {
      throw new Error("Conversation tidak ditemukan.");
    }

    const previousState = resolveAiState(conversation);
    const patch: {
      ai_state: WhatsappAiState;
      ai_handoff_reason?: string | null;
    } = {
      ai_state: state,
    };

    if (state === "READY_FOR_HUMAN") {
      patch.ai_handoff_reason =
        options.handoffReason?.trim() || "Dialihkan ke tim";
    } else {
      patch.ai_handoff_reason = null;
    }

    const updated = await updateWhatsappConversationById(
      supabase,
      workspaceId,
      conversationId,
      patch,
    );

    await insertAiEvent(supabase, {
      workspaceId,
      conversationId,
      eventType: "AI_STATE_CHANGED",
      previousState,
      nextState: state,
      reason: options.handoffReason ?? null,
      metadata: {
        previousState,
        nextState: state,
        changedBy: options.changedBy ?? "system",
        userId: options.userId ?? null,
        source: options.source ?? "system",
      },
    });

    return updated;
  },

  /**
   * Auto-reply is allowed only when conversation.ai_state === "AI_ACTIVE".
   * Workspace settings, cooldowns, and recent human replies do not override this.
   */
  async shouldAutoReply(
    supabase: WhatsappSupabaseClient,
    workspaceId: string,
    conversationId: string,
  ): Promise<ShouldAutoReplyResult> {
    const conversation = await findWhatsappConversationById(
      supabase,
      workspaceId,
      conversationId,
    );

    if (!conversation) {
      return {
        allowed: false,
        reason: "Conversation tidak ditemukan",
        code: "conversation_not_found",
      };
    }

    const state = resolveAiState(conversation);

    if (state !== "AI_ACTIVE") {
      return {
        allowed: false,
        reason: "AI auto-reply is not enabled for this conversation",
        code: "ai_not_active",
        conversation,
      };
    }

    return { allowed: true, conversation };
  },

  async markAIAction(
    supabase: WhatsappSupabaseClient,
    workspaceId: string,
    conversationId: string,
  ) {
    return updateWhatsappConversationById(
      supabase,
      workspaceId,
      conversationId,
      { ai_last_action_at: new Date().toISOString() },
    );
  },
};
