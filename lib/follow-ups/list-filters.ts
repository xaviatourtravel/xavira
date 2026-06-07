export const FOLLOW_UP_CENTER_FILTERS = [
  "pending",
  "today",
  "overdue",
  "completed",
] as const;

export type FollowUpCenterFilter =
  (typeof FOLLOW_UP_CENTER_FILTERS)[number];

export type FollowUpCenterSearchParams = {
  filter?: string;
  error?: string;
  success?: string;
};

export function isFollowUpCenterFilter(
  value: string,
): value is FollowUpCenterFilter {
  return FOLLOW_UP_CENTER_FILTERS.includes(value as FollowUpCenterFilter);
}

export function parseFollowUpCenterFilter(
  params: FollowUpCenterSearchParams,
): FollowUpCenterFilter {
  const filter = params.filter ?? "pending";
  return isFollowUpCenterFilter(filter) ? filter : "pending";
}

export function buildFollowUpCenterHref(filter: FollowUpCenterFilter) {
  if (filter === "pending") {
    return "/follow-ups";
  }

  return `/follow-ups?filter=${filter}`;
}

export function getFollowUpTodayBounds() {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  return { todayStart, todayEnd };
}

export const FOLLOW_UP_CENTER_FILTER_LABELS: Record<
  FollowUpCenterFilter,
  string
> = {
  pending: "All Pending",
  today: "Due Today",
  overdue: "Overdue",
  completed: "Completed",
};
