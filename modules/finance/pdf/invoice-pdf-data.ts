import type {
  InvoiceBookingSnapshot,
  InvoiceCompanySnapshot,
  InvoiceCustomerSnapshot,
  InvoiceRecord,
  InvoiceThemeSnapshot,
} from "@/modules/finance/types/invoices";
import {
  coercePaymentAccounts,
  enabledPaymentAccountsForDocuments,
} from "@/modules/finance/lib/invoice-payment-accounts";
import { calculateInvoiceTotals } from "@/modules/finance/lib/invoice-calculator";
import { getDocumentSafePdfTheme } from "@/modules/finance/pdf/invoice-pdf-document-colors";
import { resolveRecipientDisplayName } from "@/modules/finance/lib/invoice-recipient";
import {
  getInvoiceTemplateVersion,
  normalizeInvoiceTemplateKey,
} from "@/modules/finance/pdf/invoice-template-registry";
import type {
  InvoicePdfCompany,
  InvoicePdfData,
  InvoicePdfPaymentAccount,
  InvoicePdfRecipient,
} from "@/modules/finance/pdf/invoice-pdf-types";
import {
  companyInitialsForPdf,
  formatInvoicePdfLifecycleStatus,
  formatInvoicePdfPaymentStatus,
} from "@/modules/finance/pdf/invoice-pdf-labels";
import { loadInvoiceLogoForPdf } from "@/modules/finance/pdf/invoice-pdf-logo";

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function readString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function parsePaymentAccounts(raw: unknown): InvoicePdfPaymentAccount[] {
  return enabledPaymentAccountsForDocuments(coercePaymentAccounts(raw)).map(
    (account) => ({
      id: account.id,
      method: account.method,
      label: account.bankName,
      bankName: account.bankName,
      accountName: account.accountHolder,
      accountHolder: account.accountHolder,
      accountNumber: account.accountNumber,
      bankCode: account.swiftCode,
      swiftCode: account.swiftCode,
      branch: account.branch,
      notes: account.notes,
      isDefault: account.isDefault,
    }),
  );
}

function normalizeRecipient(
  invoice: InvoiceRecord,
): InvoicePdfRecipient {
  const snap = asRecord(invoice.customerSnapshot);
  const name =
    resolveRecipientDisplayName({
      customerSnapshot: snap,
      customerName: invoice.customerName,
      manualRecipientName: invoice.manualRecipientName,
    }) || "Recipient";

  const source =
    snap.source === "manual" || invoice.recipientSource === "manual"
      ? "manual"
      : "linked_customer";

  return {
    source,
    customerId:
      readString(snap.customer_id) ??
      invoice.customerId ??
      null,
    name,
    company:
      readString(snap.company) ?? invoice.manualRecipientCompany ?? null,
    phone: readString(snap.phone) ?? invoice.manualRecipientPhone ?? null,
    email: readString(snap.email) ?? invoice.manualRecipientEmail ?? null,
    address:
      readString(snap.address) ?? invoice.manualRecipientAddress ?? null,
    taxId: readString(snap.tax_id) ?? invoice.manualRecipientTaxId ?? null,
  };
}

function paymentStatusLabel(invoice: InvoiceRecord): string {
  const status = invoice.effectivePaymentStatus ?? invoice.paymentStatus;
  return formatInvoicePdfPaymentStatus(status);
}

export async function buildInvoicePdfData(
  invoice: InvoiceRecord,
  options: { mode: "draft" | "issued" },
): Promise<InvoicePdfData> {
  if (!invoice.items?.length) {
    throw new Error("Invoice has no line items");
  }

  const issued = options.mode === "issued";
  const companySnap = asRecord(invoice.companySnapshot) as Partial<InvoiceCompanySnapshot> &
    Record<string, unknown>;
  const themeSnap = asRecord(invoice.themeSnapshot) as Partial<InvoiceThemeSnapshot> &
    Record<string, unknown>;
  const bookingSnap = invoice.bookingSnapshot
    ? (asRecord(invoice.bookingSnapshot) as Partial<InvoiceBookingSnapshot> &
        Record<string, unknown>)
    : null;

  // Draft: recalculate totals server-side. Issued: trust persisted totals.
  let money = {
    subtotalMinor: invoice.subtotalMinor,
    discountMinor: invoice.discountMinor,
    taxMinor: invoice.taxMinor,
    taxRateBps: invoice.taxRateBps,
    additionalFeesMinor: invoice.additionalFeesMinor,
    totalMinor: invoice.totalMinor,
    amountPaidMinor: invoice.amountPaidMinor,
    balanceDueMinor: invoice.balanceDueMinor,
    items: invoice.items.map((item) => ({
      description: item.description,
      detail: item.detail,
      quantity: item.quantity,
      unit: item.unit,
      unitPriceMinor: item.unitPriceMinor,
      discountMinor: item.discountMinor,
      lineTotalMinor: item.lineTotalMinor,
    })),
  };

  if (!issued) {
    const calculated = calculateInvoiceTotals({
      items: invoice.items.map((item) => ({
        quantity: item.quantity,
        unitPriceMinor: item.unitPriceMinor,
        discountMinor: item.discountMinor,
      })),
      discountMinor: invoice.discountMinor,
      taxRateBps: invoice.taxRateBps,
      taxMinor: invoice.taxMinor,
      additionalFeesMinor: invoice.additionalFeesMinor,
      amountPaidMinor: invoice.amountPaidMinor,
    });
    money = {
      subtotalMinor: calculated.subtotalMinor,
      discountMinor: calculated.discountMinor,
      taxMinor: calculated.taxMinor,
      taxRateBps: calculated.taxRateBps,
      additionalFeesMinor: calculated.additionalFeesMinor,
      totalMinor: calculated.totalMinor,
      amountPaidMinor: calculated.amountPaidMinor,
      balanceDueMinor: calculated.balanceDueMinor,
      items: invoice.items.map((item, index) => ({
        description: item.description,
        detail: item.detail,
        quantity: item.quantity,
        unit: item.unit,
        unitPriceMinor: item.unitPriceMinor,
        discountMinor: item.discountMinor,
        lineTotalMinor: calculated.lines[index]!.lineTotalMinor,
      })),
    };
  }

  const templateKey = normalizeInvoiceTemplateKey(
    issued
      ? String(themeSnap.templateKey ?? invoice.templateKey)
      : invoice.templateKey,
  );
  const colors = getDocumentSafePdfTheme({
    primaryColor: String(themeSnap.primaryColor ?? ""),
    secondaryColor: String(themeSnap.secondaryColor ?? ""),
    accentColor: String(themeSnap.accentColor ?? ""),
  });

  const legalName =
    readString(companySnap.legalName) ||
    readString(companySnap.legal_name) ||
    "Company";
  const logoUrl =
    readString(companySnap.logoUrl) ?? readString(companySnap.logo_url);
  const loadedLogo = await loadInvoiceLogoForPdf({
    organizationId: invoice.organizationId,
    // Issued + frozen path: never re-read mutable workspace URL.
    logoUrl: issued && invoice.logoAssetPath ? null : logoUrl,
    logoAssetPath: issued ? (invoice.logoAssetPath ?? null) : null,
    fallbackName: legalName,
  });
  const logo =
    loadedLogo.kind === "image"
      ? {
          kind: "image" as const,
          dataUrl: loadedLogo.dataUrl,
          mimeType: loadedLogo.mimeType,
        }
      : loadedLogo;

  const company: InvoicePdfCompany = {
    legalName,
    tagline: readString(companySnap.tagline),
    address: readString(companySnap.address),
    email: readString(companySnap.email),
    phone: readString(companySnap.phone),
    website: readString(companySnap.website),
    taxId: readString(companySnap.taxId) ?? readString(companySnap.tax_id),
    footerText: readString(companySnap.footerText) ?? readString(companySnap.footer_text),
    paymentAccounts: parsePaymentAccounts(companySnap.paymentAccounts ?? companySnap.payment_accounts),
    logo:
      logo ??
      ({
        kind: "initials",
        initials: companyInitialsForPdf(legalName),
      } as const),
  };

  const recipient = normalizeRecipient(invoice);
  const customerSnap = asRecord(invoice.customerSnapshot) as Partial<InvoiceCustomerSnapshot>;
  if (issued && readString(customerSnap.name)) {
    recipient.name = readString(customerSnap.name)!;
  }

  return {
    mode: options.mode,
    invoiceId: invoice.id,
    organizationId: invoice.organizationId,
    invoiceNumber: issued ? invoice.invoiceNumber : null,
    issueDate: invoice.issueDate,
    dueDate: invoice.dueDate,
    lifecycleStatus: invoice.lifecycleStatus,
    lifecycleStatusLabel: formatInvoicePdfLifecycleStatus(invoice.lifecycleStatus),
    paymentStatus: invoice.effectivePaymentStatus ?? invoice.paymentStatus,
    paymentStatusLabel: paymentStatusLabel(invoice),
    currency: invoice.currency,
    notes: invoice.notes,
    paymentInstructions: invoice.paymentInstructions,
    terms: invoice.terms,
    recipient,
    booking: bookingSnap
      ? {
          bookingCode: readString(bookingSnap.bookingCode) ?? readString(bookingSnap.booking_code),
          packageName: readString(bookingSnap.packageName) ?? readString(bookingSnap.package_name),
          departureDate:
            readString(bookingSnap.departureDate) ?? readString(bookingSnap.departure_date),
          participantCount:
            typeof bookingSnap.participantCount === "number"
              ? bookingSnap.participantCount
              : typeof bookingSnap.participant_count === "number"
                ? bookingSnap.participant_count
                : null,
          leadTraveller:
            readString(bookingSnap.leadTraveller) ?? readString(bookingSnap.lead_traveller),
          totalAmountMinor:
            typeof bookingSnap.totalAmountMinor === "number"
              ? bookingSnap.totalAmountMinor
              : typeof bookingSnap.total_amount_minor === "number"
                ? bookingSnap.total_amount_minor
                : null,
        }
      : null,
    items: money.items,
    subtotalMinor: money.subtotalMinor,
    discountMinor: money.discountMinor,
    taxMinor: money.taxMinor,
    taxRateBps: money.taxRateBps,
    additionalFeesMinor: money.additionalFeesMinor,
    totalMinor: money.totalMinor,
    amountPaidMinor: money.amountPaidMinor,
    balanceDueMinor: money.balanceDueMinor,
    company,
    theme: {
      templateKey,
      templateVersion:
        typeof themeSnap.templateVersion === "number"
          ? themeSnap.templateVersion
          : getInvoiceTemplateVersion(templateKey),
      ...colors,
    },
    showDraftWatermark: !issued,
  };
}
