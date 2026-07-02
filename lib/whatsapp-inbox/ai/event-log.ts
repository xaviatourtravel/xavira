import type { Json } from "@/types/database";
import type { WhatsappSupabaseClient } from "@/lib/whatsapp-inbox/repository";
import type { AiEventType } from "@/lib/whatsapp-inbox/ai/types";

export type InsertAiEventInput = {
  workspaceId: string;
  conversationId: string;
  messageId?: string | null;
  eventType: AiEventType;
  intent?: string | null;
  confidence?: number | null;
  previousState?: string | null;
  nextState?: string | null;
  reason?: string | null;
  metadata?: Record<string, unknown>;
};

export async function insertAiEvent(
  supabase: WhatsappSupabaseClient,
  input: InsertAiEventInput,
) {
  const { data, error } = await supabase
    .from("ai_events")
    .insert({
      workspace_id: input.workspaceId,
      conversation_id: input.conversationId,
      message_id: input.messageId ?? null,
      event_type: input.eventType,
      intent: input.intent ?? null,
      confidence: input.confidence ?? null,
      previous_state: input.previousState ?? null,
      next_state: input.nextState ?? null,
      reason: input.reason ?? null,
      metadata: (input.metadata ?? {}) as Json,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[WA_AI] failed to insert ai_event", {
      eventType: input.eventType,
      conversationId: input.conversationId,
      error: error.message,
    });
    return null;
  }

  return data.id as string;
}
