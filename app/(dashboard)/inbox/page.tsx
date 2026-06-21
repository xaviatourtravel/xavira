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
import { isAdminOrOwner } from "@/lib/auth/permissions";
import {
  loadOmnichannelConversationDetail,
  loadOmnichannelConversationList,
  parseOmnichannelInboxFilter,
} from "@/lib/omnichannel-inbox/queries";
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/utils/supabase/server";

export default async function InboxPage({
  searchParams,
}: {
  searchParams: Promise<{
    filter?: string;
    c?: string;
    error?: string;
    success?: string;
  }>;
}) {
  const params = await searchParams;
  const { profile } = await requireProfile();
  const supabase = await createClient();
  const activeFilter = parseOmnichannelInboxFilter(params.filter);
  const selectedConversationId = params.c?.trim() || null;

  const [{ data: orgProfiles }, allConversations, conversations, detail] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name")
      .eq("organization_id", profile.organization_id)
      .order("full_name"),
    loadOmnichannelConversationList(
      supabase,
      profile.organization_id,
      "all",
      profile.id,
    ),
    loadOmnichannelConversationList(
      supabase,
      profile.organization_id,
      activeFilter,
      profile.id,
    ),
    selectedConversationId
      ? loadOmnichannelConversationDetail(
          supabase,
          profile.organization_id,
          selectedConversationId,
        )
      : Promise.resolve(null),
  ]);

  const permissionsSource = detail ?? conversations.find(
    (item) => item.id === selectedConversationId,
  );

  const permissionsConversation = {
    assigned_user_id: permissionsSource?.assignedUserId ?? null,
  };

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
      canReassign={canReassignOmnichannelConversation(profile)}
      canUpdateStatus={canUpdateOmnichannelConversationStatus(
        profile,
        permissionsConversation,
      )}
      canAddNote={canAddOmnichannelConversationNote(
        profile,
        permissionsConversation,
      )}
      canReply={canReplyToOmnichannelConversation(
        profile,
        permissionsConversation,
      )}
      canSuggestReply={canSuggestOmnichannelReply(
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
      isUnassignedForAgent={
        !isAdminOrOwner(profile) &&
        permissionsConversation.assigned_user_id === null
      }
      initialError={params.error ?? null}
      initialSuccess={params.success ?? null}
    />
  );
}
