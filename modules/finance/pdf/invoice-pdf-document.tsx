import React from "react";
import { getInvoiceTemplateComponent } from "@/modules/finance/pdf/invoice-template-registry";
import type { InvoicePdfData } from "@/modules/finance/pdf/invoice-pdf-types";
import { TicketingTemplate } from "@/modules/finance/pdf/templates/ticketing";

import { CalmStandardTemplate } from "@/modules/finance/pdf/templates/calm-standard";
import { usesFixedPackageInvoiceLayout } from "@/modules/finance/lib/invoice-brand-profiles";

export function InvoicePdfDocument({ data }: { data: InvoicePdfData }) {
  if (data.invoiceType === "ticketing") {
    return <TicketingTemplate data={data} />;
  }
  if (usesFixedPackageInvoiceLayout(data)) {
    return <CalmStandardTemplate data={data} />;
  }
  const Template = getInvoiceTemplateComponent(data.theme.templateKey);
  return <Template data={data} />;
}
