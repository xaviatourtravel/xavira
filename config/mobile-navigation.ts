import {
  BarChart3,
  Home,
  MessageCircle,
  Settings,
  Users,
  Wallet,
  Workflow,
} from "lucide-react";

import type { Permission } from "@/lib/auth/permission-matrix";

export type MobilePrimaryNavItem = {
  title: string;
  href: string;
  icon: typeof Home;
  permission: Permission;
};

/** Mobile bottom bar — 5 most-used workspaces + More */
export const MOBILE_PRIMARY_NAV: MobilePrimaryNavItem[] = [
  {
    title: "Hari Ini",
    href: "/today",
    icon: Home,
    permission: "today.view",
  },
  {
    title: "Komunikasi",
    href: "/inbox",
    icon: MessageCircle,
    permission: "inbox.view",
  },
  {
    title: "Customer",
    href: "/leads",
    icon: Users,
    permission: "leads.view",
  },
  {
    title: "Operasional",
    href: "/operations",
    icon: Workflow,
    permission: "today.view",
  },
  {
    title: "Keuangan",
    href: "/finance",
    icon: Wallet,
    permission: "payments.view",
  },
];

export const MOBILE_MORE_NAV: MobilePrimaryNavItem[] = [
  {
    title: "Performance",
    href: "/performance",
    icon: BarChart3,
    permission: "dashboard.view",
  },
  {
    title: "Pengaturan",
    href: "/settings",
    icon: Settings,
    permission: "settings.view",
  },
];

export const MOBILE_PRIMARY_HREFS = new Set(
  MOBILE_PRIMARY_NAV.map((item) => item.href),
);
