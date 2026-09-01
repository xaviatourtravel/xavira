import { buildInvoicePdfData } from "@/modules/finance/pdf/invoice-pdf-data";
import { invoiceDocumentTitle } from "@/modules/finance/pdf/invoice-pdf-labels";
import type { InvoicePdfData } from "@/modules/finance/pdf/invoice-pdf-types";
import { looksLikeOfficialInvoiceNumber } from "@/modules/finance/lib/proforma-lifecycle";
import type { InvoiceRecord } from "@/modules/finance/types/invoices";
import type { ProformaRecord } from "@/modules/finance/types/proforma";

export const PROFORMA_PDF_TITLE = "PROFORMA INVOICE";

function asInvoiceSource(proforma: ProformaRecord): InvoiceRecord {
  return {
    id: proforma.id,
    organizationId: proforma.organizationId,
    invoiceType: "package",
    documentType: "proforma",
    recipientSource: proforma.recipientSource,
    customerId: proforma.customerId,
    bookingId: proforma.bookingId,
    manualRecipientName: proforma.manualRecipientName,
    manualRecipientCompany: proforma.manualRecipientCompany,
    manualRecipientPhone: proforma.manualRecipientPhone,
    manualRecipientEmail: proforma.manualRecipientEmail,
    manualRecipientAddress: proforma.manualRecipientAddress,
    manualRecipientTaxId: proforma.manualRecipientTaxId,
    invoiceNumber: proforma.proformaNumber,
    lifecycleStatus:
      proforma.lifecycleStatus === "cancelled" ? "void" : "issued",
    paymentStatus: "unpaid",
    currency: proforma.currency,
    issueDate: proforma.issueDate,
    dueDate: proforma.dueDate,
    subtotalMinor: proforma.subtotalMinor,
    discountMinor: proforma.discountMinor,
    taxMinor: proforma.taxMinor,
    taxRateBps: proforma.taxRateBps,
    additionalFeesMinor: proforma.additionalFeesMinor,
    totalMinor: proforma.totalMinor,
    amountPaidMinor: 0,
    balanceDueMinor: proforma.totalMinor,
    templateKey: proforma.templateKey,
    templateVersion: proforma.templateVersion,
    brandProfileId: proforma.brandProfileId ?? null,
    brandSnapshot: proforma.brandSnapshot ?? null,
    themeSnapshot: proforma.themeSnapshot,
    companySnapshot: proforma.companySnapshot,
    customerSnapshot: proforma.customerSnapshot,
    bookingSnapshot: proforma.bookingSnapshot,
    notes: proforma.notes,
    paymentInstructions: proforma.paymentInstructions,
    terms: proforma.terms,
    pdfStoragePath: null,
    issuedAt: proforma.convertedAt,
    sentAt: null,
    voidedAt: proforma.cancelledAt,
    voidReason: proforma.cancelReason,
    archivedAt: null,
    archivedBy: null,
    archiveReason: null,
    createdBy: proforma.createdBy,
    updatedBy: proforma.updatedBy,
    createdAt: proforma.createdAt,
    updatedAt: proforma.updatedAt,
    items: (proforma.items ?? []).map((item) => ({
      id: item.id,
      invoiceId: proforma.id,
      description: item.description,
      detail: item.detail,
      quantity: item.quantity,
      unit: item.unit,
      unitPriceMinor: item.unitPriceMinor,
      discountMinor: item.discountMinor,
      lineTotalMinor: item.lineTotalMinor,
      sortOrder: item.sortOrder,
    })),
    customerName: proforma.customerName,
    recipientDisplayName: proforma.recipientDisplayName,
  };
}

export async function buildProformaPdfData(
  proforma: ProformaRecord,
): Promise<InvoicePdfData> {
  if (looksLikeOfficialInvoiceNumber(proforma.proformaNumber)) {
    throw new Error("Proforma PDF cannot expose an official invoice number");
  }

  const data = await buildInvoicePdfData(asInvoiceSource(proforma), {
    mode: "issued",
    payments: [],
  });

  return {
    ...data,
    documentType: "proforma",
    documentTitle: PROFORMA_PDF_TITLE,
    invoiceNumber: proforma.proformaNumber,
    showDraftWatermark: false,
    showDocumentStatusBadge: false,
    amountPaidMinor: 0,
    balanceDueMinor: data.totalMinor,
    payments: [],
  };
}

export function officialInvoicePdfTitleUnchanged(): string {
  return invoiceDocumentTitle("package", "invoice");
}
