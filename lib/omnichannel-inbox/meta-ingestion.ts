import { INSTAGRAM_INTEGRATION_PROVIDER } from "@/lib/instagram/constants";
import { parseInstagramIntegrationMetadata } from "@/lib/instagram/constants";
import {
  findMessageByExternalId,
  insertMessage,
  resolveOrganizationProfileId,
  upsertConversationFromWebhook,
  type OmnichannelSupabaseClient,
} from "@/lib/omnichannel-inbox/repository";
import {
  metaWebhookDevLog,
  type MetaWebhookIngestResult,
  type ParsedMetaIncomingMessage,
} from "@/lib/omnichannel-inbox/meta-webhook";
import type { Json } from "@/types/database";
import type { OmnichannelChannel } from "@/types/omnichannel-inbox";

const FACEBOOK_PAGE_INTEGRATION_PROVIDER = "facebook_page" as const;

type ConnectedIntegrationRow = {
  organization_id: string;
  provider: string;
  metadata: Record<string, unknown>;
};

type OrganizationInboxSettings = {
  primarySalesUserId?: string;
};

type OrganizationResolverCache = Map<string, string | null>;

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

function getMetadataPageId(metadata: Record<string, unknown>) {
  const pageId = metadata.pageId;
  return typeof pageId === "string" && pageId.trim() ? pageId.trim() : null;
}

function getMetadataInstagramBusinessAccountId(metadata: Record<string, unknown>) {
  const parsed = parseInstagramIntegrationMetadata(metadata);
  const id = parsed.instagramBusinessAccountId?.trim();
  return id || null;
}

function integrationMatchesEntry(
  channel: OmnichannelChannel,
  entryId: string,
  provider: string,
  metadata: Record<string, unknown>,
) {
  const pageId = getMetadataPageId(metadata);
  const instagramBusinessAccountId =
    getMetadataInstagramBusinessAccountId(metadata);

  if (channel === "instagram") {
    return (
      provider === INSTAGRAM_INTEGRATION_PROVIDER &&
      (entryId === instagramBusinessAccountId || entryId === pageId)
    );
  }

  return (
    (provider === INSTAGRAM_INTEGRATION_PROVIDER ||
      provider === FACEBOOK_PAGE_INTEGRATION_PROVIDER) &&
    entryId === pageId
  );
}

async function loadConnectedMetaIntegrations(supabase: OmnichannelSupabaseClient) {
  const { data, error } = await supabase
    .from("integrations")
    .select("organization_id, provider, metadata")
    .eq("status", "connected")
    .in("provider", [
      INSTAGRAM_INTEGRATION_PROVIDER,
      FACEBOOK_PAGE_INTEGRATION_PROVIDER,
    ]);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as ConnectedIntegrationRow[];
}

function resolveOrganizationIdFromIntegrations(
  integrations: ConnectedIntegrationRow[],
  message: ParsedMetaIncomingMessage,
  cache: OrganizationResolverCache,
) {
  const cacheKey = `${message.channel}:${message.entryId}`;
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey) ?? null;
  }

  const match = integrations.find((integration) =>
    integrationMatchesEntry(
      message.channel,
      message.entryId,
      integration.provider,
      asRecord(integration.metadata),
    ),
  );

  const organizationId = match?.organization_id ?? null;
  cache.set(cacheKey, organizationId);
  return organizationId;
}

async function resolvePrimarySalesUserId(
  supabase: OmnichannelSupabaseClient,
  organizationId: string,
  cache: Map<string, string | null>,
) {
  if (cache.has(organizationId)) {
    return cache.get(organizationId) ?? null;
  }

  const { data, error } = await supabase
    .from("organizations")
    .select("settings")
    .eq("id", organizationId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  const settings = asRecord(data?.settings) as OrganizationInboxSettings;
  const candidate =
    typeof settings.primarySalesUserId === "string"
      ? settings.primarySalesUserId.trim()
      : "";

  if (!candidate) {
    cache.set(organizationId, null);
    return null;
  }

  const profileId = await resolveOrganizationProfileId(
    supabase,
    organizationId,
    candidate,
  );

  cache.set(organizationId, profileId);
  return profileId;
}

export async function ingestMetaIncomingMessages(
  supabase: OmnichannelSupabaseClient,
  messages: ParsedMetaIncomingMessage[],
): Promise<MetaWebhookIngestResult> {
  const result: MetaWebhookIngestResult = {
    processed: 0,
    skipped: 0,
    duplicates: 0,
    unresolved: 0,
  };

  if (messages.length === 0) {
    return result;
  }

  metaWebhookDevLog("event received", { messageCount: messages.length });

  const integrations = await loadConnectedMetaIntegrations(supabase);
  const organizationCache: OrganizationResolverCache = new Map();
  const primarySalesCache = new Map<string, string | null>();

  for (const message of messages) {
    const organizationId = resolveOrganizationIdFromIntegrations(
      integrations,
      message,
      organizationCache,
    );

    if (!organizationId) {
      result.unresolved += 1;
      metaWebhookDevLog("organization unresolved", {
        channel: message.channel,
        entryId: message.entryId,
      });
      continue;
    }

    metaWebhookDevLog("channel detected", {
      channel: message.channel,
      organizationId,
      externalConversationId: message.externalConversationId,
    });

    const primarySalesUserId = await resolvePrimarySalesUserId(
      supabase,
      organizationId,
      primarySalesCache,
    );

    const { conversation, created } = await upsertConversationFromWebhook(
      supabase,
      {
        organization_id: organizationId,
        channel: message.channel,
        external_conversation_id: message.externalConversationId,
        external_user_id: message.externalUserId,
        customer_name: message.customerName,
        customer_username: message.customerUsername,
        customer_avatar: null,
        assigned_user_id: primarySalesUserId,
        status: "new",
      },
    );

    metaWebhookDevLog("conversation upserted", {
      conversationId: conversation.id,
      created,
      channel: message.channel,
    });

    const existingMessage = await findMessageByExternalId(
      supabase,
      conversation.id,
      message.externalMessageId,
    );

    if (existingMessage) {
      result.duplicates += 1;
      metaWebhookDevLog("message duplicate skipped", {
        externalMessageId: message.externalMessageId,
      });
      continue;
    }

    await insertMessage(supabase, {
      conversation_id: conversation.id,
      direction: "incoming",
      external_message_id: message.externalMessageId,
      message_text: message.messageText,
      attachments_json: message.attachments as Json,
      created_at: message.timestamp,
    });

    result.processed += 1;
    metaWebhookDevLog("message inserted", {
      conversationId: conversation.id,
      externalMessageId: message.externalMessageId,
    });
  }

  return result;
}
