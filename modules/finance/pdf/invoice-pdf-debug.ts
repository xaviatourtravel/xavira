/** Staged errors + gated debug logging for invoice PDF generation. */

export type InvoicePdfStage =
  | "auth_fetch"
  | "claim"
  | "logo_freeze"
  | "data_normalization"
  | "template_resolution"
  | "render"
  | "pdf_validation"
  | "storage_upload"
  | "state_complete";

export type InvoicePdfErrorCode =
  | "DATA_NORMALIZATION_FAILED"
  | "LOGO_PROCESSING_FAILED"
  | "TEMPLATE_RESOLUTION_FAILED"
  | "RENDER_FAILED"
  | "INVALID_PDF_OUTPUT"
  | "STORAGE_UPLOAD_FAILED"
  | "PDF_STATE_UPDATE_FAILED"
  | "PDF_CLAIM_FAILED";

const STAGE_TO_CODE: Record<InvoicePdfStage, InvoicePdfErrorCode> = {
  auth_fetch: "DATA_NORMALIZATION_FAILED",
  claim: "PDF_CLAIM_FAILED",
  logo_freeze: "LOGO_PROCESSING_FAILED",
  data_normalization: "DATA_NORMALIZATION_FAILED",
  template_resolution: "TEMPLATE_RESOLUTION_FAILED",
  render: "RENDER_FAILED",
  pdf_validation: "INVALID_PDF_OUTPUT",
  storage_upload: "STORAGE_UPLOAD_FAILED",
  state_complete: "PDF_STATE_UPDATE_FAILED",
};

export class InvoicePdfStageError extends Error {
  readonly stage: InvoicePdfStage;
  readonly errorCode: InvoicePdfErrorCode;
  readonly causeError?: unknown;

  constructor(
    stage: InvoicePdfStage,
    message: string,
    options?: { cause?: unknown; errorCode?: InvoicePdfErrorCode },
  ) {
    super(message);
    this.name = "InvoicePdfStageError";
    this.stage = stage;
    this.errorCode = options?.errorCode ?? STAGE_TO_CODE[stage];
    this.causeError = options?.cause;
  }
}

export function isInvoicePdfDebugEnabled(): boolean {
  if (process.env.INVOICE_PDF_DEBUG === "1") return true;
  if (process.env.INVOICE_PDF_DEBUG === "0") return false;
  return process.env.NODE_ENV === "development";
}

function serializeCause(error: unknown): Record<string, unknown> | null {
  if (error == null) return null;
  if (error instanceof Error) {
    const nested =
      "cause" in error && error.cause != null
        ? serializeCause(error.cause)
        : null;
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      ...(nested ? { cause: nested } : {}),
    };
  }
  return { message: String(error) };
}

/** Safe structured logs — never include PII / full snapshots / secrets. */
export function logInvoicePdfStage(
  event: string,
  meta: {
    stage?: InvoicePdfStage;
    invoiceId?: string;
    lifecycleStatus?: string | null;
    pdfStatus?: string | null;
    templateKey?: string | null;
    templateVersion?: number | null;
    logoPresent?: boolean;
    logoMime?: string | null;
    logoBytes?: number | null;
    itemCount?: number;
    error?: unknown;
    [key: string]: unknown;
  },
): void {
  if (!isInvoicePdfDebugEnabled() && event !== "failed" && event !== "generated") {
    return;
  }

  const { error, ...rest } = meta;
  const payload: Record<string, unknown> = { ...rest };
  if (error !== undefined) {
    payload.error = serializeCause(error);
  }

  if (event === "failed" || error) {
    console.error("[invoice-pdf]", event, payload);
  } else {
    console.info("[invoice-pdf]", event, payload);
  }
}

export function codeForStageError(error: unknown): InvoicePdfErrorCode {
  if (error instanceof InvoicePdfStageError) {
    return error.errorCode;
  }
  if (error instanceof Error) {
    if (/no line items|snapshot|normalize/i.test(error.message)) {
      return "DATA_NORMALIZATION_FAILED";
    }
    if (/logo/i.test(error.message)) {
      return "LOGO_PROCESSING_FAILED";
    }
    if (/template/i.test(error.message)) {
      return "TEMPLATE_RESOLUTION_FAILED";
    }
    if (/invalid output|magic/i.test(error.message)) {
      return "INVALID_PDF_OUTPUT";
    }
    if (/store|upload|storage/i.test(error.message)) {
      return "STORAGE_UPLOAD_FAILED";
    }
    if (/complete|claim|state|token/i.test(error.message)) {
      return "PDF_STATE_UPDATE_FAILED";
    }
  }
  return "RENDER_FAILED";
}
