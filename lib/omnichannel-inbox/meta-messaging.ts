import {
  GRAPH_API_BASE,
  INSTAGRAM_INTEGRATION_PROVIDER,
  parseInstagramIntegrationMetadata,
} from "@/lib/instagram/constants";
import { getInstagramAccessToken } from "@/lib/instagram/oauth";
import type { OmnichannelChannel } from "@/types/omnichannel-inbox";
import type { createClient } from "@/utils/supabase/server";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

const FACEBOOK_PAGE_INTEGRATION_PROVIDER = "facebook_page" as const;

export type MetaMessagingCredentials = {
  pageId: string;
  pageAccessToken: string;
  provider: string;
};

export class MetaMessagingError extends Error {
  readonly code:
    | "integration_missing"
    | "channel_not_supported"
    | "meta_api_failed"
    | "recipient_missing";

  constructor(
    code: MetaMessagingError["code"],
    message: string,
  ) {
    super(message);
    this.name = "MetaMessagingError";
    this.code = code;
  }
}

type MetaSendMessageResponse = {
  recipient_id?: string;
  message_id?: string;
  error?: {
    message?: string;
    type?: string;
    code?: number;
  };
};

function devLog(message: string, details?: Record<string, unknown>) {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  if (details) {
    console.log(`[omnichannel-send] ${message}`, details);
  } else {
    console.log(`[omnichannel-send] ${message}`);
  }
}

function getPageIdFromMetadata(metadata: Record<string, unknown>) {
  const pageId = metadata.pageId;
  return typeof pageId === "string" && pageId.trim() ? pageId.trim() : null;
}

function getPageAccessTokenFromMetadata(metadata: Record<string, unknown>) {
  const parsed = parseInstagramIntegrationMetadata(metadata);
  const token = getInstagramAccessToken(parsed);
  return token?.trim() || null;
}

export async function resolveMetaMessagingCredentials(
  supabase: SupabaseClient,
  organizationId: string,
  channel: OmnichannelChannel,
): Promise<MetaMessagingCredentials> {
  if (channel === "whatsapp") {
    throw new MetaMessagingError(
      "channel_not_supported",
      "Channel not supported. WhatsApp replies are not enabled yet.",
    );
  }

  const { data, error } = await supabase
    .from("integrations")
    .select("provider, status, metadata")
    .eq("organization_id", organizationId)
    .in("provider", [
      INSTAGRAM_INTEGRATION_PROVIDER,
      FACEBOOK_PAGE_INTEGRATION_PROVIDER,
    ])
    .eq("status", "connected");

  if (error) {
    throw new MetaMessagingError(
      "integration_missing",
      "Integration token missing. Connect Instagram or Facebook in Settings.",
    );
  }

  const rows = data ?? [];
  const preferredProviders =
    channel === "facebook"
      ? [FACEBOOK_PAGE_INTEGRATION_PROVIDER, INSTAGRAM_INTEGRATION_PROVIDER]
      : [INSTAGRAM_INTEGRATION_PROVIDER, FACEBOOK_PAGE_INTEGRATION_PROVIDER];

  for (const provider of preferredProviders) {
    const row = rows.find((item) => item.provider === provider);
    if (!row) {
      continue;
    }

    const metadata = (row.metadata ?? {}) as Record<string, unknown>;
    const pageId = getPageIdFromMetadata(metadata);
    const pageAccessToken = getPageAccessTokenFromMetadata(metadata);

    if (pageId && pageAccessToken) {
      return { pageId, pageAccessToken, provider };
    }
  }

  throw new MetaMessagingError(
    "integration_missing",
    "Integration token missing. Reconnect Meta integration in Settings → Integrations.",
  );
}

export async function sendMetaChannelMessage(input: {
  pageId: string;
  pageAccessToken: string;
  recipientId: string;
  messageText: string;
  channel: OmnichannelChannel;
  conversationId: string;
}) {
  const url = new URL(`${GRAPH_API_BASE}/${input.pageId}/messages`);
  url.searchParams.set("access_token", input.pageAccessToken);

  devLog("sending message", {
    conversationId: input.conversationId,
    channel: input.channel,
    recipientExternalId: input.recipientId,
    pageId: input.pageId,
  });

  const response = await fetch(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify({
      recipient: { id: input.recipientId },
      messaging_type: "RESPONSE",
      message: { text: input.messageText },
    }),
  });

  const payload = (await response.json()) as MetaSendMessageResponse;

  devLog("meta response", {
    conversationId: input.conversationId,
    channel: input.channel,
    status: response.status,
    messageId: payload.message_id ?? null,
    errorCode: payload.error?.code ?? null,
  });

  if (!response.ok || payload.error) {
    const detail = payload.error?.message ?? `HTTP ${response.status}`;
    throw new MetaMessagingError(
      "meta_api_failed",
      `Meta API send failed: ${detail}`,
    );
  }

  return {
    messageId: payload.message_id ?? null,
    recipientId: payload.recipient_id ?? input.recipientId,
  };
}
