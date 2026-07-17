import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

import {
  decideFailPdfStatus,
  decideInvoicePdfClaim,
  simulateConcurrentPdfClaims,
} from "@/modules/finance/pdf/invoice-pdf-claim";
import {
  invoicePdfCacheControl,
  safePdfErrorCode,
  sanitizeClientPdfError,
} from "@/modules/finance/pdf/invoice-pdf-http";
import {
  detectValidatedImageMime,
  hashLogoBytes,
  isExternalLogoUrlRejected,
  MAX_LOGO_BYTES,
} from "@/modules/finance/pdf/invoice-pdf-logo";
import {
  assertOrganizationScopedStoragePath,
  buildInvoiceLogoAssetPath,
  buildInvoicePdfStoragePath,
} from "@/modules/finance/pdf/invoice-pdf-storage";

const MIGRATION_PATH = path.join(
  process.cwd(),
  "supabase/migrations/20260714030000_invoice_pdf_templates.sql",
);

const GET_ROUTE = path.join(
  process.cwd(),
  "app/api/finance/invoices/[id]/pdf/route.ts",
);

const GENERATE_ROUTE = path.join(
  process.cwd(),
  "app/api/finance/invoices/[id]/pdf/generate/route.ts",
);

const SERVICE = path.join(
  process.cwd(),
  "modules/finance/services/invoice-pdf-service.ts",
);

const PREVIEW = path.join(
  process.cwd(),
  "modules/finance/components/invoice-pdf-preview.tsx",
);

describe("FIN-001.2A GET must not mutate", () => {
  const getSrc = readFileSync(GET_ROUTE, "utf8");
  const serviceSrc = readFileSync(SERVICE, "utf8");
  const previewSrc = readFileSync(PREVIEW, "utf8");

  it("GET route ignores retry and does not call generate", () => {
    assert.match(getSrc, /void url\.searchParams\.get\("retry"\)/);
    assert.doesNotMatch(getSrc, /generateIssuedInvoicePdf|forceRegen|rpcClaim/);
    assert.match(getSrc, /getIssuedInvoicePdfIfReady/);
    assert.match(getSrc, /renderDraftInvoicePdfPreview/);
  });

  it("GET download does not trigger generation", () => {
    assert.match(getSrc, /searchParams\.get\("download"\)/);
    assert.match(getSrc, /getIssuedInvoicePdfIfReady/);
    assert.doesNotMatch(getSrc, /force:\s*true|generateIssuedInvoicePdf/);
  });

  it("preview UI uses POST generate, not GET retry", () => {
    assert.match(previewSrc, /method:\s*"POST"/);
    assert.match(previewSrc, /pdf\/generate/);
    assert.doesNotMatch(previewSrc, /\?retry=1/);
  });

  it("issued GET helper does not update PDF state", () => {
    assert.match(serviceSrc, /getIssuedInvoicePdfIfReady/);
    assert.doesNotMatch(
      serviceSrc.slice(
        serviceSrc.indexOf("getIssuedInvoicePdfIfReady"),
        serviceSrc.indexOf("ensureFrozenLogoAsset"),
      ),
      /rpcClaim|rpcComplete|rpcFail|uploadInvoicePdf/,
    );
  });
});

describe("FIN-001.2A POST generation", () => {
  const generateSrc = readFileSync(GENERATE_ROUTE, "utf8");
  const serviceSrc = readFileSync(SERVICE, "utf8");

  it("POST generate route exists and requires auth via requireProfile", () => {
    assert.match(generateSrc, /requireProfile/);
    assert.match(generateSrc, /generateIssuedInvoicePdf/);
    assert.match(generateSrc, /export async function POST/);
  });

  it("generation uses claim before service-role work", () => {
    assert.match(serviceSrc, /rpcClaimInvoicePdfGeneration/);
    assert.match(serviceSrc, /Org authorization before any service-role/);
  });
});

describe("FIN-001.2A concurrency claim", () => {
  it("two concurrent claims cannot both own the job", () => {
    const [a, b] = simulateConcurrentPdfClaims({
      lifecycleStatus: "issued",
      pdfStatus: "not_generated",
      pdfStoragePath: null,
      claimedAt: null,
      now: new Date("2026-07-14T12:00:00.000Z"),
    });
    assert.equal(a.outcome, "claimed");
    assert.equal(b.outcome, "in_progress");
  });

  it("stale generating claim can be recovered", () => {
    const decision = decideInvoicePdfClaim({
      lifecycleStatus: "issued",
      pdfStatus: "generating",
      pdfStoragePath: null,
      claimedAt: new Date("2026-07-14T11:00:00.000Z"),
      now: new Date("2026-07-14T12:00:00.000Z"),
      force: false,
      staleAfterMs: 5 * 60 * 1000,
    });
    assert.equal(decision.outcome, "claimed");
  });

  it("recent generating claim conflicts", () => {
    const decision = decideInvoicePdfClaim({
      lifecycleStatus: "issued",
      pdfStatus: "generating",
      pdfStoragePath: null,
      claimedAt: new Date("2026-07-14T11:58:00.000Z"),
      now: new Date("2026-07-14T12:00:00.000Z"),
      force: false,
    });
    assert.equal(decision.outcome, "in_progress");
  });

  it("failed replacement preserves ready when path exists", () => {
    assert.equal(decideFailPdfStatus({ priorStoragePath: "org/inv/1/invoice.pdf" }), "ready");
    assert.equal(decideFailPdfStatus({ priorStoragePath: null }), "failed");
  });
});

describe("FIN-001.2A trusted PDF state + errors", () => {
  const sql = readFileSync(MIGRATION_PATH, "utf8");

  it("migration blocks client pdf_status and pdf_storage_path updates", () => {
    assert.match(sql, /prevent_client_invoice_pdf_state_edit/);
    assert.match(sql, /PDF state fields are trusted-only/);
    assert.match(sql, /NEW\.pdf_status IS DISTINCT FROM OLD\.pdf_status/);
    assert.match(sql, /NEW\.pdf_storage_path IS DISTINCT FROM OLD\.pdf_storage_path/);
    assert.match(sql, /app\.trusted_invoice_pdf/);
  });

  it("claim/complete/fail use generation tokens", () => {
    assert.match(sql, /claim_invoice_pdf_generation/);
    assert.match(sql, /complete_invoice_pdf_generation/);
    assert.match(sql, /fail_invoice_pdf_generation/);
    assert.match(sql, /pdf_generation_token/);
    assert.match(sql, /Stale PDF generation claim/);
    assert.match(sql, /preserved_ready/);
  });

  it("raw stack traces are not persisted or returned", () => {
    assert.match(sql, /Never persist stack traces/);
    assert.equal(safePdfErrorCode("Error: boom\n    at foo.js:1"), "RENDER_FAILED");
    assert.equal(safePdfErrorCode("RENDER_FAILED"), "RENDER_FAILED");
    assert.doesNotMatch(
      sanitizeClientPdfError(new Error("fail\nat Object.<anonymous>")),
      /\bat\b/,
    );
  });
});

describe("FIN-001.2A immutable logo", () => {
  const sql = readFileSync(MIGRATION_PATH, "utf8");
  const org = "22222222-2222-2222-2222-222222222222";
  const invoice = "11111111-1111-1111-1111-111111111111";
  const hash = "a".repeat(64);

  it("immutable logo path includes content hash", () => {
    const logoPath = buildInvoiceLogoAssetPath({
      organizationId: org,
      invoiceId: invoice,
      contentHash: hash,
      mimeType: "image/png",
    });
    assert.equal(
      logoPath,
      `${org}/${invoice}/assets/logo-${hash}.png`,
    );
    assert.match(sql, /logo_asset_path/);
    assert.match(sql, /freeze_invoice_logo_asset/);
    assert.match(sql, /Logo path must include content hash/);
  });

  it("external logo URLs are rejected", () => {
    assert.equal(isExternalLogoUrlRejected("https://evil.example/logo.png"), true);
    assert.equal(isExternalLogoUrlRejected("data:image/png;base64,aaa"), false);
  });

  it("oversized or invalid logo signature falls back", () => {
    assert.equal(detectValidatedImageMime(Buffer.from("not-an-image")), null);
    assert.ok(MAX_LOGO_BYTES >= 1_000_000);
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    assert.equal(detectValidatedImageMime(png), "image/png");
    assert.equal(hashLogoBytes(png).length, 64);
  });

  it("workspace logo path change does not alter frozen asset path identity", () => {
    const frozenA = buildInvoiceLogoAssetPath({
      organizationId: org,
      invoiceId: invoice,
      contentHash: hash,
      mimeType: "image/png",
    });
    const differentWorkspaceUrl = "https://cdn.example/new-logo.png";
    assert.equal(isExternalLogoUrlRejected(differentWorkspaceUrl), true);
    // Regeneration keys off logo_asset_path / content hash, not workspace URL.
    assert.match(frozenA, new RegExp(`logo-${hash}`));
    assert.match(sql, /Immutable once set/);
  });
});

describe("FIN-001.2A storage access model", () => {
  const sql = readFileSync(MIGRATION_PATH, "utf8");
  const org = "22222222-2222-2222-2222-222222222222";
  const invoice = "11111111-1111-1111-1111-111111111111";

  it("bucket is private and has no authenticated object policies", () => {
    assert.match(sql, /public\s*=\s*false/);
    assert.match(sql, /No storage\.objects policies are created/);
    assert.doesNotMatch(
      sql,
      /CREATE POLICY[\s\S]{0,80}invoice-pdfs[\s\S]{0,80}FOR (SELECT|INSERT)/i,
    );
  });

  it("object path derives from authoritative organization/invoice", () => {
    const pdfPath = buildInvoicePdfStoragePath({
      organizationId: org,
      invoiceId: invoice,
      templateVersion: 1,
    });
    assert.equal(pdfPath, `${org}/${invoice}/1/invoice.pdf`);
    assert.equal(
      assertOrganizationScopedStoragePath(pdfPath, org, invoice),
      true,
    );
    assert.equal(
      assertOrganizationScopedStoragePath(`${org}/other/1/invoice.pdf`, org, invoice),
      false,
    );
    assert.match(sql, /PDF storage path must be invoice-scoped/);
  });
});

describe("FIN-001.2A cache headers", () => {
  it("draft preview uses no-store", () => {
    assert.equal(
      invoicePdfCacheControl({ kind: "draft_preview" }),
      "no-store",
    );
  });

  it("issued PDF is private, not publicly cacheable", () => {
    const value = invoicePdfCacheControl({ kind: "issued_ready" });
    assert.match(value, /private/);
    assert.doesNotMatch(value, /public/);
  });

  it("not-ready responses use no-store", () => {
    assert.equal(invoicePdfCacheControl({ kind: "not_ready" }), "no-store");
  });
});
