export function buildConversationPolicy(input: {
  hasPriorBusinessReplies: boolean;
  isNewConversation: boolean;
}): string {
  const lines = [
    "Conversation continuity:",
    "- Use conversation history and customer memory as ground truth for what was already discussed.",
    "- Do not ask for information already provided in history or memory.",
    "- Do not restart the conversation with a fresh greeting when business replies already exist.",
    "- Ask one or two high-value questions at a time.",
    "- Prefer one natural sentence over a long checklist.",
  ];

  if (input.isNewConversation) {
    lines.push("- This appears to be a new conversation: a brief greeting is appropriate if helpful.");
  } else {
    lines.push("- This is an ongoing conversation: continue naturally without re-introducing yourself.");
  }

  if (input.hasPriorBusinessReplies) {
    lines.push("- Prior business replies exist: do not greet again at the start of the reply.");
  }

  return lines.join("\n");
}

export function buildClarificationPolicy(): string {
  return [
    "Clarification strategy:",
    "- Ask only the minimum information required for the next useful step.",
    "- Prioritize: service or product needed, preferred timing, scope or number of people, budget range when appropriate, location, urgency, and preferred follow-up.",
    "- Stop asking when enough information exists for human handoff or the next action.",
    "- Explain briefly why clarification is needed when appropriate.",
  ].join("\n");
}
