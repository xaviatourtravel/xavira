import React from "react";
import { Document, Page, Text, View } from "@react-pdf/renderer";

import { INVOICE_PDF_LABELS } from "@/modules/finance/pdf/invoice-pdf-labels";
import type { InvoicePdfData } from "@/modules/finance/pdf/invoice-pdf-types";
import {
  createInvoicePdfStyles,
  PDF_SPACE,
  PDF_TYPE,
} from "@/modules/finance/pdf/invoice-pdf-theme";
import { BookingBlock } from "@/modules/finance/pdf/shared/booking-block";
import { CompanyHeader } from "@/modules/finance/pdf/shared/company-header";
import { InvoiceItemsTable } from "@/modules/finance/pdf/shared/invoice-items-table";
import {
  InvoiceDocumentClose,
  InvoicePageNumber,
  NotesAndTerms,
} from "@/modules/finance/pdf/shared/payment-information";
import { PaymentTotalsBlock } from "@/modules/finance/pdf/shared/payment-totals-block";
import {
  InvoiceMetaBlock,
  RecipientBlock,
} from "@/modules/finance/pdf/shared/recipient-block";

/** Quiet minimal finance document — typography-first, almost monochrome. */
export function CalmStandardTemplate({ data }: { data: InvoicePdfData }) {
  const styles = createInvoicePdfStyles(data.theme);
  const divider = data.theme.divider ?? "#E2E8F0";
  const text = data.theme.text ?? "#0F172A";

  return (
    <Document title={data.invoiceNumber ?? "Invoice draft"}>
      <Page size="A4" style={styles.page} wrap>
        {data.showDraftWatermark ? (
          <Text style={styles.watermark}>{INVOICE_PDF_LABELS.draftWatermark}</Text>
        ) : null}

        <CompanyHeader data={data} variant="compact" />

        <Text
          style={{
            marginTop: PDF_SPACE.xxl,
            fontSize: PDF_TYPE.documentTitle + 2,
            fontFamily: "Helvetica-Bold",
            color: text,
            letterSpacing: -0.5,
          }}
        >
          {INVOICE_PDF_LABELS.invoice}
        </Text>

        <View
          style={{
            marginTop: PDF_SPACE.lg,
            height: 1,
            backgroundColor: divider,
          }}
        />

        <View
          style={{
            flexDirection: "row",
            marginTop: PDF_SPACE.xl,
            gap: PDF_SPACE.xxl,
          }}
        >
          <RecipientBlock data={data} />
          <InvoiceMetaBlock data={data} showTitle={false} />
        </View>

        <BookingBlock data={data} />
        <InvoiceItemsTable data={data} />
        <PaymentTotalsBlock data={data} />
        <NotesAndTerms data={data} />
        <InvoiceDocumentClose data={data} />
        <InvoicePageNumber data={data} />
      </Page>
    </Document>
  );
}
