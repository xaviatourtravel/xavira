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
    <header className="space-y-4">
      <div className="flex items-start gap-3">
        {iconSlug ? (
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-muted/30">
            <BusinessBrainSectionIcon slug={iconSlug} />
          </span>
        ) : null}
        <div className="min-w-0 space-y-1">
          <h2 className="text-base font-semibold tracking-tight text-foreground md:text-lg">
            {title}
          </h2>
          {description ? (
            <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
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
    <div className="mx-auto w-full max-w-[1440px]">
      <header className="border-b border-border pb-5">
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "inline-flex h-10 w-10 items-center justify-center rounded-xl",
              "border border-border bg-muted/30 text-foreground",
            )}
          >
            <BusinessBrainSectionIcon slug="module" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
              {t("businessBrain.title")}
            </h1>
            <p className="text-sm text-muted-foreground md:text-base">
              {t("businessBrain.subtitle")}
            </p>
          </div>
        </div>
      </header>

      <div className="space-y-6 pt-6">
        {tabs}
        <main className="space-y-6">{children}</main>
      </div>
    </div>
  );
}
