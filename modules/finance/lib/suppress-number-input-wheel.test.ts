import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { suppressNumberInputWheel } from "@/modules/finance/lib/suppress-number-input-wheel";
import { invoiceItemInputSchema } from "@/modules/finance/schemas/invoices";

describe("FIN-004A suppress number input wheel", () => {
  it("prevents default and blurs the focused control", () => {
    let prevented = false;
    let blurred = false;
    suppressNumberInputWheel({
      preventDefault: () => {
        prevented = true;
      },
      currentTarget: {
        blur: () => {
          blurred = true;
        },
      },
    });
    assert.equal(prevented, true);
    assert.equal(blurred, true);
  });

  it("quantity validation is unchanged", () => {
    const parsed = invoiceItemInputSchema.parse({
      description: "Paket",
      quantity: 2.5,
      unitPriceMinor: 1_000_000,
    });
    assert.equal(parsed.quantity, 2.5);
  });
});
