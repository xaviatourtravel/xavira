import { NextResponse } from "next/server";

import {
  getMessagingErrorCode,
  getMessagingErrorMessage,
  retryMessage,
  sendMessage,
  type MessageChannel,
} from "@/lib/communication/messaging";
import { getEvolutionErrorDetails } from "@/lib/integrations/whatsapp/evolution-client";
import type { Profile } from "@/types/app-types";
import { createClient } from "@/utils/supabase/server";

// Shared HTTP boundary for the Messaging Service. Both the generic
// /api/communication/messages route and the legacy WhatsApp route delegate
// here, so the engine is reached identically regardless of entrypoint and a
// provider is never exposed to the browser.

const ERROR_STATUS: Record<string, number> = {
  unauthorized: 401,
  permission_denied: 403,
  conversation_not_found: 404,
  message_not_found: 404,
  invalid_message: 400,
  unsupported: 422,
  service_unavailable: 503,
  instance_disconnected: 503,
  send_failed: 502,
  unknown: 500,
};

const SUPPORTED_CHANNELS: MessageChannel[] = [
  "whatsapp",
  "instagram",
  "facebook",
  "email",
  "telegram",
];

type RequestBody = {
  channel?: unknown;
  conversationId?: unknown;
  messageId?: unknown;
  text?: unknown;
  message?: unknown;
};

const WA_SEND_LOG = "[WA_SEND]";

function logSendRouteFailure(args: {
  workspaceId: string;
  conversationId: string;
  messageId: string;
  channel: MessageChannel;
  error: unknown;
}) {
  const code = getMessagingErrorCode(args.error);
  const message = getMessagingErrorMessage(args.error);
  const evolution = getEvolutionErrorDetails(args.error);

  console.error(`${WA_SEND_LOG} API send failed`, {
    workspaceId: args.workspaceId,
    conversationId: args.conversationId || undefined,
    messageId: args.messageId || undefined,
    channel: args.channel,
    code,
    message,
    evolutionEndpoint: evolution.evolutionEndpoint,
    evolutionStatus: evolution.evolutionStatus,
    evolutionResponseBody: evolution.evolutionResponseBody,
    evolutionErrorMessage: evolution.evolutionErrorMessage,
    disconnected: evolution.disconnected,
  });
}

function jsonError(code: string, message: string) {
  return NextResponse.json(
    { ok: false, code, message },
    { status: ERROR_STATUS[code] ?? 500 },
  );
}

export async function handleSendMessageRequest(
  request: Request,
  options: { forcedChannel?: MessageChannel } = {},
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return jsonError("unauthorized", "Anda perlu masuk untuk mengirim pesan.");
  }

  const { data: profileRow } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (!profileRow || !profileRow.organization_id) {
    return jsonError("unauthorized", "Profil pengguna tidak ditemukan.");
  }

  const profile = profileRow as Profile;

  let body: RequestBody = {};
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    body = {};
  }

  // Kanal disimpulkan dari permintaan; sprint ini default ke WhatsApp.
  const channelInput =
    options.forcedChannel ??
    (typeof body.channel === "string"
      ? (body.channel as MessageChannel)
      : "whatsapp");

  if (!SUPPORTED_CHANNELS.includes(channelInput)) {
    return jsonError("unsupported", "Channel tidak didukung.");
  }

  const channel = channelInput;
  const conversationId =
    typeof body.conversationId === "string" ? body.conversationId.trim() : "";
  const messageId =
    typeof body.messageId === "string" ? body.messageId.trim() : "";
  const text =
    typeof body.text === "string"
      ? body.text
      : typeof body.message === "string"
        ? body.message
        : "";

  if (!messageId && !conversationId) {
    return jsonError("invalid_message", "Conversation wajib dipilih.");
  }

  try {
    const saved = messageId
      ? await retryMessage({
          supabase,
          organizationId: profile.organization_id,
          profile,
          channel,
          messageId,
        })
      : await sendMessage({
          supabase,
          organizationId: profile.organization_id,
          profile,
          channel,
          conversationId,
          text,
        });

    return NextResponse.json({
      ok: true,
      channel: saved.channel,
      status: saved.status,
      messageId: saved.id,
      conversationId: saved.conversationId,
    });
  } catch (error) {
    const code = getMessagingErrorCode(error);

    logSendRouteFailure({
      workspaceId: profile.organization_id,
      conversationId,
      messageId,
      channel,
      error,
    });

    if (code === "unknown") {
      console.error("Messaging send request failed", error);
    }

    return jsonError(code, getMessagingErrorMessage(error));
  }
}
