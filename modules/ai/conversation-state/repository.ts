import type { WhatsappSupabaseClient } from "@/lib/whatsapp-inbox/repository";
import type { CatalogContext, SelectedEntity } from "@/modules/ai/response-planner/types";
import {
  CONVERSATION_PHASES,
  type CollectedInformationMap,
  type ConversationAiStateRecord,
  type ConversationPhase,
  type QuestionSemanticKey,
} from "@/modules/ai/conversation-state/types";

type ConversationAiStateRow = {
  id: string;
  workspace_id: string;
  conversation_id: string;
  greeting_sent: boolean;
  business_introduction_sent: boolean;
  customer_name: string | null;
  current_intent: string | null;
  current_phase: string;
  qualification_stage: string | null;
  collected_information: CollectedInformationMap;
  questions_asked: QuestionSemanticKey[];
  selected_entity: SelectedEntity | null;
  catalog_context: CatalogContext | null;
  handoff_requested: boolean;
  handoff_reason: string | null;
  handoff_at: string | null;
  ai_paused: boolean;
  last_ai_reply_at: string | null;
  last_customer_message_at: string | null;
  last_state_transition_at: string;
  state_version: number;
  created_at: string;
  updated_at: string;
};

function isConversationPhase(value: string): value is ConversationPhase {
  return (CONVERSATION_PHASES as readonly string[]).includes(value);
}

function mapRow(row: ConversationAiStateRow): ConversationAiStateRecord {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    conversationId: row.conversation_id,
    greetingSent: row.greeting_sent,
    businessIntroductionSent: row.business_introduction_sent,
    customerName: row.customer_name,
    currentIntent: row.current_intent,
    currentPhase: isConversationPhase(row.current_phase) ? row.current_phase : "ENGAGED",
    qualificationStage: row.qualification_stage,
    collectedInformation: row.collected_information ?? {},
    questionsAsked: Array.isArray(row.questions_asked) ? row.questions_asked : [],
    selectedEntity: row.selected_entity ?? null,
    catalogContext: row.catalog_context ?? null,
    handoffRequested: row.handoff_requested,
    handoffReason: row.handoff_reason,
    handoffAt: row.handoff_at,
    aiPaused: row.ai_paused,
    lastAiReplyAt: row.last_ai_reply_at,
    lastCustomerMessageAt: row.last_customer_message_at,
    lastStateTransitionAt: row.last_state_transition_at,
    stateVersion: row.state_version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const SELECT_COLUMNS =
  "id, workspace_id, conversation_id, greeting_sent, business_introduction_sent, customer_name, current_intent, current_phase, qualification_stage, collected_information, questions_asked, selected_entity, catalog_context, handoff_requested, handoff_reason, handoff_at, ai_paused, last_ai_reply_at, last_customer_message_at, last_state_transition_at, state_version, created_at, updated_at";

export const conversationAiStateRepository = {
  async findByConversation(
    supabase: WhatsappSupabaseClient,
    workspaceId: string,
    conversationId: string,
  ): Promise<ConversationAiStateRecord | null> {
    const { data, error } = await supabase
      .from("conversation_ai_state")
      .select(SELECT_COLUMNS)
      .eq("workspace_id", workspaceId)
      .eq("conversation_id", conversationId)
      .maybeSingle();

    if (error) {
      console.error("[WA_AI] failed to load conversation ai state", {
        workspaceId,
        conversationId,
        error: error.message,
      });
      return null;
    }

    if (!data) return null;
    return mapRow(data as ConversationAiStateRow);
  },

  async upsert(
    supabase: WhatsappSupabaseClient,
    input: Omit<
      ConversationAiStateRecord,
      "id" | "createdAt" | "updatedAt" | "lastStateTransitionAt"
    > & {
      id?: string;
      lastStateTransitionAt?: string;
    },
  ): Promise<ConversationAiStateRecord | null> {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("conversation_ai_state")
      .upsert(
        {
          id: input.id,
          workspace_id: input.workspaceId,
          conversation_id: input.conversationId,
          greeting_sent: input.greetingSent,
          business_introduction_sent: input.businessIntroductionSent,
          customer_name: input.customerName,
          current_intent: input.currentIntent,
          current_phase: input.currentPhase,
          qualification_stage: input.qualificationStage,
          collected_information: input.collectedInformation,
          questions_asked: input.questionsAsked,
          selected_entity: input.selectedEntity,
          catalog_context: input.catalogContext,
          handoff_requested: input.handoffRequested,
          handoff_reason: input.handoffReason,
          handoff_at: input.handoffAt,
          ai_paused: input.aiPaused,
          last_ai_reply_at: input.lastAiReplyAt,
          last_customer_message_at: input.lastCustomerMessageAt,
          last_state_transition_at: input.lastStateTransitionAt ?? now,
          state_version: input.stateVersion,
        },
        { onConflict: "workspace_id,conversation_id" },
      )
      .select(SELECT_COLUMNS)
      .single();

    if (error || !data) {
      console.error("[WA_AI] failed to upsert conversation ai state", {
        workspaceId: input.workspaceId,
        conversationId: input.conversationId,
        error: error?.message,
      });
      return null;
    }

    return mapRow(data as ConversationAiStateRow);
  },
};
