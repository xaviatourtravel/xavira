/**
 * Desklabs ticketing billing PDF (FIN-002G polish).
 *
 * Preserves the approved INV-XAVIA-2026-0015 information architecture.
 * Not a spreadsheet-heavy layout. Package templates are untouched.
 */

import React from "react";
import { Document, Page, Text, View } from "@react-pdf/renderer";

import {
  buildTicketingRawTransactionBlock,
  resolveTicketingBillItemName,
} from "@/modules/finance/lib/ticketing-raw-transaction";
import { INVOICE_PDF_LABELS } from "@/modules/finance/pdf/invoice-pdf-labels";
import type { InvoicePdfData } from "@/modules/finance/pdf/invoice-pdf-types";
import {
  createInvoicePdfStyles,
  formatPdfDate,
  formatPdfIdr,
  PDF_LINE,
  PDF_SPACE,
  PDF_TYPE,
} from "@/modules/finance/pdf/invoice-pdf-theme";
import { LogoMark } from "@/modules/finance/pdf/shared/company-header";
import { FlightItinerary } from "@/modules/finance/pdf/shared/flight-itinerary";
import {
  InvoiceDocumentClose,
  InvoicePageNumber,
  NotesAndTerms,
  PaymentInformation,
} from "@/modules/finance/pdf/shared/payment-information";

const TICKETING_SPACE = {
  section: 10,
  block: 8,
  tight: 3,
} as const;

function formatDueDate(value: string | null | undefined): string {
  if (!value?.trim()) return INVOICE_PDF_LABELS.dueDateUnset;
  return formatPdfDate(value);
}

function formatBillingDate(value: string | null | undefined): string {
  return formatDueDate(value);
}

function primaryBillItemName(data: InvoicePdfData): string {
  return resolveTicketingBillItemName({
    items: data.items,
    fallback: "Tiket Pesawat",
  });
}

function SectionHeading({
  label,
  muted,
}: {
  label: string;
  muted: string;
}) {
  return (
    <Text
      style={{
        fontSize: PDF_TYPE.sectionTitle,
        fontFamily: "Helvetica-Bold",
        color: muted,
        textTransform: "uppercase",
        letterSpacing: 0.7,
        marginBottom: TICKETING_SPACE.tight + 1,
      }}
    >
      {label}
    </Text>
  );
}

function CompanyHeader({ data }: { data: InvoicePdfData }) {
  const text = data.theme.text ?? "#0F172A";
  const muted = data.theme.muted ?? data.theme.secondaryColor;
  const contactLines = [
    data.company.phone,
    data.company.email,
    data.company.website,
  ].filter(Boolean);

  return (
    <View
      style={{
        flexDirection: "row",
        gap: PDF_SPACE.sm + 2,
        alignItems: "flex-start",
      }}
      data-ticketing-billing-header="true"
      data-desklabs-billing="true"
    >
      <LogoMark data={data} size={36} />
      <View style={{ flex: 1, minWidth: 0, paddingTop: 1 }}>
        <Text
          style={{
            fontFamily: "Helvetica-Bold",
            fontSize: PDF_TYPE.companyName,
            color: text,
            lineHeight: PDF_LINE.tight,
          }}
        >
          {data.company.legalName}
        </Text>
        {data.company.address ? (
          <Text
            style={{
              marginTop: 2,
              fontSize: PDF_TYPE.caption,
              color: muted,
              lineHeight: PDF_LINE.tight,
            }}
          >
            {data.company.address}
          </Text>
        ) : null}
        {contactLines.length > 0 ? (
          <Text
            style={{
              marginTop: 2,
              fontSize: PDF_TYPE.caption,
              color: muted,
              lineHeight: PDF_LINE.tight,
            }}
          >
            {contactLines.join("  ·  ")}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function InvoiceIdentity({ data }: { data: InvoicePdfData }) {
  const text = data.theme.text ?? "#0F172A";
  const muted = data.theme.muted ?? data.theme.secondaryColor;
  const brand = data.theme.primaryColor;
  const numberLabel =
    data.mode === "draft" || !data.invoiceNumber ? "DRAFT" : data.invoiceNumber;
  const statusLabel =
    data.lifecycleStatus === "void" ? "Dibatalkan" : data.paymentStatusLabel;

  return (
    <View
      wrap={false}
      style={{ marginTop: TICKETING_SPACE.section }}
      data-ticketing-invoice-identity="true"
    >
      <Text
        style={{
          fontFamily: "Helvetica-Bold",
          fontSize: 13,
          color: brand,
          letterSpacing: 0.35,
        }}
      >
        {data.documentTitle}
      </Text>
      <View
        style={{
          marginTop: PDF_SPACE.sm,
          flexDirection: "row",
          justifyContent: "space-between",
          gap: PDF_SPACE.md,
        }}
        data-invoice-metadata-row="true"
      >
        <MetaChip
          label={INVOICE_PDF_LABELS.number}
          value={numberLabel}
          muted={muted}
          text={text}
        />
        <MetaChip
          label={INVOICE_PDF_LABELS.issueDate}
          value={formatBillingDate(data.issueDate)}
          muted={muted}
          text={text}
        />
        <MetaChip
          label={INVOICE_PDF_LABELS.payment}
          value={statusLabel}
          muted={muted}
          text={text}
        />
      </View>
    </View>
  );
}

function MetaChip({
  label,
  value,
  muted,
  text,
}: {
  label: string;
  value: string;
  muted: string;
  text: string;
}) {
  return (
    <View style={{ flex: 1, minWidth: 0 }}>
      <Text
        style={{
          fontSize: 7,
          fontFamily: "Helvetica-Bold",
          color: muted,
          textTransform: "uppercase",
          letterSpacing: 0.4,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          marginTop: 2,
          fontFamily: "Helvetica-Bold",
          fontSize: PDF_TYPE.body,
          color: text,
        }}
      >
        {value}
      </Text>
    </View>
  );
}

function RecipientSection({ data }: { data: InvoicePdfData }) {
  const muted = data.theme.muted ?? data.theme.secondaryColor;
  const text = data.theme.text ?? "#0F172A";
  const { recipient } = data;
  const company = recipient.company?.trim() || null;
  const name = recipient.name?.trim() || null;
  const primary = company || name || "";
  const contactDistinct =
    company && name && name.toLowerCase() !== company.toLowerCase()
      ? name
      : null;

  return (
    <View
      style={{ marginTop: TICKETING_SPACE.section }}
      wrap={false}
      data-recipient-section="true"
    >
      <SectionHeading label={INVOICE_PDF_LABELS.billToHeading} muted={muted} />
      {primary ? (
        <Text
          style={{
            fontFamily: "Helvetica-Bold",
            fontSize: 10.5,
            color: text,
            lineHeight: PDF_LINE.tight,
          }}
          data-recipient-primary="true"
        >
          {primary}
        </Text>
      ) : null}
      {contactDistinct ? (
        <Text
          style={{
            marginTop: 2,
            fontSize: PDF_TYPE.body,
            color: text,
            lineHeight: PDF_LINE.tight,
          }}
          data-recipient-contact="true"
        >
          {contactDistinct}
        </Text>
      ) : null}
      {recipient.address?.trim() ? (
        <Text
          style={{
            marginTop: 2,
            fontSize: PDF_TYPE.caption,
            color: muted,
            lineHeight: PDF_LINE.tight,
          }}
        >
          {recipient.address.trim()}
        </Text>
      ) : null}
      {[recipient.phone, recipient.email].filter((value) => value?.trim())
        .length > 0 ? (
        <Text
          style={{
            marginTop: 2,
            fontSize: PDF_TYPE.caption,
            color: muted,
          }}
        >
          {[recipient.phone, recipient.email]
            .map((value) => value?.trim())
            .filter(Boolean)
            .join("  ·  ")}
        </Text>
      ) : null}
      {recipient.taxId?.trim() ? (
        <Text
          style={{
            marginTop: 2,
            fontSize: PDF_TYPE.caption,
            color: muted,
          }}
          data-recipient-tax-id="true"
        >
          NPWP: {recipient.taxId.trim()}
        </Text>
      ) : null}
    </View>
  );
}

function CurrentPaymentRequest({ data }: { data: InvoicePdfData }) {
  const muted = data.theme.muted ?? data.theme.secondaryColor;
  const text = data.theme.text ?? "#0F172A";
  const divider = data.theme.divider ?? "#E2E8F0";
  const headerFill = data.theme.tint || "#F8FAFC";
  const itemName = primaryBillItemName(data);

  return (
    <View
      wrap={false}
      style={{ marginTop: TICKETING_SPACE.section }}
      data-current-payment-request="true"
      data-payment-request-columns="5"
      data-payment-request-item="true"
    >
      <SectionHeading
        label={INVOICE_PDF_LABELS.currentPaymentRequest}
        muted={muted}
      />
      <View
        style={{
          borderWidth: 0.7,
          borderColor: divider,
          borderRadius: 2,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            backgroundColor: headerFill,
            borderBottomWidth: 0.7,
            borderBottomColor: divider,
            paddingVertical: 6,
            paddingHorizontal: 6,
            alignItems: "center",
          }}
        >
          <HeaderCell
            label={INVOICE_PDF_LABELS.billItemName}
            width="28%"
            muted={muted}
          />
          <HeaderCell
            label={INVOICE_PDF_LABELS.amountDueNow}
            width="22%"
            muted={muted}
            align="right"
          />
          <HeaderCell
            label={INVOICE_PDF_LABELS.issueDate}
            width="16%"
            muted={muted}
            align="center"
          />
          <HeaderCell
            label={INVOICE_PDF_LABELS.dueDate}
            width="16%"
            muted={muted}
            align="center"
          />
          <HeaderCell
            label={INVOICE_PDF_LABELS.paymentNote}
            width="18%"
            muted={muted}
          />
        </View>
        <View
          style={{
            flexDirection: "row",
            paddingVertical: 7,
            paddingHorizontal: 6,
            alignItems: "center",
          }}
        >
          <BodyCell value={itemName} width="28%" text={text} bold />
          <BodyCell
            value={formatPdfIdr(data.balanceDueMinor)}
            width="22%"
            text={text}
            bold
            align="right"
          />
          <BodyCell
            value={formatBillingDate(data.issueDate)}
            width="16%"
            text={text}
            align="center"
          />
          <BodyCell
            value={formatDueDate(data.dueDate)}
            width="16%"
            text={text}
            align="center"
          />
          <BodyCell value={data.paymentRequestNote} width="18%" text={text} />
        </View>
      </View>
    </View>
  );
}

function HeaderCell({
  label,
  width,
  muted,
  align = "left",
}: {
  label: string;
  width: `${number}%`;
  muted: string;
  align?: "left" | "right" | "center";
}) {
  return (
    <Text
      style={{
        width,
        paddingHorizontal: 3,
        fontSize: 6.5,
        fontFamily: "Helvetica-Bold",
        color: muted,
        textTransform: "uppercase",
        letterSpacing: 0.25,
        textAlign: align,
        lineHeight: 1.25,
      }}
    >
      {label}
    </Text>
  );
}

function BodyCell({
  value,
  width,
  text,
  bold = false,
  align = "left",
}: {
  value: string;
  width: `${number}%`;
  text: string;
  bold?: boolean;
  align?: "left" | "right" | "center";
}) {
  return (
    <Text
      style={{
        width,
        paddingHorizontal: 3,
        fontSize: PDF_TYPE.caption,
        fontFamily: bold ? "Helvetica-Bold" : "Helvetica",
        color: text,
        textAlign: align,
        lineHeight: 1.3,
      }}
    >
      {value}
    </Text>
  );
}

function TransactionSummary({ data }: { data: InvoicePdfData }) {
  if (!data.ticketing?.groups.length) return null;
  const muted = data.theme.muted ?? data.theme.secondaryColor;
  const text = data.theme.text ?? "#0F172A";
  const divider = data.theme.divider ?? "#E2E8F0";
  const group = data.ticketing.groups[0]!;
  const block = buildTicketingRawTransactionBlock(group);
  const pnrLabel =
    block.pnrCode.length > 0
      ? block.pnrCode
      : INVOICE_PDF_LABELS.pnrUnavailable;

  return (
    <View
      wrap={false}
      style={{ marginTop: TICKETING_SPACE.section, flex: 1, minWidth: 0 }}
      data-transaction-summary="raw"
      data-raw-itinerary="true"
      data-segment-count={String(group.segments.length)}
    >
      <SectionHeading
        label={INVOICE_PDF_LABELS.transactionSummary}
        muted={muted}
      />
      <View
        style={{
          borderWidth: 0.7,
          borderColor: divider,
          borderRadius: 2,
          paddingVertical: 6,
          paddingHorizontal: 8,
        }}
        data-raw-transaction-block="true"
      >
        <Text
          style={{
            fontSize: 7,
            fontFamily: "Helvetica-Bold",
            color: muted,
            textTransform: "uppercase",
            letterSpacing: 0.35,
          }}
          data-summary-line="pnr-label"
        >
          {INVOICE_PDF_LABELS.bookingPnrCode}
        </Text>
        <Text
          style={{
            marginTop: 2,
            fontSize: PDF_TYPE.body,
            fontFamily: "Helvetica-Bold",
            color: text,
            lineHeight: 1.3,
          }}
          data-summary-line="pnr"
        >
          {pnrLabel}
        </Text>

        {block.itineraryLines.length > 0 ? (
          <View
            style={{ marginTop: 6 }}
            data-raw-itinerary-lines="true"
            data-raw-line-count={String(block.itineraryLines.length)}
          >
            {block.itineraryLines.map((line, index) => (
              <Text
                key={`raw-line-${index}`}
                style={{
                  fontFamily: "Courier",
                  fontSize: 7.5,
                  color: text,
                  lineHeight: 1.35,
                  marginTop: index === 0 ? 0 : 1,
                }}
                data-raw-itinerary-line={String(index)}
              >
                {line.length > 0 ? line : " "}
              </Text>
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}

function FinancialSummary({ data }: { data: InvoicePdfData }) {
  const muted = data.theme.muted ?? data.theme.secondaryColor;
  const text = data.theme.text ?? "#0F172A";
  const divider = data.theme.divider ?? "#E2E8F0";
  const outstanding = data.balanceDueMinor;

  const optionalRows: Array<{ label: string; value: string }> = [];
  if (data.discountMinor > 0) {
    optionalRows.push({
      label: INVOICE_PDF_LABELS.discount,
      value: formatPdfIdr(data.discountMinor),
    });
  }
  if (data.additionalFeesMinor > 0) {
    optionalRows.push({
      label: INVOICE_PDF_LABELS.additionalFees,
      value: formatPdfIdr(data.additionalFeesMinor),
    });
  }

  return (
    <View
      wrap={false}
      style={{
        marginTop: TICKETING_SPACE.section,
        width: 210,
        marginLeft: PDF_SPACE.md,
        flexShrink: 0,
      }}
      data-financial-summary="true"
      data-financial-summary-style="right-aligned"
      data-optional-zero-rows-hidden="true"
    >
      <SectionHeading
        label={INVOICE_PDF_LABELS.financialSummary}
        muted={muted}
      />
      <SummaryLine
        label={INVOICE_PDF_LABELS.totalBill}
        value={formatPdfIdr(data.totalMinor)}
        muted={muted}
        text={text}
      />
      <SummaryLine
        label={INVOICE_PDF_LABELS.paymentsReceived}
        value={formatPdfIdr(data.amountPaidMinor)}
        muted={muted}
        text={text}
      />
      {optionalRows.map((row) => (
        <SummaryLine
          key={row.label}
          label={row.label}
          value={row.value}
          muted={muted}
          text={text}
        />
      ))}
      <View
        style={{
          marginTop: PDF_SPACE.sm,
          paddingTop: PDF_SPACE.sm,
          borderTopWidth: 1,
          borderTopColor: divider,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-end",
          gap: PDF_SPACE.sm,
        }}
        data-amount-outstanding="strong"
      >
        <Text
          style={{
            fontFamily: "Helvetica-Bold",
            fontSize: 7,
            color: muted,
            textTransform: "uppercase",
            letterSpacing: 0.35,
            flex: 1,
          }}
        >
          {INVOICE_PDF_LABELS.amountOutstanding}
        </Text>
        <Text
          style={{
            fontFamily: "Helvetica-Bold",
            fontSize: 12,
            color: outstanding > 0 ? data.theme.primaryColor : text,
            textAlign: "right",
          }}
        >
          {formatPdfIdr(outstanding)}
        </Text>
      </View>
    </View>
  );
}

function SummaryLine({
  label,
  value,
  muted,
  text,
}: {
  label: string;
  value: string;
  muted: string;
  text: string;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 4,
        gap: PDF_SPACE.sm,
      }}
      data-financial-summary-row="true"
    >
      <Text style={{ fontSize: PDF_TYPE.caption, color: muted, flex: 1 }}>
        {label}
      </Text>
      <Text
        style={{
          fontSize: PDF_TYPE.caption,
          color: text,
          textAlign: "right",
          minWidth: 88,
        }}
      >
        {value}
      </Text>
    </View>
  );
}

function PaymentHistory({ data }: { data: InvoicePdfData }) {
  if (!data.payments.length) return null;
  const muted = data.theme.muted ?? data.theme.secondaryColor;
  const text = data.theme.text ?? "#0F172A";
  const divider = data.theme.divider ?? "#E2E8F0";

  return (
    <View
      wrap={false}
      style={{ marginTop: TICKETING_SPACE.section }}
      data-payment-history="true"
      data-payment-history-columns="6"
    >
      <SectionHeading label={INVOICE_PDF_LABELS.paymentHistory} muted={muted} />
      <View
        style={{
          flexDirection: "row",
          borderBottomWidth: 0.7,
          borderBottomColor: divider,
          paddingBottom: 4,
          marginBottom: 3,
        }}
      >
        <HeaderCell label={INVOICE_PDF_LABELS.paymentCode} width="14%" muted={muted} />
        <HeaderCell
          label={INVOICE_PDF_LABELS.amountDueNow}
          width="18%"
          muted={muted}
          align="right"
        />
        <HeaderCell label={INVOICE_PDF_LABELS.paymentDate} width="16%" muted={muted} />
        <HeaderCell label={INVOICE_PDF_LABELS.paymentMethod} width="18%" muted={muted} />
        <HeaderCell label={INVOICE_PDF_LABELS.paymentStatusCol} width="14%" muted={muted} />
        <HeaderCell
          label={INVOICE_PDF_LABELS.paymentHistoryNote}
          width="20%"
          muted={muted}
        />
      </View>
      {data.payments.map((payment) => {
        const method =
          [payment.paymentMethod, payment.bankName, payment.accountNumberMasked]
            .filter(Boolean)
            .join(" · ") || "—";
        const paidDate = formatPdfDate(payment.paidAt.slice(0, 10));
        return (
          <View
            key={payment.paymentCode}
            style={{
              flexDirection: "row",
              paddingVertical: 4,
              borderBottomWidth: 0.5,
              borderBottomColor: divider,
              alignItems: "center",
            }}
            data-payment-status={payment.status}
          >
            <BodyCell value={payment.paymentCode} width="14%" text={text} bold />
            <BodyCell
              value={formatPdfIdr(payment.amountMinor)}
              width="18%"
              text={text}
              align="right"
            />
            <BodyCell value={paidDate} width="16%" text={text} />
            <BodyCell value={method} width="18%" text={text} />
            <BodyCell value={payment.statusLabel} width="14%" text={text} />
            <BodyCell
              value={payment.note?.trim() || "—"}
              width="20%"
              text={text}
            />
          </View>
        );
      })}
    </View>
  );
}

/**
 * Polished Desklabs billing-first ticketing invoice.
 * Default: concise summary, no per-segment itinerary.
 */
export function TicketingTemplate({ data }: { data: InvoicePdfData }) {
  const styles = createInvoicePdfStyles(data.theme);
  const includeItinerary = data.documentOptions.includeItineraryDetail === true;

  return (
    <Document title={data.invoiceNumber ?? data.documentTitle}>
      <Page
        size="A4"
        style={{
          ...styles.page,
          paddingTop: 36,
          paddingBottom: 40,
          paddingHorizontal: 40,
        }}
        wrap
      >
        {data.showDraftWatermark ? (
          <Text style={styles.watermark}>{INVOICE_PDF_LABELS.draftWatermark}</Text>
        ) : null}

        <CompanyHeader data={data} />
        <InvoiceIdentity data={data} />
        <RecipientSection data={data} />
        <CurrentPaymentRequest data={data} />

        <View
          wrap={false}
          style={{
            marginTop: 0,
            flexDirection: "row",
            alignItems: "flex-start",
            justifyContent: "space-between",
          }}
          data-summary-financial-row="true"
        >
          <TransactionSummary data={data} />
          <FinancialSummary data={data} />
        </View>

        <PaymentHistory data={data} />

        <View
          wrap={false}
          style={{ marginTop: TICKETING_SPACE.block }}
          data-payment-accounts-block="true"
          data-payment-accounts-style="labeled-rows"
        >
          <PaymentInformation data={data} compact />
        </View>

        <NotesAndTerms data={data} />

        {includeItinerary ? (
          <View
            style={{ marginTop: TICKETING_SPACE.section }}
            data-optional-itinerary-detail="true"
          >
            <FlightItinerary data={data} />
          </View>
        ) : (
          <View data-optional-itinerary-detail="false" />
        )}

        <View style={{ marginTop: 0 }}>
          <InvoiceDocumentClose data={data} compact />
        </View>
        <InvoicePageNumber data={data} />
      </Page>
    </Document>
  );
}
