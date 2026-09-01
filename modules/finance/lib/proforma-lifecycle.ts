import type { ProformaLifecycleStatus, ProformaRecord } from "@/modules/finance/types/proforma";

export const PROFORMA_NUMBER_PATTERN = /^PI-\d{4}-\d{6}$/;
export const INVOICE_NUMBER_PATTERN = /^INV\//;

export function isProformaNumber(value: string | null | undefined): boolean {
  return typeof value === "string" && PROFORMA_NUMBER_PATTERN.test(value);
}

export function looksLikeOfficialInvoiceNumber(
  value: string | null | undefined,
): boolean {
  return typeof value === "string" && INVOICE_NUMBER_PATTERN.test(value);
}

export function formatProformaNumber(year: number, sequence: number): string {
  return `PI-${year}-${String(sequence).padStart(6, "0")}`;
}

export function isProformaEditable(
  status: ProformaLifecycleStatus | string,
): boolean {
  return status === "draft";
}

export function canConvertProforma(record: Pick<ProformaRecord, "lifecycleStatus">) {
  return record.lifecycleStatus === "draft";
}

export function canCancelProforma(record: Pick<ProformaRecord, "lifecycleStatus">) {
  return record.lifecycleStatus === "draft";
}

export function canDeleteProforma(record: Pick<ProformaRecord, "lifecycleStatus" | "convertedInvoiceId">) {
  return record.lifecycleStatus === "draft" && !record.convertedInvoiceId;
}

export function assertProformaNotOfficialInvoice(record: {
  proformaNumber: string;
}): void {
  if (looksLikeOfficialInvoiceNumber(record.proformaNumber)) {
    throw new Error("Proforma cannot use an official invoice number");
  }
  if (!isProformaNumber(record.proformaNumber)) {
    throw new Error("Proforma reference is invalid");
  }
}

/** FIN-005B: official Invoice bills the Proforma recipient, not live CRM. */
export function convertedInvoiceCustomerSnapshot<T extends { name: string; email: string | null }>(
  proformaSnapshot: T,
  _liveCrm: T,
): T {
  return proformaSnapshot;
}
