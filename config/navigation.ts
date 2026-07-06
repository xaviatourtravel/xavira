import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Brain,
  Home,
  MessageCircle,
  Settings,
  Users,
  Wallet,
  Workflow,
} from "lucide-react";

import type { Permission } from "@/lib/auth/permission-matrix";

/** Business Operating System workspaces — max 6 + settings */
export type WorkspaceId =
  | "today"
  | "communication"
  | "customer"
  | "operational"
  | "finance"
  | "performance"
  | "intelligence"
  | "settings";

export type NavAttentionBadgeKey = "communication" | "operational" | "finance";

export type WorkspaceNavChild = {
  title: string;
  href?: string;
  permission?: Permission;
  /** Shown disabled in sidebar until the route is available. */
  comingSoon?: boolean;
};

export type WorkspaceNavItem = {
  id: WorkspaceId;
  title: string;
  href: string;
  icon: LucideIcon;
  permission: Permission;
  /** One-line business question this workspace answers */
  businessQuestion: string;
  badgeKey?: NavAttentionBadgeKey;
  items: readonly WorkspaceNavChild[];
};

export const WORKSPACE_NAV: readonly WorkspaceNavItem[] = [
  {
    id: "today",
    title: "Hari Ini",
    href: "/today",
    icon: Home,
    permission: "today.view",
    businessQuestion: "Apa yang harus saya kerjakan sekarang?",
    items: [],
  },
  {
    id: "communication",
    title: "Komunikasi",
    href: "/inbox",
    icon: MessageCircle,
    permission: "inbox.view",
    businessQuestion: "Siapa yang menunggu respons?",
    badgeKey: "communication",
    items: [
      { title: "Inbox", href: "/inbox" },
      { title: "WhatsApp", href: "/inbox?filter=whatsapp" },
      { title: "Instagram", href: "/inbox?channel=instagram" },
      { title: "Email", href: "/inbox?channel=email" },
    ],
  },
  {
    id: "customer",
    title: "Pelanggan",
    href: "/leads",
    icon: Users,
    permission: "leads.view",
    businessQuestion: "Bagaimana perjalanan pelanggan saya?",
    items: [
      { title: "Pelanggan", href: "/leads" },
      { title: "Pipeline", href: "/leads/kanban" },
      { title: "Booking", href: "/bookings" },
      { title: "Paket", href: "/packages", permission: "bookings.view" },
    ],
  },
  {
    id: "operational",
    title: "Operasional",
    href: "/operations",
    icon: Workflow,
    permission: "today.view",
    businessQuestion: "Apa yang harus diselesaikan operasional hari ini?",
    badgeKey: "operational",
    items: [
      { title: "Task", href: "/today", permission: "today.view" },
      { title: "Follow Up", href: "/follow-ups", permission: "followups.view" },
      {
        title: "Kalender",
        href: "/follow-ups/queue",
        permission: "followups.view",
      },
    ],
  },
  {
    id: "finance",
    title: "Keuangan",
    href: "/finance",
    icon: Wallet,
    permission: "payments.view",
    businessQuestion: "Bagaimana kondisi pembayaran customer?",
    badgeKey: "finance",
    items: [
      { title: "Pembayaran", href: "/revenue" },
      { title: "Invoice", href: "/revenue?view=invoices" },
    ],
  },
  {
    id: "performance",
    title: "Performa",
    href: "/performance",
    icon: BarChart3,
    permission: "dashboard.view",
    businessQuestion: "Apakah bisnis saya bergerak ke arah yang benar?",
    items: [
      { title: "Dasbor", href: "/dashboard" },
      { title: "Campaign", href: "/campaigns", permission: "content.view" },
      { title: "Konten", href: "/content", permission: "content.view" },
      {
        title: "Analitik",
        href: "/content/instagram-analytics",
        permission: "content.view",
      },
    ],
  },
  {
    id: "intelligence",
    title: "Intelligence",
    href: "/business-brain",
    icon: Brain,
    permission: "dashboard.view",
    businessQuestion: "How prepared is your AI to assist customers?",
    items: [
      { title: "Business Brain", href: "/business-brain" },
      { title: "AI Actions", href: "/ai-actions" },
      { title: "Automation", comingSoon: true },
      { title: "Insights", comingSoon: true },
    ],
  },
  {
    id: "settings",
    title: "Pengaturan",
    href: "/settings",
    icon: Settings,
    permission: "settings.view",
    businessQuestion: "Bagaimana workspace saya dikonfigurasi?",
    items: [],
  },
] as const;

/** Route prefixes owned by each workspace (for active-state detection) */
export const WORKSPACE_ROUTE_PREFIXES: Record<WorkspaceId, readonly string[]> = {
  today: ["/today"],
  communication: ["/inbox"],
  customer: ["/leads", "/customers", "/bookings", "/packages"],
  operational: ["/operations", "/follow-ups"],
  finance: ["/finance", "/revenue"],
  performance: ["/performance", "/dashboard", "/campaigns", "/content", "/scripts"],
  intelligence: ["/business-brain", "/ai-actions"],
  settings: ["/settings"],
};

export type NavAttentionBadges = Record<NavAttentionBadgeKey, number>;

export const EMPTY_NAV_ATTENTION_BADGES: NavAttentionBadges = {
  communication: 0,
  operational: 0,
  finance: 0,
};

export function getWorkspaceForPath(pathname: string): WorkspaceId | null {
  const normalized =
    pathname.endsWith("/") && pathname.length > 1
      ? pathname.slice(0, -1)
      : pathname;

  for (const workspace of WORKSPACE_NAV) {
    const prefixes = WORKSPACE_ROUTE_PREFIXES[workspace.id];
    if (
      prefixes.some(
        (prefix) =>
          normalized === prefix || normalized.startsWith(`${prefix}/`),
      )
    ) {
      return workspace.id;
    }
  }

  return null;
}

export function isNavPathActive(pathname: string, href: string): boolean {
  const path = href.split("?")[0] ?? href;
  const normalizedPath =
    pathname.endsWith("/") && pathname.length > 1
      ? pathname.slice(0, -1)
      : pathname;

  if (normalizedPath === path) {
    return true;
  }

  if (path === "/leads" && normalizedPath.startsWith("/customers/")) {
    return true;
  }

  if (path === "/revenue" && normalizedPath.startsWith("/revenue")) {
    return true;
  }

  if (path === "/finance" && normalizedPath.startsWith("/finance")) {
    return true;
  }

  if (path === "/operations" && normalizedPath.startsWith("/operations")) {
    return true;
  }

  if (path === "/performance" && normalizedPath.startsWith("/performance")) {
    return true;
  }

  return normalizedPath.startsWith(`${path}/`);
}

export function isWorkspaceActive(workspace: WorkspaceNavItem, pathname: string) {
  if (getWorkspaceForPath(pathname) === workspace.id) {
    return true;
  }

  return workspace.items.some(
    (item) => item.href && isNavPathActive(pathname, item.href),
  );
}

export function filterWorkspaceNav(
  items: readonly WorkspaceNavItem[],
  permissions: ReadonlySet<Permission>,
): WorkspaceNavItem[] {
  return items
    .filter((workspace) => permissions.has(workspace.permission))
    .map((workspace) => ({
      ...workspace,
      items: workspace.items.filter(
        (item) => !item.permission || permissions.has(item.permission),
      ),
    }));
}

export function filterNavChildByPermission(
  item: WorkspaceNavChild,
  permissions: ReadonlySet<Permission>,
  fallbackPermission: Permission,
) {
  const permission = item.permission ?? fallbackPermission;
  return permissions.has(permission);
}

/** @deprecated Use WORKSPACE_NAV — kept for gradual migration */
export const dashboardNav = WORKSPACE_NAV;

export type DashboardNavItem = WorkspaceNavItem;

export function isNavGroup(item: WorkspaceNavItem) {
  return item.items.length > 0;
}

export function filterDashboardNav<T extends WorkspaceNavItem>(
  items: readonly T[],
  permissions: ReadonlySet<Permission>,
): T[] {
  return filterWorkspaceNav(items, permissions) as T[];
}

export function isNavItemActive(pathname: string, href: string) {
  return isNavPathActive(pathname, href);
}
