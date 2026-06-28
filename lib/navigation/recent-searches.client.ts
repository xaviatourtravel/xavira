const STORAGE_KEY = "desklabs:recent-searches";
const MAX_RECENT = 6;

export type RecentSearchEntry = {
  id: string;
  label: string;
  href: string;
  at: number;
};

export const DEFAULT_RECENT_SEARCHES: RecentSearchEntry[] = [
  { id: "recent-anang", label: "Pak Anang", href: "/leads", at: 0 },
  { id: "recent-finance", label: "Finance", href: "/finance", at: 0 },
  { id: "recent-task-today", label: "Task Hari Ini", href: "/today", at: 0 },
  { id: "recent-yunnan", label: "Yunnan", href: "/bookings", at: 0 },
];

export function readRecentSearches(): RecentSearchEntry[] {
  if (typeof window === "undefined") {
    return DEFAULT_RECENT_SEARCHES;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return DEFAULT_RECENT_SEARCHES;
    }

    const parsed = JSON.parse(raw) as RecentSearchEntry[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return DEFAULT_RECENT_SEARCHES;
    }

    return parsed.slice(0, MAX_RECENT);
  } catch {
    return DEFAULT_RECENT_SEARCHES;
  }
}

export function pushRecentSearch(entry: Omit<RecentSearchEntry, "at">) {
  if (typeof window === "undefined") {
    return;
  }

  const next: RecentSearchEntry = {
    ...entry,
    at: Date.now(),
  };

  const existing = readRecentSearches().filter(
    (item) => item.href !== next.href && item.label !== next.label,
  );

  const merged = [next, ...existing].slice(0, MAX_RECENT);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
}
