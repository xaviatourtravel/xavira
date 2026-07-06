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
      </div>
    </div>
  );
}
