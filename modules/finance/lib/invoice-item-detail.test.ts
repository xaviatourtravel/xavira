import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  invoiceItemDetailHasLineBreaks,
  normalizeInvoiceItemDetail,
  splitInvoiceItemDetailLines,
} from "@/modules/finance/lib/invoice-item-detail";
import {
  createInvoiceDraftSchema,
  invoiceItemInputSchema,
} from "@/modules/finance/schemas/invoices";

describe("FIN-004 invoice item multiline detail", () => {
  it("multiline detail passes validation", () => {
    const parsed = invoiceItemInputSchema.parse({
      description: "Paket Umroh",
      detail: "Tiket Pesawat\nCGK - KMG\nBagasi 20 KG\nMakan",
      quantity: 1,
      unitPriceMinor: 25_000_000,
    });
    assert.equal(
      parsed.detail,
      "Tiket Pesawat\nCGK - KMG\nBagasi 20 KG\nMakan",
    );
  });

  it("internal newlines survive normalization", () => {
    assert.equal(
      normalizeInvoiceItemDetail("  Tiket Pesawat\nCGK - KMG  "),
      "Tiket Pesawat\nCGK - KMG",
    );
    assert.equal(
      normalizeInvoiceItemDetail("Tiket Pesawat\r\nCGK - KMG\rBagasi"),
      "Tiket Pesawat\nCGK - KMG\nBagasi",
    );
    assert.equal(
      normalizeInvoiceItemDetail("line1\n\nline3"),
      "line1\n\nline3",
    );
  });

  it("normalization does not collapse spaces into removing line breaks", () => {
    const value = "A\nB\nC";
    assert.equal(normalizeInvoiceItemDetail(value)?.includes("\n"), true);
    assert.equal(invoiceItemDetailHasLineBreaks(value), true);
  });

  it("existing single-line detail remains unchanged", () => {
    assert.equal(
      normalizeInvoiceItemDetail("Double occupancy"),
      "Double occupancy",
    );
    const parsed = invoiceItemInputSchema.parse({
      description: "Room",
      detail: "Double occupancy",
      quantity: 1,
      unitPriceMinor: 1_000_000,
    });
    assert.equal(parsed.detail, "Double occupancy");
  });

  it("empty / whitespace-only detail becomes null", () => {
    assert.equal(normalizeInvoiceItemDetail("   "), null);
    assert.equal(normalizeInvoiceItemDetail("\n\n"), null);
    assert.equal(normalizeInvoiceItemDetail(null), null);
    assert.equal(normalizeInvoiceItemDetail(undefined), null);
  });

  it("multiline detail reaches draft schema persistence shape unchanged", () => {
    const draft = createInvoiceDraftSchema.parse({
      recipientSource: "manual",
      manualRecipientName: "Budi",
      items: [
        {
          description: "Paket",
          detail: "Tiket Pesawat\nCGK - KMG\nBagasi 20 KG",
          quantity: 2,
          unitPriceMinor: 10_000_000,
        },
      ],
    });
    assert.equal(
      draft.items[0]!.detail,
      "Tiket Pesawat\nCGK - KMG\nBagasi 20 KG",
    );
  });

  it("split lines for display/PDF preserve order and blank lines", () => {
    assert.deepEqual(
      splitInvoiceItemDetailLines("Tiket Pesawat\nCGK - KMG\nBagasi 20 KG"),
      ["Tiket Pesawat", "CGK - KMG", "Bagasi 20 KG"],
    );
    assert.deepEqual(splitInvoiceItemDetailLines("A\n\nC"), ["A", "", "C"]);
    assert.deepEqual(splitInvoiceItemDetailLines(null), []);
    assert.deepEqual(splitInvoiceItemDetailLines("single"), ["single"]);
  });

  it("PDF formatter does not flatten newlines into a single token", () => {
    const lines = splitInvoiceItemDetailLines(
      "Tiket Pesawat\nCGK - KMG\nBagasi 20 KG",
    );
    assert.equal(lines.length, 3);
    assert.equal(lines.join(" "), "Tiket Pesawat CGK - KMG Bagasi 20 KG");
    assert.notEqual(lines.join(""), "Tiket Pesawat\\nCGK - KMG\\nBagasi 20 KG");
  });
});
