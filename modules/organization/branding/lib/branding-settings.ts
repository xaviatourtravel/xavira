import { companyInitialsForPdf } from "@/modules/finance/pdf/invoice-pdf-labels";
import { getSafeInvoiceTheme } from "@/modules/finance/lib/invoice-theme-colors";
import type {
  WorkspaceBranding,
  WorkspaceBrandingSettingsJson,
  WorkspaceLogoMime,
} from "@/modules/organization/branding/types";
import { buildWorkspaceLogoStorageRef } from "@/modules/organization/branding/lib/logo-validation";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export function deriveWorkspaceInitials(name: string): string {
  return companyInitialsForPdf(name);
}

export function parseWorkspaceBrandingJson(
  value: unknown,
): WorkspaceBrandingSettingsJson {
  if (!isRecord(value)) return {};
  const mime =
    value.logoMimeType === "image/png" || value.logoMimeType === "image/jpeg"
      ? value.logoMimeType
      : null;
  return {
    legalName: readString(value.legalName),
    tagline: readString(value.tagline),
    address: readString(value.address),
    email: readString(value.email),
    phone: readString(value.phone),
    website: readString(value.website),
    taxId: readString(value.taxId),
    primaryColor: readString(value.primaryColor) ?? undefined,
    secondaryColor: readString(value.secondaryColor) ?? undefined,
    accentColor: readString(value.accentColor) ?? undefined,
    logoPath: readString(value.logoPath),
    logoContentHash: readString(value.logoContentHash),
    logoMimeType: mime,
    logoStorageRef: readString(value.logoStorageRef),
    logoUrl: readString(value.logoUrl),
    updatedAt: readString(value.updatedAt),
  };
}

const FORBIDDEN_SETTINGS_KEYS = new Set([
  "__proto__",
  "constructor",
  "prototype",
]);

function omitForbiddenKeys(
  value: Record<string, unknown>,
): Record<string, unknown> {
  const next: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (FORBIDDEN_SETTINGS_KEYS.has(key)) continue;
    next[key] = entry;
  }
  return next;
}

/**
 * Deep-merge organization.settings while preserving firstRun/product/workspace
 * and other nested documents used by onboarding and modules.
 * Callers must never pass an arbitrary client settings object as the patch root —
 * only scalar branding fields built server-side.
 */
export function mergeOrganizationSettingsDocument(
  current: unknown,
  patch: {
    branding?: WorkspaceBrandingSettingsJson;
    logoUrl?: string | null;
    businessEmail?: string;
    website?: string;
    workspaceLogoUrl?: string | null;
    workspaceBrandColor?: string | null;
  },
): Record<string, unknown> {
  const base = omitForbiddenKeys(isRecord(current) ? { ...current } : {});
  const existingBranding = parseWorkspaceBrandingJson(base.branding);
  const brandingPatch = patch.branding ?? {};
  const cleanedPatch: WorkspaceBrandingSettingsJson = {};
  for (const [key, value] of Object.entries(brandingPatch)) {
    if (FORBIDDEN_SETTINGS_KEYS.has(key)) continue;
    if (value !== undefined) {
      (cleanedPatch as Record<string, unknown>)[key] = value;
    }
  }
  const nextBranding: WorkspaceBrandingSettingsJson = omitForbiddenKeys({
    ...existingBranding,
    ...cleanedPatch,
  }) as WorkspaceBrandingSettingsJson;

  if (patch.branding) {
    base.branding = nextBranding;
  }

  if (patch.logoUrl !== undefined) {
    base.logoUrl = patch.logoUrl;
  } else if (nextBranding.logoStorageRef) {
    base.logoUrl = nextBranding.logoStorageRef;
  }

  if (patch.businessEmail !== undefined) {
    base.businessEmail = patch.businessEmail;
  }
  if (patch.website !== undefined) {
    base.website = patch.website;
  }

  const workspace = omitForbiddenKeys(
    isRecord(base.workspace) ? { ...base.workspace } : {},
  );
  if (patch.workspaceLogoUrl !== undefined) {
    workspace.logoUrl = patch.workspaceLogoUrl;
  } else if (nextBranding.logoStorageRef) {
    // Switcher cannot load private storage refs; leave preview to signed URLs
    // or a future org-scoped thumbnail proxy. Do not store permanent public URLs.
  }
  if (patch.workspaceBrandColor !== undefined) {
    workspace.brandColor = patch.workspaceBrandColor;
  } else if (nextBranding.primaryColor) {
    workspace.brandColor = nextBranding.primaryColor;
  }
  if (Object.keys(workspace).length > 0) {
    base.workspace = workspace;
  }

  return base;
}

export function resolveWorkspaceBranding(params: {
  organizationId: string;
  organizationName: string;
  organizationPhone: string | null;
  settings: unknown;
  logoPreviewUrl?: string | null;
  /** Legacy invoice_brand_settings fallback */
  legacy?: {
    legalName?: string | null;
    address?: string | null;
    email?: string | null;
    phone?: string | null;
    website?: string | null;
    taxId?: string | null;
    primaryColor?: string | null;
    secondaryColor?: string | null;
    accentColor?: string | null;
    logoUrl?: string | null;
  } | null;
}): WorkspaceBranding {
  const settings = isRecord(params.settings) ? params.settings : {};
  const branding = parseWorkspaceBrandingJson(settings.branding);
  const colors = getSafeInvoiceTheme({
    primaryColor: branding.primaryColor ?? params.legacy?.primaryColor ?? "",
    secondaryColor: branding.secondaryColor ?? params.legacy?.secondaryColor ?? "",
    accentColor: branding.accentColor ?? params.legacy?.accentColor ?? "",
  });

  const logoPath = branding.logoPath;
  const logoStorageRef =
    branding.logoStorageRef ??
    (logoPath ? buildWorkspaceLogoStorageRef(logoPath) : null);

  return {
    organizationId: params.organizationId,
    displayName: params.organizationName,
    legalName: branding.legalName ?? params.legacy?.legalName ?? null,
    tagline: branding.tagline ?? null,
    address: branding.address ?? params.legacy?.address ?? null,
    email:
      branding.email ??
      params.legacy?.email ??
      readString(settings.businessEmail),
    phone:
      branding.phone ?? params.legacy?.phone ?? params.organizationPhone,
    website:
      branding.website ??
      params.legacy?.website ??
      readString(settings.website),
    taxId: branding.taxId ?? params.legacy?.taxId ?? null,
    primaryColor: colors.primaryColor,
    secondaryColor: colors.secondaryColor,
    accentColor: colors.accentColor,
    logoPath: logoPath ?? null,
    logoContentHash: branding.logoContentHash ?? null,
    logoMimeType: (branding.logoMimeType as WorkspaceLogoMime | null) ?? null,
    logoStorageRef,
    logoPreviewUrl: params.logoPreviewUrl ?? null,
    updatedAt: branding.updatedAt ?? null,
  };
}
