import { createClient } from "@/utils/supabase/server";

import type { WorkspaceLogoMime } from "@/modules/organization/branding/types";

export type OrganizationBrandingRow = {
  id: string;
  name: string;
  phone: string | null;
  settings: unknown;
  updated_at: string;
};

export async function getOrganizationBrandingRow(
  organizationId: string,
): Promise<OrganizationBrandingRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organizations")
    .select("id, name, phone, settings, updated_at")
    .eq("id", organizationId)
    .maybeSingle();

  if (error || !data) return null;
  return data as OrganizationBrandingRow;
}

/**
 * Narrow branding identity/color update via SECURITY DEFINER RPC.
 * Organization is derived from auth.uid() inside the database — never passed in.
 * Does not accept arbitrary settings JSON or unrelated organization columns.
 */
export async function rpcUpdateWorkspaceBranding(params: {
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
}): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("update_workspace_branding", {
    p_display_name: params.displayName,
    p_legal_name: params.legalName,
    p_tagline: params.tagline,
    p_address: params.address,
    p_email: params.email,
    p_phone: params.phone,
    p_website: params.website,
    p_tax_id: params.taxId,
    p_primary_color: params.primaryColor,
    p_secondary_color: params.secondaryColor,
    p_accent_color: params.accentColor,
  });

  if (error) {
    throw new Error(error.message || "Failed to update workspace branding");
  }
}

/**
 * Persists only logo reference fields. Org + path binding enforced in SQL.
 */
export async function rpcSetWorkspaceBrandingLogo(params: {
  logoPath: string;
  contentHash: string;
  mimeType: WorkspaceLogoMime;
}): Promise<{ previousLogoPath: string | null; idempotent: boolean }> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("set_workspace_branding_logo", {
    p_logo_path: params.logoPath,
    p_content_hash: params.contentHash,
    p_mime_type: params.mimeType,
  });

  if (error) {
    throw new Error(error.message || "Failed to set workspace logo");
  }

  const row = (data ?? {}) as {
    previousLogoPath?: string | null;
    idempotent?: boolean;
  };
  return {
    previousLogoPath: row.previousLogoPath ?? null,
    idempotent: Boolean(row.idempotent),
  };
}

export async function rpcClearWorkspaceBrandingLogo(): Promise<{
  previousLogoPath: string | null;
}> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("clear_workspace_branding_logo");

  if (error) {
    throw new Error(error.message || "Failed to remove workspace logo");
  }

  const row = (data ?? {}) as { previousLogoPath?: string | null };
  return { previousLogoPath: row.previousLogoPath ?? null };
}
