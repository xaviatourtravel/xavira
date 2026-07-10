import type { ReactNode } from "react";

import { sceneStyles } from "@/components/marketing/product-scenes/scene-styles";
import { cn } from "@/lib/utils";

export function SceneToolbar({ title }: { title?: string }) {
  return (
    <div className="flex items-center gap-2 border-b border-[var(--marketing-border-subtle)] px-3 py-2 sm:px-4 sm:py-2.5">
      <div className="flex gap-1.5" aria-hidden>
        <span className="h-2.5 w-2.5 rounded-full bg-[var(--marketing-border-strong)]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[var(--marketing-border-strong)]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[var(--marketing-accent-secondary)] opacity-70" />
      </div>
      {title ? (
        <p className={cn(sceneStyles.meta, "mx-auto truncate")}>{title}</p>
      ) : (
        <div className="mx-auto h-4 w-28 rounded bg-[var(--marketing-surface-muted)]" aria-hidden />
      )}
    </div>
  );
}

export function ScenePanel({
  children,
  className,
  title,
  padding = "default",
}: {
  children: ReactNode;
  className?: string;
  title?: string;
  padding?: "none" | "compact" | "default";
}) {
  const pad =
    padding === "none" ? "" : padding === "compact" ? "p-2.5 sm:p-3" : "p-3 sm:p-4";

  return (
    <div className={cn(sceneStyles.surface, pad, className)}>
      {title ? <p className={cn(sceneStyles.title, "mb-2")}>{title}</p> : null}
      {children}
    </div>
  );
}

export function SceneCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(sceneStyles.surfaceMuted, "p-2.5 sm:p-3", className)}>{children}</div>
  );
}
