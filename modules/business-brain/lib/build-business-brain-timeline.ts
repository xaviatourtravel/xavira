import {
  BUSINESS_BRAIN_TIMELINE_EVENT_TITLES,
  BUSINESS_BRAIN_TIMELINE_LIMIT,
  type BusinessBrainTimelineEvent,
  type BusinessBrainTimelineEventType,
  type BusinessBrainTimelineResult,
} from "@/modules/business-brain/types/business-brain-timeline";

export type BusinessBrainTimelineInput = {
  brain: {
    id: string;
    published_at: string | null;
  } | null;
  companyDna: {
    id: string;
    updated_at: string;
  } | null;
  products: Array<{
    id: string;
    name: string;
    status: string;
    created_at: string;
    updated_at: string;
  }>;
  knowledge: Array<{
    id: string;
    title: string;
    status: string;
    created_at: string;
    updated_at: string;
  }>;
  documents: Array<{
    id: string;
    name: string;
    status: string;
    created_at: string;
    updated_at: string;
  }>;
  behaviors: Array<{
    id: string;
    name: string;
    created_at: string;
    updated_at: string;
  }>;
  versions: Array<{
    id: string;
    version_number: number;
    published_at: string;
    status: string;
  }>;
};

const CREATION_UPDATE_THRESHOLD_MS = 60_000;

function isValidTimestamp(value: string): boolean {
  const time = new Date(value).getTime();
  return Number.isFinite(time);
}

function isCreationOnly(createdAt: string, updatedAt: string): boolean {
  if (!isValidTimestamp(createdAt) || !isValidTimestamp(updatedAt)) {
    return true;
  }
  return (
    Math.abs(new Date(updatedAt).getTime() - new Date(createdAt).getTime()) <
    CREATION_UPDATE_THRESHOLD_MS
  );
}

function isPublishedStatus(status: string): boolean {
  return status.trim().toLowerCase() === "published";
}

function displayName(value: string, fallback: string): string {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

function pushEvent(
  events: BusinessBrainTimelineEvent[],
  event: BusinessBrainTimelineEvent,
) {
  if (!isValidTimestamp(event.occurredAt)) return;
  events.push(event);
}

function makeEvent(
  id: string,
  type: BusinessBrainTimelineEventType,
  description: string,
  occurredAt: string,
): BusinessBrainTimelineEvent {
  return {
    id,
    type,
    title: BUSINESS_BRAIN_TIMELINE_EVENT_TITLES[type],
    description,
    occurredAt,
  };
}

export function buildBusinessBrainTimeline(
  input: BusinessBrainTimelineInput,
): BusinessBrainTimelineResult {
  const events: BusinessBrainTimelineEvent[] = [];

  if (input.companyDna?.updated_at) {
    pushEvent(
      events,
      makeEvent(
        `identity-${input.companyDna.id}`,
        "identity-updated",
        "Identity settings were updated.",
        input.companyDna.updated_at,
      ),
    );
  }

  for (const product of input.products) {
    const name = displayName(product.name, "Untitled Product");
    pushEvent(
      events,
      makeEvent(
        `product-${product.id}-created`,
        "product-created",
        `${name} added.`,
        product.created_at,
      ),
    );

    if (!isCreationOnly(product.created_at, product.updated_at)) {
      pushEvent(
        events,
        makeEvent(
          `product-${product.id}-updated`,
          "product-updated",
          `${name} was updated.`,
          product.updated_at,
        ),
      );
    }
  }

  for (const article of input.knowledge) {
    const title = displayName(article.title, "Untitled Article");
    pushEvent(
      events,
      makeEvent(
        `knowledge-${article.id}-created`,
        "knowledge-created",
        `${title} was created.`,
        article.created_at,
      ),
    );

    if (!isCreationOnly(article.created_at, article.updated_at)) {
      pushEvent(
        events,
        makeEvent(
          `knowledge-${article.id}-updated`,
          "knowledge-updated",
          `${title} was updated.`,
          article.updated_at,
        ),
      );
    }

    if (isPublishedStatus(article.status)) {
      const publishedAt = isCreationOnly(article.created_at, article.updated_at)
        ? article.created_at
        : article.updated_at;
      pushEvent(
        events,
        makeEvent(
          `knowledge-${article.id}-published`,
          "knowledge-published",
          `${title} was published.`,
          publishedAt,
        ),
      );
    }
  }

  for (const document of input.documents) {
    const name = displayName(document.name, "Untitled Document");
    pushEvent(
      events,
      makeEvent(
        `document-${document.id}-uploaded`,
        "document-uploaded",
        `${name} was uploaded.`,
        document.created_at,
      ),
    );

    if (!isCreationOnly(document.created_at, document.updated_at)) {
      pushEvent(
        events,
        makeEvent(
          `document-${document.id}-updated`,
          "document-updated",
          `${name} was updated.`,
          document.updated_at,
        ),
      );
    }

    if (isPublishedStatus(document.status)) {
      const publishedAt = isCreationOnly(document.created_at, document.updated_at)
        ? document.created_at
        : document.updated_at;
      pushEvent(
        events,
        makeEvent(
          `document-${document.id}-published`,
          "document-published",
          `${name} was published.`,
          publishedAt,
        ),
      );
    }
  }

  for (const behavior of input.behaviors) {
    if (isCreationOnly(behavior.created_at, behavior.updated_at)) {
      continue;
    }

    const name = displayName(behavior.name, "Rule");
    pushEvent(
      events,
      makeEvent(
        `rules-${behavior.id}-updated`,
        "rules-updated",
        `${name} was updated.`,
        behavior.updated_at,
      ),
    );
  }

  for (const version of input.versions) {
    if (!isPublishedStatus(version.status)) continue;

    pushEvent(
      events,
      makeEvent(
        `publish-${version.id}`,
        "publish-completed",
        `Version ${version.version_number} published.`,
        version.published_at,
      ),
    );
  }

  if (input.brain?.published_at) {
    pushEvent(
      events,
      makeEvent(
        `brain-${input.brain.id}-published`,
        "business-brain-published",
        "Latest AI knowledge is now live.",
        input.brain.published_at,
      ),
    );
  }

  const sorted = events.sort(
    (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
  );

  return {
    events: sorted.slice(0, BUSINESS_BRAIN_TIMELINE_LIMIT),
  };
}

export function emptyBusinessBrainTimelineResult(): BusinessBrainTimelineResult {
  return { events: [] };
}
