import type {
  CompanySize,
  FirstRunSettings,
  OrganizationProductSettings,
  SolutionIndustry,
} from "@/lib/onboarding/types";
import { COMPANY_SIZES, SOLUTION_INDUSTRIES } from "@/lib/onboarding/types";
import { buildOrganizationProductSettings } from "@/lib/onboarding/solution-packs";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function isSolutionIndustry(value: unknown): value is SolutionIndustry {
  return (
    typeof value === "string" &&
    SOLUTION_INDUSTRIES.includes(value as SolutionIndustry)
  );
}

function isCompanySize(value: unknown): value is CompanySize {
  return typeof value === "string" && COMPANY_SIZES.includes(value as CompanySize);
}

export const DEFAULT_FIRST_RUN_SETTINGS: FirstRunSettings = {
  pending: false,
  completedAt: null,
  completedBy: null,
  industry: null,
  workspaceName: null,
  companySize: null,
  invitedEmails: [],
};

export function parseFirstRunSettings(value: unknown): FirstRunSettings | null {
  if (!isRecord(value)) {
    return null;
  }

  const invitedEmails = Array.isArray(value.invitedEmails)
    ? value.invitedEmails.filter(
        (email): email is string => typeof email === "string",
      )
    : [];

  return {
    pending: value.pending === true,
    completedAt: readString(value.completedAt),
    completedBy: readString(value.completedBy),
    industry: isSolutionIndustry(value.industry) ? value.industry : null,
    workspaceName: readString(value.workspaceName),
    companySize: isCompanySize(value.companySize) ? value.companySize : null,
    invitedEmails,
  };
}

export function parseOrganizationProductSettings(
  value: unknown,
): OrganizationProductSettings | null {
  if (!isRecord(value)) {
    return null;
  }

  if (!isSolutionIndustry(value.primaryIndustry)) {
    return null;
  }

  const packsRaw = isRecord(value.packs) ? value.packs : {};
  const packs: OrganizationProductSettings["packs"] = {};

  for (const [key, packValue] of Object.entries(packsRaw)) {
    if (!isRecord(packValue)) {
      continue;
    }

    packs[key] = {
      enabled: packValue.enabled === true,
      modules: Array.isArray(packValue.modules)
        ? packValue.modules.filter(
            (module): module is string => typeof module === "string",
          )
        : [],
      status:
        packValue.status === "available" ? "available" : "coming_soon",
    };
  }

  return {
    primaryIndustry: value.primaryIndustry,
    packs,
  };
}

export function createPendingFirstRunSettings(): FirstRunSettings {
  return {
    ...DEFAULT_FIRST_RUN_SETTINGS,
    pending: true,
  };
}

export function mergeOrganizationSettingsForFirstRun(
  currentSettings: unknown,
  input: {
    companyName: string;
    workspaceName: string;
    industry: SolutionIndustry;
    companySize: CompanySize;
    invitedEmails: string[];
    completedBy: string;
  },
) {
  const base = isRecord(currentSettings) ? { ...currentSettings } : {};
  const workspace = isRecord(base.workspace) ? base.workspace : {};

  const firstRun: FirstRunSettings = {
    pending: false,
    completedAt: new Date().toISOString(),
    completedBy: input.completedBy,
    industry: input.industry,
    workspaceName: input.workspaceName,
    companySize: input.companySize,
    invitedEmails: input.invitedEmails,
  };

  const product = buildOrganizationProductSettings(input.industry);

  return {
    ...base,
    workspace: {
      ...workspace,
      businessEmail: workspace.businessEmail ?? "",
    },
    firstRun,
    product,
  };
}
