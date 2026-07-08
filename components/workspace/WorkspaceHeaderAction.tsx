"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

import { AURORA_MOTION, AURORA_WORKSPACE_HEADER_CONTROL } from "./aurora-tokens";

export type WorkspaceHeaderActionProps = {
  label: string;
  href?: string;
  onClick?: () => void;
  icon?: LucideIcon;
  disabled?: boolean;
  hideLabelOnMobile?: boolean;
  variant?: "ghost" | "outline";
  className?: string;
};

const VARIANT_CLASS = {
  ghost:
    "px-2.5 text-muted-foreground hover:bg-muted/50 hover:text-foreground",
  outline:
    "border border-border/40 px-3 text-foreground hover:bg-muted/40",
} as const;

/**
 * Secondary workspace header action — icon + optional label.
 */
export function WorkspaceHeaderAction({
  label,
  href,
  onClick,
  icon: Icon,
  disabled = false,
  hideLabelOnMobile = true,
  variant = "outline",
  className,
}: WorkspaceHeaderActionProps) {
  const classes = cn(
    AURORA_WORKSPACE_HEADER_CONTROL,
    VARIANT_CLASS[variant],
    AURORA_MOTION.hover,
    className,
  );

  const content = (
    <>
      {Icon ? <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden /> : null}
      <span className={cn(hideLabelOnMobile && "hidden sm:inline")}>{label}</span>
    </>
  );

  if (href && !disabled) {
    return (
      <Link href={href} className={classes} aria-label={label} title={label}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={classes}
    >
      {content}
    </button>
  );
}
