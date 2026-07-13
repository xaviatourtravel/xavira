import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

import {
  isProductDocumentUniqueViolation,
  ProductDocumentInsertError,
  raceFinalizeInsert,
  resolveProductDocumentInsertError,
} from "@/modules/business-brain/lib/product-document-insert-errors";

const MIGRATION_PATH = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../../supabase/migrations/20260713130000_product_documents_file_path_unique.sql",
);

describe("product document insert race protection", () => {
  it("detects postgres unique violations", () => {
    assert.equal(isProductDocumentUniqueViolation({ code: "23505", message: "duplicate key" }), true);
    assert.equal(
      isProductDocumentUniqueViolation(
        new ProductDocumentInsertError("DUPLICATE_UPLOAD_FINALIZATION", "duplicate"),
      ),
      true,
    );
    assert.equal(isProductDocumentUniqueViolation(new Error("permission denied")), false);
  });

  it("maps unique violations to DUPLICATE_UPLOAD_FINALIZATION", () => {
    assert.equal(
      resolveProductDocumentInsertError({ code: "23505", message: "duplicate key value" }),
      "DUPLICATE_UPLOAD_FINALIZATION",
    );
    assert.equal(
      resolveProductDocumentInsertError(
        new ProductDocumentInsertError("DUPLICATE_UPLOAD_FINALIZATION", "duplicate"),
      ),
      "DUPLICATE_UPLOAD_FINALIZATION",
    );
    assert.equal(resolveProductDocumentInsertError(new Error("connection reset")), "DATABASE_SAVE_FAILED");
  });

  it("allows only one winner when two finalize inserts race on the same path", async () => {
    let insertCount = 0;

    const result = await raceFinalizeInsert("org/prod/uuid-itinerary.pdf", async (path) => {
      insertCount += 1;
      await new Promise((resolve) => setTimeout(resolve, 5));
      return { path, id: `doc-${insertCount}` };
    });

    assert.equal(result.winners.length, 1);
    assert.equal(result.duplicateFailures, 1);
    assert.equal(insertCount, 1);
    assert.equal(result.winners[0]?.path, "org/prod/uuid-itinerary.pdf");
  });

  it("ships a partial unique index migration for file_path", () => {
    const sql = readFileSync(MIGRATION_PATH, "utf8");
    assert.match(sql, /CREATE UNIQUE INDEX.*product_documents_file_path_unique_idx/i);
    assert.match(sql, /WHERE file_path IS NOT NULL/i);
    assert.match(sql, /ROW_NUMBER\(\) OVER/i);
  });
});
