"use client";

import Link from "next/link";
import { useMemo, useRef, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/lib/i18n/use-translation";
import {
  resolveAirlineName,
  resolveAirportDisplay,
} from "@/modules/finance/lib/airport-airline-directory";
import { calculateInvoiceTotals } from "@/modules/finance/lib/invoice-calculator";
import { formatMinorAsIdr } from "@/modules/finance/lib/invoice-money";
import {
  applyParsedItinerary,
  editableSegmentsToTicketPayload,
  ensureSegmentsFromRawItinerary,
  normalizePrimaryAirlineInput,
  ticketingSaveGuard,
  type EditableTicketSegment,
  type TicketingSaveGuardKey,
} from "@/modules/finance/lib/ticketing-editor-state";
import { looksLikeRawZodIssues } from "@/modules/finance/lib/ticketing-validation-messages";
import {
  buildRouteSummary,
  buildTicketingInvoiceItems,
} from "@/modules/finance/lib/ticketing-pricing";
import { InvoiceMoneyInput } from "@/modules/finance/components/invoice-money-input";
import { InvoiceTemplateBrandingFields } from "@/modules/finance/components/invoice-template-branding-fields";
import { DEFAULT_INVOICE_TEMPLATE_KEY } from "@/modules/finance/pdf/invoice-pdf-types";
import type {
  FlightDirection,
  TicketTripType,
} from "@/modules/finance/types/ticketing";
import type {
  InvoiceEditorBookingOption,
  InvoiceEditorCustomerOption,
} from "@/modules/finance/components/invoice-draft-editor";

type EditableSegment = EditableTicketSegment;

export type TicketingEditorInitial = {
  invoiceId?: string;
  recipientSource?: "linked_customer" | "manual";
  customerId?: string;
  bookingId?: string | null;
  manualRecipientName?: string | null;
  manualRecipientCompany?: string | null;
  manualRecipientPhone?: string | null;
  manualRecipientEmail?: string | null;
  manualRecipientAddress?: string | null;
  manualRecipientTaxId?: string | null;
  documentType?: "invoice" | "proforma";
  includeItineraryDetail?: boolean;
  paymentRequestNote?: string | null;
  templateKey?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  issueDate?: string | null;
  dueDate?: string | null;
  notes?: string | null;
  paymentInstructions?: string | null;
  terms?: string | null;
  pnrCode?: string;
  passengerCount?: number;
  tripType?: TicketTripType;
  primaryAirlineCode?: string | null;
  departureDate?: string | null;
  returnDate?: string | null;
  rawItinerary?: string | null;
  segments?: EditableSegment[];
  pricePerPassengerMinor?: number;
  serviceFeeMinor?: number;
  taxesAndFeesMinor?: number;
  discountMinor?: number;
  amountPaidMinor?: number;
};

type TicketingInvoiceEditorProps = {
  mode: "create" | "edit";
  action: (formData: FormData) => void | Promise<void>;
  customers: InvoiceEditorCustomerOption[];
  bookings: InvoiceEditorBookingOption[];
  workspaceBrand: {
    templateKey: string;
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
  };
  initial?: TicketingEditorInitial;
  errorMessage?: string | null;
};

const emptySegment = (direction: FlightDirection = "outbound"): EditableSegment => ({
  direction,
  airlineCode: "",
  flightNumber: "",
  bookingClass: "",
  departureAirport: "",
  arrivalAirport: "",
  departureLocalDate: "",
  departureLocalTime: "",
  arrivalLocalDate: "",
  arrivalLocalTime: "",
  arrivalDayOffset: 0,
  status: "",
  rawSegment: "",
});

const DIRECTIONS: FlightDirection[] = ["outbound", "return", "other"];
const TRIP_TYPES: TicketTripType[] = ["one_way", "round_trip", "multi_city"];

export function TicketingInvoiceEditor({
  mode,
  action,
  customers,
  bookings,
  workspaceBrand,
  initial,
  errorMessage,
}: TicketingInvoiceEditorProps) {
  const { tStrict } = useTranslation();
  const [pending, startTransition] = useTransition();

  const [templateKey, setTemplateKey] = useState(
    initial?.templateKey ?? workspaceBrand.templateKey ?? DEFAULT_INVOICE_TEMPLATE_KEY,
  );
  const [primaryColor, setPrimaryColor] = useState(
    initial?.primaryColor ?? workspaceBrand.primaryColor,
  );
  const [secondaryColor, setSecondaryColor] = useState(
    initial?.secondaryColor ?? workspaceBrand.secondaryColor,
  );
  const [accentColor, setAccentColor] = useState(
    initial?.accentColor ?? workspaceBrand.accentColor,
  );

  const [recipientSource, setRecipientSource] = useState<
    "linked_customer" | "manual"
  >(initial?.recipientSource ?? "linked_customer");
  const [customerId, setCustomerId] = useState(initial?.customerId ?? "");
  const [bookingId, setBookingId] = useState(initial?.bookingId ?? "");
  const [manualName, setManualName] = useState(initial?.manualRecipientName ?? "");
  const [manualCompany, setManualCompany] = useState(
    initial?.manualRecipientCompany ?? "",
  );
  const [manualPhone, setManualPhone] = useState(initial?.manualRecipientPhone ?? "");
  const [manualEmail, setManualEmail] = useState(initial?.manualRecipientEmail ?? "");
  const [manualAddress, setManualAddress] = useState(
    initial?.manualRecipientAddress ?? "",
  );
  const [manualTaxId, setManualTaxId] = useState(initial?.manualRecipientTaxId ?? "");

  const [documentType, setDocumentType] = useState<"invoice" | "proforma">(
    initial?.documentType ?? "invoice",
  );
  const [includeItineraryDetail, setIncludeItineraryDetail] = useState(
    initial?.includeItineraryDetail === true,
  );
  const [paymentRequestNote, setPaymentRequestNote] = useState(
    initial?.paymentRequestNote ?? "",
  );

  const [pnrCode, setPnrCode] = useState(initial?.pnrCode ?? "");
  const [passengerCount, setPassengerCount] = useState(
    initial?.passengerCount ?? 1,
  );
  const [tripType, setTripType] = useState<TicketTripType>(
    initial?.tripType ?? "round_trip",
  );
  const [primaryAirline, setPrimaryAirline] = useState(
    initial?.primaryAirlineCode ?? "",
  );
  const [departureDate, setDepartureDate] = useState(initial?.departureDate ?? "");
  const [returnDate, setReturnDate] = useState(initial?.returnDate ?? "");
  const [rawItinerary, setRawItinerary] = useState(initial?.rawItinerary ?? "");
  const [segments, setSegments] = useState<EditableSegment[]>(
    initial?.segments?.length ? initial.segments : [],
  );
  const [parserNotes, setParserNotes] = useState<string[]>([]);
  const [guardError, setGuardError] = useState<TicketingSaveGuardKey | null>(
    null,
  );
  const itinerarySectionRef = useRef<HTMLElement | null>(null);

  const airlineInput = normalizePrimaryAirlineInput(primaryAirline);

  const [pricePerPassengerMinor, setPricePerPassengerMinor] = useState(
    initial?.pricePerPassengerMinor ?? 0,
  );
  const [serviceFeeMinor, setServiceFeeMinor] = useState(
    initial?.serviceFeeMinor ?? 0,
  );
  const [taxesAndFeesMinor, setTaxesAndFeesMinor] = useState(
    initial?.taxesAndFeesMinor ?? 0,
  );
  const [discountMinor, setDiscountMinor] = useState(initial?.discountMinor ?? 0);
  const [amountPaidMinor, setAmountPaidMinor] = useState(
    initial?.amountPaidMinor ?? 0,
  );

  const filteredBookings = useMemo(() => {
    if (!customerId) return bookings;
    return bookings.filter(
      (booking) => !booking.leadId || booking.leadId === customerId,
    );
  }, [bookings, customerId]);

  const routeSummary = useMemo(
    () =>
      buildRouteSummary(
        segments.flatMap((s) => [s.departureAirport, s.arrivalAirport]),
      ),
    [segments],
  );

  const preview = useMemo(() => {
    if (!Number.isInteger(passengerCount) || passengerCount <= 0) return null;
    try {
      const pricing = buildTicketingInvoiceItems({
        passengerCount,
        pricePerPassengerMinor,
        serviceFeeMinor,
        taxesAndFeesMinor,
        discountMinor,
        routeSummary,
      });
      return calculateInvoiceTotals({
        items: pricing.items.map((item) => ({
          quantity: item.quantity,
          unitPriceMinor: item.unitPriceMinor,
          discountMinor: item.discountMinor,
        })),
        discountMinor: pricing.totals.discountMinor,
        taxRateBps: pricing.totals.taxRateBps,
        additionalFeesMinor: pricing.totals.additionalFeesMinor,
        amountPaidMinor,
      });
    } catch {
      return null;
    }
  }, [
    passengerCount,
    pricePerPassengerMinor,
    serviceFeeMinor,
    taxesAndFeesMinor,
    discountMinor,
    amountPaidMinor,
    routeSummary,
  ]);

  function updateSegment(index: number, patch: Partial<EditableSegment>) {
    setSegments((current) =>
      current.map((seg, i) => (i === index ? { ...seg, ...patch } : seg)),
    );
  }

  function moveSegment(index: number, delta: number) {
    setSegments((current) => {
      const next = [...current];
      const target = index + delta;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target]!, next[index]!];
      return next;
    });
  }

  function handleParse() {
    const applied = applyParsedItinerary({
      rawItinerary,
      tripType,
      currentPrimaryAirline: primaryAirline,
    });
    // Parsed segments go into the SAME state the submit payload reads.
    setSegments(applied.segments);
    setParserNotes(applied.notes);
    if (applied.primaryAirlineCode) {
      setPrimaryAirline(applied.primaryAirlineCode);
    }
    setGuardError(null);
  }

  function switchRecipientSource(next: "linked_customer" | "manual") {
    setRecipientSource(next);
    if (next === "manual") {
      setCustomerId("");
      setBookingId("");
    }
  }

  const payload = useMemo(() => {
    const cleanText = (value: string) => {
      const trimmed = value.trim();
      return trimmed === "" ? null : trimmed;
    };
    const base = {
      documentType,
      includeItineraryDetail,
      paymentRequestNote: cleanText(paymentRequestNote),
      currency: "IDR",
      issueDate: null as string | null,
      dueDate: null as string | null,
      notes: null as string | null,
      paymentInstructions: null as string | null,
      terms: null as string | null,
      templateKey,
      primaryColor,
      secondaryColor,
      accentColor,
      ticketGroup: {
        pnrCode,
        passengerCount,
        tripType,
        primaryAirlineCode: normalizePrimaryAirlineInput(primaryAirline).code,
        departureDate: cleanText(departureDate),
        returnDate: cleanText(returnDate),
        rawItinerary: cleanText(rawItinerary),
        sortOrder: 0,
        segments: editableSegmentsToTicketPayload(segments),
      },
      pricing: {
        pricePerPassengerMinor,
        serviceFeeMinor,
        taxesAndFeesMinor,
        discountMinor,
        amountPaidMinor,
      },
    };

    const recipient =
      recipientSource === "manual"
        ? {
            recipientSource: "manual" as const,
            manualRecipientName: manualName,
            manualRecipientCompany: cleanText(manualCompany),
            manualRecipientPhone: cleanText(manualPhone),
            manualRecipientEmail: cleanText(manualEmail),
            manualRecipientAddress: cleanText(manualAddress),
            manualRecipientTaxId: cleanText(manualTaxId),
          }
        : {
            recipientSource: "linked_customer" as const,
            customerId,
            bookingId: cleanText(bookingId ?? ""),
          };

    const invoiceIdPart = initial?.invoiceId
      ? { invoiceId: initial.invoiceId }
      : {};

    return { ...base, ...recipient, ...invoiceIdPart };
  }, [
    documentType,
    includeItineraryDetail,
    paymentRequestNote,
    templateKey,
    primaryColor,
    secondaryColor,
    accentColor,
    pnrCode,
    passengerCount,
    tripType,
    primaryAirline,
    departureDate,
    returnDate,
    rawItinerary,
    segments,
    pricePerPassengerMinor,
    serviceFeeMinor,
    taxesAndFeesMinor,
    discountMinor,
    amountPaidMinor,
    recipientSource,
    manualName,
    manualCompany,
    manualPhone,
    manualEmail,
    manualAddress,
    manualTaxId,
    customerId,
    bookingId,
    initial?.invoiceId,
  ]);

  // Notes/instructions carried through hidden state (kept simple in v1).
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [paymentInstructions, setPaymentInstructions] = useState(
    initial?.paymentInstructions ?? "",
  );
  const [terms, setTerms] = useState(initial?.terms ?? "");
  const [issueDate, setIssueDate] = useState(initial?.issueDate ?? "");
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? "");

  const finalPayload = useMemo(() => {
    const cleanText = (value: string) => {
      const trimmed = value.trim();
      return trimmed === "" ? null : trimmed;
    };
    return {
      ...payload,
      issueDate: cleanText(issueDate),
      dueDate: cleanText(dueDate),
      notes: cleanText(notes),
      paymentInstructions: cleanText(paymentInstructions),
      terms: cleanText(terms),
    };
  }, [payload, issueDate, dueDate, notes, paymentInstructions, terms]);

  const guardMessageKey: Record<TicketingSaveGuardKey, string> = {
    parseFirst: "financeUi.errParseFirst",
    addSegment: "financeUi.errAddSegment",
    airlineInvalid: "financeUi.errAirlineInvalid",
    pnrRequired: "financeUi.errPnrRequired",
    paxMin: "financeUi.errPaxMin",
  };

  // Server messages are already friendly; if a raw Zod issue array ever slips
  // through, show the generic message instead of JSON.
  const safeErrorMessage =
    errorMessage && looksLikeRawZodIssues(errorMessage)
      ? tStrict("financeUi.errTicketingGeneric")
      : errorMessage;

  function handleSubmit(formData: FormData) {
    // Background parse: raw itinerary is the customer PDF source; segments stay
    // required for internal persistence. Auto-parse so users need not click
    // "Parse itinerary" before save when raw text is already present.
    const autoParsed = ensureSegmentsFromRawItinerary({
      rawItinerary,
      tripType,
      currentPrimaryAirline: primaryAirline,
      segments,
    });
    const workingSegments = autoParsed?.segments ?? segments;
    const workingAirline =
      autoParsed?.primaryAirlineCode ??
      normalizePrimaryAirlineInput(primaryAirline).code ??
      primaryAirline;

    if (autoParsed) {
      setSegments(autoParsed.segments);
      setParserNotes(autoParsed.notes);
      if (autoParsed.primaryAirlineCode) {
        setPrimaryAirline(autoParsed.primaryAirlineCode);
      }
    }

    const guard = ticketingSaveGuard({
      pnrCode,
      passengerCount,
      segmentCount: workingSegments.length,
      rawItinerary,
      primaryAirline: workingAirline,
    });
    if (guard) {
      setGuardError(guard);
      if (guard === "parseFirst" || guard === "addSegment") {
        itinerarySectionRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
      return;
    }
    setGuardError(null);

    // Rebuild payload with authoritative working segments (state may lag).
    const cleanText = (value: string) => {
      const trimmed = value.trim();
      return trimmed === "" ? null : trimmed;
    };
    const nextPayload = {
      ...finalPayload,
      ticketGroup: {
        ...finalPayload.ticketGroup,
        primaryAirlineCode: normalizePrimaryAirlineInput(workingAirline).code,
        segments: editableSegmentsToTicketPayload(workingSegments),
        rawItinerary: cleanText(rawItinerary),
      },
    };
    formData.set("payload_json", JSON.stringify(nextPayload));

    startTransition(() => {
      void action(formData);
    });
  }

  return (
    <form action={handleSubmit} className="space-y-8">
      {initial?.invoiceId ? (
        <input type="hidden" name="invoice_id" value={initial.invoiceId} />
      ) : null}
      <input
        type="hidden"
        name="payload_json"
        value={JSON.stringify(finalPayload)}
      />

      {safeErrorMessage ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {safeErrorMessage}
        </p>
      ) : null}
      {guardError ? (
        <p
          role="alert"
          className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800"
        >
          {tStrict(guardMessageKey[guardError])}
        </p>
      ) : null}

      <InvoiceTemplateBrandingFields
        templateKey={templateKey}
        primaryColor={primaryColor}
        secondaryColor={secondaryColor}
        accentColor={accentColor}
        workspaceDefaults={workspaceBrand}
        onChange={(next) => {
          setTemplateKey(next.templateKey);
          setPrimaryColor(next.primaryColor);
          setSecondaryColor(next.secondaryColor);
          setAccentColor(next.accentColor);
        }}
      />

      {/* Recipient */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold tracking-wide text-muted-foreground">
          {tStrict("financeUi.sectionCustomerBooking")}
        </h2>
        <div
          className="inline-flex rounded-lg border bg-muted/40 p-1"
          role="tablist"
        >
          <button
            type="button"
            role="tab"
            aria-selected={recipientSource === "linked_customer"}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              recipientSource === "linked_customer"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => switchRecipientSource("linked_customer")}
          >
            {tStrict("financeUi.recipientModeLinked")}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={recipientSource === "manual"}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              recipientSource === "manual"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => switchRecipientSource("manual")}
          >
            {tStrict("financeUi.recipientModeManual")}
          </button>
        </div>

        {recipientSource === "linked_customer" ? (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="customer_id">
                {tStrict("financeUi.selectCustomer")}
              </Label>
              <select
                id="customer_id"
                required
                value={customerId}
                onChange={(event) => setCustomerId(event.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">{tStrict("financeUi.selectCustomer")}</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.fullName}
                    {customer.phone ? ` · ${customer.phone}` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="booking_id">
                {tStrict("financeUi.selectBooking")}
              </Label>
              <select
                id="booking_id"
                value={bookingId ?? ""}
                onChange={(event) => setBookingId(event.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">{tStrict("financeUi.noBooking")}</option>
                {filteredBookings.map((booking) => (
                  <option key={booking.id} value={booking.id}>
                    {booking.bookingCode ?? booking.id.slice(0, 8)}
                    {booking.packageName ? ` · ${booking.packageName}` : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="manual_recipient_name">
                {tStrict("financeUi.manualRecipientName")} *
              </Label>
              <Input
                id="manual_recipient_name"
                required
                value={manualName}
                onChange={(event) => setManualName(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="manual_recipient_phone">
                {tStrict("financeUi.manualRecipientPhone")}
              </Label>
              <Input
                id="manual_recipient_phone"
                value={manualPhone}
                onChange={(event) => setManualPhone(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="manual_recipient_email">
                {tStrict("financeUi.manualRecipientEmail")}
              </Label>
              <Input
                id="manual_recipient_email"
                type="email"
                value={manualEmail}
                onChange={(event) => setManualEmail(event.target.value)}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="manual_recipient_company">
                {tStrict("financeUi.manualRecipientCompany")}
              </Label>
              <Input
                id="manual_recipient_company"
                value={manualCompany}
                onChange={(event) => setManualCompany(event.target.value)}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="manual_recipient_address">
                {tStrict("financeUi.manualRecipientAddress")}
              </Label>
              <textarea
                id="manual_recipient_address"
                rows={2}
                value={manualAddress}
                onChange={(event) => setManualAddress(event.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="manual_recipient_tax_id">
                {tStrict("financeUi.manualRecipientTaxId")}
              </Label>
              <Input
                id="manual_recipient_tax_id"
                value={manualTaxId}
                onChange={(event) => setManualTaxId(event.target.value)}
              />
            </div>
          </div>
        )}
      </section>

      {/* Document */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold tracking-wide text-muted-foreground">
          {tStrict("financeUi.sectionDates")}
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="document_type">
              {tStrict("financeUi.documentType")}
            </Label>
            <select
              id="document_type"
              value={documentType}
              onChange={(event) =>
                setDocumentType(event.target.value as "invoice" | "proforma")
              }
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="invoice">
                {tStrict("financeUi.documentInvoice")}
              </option>
              <option value="proforma">
                {tStrict("financeUi.documentProforma")}
              </option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="payment_request_note">
              {tStrict("financeUi.paymentRequestNote")}
            </Label>
            <Input
              id="payment_request_note"
              value={paymentRequestNote}
              onChange={(event) => setPaymentRequestNote(event.target.value)}
              placeholder={tStrict("financeUi.paymentRequestNoteHint")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="issue_date">{tStrict("financeUi.issueDate")}</Label>
            <Input
              id="issue_date"
              type="date"
              value={issueDate}
              onChange={(event) => setIssueDate(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="due_date">{tStrict("financeUi.dueDate")}</Label>
            <Input
              id="due_date"
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
            />
          </div>
        </div>
        <label className="flex items-start gap-3 rounded-lg border border-border/70 bg-muted/20 px-3 py-2.5 text-sm">
          <input
            type="checkbox"
            className="mt-1"
            checked={includeItineraryDetail}
            onChange={(event) => setIncludeItineraryDetail(event.target.checked)}
          />
          <span>
            <span className="font-medium text-foreground">
              {tStrict("financeUi.includeItineraryDetail")}
            </span>
            <span className="mt-0.5 block text-xs text-muted-foreground">
              {tStrict("financeUi.includeItineraryDetailHint")}
            </span>
          </span>
        </label>
      </section>

      {/* Ticket group */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold tracking-wide text-muted-foreground">
          {tStrict("financeUi.sectionTicketGroup")}
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="pnr">{tStrict("financeUi.pnr")} *</Label>
            <Input
              id="pnr"
              required
              value={pnrCode}
              onChange={(event) => setPnrCode(event.target.value.toUpperCase())}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="passenger_count">
              {tStrict("financeUi.passengerCount")} *
            </Label>
            <Input
              id="passenger_count"
              type="number"
              min={1}
              step={1}
              required
              value={passengerCount}
              onChange={(event) =>
                setPassengerCount(Math.max(1, Number(event.target.value) || 0))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="trip_type">{tStrict("financeUi.tripType")}</Label>
            <select
              id="trip_type"
              value={tripType}
              onChange={(event) =>
                setTripType(event.target.value as TicketTripType)
              }
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {TRIP_TYPES.map((value) => (
                <option key={value} value={value}>
                  {tStrict(
                    value === "one_way"
                      ? "financeUi.tripOneWay"
                      : value === "round_trip"
                        ? "financeUi.tripRoundTrip"
                        : "financeUi.tripMultiCity",
                  )}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="primary_airline">
              {tStrict("financeUi.primaryAirlineCode")}
            </Label>
            <Input
              id="primary_airline"
              value={primaryAirline}
              aria-invalid={!airlineInput.valid}
              aria-describedby="primary_airline_help"
              onChange={(event) =>
                setPrimaryAirline(event.target.value.toUpperCase())
              }
              onBlur={() => {
                if (airlineInput.valid && airlineInput.code) {
                  setPrimaryAirline(airlineInput.code);
                }
              }}
            />
            {!airlineInput.valid ? (
              <p className="text-xs text-rose-600">
                {tStrict("financeUi.errAirlineInvalid")}
              </p>
            ) : airlineInput.code ? (
              <p className="text-xs text-muted-foreground">
                {resolveAirlineName(airlineInput.code)}
              </p>
            ) : (
              <p id="primary_airline_help" className="text-xs text-muted-foreground">
                {tStrict("financeUi.airlineCodeExample")}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="departure_date">
              {tStrict("financeUi.departureDate")}
            </Label>
            <Input
              id="departure_date"
              type="date"
              value={departureDate}
              onChange={(event) => setDepartureDate(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="return_date">
              {tStrict("financeUi.returnDate")}
            </Label>
            <Input
              id="return_date"
              type="date"
              value={returnDate}
              onChange={(event) => setReturnDate(event.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Itinerary */}
      <section ref={itinerarySectionRef} className="scroll-mt-24 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold tracking-wide text-muted-foreground">
            {tStrict("financeUi.sectionItinerary")}
          </h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setSegments((cur) => [...cur, emptySegment()]);
              setGuardError(null);
            }}
          >
            {tStrict("financeUi.addSegment")}
          </Button>
        </div>

        <div className="space-y-2">
          <Label htmlFor="raw_itinerary">
            {tStrict("financeUi.rawItinerary")}
          </Label>
          <textarea
            id="raw_itinerary"
            rows={4}
            value={rawItinerary}
            onChange={(event) => setRawItinerary(event.target.value)}
            placeholder="1 ET 629U 02AUG S CGKADD GN17 2035 0600 03AUG"
            className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs"
          />
          <div className="flex items-center gap-3">
            <Button type="button" variant="outline" size="sm" onClick={handleParse}>
              {tStrict("financeUi.parseItinerary")}
            </Button>
            <p className="text-xs text-muted-foreground">
              {tStrict("financeUi.rawItineraryCustomerNote")}
            </p>
          </div>
          {parserNotes.length > 0 ? (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              <p className="font-medium">{tStrict("financeUi.parserNotes")}</p>
              <ul className="mt-1 list-disc pl-4">
                {parserNotes.map((note, index) => (
                  <li key={index}>{note}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        {guardError === "parseFirst" || guardError === "addSegment" ? (
          <p role="alert" className="text-sm font-medium text-rose-600">
            {tStrict(guardMessageKey[guardError])}
          </p>
        ) : null}
        {segments.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {tStrict("financeUi.noSegments")}
          </p>
        ) : (
          <div className="space-y-3">
            {segments.map((segment, index) => (
              <div
                key={index}
                className="grid gap-3 rounded-xl border bg-card/50 p-4 md:grid-cols-6"
              >
                <div className="space-y-1">
                  <Label>{tStrict("financeUi.segmentDirection")}</Label>
                  <select
                    value={segment.direction}
                    onChange={(event) =>
                      updateSegment(index, {
                        direction: event.target.value as FlightDirection,
                      })
                    }
                    className="flex h-10 w-full rounded-md border border-input bg-background px-2 text-sm"
                  >
                    {DIRECTIONS.map((dir) => (
                      <option key={dir} value={dir}>
                        {tStrict(
                          dir === "outbound"
                            ? "financeUi.directionOutbound"
                            : dir === "return"
                              ? "financeUi.directionReturn"
                              : "financeUi.directionOther",
                        )}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label>{tStrict("financeUi.airline")}</Label>
                  <Input
                    value={segment.airlineCode}
                    onChange={(event) =>
                      updateSegment(index, {
                        airlineCode: event.target.value.toUpperCase(),
                      })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label>{tStrict("financeUi.flightNumber")}</Label>
                  <Input
                    value={segment.flightNumber}
                    onChange={(event) =>
                      updateSegment(index, { flightNumber: event.target.value })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label>{tStrict("financeUi.bookingClass")}</Label>
                  <Input
                    value={segment.bookingClass}
                    onChange={(event) =>
                      updateSegment(index, {
                        bookingClass: event.target.value.toUpperCase(),
                      })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label>{tStrict("financeUi.segmentFrom")}</Label>
                  <Input
                    value={segment.departureAirport}
                    onChange={(event) =>
                      updateSegment(index, {
                        departureAirport: event.target.value.toUpperCase(),
                      })
                    }
                  />
                  {segment.departureAirport ? (
                    <p className="text-[11px] text-muted-foreground">
                      {resolveAirportDisplay(segment.departureAirport).primary}
                    </p>
                  ) : null}
                </div>
                <div className="space-y-1">
                  <Label>{tStrict("financeUi.segmentTo")}</Label>
                  <Input
                    value={segment.arrivalAirport}
                    onChange={(event) =>
                      updateSegment(index, {
                        arrivalAirport: event.target.value.toUpperCase(),
                      })
                    }
                  />
                  {segment.arrivalAirport ? (
                    <p className="text-[11px] text-muted-foreground">
                      {resolveAirportDisplay(segment.arrivalAirport).primary}
                    </p>
                  ) : null}
                </div>
                <div className="space-y-1">
                  <Label>{tStrict("financeUi.segmentDepDate")}</Label>
                  <Input
                    value={segment.departureLocalDate}
                    onChange={(event) =>
                      updateSegment(index, {
                        departureLocalDate: event.target.value.toUpperCase(),
                      })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label>{tStrict("financeUi.segmentDepTime")}</Label>
                  <Input
                    placeholder="HH:MM"
                    value={segment.departureLocalTime}
                    onChange={(event) =>
                      updateSegment(index, {
                        departureLocalTime: event.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label>{tStrict("financeUi.segmentArrDate")}</Label>
                  <Input
                    value={segment.arrivalLocalDate}
                    onChange={(event) =>
                      updateSegment(index, {
                        arrivalLocalDate: event.target.value.toUpperCase(),
                      })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label>{tStrict("financeUi.segmentArrTime")}</Label>
                  <Input
                    placeholder="HH:MM"
                    value={segment.arrivalLocalTime}
                    onChange={(event) =>
                      updateSegment(index, {
                        arrivalLocalTime: event.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label>{tStrict("financeUi.segmentDayOffset")}</Label>
                  <Input
                    type="number"
                    min={0}
                    step={1}
                    value={segment.arrivalDayOffset}
                    onChange={(event) =>
                      updateSegment(index, {
                        arrivalDayOffset: Math.max(
                          0,
                          Number(event.target.value) || 0,
                        ),
                      })
                    }
                  />
                </div>
                <div className="flex items-end gap-2 md:col-span-3">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={index === 0}
                    onClick={() => moveSegment(index, -1)}
                  >
                    {tStrict("financeUi.segmentMoveUp")}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={index === segments.length - 1}
                    onClick={() => moveSegment(index, 1)}
                  >
                    {tStrict("financeUi.segmentMoveDown")}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setSegments((cur) => cur.filter((_, i) => i !== index))
                    }
                  >
                    {tStrict("financeUi.removeSegment")}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
        {routeSummary ? (
          <p className="text-xs text-muted-foreground">
            {tStrict("financeUi.routeSummary")}: {routeSummary}
          </p>
        ) : null}
      </section>

      {/* Pricing */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold tracking-wide text-muted-foreground">
          {tStrict("financeUi.sectionPricing")}
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <Label>{tStrict("financeUi.pricePerPassenger")}</Label>
            <InvoiceMoneyInput
              aria-label={tStrict("financeUi.pricePerPassenger")}
              value={pricePerPassengerMinor}
              onValueChange={(next) => setPricePerPassengerMinor(next ?? 0)}
            />
          </div>
          <div className="space-y-2">
            <Label>{tStrict("financeUi.serviceFee")}</Label>
            <InvoiceMoneyInput
              aria-label={tStrict("financeUi.serviceFee")}
              value={serviceFeeMinor}
              onValueChange={(next) => setServiceFeeMinor(next ?? 0)}
            />
          </div>
          <div className="space-y-2">
            <Label>{tStrict("financeUi.taxesAndFees")}</Label>
            <InvoiceMoneyInput
              aria-label={tStrict("financeUi.taxesAndFees")}
              value={taxesAndFeesMinor}
              onValueChange={(next) => setTaxesAndFeesMinor(next ?? 0)}
            />
          </div>
          <div className="space-y-2">
            <Label>{tStrict("financeUi.ticketingDiscount")}</Label>
            <InvoiceMoneyInput
              aria-label={tStrict("financeUi.ticketingDiscount")}
              value={discountMinor}
              onValueChange={(next) => setDiscountMinor(next ?? 0)}
            />
          </div>
          <div className="space-y-2">
            <Label>{tStrict("financeUi.amountPaid")}</Label>
            <InvoiceMoneyInput
              aria-label={tStrict("financeUi.amountPaid")}
              value={amountPaidMinor}
              onValueChange={(next) => setAmountPaidMinor(next ?? 0)}
            />
          </div>
        </div>
      </section>

      {/* Notes */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold tracking-wide text-muted-foreground">
          {tStrict("financeUi.sectionNotes")}
        </h2>
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="notes">{tStrict("financeUi.notes")}</Label>
            <textarea
              id="notes"
              rows={2}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="payment_instructions">
              {tStrict("financeUi.paymentInstructions")}
            </Label>
            <textarea
              id="payment_instructions"
              rows={2}
              value={paymentInstructions}
              onChange={(event) => setPaymentInstructions(event.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="terms">{tStrict("financeUi.terms")}</Label>
            <textarea
              id="terms"
              rows={2}
              value={terms}
              onChange={(event) => setTerms(event.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
        </div>
      </section>

      {/* Totals preview */}
      <section className="space-y-3 rounded-2xl border bg-card/60 p-4">
        <h2 className="text-sm font-semibold tracking-wide text-muted-foreground">
          {tStrict("financeUi.sectionTotals")}
        </h2>
        <p className="text-xs text-muted-foreground">
          {tStrict("financeUi.previewOnly")}
        </p>
        {preview ? (
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div className="flex justify-between gap-4">
              <dt>{tStrict("financeUi.subtotal")}</dt>
              <dd className="font-medium">
                {formatMinorAsIdr(preview.subtotalMinor)}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>{tStrict("financeUi.ticketingDiscount")}</dt>
              <dd className="font-medium">
                {formatMinorAsIdr(preview.discountMinor)}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>{tStrict("financeUi.additionalFees")}</dt>
              <dd className="font-medium">
                {formatMinorAsIdr(preview.additionalFeesMinor)}
              </dd>
            </div>
            <div className="flex justify-between gap-4 sm:col-span-2">
              <dt className="font-semibold">{tStrict("financeUi.total")}</dt>
              <dd className="font-semibold">
                {formatMinorAsIdr(preview.totalMinor)}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>{tStrict("financeUi.paid")}</dt>
              <dd>{formatMinorAsIdr(preview.amountPaidMinor)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>{tStrict("financeUi.balance")}</dt>
              <dd>{formatMinorAsIdr(preview.balanceDueMinor)}</dd>
            </div>
          </dl>
        ) : (
          <p className="text-sm text-muted-foreground">—</p>
        )}
      </section>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={pending}>
          {tStrict("financeUi.saveDraft")}
        </Button>
        {initial?.invoiceId ? (
          <a
            href={`/api/finance/invoices/${initial.invoiceId}/pdf?preview=1`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-10 items-center rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent"
          >
            {tStrict("financeUi.previewInvoice")}
          </a>
        ) : (
          <p className="self-center text-sm text-muted-foreground">
            {tStrict("financeUi.previewAfterSave")}
          </p>
        )}
        {mode === "edit" && initial?.invoiceId ? (
          <Link
            href={`/finance/invoices/${initial.invoiceId}`}
            className="inline-flex h-10 items-center rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent"
          >
            {tStrict("financeUi.viewInvoice")}
          </Link>
        ) : null}
      </div>
    </form>
  );
}
