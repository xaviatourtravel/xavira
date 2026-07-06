"use client";



import { useCallback } from "react";

import {

  AlertTriangle,

  ArrowRight,

  CheckCircle2,

  Sparkles,

  TrendingUp,

  Zap,

} from "lucide-react";



import { DsButton } from "@/components/design-system/button";

import { DsCard } from "@/components/design-system/card";

import { useBusinessBrainWorkspaceOptional } from "@/modules/business-brain/components/business-brain-workspace-context";

import type {

  BusinessBrainHealth,

  BusinessBrainHealthRecommendation,

  BusinessBrainHealthRecommendationPriority,

} from "@/modules/business-brain/types/business-brain-health";

import { topBusinessBrainQuickFixes } from "@/modules/business-brain/types/business-brain-health";

import { sectionSlugFromHref } from "@/modules/business-brain/types/business-brain-workspace";
import { useTranslation } from "@/lib/i18n/use-translation";
import { cn } from "@/lib/utils";



type BusinessBrainHealthDashboardProps = {

  health: BusinessBrainHealth;

};



const PRIORITY_STYLES: Record<
  BusinessBrainHealthRecommendationPriority,
  { badge: string }
> = {
  high: {
    badge: "bg-destructive/10 text-destructive",
  },
  medium: {
    badge: "bg-amber-500/10 text-amber-800 dark:text-amber-300",
  },
  low: {
    badge: "bg-muted text-muted-foreground",
  },
};



function scoreTone(score: number): string {

  if (score >= 75) return "text-emerald-600 dark:text-emerald-400";

  if (score >= 50) return "text-amber-600 dark:text-amber-400";

  return "text-destructive";

}



function ScoreRing({ score, label }: { score: number; label: string }) {

  return (

    <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card px-4 py-5 text-center">

      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">

        {label}

      </p>

      <p className={cn("mt-2 text-4xl font-semibold tabular-nums", scoreTone(score))}>

        {score}%

      </p>

    </div>

  );

}



function SectionScoreBar({

  label,

  score,

  weight,

}: {

  label: string;

  score: number;

  weight: string;

}) {

  return (

    <div className="space-y-2">

      <div className="flex items-center justify-between gap-2 text-xs">

        <span className="font-medium text-foreground">{label}</span>

        <span className="text-muted-foreground">

          {score}% · {weight}

        </span>

      </div>

      <div className="h-2 overflow-hidden rounded-full bg-muted">

        <div

          className="h-full rounded-full bg-primary transition-all"

          style={{ width: `${score}%` }}

        />

      </div>

    </div>

  );

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



const PRIORITY_LABEL_KEYS = {
  high: "businessBrain.priorityCritical",
  medium: "businessBrain.priorityRecommended",
  low: "businessBrain.priorityOptional",
} as const satisfies Record<
  BusinessBrainHealthRecommendationPriority,
  `businessBrain.${string}`
>;

function PriorityBadge({ priority }: { priority: BusinessBrainHealthRecommendationPriority }) {
  const { tStrict } = useTranslation();
  const styles = PRIORITY_STYLES[priority];

  return (
    <span
      className={cn(
        "inline-flex rounded-md px-2 py-0.5 text-[10px] font-semibold tracking-wide",
        styles.badge,
      )}
    >
      {tStrict(PRIORITY_LABEL_KEYS[priority])}
    </span>
  );
}



function RecommendationCard({ item }: { item: BusinessBrainHealthRecommendation }) {

  const navigateToTarget = useNavigateToTargetPage();



  return (

    <article className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">

      <div className="flex items-start justify-between gap-3">

        <div className="space-y-1">

          <PriorityBadge priority={item.priority} />

          <h4 className="text-sm font-semibold text-foreground">{item.title}</h4>

        </div>

        <span className="shrink-0 text-xs font-semibold text-emerald-700 dark:text-emerald-400">

          {item.impact}

        </span>

      </div>

      <p className="text-sm leading-relaxed text-muted-foreground">{item.description}</p>

      <DsButton

        type="button"

        variant="outline"

        size="sm"

        className="w-fit"

        onClick={() => navigateToTarget(item.targetPage)}

      >

        {item.targetLabel}

        <ArrowRight className="h-4 w-4" />

      </DsButton>

    </article>

  );

}



function ReadyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-6 py-10 text-center">
      <Sparkles
        className="mx-auto h-8 w-8 text-emerald-600 dark:text-emerald-400"
        aria-hidden
      />
      <h3 className="mt-4 text-base font-semibold text-foreground">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
    </div>
  );
}



export function BusinessBrainHealthDashboard({ health }: BusinessBrainHealthDashboardProps) {
  const { t } = useTranslation();
  const quickFixes = topBusinessBrainQuickFixes(health.recommendations);
  const isReady = health.recommendations.length === 0 && health.weaknesses.length === 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <ScoreRing score={health.overallScore} label={t("businessBrain.health")} />
        <ScoreRing score={health.overallScore} label={t("businessBrain.aiReadinessScore")} />
        <ScoreRing
          score={health.estimatedAiAccuracy}
          label={t("businessBrain.expectedAiResponseQuality")}
        />
      </div>

      <DsCard
        title={t("businessBrain.sectionScores")}
        description={t("businessBrain.sectionScoresDescription")}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <SectionScoreBar
            label={t("businessBrain.identity")}
            score={health.identityScore}
            weight="20%"
          />
          <SectionScoreBar
            label={t("businessBrain.products")}
            score={health.productScore}
            weight="20%"
          />
          <SectionScoreBar
            label={t("businessBrain.knowledge")}
            score={health.knowledgeScore}
            weight="25%"
          />
          <SectionScoreBar
            label={t("businessBrain.documents")}
            score={health.documentScore}
            weight="15%"
          />
          <SectionScoreBar
            label={t("businessBrain.rules")}
            score={health.behaviorScore}
            weight="20%"
          />
        </div>
      </DsCard>

      {isReady ? (
        <ReadyState
          title={t("businessBrain.readyTitle")}
          description={t("businessBrain.readyDescription")}
        />
      ) : (
        <>
          {quickFixes.length > 0 ? (
            <DsCard
              title={t("businessBrain.recommendedActions")}
              description={t("businessBrain.recommendedActionsDescription")}
            >
              <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
                <Zap className="h-4 w-4 shrink-0 text-amber-500" aria-hidden />
                {t("businessBrain.recommendedActionsHint")}
              </div>

              <div className="grid gap-4 lg:grid-cols-3">

                {quickFixes.map((item) => (

                  <RecommendationCard key={item.id} item={item} />

                ))}

              </div>

            </DsCard>

          ) : null}



          <div className="grid gap-4 lg:grid-cols-2">

            <DsCard
              title={t("businessBrain.wellCovered")}
              description={t("businessBrain.wellCoveredDescription")}
              className="h-full"
            >

              {health.strengths.length > 0 ? (

                <ul className="space-y-2">

                  {health.strengths.map((item) => (

                    <li

                      key={item}

                      className="flex items-start gap-2 rounded-lg bg-emerald-500/5 px-3 py-2.5 text-sm leading-relaxed text-foreground"

                    >

                      <CheckCircle2

                        className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400"

                        aria-hidden

                      />

                      <span>{item}</span>

                    </li>

                  ))}

                </ul>

              ) : (

                <p className="text-sm text-muted-foreground">
                  {t("businessBrain.wellCoveredEmpty")}
                </p>

              )}

            </DsCard>



            <DsCard
              title={t("businessBrain.needsImprovement")}
              description={t("businessBrain.needsImprovementDescription")}
              className="h-full"
            >

              {health.weaknesses.length > 0 ? (

                <ul className="space-y-2">

                  {health.weaknesses.map((item) => (

                    <li

                      key={item}

                      className="flex items-start gap-2 rounded-lg bg-amber-500/5 px-3 py-2.5 text-sm leading-relaxed text-foreground"

                    >

                      <AlertTriangle

                        className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400"

                        aria-hidden

                      />

                      <span>{item}</span>

                    </li>

                  ))}

                </ul>

              ) : (

                <p className="text-sm text-muted-foreground">
                  {t("businessBrain.needsImprovementEmpty")}
                </p>

              )}

            </DsCard>

          </div>



          <DsCard
            title={t("businessBrain.allRecommendations")}
            description={t("businessBrain.allRecommendationsDescription")}
          >

            <div className="grid gap-4 md:grid-cols-2">

              {health.recommendations.map((item) => (

                <RecommendationCard key={item.id} item={item} />

              ))}

            </div>

          </DsCard>

        </>

      )}



      <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/20 px-4 py-3 text-xs text-muted-foreground">
        <TrendingUp className="h-4 w-4 shrink-0" aria-hidden />
        {t("businessBrain.scoresFooter")}
      </div>

    </div>

  );

}

