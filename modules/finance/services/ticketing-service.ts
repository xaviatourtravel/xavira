import type { Profile } from "@/types/app-types";

import {
  assertInvoicePermission,
  assertSameOrganization,
  requireOrganizationId,
} from "@/modules/finance/lib/invoice-access";
import { buildRouteSummary, buildTicketingInvoiceItems } from "@/modules/finance/lib/ticketing-pricing";
import { createInvoiceDraftSchema, updateInvoiceDraftSchema } from "@/modules/finance/schemas/invoices";
import type {
  CreateTicketingDraftInput,
  UpdateTicketingDraftInput,
} from "@/modules/finance/schemas/ticketing";
import type { InvoiceRecord } from "@/modules/finance/types/invoices";
import type { InvoiceTicketGroupRecord } from "@/modules/finance/types/ticketing";
import * as repo from "@/modules/finance/repositories/invoice-repository";
import * as ticketRepo from "@/modules/finance/repositories/ticketing-repository";
import {
  createDraftInvoice,
  updateDraftInvoice,
} from "@/modules/finance/services/invoice-service";

function routeSummaryFromSegments(
  segments: CreateTicketingDraftInput["ticketGroup"]["segments"],
): string {
  const codes: Array<string | null | undefined> = [];
  for (const segment of segments) {
    codes.push(segment.departureAirport);
    codes.push(segment.arrivalAirport);
  }
  return buildRouteSummary(codes);
}

function buildDraftItemsAndTotals(input: CreateTicketingDraftInput | UpdateTicketingDraftInput) {
  const routeSummary = routeSummaryFromSegments(input.ticketGroup.segments);
  const { items, totals } = buildTicketingInvoiceItems({
    passengerCount: input.ticketGroup.passengerCount,
    pricePerPassengerMinor: input.pricing.pricePerPassengerMinor,
    serviceFeeMinor: input.pricing.serviceFeeMinor,
    taxesAndFeesMinor: input.pricing.taxesAndFeesMinor,
    discountMinor: input.pricing.discountMinor,
    routeSummary,
  });

  return {
    items: items.map((item, index) => ({
      description: item.description,
      detail: item.detail,
      quantity: item.quantity,
      unit: item.unit,
      unitPriceMinor: item.unitPriceMinor,
      discountMinor: item.discountMinor,
      sortOrder: index,
    })),
    totals: {
      discountMinor: totals.discountMinor,
      taxRateBps: totals.taxRateBps,
      additionalFeesMinor: totals.additionalFeesMinor,
      amountPaidMinor: input.pricing.amountPaidMinor,
    },
  };
}

function recipientPayload(input: CreateTicketingDraftInput | UpdateTicketingDraftInput) {
  if (input.recipientSource === "manual") {
    return {
      recipientSource: "manual" as const,
      customerId: null,
      bookingId: null,
      manualRecipientName: input.manualRecipientName,
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
  };
}

function ticketGroupWrite(input: CreateTicketingDraftInput | UpdateTicketingDraftInput) {
  const group = input.ticketGroup;
  return [
    {
      pnrCode: group.pnrCode,
      passengerCount: group.passengerCount,
      tripType: group.tripType,
      primaryAirlineCode: group.primaryAirlineCode ?? null,
      departureDate: group.departureDate ?? null,
      returnDate: group.returnDate ?? null,
      rawItinerary: group.rawItinerary ?? null,
      sortOrder: group.sortOrder ?? 0,
      segments: group.segments.map((segment, index) => ({
        direction: segment.direction,
        segmentOrder: segment.segmentOrder ?? index,
        airlineCode: segment.airlineCode,
        flightNumber: segment.flightNumber,
        bookingClass: segment.bookingClass ?? null,
        departureAirport: segment.departureAirport,
        arrivalAirport: segment.arrivalAirport,
        departureLocalDate: segment.departureLocalDate ?? null,
        departureLocalTime: segment.departureLocalTime ?? null,
        arrivalLocalDate: segment.arrivalLocalDate ?? null,
        arrivalLocalTime: segment.arrivalLocalTime ?? null,
        arrivalDayOffset: segment.arrivalDayOffset ?? 0,
        status: segment.status ?? null,
        rawSegment: segment.rawSegment ?? null,
      })),
    },
  ];
}

export async function getInvoiceTicketing(
  profile: Profile,
  invoiceId: string,
): Promise<InvoiceTicketGroupRecord[]> {
  assertInvoicePermission(profile, "invoices.view");
  const organizationId = requireOrganizationId(profile);
  return ticketRepo.getTicketingData(organizationId, invoiceId);
}

export async function createTicketingDraft(
  profile: Profile,
  input: CreateTicketingDraftInput,
): Promise<InvoiceRecord> {
  assertInvoicePermission(profile, "invoices.create");
  const organizationId = requireOrganizationId(profile);

  const { items, totals } = buildDraftItemsAndTotals(input);
  const draftInput = createInvoiceDraftSchema.parse({
    invoiceType: "ticketing",
    documentType: input.documentType,
    includeItineraryDetail: input.includeItineraryDetail === true,
    paymentRequestNote: input.paymentRequestNote ?? null,
    currency: input.currency,
    issueDate: input.issueDate ?? null,
    dueDate: input.dueDate ?? null,
    notes: input.notes ?? null,
    paymentInstructions: input.paymentInstructions ?? null,
    terms: input.terms ?? null,
    templateKey: input.templateKey,
    primaryColor: input.primaryColor,
    secondaryColor: input.secondaryColor,
    accentColor: input.accentColor,
    items,
    totals,
    ...recipientPayload(input),
  });

  const draft = await createDraftInvoice(profile, draftInput);
  await ticketRepo.replaceTicketData(organizationId, draft.id, ticketGroupWrite(input));
  return draft;
}

export async function updateTicketingDraft(
  profile: Profile,
  input: UpdateTicketingDraftInput,
): Promise<InvoiceRecord> {
  assertInvoicePermission(profile, "invoices.edit");
  const organizationId = requireOrganizationId(profile);

  const existing = await repo.getInvoiceById(organizationId, input.invoiceId);
  if (!existing) {
    throw new Error("Invoice not found");
  }
  assertSameOrganization(existing.organizationId, organizationId);
  if (existing.invoiceType !== "ticketing") {
    throw new Error("Not a ticketing invoice");
  }
  if (existing.lifecycleStatus !== "draft") {
    throw new Error("Only draft invoices can be edited");
  }

  const { items, totals } = buildDraftItemsAndTotals(input);
  const draftInput = updateInvoiceDraftSchema.parse({
    invoiceId: input.invoiceId,
    invoiceType: "ticketing",
    documentType: input.documentType,
    includeItineraryDetail: input.includeItineraryDetail === true,
    paymentRequestNote: input.paymentRequestNote ?? null,
    currency: input.currency,
    issueDate: input.issueDate ?? null,
    dueDate: input.dueDate ?? null,
    notes: input.notes ?? null,
    paymentInstructions: input.paymentInstructions ?? null,
    terms: input.terms ?? null,
    templateKey: input.templateKey,
    primaryColor: input.primaryColor,
    secondaryColor: input.secondaryColor,
    accentColor: input.accentColor,
    items,
    totals,
    ...recipientPayload(input),
  });

  const updated = await updateDraftInvoice(profile, draftInput);
  await ticketRepo.replaceTicketData(organizationId, input.invoiceId, ticketGroupWrite(input));
  return updated;
}

/** Server-side revalidation used before issue for ticketing invoices. */
export async function assertTicketingReadyForIssue(
  organizationId: string,
  invoiceId: string,
): Promise<void> {
  const groups = await ticketRepo.getTicketingData(organizationId, invoiceId);
  if (groups.length === 0) {
    throw new Error("Ticketing invoice must have at least one ticket group before issue");
  }
  for (const group of groups) {
    if (group.segments.length === 0) {
      throw new Error("Every ticket group must have at least one flight segment before issue");
    }
  }
}
