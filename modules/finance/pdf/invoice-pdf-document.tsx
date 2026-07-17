import React from "react";
import { getInvoiceTemplateComponent } from "@/modules/finance/pdf/invoice-template-registry";
import type { InvoicePdfData } from "@/modules/finance/pdf/invoice-pdf-types";

export function InvoicePdfDocument({ data }: { data: InvoicePdfData }) {
  const Template = getInvoiceTemplateComponent(data.theme.templateKey);
  return <Template data={data} />;
}
