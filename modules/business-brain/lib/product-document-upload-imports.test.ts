import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

import {
  canonicalProductDocumentMimeType,
  PRODUCT_DOCUMENT_CATEGORY_MAX_BYTES,
} from "@/modules/business-brain/lib/product-document-upload-config";

const LIB_DIR = dirname(fileURLToPath(import.meta.url));

function readLibSource(fileName: string): string {
  return readFileSync(join(LIB_DIR, fileName), "utf8");
}

describe("product-document-upload-config", () => {
  it("imports independently with category limits", () => {
    assert.equal(PRODUCT_DOCUMENT_CATEGORY_MAX_BYTES.itinerary, 50 * 1024 * 1024);
    assert.equal(
      canonicalProductDocumentMimeType("itinerary.pdf", "application/vnd.adobe.pdf"),
      "application/pdf",
    );
  });
});

describe("product upload import boundaries", () => {
  it("config module has no validator or runtime imports", () => {
    const source = readLibSource("product-document-upload-config.ts");
    assert.doesNotMatch(source, /validate-product-document-(file|server)/);
    assert.doesNotMatch(source, /product-upload-debug/);
    assert.doesNotMatch(source, /supabase/i);
    assert.doesNotMatch(source, /server-only/);
  });

  it("client validator does not import server validator", async () => {
    const source = readLibSource("validate-product-document-file.ts");
    assert.doesNotMatch(source, /validate-product-document-server/);

    const clientModule = await import("@/modules/business-brain/lib/validate-product-document-file");
    assert.equal(
      (clientModule as Record<string, unknown>).validateProductDocumentUploadServer,
      undefined,
    );
  });

  it("server validator imports successfully", async () => {
    const source = readLibSource("validate-product-document-server.ts");
    assert.doesNotMatch(source, /validate-product-document-file/);
    assert.doesNotMatch(source, /product-upload-debug/);

    const serverModule = await import("@/modules/business-brain/lib/validate-product-document-server");
    assert.equal(typeof serverModule.validateProductDocumentUploadServer, "function");
  });

  it("upload debug imports config only", () => {
    const source = readLibSource("product-upload-debug.ts");
    assert.doesNotMatch(source, /validate-product-document-server/);
    assert.match(source, /product-document-upload-config/);
  });

  it("playground service imports without product upload initialization failure", async () => {
    const playgroundModule = await import(
      "@/modules/business-brain/services/business-brain-playground-service"
    );
    assert.equal(typeof playgroundModule.runTest, "function");
  });
});
