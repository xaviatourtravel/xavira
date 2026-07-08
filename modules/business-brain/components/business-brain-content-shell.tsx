"use client";

import type { ReactNode } from "react";

import { DsCard } from "@/components/design-system/card";
import { bbCompactCardClassName } from "@/modules/business-brain/lib/business-brain-compact-styles";
import { cn } from "@/lib/utils";

/** Centered, width-constrained shell for Business Brain section content. */
export function BusinessBrainContentShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-[1160px] space-y-3", className)}>
      {children}
    </div>
  );
}

/** Compact section card shared across Business Brain editors and pages. */
export function BusinessBrainCompactSection({
  title,
  description,
  children,
  className,
}: {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <DsCard
      size="sm"
      title={title}
      description={description}
      className={bbCompactCardClassName(className)}
    >
      {children}
    </DsCard>
  );
}

/** Two-column editor layout: single column on mobile, split on xl+. */
export function BusinessBrainTwoColumnLayout({
  left,
  right,
  className,
}: {
  left: ReactNode;
  right: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-3 xl:grid-cols-2 xl:items-start", className)}>
      <div className="space-y-3">{left}</div>
      <div className="space-y-3">{right}</div>
    </div>
  );
}

/** Master-detail split used by products, knowledge, documents, and behaviors. */
export function BusinessBrainMasterDetailLayout({
  list,
  detail,
  mobileShowDetail,
  listColumnClassName,
  detailColumnClassName,
}: {
  list: ReactNode;
  detail: ReactNode;
  mobileShowDetail: boolean;
  listColumnClassName?: string;
  detailColumnClassName?: string;
}) {
  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)] lg:items-start">
      <div className={cn(mobileShowDetail ? "hidden lg:block" : "block", listColumnClassName)}>
        {list}
      </div>
      <div className={cn(!mobileShowDetail ? "hidden lg:block" : "block", detailColumnClassName)}>
        {detail}
      </div>
    </div>
  );
}

export function BusinessBrainDetailEmptyState({
  message,
  actionLabel,
  onAction,
}: {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="rounded-xl border border-dashed border-border/70 bg-muted/15 px-4 py-10 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
      {actionLabel && onAction ? (
        <button
          type="button"
          className="mt-2 text-sm text-primary hover:underline"
          onClick={onAction}
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
