import type {
  InvoiceBookingSnapshot,
  InvoiceCompanySnapshot,
  InvoiceCustomerSnapshot,
  InvoiceItemRecord,
  InvoiceRecipientSource,
  InvoiceThemeSnapshot,
} from "@/modules/finance/types/invoices";

export const PROFORMA_LIFECYCLE_STATUSES = [
  "draft",
  "converted",
  "cancelled",
] as const;

export type ProformaLifecycleStatus = (typeof PROFORMA_LIFECYCLE_STATUSES)[number];

export type ProformaItemRecord = Omit<InvoiceItemRecord, "invoiceId"> & {
  proformaId: string;
};

export type ProformaRecord = {
  id: string;
  organizationId: string;
  invoiceType: "package";
  recipientSource: InvoiceRecipientSource;
  customerId: string | null;
  bookingId: string | null;
  manualRecipientName: string | null;
  manualRecipientCompany: string | null;
  manualRecipientPhone: string | null;
  manualRecipientEmail: string | null;
  manualRecipientAddress: string | null;
  manualRecipientTaxId: string | null;
  proformaNumber: string;
  lifecycleStatus: ProformaLifecycleStatus;
  currency: string;
  issueDate: string | null;
  dueDate: string | null;
  subtotalMinor: number;
  discountMinor: number;
  taxMinor: number;
  taxRateBps: number;
  additionalFeesMinor: number;
  totalMinor: number;
  templateKey: string;
  templateVersion: number;
  themeSnapshot: InvoiceThemeSnapshot | Record<string, unknown>;
  companySnapshot: InvoiceCompanySnapshot | Record<string, unknown>;
  customerSnapshot: InvoiceCustomerSnapshot | Record<string, unknown>;
  bookingSnapshot: InvoiceBookingSnapshot | Record<string, unknown> | null;
  notes: string | null;
  paymentInstructions: string | null;
  terms: string | null;
  convertedInvoiceId: string | null;
  convertedInvoiceNumber: string | null;
  convertedAt: string | null;
  cancelledAt: string | null;
  cancelledBy: string | null;
  cancelReason: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  items?: ProformaItemRecord[];
  customerName?: string | null;
  recipientDisplayName?: string;
};
