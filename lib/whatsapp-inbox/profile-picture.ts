import {
  fetchWhatsAppProfilePictureUrlResult,
  type FetchWhatsAppProfilePictureResult,
} from "@/lib/integrations/whatsapp/evolution-client";
import { normalizeWhatsappPhoneDigits } from "@/lib/integrations/whatsapp/phone";
import {
  findWhatsappConversationById,
  updateWhatsappConversationById,
  type WhatsappSupabaseClient,
} from "@/lib/whatsapp-inbox/repository";
import type { WhatsappConversationRow } from "@/types/whatsapp-inbox";

export const WHATSAPP_PROFILE_PICTURE_CACHE_MS = 7 * 24 * 60 * 60 * 1000;
const WHATSAPP_PROFILE_PICTURE_NULL_RETRY_MS = 60 * 60 * 1000;

const WA_AVATAR_SYNC_LOG = "[WA_AVATAR_SYNC]";

function logWaAvatarSync(
  message: string,
  data?: Record<string, unknown>,
) {
  if (data) {
    console.log(`${WA_AVATAR_SYNC_LOG} ${message}`, data);
  } else {
    console.log(`${WA_AVATAR_SYNC_LOG} ${message}`);
  }
}

const conversationSyncInflight = new Map<
  string,
  Promise<WhatsappProfilePictureSyncResult>
>();

const phoneFetchInflight = new Map<
  string,
  Promise<FetchWhatsAppProfilePictureResult>
>();

export type WhatsappProfilePictureSyncResult = {
  profilePictureUrl: string | null;
  refreshed: boolean;
  fromCache: boolean;
};

function buildPhoneFetchKey(instanceName: string, phoneNumber: string) {
  return `${instanceName}:${normalizeWhatsappPhoneDigits(phoneNumber)}`;
}

async function fetchProfilePictureForPhone(input: {
  instanceName: string;
  phoneNumber: string;
}) {
  const key = buildPhoneFetchKey(input.instanceName, input.phoneNumber);
  const inflight = phoneFetchInflight.get(key);
  if (inflight) {
    return inflight;
  }

  const task = fetchWhatsAppProfilePictureUrlResult({
    instanceName: input.instanceName,
    phoneNumber: input.phoneNumber,
  }).finally(() => {
    phoneFetchInflight.delete(key);
  });

  phoneFetchInflight.set(key, task);
  return task;
}

export function isWhatsappProfilePictureCacheFresh(
  profilePictureUpdatedAt: string | null | undefined,
  now = Date.now(),
) {
  if (!profilePictureUpdatedAt) {
    return false;
  }

  const updatedAt = Date.parse(profilePictureUpdatedAt);
  if (Number.isNaN(updatedAt)) {
    return false;
  }

  return now - updatedAt < WHATSAPP_PROFILE_PICTURE_CACHE_MS;
}

export function shouldRefreshWhatsappProfilePicture(
  conversation: Pick<
    WhatsappConversationRow,
    "profile_picture_url" | "profile_picture_updated_at"
  >,
) {
  if (!conversation.profile_picture_url) {
    if (!conversation.profile_picture_updated_at) {
      return true;
    }

    const updatedAt = Date.parse(conversation.profile_picture_updated_at);
    if (Number.isNaN(updatedAt)) {
      return true;
    }

    return Date.now() - updatedAt > WHATSAPP_PROFILE_PICTURE_NULL_RETRY_MS;
  }

  return !isWhatsappProfilePictureCacheFresh(
    conversation.profile_picture_updated_at,
  );
}

async function persistProfilePictureSync(
  supabase: WhatsappSupabaseClient,
  workspaceId: string,
  conversationId: string,
  profilePictureUrl: string | null,
) {
  logWaAvatarSync("persist", {
    conversationId,
    workspaceId,
    profilePictureUrl: profilePictureUrl ?? null,
  });

  await updateWhatsappConversationById(
    supabase,
    workspaceId,
    conversationId,
    {
      profile_picture_url: profilePictureUrl,
      profile_picture_updated_at: new Date().toISOString(),
    },
  );

  return {
    profilePictureUrl,
    refreshed: true,
    fromCache: false,
  } satisfies WhatsappProfilePictureSyncResult;
}

export async function syncWhatsappConversationProfilePicture(
  supabase: WhatsappSupabaseClient,
  workspaceId: string,
  conversationId: string,
  options: { force?: boolean } = {},
): Promise<WhatsappProfilePictureSyncResult> {
  const inflight = conversationSyncInflight.get(conversationId);
  if (inflight) {
    return inflight;
  }

  const task = (async () => {
    const conversation = await findWhatsappConversationById(
      supabase,
      workspaceId,
      conversationId,
    );

    if (!conversation) {
      return {
        profilePictureUrl: null,
        refreshed: false,
        fromCache: false,
      } satisfies WhatsappProfilePictureSyncResult;
    }

    const needsRefresh =
      options.force || shouldRefreshWhatsappProfilePicture(conversation);

    if (!needsRefresh) {
      logWaAvatarSync("cache hit", {
        conversationId,
        profilePictureUrl: conversation.profile_picture_url ?? null,
      });
      return {
        profilePictureUrl: conversation.profile_picture_url ?? null,
        refreshed: false,
        fromCache: true,
      } satisfies WhatsappProfilePictureSyncResult;
    }

    logWaAvatarSync("sync conversation", {
      conversationId,
      instanceName: conversation.instance_name,
      phoneNumber: conversation.phone_number,
      force: Boolean(options.force),
    });

    const fetchResult = await fetchProfilePictureForPhone({
      instanceName: conversation.instance_name,
      phoneNumber: conversation.phone_number,
    });

    if (!fetchResult.reachedApi) {
      logWaAvatarSync("sync skipped persist (api unreachable)", {
        conversationId,
      });
      return {
        profilePictureUrl: conversation.profile_picture_url ?? null,
        refreshed: false,
        fromCache: Boolean(conversation.profile_picture_updated_at),
      } satisfies WhatsappProfilePictureSyncResult;
    }

    return persistProfilePictureSync(
      supabase,
      workspaceId,
      conversationId,
      fetchResult.profilePictureUrl,
    );
  })().finally(() => {
    conversationSyncInflight.delete(conversationId);
  });

  conversationSyncInflight.set(conversationId, task);
  return task;
}

export function scheduleWhatsappProfilePictureSync(
  supabase: WhatsappSupabaseClient,
  workspaceId: string,
  conversationId: string,
) {
  void syncWhatsappConversationProfilePicture(
    supabase,
    workspaceId,
    conversationId,
  ).catch(() => {
    // Best-effort background sync; UI keeps initials on failure.
  });
}

const MAX_LIST_PROFILE_PICTURE_SYNCS = 12;

/** Background sync for inbox list — does not block the page response. */
export function scheduleStaleWhatsappProfilePictureSyncs(
  supabase: WhatsappSupabaseClient,
  workspaceId: string,
  conversations: Array<
    Pick<
      WhatsappConversationRow,
      | "id"
      | "profile_picture_url"
      | "profile_picture_updated_at"
    >
  >,
) {
  const stale = conversations.filter(shouldRefreshWhatsappProfilePicture);

  for (const conversation of stale.slice(0, MAX_LIST_PROFILE_PICTURE_SYNCS)) {
    scheduleWhatsappProfilePictureSync(
      supabase,
      workspaceId,
      conversation.id,
    );
  }
}
