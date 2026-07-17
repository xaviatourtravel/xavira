import React from "react";
import { Text, View } from "@react-pdf/renderer";

import { INVOICE_PDF_LABELS } from "@/modules/finance/pdf/invoice-pdf-labels";
import type { InvoicePdfData } from "@/modules/finance/pdf/invoice-pdf-types";
import {
  formatPdfIdr,
  PDF_SPACE,
  PDF_TYPE,
} from "@/modules/finance/pdf/invoice-pdf-theme";

/**
 * Amount-due hierarchy:
 * Subtotal → Diskon → Pajak → Biaya → Total → Sudah dibayar → Sisa pembayaran
 */
export function PaymentSummary({
  data,
  align = "end",
  compact = false,
}: {
  data: InvoicePdfData;
  align?: "end" | "stretch";
  compact?: boolean;
}) {
  const muted = data.theme.muted ?? data.theme.secondaryColor;
  const text = data.theme.text ?? "#0F172A";
  const tint = data.theme.tint ?? "#F8FAFC";
  const divider = data.theme.divider ?? "#E2E8F0";
  const balanceIsStrong = data.balanceDueMinor > 0;
  const showAmountPaid =
    data.amountPaidMinor > 0 || data.balanceDueMinor === 0;

  return (
    <View
      wrap={false}
      style={{
        marginTop: compact ? 0 : PDF_SPACE.md,
        marginLeft: align === "end" ? "auto" : 0,
        width: align === "end" ? 220 : "100%",
      }}
      data-totals-hierarchy="true"
    >
      <SummaryRow
        label={INVOICE_PDF_LABELS.subtotal}
        value={formatPdfIdr(data.subtotalMinor)}
        muted={muted}
        text={text}
      />
      {data.discountMinor > 0 ? (
        <SummaryRow
          label={INVOICE_PDF_LABELS.discount}
          value={formatPdfIdr(data.discountMinor)}
          muted={muted}
          text={text}
        />
      ) : null}
      {data.taxMinor > 0 ? (
        <SummaryRow
          label={
            data.taxRateBps > 0
              ? `${INVOICE_PDF_LABELS.tax} (${(data.taxRateBps / 100).toFixed(2)}%)`
              : INVOICE_PDF_LABELS.tax
          }
          value={formatPdfIdr(data.taxMinor)}
          muted={muted}
          text={text}
        />
      ) : null}
      {data.additionalFeesMinor > 0 ? (
        <SummaryRow
          label={INVOICE_PDF_LABELS.additionalFees}
          value={formatPdfIdr(data.additionalFeesMinor)}
          muted={muted}
          text={text}
        />
      ) : null}

      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: PDF_SPACE.sm,
          paddingTop: PDF_SPACE.sm,
          borderTopWidth: 1,
          borderTopColor: divider,
        }}
      >
        <Text
          style={{
            fontFamily: "Helvetica-Bold",
            fontSize: PDF_TYPE.body,
            color: text,
          }}
        >
          {INVOICE_PDF_LABELS.total}
        </Text>
        <Text
          style={{
            fontFamily: "Helvetica-Bold",
            fontSize: PDF_TYPE.amountStrong,
            color: text,
          }}
        >
          {formatPdfIdr(data.totalMinor)}
        </Text>
      </View>

      {showAmountPaid ? (
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginTop: PDF_SPACE.sm,
          }}
        >
          <Text style={{ color: muted, fontSize: PDF_TYPE.body }}>
            {INVOICE_PDF_LABELS.amountPaid}
          </Text>
          <Text style={{ fontSize: PDF_TYPE.body, color: text }}>
            {formatPdfIdr(data.amountPaidMinor)}
          </Text>
        </View>
      ) : null}

      <View
        style={{
          marginTop: PDF_SPACE.sm,
          backgroundColor: tint,
          borderWidth: 1,
          borderColor: divider,
          borderRadius: 3,
          paddingVertical: PDF_SPACE.md,
          paddingHorizontal: PDF_SPACE.md,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-end",
          }}
        >
          <Text
            style={{
              fontFamily: "Helvetica-Bold",
              fontSize: PDF_TYPE.caption,
              letterSpacing: 0.5,
              textTransform: "uppercase",
              color: muted,
            }}
          >
            {INVOICE_PDF_LABELS.balanceDue}
          </Text>
          <Text
            style={{
              fontFamily: "Helvetica-Bold",
              fontSize: balanceIsStrong
                ? PDF_TYPE.amountEmphasis
                : PDF_TYPE.amountStrong,
              color: balanceIsStrong ? data.theme.primaryColor : text,
            }}
          >
            {formatPdfIdr(data.balanceDueMinor)}
          </Text>
        </View>
      </View>
    </View>
  );
}

function SummaryRow({
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
        marginBottom: PDF_SPACE.xs,
      }}
    >
      <Text style={{ color: muted, fontSize: PDF_TYPE.body }}>{label}</Text>
      <Text style={{ fontSize: PDF_TYPE.body, color: text }}>{value}</Text>
    </View>
  );
}
