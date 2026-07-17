import type { Json } from "@/types/database";
import { createClient } from "@/utils/supabase/server";

import { deriveEffectivePaymentStatus } from "@/modules/finance/lib/invoice-payment-status";
import { resolveRecipientDisplayName } from "@/modules/finance/lib/invoice-recipient";
import type {
  InvoiceBrandSettings,
  InvoiceItemRecord,
  InvoiceLifecycleStatus,
  InvoicePaymentStatus,
  InvoicePdfStatus,
  InvoiceRecipientSource,
  InvoiceRecord,
} from "@/modules/finance/types/invoices";
import type { InvoiceListFilters } from "@/modules/finance/schemas/invoices";

type InvoiceRow = {
  id: string;
  organization_id: string;
  recipient_source: string;
  customer_id: string | null;
  booking_id: string | null;
  manual_recipient_name: string | null;
  manual_recipient_company: string | null;
  manual_recipient_phone: string | null;
  manual_recipient_email: string | null;
  manual_recipient_address: string | null;
  manual_recipient_tax_id: string | null;
  invoice_number: string | null;
  lifecycle_status: string;
  payment_status: string;
  currency: string;
  issue_date: string | null;
  due_date: string | null;
  subtotal_minor: number;
  discount_minor: number;
  tax_minor: number;
  tax_rate_bps: number;
  additional_fees_minor: number;
  total_minor: number;
  amount_paid_minor: number;
  balance_due_minor: number;
  template_key: string;
  template_version: number;
  theme_snapshot: Json;
  company_snapshot: Json;
  customer_snapshot: Json;
  booking_snapshot: Json | null;
  notes: string | null;
  payment_instructions: string | null;
  terms: string | null;
  pdf_storage_path: string | null;
  pdf_status?: string | null;
  pdf_generated_at?: string | null;
  pdf_error_code?: string | null;
  pdf_generation_token?: string | null;
  pdf_generation_claimed_at?: string | null;
  logo_asset_path?: string | null;
  logo_content_hash?: string | null;
  issued_at: string | null;
  sent_at: string | null;
  voided_at: string | null;
  void_reason: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

type InvoiceItemRow = {
  id: string;
  invoice_id: string;
  description: string;
  detail: string | null;
  quantity: number;
  unit: string;
  unit_price_minor: number;
  discount_minor: number;
  line_total_minor: number;
  sort_order: number;
};

type BrandSettingsRow = {
  id: string;
  organization_id: string;
  default_template_key: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  logo_url: string | null;
  legal_name: string | null;
  address: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  tax_id: string | null;
  footer_text: string | null;
  payment_accounts_json: Json;
  invoice_prefix: string | null;
};

export function mapInvoiceItem(row: InvoiceItemRow): InvoiceItemRecord {
  return {
    id: row.id,
    invoiceId: row.invoice_id,
    description: row.description,
    detail: row.detail,
    quantity: Number(row.quantity),
    unit: row.unit,
    unitPriceMinor: Number(row.unit_price_minor),
    discountMinor: Number(row.discount_minor),
    lineTotalMinor: Number(row.line_total_minor),
    sortOrder: row.sort_order,
  };
}

export function mapInvoice(
  row: InvoiceRow,
  extras?: {
    items?: InvoiceItemRecord[];
    customerName?: string | null;
    bookingCode?: string | null;
  },
): InvoiceRecord {
  const paymentStatus = row.payment_status as InvoicePaymentStatus;
  const lifecycleStatus = row.lifecycle_status as InvoiceLifecycleStatus;
  const balanceDueMinor = Number(row.balance_due_minor);
  const customerSnapshot =
    (row.customer_snapshot as Record<string, unknown>) ?? {};
  const customerName = extras?.customerName ?? null;
  const manualRecipientName = row.manual_recipient_name ?? null;

  return {
    id: row.id,
    organizationId: row.organization_id,
    recipientSource: (row.recipient_source as InvoiceRecipientSource) || "linked_customer",
    customerId: row.customer_id,
    bookingId: row.booking_id,
    manualRecipientName,
    manualRecipientCompany: row.manual_recipient_company ?? null,
    manualRecipientPhone: row.manual_recipient_phone ?? null,
    manualRecipientEmail: row.manual_recipient_email ?? null,
    manualRecipientAddress: row.manual_recipient_address ?? null,
    manualRecipientTaxId: row.manual_recipient_tax_id ?? null,
    invoiceNumber: row.invoice_number,
    lifecycleStatus,
    paymentStatus,
    effectivePaymentStatus: deriveEffectivePaymentStatus({
      lifecycleStatus,
      paymentStatus,
      balanceDueMinor,
      dueDate: row.due_date,
    }),
    currency: row.currency,
    issueDate: row.issue_date,
    dueDate: row.due_date,
    subtotalMinor: Number(row.subtotal_minor),
    discountMinor: Number(row.discount_minor),
    taxMinor: Number(row.tax_minor),
    taxRateBps: Number(row.tax_rate_bps),
    additionalFeesMinor: Number(row.additional_fees_minor),
    totalMinor: Number(row.total_minor),
    amountPaidMinor: Number(row.amount_paid_minor),
    balanceDueMinor,
    templateKey: row.template_key,
    templateVersion: row.template_version,
    themeSnapshot: (row.theme_snapshot as Record<string, unknown>) ?? {},
    companySnapshot: (row.company_snapshot as Record<string, unknown>) ?? {},
    customerSnapshot,
    bookingSnapshot: (row.booking_snapshot as Record<string, unknown> | null) ?? null,
    notes: row.notes,
    paymentInstructions: row.payment_instructions,
    terms: row.terms,
    pdfStoragePath: row.pdf_storage_path,
    pdfStatus: (row.pdf_status as InvoicePdfStatus | undefined) ?? "not_generated",
    pdfGeneratedAt: row.pdf_generated_at ?? null,
    pdfErrorCode: row.pdf_error_code ?? null,
    pdfGenerationToken: row.pdf_generation_token ?? null,
    pdfGenerationClaimedAt: row.pdf_generation_claimed_at ?? null,
    logoAssetPath: row.logo_asset_path ?? null,
    logoContentHash: row.logo_content_hash ?? null,
    issuedAt: row.issued_at,
    sentAt: row.sent_at,
    voidedAt: row.voided_at,
    voidReason: row.void_reason,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    items: extras?.items,
    customerName,
    bookingCode: extras?.bookingCode,
    recipientDisplayName: resolveRecipientDisplayName({
      customerSnapshot,
      customerName,
      manualRecipientName,
    }),
  };
}

export function mapBrandSettings(row: BrandSettingsRow): InvoiceBrandSettings {
  return {
    id: row.id,
    organizationId: row.organization_id,
    defaultTemplateKey: row.default_template_key,
    primaryColor: row.primary_color,
    secondaryColor: row.secondary_color,
    accentColor: row.accent_color,
    logoUrl: row.logo_url,
    legalName: row.legal_name,
    address: row.address,
    email: row.email,
    phone: row.phone,
    website: row.website,
    taxId: row.tax_id,
    footerText: row.footer_text,
    paymentAccountsJson: row.payment_accounts_json,
    invoicePrefix: row.invoice_prefix ?? null,
  };
}

export async function listInvoices(
  organizationId: string,
  filters: InvoiceListFilters = {},
): Promise<InvoiceRecord[]> {
  const supabase = await createClient();
  let query = supabase
    .from("invoices")
    .select(
      `
      *,
      leads!invoices_customer_id_fkey ( full_name ),
      bookings!invoices_booking_id_fkey ( booking_code )
    `,
    )
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (filters.lifecycleStatus) {
    query = query.eq("lifecycle_status", filters.lifecycleStatus);
  }
  if (filters.paymentStatus && filters.paymentStatus !== "overdue") {
    query = query.eq("payment_status", filters.paymentStatus);
  }
  if (filters.customerId) {
    query = query.eq("customer_id", filters.customerId);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }

  let rows = (data ?? []).map((row) => {
    const typed = row as InvoiceRow & {
      leads?: { full_name: string } | null;
      bookings?: { booking_code: string | null } | null;
    };
    return mapInvoice(typed, {
      customerName: typed.leads?.full_name ?? null,
      bookingCode: typed.bookings?.booking_code ?? null,
    });
  });

  if (filters.q) {
    const needle = filters.q.toLowerCase();
    rows = rows.filter((row) => {
      const haystacks = [
        row.invoiceNumber,
        row.notes,
        row.recipientDisplayName,
        row.customerName,
        row.manualRecipientName,
        row.manualRecipientPhone,
        row.manualRecipientEmail,
      ];
      return haystacks.some(
        (value) => typeof value === "string" && value.toLowerCase().includes(needle),
      );
    });
  }

  if (filters.paymentStatus === "overdue") {
    rows = rows.filter((row) => row.effectivePaymentStatus === "overdue");
  }

  return rows;
}

export async function getInvoiceById(
  organizationId: string,
  invoiceId: string,
): Promise<InvoiceRecord | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("invoices")
    .select(
      `
      *,
      leads!invoices_customer_id_fkey ( full_name ),
      bookings!invoices_booking_id_fkey ( booking_code ),
      invoice_items ( * )
    `,
    )
    .eq("organization_id", organizationId)
    .eq("id", invoiceId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  if (!data) {
    return null;
  }

  const typed = data as InvoiceRow & {
    leads?: { full_name: string } | null;
    bookings?: { booking_code: string | null } | null;
    invoice_items?: InvoiceItemRow[];
  };

  const items = (typed.invoice_items ?? [])
    .map(mapInvoiceItem)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return mapInvoice(typed, {
    items,
    customerName: typed.leads?.full_name ?? null,
    bookingCode: typed.bookings?.booking_code ?? null,
  });
}

export async function insertInvoiceDraft(params: {
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
  paymentStatus: InvoicePaymentStatus;
  templateKey: string;
  themeSnapshot: Json;
  companySnapshot: Json;
  customerSnapshot: Json;
  bookingSnapshot: Json | null;
  notes: string | null;
  paymentInstructions: string | null;
  terms: string | null;
  createdBy: string;
  items: Array<{
    description: string;
    detail: string | null;
    quantity: number;
    unit: string;
    unitPriceMinor: number;
    discountMinor: number;
    lineTotalMinor: number;
    sortOrder: number;
  }>;
}): Promise<InvoiceRecord> {
  const supabase = await createClient();
  const { data: invoice, error } = await supabase
    .from("invoices")
    .insert({
      organization_id: params.organizationId,
      recipient_source: params.recipientSource,
      customer_id: params.customerId,
      booking_id: params.bookingId,
      manual_recipient_name: params.manualRecipientName,
      manual_recipient_company: params.manualRecipientCompany,
      manual_recipient_phone: params.manualRecipientPhone,
      manual_recipient_email: params.manualRecipientEmail,
      manual_recipient_address: params.manualRecipientAddress,
      manual_recipient_tax_id: params.manualRecipientTaxId,
      currency: params.currency,
      issue_date: params.issueDate,
      due_date: params.dueDate,
      subtotal_minor: params.subtotalMinor,
      discount_minor: params.discountMinor,
      tax_minor: params.taxMinor,
      tax_rate_bps: params.taxRateBps,
      additional_fees_minor: params.additionalFeesMinor,
      total_minor: params.totalMinor,
      amount_paid_minor: params.amountPaidMinor,
      balance_due_minor: params.balanceDueMinor,
      payment_status: params.paymentStatus,
      lifecycle_status: "draft",
      invoice_number: null,
      template_key: params.templateKey,
      template_version: 1,
      theme_snapshot: params.themeSnapshot,
      company_snapshot: params.companySnapshot,
      customer_snapshot: params.customerSnapshot,
      booking_snapshot: params.bookingSnapshot,
      notes: params.notes,
      payment_instructions: params.paymentInstructions,
      terms: params.terms,
      created_by: params.createdBy,
      updated_by: params.createdBy,
    })
    .select("*")
    .single();

  if (error || !invoice) {
    throw new Error(error?.message ?? "Failed to create invoice draft");
  }

  const itemRows = params.items.map((item) => ({
    invoice_id: invoice.id,
    description: item.description,
    detail: item.detail,
    quantity: item.quantity,
    unit: item.unit,
    unit_price_minor: item.unitPriceMinor,
    discount_minor: item.discountMinor,
    line_total_minor: item.lineTotalMinor,
    sort_order: item.sortOrder,
  }));

  const { data: items, error: itemsError } = await supabase
    .from("invoice_items")
    .insert(itemRows)
    .select("*");

  if (itemsError) {
    await supabase.from("invoices").delete().eq("id", invoice.id);
    throw new Error(itemsError.message);
  }

  await insertInvoiceEvent({
    organizationId: params.organizationId,
    invoiceId: invoice.id,
    eventType: "INVOICE_CREATED",
    actorUserId: params.createdBy,
    metadata: { lifecycle_status: "draft" },
  });

  return mapInvoice(invoice as InvoiceRow, {
    items: (items ?? []).map((row) => mapInvoiceItem(row as InvoiceItemRow)),
  });
}

export async function replaceDraftItems(
  organizationId: string,
  invoiceId: string,
  items: Array<{
    description: string;
    detail: string | null;
    quantity: number;
    unit: string;
    unitPriceMinor: number;
    discountMinor: number;
    lineTotalMinor: number;
    sortOrder: number;
  }>,
): Promise<InvoiceItemRecord[]> {
  const supabase = await createClient();

  const { data: existing, error: existingError } = await supabase
    .from("invoices")
    .select("id, organization_id, lifecycle_status")
    .eq("id", invoiceId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }
  if (!existing) {
    throw new Error("Invoice not found");
  }
  if (existing.lifecycle_status !== "draft") {
    throw new Error("Issued invoices cannot be commercially edited");
  }

  const { error: deleteError } = await supabase
    .from("invoice_items")
    .delete()
    .eq("invoice_id", invoiceId);

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  const { data: inserted, error: insertError } = await supabase
    .from("invoice_items")
    .insert(
      items.map((item) => ({
        invoice_id: invoiceId,
        description: item.description,
        detail: item.detail,
        quantity: item.quantity,
        unit: item.unit,
        unit_price_minor: item.unitPriceMinor,
        discount_minor: item.discountMinor,
        line_total_minor: item.lineTotalMinor,
        sort_order: item.sortOrder,
      })),
    )
    .select("*");

  if (insertError) {
    throw new Error(insertError.message);
  }

  return (inserted ?? []).map((row) => mapInvoiceItem(row as InvoiceItemRow));
}

export async function updateInvoiceDraftRow(params: {
  organizationId: string;
  invoiceId: string;
  recipientSource: InvoiceRecipientSource;
  customerId: string | null;
  bookingId: string | null;
  manualRecipientName: string | null;
  manualRecipientCompany: string | null;
  manualRecipientPhone: string | null;
  manualRecipientEmail: string | null;
  manualRecipientAddress: string | null;
  manualRecipientTaxId: string | null;
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
  paymentStatus: InvoicePaymentStatus;
  templateKey: string;
  themeSnapshot: Json;
  companySnapshot: Json;
  customerSnapshot: Json;
  bookingSnapshot: Json | null;
  notes: string | null;
  paymentInstructions: string | null;
  terms: string | null;
  updatedBy: string;
}): Promise<InvoiceRecord> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("invoices")
    .update({
      recipient_source: params.recipientSource,
      customer_id: params.customerId,
      booking_id: params.bookingId,
      manual_recipient_name: params.manualRecipientName,
      manual_recipient_company: params.manualRecipientCompany,
      manual_recipient_phone: params.manualRecipientPhone,
      manual_recipient_email: params.manualRecipientEmail,
      manual_recipient_address: params.manualRecipientAddress,
      manual_recipient_tax_id: params.manualRecipientTaxId,
      currency: params.currency,
      issue_date: params.issueDate,
      due_date: params.dueDate,
      subtotal_minor: params.subtotalMinor,
      discount_minor: params.discountMinor,
      tax_minor: params.taxMinor,
      tax_rate_bps: params.taxRateBps,
      additional_fees_minor: params.additionalFeesMinor,
      total_minor: params.totalMinor,
      amount_paid_minor: params.amountPaidMinor,
      balance_due_minor: params.balanceDueMinor,
      payment_status: params.paymentStatus,
      template_key: params.templateKey,
      theme_snapshot: params.themeSnapshot,
      company_snapshot: params.companySnapshot,
      customer_snapshot: params.customerSnapshot,
      booking_snapshot: params.bookingSnapshot,
      notes: params.notes,
      payment_instructions: params.paymentInstructions,
      terms: params.terms,
      updated_by: params.updatedBy,
    })
    .eq("id", params.invoiceId)
    .eq("organization_id", params.organizationId)
    .eq("lifecycle_status", "draft")
    .select("*")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  if (!data) {
    throw new Error("Draft invoice not found or cannot be edited");
  }

  await insertInvoiceEvent({
    organizationId: params.organizationId,
    invoiceId: params.invoiceId,
    eventType: "INVOICE_UPDATED",
    actorUserId: params.updatedBy,
    metadata: {},
  });

  return mapInvoice(data as InvoiceRow);
}

export async function insertInvoiceEvent(params: {
  organizationId: string;
  invoiceId: string;
  eventType:
    | "INVOICE_CREATED"
    | "INVOICE_UPDATED"
    | "INVOICE_ISSUED"
    | "INVOICE_SENT"
    | "INVOICE_VOIDED"
    | "INVOICE_DUPLICATED";
  actorUserId: string | null;
  metadata?: Json;
}): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("invoice_events").insert({
    organization_id: params.organizationId,
    invoice_id: params.invoiceId,
    event_type: params.eventType,
    actor_user_id: params.actorUserId,
    metadata: params.metadata ?? {},
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function getBrandSettings(
  organizationId: string,
): Promise<InvoiceBrandSettings | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("invoice_brand_settings")
    .select("*")
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  if (!data) {
    return null;
  }
  return mapBrandSettings(data as BrandSettingsRow);
}

export async function ensureBrandSettingsDefaults(params: {
  organizationId: string;
  legalName: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  logoUrl: string | null;
}): Promise<InvoiceBrandSettings> {
  const existing = await getBrandSettings(params.organizationId);
  if (existing) {
    return existing;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("invoice_brand_settings")
    .insert({
      organization_id: params.organizationId,
      legal_name: params.legalName,
      email: params.email,
      phone: params.phone,
      website: params.website,
      logo_url: params.logoUrl,
    })
    .select("*")
    .single();

  if (error || !data) {
    // Race: another insert won
    const again = await getBrandSettings(params.organizationId);
    if (again) return again;
    throw new Error(error?.message ?? "Failed to create brand settings");
  }

  return mapBrandSettings(data as BrandSettingsRow);
}

export async function upsertInvoicePrefix(params: {
  organizationId: string;
  invoicePrefix: string | null;
  legalName?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  logoUrl?: string | null;
}): Promise<InvoiceBrandSettings> {
  const existing = await getBrandSettings(params.organizationId);
  const supabase = await createClient();

  if (existing?.id) {
    const { data, error } = await supabase
      .from("invoice_brand_settings")
      .update({ invoice_prefix: params.invoicePrefix })
      .eq("organization_id", params.organizationId)
      .select("*")
      .single();
    if (error || !data) {
      throw new Error(error?.message ?? "Failed to update invoice prefix");
    }
    return mapBrandSettings(data as BrandSettingsRow);
  }

  const { data, error } = await supabase
    .from("invoice_brand_settings")
    .insert({
      organization_id: params.organizationId,
      invoice_prefix: params.invoicePrefix,
      legal_name: params.legalName ?? null,
      email: params.email ?? null,
      phone: params.phone ?? null,
      website: params.website ?? null,
      logo_url: params.logoUrl ?? null,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to save invoice prefix");
  }
  return mapBrandSettings(data as BrandSettingsRow);
}

export async function upsertBrandSettings(params: {
  organizationId: string;
  patch: {
    defaultTemplateKey?: string;
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
    legalName?: string | null;
    address?: string | null;
    email?: string | null;
    phone?: string | null;
    website?: string | null;
    taxId?: string | null;
    footerText?: string | null;
    paymentAccountsJson?: Json;
    invoicePrefix?: string | null;
    logoUrl?: string | null;
  };
}): Promise<InvoiceBrandSettings> {
  const existing = await getBrandSettings(params.organizationId);
  const supabase = await createClient();
  const payload = {
    default_template_key: params.patch.defaultTemplateKey,
    primary_color: params.patch.primaryColor,
    secondary_color: params.patch.secondaryColor,
    accent_color: params.patch.accentColor,
    legal_name: params.patch.legalName,
    address: params.patch.address,
    email: params.patch.email,
    phone: params.patch.phone,
    website: params.patch.website,
    tax_id: params.patch.taxId,
    footer_text: params.patch.footerText,
    payment_accounts_json: params.patch.paymentAccountsJson,
    invoice_prefix: params.patch.invoicePrefix,
    logo_url: params.patch.logoUrl,
  };

  // Drop undefined so we don't wipe columns unintentionally
  const cleaned = Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined),
  );

  if (existing?.id) {
    const { data, error } = await supabase
      .from("invoice_brand_settings")
      .update(cleaned)
      .eq("organization_id", params.organizationId)
      .select("*")
      .single();
    if (error || !data) {
      throw new Error(error?.message ?? "Failed to update brand settings");
    }
    return mapBrandSettings(data as BrandSettingsRow);
  }

  const { data, error } = await supabase
    .from("invoice_brand_settings")
    .insert({
      organization_id: params.organizationId,
      ...cleaned,
    })
    .select("*")
    .single();
  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create brand settings");
  }
  return mapBrandSettings(data as BrandSettingsRow);
}

export async function verifyCustomerInOrganization(
  organizationId: string,
  customerId: string,
): Promise<{ id: string; full_name: string; phone: string | null; email: string | null } | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leads")
    .select("id, full_name, phone, email")
    .eq("organization_id", organizationId)
    .eq("id", customerId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  return data;
}

export async function verifyBookingInOrganization(
  organizationId: string,
  bookingId: string,
): Promise<{
  id: string;
  lead_id: string | null;
  booking_code: string | null;
  customer_name: string;
  package_name: string | null;
  departure_date: string | null;
  total_pax: number | null;
  total_amount: number | null;
  discount_amount: number | null;
} | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bookings")
    .select(
      "id, lead_id, booking_code, customer_name, package_name, departure_date, total_pax, total_amount, discount_amount",
    )
    .eq("organization_id", organizationId)
    .eq("id", bookingId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  return data;
}

export async function listCustomersForInvoice(
  organizationId: string,
): Promise<Array<{ id: string; fullName: string; phone: string | null }>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leads")
    .select("id, full_name, phone")
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .order("full_name", { ascending: true })
    .limit(200);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    fullName: row.full_name,
    phone: row.phone,
  }));
}

export async function listBookingsForInvoice(
  organizationId: string,
  customerId?: string | null,
): Promise<
  Array<{
    id: string;
    leadId: string | null;
    bookingCode: string | null;
    customerName: string;
    packageName: string | null;
    departureDate: string | null;
    totalPax: number | null;
    totalAmount: number | null;
  }>
> {
  const supabase = await createClient();
  let query = supabase
    .from("bookings")
    .select(
      "id, lead_id, booking_code, customer_name, package_name, departure_date, total_pax, total_amount",
    )
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(200);

  if (customerId) {
    query = query.eq("lead_id", customerId);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    leadId: row.lead_id,
    bookingCode: row.booking_code,
    customerName: row.customer_name,
    packageName: row.package_name,
    departureDate: row.departure_date,
    totalPax: row.total_pax,
    totalAmount: row.total_amount != null ? Number(row.total_amount) : null,
  }));
}

export async function getOrganizationSlug(
  organizationId: string,
): Promise<{ slug: string; name: string; phone: string | null; settings: Json }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organizations")
    .select("slug, name, phone, settings")
    .eq("id", organizationId)
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Organization not found");
  }
  return data;
}

export async function rpcIssueInvoice(invoiceId: string): Promise<InvoiceRecord> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("issue_invoice", {
    p_invoice_id: invoiceId,
  });

  if (error) {
    throw new Error(error.message);
  }

  const row = (Array.isArray(data) ? data[0] : data) as InvoiceRow | null;
  if (!row) {
    throw new Error("Issue invoice returned no row");
  }
  return mapInvoice(row);
}

export async function rpcVoidInvoice(params: {
  invoiceId: string;
  reason: string;
}): Promise<InvoiceRecord> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("void_invoice", {
    p_invoice_id: params.invoiceId,
    p_reason: params.reason,
  });

  if (error) {
    throw new Error(error.message);
  }

  const row = (Array.isArray(data) ? data[0] : data) as InvoiceRow | null;
  if (!row) {
    throw new Error("Void invoice returned no row");
  }
  return mapInvoice(row);
}

export async function rpcMarkInvoiceSent(invoiceId: string): Promise<InvoiceRecord> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("mark_invoice_sent", {
    p_invoice_id: invoiceId,
  });

  if (error) {
    throw new Error(error.message);
  }

  const row = (Array.isArray(data) ? data[0] : data) as InvoiceRow | null;
  if (!row) {
    throw new Error("Mark sent returned no row");
  }
  return mapInvoice(row);
}

export async function rpcRecordInvoiceDuplicated(params: {
  sourceInvoiceId: string;
  newInvoiceId: string;
}): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("record_invoice_duplicated", {
    p_source_invoice_id: params.sourceInvoiceId,
    p_new_invoice_id: params.newInvoiceId,
  });

  if (error) {
    throw new Error(error.message);
  }
}

async function mapRpcInvoice(data: unknown, label: string): Promise<InvoiceRecord> {
  const row = (Array.isArray(data) ? data[0] : data) as InvoiceRow | null;
  if (!row) {
    throw new Error(`${label} returned no row`);
  }
  return mapInvoice(row);
}

export type ClaimInvoicePdfResult = {
  outcome: "claimed" | "already_ready" | "in_progress";
  token: string | null;
  invoice: InvoiceRecord;
};

export async function rpcClaimInvoicePdfGeneration(params: {
  invoiceId: string;
  force?: boolean;
}): Promise<ClaimInvoicePdfResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("claim_invoice_pdf_generation", {
    p_invoice_id: params.invoiceId,
    p_force: params.force ?? false,
  });
  if (error) throw new Error(error.message);

  const payload = data as {
    outcome?: string;
    token?: string | null;
    invoice?: InvoiceRow;
  } | null;

  if (!payload?.outcome || !payload.invoice) {
    throw new Error("PDF claim returned no row");
  }

  const outcome = payload.outcome as ClaimInvoicePdfResult["outcome"];
  if (
    outcome !== "claimed" &&
    outcome !== "already_ready" &&
    outcome !== "in_progress"
  ) {
    throw new Error("Unexpected PDF claim outcome");
  }

  return {
    outcome,
    token: payload.token ?? null,
    invoice: mapInvoice(payload.invoice),
  };
}

export async function rpcCompleteInvoicePdfGeneration(params: {
  invoiceId: string;
  token: string;
  storagePath: string;
}): Promise<InvoiceRecord> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("complete_invoice_pdf_generation", {
    p_invoice_id: params.invoiceId,
    p_token: params.token,
    p_storage_path: params.storagePath,
  });
  if (error) throw new Error(error.message);
  return mapRpcInvoice(data, "PDF complete");
}

export async function rpcFailInvoicePdfGeneration(params: {
  invoiceId: string;
  token: string;
  errorCode: string;
}): Promise<InvoiceRecord> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("fail_invoice_pdf_generation", {
    p_invoice_id: params.invoiceId,
    p_token: params.token,
    p_error_code: params.errorCode,
  });
  if (error) throw new Error(error.message);
  return mapRpcInvoice(data, "PDF fail");
}

export async function rpcFreezeInvoiceLogoAsset(params: {
  invoiceId: string;
  assetPath: string;
  contentHash: string;
}): Promise<InvoiceRecord> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("freeze_invoice_logo_asset", {
    p_invoice_id: params.invoiceId,
    p_asset_path: params.assetPath,
    p_content_hash: params.contentHash,
  });
  if (error) throw new Error(error.message);
  return mapRpcInvoice(data, "Logo freeze");
}
