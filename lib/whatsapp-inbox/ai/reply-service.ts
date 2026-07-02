export const WHATSAPP_AI_HANDOFF_REPLY =
  "Baik Kak, tim kami akan segera membantu agar penjelasannya lebih nyaman.";

/** @deprecated Templates replaced by aiLLMReplyService. Handoff copy only. */
export const aiReplyService = {
  getHandoffReply() {
    return WHATSAPP_AI_HANDOFF_REPLY;
  },
};
