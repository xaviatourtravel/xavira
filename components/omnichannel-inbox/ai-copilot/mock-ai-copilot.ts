import type { AICopilotData } from "./types";

export function buildMockAICopilotData(conversationId: string): AICopilotData {
  void conversationId;

  return {
    intent: "Japan Tour",
    confidence: 92,
    summary:
      "Customer is comparing Japan and Yunnan packages with a firm budget ceiling and May travel window.",
    leadTemperature: "Hot Lead",
    leadTemperatureEmoji: "🔥",
    estimatedClosing: "This Week",
    nextActions: [
      {
        id: "send-quotation",
        icon: "clipboard",
        title: "Send quotation",
        description: "Share Yunnan Premium pricing with halal meal options.",
        recommended: true,
      },
      {
        id: "offer-yunnan",
        icon: "target",
        title: "Offer Yunnan Premium",
        description: "Highlight 8D7N itinerary aligned with the captured budget.",
      },
      {
        id: "confirm-departure",
        icon: "message-square",
        title: "Ask departure confirmation",
        description: "Confirm May travel dates before locking seat availability.",
      },
      {
        id: "escalate-senior",
        icon: "brain",
        title: "Escalate to senior sales",
        description: "Route to senior consultant for VIP closing support.",
      },
    ],
    suggestedReply:
      "Berdasarkan kebutuhan Kakak, kami merekomendasikan paket Yunnan Premium dengan itinerary halal-friendly. Budget yang Kakak sebutkan masih sesuai untuk keberangkatan Mei dengan 2 orang. Mau saya kirimkan detail quotation lengkapnya sekarang?",
    signals: [
      { id: "budget", label: "Budget Captured", icon: "check-circle" },
      { id: "destination", label: "Destination Confirmed", icon: "check-circle" },
      { id: "travelers", label: "Travelers Confirmed", icon: "check-circle" },
      { id: "follow-up", label: "Need Follow-up", icon: "lightbulb" },
      { id: "vip", label: "VIP", icon: "sparkles" },
    ],
    memory: [
      { id: "memory-budget", label: "Budget extracted" },
      { id: "memory-destination", label: "Destination detected" },
      { id: "memory-qualified", label: "Lead qualified" },
      { id: "memory-package", label: "Package matched" },
    ],
  };
}
