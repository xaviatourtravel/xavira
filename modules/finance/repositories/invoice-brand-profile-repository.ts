import type { Json } from "@/types/database";
import { createClient } from "@/utils/supabase/server";

import {
  defaultInvoiceTitleForBrandKey,
  type InvoiceBrandProfile,
} from "@/modules/finance/lib/invoice-brand-profiles";

type BrandProfileRow = {
  id: string;
  organization_id: string;
  key: string;
  name: string;
  display_name: string;
  legal_name: string | null;
  logo_path: string | null;
  logo_content_hash: string | null;
  logo_storage_ref: string | null;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  address: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  tax_id: string | null;
  footer_text: string | null;
  payment_accounts_json: Json;
  invoice_prefix: string | null;
  invoice_title: string | null;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export function mapInvoiceBrandProfile(row: BrandProfileRow): InvoiceBrandProfile {
  return {
    id: row.id,
    organizationId: row.organization_id,
    key: row.key,
    name: row.name,
    displayName: row.display_name,
    legalName: row.legal_name,
    logoPath: row.logo_path,
    logoContentHash: row.logo_content_hash,
    logoStorageRef: row.logo_storage_ref,
    primaryColor: row.primary_color,
    secondaryColor: row.secondary_color,
    accentColor: row.accent_color,
    address: row.address,
    email: row.email,
    phone: row.phone,
    website: row.website,
    taxId: row.tax_id,
    footerText: row.footer_text,
    paymentAccountsJson: row.payment_accounts_json,
    invoicePrefix:
      row.invoice_prefix ??
      (row.key === "consortium" ? "INV/CON" : "INV/XAV"),
    invoiceTitle:
      row.invoice_title?.trim() || defaultInvoiceTitleForBrandKey(row.key),
    isDefault: row.is_default,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listInvoiceBrandProfiles(
  organizationId: string,
): Promise<InvoiceBrandProfile[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("invoice_brand_profiles")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("is_active", true)
    .order("is_default", { ascending: false })
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }
  return (data as BrandProfileRow[] | null)?.map(mapInvoiceBrandProfile) ?? [];
}

export async function getInvoiceBrandProfile(
  organizationId: string,
  profileId: string,
): Promise<InvoiceBrandProfile | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("invoice_brand_profiles")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("id", profileId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  return data ? mapInvoiceBrandProfile(data as BrandProfileRow) : null;
}

export async function seedInvoiceBrandProfilesForOrg(
  organizationId: string,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("seed_invoice_brand_profiles_for_org", {
    p_org_id: organizationId,
  });
  if (error) {
    throw new Error(error.message);
  }
}

export async function updateInvoiceBrandProfile(params: {
  organizationId: string;
  profileId: string;
  patch: {
    displayName?: string;
    legalName?: string | null;
    address?: string | null;
    email?: string | null;
    phone?: string | null;
    website?: string | null;
    taxId?: string | null;
    footerText?: string | null;
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
    paymentAccountsJson?: Json;
    invoicePrefix?: string;
    invoiceTitle?: string;
    logoPath?: string | null;
    logoContentHash?: string | null;
    logoStorageRef?: string | null;
    isDefault?: boolean;
  };
}): Promise<InvoiceBrandProfile> {
  const supabase = await createClient();
  const payload: Record<string, unknown> = {
    display_name: params.patch.displayName,
    legal_name: params.patch.legalName,
    address: params.patch.address,
    email: params.patch.email,
    phone: params.patch.phone,
    website: params.patch.website,
    tax_id: params.patch.taxId,
    footer_text: params.patch.footerText,
    primary_color: params.patch.primaryColor,
    secondary_color: params.patch.secondaryColor,
    accent_color: params.patch.accentColor,
    payment_accounts_json: params.patch.paymentAccountsJson,
    invoice_prefix: params.patch.invoicePrefix,
    invoice_title: params.patch.invoiceTitle,
    logo_path: params.patch.logoPath,
    logo_content_hash: params.patch.logoContentHash,
    logo_storage_ref: params.patch.logoStorageRef,
    is_default: params.patch.isDefault,
  };
  const cleaned = Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined),
  );

  if (params.patch.isDefault === true) {
    await supabase
      .from("invoice_brand_profiles")
      .update({ is_default: false })
      .eq("organization_id", params.organizationId)
      .neq("id", params.profileId);
  }

  const { data, error } = await supabase
    .from("invoice_brand_profiles")
    .update(cleaned)
    .eq("organization_id", params.organizationId)
    .eq("id", params.profileId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to update finance brand");
  }
  return mapInvoiceBrandProfile(data as BrandProfileRow);
}
