import React from "react";
import { Text } from "@react-pdf/renderer";

import {
  invoicePdfVisibleHeading,
  isFin005ProformaPdf,
  neverHyphenatePdfWord,
  PROFORMA_PDF_HEADING_SIZE,
} from "@/modules/finance/pdf/invoice-pdf-labels";
import type { InvoicePdfData } from "@/modules/finance/pdf/invoice-pdf-types";

/**
 * Customer-facing document title.
 * FIN-005 Proforma: one unhyphenated line sized for the existing meta column.
 * Official Invoice: unchanged template sizes.
 */
export function DocumentHeading({
  data,
  color,
  invoiceFontSize,
  letterSpacing,
  style,
}: {
  data: InvoicePdfData;
  color: string;
  invoiceFontSize: number;
  letterSpacing?: number;
  style?: Record<string, unknown>;
}) {
  const proforma = isFin005ProformaPdf(data);

  return (
    <Text
      wrap={!proforma}
      hyphenationCallback={proforma ? neverHyphenatePdfWord : undefined}
      style={{
        fontSize: proforma ? PROFORMA_PDF_HEADING_SIZE : invoiceFontSize,
        fontFamily: "Helvetica-Bold",
        color,
        letterSpacing: proforma ? -0.25 : (letterSpacing ?? -0.4),
        ...style,
      }}
    >
      {invoicePdfVisibleHeading(data)}
    </Text>
  );
}
