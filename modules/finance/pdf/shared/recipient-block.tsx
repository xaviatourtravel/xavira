import React from "react";
import { Text, View } from "@react-pdf/renderer";

import {
  formatInvoicePdfLifecycleStatus,
  INVOICE_PDF_LABELS,
} from "@/modules/finance/pdf/invoice-pdf-labels";
import type { InvoicePdfData } from "@/modules/finance/pdf/invoice-pdf-types";
import {
  formatPdfDate,
  PDF_LINE,
  PDF_SPACE,
  PDF_TYPE,
} from "@/modules/finance/pdf/invoice-pdf-theme";

function paymentBadgeColors(status: string): {
  backgroundColor: string;
  color: string;
} {
  switch (status) {
    case "paid":
      return { backgroundColor: "#ECFDF5", color: "#065F46" };
    case "partially_paid":
      return { backgroundColor: "#FFFBEB", color: "#92400E" };
    case "overdue":
      return { backgroundColor: "#FEF2F2", color: "#991B1B" };
    case "void":
      return { backgroundColor: "#F1F5F9", color: "#475569" };
    default:
      return { backgroundColor: "#F1F5F9", color: "#334155" };
  }
}

export function RecipientBlock({ data }: { data: InvoicePdfData }) {
  const { recipient, theme } = data;
  const muted = theme.muted ?? theme.secondaryColor;
  const text = theme.text ?? "#0F172A";
  const company = recipient.company?.trim() || null;
  const person = recipient.name?.trim() || null;

  return (
    <View style={{ flex: 1, minWidth: 0, paddingRight: PDF_SPACE.md }}>
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
        {INVOICE_PDF_LABELS.billTo}
      </Text>
      {company ? (
        <Text
          style={{
            fontFamily: "Helvetica-Bold",
            fontSize: 11,
            marginBottom: 2,
            color: text,
            lineHeight: PDF_LINE.tight,
          }}
        >
          {company}
        </Text>
      ) : null}
      {person && person !== company ? (
        <Text
          style={{
            fontFamily: company ? "Helvetica" : "Helvetica-Bold",
            fontSize: company ? PDF_TYPE.body : 11,
            marginBottom: 3,
            color: text,
          }}
        >
          {person}
        </Text>
      ) : null}
      {recipient.address ? (
        <Text
          style={{
            fontSize: PDF_TYPE.body,
            color: muted,
            lineHeight: PDF_LINE.body,
            marginBottom: 2,
          }}
        >
          {recipient.address}
        </Text>
      ) : null}
      {recipient.phone ? (
        <Text style={{ fontSize: PDF_TYPE.body, color: muted, marginTop: 1 }}>
          {recipient.phone}
        </Text>
      ) : null}
      {recipient.email ? (
        <Text style={{ fontSize: PDF_TYPE.body, color: muted }}>
          {recipient.email}
        </Text>
      ) : null}
      {recipient.taxId ? (
        <Text style={{ fontSize: PDF_TYPE.caption, color: muted, marginTop: 4 }}>
          NPWP: {recipient.taxId}
        </Text>
      ) : null}
    </View>
  );
}

export function StatusBadge({
  label,
  backgroundColor,
  color,
}: {
  label: string;
  backgroundColor: string;
  color: string;
}) {
  return (
    <View
      style={{
        alignSelf: "flex-start",
        backgroundColor,
        borderRadius: 999,
        paddingHorizontal: 8,
        paddingVertical: 3,
        marginTop: PDF_SPACE.sm,
      }}
    >
      <Text
        style={{
          color,
          fontSize: PDF_TYPE.caption,
          fontFamily: "Helvetica-Bold",
          letterSpacing: 0.2,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

/**
 * Invoice metadata — status shown once as a restrained pill
 * (not also as a metadata row). Empty due date is hidden.
 */
export function InvoiceMetaBlock({
  data,
  showTitle = true,
}: {
  data: InvoicePdfData;
  showTitle?: boolean;
}) {
  const { theme } = data;
  const muted = theme.muted ?? theme.secondaryColor;
  const text = theme.text ?? "#0F172A";
  const numberLabel =
    data.mode === "draft" || !data.invoiceNumber
      ? "DRAFT"
      : data.invoiceNumber;
  const lifecycleLabel =
    data.lifecycleStatusLabel ||
    formatInvoicePdfLifecycleStatus(data.lifecycleStatus);
  const badge =
    data.lifecycleStatus === "void"
      ? paymentBadgeColors("void")
      : paymentBadgeColors(data.paymentStatus);

  return (
    <View style={{ width: 196 }}>
      {showTitle ? (
        <Text
          style={{
            fontSize: PDF_TYPE.documentTitle,
            fontFamily: "Helvetica-Bold",
            color: text,
            letterSpacing: -0.4,
            marginBottom: PDF_SPACE.md,
          }}
        >
          {INVOICE_PDF_LABELS.invoice}
        </Text>
      ) : null}
      <MetaRow
        label={INVOICE_PDF_LABELS.number}
        value={numberLabel}
        muted={muted}
        text={text}
      />
      <MetaRow
        label={INVOICE_PDF_LABELS.issueDate}
        value={formatPdfDate(data.issueDate)}
        muted={muted}
        text={text}
      />
      {data.dueDate ? (
        <MetaRow
          label={INVOICE_PDF_LABELS.dueDate}
          value={formatPdfDate(data.dueDate)}
          muted={muted}
          text={text}
        />
      ) : null}
      <StatusBadge
        label={
          data.lifecycleStatus === "void"
            ? lifecycleLabel
            : data.paymentStatusLabel
        }
        backgroundColor={badge.backgroundColor}
        color={badge.color}
      />
    </View>
  );
}

function MetaRow({
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
        marginBottom: PDF_SPACE.xs + 1,
        gap: PDF_SPACE.sm,
      }}
    >
      <Text style={{ color: muted, fontSize: PDF_TYPE.caption, flexShrink: 1 }}>
        {label}
      </Text>
      <Text
        style={{
          fontFamily: "Helvetica-Bold",
          textAlign: "right",
          flexShrink: 1,
          fontSize: PDF_TYPE.metaValue,
          color: text,
        }}
      >
        {value}
      </Text>
    </View>
  );
}
