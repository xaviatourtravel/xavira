import React from "react";
import { Text, View } from "@react-pdf/renderer";

import { INVOICE_PDF_LABELS } from "@/modules/finance/pdf/invoice-pdf-labels";
import type { InvoicePdfData } from "@/modules/finance/pdf/invoice-pdf-types";
import {
  PAGE_MARGIN,
  PDF_LINE,
  PDF_SPACE,
  PDF_TYPE,
} from "@/modules/finance/pdf/invoice-pdf-theme";

function SectionTitle({
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
        letterSpacing: 0.8,
        marginBottom: PDF_SPACE.sm,
      }}
    >
      {label}
    </Text>
  );
}

function LabeledRow({
  label,
  value,
  muted,
  text,
  emphasize = false,
}: {
  label: string;
  value: string;
  muted: string;
  text: string;
  emphasize?: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-start",
        marginBottom: PDF_SPACE.xs + 1,
        gap: PDF_SPACE.sm,
      }}
    >
      <Text
        style={{
          width: 92,
          color: muted,
          fontSize: PDF_TYPE.caption,
          flexShrink: 0,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          flex: 1,
          color: text,
          fontSize: emphasize ? PDF_TYPE.accountNumber : PDF_TYPE.body,
          fontFamily: emphasize ? "Helvetica-Bold" : "Helvetica",
          letterSpacing: emphasize ? 0.35 : 0,
          lineHeight: PDF_LINE.tight,
        }}
      >
        {value}
      </Text>
    </View>
  );
}

/** Customer-facing payment details — labeled rows only, no internal metadata. */
export function PaymentInformation({
  data,
  compact = false,
}: {
  data: InvoicePdfData;
  compact?: boolean;
}) {
  const muted = data.theme.muted ?? data.theme.secondaryColor;
  const text = data.theme.text ?? "#0F172A";
  const accounts = data.company.paymentAccounts.filter((account) =>
    Boolean(
      account.bankName ||
        account.accountName ||
        account.accountHolder ||
        account.accountNumber ||
        account.bankCode ||
        account.swiftCode ||
        account.branch ||
        account.notes,
    ),
  );
  const hasInstructions = Boolean(data.paymentInstructions?.trim());
  if (accounts.length === 0 && !hasInstructions) return null;

  return (
    <View
      wrap={false}
      style={{ marginTop: compact ? 0 : PDF_SPACE.md }}
      data-payment-block="structured"
    >
      <SectionTitle
        label={INVOICE_PDF_LABELS.paymentInformation}
        muted={muted}
      />
      {accounts.map((account, index) => {
        const holder = account.accountHolder || account.accountName || null;
        const swift = account.swiftCode || account.bankCode || null;
        return (
          <View
            key={account.id ?? `${index}-${account.accountNumber ?? ""}`}
            style={{
              marginBottom: index < accounts.length - 1 ? PDF_SPACE.md : 0,
              paddingBottom: index < accounts.length - 1 ? PDF_SPACE.md : 0,
              borderBottomWidth: index < accounts.length - 1 ? 1 : 0,
              borderBottomColor: data.theme.divider ?? "#EEF2F7",
            }}
          >
            {account.bankName ? (
              <LabeledRow
                label={INVOICE_PDF_LABELS.bankLabel}
                value={account.bankName}
                muted={muted}
                text={text}
              />
            ) : null}
            {account.accountNumber ? (
              <LabeledRow
                label={INVOICE_PDF_LABELS.accountNumberLabel}
                value={account.accountNumber}
                muted={muted}
                text={text}
                emphasize
              />
            ) : null}
            {holder ? (
              <LabeledRow
                label={INVOICE_PDF_LABELS.accountHolderLabel}
                value={holder}
                muted={muted}
                text={text}
              />
            ) : null}
            {account.branch ? (
              <LabeledRow
                label={INVOICE_PDF_LABELS.branchLabel}
                value={account.branch}
                muted={muted}
                text={text}
              />
            ) : null}
            {swift ? (
              <LabeledRow
                label={INVOICE_PDF_LABELS.swiftLabel}
                value={swift}
                muted={muted}
                text={text}
              />
            ) : null}
            {account.notes ? (
              <LabeledRow
                label={INVOICE_PDF_LABELS.notesLabel}
                value={account.notes}
                muted={muted}
                text={text}
              />
            ) : null}
          </View>
        );
      })}
      {hasInstructions ? (
        <Text
          style={{
            marginTop: accounts.length ? PDF_SPACE.md : 0,
            fontSize: PDF_TYPE.body,
            color: muted,
            lineHeight: PDF_LINE.body,
          }}
        >
          {data.paymentInstructions}
        </Text>
      ) : null}
    </View>
  );
}

export function NotesAndTerms({ data }: { data: InvoicePdfData }) {
  const notes = data.notes?.trim();
  const terms = data.terms?.trim();
  const muted = data.theme.muted ?? data.theme.secondaryColor;
  const text = data.theme.text ?? "#0F172A";
  if (!notes && !terms) return null;

  return (
    <View style={{ marginTop: PDF_SPACE.lg }}>
      {notes ? (
        <View style={{ marginBottom: PDF_SPACE.md }} wrap={false}>
          <SectionTitle label={INVOICE_PDF_LABELS.notes} muted={muted} />
          <Text
            style={{
              fontSize: PDF_TYPE.body,
              lineHeight: PDF_LINE.body,
              color: text,
            }}
          >
            {notes}
          </Text>
        </View>
      ) : null}
      {terms ? (
        <View wrap={false}>
          <SectionTitle label={INVOICE_PDF_LABELS.terms} muted={muted} />
          <Text
            style={{
              fontSize: PDF_TYPE.body,
              lineHeight: PDF_LINE.body,
              color: text,
            }}
          >
            {terms}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

/** In-flow close — keeps thank-you visually connected on short invoices. */
export function InvoiceDocumentClose({ data }: { data: InvoicePdfData }) {
  const muted = data.theme.muted ?? data.theme.secondaryColor;
  const thankYou =
    data.company.footerText?.trim() || INVOICE_PDF_LABELS.thankYou;
  const contact = [data.company.email, data.company.phone, data.company.website]
    .filter(Boolean)
    .join("  ·  ");

  return (
    <View
      wrap={false}
      style={{
        marginTop: PDF_SPACE.xl,
        paddingTop: PDF_SPACE.md,
        borderTopWidth: 1,
        borderTopColor: data.theme.divider ?? "#EEF2F7",
      }}
      data-footer-connected="true"
    >
      <Text
        style={{
          fontSize: PDF_TYPE.caption,
          color: muted,
          marginBottom: PDF_SPACE.xs,
          lineHeight: PDF_LINE.tight,
        }}
      >
        {thankYou}
      </Text>
      <Text
        style={{
          fontSize: PDF_TYPE.caption,
          fontFamily: "Helvetica-Bold",
          color: muted,
        }}
      >
        {data.company.legalName}
      </Text>
      {contact ? (
        <Text
          style={{
            marginTop: 2,
            fontSize: PDF_TYPE.caption,
            color: "#94A3B8",
          }}
        >
          {contact}
        </Text>
      ) : null}
    </View>
  );
}

/** Stable page number — fixed per page, does not create empty middle space. */
export function InvoicePageNumber({
  data,
  leftInset,
}: {
  data: InvoicePdfData;
  leftInset?: number;
}) {
  const muted = data.theme.muted ?? data.theme.secondaryColor;
  const left = leftInset ?? PAGE_MARGIN;

  return (
    <Text
      fixed
      style={{
        position: "absolute",
        left,
        right: PAGE_MARGIN,
        bottom: 16,
        textAlign: "right",
        fontSize: PDF_TYPE.caption,
        color: muted,
      }}
      render={({ pageNumber, totalPages }) =>
        `${INVOICE_PDF_LABELS.page} ${pageNumber}${
          totalPages > 1 ? ` / ${totalPages}` : ""
        }`
      }
    />
  );
}

/** @deprecated Prefer InvoiceDocumentClose + InvoicePageNumber */
export function InvoiceFooter({ data }: { data: InvoicePdfData }) {
  return (
    <>
      <InvoiceDocumentClose data={data} />
      <InvoicePageNumber data={data} />
    </>
  );
}
