import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";

import { InvoicePdfDocument } from "@/modules/finance/pdf/invoice-pdf-document";
import { InvoicePdfStageError } from "@/modules/finance/pdf/invoice-pdf-debug";
import type { InvoicePdfData } from "@/modules/finance/pdf/invoice-pdf-types";
import { getInvoiceTemplateComponent } from "@/modules/finance/pdf/invoice-template-registry";

export function isPdfMagicBytes(buffer: Buffer): boolean {
  return (
    buffer.length >= 5 &&
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46 &&
    buffer[4] === 0x2d
  ); // %PDF-
}

export async function renderInvoicePdfBuffer(
  data: InvoicePdfData,
): Promise<Buffer> {
  try {
    getInvoiceTemplateComponent(data.theme.templateKey);
  } catch (error) {
    throw new InvoicePdfStageError(
      "template_resolution",
      "Template resolution failed",
      { cause: error },
    );
  }

  let raw: Uint8Array;
  try {
    const element = React.createElement(InvoicePdfDocument, { data });
    // @react-pdf Document typing is narrower than our template wrapper.
    raw = await renderToBuffer(element as never);
  } catch (error) {
    throw new InvoicePdfStageError("render", "PDF renderToBuffer failed", {
      cause: error,
    });
  }

  const result = Buffer.from(raw);
  if (!isPdfMagicBytes(result)) {
    throw new InvoicePdfStageError(
      "pdf_validation",
      "PDF renderer produced invalid output",
    );
  }
  return result;
}

export function sanitizeInvoicePdfFileName(
  invoiceNumber: string | null | undefined,
  mode: "draft" | "issued",
): string {
  if (mode === "draft" || !invoiceNumber) {
    return "invoice-draft.pdf";
  }
  const safe = invoiceNumber
    .replace(/[^A-Za-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
  return `${safe || "invoice"}.pdf`;
}
