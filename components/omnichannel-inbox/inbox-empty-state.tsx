"use client";

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type InboxEmptyStateVariant = "workspace" | "compact" | "inline";

type InboxEmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  hint?: string;
  action?: ReactNode;
  className?: string;
  /** @deprecated Use variant="compact" */
  size?: "default" | "compact";
  variant?: InboxEmptyStateVariant;
};

const VARIANT_CONFIG: Record<
  InboxEmptyStateVariant,
  {
    padding: string;
    iconWrap: string;
    icon: string;
    title: string;
    description: string;
    descriptionMaxWidth: string;
    hint: string;
    action: string;
  }
> = {
  workspace: {
    padding: "px-6 py-12",
    iconWrap: "h-20 w-20 rounded-2xl bg-muted/15",
    icon: "h-6 w-6 text-muted-foreground/45",
    title: "mt-6 text-xl font-semibold text-foreground",
    description: "mt-3 max-w-[360px] text-sm leading-relaxed text-muted-foreground",
    descriptionMaxWidth: "max-w-[360px]",
    hint: "mt-5 text-xs leading-relaxed text-muted-foreground/60",
    action: "mt-6",
  },
  compact: {
    padding: "px-5 py-10",
    iconWrap: "h-16 w-16 rounded-2xl bg-muted/15",
    icon: "h-6 w-6 text-muted-foreground/45",
    title: "mt-5 text-base font-semibold text-foreground",
    description: "mt-2.5 max-w-[320px] text-sm leading-relaxed text-muted-foreground",
    descriptionMaxWidth: "max-w-[320px]",
    hint: "mt-4 text-xs leading-relaxed text-muted-foreground/60",
    action: "mt-5",
  },
  inline: {
    padding: "px-5 py-10",
    iconWrap: "h-16 w-16 rounded-2xl bg-muted/15",
    icon: "h-5 w-5 text-muted-foreground/45",
    title: "mt-5 text-base font-semibold text-foreground",
    description: "mt-3 max-w-[320px] text-sm leading-relaxed text-muted-foreground",
    descriptionMaxWidth: "max-w-[320px]",
    hint: "mt-4 text-xs leading-relaxed text-muted-foreground/55",
    action: "mt-5",
  },
};

function resolveVariant(
  variant: InboxEmptyStateVariant | undefined,
  size: "default" | "compact",
): InboxEmptyStateVariant {
  if (variant) {
    return variant;
  }

  return size === "compact" ? "compact" : "workspace";
}

export function InboxEmptyState({
  icon: Icon,
  title,
  description,
  hint,
  action,
  className,
  size = "default",
  variant,
}: InboxEmptyStateProps) {
  const resolvedVariant = resolveVariant(variant, size);
  const config = VARIANT_CONFIG[resolvedVariant];

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        "animate-in fade-in duration-150 ease-out motion-reduce:animate-none",
        config.padding,
        className,
      )}
    >
      <div
        className={cn(
          "flex shrink-0 items-center justify-center",
          config.iconWrap,
        )}
        aria-hidden
      >
        <Icon className={config.icon} strokeWidth={1.5} />
      </div>

      <p className={config.title}>{title}</p>

      <p className={cn(config.description, config.descriptionMaxWidth)}>
        {description}
      </p>

      {hint ? <p className={config.hint}>{hint}</p> : null}

      {action ? <div className={config.action}>{action}</div> : null}
    </div>
  );
}
