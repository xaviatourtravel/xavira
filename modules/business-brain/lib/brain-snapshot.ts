import type { BrainBehaviorRow } from "@/modules/business-brain/repositories/brain-behavior-repository";
import type { BrainArticleRow } from "@/modules/business-brain/repositories/brain-article-repository";
import type { BrainDocumentRow } from "@/modules/business-brain/repositories/brain-document-repository";
import type { BrainProductRow } from "@/modules/business-brain/repositories/brain-product-repository";
import type { CompanyDnaRow } from "@/modules/business-brain/repositories/company-dna-repository";
import {
  canonicalizeCompanyDna,
  canonicalizeEntityForSection,
  entityDisplayName,
  sortEntitiesById,
  stableCanonicalString,
} from "@/modules/business-brain/lib/brain-snapshot-canonical";
import type {
  BrainDraftSummary,
  BrainEntityChangeType,
  BrainPublishSection,
  BrainSectionChangeDetail,
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
    products: sortEntitiesById(input.products.map(toRecord)),
    knowledge: sortEntitiesById(input.knowledge.map(toRecord)),
    documents: sortEntitiesById(input.documents.map(toRecord)),
    behaviors: sortEntitiesById(input.behaviors.map(toRecord)),
  };
}

function compareCompanyDna(
  current: Record<string, unknown> | null,
  published: Record<string, unknown> | null,
): Pick<BrainSectionChangeSummary, "added" | "edited" | "removed" | "changes"> {
  const currentCanonical = canonicalizeCompanyDna(current);
  const publishedCanonical = canonicalizeCompanyDna(published);

  if (!currentCanonical && !publishedCanonical) {
    return { added: 0, edited: 0, removed: 0, changes: [] };
  }

  if (!publishedCanonical && currentCanonical) {
    return {
      added: 1,
      edited: 0,
      removed: 0,
      changes: [
        {
          entityId: "company-dna",
          displayName: entityDisplayName("companyDna", current ?? {}),
          changeType: "added",
        },
      ],
    };
  }

  if (publishedCanonical && !currentCanonical) {
    return {
      added: 0,
      edited: 0,
      removed: 1,
      changes: [
        {
          entityId: "company-dna",
          displayName: entityDisplayName("companyDna", published ?? {}),
          changeType: "removed",
        },
      ],
    };
  }

  const changed =
    stableCanonicalString(currentCanonical) !== stableCanonicalString(publishedCanonical);

  return changed
    ? {
        added: 0,
        edited: 1,
        removed: 0,
        changes: [
          {
            entityId: "company-dna",
            displayName: entityDisplayName("companyDna", current ?? {}),
            changeType: "edited",
          },
        ],
      }
    : { added: 0, edited: 0, removed: 0, changes: [] };
}

function compareEntityLists(
  section: Exclude<BrainPublishSection, "companyDna">,
  current: Array<Record<string, unknown>>,
  published: Array<Record<string, unknown>>,
): Pick<BrainSectionChangeSummary, "added" | "edited" | "removed" | "changes"> {
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

  const changes: BrainSectionChangeDetail[] = [];

  for (const [id, item] of currentMap) {
    const previous = publishedMap.get(id);
    if (!previous) {
      changes.push({
        entityId: id,
        displayName: entityDisplayName(section, item),
        changeType: "added",
      });
      continue;
    }

    const currentCanonical = canonicalizeEntityForSection(section, item);
    const previousCanonical = canonicalizeEntityForSection(section, previous);

    if (stableCanonicalString(currentCanonical) !== stableCanonicalString(previousCanonical)) {
      changes.push({
        entityId: id,
        displayName: entityDisplayName(section, item),
        changeType: "edited",
      });
    }
  }

  for (const [id, item] of publishedMap) {
    if (!currentMap.has(id)) {
      changes.push({
        entityId: id,
        displayName: entityDisplayName(section, item),
        changeType: "removed",
      });
    }
  }

  return {
    added: changes.filter((change) => change.changeType === "added").length,
    edited: changes.filter((change) => change.changeType === "edited").length,
    removed: changes.filter((change) => change.changeType === "removed").length,
    changes,
  };
}

function sectionSummary(
  section: BrainPublishSection,
  counts: Pick<BrainSectionChangeSummary, "added" | "edited" | "removed" | "changes">,
): BrainSectionChangeSummary {
  return {
    section,
    label: BRAIN_PUBLISH_SECTION_LABELS[section],
    ...counts,
  };
}

function buildFirstPublishSummary(current: BrainSnapshot): BrainDraftSummary {
  const sections: BrainSectionChangeSummary[] = [
    sectionSummary(
      "companyDna",
      current.companyDna
        ? {
            added: 1,
            edited: 0,
            removed: 0,
            changes: [
              {
                entityId: "company-dna",
                displayName: entityDisplayName("companyDna", current.companyDna),
                changeType: "added",
              },
            ],
          }
        : { added: 0, edited: 0, removed: 0, changes: [] },
    ),
    sectionSummary("products", {
      added: current.products.length,
      edited: 0,
      removed: 0,
      changes: current.products.map((item) => ({
        entityId: String(item.id),
        displayName: entityDisplayName("products", item),
        changeType: "added" as BrainEntityChangeType,
      })),
    }),
    sectionSummary("knowledge", {
      added: current.knowledge.length,
      edited: 0,
      removed: 0,
      changes: current.knowledge.map((item) => ({
        entityId: String(item.id),
        displayName: entityDisplayName("knowledge", item),
        changeType: "added" as BrainEntityChangeType,
      })),
    }),
    sectionSummary("documents", {
      added: current.documents.length,
      edited: 0,
      removed: 0,
      changes: current.documents.map((item) => ({
        entityId: String(item.id),
        displayName: entityDisplayName("documents", item),
        changeType: "added" as BrainEntityChangeType,
      })),
    }),
    sectionSummary("behaviors", {
      added: current.behaviors.length,
      edited: 0,
      removed: 0,
      changes: current.behaviors.map((item) => ({
        entityId: String(item.id),
        displayName: entityDisplayName("behaviors", item),
        changeType: "added" as BrainEntityChangeType,
      })),
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

export function summarizeDraftChanges(
  current: BrainSnapshot,
  published: BrainSnapshot | null,
): BrainDraftSummary {
  if (!published) {
    return buildFirstPublishSummary(current);
  }

  const sections: BrainSectionChangeSummary[] = [
    sectionSummary("companyDna", compareCompanyDna(current.companyDna, published.companyDna)),
    sectionSummary("products", compareEntityLists("products", current.products, published.products)),
    sectionSummary(
      "knowledge",
      compareEntityLists("knowledge", current.knowledge, published.knowledge),
    ),
    sectionSummary(
      "documents",
      compareEntityLists("documents", current.documents, published.documents),
    ),
    sectionSummary(
      "behaviors",
      compareEntityLists("behaviors", current.behaviors, published.behaviors),
    ),
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
      ? sortEntitiesById(
          record.products.filter(
            (item): item is Record<string, unknown> =>
              !!item && typeof item === "object" && !Array.isArray(item),
          ),
        )
      : [],
    knowledge: Array.isArray(record.knowledge)
      ? sortEntitiesById(
          record.knowledge.filter(
            (item): item is Record<string, unknown> =>
              !!item && typeof item === "object" && !Array.isArray(item),
          ),
        )
      : [],
    documents: Array.isArray(record.documents)
      ? sortEntitiesById(
          record.documents.filter(
            (item): item is Record<string, unknown> =>
              !!item && typeof item === "object" && !Array.isArray(item),
          ),
        )
      : [],
    behaviors: Array.isArray(record.behaviors)
      ? sortEntitiesById(
          record.behaviors.filter(
            (item): item is Record<string, unknown> =>
              !!item && typeof item === "object" && !Array.isArray(item),
          ),
        )
      : [],
  };
}
