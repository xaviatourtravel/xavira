import type { BrainBehaviorRow } from "@/modules/business-brain/repositories/brain-behavior-repository";
import type { BrainArticleRow } from "@/modules/business-brain/repositories/brain-article-repository";
import type { BrainDocumentRow } from "@/modules/business-brain/repositories/brain-document-repository";
import type { BrainProductRow } from "@/modules/business-brain/repositories/brain-product-repository";
import type { CompanyDnaRow } from "@/modules/business-brain/repositories/company-dna-repository";
import type {
  BrainDraftSummary,
  BrainPublishSection,
  BrainSectionChangeSummary,
  BrainSnapshot,
} from "@/modules/business-brain/types/publish";
import { BRAIN_PUBLISH_SECTION_LABELS } from "@/modules/business-brain/types/publish";

function toRecord(value: unknown): Record<string, unknown> {
  return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
}

export function buildBrainSnapshot(input: {
  companyDna: CompanyDnaRow | null;
  products: BrainProductRow[];
  knowledge: BrainArticleRow[];
  documents: BrainDocumentRow[];
  behaviors: BrainBehaviorRow[];
}): BrainSnapshot {
  return {
    capturedAt: new Date().toISOString(),
    companyDna: input.companyDna ? toRecord(input.companyDna) : null,
    products: input.products.map(toRecord),
    knowledge: input.knowledge.map(toRecord),
    documents: input.documents.map(toRecord),
    behaviors: input.behaviors.map(toRecord),
  };
}

function normalizeEntity(record: Record<string, unknown>) {
  const { created_at, updated_at, ...rest } = record;
  void created_at;
  void updated_at;
  return rest;
}

function compareLists(
  current: Array<Record<string, unknown>>,
  published: Array<Record<string, unknown>>,
) {
  const publishedMap = new Map(
    published
      .filter((item) => typeof item.id === "string")
      .map((item) => [item.id as string, item]),
  );
  const currentMap = new Map(
    current
      .filter((item) => typeof item.id === "string")
      .map((item) => [item.id as string, item]),
  );

  let added = 0;
  let edited = 0;
  let removed = 0;

  for (const [id, item] of currentMap) {
    const previous = publishedMap.get(id);
    if (!previous) {
      added += 1;
      continue;
    }

    const currentJson = JSON.stringify(normalizeEntity(item));
    const previousJson = JSON.stringify(normalizeEntity(previous));
    if (currentJson !== previousJson) {
      edited += 1;
    }
  }

  for (const id of publishedMap.keys()) {
    if (!currentMap.has(id)) {
      removed += 1;
    }
  }

  return { added, edited, removed };
}

function compareCompanyDna(
  current: Record<string, unknown> | null,
  published: Record<string, unknown> | null,
) {
  if (!current && !published) {
    return { added: 0, edited: 0, removed: 0 };
  }
  if (!published && current) {
    return { added: 1, edited: 0, removed: 0 };
  }
  if (published && !current) {
    return { added: 0, edited: 0, removed: 1 };
  }

  const changed =
    JSON.stringify(normalizeEntity(current!)) !== JSON.stringify(normalizeEntity(published!));

  return changed ? { added: 0, edited: 1, removed: 0 } : { added: 0, edited: 0, removed: 0 };
}

function sectionSummary(
  section: BrainPublishSection,
  counts: { added: number; edited: number; removed: number },
): BrainSectionChangeSummary {
  return {
    section,
    label: BRAIN_PUBLISH_SECTION_LABELS[section],
    ...counts,
  };
}

export function summarizeDraftChanges(
  current: BrainSnapshot,
  published: BrainSnapshot | null,
): BrainDraftSummary {
  if (!published) {
    const sections: BrainSectionChangeSummary[] = [
      sectionSummary("companyDna", {
        added: current.companyDna ? 1 : 0,
        edited: 0,
        removed: 0,
      }),
      sectionSummary("products", {
        added: current.products.length,
        edited: 0,
        removed: 0,
      }),
      sectionSummary("knowledge", {
        added: current.knowledge.length,
        edited: 0,
        removed: 0,
      }),
      sectionSummary("documents", {
        added: current.documents.length,
        edited: 0,
        removed: 0,
      }),
      sectionSummary("behaviors", {
        added: current.behaviors.length,
        edited: 0,
        removed: 0,
      }),
    ];

    const totalChanges = sections.reduce(
      (sum, item) => sum + item.added + item.edited + item.removed,
      0,
    );

    return {
      sections,
      totalChanges,
      hasUnpublishedChanges: totalChanges > 0,
    };
  }

  const sections: BrainSectionChangeSummary[] = [
    sectionSummary("companyDna", compareCompanyDna(current.companyDna, published.companyDna)),
    sectionSummary("products", compareLists(current.products, published.products)),
    sectionSummary("knowledge", compareLists(current.knowledge, published.knowledge)),
    sectionSummary("documents", compareLists(current.documents, published.documents)),
    sectionSummary("behaviors", compareLists(current.behaviors, published.behaviors)),
  ];

  const totalChanges = sections.reduce(
    (sum, item) => sum + item.added + item.edited + item.removed,
    0,
  );

  return {
    sections,
    totalChanges,
    hasUnpublishedChanges: totalChanges > 0,
  };
}

export function parseBrainSnapshot(value: unknown): BrainSnapshot | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const record = value as Record<string, unknown>;
  return {
    capturedAt: typeof record.capturedAt === "string" ? record.capturedAt : "",
    companyDna:
      record.companyDna && typeof record.companyDna === "object" && !Array.isArray(record.companyDna)
        ? (record.companyDna as Record<string, unknown>)
        : null,
    products: Array.isArray(record.products)
      ? record.products.filter(
          (item): item is Record<string, unknown> =>
            !!item && typeof item === "object" && !Array.isArray(item),
        )
      : [],
    knowledge: Array.isArray(record.knowledge)
      ? record.knowledge.filter(
          (item): item is Record<string, unknown> =>
            !!item && typeof item === "object" && !Array.isArray(item),
        )
      : [],
    documents: Array.isArray(record.documents)
      ? record.documents.filter(
          (item): item is Record<string, unknown> =>
            !!item && typeof item === "object" && !Array.isArray(item),
        )
      : [],
    behaviors: Array.isArray(record.behaviors)
      ? record.behaviors.filter(
          (item): item is Record<string, unknown> =>
            !!item && typeof item === "object" && !Array.isArray(item),
        )
      : [],
  };
}
