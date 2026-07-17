import React from "react";
import { Text, View } from "@react-pdf/renderer";

import { INVOICE_PDF_LABELS } from "@/modules/finance/pdf/invoice-pdf-labels";
import type { InvoicePdfData } from "@/modules/finance/pdf/invoice-pdf-types";
import {
  formatPdfDate,
  formatPdfIdr,
  PDF_SPACE,
  PDF_TYPE,
} from "@/modules/finance/pdf/invoice-pdf-theme";

export function BookingBlock({ data }: { data: InvoicePdfData }) {
  if (!data.booking) return null;
  const b = data.booking;
  const muted = data.theme.muted ?? data.theme.secondaryColor;
  const text = data.theme.text ?? "#0F172A";
  const divider = data.theme.divider ?? "#E2E8F0";
  const rows: Array<{ label: string; value: string }> = [];
  if (b.bookingCode) rows.push({ label: "Kode", value: b.bookingCode });
  if (b.packageName) rows.push({ label: "Paket", value: b.packageName });
  if (b.departureDate) {
    rows.push({ label: "Keberangkatan", value: formatPdfDate(b.departureDate) });
  }
  if (b.participantCount != null) {
    rows.push({ label: "Peserta", value: String(b.participantCount) });
  }
  if (b.leadTraveller) rows.push({ label: "Jamaah utama", value: b.leadTraveller });
  if (b.totalAmountMinor != null) {
    rows.push({
      label: "Total booking",
      value: formatPdfIdr(b.totalAmountMinor),
    });
  }

  if (rows.length === 0) return null;

  return (
    <View
      wrap={false}
      style={{
        marginTop: PDF_SPACE.lg,
        paddingTop: PDF_SPACE.md,
        borderTopWidth: 1,
        borderTopColor: divider,
      }}
    >
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
        {INVOICE_PDF_LABELS.booking}
      </Text>
      {rows.map((row) => (
        <View
          key={row.label}
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginBottom: 3,
            gap: PDF_SPACE.md,
          }}
        >
          <Text style={{ color: muted, fontSize: PDF_TYPE.caption }}>
            {row.label}
          </Text>
          <Text style={{ color: text, fontSize: PDF_TYPE.body }}>{row.value}</Text>
        </View>
      ))}
    </View>
  );
}
