"use client";

import { Search } from "lucide-react";

import { cn } from "@/lib/utils";

import { AURORA_MOTION } from "./aurora-tokens";

export type WorkspaceHeaderSearchProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  ariaLabel: string;
  id?: string;
  className?: string;
};

/**
 * Global workspace search field — consistent placement and sizing in every module header.
 */
export function WorkspaceHeaderSearch({
  value,
  onChange,
  placeholder,
  ariaLabel,
  id,
  className,
}: WorkspaceHeaderSearchProps) {
  return (
    <div className={cn("relative min-w-0", className)}>
      <Search
        className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <input
        id={id}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className={cn(
          "h-8 w-full rounded-[14px] border-0 bg-muted/25 pl-8 pr-3 text-sm outline-none ring-offset-background",
          "placeholder:text-muted-foreground/80",
          "focus-visible:bg-muted/35 focus-visible:ring-2 focus-visible:ring-ring/15",
          "dark:bg-muted/15 dark:focus-visible:bg-muted/25",
          AURORA_MOTION.hover,
          "transition-colors",
        )}
      />
    </div>
  );
}
