import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

import { INSPECTOR_HOVER_CLASS } from "./constants";

export type InspectorActionVariant = "primary" | "secondary" | "ghost";

const VARIANT_STYLES: Record<InspectorActionVariant, string> = {
  primary: "bg-primary text-primary-foreground hover:bg-primary/90",
  secondary:
    "border border-border/50 bg-transparent text-foreground hover:bg-muted/40",
  ghost: "text-foreground hover:bg-muted/40",
};

export function InspectorAction({
  className,
  variant = "secondary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: InspectorActionVariant;
}) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium",
        INSPECTOR_HOVER_CLASS,
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "disabled:cursor-not-allowed disabled:opacity-50",
        VARIANT_STYLES[variant],
        className,
      )}
      {...props}
    />
  );
}

export function InspectorActionLink({
  href,
  children,
  className,
  variant = "secondary",
}: {
  href: string;
  children: ReactNode;
  className?: string;
  variant?: "primary" | "secondary";
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium",
        INSPECTOR_HOVER_CLASS,
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        VARIANT_STYLES[variant],
        className,
      )}
    >
      {children}
    </Link>
  );
}
