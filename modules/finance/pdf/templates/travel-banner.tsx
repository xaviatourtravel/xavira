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
 * Full-width branded travel banner — muted tint, route/waypoint motif.
 * Premium travel brand document, not a tour brochure.
 */
export function TravelBannerTemplate({ data }: { data: InvoicePdfData }) {
  const styles = createInvoicePdfStyles(data.theme);
  const subtitle =
    data.company.tagline?.trim() ||
    data.company.footerText?.trim() ||
    INVOICE_PDF_LABELS.travelSubtitle;
  const bannerBg = data.theme.tint;
  const brand = data.theme.primaryColor;
  const text = data.theme.text ?? "#0F172A";
  const muted = data.theme.muted ?? data.theme.secondaryColor;
  const numberLabel =
    data.mode === "draft" || !data.invoiceNumber
      ? "DRAFT"
      : data.invoiceNumber;

  return (
    <Document title={data.invoiceNumber ?? "Invoice draft"}>
      <Page size="A4" style={{ ...styles.page, paddingTop: 0 }} wrap>
        {data.showDraftWatermark ? (
          <Text style={styles.watermark}>{INVOICE_PDF_LABELS.draftWatermark}</Text>
        ) : null}

        <View
          style={{
            backgroundColor: bannerBg,
            borderBottomWidth: 1.5,
            borderBottomColor: brand,
            paddingTop: PDF_SPACE.xl,
            paddingBottom: PDF_SPACE.lg,
            paddingHorizontal: PAGE_MARGIN,
            marginHorizontal: -PAGE_MARGIN,
            marginBottom: PDF_SPACE.xl,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: PDF_SPACE.md,
            }}
          >
            <View
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                gap: PDF_SPACE.md,
              }}
            >
              <LogoMark data={data} size={42} />
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontFamily: "Helvetica-Bold",
                    fontSize: 15,
                    color: text,
                    letterSpacing: -0.2,
                  }}
                >
                  {data.company.legalName}
                </Text>
                <Text
                  style={{
                    marginTop: 3,
                    color: muted,
                    fontSize: PDF_TYPE.caption,
                  }}
                >
                  {subtitle}
                </Text>
              </View>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text
                style={{
                  fontSize: PDF_TYPE.sectionTitle,
                  fontFamily: "Helvetica-Bold",
                  color: muted,
                  textTransform: "uppercase",
                  letterSpacing: 0.7,
                }}
              >
                {INVOICE_PDF_LABELS.invoice}
              </Text>
              <Text
                style={{
                  marginTop: 3,
                  fontFamily: "Helvetica-Bold",
                  fontSize: PDF_TYPE.body,
                  color: text,
                }}
              >
                {numberLabel}
              </Text>
            </View>
          </View>

          {/* Subtle travel motif: route line + waypoints */}
          <View
            style={{
              marginTop: PDF_SPACE.lg,
              flexDirection: "row",
              alignItems: "center",
              gap: 5,
            }}
            data-travel-motif="route-line"
          >
            <View
              style={{
                width: 5,
                height: 5,
                borderRadius: 2.5,
                borderWidth: 1.25,
                borderColor: brand,
              }}
            />
            <View
              style={{
                flex: 1,
                height: 1,
                backgroundColor: brand,
                opacity: 0.28,
              }}
            />
            <View
              style={{
                width: 3,
                height: 3,
                borderRadius: 1.5,
                backgroundColor: brand,
                opacity: 0.55,
              }}
            />
            <View
              style={{
                flex: 1,
                height: 1,
                backgroundColor: brand,
                opacity: 0.28,
              }}
            />
            {/* Small plane / chevron motif */}
            <View
              style={{
                width: 0,
                height: 0,
                borderStyle: "solid",
                borderLeftWidth: 7,
                borderRightWidth: 0,
                borderBottomWidth: 4,
                borderTopWidth: 4,
                borderLeftColor: brand,
                borderRightColor: "transparent",
                borderTopColor: "transparent",
                borderBottomColor: "transparent",
              }}
            />
            <View
              style={{
                flex: 1,
                height: 1,
                backgroundColor: brand,
                opacity: 0.28,
              }}
            />
            <View
              style={{
                width: 3,
                height: 3,
                borderRadius: 1.5,
                backgroundColor: brand,
                opacity: 0.55,
              }}
            />
            <View
              style={{
                flex: 1,
                height: 1,
                backgroundColor: brand,
                opacity: 0.28,
              }}
            />
            <View
              style={{
                width: 5,
                height: 5,
                borderRadius: 2.5,
                backgroundColor: brand,
              }}
            />
          </View>
        </View>

        <View style={{ flexDirection: "row", gap: PDF_SPACE.xxl }}>
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
