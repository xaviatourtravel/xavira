export const marketingRoutes = {
  home: "/",
  demo: "/demo",
  contact: "/contact",
  company: "/company",
  platform: "/platform",
  solutions: "/solutions",
  login: "/login",
  register: "/daftar",
  contactEmail: "hello@desklabs.id",
} as const;

/** Homepage section anchors — always use absolute paths for cross-route navigation */
export const marketingHomeAnchors = {
  industries: "/#industries",
  platform: "/#platform",
  aurora: "/#aurora",
  pricing: "/#pricing",
  faq: "/#faq",
} as const;

export type MarketingHomeAnchor = keyof typeof marketingHomeAnchors;

export function marketingHomeAnchor(section: MarketingHomeAnchor): string {
  return marketingHomeAnchors[section];
}
