export const INVOICE_TEMPLATE_KEYS = [
  "calm-standard",
  "corporate",
  "travel-banner",
  "editorial-sidebar",
] as const;

export type InvoiceTemplateKey = (typeof INVOICE_TEMPLATE_KEYS)[number];

export const DEFAULT_INVOICE_TEMPLATE_KEY: InvoiceTemplateKey = "calm-standard";

export type InvoicePdfStatus =
  | "not_generated"
  | "generating"
  | "ready"
  | "failed";

export type InvoicePdfPaymentAccount = {
  id?: string | null;
  method?: string | null;
  label?: string | null;
  bankName?: string | null;
  accountName?: string | null;
  accountHolder?: string | null;
  accountNumber?: string | null;
  bankCode?: string | null;
  swiftCode?: string | null;
  branch?: string | null;
  notes?: string | null;
  isDefault?: boolean;
};

export type InvoicePdfRecipient = {
  source: "linked_customer" | "manual";
  customerId: string | null;
  name: string;
  company: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  taxId: string | null;
};

export type InvoicePdfBooking = {
  bookingCode: string | null;
  packageName: string | null;
  departureDate: string | null;
  participantCount: number | null;
  leadTraveller: string | null;
  totalAmountMinor: number | null;
};

export type InvoicePdfItem = {
  description: string;
  detail: string | null;
  quantity: number;
  unit: string;
  unitPriceMinor: number;
  discountMinor: number;
  lineTotalMinor: number;
};

export type InvoicePdfTheme = {
  templateKey: InvoiceTemplateKey;
  templateVersion: number;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  primaryForeground: string;
  accentForeground: string;
  /** Soft panel tint derived for document surfaces (presentation only). */
  tint: string;
  divider: string;
  text: string;
  muted: string;
};

export type InvoicePdfCompany = {
  legalName: string;
  tagline: string | null;
  address: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  taxId: string | null;
  footerText: string | null;
  paymentAccounts: InvoicePdfPaymentAccount[];
  logo:
    | { kind: "image"; dataUrl: string; mimeType: "image/png" | "image/jpeg" }
    | { kind: "initials"; initials: string }
    | null;
};

export type InvoicePdfData = {
  mode: "draft" | "issued";
  invoiceId: string;
  organizationId: string;
  invoiceNumber: string | null;
  issueDate: string | null;
  dueDate: string | null;
  lifecycleStatus: string;
  lifecycleStatusLabel: string;
  paymentStatus: string;
  paymentStatusLabel: string;
  currency: string;
  notes: string | null;
  paymentInstructions: string | null;
  terms: string | null;
  recipient: InvoicePdfRecipient;
  booking: InvoicePdfBooking | null;
  items: InvoicePdfItem[];
  subtotalMinor: number;
  discountMinor: number;
  taxMinor: number;
  taxRateBps: number;
  additionalFeesMinor: number;
  totalMinor: number;
  amountPaidMinor: number;
  balanceDueMinor: number;
  company: InvoicePdfCompany;
  theme: InvoicePdfTheme;
  showDraftWatermark: boolean;
};

export type InvoiceTemplateDefinition = {
  key: InvoiceTemplateKey;
  /** Product ticket id for FIN template catalog (e.g. "009"). */
  ticketId: string;
  version: number;
  name: string;
  description: string;
};
