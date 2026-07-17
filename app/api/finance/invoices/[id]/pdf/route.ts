import { NextResponse } from "next/server";

import { requireProfile } from "@/lib/auth/session";
import {
  invoicePdfCacheControl,
  sanitizeClientPdfError,
} from "@/modules/finance/pdf/invoice-pdf-http";
import {
  getIssuedInvoicePdfIfReady,
  InvoicePdfNotReadyError,
  renderDraftInvoicePdfPreview,
} from "@/modules/finance/services/invoice-pdf-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET must not mutate PDF state, Storage, or generation events.
 * - draft (+ preview): ephemeral preview
 * - issued + ready: stream stored PDF
 * - issued + not ready: structured JSON (no generation)
 * - ?download=1: attachment of existing ready PDF only
 * - ?retry=1 is ignored (mutations moved to POST .../pdf/generate)
 */
export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const url = new URL(request.url);
  const download = url.searchParams.get("download") === "1";
  const preview = url.searchParams.get("preview") === "1";
  // Intentionally ignored — mutation query params must not generate PDFs.
  void url.searchParams.get("retry");

  try {
    const { profile } = await requireProfile();

    if (preview) {
      const result = await renderDraftInvoicePdfPreview(profile, id);
      return new NextResponse(new Uint8Array(result.buffer), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `inline; filename="${result.fileName}"`,
          "X-Content-Type-Options": "nosniff",
          "Cache-Control": invoicePdfCacheControl({ kind: "draft_preview" }),
        },
      });
    }

    const result = await getIssuedInvoicePdfIfReady(profile, id);
    const dispositionType = download ? "attachment" : "inline";

    return new NextResponse(new Uint8Array(result.buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${dispositionType}; filename="${result.fileName}"`,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": invoicePdfCacheControl({ kind: "issued_ready" }),
      },
    });
  } catch (error) {
    if (error instanceof InvoicePdfNotReadyError) {
      return NextResponse.json(
        {
          error: "PDF_NOT_READY",
          pdfStatus: error.pdfStatus,
          errorCode: error.errorCode,
        },
        {
          status: 409,
          headers: {
            "Cache-Control": invoicePdfCacheControl({ kind: "not_ready" }),
          },
        },
      );
    }

    const message = sanitizeClientPdfError(error);
    const status =
      message.includes("not found") || message.includes("does not belong")
        ? 404
        : message.includes("permission") || message.includes("authorized")
          ? 403
          : message.includes("authenticated") || message.includes("sign in")
            ? 401
            : 400;
    return NextResponse.json(
      { error: message },
      {
        status,
        headers: {
          "Cache-Control": invoicePdfCacheControl({ kind: "error" }),
        },
      },
    );
  }
}
