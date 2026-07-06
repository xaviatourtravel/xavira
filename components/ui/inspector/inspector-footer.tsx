import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { INSPECTOR_PADDING } from "./constants";

export function InspectorFooter({
  children,
  label,
  className,
}: {
  children: ReactNode;
  label?: string;
  className?: string;
}) {
  return (
    <footer
      className={cn(
        "sticky bottom-0 z-10 border-t border-border/60 bg-background/95 backdrop-blur",
        "supports-[backdrop-filter]:bg-background/80",
        INSPECTOR_PADDING,
        "py-4",
        className,
      )}
      aria-label={label}
    >
      {children}
    </footer>
  );
}
