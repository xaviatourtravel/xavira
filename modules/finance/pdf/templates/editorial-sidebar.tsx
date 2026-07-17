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

/** Useful left sidebar on a soft tint — contact + payment summary, no empty color. */
export function EditorialSidebarTemplate({ data }: { data: InvoicePdfData }) {
  const styles = createInvoicePdfStyles(data.theme);
  const text = data.theme.text ?? "#0F172A";
  const muted = data.theme.muted ?? data.theme.secondaryColor;

  return (
    <Document title={data.invoiceNumber ?? "Invoice draft"}>
      <Page size="A4" style={styles.pageWithSidebar} wrap>
        {data.showDraftWatermark ? (
          <Text style={styles.watermark}>{INVOICE_PDF_LABELS.draftWatermark}</Text>
        ) : null}
        <View style={styles.sidebar} fixed>
          <CompanyHeader data={data} variant="sidebar" />
        </View>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            gap: PDF_SPACE.lg,
            marginBottom: PDF_SPACE.lg,
            alignItems: "flex-start",
          }}
        >
          <View style={{ flex: 1, paddingRight: PDF_SPACE.sm }}>
            <Text
              style={{
                fontSize: PDF_TYPE.documentTitle,
                fontFamily: "Helvetica-Bold",
                color: text,
                letterSpacing: -0.4,
              }}
            >
              {INVOICE_PDF_LABELS.invoice}
            </Text>
            <Text
              style={{
                marginTop: PDF_SPACE.xs,
                color: muted,
                fontSize: PDF_TYPE.caption,
              }}
            >
              {INVOICE_PDF_LABELS.boutiqueSubtitle}
            </Text>
          </View>
          <InvoiceMetaBlock data={data} showTitle={false} />
        </View>
        <RecipientBlock data={data} />
        <BookingBlock data={data} />
        <InvoiceItemsTable data={data} />
        <PaymentTotalsBlock data={data} stacked />
        <NotesAndTerms data={data} />
        <InvoiceDocumentClose data={data} />
        <InvoicePageNumber data={data} leftInset={128} />
      </Page>
    </Document>
  );
}
