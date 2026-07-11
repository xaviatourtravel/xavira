"use client";

import {
  CalendarCheck,
  MessageSquare,
  NotebookPen,
  Route,
  Sparkles,
  User,
  UserRound,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import type { TimelineEventCategory } from "./types";

export const TIMELINE_CATEGORY_ICONS: Record<TimelineEventCategory, LucideIcon> = {
  conversation: MessageSquare,
  ai: Sparkles,
  booking: CalendarCheck,
  finance: Wallet,
  journey: Route,
  assignment: UserRound,
  internal_note: NotebookPen,
  customer: User,
};

export function getTimelineCategoryIcon(category: TimelineEventCategory): LucideIcon {
  return TIMELINE_CATEGORY_ICONS[category];
}
