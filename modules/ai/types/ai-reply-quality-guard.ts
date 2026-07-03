import type { BusinessBrainContext } from "@/modules/business-brain/types/context";

export type ReplyQualityTurn = {
  sender: "customer" | "human" | "ai";
  text: string;
};

export type ImproveReplyQualityParams = {
  reply: string;
  conversationHistory: ReplyQualityTurn[];
  customerMessage: string;
  businessBrainContext: BusinessBrainContext;
};

export type ImproveReplyQualityResult = {
  reply: string;
  changed: boolean;
  changes: string[];
};

export const DEFAULT_MAX_REPLY_CHARACTERS = 500;

export const DETAILED_EXPLANATION_KEYWORDS = [
  "detail",
  "lengkap",
  "penjelasan",
  "jelaskan",
  "breakdown",
  "itinerary lengkap",
  "rincian",
  "full detail",
  "explain in detail",
] as const;
