"use client";

import type { PlaygroundAiScore } from "@/modules/business-brain/types/playground-ai-score";
import type { PlaygroundAiScoreLabel } from "@/modules/business-brain/types/playground-ai-score";
import { useTranslation } from "@/lib/i18n/use-translation";
import { cn } from "@/lib/utils";

type PlaygroundAiScoreCardProps = {
  score: PlaygroundAiScore;
};

const SCORE_LABEL_STYLES = {
  Excellent: "text-emerald-600 dark:text-emerald-400",
  Good: "text-emerald-600/90 dark:text-emerald-400/90",
  "Needs Improvement": "text-amber-600 dark:text-amber-400",
  Poor: "text-destructive",
} as const;

const DIMENSIONS = [
  { key: "tone", labelKey: "testAi.tone" },
  { key: "knowledge", labelKey: "testAi.knowledge" },
  { key: "ruleCompliance", labelKey: "testAi.ruleCompliance" },
  { key: "completeness", labelKey: "testAi.completeness" },
  { key: "naturalness", labelKey: "testAi.naturalness" },
  { key: "groundedness", labelKey: "testAi.groundedness" },
  { key: "answerRelevance", labelKey: "testAi.answerRelevance" },
] as const;

function useLocalizedScoreLabel(label: PlaygroundAiScoreLabel): string {
  const { tStrict } = useTranslation();

  switch (label) {
    case "Excellent":
      return tStrict("testAi.scoreExcellent");
    case "Good":
      return tStrict("testAi.scoreGood");
    case "Needs Improvement":
      return tStrict("testAi.scoreNeedsImprovement");
    case "Poor":
      return tStrict("testAi.scorePoor");
    default:
      return label;
  }
}

function dimensionScoreClass(value: number): string {
  if (value >= 90) return SCORE_LABEL_STYLES.Excellent;
  if (value >= 75) return SCORE_LABEL_STYLES.Good;
  if (value >= 50) return SCORE_LABEL_STYLES["Needs Improvement"];
  return SCORE_LABEL_STYLES.Poor;
}

export function PlaygroundAiScoreCard({ score }: PlaygroundAiScoreCardProps) {
  const { tStrict } = useTranslation();
  const { breakdown, overallLabel } = score;
  const localizedOverallLabel = useLocalizedScoreLabel(overallLabel);

  return (
    <div className="flex justify-start">
      <div className="w-full max-w-[92%] rounded-2xl border border-border bg-muted/25 px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {tStrict("testAi.aiScore")}
            </p>
            <div className="mt-1 flex items-end gap-2">
              <p
                className={cn(
                  "text-3xl font-semibold tabular-nums leading-none",
                  SCORE_LABEL_STYLES[overallLabel],
                )}
              >
                {breakdown.overall}
              </p>
              <p className="pb-0.5 text-xs text-muted-foreground">{tStrict("testAi.overall")}</p>
            </div>
          </div>
          <span
            className={cn(
              "rounded-full bg-background px-2.5 py-1 text-xs font-medium",
              SCORE_LABEL_STYLES[overallLabel],
            )}
          >
            {localizedOverallLabel}
          </span>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-border/70 pt-3">
          {DIMENSIONS.map(({ key, labelKey }) => (
            <div key={key} className="flex items-center justify-between gap-2 text-xs">
              <span className="text-muted-foreground">{tStrict(labelKey)}</span>
              <span
                className={cn(
                  "font-semibold tabular-nums",
                  dimensionScoreClass(breakdown[key]),
                )}
              >
                {breakdown[key]}
              </span>
            </div>
          ))}
        </div>

        {typeof breakdown.modelGeneration === "number" ? (
          <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-border/70 pt-3 text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">Model generation</span>
              <span
                className={cn(
                  "font-semibold tabular-nums",
                  dimensionScoreClass(breakdown.modelGeneration),
                )}
              >
                {breakdown.modelGeneration}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">Final delivery</span>
              <span
                className={cn(
                  "font-semibold tabular-nums",
                  dimensionScoreClass(breakdown.finalDeliverySafety),
                )}
              >
                {breakdown.finalDeliverySafety}
              </span>
            </div>
          </div>
        ) : null}

        {score.groundingDiagnostics ? (
          <div className="mt-3 space-y-1 border-t border-border/70 pt-3 text-[11px] text-muted-foreground">
            <p>
              <span className="font-medium text-foreground">Turn:</span>{" "}
              {score.groundingDiagnostics.turnId ?? "—"}
            </p>
            <p>
              <span className="font-medium text-foreground">Request:</span>{" "}
              {score.groundingDiagnostics.requestType ??
                score.groundingDiagnostics.latestMessageIntent ??
                "—"}
            </p>
            {score.groundingDiagnostics.responsePlannerVersion ? (
              <p>
                <span className="font-medium text-foreground">Runtime:</span> planner{" "}
                {score.groundingDiagnostics.responsePlannerVersion}, geo{" "}
                {score.groundingDiagnostics.geographicEligibilityVersion}
              </p>
            ) : null}
            {score.groundingDiagnostics.previousSelectedEntity ? (
              <p>
                <span className="font-medium text-foreground">Previous product:</span>{" "}
                {score.groundingDiagnostics.previousSelectedEntity}
              </p>
            ) : null}
            {score.groundingDiagnostics.selectedEntity ? (
              <p>
                <span className="font-medium text-foreground">Product:</span>{" "}
                {score.groundingDiagnostics.selectedEntity}
              </p>
            ) : null}
            {score.groundingDiagnostics.selectionOverrideReason ? (
              <p>
                <span className="font-medium text-foreground">Selection override:</span>{" "}
                {score.groundingDiagnostics.selectionOverrideReason}
              </p>
            ) : null}
            <p>
              <span className="font-medium text-foreground">Answerability:</span>{" "}
              {score.groundingDiagnostics.answerability ?? "—"}
            </p>
            <p>
              <span className="font-medium text-foreground">Action:</span>{" "}
              {score.groundingDiagnostics.responseAction ?? "—"}
            </p>
            {score.groundingDiagnostics.catalogEntityIdsDelivered?.length ? (
              <p>
                <span className="font-medium text-foreground">Catalog delivered:</span>{" "}
                {score.groundingDiagnostics.catalogEntityIdsDelivered.join(", ")}
              </p>
            ) : null}
            {score.groundingDiagnostics.unplannedEntityIdsDetected?.length ? (
              <p className="text-destructive">
                Unplanned entities:{" "}
                {score.groundingDiagnostics.unplannedEntityIdsDetected.join(", ")}
              </p>
            ) : null}
            {score.groundingDiagnostics.matchingDepartureDates?.length ? (
              <p>
                <span className="font-medium text-foreground">Matching dates:</span>{" "}
                {score.groundingDiagnostics.matchingDepartureDates.join(", ")}
              </p>
            ) : null}
            {score.groundingDiagnostics.staleTurnDetected ? (
              <p className="text-destructive">Stale turn detected</p>
            ) : null}
            {score.groundingDiagnostics.deterministicFallbackUsed ? (
              <p className="text-amber-600 dark:text-amber-400">Deterministic fallback used</p>
            ) : null}
            {score.groundingDiagnostics.unsupportedClaimDetected ? (
              <p className="text-destructive">
                Unsupported claim: {score.groundingDiagnostics.unsupportedClaimType ?? "unknown"}
              </p>
            ) : null}
            {score.groundingDiagnostics.answerFirstPassed ? (
              <p className="text-emerald-600 dark:text-emerald-400">Answer-first passed</p>
            ) : score.groundingDiagnostics.directAnswerRequired ? (
              <p className="text-amber-600 dark:text-amber-400">Direct answer missing</p>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
