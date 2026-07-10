import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type MarketingIconProps = {
  icon: LucideIcon;
  size?: "sm" | "md" | "lg";
  tone?: "default" | "accent" | "dark" | "muted";
  className?: string;
};

const sizeClasses = {
  sm: "h-8 w-8 [&_svg]:h-4 [&_svg]:w-4",
  md: "h-10 w-10 [&_svg]:h-5 [&_svg]:w-5",
  lg: "h-11 w-11 [&_svg]:h-5 [&_svg]:w-5",
} as const;

const toneClasses = {
  default: "bg-slate-950 text-white",
  accent: "bg-[var(--marketing-primary)] text-white",
  dark: "bg-slate-950 text-white",
  muted: "bg-slate-100 text-slate-700",
} as const;

/** Standard icon container for cards and feature lists */
export function MarketingIcon({
  icon: Icon,
  size = "md",
  tone = "default",
  className,
}: MarketingIconProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-xl",
        sizeClasses[size],
        toneClasses[tone],
        className,
      )}
      aria-hidden
    >
      <Icon />
    </span>
  );
}

/** Inline check/dot list marker */
export function MarketingListMarker({
  variant = "dot",
  positive,
}: {
  variant?: "dot" | "check";
  positive?: boolean;
}) {
  if (variant === "check") {
    return (
      <span
        className={cn(
          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
          positive
            ? "bg-[var(--marketing-success-background)] text-[var(--marketing-success)]"
            : "bg-slate-100 text-slate-600",
        )}
        aria-hidden
      >
        ✓
      </span>
    );
  }

  return (
    <span
      className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--marketing-primary)]"
      aria-hidden
    />
  );
}
