export const BRAIN_PUBLISH_STATUSES = ["draft", "published"] as const;
export type BrainPublishStatus = (typeof BRAIN_PUBLISH_STATUSES)[number];

export const BRAIN_VERSION_STATUSES = ["published", "superseded"] as const;
export type BrainVersionStatus = (typeof BRAIN_VERSION_STATUSES)[number];

export const BRAIN_PUBLISH_SECTIONS = [
  "companyDna",
  "products",
  "knowledge",
  "documents",
  "behaviors",
] as const;

export type BrainPublishSection = (typeof BRAIN_PUBLISH_SECTIONS)[number];

export const BRAIN_PUBLISH_SECTION_LABELS: Record<BrainPublishSection, string> = {
  companyDna: "Identity",
  products: "Products",
  knowledge: "Knowledge",
  documents: "Documents",
  behaviors: "Rules",
};

export type BrainEntityChangeType = "added" | "edited" | "removed";

export type BrainSectionChangeDetail = {
  entityId: string;
  displayName: string;
  changeType: BrainEntityChangeType;
};

export type BrainSectionChangeSummary = {
  section: BrainPublishSection;
  label: string;
  added: number;
  edited: number;
  removed: number;
  changes: BrainSectionChangeDetail[];
};

export type BrainPublishUserRef = {
  id: string;
  name: string;
};

export type BrainPublishStatusView = {
  status: BrainPublishStatus;
  lastPublishedAt: string | null;
  lastPublishedBy: BrainPublishUserRef | null;
  draftChangesCount: number;
  draftUpdatedAt: string | null;
  currentVersionNumber: number | null;
  currentVersionId: string | null;
};

export type BrainDraftSummary = {
  sections: BrainSectionChangeSummary[];
  totalChanges: number;
  hasUnpublishedChanges: boolean;
};

export type BrainVersionListItem = {
  id: string;
  versionNumber: number;
  status: BrainVersionStatus;
  publishedAt: string;
  publishedBy: BrainPublishUserRef | null;
};

export type BrainSnapshot = {
  capturedAt: string;
  companyDna: Record<string, unknown> | null;
  products: Array<Record<string, unknown>>;
  knowledge: Array<Record<string, unknown>>;
  documents: Array<Record<string, unknown>>;
  behaviors: Array<Record<string, unknown>>;
};

export type BrainPublishResult = {
  version: BrainVersionListItem;
  status: BrainPublishStatusView;
  draftSummary: BrainDraftSummary;
  versions: BrainVersionListItem[];
};
