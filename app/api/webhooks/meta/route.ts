import { NextResponse, type NextRequest } from "next/server";

import { ingestMetaIncomingMessages } from "@/lib/omnichannel-inbox/meta-ingestion";
import {
  getMetaWebhookPostLogContext,
  getMetaWebhookSignatureDebugLog,
  logMetaWebhookReject,
  metaWebhookDevLog,
  metaWebhookLog,
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
    metaWebhookLog(`reject reason: ${verification.reason}`, {
      method: request.method,
      userAgent: request.headers.get("user-agent"),
    });
    metaWebhookDevLog("verification failed", { reason: verification.reason });
    return new NextResponse("Forbidden", { status: 403 });
  }

  metaWebhookLog("accepted", { method: request.method, type: "subscription_verify" });
  metaWebhookDevLog("verification succeeded");
  return new NextResponse(verification.challenge, {
    status: 200,
    headers: { "Content-Type": "text/plain" },
  });
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();

  metaWebhookLog("POST received", getMetaWebhookPostLogContext(request, rawBody));

  const signatureResult = verifyMetaWebhookSignature(
    rawBody,
    {
      signature256: request.headers.get("x-hub-signature-256"),
      signature: request.headers.get("x-hub-signature"),
    },
    process.env.META_APP_SECRET,
  );

  if (!signatureResult.ok) {
    logMetaWebhookReject(signatureResult.reason, request, rawBody, {
      algorithm: signatureResult.algorithm ?? null,
      ...(signatureResult.debug
        ? getMetaWebhookSignatureDebugLog(signatureResult.debug)
        : {}),
    });
    return new NextResponse("Forbidden", { status: 403 });
  }

  if (signatureResult.skipped) {
    metaWebhookLog("signature validation skipped", {
      reason: "missing_app_secret",
      bodyLength: rawBody.length,
    });
  } else {
    metaWebhookLog("signature validated", {
      algorithm: signatureResult.algorithm,
      bodyLength: rawBody.length,
    });
  }

  let payload;
  try {
    payload = parseMetaWebhookPayload(rawBody);
  } catch (error) {
    logMetaWebhookReject("invalid_payload", request, rawBody, {
      error: error instanceof Error ? error.message : "parse_error",
    });
    return NextResponse.json({ success: false, error: "invalid_payload" }, { status: 400 });
  }

  const incomingMessages = parseMetaIncomingMessages(payload);
  const entryCount = Array.isArray(payload.entry) ? payload.entry.length : 0;
  const objectType = typeof payload.object === "string" ? payload.object : null;

  if (objectType !== "page" && objectType !== "instagram") {
    metaWebhookLog("accepted", {
      object: objectType,
      entryCount,
      parsedMessageCount: 0,
      note: "unsupported_object",
    });
    return NextResponse.json({
      success: true,
      processed: 0,
      skipped: 0,
      duplicates: 0,
      unresolved: 0,
    });
  }

  try {
    const supabase = createAdminClient();
    const result = await ingestMetaIncomingMessages(supabase, incomingMessages);

    metaWebhookLog("accepted", {
      object: objectType,
      entryCount,
      parsedMessageCount: incomingMessages.length,
      ...result,
    });
    metaWebhookDevLog("ingestion complete", result);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    metaWebhookLog("ingestion failed", {
      object: objectType,
      entryCount,
      parsedMessageCount: incomingMessages.length,
      error: error instanceof Error ? error.message : "ingestion_failed",
    });
    console.error("[META WEBHOOK] ingestion failed", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "ingestion_failed",
      },
      { status: 500 },
    );
  }
}
