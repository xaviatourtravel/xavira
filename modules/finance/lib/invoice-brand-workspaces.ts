import {
  DEFAULT_INVOICE_BRAND_KEY,
  isInvoiceBrandProfileKey,
  readBrandSnapshot,
  type InvoiceBrandProfileKey,
} from "@/modules/finance/lib/invoice-brand-profiles";

export const INVOICE_BRAND_WORKSPACE_PATHS = {
  xavia: "/finance/invoices/xavia",
  consortium: "/finance/invoices/consortium",
} as const;

export function invoiceBrandWorkspacePath(
  brandKey: InvoiceBrandProfileKey | string | null | undefined,
): string {
  return brandKey === "consortium"
    ? INVOICE_BRAND_WORKSPACE_PATHS.consortium
    : INVOICE_BRAND_WORKSPACE_PATHS.xavia;
}

export function invoiceCreatePath(params: {
  brandKey: InvoiceBrandProfileKey;
  type?: "package" | "ticketing";
}): string {
  const search = new URLSearchParams();
  if (params.type) search.set("type", params.type);
  search.set("brand", params.brandKey);
  return `/finance/invoices/new?${search.toString()}`;
}

export function parseInvoiceBrandKey(
  value: string | null | undefined,
): InvoiceBrandProfileKey {
  if (isInvoiceBrandProfileKey(value)) return value;
  return DEFAULT_INVOICE_BRAND_KEY;
}

export function invoiceWorkspacePathFromDocument(invoice: {
  brandProfileId?: string | null;
  brandSnapshot?: unknown;
}): string {
  const snapshot = readBrandSnapshot(invoice.brandSnapshot);
  if (snapshot?.key === "consortium") {
    return INVOICE_BRAND_WORKSPACE_PATHS.consortium;
  }
  return INVOICE_BRAND_WORKSPACE_PATHS.xavia;
}

/**
 * Xavia workspace includes historical invoices with a null brand_profile_id.
 * Consortium is exact-match only. Issued rows are never rewritten for navigation.
 */
export function invoiceMatchesBrandWorkspace(
  invoice: {
    brandProfileId?: string | null;
    brandSnapshot?: unknown;
  },
  scope: {
    brandKey: InvoiceBrandProfileKey;
    brandProfileId: string | null;
  },
): boolean {
  const snapshotKey = readBrandSnapshot(invoice.brandSnapshot)?.key ?? null;
  if (scope.brandKey === "consortium") {
    if (scope.brandProfileId && invoice.brandProfileId === scope.brandProfileId) {
      return true;
    }
    return invoice.brandProfileId == null && snapshotKey === "consortium";
  }

  if (invoice.brandProfileId == null) {
    return snapshotKey !== "consortium";
  }
  if (scope.brandProfileId) {
    return invoice.brandProfileId === scope.brandProfileId;
  }
  return snapshotKey !== "consortium";
}

export function inheritXaviaSequenceLastNumber(params: {
  existingOrgYearLastNumber: number;
}): { xaviaLastNumber: number; consortiumLastNumber: number } {
  return {
    xaviaLastNumber: params.existingOrgYearLastNumber,
    consortiumLastNumber: 0,
  };
}
