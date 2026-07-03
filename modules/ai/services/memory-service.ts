import {
  extractMemoryFromMessage,
  extractMemoryFromMessages,
} from "@/modules/ai/services/memory-extractor";
import type {
  ConversationMemoryEntry,
  ConversationMemoryKey,
  ConversationMemoryMap,
  ConversationMemorySource,
  ExtractedMemoryItem,
} from "@/modules/ai/types/memory";
import { isConversationMemoryKey } from "@/modules/ai/types/memory";
import { CONVERSATION_MEMORY_KEYS } from "@/modules/ai/types/memory";
import type { WhatsappSupabaseClient } from "@/lib/whatsapp-inbox/repository";
import { insertAiEvent } from "@/lib/whatsapp-inbox/ai/event-log";

type ConversationMemoryRow = {
  id: string;
  workspace_id: string;
  conversation_id: string;
  customer_id: string | null;
  memory_key: string;
  memory_value: string;
  confidence: number;
  source: string;
  created_at: string;
  updated_at: string;
};

export type SaveMemoryInput = {
  workspaceId: string;
  conversationId: string;
  customerId?: string | null;
  memoryKey: ConversationMemoryKey;
  memoryValue: string;
  confidence?: number;
  source?: ConversationMemorySource;
  messageId?: string | null;
};

export type ExtractAndSaveFromMessageInput = {
  workspaceId: string;
  conversationId: string;
  customerId?: string | null;
  messageText: string;
  messageId?: string | null;
  productDestinations?: string[];
};

export type ExtractAndPersistMemoryInput = {
  workspaceId: string;
  conversationId: string;
  customerId?: string | null;
  customerMessage: string;
  aiReply?: string | null;
  messageId?: string | null;
  productDestinations?: string[];
};

function mapMemoryRow(row: ConversationMemoryRow): ConversationMemoryEntry {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    conversationId: row.conversation_id,
    customerId: row.customer_id,
    memoryKey: row.memory_key as ConversationMemoryKey,
    memoryValue: row.memory_value,
    confidence: Number(row.confidence),
    source: row.source as ConversationMemorySource,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toMemoryMap(rows: ConversationMemoryRow[]): ConversationMemoryMap {
  const map: ConversationMemoryMap = {};

  for (const row of rows) {
    if (!isConversationMemoryKey(row.memory_key)) continue;
    map[row.memory_key] = mapMemoryRow(row);
  }

  return map;
}

async function logMemoryEvent(
  supabase: WhatsappSupabaseClient,
  input: {
    workspaceId: string;
    conversationId: string;
    messageId?: string | null;
    eventType:
      | "MEMORY_CREATED"
      | "MEMORY_UPDATED"
      | "MEMORY_USED"
      | "MEMORY_EXTRACTION_STARTED"
      | "MEMORY_EXTRACTION_COMPLETED"
      | "MEMORY_EXTRACTION_SKIPPED";
    memoryKey?: ConversationMemoryKey;
    memoryValue?: string;
    metadata?: Record<string, unknown>;
  },
) {
  await insertAiEvent(supabase, {
    workspaceId: input.workspaceId,
    conversationId: input.conversationId,
    messageId: input.messageId ?? null,
    eventType: input.eventType,
    metadata: {
      memoryKey: input.memoryKey,
      memoryValue: input.memoryValue,
      ...input.metadata,
    },
  });

  console.log("[WA_AI] memory event", {
    eventType: input.eventType,
    conversationId: input.conversationId,
    memoryKey: input.memoryKey,
  });
}

export const memoryService = {
  async getMemory(
    supabase: WhatsappSupabaseClient,
    conversationId: string,
  ): Promise<ConversationMemoryMap> {
    const { data, error } = await supabase
      .from("conversation_memory")
      .select(
        "id, workspace_id, conversation_id, customer_id, memory_key, memory_value, confidence, source, created_at, updated_at",
      )
      .eq("conversation_id", conversationId);

    if (error) {
      console.error("[WA_AI] failed to load conversation memory", {
        conversationId,
        error: error.message,
      });
      return {};
    }

    return toMemoryMap((data ?? []) as ConversationMemoryRow[]);
  },

  async saveMemory(
    supabase: WhatsappSupabaseClient,
    input: SaveMemoryInput,
  ): Promise<ConversationMemoryEntry | null> {
    const trimmedValue = input.memoryValue.trim();
    if (!trimmedValue) return null;

    const newConfidence = input.confidence ?? 0.85;
    const existing = await this.getMemory(supabase, input.conversationId);
    const previous = existing[input.memoryKey];

    if (previous && previous.confidence > newConfidence) {
      return previous;
    }

    if (
      previous &&
      previous.confidence === newConfidence &&
      previous.memoryValue === trimmedValue
    ) {
      return previous;
    }

    const { data, error } = await supabase
      .from("conversation_memory")
      .upsert(
        {
          workspace_id: input.workspaceId,
          conversation_id: input.conversationId,
          customer_id: input.customerId ?? null,
          memory_key: input.memoryKey,
          memory_value: trimmedValue,
          confidence: newConfidence,
          source: input.source ?? "customer_message",
        },
        { onConflict: "conversation_id,memory_key" },
      )
      .select(
        "id, workspace_id, conversation_id, customer_id, memory_key, memory_value, confidence, source, created_at, updated_at",
      )
      .single();

    if (error || !data) {
      console.error("[WA_AI] failed to save conversation memory", {
        conversationId: input.conversationId,
        memoryKey: input.memoryKey,
        error: error?.message,
      });
      return null;
    }

    const entry = mapMemoryRow(data as ConversationMemoryRow);

    await logMemoryEvent(supabase, {
      workspaceId: input.workspaceId,
      conversationId: input.conversationId,
      messageId: input.messageId ?? null,
      eventType: previous ? "MEMORY_UPDATED" : "MEMORY_CREATED",
      memoryKey: input.memoryKey,
      memoryValue: trimmedValue,
      metadata: {
        previousValue: previous?.memoryValue ?? null,
        confidence: entry.confidence,
        source: entry.source,
      },
    });

    return entry;
  },

  async updateMemory(
    supabase: WhatsappSupabaseClient,
    input: SaveMemoryInput,
  ): Promise<ConversationMemoryEntry | null> {
    return this.saveMemory(supabase, input);
  },

  async deleteMemory(
    supabase: WhatsappSupabaseClient,
    conversationId: string,
    memoryKey: ConversationMemoryKey,
  ): Promise<boolean> {
    const { error } = await supabase
      .from("conversation_memory")
      .delete()
      .eq("conversation_id", conversationId)
      .eq("memory_key", memoryKey);

    if (error) {
      console.error("[WA_AI] failed to delete conversation memory", {
        conversationId,
        memoryKey,
        error: error.message,
      });
      return false;
    }

    return true;
  },

  async clearMemory(
    supabase: WhatsappSupabaseClient,
    conversationId: string,
  ): Promise<boolean> {
    const { error } = await supabase
      .from("conversation_memory")
      .delete()
      .eq("conversation_id", conversationId);

    if (error) {
      console.error("[WA_AI] failed to clear conversation memory", {
        conversationId,
        error: error.message,
      });
      return false;
    }

    return true;
  },

  async logMemoryUsed(
    supabase: WhatsappSupabaseClient,
    input: {
      workspaceId: string;
      conversationId: string;
      messageId?: string | null;
      memory: ConversationMemoryMap;
    },
  ) {
    const keys = CONVERSATION_MEMORY_KEYS.filter((key) => Boolean(input.memory[key]));

    if (keys.length === 0) {
      return;
    }

    await logMemoryEvent(supabase, {
      workspaceId: input.workspaceId,
      conversationId: input.conversationId,
      messageId: input.messageId ?? null,
      eventType: "MEMORY_USED",
      metadata: {
        memoryKeys: keys,
        memoryCount: keys.length,
      },
    });
  },

  async extractAndSaveFromMessage(
    supabase: WhatsappSupabaseClient,
    input: ExtractAndSaveFromMessageInput,
  ): Promise<ConversationMemoryMap> {
    await logMemoryEvent(supabase, {
      workspaceId: input.workspaceId,
      conversationId: input.conversationId,
      messageId: input.messageId ?? null,
      eventType: "MEMORY_EXTRACTION_STARTED",
      metadata: {
        messagePreview: input.messageText.slice(0, 120),
      },
    });

    const extraction = extractMemoryFromMessage(
      {
        messageText: input.messageText,
        conversationId: input.conversationId,
        workspaceId: input.workspaceId,
        customerId: input.customerId,
      },
      { productDestinations: input.productDestinations },
    );

    if (extraction.memories.length === 0) {
      await logMemoryEvent(supabase, {
        workspaceId: input.workspaceId,
        conversationId: input.conversationId,
        messageId: input.messageId ?? null,
        eventType: "MEMORY_EXTRACTION_SKIPPED",
        metadata: {
          reason: "no_memories_extracted",
        },
      });
      return this.getMemory(supabase, input.conversationId);
    }

    for (const memory of extraction.memories) {
      if (!isConversationMemoryKey(memory.key)) continue;

      await this.saveMemory(supabase, {
        workspaceId: input.workspaceId,
        conversationId: input.conversationId,
        customerId: input.customerId,
        memoryKey: memory.key,
        memoryValue: memory.value,
        confidence: memory.confidence,
        source: memory.source,
        messageId: input.messageId,
      });
    }

    const savedMemory = await this.getMemory(supabase, input.conversationId);

    await logMemoryEvent(supabase, {
      workspaceId: input.workspaceId,
      conversationId: input.conversationId,
      messageId: input.messageId ?? null,
      eventType: "MEMORY_EXTRACTION_COMPLETED",
      metadata: {
        extractedCount: extraction.memories.length,
        memoryKeys: extraction.memories.map((memory) => memory.key),
        savedKeys: extraction.memories
          .map((memory) => memory.key)
          .filter((key) => Boolean(savedMemory[key as ConversationMemoryKey])),
      },
    });

    return savedMemory;
  },

  async extractAndPersistMemory(
    supabase: WhatsappSupabaseClient,
    input: ExtractAndPersistMemoryInput,
  ): Promise<ConversationMemoryMap> {
    const extracted = extractMemoryFromMessages({
      customerMessage: input.customerMessage,
      aiReply: input.aiReply,
      productDestinations: input.productDestinations,
    });

    if (extracted.length === 0) {
      return this.getMemory(supabase, input.conversationId);
    }

    for (const item of extracted) {
      await this.saveMemory(supabase, {
        workspaceId: input.workspaceId,
        conversationId: input.conversationId,
        customerId: input.customerId,
        memoryKey: item.memoryKey,
        memoryValue: item.memoryValue,
        confidence: item.confidence,
        source: item.source,
        messageId: input.messageId,
      });
    }

    return this.getMemory(supabase, input.conversationId);
  },

  mergeExtractedMemory(
    current: ConversationMemoryMap,
    extracted: ExtractedMemoryItem[],
  ): ConversationMemoryMap {
    const merged: ConversationMemoryMap = { ...current };

    for (const item of extracted) {
      const existing = merged[item.memoryKey];
      if (existing && existing.confidence > item.confidence) {
        continue;
      }

      merged[item.memoryKey] = {
        id: existing?.id ?? `session-${item.memoryKey}`,
        workspaceId: existing?.workspaceId ?? "playground",
        conversationId: existing?.conversationId ?? "playground",
        customerId: existing?.customerId ?? null,
        memoryKey: item.memoryKey,
        memoryValue: item.memoryValue,
        confidence: item.confidence,
        source: item.source,
        createdAt: existing?.createdAt ?? new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    return merged;
  },
};
