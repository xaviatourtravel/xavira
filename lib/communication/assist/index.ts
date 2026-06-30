export { QUICK_REPLY_TEMPLATES } from "@/lib/communication/assist/templates";
export { suggestReply, type ReplySuggestion } from "@/lib/communication/assist/suggest-reply";
export { improveWriting, translateToEnglish } from "@/lib/communication/assist/ai-actions";
export {
  deriveConversationInsights,
  type ConversationInsights,
  type ConversationIntent,
  type ConversationSentiment,
  type ConversationPriority,
  type SuggestedNextAction,
} from "@/lib/communication/assist/derive-insights";
