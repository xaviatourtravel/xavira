import {
  CalendarCheck,
  Inbox,
  LayoutDashboard,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";

import type { Permission } from "@/lib/auth/permission-matrix";

export type MobilePrimaryNavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  permission: Permission;
};

export const MOBILE_PRIMARY_NAV: MobilePrimaryNavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    permission: "dashboard.view",
  },
  {
    title: "Inbox",
    href: "/inbox",
    icon: Inbox,
    permission: "inbox.view",
  },
  {
    title: "Leads",
    href: "/leads",
    icon: Users,
    permission: "leads.view",
  },
  {
    title: "Bookings",
    href: "/bookings",
    icon: CalendarCheck,
    permission: "bookings.view",
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
    permission: "settings.view",
  },
];

export const MOBILE_PRIMARY_HREFS = new Set(
  MOBILE_PRIMARY_NAV.map((item) => item.href),
);
