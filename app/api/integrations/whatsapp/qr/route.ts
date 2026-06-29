import { NextResponse } from "next/server";

import {
  fetchWhatsAppQr,
  getWhatsAppInstanceName,
  getWhatsAppInstanceStatus,
} from "@/lib/integrations/whatsapp/evolution-client";
import {
  mapWhatsAppRouteError,
  requireWhatsAppIntegrationAccess,
} from "@/lib/integrations/whatsapp/route-auth";

export async function GET() {
  const access = await requireWhatsAppIntegrationAccess();
  if ("error" in access) {
    return access.error;
  }

  try {
    const instanceName = getWhatsAppInstanceName();
    const currentStatus = await getWhatsAppInstanceStatus(instanceName);

    if (currentStatus.state === "connected") {
      return NextResponse.json({
        ok: true,
        qrBase64: null,
        instanceName,
        status: currentStatus.state,
      });
    }

    const qrBase64 = await fetchWhatsAppQr(instanceName);

    return NextResponse.json({
      ok: true,
      qrBase64,
      instanceName,
      status: "connecting",
    });
  } catch (error) {
    return mapWhatsAppRouteError(error);
  }
}
