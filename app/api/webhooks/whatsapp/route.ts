import { after, NextResponse, type NextRequest } from "next/server";

import { ingestWhatsAppIncomingMessages } from "@/lib/integrations/whatsapp/webhook-ingestion";
import {
  parseWhatsAppWebhookBody,
  parseWhatsAppWebhookPayload,
  whatsAppWebhookDevLog,
} from "@/lib/integrations/whatsapp/webhook-parser";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function getConfiguredApiKey() {
  return process.env.EVOLUTION_API_KEY?.trim() || null;
}

/**
 * TODO(production): Webhook authentication is skipped in development for local MVP.
 * In production, EVOLUTION_API_KEY must be set and every request must include
 * a matching `apikey` header (or `x-api-key` / Bearer token).
 */
function validateWebhookApiKey(request: NextRequest) {
  if (process.env.NODE_ENV === "development") {
    return true;
  }

  const expected = getConfiguredApiKey();
  if (!expected) {
    console.error(
      "[WHATSAPP WEBHOOK] EVOLUTION_API_KEY is required in production",
    );
    return false;
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
      return;
    }

    const supabase = createAdminClient();
    const result = await ingestWhatsAppIncomingMessages(
      supabase,
      parsed.messages,
      parsed.ignored,
    );

    if (result.processed > 0) {
      whatsAppWebhookDevLog("ingestion complete", result);
    }
  } catch (error) {
    console.error("[WHATSAPP WEBHOOK] ingestion failed", error);
  }
}

export async function POST(request: NextRequest) {
  if (!validateWebhookApiKey(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const rawBody = await request.text();

  after(async () => {
    await processWebhookPayload(rawBody);
  });

  return NextResponse.json({ ok: true }, { status: 200 });
}
