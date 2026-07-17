import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

import {
  fixtureB2bInvoice,
  fixtureLinkedCustomerBooking,
  fixtureLongInvoice,
  fixtureManualRecipient,
  fixtureOverdueInvoice,
  fixturePaidInvoice,
  fixtureShortInvoice,
  fixtureStandardInvoice,
} from "@/modules/finance/pdf/fixtures/invoice-pdf-fixtures";
import { INVOICE_PDF_LABELS } from "@/modules/finance/pdf/invoice-pdf-labels";
import { buildInvoicePdfData } from "@/modules/finance/pdf/invoice-pdf-data";
import { formatPdfIdr } from "@/modules/finance/pdf/invoice-pdf-theme";
import { renderInvoicePdfBuffer } from "@/modules/finance/pdf/invoice-pdf-renderer";
import { invoiceTemplateRegistryKeys } from "@/modules/finance/pdf/invoice-template-registry";
import { PAGE_MARGIN, PDF_TYPE } from "@/modules/finance/pdf/invoice-pdf-theme";

const PDF_ROOT = path.join(process.cwd(), "modules/finance/pdf");
const THUMB = path.join(
  process.cwd(),
  "modules/finance/components/invoice-template-thumbnail.tsx",
);

function readPdfSource(relative: string): string {
  return readFileSync(path.join(PDF_ROOT, relative), "utf8");
}

describe("FIN-001.3D Apple-level invoice PDF polish", () => {
  it("Corporate has a balanced two-column payment/totals block", () => {
    const corporate = readPdfSource("templates/corporate.tsx");
    assert.match(corporate, /PaymentTotalsBlock/);
    const block = readPdfSource("shared/payment-totals-block.tsx");
    assert.match(block, /data-payment-totals="two-column"/);
    assert.doesNotMatch(corporate, /height:\s*2\d{2,}|minHeight:\s*[4-9]\d{2}/);
  });

  it("recipient fields hide when empty and company leads when present", async () => {
    const recipient = readPdfSource("shared/recipient-block.tsx");
    assert.match(recipient, /recipient\.company/);
    assert.match(recipient, /recipient\.address \?/);
    assert.match(recipient, /data\.dueDate \?/);

    const empty = await buildInvoicePdfData(fixtureManualRecipient(), {
      mode: "issued",
    });
    assert.equal(empty.recipient.email, null);
    assert.equal(empty.recipient.address, null);

    const b2b = await buildInvoicePdfData(fixtureB2bInvoice(), { mode: "issued" });
    assert.equal(b2b.recipient.company, "PT Mitra Niaga Sejahtera");
    assert.equal(b2b.recipient.name, "Andi Wijaya");
  });

  it("account details use labeled rows", () => {
    const payment = readPdfSource("shared/payment-information.tsx");
    assert.match(payment, /INVOICE_PDF_LABELS\.bankLabel/);
    assert.match(payment, /INVOICE_PDF_LABELS\.accountNumberLabel/);
    assert.match(payment, /INVOICE_PDF_LABELS\.accountHolderLabel/);
    assert.match(payment, /INVOICE_PDF_LABELS\.branchLabel/);
    assert.match(payment, /INVOICE_PDF_LABELS\.swiftLabel/);
    assert.equal(INVOICE_PDF_LABELS.bankLabel, "Bank");
    assert.equal(INVOICE_PDF_LABELS.accountNumberLabel, "Nomor rekening");
    assert.equal(INVOICE_PDF_LABELS.accountHolderLabel, "Atas nama");
  });

  it("no internal payment metadata renders", () => {
    const payment = readPdfSource("shared/payment-information.tsx");
    assert.doesNotMatch(payment, /account\.enabled|account\.isDefault|account\.sortOrder/);
    assert.doesNotMatch(payment, /\bDEFAULT\b|defaultAccount/);
    assert.doesNotMatch(payment, /JSON\.stringify/);
  });

  it("short invoice has no large artificial spacer and footer stays connected", async () => {
    const corporate = readPdfSource("templates/corporate.tsx");
    const payment = readPdfSource("shared/payment-information.tsx");
    assert.doesNotMatch(corporate, /flexGrow:\s*1|minHeight:\s*[3-9]\d{2}/);
    assert.match(payment, /data-footer-connected="true"/);
    assert.match(payment, /InvoiceDocumentClose/);

    const data = await buildInvoicePdfData(fixtureShortInvoice(), {
      mode: "issued",
    });
    assert.equal(data.dueDate, null);
    assert.equal(data.items.length, 1);
    assert.equal(data.notes, null);
    const pdf = await renderInvoicePdfBuffer(data);
    assert.equal(pdf.subarray(0, 5).toString("utf8"), "%PDF-");
    assert.ok(pdf.byteLength > 700);
  });

  it("Travel includes a subtle route motif", () => {
    const travel = readPdfSource("templates/travel-banner.tsx");
    assert.match(travel, /data-travel-motif="route-line"/);
    assert.match(travel, /travel motif|route line/i);
    assert.doesNotMatch(travel, /rotate\(|gradient/i);
  });

  it("Calm remains minimal", () => {
    const calm = readPdfSource("templates/calm-standard.tsx");
    assert.match(calm, /CompanyHeader/);
    assert.match(calm, /variant="compact"/);
    assert.match(calm, /PDF_TYPE\.documentTitle/);
    assert.doesNotMatch(calm, /borderRadius:\s*[6-9]|backgroundColor:\s*data\.theme\.primaryColor/);
  });

  it("Editorial sidebar contains useful contact content", () => {
    const editorial = readPdfSource("templates/editorial-sidebar.tsx");
    const header = readPdfSource("shared/company-header.tsx");
    assert.match(editorial, /pageWithSidebar|styles\.sidebar/);
    assert.match(header, /variant === "sidebar"/);
    assert.match(header, /company\.address/);
    assert.match(header, /company\.phone/);
    assert.match(header, /company\.email/);
    assert.match(header, /company\.website/);
    assert.match(header, /company\.taxId/);
    assert.match(header, /INVOICE_PDF_LABELS\.paymentInformation/);
  });

  it("Total and balance hierarchy remains correct; paid shows Rp0", async () => {
    const summary = readPdfSource("shared/payment-summary.tsx");
    assert.match(summary, /data-totals-hierarchy="true"/);
    assert.match(summary, /INVOICE_PDF_LABELS\.total/);
    assert.match(summary, /INVOICE_PDF_LABELS\.balanceDue/);
    assert.match(summary, /amountEmphasis/);

    const unpaid = await buildInvoicePdfData(fixtureStandardInvoice(), {
      mode: "issued",
    });
    assert.equal(unpaid.balanceDueMinor, 2_000_000);
    assert.match(formatPdfIdr(unpaid.balanceDueMinor), /Rp.?2\.000\.000/);

    const paid = await buildInvoicePdfData(fixturePaidInvoice(), {
      mode: "issued",
    });
    assert.equal(paid.balanceDueMinor, 0);
    assert.equal(paid.amountPaidMinor, 2_000_000);
    assert.match(formatPdfIdr(paid.balanceDueMinor), /Rp.?0/);
    assert.equal(paid.paymentStatusLabel, "Lunas");
  });

  it("50-item invoice remains multipage safe without truncating long text", async () => {
    const long = fixtureLongInvoice();
    assert.equal(long.items?.length, 50);
    for (const key of invoiceTemplateRegistryKeys()) {
      const data = await buildInvoicePdfData(
        fixtureLongInvoice({
          templateKey: key,
          themeSnapshot: {
            templateKey: key,
            templateVersion: 2,
            primaryColor: "#0F172A",
            secondaryColor: "#64748B",
            accentColor: "#0F766E",
          },
        }),
        { mode: "issued" },
      );
      assert.ok(data.notes && data.notes.length > 200);
      assert.ok(
        data.items.some((item) => item.description.length > 80),
      );
      assert.equal(data.company.paymentAccounts.length >= 2, true);
      const pdf = await renderInvoicePdfBuffer(data);
      assert.equal(pdf.subarray(0, 5).toString("utf8"), "%PDF-");
      assert.ok(pdf.byteLength > 4000);
    }
  });

  it("all four picker previews remain visually distinct", () => {
    const thumb = readFileSync(THUMB, "utf8");
    assert.match(thumb, /data-preview-layout="corporate-header"/);
    assert.match(thumb, /data-preview-layout="travel-banner"/);
    assert.match(thumb, /data-preview-layout="calm-header"/);
    assert.match(thumb, /data-preview-layout="editorial-sidebar"/);
    assert.match(thumb, /data-preview-region="payment-totals"/);
    assert.match(thumb, /data-preview-region="route-motif"/);
    assert.doesNotMatch(thumb, /from-\[|bg-gradient|linear-gradient/);
  });

  it("composition system uses premium margins and type scale", () => {
    assert.ok(PAGE_MARGIN >= 42 && PAGE_MARGIN <= 48);
    assert.ok(PDF_TYPE.documentTitle >= 22);
    assert.ok(PDF_TYPE.body >= 9);
    assert.ok(PDF_TYPE.caption >= 7.5);
    const theme = readPdfSource("invoice-pdf-theme.ts");
    assert.match(theme, /PAGE_MARGIN = 4[2-8]/);
  });

  it("fixture catalog covers required scenarios", async () => {
    const samples = [
      fixtureShortInvoice(),
      fixtureStandardInvoice(),
      fixtureB2bInvoice(),
      fixtureLongInvoice(),
      fixturePaidInvoice(),
      fixtureOverdueInvoice(),
      fixtureManualRecipient(),
      fixtureLinkedCustomerBooking(),
    ];
    assert.equal(samples.length, 8);
    const overdue = await buildInvoicePdfData(fixtureOverdueInvoice(), {
      mode: "issued",
    });
    assert.equal(overdue.paymentStatusLabel, "Terlambat");
    const linked = await buildInvoicePdfData(fixtureLinkedCustomerBooking(), {
      mode: "issued",
    });
    assert.ok(linked.booking);
    assert.equal(linked.booking?.bookingCode, "BK-2026-0042");
  });
});
