import { CommunicationWorkspaceView } from "@/components/communication-workspace/communication-workspace-view";
import {
  canAddOmnichannelConversationNote,
  canConvertOmnichannelConversationToLead,
  canCreateInboxFollowUpFromLead,
  canReplyToOmnichannelConversation,
  canReassignOmnichannelConversation,
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
import {
  getAiStateForInboxFilter,
  isWhatsappAiInboxFilter,
  sortReadyForHumanConversations,
} from "@/lib/omnichannel-inbox/inbox-ai-filters";
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

function buildWhatsappListFilter(
  activeFilter: ReturnType<typeof parseOmnichannelInboxFilter>,
  currentUserId: string,
) {
  if (activeFilter === "mine") {
    return { assignedUserId: currentUserId };
  }

  if (activeFilter === "unassigned") {
    return { unassignedOnly: true };
  }

  return {};
}

async function loadMergedConversationLists(
  supabase: Awaited<ReturnType<typeof createClient>>,
  organizationId: string,
  currentUserId: string,
  activeFilter: ReturnType<typeof parseOmnichannelInboxFilter>,
) {
  const whatsappFilter = buildWhatsappListFilter(activeFilter, currentUserId);

  if (isWhatsappAiInboxFilter(activeFilter)) {
    const aiState = getAiStateForInboxFilter(activeFilter);
    const [omnichannelAll, whatsappAll, filteredWhatsapp] = await Promise.all([
      loadOmnichannelConversationList(
        supabase,
        organizationId,
        "all",
        currentUserId,
      ),
      loadWhatsappConversationList(supabase, organizationId, {}),
      loadWhatsappConversationList(supabase, organizationId, { aiState }),
    ]);

    const omnichannelWithoutWhatsapp = omnichannelAll.filter(
      (conversation) => conversation.channel !== "whatsapp",
    );
    const mergedAll = sortConversationsByLastMessage([
      ...whatsappAll,
      ...omnichannelWithoutWhatsapp,
    ]);
    const conversations =
      activeFilter === "ready_for_human"
        ? sortReadyForHumanConversations(filteredWhatsapp)
        : sortConversationsByLastMessage(filteredWhatsapp);

    return {
      conversations,
      allConversations: mergedAll,
    };
  }

  if (activeFilter === "whatsapp") {
    const whatsappConversations = await loadWhatsappConversationList(
      supabase,
      organizationId,
      whatsappFilter,
    );

    return {
      conversations: whatsappConversations,
      allConversations: whatsappConversations,
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
      activeFilter === "all" || activeFilter === "unread"
        ? Promise.resolve([])
        : loadOmnichannelConversationList(
            supabase,
            organizationId,
            activeFilter,
            currentUserId,
          ),
      loadWhatsappConversationList(supabase, organizationId, whatsappFilter),
    ]);

  const omnichannelWithoutWhatsapp = omnichannelAll.filter(
    (conversation) => conversation.channel !== "whatsapp",
  );
  const mergedAll = sortConversationsByLastMessage([
    ...whatsappConversations,
    ...omnichannelWithoutWhatsapp,
  ]);

  if (activeFilter === "all" || activeFilter === "unread") {
    return {
      conversations:
        activeFilter === "unread"
          ? mergedAll.filter((conversation) => conversation.unreadCount > 0)
          : mergedAll,
      allConversations: mergedAll,
    };
  }

  if (activeFilter === "mine" || activeFilter === "unassigned") {
    const filteredWhatsapp = await loadWhatsappConversationList(
      supabase,
      organizationId,
      whatsappFilter,
    );
    const filteredOmnichannel = await loadOmnichannelConversationList(
      supabase,
      organizationId,
      activeFilter,
      currentUserId,
    );

    return {
      conversations: sortConversationsByLastMessage([
        ...filteredWhatsapp,
        ...filteredOmnichannel.filter(
          (conversation) => conversation.channel !== "whatsapp",
        ),
      ]),
      allConversations: mergedAll,
    };
  }

  return {
    conversations: omnichannelFiltered,
    allConversations: mergedAll,
  };
}

async function loadWorkspaceConversationDetail(
  supabase: Awaited<ReturnType<typeof createClient>>,
  organizationId: string,
  conversationId: string,
) {
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

  const [listData, detail, orgProfilesResult] = await Promise.all([
    loadMergedConversationLists(
      supabase,
      profile.organization_id,
      profile.id,
      activeFilter,
    ),
    selectedConversationId
      ? loadWorkspaceConversationDetail(
          supabase,
          profile.organization_id,
          selectedConversationId,
        )
      : Promise.resolve(null),
    supabase
      .from("profiles")
      .select("id, full_name")
      .eq("organization_id", profile.organization_id)
      .order("full_name"),
  ]);

  const { conversations, allConversations } = listData;
  const orgProfiles = (orgProfilesResult.data ?? []).map((member) => ({
    id: member.id,
    full_name: member.full_name?.trim() || "Team member",
  }));

  const permissionsSource = detail ?? conversations.find(
    (item) => item.id === selectedConversationId,
  );

  const permissionsConversation = {
    assigned_user_id: permissionsSource?.assignedUserId ?? null,
  };

  return (
    <CommunicationWorkspaceView
      conversations={conversations}
      allConversations={allConversations}
      detail={detail}
      activeFilter={activeFilter}
      selectedConversationId={selectedConversationId}
      conversationNotFound={Boolean(selectedConversationId && !detail)}
      currentUserId={profile.id}
      organizationId={profile.organization_id}
      orgProfiles={orgProfiles}
      canReply={canReplyToOmnichannelConversation(
        profile,
        permissionsConversation,
      )}
      canSuggestReply={canSuggestOmnichannelReply(
        profile,
        permissionsConversation,
      )}
      canReassign={canReassignOmnichannelConversation(profile)}
      canUpdateStatus={canUpdateOmnichannelConversationStatus(
        profile,
        permissionsConversation,
      )}
      canAddNote={canAddOmnichannelConversationNote(
        profile,
        permissionsConversation,
      )}
      canConvert={canConvertOmnichannelConversationToLead(
        profile,
        permissionsConversation,
      )}
      canCreateFollowUp={canCreateInboxFollowUpFromLead(
        profile,
        permissionsConversation,
      )}
      readOnly={false}
      isUnassignedForAgent={
        !isAdminOrOwner(profile) &&
        permissionsConversation.assigned_user_id === null
      }
      initialError={params.error ?? null}
      initialSuccess={params.success ?? null}
    />
  );
}
