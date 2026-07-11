import type { AIAction } from "@/modules/ai/action-engine/types";
import { HANDOFF_SAFETY_TOPICS } from "@/modules/ai/base-brain/handoff-policy";

export const OUTPUT_CONTRACT_EXAMPLE = {
  reply:
    "Tentu, saya bantu catat kebutuhannya. Rencana berangkat kapan dan untuk berapa orang? Untuk jadwal serta harga terbaru, tim kami akan bantu konfirmasi.",
  handoffRequired: false,
  handoffReason: null,
  confidence: 0.86,
  suggestedActions: [],
  usedSources: [],
  missingInformation: ["preferred_departure_timing", "passenger_count"],
  suggestedNextStep: "Collect timing and passenger count, then offer human confirmation for price and schedule.",
  intent: "PACKAGE_INQUIRY",
  actions: [] as AIAction[],
};

export const ANSWER_FIRST_OUTPUT_CONTRACT_EXAMPLE = {
  ...OUTPUT_CONTRACT_EXAMPLE,
  replyText:
    "Harga Paket Jepang adalah Rp 18.500.000 per orang. Berapa jumlah peserta yang direncanakan?",
  directAnswer: "Harga Paket Jepang adalah Rp 18.500.000 per orang.",
  supportingExplanation: null,
  followUpQuestion: "Berapa jumlah peserta yang direncanakan?",
  followUpQuestionKey: "participant_count",
  requestType: "PRICE",
  answerability: "ANSWERABLE",
  responseAction: "ANSWER_THEN_ASK",
  attachmentIds: [] as string[],
};

export function buildOutputContractSection(answerFirst = false): string {
  const shape = answerFirst
    ? {
        reply: "string",
        replyText: "string",
        directAnswer: "string | null",
        supportingExplanation: "string | null",
        followUpQuestion: "string | null",
        followUpQuestionKey: "string | null",
        requestType: "string | null",
        answerability: "string | null",
        responseAction: "string | null",
        handoffRequired: "boolean",
        handoffReason: "string | null",
        confidence: "number between 0 and 1",
        suggestedActions: ["string"],
        usedSources: ["string"],
        missingInformation: ["string"],
        suggestedNextStep: "string | null",
        intent: "string",
        attachmentIds: ["string"],
        actions: [
          {
            type: "SEND_DOCUMENT | HANDOVER | CREATE_LEAD_NOTE | UPDATE_MEMORY | UPDATE_LEAD_PROGRESS | SUGGEST_PACKAGE | ASK_QUALIFICATION | NO_ACTION",
            confidence: "number between 0 and 1",
            reason: "string",
            payload: {},
          },
        ],
      }
    : {
        reply: "string",
        handoffRequired: "boolean",
        handoffReason: "string | null",
        confidence: "number between 0 and 1",
        suggestedActions: ["string"],
        usedSources: ["string"],
        missingInformation: ["string"],
        suggestedNextStep: "string | null",
        intent: "string",
        actions: [
          {
            type: "SEND_DOCUMENT | HANDOVER | CREATE_LEAD_NOTE | UPDATE_MEMORY | UPDATE_LEAD_PROGRESS | SUGGEST_PACKAGE | ASK_QUALIFICATION | NO_ACTION",
            confidence: "number between 0 and 1",
            reason: "string",
            payload: {},
          },
        ],
      };

  const example = answerFirst ? ANSWER_FIRST_OUTPUT_CONTRACT_EXAMPLE : OUTPUT_CONTRACT_EXAMPLE;

  return [
    "Return ONLY valid JSON with this exact shape:",
    JSON.stringify(shape, null, 2),
    "",
    answerFirst
      ? "Planner fields (requestType, answerability, responseAction, handoffRequired, attachmentIds) are advisory only — the deterministic response plan is authoritative."
      : "",
    "Example:",
    JSON.stringify(example, null, 2),
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildActionEngineRulesSection(): string {
  return [
    "Action Engine rules:",
    "- You may recommend actions in the actions array.",
    "- You must NOT claim an action has already happened in the reply text.",
    "- Never say a document was sent unless recommending it.",
    "",
    "Supported action types:",
    "- SEND_DOCUMENT, HANDOVER, CREATE_LEAD_NOTE, UPDATE_MEMORY, UPDATE_LEAD_PROGRESS, SUGGEST_PACKAGE, ASK_QUALIFICATION, NO_ACTION",
  ].join("\n");
}

export function buildUsedSourcesRulesSection(catalog: string[]): string {
  if (catalog.length === 0) {
    return [
      "Used sources rules:",
      "- Return usedSources as an empty array when no published Business Brain context was used.",
    ].join("\n");
  }

  return [
    "Used sources rules:",
    "- usedSources must list only sources actually used from published reference data.",
    "- Use exact labels below (not ids):",
    ...catalog.map((item) => `- "${item}"`),
  ].join("\n");
}

export function buildSafetyHandoffTopicsSection(): string {
  return [
    "High-risk topics requiring handoff when customer asks about them:",
    ...HANDOFF_SAFETY_TOPICS.map((topic) => `- ${topic}`),
  ].join("\n");
}
