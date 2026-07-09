"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

import { AURORA_NAV_ICON_BUTTON } from "@/components/workspace/aurora-tokens";
import { cn } from "@/lib/utils";

export type NavIconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
  /** Slightly stronger border for emphasis (e.g. AI trigger) */
  variant?: "default" | "emphasized";
  children: ReactNode;
};

export function NavIconButton({
  active = false,
  variant = "default",
  className,
  children,
  type = "button",
  ...props
}: NavIconButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        AURORA_NAV_ICON_BUTTON,
        active && "bg-muted/30",
        variant === "emphasized" &&
          "border-border/30 hover:border-border/40 hover:bg-muted/35",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
