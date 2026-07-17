import React from "react";
import { Document, Page, Text, View } from "@react-pdf/renderer";

import { INVOICE_PDF_LABELS } from "@/modules/finance/pdf/invoice-pdf-labels";
import type { InvoicePdfData } from "@/modules/finance/pdf/invoice-pdf-types";
import {
  createInvoicePdfStyles,
  PAGE_MARGIN,
  PDF_SPACE,
  PDF_TYPE,
} from "@/modules/finance/pdf/invoice-pdf-theme";
import { BookingBlock } from "@/modules/finance/pdf/shared/booking-block";
import { LogoMark } from "@/modules/finance/pdf/shared/company-header";
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

/**
 * Structured branded header for denser B2B invoices —
 * formal enterprise: white header, thin brand rule, balanced
 * two-column payment/totals. No decorative shapes.
 */
export function CorporateTemplate({ data }: { data: InvoicePdfData }) {
  const styles = createInvoicePdfStyles(data.theme);
  const muted = data.theme.muted ?? data.theme.secondaryColor;
  const text = data.theme.text ?? "#0F172A";
  const divider = data.theme.divider ?? "#E2E8F0";

  return (
    <Document title={data.invoiceNumber ?? "Invoice draft"}>
      <Page size="A4" style={styles.page} wrap>
        {data.showDraftWatermark ? (
          <Text style={styles.watermark}>{INVOICE_PDF_LABELS.draftWatermark}</Text>
        ) : null}

        {/* Restrained top brand accent — thin line only */}
        <View
          style={{
            height: 2.5,
            backgroundColor: data.theme.primaryColor,
            marginHorizontal: -PAGE_MARGIN,
            marginTop: -PAGE_MARGIN,
            marginBottom: PDF_SPACE.xl,
          }}
        />

        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: PDF_SPACE.xl,
            marginBottom: PDF_SPACE.xl,
          }}
        >
          <View
            style={{
              flex: 1,
              flexDirection: "row",
              gap: PDF_SPACE.md,
              alignItems: "center",
            }}
          >
            <LogoMark data={data} size={46} />
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontFamily: "Helvetica-Bold",
                  fontSize: PDF_TYPE.companyName + 1,
                  color: text,
                  letterSpacing: -0.2,
                }}
              >
                {data.company.legalName}
              </Text>
              <Text
                style={{
                  marginTop: 4,
                  fontSize: PDF_TYPE.caption,
                  color: muted,
                  lineHeight: 1.4,
                }}
              >
                {[data.company.address, data.company.phone, data.company.email]
                  .filter(Boolean)
                  .join("  ·  ")}
              </Text>
              {data.company.taxId ? (
                <Text
                  style={{
                    marginTop: 3,
                    fontSize: PDF_TYPE.caption,
                    color: muted,
                  }}
                >
                  NPWP: {data.company.taxId}
                </Text>
              ) : null}
            </View>
          </View>
          <InvoiceMetaBlock data={data} />
        </View>

        <View
          style={{
            height: 1,
            backgroundColor: divider,
            marginBottom: PDF_SPACE.lg,
          }}
        />

        <View style={{ flexDirection: "row", gap: PDF_SPACE.xl }}>
          <RecipientBlock data={data} />
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
