import type { ComponentType } from "react";

import {
  DEFAULT_INVOICE_TEMPLATE_KEY,
  INVOICE_TEMPLATE_KEYS,
  type InvoicePdfData,
  type InvoiceTemplateDefinition,
  type InvoiceTemplateKey,
} from "@/modules/finance/pdf/invoice-pdf-types";
import { CalmStandardTemplate } from "@/modules/finance/pdf/templates/calm-standard";
import { CorporateTemplate } from "@/modules/finance/pdf/templates/corporate";
import { EditorialSidebarTemplate } from "@/modules/finance/pdf/templates/editorial-sidebar";
import { TravelBannerTemplate } from "@/modules/finance/pdf/templates/travel-banner";

type PdfTemplateComponent = ComponentType<{ data: InvoicePdfData }>;

/**
 * Compile-time template registry. Future templates register via
 * `registerInvoiceTemplate` during module init — never from DB executable paths.
 *
 * Ticket catalog:
 * 007 Corporate · 008 Editorial Sidebar · 009 Calm Standard · 010 Travel Banner
 */
const DEFINITIONS: Partial<Record<InvoiceTemplateKey, InvoiceTemplateDefinition>> = {};
const COMPONENTS: Partial<Record<InvoiceTemplateKey, PdfTemplateComponent>> = {};

export function registerInvoiceTemplate(
  definition: InvoiceTemplateDefinition,
  component: PdfTemplateComponent,
): void {
  DEFINITIONS[definition.key] = definition;
  COMPONENTS[definition.key] = component;
}

registerInvoiceTemplate(
  {
    key: "corporate",
    ticketId: "007",
    version: 2,
    name: "Corporate",
    description: "Formal B2B header band with clean metadata blocks.",
  },
  CorporateTemplate,
);

registerInvoiceTemplate(
  {
    key: "editorial-sidebar",
    ticketId: "008",
    version: 2,
    name: "Editorial Sidebar",
    description: "Useful identity sidebar with company and payment summary.",
  },
  EditorialSidebarTemplate,
);

registerInvoiceTemplate(
  {
    key: "calm-standard",
    ticketId: "009",
    version: 2,
    name: "Calm Standard",
    description: "Minimal Apple-like invoice with generous whitespace.",
  },
  CalmStandardTemplate,
);

registerInvoiceTemplate(
  {
    key: "travel-banner",
    ticketId: "010",
    version: 2,
    name: "Travel Banner",
    description: "Hero travel banner with elegant destination motif.",
  },
  TravelBannerTemplate,
);

export function normalizeInvoiceTemplateKey(
  key: string | null | undefined,
): InvoiceTemplateKey {
  const raw = (key ?? "").trim().toLowerCase();
  if ((INVOICE_TEMPLATE_KEYS as readonly string[]).includes(raw)) {
    return raw as InvoiceTemplateKey;
  }
  return DEFAULT_INVOICE_TEMPLATE_KEY;
}

export function listInvoiceTemplates(): InvoiceTemplateDefinition[] {
  return INVOICE_TEMPLATE_KEYS.map((key) => {
    const definition = DEFINITIONS[key];
    if (!definition) {
      throw new Error(`Missing invoice template registration: ${key}`);
    }
    return definition;
  });
}

export function getInvoiceTemplateDefinition(
  key: string | null | undefined,
): InvoiceTemplateDefinition {
  const normalized = normalizeInvoiceTemplateKey(key);
  const definition = DEFINITIONS[normalized];
  if (!definition) {
    return DEFINITIONS[DEFAULT_INVOICE_TEMPLATE_KEY]!;
  }
  return definition;
}

export function getInvoiceTemplateComponent(
  key: string | null | undefined,
): PdfTemplateComponent {
  const normalized = normalizeInvoiceTemplateKey(key);
  return (
    COMPONENTS[normalized] ?? COMPONENTS[DEFAULT_INVOICE_TEMPLATE_KEY]!
  );
}

export function getInvoiceTemplateVersion(
  key: string | null | undefined,
): number {
  return getInvoiceTemplateDefinition(key).version;
}

/** Registry keys only — never from executable database paths. */
export function invoiceTemplateRegistryKeys(): InvoiceTemplateKey[] {
  return [...INVOICE_TEMPLATE_KEYS];
}

export function getInvoiceTemplateTicketId(
  key: string | null | undefined,
): string {
  return getInvoiceTemplateDefinition(key).ticketId;
}
