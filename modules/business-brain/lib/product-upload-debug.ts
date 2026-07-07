const GROUP_LABEL = "Product Document Upload";

export function beginProductUploadDebug() {
  console.group(GROUP_LABEL);
}

export function endProductUploadDebug() {
  console.groupEnd();
}

export function logProductUploadStep(label: string, value?: unknown) {
  if (value === undefined) {
    console.log(label);
    return;
  }

  console.log(label, value);
}

export function logProductUploadError(error: unknown) {
  console.error(error);
}

export function describeSelectedFile(file: File) {
  return {
    name: file.name,
    size: file.size,
    sizeKb: Math.round(file.size / 1024),
    type: file.type || "(empty)",
    lastModified: file.lastModified,
  };
}

export function describeUploadPayload(input: {
  productId: string;
  documentType: string;
  file?: File | null;
  fileUrl?: string;
}) {
  return {
    productId: input.productId,
    documentType: input.documentType,
    fileUrl: input.fileUrl ?? null,
    file: input.file ? describeSelectedFile(input.file) : null,
  };
}

/** Supabase bucket only allows specific MIME types; infer from extension when browser omits type. */
export function resolveProductUploadMimeType(file: File): string {
  if (file.type) return file.type;

  const extension = file.name.split(".").pop()?.toLowerCase();
  switch (extension) {
    case "pdf":
      return "application/pdf";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "mp4":
      return "video/mp4";
    case "mov":
      return "video/quicktime";
    default:
      return "application/octet-stream";
  }
}

export function describeUnexpectedUploadError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);

  if (/unexpected response was received from the server/i.test(message)) {
    return [
      "Upload failed before the server action completed.",
      "Common causes: request body exceeds Next.js Server Action limit (default 1MB),",
      "middleware/auth redirect returning HTML, or a server crash.",
      "Check the dev server terminal for 'Body exceeded' or 413 errors.",
    ].join(" ");
  }

  if (/body exceeded/i.test(message) || /413/i.test(message)) {
    return "File is too large for the current Server Action body size limit.";
  }

  return message || "Upload failed.";
}
