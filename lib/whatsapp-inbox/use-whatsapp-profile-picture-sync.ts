"use client";

import { useEffect, useRef } from "react";

import { syncWhatsappProfilePictureAction } from "@/app/(dashboard)/inbox/whatsapp-actions";
import type { OmnichannelConversationDetail } from "@/lib/omnichannel-inbox/queries";
import type { OmnichannelConversationListItem } from "@/lib/omnichannel-inbox/queries";

type UseWhatsappProfilePictureSyncOptions = {
  conversation: OmnichannelConversationDetail | null;
  onAvatarUpdated: (
    conversationId: string,
    profilePictureUrl: string | null,
  ) => void;
};

/**
 * Syncs WhatsApp profile photo once when a conversation is opened.
 * Server-side cache (7 days) prevents duplicate Evolution API calls.
 */
export function useWhatsappProfilePictureSync({
  conversation,
  onAvatarUpdated,
}: UseWhatsappProfilePictureSyncOptions) {
  const syncedConversationIds = useRef(new Set<string>());

  useEffect(() => {
    if (!conversation || conversation.channel !== "whatsapp") {
      return;
    }

    const conversationId = conversation.id;
    if (syncedConversationIds.current.has(conversationId)) {
      return;
    }

    syncedConversationIds.current.add(conversationId);
    let cancelled = false;

    void syncWhatsappProfilePictureAction(conversationId).then((result) => {
      if (cancelled) {
        return;
      }

      if (!result.success) {
        syncedConversationIds.current.delete(conversationId);
        return;
      }

      if (result.profilePictureUrl) {
        onAvatarUpdated(conversationId, result.profilePictureUrl);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [conversation, onAvatarUpdated]);
}

export function patchConversationAvatar(
  conversations: OmnichannelConversationListItem[],
  conversationId: string,
  profilePictureUrl: string | null,
) {
  return conversations.map((item) =>
    item.id === conversationId
      ? { ...item, customerAvatar: profilePictureUrl }
      : item,
  );
}

export function patchConversationDetailAvatar(
  detail: OmnichannelConversationDetail | null,
  conversationId: string,
  profilePictureUrl: string | null,
) {
  if (!detail || detail.id !== conversationId) {
    return detail;
  }

  return {
    ...detail,
    customerAvatar: profilePictureUrl,
  };
}
