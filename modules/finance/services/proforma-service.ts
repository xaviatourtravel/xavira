import type { Profile } from "@/types/app-types";
import type { Json } from "@/types/database";

import { parseOrganizationWorkspaceSettings } from "@/lib/settings/organization-settings";
import { calculateInvoiceTotals } from "@/modules/finance/lib/invoice-calculator";
import {
  assertBookingMatchesInvoiceCustomer,
  assertInvoicePermission,
  assertSameOrganization,
  requireOrganizationId,
} from "@/modules/finance/lib/invoice-access";
import {
  coercePaymentAccounts,
  enabledPaymentAccountsForDocuments,
} from "@/modules/finance/lib/invoice-payment-accounts";
import { getSafeInvoiceTheme } from "@/modules/finance/lib/invoice-theme-colors";
import {
  canCancelProforma,
  canConvertProforma,
  canDeleteProforma,
  isProformaEditable,
} from "@/modules/finance/lib/proforma-lifecycle";
import {
  getInvoiceTemplateVersion,
  normalizeInvoiceTemplateKey,
} from "@/modules/finance/pdf/invoice-template-registry";
import type {
  CreateProformaDraftInput,
  ProformaListFilters,
  UpdateProformaDraftInput,
} from "@/modules/finance/schemas/proforma";
import type {
  InvoiceBookingSnapshot,
  InvoiceBrandSettings,
  InvoiceCompanySnapshot,
  InvoiceCustomerSnapshot,
  InvoiceThemeSnapshot,
} from "@/modules/finance/types/invoices";
import type { ProformaRecord } from "@/modules/finance/types/proforma";
import * as invoiceRepo from "@/modules/finance/repositories/invoice-repository";
import * as repo from "@/modules/finance/repositories/proforma-repository";
import { tryGenerateInvoicePdfAfterIssue } from "@/modules/finance/services/invoice-pdf-service";
import { resolveWorkspaceBranding } from "@/modules/organization/branding/lib/branding-settings";
import * as brandingRepo from "@/modules/organization/branding/repositories/branding-repository";

function asJson(value: unknown): Json {
  return value as Json;
}

async function resolveBrandAndCompany(
  organizationId: string,
  override?: {
    templateKey?: string;
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
  },
): Promise<{
  companySnapshot: InvoiceCompanySnapshot;
  themeSnapshot: InvoiceThemeSnapshot;
}> {
  const orgRow = await brandingRepo.getOrganizationBrandingRow(organizationId);
  const org = await invoiceRepo.getOrganizationSlug(organizationId);
  const settings = parseOrganizationWorkspaceSettings(org.settings);
  const brand: InvoiceBrandSettings =
    await invoiceRepo.ensureBrandSettingsDefaults({
      organizationId,
      legalName: org.name,
      email: settings.businessEmail || null,
      phone: org.phone,
      website: settings.website || null,
      logoUrl: settings.logoUrl,
    });

  const workspace = resolveWorkspaceBranding({
    organizationId,
    organizationName: orgRow?.name ?? org.name,
    organizationPhone: orgRow?.phone ?? org.phone,
    settings: orgRow?.settings ?? org.settings,
    legacy: {
      legalName: brand.legalName,
      address: brand.address,
      email: brand.email,
      phone: brand.phone,
      website: brand.website,
      taxId: brand.taxId,
      primaryColor: brand.primaryColor,
      secondaryColor: brand.secondaryColor,
      accentColor: brand.accentColor,
      logoUrl: brand.logoUrl,
    },
  });

  const templateKey = normalizeInvoiceTemplateKey(
    override?.templateKey ?? brand.defaultTemplateKey,
  );
  const colors = getSafeInvoiceTheme({
    primaryColor:
      override?.primaryColor ?? workspace.primaryColor ?? brand.primaryColor,
    secondaryColor:
      override?.secondaryColor ??
      workspace.secondaryColor ??
      brand.secondaryColor,
    accentColor:
      override?.accentColor ?? workspace.accentColor ?? brand.accentColor,
  });

  return {
    companySnapshot: {
      legalName: workspace.legalName || brand.legalName || org.name,
      logoUrl: workspace.logoStorageRef ?? brand.logoUrl ?? settings.logoUrl,
      address: workspace.address ?? brand.address,
      email: workspace.email ?? brand.email,
      phone: workspace.phone ?? brand.phone,
      website: workspace.website ?? brand.website,
      taxId: workspace.taxId ?? brand.taxId,
      paymentAccounts: enabledPaymentAccountsForDocuments(
        coercePaymentAccounts(brand.paymentAccountsJson),
      ),
      primaryColor: colors.primaryColor,
      secondaryColor: colors.secondaryColor,
      accentColor: colors.accentColor,
      footerText: brand.footerText,
    },
    themeSnapshot: {
      templateKey,
      templateVersion: getInvoiceTemplateVersion(templateKey),
      primaryColor: colors.primaryColor,
      secondaryColor: colors.secondaryColor,
      accentColor: colors.accentColor,
    },
  };
}

async function buildCustomerSnapshot(
  organizationId: string,
  input: CreateProformaDraftInput | UpdateProformaDraftInput,
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

  const customer = await invoiceRepo.verifyCustomerInOrganization(
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
  if (!bookingId) return null;
  if (!customerId) {
    throw new Error("Booking requires a linked customer");
  }
  const booking = await invoiceRepo.verifyBookingInOrganization(
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

function draftRecipientFields(
  input: CreateProformaDraftInput | UpdateProformaDraftInput,
) {
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

function computeTotals(input: CreateProformaDraftInput | UpdateProformaDraftInput) {
  return calculateInvoiceTotals({
    items: input.items.map((item) => ({
      quantity: item.quantity,
      unitPriceMinor: item.unitPriceMinor,
      discountMinor: item.discountMinor ?? 0,
    })),
    discountMinor: input.totals.discountMinor,
    taxRateBps: input.totals.taxRateBps,
    taxMinor: input.totals.taxMinor,
    additionalFeesMinor: input.totals.additionalFeesMinor,
    amountPaidMinor: 0,
  });
}

export async function listOrganizationProformas(
  profile: Profile,
  filters: ProformaListFilters = {},
): Promise<ProformaRecord[]> {
  assertInvoicePermission(profile, "invoices.view");
  return repo.listProformas(requireOrganizationId(profile), filters);
}

export async function getOrganizationProforma(
  profile: Profile,
  proformaId: string,
): Promise<ProformaRecord> {
  assertInvoicePermission(profile, "invoices.view");
  const organizationId = requireOrganizationId(profile);
  const proforma = await repo.getProformaById(organizationId, proformaId);
  if (!proforma) {
    throw new Error("Proforma not found");
  }
  assertSameOrganization(proforma.organizationId, organizationId);
  return proforma;
}

export async function createDraftProforma(
  profile: Profile,
  input: CreateProformaDraftInput,
): Promise<ProformaRecord> {
  assertInvoicePermission(profile, "invoices.create");
  const organizationId = requireOrganizationId(profile);
  const totals = computeTotals(input);
  const { companySnapshot, themeSnapshot } = await resolveBrandAndCompany(
    organizationId,
    {
      templateKey: input.templateKey,
      primaryColor: input.primaryColor,
      secondaryColor: input.secondaryColor,
      accentColor: input.accentColor,
    },
  );
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

  return repo.insertProformaDraft({
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
    templateKey: themeSnapshot.templateKey,
    themeSnapshot: asJson(themeSnapshot),
    companySnapshot: asJson(companySnapshot),
    customerSnapshot: asJson(customerSnapshot),
    bookingSnapshot: bookingSnapshot ? asJson(bookingSnapshot) : null,
    notes: input.notes ?? null,
    paymentInstructions: input.paymentInstructions ?? null,
    terms: input.terms ?? null,
    createdBy: profile.id,
    items: input.items.map((item, index) => ({
      description: item.description,
      detail: item.detail ?? null,
      quantity: item.quantity,
      unit: item.unit,
      unitPriceMinor: item.unitPriceMinor,
      discountMinor: item.discountMinor ?? 0,
      lineTotalMinor: totals.lines[index]!.lineTotalMinor,
      sortOrder: item.sortOrder ?? index,
    })),
  });
}

export async function updateDraftProforma(
  profile: Profile,
  input: UpdateProformaDraftInput,
): Promise<ProformaRecord> {
  assertInvoicePermission(profile, "invoices.edit");
  const organizationId = requireOrganizationId(profile);
  const existing = await repo.getProformaById(organizationId, input.proformaId);
  if (!existing) {
    throw new Error("Proforma not found");
  }
  assertSameOrganization(existing.organizationId, organizationId);
  if (!isProformaEditable(existing.lifecycleStatus)) {
    throw new Error("Converted or cancelled Proforma cannot be edited");
  }

  const totals = computeTotals(input);
  const { companySnapshot, themeSnapshot } = await resolveBrandAndCompany(
    organizationId,
    {
      templateKey: input.templateKey,
      primaryColor: input.primaryColor,
      secondaryColor: input.secondaryColor,
      accentColor: input.accentColor,
    },
  );
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

  await repo.replaceProformaItems(
    organizationId,
    input.proformaId,
    input.items.map((item, index) => ({
      description: item.description,
      detail: item.detail ?? null,
      quantity: item.quantity,
      unit: item.unit,
      unitPriceMinor: item.unitPriceMinor,
      discountMinor: item.discountMinor ?? 0,
      lineTotalMinor: totals.lines[index]!.lineTotalMinor,
      sortOrder: item.sortOrder ?? index,
    })),
  );

  return repo.updateProformaDraftRow({
    organizationId,
    proformaId: input.proformaId,
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
    templateKey: themeSnapshot.templateKey,
    themeSnapshot: asJson(themeSnapshot),
    companySnapshot: asJson(companySnapshot),
    customerSnapshot: asJson(customerSnapshot),
    bookingSnapshot: bookingSnapshot ? asJson(bookingSnapshot) : null,
    notes: input.notes ?? null,
    paymentInstructions: input.paymentInstructions ?? null,
    terms: input.terms ?? null,
    updatedBy: profile.id,
  });
}

export async function convertProformaToInvoice(
  profile: Profile,
  proformaId: string,
): Promise<{
  invoiceId: string;
  invoiceNumber: string | null;
  proformaId: string;
  alreadyConverted: boolean;
}> {
  assertInvoicePermission(profile, "invoices.issue");
  const organizationId = requireOrganizationId(profile);
  const existing = await repo.getProformaById(organizationId, proformaId);
  if (!existing) {
    throw new Error("Proforma not found");
  }
  assertSameOrganization(existing.organizationId, organizationId);
  if (!canConvertProforma(existing) && existing.lifecycleStatus !== "converted") {
    throw new Error("This Proforma cannot be converted");
  }

  const result = await repo.rpcConvertProforma(proformaId);
  await tryGenerateInvoicePdfAfterIssue(profile, result.invoiceId);
  return result;
}

export async function cancelProforma(
  profile: Profile,
  params: { proformaId: string; reason: string },
): Promise<ProformaRecord> {
  assertInvoicePermission(profile, "invoices.void");
  const organizationId = requireOrganizationId(profile);
  const existing = await repo.getProformaById(organizationId, params.proformaId);
  if (!existing) {
    throw new Error("Proforma not found");
  }
  assertSameOrganization(existing.organizationId, organizationId);
  if (!canCancelProforma(existing) && existing.lifecycleStatus !== "cancelled") {
    throw new Error("Converted Proforma cannot be cancelled");
  }
  return repo.rpcCancelProforma(params.proformaId, params.reason);
}

export async function deleteDraftProforma(
  profile: Profile,
  proformaId: string,
): Promise<void> {
  assertInvoicePermission(profile, "invoices.edit");
  const organizationId = requireOrganizationId(profile);
  const existing = await repo.getProformaById(organizationId, proformaId);
  if (!existing) {
    throw new Error("Proforma not found");
  }
  assertSameOrganization(existing.organizationId, organizationId);
  if (!canDeleteProforma(existing)) {
    throw new Error("Only an active unconverted Proforma can be deleted");
  }
  await repo.rpcDeleteDraftProforma(proformaId);
}
