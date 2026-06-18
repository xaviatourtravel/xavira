import { NextResponse, type NextRequest } from "next/server";

import { ingestMetaIncomingMessages } from "@/lib/omnichannel-inbox/meta-ingestion";
import {
  metaWebhookDevLog,
  parseMetaIncomingMessages,
  parseMetaWebhookPayload,
  verifyMetaWebhookSignature,
  verifyMetaWebhookSubscription,
} from "@/lib/omnichannel-inbox/meta-webhook";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * Meta webhook setup (Instagram Messaging + Facebook Messenger):
 *
 * Callback URL:
 *   {NEXT_PUBLIC_SITE_URL}/api/webhooks/meta
 *
 * Verify token env:
 *   META_WEBHOOK_VERIFY_TOKEN
 *
 * Optional signature validation:
 *   META_APP_SECRET
 *
 * Do not configure auto-reply here — ingestion only.
 * WhatsApp is intentionally not handled in this route.
 */

export async function GET(request: NextRequest) {
  const mode = request.nextUrl.searchParams.get("hub.mode");
  const verifyToken = request.nextUrl.searchParams.get("hub.verify_token");
  const challenge = request.nextUrl.searchParams.get("hub.challenge");

  const verification = verifyMetaWebhookSubscription({
    mode,
    verifyToken,
    challenge,
  });

  if (!verification.ok) {
    metaWebhookDevLog("verification failed", { reason: verification.reason });
    return new NextResponse("Forbidden", { status: 403 });
  }

  metaWebhookDevLog("verification succeeded");
  return new NextResponse(verification.challenge, {
    status: 200,
    headers: { "Content-Type": "text/plain" },
  });
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signatureHeader = request.headers.get("x-hub-signature-256");

  const signatureResult = verifyMetaWebhookSignature(
    rawBody,
    signatureHeader,
    process.env.META_APP_SECRET,
  );

  if (!signatureResult.ok) {
    metaWebhookDevLog("signature validation failed", {
      reason: signatureResult.reason,
    });
    return new NextResponse("Forbidden", { status: 403 });
  }

  let payload;
  try {
    payload = parseMetaWebhookPayload(rawBody);
  } catch (error) {
    metaWebhookDevLog("invalid payload", {
      error: error instanceof Error ? error.message : "parse_error",
    });
    return NextResponse.json({ success: false, error: "invalid_payload" }, { status: 400 });
  }

  const incomingMessages = parseMetaIncomingMessages(payload);

  try {
    const supabase = createAdminClient();
    const result = await ingestMetaIncomingMessages(supabase, incomingMessages);

    metaWebhookDevLog("ingestion complete", result);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("[meta-webhook] ingestion failed", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "ingestion_failed",
      },
      { status: 500 },
    );
  }
}
