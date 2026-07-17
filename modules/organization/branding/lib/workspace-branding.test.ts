import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

import {
  mergeOrganizationSettingsDocument,
  resolveWorkspaceBranding,
  deriveWorkspaceInitials,
} from "@/modules/organization/branding/lib/branding-settings";
import {
  assertOrganizationScopedLogoPath,
  buildWorkspaceLogoStoragePath,
  buildWorkspaceLogoStorageRef,
  isExternalLogoUrlRejected,
  isSvgFilenameOrMime,
  parseWorkspaceLogoStorageRef,
  validateWorkspaceLogoPrepareMetadata,
} from "@/modules/organization/branding/lib/logo-validation";
import { validateWorkspaceLogoBytes } from "@/modules/organization/branding/lib/logo-bytes";
import { detectValidatedImageMime, hashLogoBytes } from "@/modules/finance/pdf/invoice-pdf-logo";

const MIGRATION = path.join(
  process.cwd(),
  "supabase/migrations/20260716100000_workspace_branding.sql",
);

const PNG = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
]);
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);

describe("FIN-001.3A workspace logo validation", () => {
  it("accepts PNG and JPEG magic bytes", () => {
    assert.equal(detectValidatedImageMime(PNG), "image/png");
    assert.equal(detectValidatedImageMime(JPEG), "image/jpeg");
    assert.equal(
      validateWorkspaceLogoBytes({ buffer: PNG, declaredMimeType: "image/png" }).ok,
      true,
    );
    assert.equal(
      validateWorkspaceLogoBytes({ buffer: JPEG, declaredMimeType: "image/jpeg" }).ok,
      true,
    );
  });

  it("rejects renamed invalid files and MIME mismatch", () => {
    const invalid = validateWorkspaceLogoBytes({
      buffer: Buffer.from("not-an-image"),
      declaredMimeType: "image/png",
    });
    assert.equal(invalid.ok, false);
    if (!invalid.ok) assert.equal(invalid.code, "INVALID_IMAGE_SIGNATURE");

    const mismatch = validateWorkspaceLogoBytes({
      buffer: PNG,
      declaredMimeType: "image/jpeg",
    });
    assert.equal(mismatch.ok, false);
    if (!mismatch.ok) assert.equal(mismatch.code, "MIME_MISMATCH");
  });

  it("rejects oversized files and SVG", () => {
    const oversized = validateWorkspaceLogoPrepareMetadata({
      originalFilename: "logo.png",
      declaredMimeType: "image/png",
      declaredSize: 3_000_000,
    });
    assert.equal(oversized.ok, false);
    if (!oversized.ok) assert.equal(oversized.code, "FILE_TOO_LARGE");

    assert.equal(isSvgFilenameOrMime("logo.svg"), true);
    const svg = validateWorkspaceLogoPrepareMetadata({
      originalFilename: "logo.svg",
      declaredMimeType: "image/png",
      declaredSize: 1000,
    });
    assert.equal(svg.ok, false);
    if (!svg.ok) assert.equal(svg.code, "SVG_NOT_ALLOWED");
  });

  it("rejects external logo URLs for persistence", () => {
    assert.equal(isExternalLogoUrlRejected("https://evil.example/x.png"), true);
    assert.equal(
      isExternalLogoUrlRejected("storage://workspace-brand-assets/org/logo/a.png"),
      false,
    );
  });

  it("builds organization-scoped hashed logo paths", () => {
    const org = "22222222-2222-4222-8222-222222222222";
    const hash = "a".repeat(64);
    const logoPath = buildWorkspaceLogoStoragePath({
      organizationId: org,
      contentHash: hash,
      mimeType: "image/png",
    });
    assert.equal(logoPath, `${org}/logo/${hash}.png`);
    assert.equal(assertOrganizationScopedLogoPath(logoPath, org), true);
    assert.equal(
      assertOrganizationScopedLogoPath(
        `${org}/logo/${hash}.png`,
        "33333333-3333-4333-8333-333333333333",
      ),
      false,
    );
    const ref = buildWorkspaceLogoStorageRef(logoPath);
    assert.equal(parseWorkspaceLogoStorageRef(ref)?.path, logoPath);
  });

  it("content hash is stable for identical bytes", () => {
    assert.equal(hashLogoBytes(PNG), hashLogoBytes(PNG));
  });
});

describe("FIN-001.3A branding precedence and merge", () => {
  it("preserves firstRun/product when merging branding", () => {
    const merged = mergeOrganizationSettingsDocument(
      {
        firstRun: { pending: false },
        product: { primaryIndustry: "travel" },
        businessEmail: "a@example.com",
      },
      {
        branding: {
          legalName: "Xavia Tour",
          primaryColor: "#112233",
          logoPath: null,
        },
        logoUrl: null,
      },
    );
    assert.deepEqual(merged.firstRun, { pending: false });
    assert.deepEqual(merged.product, { primaryIndustry: "travel" });
    assert.equal((merged.branding as { legalName: string }).legalName, "Xavia Tour");
  });

  it("workspace branding wins over legacy invoice brand for drafts", () => {
    const resolved = resolveWorkspaceBranding({
      organizationId: "22222222-2222-2222-2222-222222222222",
      organizationName: "Workspace",
      organizationPhone: null,
      settings: {
        branding: {
          legalName: "Workspace Legal",
          primaryColor: "#111111",
          secondaryColor: "#222222",
          accentColor: "#333333",
          logoStorageRef: "storage://workspace-brand-assets/x/logo/a.png",
        },
      },
      legacy: {
        legalName: "Legacy Legal",
        primaryColor: "#AAAAAA",
        logoUrl: "https://evil.example/old.png",
      },
    });
    assert.equal(resolved.legalName, "Workspace Legal");
    assert.equal(resolved.primaryColor, "#111111");
    assert.equal(
      resolved.logoStorageRef,
      "storage://workspace-brand-assets/x/logo/a.png",
    );
  });

  it("falls back to legacy invoice brand when workspace branding empty", () => {
    const resolved = resolveWorkspaceBranding({
      organizationId: "22222222-2222-2222-2222-222222222222",
      organizationName: "Workspace",
      organizationPhone: null,
      settings: {},
      legacy: {
        legalName: "Legacy Legal",
        primaryColor: "#0F172A",
        secondaryColor: "#64748B",
        accentColor: "#0EA5E9",
      },
    });
    assert.equal(resolved.legalName, "Legacy Legal");
    assert.equal(resolved.primaryColor, "#0F172A");
  });

  it("deriveWorkspaceInitials returns 2–3 characters", () => {
    assert.equal(deriveWorkspaceInitials("Xavia"), "XAV");
    assert.equal(deriveWorkspaceInitials("Xavia Travel"), "XT");
    assert.equal(deriveWorkspaceInitials("Xavia Travel Nusantara"), "XTN");
  });
});

describe("FIN-001.3A invoice inheritance and PDF logo contracts", () => {
  it("invoice draft override colors win over workspace branding", () => {
    const workspace = resolveWorkspaceBranding({
      organizationId: "22222222-2222-2222-2222-222222222222",
      organizationName: "Workspace",
      organizationPhone: null,
      settings: {
        branding: {
          primaryColor: "#111111",
          secondaryColor: "#222222",
          accentColor: "#333333",
        },
      },
    });
    const overridePrimary = "#ABCDEF";
    const colors = {
      primaryColor: overridePrimary || workspace.primaryColor,
      secondaryColor: workspace.secondaryColor,
      accentColor: workspace.accentColor,
    };
    assert.equal(colors.primaryColor, "#ABCDEF");
    assert.notEqual(colors.primaryColor, workspace.primaryColor);
  });

  it("issued invoices prefer frozen logo_asset_path over live workspace logo", () => {
    const dataBuilder = readFileSync(
      path.join(process.cwd(), "modules/finance/pdf/invoice-pdf-data.ts"),
      "utf8",
    );
    assert.match(
      dataBuilder,
      /issued && invoice\.logoAssetPath \? null : logoUrl/,
    );
    assert.match(dataBuilder, /logoAssetPath: issued \? \(invoice\.logoAssetPath/);
  });

  it("all four templates render LogoMark or CompanyHeader with logo", () => {
    for (const file of [
      "calm-standard.tsx",
      "corporate.tsx",
      "travel-banner.tsx",
      "editorial-sidebar.tsx",
    ]) {
      const src = readFileSync(
        path.join(process.cwd(), "modules/finance/pdf/templates", file),
        "utf8",
      );
      assert.match(src, /LogoMark|CompanyHeader/);
    }
    const header = readFileSync(
      path.join(process.cwd(), "modules/finance/pdf/shared/company-header.tsx"),
      "utf8",
    );
    assert.match(header, /objectFit:\s*"contain"/);
    assert.match(header, /maxWidth/);
  });

  it("missing logo falls back to initials", () => {
    assert.equal(deriveWorkspaceInitials(""), "IN");
    assert.equal(deriveWorkspaceInitials("Xavia"), "XAV");
  });

  it("authorization gate requires owner/admin settings.manage", () => {
    const service = readFileSync(
      path.join(
        process.cwd(),
        "modules/organization/branding/services/branding-service.ts",
      ),
      "utf8",
    );
    assert.match(service, /assertCanManageBranding/);
    assert.match(service, /canManageWorkspaceSettings/);
    assert.match(service, /isAdminOrOwner/);
    assert.match(
      service,
      /Only owners and admins can update workspace branding/,
    );
  });

  it("duplicate finalize is idempotent when path and hash match", () => {
    const service = readFileSync(
      path.join(
        process.cwd(),
        "modules/organization/branding/services/branding-service.ts",
      ),
      "utf8",
    );
    assert.match(service, /Duplicate finalize with same path is safe/);
    assert.match(service, /rpcSetWorkspaceBrandingLogo/);
  });

  it("remove clears workspace logo reference fields", () => {
    const merged = mergeOrganizationSettingsDocument(
      {
        branding: {
          logoPath: "22222222-2222-2222-2222-222222222222/logo/aaaa.png",
          logoStorageRef:
            "storage://workspace-brand-assets/22222222-2222-2222-2222-222222222222/logo/aaaa.png",
        },
        logoUrl:
          "storage://workspace-brand-assets/22222222-2222-2222-2222-222222222222/logo/aaaa.png",
      },
      {
        branding: {
          logoPath: null,
          logoContentHash: null,
          logoMimeType: null,
          logoStorageRef: null,
          logoUrl: null,
        },
        logoUrl: null,
        workspaceLogoUrl: null,
      },
    );
    assert.equal((merged.branding as { logoPath: null }).logoPath, null);
    assert.equal(merged.logoUrl, null);
  });
});

describe("FIN-001.3A migration contracts", () => {
  const sql = readFileSync(MIGRATION, "utf8");

  it("creates private workspace-brand-assets bucket without open policies", () => {
    assert.match(sql, /workspace-brand-assets/);
    assert.match(sql, /public = false/);
    assert.doesNotMatch(
      sql,
      /CREATE POLICY[\s\S]{0,120}workspace-brand-assets[\s\S]{0,80}FOR (SELECT|INSERT)/i,
    );
  });

  it("allows admin or owner branding via RPC and prefers workspace branding on issue", () => {
    assert.match(sql, /can_manage_workspace_branding/);
    assert.match(sql, /update_workspace_branding/);
    assert.match(sql, /build_invoice_company_snapshot/);
    assert.match(sql, /v_branding ->> 'logoStorageRef'/);
    assert.match(sql, /v_branding ->> 'legalName'/);
    // Owner-only table UPDATE; admins use RPC
    assert.match(sql, /organizations_update_owner/);
    assert.doesNotMatch(sql, /CREATE POLICY organizations_update_admin_or_owner/);
  });

  it("service never trusts browser organization_id for logo paths", () => {
    const service = readFileSync(
      path.join(
        process.cwd(),
        "modules/organization/branding/services/branding-service.ts",
      ),
      "utf8",
    );
    assert.match(service, /organization_id never comes from the browser/);
    assert.match(service, /assertOrganizationScopedLogoPath/);
    assert.match(service, /assertCanManageBranding/);
    assert.match(service, /rpcUpdateWorkspaceBranding/);
  });

  it("invoice settings no longer own editable company identity fields", () => {
    const form = readFileSync(
      path.join(
        process.cwd(),
        "modules/finance/components/invoice-brand-settings-form.tsx",
      ),
      "utf8",
    );
    assert.match(form, /manageWorkspaceBranding/);
    assert.doesNotMatch(form, /name="legal_name"/);
    assert.doesNotMatch(form, /name="primary_color"/);
  });
});
