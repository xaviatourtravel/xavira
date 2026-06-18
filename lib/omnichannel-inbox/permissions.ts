import { isAdminOrOwner } from "@/lib/auth/permissions";
import type { Profile } from "@/types/app-types";

export function canViewAllOmnichannelConversations(profile: Profile) {
  return isAdminOrOwner(profile);
}

export function canReassignOmnichannelConversation(profile: Profile) {
  return isAdminOrOwner(profile);
}

export function canUpdateOmnichannelConversationStatus(
  profile: Profile,
  conversation: { assigned_user_id: string | null },
) {
  if (isAdminOrOwner(profile)) {
    return true;
  }

  return conversation.assigned_user_id === profile.id;
}

export function canAddOmnichannelConversationNote(
  profile: Profile,
  conversation: { assigned_user_id: string | null },
) {
  if (isAdminOrOwner(profile)) {
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
  if (isAdminOrOwner(profile)) {
    return true;
  }

  return conversation.assigned_user_id === profile.id;
}
