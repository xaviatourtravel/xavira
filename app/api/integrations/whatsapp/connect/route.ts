import { NextResponse } from "next/server";

import { connectWhatsAppInstance } from "@/lib/integrations/whatsapp/evolution-client";
import {
  mapWhatsAppRouteError,
  requireWhatsAppIntegrationAccess,
} from "@/lib/integrations/whatsapp/route-auth";

export async function POST() {
  const access = await requireWhatsAppIntegrationAccess();
  if ("error" in access) {
    return access.error;
  }

  try {
    const result = await connectWhatsAppInstance();

    return NextResponse.json({
      ok: true,
      status: result.state,
      qrBase64: result.qrBase64,
      instanceName: result.instanceName,
    });
  } catch (error) {
    return mapWhatsAppRouteError(error);
  }
}
