"use client";

import Link from "next/link";
import { useMemo, type ReactNode } from "react";
import { AlertTriangle, Brain, ExternalLink } from "lucide-react";

import {
  InspectorEmpty,
  InspectorBadge,
  InspectorRow,
} from "@/components/ui/inspector";
import type { InboxKey } from "@/lib/i18n/inbox-dictionary";
import type { OmnichannelConversationDetail } from "@/lib/omnichannel-inbox/queries";
import { useInboxTranslation } from "@/modules/inbox/hooks/use-inbox-translation";
import {
  buildAiThinking,
  type ThinkingKnowledgeSource,
} from "@/modules/inbox/lib/ai-thinking-engine";

type AiThinkingCardProps = {
  conversation: OmnichannelConversationDetail;
  showMissingContext?: boolean;
};

const CONFIDENCE_TONES = {
  high: "success",
  medium: "warning",
  low: "neutral",
} as const;

function formatSourceLabel(source: ThinkingKnowledgeSource, typeLabel: string) {
  if (source.type === "identity") return typeLabel;
  return `${typeLabel}: ${source.name}`;
}

export function AiThinkingCard({
  conversation,
  showMissingContext = true,
}: AiThinkingCardProps) {
  const { ti, locale } = useInboxTranslation();

  const thinking = useMemo(
    () => buildAiThinking({ conversation, locale }),
    [conversation, locale],
  );

  if (!thinking.available) {
    return (
      <InspectorEmpty
        icon={Brain}
        title={ti("thinkingEmptyTitle")}
        description={ti("thinkingEmptyDesc")}
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end">
        <InspectorBadge tone={CONFIDENCE_TONES[thinking.confidenceLevel]}>
          {thinking.confidence}% · {ti(thinking.confidenceLabelKey)}
        </InspectorBadge>
      </div>

      <div className="space-y-2">
        <InspectorRow label={ti("detectedIntent")} value={ti(thinking.intentKey)} />

        <div>
          <p className="text-[13px] text-muted-foreground">{ti("whyThisSuggestion")}</p>
          <ul className="mt-1 space-y-1 text-sm font-medium text-foreground">
            {thinking.whyBullets.map((key) => (
              <li key={key}>{ti(key)}</li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-[13px] text-muted-foreground">{ti("knowledgeUsed")}</p>
          {thinking.knowledgeSources.length > 0 ? (
            <div className="mt-1 flex flex-wrap gap-2">
              {thinking.knowledgeSources.map((source) => (
                <SourceLink key={`${source.type}-${source.name}`} source={source} ti={ti} />
              ))}
            </div>
          ) : (
            <p className="mt-1 text-sm font-medium text-muted-foreground">
              {ti("noKnowledgeUsed")}
            </p>
          )}
        </div>

        <div>
          <p className="text-[13px] text-muted-foreground">{ti("rulesApplied")}</p>
          {thinking.rulesApplied.length > 0 ? (
            <ul className="mt-1 space-y-1 text-sm font-medium text-foreground">
              {thinking.rulesApplied.map((rule, index) => (
                <li key={rule.rawLabel ?? rule.labelKey ?? index}>
                  {rule.rawLabel ?? (rule.labelKey ? ti(rule.labelKey) : "")}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-sm font-medium text-muted-foreground">
              {ti("noRulesApplied")}
            </p>
          )}
        </div>
      </div>

      {showMissingContext && thinking.missingContext.length > 0 ? (
        <div className="rounded-md bg-amber-500/10 px-3 py-2">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 stroke-[1.75] text-amber-700 dark:text-amber-300" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-amber-950 dark:text-amber-100">
                {ti("missingKnowledge")}
              </p>
              <ul className="mt-2 space-y-1.5">
                {thinking.missingContext.map((item) => (
                  <li
                    key={item.labelKey}
                    className="flex items-center justify-between gap-2 text-[13px] text-amber-900 dark:text-amber-100"
                  >
                    <span>{ti(item.labelKey)}</span>
                    <Link
                      href={item.href}
                      className="inline-flex shrink-0 items-center gap-0.5 text-xs font-medium text-primary hover:underline"
                    >
                      {ti("createKnowledge")}
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SourceLink({
  source,
  ti,
}: {
  source: ThinkingKnowledgeSource;
  ti: (key: InboxKey) => string;
}) {
  const typeLabel = ti(source.typeLabelKey);
  const label = formatSourceLabel(source, typeLabel);

  return (
    <Link
      href={source.href}
      className="inline-flex items-center gap-1 text-xs font-medium text-foreground transition-colors hover:text-primary"
    >
      {label}
      <ExternalLink className="h-3 w-3 opacity-60" />
    </Link>
  );
}
