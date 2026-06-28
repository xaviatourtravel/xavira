import type {
  OrganizationProductSettings,
  SolutionIndustry,
  SolutionPackConfig,
} from "@/lib/onboarding/types";

const COMING_SOON_PACK = (modules: string[]): SolutionPackConfig => ({
  enabled: false,
  modules,
  status: "coming_soon",
});

const TRAVEL_PACK: SolutionPackConfig = {
  enabled: true,
  modules: ["packages", "bookings", "participants"],
  status: "available",
};

/** Future module hooks per industry — not enabled until pack ships */
const PACK_MODULE_HOOKS: Record<
  Exclude<SolutionIndustry, "other">,
  string[]
> = {
  travel: ["packages", "bookings", "participants", "manifest", "tour_leader"],
  education: ["students", "enrollment", "classes", "schedules"],
  property: ["properties", "units", "visits", "deals"],
  healthcare: ["patients", "appointments", "treatments"],
  agency: ["projects", "clients", "invoices"],
  retail: ["products", "orders", "support"],
};

export function buildOrganizationProductSettings(
  industry: SolutionIndustry,
): OrganizationProductSettings {
  const packs: Record<string, SolutionPackConfig> = {
    travel:
      industry === "travel"
        ? TRAVEL_PACK
        : COMING_SOON_PACK(PACK_MODULE_HOOKS.travel),
    education: COMING_SOON_PACK(PACK_MODULE_HOOKS.education),
    property: COMING_SOON_PACK(PACK_MODULE_HOOKS.property),
    healthcare: COMING_SOON_PACK(PACK_MODULE_HOOKS.healthcare),
    agency: COMING_SOON_PACK(PACK_MODULE_HOOKS.agency),
    retail: COMING_SOON_PACK(PACK_MODULE_HOOKS.retail),
  };

  if (industry !== "travel" && industry !== "other") {
    packs[industry] = {
      enabled: false,
      modules: PACK_MODULE_HOOKS[industry],
      status: "coming_soon",
    };
  }

  return {
    primaryIndustry: industry,
    packs,
  };
}

export function isTravelPackEnabled(
  product: OrganizationProductSettings | null | undefined,
): boolean {
  return product?.packs.travel?.enabled === true;
}
