import { CONTENT_PLATFORM_OPTIONS, CONTENT_STATUS_OPTIONS } from "@/lib/content/constants";
import { getJakartaDateString } from "@/lib/dashboard/jakarta-date";
import type { ContentBoardItem } from "@/lib/content/queries";

export const CONTENT_VIEWS = ["board", "list", "calendar"] as const;

export type ContentView = (typeof CONTENT_VIEWS)[number];

export type ContentPlanningSearchParams = {
  view?: string;
  platform?: string;
  status?: string;
  assigned?: string;
};

export type ContentPlanningFilters = {
  view: ContentView;
  platform: string;
  status: string;
  assigned: string;
};

export type ContentCalendarGroup =
  | "today"
  | "tomorrow"
  | "this_week"
  | "later"
  | "unscheduled";

export const CONTENT_CALENDAR_GROUPS: ReadonlyArray<{
  key: ContentCalendarGroup;
  label: string;
}> = [
  { key: "today", label: "Today" },
  { key: "tomorrow", label: "Tomorrow" },
  { key: "this_week", label: "This Week" },
  { key: "later", label: "Later" },
  { key: "unscheduled", label: "No Publish Date" },
];

const PLATFORM_SET = new Set<string>(
  CONTENT_PLATFORM_OPTIONS.map((option) => option.value),
);
const STATUS_SET = new Set<string>(
  CONTENT_STATUS_OPTIONS.map((option) => option.value),
);

function addDaysToDateString(dateString: string, days: number) {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return date.toISOString().slice(0, 10);
}

function getWeekStartMonday(dateString: string) {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const weekday = date.getUTCDay();
  const diff = weekday === 0 ? -6 : 1 - weekday;
  return addDaysToDateString(dateString, diff);
}

function getWeekEndSunday(dateString: string) {
  return addDaysToDateString(getWeekStartMonday(dateString), 6);
}

export function parseContentView(value: string | undefined): ContentView {
  if (value && CONTENT_VIEWS.includes(value as ContentView)) {
    return value as ContentView;
  }

  return "board";
}

export function parseContentPlanningFilters(
  searchParams: ContentPlanningSearchParams,
): ContentPlanningFilters {
  const platform =
    searchParams.platform && PLATFORM_SET.has(searchParams.platform)
      ? searchParams.platform
      : "";
  const status =
    searchParams.status && STATUS_SET.has(searchParams.status)
      ? searchParams.status
      : "";

  return {
    view: parseContentView(searchParams.view),
    platform,
    status,
    assigned: searchParams.assigned?.trim() ?? "",
  };
}

export function buildContentPlanningHref(
  filters: ContentPlanningFilters,
  overrides: Partial<ContentPlanningFilters> = {},
) {
  const nextFilters = { ...filters, ...overrides };
  const params = new URLSearchParams();

  if (nextFilters.view !== "board") {
    params.set("view", nextFilters.view);
  }

  if (nextFilters.platform) {
    params.set("platform", nextFilters.platform);
  }

  if (nextFilters.status) {
    params.set("status", nextFilters.status);
  }

  if (nextFilters.assigned) {
    params.set("assigned", nextFilters.assigned);
  }

  const query = params.toString();
  return query ? `/content?${query}` : "/content";
}

export function filterContentItems(
  items: ContentBoardItem[],
  filters: ContentPlanningFilters,
  currentUserId: string,
) {
  return items.filter((item) => {
    if (filters.platform && item.platform !== filters.platform) {
      return false;
    }

    if (filters.status && item.status !== filters.status) {
      return false;
    }

    if (filters.assigned === "unassigned" && item.assigned_to) {
      return false;
    }

    if (filters.assigned === "me" && item.assigned_to !== currentUserId) {
      return false;
    }

    if (
      filters.assigned &&
      filters.assigned !== "unassigned" &&
      filters.assigned !== "me" &&
      item.assigned_to !== filters.assigned
    ) {
      return false;
    }

    return true;
  });
}

export function sortContentByPublishDate(items: ContentBoardItem[]) {
  return [...items].sort((left, right) => {
    if (!left.publish_date && !right.publish_date) {
      return left.title.localeCompare(right.title, "id");
    }

    if (!left.publish_date) {
      return 1;
    }

    if (!right.publish_date) {
      return -1;
    }

    const dateCompare = left.publish_date.localeCompare(right.publish_date);
    if (dateCompare !== 0) {
      return dateCompare;
    }

    return left.title.localeCompare(right.title, "id");
  });
}

export function classifyPublishDateGroup(
  publishDate: string | null,
  referenceDate = getJakartaDateString(),
): ContentCalendarGroup {
  if (!publishDate) {
    return "unscheduled";
  }

  const date = publishDate.slice(0, 10);

  if (date === referenceDate) {
    return "today";
  }

  const tomorrow = addDaysToDateString(referenceDate, 1);

  if (date === tomorrow) {
    return "tomorrow";
  }

  const weekStart = getWeekStartMonday(referenceDate);
  const weekEnd = getWeekEndSunday(referenceDate);

  if (date >= weekStart && date <= weekEnd) {
    return "this_week";
  }

  return "later";
}

export function groupContentByPublishDate(items: ContentBoardItem[]) {
  const grouped = Object.fromEntries(
    CONTENT_CALENDAR_GROUPS.map((group) => [group.key, [] as ContentBoardItem[]]),
  ) as Record<ContentCalendarGroup, ContentBoardItem[]>;

  for (const item of sortContentByPublishDate(items)) {
    const group = classifyPublishDateGroup(item.publish_date);
    grouped[group].push(item);
  }

  return grouped;
}

export function formatContentPublishDate(value: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeZone: "Asia/Jakarta",
  }).format(new Date(`${value.slice(0, 10)}T12:00:00`));
}

export function hasActiveContentPlanningFilters(filters: ContentPlanningFilters) {
  return Boolean(filters.platform || filters.status || filters.assigned);
}
