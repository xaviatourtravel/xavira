import type { Profile } from "@/types/app-types";
import type { Json } from "@/types/database";

import { parseOrganizationWorkspaceSettings } from "@/lib/settings/organization-settings";
import { calculateInvoiceTotals } from "@/modules/finance/lib/invoice-calculator";
import {
  assertBookingMatchesInvoiceCustomer,
  assertInvoicePermission,
  assertSameOrganization,
  isCommerciallyLockedLifecycle,
  requireOrganizationId,
} from "@/modules/finance/lib/invoice-access";
import { buildBookingPrefill } from "@/modules/finance/lib/invoice-prefill";
import type {
  CreateInvoiceDraftInput,
  UpdateInvoiceDraftInput,
} from "@/modules/finance/schemas/invoices";
import type {
  InvoiceBookingSnapshot,
  InvoiceBrandSettings,
  InvoiceCompanySnapshot,
  InvoiceCustomerSnapshot,
  InvoiceListFilters,
  InvoiceRecord,
  InvoiceThemeSnapshot,
} from "@/modules/finance/types/invoices";
import * as repo from "@/modules/finance/repositories/invoice-repository";

function asJson(value: unknown): Json {
  return value as Json;
}

async function resolveBrandAndCompany(organizationId: string): Promise<{
  brand: InvoiceBrandSettings;
  companySnapshot: InvoiceCompanySnapshot;
  themeSnapshot: InvoiceThemeSnapshot;
}> {
  const org = await repo.getOrganizationSlug(organizationId);
  const settings = parseOrganizationWorkspaceSettings(org.settings);

  const brand = await repo.ensureBrandSettingsDefaults({
    organizationId,
    legalName: org.name,
    email: settings.businessEmail || null,
    phone: org.phone,
    website: settings.website || null,
    logoUrl: settings.logoUrl,
  });

  const companySnapshot: InvoiceCompanySnapshot = {
    legalName: brand.legalName,
    logoUrl: brand.logoUrl,
    address: brand.address,
    email: brand.email,
    phone: brand.phone,
    website: brand.website,
    taxId: brand.taxId,
    paymentAccounts: brand.paymentAccountsJson,
    primaryColor: brand.primaryColor,
    secondaryColor: brand.secondaryColor,
    accentColor: brand.accentColor,
    footerText: brand.footerText,
  };

  const themeSnapshot: InvoiceThemeSnapshot = {
    templateKey: brand.defaultTemplateKey,
    templateVersion: 1,
    primaryColor: brand.primaryColor,
    secondaryColor: brand.secondaryColor,
    accentColor: brand.accentColor,
  };

  return { brand, companySnapshot, themeSnapshot };
}

async function buildCustomerSnapshot(
  organizationId: string,
  input: CreateInvoiceDraftInput | UpdateInvoiceDraftInput,
): Promise<InvoiceCustomerSnapshot> {
  if (input.recipientSource === "manual") {
    return {
      source: "manual",
      customer_id: null,
      name: input.manualRecipientName.trim(),
      company: input.manualRecipientCompany ?? null,
      phone: input.manualRecipientPhone ?? null,
      email: input.manualRecipientEmail ?? null,
      address: input.manualRecipientAddress ?? null,
      tax_id: input.manualRecipientTaxId ?? null,
    };
  }

  const customer = await repo.verifyCustomerInOrganization(
    organizationId,
    input.customerId,
  );
  if (!customer) {
    throw new Error("Customer must belong to the invoice organization");
  }

  return {
    source: "linked_customer",
    customer_id: customer.id,
    name: customer.full_name,
    company: null,
    phone: customer.phone,
    email: customer.email,
    address: null,
    tax_id: null,
  };
}

async function buildBookingSnapshot(
  organizationId: string,
  bookingId: string | null | undefined,
  customerId: string | null,
): Promise<InvoiceBookingSnapshot | null> {
  if (!bookingId) {
    return null;
  }
  if (!customerId) {
    throw new Error("Booking requires a linked customer");
  }

  const booking = await repo.verifyBookingInOrganization(
    organizationId,
    bookingId,
  );
  if (!booking) {
    throw new Error("Booking must belong to the invoice organization");
  }
  assertBookingMatchesInvoiceCustomer(booking.lead_id, customerId);

  const totalAmountMinor =
    booking.total_amount != null && Number.isFinite(Number(booking.total_amount))
      ? Math.round(Number(booking.total_amount))
      : null;

  return {
    bookingId: booking.id,
    bookingCode: booking.booking_code,
    packageName: booking.package_name,
    departureDate: booking.departure_date,
    participantCount: booking.total_pax,
    leadTraveller: booking.customer_name,
    totalAmountMinor,
  };
}

function draftRecipientFields(input: CreateInvoiceDraftInput | UpdateInvoiceDraftInput) {
  if (input.recipientSource === "manual") {
    return {
      recipientSource: "manual" as const,
      customerId: null,
      bookingId: null,
      manualRecipientName: input.manualRecipientName.trim(),
      manualRecipientCompany: input.manualRecipientCompany ?? null,
      manualRecipientPhone: input.manualRecipientPhone ?? null,
      manualRecipientEmail: input.manualRecipientEmail ?? null,
      manualRecipientAddress: input.manualRecipientAddress ?? null,
      manualRecipientTaxId: input.manualRecipientTaxId ?? null,
    };
  }

  return {
    recipientSource: "linked_customer" as const,
    customerId: input.customerId,
    bookingId: input.bookingId ?? null,
    manualRecipientName: null,
    manualRecipientCompany: null,
    manualRecipientPhone: null,
    manualRecipientEmail: null,
    manualRecipientAddress: null,
    manualRecipientTaxId: null,
  };
}

function computeDraftTotals(input: CreateInvoiceDraftInput | UpdateInvoiceDraftInput) {
  return calculateInvoiceTotals({
    items: input.items.map((item) => ({
      quantity: item.quantity,
      unitPriceMinor: item.unitPriceMinor,
      discountMinor: item.discountMinor ?? 0,
    })),
    discountMinor: input.totals.discountMinor ?? 0,
    taxRateBps: input.totals.taxRateBps ?? 0,
    taxMinor: input.totals.taxMinor,
    additionalFeesMinor: input.totals.additionalFeesMinor ?? 0,
    amountPaidMinor: input.totals.amountPaidMinor ?? 0,
  });
}

export async function listOrganizationInvoices(
  profile: Profile,
  filters: InvoiceListFilters = {},
): Promise<InvoiceRecord[]> {
  assertInvoicePermission(profile, "invoices.view");
  const organizationId = requireOrganizationId(profile);
  return repo.listInvoices(organizationId, filters);
}

export async function getOrganizationInvoice(
  profile: Profile,
  invoiceId: string,
): Promise<InvoiceRecord> {
  assertInvoicePermission(profile, "invoices.view");
  const organizationId = requireOrganizationId(profile);
  const invoice = await repo.getInvoiceById(organizationId, invoiceId);
  if (!invoice) {
    throw new Error("Invoice not found");
  }
  assertSameOrganization(invoice.organizationId, organizationId);
  return invoice;
}

export async function createDraftInvoice(
  profile: Profile,
  input: CreateInvoiceDraftInput,
): Promise<InvoiceRecord> {
  assertInvoicePermission(profile, "invoices.create");
  const organizationId = requireOrganizationId(profile);
  const totals = computeDraftTotals(input);
  const { brand, companySnapshot, themeSnapshot } =
    await resolveBrandAndCompany(organizationId);
  const recipient = draftRecipientFields(input);
  const customerSnapshot = await buildCustomerSnapshot(organizationId, input);
  const bookingSnapshot =
    recipient.recipientSource === "linked_customer"
      ? await buildBookingSnapshot(
          organizationId,
          recipient.bookingId,
          recipient.customerId,
        )
      : null;

  const items = input.items.map((item, index) => ({
    description: item.description,
    detail: item.detail ?? null,
    quantity: item.quantity,
    unit: item.unit,
    unitPriceMinor: item.unitPriceMinor,
    discountMinor: item.discountMinor ?? 0,
    lineTotalMinor: totals.lines[index]!.lineTotalMinor,
    sortOrder: item.sortOrder ?? index,
  }));

  return repo.insertInvoiceDraft({
    organizationId,
    ...recipient,
    currency: input.currency,
    issueDate: input.issueDate ?? null,
    dueDate: input.dueDate ?? null,
    subtotalMinor: totals.subtotalMinor,
    discountMinor: totals.discountMinor,
    taxMinor: totals.taxMinor,
    taxRateBps: totals.taxRateBps,
    additionalFeesMinor: totals.additionalFeesMinor,
    totalMinor: totals.totalMinor,
    amountPaidMinor: totals.amountPaidMinor,
    balanceDueMinor: totals.balanceDueMinor,
    paymentStatus: totals.paymentStatus,
    templateKey: input.templateKey || brand.defaultTemplateKey,
    themeSnapshot: asJson(themeSnapshot),
    companySnapshot: asJson(companySnapshot),
    customerSnapshot: asJson(customerSnapshot),
    bookingSnapshot: bookingSnapshot ? asJson(bookingSnapshot) : null,
    notes: input.notes ?? null,
    paymentInstructions: input.paymentInstructions ?? null,
    terms: input.terms ?? null,
    createdBy: profile.id,
    items,
  });
}

export async function updateDraftInvoice(
  profile: Profile,
  input: UpdateInvoiceDraftInput,
): Promise<InvoiceRecord> {
  assertInvoicePermission(profile, "invoices.edit");
  const organizationId = requireOrganizationId(profile);
  const existing = await repo.getInvoiceById(organizationId, input.invoiceId);
  if (!existing) {
    throw new Error("Invoice not found");
  }
  assertSameOrganization(existing.organizationId, organizationId);

  if (isCommerciallyLockedLifecycle(existing.lifecycleStatus)) {
    throw new Error("Issued invoices cannot be commercially edited");
  }
  if (existing.lifecycleStatus !== "draft") {
    throw new Error("Only draft invoices can be edited");
  }
  if (existing.invoiceNumber) {
    throw new Error("Draft invoices must not have an invoice number");
  }

  const totals = computeDraftTotals(input);
  const { brand, companySnapshot, themeSnapshot } =
    await resolveBrandAndCompany(organizationId);
  const recipient = draftRecipientFields(input);
  const customerSnapshot = await buildCustomerSnapshot(organizationId, input);
  const bookingSnapshot =
    recipient.recipientSource === "linked_customer"
      ? await buildBookingSnapshot(
          organizationId,
          recipient.bookingId,
          recipient.customerId,
        )
      : null;

  const items = input.items.map((item, index) => ({
    description: item.description,
    detail: item.detail ?? null,
    quantity: item.quantity,
    unit: item.unit,
    unitPriceMinor: item.unitPriceMinor,
    discountMinor: item.discountMinor ?? 0,
    lineTotalMinor: totals.lines[index]!.lineTotalMinor,
    sortOrder: item.sortOrder ?? index,
  }));

  await repo.replaceDraftItems(organizationId, input.invoiceId, items);

  const updated = await repo.updateInvoiceDraftRow({
    organizationId,
    invoiceId: input.invoiceId,
    ...recipient,
    currency: input.currency,
    issueDate: input.issueDate ?? null,
    dueDate: input.dueDate ?? null,
    subtotalMinor: totals.subtotalMinor,
    discountMinor: totals.discountMinor,
    taxMinor: totals.taxMinor,
    taxRateBps: totals.taxRateBps,
    additionalFeesMinor: totals.additionalFeesMinor,
    totalMinor: totals.totalMinor,
    amountPaidMinor: totals.amountPaidMinor,
    balanceDueMinor: totals.balanceDueMinor,
    paymentStatus: totals.paymentStatus,
    templateKey: input.templateKey || brand.defaultTemplateKey,
    themeSnapshot: asJson(themeSnapshot),
    companySnapshot: asJson(companySnapshot),
    customerSnapshot: asJson(customerSnapshot),
    bookingSnapshot: bookingSnapshot ? asJson(bookingSnapshot) : null,
    notes: input.notes ?? null,
    paymentInstructions: input.paymentInstructions ?? null,
    terms: input.terms ?? null,
    updatedBy: profile.id,
  });

  return {
    ...updated,
    items: (await repo.getInvoiceById(organizationId, input.invoiceId))?.items,
  };
}

export async function issueDraftInvoice(
  profile: Profile,
  params: { invoiceId: string },
): Promise<InvoiceRecord> {
  assertInvoicePermission(profile, "invoices.issue");
  const organizationId = requireOrganizationId(profile);
  const existing = await repo.getInvoiceById(organizationId, params.invoiceId);
  if (!existing) {
    throw new Error("Invoice not found");
  }
  assertSameOrganization(existing.organizationId, organizationId);

  if (existing.lifecycleStatus !== "draft") {
    throw new Error("Only draft invoices can be issued");
  }
  if (existing.invoiceNumber) {
    throw new Error("Draft invoices must not have an invoice number");
  }
  if (!existing.items?.length) {
    throw new Error("Invoice must have at least one line item before issue");
  }

  // RPC derives org from locked invoice, rebuilds snapshots, and recalculates totals.
  // App never supplies actor, org, or snapshots.
  return repo.rpcIssueInvoice(existing.id);
}

export async function voidIssuedInvoice(
  profile: Profile,
  params: { invoiceId: string; reason: string },
): Promise<InvoiceRecord> {
  assertInvoicePermission(profile, "invoices.void");
  const organizationId = requireOrganizationId(profile);
  const existing = await repo.getInvoiceById(organizationId, params.invoiceId);
  if (!existing) {
    throw new Error("Invoice not found");
  }
  assertSameOrganization(existing.organizationId, organizationId);

  const reason = params.reason.trim();
  if (!reason) {
    throw new Error("void reason is required");
  }

  return repo.rpcVoidInvoice({
    invoiceId: existing.id,
    reason,
  });
}

export async function markInvoiceSent(
  profile: Profile,
  invoiceId: string,
): Promise<InvoiceRecord> {
  assertInvoicePermission(profile, "invoices.issue");
  const organizationId = requireOrganizationId(profile);
  const existing = await repo.getInvoiceById(organizationId, invoiceId);
  if (!existing) {
    throw new Error("Invoice not found");
  }
  assertSameOrganization(existing.organizationId, organizationId);

  return repo.rpcMarkInvoiceSent(existing.id);
}

export async function duplicateInvoiceAsDraft(
  profile: Profile,
  invoiceId: string,
): Promise<InvoiceRecord> {
  assertInvoicePermission(profile, "invoices.create");
  const organizationId = requireOrganizationId(profile);
  const existing = await repo.getInvoiceById(organizationId, invoiceId);
  if (!existing) {
    throw new Error("Invoice not found");
  }
  assertSameOrganization(existing.organizationId, organizationId);

  if (!existing.items?.length) {
    throw new Error("Cannot duplicate an invoice without line items");
  }

  const shared = {
    currency: existing.currency,
    issueDate: null as string | null,
    dueDate: null as string | null,
    notes: existing.notes,
    paymentInstructions: existing.paymentInstructions,
    terms: existing.terms,
    templateKey: existing.templateKey,
    items: existing.items.map((item) => ({
      description: item.description,
      detail: item.detail,
      quantity: item.quantity,
      unit: item.unit,
      unitPriceMinor: item.unitPriceMinor,
      discountMinor: item.discountMinor,
      sortOrder: item.sortOrder,
    })),
    totals: {
      discountMinor: existing.discountMinor,
      taxRateBps: existing.taxRateBps,
      taxMinor: existing.taxMinor,
      additionalFeesMinor: existing.additionalFeesMinor,
      amountPaidMinor: 0,
    },
  };

  const draftInput: CreateInvoiceDraftInput =
    existing.recipientSource === "manual"
      ? {
          recipientSource: "manual",
          customerId: null,
          bookingId: null,
          manualRecipientName: existing.manualRecipientName ?? "",
          manualRecipientCompany: existing.manualRecipientCompany,
          manualRecipientPhone: existing.manualRecipientPhone,
          manualRecipientEmail: existing.manualRecipientEmail,
          manualRecipientAddress: existing.manualRecipientAddress,
          manualRecipientTaxId: existing.manualRecipientTaxId,
          ...shared,
        }
      : {
          recipientSource: "linked_customer",
          customerId: existing.customerId ?? "",
          bookingId: existing.bookingId,
          ...shared,
        };

  if (draftInput.recipientSource === "linked_customer") {
    if (!draftInput.customerId) {
      throw new Error("Cannot duplicate: linked customer is missing");
    }
    if (draftInput.bookingId) {
      try {
        await buildBookingSnapshot(
          organizationId,
          draftInput.bookingId,
          draftInput.customerId,
        );
      } catch {
        draftInput.bookingId = null;
      }
    }
  }

  const draft = await createDraftInvoice(profile, draftInput);

  await repo.rpcRecordInvoiceDuplicated({
    sourceInvoiceId: invoiceId,
    newInvoiceId: draft.id,
  });

  if (draft.invoiceNumber) {
    throw new Error("Duplicated draft must not reuse an invoice number");
  }

  return draft;
}

export async function prefillFromBooking(
  profile: Profile,
  bookingId: string,
) {
  assertInvoicePermission(profile, "invoices.create");
  const organizationId = requireOrganizationId(profile);
  const booking = await repo.verifyBookingInOrganization(
    organizationId,
    bookingId,
  );
  if (!booking) {
    throw new Error("Booking must belong to the invoice organization");
  }
  return buildBookingPrefill(booking);
}

export async function loadInvoiceEditorOptions(profile: Profile, customerId?: string | null) {
  assertInvoicePermission(profile, "invoices.view");
  const organizationId = requireOrganizationId(profile);
  const [customers, bookings] = await Promise.all([
    repo.listCustomersForInvoice(organizationId),
    repo.listBookingsForInvoice(organizationId, customerId),
  ]);
  return { customers, bookings };
}

export async function getOrganizationInvoicePrefix(
  profile: Profile,
): Promise<string | null> {
  assertInvoicePermission(profile, "invoices.view");
  const organizationId = requireOrganizationId(profile);
  const brand = await repo.getBrandSettings(organizationId);
  return brand?.invoicePrefix ?? null;
}

export async function saveOrganizationInvoicePrefix(
  profile: Profile,
  invoicePrefix: string | null,
): Promise<string | null> {
  assertInvoicePermission(profile, "invoices.edit");
  const organizationId = requireOrganizationId(profile);
  const org = await repo.getOrganizationSlug(organizationId);
  const settings = parseOrganizationWorkspaceSettings(org.settings);
  const saved = await repo.upsertInvoicePrefix({
    organizationId,
    invoicePrefix,
    legalName: org.name,
    email: settings.businessEmail || null,
    phone: org.phone,
    website: settings.website || null,
    logoUrl: settings.logoUrl ?? null,
  });
  return saved.invoicePrefix;
}
