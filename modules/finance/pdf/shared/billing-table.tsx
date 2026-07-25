/**
 * Spreadsheet-style PDF table primitives for ticketing billing documents.
 * Thin borders, light gray headers, aligned columns — no cards.
 */

import React from "react";
import { Text, View } from "@react-pdf/renderer";

import type { InvoicePdfTheme } from "@/modules/finance/pdf/invoice-pdf-types";

export const BILLING_TABLE = {
  border: "#D0D5DD",
  headerFill: "#F2F4F7",
  text: "#101828",
  muted: "#475467",
  sectionGap: 10,
  cellPadV: 4,
  cellPadH: 5,
  fontSize: 8,
  headerFontSize: 7,
  titleFontSize: 8,
  amountFontSize: 8,
} as const;

type Align = "left" | "right" | "center";

export function BillingSectionTitle({
  label,
  theme,
  accent = false,
}: {
  label: string;
  theme: InvoicePdfTheme;
  accent?: boolean;
}) {
  const color = accent
    ? theme.primaryColor
    : theme.muted ?? BILLING_TABLE.muted;

  return (
    <Text
      style={{
        fontSize: BILLING_TABLE.titleFontSize,
        fontFamily: "Helvetica-Bold",
        color,
        textTransform: "uppercase",
        letterSpacing: 0.5,
        marginBottom: 4,
      }}
      data-billing-section-title="true"
    >
      {label}
    </Text>
  );
}

export function BillingTable({
  children,
  wrap = false,
}: {
  children: React.ReactNode;
  wrap?: boolean;
}) {
  return (
    <View
      wrap={wrap}
      style={{
        borderWidth: 0.6,
        borderColor: BILLING_TABLE.border,
      }}
      data-billing-table="true"
    >
      {children}
    </View>
  );
}

export function BillingTableHeader({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        backgroundColor: BILLING_TABLE.headerFill,
        borderBottomWidth: 0.6,
        borderBottomColor: BILLING_TABLE.border,
        paddingVertical: BILLING_TABLE.cellPadV,
        paddingHorizontal: 0,
        alignItems: "center",
      }}
      data-billing-table-header="true"
    >
      {children}
    </View>
  );
}

export function BillingTableRow({
  children,
  last = false,
  wrap = false,
  paymentStatus,
}: {
  children: React.ReactNode;
  last?: boolean;
  wrap?: boolean;
  /** Optional payment-history status for structural tests. */
  paymentStatus?: string;
}) {
  return (
    <View
      wrap={wrap}
      style={{
        flexDirection: "row",
        borderBottomWidth: last ? 0 : 0.5,
        borderBottomColor: BILLING_TABLE.border,
        paddingVertical: BILLING_TABLE.cellPadV,
        alignItems: "flex-start",
      }}
      data-billing-table-row="true"
      data-payment-status={paymentStatus}
    >
      {children}
    </View>
  );
}

export function BillingCell({
  value,
  width,
  align = "left",
  bold = false,
  muted = false,
  header = false,
}: {
  value: string;
  width: `${number}%` | number;
  align?: Align;
  bold?: boolean;
  muted?: boolean;
  header?: boolean;
}) {
  return (
    <Text
      style={{
        width,
        paddingHorizontal: BILLING_TABLE.cellPadH,
        fontSize: header
          ? BILLING_TABLE.headerFontSize
          : BILLING_TABLE.fontSize,
        fontFamily: bold || header ? "Helvetica-Bold" : "Helvetica",
        color: muted || header ? BILLING_TABLE.muted : BILLING_TABLE.text,
        textAlign: align,
        textTransform: header ? "uppercase" : undefined,
        letterSpacing: header ? 0.2 : 0,
        lineHeight: 1.25,
      }}
      data-billing-cell={header ? "header" : "body"}
    >
      {value}
    </Text>
  );
}

export function BillingAmountCell({
  value,
  width,
  bold = false,
  header = false,
}: {
  value: string;
  width: `${number}%` | number;
  bold?: boolean;
  header?: boolean;
}) {
  return (
    <BillingCell
      value={value}
      width={width}
      align="right"
      bold={bold}
      header={header}
    />
  );
}

export function BillingLabelValueTable({
  rows,
  wrap = false,
}: {
  rows: Array<{
    label: string;
    value: string;
    bold?: boolean;
    emphasize?: boolean;
    topBorder?: boolean;
  }>;
  wrap?: boolean;
}) {
  return (
    <View
      wrap={wrap}
      style={{
        borderWidth: 0.6,
        borderColor: BILLING_TABLE.border,
      }}
      data-billing-label-value-table="true"
    >
      {rows.map((row, index) => (
        <View
          key={`${row.label}-${index}`}
          style={{
            flexDirection: "row",
            borderTopWidth: row.topBorder ? 0.8 : index === 0 ? 0 : 0.5,
            borderTopColor: BILLING_TABLE.border,
            paddingVertical: row.emphasize
              ? BILLING_TABLE.cellPadV + 1
              : BILLING_TABLE.cellPadV,
            backgroundColor: row.emphasize
              ? BILLING_TABLE.headerFill
              : undefined,
            alignItems: "center",
          }}
          data-billing-label-value-row={row.emphasize ? "emphasize" : "normal"}
        >
          <Text
            style={{
              width: "55%",
              paddingHorizontal: BILLING_TABLE.cellPadH,
              fontSize: BILLING_TABLE.fontSize,
              fontFamily: row.bold || row.emphasize ? "Helvetica-Bold" : "Helvetica",
              color: BILLING_TABLE.text,
            }}
          >
            {row.label}
          </Text>
          <Text
            style={{
              width: "45%",
              paddingHorizontal: BILLING_TABLE.cellPadH,
              fontSize: row.emphasize
                ? BILLING_TABLE.amountFontSize + 1
                : BILLING_TABLE.fontSize,
              fontFamily:
                row.bold || row.emphasize ? "Helvetica-Bold" : "Helvetica",
              color: BILLING_TABLE.text,
              textAlign: "right",
            }}
          >
            {row.value}
          </Text>
        </View>
      ))}
    </View>
  );
}
