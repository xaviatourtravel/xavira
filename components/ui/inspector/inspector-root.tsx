import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { INSPECTOR_FADE_CLASS } from "./constants";

export function InspectorRoot({
  children,
  className,
  fade = false,
}: {
  children: ReactNode;
  className?: string;
  /** Apply 150ms fade-in on mount (workspace tab switch) */
  fade?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex min-h-full flex-col",
        fade && INSPECTOR_FADE_CLASS,
        className,
      )}
    >
      {children}
    </div>
  );
}
