import { createClient } from "@/utils/supabase/server";

import type {
  FlightDirection,
  InvoiceFlightSegmentRecord,
  InvoiceTicketGroupRecord,
  TicketTripType,
} from "@/modules/finance/types/ticketing";

type TicketGroupRow = {
  id: string;
  organization_id: string;
  invoice_id: string;
  pnr_code: string;
  passenger_count: number;
  trip_type: string;
  primary_airline_code: string | null;
  departure_date: string | null;
  return_date: string | null;
  raw_itinerary: string | null;
  sort_order: number;
};

type FlightSegmentRow = {
  id: string;
  organization_id: string;
  ticket_group_id: string;
  invoice_id: string;
  direction: string;
  segment_order: number;
  airline_code: string;
  flight_number: string;
  booking_class: string | null;
  departure_airport: string;
  arrival_airport: string;
  departure_local_date: string | null;
  departure_local_time: string | null;
  arrival_local_date: string | null;
  arrival_local_time: string | null;
  arrival_day_offset: number;
  status: string | null;
  raw_segment: string | null;
};

function mapSegment(row: FlightSegmentRow): InvoiceFlightSegmentRecord {
  return {
    id: row.id,
    organizationId: row.organization_id,
    ticketGroupId: row.ticket_group_id,
    invoiceId: row.invoice_id,
    direction: row.direction as FlightDirection,
    segmentOrder: row.segment_order,
    airlineCode: row.airline_code,
    flightNumber: row.flight_number,
    bookingClass: row.booking_class,
    departureAirport: row.departure_airport,
    arrivalAirport: row.arrival_airport,
    departureLocalDate: row.departure_local_date,
    departureLocalTime: row.departure_local_time,
    arrivalLocalDate: row.arrival_local_date,
    arrivalLocalTime: row.arrival_local_time,
    arrivalDayOffset: Number(row.arrival_day_offset ?? 0),
    status: row.status,
    rawSegment: row.raw_segment,
  };
}

function mapGroup(
  row: TicketGroupRow,
  segments: InvoiceFlightSegmentRecord[],
): InvoiceTicketGroupRecord {
  return {
    id: row.id,
    organizationId: row.organization_id,
    invoiceId: row.invoice_id,
    pnrCode: row.pnr_code,
    passengerCount: Number(row.passenger_count),
    tripType: row.trip_type as TicketTripType,
    primaryAirlineCode: row.primary_airline_code,
    departureDate: row.departure_date,
    returnDate: row.return_date,
    rawItinerary: row.raw_itinerary,
    sortOrder: row.sort_order,
    segments: segments
      .filter((segment) => segment.ticketGroupId === row.id)
      .sort((a, b) => a.segmentOrder - b.segmentOrder),
  };
}

/** Load all ticket groups + segments for an invoice (org-scoped). */
export async function getTicketingData(
  organizationId: string,
  invoiceId: string,
): Promise<InvoiceTicketGroupRecord[]> {
  const supabase = await createClient();

  const { data: groups, error: groupsError } = await supabase
    .from("invoice_ticket_groups")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("invoice_id", invoiceId)
    .order("sort_order", { ascending: true });

  if (groupsError) {
    throw new Error(groupsError.message);
  }
  if (!groups || groups.length === 0) {
    return [];
  }

  const { data: segments, error: segmentsError } = await supabase
    .from("invoice_flight_segments")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("invoice_id", invoiceId)
    .order("segment_order", { ascending: true });

  if (segmentsError) {
    throw new Error(segmentsError.message);
  }

  const mappedSegments = (segments ?? []).map((row) =>
    mapSegment(row as FlightSegmentRow),
  );

  return (groups as TicketGroupRow[]).map((row) => mapGroup(row, mappedSegments));
}

export type TicketGroupWrite = {
  pnrCode: string;
  passengerCount: number;
  tripType: TicketTripType;
  primaryAirlineCode: string | null;
  departureDate: string | null;
  returnDate: string | null;
  rawItinerary: string | null;
  sortOrder: number;
  segments: Array<{
    direction: FlightDirection;
    segmentOrder: number;
    airlineCode: string;
    flightNumber: string;
    bookingClass: string | null;
    departureAirport: string;
    arrivalAirport: string;
    departureLocalDate: string | null;
    departureLocalTime: string | null;
    arrivalLocalDate: string | null;
    arrivalLocalTime: string | null;
    arrivalDayOffset: number;
    status: string | null;
    rawSegment: string | null;
  }>;
};

/**
 * Replace all ticket data for a draft invoice. Deletes existing groups
 * (segments cascade) then inserts fresh groups + segments. Only permitted
 * while the invoice is a draft (enforced by RLS + immutability triggers).
 */
export async function replaceTicketData(
  organizationId: string,
  invoiceId: string,
  groups: TicketGroupWrite[],
): Promise<void> {
  const supabase = await createClient();

  const { error: deleteError } = await supabase
    .from("invoice_ticket_groups")
    .delete()
    .eq("organization_id", organizationId)
    .eq("invoice_id", invoiceId);

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  for (const group of groups) {
    const { data: inserted, error: groupError } = await supabase
      .from("invoice_ticket_groups")
      .insert({
        organization_id: organizationId,
        invoice_id: invoiceId,
        pnr_code: group.pnrCode,
        passenger_count: group.passengerCount,
        trip_type: group.tripType,
        primary_airline_code: group.primaryAirlineCode,
        departure_date: group.departureDate,
        return_date: group.returnDate,
        raw_itinerary: group.rawItinerary,
        sort_order: group.sortOrder,
      })
      .select("id")
      .single();

    if (groupError || !inserted) {
      throw new Error(groupError?.message ?? "Failed to insert ticket group");
    }

    if (group.segments.length === 0) continue;

    const { error: segmentsError } = await supabase
      .from("invoice_flight_segments")
      .insert(
        group.segments.map((segment) => ({
          organization_id: organizationId,
          ticket_group_id: inserted.id,
          invoice_id: invoiceId,
          direction: segment.direction,
          segment_order: segment.segmentOrder,
          airline_code: segment.airlineCode,
          flight_number: segment.flightNumber,
          booking_class: segment.bookingClass,
          departure_airport: segment.departureAirport,
          arrival_airport: segment.arrivalAirport,
          departure_local_date: segment.departureLocalDate,
          departure_local_time: segment.departureLocalTime,
          arrival_local_date: segment.arrivalLocalDate,
          arrival_local_time: segment.arrivalLocalTime,
          arrival_day_offset: segment.arrivalDayOffset,
          status: segment.status,
          raw_segment: segment.rawSegment,
        })),
      );

    if (segmentsError) {
      throw new Error(segmentsError.message);
    }
  }
}

/** Copy ticket data from a source invoice into a target draft (duplicate). */
export async function copyTicketDataToDraft(
  organizationId: string,
  sourceInvoiceId: string,
  targetInvoiceId: string,
): Promise<void> {
  const groups = await getTicketingData(organizationId, sourceInvoiceId);
  if (groups.length === 0) return;

  await replaceTicketData(
    organizationId,
    targetInvoiceId,
    groups.map((group) => ({
      pnrCode: group.pnrCode,
      passengerCount: group.passengerCount,
      tripType: group.tripType,
      primaryAirlineCode: group.primaryAirlineCode,
      departureDate: group.departureDate,
      returnDate: group.returnDate,
      rawItinerary: group.rawItinerary,
      sortOrder: group.sortOrder,
      segments: group.segments.map((segment) => ({
        direction: segment.direction,
        segmentOrder: segment.segmentOrder,
        airlineCode: segment.airlineCode,
        flightNumber: segment.flightNumber,
        bookingClass: segment.bookingClass,
        departureAirport: segment.departureAirport,
        arrivalAirport: segment.arrivalAirport,
        departureLocalDate: segment.departureLocalDate,
        departureLocalTime: segment.departureLocalTime,
        arrivalLocalDate: segment.arrivalLocalDate,
        arrivalLocalTime: segment.arrivalLocalTime,
        arrivalDayOffset: segment.arrivalDayOffset,
        status: segment.status,
        rawSegment: segment.rawSegment,
      })),
    })),
  );
}
