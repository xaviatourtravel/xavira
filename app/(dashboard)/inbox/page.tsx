import { OmnichannelInboxView } from "@/components/omnichannel-inbox/omnichannel-inbox-view";
import {
  canAddOmnichannelConversationNote,
  canConvertOmnichannelConversationToLead,
  canCreateInboxFollowUpFromLead,
  canReassignOmnichannelConversation,
  canReplyToOmnichannelConversation,
  canSuggestOmnichannelReply,
  canUpdateOmnichannelConversationStatus,
} from "@/lib/omnichannel-inbox/permissions";
import {
  loadOmnichannelConversationDetail,
  loadOmnichannelConversationList,
  parseOmnichannelInboxFilter,
  type OmnichannelConversationListItem,
} from "@/lib/omnichannel-inbox/queries";
import { isAdminOrOwner } from "@/lib/auth/permissions";
import { requireProfile } from "@/lib/auth/session";
import {
  loadWhatsappConversationDetail,
  loadWhatsappConversationList,
} from "@/lib/whatsapp-inbox/queries";
import { createClient } from "@/utils/supabase/server";

function sortConversationsByLastMessage(
  conversations: OmnichannelConversationListItem[],
) {
  return [...conversations].sort((left, right) => {
    const leftTime = left.lastMessageAt
      ? new Date(left.lastMessageAt).getTime()
      : 0;
    const rightTime = right.lastMessageAt
      ? new Date(right.lastMessageAt).getTime()
      : 0;

    return rightTime - leftTime;
  });
}

async function loadMergedConversationLists(
  supabase: Awaited<ReturnType<typeof createClient>>,
  organizationId: string,
  currentUserId: string,
  activeFilter: ReturnType<typeof parseOmnichannelInboxFilter>,
) {
  if (activeFilter === "whatsapp") {
    const whatsappConversations = await loadWhatsappConversationList(
      supabase,
      organizationId,
    );

    return {
      conversations: whatsappConversations,
      allConversations: whatsappConversations,
      isWhatsappInbox: true,
    };
  }

  const [omnichannelAll, omnichannelFiltered, whatsappConversations] =
    await Promise.all([
      loadOmnichannelConversationList(
        supabase,
        organizationId,
        "all",
        currentUserId,
      ),
      activeFilter === "all"
        ? Promise.resolve([])
        : loadOmnichannelConversationList(
            supabase,
            organizationId,
            activeFilter,
            currentUserId,
          ),
      loadWhatsappConversationList(supabase, organizationId),
    ]);

  const omnichannelWithoutWhatsapp = omnichannelAll.filter(
    (conversation) => conversation.channel !== "whatsapp",
  );
  const mergedAll = sortConversationsByLastMessage([
    ...whatsappConversations,
    ...omnichannelWithoutWhatsapp,
  ]);

  if (activeFilter === "all") {
    return {
      conversations: mergedAll,
      allConversations: mergedAll,
      isWhatsappInbox: false,
    };
  }

  return {
    conversations: omnichannelFiltered,
    allConversations: mergedAll,
    isWhatsappInbox: false,
  };
}

async function loadInboxConversationDetail(
  supabase: Awaited<ReturnType<typeof createClient>>,
  organizationId: string,
  conversationId: string,
  activeFilter: ReturnType<typeof parseOmnichannelInboxFilter>,
) {
  if (activeFilter === "whatsapp") {
    return loadWhatsappConversationDetail(
      supabase,
      organizationId,
      conversationId,
    );
  }

  const whatsappDetail = await loadWhatsappConversationDetail(
    supabase,
    organizationId,
    conversationId,
  );

  if (whatsappDetail) {
    return whatsappDetail;
  }

  return loadOmnichannelConversationDetail(
    supabase,
    organizationId,
    conversationId,
  );
}

export default async function InboxPage({
  searchParams,
}: {
  searchParams: Promise<{
    filter?: string;
    channel?: string;
    c?: string;
    error?: string;
    success?: string;
  }>;
}) {
  const params = await searchParams;
  const { profile } = await requireProfile();
  const supabase = await createClient();
  const activeFilter = parseOmnichannelInboxFilter(
    params.filter ?? params.channel,
  );
  const selectedConversationId = params.c?.trim() || null;
  const isWhatsappInbox = activeFilter === "whatsapp";

  const [{ data: orgProfiles }, listData, detail] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name")
      .eq("organization_id", profile.organization_id)
      .order("full_name"),
    loadMergedConversationLists(
      supabase,
      profile.organization_id,
      profile.id,
      activeFilter,
    ),
    selectedConversationId
      ? loadInboxConversationDetail(
          supabase,
          profile.organization_id,
          selectedConversationId,
          activeFilter,
        )
      : Promise.resolve(null),
  ]);

  const { conversations, allConversations } = listData;

  const permissionsSource = detail ?? conversations.find(
    (item) => item.id === selectedConversationId,
  );

  const permissionsConversation = {
    assigned_user_id: permissionsSource?.assignedUserId ?? null,
  };

  const isWhatsappConversation =
    isWhatsappInbox || detail?.channel === "whatsapp";

  return (
    <OmnichannelInboxView
      conversations={conversations}
      allConversations={allConversations}
      detail={detail}
      activeFilter={activeFilter}
      selectedConversationId={selectedConversationId}
      conversationNotFound={Boolean(selectedConversationId && !detail)}
      currentUserId={profile.id}
      orgProfiles={orgProfiles ?? []}
      canReassign={
        !isWhatsappConversation &&
        canReassignOmnichannelConversation(profile)
      }
      canUpdateStatus={
        !isWhatsappConversation &&
        canUpdateOmnichannelConversationStatus(
          profile,
          permissionsConversation,
        )
      }
      canAddNote={
        !isWhatsappConversation &&
        canAddOmnichannelConversationNote(profile, permissionsConversation)
      }
      canReply={
        !isWhatsappConversation &&
        canReplyToOmnichannelConversation(profile, permissionsConversation)
      }
      canSuggestReply={
        !isWhatsappConversation &&
        canSuggestOmnichannelReply(profile, permissionsConversation)
      }
      canConvert={
        !isWhatsappConversation &&
        canConvertOmnichannelConversationToLead(
          profile,
          permissionsConversation,
        )
      }
      canCreateFollowUp={
        !isWhatsappConversation &&
        canCreateInboxFollowUpFromLead(profile, permissionsConversation)
      }
      readOnly={isWhatsappConversation}
      isUnassignedForAgent={
        !isWhatsappConversation &&
        !isAdminOrOwner(profile) &&
        permissionsConversation.assigned_user_id === null
      }
      initialError={params.error ?? null}
      initialSuccess={params.success ?? null}
    />
  );
}
