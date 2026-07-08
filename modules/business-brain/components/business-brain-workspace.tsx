"use client";

import type { ReactNode } from "react";

import { BusinessBrainSectionIcon } from "@/modules/business-brain/components/business-brain-section-icon";
import type { BusinessBrainSectionSlug } from "@/modules/business-brain/types/business-brain-workspace";
import { useTranslation } from "@/lib/i18n/use-translation";
import { cn } from "@/lib/utils";

export type BusinessBrainSectionHeaderProps = {
  title: string;
  description?: string;
  iconSlug?: BusinessBrainSectionSlug;
  actions?: ReactNode;
  status?: ReactNode;
};

export function BusinessBrainSectionHeader({
  title,
  description,
  iconSlug,
  actions,
  status,
}: BusinessBrainSectionHeaderProps) {
  return (
    <header className="space-y-2">
      <div className="flex items-start gap-2.5">
        {iconSlug ? (
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border/70 bg-muted/30">
            <BusinessBrainSectionIcon slug={iconSlug} />
          </span>
        ) : null}
        <div className="min-w-0 space-y-0.5">
          <h2 className="text-sm font-semibold tracking-tight text-foreground md:text-base">
            {title}
          </h2>
          {description ? (
            <p className="text-xs leading-relaxed text-muted-foreground md:text-sm">{description}</p>
          ) : null}
        </div>
      </div>
      {actions || status ? (
        <div className="flex flex-wrap items-center gap-2">
          {actions}
          {status}
        </div>
      ) : null}
    </header>
  );
}

export type BusinessBrainWorkspaceProps = {
  tabs: ReactNode;
  children: ReactNode;
};

export function BusinessBrainWorkspace({ tabs, children }: BusinessBrainWorkspaceProps) {
  const { t } = useTranslation();

  return (
    <div className="mx-auto w-full max-w-[1200px]">
      <header className="border-b border-border/70 pb-4">
        <div className="flex items-center gap-2.5">
          <span
            className={cn(
              "inline-flex h-9 w-9 items-center justify-center rounded-lg",
              "border border-border/70 bg-muted/30 text-foreground",
            )}
          >
            <BusinessBrainSectionIcon slug="module" />
          </span>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground md:text-2xl">
              {t("businessBrain.title")}
            </h1>
            <p className="text-xs text-muted-foreground md:text-sm">
              {t("businessBrain.subtitle")}
            </p>
          </div>
        </div>
      </header>

      <div className="space-y-4 pt-4">
        {tabs}
        <main>{children}</main>
      </div>
    </div>
  );
}
