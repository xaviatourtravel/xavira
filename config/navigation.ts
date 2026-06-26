import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  BookOpen,
  CalendarCheck,
  FileText,
  Inbox,
  LayoutDashboard,
  Sun,
  Megaphone,
  MessageSquare,
  Package,
  Settings,
  TrendingUp,
  Users,
} from "lucide-react";

import type { Permission } from "@/lib/auth/permission-matrix";

export type NavLinkItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  permission: Permission;
};

export type NavGroupItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  permission: Permission;
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
    title: "Today",
    href: "/today",
    icon: Sun,
    permission: "today.view",
  },
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    permission: "dashboard.view",
  },
  {
    title: "Revenue",
    href: "/revenue",
    icon: TrendingUp,
    permission: "dashboard.view",
  },
  {
    title: "Leads",
    href: "/leads",
    icon: Users,
    permission: "leads.view",
    items: [
      { title: "Lead Kanban", href: "/leads/kanban" },
    ],
  },
  {
    title: "Packages",
    href: "/packages",
    icon: Package,
    permission: "bookings.view",
  },
  {
    title: "Bookings",
    href: "/bookings",
    icon: CalendarCheck,
    permission: "bookings.view",
  },
  {
    title: "Follow Ups",
    href: "/follow-ups",
    icon: MessageSquare,
    permission: "followups.view",
    items: [{ title: "Follow Up Queue", href: "/follow-ups/queue" }],
  },
  {
    title: "Inbox",
    href: "/inbox",
    icon: Inbox,
    permission: "inbox.view",
  },
  {
    title: "Campaigns",
    href: "/campaigns",
    icon: Megaphone,
    permission: "content.view",
  },
  {
    title: "Content",
    href: "/content",
    icon: FileText,
    permission: "content.view",
    items: [
      { title: "Content Board", href: "/content" },
      { title: "Instagram Analytics", href: "/content/instagram-analytics" },
    ],
  },
  {
    title: "Knowledge Hub",
    href: "/knowledge",
    icon: BookOpen,
    permission: "knowledge.view",
  },
  {
    title: "Scripts",
    href: "/scripts",
    icon: BarChart3,
    permission: "leads.view",
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
    permission: "settings.view",
  },
];

export function isLeadsNavPath(pathname: string) {
  return (
    pathname === "/leads" ||
    pathname.startsWith("/leads/") ||
    pathname === "/customers" ||
    pathname.startsWith("/customers/")
  );
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

export function filterDashboardNav<T extends DashboardNavItem>(
  items: readonly T[],
  permissions: ReadonlySet<Permission>,
): T[] {
  return items.filter((item) => permissions.has(item.permission));
}
