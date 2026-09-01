import {
  coercePaymentAccounts,
  enabledPaymentAccountsForDocuments,
  type InvoicePaymentAccount,
} from "@/modules/finance/lib/invoice-payment-accounts";
import { getSafeInvoiceTheme } from "@/modules/finance/lib/invoice-theme-colors";
import {
  DEFAULT_INVOICE_TEMPLATE_KEY,
  type InvoiceTemplateKey,
} from "@/modules/finance/pdf/invoice-pdf-types";
import { getInvoiceTemplateVersion } from "@/modules/finance/pdf/invoice-template-registry";
import type {
  InvoiceCompanySnapshot,
  InvoiceThemeSnapshot,
} from "@/modules/finance/types/invoices";

/** New package/proforma documents always use this layout. Historical PDFs keep template_key. */
export const FIXED_PACKAGE_INVOICE_LAYOUT_KEY: InvoiceTemplateKey =
  DEFAULT_INVOICE_TEMPLATE_KEY;

/**
 * Official invoice numbers are independent per brand:
 * {invoice_prefix}/{year}/{NNNN} with an org+brand+year sequence row.
 * Proforma keeps shared PI-YYYY-NNNNNN numbering.
 */
export const INVOICE_BRAND_NUMBERING_MODE = "per_brand" as const;

export const INVOICE_BRAND_PROFILE_KEYS = ["xavia", "consortium"] as const;
export type InvoiceBrandProfileKey = (typeof INVOICE_BRAND_PROFILE_KEYS)[number];
export const DEFAULT_INVOICE_BRAND_KEY: InvoiceBrandProfileKey = "xavia";

export const CONSORTIUM_BRAND_DEFAULT_COLORS = {
  primaryColor: "#1E3A5F",
  secondaryColor: "#64748B",
  accentColor: "#C9A227",
} as const;

export type InvoiceBrandProfile = {
  id: string;
  organizationId: string;
  key: string;
  name: string;
  displayName: string;
  legalName: string | null;
  logoPath: string | null;
  logoContentHash: string | null;
  logoStorageRef: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  address: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  taxId: string | null;
  footerText: string | null;
  paymentAccountsJson: unknown;
  invoicePrefix: string;
  invoiceTitle: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type InvoiceBrandSnapshot = {
  id: string;
  key: string;
  name: string;
  displayName: string;
  legalName: string | null;
  logoUrl: string | null;
  logoPath: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  address: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  taxId: string | null;
  footerText: string | null;
  paymentAccounts: InvoicePaymentAccount[];
  invoiceTitle: string;
  invoicePrefix: string | null;
  fixedLayout: true;
  layoutKey: InvoiceTemplateKey;
  snapshotAt: string;
};

export type InvoiceBrandEditorOption = {
  id: string;
  key: string;
  name: string;
  displayName: string;
  legalName: string | null;
  logoPreviewUrl: string | null;
  address: string | null;
  email: string | null;
  phone: string | null;
  taxId: string | null;
  bankSummary: string;
  isDefault: boolean;
  isActive: boolean;
};

export function isInvoiceBrandProfileKey(
  value: string | null | undefined,
): value is InvoiceBrandProfileKey {
  return (
    value === "xavia" || value === "consortium"
  );
}

export function readBrandSnapshot(
  value: unknown,
): InvoiceBrandSnapshot | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const raw = value as Record<string, unknown>;
  const key = typeof raw.key === "string" ? raw.key.trim() : "";
  const id = typeof raw.id === "string" ? raw.id.trim() : "";
  if (!key || !id) return null;
  const colors = getSafeInvoiceTheme({
    primaryColor: String(raw.primaryColor ?? ""),
    secondaryColor: String(raw.secondaryColor ?? ""),
    accentColor: String(raw.accentColor ?? ""),
  });
  return {
    id,
    key,
    name: typeof raw.name === "string" ? raw.name : key,
    displayName:
      typeof raw.displayName === "string" ? raw.displayName : String(raw.name ?? key),
    legalName: readNullableString(raw.legalName),
    logoUrl: readNullableString(raw.logoUrl),
    logoPath: readNullableString(raw.logoPath),
    primaryColor: colors.primaryColor,
    secondaryColor: colors.secondaryColor,
    accentColor: colors.accentColor,
    address: readNullableString(raw.address),
    email: readNullableString(raw.email),
    phone: readNullableString(raw.phone),
    website: readNullableString(raw.website),
    taxId: readNullableString(raw.taxId),
    footerText: readNullableString(raw.footerText),
    paymentAccounts: enabledPaymentAccountsForDocuments(
      coercePaymentAccounts(raw.paymentAccounts),
    ),
    invoiceTitle:
      typeof raw.invoiceTitle === "string" && raw.invoiceTitle.trim()
        ? raw.invoiceTitle.trim()
        : "",
    invoicePrefix: readNullableString(raw.invoicePrefix),
    fixedLayout: true,
    layoutKey: FIXED_PACKAGE_INVOICE_LAYOUT_KEY,
    snapshotAt:
      typeof raw.snapshotAt === "string" ? raw.snapshotAt : new Date(0).toISOString(),
  };
}

export function freezeInvoiceBrandSnapshot(
  profile: InvoiceBrandProfile,
  snapshotAt = new Date().toISOString(),
): InvoiceBrandSnapshot {
  const colors = getSafeInvoiceTheme({
    primaryColor: profile.primaryColor,
    secondaryColor: profile.secondaryColor,
    accentColor: profile.accentColor,
  });
  const paymentAccounts = enabledPaymentAccountsForDocuments(
    coercePaymentAccounts(profile.paymentAccountsJson),
  );
  return {
    id: profile.id,
    key: profile.key,
    name: profile.name,
    displayName: profile.displayName,
    legalName: profile.legalName,
    logoUrl: profile.logoStorageRef,
    logoPath: profile.logoPath,
    primaryColor: colors.primaryColor,
    secondaryColor: colors.secondaryColor,
    accentColor: colors.accentColor,
    address: profile.address,
    email: profile.email,
    phone: profile.phone,
    website: profile.website,
    taxId: profile.taxId,
    footerText: profile.footerText,
    paymentAccounts,
    invoiceTitle: profile.invoiceTitle || defaultInvoiceTitleForBrandKey(profile.key),
    invoicePrefix: profile.invoicePrefix,
    fixedLayout: true,
    layoutKey: FIXED_PACKAGE_INVOICE_LAYOUT_KEY,
    snapshotAt,
  };
}

export function companySnapshotFromBrand(
  source: InvoiceBrandProfile | InvoiceBrandSnapshot,
): InvoiceCompanySnapshot {
  const snapshot = "paymentAccountsJson" in source
    ? freezeInvoiceBrandSnapshot(source)
    : source;
  return {
    legalName: snapshot.legalName,
    logoUrl: snapshot.logoUrl,
    address: snapshot.address,
    email: snapshot.email,
    phone: snapshot.phone,
    website: snapshot.website,
    taxId: snapshot.taxId,
    paymentAccounts: snapshot.paymentAccounts,
    primaryColor: snapshot.primaryColor,
    secondaryColor: snapshot.secondaryColor,
    accentColor: snapshot.accentColor,
    footerText: snapshot.footerText,
  };
}

export function themeSnapshotFromBrand(
  source: Pick<
    InvoiceBrandSnapshot,
    "primaryColor" | "secondaryColor" | "accentColor"
  >,
): InvoiceThemeSnapshot {
  const colors = getSafeInvoiceTheme(source);
  return {
    templateKey: FIXED_PACKAGE_INVOICE_LAYOUT_KEY,
    templateVersion: getInvoiceTemplateVersion(FIXED_PACKAGE_INVOICE_LAYOUT_KEY),
    primaryColor: colors.primaryColor,
    secondaryColor: colors.secondaryColor,
    accentColor: colors.accentColor,
  };
}

export function usesFixedPackageInvoiceLayout(data: {
  brandKey?: string | null;
  invoiceType?: string;
}): boolean {
  return Boolean(data.brandKey) && data.invoiceType !== "ticketing";
}

export function summarizeBrandPaymentAccounts(raw: unknown): string {
  const enabled = enabledPaymentAccountsForDocuments(coercePaymentAccounts(raw));
  if (enabled.length === 0) return "";
  const preferred = enabled.find((account) => account.isDefault) ?? enabled[0]!;
  return [preferred.bankName, preferred.accountNumber].filter(Boolean).join(" · ");
}

function readNullableString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export function defaultInvoiceTitleForBrandKey(_key: string): string {
  return "INVOICE";
}

export const BRAND_INVOICE_PREFIX_PATTERN = /^[A-Z0-9]+(\/[A-Z0-9]+)+$/;

export function normalizeBrandInvoicePrefix(input: string): string {
  const normalized = input
    .trim()
    .toUpperCase()
    .replace(/\/+/g, "/")
    .replace(/^\/|\/$/g, "");
  if (!BRAND_INVOICE_PREFIX_PATTERN.test(normalized)) {
    throw new Error("Invoice prefix must look like INV/XAV");
  }
  if (normalized.length < 5 || normalized.length > 24) {
    throw new Error("Invoice prefix must be 5–24 characters");
  }
  return normalized;
}

export function formatBrandInvoiceNumber(params: {
  prefix: string;
  year: number;
  sequence: number;
}): string {
  const prefix = normalizeBrandInvoicePrefix(params.prefix);
  const sequence = String(Math.trunc(params.sequence)).padStart(4, "0");
  return `${prefix}/${params.year}/${sequence}`;
}

export function nextBrandSequenceNumber(lastNumber: number): number {
  return lastNumber + 1;
}

export function assertUniqueActiveBrandPrefix(params: {
  profiles: Array<{ id: string; isActive: boolean; invoicePrefix: string }>;
  profileId: string;
  invoicePrefix: string;
}): void {
  const prefix = normalizeBrandInvoicePrefix(params.invoicePrefix);
  const clash = params.profiles.find((profile) => {
    if (!profile.isActive || profile.id === params.profileId) return false;
    try {
      return normalizeBrandInvoicePrefix(profile.invoicePrefix) === prefix;
    } catch {
      return false;
    }
  });
  if (clash) {
    throw new Error("This invoice prefix is already used by another brand");
  }
}

