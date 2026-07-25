import React from "react";
import { Text, View } from "@react-pdf/renderer";

import {
  resolveAirlineName,
  resolveAirportDisplay,
} from "@/modules/finance/lib/airport-airline-directory";
import { INVOICE_PDF_LABELS, formatTripType } from "@/modules/finance/pdf/invoice-pdf-labels";
import type { InvoicePdfData } from "@/modules/finance/pdf/invoice-pdf-types";
import { PDF_LINE, PDF_SPACE, PDF_TYPE } from "@/modules/finance/pdf/invoice-pdf-theme";
import {
  groupSegmentsByDirection,
} from "@/modules/finance/lib/ticketing-grouping";
import type { InvoiceFlightSegmentRecord } from "@/modules/finance/types/ticketing";

const MONTH_ID: Record<string, string> = {
  JAN: "Jan",
  FEB: "Feb",
  MAR: "Mar",
  APR: "Apr",
  MAY: "Mei",
  JUN: "Jun",
  JUL: "Jul",
  AUG: "Agu",
  SEP: "Sep",
  OCT: "Okt",
  NOV: "Nov",
  DEC: "Des",
};

const ISO_MONTH_ID = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

/** Format a GDS day/month token ("02AUG") or ISO date; never invents a year. */
function formatSegmentDate(value: string | null): string | null {
  if (!value) return null;
  const token = value.trim().toUpperCase();
  const gds = token.match(/^(\d{2})([A-Z]{3})$/);
  if (gds && MONTH_ID[gds[2]!]) {
    return `${gds[1]} ${MONTH_ID[gds[2]!]}`;
  }
  const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) {
    const monthIndex = Number(iso[2]) - 1;
    const month = ISO_MONTH_ID[monthIndex] ?? iso[2];
    return `${iso[3]} ${month} ${iso[1]}`;
  }
  return value;
}

function SegmentEndpoint({
  segment,
  endpoint,
  theme,
}: {
  segment: InvoiceFlightSegmentRecord;
  endpoint: "departure" | "arrival";
  theme: InvoicePdfData["theme"];
}) {
  const text = theme.text ?? "#0F172A";
  const muted = theme.muted ?? theme.secondaryColor;
  const isArrival = endpoint === "arrival";
  const airport = resolveAirportDisplay(
    isArrival ? segment.arrivalAirport : segment.departureAirport,
  );
  const time = isArrival
    ? segment.arrivalLocalTime
    : segment.departureLocalTime;
  const date = formatSegmentDate(
    isArrival ? segment.arrivalLocalDate : segment.departureLocalDate,
  );
  const dayOffset = isArrival ? segment.arrivalDayOffset : 0;

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "baseline",
        minHeight: 12,
      }}
    >
      <Text
        style={{
          width: 42,
          flexShrink: 0,
          fontFamily: "Helvetica-Bold",
          fontSize: PDF_TYPE.body,
          color: text,
        }}
      >
        {time ?? "—"}
      </Text>
      <Text
        style={{
          width: 31,
          flexShrink: 0,
          fontFamily: "Helvetica-Bold",
          fontSize: PDF_TYPE.body,
          color: text,
          letterSpacing: 0.3,
        }}
        data-airport-code="dominant"
      >
        {airport.code}
      </Text>
      <Text
        style={{
          flex: 1,
          minWidth: 0,
          fontSize: PDF_TYPE.caption,
          color: muted,
          lineHeight: PDF_LINE.tight,
        }}
      >
        {airport.primary}
      </Text>
      {date ? (
        <Text
          style={{
            marginLeft: PDF_SPACE.sm,
            fontSize: PDF_TYPE.caption,
            color: muted,
          }}
        >
          {date}
        </Text>
      ) : null}
      {dayOffset > 0 ? (
        <Text
          style={{
            marginLeft: PDF_SPACE.xs,
            fontFamily: "Helvetica-Bold",
            fontSize: PDF_TYPE.caption,
            color: theme.primaryColor,
          }}
          data-arrival-day-offset="true"
        >
          {`+${dayOffset} ${INVOICE_PDF_LABELS.nextDay}`}
        </Text>
      ) : null}
    </View>
  );
}

function SegmentRow({
  segment,
  theme,
  showDivider,
}: {
  segment: InvoiceFlightSegmentRecord;
  theme: InvoicePdfData["theme"];
  showDivider: boolean;
}) {
  const muted = theme.muted ?? theme.secondaryColor;
  const airline = resolveAirlineName(segment.airlineCode);
  const flightLabel = `${segment.airlineCode}${segment.flightNumber}`;
  const classLabel = segment.bookingClass
    ? ` · ${INVOICE_PDF_LABELS.flightClass} ${segment.bookingClass}`
    : "";

  return (
    <View
      wrap={false}
      style={{
        minHeight: 38,
        paddingVertical: 4,
        borderTopWidth: showDivider ? 0.7 : 0,
        borderTopColor: theme.divider,
      }}
      data-flight-segment="compact-row"
      data-compact-height-target="38-52pt"
    >
      <SegmentEndpoint segment={segment} endpoint="departure" theme={theme} />
      <View
        style={{
          flexDirection: "row",
          alignItems: "baseline",
          minHeight: 11,
        }}
      >
        <Text
          style={{
            width: 73,
            flexShrink: 0,
            color: theme.primaryColor,
            fontSize: PDF_TYPE.caption,
          }}
        >
          {"↓"}
        </Text>
        <Text
          style={{
            flex: 1,
            color: muted,
            fontSize: PDF_TYPE.caption,
            lineHeight: PDF_LINE.tight,
          }}
          data-flight-detail="single-airline-label"
        >
          {`${flightLabel}${classLabel} · ${airline}`}
        </Text>
      </View>
      <SegmentEndpoint segment={segment} endpoint="arrival" theme={theme} />
    </View>
  );
}

function TransitRow({
  airportCode,
  theme,
}: {
  airportCode: string;
  theme: InvoicePdfData["theme"];
}) {
  const muted = theme.muted ?? theme.secondaryColor;
  return (
    <View
      wrap={false}
      style={{
        flexDirection: "row",
        alignItems: "center",
        minHeight: 13,
      }}
      data-transit-row="compact"
    >
      <View
        style={{
          width: 18,
          height: 0.7,
          backgroundColor: theme.divider,
        }}
      />
      <Text
        style={{
          marginHorizontal: PDF_SPACE.xs,
          fontSize: PDF_TYPE.caption,
          color: muted,
        }}
      >
        {`${INVOICE_PDF_LABELS.transit} · ${resolveAirportDisplay(airportCode).primary}`}
      </Text>
      <View
        style={{
          flex: 1,
          height: 0.7,
          backgroundColor: theme.divider,
        }}
      />
    </View>
  );
}

function DirectionGroup({
  title,
  segments,
  theme,
}: {
  title: string;
  segments: InvoiceFlightSegmentRecord[];
  theme: InvoicePdfData["theme"];
}) {
  if (segments.length === 0) return null;
  const muted = theme.muted ?? theme.secondaryColor;
  const firstDate = formatSegmentDate(segments[0]?.departureLocalDate ?? null);
  const last = segments[segments.length - 1];
  const lastDate = formatSegmentDate(
    last?.arrivalLocalDate ?? last?.departureLocalDate ?? null,
  );
  const dateRange =
    firstDate && lastDate
      ? firstDate === lastDate
        ? firstDate
        : `${firstDate} – ${lastDate}`
      : firstDate ?? lastDate;

  return (
    <View
      style={{ marginTop: PDF_SPACE.sm }}
      wrap
      data-journey-group="compact-list"
    >
      <View
        wrap={false}
        minPresenceAhead={44}
        style={{
          flexDirection: "row",
          alignItems: "baseline",
          justifyContent: "space-between",
          paddingBottom: 3,
          borderBottomWidth: 0.8,
          borderBottomColor: theme.divider,
        }}
      >
        <Text
          style={{
            fontSize: PDF_TYPE.sectionTitle,
            fontFamily: "Helvetica-Bold",
            color: muted,
            textTransform: "uppercase",
            letterSpacing: 0.8,
          }}
        >
          {title}
        </Text>
        {dateRange ? (
          <Text style={{ fontSize: PDF_TYPE.caption, color: muted }}>
            {dateRange}
          </Text>
        ) : null}
      </View>
      {segments.map((segment, index) => {
        const prev = index > 0 ? segments[index - 1] : null;
        const isTransit =
          prev != null && prev.arrivalAirport === segment.departureAirport;
        return (
          <View key={segment.id} wrap={false}>
            {isTransit ? (
              <TransitRow
                airportCode={segment.departureAirport}
                theme={theme}
              />
            ) : null}
            <SegmentRow
              segment={segment}
              theme={theme}
              showDivider={index > 0 && !isTransit}
            />
          </View>
        );
      })}
    </View>
  );
}

/** Customer-facing flight itinerary — grouped, readable, never raw GDS. */
export function FlightItinerary({ data }: { data: InvoicePdfData }) {
  if (!data.ticketing || data.ticketing.groups.length === 0) return null;
  const text = data.theme.text ?? "#0F172A";
  const muted = data.theme.muted ?? data.theme.secondaryColor;

  return (
    <View
      style={{ marginTop: PDF_SPACE.md }}
      data-ticketing-itinerary="compact"
      data-standard-four-segment-budget="230pt-max"
    >
      <Text
        style={{
          fontSize: PDF_TYPE.sectionTitle,
          fontFamily: "Helvetica-Bold",
          color: muted,
          textTransform: "uppercase",
          letterSpacing: 0.8,
          marginBottom: 1,
        }}
      >
        {INVOICE_PDF_LABELS.flightItinerary}
      </Text>

      {data.ticketing.groups.map((group) => {
        const grouped = groupSegmentsByDirection(group.segments);
        return (
          <View key={group.id} style={{ marginBottom: PDF_SPACE.xs }} wrap>
            {data.ticketing!.groups.length > 1 ? (
              <Text
                style={{
                  fontSize: PDF_TYPE.caption,
                  fontFamily: "Helvetica-Bold",
                  color: text,
                  marginTop: PDF_SPACE.xs,
                }}
              >
                {`${INVOICE_PDF_LABELS.pnr}: ${group.pnrCode}`}
              </Text>
            ) : null}
            <DirectionGroup
              title={INVOICE_PDF_LABELS.departureGroup}
              segments={grouped.outbound}
              theme={data.theme}
            />
            <DirectionGroup
              title={INVOICE_PDF_LABELS.returnGroup}
              segments={grouped.return}
              theme={data.theme}
            />
            <DirectionGroup
              title={INVOICE_PDF_LABELS.otherGroup}
              segments={grouped.other}
              theme={data.theme}
            />
          </View>
        );
      })}
    </View>
  );
}

/** Compact ticket summary strip: PNR, pax, trip type, primary airline. */
export function TicketSummary({ data }: { data: InvoicePdfData }) {
  if (!data.ticketing || data.ticketing.groups.length === 0) return null;
  const group = data.ticketing.groups[0]!;
  const text = data.theme.text ?? "#0F172A";
  const muted = data.theme.muted ?? data.theme.secondaryColor;

  const cells: Array<{ label: string; value: string }> = [
    { label: INVOICE_PDF_LABELS.pnr, value: group.pnrCode },
    {
      label: INVOICE_PDF_LABELS.passengers,
      value: `${group.passengerCount} ${INVOICE_PDF_LABELS.passengersUnit}`,
    },
    { label: INVOICE_PDF_LABELS.tripType, value: formatTripType(group.tripType) },
  ];
  if (group.primaryAirlineCode) {
    cells.push({
      label: INVOICE_PDF_LABELS.primaryAirline,
      value: `${group.primaryAirlineCode} · ${resolveAirlineName(group.primaryAirlineCode)}`,
    });
  }

  return (
    <View
      wrap={false}
      style={{
        marginTop: PDF_SPACE.sm,
        flexDirection: "row",
        paddingVertical: 6,
        borderTopWidth: 0.8,
        borderBottomWidth: 0.8,
        borderTopColor: data.theme.divider,
        borderBottomColor: data.theme.divider,
      }}
      data-ticket-summary="true"
      data-ticket-summary-layout="single-row"
    >
      {cells.map((cell, index) => (
        <View
          key={cell.label}
          style={{
            flex: 1,
            minWidth: 0,
            paddingHorizontal: index === 0 ? 0 : PDF_SPACE.sm,
            borderLeftWidth: index === 0 ? 0 : 0.7,
            borderLeftColor: data.theme.divider,
          }}
        >
          <Text
            style={{
              fontSize: PDF_TYPE.caption,
              color: muted,
              textTransform: "uppercase",
              letterSpacing: 0.4,
            }}
          >
            {cell.label}
          </Text>
          <Text
            style={{
              marginTop: 1,
              fontFamily: "Helvetica-Bold",
              fontSize: PDF_TYPE.caption,
              color: text,
              lineHeight: PDF_LINE.tight,
            }}
          >
            {cell.value}
          </Text>
        </View>
      ))}
    </View>
  );
}
