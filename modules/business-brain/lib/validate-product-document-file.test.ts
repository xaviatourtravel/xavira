import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  classifyProductUploadError,
  validatePdfReadable,
  validateProductDocumentFile,
  PRODUCT_DOCUMENT_MAX_BYTES,
} from "@/modules/business-brain/lib/validate-product-document-file";

describe("validateProductDocumentFile", () => {
  it("accepts PDF with empty MIME but .pdf extension", async () => {
    const file = new File([new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d])], "itinerary.pdf", {
      type: "",
    });

    const result = await validateProductDocumentFile(file, "itinerary");
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.mimeType, "application/pdf");
    }
  });

  it("rejects unsupported file type", async () => {
    const file = new File(["hello"], "notes.txt", { type: "text/plain" });
    const result = await validateProductDocumentFile(file, "itinerary");
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.code, "unsupported");
    }
  });

  it("rejects file over limit", async () => {
    const file = new File([new Uint8Array(PRODUCT_DOCUMENT_MAX_BYTES + 1)], "big.pdf", {
      type: "application/pdf",
    });
    const result = await validateProductDocumentFile(file, "itinerary");
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.code, "too_large");
    }
  });

  it("rejects corrupted PDF header", async () => {
    const file = new File(["not-a-pdf"], "broken.pdf", { type: "application/pdf" });
    const result = await validateProductDocumentFile(file, "itinerary");
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.code, "corrupted_pdf");
    }
  });
});

describe("classifyProductUploadError", () => {
  it("maps permission errors", () => {
    assert.equal(classifyProductUploadError("Permission denied."), "permission");
  });

  it("maps storage errors", () => {
    assert.equal(classifyProductUploadError("Bucket not found"), "storage");
  });

  it("maps network errors", () => {
    assert.equal(
      classifyProductUploadError("An unexpected response was received from the server."),
      "network",
    );
  });
});

describe("validatePdfReadable", () => {
  it("detects valid PDF header", async () => {
    const file = new File([new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d])], "ok.pdf", {
      type: "application/pdf",
    });
    assert.equal(await validatePdfReadable(file), true);
  });
});
