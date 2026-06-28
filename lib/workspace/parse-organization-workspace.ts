import { siteConfig } from "@/config/site";
import { parseFirstRunSettings } from "@/lib/onboarding/settings";
import { parseOrganizationWorkspaceSettings } from "@/lib/settings/organization-settings";
import type { WorkspaceDescriptor } from "@/lib/workspace/types";

type OrganizationRow = {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  settings: unknown;
};

const INDUSTRY_DESCRIPTIONS: Record<string, string> = {
  travel: "Operasional travel dan customer journey",
  education: "Enrollment dan operasional pendidikan",
  property: "Leads properti dan kunjungan",
  healthcare: "Appointment dan layanan pasien",
  agency: "Delivery klien dan campaign",
  retail: "Order retail dan customer support",
  other: "Workspace operasional bisnis",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readBrandColor(settings: Record<string, unknown> | null): string | null {
  if (!settings) {
    return null;
  }

  const workspace = settings.workspace;
  if (!isRecord(workspace)) {
    return null;
  }

  return typeof workspace.brandColor === "string" ? workspace.brandColor : null;
}

function readModules(settings: Record<string, unknown> | null): string[] {
  if (!settings) {
    return [];
  }

  const product = settings.product;
  if (!isRecord(product)) {
    return [];
  }

  const packs = product.packs;
  if (!isRecord(packs)) {
    return [];
  }

  const modules = new Set<string>();
  for (const pack of Object.values(packs)) {
    if (!isRecord(pack) || pack.enabled !== true) {
      continue;
    }

    const packModules = pack.modules;
    if (Array.isArray(packModules)) {
      for (const moduleName of packModules) {
        if (typeof moduleName === "string") {
          modules.add(moduleName);
        }
      }
    }
  }

  return [...modules];
}

function readIndustry(settings: Record<string, unknown> | null): string | null {
  if (!settings || !isRecord(settings.product)) {
    return null;
  }

  const industry = settings.product.primaryIndustry;
  return typeof industry === "string" ? industry : null;
}

export function buildWorkspaceFromOrganization(
  organization: OrganizationRow,
): WorkspaceDescriptor {
  const settingsRecord = isRecord(organization.settings)
    ? organization.settings
    : null;
  const firstRun = parseFirstRunSettings(settingsRecord?.firstRun);
  const workspaceSettings = parseOrganizationWorkspaceSettings(
    settingsRecord?.workspace,
  );
  const industry = readIndustry(settingsRecord);

  return {
    id: organization.id,
    slug: organization.slug,
    name: firstRun?.workspaceName ?? organization.name,
    description:
      (industry && INDUSTRY_DESCRIPTIONS[industry]) ??
      INDUSTRY_DESCRIPTIONS.other,
    brandColor: readBrandColor(settingsRecord) ?? "#059669",
    logoUrl: workspaceSettings.logoUrl,
    timezone: organization.timezone || siteConfig.defaultTimezone,
    currency: workspaceSettings.currency || siteConfig.defaultCurrency,
    modulesEnabled: readModules(settingsRecord),
    aiPersonality: workspaceSettings.ai.tone,
    canSwitch: true,
  };
}

export function getWorkspaceInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return "W";
  }

  if (parts.length === 1) {
    return parts[0]!.slice(0, 2).toUpperCase();
  }

  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}
