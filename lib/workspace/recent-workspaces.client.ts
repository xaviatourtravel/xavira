"use client";

import type { RecentWorkspaceEntry } from "@/lib/workspace/types";

const STORAGE_KEY = "desklabs-recent-workspaces";
const MAX_RECENT = 3;

function readRecent(): RecentWorkspaceEntry[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as RecentWorkspaceEntry[];
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (entry) =>
        typeof entry?.id === "string" && typeof entry?.visitedAt === "string",
    );
  } catch {
    return [];
  }
}

function writeRecent(entries: RecentWorkspaceEntry[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function recordWorkspaceVisit(workspaceId: string) {
  const now = new Date().toISOString();
  const existing = readRecent().filter((entry) => entry.id !== workspaceId);
  const next = [{ id: workspaceId, visitedAt: now }, ...existing].slice(
    0,
    MAX_RECENT,
  );
  writeRecent(next);
  return next;
}

export function getRecentWorkspaceIds(): string[] {
  return readRecent().map((entry) => entry.id);
}
