import { NextResponse } from "next/server";

import { requireProfile } from "@/lib/auth/session";
import {
  invoicePdfCacheControl,
  sanitizeClientPdfError,
} from "@/modules/finance/pdf/invoice-pdf-http";
import { renderInvoicePdfBuffer } from "@/modules/finance/pdf/invoice-pdf-renderer";
import { buildProformaPdfData } from "@/modules/finance/pdf/proforma-pdf-data";
import { getOrganizationProforma } from "@/modules/finance/services/proforma-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const url = new URL(request.url);
  const download = url.searchParams.get("download") === "1";

  try {
    const { profile } = await requireProfile();
    const proforma = await getOrganizationProforma(profile, id);
    const data = await buildProformaPdfData(proforma);
    const buffer = await renderInvoicePdfBuffer(data);
    const fileName = `${proforma.proformaNumber}.pdf`;
    const dispositionType = download ? "attachment" : "inline";

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${dispositionType}; filename="${fileName}"`,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": invoicePdfCacheControl({ kind: "draft_preview" }),
      },
    });
  } catch (error) {
    const message = sanitizeClientPdfError(error);
    const status =
      message.includes("not found") || message.includes("does not belong")
        ? 404
        : message.includes("permission") || message.includes("authorized")
          ? 403
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
