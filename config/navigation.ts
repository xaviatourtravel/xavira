import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  CalendarCheck,
  FileText,
  Inbox,
  LayoutDashboard,
  Megaphone,
  MessageSquare,
  Package,
  Settings,
  Users,
} from "lucide-react";

export type NavLinkItem = {
  title: string;
  href: string;
  icon: LucideIcon;
};

export type NavGroupItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  items: ReadonlyArray<{
    title: string;
    href: string;
  }>;
};

export type DashboardNavItem = NavLinkItem | NavGroupItem;

export function isNavGroup(item: DashboardNavItem): item is NavGroupItem {
  return "items" in item;
}

export const dashboardNav: DashboardNavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Leads",
    href: "/leads",
    icon: Users,
    items: [{ title: "Lead Kanban", href: "/leads/kanban" }],
  },
  {
    title: "Packages",
    href: "/packages",
    icon: Package,
  },
  {
    title: "Bookings",
    href: "/bookings",
    icon: CalendarCheck,
  },
  {
    title: "Follow Ups",
    href: "/follow-ups",
    icon: MessageSquare,
    items: [{ title: "Follow Up Queue", href: "/follow-ups/queue" }],
  },
  {
    title: "Inbox",
    href: "/inbox",
    icon: Inbox,
  },
  {
    title: "Campaigns",
    href: "/campaigns",
    icon: Megaphone,
  },
  {
    title: "Content",
    href: "/content",
    icon: FileText,
  },
  {
    title: "Scripts",
    href: "/scripts",
    icon: BarChart3,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

export function isLeadsNavPath(pathname: string) {
  return pathname === "/leads" || pathname.startsWith("/leads/");
}

export function isKanbanNavActive(pathname: string) {
  return (
    pathname === "/leads/kanban" || pathname.startsWith("/leads/kanban/")
  );
}

export function isFollowUpsNavPath(pathname: string) {
  return pathname === "/follow-ups" || pathname.startsWith("/follow-ups/");
}

export function isFollowUpQueueNavActive(pathname: string) {
  return (
    pathname === "/follow-ups/queue" ||
    pathname.startsWith("/follow-ups/queue/")
  );
}

export function isNavItemActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
