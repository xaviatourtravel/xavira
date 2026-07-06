import type { WorkspaceId } from "@/config/navigation";
import type { TranslateFn } from "@/lib/i18n/dictionary";

const WORKSPACE_LABEL_KEYS: Record<WorkspaceId, string> = {
  today: "navigation.today",
  communication: "navigation.communication",
  customer: "navigation.customers",
  operational: "navigation.operations",
  finance: "navigation.finance",
  performance: "navigation.performance",
  intelligence: "navigation.intelligence",
  settings: "navigation.settings",
};

const CHILD_HREF_LABEL_KEYS: Record<string, string> = {
  "/inbox": "navigation.inbox",
  "/business-brain": "navigation.businessBrain",
  "/ai-actions": "navigation.aiActions",
};

const CHILD_TITLE_LABEL_KEYS: Record<string, string> = {
  Automation: "navigation.automation",
  Insights: "navigation.insights",
  "Business Brain": "navigation.businessBrain",
  "AI Actions": "navigation.aiActions",
};

export function translateWorkspaceTitle(
  t: TranslateFn,
  workspaceId: WorkspaceId,
  fallback: string,
): string {
  const key = WORKSPACE_LABEL_KEYS[workspaceId];
  return key ? t(key) : fallback;
}

export function translateNavChildTitle(
  t: TranslateFn,
  href: string | undefined,
  fallback: string,
): string {
  if (href) {
    const hrefKey = CHILD_HREF_LABEL_KEYS[href.split("?")[0] ?? href];
    if (hrefKey) {
      return t(hrefKey);
    }
  }

  const titleKey = CHILD_TITLE_LABEL_KEYS[fallback];
  return titleKey ? t(titleKey) : fallback;
}

export function translateMobileNavTitle(t: TranslateFn, href: string, fallback: string): string {
  const path = href.split("?")[0] ?? href;
  const hrefKey = CHILD_HREF_LABEL_KEYS[path];
  if (hrefKey) {
    return t(hrefKey);
  }

  const workspaceEntry = Object.entries(WORKSPACE_LABEL_KEYS).find(([workspaceId]) => {
    const workspaceHref = workspaceHrefById[workspaceId as WorkspaceId];
    return workspaceHref === path;
  });

  if (workspaceEntry) {
    return t(workspaceEntry[1]);
  }

  return fallback;
}

const workspaceHrefById: Record<WorkspaceId, string> = {
  today: "/today",
  communication: "/inbox",
  customer: "/leads",
  operational: "/operations",
  finance: "/finance",
  performance: "/performance",
  intelligence: "/business-brain",
  settings: "/settings",
};
