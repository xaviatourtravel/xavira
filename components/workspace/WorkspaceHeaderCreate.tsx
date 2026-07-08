"use client";

import Link from "next/link";
import { Plus, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

import { AURORA_MOTION, AURORA_WORKSPACE_HEADER_CONTROL } from "./aurora-tokens";

export type WorkspaceHeaderCreateProps = {
  label: string;
  href?: string;
  onClick?: () => void;
  icon?: LucideIcon;
  disabled?: boolean;
  className?: string;
};

/**
 * Primary create action pattern for workspace headers.
 */
export function WorkspaceHeaderCreate({
  label,
  href,
  onClick,
  icon: Icon = Plus,
  disabled = false,
  className,
}: WorkspaceHeaderCreateProps) {
  const classes = cn(
    AURORA_WORKSPACE_HEADER_CONTROL,
    "bg-primary px-3 text-primary-foreground hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50",
    AURORA_MOTION.hover,
    className,
  );

  if (href && !disabled) {
    return (
      <Link href={href} className={classes} aria-label={label}>
        <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
        <span className="hidden sm:inline">{label}</span>
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={classes}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
