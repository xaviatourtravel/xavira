import { cn } from "@/lib/utils";

import {
  getConversationAvatarColor,
  getConversationAvatarInitials,
} from "@/components/omnichannel-inbox/inbox-display";

type CustomerAvatarProps = {
  displayName: string;
  avatarUrl?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const SIZE_CLASSES = {
  sm: "h-9 w-9 text-xs",
  md: "h-11 w-11 text-sm",
  lg: "h-14 w-14 text-base",
} as const;

export function CustomerAvatar({
  displayName,
  avatarUrl,
  size = "md",
  className,
}: CustomerAvatarProps) {
  const initials = getConversationAvatarInitials(displayName);
  const colorClass = getConversationAvatarColor(displayName);

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={displayName}
        className={cn(
          "shrink-0 rounded-full object-cover ring-1 ring-black/5",
          SIZE_CLASSES[size],
          className,
        )}
      />
    );
  }

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold ring-1 ring-black/5",
        SIZE_CLASSES[size],
        colorClass,
        className,
      )}
      aria-hidden
    >
      {initials}
    </span>
  );
}
