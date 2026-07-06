export const BUSINESS_BRAIN_WORKSPACE_TABS = [
  {
    id: "overview",
    slug: "overview",
    label: "Overview",
    href: "/business-brain",
  },
  {
    id: "identity",
    slug: "identity",
    label: "Identity",
    href: "/business-brain/identity",
  },
  {
    id: "products",
    slug: "products",
    label: "Products",
    href: "/business-brain/products",
  },
  {
    id: "knowledge",
    slug: "knowledge",
    label: "Knowledge",
    href: "/business-brain/knowledge",
  },
  {
    id: "documents",
    slug: "documents",
    label: "Documents",
    href: "/business-brain/documents",
  },
  {
    id: "behaviors",
    slug: "behaviors",
    label: "Rules",
    href: "/business-brain/behaviors",
  },
  {
    id: "playground",
    slug: "playground",
    label: "Test AI",
    href: "/business-brain/playground",
  },
  {
    id: "publish",
    slug: "publish",
    label: "Publish",
    href: "/business-brain/publish",
  },
] as const;

/** Hidden from main tabs but reachable via direct URL. */
export const BUSINESS_BRAIN_HIDDEN_SECTIONS = [
  {
    id: "ai-permissions",
    slug: "ai-permissions",
    label: "AI Permissions",
    href: "/business-brain/ai-permissions",
  },
] as const;

export type BusinessBrainWorkspaceTabId =
  (typeof BUSINESS_BRAIN_WORKSPACE_TABS)[number]["id"];

export type BusinessBrainSectionSlug =
  | BusinessBrainWorkspaceTabId
  | (typeof BUSINESS_BRAIN_HIDDEN_SECTIONS)[number]["slug"];

export const BUSINESS_BRAIN_SECTION_SLUGS: BusinessBrainSectionSlug[] = [
  ...BUSINESS_BRAIN_WORKSPACE_TABS.map((tab) => tab.slug),
  ...BUSINESS_BRAIN_HIDDEN_SECTIONS.map((tab) => tab.slug),
];

export const BUSINESS_BRAIN_LEGACY_SECTION_REDIRECTS: Record<string, BusinessBrainSectionSlug> =
  {
    "company-dna": "identity",
  };

export function isBusinessBrainSectionSlug(
  value: string,
): value is BusinessBrainSectionSlug {
  return BUSINESS_BRAIN_SECTION_SLUGS.includes(value as BusinessBrainSectionSlug);
}

export function sectionSlugFromSegments(segments?: string[]): BusinessBrainSectionSlug {
  const raw = segments?.[0] ?? "overview";
  const redirected = BUSINESS_BRAIN_LEGACY_SECTION_REDIRECTS[raw] ?? raw;
  return isBusinessBrainSectionSlug(redirected) ? redirected : "overview";
}

export function sectionSlugFromPathname(pathname: string): BusinessBrainSectionSlug {
  if (pathname === "/business-brain" || pathname === "/business-brain/") {
    return "overview";
  }

  const match = pathname.match(/^\/business-brain\/([^/]+)/);
  const raw = match?.[1] ?? "overview";
  const redirected = BUSINESS_BRAIN_LEGACY_SECTION_REDIRECTS[raw] ?? raw;
  return isBusinessBrainSectionSlug(redirected) ? redirected : "overview";
}

export function sectionHref(slug: BusinessBrainSectionSlug): string {
  if (slug === "overview") {
    return "/business-brain";
  }
  return `/business-brain/${slug}`;
}

export function sectionSlugFromHref(href: string): BusinessBrainSectionSlug | null {
  if (href === "/business-brain" || href === "/business-brain/") {
    return "overview";
  }

  const match = href.match(/^\/business-brain\/([^/?#]+)/);
  if (!match?.[1]) {
    return null;
  }

  const raw = match[1];
  const redirected = BUSINESS_BRAIN_LEGACY_SECTION_REDIRECTS[raw] ?? raw;
  return isBusinessBrainSectionSlug(redirected) ? redirected : null;
}

export function sectionLabel(slug: BusinessBrainSectionSlug): string {
  const tab =
    BUSINESS_BRAIN_WORKSPACE_TABS.find((item) => item.slug === slug) ??
    BUSINESS_BRAIN_HIDDEN_SECTIONS.find((item) => item.slug === slug);
  return tab?.label ?? "Business Brain";
}

/** @deprecated Use BUSINESS_BRAIN_WORKSPACE_TABS */
export const BUSINESS_BRAIN_NAV_ITEMS = BUSINESS_BRAIN_WORKSPACE_TABS.map((tab) => ({
  id: tab.id,
  title: tab.label,
  href: tab.href,
}));

export type BusinessBrainNavId = BusinessBrainWorkspaceTabId;
