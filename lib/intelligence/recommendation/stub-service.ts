import type { RecommendationService } from "@/lib/intelligence/recommendation/service";
import type { ConversationContext } from "@/lib/intelligence/context/types";
import type { CustomerMemory } from "@/lib/intelligence/memory/types";
import type { IntentAnalysis } from "@/lib/intelligence/intent/types";
import type { ExtractedEntities } from "@/lib/intelligence/entities/types";
import type { EmotionAnalysis } from "@/lib/intelligence/emotion/types";
import type {
  Recommendation,
  RecommendationSet,
} from "@/lib/intelligence/recommendation/types";
import { RECOMMENDATION_LABELS } from "@/lib/intelligence/recommendation/types";
import {
  buildSuggestedReply,
  detectTravelHints,
  hashString,
} from "@/lib/intelligence/stub/travel-heuristics";

export class StubRecommendationService implements RecommendationService {
  generate(
    context: ConversationContext,
    _memory: CustomerMemory,
    intent: IntentAnalysis | null,
    entities: ExtractedEntities,
    emotion: EmotionAnalysis | null,
  ): RecommendationSet {
    const text = context.lastIncomingText ?? "";
    const seed = hashString(context.conversationId);
    const hints = detectTravelHints(text, seed);
    const destination =
      entities.fields.find((field) => field.field === "destination")?.value ??
      hints.destination;

    const items: Recommendation[] = [
      {
        action: "suggested_reply",
        label: RECOMMENDATION_LABELS.suggested_reply,
        priority: "primary",
        content: buildSuggestedReply(context, hints),
        rationale: "Draft response aligned with detected intent and budget signals.",
      },
      {
        action: "follow_up",
        label: RECOMMENDATION_LABELS.follow_up,
        priority: "secondary",
        content: `Follow up in 24h if no reply — ask departure date for ${destination}.`,
        rationale: "Maintains momentum on warm inquiry.",
      },
      {
        action: "quotation",
        label: RECOMMENDATION_LABELS.quotation,
        priority: "secondary",
        content: `Prepare quotation for ${hints.pax} pax · ${destination}.`,
        rationale: intent?.primary === "price_inquiry" ? "Customer asked about pricing." : null,
      },
    ];

    if (!context.hasLinkedLead) {
      items.push({
        action: "create_lead",
        label: RECOMMENDATION_LABELS.create_lead,
        priority: "secondary",
        content: "Create CRM lead and link this conversation.",
        rationale: "No linked lead — capture while intent is active.",
      });
    }

    if (emotion?.primary === "urgent" || intent?.primary === "ready_to_buy") {
      items.push({
        action: "schedule_call",
        label: RECOMMENDATION_LABELS.schedule_call,
        priority: "secondary",
        content: "Offer a 15-minute call to close details today.",
        rationale: "High-intent or urgent signal detected.",
      });
    }

    const primary = items.find((item) => item.priority === "primary") ?? null;

    return { primary, items };
  }
}
