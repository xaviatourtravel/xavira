import { StyleSheet } from "@react-pdf/renderer";

import type { InvoicePdfTheme } from "@/modules/finance/pdf/invoice-pdf-types";

export const PAGE_WIDTH = 595.28;
export const PAGE_HEIGHT = 841.89;
/** A4 outer margin — 42–48pt band for premium printable documents. */
export const PAGE_MARGIN = 44;

/** Shared PDF spacing scale (pt). */
export const PDF_SPACE = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

/**
 * Typography hierarchy — one system across all templates.
 * Sizes stay print-readable (no sub-7pt body).
 */
export const PDF_TYPE = {
  documentTitle: 24,
  sectionTitle: 8,
  body: 9.5,
  caption: 8,
  amountEmphasis: 15,
  amountStrong: 11,
  companyName: 11,
  accountNumber: 11,
  metaValue: 9.5,
} as const;

export const PDF_LINE = {
  body: 1.45,
  tight: 1.3,
} as const;

export function createInvoicePdfStyles(theme: InvoicePdfTheme) {
  const text = theme.text ?? "#0F172A";
  const muted = theme.muted ?? theme.secondaryColor;
  const divider = theme.divider ?? "#E2E8F0";

  return StyleSheet.create({
    page: {
      fontFamily: "Helvetica",
      fontSize: PDF_TYPE.body,
      color: text,
      paddingTop: PAGE_MARGIN,
      paddingBottom: 48,
      paddingHorizontal: PAGE_MARGIN,
      backgroundColor: "#FFFFFF",
    },
    pageWithSidebar: {
      fontFamily: "Helvetica",
      fontSize: PDF_TYPE.body,
      color: text,
      paddingTop: PAGE_MARGIN,
      paddingBottom: 48,
      paddingRight: PAGE_MARGIN,
      paddingLeft: 128,
      backgroundColor: "#FFFFFF",
    },
    muted: { color: muted },
    brandText: { color: theme.primaryColor },
    title: {
      fontSize: PDF_TYPE.documentTitle,
      fontFamily: "Helvetica-Bold",
      color: text,
      letterSpacing: -0.4,
    },
    sectionLabel: {
      fontSize: PDF_TYPE.sectionTitle,
      fontFamily: "Helvetica-Bold",
      textTransform: "uppercase",
      letterSpacing: 0.8,
      color: muted,
      marginBottom: PDF_SPACE.sm,
    },
    row: { flexDirection: "row" },
    spaceBetween: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
    },
    divider: {
      height: 1,
      backgroundColor: divider,
      marginVertical: PDF_SPACE.lg,
    },
    sidebar: {
      position: "absolute",
      left: 0,
      top: 0,
      bottom: 0,
      width: 96,
      backgroundColor: theme.tint || theme.primaryColor,
      paddingTop: PDF_SPACE.xxl,
      paddingHorizontal: PDF_SPACE.sm + 2,
    },
    watermark: {
      position: "absolute",
      top: 360,
      left: 120,
      fontSize: 64,
      color: "#94A3B8",
      opacity: 0.12,
      transform: "rotate(-28deg)",
      fontFamily: "Helvetica-Bold",
    },
    footer: {
      position: "absolute",
      left: PAGE_MARGIN,
      right: PAGE_MARGIN,
      bottom: 18,
      flexDirection: "row",
      justifyContent: "space-between",
      fontSize: PDF_TYPE.caption,
      color: muted,
    },
  });
}

export function formatPdfIdr(minor: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(minor);
}

export function formatPdfDate(value: string | null): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeZone: "Asia/Jakarta",
  }).format(new Date(`${value}T00:00:00+07:00`));
}
