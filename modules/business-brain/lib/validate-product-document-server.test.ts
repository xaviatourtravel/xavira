import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { canonicalProductDocumentMimeType } from "@/modules/business-brain/lib/product-document-upload-config";
import { validateProductDocumentUploadServer } from "@/modules/business-brain/lib/validate-product-document-server";
import { inferServerUploadErrorCode } from "@/modules/business-brain/lib/product-document-upload-errors";
import { classifyProductUploadError } from "@/modules/business-brain/lib/validate-product-document-file";

describe("canonicalProductDocumentMimeType", () => {
  it("normalizes PDF browser MIME aliases to application/pdf", () => {
    assert.equal(
      canonicalProductDocumentMimeType("itinerary.pdf", "application/vnd.adobe.pdf"),
      "application/pdf",
    );
    assert.equal(
      canonicalProductDocumentMimeType("itinerary.pdf", "application/x-pdf"),
      "application/pdf",
    );
  });

  it("infers PDF from extension when browser MIME is empty", () => {
    assert.equal(canonicalProductDocumentMimeType("FEB 7D4N Tokyo.pdf", ""), "application/pdf");
  });
});

describe("validateProductDocumentUploadServer", () => {
  it("accepts valid PDF itinerary buffers with non-standard browser MIME", () => {
    const buffer = Buffer.from("%PDF-1.4\n%%EOF");
    const result = validateProductDocumentUploadServer({
      fileName: "REPRO Itinerary (Test).pdf",
      browserMime: "application/vnd.adobe.pdf",
      buffer,
      documentType: "itinerary",
    });

    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.mimeType, "application/pdf");
    }
  });

  it("rejects fake PDF renamed from text", () => {
    const result = validateProductDocumentUploadServer({
      fileName: "fake.pdf",
      browserMime: "application/pdf",
      buffer: Buffer.from("not-a-pdf"),
      documentType: "itinerary",
    });

    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.code, "INVALID_FILE_TYPE");
    }
  });
});

describe("upload error mapping", () => {
  it("maps storage MIME rejection to storage UI bucket", () => {
    assert.equal(
      classifyProductUploadError("mime type application/vnd.adobe.pdf is not supported"),
      "storage",
    );
  });

  it("maps RLS failures to unknown UI bucket via server code", () => {
    assert.equal(
      inferServerUploadErrorCode(
        'new row violates row-level security policy for table "product_documents"',
      ),
      "DATABASE_SAVE_FAILED",
    );
    assert.equal(
      classifyProductUploadError(
        'new row violates row-level security policy for table "product_documents"',
        "DATABASE_SAVE_FAILED",
      ),
      "unknown",
    );
  });
});
