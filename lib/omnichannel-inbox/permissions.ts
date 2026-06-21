import { isAdminOrOwner } from "@/lib/auth/permissions";
import { hasPermission } from "@/lib/auth/permissions";
import type { Profile } from "@/types/app-types";

export function canViewAllOmnichannelConversations(profile: Profile) {
  return hasPermission(profile, "inbox.assign") || isAdminOrOwner(profile);
}

export function canReassignOmnichannelConversation(profile: Profile) {
  return hasPermission(profile, "inbox.assign");
}

export function canUpdateOmnichannelConversationStatus(
  profile: Profile,
  conversation: { assigned_user_id: string | null },
) {
  if (!hasPermission(profile, "inbox.view")) {
    return false;
  }

  if (hasPermission(profile, "inbox.assign")) {
    return true;
  }

  return conversation.assigned_user_id === profile.id;
}

export function canAddOmnichannelConversationNote(
  profile: Profile,
  conversation: { assigned_user_id: string | null },
) {
  if (!hasPermission(profile, "inbox.view")) {
    return false;
  }

  if (hasPermission(profile, "inbox.assign")) {
    return true;
  }

  return (
    conversation.assigned_user_id === profile.id ||
    conversation.assigned_user_id === null
  );
}

export function canReplyToOmnichannelConversation(
  profile: Profile,
  conversation: { assigned_user_id: string | null },
) {
  if (!hasPermission(profile, "inbox.reply")) {
    return false;
  }

  if (hasPermission(profile, "inbox.assign")) {
    return true;
  }

  return conversation.assigned_user_id === profile.id;
}

export function canSuggestOmnichannelReply(
  profile: Profile,
  conversation: { assigned_user_id: string | null },
) {
  return canReplyToOmnichannelConversation(profile, conversation);
}

export function canConvertOmnichannelConversationToLead(
  profile: Profile,
  conversation: { assigned_user_id: string | null },
) {
  if (!hasPermission(profile, "inbox.convert_to_lead")) {
    return false;
  }

  if (hasPermission(profile, "inbox.assign")) {
    return true;
  }

  return (
    conversation.assigned_user_id === profile.id ||
    conversation.assigned_user_id === null
  );
}

export function canCreateInboxFollowUpFromLead(
  profile: Profile,
  conversation: { assigned_user_id: string | null },
) {
  if (!hasPermission(profile, "followups.create")) {
    return false;
  }

  return canConvertOmnichannelConversationToLead(profile, conversation);
}

export function canExtractOmnichannelLeadInfo(
  profile: Profile,
  conversation: { assigned_user_id: string | null },
) {
  return canConvertOmnichannelConversationToLead(profile, conversation);
}
