"use client";

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type InboxEmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
  size?: "default" | "compact";
};

export function InboxEmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  size = "default",
}: InboxEmptyStateProps) {
  const compact = size === "compact";

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "px-4 py-6" : "px-6 py-10",
        className,
      )}
    >
      <Icon
        className={cn(
          "text-muted-foreground/45",
          compact ? "h-7 w-7" : "h-9 w-9",
        )}
        aria-hidden
      />
      <p
        className={cn(
          "font-medium text-foreground",
          compact ? "mt-3 text-sm" : "mt-4 text-sm",
        )}
      >
        {title}
      </p>
      <p
        className={cn(
          "max-w-xs leading-relaxed text-muted-foreground",
          compact ? "mt-1 text-xs" : "mt-2 text-xs",
        )}
      >
        {description}
      </p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
