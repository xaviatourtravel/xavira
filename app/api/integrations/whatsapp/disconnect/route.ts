import { NextResponse } from "next/server";

import { disconnectWhatsAppInstance } from "@/lib/integrations/whatsapp/evolution-client";
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
    const status = await disconnectWhatsAppInstance();

    return NextResponse.json({
      ok: true,
      status: status.state,
      instanceName: status.instanceName,
    });
  } catch (error) {
    return mapWhatsAppRouteError(error);
  }
}
