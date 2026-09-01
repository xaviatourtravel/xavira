import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

import { invoiceItemInputSchema } from "@/modules/finance/schemas/invoices";
import {
  cancelProformaSchema,
  convertProformaSchema,
  createProformaDraftSchema,
} from "@/modules/finance/schemas/proforma";
import {
  assertProformaNotOfficialInvoice,
  canCancelProforma,
  canConvertProforma,
  canDeleteProforma,
  convertedInvoiceCustomerSnapshot,
  formatProformaNumber,
  isProformaEditable,
  isProformaNumber,
  looksLikeOfficialInvoiceNumber,
} from "@/modules/finance/lib/proforma-lifecycle";
import { PROFORMA_PDF_TITLE } from "@/modules/finance/pdf/proforma-pdf-data";
import { invoiceDocumentTitle, invoicePdfTotalLabel } from "@/modules/finance/pdf/invoice-pdf-labels";
import { roleHasPermission } from "@/lib/auth/permission-matrix";

const MIGRATION_PATH = path.join(
  process.cwd(),
  "supabase/migrations/20260901000000_proforma_invoice_lifecycle.sql",
);
const ISSUE_MIGRATION_PATH = path.join(
  process.cwd(),
  "supabase/migrations/20260717000000_invoice_ticketing.sql",
);
const PAYMENTS_MIGRATION_PATH = path.join(
  process.cwd(),
  "supabase/migrations/20260717120000_invoice_payments.sql",
);
const ARCHIVE_MIGRATION_PATH = path.join(
  process.cwd(),
  "supabase/migrations/20260828000000_invoice_archive_delete.sql",
);
const TICKETING_EDITOR = path.join(
  process.cwd(),
  "modules/finance/components/ticketing-invoice-editor.tsx",
);

function readSql() {
  return readFileSync(MIGRATION_PATH, "utf8");
}

describe("FIN-005 Proforma lifecycle", () => {
  it("creating Proforma schema does not require an official invoice number", () => {
    const parsed = createProformaDraftSchema.parse({
      recipientSource: "manual",
      manualRecipientName: "Budi",
      items: [
        {
          description: "Paket",
          detail: "Tiket Pesawat\nCGK - KMG",
          quantity: 1,
          unitPriceMinor: 10_000_000,
        },
      ],
    });
    assert.equal(parsed.invoiceType, "package");
    assert.equal("invoiceNumber" in parsed, false);
    assert.equal(parsed.items[0]!.detail, "Tiket Pesawat\nCGK - KMG");
  });

  it("PI reference is generated independently of INV format", () => {
    assert.equal(formatProformaNumber(2026, 1), "PI-2026-000001");
    assert.equal(isProformaNumber("PI-2026-000001"), true);
    assert.equal(looksLikeOfficialInvoiceNumber("PI-2026-000001"), false);
    assert.equal(looksLikeOfficialInvoiceNumber("INV/XAVIA/2026/0001"), true);
  });

  it("Proforma is not counted as an official Invoice in domain helpers", () => {
    assert.equal(canConvertProforma({ lifecycleStatus: "draft" }), true);
    assert.equal(canConvertProforma({ lifecycleStatus: "converted" }), false);
    assert.equal(canCancelProforma({ lifecycleStatus: "converted" }), false);
    assert.equal(
      canDeleteProforma({ lifecycleStatus: "converted", convertedInvoiceId: "x" }),
      false,
    );
  });

  it("cancelled Proforma cannot convert", () => {
    assert.equal(canConvertProforma({ lifecycleStatus: "cancelled" }), false);
    assert.equal(isProformaEditable("cancelled"), false);
  });

  it("conversion schema is id-only and never accepts an invoice number", () => {
    const parsed = convertProformaSchema.parse({
      proformaId: "11111111-1111-1111-1111-111111111111",
    });
    assert.equal("invoiceNumber" in parsed, false);
    assert.throws(() =>
      convertProformaSchema.parse({
        proformaId: "11111111-1111-1111-1111-111111111111",
        invoiceNumber: "INV/XAVIA/2026/0001",
      }),
    );
  });

  it("cancel schema does not consume or accept invoice numbers", () => {
    const parsed = cancelProformaSchema.parse({
      proformaId: "11111111-1111-1111-1111-111111111111",
      reason: "Customer cancelled",
    });
    assert.equal("invoiceNumber" in parsed, false);
  });

  it("multiline Detail survives the shared item schema used at conversion copy", () => {
    const parsed = invoiceItemInputSchema.parse({
      description: "Paket Umroh",
      detail: "Tiket Pesawat\nCGK - KMG\nBagasi 20 KG",
      quantity: 2,
      unitPriceMinor: 25_000_000,
    });
    assert.equal(parsed.detail, "Tiket Pesawat\nCGK - KMG\nBagasi 20 KG");
  });

  it("converted and cancelled Proforma are read-only", () => {
    assert.equal(isProformaEditable("draft"), true);
    assert.equal(isProformaEditable("converted"), false);
    assert.equal(isProformaEditable("cancelled"), false);
  });

  it("rejects a PI that looks like an official invoice number", () => {
    assert.throws(() =>
      assertProformaNotOfficialInvoice({
        proformaNumber: "INV/XAVIA/2026/0001",
      }),
    );
  });

  it("migration allocates PI from proforma_sequences and issues INV only via issue_invoice", () => {
    const sql = readSql();
    assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.proforma_invoices/);
    assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.proforma_sequences/);
    assert.match(sql, /allocate_proforma_number/);
    assert.match(sql, /format\('PI-%s-%s'/);
    assert.match(sql, /v_invoice := public\.issue_invoice\(v_invoice\.id\)/);
    assert.match(sql, /document_type,/);
    assert.match(sql, /'package',\s*'invoice'/);
    assert.match(sql, /source_proforma_id/);
    assert.match(sql, /converted_invoice_id/);
    assert.match(sql, /already_converted', true/);
    assert.match(sql, /FOR UPDATE/);
    assert.match(sql, /Cancelled Proforma cannot be converted/);
    assert.match(sql, /RAISE EXCEPTION 'Proforma not found'/);
    assert.doesNotMatch(sql, /REFERENCES public\.invoice_payments/);
    assert.doesNotMatch(sql, /CREATE TABLE IF NOT EXISTS public\.proforma_payments/);
  });

  it("conversion is idempotent: converted_invoice_id is checked before status errors", () => {
    const sql = readSql();
    const start = sql.indexOf(
      "CREATE OR REPLACE FUNCTION public.convert_proforma_to_invoice",
    );
    const end = sql.indexOf("CREATE OR REPLACE FUNCTION public.cancel_proforma");
    assert.ok(start >= 0 && end > start);
    const body = sql.slice(start, end);

    const convertedId = body.indexOf(
      "IF v_proforma.converted_invoice_id IS NOT NULL",
    );
    const cancelled = body.indexOf(
      "IF v_proforma.lifecycle_status = 'cancelled'",
    );
    const notDraft = body.indexOf(
      "IF v_proforma.lifecycle_status <> 'draft'",
    );
    const issueCall = body.indexOf("v_invoice := public.issue_invoice");

    assert.ok(convertedId >= 0);
    assert.ok(convertedId < cancelled);
    assert.ok(cancelled < notDraft);
    assert.ok(notDraft < issueCall);
    assert.doesNotMatch(body, /EXCEPTION WHEN/);
    assert.doesNotMatch(
      body,
      /RAISE EXCEPTION 'Proforma already has an official Invoice'/,
    );
    assert.match(body, /already_converted', true/);
  });

  it("conversion, cancel, and PI allocation never UPDATE invoice_sequences", () => {
    const sql = readSql();
    const convertStart = sql.indexOf(
      "CREATE OR REPLACE FUNCTION public.convert_proforma_to_invoice",
    );
    const convertEnd = sql.indexOf(
      "CREATE OR REPLACE FUNCTION public.cancel_proforma",
    );
    const convertBody = sql.slice(convertStart, convertEnd);
    assert.doesNotMatch(convertBody, /invoice_sequences/);
    assert.match(convertBody, /v_invoice := public\.issue_invoice\(v_invoice\.id\)/);

    const cancelStart = sql.indexOf(
      "CREATE OR REPLACE FUNCTION public.cancel_proforma",
    );
    const cancelEnd = sql.indexOf(
      "CREATE OR REPLACE FUNCTION public.delete_draft_proforma",
    );
    assert.doesNotMatch(
      sql.slice(cancelStart, cancelEnd),
      /invoice_sequences/,
    );

    const allocStart = sql.indexOf(
      "CREATE OR REPLACE FUNCTION public.allocate_proforma_number",
    );
    const allocEnd = sql.indexOf(
      "CREATE OR REPLACE FUNCTION public.assign_proforma_number_on_insert",
    );
    const allocBody = sql.slice(allocStart, allocEnd);
    assert.doesNotMatch(allocBody, /invoice_sequences/);
    assert.match(allocBody, /UPDATE public\.proforma_sequences/);
    assert.match(allocBody, /FOR UPDATE/);
    assert.match(allocBody, /Asia\/Jakarta/);
    assert.doesNotMatch(allocBody, /nextval\(/);
  });

  it("official INV numbering uses a transactional invoice_sequences row, not nextval()", () => {
    const sql = readFileSync(ISSUE_MIGRATION_PATH, "utf8");
    assert.match(sql, /UPDATE public\.invoice_sequences/);
    assert.match(sql, /SET last_number = v_next_number/);
    assert.match(sql, /FOR UPDATE/);
    assert.doesNotMatch(sql, /nextval\(/);
    assert.doesNotMatch(sql, /CREATE SEQUENCE/);

    const domain = readFileSync(
      path.join(
        process.cwd(),
        "supabase/migrations/20260714000000_create_invoice_domain.sql",
      ),
      "utf8",
    );
    assert.match(domain, /CREATE TABLE public\.invoice_sequences/);
    assert.doesNotMatch(domain, /nextval\(/);
    assert.doesNotMatch(domain, /CREATE SEQUENCE/);
  });

  it("PI numbers are unique per organization and isolated by Jakarta year", () => {
    const sql = readSql();
    assert.match(
      sql,
      /CONSTRAINT proforma_sequences_org_year_unique UNIQUE \(organization_id, year\)/,
    );
    assert.match(sql, /proforma_invoices_org_number_unique/);
    assert.match(sql, /ON public\.proforma_invoices \(organization_id, proforma_number\)/);
    assert.match(sql, /proforma_number ~ '\^PI-\[0-9\]\{4\}-\[0-9\]\{6\}\$'/);
  });

  it("deleting Invoice or Proforma cannot cascade-delete the other document", () => {
    const sql = readSql();
    assert.match(
      sql,
      /converted_invoice_id uuid REFERENCES public\.invoices \(id\) ON DELETE SET NULL/,
    );
    assert.match(
      sql,
      /FOREIGN KEY \(source_proforma_id\)\s+REFERENCES public\.proforma_invoices \(id\)\s+ON DELETE SET NULL/,
    );
    assert.match(sql, /proforma_invoices_converted_integrity/);
    assert.doesNotMatch(
      sql,
      /converted_invoice_id uuid REFERENCES public\.invoices \(id\) ON DELETE CASCADE/,
    );
    assert.doesNotMatch(
      sql,
      /source_proforma_id[\s\S]{0,180}ON DELETE CASCADE/,
    );
  });

  it("clients cannot mark a draft Proforma converted through RLS", () => {
    const sql = readSql();
    assert.match(
      sql,
      /Proforma conversion and cancel fields cannot be changed directly/,
    );
    const policyStart = sql.indexOf(
      "CREATE POLICY proforma_invoices_update_manager",
    );
    const policyBody = sql.slice(policyStart, policyStart + 900);
    assert.match(policyBody, /converted_invoice_id IS NULL/);
    assert.match(policyBody, /lifecycle_status = 'draft'/);
  });

  it("Proforma payments cannot attach to official invoice_payments table", () => {
    const sql = readSql();
    assert.doesNotMatch(sql, /CREATE TABLE IF NOT EXISTS public\.proforma_payments/);
    assert.doesNotMatch(sql, /REFERENCES public\.invoice_payments/);
    const payments = readFileSync(PAYMENTS_MIGRATION_PATH, "utf8");
    assert.match(payments, /invoice_id uuid NOT NULL REFERENCES public\.invoices/);
    assert.doesNotMatch(payments, /proforma_invoices/);
  });

  it("existing issue_invoice still allocates INV numbers from invoice_sequences", () => {
    const sql = readFileSync(ISSUE_MIGRATION_PATH, "utf8");
    assert.match(sql, /UPDATE public\.invoice_sequences/);
    assert.match(sql, /'INV\/%s\/%s\/%s'/);
    assert.doesNotMatch(sql, /proforma_sequences/);
  });

  it("archive/delete invoice RPCs remain on invoices table", () => {
    const sql = readFileSync(ARCHIVE_MIGRATION_PATH, "utf8");
    assert.match(sql, /CREATE OR REPLACE FUNCTION public\.archive_invoice/);
    assert.match(sql, /CREATE OR REPLACE FUNCTION public\.delete_draft_invoice/);
    assert.doesNotMatch(sql, /proforma_invoices/);
  });

  it("legacy Ticketing Proforma creation is disabled; historical rendering stays", () => {
    const editor = readFileSync(TICKETING_EDITOR, "utf8");
    assert.match(editor, /isHistoricalTicketingProforma/);
    assert.match(editor, /legacyTicketingProformaLabel/);
    assert.doesNotMatch(editor, /setDocumentType/);
    assert.doesNotMatch(editor, /<option value="proforma">/);
    assert.doesNotMatch(editor, /convert_proforma_to_invoice/);
    assert.doesNotMatch(editor, /proforma_invoices/);
  });

  it("Proforma PDF title is PROFORMA INVOICE and official package title stays Invoice", () => {
    assert.equal(PROFORMA_PDF_TITLE, "PROFORMA INVOICE");
    assert.equal(invoiceDocumentTitle("package", "invoice"), "Invoice");
    assert.equal(invoiceDocumentTitle("ticketing", "invoice"), "INVOICE TIKET PESAWAT");
    assert.equal(invoicePdfTotalLabel("proforma"), "Total");
    assert.equal(invoicePdfTotalLabel("invoice"), "Total invoice");
  });

  it("invoice KPI and payment queries stay on invoices, not proforma_invoices", () => {
    const invoiceRepo = readFileSync(
      path.join(process.cwd(), "modules/finance/repositories/invoice-repository.ts"),
      "utf8",
    );
    const paymentRepo = readFileSync(
      path.join(
        process.cwd(),
        "modules/finance/repositories/invoice-payment-repository.ts",
      ),
      "utf8",
    );
    const listPage = readFileSync(
      path.join(
        process.cwd(),
        "modules/finance/components/invoice-workspace-page.tsx",
      ),
      "utf8",
    );
    const outstanding = readFileSync(
      path.join(process.cwd(), "app/(dashboard)/finance/outstanding/page.tsx"),
      "utf8",
    );
    assert.match(invoiceRepo, /\.from\("invoices"\)/);
    assert.doesNotMatch(invoiceRepo, /proforma_invoices/);
    assert.match(paymentRepo, /\.from\("invoice_payments"\)/);
    assert.doesNotMatch(paymentRepo, /proforma_invoices/);
    assert.match(listPage, /listOrganizationInvoices/);
    assert.doesNotMatch(listPage, /proforma_invoices/);
    assert.match(outstanding, /redirect\("\/revenue"\)/);
    assert.doesNotMatch(outstanding, /proforma_invoices/);
  });

  it("converted Invoice keeps the Proforma customer snapshot, not live CRM", () => {
    const preserved = convertedInvoiceCustomerSnapshot(
      { name: "PT ABC", email: "old@example.com" },
      { name: "PT XYZ", email: "new@example.com" },
    );
    assert.equal(preserved.name, "PT ABC");
    assert.equal(preserved.email, "old@example.com");

    const sql = readSql();
    const helperStart = sql.indexOf(
      "CREATE OR REPLACE FUNCTION public.proforma_document_snapshots_for_issue",
    );
    const helperEnd = sql.indexOf(
      "CREATE OR REPLACE FUNCTION public.issue_invoice",
      helperStart,
    );
    assert.ok(helperStart >= 0 && helperEnd > helperStart);
    const helper = sql.slice(helperStart, helperEnd);
    assert.match(helper, /FROM public\.proforma_invoices/);
    assert.match(helper, /v_proforma\.customer_snapshot/);
    assert.match(helper, /v_proforma\.booking_snapshot/);
    assert.doesNotMatch(helper, /FROM public\.leads/);
    assert.doesNotMatch(helper, /build_invoice_customer_snapshot_from_invoice/);
    assert.doesNotMatch(helper, /build_invoice_company_snapshot/);

    const issueStart = sql.indexOf(
      "CREATE OR REPLACE FUNCTION public.issue_invoice",
    );
    const issueEnd = sql.indexOf(
      "CREATE OR REPLACE FUNCTION public.convert_proforma_to_invoice",
    );
    const issue = sql.slice(issueStart, issueEnd);
    assert.match(
      issue,
      /v_customer := public\.build_invoice_customer_snapshot_from_invoice/,
    );
    assert.match(issue, /v_company := public\.build_invoice_company_snapshot/);
    assert.match(issue, /lock_and_validate_ticketing_for_issue/);
    assert.match(issue, /IF v_invoice\.source_proforma_id IS NOT NULL/);
    assert.match(issue, /proforma_document_snapshots_for_issue/);
    assert.ok(
      issue.indexOf("build_invoice_customer_snapshot_from_invoice") <
        issue.indexOf("IF v_invoice.source_proforma_id IS NOT NULL"),
    );
    assert.match(issue, /company_snapshot = v_company/);
    assert.match(issue, /customer_snapshot = v_customer/);
    assert.equal((issue.match(/public\.issue_invoice/g) ?? []).length, 1);

    const convertStart = sql.indexOf(
      "CREATE OR REPLACE FUNCTION public.convert_proforma_to_invoice",
    );
    const convert = sql.slice(
      convertStart,
      sql.indexOf("CREATE OR REPLACE FUNCTION public.cancel_proforma"),
    );
    assert.match(convert, /INSERT INTO public\.invoice_items/);
    assert.match(convert, /v_item\.detail/);
    assert.match(convert, /customer_id,/);
    assert.match(convert, /booking_id,/);
    assert.equal((convert.match(/public\.issue_invoice/g) ?? []).length, 1);
    assert.match(convert, /already_converted', true/);
    assert.match(
      convert,
      /set_config\('app\.trusted_proforma_mutation', '1', true\)/,
    );
  });

  it("clients cannot spoof source_proforma_id or Proforma snapshots", () => {
    const sql = readSql();
    assert.match(sql, /source_proforma_id cannot be set directly/);
    assert.match(sql, /invoices_prevent_client_source_proforma_id/);
    const helper = sql.slice(
      sql.indexOf("CREATE OR REPLACE FUNCTION public.proforma_document_snapshots_for_issue"),
      sql.indexOf("CREATE OR REPLACE FUNCTION public.issue_invoice"),
    );
    assert.doesNotMatch(helper, /v_invoice\.customer_snapshot/);
    assert.match(
      sql,
      /REVOKE ALL ON FUNCTION public\.proforma_document_snapshots_for_issue/,
    );
  });

  it("invoice managers keep existing invoice permissions", () => {
    assert.equal(roleHasPermission("finance", "invoices.create"), true);
    assert.equal(roleHasPermission("finance", "invoices.issue"), true);
  });
});
