import React from "react";
import { View } from "@react-pdf/renderer";

import type { InvoicePdfData } from "@/modules/finance/pdf/invoice-pdf-types";
import { PDF_SPACE } from "@/modules/finance/pdf/invoice-pdf-theme";
import { PaymentInformation } from "@/modules/finance/pdf/shared/payment-information";
import { PaymentSummary } from "@/modules/finance/pdf/shared/payment-summary";

/**
 * Two-column payment + totals — sits directly under the item table
 * so short invoices stay balanced without artificial spacers.
 */
export function PaymentTotalsBlock({
  data,
  stacked = false,
}: {
  data: InvoicePdfData;
  /** Editorial / narrow content: stack payment above totals. */
  stacked?: boolean;
}) {
  if (stacked) {
    return (
      <View
        style={{ marginTop: PDF_SPACE.md }}
        data-payment-totals="stacked"
      >
        <PaymentSummary data={data} align="end" compact />
        <PaymentInformation data={data} compact />
      </View>
    );
  }

  return (
    <View
      wrap={false}
      style={{
        flexDirection: "row",
        gap: PDF_SPACE.lg,
        marginTop: PDF_SPACE.md,
        alignItems: "flex-start",
      }}
      data-payment-totals="two-column"
    >
      <View style={{ flex: 1, minWidth: 0 }}>
        <PaymentInformation data={data} compact />
      </View>
      <View style={{ width: 220, flexShrink: 0 }}>
        <PaymentSummary data={data} align="stretch" compact />
      </View>
    </View>
  );
}
