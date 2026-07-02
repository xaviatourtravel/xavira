"use client";

import {
  DesklabsAvatar,
  type DesklabsAvatarChannel,
  type DesklabsAvatarSize,
} from "@/components/ui/desklabs-avatar";

type CustomerAvatarProps = {
  displayName: string;
  avatarUrl?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
  status?: "online" | "offline" | "busy" | "away" | null;
  channel?: DesklabsAvatarChannel;
  isGroupChat?: boolean;
};

const SIZE_MAP: Record<NonNullable<CustomerAvatarProps["size"]>, DesklabsAvatarSize> = {
  sm: "sm",
  md: "md",
  lg: "lg",
};

/** @deprecated Use DesklabsAvatar directly */
export function CustomerAvatar({
  displayName,
  avatarUrl,
  size = "md",
  className,
  status = null,
  channel = "default",
  isGroupChat = false,
}: CustomerAvatarProps) {
  return (
    <DesklabsAvatar
      name={displayName}
      imageUrl={avatarUrl}
      size={SIZE_MAP[size]}
      status={status}
      channel={channel}
      isGroupChat={isGroupChat}
      className={className}
    />
  );
}

export {
  getDesklabsAvatarInitials as getConversationAvatarInitials,
  getDesklabsAvatarColorClass as getConversationAvatarColor,
} from "@/components/ui/desklabs-avatar";
