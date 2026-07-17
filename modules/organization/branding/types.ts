export const WORKSPACE_BRAND_BUCKET = "workspace-brand-assets";
export const WORKSPACE_LOGO_MAX_BYTES = 2_000_000;
export const WORKSPACE_LOGO_MIME_TYPES = ["image/png", "image/jpeg"] as const;

export type WorkspaceLogoMime = (typeof WORKSPACE_LOGO_MIME_TYPES)[number];

/** Authoritative workspace branding (organization domain). */
export type WorkspaceBranding = {
  organizationId: string;
  displayName: string;
  legalName: string | null;
  tagline: string | null;
  address: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  taxId: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  /** Private storage object path under workspace-brand-assets. */
  logoPath: string | null;
  logoContentHash: string | null;
  logoMimeType: WorkspaceLogoMime | null;
  /**
   * Snapshot/PDF-safe reference:
   * storage://workspace-brand-assets/{organization_id}/logo/{hash}.{ext}
   */
  logoStorageRef: string | null;
  /** Short-lived signed URL for UI preview only (never trusted as source of truth). */
  logoPreviewUrl: string | null;
  updatedAt: string | null;
};

export type WorkspaceBrandingUpdateInput = {
  displayName?: string;
  legalName?: string | null;
  tagline?: string | null;
  address?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  taxId?: string | null;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
};

/** Persisted shape inside organizations.settings.branding */
export type WorkspaceBrandingSettingsJson = {
  legalName?: string | null;
  tagline?: string | null;
  address?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  taxId?: string | null;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  logoPath?: string | null;
  logoContentHash?: string | null;
  logoMimeType?: string | null;
  logoStorageRef?: string | null;
  logoUrl?: string | null;
  updatedAt?: string | null;
};
