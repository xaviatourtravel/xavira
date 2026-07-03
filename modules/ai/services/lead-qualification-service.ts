import type {
  ConversationMemoryMap,
  ConversationMemoryPromptItem,
} from "@/modules/ai/types/memory";
import { getMemoryValue, getPromptMemoryValue } from "@/modules/ai/types/memory";
import type {
  LeadQualificationFieldKey,
  LeadQualificationFieldValues,
  LeadQualificationRecord,
  LeadQualificationSnapshot,
  QualificationStatus,
} from "@/modules/ai/types/lead-qualification";
import {
  deriveQualificationStatus,
  LEAD_QUALIFICATION_FIELD_RULES,
} from "@/modules/ai/types/lead-qualification";
import { resolveWhatsappAiState } from "@/lib/whatsapp-inbox/ai/constants";
import type { WhatsappConversationRow } from "@/types/whatsapp-inbox";
import type { WhatsappSupabaseClient } from "@/lib/whatsapp-inbox/repository";
import { insertAiEvent } from "@/lib/whatsapp-inbox/ai/event-log";

type LeadQualificationRow = {
  id: string;
  workspace_id: string;
  conversation_id: string;
  customer_id: string | null;
  destination: string | null;
  departure_month: string | null;
  departure_date: string | null;
  passenger_count: string | null;
  budget: string | null;
  trip_type: string | null;
  special_request: string | null;
  completion_score: number;
  qualification_status: string;
  last_ai_question: string | null;
  created_at: string;
  updated_at: string;
};

export type UpdateLeadQualificationInput = {
  workspaceId: string;
  conversationId: string;
  customerId?: string | null;
  messageId?: string | null;
  memory?: ConversationMemoryMap;
  memoryItems?: ConversationMemoryPromptItem[];
  lastAiQuestion?: string | null;
};

function mapRowToRecord(row: LeadQualificationRow): LeadQualificationRecord {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    conversationId: row.conversation_id,
    customerId: row.customer_id,
    destination: row.destination,
    departure_month: row.departure_month,
    departure_date: row.departure_date,
    passenger_count: row.passenger_count,
    budget: row.budget,
    trip_type: row.trip_type,
    special_request: row.special_request,
    completionScore: row.completion_score,
    qualificationStatus: row.qualification_status as QualificationStatus,
    lastAiQuestion: row.last_ai_question,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function memoryMapToFieldValues(memory: ConversationMemoryMap): LeadQualificationFieldValues {
  return {
    destination: getMemoryValue(memory, "destination"),
    departure_month: getMemoryValue(memory, "departure_month"),
    departure_date: getMemoryValue(memory, "departure_date"),
    passenger_count: getMemoryValue(memory, "passenger_count"),
    budget: getMemoryValue(memory, "budget"),
    trip_type: getMemoryValue(memory, "trip_type"),
    special_request: getMemoryValue(memory, "special_request"),
  };
}

function promptItemsToFieldValues(
  items: ConversationMemoryPromptItem[],
): LeadQualificationFieldValues {
  return {
    destination: getPromptMemoryValue(items, "destination"),
    departure_month: getPromptMemoryValue(items, "departure_month"),
    departure_date: getPromptMemoryValue(items, "departure_date"),
    passenger_count: getPromptMemoryValue(items, "passenger_count"),
    budget: getPromptMemoryValue(items, "budget"),
    trip_type: getPromptMemoryValue(items, "trip_type"),
    special_request: getPromptMemoryValue(items, "special_request"),
  };
}

function buildSnapshot(
  fields: LeadQualificationFieldValues,
  lastAiQuestion: string | null = null,
): LeadQualificationSnapshot {
  const fieldProgress = LEAD_QUALIFICATION_FIELD_RULES.map((rule) => ({
    key: rule.key,
    label: rule.label,
    completed: rule.isComplete(fields),
    value: rule.getValue(fields),
    weight: rule.weight,
  }));

  const completionScore = fieldProgress.reduce(
    (total, field) => total + (field.completed ? field.weight : 0),
    0,
  );

  const missingFields = fieldProgress
    .filter((field) => !field.completed)
    .map((field) => field.key);

  const nextMissingField = missingFields[0] ?? null;
  const nextRule = LEAD_QUALIFICATION_FIELD_RULES.find(
    (rule) => rule.key === nextMissingField,
  );

  return {
    completionScore,
    qualificationStatus: deriveQualificationStatus(completionScore),
    missingFields,
    nextMissingField,
    nextQuestion: nextRule?.question ?? null,
    fieldProgress,
    fields,
    lastAiQuestion,
  };
}

export const leadQualificationService = {
  calculateCompletion(fields: LeadQualificationFieldValues): LeadQualificationSnapshot {
    return buildSnapshot(fields);
  },

  getMissingFields(fields: LeadQualificationFieldValues): LeadQualificationFieldKey[] {
    return buildSnapshot(fields).missingFields;
  },

  fieldsFromMemory(memory: ConversationMemoryMap): LeadQualificationFieldValues {
    return memoryMapToFieldValues(memory);
  },

  fieldsFromPromptItems(items: ConversationMemoryPromptItem[]): LeadQualificationFieldValues {
    return promptItemsToFieldValues(items);
  },

  snapshotFromMemory(
    memory: ConversationMemoryMap,
    lastAiQuestion?: string | null,
  ): LeadQualificationSnapshot {
    return buildSnapshot(memoryMapToFieldValues(memory), lastAiQuestion ?? null);
  },

  snapshotFromPromptItems(
    items: ConversationMemoryPromptItem[],
    lastAiQuestion?: string | null,
  ): LeadQualificationSnapshot {
    return buildSnapshot(promptItemsToFieldValues(items), lastAiQuestion ?? null);
  },

  async getQualification(
    supabase: WhatsappSupabaseClient,
    conversationId: string,
  ): Promise<LeadQualificationSnapshot | null> {
    const { data, error } = await supabase
      .from("lead_qualification")
      .select(
        "id, workspace_id, conversation_id, customer_id, destination, departure_month, departure_date, passenger_count, budget, trip_type, special_request, completion_score, qualification_status, last_ai_question, created_at, updated_at",
      )
      .eq("conversation_id", conversationId)
      .maybeSingle();

    if (error || !data) {
      if (error) {
        console.error("[WA_AI] failed to load lead qualification", {
          conversationId,
          error: error.message,
        });
      }
      return null;
    }

    const record = mapRowToRecord(data as LeadQualificationRow);
    return buildSnapshot(
      {
        destination: record.destination,
        departure_month: record.departure_month,
        departure_date: record.departure_date,
        passenger_count: record.passenger_count,
        budget: record.budget,
        trip_type: record.trip_type,
        special_request: record.special_request,
      },
      record.lastAiQuestion,
    );
  },

  async updateQualification(
    supabase: WhatsappSupabaseClient,
    input: UpdateLeadQualificationInput,
  ): Promise<LeadQualificationSnapshot> {
    const fields = input.memoryItems
      ? promptItemsToFieldValues(input.memoryItems)
      : memoryMapToFieldValues(input.memory ?? {});

    const snapshot = buildSnapshot(fields, input.lastAiQuestion ?? null);

    const { error } = await supabase.from("lead_qualification").upsert(
      {
        workspace_id: input.workspaceId,
        conversation_id: input.conversationId,
        customer_id: input.customerId ?? null,
        destination: fields.destination,
        departure_month: fields.departure_month,
        departure_date: fields.departure_date,
        passenger_count: fields.passenger_count,
        budget: fields.budget,
        trip_type: fields.trip_type,
        special_request: fields.special_request,
        completion_score: snapshot.completionScore,
        qualification_status: snapshot.qualificationStatus,
        last_ai_question: snapshot.nextQuestion,
      },
      { onConflict: "conversation_id" },
    );

    if (error) {
      console.error("[WA_AI] failed to update lead qualification", {
        conversationId: input.conversationId,
        error: error.message,
      });
    } else {
      await insertAiEvent(supabase, {
        workspaceId: input.workspaceId,
        conversationId: input.conversationId,
        messageId: input.messageId ?? null,
        eventType: "LEAD_QUALIFICATION_UPDATED",
        metadata: {
          completionScore: snapshot.completionScore,
          qualificationStatus: snapshot.qualificationStatus,
          missingFields: snapshot.missingFields,
          nextMissingField: snapshot.nextMissingField,
        },
      });

      console.log("[WA_AI] lead qualification updated", {
        conversationId: input.conversationId,
        completionScore: snapshot.completionScore,
        qualificationStatus: snapshot.qualificationStatus,
        missingFields: snapshot.missingFields,
      });
    }

    return snapshot;
  },

  shouldTriggerQualificationHandoff(
    conversation: Pick<WhatsappConversationRow, "ai_state">,
    snapshot: Pick<LeadQualificationSnapshot, "qualificationStatus">,
  ): boolean {
    const state = resolveWhatsappAiState(conversation.ai_state);

    if (state !== "AI_ACTIVE") {
      return false;
    }

    return snapshot.qualificationStatus === "HANDOVER_READY";
  },
};
