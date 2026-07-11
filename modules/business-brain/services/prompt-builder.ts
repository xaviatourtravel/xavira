import {
  buildRuntimePrompt,
  buildRuntimeContext,
  resolveLocaleFromCommunicationLanguage,
  type BuildRuntimeContextInput,
} from "@/modules/ai/runtime/build-runtime-context";
import type { BusinessBrainContext, CompanyDNAContext } from "@/modules/business-brain/types/context";
import type { RetrievedBusinessBrainContext } from "@/modules/ai/types/context-retrieval";
import type { LeadQualificationSnapshot } from "@/modules/ai/types/lead-qualification";
import { LEAD_QUALIFICATION_FIELD_RULES } from "@/modules/ai/types/lead-qualification";
import type { ConversationMemoryPromptItem } from "@/modules/ai/types/memory";
import {
  isConversationMemoryKey,
  MEMORY_KEY_LABELS,
} from "@/modules/ai/types/memory";
import type { QualificationConfig } from "@/modules/business-brain/types/behaviors";
import { RETRIEVAL_LIMITS } from "@/modules/ai/types/context-retrieval";
import {
  DEFAULT_HANDOFF_MESSAGE,
  DEFAULT_QUALIFICATION_CONFIG,
  DEFAULT_REPLY_STYLE_CONFIG,
} from "@/modules/business-brain/types/behaviors";
import type {
  BehaviorContext,
  DocumentContext,
  KnowledgeContext,
  ProductContext,
} from "@/modules/business-brain/types/context";
import type {
  WhatsAppConversationTurn,
  WhatsAppSalesLlmOutputContract,
  WhatsAppSalesPromptBundle,
  WhatsAppSalesPromptParams,
} from "@/modules/business-brain/types/prompt";

const MAX_HISTORY_MESSAGES = 10;
const MAX_SHORT_TEXT = 180;
const MAX_MEDIUM_TEXT = 400;
const MAX_LONG_TEXT = 700;
const MAX_LIST_ITEMS = 6;
const MAX_PRICING_ITEMS = 4;
const MAX_DEPARTURE_ITEMS = 4;
const MAX_HANDOVER_RULES = 10;

const HANDOFF_SAFETY_TOPICS = [
  "negotiation",
  "discount",
  "payment proof",
  "refund",
  "complaint",
  "phone call",
  "booking confirmation",
  "custom private trip",
] as const;

const OUTPUT_CONTRACT_EXAMPLE: WhatsAppSalesLlmOutputContract = {
  reply:
    "Ada Kak, untuk Yunnan biasanya cover Kunming, Dali, Lijiang, dan Shangri-La.",
  handoffRequired: false,
  handoffReason: null,
  confidence: 0.92,
  suggestedActions: [],
  usedSources: ["Product: Yunnan", "Knowledge: China Muslim Tour FAQ"],
  missingInformation: [],
  suggestedNextStep: null,
  intent: "PACKAGE_INQUIRY",
  documentActions: [],
  actions: [
    {
      type: "SEND_DOCUMENT",
      confidence: 0.9,
      reason: "Customer asked for itinerary",
      payload: {
        documentId: "00000000-0000-0000-0000-000000000001",
      },
    },
  ],
};

function truncateText(value: string, maxLength: number): string {
  const trimmed = value.trim();
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, maxLength - 1).trim()}…`;
}

function cleanString(value: string | undefined | null): string {
  return typeof value === "string" ? value.trim() : "";
}

function cleanStringList(values: string[], maxItems = MAX_LIST_ITEMS): string[] {
  return values
    .map((item) => cleanString(item))
    .filter(Boolean)
    .slice(0, maxItems)
    .map((item) => truncateText(item, MAX_SHORT_TEXT));
}

function formatHistoryMessage(turn: WhatsAppConversationTurn): string {
  const label =
    turn.sender === "customer" ? "customer" : turn.sender === "human" ? "human" : "ai";
  return `[${label}] ${truncateText(cleanString(turn.text), MAX_MEDIUM_TEXT)}`;
}

function formatConversationHistory(history: WhatsAppConversationTurn[]): string {
  if (history.length === 0) {
    return "(no prior messages)";
  }

  return history
    .slice(-MAX_HISTORY_MESSAGES)
    .map(formatHistoryMessage)
    .join("\n");
}

function formatCompanyDnaSection(companyDNA: CompanyDNAContext | null): string {
  if (!companyDNA) {
    return "No Company DNA configured.";
  }

  const lines = [
    `Company name: ${truncateText(companyDNA.companyName, MAX_SHORT_TEXT)}`,
    companyDNA.industry ? `Industry: ${companyDNA.industry}` : null,
    companyDNA.website ? `Website: ${truncateText(companyDNA.website, MAX_SHORT_TEXT)}` : null,
    companyDNA.about ? `About: ${truncateText(companyDNA.about, MAX_MEDIUM_TEXT)}` : null,
    companyDNA.brandPersonality.length
      ? `Brand personality: ${companyDNA.brandPersonality.join(", ")}`
      : null,
    `Communication style: ${companyDNA.communicationStyle.greetingStyle}, ${companyDNA.communicationStyle.language}, reply ${companyDNA.communicationStyle.replyLength}, emoji ${companyDNA.communicationStyle.emojiUsage}`,
    `Sales style: ${companyDNA.salesStyle}`,
    companyDNA.aiGoals.length ? `AI goals: ${companyDNA.aiGoals.join(", ")}` : null,
    companyDNA.neverRules.length ? `Legacy never rules: ${companyDNA.neverRules.join("; ")}` : null,
  ].filter(Boolean);

  return lines.join("\n");
}

function formatProductsSection(products: ProductContext[]): string {
  if (products.length === 0) {
    return "No relevant products available.";
  }

  return products
    .map((product) => {
      const lines = [
        `Product ${product.id}`,
        `Name: ${truncateText(product.name, MAX_SHORT_TEXT)}`,
        product.destination ? `Destination: ${product.destination}` : null,
        product.category ? `Category: ${product.category}` : null,
        product.description
          ? `Summary: ${truncateText(product.description, MAX_MEDIUM_TEXT)}`
          : null,
        product.highlights.length
          ? `Highlights: ${cleanStringList(product.highlights).join("; ")}`
          : null,
        product.pricing.length
          ? `Pricing: ${product.pricing
              .slice(0, MAX_PRICING_ITEMS)
              .map((item) => `${item.packageName} ${item.price} ${item.currency}`)
              .join("; ")}`
          : null,
        product.departures.length
          ? `Departures: ${product.departures
              .slice(0, MAX_DEPARTURE_ITEMS)
              .map((item) => `${item.departureDate} (${item.status})`)
              .join("; ")}`
          : null,
        product.aiNotes ? `AI notes: ${truncateText(product.aiNotes, MAX_SHORT_TEXT)}` : null,
      ].filter(Boolean);

      return lines.join("\n");
    })
    .join("\n\n");
}

function formatKnowledgeSection(articles: KnowledgeContext[]): string {
  if (articles.length === 0) {
    return "No relevant knowledge articles available.";
  }

  return articles
    .map((article) => {
      return [
        `Article ${article.id}`,
        `Title: ${truncateText(article.title, MAX_SHORT_TEXT)}`,
        `Category: ${article.category}`,
        `Content: ${truncateText(article.content, MAX_LONG_TEXT)}`,
        article.keywords.length ? `Keywords: ${article.keywords.join(", ")}` : null,
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n");
}

function formatDocumentsSection(documents: DocumentContext[]): string {
  if (documents.length === 0) {
    return "No relevant documents available.";
  }

  return documents
    .map((document) => {
      return [
        `Document ${document.id}`,
        `Name: ${truncateText(document.name, MAX_SHORT_TEXT)}`,
        `Type: ${document.documentType}`,
        document.description
          ? `Description: ${truncateText(document.description, MAX_MEDIUM_TEXT)}`
          : null,
        document.tags.length ? `Tags: ${document.tags.join(", ")}` : null,
        `Auto-send enabled: ${document.autoSendEnabled ? "yes" : "no"}`,
        document.publicUrl ? `Public URL available: yes` : `Public URL available: no`,
        document.aiNotes ? `AI notes: ${truncateText(document.aiNotes, MAX_SHORT_TEXT)}` : null,
        "Do not claim this file was sent unless a separate system action confirms delivery.",
      ].join("\n");
    })
    .join("\n\n");
}

function formatBehaviorsSection(context: RetrievedBusinessBrainContext): string {
  const alwaysDo = context.relevantBehaviors.filter(
    (item) => item.type === "ALWAYS_DO" && item.enabled,
  );
  const neverDo = context.relevantBehaviors.filter(
    (item) => item.type === "NEVER_DO" && item.enabled,
  );

  const replyStyle = context.replyStyle?.config ?? DEFAULT_REPLY_STYLE_CONFIG;
  const qualification = context.qualificationRules?.config ?? DEFAULT_QUALIFICATION_CONFIG;

  const lines = [
    "Always Do:",
    alwaysDo.length
      ? alwaysDo
          .map(
            (item) =>
              `- ${item.name}${item.description ? `: ${truncateText(item.description, MAX_SHORT_TEXT)}` : ""}`,
          )
          .join("\n")
      : "- (none)",
    "",
    "Never Do:",
    neverDo.length
      ? neverDo
          .map(
            (item) =>
              `- ${item.name}${item.description ? `: ${truncateText(item.description, MAX_SHORT_TEXT)}` : ""}`,
          )
          .join("\n")
      : "- (none)",
    "",
    "Reply Style:",
    `- Use "Kak": ${replyStyle.useKak ? "yes" : "no"}`,
    `- Avoid repeated greeting: ${replyStyle.avoidRepeatedGreeting ? "yes" : "no"}`,
    `- Max reply length: ${replyStyle.maxReplyLength}`,
    `- Emoji usage: ${replyStyle.emojiUsage}`,
    `- CTA style: ${replyStyle.ctaStyle}`,
    `- Language style: ${replyStyle.languageStyle}`,
    "",
    "Qualification Rules:",
    `- Destination required: ${qualification.destination ? "yes" : "no"}`,
    `- Departure month required: ${qualification.departureMonth ? "yes" : "no"}`,
    `- Passenger count required: ${qualification.passengerCount ? "yes" : "no"}`,
    `- Budget required: ${qualification.budget ? "yes" : "no"}`,
    `- Private / Group required: ${qualification.privateOrGroup ? "yes" : "no"}`,
    `- Special needs required: ${qualification.specialNeeds ? "yes" : "no"}`,
    "",
    "Handover Rules:",
    context.handoverRules.length
      ? context.handoverRules
          .slice(0, MAX_HANDOVER_RULES)
          .map((rule) => {
            const status = rule.enabled ? "enabled" : "disabled";
            return `- ${rule.name} (${status}): ${rule.triggerIntent} → ${rule.assignToRole}. Handoff message: ${truncateText(rule.handoffMessage || DEFAULT_HANDOFF_MESSAGE, MAX_MEDIUM_TEXT)}`;
          })
          .join("\n")
      : "- (none)",
  ];

  return lines.join("\n");
}

function formatCustomerMemorySection(memory: ConversationMemoryPromptItem[]): string {
  const lines = memory
    .map((item) => {
      if (!isConversationMemoryKey(item.memory_key)) return null;
      const label = MEMORY_KEY_LABELS[item.memory_key];
      const value = cleanString(item.memory_value);
      return value ? `${label}: ${truncateText(value, MAX_SHORT_TEXT)}` : null;
    })
    .filter(Boolean);

  if (lines.length === 0) {
    return "Customer Memory:\n(none)";
  }

  return ["Customer Memory:", ...lines].join("\n");
}

function formatLeadQualificationSection(
  qualification: LeadQualificationSnapshot | null | undefined,
): string {
  if (!qualification) {
    return "Qualification:\n0%\n\nMissing:\n(all fields)";
  }

  const missingLines = qualification.missingFields.map((fieldKey) => {
    const rule = LEAD_QUALIFICATION_FIELD_RULES.find((item) => item.key === fieldKey);
    return rule?.label ?? fieldKey;
  });

  return [
    "Qualification",
    `${qualification.completionScore}%`,
    "",
    "Missing:",
    missingLines.length > 0 ? missingLines.join("\n") : "(none)",
    "",
    qualification.nextMissingField
      ? [
          `AI should ask ONLY for ${LEAD_QUALIFICATION_FIELD_RULES.find((item) => item.key === qualification.nextMissingField)?.label ?? qualification.nextMissingField}.`,
          qualification.nextQuestion
            ? `Example question: "${qualification.nextQuestion}"`
            : null,
        ]
          .filter(Boolean)
          .join("\n")
      : "All qualification fields are complete. Do not ask qualification questions.",
    "",
    "Lead Qualification Rules:",
    "- Never ask a completed field.",
    "- Always ask the highest priority missing field.",
    "- Only ask ONE qualification question per reply.",
  ].join("\n");
}

function buildLeadQualificationRulesSection(): string {
  return [
    "Lead Qualification Rules:",
    "- Never ask a completed field.",
    "- Always ask the highest priority missing field.",
    "- Only ask ONE qualification question per reply.",
    "- Use the Qualification section to decide what to ask next.",
  ].join("\n");
}

function buildMemoryAwareRulesSection(): string {
  return [
    "Customer Memory Rules:",
    "- Use Customer Memory to understand the conversation.",
    "- Do not ask for information that is already known.",
    "- If qualification rules require missing information, ask only the next missing question.",
    "- Ask one question at a time.",
    '- Never repeat questions like departure month or passenger count when Customer Memory already has them.',
  ].join("\n");
}

function buildRelevantBusinessContextSection(context: RetrievedBusinessBrainContext): string {
  return [
    "Relevant Business Context",
    "",
    "Company:",
    formatCompanyDnaSection(context.companyDNA),
    "",
    "Products:",
    formatProductsSection(context.relevantProducts),
    "",
    "Knowledge:",
    formatKnowledgeSection(context.relevantArticles),
    "",
    "Documents:",
    formatDocumentsSection(context.relevantDocuments),
    "",
    "Behavior Rules:",
    formatBehaviorsSection(context),
  ].join("\n");
}

export function buildUsedSourceCatalog(context: RetrievedBusinessBrainContext): string[] {
  const catalog: string[] = [];

  if (context.companyDNA) {
    catalog.push("Company DNA");
  }

  for (const product of context.relevantProducts) {
    catalog.push(`Product: ${product.name}`);
  }

  for (const article of context.relevantArticles) {
    catalog.push(`Knowledge: ${article.title}`);
  }

  for (const document of context.relevantDocuments) {
    catalog.push(`Document: ${document.name}`);
  }

  for (const behavior of context.relevantBehaviors) {
    catalog.push(`Behavior: ${behavior.name}`);
  }

  for (const rule of context.handoverRules) {
    catalog.push(`Handover: ${rule.name}`);
  }

  return catalog;
}

function buildStyleRulesSection(): string {
  return [
    "Style rules:",
    "- Bahasa Indonesia by default unless customer clearly uses English.",
    "- Sound natural for WhatsApp.",
    "- Do not greet repeatedly.",
    "- Do not mention the customer name repeatedly.",
    "- Keep replies short.",
    '- Use "Kak" naturally, not in every sentence.',
    "- Ask one question at a time.",
    "- No overpromising.",
    "- No made-up facts.",
    "- If unsure, set handoffRequired to true.",
  ].join("\n");
}

function buildContextGapRulesSection(): string {
  return [
    "Context rules:",
    "- Only use facts from Relevant Business Context.",
    "- Do not include unrelated products, articles, or documents.",
    "- If relevant context is missing, do not invent details.",
    "- Ask one clarifying question or set handoffRequired = true when needed.",
  ].join("\n");
}

function buildUsedSourcesRulesSection(catalog: string[]): string {
  if (catalog.length === 0) {
    return [
      "Used sources rules:",
      "- Return usedSources as an empty array when no Business Brain context was used.",
    ].join("\n");
  }

  return [
    "Used sources rules:",
    "- usedSources must list only the sources you actually used from this retrieved context.",
    "- Use the exact labels below (not ids):",
    ...catalog.map((item) => `- "${item}"`),
  ].join("\n");
}

function buildActionEngineRulesSection(): string {
  return [
    "Action Engine rules:",
    "- You may recommend actions in the `actions` array.",
    "- You must NOT claim an action has already happened in the reply text.",
    "- The Action Engine decides whether each action is executed.",
    "- Never say a document was sent, a note was saved, or a human was notified unless you are only recommending it.",
    "",
    "Supported action types:",
    "- SEND_DOCUMENT — payload.documentId must be an exact document id from Relevant Business Context.",
    "- HANDOVER — hand conversation to a human teammate.",
    "- CREATE_LEAD_NOTE — payload.note with an internal sales note.",
    "- UPDATE_MEMORY — payload.memoryKey and payload.memoryValue.",
    "- UPDATE_LEAD_PROGRESS — payload.fields with qualification fields.",
    "- SUGGEST_PACKAGE — payload.packageName optional.",
    "- ASK_QUALIFICATION — payload.fieldKey / payload.question optional.",
    "- NO_ACTION — when no side effect is needed.",
    "",
    "Each action must include:",
    '- type (string)',
    "- confidence (number between 0 and 1)",
    "- reason (string)",
    "- payload (object)",
    "",
    "Return actions as an empty array when no action is needed.",
  ].join("\n");
}

function buildSafetyRulesSection(): string {
  return [
    "Safety rules:",
    "If the customer asks about any of these topics, return handoffRequired = true:",
    ...HANDOFF_SAFETY_TOPICS.map((topic) => `- ${topic}`),
    "Also hand off when retrieved Business Brain context is insufficient or the request is high-risk.",
    "When handoff is required, reply may be a brief handoff message or HANDOFF_REQUIRED.",
  ].join("\n");
}

function buildOutputContractSection(): string {
  return [
    "Return ONLY valid JSON with this exact shape:",
    JSON.stringify(
      {
        reply: "string",
        handoffRequired: "boolean",
        handoffReason: "string | null",
        confidence: "number between 0 and 1",
        usedSources: ["string"],
        actions: [
          {
            type: "SEND_DOCUMENT | HANDOVER | CREATE_LEAD_NOTE | UPDATE_MEMORY | UPDATE_LEAD_PROGRESS | SUGGEST_PACKAGE | ASK_QUALIFICATION | NO_ACTION",
            confidence: "number between 0 and 1",
            reason: "string",
            payload: {},
          },
        ],
      },
      null,
      2,
    ),
    "",
    "Example:",
    JSON.stringify(OUTPUT_CONTRACT_EXAMPLE, null, 2),
  ].join("\n");
}

export function sanitizeRetrievedContext(
  context: RetrievedBusinessBrainContext,
): RetrievedBusinessBrainContext {
  const companyDNA = context.companyDNA
    ? {
        ...context.companyDNA,
        companyName: truncateText(context.companyDNA.companyName, MAX_SHORT_TEXT),
        website: truncateText(context.companyDNA.website, MAX_SHORT_TEXT),
        about: truncateText(context.companyDNA.about, MAX_MEDIUM_TEXT),
        brandPersonality: context.companyDNA.brandPersonality.slice(0, MAX_LIST_ITEMS),
        aiGoals: context.companyDNA.aiGoals.slice(0, MAX_LIST_ITEMS),
        neverRules: cleanStringList(context.companyDNA.neverRules),
      }
    : null;

  const relevantProducts = context.relevantProducts
    .slice(0, RETRIEVAL_LIMITS.products)
    .map((product) => ({
      ...product,
      name: truncateText(product.name, MAX_SHORT_TEXT),
      destination: truncateText(product.destination, MAX_SHORT_TEXT),
      description: truncateText(product.description, MAX_MEDIUM_TEXT),
      highlights: cleanStringList(product.highlights),
      included: cleanStringList(product.included),
      excluded: cleanStringList(product.excluded),
      aiNotes: truncateText(product.aiNotes, MAX_SHORT_TEXT),
      pricing: product.pricing.slice(0, MAX_PRICING_ITEMS),
      departures: product.departures.slice(0, MAX_DEPARTURE_ITEMS),
    }));

  const relevantArticles = context.relevantArticles
    .slice(0, RETRIEVAL_LIMITS.articles)
    .map((article) => ({
      ...article,
      title: truncateText(article.title, MAX_SHORT_TEXT),
      content: truncateText(article.content, MAX_LONG_TEXT),
      keywords: cleanStringList(article.keywords, 12),
    }));

  const relevantDocuments = context.relevantDocuments
    .slice(0, RETRIEVAL_LIMITS.documents)
    .map((document) => ({
      ...document,
      name: truncateText(document.name, MAX_SHORT_TEXT),
      description: truncateText(document.description, MAX_MEDIUM_TEXT),
      tags: cleanStringList(document.tags, 12),
      aiNotes: truncateText(document.aiNotes, MAX_SHORT_TEXT),
      publicUrl: document.publicUrl ? "(available)" : null,
    }));

  const relevantBehaviors = context.relevantBehaviors
    .filter((item) => item.enabled)
    .slice(0, RETRIEVAL_LIMITS.behaviors)
    .map((item) => ({
      ...item,
      name: truncateText(item.name, MAX_SHORT_TEXT),
      description: truncateText(item.description, MAX_MEDIUM_TEXT),
    }));

  const handoverRules = context.handoverRules.slice(0, MAX_HANDOVER_RULES).map((rule) => ({
    ...rule,
    name: truncateText(rule.name, MAX_SHORT_TEXT),
    description: truncateText(rule.description, MAX_MEDIUM_TEXT),
    handoffMessage: truncateText(rule.handoffMessage, MAX_MEDIUM_TEXT),
  }));

  return {
    companyDNA,
    relevantProducts,
    relevantArticles,
    relevantDocuments,
    relevantBehaviors,
    handoverRules,
    replyStyle: context.replyStyle,
    qualificationRules: context.qualificationRules,
    retrievalSummary: context.retrievalSummary,
  };
}

/** @deprecated Use sanitizeRetrievedContext with retrieved context output. */
export function sanitizePromptContext(context: BusinessBrainContext): BusinessBrainContext {
  return {
    companyDNA: context.companyDNA,
    products: context.products,
    knowledge: context.knowledge,
    documents: context.documents,
    behaviors: context.behaviors,
    handoverRules: context.handoverRules,
    replyStyle: context.replyStyle,
    qualificationRules: context.qualificationRules,
  };
}

function buildSystemPrompt(workspaceName: string, usedSourceCatalog: string[]): string {
  return [
    `Role:`,
    `You are a WhatsApp sales assistant for ${workspaceName}.`,
    "You are not Desklabs.",
    "Never mention Desklabs to customers.",
    "",
    buildStyleRulesSection(),
    "",
    buildMemoryAwareRulesSection(),
    "",
    buildLeadQualificationRulesSection(),
    "",
    buildContextGapRulesSection(),
    "",
    buildUsedSourcesRulesSection(usedSourceCatalog),
    "",
    buildActionEngineRulesSection(),
    "",
    buildSafetyRulesSection(),
    "",
    buildOutputContractSection(),
  ].join("\n");
}

function formatConversationSummarySection(
  qualification: LeadQualificationSnapshot | null | undefined,
  retrievalSummary: RetrievedBusinessBrainContext["retrievalSummary"],
): string {
  const qualificationSection = formatLeadQualificationSection(qualification);

  return [
    "Conversation Summary:",
    `Intent: ${retrievalSummary.intent}`,
    retrievalSummary.matchedKeywords.length
      ? `Matched keywords: ${retrievalSummary.matchedKeywords.join(", ")}`
      : "Matched keywords: (none)",
    "",
    qualificationSection,
  ].join("\n");
}

function buildRuntimeContextInputFromPromptParams(
  params: WhatsAppSalesPromptParams,
  sanitizedContext: RetrievedBusinessBrainContext,
): BuildRuntimeContextInput {
  return {
    timezone: params.timezone,
    locale:
      params.locale ??
      resolveLocaleFromCommunicationLanguage(
        sanitizedContext.companyDNA?.communicationStyle.language,
      ),
    workspaceId: params.workspaceId,
    workspaceName: params.workspaceName,
    currentUser: params.currentUser,
    businessName:
      params.businessName ??
      sanitizedContext.companyDNA?.companyName ??
      sanitizedContext.companyDNA?.industry ??
      undefined,
    environment: params.environment,
  };
}

function buildUserPrompt(
  params: WhatsAppSalesPromptParams,
  sanitizedContext: RetrievedBusinessBrainContext,
): string {
  const history = formatConversationHistory(params.conversationHistory);
  const customerMessage = truncateText(cleanString(params.customerMessage), MAX_MEDIUM_TEXT);
  const memory = params.conversationMemory ?? [];
  const runtimePrompt = buildRuntimePrompt(
    buildRuntimeContext(buildRuntimeContextInputFromPromptParams(params, sanitizedContext)),
  );

  return [
    runtimePrompt,
    "",
    buildRelevantBusinessContextSection(sanitizedContext),
    "",
    formatConversationSummarySection(params.leadQualification, sanitizedContext.retrievalSummary),
    "",
    formatCustomerMemorySection(memory),
    "",
    "Conversation History (last 10 messages, oldest first):",
    history,
    "",
    "Latest Customer Message:",
    customerMessage,
  ].join("\n");
}

export function buildWhatsAppSalesPrompt(
  params: WhatsAppSalesPromptParams,
): WhatsAppSalesPromptBundle {
  const sanitizedContext = sanitizeRetrievedContext(params.retrievedContext);
  const usedSourceCatalog = buildUsedSourceCatalog(sanitizedContext);

  return {
    systemPrompt: buildSystemPrompt(params.workspaceName, usedSourceCatalog),
    userPrompt: buildUserPrompt(params, sanitizedContext),
    sanitizedContext,
    usedSourceCatalog,
    outputContract: OUTPUT_CONTRACT_EXAMPLE,
  };
}

export function buildWhatsAppSalesPromptSample(): WhatsAppSalesPromptBundle {
  return buildWhatsAppSalesPrompt({
    workspaceName: "Xavira Travel",
    customerMessage: "Halo kak, ada paket umrah bulan September untuk 4 orang? Bisa nego harga?",
    conversationHistory: [
      { sender: "customer", text: "Halo kak" },
      { sender: "ai", text: "Halo Kak, ada yang bisa dibantu?" },
    ],
    retrievedContext: {
      companyDNA: {
        companyName: "Xavira Travel",
        industry: "Travel & Tour",
        website: "https://xavira.example",
        about: "Travel agency focused on umrah and halal tours.",
        brandPersonality: ["Friendly", "Muslim Friendly"],
        communicationStyle: {
          replyLength: "medium",
          greetingStyle: "friendly",
          emojiUsage: "minimal",
          language: "mixed",
        },
        salesStyle: "consultative",
        aiGoals: ["qualify_leads", "recommend_products"],
        neverRules: [],
      },
      relevantProducts: [
        {
          id: "product-1",
          name: "Umrah Reguler September",
          category: "Umrah Package",
          destination: "Makkah & Madinah",
          description: "Paket umrah 9 hari dengan hotel bintang 4.",
          highlights: ["Direct flight", "Mutawwif berpengalaman"],
          pricing: [
            {
              id: "price-1",
              packageName: "Quad",
              price: 32500000,
              currency: "IDR",
              validUntil: "2026-12-31",
            },
          ],
          departures: [
            {
              id: "dep-1",
              departureDate: "2026-09-12",
              availableSeats: 20,
              status: "open",
            },
          ],
          included: ["Visa", "Hotel", "Transport"],
          excluded: ["Personal expenses"],
          aiNotes: "Highlight Muslim-friendly arrangement.",
          status: "published",
        },
      ],
      relevantArticles: [],
      relevantDocuments: [],
      relevantBehaviors: [
        {
          id: "behavior-1",
          type: "ALWAYS_DO",
          name: "Ask departure month",
          description: "Confirm bulan keberangkatan.",
          enabled: true,
        },
      ],
      handoverRules: [
        {
          id: "handover-1",
          name: "Negotiation → Sales",
          description: "",
          enabled: true,
          triggerIntent: "negotiation",
          assignToRole: "Sales",
          handoffMessage: DEFAULT_HANDOFF_MESSAGE,
        },
      ],
      replyStyle: {
        id: "reply-style-1",
        enabled: true,
        config: DEFAULT_REPLY_STYLE_CONFIG,
      },
      qualificationRules: {
        id: "qualification-1",
        enabled: true,
        config: DEFAULT_QUALIFICATION_CONFIG,
      },
      retrievalSummary: {
        productCount: 1,
        articleCount: 0,
        documentCount: 0,
        behaviorCount: 1,
        matchedKeywords: ["umrah", "september"],
        intent: "PACKAGE_INQUIRY",
      },
    },
  });
}
