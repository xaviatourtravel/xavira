import {
  detectValidatedImageMime,
  hashLogoBytes,
  MAX_LOGO_BYTES,
} from "@/modules/finance/pdf/invoice-pdf-logo";
import type { WorkspaceLogoMime } from "@/modules/organization/branding/types";

export { detectValidatedImageMime, hashLogoBytes };

/** Server-only: validates magic bytes after Storage upload. */
export function validateWorkspaceLogoBytes(params: {
  buffer: Buffer;
  declaredMimeType: string;
}):
  | { ok: true; mimeType: WorkspaceLogoMime; contentHash: string }
  | { ok: false; code: string; message: string } {
  if (params.buffer.length === 0 || params.buffer.length > MAX_LOGO_BYTES) {
    return {
      ok: false,
      code: "FILE_TOO_LARGE",
      message: "Logo must be 2 MB or smaller.",
    };
  }

  const mime = detectValidatedImageMime(params.buffer);
  if (!mime) {
    return {
      ok: false,
      code: "INVALID_IMAGE_SIGNATURE",
      message: "File is not a valid PNG or JPEG image.",
    };
  }

  if (mime !== params.declaredMimeType) {
    return {
      ok: false,
      code: "MIME_MISMATCH",
      message: "Declared file type does not match the image contents.",
    };
  }

  return {
    ok: true,
    mimeType: mime,
    contentHash: hashLogoBytes(params.buffer),
  };
}
