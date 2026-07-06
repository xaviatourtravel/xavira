"use client";

import { useCallback } from "react";
import { ArrowRight, Circle, Loader2 } from "lucide-react";

import { DsButton } from "@/components/design-system/button";
import { DsCard } from "@/components/design-system/card";
import { useBusinessBrainWorkspaceOptional } from "@/modules/business-brain/components/business-brain-workspace-context";
import {
  coverageScoreIndicator,
  getWeakestCoverageCategories,
} from "@/modules/business-brain/lib/knowledge-coverage-calculator";
import {
  getKnowledgeCoverageNavTarget,
  knowledgeCoverageCategoryDisplayName,
} from "@/modules/business-brain/lib/knowledge-coverage-navigation";
import type {
  KnowledgeCoverageCategoryResult,
  KnowledgeCoverageResult,
  KnowledgeCoverageStatus,
} from "@/modules/business-brain/types/knowledge-coverage";
import { sectionSlugFromHref } from "@/modules/business-brain/types/business-brain-workspace";
import { useTranslation } from "@/lib/i18n/use-translation";
import { useBbTranslation } from "@/modules/business-brain/hooks/use-bb-translation";
import { bbCoverageStatusLabel } from "@/modules/business-brain/lib/bb-ui-labels";
import { cn } from "@/lib/utils";

type BusinessBrainKnowledgeCoverageSectionProps = {
  coverage: KnowledgeCoverageResult;
  isRefreshing?: boolean;
};

const STATUS_BADGE_STYLES: Record<KnowledgeCoverageStatus, string> = {
  Excellent: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  Good: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  Fair: "bg-amber-500/10 text-amber-800 dark:text-amber-300",
  Poor: "bg-destructive/10 text-destructive",
};

function overallScoreTone(score: number): string {
  if (score >= 70) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 40) return "text-amber-600 dark:text-amber-400";
  return "text-destructive";
}

function useNavigateToTargetPage() {
  const workspace = useBusinessBrainWorkspaceOptional();

  return useCallback(
    (targetPage: string) => {
      const slug = sectionSlugFromHref(targetPage);
      if (workspace && slug) {
        workspace.navigate(slug);
        window.history.replaceState({ bbSection: slug }, "", targetPage);
        return;
      }

      window.location.assign(targetPage);
    },
    [workspace],
  );
}

function CoverageStatusIcon({ score }: { score: number }) {
  const indicator = coverageScoreIndicator(score);
  const tone =
    indicator === "green"
      ? "text-emerald-500"
      : indicator === "yellow"
        ? "text-amber-500"
        : "text-destructive";

  return (
    <Circle
      className={cn("h-4 w-4 shrink-0 fill-current", tone)}
      strokeWidth={1.75}
      aria-hidden
    />
  );
}

function CoverageProgressBar({ score }: { score: number }) {
  const barTone =
    score >= 70
      ? "bg-emerald-500"
      : score >= 40
        ? "bg-amber-500"
        : "bg-destructive";

  return (
    <div className="h-2 overflow-hidden rounded-full bg-muted">
      <div
        className={cn("h-full rounded-full transition-all", barTone)}
        style={{ width: `${score}%` }}
      />
    </div>
  );
}

function CategoryRow({
  item,
  onNavigate,
}: {
  item: KnowledgeCoverageCategoryResult;
  onNavigate: (targetPage: string) => void;
}) {
  const { bb } = useBbTranslation();
  const nav = getKnowledgeCoverageNavTarget(item.category);
  const displayName = knowledgeCoverageCategoryDisplayName(item.category);

  return (
    <button
      type="button"
      onClick={() => onNavigate(nav.targetPage)}
      className="group grid w-full grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto_auto] items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 text-left transition-colors hover:border-border hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="flex min-w-0 items-center gap-2 text-sm font-medium text-foreground">
        <CoverageStatusIcon score={item.coverageScore} />
        <span className="truncate">{displayName}</span>
      </span>
      <CoverageProgressBar score={item.coverageScore} />
      <span className="w-10 text-right text-sm font-semibold tabular-nums text-foreground">
        {item.coverageScore}%
      </span>
      <span
        className={cn(
          "inline-flex min-w-[4.5rem] justify-center rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
          STATUS_BADGE_STYLES[item.status],
        )}
      >
        {bbCoverageStatusLabel(bb, item.status)}
      </span>
    </button>
  );
}

function WeakestCoverageItem({
  item,
  onNavigate,
}: {
  item: KnowledgeCoverageCategoryResult;
  onNavigate: (targetPage: string) => void;
}) {
  const nav = getKnowledgeCoverageNavTarget(item.category);
  const displayName = knowledgeCoverageCategoryDisplayName(item.category);

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          <CoverageStatusIcon score={item.coverageScore} />
          <p className="text-sm font-semibold text-foreground">{displayName}</p>
          <span className="text-sm font-semibold tabular-nums text-muted-foreground">
            {item.coverageScore}%
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          {item.articleCount} articles · {item.productCount} products · {item.documentCount}{" "}
          documents
        </p>
      </div>
      <DsButton
        type="button"
        variant="outline"
        size="sm"
        className="shrink-0"
        onClick={() => onNavigate(nav.targetPage)}
      >
        {nav.quickAddLabel}
        <ArrowRight className="h-4 w-4" />
      </DsButton>
    </div>
  );
}

export function BusinessBrainKnowledgeCoverageSection({
  coverage,
  isRefreshing = false,
}: BusinessBrainKnowledgeCoverageSectionProps) {
  const { tStrict } = useTranslation();
  const { bb } = useBbTranslation();
  const navigateToTarget = useNavigateToTargetPage();
  const weakest = getWeakestCoverageCategories(coverage.categories, 3);

  return (
    <div className="space-y-6">
      <DsCard
        title={tStrict("businessBrain.knowledgeCoverage")}
        description={tStrict("businessBrain.knowledgeCoverageDescription")}
      >
        {isRefreshing ? (
          <div className="mb-4 flex justify-end">
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
              {tStrict("businessBrain.updating")}
            </span>
          </div>
        ) : null}
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-muted/20 px-6 py-5 text-center">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {tStrict("businessBrain.overall")}
            </p>
            <p
              className={cn(
                "mt-2 text-4xl font-semibold tabular-nums",
                overallScoreTone(coverage.overallCoverage),
              )}
            >
              {coverage.overallCoverage}%
            </p>
          </div>

          <div className="space-y-1">
            <p className="px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {tStrict("businessBrain.categories")}
            </p>
            <div className="space-y-1">
              {coverage.categories.map((item) => (
                <CategoryRow
                  key={item.category}
                  item={item}
                  onNavigate={navigateToTarget}
                />
              ))}
            </div>
          </div>
        </div>
      </DsCard>

      {weakest.length > 0 ? (
        <DsCard
          title={tStrict("businessBrain.weakestCoverage")}
          description={bb("weakestCoverageDescription")}
        >
          <div className="space-y-3">
            {weakest.map((item) => (
              <WeakestCoverageItem
                key={item.category}
                item={item}
                onNavigate={navigateToTarget}
              />
            ))}
          </div>
        </DsCard>
      ) : null}

      <p className="text-xs text-muted-foreground">
        Scores are calculated from Products, Knowledge, Documents, Identity, and Rules. No AI
        calls.
      </p>
    </div>
  );
}
