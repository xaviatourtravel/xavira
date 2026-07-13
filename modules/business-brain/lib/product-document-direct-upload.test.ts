import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

import {
  buildProductDocumentStoragePath,
  isProductDocumentStoragePathScoped,
  isSafeOriginalFilename,
  validateProductDocumentPrepareMetadata,
} from "@/modules/business-brain/lib/product-document-upload-path";
import { mapServerUploadErrorToUi } from "@/modules/business-brain/lib/product-document-upload-errors";
import { classifyProductUploadError } from "@/modules/business-brain/lib/validate-product-document-file";

const HOOK_PATH = join(
  dirname(fileURLToPath(import.meta.url)),
  "../hooks/use-product-document-upload.ts",
);

describe("product document direct upload path safety", () => {
  it("returns UUID-scoped safe storage paths", () => {
    const path = buildProductDocumentStoragePath(
      "org-1",
      "prod-1",
      "11111111-1111-4111-8111-111111111111",
      "FEB 7D4N Tokyo (Final).PDF",
    );
    assert.equal(
      path,
      "org-1/prod-1/11111111-1111-4111-8111-111111111111-feb-7d4n-tokyo-final.pdf",
    );
  });

  it("rejects path traversal filenames during prepare validation", () => {
    const result = validateProductDocumentPrepareMetadata({
      originalFilename: "../escape.pdf",
      declaredMimeType: "application/pdf",
      declaredSize: 1024,
      documentType: "itinerary",
    });
    assert.equal(result.ok, false);
  });

  it("rejects oversized declared metadata", () => {
    const result = validateProductDocumentPrepareMetadata({
      originalFilename: "big.pdf",
      declaredMimeType: "application/pdf",
      declaredSize: 51 * 1024 * 1024,
      documentType: "itinerary",
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.code, "FILE_TOO_LARGE");
    }
  });

  it("normalizes PDF MIME aliases during prepare validation", () => {
    const result = validateProductDocumentPrepareMetadata({
      originalFilename: "itinerary.pdf",
      declaredMimeType: "application/vnd.adobe.pdf",
      declaredSize: 1024,
      documentType: "itinerary",
    });
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.mimeType, "application/pdf");
    }
  });

  it("accepts only organization/product scoped paths", () => {
    const orgId = "59ab30e5-d9de-4ae7-b387-16e352ef2ec9";
    const productId = "9051c003-1eca-44ae-970e-e8123d03534a";
    const validPath = buildProductDocumentStoragePath(
      orgId,
      productId,
      "22222222-2222-4222-8222-222222222222",
      "itinerary.pdf",
    );
    assert.equal(isProductDocumentStoragePathScoped(validPath, orgId, productId), true);
    assert.equal(isProductDocumentStoragePathScoped(validPath, orgId, "other-product"), false);
    assert.equal(
      isProductDocumentStoragePathScoped(`${orgId}/other-product/x.pdf`, orgId, productId),
      false,
    );
  });

  it("produces different paths for the same original filename", () => {
    const first = buildProductDocumentStoragePath(
      "org",
      "prod",
      "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      "same-name.pdf",
    );
    const second = buildProductDocumentStoragePath(
      "org",
      "prod",
      "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      "same-name.pdf",
    );
    assert.notEqual(first, second);
  });

  it("rejects unsafe original filenames", () => {
    assert.equal(isSafeOriginalFilename("good file.pdf"), true);
    assert.equal(isSafeOriginalFilename("../bad.pdf"), false);
    assert.equal(isSafeOriginalFilename("folder/file.pdf"), false);
  });
});

describe("product document direct upload error mapping", () => {
  it("maps direct storage failures to direct_upload UI bucket", () => {
    assert.equal(mapServerUploadErrorToUi("DIRECT_UPLOAD_FAILED"), "direct_upload");
    assert.equal(
      classifyProductUploadError("upload failed", "DIRECT_UPLOAD_FAILED"),
      "direct_upload",
    );
  });

  it("maps size-limit failures to too_large UI bucket", () => {
    assert.equal(classifyProductUploadError("File exceeds upload size limit.", "FILE_TOO_LARGE"), "too_large");
  });

  it("uses network UI bucket only for transport failures", () => {
    assert.equal(
      classifyProductUploadError("An unexpected response was received from the server."),
      "network",
    );
    assert.equal(
      classifyProductUploadError("Failed to fetch", "DIRECT_UPLOAD_FAILED"),
      "direct_upload",
    );
  });
});

describe("product document client transport", () => {
  it("does not send File bytes through Server Action FormData", () => {
    const source = readFileSync(HOOK_PATH, "utf8");
    assert.doesNotMatch(source, /formData\.set\("file"/);
    assert.match(source, /prepareProductDocumentUploadAction/);
    assert.match(source, /uploadProductDocumentToSignedUrl/);
    assert.match(source, /finalizeProductDocumentUploadAction/);
    assert.doesNotMatch(source, /onProgress/);
    assert.match(source, /progressIndeterminate:\s*true/);
  });
});
