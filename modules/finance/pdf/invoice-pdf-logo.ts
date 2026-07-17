import { createHash } from "node:crypto";

import { createAdminClient } from "@/utils/supabase/admin";

import {
  INVOICE_PDF_BUCKET,
  buildInvoiceLogoAssetPath,
  downloadInvoicePdfFromStorage,
  uploadInvoiceLogoAsset,
} from "@/modules/finance/pdf/invoice-pdf-storage";
import { companyInitialsForPdf } from "@/modules/finance/pdf/invoice-pdf-labels";
import { WORKSPACE_BRAND_BUCKET } from "@/modules/organization/branding/types";
import {
  assertOrganizationScopedLogoPath,
  parseWorkspaceLogoStorageRef,
} from "@/modules/organization/branding/lib/logo-validation";
import { downloadWorkspaceLogoObject } from "@/modules/organization/branding/lib/logo-storage";

export const MAX_LOGO_BYTES = 2_000_000;

export type InvoiceLogoImage = {
  kind: "image";
  dataUrl: string;
  mimeType: "image/png" | "image/jpeg";
  bytes: Buffer;
  contentHash: string;
};

export type InvoiceLogoInitials = {
  kind: "initials";
  initials: string;
};

export type InvoiceLogoResult = InvoiceLogoImage | InvoiceLogoInitials;

export function companyInitials(name: string): string {
  return companyInitialsForPdf(name);
}

function isSvgMimeOrPath(value: string): boolean {
  return (
    value.toLowerCase().includes("image/svg") ||
    value.toLowerCase().endsWith(".svg")
  );
}

/** PNG / JPEG magic-byte validation only. */
export function detectValidatedImageMime(
  buffer: Buffer,
): "image/png" | "image/jpeg" | null {
  if (buffer.length < 3) return null;
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return "image/png";
  }
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }
  return null;
}

export function hashLogoBytes(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}

export function isExternalLogoUrlRejected(source: string): boolean {
  const trimmed = source.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith("storage://")) return false;
  if (trimmed.startsWith("data:image/png;base64,")) return false;
  if (trimmed.startsWith("data:image/jpeg;base64,")) return false;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl && trimmed.startsWith(supabaseUrl)) return false;
  // absolute http(s) that aren't our storage project
  if (/^https?:\/\//i.test(trimmed)) return true;
  return false;
}

function imageFromBuffer(buffer: Buffer): InvoiceLogoImage | null {
  if (buffer.length === 0 || buffer.length > MAX_LOGO_BYTES) return null;
  const mime = detectValidatedImageMime(buffer);
  if (!mime) return null;
  return {
    kind: "image",
    dataUrl: `data:${mime};base64,${buffer.toString("base64")}`,
    mimeType: mime,
    bytes: buffer,
    contentHash: hashLogoBytes(buffer),
  };
}

async function downloadOrgOwnedStorageObject(params: {
  organizationId: string;
  sourceUrl: string;
}): Promise<Buffer | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl || !params.sourceUrl.startsWith(supabaseUrl)) {
    return null;
  }

  const marker = "/storage/v1/object/public/";
  const signMarker = "/storage/v1/object/sign/";
  let remainder = "";
  if (params.sourceUrl.includes(marker)) {
    remainder = params.sourceUrl.split(marker)[1] ?? "";
  } else if (params.sourceUrl.includes(signMarker)) {
    remainder = (params.sourceUrl.split(signMarker)[1] ?? "").split("?")[0] ?? "";
  } else {
    return null;
  }

  const [bucket, ...parts] = remainder.split("/").map(decodeURIComponent);
  if (!bucket || parts.length === 0) return null;
  const objectPath = parts.join("/");

  const first = parts[0] ?? "";
  if (
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      first,
    ) &&
    first !== params.organizationId
  ) {
    return null;
  }

  // Never read private invoice-pdfs / workspace-brand by guessed public URL.
  if (bucket === INVOICE_PDF_BUCKET || bucket === WORKSPACE_BRAND_BUCKET) {
    return null;
  }

  const admin = createAdminClient();
  const { data, error } = await admin.storage.from(bucket).download(objectPath);
  if (error || !data) return null;
  return Buffer.from(await data.arrayBuffer());
}

/**
 * Load logo for draft previews from company snapshot URL (org-owned only).
 * Rejects arbitrary external URLs. Falls back to initials.
 */
export async function loadInvoiceLogoForPdf(params: {
  organizationId: string;
  logoUrl: string | null;
  fallbackName: string;
  /** Immutable path already frozen for this invoice (preferred for issued). */
  logoAssetPath?: string | null;
}): Promise<InvoiceLogoResult> {
  const initials: InvoiceLogoInitials = {
    kind: "initials",
    initials: companyInitials(params.fallbackName),
  };

  if (params.logoAssetPath) {
    const frozen = await downloadInvoicePdfFromStorage(
      params.logoAssetPath,
      params.organizationId,
    );
    if (frozen) {
      return imageFromBuffer(frozen) ?? initials;
    }
    return initials;
  }

  const source = params.logoUrl?.trim();
  if (!source) return initials;
  if (isSvgMimeOrPath(source)) return initials;
  if (isExternalLogoUrlRejected(source)) return initials;

  const workspaceRef = parseWorkspaceLogoStorageRef(source);
  if (workspaceRef) {
    try {
      if (
        !assertOrganizationScopedLogoPath(
          workspaceRef.path,
          params.organizationId,
        )
      ) {
        return initials;
      }
      const buffer = await downloadWorkspaceLogoObject(
        workspaceRef.path,
        params.organizationId,
      );
      if (!buffer) return initials;
      return imageFromBuffer(buffer) ?? initials;
    } catch {
      return initials;
    }
  }

  if (
    source.startsWith("data:image/png;base64,") ||
    source.startsWith("data:image/jpeg;base64,")
  ) {
    const base64 = source.split(",")[1] ?? "";
    if (!base64) return initials;
    try {
      const buffer = Buffer.from(base64, "base64");
      return imageFromBuffer(buffer) ?? initials;
    } catch {
      return initials;
    }
  }

  try {
    const buffer = await downloadOrgOwnedStorageObject({
      organizationId: params.organizationId,
      sourceUrl: source,
    });
    if (!buffer) return initials;
    return imageFromBuffer(buffer) ?? initials;
  } catch {
    return initials;
  }
}

/**
 * Copy a validated logo into a versioned private invoice asset path.
 * Returns null when missing/invalid — caller falls back to initials.
 * Does not accept browser-supplied path/bytes.
 */
export async function materializeImmutableInvoiceLogo(params: {
  organizationId: string;
  invoiceId: string;
  logoUrl: string | null;
  fallbackName: string;
}): Promise<{
  assetPath: string;
  contentHash: string;
  logo: InvoiceLogoImage;
} | null> {
  const loaded = await loadInvoiceLogoForPdf({
    organizationId: params.organizationId,
    logoUrl: params.logoUrl,
    fallbackName: params.fallbackName,
  });
  if (loaded.kind !== "image") return null;

  const assetPath = buildInvoiceLogoAssetPath({
    organizationId: params.organizationId,
    invoiceId: params.invoiceId,
    contentHash: loaded.contentHash,
    mimeType: loaded.mimeType,
  });

  await uploadInvoiceLogoAsset({
    path: assetPath,
    buffer: loaded.bytes,
    contentType: loaded.mimeType,
  });

  return {
    assetPath,
    contentHash: loaded.contentHash,
    logo: loaded,
  };
}
