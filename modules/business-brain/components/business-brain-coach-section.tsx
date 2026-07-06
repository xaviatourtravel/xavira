"use client";

import { useCallback } from "react";
import {
  ArrowRight,
  Check,
  Circle,
  Sparkles,
} from "lucide-react";

import { DsButton } from "@/components/design-system/button";
import { DsCard } from "@/components/design-system/card";
import { BusinessBrainSectionIcon } from "@/modules/business-brain/components/business-brain-section-icon";
import { useBusinessBrainWorkspaceOptional } from "@/modules/business-brain/components/business-brain-workspace-context";
import {
  BUSINESS_BRAIN_COACH_CATEGORY_LABELS,
  BUSINESS_BRAIN_COACH_PROGRESS_ORDER,
  businessBrainCoachDifficultyLabel,
  type BusinessBrainCoachCategory,
  type BusinessBrainCoachRecommendation,
  type BusinessBrainCoachResult,
} from "@/modules/business-brain/types/business-brain-coach";
import { sectionSlugFromHref } from "@/modules/business-brain/types/business-brain-workspace";
import { useTranslation } from "@/lib/i18n/use-translation";
import { cn } from "@/lib/utils";

type BusinessBrainCoachSectionProps = {
  coach: BusinessBrainCoachResult;
};

const PRIORITY_STYLES = {
  critical: "bg-destructive/10 text-destructive",
  recommended: "bg-amber-500/10 text-amber-800 dark:text-amber-300",
  optional: "bg-muted text-muted-foreground",
} as const;

const PRIORITY_LABEL_KEYS = {
  critical: "businessBrain.priorityCritical",
  recommended: "businessBrain.priorityRecommended",
  optional: "businessBrain.priorityOptional",
} as const;

function categoryIconSlug(category: BusinessBrainCoachCategory) {
  if (category === "rules") return "behaviors" as const;
  return category;
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

function ProgressChecklist({ progress }: { progress: BusinessBrainCoachResult["completedAreas"] }) {
  const byId = new Map(progress.map((item) => [item.id, item]));
  const items = BUSINESS_BRAIN_COACH_PROGRESS_ORDER.map(
    (id) => byId.get(id) ?? { id, label: BUSINESS_BRAIN_COACH_CATEGORY_LABELS[id], complete: false },
  );

  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item.id} className="flex items-center gap-2.5 text-sm">
          {item.complete ? (
            <Check
              className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400"
              strokeWidth={1.75}
              aria-hidden
            />
          ) : (
            <Circle
              className="h-4 w-4 shrink-0 text-muted-foreground/50"
              strokeWidth={1.75}
              aria-hidden
            />
          )}
          <span
            className={cn(
              item.complete ? "text-foreground" : "text-muted-foreground",
            )}
          >
            {item.label}
          </span>
        </li>
      ))}
    </ul>
  );
}

function CoachRecommendationCard({
  item,
  onNavigate,
}: {
  item: BusinessBrainCoachRecommendation;
  onNavigate: (targetPage: string) => void;
}) {
  const { tStrict } = useTranslation();

  return (
    <article className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4">
      <div className="flex items-start gap-3">
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/30">
          <BusinessBrainSectionIcon slug={categoryIconSlug(item.category)} />
        </span>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              {BUSINESS_BRAIN_COACH_CATEGORY_LABELS[item.category]}
            </span>
            <span
              className={cn(
                "inline-flex rounded-md px-2 py-0.5 text-[10px] font-semibold tracking-wide",
                PRIORITY_STYLES[item.priority],
              )}
            >
              {tStrict(PRIORITY_LABEL_KEYS[item.priority])}
            </span>
          </div>
          <h4 className="text-sm font-semibold text-foreground">{item.title}</h4>
          <p className="text-sm leading-relaxed text-muted-foreground">{item.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 rounded-lg bg-muted/25 px-3 py-2.5">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            {tStrict("testAi.expectedImpact")}
          </p>
          <p className="mt-0.5 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
            {item.impact}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            {tStrict("businessBrain.coachDifficulty")}
          </p>
          <p className="mt-0.5 text-sm font-medium text-foreground">
            {businessBrainCoachDifficultyLabel(item.difficulty)}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            {tStrict("businessBrain.coachTime")}
          </p>
          <p className="mt-0.5 text-sm font-medium text-foreground">{item.estimatedTime}</p>
        </div>
      </div>

      <DsButton
        type="button"
        variant="outline"
        size="sm"
        className="w-fit"
        onClick={() => onNavigate(item.targetPage)}
      >
        {item.cta}
        <ArrowRight className="h-4 w-4" />
      </DsButton>
    </article>
  );
}

function CoachReadyCard({ onNavigate }: { onNavigate: (targetPage: string) => void }) {
  const { tStrict } = useTranslation();

  return (
    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-6 py-8 text-center">
      <Sparkles
        className="mx-auto h-8 w-8 text-emerald-600 dark:text-emerald-400"
        strokeWidth={1.75}
        aria-hidden
      />
      <h3 className="mt-4 text-base font-semibold text-foreground">
        {tStrict("businessBrain.coachReadyTitle")}
      </h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
        {tStrict("businessBrain.coachReadyDescription")}
      </p>
      <DsButton
        type="button"
        className="mt-5"
        onClick={() => onNavigate("/business-brain/playground")}
      >
        {tStrict("businessBrain.openTestAi")}
        <ArrowRight className="h-4 w-4" />
      </DsButton>
    </div>
  );
}

export function BusinessBrainCoachSection({ coach }: BusinessBrainCoachSectionProps) {
  const { tStrict } = useTranslation();
  const navigateToTarget = useNavigateToTargetPage();

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-foreground">
          {tStrict("businessBrain.coachTitle")}
        </h3>
        <p className="text-sm text-muted-foreground">
          {tStrict("businessBrain.coachDescription")}
        </p>
      </div>

      <DsCard title={tStrict("businessBrain.coachProgress")}>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            {coach.completedAreas.length > 0 ? (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {tStrict("businessBrain.coachCompleted")}
                </p>
                <p className="text-sm text-foreground">
                  {coach.completedAreas.map((item) => item.label).join(" · ")}
                </p>
              </div>
            ) : null}
            {coach.missingAreas.length > 0 ? (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {tStrict("businessBrain.coachMissing")}
                </p>
                <p className="text-sm text-foreground">
                  {coach.missingAreas.map((item) => item.label).join(" · ")}
                </p>
              </div>
            ) : null}
          </div>
          <ProgressChecklist
            progress={[...coach.completedAreas, ...coach.missingAreas]}
          />
        </div>
      </DsCard>

      {coach.isReady ? (
        <CoachReadyCard onNavigate={navigateToTarget} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {coach.recommendations.map((item) => (
            <CoachRecommendationCard
              key={item.id}
              item={item}
              onNavigate={navigateToTarget}
            />
          ))}
        </div>
      )}
    </div>
  );
}
