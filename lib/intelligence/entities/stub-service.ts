import type { EntityExtractionService } from "@/lib/intelligence/entities/service";
import type { ConversationContext } from "@/lib/intelligence/context/types";
import type { CustomerMemory } from "@/lib/intelligence/memory/types";
import type { IntentAnalysis } from "@/lib/intelligence/intent/types";
import type { ExtractedEntities, EntityField } from "@/lib/intelligence/entities/types";
import { ENTITY_FIELD_LABELS } from "@/lib/intelligence/entities/types";
import {
  detectTravelHints,
  hashString,
} from "@/lib/intelligence/stub/travel-heuristics";

export class StubEntityExtractionService implements EntityExtractionService {
  extract(
    context: ConversationContext,
    _memory: CustomerMemory,
    _intent: IntentAnalysis | null,
  ): ExtractedEntities {
    const text = context.lastIncomingText ?? "";
    const seed = hashString(context.conversationId);
    const hints = detectTravelHints(text, seed);

    const fields: EntityField[] = [
      {
        field: "name",
        label: ENTITY_FIELD_LABELS.name,
        value: context.customerName,
        confidence: "high",
      },
      {
        field: "destination",
        label: ENTITY_FIELD_LABELS.destination,
        value: hints.destination,
        confidence: text ? "medium" : "low",
      },
      {
        field: "departure",
        label: ENTITY_FIELD_LABELS.departure,
        value: null,
        confidence: "low",
      },
      {
        field: "pax",
        label: ENTITY_FIELD_LABELS.pax,
        value: hints.pax,
        confidence: "medium",
      },
      {
        field: "budget",
        label: ENTITY_FIELD_LABELS.budget,
        value: hints.budget,
        confidence: text.includes("harga") ? "high" : "medium",
      },
      {
        field: "city",
        label: ENTITY_FIELD_LABELS.city,
        value: hints.city,
        confidence: "low",
      },
      {
        field: "phone",
        label: ENTITY_FIELD_LABELS.phone,
        value: context.phone,
        confidence: context.phone ? "high" : "low",
      },
      {
        field: "email",
        label: ENTITY_FIELD_LABELS.email,
        value: null,
        confidence: "low",
      },
    ];

    return { fields };
  }
}
