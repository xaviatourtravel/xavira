"use client";

import {
  DesklabsAvatar,
  type DesklabsAvatarSize,
} from "@/components/ui/desklabs-avatar";

type CustomerAvatarProps = {
  displayName: string;
  avatarUrl?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
  status?: "online" | "offline" | "busy" | "away" | null;
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
}: CustomerAvatarProps) {
  return (
    <DesklabsAvatar
      name={displayName}
      imageUrl={avatarUrl}
      size={SIZE_MAP[size]}
      status={status}
      className={className}
    />
  );
}

export {
  getDesklabsAvatarInitials as getConversationAvatarInitials,
  getDesklabsAvatarColorClass as getConversationAvatarColor,
} from "@/components/ui/desklabs-avatar";
