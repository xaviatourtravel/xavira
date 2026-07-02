"use client";

import { useEffect, useState } from "react";

import { getSafeInitials } from "@/lib/ui/avatar-initials";
import { cn } from "@/lib/utils";

export type DesklabsAvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

export type DesklabsAvatarStatus = "online" | "offline" | "busy" | "away";

/** Reserved for multi-channel avatar styling (WhatsApp, Instagram, etc.). */
export type DesklabsAvatarChannel =
  | "whatsapp"
  | "instagram"
  | "facebook"
  | "telegram"
  | "email"
  | "default";

const SIZE_CLASSES: Record<DesklabsAvatarSize, string> = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-[11px]",
  md: "h-10 w-10 text-xs",
  lg: "h-12 w-12 text-sm",
  xl: "h-14 w-14 text-base",
};

const STATUS_DOT_CLASSES: Record<DesklabsAvatarStatus, string> = {
  online: "bg-emerald-500",
  offline: "bg-slate-300",
  busy: "bg-red-500",
  away: "bg-amber-400",
};

const STATUS_RING_CLASSES: Record<DesklabsAvatarStatus, string> = {
  online: "ring-emerald-100",
  offline: "ring-white",
  busy: "ring-red-100",
  away: "ring-amber-100",
};

const FALLBACK_COLORS = [
  "bg-sky-100 text-sky-800",
  "bg-violet-100 text-violet-800",
  "bg-emerald-100 text-emerald-800",
  "bg-amber-100 text-amber-800",
  "bg-rose-100 text-rose-800",
  "bg-indigo-100 text-indigo-800",
] as const;

export function getDesklabsAvatarInitials(name: string) {
  return getSafeInitials(name);
}

export function getDesklabsAvatarColorClass(seed: string) {
  let hash = 0;

  for (let index = 0; index < seed.length; index += 1) {
    hash = seed.charCodeAt(index) + ((hash << 5) - hash);
  }

  return FALLBACK_COLORS[Math.abs(hash) % FALLBACK_COLORS.length];
}

export type DesklabsAvatarProps = {
  name: string;
  imageUrl?: string | null;
  size?: DesklabsAvatarSize;
  shape?: "circle" | "rounded";
  status?: DesklabsAvatarStatus | null;
  channel?: DesklabsAvatarChannel;
  /** Reserved for group chats — show sender name above avatar in message rows. */
  isGroupChat?: boolean;
  fallbackClassName?: string;
  fallbackBackgroundColor?: string;
  className?: string;
};

export function DesklabsAvatar({
  name,
  imageUrl,
  size = "md",
  shape = "circle",
  status = null,
  channel: _channel = "default",
  isGroupChat: _isGroupChat = false,
  fallbackClassName,
  fallbackBackgroundColor,
  className,
}: DesklabsAvatarProps) {
  const radiusClass = shape === "rounded" ? "rounded-lg" : "rounded-full";
  const initials = getDesklabsAvatarInitials(name);
  const colorClass = fallbackClassName ?? getDesklabsAvatarColorClass(name);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  const showImage = Boolean(imageUrl) && !imageFailed;

  useEffect(() => {
    setImageLoaded(false);
    setImageFailed(false);
  }, [imageUrl]);

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 overflow-hidden ring-2 ring-white",
        SIZE_CLASSES[size],
        radiusClass,
        className,
      )}
    >
      <span
        className={cn(
          "absolute inset-0 inline-flex items-center justify-center font-semibold",
          radiusClass,
          !fallbackBackgroundColor && colorClass,
        )}
        style={
          fallbackBackgroundColor
            ? { backgroundColor: fallbackBackgroundColor }
            : undefined
        }
        aria-hidden={showImage && imageLoaded}
      >
        <span className={fallbackBackgroundColor ? "text-white" : undefined}>
          {initials}
        </span>
      </span>

      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl!}
          alt={name}
          loading="lazy"
          decoding="async"
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageFailed(true)}
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ease-out",
            radiusClass,
            imageLoaded ? "opacity-100" : "opacity-0",
          )}
        />
      ) : null}

      {status ? (
        <span
          className={cn(
            "absolute bottom-0 right-0 z-10 rounded-full ring-2",
            size === "xs" || size === "sm" ? "h-2 w-2" : "h-2.5 w-2.5",
            STATUS_DOT_CLASSES[status],
            STATUS_RING_CLASSES[status],
          )}
          aria-hidden
        />
      ) : null}
    </span>
  );
}

export type DesklabsAvatarGroupProps = {
  items: Array<{ name: string; imageUrl?: string | null }>;
  max?: number;
  size?: DesklabsAvatarSize;
  className?: string;
};

export function DesklabsAvatarGroup({
  items,
  max = 4,
  size = "md",
  className,
}: DesklabsAvatarGroupProps) {
  const visible = items.slice(0, max);
  const overflow = items.length - visible.length;

  return (
    <div className={cn("flex items-center", className)}>
      {visible.map((item, index) => (
        <DesklabsAvatar
          key={`${item.name}-${index}`}
          name={item.name}
          imageUrl={item.imageUrl}
          size={size}
          className={cn(index > 0 && "-ml-2")}
        />
      ))}
      {overflow > 0 ? (
        <span
          className={cn(
            "-ml-2 inline-flex items-center justify-center rounded-full bg-muted font-semibold text-muted-foreground ring-2 ring-background",
            SIZE_CLASSES[size],
          )}
        >
          +{overflow}
        </span>
      ) : null}
    </div>
  );
}
