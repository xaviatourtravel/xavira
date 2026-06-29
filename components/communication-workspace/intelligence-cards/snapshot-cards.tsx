"use client";

import { memo, useState } from "react";
import { Check, Copy, Zap } from "lucide-react";

import {
  IntelligenceEmpty,
  IntelligenceField,
  IntelligenceMetric,
  IntelligencePreviewBadge,
  IntelligenceSection,
  IntelligenceSurface,
} from "@/components/communication-workspace/primitives";
import { TimelineSection } from "@/components/communication-workspace/sections/timeline-section";
import { formatWorkspaceCurrency } from "@/lib/communication-workspace/map-conversation";
import type { WorkspaceTimelineEntry } from "@/lib/communication-workspace/types";
import type { IntelligenceSnapshot } from "@/lib/intelligence/types/snapshot";
import type { IntelligenceUiCardType } from "@/lib/intelligence/ui/card-registry";
import type { ExtractedEntityField } from "@/lib/intelligence/entities/types";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const EDITABLE_ENTITY_FIELDS: ExtractedEntityField[] = [
  "name",
  "destination",
  "departure",
  "pax",
  "budget",
  "city",
];

type SnapshotCardProps = {
  snapshot: IntelligenceSnapshot;
  timeline: WorkspaceTimelineEntry[];
  editedFields: Record<string, string>;
  onFieldChange: (field: ExtractedEntityField, value: string) => void;
};

function snapshotIsReady(snapshot: IntelligenceSnapshot) {
  return snapshot.state === "ready";
}

export const AiSummaryCard = memo(function AiSummaryCard({
  snapshot,
}: Pick<SnapshotCardProps, "snapshot">) {
  const ready = snapshotIsReady(snapshot);

  return (
    <IntelligenceSection
      title="AI Summary"
      badge={ready ? <IntelligencePreviewBadge /> : null}
    >
      {!ready || !snapshot.summary ? (
        <IntelligenceEmpty>
          Reasoning layer will summarize customer intent once messages arrive.
        </IntelligenceEmpty>
      ) : (
        <IntelligenceSurface className="p-4">
          <p className="text-xs leading-[1.65] text-foreground/90">
            {snapshot.summary}
          </p>
        </IntelligenceSurface>
      )}
    </IntelligenceSection>
  );
});

export const ExtractedInformationCard = memo(function ExtractedInformationCard({
  snapshot,
  editedFields,
  onFieldChange,
}: SnapshotCardProps) {
  const ready = snapshotIsReady(snapshot);
  const displayFields = snapshot.entities.fields.filter((field) =>
    EDITABLE_ENTITY_FIELDS.includes(field.field),
  );

  return (
    <IntelligenceSection
      title="Extracted Information"
      badge={ready ? <IntelligencePreviewBadge /> : null}
    >
      {!ready ? (
        <IntelligenceEmpty>
          Entities extracted from conversation will populate automatically.
        </IntelligenceEmpty>
      ) : (
        <IntelligenceSurface className="grid gap-3 p-4">
          {displayFields.map((field) => (
            <IntelligenceField
              key={field.field}
              label={field.label}
              value={editedFields[field.field] ?? field.value ?? ""}
              placeholder="Not detected"
              type={
                field.field === "departure"
                  ? "date"
                  : field.field === "pax" || field.field === "budget"
                    ? "number"
                    : "text"
              }
              onChange={(value) => onFieldChange(field.field, value)}
            />
          ))}
        </IntelligenceSurface>
      )}
    </IntelligenceSection>
  );
});

export const LeadScoreCard = memo(function LeadScoreCard({
  snapshot,
}: Pick<SnapshotCardProps, "snapshot">) {
  const ready = snapshotIsReady(snapshot);
  const score =
    snapshot.scores.leadScore != null ? String(snapshot.scores.leadScore) : null;

  return (
    <IntelligenceSection
      title="Lead Score"
      badge={ready ? <IntelligencePreviewBadge /> : null}
    >
      {!ready ? (
        <IntelligenceEmpty>
          Composite score from intent, emotion, and engagement signals.
        </IntelligenceEmpty>
      ) : (
        <IntelligenceMetric
          label="Score"
          value={score}
          sublabel={snapshot.scores.leadScoreLabel}
          accent="score"
        />
      )}
    </IntelligenceSection>
  );
});

export const RevenuePotentialCard = memo(function RevenuePotentialCard({
  snapshot,
}: Pick<SnapshotCardProps, "snapshot">) {
  const ready = snapshotIsReady(snapshot);
  const revenue = formatWorkspaceCurrency(snapshot.scores.revenuePotentialIdr);

  return (
    <IntelligenceSection
      title="Revenue Potential"
      badge={ready ? <IntelligencePreviewBadge /> : null}
    >
      {!ready ? (
        <IntelligenceEmpty>
          Estimated deal value from budget signals and package fit.
        </IntelligenceEmpty>
      ) : (
        <IntelligenceMetric label="Est. value" value={revenue} accent="revenue" />
      )}
    </IntelligenceSection>
  );
});

export const EmotionCard = memo(function EmotionCard({
  snapshot,
}: Pick<SnapshotCardProps, "snapshot">) {
  const ready = snapshotIsReady(snapshot);

  return (
    <IntelligenceSection
      title="Emotion"
      badge={ready ? <IntelligencePreviewBadge /> : null}
    >
      {!ready || !snapshot.emotion ? (
        <IntelligenceEmpty>
          Emotional tone and urgency detected from message patterns.
        </IntelligenceEmpty>
      ) : (
        <IntelligenceSurface className="space-y-2 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold tracking-tight">
              {snapshot.emotion.label}
            </p>
            <span className="rounded-md bg-neutral-100 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
              {snapshot.emotion.confidence} confidence
            </span>
          </div>
          {snapshot.emotion.indicators.length > 0 ? (
            <ul className="space-y-1">
              {snapshot.emotion.indicators.map((indicator) => (
                <li
                  key={indicator}
                  className="text-[11px] leading-relaxed text-muted-foreground"
                >
                  · {indicator}
                </li>
              ))}
            </ul>
          ) : null}
        </IntelligenceSurface>
      )}
    </IntelligenceSection>
  );
});

export const IntentCard = memo(function IntentCard({
  snapshot,
}: Pick<SnapshotCardProps, "snapshot">) {
  const ready = snapshotIsReady(snapshot);

  return (
    <IntelligenceSection
      title="Intent"
      badge={ready ? <IntelligencePreviewBadge /> : null}
    >
      {!ready || !snapshot.intent ? (
        <IntelligenceEmpty>
          Primary customer intent classified from conversation context.
        </IntelligenceEmpty>
      ) : (
        <IntelligenceSurface className="space-y-2 p-4">
          <p className="text-sm font-semibold tracking-tight">
            {snapshot.intent.label}
          </p>
          {snapshot.intent.rationale ? (
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              {snapshot.intent.rationale}
            </p>
          ) : null}
        </IntelligenceSurface>
      )}
    </IntelligenceSection>
  );
});

export const RecommendationCard = memo(function RecommendationCard({
  snapshot,
}: Pick<SnapshotCardProps, "snapshot">) {
  const ready = snapshotIsReady(snapshot);
  const [copied, setCopied] = useState(false);
  const reply = snapshot.recommendation.items.find(
    (item) => item.action === "suggested_reply",
  );

  async function handleCopy() {
    if (!reply?.content) {
      return;
    }
    await navigator.clipboard.writeText(reply.content);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <IntelligenceSection
      title="Recommendation"
      badge={ready ? <IntelligencePreviewBadge /> : null}
    >
      {!ready || snapshot.recommendation.items.length === 0 ? (
        <IntelligenceEmpty>
          Next-best actions ranked by the reasoning engine.
        </IntelligenceEmpty>
      ) : (
        <div className="space-y-2">
          {snapshot.recommendation.items.map((item) => (
            <IntelligenceSurface key={item.action} className="p-3">
              <div className="flex items-start gap-2">
                {item.priority === "primary" ? (
                  <Zap className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                ) : null}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-foreground">
                    {item.label}
                  </p>
                  {item.content ? (
                    <p className="mt-1 whitespace-pre-wrap text-[11px] leading-relaxed text-muted-foreground">
                      {item.content}
                    </p>
                  ) : null}
                </div>
              </div>
            </IntelligenceSurface>
          ))}
          {reply?.content ? (
            <button
              type="button"
              onClick={handleCopy}
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "h-8 gap-1.5 text-xs text-muted-foreground",
              )}
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  Copied reply
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  Copy suggested reply
                </>
              )}
            </button>
          ) : null}
        </div>
      )}
    </IntelligenceSection>
  );
});

export const MemoryCard = memo(function MemoryCard({
  snapshot,
}: Pick<SnapshotCardProps, "snapshot">) {
  const ready = snapshotIsReady(snapshot);

  return (
    <IntelligenceSection
      title="Memory"
      badge={ready ? <IntelligencePreviewBadge /> : null}
    >
      {!ready || snapshot.memory.slices.length === 0 ? (
        <IntelligenceEmpty>
          Persistent customer memory — identity, preferences, objections, history.
        </IntelligenceEmpty>
      ) : (
        <div className="space-y-2">
          {snapshot.memory.slices.map((slice) => (
            <IntelligenceSurface key={slice.dimension} className="p-3">
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                {slice.label}
              </p>
              {slice.content ? (
                <p className="mt-1 text-xs leading-relaxed text-foreground/90">
                  {slice.content}
                </p>
              ) : (
                <p className="mt-1 text-xs italic text-muted-foreground/70">
                  No signal yet
                </p>
              )}
            </IntelligenceSurface>
          ))}
        </div>
      )}
    </IntelligenceSection>
  );
});

export const TimelineCard = memo(function TimelineCard({
  timeline,
}: {
  timeline: WorkspaceTimelineEntry[];
}) {
  return <TimelineSection timeline={timeline} />;
});

type IntelligenceCardRendererProps = SnapshotCardProps & {
  cardType: IntelligenceUiCardType;
};

export const IntelligenceCardRenderer = memo(function IntelligenceCardRenderer({
  cardType,
  snapshot,
  timeline,
  editedFields,
  onFieldChange,
}: IntelligenceCardRendererProps) {
  switch (cardType) {
    case "ai_summary":
      return <AiSummaryCard snapshot={snapshot} />;
    case "extracted_information":
      return (
        <ExtractedInformationCard
          snapshot={snapshot}
          timeline={timeline}
          editedFields={editedFields}
          onFieldChange={onFieldChange}
        />
      );
    case "lead_score":
      return <LeadScoreCard snapshot={snapshot} />;
    case "revenue_potential":
      return <RevenuePotentialCard snapshot={snapshot} />;
    case "emotion":
      return <EmotionCard snapshot={snapshot} />;
    case "intent":
      return <IntentCard snapshot={snapshot} />;
    case "recommendation":
      return <RecommendationCard snapshot={snapshot} />;
    case "memory":
      return <MemoryCard snapshot={snapshot} />;
    case "timeline":
      return <TimelineCard timeline={timeline} />;
    default:
      return null;
  }
});
