import { z } from "zod";

import { INVOICE_TEMPLATE_KEYS } from "@/modules/finance/pdf/invoice-pdf-types";
import {
  FLIGHT_DIRECTIONS,
  INVOICE_DOCUMENT_TYPES,
  TICKET_TRIP_TYPES,
} from "@/modules/finance/types/ticketing";

/**
 * Normalize a PNR: trim, strip inner whitespace, uppercase. Airline record
 * locators are alphanumeric and are NOT assumed to be exactly six characters.
 */
export function normalizePnr(input: string | null | undefined): string {
  if (input == null) return "";
  return input.replace(/\s+/g, "").toUpperCase();
}

export const pnrSchema = z
  .string()
  .transform((value) => normalizePnr(value))
  .refine((value) => value.length >= 4 && value.length <= 10, {
    message: "PNR must be 4–10 characters",
  })
  .refine((value) => /^[A-Z0-9]+$/.test(value), {
    message: "PNR may only contain letters and numbers",
  });

const airportSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{3}$/, "Airport code must be three uppercase letters");

const airlineSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9]{2,3}$/, "Airline code is invalid")
  .refine((value) => /[A-Z]/.test(value), {
    message: "Airline code must contain a letter",
  });

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullable()
    .optional()
    .transform((value) => (value == null || value === "" ? null : value));

const timeSchema = z
  .string()
  .trim()
  .regex(/^([0-2]\d):([0-5]\d)$/, "Time must be HH:MM")
  .nullable()
  .optional()
  .transform((value) => (value == null || value === "" ? null : value));

export const flightSegmentInputSchema = z
  .object({
    direction: z.enum(FLIGHT_DIRECTIONS).default("outbound"),
    segmentOrder: z.number().int().nonnegative(),
    airlineCode: airlineSchema,
    flightNumber: z.string().trim().min(1).max(5),
    bookingClass: optionalText(4),
    departureAirport: airportSchema,
    arrivalAirport: airportSchema,
    departureLocalDate: optionalText(16),
    departureLocalTime: timeSchema,
    arrivalLocalDate: optionalText(16),
    arrivalLocalTime: timeSchema,
    arrivalDayOffset: z.number().int().min(0).max(30).default(0),
    status: optionalText(8),
    rawSegment: optionalText(400),
  })
  .superRefine((value, ctx) => {
    if (value.departureAirport === value.arrivalAirport) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Departure and arrival airports must differ",
        path: ["arrivalAirport"],
      });
    }
  });

export const ticketGroupInputSchema = z.object({
  pnrCode: pnrSchema,
  passengerCount: z.number().int().positive().max(999),
  tripType: z.enum(TICKET_TRIP_TYPES).default("one_way"),
  primaryAirlineCode: airlineSchema.nullable().optional(),
  departureDate: z.string().date().nullable().optional(),
  returnDate: z.string().date().nullable().optional(),
  rawItinerary: optionalText(8000),
  sortOrder: z.number().int().nonnegative().default(0),
  segments: z.array(flightSegmentInputSchema).min(1, "At least one flight segment is required"),
});

const templateKeySchema = z
  .string()
  .trim()
  .transform((value) => value.toLowerCase())
  .refine(
    (value) => (INVOICE_TEMPLATE_KEYS as readonly string[]).includes(value) || value === "ticketing",
    { message: "Unknown template" },
  )
  .optional();

const hexColor = z
  .string()
  .trim()
  .regex(/^#?[0-9a-fA-F]{6}$/)
  .optional();

const pricingSchema = z.object({
  pricePerPassengerMinor: z.number().int().nonnegative(),
  serviceFeeMinor: z.number().int().nonnegative().default(0),
  taxesAndFeesMinor: z.number().int().nonnegative().default(0),
  discountMinor: z.number().int().nonnegative().default(0),
  amountPaidMinor: z.number().int().nonnegative().default(0),
});

const ticketingBaseSchema = z.object({
  documentType: z.enum(INVOICE_DOCUMENT_TYPES).default("invoice"),
  currency: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{3}$/)
    .default("IDR"),
  issueDate: z.string().date().nullable().optional(),
  dueDate: z.string().date().nullable().optional(),
  notes: optionalText(5000),
  paymentInstructions: optionalText(5000),
  terms: optionalText(5000),
  templateKey: templateKeySchema,
  primaryColor: hexColor,
  secondaryColor: hexColor,
  accentColor: hexColor,
  includeItineraryDetail: z.boolean().default(false),
  paymentRequestNote: optionalText(64),
  ticketGroup: ticketGroupInputSchema,
  pricing: pricingSchema,
});

const linkedCustomerTicketing = ticketingBaseSchema.extend({
  recipientSource: z.literal("linked_customer"),
  customerId: z.string().uuid(),
  bookingId: z.string().uuid().nullable().optional(),
});

const manualRecipientTicketing = ticketingBaseSchema.extend({
  recipientSource: z.literal("manual"),
  customerId: z.string().uuid().nullable().optional(),
  bookingId: z.string().uuid().nullable().optional(),
  manualRecipientName: z.string().trim().min(1, "recipient name is required").max(200),
  manualRecipientCompany: optionalText(200),
  manualRecipientPhone: optionalText(32),
  manualRecipientEmail: optionalText(320),
  manualRecipientAddress: optionalText(1000),
  manualRecipientTaxId: optionalText(64),
});

export const createTicketingDraftSchema = z.discriminatedUnion("recipientSource", [
  linkedCustomerTicketing,
  manualRecipientTicketing,
]);

export const updateTicketingDraftSchema = z.discriminatedUnion("recipientSource", [
  linkedCustomerTicketing.extend({ invoiceId: z.string().uuid() }),
  manualRecipientTicketing.extend({ invoiceId: z.string().uuid() }),
]);

export type FlightSegmentInput = z.infer<typeof flightSegmentInputSchema>;
export type TicketGroupInput = z.infer<typeof ticketGroupInputSchema>;
export type CreateTicketingDraftInput = z.infer<typeof createTicketingDraftSchema>;
export type UpdateTicketingDraftInput = z.infer<typeof updateTicketingDraftSchema>;
