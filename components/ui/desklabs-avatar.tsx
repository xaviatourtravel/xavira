import { cn } from "@/lib/utils";

export type DesklabsAvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

export type DesklabsAvatarStatus = "online" | "offline" | "busy" | "away";

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
  const parts = name.replace(/^@/, "").trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return "?";
  }

  if (parts.length === 1) {
    return parts[0]!.slice(0, 2).toUpperCase();
  }

  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
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
  fallbackClassName,
  fallbackBackgroundColor,
  className,
}: DesklabsAvatarProps) {
  const radiusClass = shape === "rounded" ? "rounded-lg" : "rounded-full";
  const initials = getDesklabsAvatarInitials(name);
  const colorClass = fallbackClassName ?? getDesklabsAvatarColorClass(name);

  const content = imageUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={imageUrl}
      alt={name}
      className={cn("h-full w-full object-cover", radiusClass)}
    />
  ) : (
    <span
      className={cn(
        "inline-flex h-full w-full items-center justify-center font-semibold",
        radiusClass,
        !fallbackBackgroundColor && colorClass,
      )}
      style={fallbackBackgroundColor ? { backgroundColor: fallbackBackgroundColor } : undefined}
      aria-hidden={Boolean(imageUrl)}
    >
      <span className={fallbackBackgroundColor ? "text-white" : undefined}>{initials}</span>
    </span>
  );

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 overflow-hidden ring-2 ring-white",
        SIZE_CLASSES[size],
        radiusClass,
        className,
      )}
    >
      {content}
      {status ? (
        <span
          className={cn(
            "absolute bottom-0 right-0 rounded-full ring-2",
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
            "-ml-2 inline-flex items-center justify-center rounded-full bg-slate-200 font-semibold text-slate-700 ring-2 ring-white",
            SIZE_CLASSES[size],
          )}
        >
          +{overflow}
        </span>
      ) : null}
    </div>
  );
}
