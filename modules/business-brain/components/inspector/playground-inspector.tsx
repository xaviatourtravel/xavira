"use client";

import { AlertTriangle, Check, Search } from "lucide-react";
import { useMemo } from "react";

import { BusinessBrainInspector } from "@/modules/business-brain/components/business-brain-inspector";
import {
  InspectorBadge,
  InspectorEmptyState,
  InspectorKeyValueRow,
  InspectorSection,
} from "@/modules/business-brain/components/inspector/inspector-primitives";
import { buildPlaygroundInspectorView } from "@/modules/business-brain/lib/build-playground-inspector-view";
import { buildPlaygroundImprovementSuggestions } from "@/modules/business-brain/lib/build-playground-improvement-suggestions";
import { confidenceQualityToneClass } from "@/modules/business-brain/lib/build-playground-confidence-breakdown";
import { PlaygroundImprovementSuggestionsSection } from "@/modules/business-brain/components/playground-improvement-suggestions-section";
import type { BusinessBrainHealth } from "@/modules/business-brain/types/business-brain-health";
import type { KnowledgeCoverageResult } from "@/modules/business-brain/types/knowledge-coverage";
import type { PlaygroundConfidenceBreakdown } from "@/modules/business-brain/types/playground-confidence-breakdown";
import type { PlaygroundTestResult } from "@/modules/business-brain/types/playground";
import { useTranslation } from "@/lib/i18n/use-translation";
import { cn } from "@/lib/utils";

type PlaygroundInspectorProps = {
  testResult: PlaygroundTestResult | null;
  health: BusinessBrainHealth;
  knowledgeCoverage: KnowledgeCoverageResult;
};

const CONFIDENCE_TONE_CLASS: Record<
  NonNullable<ReturnType<typeof buildPlaygroundInspectorView>>["confidenceTone"],
  string
> = {
  success: "text-emerald-600 dark:text-emerald-400",
  warning: "text-amber-600 dark:text-amber-400",
  danger: "text-destructive",
};

function ConfidenceBreakdown({ breakdown }: { breakdown: PlaygroundConfidenceBreakdown }) {
  const { tStrict } = useTranslation();

  return (
    <div className="mt-3 space-y-2">
      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {tStrict("testAi.breakdown")}
      </p>
      <div className="space-y-2">
        {breakdown.items.map((item) => (
          <div
            key={item.key}
            className="rounded-lg border border-border/70 bg-background px-3 py-2.5"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-foreground">{item.label}</span>
              <span className="text-sm font-semibold tabular-nums text-foreground">
                {item.score}%
              </span>
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
              <span
                className={cn("font-medium", confidenceQualityToneClass(item.qualityLabel))}
              >
                {item.qualityLabel}
              </span>
              {item.explanation ? (
                <span className="text-muted-foreground">{item.explanation}</span>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function KnowledgeSourceList({ sources }: { sources: string[] }) {
  const { tStrict } = useTranslation();

  if (sources.length === 0) {
    return <InspectorEmptyState message={tStrict("testAi.noKnowledgeSources")} />;
  }

  return (
    <ul className="space-y-1.5">
      {sources.map((source) => (
        <li
          key={source}
          className="rounded-lg bg-muted/35 px-3 py-2 text-sm leading-relaxed text-foreground"
        >
          {source}
        </li>
      ))}
    </ul>
  );
}

function RulesAppliedList({ rules }: { rules: string[] }) {
  const { tStrict } = useTranslation();

  if (rules.length === 0) {
    return <InspectorEmptyState message={tStrict("testAi.noRulesApplied")} />;
  }

  return (
    <ul className="space-y-1.5 rounded-lg bg-muted/35 px-3.5 py-3">
      {rules.map((rule) => (
        <li key={rule} className="flex items-start gap-2 text-xs leading-relaxed text-foreground">
          <Check
            className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400"
            aria-hidden
          />
          <span>{rule}</span>
        </li>
      ))}
    </ul>
  );
}

function SuggestedActionsList({ actions }: { actions: string[] }) {
  const { tStrict } = useTranslation();

  if (actions.length === 0) {
    return <InspectorEmptyState message={tStrict("testAi.noSuggestedActions")} />;
  }

  return (
    <ul className="space-y-1.5">
      {actions.map((action) => (
        <li
          key={action}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
        >
          {action}
        </li>
      ))}
    </ul>
  );
}

function WarningsList({ warnings }: { warnings: string[] }) {
  const { tStrict } = useTranslation();

  if (warnings.length === 0) {
    return null;
  }

  return (
    <InspectorSection title={tStrict("testAi.warnings")}>
      <ul className="space-y-2">
        {warnings.map((warning) => (
          <li
            key={warning}
            className="flex items-start gap-2 rounded-lg border border-amber-300/50 bg-amber-50 px-3 py-2.5 text-xs leading-relaxed text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100"
          >
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            <span>{warning}</span>
          </li>
        ))}
      </ul>
    </InspectorSection>
  );
}

export function PlaygroundInspector({
  testResult,
  health,
  knowledgeCoverage,
}: PlaygroundInspectorProps) {
  const { tStrict } = useTranslation();
  const view = useMemo(
    () => (testResult ? buildPlaygroundInspectorView(testResult) : null),
    [testResult],
  );

  const improvementSuggestions = useMemo(
    () =>
      testResult
        ? buildPlaygroundImprovementSuggestions({
            result: testResult,
            health,
            knowledgeCoverage,
          })
        : null,
    [testResult, health, knowledgeCoverage],
  );

  const title = tStrict("testAi.inspectorTitle");
  const subtitle = view
    ? tStrict("testAi.inspectorSubtitle")
    : tStrict("testAi.inspectorEmptySubtitle");

  if (!view) {
    return (
      <BusinessBrainInspector title={title} subtitle={subtitle} icon={Search}>
        <InspectorEmptyState message={tStrict("testAi.inspectorEmptyMessage")} />
      </BusinessBrainInspector>
    );
  }

  return (
    <BusinessBrainInspector title={title} subtitle={subtitle} icon={Search}>
      <InspectorSection title={tStrict("testAi.aiConfidence")}>
        <div className="rounded-lg bg-muted/35 px-3.5 py-4">
          <p
            className={cn(
              "text-4xl font-semibold tracking-tight tabular-nums",
              CONFIDENCE_TONE_CLASS[view.confidenceTone],
            )}
          >
            {view.confidenceBreakdown.overall}%
          </p>
          {view.intent ? (
            <div className="mt-2">
              <InspectorBadge variant="default">
                {tStrict("testAi.intent")}: {view.intent}
              </InspectorBadge>
            </div>
          ) : null}
        </div>
        <ConfidenceBreakdown breakdown={view.confidenceBreakdown} />
      </InspectorSection>

      <InspectorSection title={tStrict("testAi.knowledgeUsed")}>
        <KnowledgeSourceList sources={view.knowledgeUsed} />
      </InspectorSection>

      <InspectorSection title={tStrict("testAi.memory")}>
        {view.memoryRows.length > 0 ? (
          <div className="space-y-2 rounded-lg bg-muted/35 px-3.5 py-3">
            {view.memoryRows.map((row) => (
              <InspectorKeyValueRow key={row.label} label={row.label} value={row.value} />
            ))}
          </div>
        ) : (
          <InspectorEmptyState message={tStrict("testAi.noMemory")} />
        )}
      </InspectorSection>

      <InspectorSection title={tStrict("testAi.rulesApplied")}>
        <RulesAppliedList rules={view.rulesApplied} />
      </InspectorSection>

      <InspectorSection title={tStrict("testAi.suggestedActions")}>
        <SuggestedActionsList actions={view.suggestedActions} />
      </InspectorSection>

      <WarningsList warnings={view.warnings} />

      {improvementSuggestions ? (
        <PlaygroundImprovementSuggestionsSection suggestions={improvementSuggestions} />
      ) : null}
    </BusinessBrainInspector>
  );
}
