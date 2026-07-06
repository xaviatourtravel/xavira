export type BusinessBrainTimelineEventType =
  | "identity-updated"
  | "product-created"
  | "product-updated"
  | "knowledge-created"
  | "knowledge-updated"
  | "knowledge-published"
  | "document-uploaded"
  | "document-updated"
  | "document-published"
  | "rules-updated"
  | "publish-completed"
  | "business-brain-published";

export type BusinessBrainTimelineEvent = {
  id: string;
  type: BusinessBrainTimelineEventType;
  title: string;
  description: string;
  occurredAt: string;
};

export type BusinessBrainTimelineResult = {
  events: BusinessBrainTimelineEvent[];
};

export const BUSINESS_BRAIN_TIMELINE_EVENT_TITLES: Record<
  BusinessBrainTimelineEventType,
  string
> = {
  "identity-updated": "Identity Updated",
  "product-created": "Product Created",
  "product-updated": "Product Updated",
  "knowledge-created": "Knowledge Created",
  "knowledge-updated": "Knowledge Updated",
  "knowledge-published": "Knowledge Published",
  "document-uploaded": "Document Uploaded",
  "document-updated": "Document Updated",
  "document-published": "Document Published",
  "rules-updated": "Rules Updated",
  "publish-completed": "Publish Completed",
  "business-brain-published": "Business Brain Published",
};

export const BUSINESS_BRAIN_TIMELINE_LIMIT = 20;
