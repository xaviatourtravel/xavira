import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

import { mergeOrganizationSettingsDocument } from "@/modules/organization/branding/lib/branding-settings";
import {
  assertOrganizationScopedLogoPath,
  buildWorkspaceLogoStoragePath,
} from "@/modules/organization/branding/lib/logo-validation";
import { validateWorkspaceLogoBytes } from "@/modules/organization/branding/lib/logo-bytes";

const MIGRATION = path.join(
  process.cwd(),
  "supabase/migrations/20260716100000_workspace_branding.sql",
);
const ROOT = process.cwd();

const PNG = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
]);

describe("FIN-001.3A1 branding authorization hardening", () => {
  const sql = readFileSync(MIGRATION, "utf8");

  it("preserves owner-only organizations UPDATE RLS (does not grant admin generic UPDATE)", () => {
    assert.match(sql, /CREATE POLICY organizations_update_owner/);
    assert.match(sql, /is_org_owner\(\)/);
    assert.doesNotMatch(
      sql,
      /CREATE POLICY organizations_update_admin_or_owner/,
    );
    // Explicitly drops any prior widened policy from earlier drafts
    assert.match(sql, /DROP POLICY IF EXISTS organizations_update_admin_or_owner/);
  });

  it("branding RPC cannot modify unrelated organization fields", () => {
    assert.match(sql, /CREATE OR REPLACE FUNCTION public\.update_workspace_branding/);
    // Allowed columns only
    assert.match(
      sql,
      /SET\s+name = v_name,\s+phone = v_phone,\s+settings = v_settings/,
    );
    assert.doesNotMatch(sql, /o\.slug\s*=/);
    assert.doesNotMatch(sql, /business_type\s*=/);
    assert.doesNotMatch(sql, /plan\s*=/);
    assert.doesNotMatch(sql, /owner_id\s*=/);
    // Never accepts arbitrary settings JSON argument
    assert.doesNotMatch(
      sql,
      /update_workspace_branding\([\s\S]*p_settings\s+jsonb/i,
    );
  });

  it("organization ID is derived from auth.uid() / get_my_organization_id()", () => {
    assert.match(sql, /v_org_id uuid := public\.get_my_organization_id\(\)/);
    assert.match(sql, /auth\.uid\(\)/);
    assert.doesNotMatch(
      sql,
      /update_workspace_branding\(\s*p_organization_id/i,
    );
    assert.doesNotMatch(
      sql,
      /set_workspace_branding_logo\(\s*p_organization_id/i,
    );
  });

  it("RPC merges branding subtree and preserves unrelated settings keys", () => {
    assert.match(sql, /jsonb_set\(v_settings, '\{branding\}'/);
    assert.match(sql, /v_settings - '__proto__'/);
    // firstRun/product never rewritten by RPC
    assert.doesNotMatch(sql, /jsonb_set\(v_settings, '\{firstRun\}'/);
    assert.doesNotMatch(sql, /jsonb_set\(v_settings, '\{product\}'/);
  });

  it("logo finalize RPC only updates logo reference fields", () => {
    assert.match(sql, /CREATE OR REPLACE FUNCTION public\.set_workspace_branding_logo/);
    assert.match(sql, /assert_workspace_logo_path/);
    assert.match(sql, /CREATE OR REPLACE FUNCTION public\.clear_workspace_branding_logo/);
    // Logo RPC updates settings only (no name/slug)
    const logoFn = sql.slice(
      sql.indexOf("CREATE OR REPLACE FUNCTION public.set_workspace_branding_logo"),
      sql.indexOf("CREATE OR REPLACE FUNCTION public.clear_workspace_branding_logo"),
    );
    assert.match(logoFn, /SET\s+settings = v_settings/);
    assert.doesNotMatch(logoFn, /name\s*=/);
    assert.doesNotMatch(logoFn, /slug\s*=/);
  });

  it("grants/revokes are narrow", () => {
    assert.match(
      sql,
      /REVOKE ALL ON FUNCTION public\.update_workspace_branding[\s\S]*FROM PUBLIC/,
    );
    assert.match(
      sql,
      /GRANT EXECUTE ON FUNCTION public\.update_workspace_branding[\s\S]*TO authenticated/,
    );
    assert.match(sql, /REVOKE ALL ON FUNCTION public\.set_workspace_branding_logo/);
    assert.match(sql, /REVOKE ALL ON FUNCTION public\.clear_workspace_branding_logo/);
  });

  it("application merge rejects prototype-pollution keys and preserves siblings", () => {
    const merged = mergeOrganizationSettingsDocument(
      {
        firstRun: { pending: false },
        product: { primaryIndustry: "travel" },
        billingHint: "keep-me",
        branding: { legalName: "Old" },
        __proto__: { polluted: true },
      } as Record<string, unknown>,
      {
        branding: {
          legalName: "New Legal",
          primaryColor: "#112233",
          // @ts-expect-error intentional pollution probe
          __proto__: { x: 1 },
        },
      },
    );
    assert.deepEqual(merged.firstRun, { pending: false });
    assert.deepEqual(merged.product, { primaryIndustry: "travel" });
    assert.equal(merged.billingHint, "keep-me");
    assert.equal((merged.branding as { legalName: string }).legalName, "New Legal");
    assert.equal(
      Object.prototype.hasOwnProperty.call(merged, "__proto__"),
      false,
    );
  });

  it("logo finalize cannot attach another workspace path", () => {
    const orgA = "22222222-2222-4222-8222-222222222222";
    const orgB = "33333333-3333-4333-8333-333333333333";
    const hash = "b".repeat(64);
    const pathA = buildWorkspaceLogoStoragePath({
      organizationId: orgA,
      contentHash: hash,
      mimeType: "image/png",
    });
    assert.equal(assertOrganizationScopedLogoPath(pathA, orgA), true);
    assert.equal(assertOrganizationScopedLogoPath(pathA, orgB), false);

    const service = readFileSync(
      path.join(ROOT, "modules/organization/branding/services/branding-service.ts"),
      "utf8",
    );
    assert.match(service, /Reject cross-workspace paths before any Storage access/);
    assert.match(service, /rpcSetWorkspaceBrandingLogo/);
    assert.match(service, /Recompute magic\/MIME\/hash from stored bytes/);
  });

  it("service-role imports are server-only and not used for arbitrary org updates", () => {
    const repo = readFileSync(
      path.join(ROOT, "modules/organization/branding/repositories/branding-repository.ts"),
      "utf8",
    );
    assert.doesNotMatch(repo, /createAdminClient/);
    assert.doesNotMatch(repo, /\.from\("organizations"\)\s*\.update/);
    assert.match(repo, /rpc\("update_workspace_branding"/);
    assert.match(repo, /rpc\("set_workspace_branding_logo"/);
    assert.match(repo, /rpc\("clear_workspace_branding_logo"/);

    const storage = readFileSync(
      path.join(ROOT, "modules/organization/branding/lib/logo-storage.ts"),
      "utf8",
    );
    assert.match(storage, /createAdminClient/);
    assert.match(storage, /There is no generic organization table update helper/);
    assert.doesNotMatch(storage, /\.from\("organizations"\)/);

    const form = readFileSync(
      path.join(
        ROOT,
        "modules/organization/branding/components/workspace-branding-form.tsx",
      ),
      "utf8",
    );
    assert.doesNotMatch(form, /createAdminClient|SERVICE_ROLE|service_role/);
  });

  it("client hash is recomputed and verified server-side", () => {
    const ok = validateWorkspaceLogoBytes({
      buffer: PNG,
      declaredMimeType: "image/png",
    });
    assert.equal(ok.ok, true);
    if (ok.ok) {
      assert.match(ok.contentHash, /^[a-f0-9]{64}$/);
    }
    const service = readFileSync(
      path.join(ROOT, "modules/organization/branding/services/branding-service.ts"),
      "utf8",
    );
    assert.match(service, /HASH_MISMATCH/);
    assert.match(service, /bytesCheck\.contentHash/);
  });

  it("duplicate finalize is idempotent and remove only clears logo refs", () => {
    assert.match(sql, /Idempotent: same path\+hash already set/);
    assert.match(sql, /clear_workspace_branding_logo/);
    const clearFn = sql.slice(
      sql.indexOf("CREATE OR REPLACE FUNCTION public.clear_workspace_branding_logo"),
      sql.indexOf("CREATE OR REPLACE FUNCTION public.build_invoice_company_snapshot"),
    );
    assert.match(clearFn, /logoPath/);
    assert.match(clearFn, /logoStorageRef/);
    assert.doesNotMatch(clearFn, /legalName/);
    assert.doesNotMatch(clearFn, /primaryColor/);
  });

  it("private logo cannot be directly read cross-workspace", () => {
    assert.match(sql, /public = false/);
    assert.doesNotMatch(
      sql,
      /CREATE POLICY[\s\S]{0,80}workspace-brand-assets[\s\S]{0,80}FOR SELECT/i,
    );
    const storage = readFileSync(
      path.join(ROOT, "modules/organization/branding/lib/logo-storage.ts"),
      "utf8",
    );
    assert.match(storage, /assertOrganizationScopedLogoPath/);
    assert.match(storage, /expiresInSeconds = 900/);
  });
});
