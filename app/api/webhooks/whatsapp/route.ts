import { after, NextResponse, type NextRequest } from "next/server";

import { ingestWhatsAppIncomingMessages } from "@/lib/integrations/whatsapp/webhook-ingestion";
import {
  parseWhatsAppWebhookBody,
  parseWhatsAppWebhookPayload,
  whatsAppWebhookLog,
} from "@/lib/integrations/whatsapp/webhook-parser";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function getConfiguredApiKey() {
  return process.env.EVOLUTION_API_KEY?.trim() || null;
}

function validateWebhookApiKey(request: NextRequest) {
  const expected = getConfiguredApiKey();
  if (!expected) {
    return true;
  }

  const provided =
    request.headers.get("apikey")?.trim() ||
    request.headers.get("x-api-key")?.trim() ||
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();

  return provided === expected;
}

async function processWebhookPayload(rawBody: string) {
  try {
    const payload = parseWhatsAppWebhookBody(rawBody);
    const parsed = parseWhatsAppWebhookPayload(payload);

    if (parsed.messages.length === 0) {
      whatsAppWebhookLog("no actionable messages", {
        ignored: parsed.ignored,
      });
      return;
    }

    const supabase = createAdminClient();
    const result = await ingestWhatsAppIncomingMessages(
      supabase,
      parsed.messages,
      parsed.ignored,
    );

    whatsAppWebhookLog("ingestion complete", result);
  } catch (error) {
    console.error("[WHATSAPP WEBHOOK] ingestion failed", error);
    whatsAppWebhookLog("ingestion failed", {
      error: error instanceof Error ? error.message : "unknown_error",
    });
  }
}

export async function POST(request: NextRequest) {
  if (!validateWebhookApiKey(request)) {
    whatsAppWebhookLog("reject unauthorized webhook");
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const rawBody = await request.text();

  whatsAppWebhookLog("POST received", {
    bodyLength: rawBody.length,
    userAgent: request.headers.get("user-agent"),
  });

  after(async () => {
    await processWebhookPayload(rawBody);
  });

  return NextResponse.json({ ok: true }, { status: 200 });
}
