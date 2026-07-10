import { sceneStyles } from "@/components/marketing/product-scenes/scene-styles";
import { cn } from "@/lib/utils";

const AVATAR_COLORS = [
  "bg-[color-mix(in_srgb,var(--marketing-primary)_18%,var(--marketing-surface))] text-[var(--marketing-primary)]",
  "bg-[color-mix(in_srgb,var(--marketing-accent)_16%,var(--marketing-surface))] text-[var(--marketing-accent)]",
  "bg-[color-mix(in_srgb,var(--marketing-accent-secondary)_18%,var(--marketing-surface))] text-[var(--marketing-brand-700)]",
] as const;

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function SceneAvatar({
  name,
  size = "md",
  className,
  index = 0,
}: {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  index?: number;
}) {
  const sizeClass =
    size === "sm" ? "h-7 w-7 text-[10px]" : size === "lg" ? "h-10 w-10 text-xs" : "h-8 w-8 text-[11px]";

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold ring-2 ring-[var(--marketing-background)]",
        AVATAR_COLORS[index % AVATAR_COLORS.length],
        sizeClass,
        className,
      )}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}

export function SceneBadge({
  children,
  tone = "default",
  className,
}: {
  children: React.ReactNode;
  tone?: "default" | "primary" | "accent" | "success" | "warning" | "channel-whatsapp" | "channel-instagram" | "channel-email";
  className?: string;
}) {
  const toneClass = {
    default: "bg-[var(--marketing-surface-muted)] text-[var(--marketing-muted)] ring-[var(--marketing-border-default)]",
    primary: "bg-[var(--marketing-primary-muted)] text-[var(--marketing-primary-muted-foreground)] ring-[var(--marketing-border-accent)]",
    accent: "bg-[color-mix(in_srgb,var(--marketing-accent)_12%,transparent)] text-[var(--marketing-accent)] ring-[color-mix(in_srgb,var(--marketing-accent)_25%,transparent)]",
    success: "bg-[var(--marketing-success-background)] text-[var(--marketing-success)] ring-[var(--marketing-success-border)]",
    warning: "bg-[var(--marketing-warning-background)] text-[var(--marketing-warning)] ring-[var(--marketing-warning-border)]",
    "channel-whatsapp": "bg-[color-mix(in_srgb,var(--marketing-success)_12%,transparent)] text-[var(--marketing-success)] ring-[color-mix(in_srgb,var(--marketing-success)_22%,transparent)]",
    "channel-instagram": "bg-[color-mix(in_srgb,var(--marketing-accent)_12%,transparent)] text-[var(--marketing-accent)] ring-[color-mix(in_srgb,var(--marketing-accent)_22%,transparent)]",
    "channel-email": "bg-[var(--marketing-surface-muted)] text-[var(--marketing-muted)] ring-[var(--marketing-border-default)]",
  }[tone];

  return (
    <span
      className={cn(
        sceneStyles.meta,
        "inline-flex items-center rounded-full px-2 py-0.5 font-semibold ring-1",
        toneClass,
        className,
      )}
    >
      {children}
    </span>
  );
}
