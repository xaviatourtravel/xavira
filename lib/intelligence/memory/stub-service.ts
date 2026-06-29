import type { MemoryService } from "@/lib/intelligence/memory/service";
import type { ConversationContext } from "@/lib/intelligence/context/types";
import type { CustomerMemory, MemorySlice } from "@/lib/intelligence/memory/types";
import { MEMORY_DIMENSION_LABELS } from "@/lib/intelligence/memory/types";
import {
  detectTravelHints,
  hashString,
} from "@/lib/intelligence/stub/travel-heuristics";

export class StubMemoryService implements MemoryService {
  analyze(context: ConversationContext): CustomerMemory {
    const text = context.lastIncomingText ?? "";
    const seed = hashString(context.conversationId);
    const hints = detectTravelHints(text, seed);
    const firstName = context.customerName.split(" ")[0] || "Customer";

    const slices: MemorySlice[] = [
      {
        dimension: "identity",
        label: MEMORY_DIMENSION_LABELS.identity,
        content: `${firstName} · ${context.phone ?? "phone unknown"} · via ${context.channelLabel}`,
        confidence: context.phone ? "high" : "medium",
      },
      {
        dimension: "travel_preference",
        label: MEMORY_DIMENSION_LABELS.travel_preference,
        content: `Interested in ${hints.destination}. Prefers halal-friendly itinerary.`,
        confidence: text ? "medium" : "low",
      },
      {
        dimension: "purchase_preference",
        label: MEMORY_DIMENSION_LABELS.purchase_preference,
        content: `Budget signal ~Rp ${Number(hints.budget).toLocaleString("id-ID")} for ${hints.pax} pax.`,
        confidence: text.includes("harga") || text.includes("budget") ? "high" : "medium",
      },
      {
        dimension: "relationship",
        label: MEMORY_DIMENSION_LABELS.relationship,
        content: context.hasLinkedLead
          ? "Existing CRM lead — prior engagement detected."
          : "First-touch prospect — no linked lead yet.",
        confidence: "high",
      },
      {
        dimension: "objection",
        label: MEMORY_DIMENSION_LABELS.objection,
        content:
          text.includes("mahal") || text.includes("terlalu")
            ? "Price sensitivity mentioned — may need value framing."
            : null,
        confidence: "medium",
      },
      {
        dimension: "history",
        label: MEMORY_DIMENSION_LABELS.history,
        content: `${context.incomingMessageCount} customer messages across this thread since ${new Date(context.createdAt).toLocaleDateString("id-ID")}.`,
        confidence: "high",
      },
    ];

    return {
      slices,
      updatedAt: new Date().toISOString(),
    };
  }
}
