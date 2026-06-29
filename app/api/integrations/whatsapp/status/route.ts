import { NextResponse } from "next/server";

import {
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
    const status = await getWhatsAppInstanceStatus();

    return NextResponse.json({
      ok: true,
      status: status.state,
      instanceName: status.instanceName || getWhatsAppInstanceName(),
      phoneNumber: status.phoneNumber,
      profileName: status.profileName,
      lastConnectedAt: status.lastConnectedAt,
      connectionStatus: status.connectionStatus,
    });
  } catch (error) {
    return mapWhatsAppRouteError(error);
  }
}
