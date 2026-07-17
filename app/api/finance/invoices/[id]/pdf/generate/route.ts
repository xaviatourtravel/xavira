import { NextResponse } from "next/server";

import { requireProfile } from "@/lib/auth/session";
import {
  invoicePdfCacheControl,
  sanitizeClientPdfError,
} from "@/modules/finance/pdf/invoice-pdf-http";
import {
  generateIssuedInvoicePdf,
  InvoicePdfGenerationFailedError,
  InvoicePdfInProgressError,
} from "@/modules/finance/services/invoice-pdf-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * POST: first generation + technical retry via atomic claim.
 * Body: { force?: boolean }
 */
export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;

  let force = false;
  try {
    const body = (await request.json().catch(() => ({}))) as {
      force?: unknown;
    };
    force = body.force === true;
  } catch {
    force = false;
  }

  try {
    const { profile } = await requireProfile();
    const result = await generateIssuedInvoicePdf(profile, id, { force });

    return NextResponse.json(
      {
        ok: true,
        generated: result.generated,
        pdfStatus: result.invoice.pdfStatus ?? "ready",
        pdfStoragePathSet: Boolean(result.invoice.pdfStoragePath),
      },
      {
        status: 200,
        headers: {
          "Cache-Control": invoicePdfCacheControl({ kind: "not_ready" }),
        },
      },
    );
  } catch (error) {
    if (error instanceof InvoicePdfInProgressError) {
      return NextResponse.json(
        { error: "PDF_GENERATION_IN_PROGRESS" },
        {
          status: 409,
          headers: {
            "Cache-Control": invoicePdfCacheControl({ kind: "not_ready" }),
          },
        },
      );
    }

    if (error instanceof InvoicePdfGenerationFailedError) {
      return NextResponse.json(
        {
          error: "PDF_GENERATION_FAILED",
          errorCode: error.errorCode,
        },
        {
          status: 500,
          headers: {
            "Cache-Control": invoicePdfCacheControl({ kind: "error" }),
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
            : message.includes("Only issued") || message.includes("Preview mode")
              ? 400
              : 500;

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
