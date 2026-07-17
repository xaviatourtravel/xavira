import React from "react";
import { Text, View } from "@react-pdf/renderer";

import { INVOICE_PDF_LABELS } from "@/modules/finance/pdf/invoice-pdf-labels";
import type { InvoicePdfData } from "@/modules/finance/pdf/invoice-pdf-types";
import {
  formatPdfIdr,
  PDF_LINE,
  PDF_SPACE,
  PDF_TYPE,
} from "@/modules/finance/pdf/invoice-pdf-theme";

const COLS = {
  desc: "40%",
  qty: "8%",
  unit: "10%",
  price: "15%",
  discount: "11%",
  total: "16%",
} as const;

export function InvoiceItemsTable({ data }: { data: InvoicePdfData }) {
  const muted = data.theme.muted ?? data.theme.secondaryColor;
  const text = data.theme.text ?? "#0F172A";
  const divider = data.theme.divider ?? "#E2E8F0";

  return (
    <View style={{ marginTop: PDF_SPACE.xl }}>
      <View
        style={{
          flexDirection: "row",
          borderTopWidth: 1,
          borderBottomWidth: 1,
          borderTopColor: text,
          borderBottomColor: text,
          paddingVertical: PDF_SPACE.sm,
          paddingHorizontal: 2,
        }}
        fixed
      >
        <HeaderCell width={COLS.desc} muted={muted} align="left">
          {INVOICE_PDF_LABELS.description}
        </HeaderCell>
        <HeaderCell width={COLS.qty} muted={muted}>
          {INVOICE_PDF_LABELS.qty}
        </HeaderCell>
        <HeaderCell width={COLS.unit} muted={muted}>
          {INVOICE_PDF_LABELS.unit}
        </HeaderCell>
        <HeaderCell width={COLS.price} muted={muted}>
          {INVOICE_PDF_LABELS.price}
        </HeaderCell>
        <HeaderCell width={COLS.discount} muted={muted}>
          {INVOICE_PDF_LABELS.discount}
        </HeaderCell>
        <HeaderCell width={COLS.total} muted={muted}>
          {INVOICE_PDF_LABELS.lineAmount}
        </HeaderCell>
      </View>

      {data.items.map((item, index) => (
        <View
          key={`${index}-${item.description.slice(0, 24)}`}
          wrap={false}
          style={{
            flexDirection: "row",
            borderBottomWidth: 1,
            borderBottomColor: divider,
            paddingVertical: 10,
            paddingHorizontal: 2,
          }}
        >
          <View style={{ width: COLS.desc, paddingRight: PDF_SPACE.sm }}>
            <Text
              style={{
                fontFamily: "Helvetica-Bold",
                fontSize: PDF_TYPE.body,
                color: text,
                lineHeight: PDF_LINE.tight,
              }}
            >
              {item.description}
            </Text>
            {item.detail ? (
              <Text
                style={{
                  color: muted,
                  marginTop: 3,
                  fontSize: PDF_TYPE.caption,
                  lineHeight: PDF_LINE.body,
                }}
              >
                {item.detail}
              </Text>
            ) : null}
          </View>
          <Text
            style={{
              width: COLS.qty,
              textAlign: "right",
              fontSize: PDF_TYPE.body,
              color: text,
            }}
          >
            {item.quantity}
          </Text>
          <Text
            style={{
              width: COLS.unit,
              textAlign: "right",
              fontSize: PDF_TYPE.body,
              color: text,
            }}
          >
            {item.unit}
          </Text>
          <Text
            style={{
              width: COLS.price,
              textAlign: "right",
              fontSize: PDF_TYPE.body,
              color: text,
            }}
          >
            {formatPdfIdr(item.unitPriceMinor)}
          </Text>
          <Text
            style={{
              width: COLS.discount,
              textAlign: "right",
              fontSize: PDF_TYPE.body,
              color: text,
            }}
          >
            {item.discountMinor > 0 ? formatPdfIdr(item.discountMinor) : "—"}
          </Text>
          <Text
            style={{
              width: COLS.total,
              textAlign: "right",
              fontFamily: "Helvetica-Bold",
              fontSize: PDF_TYPE.body,
              color: text,
            }}
          >
            {formatPdfIdr(item.lineTotalMinor)}
          </Text>
        </View>
      ))}
    </View>
  );
}

function HeaderCell({
  children,
  width,
  muted,
  align = "right",
}: {
  children: string;
  width: string;
  muted: string;
  align?: "left" | "right";
}) {
  return (
    <Text
      style={{
        width,
        fontSize: PDF_TYPE.caption,
        fontFamily: "Helvetica-Bold",
        color: muted,
        textTransform: "uppercase",
        letterSpacing: 0.45,
        textAlign: align,
      }}
    >
      {children}
    </Text>
  );
}
