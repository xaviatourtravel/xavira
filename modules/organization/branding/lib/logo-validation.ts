import {
  WORKSPACE_BRAND_BUCKET,
  WORKSPACE_LOGO_MAX_BYTES,
  type WorkspaceLogoMime,
} from "@/modules/organization/branding/types";

export function isSvgFilenameOrMime(value: string): boolean {
  const lower = value.toLowerCase();
  return lower.includes("image/svg") || lower.endsWith(".svg");
}

export function extensionForLogoMime(mime: WorkspaceLogoMime): "png" | "jpg" {
  return mime === "image/jpeg" ? "jpg" : "png";
}

export function buildWorkspaceLogoStoragePath(params: {
  organizationId: string;
  contentHash: string;
  mimeType: WorkspaceLogoMime;
}): string {
  const hash = params.contentHash.toLowerCase();
  const ext = extensionForLogoMime(params.mimeType);
  return `${params.organizationId}/logo/${hash}.${ext}`;
}

export function buildWorkspaceLogoStorageRef(path: string): string {
  return `storage://${WORKSPACE_BRAND_BUCKET}/${path}`;
}

export function parseWorkspaceLogoStorageRef(
  value: string | null | undefined,
): { bucket: string; path: string } | null {
  const raw = value?.trim();
  if (!raw) return null;
  const prefix = `storage://${WORKSPACE_BRAND_BUCKET}/`;
  if (!raw.startsWith(prefix)) return null;
  const path = raw.slice(prefix.length);
  if (!path || path.includes("..") || path.includes("\\")) return null;
  return { bucket: WORKSPACE_BRAND_BUCKET, path };
}

export function assertOrganizationScopedLogoPath(
  storagePath: string,
  organizationId: string,
): boolean {
  if (!storagePath.startsWith(`${organizationId}/logo/`)) return false;
  if (storagePath.includes("..") || storagePath.includes("\\")) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\/logo\/[a-f0-9]{64}\.(png|jpg)$/i.test(
    storagePath,
  );
}

export function validateWorkspaceLogoPrepareMetadata(params: {
  originalFilename: string;
  declaredMimeType: string;
  declaredSize: number;
}):
  | { ok: true; mimeType: WorkspaceLogoMime }
  | { ok: false; code: string; message: string } {
  if (isSvgFilenameOrMime(params.originalFilename) || isSvgFilenameOrMime(params.declaredMimeType)) {
    return {
      ok: false,
      code: "SVG_NOT_ALLOWED",
      message: "SVG logos are not supported.",
    };
  }

  if (params.declaredSize <= 0 || params.declaredSize > WORKSPACE_LOGO_MAX_BYTES) {
    return {
      ok: false,
      code: "FILE_TOO_LARGE",
      message: "Logo must be 2 MB or smaller.",
    };
  }

  if (
    params.declaredMimeType !== "image/png" &&
    params.declaredMimeType !== "image/jpeg"
  ) {
    return {
      ok: false,
      code: "INVALID_MIME",
      message: "Only PNG and JPEG logos are allowed.",
    };
  }

  return { ok: true, mimeType: params.declaredMimeType };
}

export function isExternalLogoUrlRejected(source: string): boolean {
  const trimmed = source.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith("storage://")) return false;
  if (trimmed.startsWith("data:image/png;base64,")) return false;
  if (trimmed.startsWith("data:image/jpeg;base64,")) return false;
  if (/^https?:\/\//i.test(trimmed)) return true;
  return false;
}
