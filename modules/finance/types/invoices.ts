export type InvoiceLifecycleStatus =
  | "draft"
  | "issued"
  | "sent"
  | "void";

/** Persisted base payment status (never overdue). */
export type InvoicePaymentStatus = "unpaid" | "partially_paid" | "paid";

/** Display status including derived overdue. */
export type EffectiveInvoicePaymentStatus =
  | InvoicePaymentStatus
  | "overdue";

export type InvoiceRecipientSource = "linked_customer" | "manual";

export type InvoiceCompanySnapshot = {
  legalName: string | null;
  logoUrl: string | null;
  address: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  taxId: string | null;
  paymentAccounts: unknown;
  primaryColor: string | null;
  secondaryColor: string | null;
  accentColor: string | null;
  footerText: string | null;
};

export type InvoiceCustomerSnapshot = {
  source: InvoiceRecipientSource;
  customer_id: string | null;
  name: string;
  company: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  tax_id: string | null;
};

export type InvoiceBookingSnapshot = {
  bookingCode: string | null;
  packageName: string | null;
  departureDate: string | null;
  participantCount: number | null;
  leadTraveller: string | null;
  totalAmountMinor: number | null;
  bookingId: string;
};

export type InvoiceThemeSnapshot = {
  templateKey: string;
  templateVersion: number;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
};

export type InvoicePdfStatus =
  | "not_generated"
  | "generating"
  | "ready"
  | "failed";

export type InvoiceItemRecord = {
  id: string;
  invoiceId: string;
  description: string;
  detail: string | null;
  quantity: number;
  unit: string;
  unitPriceMinor: number;
  discountMinor: number;
  lineTotalMinor: number;
  sortOrder: number;
};

export type InvoiceRecord = {
  id: string;
  organizationId: string;
  recipientSource: InvoiceRecipientSource;
  customerId: string | null;
  bookingId: string | null;
  manualRecipientName: string | null;
  manualRecipientCompany: string | null;
  manualRecipientPhone: string | null;
  manualRecipientEmail: string | null;
  manualRecipientAddress: string | null;
  manualRecipientTaxId: string | null;
  invoiceNumber: string | null;
  lifecycleStatus: InvoiceLifecycleStatus;
  paymentStatus: InvoicePaymentStatus;
  /** Derived at read time from due_date + balance + lifecycle. */
  effectivePaymentStatus?: EffectiveInvoicePaymentStatus;
  currency: string;
  issueDate: string | null;
  dueDate: string | null;
  subtotalMinor: number;
  discountMinor: number;
  taxMinor: number;
  taxRateBps: number;
  additionalFeesMinor: number;
  totalMinor: number;
  amountPaidMinor: number;
  balanceDueMinor: number;
  templateKey: string;
  templateVersion: number;
  themeSnapshot: InvoiceThemeSnapshot | Record<string, unknown>;
  companySnapshot: InvoiceCompanySnapshot | Record<string, unknown>;
  customerSnapshot: InvoiceCustomerSnapshot | Record<string, unknown>;
  bookingSnapshot: InvoiceBookingSnapshot | Record<string, unknown> | null;
  notes: string | null;
  paymentInstructions: string | null;
  terms: string | null;
  pdfStoragePath: string | null;
  pdfStatus?: InvoicePdfStatus;
  pdfGeneratedAt?: string | null;
  pdfErrorCode?: string | null;
  pdfGenerationToken?: string | null;
  pdfGenerationClaimedAt?: string | null;
  /** Private immutable logo object path under invoice-pdfs bucket. */
  logoAssetPath?: string | null;
  logoContentHash?: string | null;
  issuedAt: string | null;
  sentAt: string | null;
  voidedAt: string | null;
  voidReason: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  items?: InvoiceItemRecord[];
  customerName?: string | null;
  bookingCode?: string | null;
  /** Derived display name for list/detail. */
  recipientDisplayName?: string;
};

export type InvoiceBrandSettings = {
  id?: string;
  organizationId: string;
  defaultTemplateKey: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  logoUrl: string | null;
  legalName: string | null;
  address: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  taxId: string | null;
  footerText: string | null;
  paymentAccountsJson: unknown;
  /** Customer-facing INV/{code}/… segment; null uses org-name fallback. */
  invoicePrefix: string | null;
};

export type BookingPrefillResult = {
  customerId: string | null;
  bookingId: string;
  bookingCode: string | null;
  packageName: string | null;
  departureDate: string | null;
  participantCount: number | null;
  leadTraveller: string | null;
  suggestedItem: {
    description: string;
    detail: string | null;
    quantity: number;
    unit: string;
    unitPriceMinor: number;
    discountMinor: number;
  } | null;
  verifiedTotalMinor: number | null;
  missingFields: string[];
};

export type {
  CreateInvoiceDraftInput,
  UpdateInvoiceDraftInput,
  IssueInvoiceInput,
  VoidInvoiceInput,
  InvoiceListFilters,
  InvoiceItemInput,
} from "@/modules/finance/schemas/invoices";
