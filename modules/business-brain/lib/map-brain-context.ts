import type { BrainSnapshot } from "@/modules/business-brain/types/publish";
import {
  DEFAULT_HANDOFF_MESSAGE,
  DEFAULT_QUALIFICATION_CONFIG,
  DEFAULT_REPLY_STYLE_CONFIG,
  HANDOVER_ASSIGN_ROLES,
  HANDOVER_TRIGGER_INTENTS,
} from "@/modules/business-brain/types/behaviors";
import type {
  BehaviorContext,
  BusinessBrainContext,
  CompanyDNAContext,
  DocumentContext,
  HandoverRuleContext,
  KnowledgeContext,
  ProductContext,
  QualificationRulesContext,
  ReplyStyleContext,
} from "@/modules/business-brain/types/context";
import type { BrainBehaviorRow } from "@/modules/business-brain/repositories/brain-behavior-repository";
import type { BrainArticleRow } from "@/modules/business-brain/repositories/brain-article-repository";
import type { BrainDocumentRow } from "@/modules/business-brain/repositories/brain-document-repository";
import type { BrainProductRow } from "@/modules/business-brain/repositories/brain-product-repository";
import type { CompanyDnaRow } from "@/modules/business-brain/repositories/company-dna-repository";
import { mapBrainBehaviorRow } from "@/modules/business-brain/repositories/brain-behavior-repository";

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function asBoolean(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function mapCompanyDnaFromRecord(record: Record<string, unknown>): CompanyDNAContext | null {
  const companyName = asString(record.company_name ?? record.companyName);
  if (!companyName.trim()) return null;

  const communication = record.communication_style ?? record.communicationStyle;
  const communicationRecord =
    communication && typeof communication === "object" && !Array.isArray(communication)
      ? (communication as Record<string, unknown>)
      : {};

  return {
    companyName,
    industry: asString(record.industry) as CompanyDNAContext["industry"],
    website: asString(record.website),
    about: asString(record.about),
    brandPersonality: asStringArray(record.brand_personality ?? record.brandPersonality) as CompanyDNAContext["brandPersonality"],
    communicationStyle: {
      replyLength:
        communicationRecord.replyLength === "short" ||
        communicationRecord.replyLength === "detailed"
          ? communicationRecord.replyLength
          : "medium",
      greetingStyle:
        communicationRecord.greetingStyle === "formal" ||
        communicationRecord.greetingStyle === "casual"
          ? communicationRecord.greetingStyle
          : "friendly",
      emojiUsage:
        communicationRecord.emojiUsage === "never" ||
        communicationRecord.emojiUsage === "natural" ||
        communicationRecord.emojiUsage === "frequent"
          ? communicationRecord.emojiUsage
          : "minimal",
      language:
        communicationRecord.language === "indonesian" ||
        communicationRecord.language === "english"
          ? communicationRecord.language
          : "mixed",
    },
    salesStyle:
      record.sales_style === "educate_first" ||
      record.sales_style === "hard_sell" ||
      record.sales_style === "relationship_based" ||
      record.salesStyle === "educate_first" ||
      record.salesStyle === "hard_sell" ||
      record.salesStyle === "relationship_based"
        ? (asString(record.sales_style ?? record.salesStyle) as CompanyDNAContext["salesStyle"])
        : "consultative",
    aiGoals: asStringArray(record.ai_goals ?? record.aiGoals) as CompanyDNAContext["aiGoals"],
    neverRules: asStringArray(record.never_rules ?? record.neverRules),
  };
}

export function mapCompanyDnaRowToContext(row: CompanyDnaRow | null): CompanyDNAContext | null {
  if (!row) return null;
  return mapCompanyDnaFromRecord(row as unknown as Record<string, unknown>);
}

function mapProductFromRecord(record: Record<string, unknown>): ProductContext | null {
  const id = asString(record.id);
  if (!id) return null;

  return {
    id,
    name: asString(record.name),
    category: asString(record.category) as ProductContext["category"],
    destination: asString(record.destination),
    description: asString(record.description),
    highlights: asStringArray(record.highlights),
    pricing: Array.isArray(record.pricing) ? (record.pricing as ProductContext["pricing"]) : [],
    departures: Array.isArray(record.departures)
      ? (record.departures as ProductContext["departures"])
      : [],
    included: asStringArray(record.included),
    excluded: asStringArray(record.excluded),
    aiNotes: asString(record.ai_notes ?? record.aiNotes),
    status: asString(record.status, "draft"),
  };
}

export function mapProductRowToContext(row: BrainProductRow): ProductContext | null {
  return mapProductFromRecord(row as unknown as Record<string, unknown>);
}

function mapKnowledgeFromRecord(record: Record<string, unknown>): KnowledgeContext | null {
  const id = asString(record.id);
  if (!id) return null;

  return {
    id,
    title: asString(record.title),
    category: asString(record.category, "custom") as KnowledgeContext["category"],
    content: asString(record.content),
    keywords: asStringArray(record.keywords),
    visibility: asString(record.visibility, "ai_only") as KnowledgeContext["visibility"],
    status: asString(record.status, "draft"),
  };
}

export function mapArticleRowToContext(row: BrainArticleRow): KnowledgeContext | null {
  return mapKnowledgeFromRecord(row as unknown as Record<string, unknown>);
}

function mapDocumentFromRecord(record: Record<string, unknown>): DocumentContext | null {
  const id = asString(record.id);
  if (!id) return null;

  const documentType = asString(record.document_type ?? record.documentType, "pdf");

  return {
    id,
    name: asString(record.name),
    description: asString(record.description),
    documentType:
      documentType === "image" || documentType === "video" || documentType === "url"
        ? documentType
        : "pdf",
    tags: asStringArray(record.tags),
    publicUrl: asString(record.public_url ?? record.publicUrl) || null,
    autoSendEnabled: asBoolean(record.auto_send_enabled ?? record.autoSendEnabled),
    aiNotes: asString(record.ai_notes ?? record.aiNotes),
    status: asString(record.status, "draft"),
  };
}

export function mapDocumentRowToContext(row: BrainDocumentRow): DocumentContext | null {
  return mapDocumentFromRecord(row as unknown as Record<string, unknown>);
}

function mapBehaviorSections(rows: BrainBehaviorRow[]) {
  const behaviors: BehaviorContext[] = [];
  const handoverRules: HandoverRuleContext[] = [];
  let replyStyle: ReplyStyleContext | null = null;
  let qualificationRules: QualificationRulesContext | null = null;

  for (const row of rows) {
    const mapped = mapBrainBehaviorRow(row);

    if (mapped.type === "ALWAYS_DO" || mapped.type === "NEVER_DO") {
      behaviors.push({
        id: mapped.id,
        type: mapped.type,
        name: mapped.name,
        description: mapped.description,
        enabled: mapped.enabled,
      });
      continue;
    }

    if (mapped.type === "HANDOVER_RULE") {
      const config = mapped.config as {
        triggerIntent?: string;
        assignToRole?: string;
        handoffMessage?: string;
      };

      const triggerIntent = HANDOVER_TRIGGER_INTENTS.includes(
        config.triggerIntent as (typeof HANDOVER_TRIGGER_INTENTS)[number],
      )
        ? (config.triggerIntent as HandoverRuleContext["triggerIntent"])
        : "negotiation";

      const assignToRole = HANDOVER_ASSIGN_ROLES.includes(
        config.assignToRole as (typeof HANDOVER_ASSIGN_ROLES)[number],
      )
        ? (config.assignToRole as HandoverRuleContext["assignToRole"])
        : "Sales";

      handoverRules.push({
        id: mapped.id,
        name: mapped.name,
        description: mapped.description,
        enabled: mapped.enabled,
        triggerIntent,
        assignToRole,
        handoffMessage: config.handoffMessage?.trim() || DEFAULT_HANDOFF_MESSAGE,
      });
      continue;
    }

    if (mapped.type === "REPLY_STYLE") {
      replyStyle = {
        id: mapped.id,
        enabled: mapped.enabled,
        config: mapped.config as ReplyStyleContext["config"],
      };
      continue;
    }

    if (mapped.type === "QUALIFICATION_RULE") {
      qualificationRules = {
        id: mapped.id,
        enabled: mapped.enabled,
        config: mapped.config as QualificationRulesContext["config"],
      };
    }
  }

  if (!replyStyle) {
    replyStyle = {
      id: "default-reply-style",
      enabled: true,
      config: DEFAULT_REPLY_STYLE_CONFIG,
    };
  }

  if (!qualificationRules) {
    qualificationRules = {
      id: "default-qualification-rules",
      enabled: true,
      config: DEFAULT_QUALIFICATION_CONFIG,
    };
  }

  return { behaviors, handoverRules, replyStyle, qualificationRules };
}

export function mapSnapshotToBusinessBrainContext(snapshot: BrainSnapshot): BusinessBrainContext {
  const companyDNA = snapshot.companyDna
    ? mapCompanyDnaFromRecord(snapshot.companyDna)
    : null;

  const products = snapshot.products
    .map((item) => mapProductFromRecord(item))
    .filter((item): item is ProductContext => !!item)
    .filter((item) => item.status === "published");

  const knowledge = snapshot.knowledge
    .map((item) => mapKnowledgeFromRecord(item))
    .filter((item): item is KnowledgeContext => !!item)
    .filter((item) => item.status === "published");

  const documents = snapshot.documents
    .map((item) => mapDocumentFromRecord(item))
    .filter((item): item is DocumentContext => !!item)
    .filter((item) => item.status === "published");

  const behaviorRows = snapshot.behaviors.map(
    (item) => item as unknown as BrainBehaviorRow,
  );
  const behaviorSections = mapBehaviorSections(behaviorRows);

  return {
    companyDNA,
    products,
    knowledge,
    documents,
    behaviors: behaviorSections.behaviors.filter((item) => item.enabled),
    handoverRules: behaviorSections.handoverRules,
    replyStyle: behaviorSections.replyStyle,
    qualificationRules: behaviorSections.qualificationRules,
  };
}

export function mapDraftRowsToBusinessBrainContext(input: {
  companyDna: CompanyDnaRow | null;
  products: BrainProductRow[];
  knowledge: BrainArticleRow[];
  documents: BrainDocumentRow[];
  behaviors: BrainBehaviorRow[];
  includeUnpublished?: boolean;
}): BusinessBrainContext {
  const includeUnpublished = input.includeUnpublished ?? true;

  const products = input.products
    .map(mapProductRowToContext)
    .filter((item): item is ProductContext => !!item)
    .filter((item) => includeUnpublished || item.status === "published")
    .filter((item) => item.status !== "archived");

  const knowledge = input.knowledge
    .map(mapArticleRowToContext)
    .filter((item): item is KnowledgeContext => !!item)
    .filter((item) => includeUnpublished || item.status === "published");

  const documents = input.documents
    .map(mapDocumentRowToContext)
    .filter((item): item is DocumentContext => !!item)
    .filter((item) => includeUnpublished || item.status === "published");

  const behaviorSections = mapBehaviorSections(input.behaviors);

  return {
    companyDNA: mapCompanyDnaRowToContext(input.companyDna),
    products,
    knowledge,
    documents,
    behaviors: behaviorSections.behaviors.filter((item) => item.enabled),
    handoverRules: behaviorSections.handoverRules,
    replyStyle: behaviorSections.replyStyle,
    qualificationRules: behaviorSections.qualificationRules,
  };
}

export function applyBusinessBrainContextFilters(
  context: BusinessBrainContext,
  options?: { productId?: string; customerMessage?: string },
): BusinessBrainContext {
  let products = context.products;
  let knowledge = context.knowledge;
  let documents = context.documents;

  if (options?.productId) {
    products = products.filter((item) => item.id === options.productId);
  }

  const message = options?.customerMessage?.trim().toLowerCase();
  if (message) {
    knowledge = knowledge.filter((item) => {
      const haystack = `${item.title} ${item.content} ${item.keywords.join(" ")}`.toLowerCase();
      return message.split(/\s+/).some((token) => token.length > 2 && haystack.includes(token));
    });

    documents = documents.filter((item) => {
      const haystack = `${item.name} ${item.description} ${item.tags.join(" ")}`.toLowerCase();
      return message.split(/\s+/).some((token) => token.length > 2 && haystack.includes(token));
    });
  }

  return {
    ...context,
    products,
    knowledge,
    documents,
  };
}
