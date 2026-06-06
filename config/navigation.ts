import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  CalendarCheck,
  FileText,
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

export function isNavItemActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
