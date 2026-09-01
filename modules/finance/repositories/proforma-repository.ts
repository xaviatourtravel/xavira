import type { Json } from "@/types/database";
import { createClient } from "@/utils/supabase/server";

import { resolveRecipientDisplayName } from "@/modules/finance/lib/invoice-recipient";
import { assertProformaNotOfficialInvoice } from "@/modules/finance/lib/proforma-lifecycle";
import type { ProformaListFilters } from "@/modules/finance/schemas/proforma";
import type { InvoiceRecipientSource } from "@/modules/finance/types/invoices";
import type {
  ProformaItemRecord,
  ProformaLifecycleStatus,
  ProformaRecord,
} from "@/modules/finance/types/proforma";

type ProformaRow = {
  id: string;
  organization_id: string;
  invoice_type: string;
  recipient_source: string;
  customer_id: string | null;
  booking_id: string | null;
  manual_recipient_name: string | null;
  manual_recipient_company: string | null;
  manual_recipient_phone: string | null;
  manual_recipient_email: string | null;
  manual_recipient_address: string | null;
  manual_recipient_tax_id: string | null;
  proforma_number: string;
  lifecycle_status: string;
  currency: string;
  issue_date: string | null;
  due_date: string | null;
  subtotal_minor: number;
  discount_minor: number;
  tax_minor: number;
  tax_rate_bps: number;
  additional_fees_minor: number;
  total_minor: number;
  template_key: string;
  template_version: number;
  brand_profile_id?: string | null;
  brand_snapshot?: Json | null;
  theme_snapshot: Json;
  company_snapshot: Json;
  customer_snapshot: Json;
  booking_snapshot: Json | null;
  notes: string | null;
  payment_instructions: string | null;
  terms: string | null;
  converted_invoice_id: string | null;
  converted_at: string | null;
  cancelled_at: string | null;
  cancelled_by: string | null;
  cancel_reason: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  leads?: { full_name: string | null } | null;
  converted_invoice?: { invoice_number: string | null } | { invoice_number: string | null }[] | null;
};

type ProformaItemRow = {
  id: string;
  proforma_id: string;
  description: string;
  detail: string | null;
  quantity: number;
  unit: string;
  unit_price_minor: number;
  discount_minor: number;
  line_total_minor: number;
  sort_order: number;
};

function mapItem(row: ProformaItemRow): ProformaItemRecord {
  return {
    id: row.id,
    proformaId: row.proforma_id,
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

function mapProforma(
  row: ProformaRow,
  extras?: { items?: ProformaItemRecord[] },
): ProformaRecord {
  const customerSnapshot =
    (row.customer_snapshot as Record<string, unknown>) ?? {};
  const record: ProformaRecord = {
    id: row.id,
    organizationId: row.organization_id,
    invoiceType: "package",
    recipientSource:
      (row.recipient_source as InvoiceRecipientSource) || "linked_customer",
    customerId: row.customer_id,
    bookingId: row.booking_id,
    manualRecipientName: row.manual_recipient_name,
    manualRecipientCompany: row.manual_recipient_company,
    manualRecipientPhone: row.manual_recipient_phone,
    manualRecipientEmail: row.manual_recipient_email,
    manualRecipientAddress: row.manual_recipient_address,
    manualRecipientTaxId: row.manual_recipient_tax_id,
    proformaNumber: row.proforma_number,
    lifecycleStatus: row.lifecycle_status as ProformaLifecycleStatus,
    currency: row.currency,
    issueDate: row.issue_date,
    dueDate: row.due_date,
    subtotalMinor: Number(row.subtotal_minor),
    discountMinor: Number(row.discount_minor),
    taxMinor: Number(row.tax_minor),
    taxRateBps: Number(row.tax_rate_bps),
    additionalFeesMinor: Number(row.additional_fees_minor),
    totalMinor: Number(row.total_minor),
    templateKey: row.template_key,
    templateVersion: row.template_version,
    brandProfileId: row.brand_profile_id ?? null,
    brandSnapshot: (row.brand_snapshot as Record<string, unknown> | null) ?? null,
    themeSnapshot: row.theme_snapshot as ProformaRecord["themeSnapshot"],
    companySnapshot: row.company_snapshot as ProformaRecord["companySnapshot"],
    customerSnapshot: customerSnapshot as ProformaRecord["customerSnapshot"],
    bookingSnapshot: (row.booking_snapshot ??
      null) as ProformaRecord["bookingSnapshot"],
    notes: row.notes,
    paymentInstructions: row.payment_instructions,
    terms: row.terms,
    convertedInvoiceId: row.converted_invoice_id,
    convertedInvoiceNumber: Array.isArray(row.converted_invoice)
      ? row.converted_invoice[0]?.invoice_number ?? null
      : row.converted_invoice?.invoice_number ?? null,
    convertedAt: row.converted_at,
    cancelledAt: row.cancelled_at,
    cancelledBy: row.cancelled_by,
    cancelReason: row.cancel_reason,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    items: extras?.items,
    customerName: row.leads?.full_name ?? null,
    recipientDisplayName: resolveRecipientDisplayName({
      customerSnapshot,
      customerName: row.leads?.full_name ?? null,
      manualRecipientName: row.manual_recipient_name,
    }),
  };
  assertProformaNotOfficialInvoice(record);
  return record;
}

const SELECT_WITH_JOINS =
  "*, leads(full_name), converted_invoice:invoices!converted_invoice_id(invoice_number)";

export async function listProformas(
  organizationId: string,
  filters: ProformaListFilters = {},
): Promise<ProformaRecord[]> {
  const supabase = await createClient();
  let query = supabase
    .from("proforma_invoices")
    .select(SELECT_WITH_JOINS)
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (filters.lifecycleStatus) {
    query = query.eq("lifecycle_status", filters.lifecycleStatus);
  }
  if (filters.q) {
    query = query.or(
      `proforma_number.ilike.%${filters.q}%,manual_recipient_name.ilike.%${filters.q}%`,
    );
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }
  return (data ?? []).map((row) => mapProforma(row as unknown as ProformaRow));
}

export async function getProformaById(
  organizationId: string,
  proformaId: string,
): Promise<ProformaRecord | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("proforma_invoices")
    .select(SELECT_WITH_JOINS)
    .eq("organization_id", organizationId)
    .eq("id", proformaId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  if (!data) {
    return null;
  }

  const { data: items, error: itemsError } = await supabase
    .from("proforma_items")
    .select("*")
    .eq("proforma_id", proformaId)
    .order("sort_order", { ascending: true });

  if (itemsError) {
    throw new Error(itemsError.message);
  }

  return mapProforma(data as unknown as ProformaRow, {
    items: (items ?? []).map((row) => mapItem(row as ProformaItemRow)),
  });
}

export async function insertProformaDraft(params: {
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
  templateKey: string;
  brandProfileId?: string | null;
  brandSnapshot?: Json | null;
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
}): Promise<ProformaRecord> {
  const supabase = await createClient();
  const { data: proforma, error } = await supabase
    .from("proforma_invoices")
    .insert({
      organization_id: params.organizationId,
      invoice_type: "package",
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
      template_key: params.templateKey,
      template_version: 1,
      brand_profile_id: params.brandProfileId ?? null,
      brand_snapshot: params.brandSnapshot ?? null,
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

  if (error || !proforma) {
    throw new Error(error?.message ?? "Failed to create Proforma");
  }

  const { data: items, error: itemsError } = await supabase
    .from("proforma_items")
    .insert(
      params.items.map((item) => ({
        proforma_id: proforma.id,
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

  if (itemsError) {
    await supabase.from("proforma_invoices").delete().eq("id", proforma.id);
    throw new Error(itemsError.message);
  }

  await supabase.from("proforma_events").insert({
    organization_id: params.organizationId,
    proforma_id: proforma.id,
    event_type: "PROFORMA_CREATED",
    actor_user_id: params.createdBy,
    metadata: { lifecycle_status: "draft" },
  });

  const created = await getProformaById(params.organizationId, proforma.id);
  if (!created) {
    throw new Error("Failed to load created Proforma");
  }
  return {
    ...created,
    items: (items ?? []).map((row) => mapItem(row as ProformaItemRow)),
  };
}

export async function replaceProformaItems(
  organizationId: string,
  proformaId: string,
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
): Promise<void> {
  const supabase = await createClient();
  const { data: existing, error: existingError } = await supabase
    .from("proforma_invoices")
    .select("id, organization_id, lifecycle_status")
    .eq("id", proformaId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }
  if (!existing) {
    throw new Error("Proforma not found");
  }
  if (existing.lifecycle_status !== "draft") {
    throw new Error("Converted or cancelled Proforma cannot be edited");
  }

  const { error: deleteError } = await supabase
    .from("proforma_items")
    .delete()
    .eq("proforma_id", proformaId);
  if (deleteError) {
    throw new Error(deleteError.message);
  }

  const { error: insertError } = await supabase.from("proforma_items").insert(
    items.map((item) => ({
      proforma_id: proformaId,
      description: item.description,
      detail: item.detail,
      quantity: item.quantity,
      unit: item.unit,
      unit_price_minor: item.unitPriceMinor,
      discount_minor: item.discountMinor,
      line_total_minor: item.lineTotalMinor,
      sort_order: item.sortOrder,
    })),
  );
  if (insertError) {
    throw new Error(insertError.message);
  }
}

export async function updateProformaDraftRow(params: {
  organizationId: string;
  proformaId: string;
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
  templateKey: string;
  brandProfileId?: string | null;
  brandSnapshot?: Json | null;
  themeSnapshot: Json;
  companySnapshot: Json;
  customerSnapshot: Json;
  bookingSnapshot: Json | null;
  notes: string | null;
  paymentInstructions: string | null;
  terms: string | null;
  updatedBy: string;
}): Promise<ProformaRecord> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("proforma_invoices")
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
      template_key: params.templateKey,
      brand_profile_id: params.brandProfileId ?? null,
      brand_snapshot: params.brandSnapshot ?? null,
      theme_snapshot: params.themeSnapshot,
      company_snapshot: params.companySnapshot,
      customer_snapshot: params.customerSnapshot,
      booking_snapshot: params.bookingSnapshot,
      notes: params.notes,
      payment_instructions: params.paymentInstructions,
      terms: params.terms,
      updated_by: params.updatedBy,
    })
    .eq("id", params.proformaId)
    .eq("organization_id", params.organizationId)
    .eq("lifecycle_status", "draft");

  if (error) {
    throw new Error(error.message);
  }

  await supabase.from("proforma_events").insert({
    organization_id: params.organizationId,
    proforma_id: params.proformaId,
    event_type: "PROFORMA_UPDATED",
    actor_user_id: params.updatedBy,
    metadata: { lifecycle_status: "draft" },
  });

  const updated = await getProformaById(params.organizationId, params.proformaId);
  if (!updated) {
    throw new Error("Proforma not found");
  }
  return updated;
}

export async function rpcConvertProforma(proformaId: string): Promise<{
  invoiceId: string;
  invoiceNumber: string | null;
  proformaId: string;
  proformaNumber: string;
  alreadyConverted: boolean;
}> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("convert_proforma_to_invoice", {
    p_proforma_id: proformaId,
  });
  if (error) {
    throw new Error(error.message);
  }
  const payload = data as {
    invoice_id?: string;
    invoice_number?: string | null;
    proforma_id?: string;
    proforma_number?: string;
    already_converted?: boolean;
  } | null;
  if (!payload?.invoice_id || !payload.proforma_id) {
    throw new Error("Conversion returned no Invoice");
  }
  return {
    invoiceId: payload.invoice_id,
    invoiceNumber: payload.invoice_number ?? null,
    proformaId: payload.proforma_id,
    proformaNumber: payload.proforma_number ?? "",
    alreadyConverted: payload.already_converted === true,
  };
}

export async function rpcCancelProforma(
  proformaId: string,
  reason: string,
): Promise<ProformaRecord> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("cancel_proforma", {
    p_proforma_id: proformaId,
    p_reason: reason,
  });
  if (error) {
    throw new Error(error.message);
  }
  const row = (Array.isArray(data) ? data[0] : data) as ProformaRow | null;
  if (!row) {
    throw new Error("Cancel Proforma returned no row");
  }
  return mapProforma(row);
}

export async function rpcDeleteDraftProforma(proformaId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("delete_draft_proforma", {
    p_proforma_id: proformaId,
  });
  if (error) {
    throw new Error(error.message);
  }
}
