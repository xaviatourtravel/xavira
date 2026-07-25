import React from "react";
import { getInvoiceTemplateComponent } from "@/modules/finance/pdf/invoice-template-registry";
import type { InvoicePdfData } from "@/modules/finance/pdf/invoice-pdf-types";
import { TicketingTemplate } from "@/modules/finance/pdf/templates/ticketing";

export function InvoicePdfDocument({ data }: { data: InvoicePdfData }) {
  if (data.invoiceType === "ticketing") {
    return <TicketingTemplate data={data} />;
  }
  const Template = getInvoiceTemplateComponent(data.theme.templateKey);
  return <Template data={data} />;
}
